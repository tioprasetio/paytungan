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
import {
  RouteProp,
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import {
  Header,
  Card,
  Badge,
  Button,
  AvatarStack,
  Input,
} from '../components/common';
import { useThemeColors, ThemeColors } from '../theme/colors';
import { circleApi } from '../api';
import { useAuthStore } from '../stores';
import { Circle, JastipSession } from '../types';
import { useAlert } from '../context/AlertContext';
import {
  ChevronRight,
  Copy,
  Plus,
  Share2,
  ShoppingBag,
  Users,
  Search,
  X,
  MapPin,
  Clock,
  Crown,
  User,
  Trash2,
  LogOut,
  Edit3,
} from 'lucide-react-native';
import { LinearGradientView } from '../components/common/LinearGradientView';

type CircleDetailRouteProp = RouteProp<RootStackParamList, 'CircleDetail'>;
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CircleDetail'
>;

type MainTab = 'SESSIONS' | 'MEMBERS' | 'SETTINGS';
type SessionFilter = 'ALL' | 'ACTIVE' | 'COMPLETED';

export const CircleDetailScreen: React.FC = () => {
  const route = useRoute<CircleDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const currentUser = useAuthStore(state => state.currentUser);
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
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

  const loadCircleData = useCallback(
    async (isPullToRefresh = false) => {
      if (isPullToRefresh) {
        setRefreshing(true);
      }
      try {
        const circleData = await circleApi.getCircleById(
          circleId,
          currentUser?.id,
        );
        setCircle(circleData);
        setSessions(circleData.sessions || []);
      } catch (err) {
        console.warn('Error loading circle:', err);
      } finally {
        if (isPullToRefresh) {
          setRefreshing(false);
        }
      }
    },
    [circleId, currentUser?.id],
  );

  useFocusEffect(
    useCallback(() => {
      loadCircleData(false);
    }, [loadCircleData]),
  );

  const currentMember = circle?.members?.find(
    m => m.userId === currentUser?.id,
  );
  const isOwner = currentMember?.role === 'OWNER';

  const activeSessionsCount = useMemo(
    () =>
      sessions.filter(s => s.status === 'OPEN' || s.status === 'LOCKED').length,
    [sessions],
  );

  const completedSessionsCount = useMemo(
    () => sessions.filter(s => s.status === 'COMPLETED').length,
    [sessions],
  );

  // Filtered Sessions for FlatList
  const filteredSessions = useMemo(() => {
    let list = sessions;
    if (sessionFilter === 'ACTIVE') {
      list = list.filter(s => s.status === 'OPEN' || s.status === 'LOCKED');
    } else if (sessionFilter === 'COMPLETED') {
      list = list.filter(s => s.status === 'COMPLETED');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        s =>
          s.lokasi?.toLowerCase().includes(q) ||
          s.creator?.nama?.toLowerCase().includes(q),
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
      m =>
        m.user?.nama?.toLowerCase().includes(q) ||
        m.user?.no_whatsapp?.toLowerCase().includes(q),
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
        `Kode Sirkel kamu: ${code}\n(Tekan lama pada teks kode untuk menyalin)`,
      );
    }
  };

  const handleSaveCircleName = async () => {
    if (!currentUser?.id) return;
    if (!editName.trim() || editName.trim().length < 2) {
      showWarning(
        'Nama Sirkel Terlalu Pendek',
        'Nama sirkel minimal 2 karakter.',
      );
      return;
    }

    try {
      setSavingName(true);
      const updated = await circleApi.updateCircle(
        circleId,
        currentUser.id,
        editName.trim(),
      );
      setCircle(updated);
      setEditModalVisible(false);
      showInfo('Berhasil', 'Nama sirkel berhasil diperbarui.');
    } catch (err: unknown) {
      showError(
        'Gagal Memperbarui Nama',
        err instanceof Error ? err.message : 'Terjadi kesalahan',
      );
    } finally {
      setSavingName(false);
    }
  };

  const handleDeleteCircle = () => {
    if (!currentUser?.id) return;
    showConfirm(
      'Hapus Sirkel Ini?',
      `Apakah kamu yakin ingin menghapus sirkel "${
        circle?.nama_sirkel || circleName
      }"? Seluruh riwayat jastip dan anggota di dalamnya akan dihapus permanen.`,
      async () => {
        try {
          setDeleting(true);
          await circleApi.deleteCircle(circleId, currentUser.id);
          navigation.goBack();
        } catch (err: unknown) {
          showError(
            'Gagal Menghapus Sirkel',
            err instanceof Error ? err.message : 'Terjadi kesalahan',
          );
        } finally {
          setDeleting(false);
        }
      },
      undefined,
      'Hapus Sirkel',
      'Batal',
      true,
    );
  };

  const handleLeaveCircle = () => {
    if (!currentUser?.id) return;
    showConfirm(
      'Keluar dari Sirkel?',
      `Apakah kamu yakin ingin keluar dari sirkel "${
        circle?.nama_sirkel || circleName
      }"?`,
      async () => {
        try {
          setDeleting(true);
          await circleApi.removeMember(
            circleId,
            currentUser.id,
            currentUser.id,
          );
          navigation.goBack();
        } catch (err: unknown) {
          showError(
            'Gagal Keluar Sirkel',
            err instanceof Error ? err.message : 'Terjadi kesalahan',
          );
        } finally {
          setDeleting(false);
        }
      },
      undefined,
      'Keluar Sirkel',
      'Batal',
      true,
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
          showError(
            'Gagal Mengeluarkan Anggota',
            err instanceof Error ? err.message : 'Terjadi kesalahan',
          );
        }
      },
      undefined,
      'Keluarkan',
      'Batal',
      true,
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
      session.items?.reduce((acc, item) => acc + (item.harga_final || 0), 0) ||
      0;
    const isExpired =
      !!session.waktu_tutup &&
      new Date(session.waktu_tutup).getTime() < Date.now();
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
          <View style={styles.sessionLocationRow}>
            <View style={styles.locationIconBox}>
              <MapPin size={15} color={colors.primary} />
            </View>
            <View style={styles.sessionLocationInfo}>
              <Text style={styles.sessionLocation} numberOfLines={1}>
                {session.lokasi}
              </Text>
              <View style={styles.sessionDateRow}>
                <Clock size={11} color={colors.textMuted} />
                <Text style={styles.sessionDate}>
                  {formatSessionTime(session.createdAt)}
                </Text>
              </View>
            </View>
          </View>
          <Badge status={session.status} />
        </View>

        <View style={styles.sessionMetaRow}>
          <View style={[styles.buyerPill, isBuyer && styles.buyerPillSelf]}>
            <User
              size={12}
              color={isBuyer ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.buyerPillText,
                isBuyer && styles.buyerPillTextSelf,
              ]}
              numberOfLines={1}
            >
              {session.creator?.nama}
              {isBuyer ? ' (Kamu)' : ''}
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
                ...(session.items?.map(i => ({ name: i.user?.nama })) || []),
              ]}
              maxDisplay={3}
              size={22}
            />
            <Text style={styles.itemCountLabel}>
              {itemCount > 0 ? `${itemCount} titipan` : 'Belum ada titipan'}
            </Text>
          </View>

          <Text style={styles.spendingText}>
            {totalSpending > 0
              ? `Rp ${totalSpending.toLocaleString('id-ID')}`
              : isOpen
              ? isExpired
                ? 'Waktu titip habis'
                : 'Siap dititip'
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
                : 'Titip Barang Sekarang'
              : isLocked
              ? isBuyer
                ? 'Input Harga Struk Kasir'
                : 'Lihat Status Belanjaan'
              : 'Lihat Rekap Split Bill'}
          </Text>
          <ChevronRight size={14} color={colors.primary} />
        </View>
      </Card>
    );
  };

  return (
    <LinearGradientView colors={colors.bgGradient} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <Header
          title={circle?.nama_sirkel || circleName}
          onBack={() => navigation.goBack()}
          transparent
          rightAction={
            <TouchableOpacity
              style={styles.headerShareBtn}
              onPress={handleShareOrCopy}
              activeOpacity={0.7}
            >
              <Share2 size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          }
        />

        {/* Circle Info Strip Header (Compact & Crisp) */}
        <View style={styles.topInfoBar}>
          <View style={styles.topInfoLeft}>
            <View style={styles.avatarIconBox}>
              <Users size={18} color={colors.primary} />
            </View>
            <View style={styles.topInfoTexts}>
              <Text style={styles.circleNameTitle} numberOfLines={1}>
                {circle?.nama_sirkel || circleName}
              </Text>
              <View style={styles.subInfoRow}>
                <View
                  style={[
                    styles.roleBadgeMini,
                    isOwner && styles.roleBadgeMiniOwner,
                  ]}
                >
                  {isOwner && (
                    <Crown
                      size={10}
                      color="#92400E"
                      style={styles.crownMiniIcon}
                    />
                  )}
                  <Text
                    style={[styles.roleLabel, isOwner && styles.roleLabelOwner]}
                  >
                    {isOwner ? 'Owner' : 'Anggota'}
                  </Text>
                </View>
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
            <Copy size={13} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Command Dock (Replaces generic 50/50 buttons) */}
        <View style={styles.dockContainer}>
          <View style={styles.quickDock}>
            <TouchableOpacity
              style={styles.quickDockCardPrimary}
              onPress={() =>
                navigation.navigate('CreateSession', {
                  circleId,
                  circleName: circle?.nama_sirkel || circleName,
                })
              }
              activeOpacity={0.85}
            >
              <View style={styles.quickIconCircleWhite}>
                <ShoppingBag size={17} color={colors.primary} />
              </View>
              <View style={styles.quickDockInfo}>
                <Text style={styles.quickDockTitleLight}>Buka Jastip</Text>
                <Text style={styles.quickDockSubLight}>
                  Mulai sesi belanja baru
                </Text>
              </View>
              <Plus size={16} color="#FFFFFF" style={styles.dockArrowIcon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickDockCardSecondary}
              onPress={handleShareOrCopy}
              activeOpacity={0.85}
            >
              <View style={styles.quickIconCircleTint}>
                <Share2 size={16} color={colors.primary} />
              </View>
              <View style={styles.quickDockInfo}>
                <Text style={styles.quickDockTitleDark}>Undang Teman</Text>
                <Text style={styles.quickDockSubDark} numberOfLines={1}>
                  {displayCode} • Bagikan
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Segmented Tabs Switcher */}
        <View style={styles.segmentedTabBarWrapper}>
          <View style={styles.segmentedTabBar}>
            <TouchableOpacity
              style={[
                styles.segmentTab,
                activeTab === 'SESSIONS' && styles.segmentTabActive,
              ]}
              onPress={() => setActiveTab('SESSIONS')}
              activeOpacity={0.7}
            >
              <ShoppingBag
                size={13}
                color={
                  activeTab === 'SESSIONS' ? colors.primary : colors.textMuted
                }
                style={styles.tabIconSpacing}
              />
              <Text
                style={[
                  styles.segmentTabText,
                  activeTab === 'SESSIONS' && styles.segmentTabTextActive,
                ]}
              >
                Sesi ({sessions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentTab,
                activeTab === 'MEMBERS' && styles.segmentTabActive,
              ]}
              onPress={() => setActiveTab('MEMBERS')}
              activeOpacity={0.7}
            >
              <Users
                size={13}
                color={
                  activeTab === 'MEMBERS' ? colors.primary : colors.textMuted
                }
                style={styles.tabIconSpacing}
              />
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
              style={[
                styles.segmentTab,
                activeTab === 'SETTINGS' && styles.segmentTabActive,
              ]}
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
        </View>

        {/* TAB 1: SESSIONS */}
        {activeTab === 'SESSIONS' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.filterSection}>
              <View style={styles.searchBox}>
                <Search
                  size={15}
                  color={colors.textMuted}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari toko atau pembuat jastip..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={15} color={colors.textMuted} />
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
                      sessionFilter === 'COMPLETED' &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    Selesai ({completedSessionsCount})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={filteredSessions}
              keyExtractor={item => String(item.id)}
              renderItem={renderSessionItem}
              contentContainerStyle={styles.listPadding}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => loadCircleData(true)}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconCircle}>
                    <ShoppingBag size={24} color={colors.textMuted} />
                  </View>
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
                      : 'Buka sesi belanja baru agar anggota lain bisa menitip barang.'}
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
                </View>
              }
            />
          </View>
        )}

        {/* TAB 2: MEMBERS */}
        {activeTab === 'MEMBERS' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.filterSection}>
              <View style={styles.searchBox}>
                <Search
                  size={15}
                  color={colors.textMuted}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari nama atau nomor WhatsApp..."
                  placeholderTextColor={colors.textMuted}
                  value={memberSearchQuery}
                  onChangeText={setMemberSearchQuery}
                />
                {memberSearchQuery ? (
                  <TouchableOpacity
                    onPress={() => setMemberSearchQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={15} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <FlatList
              data={filteredMembers}
              keyExtractor={item => String(item.id)}
              contentContainerStyle={styles.listPadding}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => loadCircleData(true)}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
              renderItem={({ item: member, index }) => {
                const isMe = member.userId === currentUser?.id;
                const isMemberOwner = member.role === 'OWNER';

                return (
                  <View
                    style={[
                      styles.memberCardItem,
                      index === 0 && styles.memberCardFirst,
                      index === filteredMembers.length - 1 &&
                        styles.memberCardLast,
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
                        <Text style={styles.memberPhone}>
                          {member.user?.no_whatsapp}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.memberRightActions}>
                      <View
                        style={[
                          styles.roleBadge,
                          isMemberOwner && styles.roleBadgeOwner,
                        ]}
                      >
                        {isMemberOwner ? (
                          <Crown
                            size={11}
                            color="#92400E"
                            style={styles.roleIconMargin}
                          />
                        ) : (
                          <User
                            size={11}
                            color={colors.textSecondary}
                            style={styles.roleIconMargin}
                          />
                        )}
                        <Text
                          style={[
                            styles.roleText,
                            isMemberOwner && styles.roleTextOwner,
                          ]}
                        >
                          {isMemberOwner ? 'Owner' : 'Anggota'}
                        </Text>
                      </View>

                      {/* Owner can kick other members */}
                      {isOwner && !isMemberOwner && (
                        <TouchableOpacity
                          style={styles.kickMemberBtn}
                          onPress={() =>
                            handleKickMember(
                              member.userId,
                              member.user?.nama || 'Anggota',
                            )
                          }
                          activeOpacity={0.7}
                        >
                          <Trash2
                            size={12}
                            color={colors.danger}
                            style={styles.btnIconMargin}
                          />
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
                          <LogOut
                            size={12}
                            color={colors.textSecondary}
                            style={styles.btnIconMargin}
                          />
                          <Text style={styles.leaveMemberText}>Keluar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconCircle}>
                    <Users size={24} color={colors.textMuted} />
                  </View>
                  <Text style={styles.emptyTitle}>Anggota Tidak Ditemukan</Text>
                  <Text style={styles.emptyText}>
                    Tidak ada anggota yang cocok dengan kata kunci pencarian.
                  </Text>
                </View>
              }
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
                  <Text style={styles.infoRowVal}>
                    {circle?.nama_sirkel || circleName}
                  </Text>
                  {isOwner && (
                    <TouchableOpacity
                      style={styles.editNameBtn}
                      onPress={() => {
                        setEditName(circle?.nama_sirkel || circleName);
                        setEditModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Edit3
                        size={11}
                        color={colors.primary}
                        style={styles.btnIconMargin}
                      />
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

            {/* Share Action Button */}
            <TouchableOpacity
              style={styles.shareCodeActionBtn}
              onPress={handleShareOrCopy}
              activeOpacity={0.75}
            >
              <Share2
                size={16}
                color={colors.primary}
                style={styles.btnIconMargin}
              />
              <Text style={styles.shareCodeActionText}>
                Bagikan Kode Join Sirkel
              </Text>
            </TouchableOpacity>

            {/* Danger Zone */}
            <View style={styles.dangerBox}>
              <Text style={styles.dangerTitle}>Perhatian!</Text>
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
                  textStyle={{ color: colors.danger, fontWeight: '700' }}
                />
              ) : (
                <Button
                  title="Keluar dari Sirkel Ini"
                  variant="secondary"
                  loading={deleting}
                  onPress={handleLeaveCircle}
                  style={styles.leaveCircleBtn}
                  textStyle={{ color: colors.danger, fontWeight: '700' }}
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
    </LinearGradientView>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    headerShareBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surfaceSubtle,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    topInfoBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'transparent',
      paddingHorizontal: 16,
      paddingVertical: 12,
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
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    topInfoTexts: {
      flex: 1,
    },
    circleNameTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    subInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
    },
    roleBadgeMini: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 5,
    },
    roleBadgeMiniOwner: {
      backgroundColor: '#FEF3C7',
    },
    crownMiniIcon: {
      marginRight: 3,
    },
    roleLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    roleLabelOwner: {
      color: '#92400E',
    },
    dotDivider: {
      marginHorizontal: 5,
      color: colors.textMuted,
      fontSize: 10,
    },
    membersCountLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    codePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 5,
    },
    codePillText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.8,
    },

    // Quick Command Dock
    dockContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 6,
      backgroundColor: 'transparent',
    },
    quickDock: {
      flexDirection: 'row',
      gap: 10,
    },
    quickDockCardPrimary: {
      flex: 1.15,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 12,
      gap: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 10,
      elevation: 3,
    },
    quickDockCardSecondary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
      shadowColor: colors.shadow.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 1,
    },
    quickIconCircleWhite: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quickIconCircleTint: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quickDockInfo: {
      flex: 1,
    },
    quickDockTitleLight: {
      fontSize: 13,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    quickDockSubLight: {
      fontSize: 10,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 1,
    },
    quickDockTitleDark: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    quickDockSubDark: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 1,
    },
    dockArrowIcon: {
      opacity: 0.8,
    },

    // Segmented Tabs
    segmentedTabBarWrapper: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      backgroundColor: 'transparent',
    },
    segmentedTabBar: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceSubtle,
      padding: 3,
      borderRadius: 12,
    },
    segmentTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 9,
    },
    segmentTabActive: {
      backgroundColor: colors.surface,
      shadowColor: colors.shadow.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    tabIconSpacing: {
      marginRight: 4,
    },
    segmentTabText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    segmentTabTextActive: {
      color: colors.primary,
      fontWeight: '800',
    },

    // Tab Contents & Filters
    tabContentContainer: {
      flex: 1,
    },
    filterSection: {
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 8,
      backgroundColor: 'transparent',
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 40,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.textPrimary,
      paddingVertical: 0,
    },
    filterChipsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterChipTextActive: {
      color: colors.primary,
      fontWeight: '800',
    },
    listPadding: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 32,
    },

    // Session Card (Hairline borders & multi-layered soft shadow)
    sessionCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
    sessionCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    sessionLocationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 8,
    },
    locationIconBox: {
      width: 32,
      height: 32,
      borderRadius: 9,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    sessionLocationInfo: {
      flex: 1,
    },
    sessionLocation: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    sessionDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
      gap: 4,
    },
    sessionDate: {
      fontSize: 11,
      color: colors.textMuted,
    },
    sessionMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    buyerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 7,
      gap: 4,
    },
    buyerPillSelf: {
      backgroundColor: colors.primaryLight,
    },
    buyerPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    buyerPillTextSelf: {
      color: colors.primary,
      fontWeight: '700',
    },
    feePill: {
      backgroundColor: '#ECFDF5',
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.2)',
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
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    sessionStatsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    itemCountLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      marginLeft: 6,
    },
    spendingText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    sessionCardFooter: {
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      paddingTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
    },
    actionLinkLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },

    // Empty State (Clean icon badge, no raw emojis)
    emptyCard: {
      alignItems: 'center',
      paddingVertical: 32,
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 8,
      shadowColor: colors.shadow.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
    },
    emptyIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.surfaceSubtle,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    emptyText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 24,
      lineHeight: 18,
    },
    emptyCtaBtn: {
      marginTop: 14,
      borderRadius: 10,
    },

    // Member Item List
    memberCardItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
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
      backgroundColor: colors.surfaceSubtle,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    memberAvatarOwner: {
      backgroundColor: colors.primaryLight,
    },
    memberAvatarText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textSecondary,
    },
    memberAvatarTextOwner: {
      color: colors.primary,
    },
    memberTextInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    memberPhone: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    memberRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 6,
    },
    roleBadgeOwner: {
      backgroundColor: '#FEF3C7',
    },
    roleIconMargin: {
      marginRight: 4,
    },
    roleText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    roleTextOwner: {
      color: '#92400E',
      fontWeight: '800',
    },
    btnIconMargin: {
      marginRight: 4,
    },
    kickMemberBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
      paddingHorizontal: 8,
      paddingVertical: 4.5,
      borderRadius: 6,
      backgroundColor: '#FEE2E2',
    },
    kickMemberText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.danger,
    },
    leaveMemberBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
      paddingHorizontal: 8,
      paddingVertical: 4.5,
      borderRadius: 6,
      backgroundColor: colors.surfaceSubtle,
    },
    leaveMemberText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },

    // Settings Tab
    settingsScrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    settingsCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
    settingsHeading: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    infoRowLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    infoRowVal: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    infoRowValWithAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    editNameBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 6,
    },
    editNameText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    shareCodeActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 12,
      marginBottom: 20,
      shadowColor: colors.shadow.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 6,
    },
    shareCodeActionText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    dangerBox: {
      backgroundColor: '#FFF5F5',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.18)',
    },
    dangerTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.danger,
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
      borderColor: colors.border,
      backgroundColor: colors.surface,
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
      backgroundColor: colors.surface,
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
      color: colors.textPrimary,
      marginBottom: 4,
    },
    modalSub: {
      fontSize: 13,
      color: colors.textSecondary,
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
