import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Share,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Header, Card, Badge, Button, AvatarStack, Input } from '../components/common';
import { Colors } from '../theme/colors';
import { circleApi } from '../api';
import { useAuthStore } from '../stores';
import { Circle, JastipSession } from '../types';
import { useAlert } from '../context/AlertContext';
import { ChevronRight, Copy } from 'lucide-react-native';

type CircleDetailRouteProp = RouteProp<RootStackParamList, 'CircleDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CircleDetail'>;

type MainTab = 'SESSIONS' | 'MEMBERS' | 'SETTINGS';
type SessionFilter = 'ALL' | 'ACTIVE' | 'COMPLETED';

export const CircleDetailScreen: React.FC = () => {
  const route = useRoute<CircleDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const currentUser = useAuthStore((state) => state.currentUser);
  const { showInfo, showConfirm, showError, showWarning } = useAlert();

  const { circleId, circleName } = route.params;

  const [circle, setCircle] = useState<Circle | null>(null);
  const [sessions, setSessions] = useState<JastipSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit Name State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<MainTab>('SESSIONS');
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  const loadCircleData = useCallback(async () => {
    try {
      setRefreshing(true);
      const circleData = await circleApi.getCircleById(circleId, currentUser?.id);
      setCircle(circleData);
      setSessions(circleData.sessions || []);
    } catch (err) {
      console.warn('Error loading circle:', err);
    } finally {
      setRefreshing(false);
    }
  }, [circleId, currentUser?.id]);

  useFocusEffect(
    useCallback(() => {
      loadCircleData();
    }, [loadCircleData])
  );

  const currentMember = circle?.members?.find((m) => m.userId === currentUser?.id);
  const isOwner = currentMember?.role === 'OWNER';

  const activeSessionsCount = useMemo(
    () => sessions.filter((s) => s.status === 'OPEN' || s.status === 'LOCKED').length,
    [sessions]
  );

  const completedSessionsCount = useMemo(
    () => sessions.filter((s) => s.status === 'COMPLETED').length,
    [sessions]
  );

  // Filtered Sessions for FlatList
  const filteredSessions = useMemo(() => {
    let list = sessions;
    if (sessionFilter === 'ACTIVE') {
      list = list.filter((s) => s.status === 'OPEN' || s.status === 'LOCKED');
    } else if (sessionFilter === 'COMPLETED') {
      list = list.filter((s) => s.status === 'COMPLETED');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.lokasi?.toLowerCase().includes(q) ||
          s.creator?.nama?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [sessions, sessionFilter, searchQuery]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    const list = circle?.members || [];
    if (!memberSearchQuery.trim()) return list;
    const q = memberSearchQuery.toLowerCase().trim();
    return list.filter(
      (m) =>
        m.user?.nama?.toLowerCase().includes(q) ||
        m.user?.no_whatsapp?.toLowerCase().includes(q)
    );
  }, [circle?.members, memberSearchQuery]);

  const handleShareOrCopy = async () => {
    const code = circle?.kode_join;
    if (!code) return;

    try {
      await Share.share({
        message: `Gabung ke Sirkel "${circle.nama_sirkel}" di PayTungan!\nKode Join: ${code}`,
        title: `Kode Join: ${code}`,
      });
    } catch {
      showInfo(
        'Kode Join Sirkel',
        `Kode Sirkel kamu: ${code}\n(Tekan lama pada teks kode untuk menyalin)`
      );
    }
  };

  const handleSaveCircleName = async () => {
    if (!currentUser?.id) return;
    if (!editName.trim() || editName.trim().length < 2) {
      showWarning('Nama Sirkel Terlalu Pendek', 'Nama sirkel minimal 2 karakter.');
      return;
    }

    try {
      setSavingName(true);
      const updated = await circleApi.updateCircle(circleId, currentUser.id, editName.trim());
      setCircle(updated);
      setEditModalVisible(false);
      showInfo('Berhasil', 'Nama sirkel berhasil diperbarui.');
    } catch (err: unknown) {
      showError('Gagal Memperbarui Nama', err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSavingName(false);
    }
  };

  const handleDeleteCircle = () => {
    if (!currentUser?.id) return;
    showConfirm(
      'Hapus Sirkel Ini?',
      `Apakah kamu yakin ingin menghapus sirkel "${circle?.nama_sirkel || circleName}"? Seluruh riwayat jastip dan anggota di dalamnya akan dihapus permanen.`,
      async () => {
        try {
          setDeleting(true);
          await circleApi.deleteCircle(circleId, currentUser.id);
          navigation.goBack();
        } catch (err: unknown) {
          showError('Gagal Menghapus Sirkel', err instanceof Error ? err.message : 'Terjadi kesalahan');
        } finally {
          setDeleting(false);
        }
      },
      undefined,
      'Hapus Sirkel',
      'Batal',
      true
    );
  };

  const handleLeaveCircle = () => {
    if (!currentUser?.id) return;
    showConfirm(
      'Keluar dari Sirkel?',
      `Apakah kamu yakin ingin keluar dari sirkel "${circle?.nama_sirkel || circleName}"?`,
      async () => {
        try {
          setDeleting(true);
          await circleApi.removeMember(circleId, currentUser.id, currentUser.id);
          navigation.goBack();
        } catch (err: unknown) {
          showError('Gagal Keluar Sirkel', err instanceof Error ? err.message : 'Terjadi kesalahan');
        } finally {
          setDeleting(false);
        }
      },
      undefined,
      'Keluar Sirkel',
      'Batal',
      true
    );
  };

  const handleKickMember = (targetUserId: number, targetName: string) => {
    if (!currentUser?.id) return;
    showConfirm(
      'Keluarkan Anggota?',
      `Apakah kamu yakin ingin mengeluarkan "${targetName}" dari sirkel ini?`,
      async () => {
        try {
          await circleApi.removeMember(circleId, targetUserId, currentUser.id);
          loadCircleData();
        } catch (err: unknown) {
          showError('Gagal Mengeluarkan Anggota', err instanceof Error ? err.message : 'Terjadi kesalahan');
        }
      },
      undefined,
      'Keluarkan',
      'Batal',
      true
    );
  };

  const formatSessionTime = (dateStr?: string | Date) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const displayCode = circle?.kode_join || '...';

  // Render Item for Sessions FlatList
  const renderSessionItem = ({ item: session }: { item: JastipSession }) => {
    const isBuyer = session.creatorId === currentUser?.id;
    const itemCount = session.items?.length || 0;
    const totalSpending =
      session.items?.reduce((acc, item) => acc + (item.harga_final || 0), 0) || 0;
    const isExpired = !!session.waktu_tutup && new Date(session.waktu_tutup).getTime() < Date.now();
    const isOpen = session.status === 'OPEN';
    const isLocked = session.status === 'LOCKED';

    return (
      <Card
        key={session.id}
        style={styles.sessionCard}
        onPress={() =>
          navigation.navigate('JastipSession', {
            sessionId: session.id,
            lokasi: session.lokasi,
          })
        }
      >
        <View style={styles.sessionCardHeader}>
          <View style={styles.sessionLocationInfo}>
            <Text style={styles.sessionLocation} numberOfLines={1}>
              {session.lokasi}
            </Text>
            <Text style={styles.sessionDate}>
              {formatSessionTime(session.createdAt)}
            </Text>
          </View>
          <Badge status={session.status} />
        </View>

        <View style={styles.sessionMetaRow}>
          <View style={[styles.buyerPill, isBuyer && styles.buyerPillSelf]}>
            <Text
              style={[styles.buyerPillText, isBuyer && styles.buyerPillTextSelf]}
              numberOfLines={1}
            >
              Yang Jajan: {session.creator?.nama}{isBuyer ? ' (Kamu)' : ''}
            </Text>
          </View>
          <View style={styles.feePill}>
            <Text style={styles.feePillText}>
              Jastip: Rp {(session.tarif_jastip || 0).toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        <View style={styles.sessionStatsBar}>
          <View style={styles.sessionStatsLeft}>
            <AvatarStack
              users={[
                { name: session.creator?.nama },
                ...(session.items?.map((i) => ({ name: i.user?.nama })) || []),
              ]}
              maxDisplay={3}
              size={24}
            />
            <Text style={styles.itemCountLabel}>
              {itemCount > 0 ? `${itemCount} barang dititip` : '0 barang'}
            </Text>
          </View>

          <Text style={styles.spendingText}>
            {totalSpending > 0
              ? `Rp ${totalSpending.toLocaleString('id-ID')}`
              : isOpen
                ? isExpired
                  ? 'Waktu titip habis'
                  : 'Masih bisa nitip nih'
                : 'Menunggu struk'}
          </Text>
        </View>

        <View style={styles.sessionCardFooter}>
          <Text style={styles.actionLinkLabel}>
            {isOpen
              ? isBuyer
                ? isExpired
                  ? 'Kunci Keranjang (Waktu Habis)'
                  : 'Kelola Keranjang Belanja'
                : isExpired
                  ? 'Waktu Habis (Lihat Titipan)'
                  : '+ Titip Barang Sekarang'
              : isLocked
                ? isBuyer
                  ? 'Input Harga Struk Kasir'
                  : 'Lihat Status Belanjaan'
                : 'Lihat Rekap Split Bill'}
          </Text>
          <ChevronRight size={14} color={Colors.primary} />
        </View>

      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={circle?.nama_sirkel || circleName}
        subtitle="Sirkel Belanja & Jastip"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.headerNewBtn}
            onPress={() =>
              navigation.navigate('CreateSession', {
                circleId,
                circleName: circle?.nama_sirkel || circleName,
              })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.headerNewBtnText}>+ Jastip</Text>
          </TouchableOpacity>
        }
      />

      {/* Circle Info Strip Header (Compact) */}
      <View style={styles.topInfoBar}>
        <View style={styles.topInfoLeft}>
          <View style={styles.avatarIconBox}>
            <Text style={styles.avatarIconEmoji}>👥</Text>
          </View>
          <View style={styles.topInfoTexts}>
            <Text style={styles.circleNameTitle} numberOfLines={1}>
              {circle?.nama_sirkel || circleName}
            </Text>
            <View style={styles.subInfoRow}>
              <Text style={styles.roleLabel}>
                {isOwner ? 'Owner' : 'Anggota'}
              </Text>
              <Text style={styles.dotDivider}>•</Text>
              <Text style={styles.membersCountLabel}>
                {circle?.members?.length || 1} Anggota
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.codePill}
          onPress={handleShareOrCopy}
          activeOpacity={0.7}
        >
          <Text style={styles.codePillText}>{displayCode}</Text>
          <Copy size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Main Segmented Tabs Switcher */}
      <View style={styles.segmentedTabBar}>
        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'SESSIONS' && styles.segmentTabActive]}
          onPress={() => setActiveTab('SESSIONS')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentTabText,
              activeTab === 'SESSIONS' && styles.segmentTabTextActive,
            ]}
          >
            Sesi Jastip ({sessions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'MEMBERS' && styles.segmentTabActive]}
          onPress={() => setActiveTab('MEMBERS')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentTabText,
              activeTab === 'MEMBERS' && styles.segmentTabTextActive,
            ]}
          >
            Anggota ({circle?.members?.length || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'SETTINGS' && styles.segmentTabActive]}
          onPress={() => setActiveTab('SETTINGS')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentTabText,
              activeTab === 'SETTINGS' && styles.segmentTabTextActive,
            ]}
          >
            Pengaturan
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: SESSIONS (Virtualized High Performance List) */}
      {activeTab === 'SESSIONS' && (
        <View style={styles.tabContentContainer}>
          {/* Sub Filters & Search */}
          <View style={styles.filterSection}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Cari toko / lokasi belanja..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.filterChipsRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  sessionFilter === 'ALL' && styles.filterChipActive,
                ]}
                onPress={() => setSessionFilter('ALL')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    sessionFilter === 'ALL' && styles.filterChipTextActive,
                  ]}
                >
                  Semua ({sessions.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  sessionFilter === 'ACTIVE' && styles.filterChipActive,
                ]}
                onPress={() => setSessionFilter('ACTIVE')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    sessionFilter === 'ACTIVE' && styles.filterChipTextActive,
                  ]}
                >
                  Aktif ({activeSessionsCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  sessionFilter === 'COMPLETED' && styles.filterChipActive,
                ]}
                onPress={() => setSessionFilter('COMPLETED')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    sessionFilter === 'COMPLETED' && styles.filterChipTextActive,
                  ]}
                >
                  Selesai ({completedSessionsCount})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Virtualized Sessions FlatList */}
          <FlatList
            data={filteredSessions}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderSessionItem}
            contentContainerStyle={styles.listPadding}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={loadCircleData} />
            }
            ListEmptyComponent={
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  {sessionFilter === 'ACTIVE'
                    ? 'Tidak Ada Sesi Jastip Aktif'
                    : sessionFilter === 'COMPLETED'
                      ? 'Belum Ada Sesi yang Selesai'
                      : searchQuery
                        ? 'Tidak Ditemukan Sesi yang Cocok'
                        : 'Belum Ada Sesi Jastip'}
                </Text>
                <Text style={styles.emptyText}>
                  {sessionFilter === 'ACTIVE'
                    ? 'Saat ini belum ada yang membuka sesi belanja di sirkel ini.'
                    : 'Tekan tombol "+ Jastip" di atas untuk membuka sesi belanja baru!'}
                </Text>
                {sessionFilter !== 'COMPLETED' && (
                  <Button
                    title="Buka Sesi Jastip Baru"
                    size="sm"
                    variant="primary"
                    onPress={() =>
                      navigation.navigate('CreateSession', {
                        circleId,
                        circleName: circle?.nama_sirkel || circleName,
                      })
                    }
                    style={styles.emptyCtaBtn}
                  />
                )}
              </Card>
            }
          />
        </View>
      )}

      {/* TAB 2: MEMBERS */}
      {activeTab === 'MEMBERS' && (
        <View style={styles.tabContentContainer}>
          <View style={styles.filterSection}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama atau nomor WhatsApp..."
                placeholderTextColor={Colors.textMuted}
                value={memberSearchQuery}
                onChangeText={setMemberSearchQuery}
              />
              {memberSearchQuery ? (
                <TouchableOpacity onPress={() => setMemberSearchQuery('')}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <FlatList
            data={filteredMembers}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listPadding}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={loadCircleData} />
            }
            renderItem={({ item: member, index }) => {
              const isMe = member.userId === currentUser?.id;
              const isMemberOwner = member.role === 'OWNER';

              return (
                <View
                  style={[
                    styles.memberCardItem,
                    index === 0 && styles.memberCardFirst,
                    index === filteredMembers.length - 1 && styles.memberCardLast,
                  ]}
                >
                  <View style={styles.memberLeft}>
                    <View
                      style={[
                        styles.memberAvatar,
                        isMemberOwner && styles.memberAvatarOwner,
                      ]}
                    >
                      <Text
                        style={[
                          styles.memberAvatarText,
                          isMemberOwner && styles.memberAvatarTextOwner,
                        ]}
                      >
                        {member.user?.nama?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.memberTextInfo}>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {member.user?.nama || 'User'}
                        {isMe ? ' (Kamu)' : ''}
                      </Text>
                      <Text style={styles.memberPhone}>{member.user?.no_whatsapp}</Text>
                    </View>
                  </View>

                  <View style={styles.memberRightActions}>
                    <View
                      style={[
                        styles.roleBadge,
                        isMemberOwner && styles.roleBadgeOwner,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleText,
                          isMemberOwner && styles.roleTextOwner,
                        ]}
                      >
                        {isMemberOwner ? 'OWNER' : 'ANGGOTA'}
                      </Text>
                    </View>

                    {/* Owner can kick other members */}
                    {isOwner && !isMemberOwner && (
                      <TouchableOpacity
                        style={styles.kickMemberBtn}
                        onPress={() =>
                          handleKickMember(
                            member.userId,
                            member.user?.nama || 'Anggota'
                          )
                        }
                        activeOpacity={0.7}
                      >
                        <Text style={styles.kickMemberText}>Hapus</Text>
                      </TouchableOpacity>
                    )}

                    {/* Non-owner can leave circle */}
                    {!isOwner && isMe && (
                      <TouchableOpacity
                        style={styles.leaveMemberBtn}
                        onPress={handleLeaveCircle}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.leaveMemberText}>Keluar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {/* TAB 3: SETTINGS & DANGER ZONE */}
      {activeTab === 'SETTINGS' && (
        <ScrollView
          contentContainerStyle={styles.settingsScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Circle Summary Card */}
          <Card style={styles.settingsCard}>
            <Text style={styles.settingsHeading}>Informasi Sirkel</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoRowLabel}>Nama Sirkel</Text>
              <View style={styles.infoRowValWithAction}>
                <Text style={styles.infoRowVal}>{circle?.nama_sirkel || circleName}</Text>
                {isOwner && (
                  <TouchableOpacity
                    style={styles.editNameBtn}
                    onPress={() => {
                      setEditName(circle?.nama_sirkel || circleName);
                      setEditModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editNameText}>Ubah</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoRowLabel}>Kode Join Sirkel</Text>
              <Text style={styles.infoRowVal}>{displayCode}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoRowLabel}>Peran Kamu</Text>
              <Text style={styles.infoRowVal}>
                {isOwner ? 'Pembuat Sirkel (Owner)' : 'Anggota Sirkel'}
              </Text>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoRowLabel}>Total Riwayat Belanja</Text>
              <Text style={styles.infoRowVal}>{sessions.length} sesi</Text>
            </View>
          </Card>

          {/* Share Action */}
          <Button
            title="Bagikan Kode Join Sirkel"
            variant="secondary"
            size="md"
            onPress={handleShareOrCopy}
            style={styles.shareCodeBtn}
          />

          {/* Danger Zone */}
          <View style={styles.dangerBox}>
            <Text style={styles.dangerTitle}>Zona Bahaya</Text>
            <Text style={styles.dangerSub}>
              {isOwner
                ? 'Menghapus sirkel akan melenyapkan semua riwayat jastip dan mengeluarkan seluruh anggota secara permanen.'
                : 'Keluar dari sirkel ini akan menghentikan akses Anda ke belanjaan bersama sirkel ini.'}
            </Text>
            {isOwner ? (
              <Button
                title="Hapus Sirkel Ini Secara Permanen"
                variant="secondary"
                loading={deleting}
                onPress={handleDeleteCircle}
                style={styles.deleteCircleBtn}
              />
            ) : (
              <Button
                title="Keluar dari Sirkel Ini"
                variant="secondary"
                loading={deleting}
                onPress={handleLeaveCircle}
                style={styles.leaveCircleBtn}
              />
            )}
          </View>
        </ScrollView>
      )}

      {/* Edit Circle Name Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ubah Nama Sirkel</Text>
            <Text style={styles.modalSub}>
              Masukkan nama baru untuk sirkel belanja ini.
            </Text>

            <Input
              label="Nama Sirkel"
              placeholder="Contoh: Kost Pintar, Anak IT 24"
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />

            <View style={styles.modalActions}>
              <Button
                title="Batal"
                variant="secondary"
                size="md"
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCancelBtn}
              />
              <Button
                title={savingName ? 'Menyimpan...' : 'Simpan'}
                variant="primary"
                size="md"
                loading={savingName}
                onPress={handleSaveCircleName}
                style={styles.modalSaveBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerNewBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  headerNewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  topInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  topInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarIconEmoji: {
    fontSize: 18,
  },
  topInfoTexts: {
    flex: 1,
  },
  circleNameTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  dotDivider: {
    marginHorizontal: 4,
    color: Colors.textMuted,
  },
  membersCountLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codePillLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    marginRight: 4,
  },
  codePillText: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1,
    marginRight: 4,
  },
  copyIcon: {
    fontSize: 12,
  },
  segmentedTabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentTabActive: {
    backgroundColor: Colors.primaryLight,
  },
  segmentTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentTabTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  tabContentContainer: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: Colors.background,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  clearSearchText: {
    fontSize: 13,
    color: Colors.textMuted,
    paddingHorizontal: 4,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: '#C7D2FE',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  listPadding: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 32,
  },
  sessionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionLocationInfo: {
    flex: 1,
    marginRight: 8,
  },
  sessionLocation: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sessionDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  buyerPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  buyerPillSelf: {
    backgroundColor: Colors.primaryLight,
  },
  buyerPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  buyerPillTextSelf: {
    color: Colors.primary,
    fontWeight: '700',
  },
  feePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  feePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  sessionStatsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  sessionStatsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemCountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  spendingText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sessionCardFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },

  actionLinkLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 17,
  },
  emptyCtaBtn: {
    marginTop: 14,
    borderRadius: 10,
  },
  memberCardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  memberCardFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  memberCardLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomWidth: 0,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberAvatarOwner: {
    backgroundColor: Colors.primaryLight,
  },
  memberAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  memberAvatarTextOwner: {
    color: Colors.primary,
  },
  memberTextInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  memberPhone: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  memberRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeOwner: {
    backgroundColor: '#FEF3C7',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  roleTextOwner: {
    color: '#92400E',
  },
  kickMemberBtn: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  kickMemberText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.danger,
  },
  leaveMemberBtn: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  leaveMemberText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  settingsScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  settingsHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoRowLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoRowVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  infoRowValWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editNameBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  editNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  shareCodeBtn: {
    marginBottom: 20,
  },
  dangerBox: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.danger,
    marginBottom: 4,
  },
  dangerSub: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 17,
    marginBottom: 14,
  },
  deleteCircleBtn: {
    borderColor: '#FECACA',
    backgroundColor: '#FEE2E2',
  },
  leaveCircleBtn: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    minWidth: 80,
  },
  modalSaveBtn: {
    minWidth: 100,
  },
});
