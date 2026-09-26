import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../stores';
import { useCircle } from '../hooks';
import { jastipApi } from '../api';
import { JastipSession } from '../types';
import { Card, Badge, Button, AvatarStack } from '../components/common';
import { Colors } from '../theme/colors';
import { useAlert } from '../context/AlertContext';
import { Plus, KeyRound, Search, ChevronRight, CreditCard, LocationEdit } from 'lucide-react-native';

const CIRCLE_THEMES = [
  { bg: '#EEF2FF', border: '#C7D2FE', text: '#4F46E5' },
  { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A' },
  { bg: '#FFF7ED', border: '#FED7AA', text: '#EA580C' },
  { bg: '#FAF5FF', border: '#E9D5FF', text: '#9333EA' },
  { bg: '#ECFEFF', border: '#A5F3FC', text: '#0891B2' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(330, SCREEN_WIDTH - 56);

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, logout } = useAuthStore();
  const { showConfirm } = useAlert();
  const { circles, fetchUserCircles } = useCircle(currentUser?.id);

  const [activeSessions, setActiveSessions] = useState<JastipSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setRefreshing(true);
      await fetchUserCircles();
      const sessions = await jastipApi.getUserActiveSessions(currentUser.id);
      setActiveSessions(sessions);
    } catch (err) {
      console.warn('Failed to load active runs:', err);
    } finally {
      setRefreshing(false);
    }
  }, [currentUser?.id, fetchUserCircles]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleLogout = () => {
    showConfirm(
      'Keluar dari Aplikasi?',
      'Apakah kamu yakin ingin keluar dari akun PayTungan?',
      () => {
        logout();
      },
      undefined,
      'Keluar',
      'Batal',
      true
    );
  };

  const filteredSessions = activeSessions
    .filter((s) => s.status === 'OPEN' || s.status === 'LOCKED')
    .filter((s) => {
      const query = searchQuery.toLowerCase();
      return (
        s.lokasi?.toLowerCase().includes(query) ||
        s.circle?.nama_sirkel?.toLowerCase().includes(query) ||
        s.creator?.nama?.toLowerCase().includes(query)
      );
    });

  const renderErrandCard = (session: JastipSession, isFullWidth: boolean = false) => {
    const isBuyer = session.creatorId === currentUser?.id;
    const isOpen = session.status === 'OPEN';
    const isExpired = !!session.waktu_tutup && new Date(session.waktu_tutup).getTime() < Date.now();
    const itemCount = session.items?.length || 0;
    const totalSpending =
      session.items?.reduce((acc, item) => acc + (item.harga_final || 0), 0) || 0;

    // Split bill & payment calculations
    const myItems = session.items?.filter((i) => i.userId === currentUser?.id) || [];
    const myPricedItems = myItems.filter(
      (i) => i.harga_final !== null && i.harga_final !== undefined
    );
    const myTotalBill =
      myPricedItems.reduce((acc, i) => acc + (i.harga_final || 0), 0) +
      (myItems.length > 0 ? (session.tarif_jastip || 0) : 0);
    const isMyAllPaid = myItems.length > 0 && myItems.every((i) => i.status_bayar);
    const myProof = session.payment_proofs?.find((p) => p.userId === currentUser?.id);
    const pendingProofsCount =
      session.payment_proofs?.filter((p) => p.status === 'PENDING').length || 0;
    const hasUnpricedItems = session.items?.some(
      (i) => i.harga_final === null || i.harga_final === undefined
    );

    // Determine smart action button properties & direct routing
    let actionText = '';
    let actionBtnStyle: any = styles.buyerActionBtn;
    let actionTextStyle: any = styles.primaryActionText;
    let onActionPress = () => {
      navigation.navigate('JastipSession', { sessionId: session.id, lokasi: session.lokasi });
    };

    if (isBuyer) {
      if (isOpen) {
        actionText = isExpired
          ? 'Kunci Keranjang (Waktu Habis)'
          : 'Buka Keranjang (Kamu Yang Jajan)';
        actionBtnStyle = styles.buyerActionBtn;
        onActionPress = () =>
          navigation.navigate('JastipSession', { sessionId: session.id, lokasi: session.lokasi });
      } else if (hasUnpricedItems) {
        actionText = '📝 Input Harga Struk Kasir';
        actionBtnStyle = styles.buyerActionBtn;
        onActionPress = () =>
          navigation.navigate('InputPrices', { sessionId: session.id, lokasi: session.lokasi });
      } else if (pendingProofsCount > 0) {
        actionText = `⚡ ${pendingProofsCount} Bukti Bayar - Konfirmasi!`;
        actionBtnStyle = styles.pendingActionBtn;
        onActionPress = () =>
          navigation.navigate('SplitBillRecap', { sessionId: session.id, lokasi: session.lokasi });
      } else {
        actionText = '🧾 Cek Split Bill & Rekap';
        actionBtnStyle = styles.recapActionBtn;
        onActionPress = () =>
          navigation.navigate('SplitBillRecap', { sessionId: session.id, lokasi: session.lokasi });
      }
    } else {
      // Penitip
      if (isOpen) {
        actionText = isExpired ? 'Waktu Habis (Lihat Titipan)' : '+ Titip Barang Sekarang';
        actionBtnStyle = styles.requesterActionBtn;
        onActionPress = () =>
          navigation.navigate('JastipSession', { sessionId: session.id, lokasi: session.lokasi });
      } else if (myItems.length === 0) {
        actionText = '👀 Pantau Belanjaan Sirkel';
        actionBtnStyle = styles.secondaryActionBtn;
        actionTextStyle = styles.secondaryActionText;
        onActionPress = () =>
          navigation.navigate('JastipSession', { sessionId: session.id, lokasi: session.lokasi });
      } else if (hasUnpricedItems) {
        actionText = '⏳ Menunggu Struk Kasir';
        actionBtnStyle = styles.waitingActionBtn;
        actionTextStyle = styles.waitingActionText;
        onActionPress = () =>
          navigation.navigate('JastipSession', { sessionId: session.id, lokasi: session.lokasi });
      } else if (isMyAllPaid) {
        actionText = '✅ Lunas (Lihat Rincian)';
        actionBtnStyle = styles.paidActionBtn;
        actionTextStyle = styles.paidActionText;
        onActionPress = () =>
          navigation.navigate('SplitBillRecap', { sessionId: session.id, lokasi: session.lokasi });
      } else if (myProof?.status === 'PENDING') {
        actionText = '⏳ Bukti Terkirim (Menunggu Konfirmasi)';
        actionBtnStyle = styles.waitingProofActionBtn;
        actionTextStyle = styles.waitingProofActionText;
        onActionPress = () =>
          navigation.navigate('SplitBillRecap', { sessionId: session.id, lokasi: session.lokasi });
      } else if (myProof?.status === 'REJECTED') {
        actionText = `❌ Bukti Ditolak - Upload Ulang (Rp ${myTotalBill.toLocaleString('id-ID')})`;
        actionBtnStyle = styles.rejectedActionBtn;
        onActionPress = () =>
          navigation.navigate('SplitBillRecap', { sessionId: session.id, lokasi: session.lokasi });
      } else {
        // Ready to pay & upload proof!
        actionText = `💳 Bayar & Upload Bukti (Rp ${myTotalBill.toLocaleString('id-ID')})`;
        actionBtnStyle = styles.payActionBtn;
        onActionPress = () =>
          navigation.navigate('SplitBillRecap', { sessionId: session.id, lokasi: session.lokasi });
      }
    }

    const handleCardPress = () => {
      if (!isOpen && !hasUnpricedItems) {
        navigation.navigate('SplitBillRecap', { sessionId: session.id, lokasi: session.lokasi });
      } else {
        navigation.navigate('JastipSession', { sessionId: session.id, lokasi: session.lokasi });
      }
    };

    return (
      <Card
        key={session.id}
        style={[
          styles.errandCard,
          isFullWidth ? styles.errandCardFull : styles.errandCardCarousel,
        ]}
        onPress={handleCardPress}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.errandName} numberOfLines={1}>
              <LocationEdit size={15} color={Colors.textMuted} /> {session.lokasi}
            </Text>
            <Text style={styles.circleSubText} numberOfLines={1}>
              Sirkel: <Text style={styles.boldText}>{session.circle?.nama_sirkel || 'Grup'}</Text>
            </Text>
          </View>
          <Badge status={session.status} />
        </View>

        <View style={styles.runnerAndFeeRow}>
          <View style={[styles.runnerBadge, isBuyer && styles.runnerBadgeSelf]}>
            <Text
              style={[styles.runnerText, isBuyer && styles.runnerTextSelf]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Yang Jajan: {session.creator?.nama}{isBuyer ? ' (Kamu)' : ''}
            </Text>
          </View>
          <View style={styles.feeTag}>
            <Text style={styles.feeTagText}>
              Jastip: Rp {(session.tarif_jastip || 0).toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        <View style={styles.socialAndSpendRow}>
          <View style={styles.socialBox}>
            <AvatarStack
              users={[
                { name: session.creator?.nama },
                ...(session.items?.map((i) => ({ name: i.user?.nama })) || []),
              ]}
              maxDisplay={3}
              size={28}
            />
            <Text style={styles.itemCountText}>
              {itemCount > 0 ? `${itemCount} barang` : '0 barang'}
            </Text>
          </View>

          <View style={styles.spendBox}>
            <Text style={styles.spendLabel}>Total Belanja</Text>
            <Text style={styles.spendAmount}>
              {totalSpending > 0
                ? `Rp ${totalSpending.toLocaleString('id-ID')}`
                : isOpen
                  ? isExpired
                    ? 'Waktu titip habis'
                    : 'Masih bisa nitip nih'
                  : 'Menunggu struk'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryActionBtn, actionBtnStyle]}
          onPress={onActionPress}
          activeOpacity={0.8}
        >
          <Text style={[styles.primaryActionText, actionTextStyle]}>{actionText}</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoP}>P</Text>
          </View>
          <Text style={styles.brandTitle}>PayTungan</Text>
        </View>

        <TouchableOpacity
          style={styles.userProfileBtn}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.userInitial}>
            {currentUser?.nama?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
      >
        <View style={styles.greetingSection}>
          <Text style={styles.screenHeading}>Sesi Jastip Aktif</Text>
          <Text style={styles.screenSub}>
            Titip belanja bareng teman sirkel & split bill otomatis
          </Text>
        </View>

        <View style={styles.searchBar}>
          <Search size={15} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari sesi jastip, toko, atau teman..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.quickActions}>
          <Button
            title="Buat Sirkel Baru"
            icon={<Plus size={15} color="#FFFFFF" />}
            variant="primary"
            size="sm"
            onPress={() => navigation.navigate('CreateCircle')}
            style={styles.createGroupBtn}
          />
          <Button
            title="Gabung Kode Sirkel"
            icon={<KeyRound size={15} color={Colors.primary} />}
            variant="secondary"
            size="sm"
            onPress={() => navigation.navigate('JoinCircle')}
            style={styles.joinGroupBtn}
          />
        </View>

        {/* Urgent Action Banners for 1-Tap Quick Resolution */}
        {(() => {
          // 1. Runner pending verification alert
          const runnerPendingSession = activeSessions.find(
            (s) =>
              s.creatorId === currentUser?.id &&
              s.payment_proofs?.some((p) => p.status === 'PENDING')
          );
          if (runnerPendingSession) {
            const pendingCount =
              runnerPendingSession.payment_proofs?.filter((p) => p.status === 'PENDING').length || 1;
            return (
              <TouchableOpacity
                style={styles.urgentHomeBanner}
                onPress={() =>
                  navigation.navigate('SplitBillRecap', {
                    sessionId: runnerPendingSession.id,
                    lokasi: runnerPendingSession.lokasi,
                  })
                }
                activeOpacity={0.85}
              >
                <View style={styles.urgentBannerIconWrap}>
                  <Text style={styles.urgentBannerEmoji}>⚡</Text>
                </View>
                <View style={styles.urgentBannerTextWrap}>
                  <Text style={styles.urgentBannerTitle}>
                    {pendingCount} Bukti Pembayaran Menunggu Konfirmasi!
                  </Text>
                  <Text style={styles.urgentBannerSub} numberOfLines={1}>
                    Jastip {runnerPendingSession.lokasi} • Ketuk untuk verifikasi langsung
                  </Text>
                </View>
                <Text style={styles.urgentBannerAction}>Periksa →</Text>
              </TouchableOpacity>
            );
          }

          // 2. Penitip unpaid bill alert (ready for payment)
          const penitipUnpaidSession = activeSessions.find((s) => {
            if (s.creatorId === currentUser?.id || s.status !== 'LOCKED') return false;
            const items = s.items?.filter((i) => i.userId === currentUser?.id) || [];
            if (items.length === 0) return false;
            const allPriced = items.every((i) => i.harga_final !== null && i.harga_final !== undefined);
            const notAllPaid = items.some((i) => !i.status_bayar);
            const proof = s.payment_proofs?.find((p) => p.userId === currentUser?.id);
            return allPriced && notAllPaid && proof?.status !== 'PENDING';
          });

          if (penitipUnpaidSession) {
            const items = penitipUnpaidSession.items?.filter((i) => i.userId === currentUser?.id) || [];
            const myBill =
              items.reduce((acc, i) => acc + (i.harga_final || 0), 0) +
              (penitipUnpaidSession.tarif_jastip || 0);
            return (
              <TouchableOpacity
                style={[styles.urgentHomeBanner, styles.urgentHomeBannerGreen]}
                onPress={() =>
                  navigation.navigate('SplitBillRecap', {
                    sessionId: penitipUnpaidSession.id,
                    lokasi: penitipUnpaidSession.lokasi,
                  })
                }
                activeOpacity={0.85}
              >
                <View style={[styles.urgentBannerIconWrap, styles.urgentBannerIconWrapGreen]}>
                  <CreditCard size={24} color={Colors.success} />
                </View>
                <View style={styles.urgentBannerTextWrap}>
                  <Text style={[styles.urgentBannerTitle, styles.urgentBannerTitleGreen]}>
                    Tagihan Jastip Rp {myBill.toLocaleString('id-ID')} Siap Dibayar!
                  </Text>
                  <Text style={styles.urgentBannerSub} numberOfLines={1}>
                    Jastip {penitipUnpaidSession.lokasi} • Ketuk untuk upload bukti transfer
                  </Text>
                </View>
                <Text style={[styles.urgentBannerAction, styles.urgentBannerActionGreen]}>
                  Bayar →
                </Text>
              </TouchableOpacity>
            );
          }

          return null;
        })()}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle}>Ayo Titip</Text>
            <View style={styles.liveCounterBadge}>
              <Text style={styles.liveCounterText}>{filteredSessions.length}</Text>
            </View>
          </View>
          {filteredSessions.length > 1 && (
            <Text style={styles.swipeHintText}>Geser →</Text>
          )}
        </View>

        {filteredSessions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Belum Ada Sesi Jastip Aktif</Text>
          </Card>
        ) : filteredSessions.length === 1 ? (
          renderErrandCard(filteredSessions[0], true)
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + 14}
            snapToAlignment="start"
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {filteredSessions.map((session) => renderErrandCard(session, false))}
          </ScrollView>
        )}

        {/* My Groups / Circles Section */}
        <View style={[styles.sectionHeader, styles.circlesSectionHeader]}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle}>Sirkel Saya</Text>
            <View style={styles.liveCounterBadge}>
              <Text style={styles.liveCounterText}>{circles.length}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyCircles')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewAllCirclesText}>Lihat Semua ({circles.length}) →</Text>
          </TouchableOpacity>
        </View>

        {circles.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Belum Punya Sirkel</Text>
            <Text style={styles.emptyText}>
              Buka sirkel baru atau gabung menggunakan kode join teman kamu.
            </Text>
          </Card>
        ) : (
          <>
            {circles.slice(0, 3).map((circle, index) => {
              const isOwner = circle.members?.some(
                (m) => m.userId === currentUser?.id && m.role === 'OWNER'
              );
              const theme = CIRCLE_THEMES[index % CIRCLE_THEMES.length];
              const hasActiveJastip = activeSessions.some(
                (s) => s.circleId === circle.id && (s.status === 'OPEN')
              );

              return (
                <TouchableOpacity
                  key={circle.id}
                  style={styles.upgradedCard}
                  onPress={() =>
                    navigation.navigate('CircleDetail', {
                      circleId: circle.id,
                      circleName: circle.nama_sirkel,
                    })
                  }
                  activeOpacity={0.85}
                >
                  {/* Top Row: Avatar, Names, Badges, Code */}
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.avatarBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                      <Text style={[styles.avatarText, { color: theme.text }]}>
                        {circle.nama_sirkel.charAt(0).toUpperCase()}
                      </Text>
                      {hasActiveJastip && <View style={styles.activeDotBadge} />}
                    </View>

                    <View style={styles.cardMainInfo}>
                      <View style={styles.titleCodeRow}>
                        <Text style={styles.upgradedTitle} numberOfLines={1}>
                          {circle.nama_sirkel}
                        </Text>
                        <View style={styles.codePill}>
                          <Text style={styles.codePillHash}>#</Text>
                          <Text style={styles.codePillText}>{circle.kode_join}</Text>
                        </View>
                      </View>

                      <View style={styles.subMetaRow}>
                        <View style={isOwner ? styles.ownerBadge : styles.memberBadge}>
                          <Text style={isOwner ? styles.ownerBadgeText : styles.memberBadgeText}>
                            {isOwner ? '👑 Owner' : '👥 Anggota'}
                          </Text>
                        </View>

                        {hasActiveJastip && (
                          <View style={styles.jastipActivePill}>
                            <View style={styles.jastipActiveDot} />
                            <Text style={styles.jastipActiveText}>Jastip Buka</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Divider Line */}
                  <View style={styles.cardHairline} />

                  {/* Bottom Row: Avatars & Clean Action Pill */}
                  <View style={styles.cardFooterRow}>
                    <View style={styles.footerLeft}>
                      <AvatarStack
                        users={
                          circle.members?.map((m) => ({
                            id: m.userId,
                            name: m.user?.nama || 'Teman',
                          })) || []
                        }
                        size={26}
                        maxDisplay={3}
                        showAddButton={false}
                      />
                      <Text style={styles.memberCountLabel}>
                        {circle.members?.length || 1} Teman
                      </Text>
                    </View>

                    <View style={styles.enterPill}>
                      <Text style={styles.enterPillText}>Buka Sirkel</Text>
                      <ChevronRight size={14} color={Colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {circles.length > 3 && (
              <TouchableOpacity
                style={styles.seeMoreCirclesBtn}
                onPress={() => navigation.navigate('MyCircles')}
                activeOpacity={0.8}
              >
                <Text style={styles.seeMoreCirclesText}>
                  + Lihat {circles.length - 3} Sirkel Lainnya
                </Text>
                <ChevronRight size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoP: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  userProfileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  greetingSection: {
    marginBottom: 16,
  },
  screenHeading: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  screenSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
  clearSearch: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '700',
    padding: 4,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  createGroupBtn: {
    flex: 1,
    marginRight: 8,
  },
  joinGroupBtn: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  liveCounterBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  liveCounterText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  circlesSectionHeader: {
    marginTop: 28,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  swipeHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  errandCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  errandCardFull: {
    width: '100%',
    marginBottom: 14,
  },
  errandCardCarousel: {
    width: CARD_WIDTH,
    marginRight: 12,
    marginBottom: 8,
  },
  horizontalScrollContent: {
    paddingRight: 6,
    paddingBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardHeaderInfo: {
    flex: 1,
    marginRight: 8,
  },
  errandName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  circleSubText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  runnerAndFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  runnerBadge: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  runnerBadgeSelf: {
    backgroundColor: Colors.primaryLight,
  },
  runnerText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  runnerTextSelf: {
    color: Colors.primary,
    fontWeight: '700',
  },
  feeTag: {
    flexShrink: 0,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  feeTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  socialAndSpendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  socialBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  spendBox: {
    alignItems: 'flex-end',
  },
  spendLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  spendAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  primaryActionBtn: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyerActionBtn: {
    backgroundColor: Colors.primary,
  },
  requesterActionBtn: {
    backgroundColor: Colors.primary,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  buyerActionText: {
    color: '#FFFFFF',
  },
  requesterActionText: {
    color: '#FFFFFF',
  },
  pendingActionBtn: {
    backgroundColor: '#D97706',
  },
  recapActionBtn: {
    backgroundColor: '#4F46E5',
  },
  secondaryActionBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondaryActionText: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  waitingActionBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  waitingActionText: {
    color: Colors.textMuted,
    fontWeight: '600',
  },
  paidActionBtn: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  paidActionText: {
    color: '#166534',
    fontWeight: '800',
  },
  waitingProofActionBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  waitingProofActionText: {
    color: '#92400E',
    fontWeight: '800',
  },
  rejectedActionBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  payActionBtn: {
    backgroundColor: '#059669',
  },
  urgentHomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  urgentHomeBannerGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  urgentBannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentBannerIconWrapGreen: {
    backgroundColor: '#D1FAE5',
  },
  urgentBannerEmoji: {
    fontSize: 16,
  },
  urgentBannerTextWrap: {
    flex: 1,
  },
  urgentBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  urgentBannerTitleGreen: {
    color: '#065F46',
  },
  urgentBannerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  urgentBannerAction: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  urgentBannerActionGreen: {
    color: '#059669',
  },
  upgradedCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
  },
  activeDotBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cardMainInfo: {
    flex: 1,
  },
  titleCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  upgradedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codePillHash: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginRight: 1,
  },
  codePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  ownerBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ownerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  memberBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  jastipActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  jastipActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  jastipActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  cardHairline: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardFooterRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberCountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  enterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 2,
  },
  enterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  viewAllCirclesText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  seeMoreCirclesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 6,
  },
  seeMoreCirclesText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
});
