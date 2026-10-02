import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../stores';
import { jastipApi } from '../api';
import { JastipSession } from '../types';
import { Header, Card, Badge, AvatarStack } from '../components/common';
import { useThemeColors, ThemeColors } from '../theme/colors';
import {
  Search,
  ShoppingBag,
  MapPin,
  Clock,
  Plus,
  Receipt,
  Users,
  CheckCircle2,
  CreditCard,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradientView } from '../components/common/LinearGradientView';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ActiveSessions'
>;

type FilterTab = 'ALL' | 'RUNNER' | 'PENITIP' | 'OPEN' | 'LOCKED';

export const ActiveSessionsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser } = useAuthStore();
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [activeSessions, setActiveSessions] = useState<JastipSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(
    async (isPullToRefresh: boolean = false) => {
      if (!currentUser?.id) return;
      try {
        if (isPullToRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        const sessions = await jastipApi.getUserActiveSessions(currentUser.id);
        setActiveSessions(sessions || []);
      } catch (err) {
        console.warn('Gagal memuat sesi jastip aktif:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentUser?.id],
  );

  useFocusEffect(
    useCallback(() => {
      loadData(false);
    }, [loadData]),
  );

  // Filter out any completed sessions just in case
  const ongoingSessions = useMemo(() => {
    return activeSessions.filter(
      s => s.status === 'OPEN' || s.status === 'LOCKED',
    );
  }, [activeSessions]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    const runnerCount = ongoingSessions.filter(
      s => s.creatorId === currentUser?.id,
    ).length;
    const penitipCount = ongoingSessions.filter(s =>
      s.items?.some(i => i.userId === currentUser?.id),
    ).length;
    const openCount = ongoingSessions.filter(s => s.status === 'OPEN').length;
    const lockedCount = ongoingSessions.filter(
      s => s.status === 'LOCKED',
    ).length;

    return {
      all: ongoingSessions.length,
      runner: runnerCount,
      penitip: penitipCount,
      open: openCount,
      locked: lockedCount,
    };
  }, [ongoingSessions, currentUser?.id]);

  // Filtered sessions based on active tab and search query
  const filteredSessions = useMemo(() => {
    return ongoingSessions.filter(session => {
      const isRunner = session.creatorId === currentUser?.id;
      const isPenitip = session.items?.some(
        i => i.userId === currentUser?.id,
      );

      // Tab filter
      if (activeTab === 'RUNNER' && !isRunner) return false;
      if (activeTab === 'PENITIP' && !isPenitip) return false;
      if (activeTab === 'OPEN' && session.status !== 'OPEN') return false;
      if (activeTab === 'LOCKED' && session.status !== 'LOCKED') return false;

      // Search filter
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchLocation = session.lokasi?.toLowerCase().includes(query);
        const matchCircle = session.circle?.nama_sirkel
          ?.toLowerCase()
          .includes(query);
        const matchRunner = session.creator?.nama?.toLowerCase().includes(query);
        const matchItem = session.items?.some(i =>
          i.nama_barang?.toLowerCase().includes(query),
        );
        return matchLocation || matchCircle || matchRunner || matchItem;
      }

      return true;
    });
  }, [ongoingSessions, activeTab, searchQuery, currentUser?.id]);

  const renderSessionCard = (session: JastipSession) => {
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

    // Smart Action configuration
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
      // Penitip / Sirkel Member
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
        style={styles.sessionCard}
        onPress={handleCardPress}
        activeOpacity={0.9}
      >
        {/* Card Header: Store Location & Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.locationWrap}>
            <View style={styles.locationIconSquircle}>
              <MapPin size={16} color={colors.primary} />
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

        {/* Social Proof & Spend Row */}
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
            <Text style={styles.spendLabel}>
              {myItems.length > 0 && !isBuyer ? 'Tagihan Kamu' : 'Total Belanja'}
            </Text>
            <Text style={styles.spendAmount}>
              {myItems.length > 0 && !isBuyer
                ? myTotalBill > 0
                  ? `Rp ${myTotalBill.toLocaleString('id-ID')}`
                  : 'Menunggu harga'
                : totalSpending > 0
                ? `Rp ${totalSpending.toLocaleString('id-ID')}`
                : isOpen
                ? isExpired
                  ? 'Waktu habis'
                  : 'Bisa nitip'
                : 'Menunggu struk'}
            </Text>
          </View>
        </View>

        {/* Contextual Action Button */}
        <TouchableOpacity
          style={[styles.primaryActionBtn, actionBtnStyle]}
          onPress={onActionPress}
          activeOpacity={0.85}
        >
          <ActionIcon
            size={15}
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

  return (
    <LinearGradientView colors={colors.bgGradient} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Header
          title="Sesi Jastip Aktif"
          subtitle={`${ongoingSessions.length} sesi berlangsung`}
          onBack={() => navigation.goBack()}
          transparent
        />

        <View style={styles.container}>
          {/* Search Input */}
          <View style={styles.searchBar}>
            <Search
              size={16}
              color={colors.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari toko, sirkel, teman, atau barang..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Pills Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRowContent}
            style={styles.tabRowScroll}
          >
            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === 'ALL' && styles.tabPillActive,
              ]}
              onPress={() => setActiveTab('ALL')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'ALL' && styles.tabTextActive,
                ]}
              >
                Semua ({tabCounts.all})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === 'RUNNER' && styles.tabPillActive,
              ]}
              onPress={() => setActiveTab('RUNNER')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'RUNNER' && styles.tabTextActive,
                ]}
              >
                Saya Belanja ({tabCounts.runner})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === 'PENITIP' && styles.tabPillActive,
              ]}
              onPress={() => setActiveTab('PENITIP')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'PENITIP' && styles.tabTextActive,
                ]}
              >
                Saya Titip ({tabCounts.penitip})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === 'OPEN' && styles.tabPillActive,
              ]}
              onPress={() => setActiveTab('OPEN')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'OPEN' && styles.tabTextActive,
                ]}
              >
                Bisa Nitip ({tabCounts.open})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === 'LOCKED' && styles.tabPillActive,
              ]}
              onPress={() => setActiveTab('LOCKED')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'LOCKED' && styles.tabTextActive,
                ]}
              >
                Diproses ({tabCounts.locked})
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* List of Sessions */}
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Memuat sesi jastip aktif...</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => loadData(true)}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            >
              {filteredSessions.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <View style={styles.emptyIconCircle}>
                    <ShoppingBag size={24} color={colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {searchQuery.trim().length > 0
                      ? 'Sesi Jastip Tidak Ditemukan'
                      : activeTab === 'RUNNER'
                      ? 'Belum Ada Sesi Belanjaanmu'
                      : activeTab === 'PENITIP'
                      ? 'Belum Ada Titipan Aktif'
                      : activeTab === 'OPEN'
                      ? 'Belum Ada Sesi Buka Titipan'
                      : activeTab === 'LOCKED'
                      ? 'Tidak Ada Sesi Diproses'
                      : 'Belum Ada Sesi Jastip Aktif'}
                  </Text>
                  <Text style={styles.emptyText}>
                    {searchQuery.trim().length > 0
                      ? `Tidak ada sesi jastip yang cocok dengan "${searchQuery}".`
                      : activeTab !== 'ALL'
                      ? 'Coba ganti filter tab atau periksa sirkel kamu.'
                      : 'Buka sirkel teman kamu atau mulai sesi belanja baru biar teman bisa nitip.'}
                  </Text>

                  {searchQuery.trim().length > 0 || activeTab !== 'ALL' ? (
                    <TouchableOpacity
                      style={styles.resetFilterBtn}
                      onPress={() => {
                        setSearchQuery('');
                        setActiveTab('ALL');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.resetFilterText}>Reset Filter</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.createSessionCta}
                      onPress={() => navigation.navigate('MyCircles')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.createSessionCtaText}>
                        Lihat Sirkel Saya
                      </Text>
                      <ChevronRight size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </Card>
              ) : (
                filteredSessions.map(session => renderSessionCard(session))
              )}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </LinearGradientView>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
      paddingHorizontal: 16,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadow,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.textPrimary,
      padding: 0,
      fontWeight: '500',
    },
    tabRowScroll: {
      maxHeight: 38,
      marginBottom: 12,
    },
    tabRowContent: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 8,
    },
    tabPill: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tabText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    listContent: {
      paddingBottom: 28,
      gap: 12,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
    },
    loadingText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    sessionCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...colors.shadow,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    locationWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 8,
    },
    locationIconSquircle: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    locationTextWrap: {
      flex: 1,
    },
    errandName: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
      marginBottom: 1,
    },
    circleSubText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    runnerAndFeeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.borderLight,
      marginBottom: 12,
    },
    runnerBadge: {
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      maxWidth: '56%',
    },
    runnerBadgeSelf: {
      backgroundColor: colors.primaryLight,
    },
    runnerText: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    runnerTextSelf: {
      color: colors.primary,
    },
    runnerBoldText: {
      fontWeight: '700',
    },
    feeTag: {
      backgroundColor: colors.accentLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    feeTagText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accentDark,
    },
    socialAndSpendRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    socialBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    itemCountText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    spendBox: {
      alignItems: 'flex-end',
    },
    spendLabel: {
      fontSize: 10,
      fontWeight: '500',
      color: colors.textMuted,
      marginBottom: 1,
    },
    spendAmount: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    primaryActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 11,
      borderRadius: 12,
      gap: 6,
    },
    actionBtnPrimary: {
      backgroundColor: colors.primary,
    },
    actionBtnSecondary: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionBtnAmber: {
      backgroundColor: colors.warning,
    },
    actionBtnAmberLight: {
      backgroundColor: colors.warningLight,
      borderWidth: 1,
      borderColor: '#FDE68A',
    },
    actionBtnGreenLight: {
      backgroundColor: colors.successLight,
      borderWidth: 1,
      borderColor: '#A7F3D0',
    },
    actionBtnRedLight: {
      backgroundColor: colors.dangerLight,
      borderWidth: 1,
      borderColor: '#FECACA',
    },
    actionBtnEmerald: {
      backgroundColor: colors.accent,
    },
    actionBtnSubtle: {
      backgroundColor: colors.surfaceSubtle,
    },
    btnIcon: {
      marginRight: 2,
    },
    primaryActionText: {
      fontSize: 12,
      fontWeight: '700',
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
      color: '#065F46',
    },
    actionTextAmberDark: {
      color: '#92400E',
    },
    actionTextRedDark: {
      color: '#991B1B',
    },
    emptyCard: {
      alignItems: 'center',
      paddingVertical: 36,
      paddingHorizontal: 20,
      marginTop: 20,
      borderRadius: 18,
    },
    emptyIconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 16,
    },
    resetFilterBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
    },
    resetFilterText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    createSessionCta: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 12,
      gap: 6,
    },
    createSessionCtaText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
