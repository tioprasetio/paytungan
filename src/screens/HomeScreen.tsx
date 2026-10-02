import React, { useState, useCallback, useMemo } from 'react';
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
import { Badge, AvatarStack } from '../components/common';
import { useThemeColors, ThemeColors } from '../theme/colors';
import {
  Plus,
  KeyRound,
  Search,
  ChevronRight,
  CreditCard,
  MapPin,
  Clock,
  ArrowUpRight,
  ShoppingBag,
  Users,
  X,
  Receipt,
  CheckCircle2,
  Settings,
  History,
} from 'lucide-react-native';
import { LinearGradientView } from '../components/common/LinearGradientView';

const CIRCLE_THEMES = [
  { bg: '#EEF2FF', border: '#C7D2FE', text: '#4F46E5' },
  { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A' },
  { bg: '#FFF7ED', border: '#FED7AA', text: '#EA580C' },
  { bg: '#FAF5FF', border: '#E9D5FF', text: '#9333EA' },
  { bg: '#ECFEFF', border: '#A5F3FC', text: '#0891B2' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(324, SCREEN_WIDTH - 52);

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser } = useAuthStore();
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { circles, fetchUserCircles } = useCircle(currentUser?.id);

  const [activeSessions, setActiveSessions] = useState<JastipSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(
    async (isPullToRefresh: boolean = false) => {
      if (!currentUser?.id) return;
      try {
        if (isPullToRefresh) {
          setRefreshing(true);
        }
        await Promise.all([
          fetchUserCircles(),
          jastipApi.getUserActiveSessions(currentUser.id).then(sessions => {
            setActiveSessions(sessions);
          }),
        ]);
      } catch (err) {
        console.warn('Failed to load active runs:', err);
      } finally {
        setRefreshing(false);
      }
    },
    [currentUser?.id, fetchUserCircles],
  );

  useFocusEffect(
    useCallback(() => {
      loadData(false);
    }, [loadData]),
  );

  const filteredSessions = activeSessions
    .filter(s => s.status === 'OPEN' || s.status === 'LOCKED')
    .filter(s => {
      const query = searchQuery.toLowerCase();
      return (
        s.lokasi?.toLowerCase().includes(query) ||
        s.circle?.nama_sirkel?.toLowerCase().includes(query) ||
        s.creator?.nama?.toLowerCase().includes(query)
      );
    });

  const renderErrandCard = (
    session: JastipSession,
    isFullWidth: boolean = false,
  ) => {
    const isBuyer = session.creatorId === currentUser?.id;
    const isOpen = session.status === 'OPEN';
    const isExpired =
      !!session.waktu_tutup &&
      new Date(session.waktu_tutup).getTime() < Date.now();
    const itemCount = session.items?.length || 0;
    const totalSpending =
      session.items?.reduce((acc, item) => acc + (item.harga_final || 0), 0) ||
      0;

    // Split bill & payment calculations
    const myItems =
      session.items?.filter(i => i.userId === currentUser?.id) || [];
    const myPricedItems = myItems.filter(
      i => i.harga_final !== null && i.harga_final !== undefined,
    );
    const myTotalBill =
      myPricedItems.reduce((acc, i) => acc + (i.harga_final || 0), 0) +
      (myItems.length > 0 ? session.tarif_jastip || 0 : 0);
    const isMyAllPaid =
      myItems.length > 0 && myItems.every(i => i.status_bayar);
    const myProof = session.payment_proofs?.find(
      p => p.userId === currentUser?.id,
    );
    const pendingProofsCount =
      session.payment_proofs?.filter(p => p.status === 'PENDING').length || 0;
    const hasUnpricedItems = session.items?.some(
      i => i.harga_final === null || i.harga_final === undefined,
    );

    // Smart Action configuration without emojis
    let actionText = '';
    let actionBtnStyle: any = styles.actionBtnPrimary;
    let actionTextStyle: any = styles.actionTextLight;
    let ActionIcon: any = ShoppingBag;
    let onActionPress = () => {
      navigation.navigate('JastipSession', {
        sessionId: session.id,
        lokasi: session.lokasi,
      });
    };

    if (isBuyer) {
      if (isOpen) {
        actionText = isExpired ? 'Kunci Keranjang' : 'Buka Keranjang Kamu';
        actionBtnStyle = styles.actionBtnPrimary;
        ActionIcon = ShoppingBag;
        onActionPress = () =>
          navigation.navigate('JastipSession', {
            sessionId: session.id,
            lokasi: session.lokasi,
          });
      } else if (hasUnpricedItems) {
        actionText = 'Input Harga Struk';
        actionBtnStyle = styles.actionBtnAmber;
        ActionIcon = Receipt;
        onActionPress = () =>
          navigation.navigate('InputPrices', {
            sessionId: session.id,
            lokasi: session.lokasi,
          });
      } else if (pendingProofsCount > 0) {
        actionText = `${pendingProofsCount} Bukti Perlu Dikonfirmasi`;
        actionBtnStyle = styles.actionBtnAmber;
        ActionIcon = Clock;
        onActionPress = () =>
          navigation.navigate('SplitBillRecap', {
            sessionId: session.id,
            lokasi: session.lokasi,
          });
      } else {
        actionText = 'Lihat Rekap Split Bill';
        actionBtnStyle = styles.actionBtnSecondary;
        actionTextStyle = styles.actionTextDark;
        ActionIcon = Receipt;
        onActionPress = () =>
          navigation.navigate('SplitBillRecap', {
            sessionId: session.id,
            lokasi: session.lokasi,
          });
      }
    } else {
      // Penitip
      if (isOpen) {
        actionText = isExpired ? 'Waktu Habis (Lihat)' : 'Titip Barang';
        actionBtnStyle = styles.actionBtnPrimary;
        ActionIcon = Plus;
        onActionPress = () =>
          navigation.navigate('JastipSession', {
            sessionId: session.id,
            lokasi: session.lokasi,
          });
      } else if (myItems.length === 0) {
        actionText = 'Pantau Belanjaan Sirkel';
        actionBtnStyle = styles.actionBtnSubtle;
        actionTextStyle = styles.actionTextMuted;
        ActionIcon = Users;
        onActionPress = () =>
          navigation.navigate('JastipSession', {
            sessionId: session.id,
            lokasi: session.lokasi,
          });
      } else if (hasUnpricedItems) {
        actionText = 'Menunggu Struk Belanja';
        actionBtnStyle = styles.actionBtnSubtle;
        actionTextStyle = styles.actionTextMuted;
        ActionIcon = Clock;
        onActionPress = () =>
          navigation.navigate('JastipSession', {
            sessionId: session.id,
            lokasi: session.lokasi,
          });
      } else if (isMyAllPaid) {
        actionText = 'Lunas • Lihat Rincian';
        actionBtnStyle = styles.actionBtnGreenLight;
        actionTextStyle = styles.actionTextGreenDark;
        ActionIcon = CheckCircle2;
        onActionPress = () =>
          navigation.navigate('SplitBillRecap', {
            sessionId: session.id,
            lokasi: session.lokasi,
          });
      } else if (myProof?.status === 'PENDING') {
        actionText = 'Bukti Terkirim (Menunggu)';
        actionBtnStyle = styles.actionBtnAmberLight;
        actionTextStyle = styles.actionTextAmberDark;
        ActionIcon = Clock;
        onActionPress = () =>
          navigation.navigate('SplitBillRecap', {
            sessionId: session.id,
            lokasi: session.lokasi,
          });
      } else if (myProof?.status === 'REJECTED') {
        actionText = `Upload Ulang Bukti (Rp ${myTotalBill.toLocaleString(
          'id-ID',
        )})`;
        actionBtnStyle = styles.actionBtnRedLight;
        actionTextStyle = styles.actionTextRedDark;
        ActionIcon = CreditCard;
        onActionPress = () =>
          navigation.navigate('SplitBillRecap', {
            sessionId: session.id,
            lokasi: session.lokasi,
          });
      } else {
        actionText = `Bayar Tagihan (Rp ${myTotalBill.toLocaleString(
          'id-ID',
        )})`;
        actionBtnStyle = styles.actionBtnEmerald;
        ActionIcon = CreditCard;
        onActionPress = () =>
          navigation.navigate('SplitBillRecap', {
            sessionId: session.id,
            lokasi: session.lokasi,
          });
      }
    }

    const handleCardPress = () => {
      if (!isOpen && !hasUnpricedItems) {
        navigation.navigate('SplitBillRecap', {
          sessionId: session.id,
          lokasi: session.lokasi,
        });
      } else {
        navigation.navigate('JastipSession', {
          sessionId: session.id,
          lokasi: session.lokasi,
        });
      }
    };

    return (
      <TouchableOpacity
        key={session.id}
        style={[
          styles.errandCard,
          isFullWidth ? styles.errandCardFull : styles.errandCardCarousel,
        ]}
        onPress={handleCardPress}
        activeOpacity={0.92}
      >
        {/* Card Header: Store Location & Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.locationWrap}>
            <View style={styles.locationIconSquircle}>
              <MapPin size={15} color={colors.primary} />
            </View>
            <View style={styles.locationTextWrap}>
              <Text style={styles.errandName} numberOfLines={1}>
                {session.lokasi}
              </Text>
              <Text style={styles.circleSubText} numberOfLines={1}>
                {session.circle?.nama_sirkel || 'Grup Sirkel'}
              </Text>
            </View>
          </View>
          <Badge status={session.status} />
        </View>

        {/* Runner & Tariff Row */}
        <View style={styles.runnerAndFeeRow}>
          <View style={[styles.runnerBadge, isBuyer && styles.runnerBadgeSelf]}>
            <Text
              style={[styles.runnerText, isBuyer && styles.runnerTextSelf]}
              numberOfLines={1}
            >
              Belanja:{' '}
              <Text style={styles.runnerBoldText}>{session.creator?.nama}</Text>
              {isBuyer ? ' (Kamu)' : ''}
            </Text>
          </View>
          <View style={styles.feeTag}>
            <Text style={styles.feeTagText}>
              + Jastip Rp {(session.tarif_jastip || 0).toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        {/* Social Proof & Spend Box */}
        <View style={styles.socialAndSpendRow}>
          <View style={styles.socialBox}>
            <AvatarStack
              users={[
                { name: session.creator?.nama },
                ...(session.items?.map(i => ({ name: i.user?.nama })) || []),
              ]}
              maxDisplay={3}
              size={26}
              showAddButton={false}
            />
            <Text style={styles.itemCountText}>
              {itemCount > 0 ? `${itemCount} titipan` : 'Belum ada titip'}
            </Text>
          </View>

          <View style={styles.spendBox}>
            <Text style={styles.spendLabel}>Total Belanja</Text>
            <Text style={styles.spendAmount}>
              {totalSpending > 0
                ? `Rp ${totalSpending.toLocaleString('id-ID')}`
                : isOpen
                ? isExpired
                  ? 'Waktu habis'
                  : 'Bisa nitip'
                : 'Menunggu struk'}
            </Text>
          </View>
        </View>

        {/* Tactile Action Button */}
        <TouchableOpacity
          style={[styles.primaryActionBtn, actionBtnStyle]}
          onPress={onActionPress}
          activeOpacity={0.85}
        >
          <ActionIcon
            size={14}
            color={actionTextStyle.color || '#FFFFFF'}
            style={styles.btnIcon}
          />
          <Text
            style={[styles.primaryActionText, actionTextStyle]}
            numberOfLines={1}
          >
            {actionText}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Urgent alerts for 1-Tap Resolution
  const runnerPendingSession = activeSessions.find(
    s =>
      s.creatorId === currentUser?.id &&
      s.payment_proofs?.some(p => p.status === 'PENDING'),
  );

  const penitipUnpaidSession = activeSessions.find(s => {
    if (s.creatorId === currentUser?.id || s.status !== 'LOCKED') return false;
    const items = s.items?.filter(i => i.userId === currentUser?.id) || [];
    if (items.length === 0) return false;
    const allPriced = items.every(
      i => i.harga_final !== null && i.harga_final !== undefined,
    );
    const notAllPaid = items.some(i => !i.status_bayar);
    const proof = s.payment_proofs?.find(p => p.userId === currentUser?.id);
    return allPriced && notAllPaid && proof?.status !== 'PENDING';
  });

  return (
    <LinearGradientView colors={colors.bgGradient} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        {/* Opsi 2: Card Profile di Kiri & Settings Icon di Kanan */}
        <View style={styles.topBar}>
          <View style={styles.profileSnippet}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {currentUser?.nama?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.profileTextWrap}>
              <Text style={styles.greetingMini}>Hallo,</Text>
              <Text style={styles.profileName} numberOfLines={1}>
                {/* {currentUser?.nama || 'User'}! 👋 */}
                {currentUser?.nama?.trim().split(' ')[0] || 'User'}! 👋
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={styles.settingsIconBtn}
              onPress={() => navigation.navigate('History')}
              activeOpacity={0.75}
            >
              <History size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsIconBtn}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.75}
            >
              <Settings size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor={colors.primary}
            />
          }
        >
          {/* Floating Search Bar (hairline border + subtle shadow) */}
          <View style={styles.searchBar}>
            <Search
              size={16}
              color={colors.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari sesi jastip, toko, teman..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={15} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Command Dock (Replaces generic 50/50 buttons) */}
          <View style={styles.quickDock}>
            <TouchableOpacity
              style={styles.quickDockCardPrimary}
              onPress={() => navigation.navigate('CreateCircle')}
              activeOpacity={0.88}
            >
              <View style={styles.quickIconCircleWhite}>
                <Plus size={16} color={colors.primary} />
              </View>
              <View style={styles.quickDockInfo}>
                <Text style={styles.quickDockTitleLight}>Buat Sirkel</Text>
                <Text style={styles.quickDockSubLight}>Mulai grup belanja</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickDockCardSecondary}
              onPress={() => navigation.navigate('JoinCircle')}
              activeOpacity={0.88}
            >
              <View style={styles.quickIconCircleIndigo}>
                <KeyRound size={16} color={colors.primary} />
              </View>
              <View style={styles.quickDockInfo}>
                <Text style={styles.quickDockTitleDark}>Gabung Kode</Text>
                <Text style={styles.quickDockSubDark}>Pake kode teman</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Dynamic Action Islands (No generic emoji banners) */}
          {runnerPendingSession &&
            (() => {
              const pendingCount =
                runnerPendingSession.payment_proofs?.filter(
                  p => p.status === 'PENDING',
                ).length || 1;
              return (
                <TouchableOpacity
                  style={styles.actionIslandAmber}
                  onPress={() =>
                    navigation.navigate('SplitBillRecap', {
                      sessionId: runnerPendingSession.id,
                      lokasi: runnerPendingSession.lokasi,
                    })
                  }
                  activeOpacity={0.9}
                >
                  <View style={styles.islandPulseAmber} />
                  <View style={styles.islandBody}>
                    <Text style={styles.islandTitleAmber}>
                      {pendingCount} Bukti Bayar Menunggu Konfirmasi
                    </Text>
                    <Text style={styles.islandSubAmber} numberOfLines={1}>
                      Jastip {runnerPendingSession.lokasi} • Ketuk untuk
                      verifikasi
                    </Text>
                  </View>
                  <View style={styles.islandBtnAmber}>
                    <Text style={styles.islandBtnTextAmber}>Periksa</Text>
                    <ArrowUpRight size={13} color="#92400E" />
                  </View>
                </TouchableOpacity>
              );
            })()}

          {penitipUnpaidSession &&
            (() => {
              const items =
                penitipUnpaidSession.items?.filter(
                  i => i.userId === currentUser?.id,
                ) || [];
              const myBill =
                items.reduce((acc, i) => acc + (i.harga_final || 0), 0) +
                (penitipUnpaidSession.tarif_jastip || 0);
              return (
                <TouchableOpacity
                  style={styles.actionIslandEmerald}
                  onPress={() =>
                    navigation.navigate('SplitBillRecap', {
                      sessionId: penitipUnpaidSession.id,
                      lokasi: penitipUnpaidSession.lokasi,
                    })
                  }
                  activeOpacity={0.9}
                >
                  <View style={styles.islandPulseEmerald} />
                  <View style={styles.islandBody}>
                    <Text style={styles.islandTitleEmerald}>
                      Tagihan Siap Dibayar: Rp {myBill.toLocaleString('id-ID')}
                    </Text>
                    <Text style={styles.islandSubEmerald} numberOfLines={1}>
                      Jastip {penitipUnpaidSession.lokasi} • Upload bukti
                      transfer
                    </Text>
                  </View>
                  <View style={styles.islandBtnEmerald}>
                    <Text style={styles.islandBtnTextEmerald}>Bayar</Text>
                    <ArrowUpRight size={13} color="#065F46" />
                  </View>
                </TouchableOpacity>
              );
            })()}

          {/* Sesi Jastip Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionTitle}>Sesi Jastip Aktif</Text>
              <View style={styles.liveCounterBadge}>
                <Text style={styles.liveCounterText}>
                  {filteredSessions.length}
                </Text>
              </View>
            </View>
            {filteredSessions.length > 1 ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('ActiveSessions')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.viewAllCirclesText}>
                  Lihat Semua ({filteredSessions.length}) →
                </Text>
              </TouchableOpacity>
            ) : filteredSessions.length > 1 ? (
              <Text style={styles.swipeHintText}>Geser →</Text>
            ) : null}
          </View>

          {filteredSessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <ShoppingBag size={24} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Belum Ada Sesi Jastip Aktif</Text>
              <Text style={styles.emptyText}>
                Buka sirkel teman kamu atau mulai sesi belanja baru biar teman
                bisa nitip.
              </Text>
            </View>
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
              {filteredSessions.map(session =>
                renderErrandCard(session, false),
              )}
            </ScrollView>
          )}

          {/* My Sirkel Section */}
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
              <Text style={styles.viewAllCirclesText}>
                Lihat Semua ({circles.length}) →
              </Text>
            </TouchableOpacity>
          </View>

          {circles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Users size={24} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Belum Punya Sirkel</Text>
              <Text style={styles.emptyText}>
                Buka sirkel baru atau gabung menggunakan kode join teman kamu.
              </Text>
            </View>
          ) : (
            <>
              {circles.slice(0, 3).map((circle, index) => {
                const isOwner = circle.members?.some(
                  m => m.userId === currentUser?.id && m.role === 'OWNER',
                );
                const theme = CIRCLE_THEMES[index % CIRCLE_THEMES.length];
                const hasActiveJastip = activeSessions.some(
                  s => s.circleId === circle.id && s.status === 'OPEN',
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
                    activeOpacity={0.88}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View
                        style={[
                          styles.avatarBox,
                          {
                            backgroundColor: theme.bg,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.avatarText, { color: theme.text }]}
                        >
                          {circle.nama_sirkel.charAt(0).toUpperCase()}
                        </Text>
                        {hasActiveJastip && (
                          <View style={styles.activeDotBadge} />
                        )}
                      </View>

                      <View style={styles.cardMainInfo}>
                        <View style={styles.titleCodeRow}>
                          <Text style={styles.upgradedTitle} numberOfLines={1}>
                            {circle.nama_sirkel}
                          </Text>
                          <View style={styles.codePill}>
                            <Text style={styles.codePillHash}>#</Text>
                            <Text style={styles.codePillText}>
                              {circle.kode_join}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.subMetaRow}>
                          <View
                            style={
                              isOwner ? styles.ownerBadge : styles.memberBadge
                            }
                          >
                            <Text
                              style={
                                isOwner
                                  ? styles.ownerBadgeText
                                  : styles.memberBadgeText
                              }
                            >
                              {isOwner ? 'Owner' : 'Anggota'}
                            </Text>
                          </View>

                          {hasActiveJastip && (
                            <View style={styles.jastipActivePill}>
                              <View style={styles.jastipActiveDot} />
                              <Text style={styles.jastipActiveText}>
                                Jastip Buka
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardHairline} />

                    <View style={styles.cardFooterRow}>
                      <View style={styles.footerLeft}>
                        <AvatarStack
                          users={
                            circle.members?.map(m => ({
                              id: m.userId,
                              name: m.user?.nama || 'Teman',
                            })) || []
                          }
                          size={24}
                          maxDisplay={3}
                          showAddButton={false}
                        />
                        <Text style={styles.memberCountLabel}>
                          {circle.members?.length || 1} Teman
                        </Text>
                      </View>

                      <View style={styles.enterPill}>
                        <Text style={styles.enterPillText}>Buka Sirkel</Text>
                        <ChevronRight size={13} color={colors.primary} />
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
                  <ChevronRight size={15} color={colors.primary} />
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
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
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: 'transparent',
    },
    profileSnippet: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
      gap: 12,
    },
    avatarCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primaryLight,
      borderWidth: 1.5,
      borderColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    avatarInitial: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.primary,
    },
    profileTextWrap: {
      flex: 1,
      justifyContent: 'center',
    },
    greetingMini: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 1,
    },
    profileName: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.4,
    },
    settingsIconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      padding: 18,
      paddingBottom: 40,
    },

    // Search Bar (Hairline border + soft shadow)
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'ios' ? 11 : 9,
      marginBottom: 16,
      shadowColor: colors.shadow.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 1,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
      padding: 0,
      fontWeight: '500',
    },

    // Quick Command Dock (Replaces 50/50 generic buttons)
    quickDock: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    quickDockCardPrimary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 18,
      paddingVertical: 13,
      paddingHorizontal: 14,
      gap: 10,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 3,
    },
    quickDockCardSecondary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 18,
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
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
    quickIconCircleIndigo: {
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
      fontWeight: '500',
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
      fontWeight: '500',
      color: colors.textSecondary,
      marginTop: 1,
    },

    // Dynamic Action Islands (Urgent Banners)
    actionIslandAmber: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      borderWidth: 1,
      borderColor: '#FCD34D',
      borderRadius: 16,
      paddingVertical: 11,
      paddingHorizontal: 13,
      marginBottom: 16,
      gap: 10,
    },
    islandPulseAmber: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#D97706',
    },
    islandBody: {
      flex: 1,
    },
    islandTitleAmber: {
      fontSize: 12,
      fontWeight: '800',
      color: '#92400E',
    },
    islandSubAmber: {
      fontSize: 11,
      color: '#B45309',
      marginTop: 1,
    },
    islandBtnAmber: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FDE68A',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 10,
      gap: 3,
    },
    islandBtnTextAmber: {
      fontSize: 11,
      fontWeight: '800',
      color: '#92400E',
    },

    actionIslandEmerald: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#D1FAE5',
      borderWidth: 1,
      borderColor: '#6EE7B7',
      borderRadius: 16,
      paddingVertical: 11,
      paddingHorizontal: 13,
      marginBottom: 16,
      gap: 10,
    },
    islandPulseEmerald: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#059669',
    },
    islandTitleEmerald: {
      fontSize: 12,
      fontWeight: '800',
      color: '#065F46',
    },
    islandSubEmerald: {
      fontSize: 11,
      color: '#047857',
      marginTop: 1,
    },
    islandBtnEmerald: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#A7F3D0',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 10,
      gap: 3,
    },
    islandBtnTextEmerald: {
      fontSize: 11,
      fontWeight: '800',
      color: '#065F46',
    },

    // Section Headers
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
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    liveCounterBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 8,
    },
    liveCounterText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.primary,
    },
    swipeHintText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    circlesSectionHeader: {
      marginTop: 24,
    },

    // Active Jastip Cards
    horizontalScrollContent: {
      paddingRight: 6,
      paddingBottom: 6,
    },
    errandCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 15,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    errandCardFull: {
      width: '100%',
      marginBottom: 12,
    },
    errandCardCarousel: {
      width: CARD_WIDTH,
      marginRight: 12,
      marginBottom: 6,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    locationWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 8,
      gap: 8,
    },
    locationIconSquircle: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    locationTextWrap: {
      flex: 1,
    },
    errandName: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    circleSubText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
      fontWeight: '500',
    },
    runnerAndFeeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      gap: 8,
    },
    runnerBadge: {
      flex: 1,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderLight,
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 8,
    },
    runnerBadgeSelf: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    runnerText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    runnerBoldText: {
      fontWeight: '700',
      color: colors.textPrimary,
    },
    runnerTextSelf: {
      color: colors.primary,
    },
    feeTag: {
      backgroundColor: '#ECFDF5',
      paddingHorizontal: 8,
      paddingVertical: 3.5,
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
      backgroundColor: colors.surfaceSubtle,
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
      color: colors.textSecondary,
      marginLeft: 7,
    },
    spendBox: {
      alignItems: 'flex-end',
    },
    spendLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    spendAmount: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 1,
    },

    // Action Button Styles
    primaryActionBtn: {
      width: '100%',
      paddingVertical: 10,
      borderRadius: 13,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    btnIcon: {
      marginRight: 2,
    },
    primaryActionText: {
      fontSize: 12,
      fontWeight: '800',
    },
    actionBtnPrimary: {
      backgroundColor: colors.primary,
    },
    actionBtnSecondary: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionBtnSubtle: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionBtnEmerald: {
      backgroundColor: '#059669',
    },
    actionBtnAmber: {
      backgroundColor: '#D97706',
    },
    actionBtnGreenLight: {
      backgroundColor: '#DCFCE7',
      borderWidth: 1,
      borderColor: '#86EFAC',
    },
    actionBtnAmberLight: {
      backgroundColor: '#FEF3C7',
      borderWidth: 1,
      borderColor: '#FCD34D',
    },
    actionBtnRedLight: {
      backgroundColor: '#FEE2E2',
      borderWidth: 1,
      borderColor: '#FCA5A5',
    },
    actionTextLight: {
      color: '#FFFFFF',
    },
    actionTextDark: {
      color: colors.textPrimary,
    },
    actionTextMuted: {
      color: colors.textSecondary,
    },
    actionTextGreenDark: {
      color: '#166534',
    },
    actionTextAmberDark: {
      color: '#92400E',
    },
    actionTextRedDark: {
      color: '#991B1B',
    },

    // Circle Cards
    upgradedCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 15,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 1,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatarBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      position: 'relative',
    },
    avatarText: {
      fontSize: 18,
      fontWeight: '800',
    },
    activeDotBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#10B981',
      borderWidth: 2,
      borderColor: colors.surface,
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
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      flex: 1,
    },
    codePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.border,
    },
    codePillHash: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      marginRight: 2,
    },
    codePillText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textSecondary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      letterSpacing: 0.5,
    },
    subMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 6,
    },
    ownerBadge: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#FDE68A',
    },
    ownerBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#B45309',
    },
    memberBadge: {
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    memberBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    jastipActivePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ECFDF5',
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#A7F3D0',
      gap: 4,
    },
    jastipActiveDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: '#059669',
    },
    jastipActiveText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#047857',
    },
    cardHairline: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginVertical: 10,
    },
    cardFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    memberCountLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    enterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 9,
      paddingVertical: 4.5,
      borderRadius: 14,
      gap: 2,
    },
    enterPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    viewAllCirclesText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    seeMoreCirclesBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 11,
      marginBottom: 16,
      gap: 5,
      shadowColor: colors.shadow.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
    },
    seeMoreCirclesText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },

    // Empty States (Clean, modern illustration style)
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      paddingHorizontal: 20,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    emptyIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 3,
    },
    emptyText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 17,
    },
  });
