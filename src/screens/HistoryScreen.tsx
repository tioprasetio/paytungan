import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../stores';
import { jastipApi } from '../api';
import { PenitipHistoryItem, JastiperHistoryItem } from '../types';
import { Header, Card, Badge } from '../components/common';
import { useThemeColors, ThemeColors } from '../theme/colors';
import {
  Search,
  ShoppingBag,
  Store,
  Users,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Receipt,
  X,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import { LinearGradientView } from '../components/common/LinearGradientView';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'History'>;
type TabRole = 'penitip' | 'jastiper';
type StatusFilter = 'ALL' | 'PAID' | 'UNPAID';

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser } = useAuthStore();
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<TabRole>('penitip');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [penitipHistory, setPenitipHistory] = useState<PenitipHistoryItem[]>([]);
  const [jastiperHistory, setJastiperHistory] = useState<JastiperHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isPullToRefresh: boolean = false) => {
    if (!currentUser?.id) return;
    try {
      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const res = await jastipApi.getUserHistory(currentUser.id, 'all');
      if (res) {
        setPenitipHistory(res.penitip || []);
        setJastiperHistory(res.jastiper || []);
      }
    } catch (err) {
      console.warn('Gagal memuat riwayat transaksi:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser?.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Filtered lists
  const filteredPenitipList = useMemo(() => {
    return penitipHistory.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        item.lokasi?.toLowerCase().includes(q) ||
        item.sirkel?.nama_sirkel?.toLowerCase().includes(q) ||
        item.jastiper?.nama?.toLowerCase().includes(q) ||
        item.items?.some((i) => i.nama_barang.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (statusFilter === 'PAID') return item.is_all_paid;
      if (statusFilter === 'UNPAID') return !item.is_all_paid;
      return true;
    });
  }, [penitipHistory, searchQuery, statusFilter]);

  const filteredJastiperList = useMemo(() => {
    return jastiperHistory.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        item.lokasi?.toLowerCase().includes(q) ||
        item.sirkel?.nama_sirkel?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (statusFilter === 'PAID') return item.is_fully_settled;
      if (statusFilter === 'UNPAID') return !item.is_fully_settled;
      return true;
    });
  }, [jastiperHistory, searchQuery, statusFilter]);

  // Quick stats
  const totalPenitipSpending = useMemo(() => {
    return penitipHistory.reduce((acc, curr) => acc + (curr.total_bayar || 0), 0);
  }, [penitipHistory]);

  const totalJastiperRevenue = useMemo(() => {
    return jastiperHistory.reduce((acc, curr) => acc + (curr.total_pendapatan_jastip || 0), 0);
  }, [jastiperHistory]);

  const renderPenitipCard = (item: PenitipHistoryItem) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const isPendingProof = item.payment_proof?.status === 'PENDING';
    const isRejectedProof = item.payment_proof?.status === 'REJECTED';

    return (
      <Card
        key={item.sessionId}
        style={styles.historyCard}
        onPress={() =>
          navigation.navigate('SplitBillRecap', {
            sessionId: item.sessionId,
            lokasi: item.lokasi,
          })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.sirkelBadge}>
              <Text style={styles.sirkelBadgeText} numberOfLines={1}>
                {item.sirkel?.nama_sirkel || 'Sirkel'}
              </Text>
            </View>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>

          {item.is_all_paid ? (
            <View style={[styles.statusPill, { backgroundColor: colors.statusOpenBg }]}>
              <Text style={[styles.statusPillText, { color: colors.statusOpenText }]}>LUNAS</Text>
            </View>
          ) : isPendingProof ? (
            <View style={[styles.statusPill, { backgroundColor: colors.statusLockedBg }]}>
              <Text style={[styles.statusPillText, { color: colors.statusLockedText }]}>VERIFIKASI</Text>
            </View>
          ) : isRejectedProof ? (
            <View style={[styles.statusPill, { backgroundColor: colors.dangerLight }]}>
              <Text style={[styles.statusPillText, { color: colors.danger }]}>DITOLAK</Text>
            </View>
          ) : (
            <View style={[styles.statusPill, { backgroundColor: colors.statusLockedBg }]}>
              <Text style={[styles.statusPillText, { color: colors.statusLockedText }]}>BELUM LUNAS</Text>
            </View>
          )}
        </View>

        {/* Lokasi & Jastiper */}
        <View style={styles.storeRow}>
          <View style={styles.storeIconWrap}>
            <Store size={18} color={colors.primary} />
          </View>
          <View style={styles.storeInfo}>
            <Text style={styles.lokasiTitle} numberOfLines={1}>
              {item.lokasi}
            </Text>
            <Text style={styles.jastiperSub} numberOfLines={1}>
              Jastiper: <Text style={styles.jastiperName}>{item.jastiper?.nama || 'Teman'}</Text>
            </Text>
          </View>
        </View>

        {/* Items List Snippet */}
        <View style={styles.itemsDivider} />
        <View style={styles.itemsWrapper}>
          {item.items?.map((it) => (
            <View key={it.id} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                • {it.nama_barang}
                {it.catatan ? ` (${it.catatan})` : ''}
              </Text>
              <Text style={styles.itemPrice}>
                {it.harga_final !== null
                  ? `Rp ${(it.harga_final).toLocaleString('id-ID')}`
                  : 'Menunggu harga'}
              </Text>
            </View>
          ))}
          {item.tarif_jastip > 0 && (
            <View style={styles.itemRow}>
              <Text style={styles.itemFeeName}>• Ongkos Jastip</Text>
              <Text style={styles.itemFeePrice}>
                Rp {item.tarif_jastip.toLocaleString('id-ID')}
              </Text>
            </View>
          )}
        </View>

        {/* Card Footer: Total & Action */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>Total Tagihan</Text>
            <Text style={styles.totalAmount}>
              Rp {item.total_bayar.toLocaleString('id-ID')}
            </Text>
          </View>

          <View style={styles.detailBtn}>
            <Text style={styles.detailBtnText}>Lihat Struk</Text>
            <ChevronRight size={15} color={colors.primary} />
          </View>
        </View>
      </Card>
    );
  };

  const renderJastiperCard = (item: JastiperHistoryItem) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const isDone = item.status === 'COMPLETED';

    return (
      <Card
        key={item.sessionId}
        style={styles.historyCard}
        onPress={() =>
          navigation.navigate('SplitBillRecap', {
            sessionId: item.sessionId,
            lokasi: item.lokasi,
          })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.sirkelBadgeJastiper}>
              <Text style={styles.sirkelBadgeTextJastiper} numberOfLines={1}>
                {item.sirkel?.nama_sirkel || 'Sirkel'}
              </Text>
            </View>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>

          {item.is_fully_settled ? (
            <View style={[styles.statusPill, { backgroundColor: colors.statusOpenBg }]}>
              <Text style={[styles.statusPillText, { color: colors.statusOpenText }]}>SEMUA LUNAS</Text>
            </View>
          ) : isDone ? (
            <View style={[styles.statusPill, { backgroundColor: colors.statusLockedBg }]}>
              <Text style={[styles.statusPillText, { color: colors.statusLockedText }]}>ADA HUTANG</Text>
            </View>
          ) : (
            <View style={[styles.statusPill, { backgroundColor: colors.statusCompletedBg }]}>
              <Text style={[styles.statusPillText, { color: colors.statusCompletedText }]}>{item.status}</Text>
            </View>
          )}
        </View>

        {/* Lokasi Jastip */}
        <View style={styles.storeRow}>
          <View style={styles.storeIconWrap}>
            <ShoppingBag size={18} color={colors.primary} />
          </View>
          <View style={styles.storeInfo}>
            <Text style={styles.lokasiTitle} numberOfLines={1}>
              {item.lokasi}
            </Text>
            <Text style={styles.jastiperSub} numberOfLines={1}>
              {item.total_penitip} Penitip • {item.total_orders} Total Barang
            </Text>
          </View>
        </View>

        {/* Stats Grid in Card */}
        <View style={styles.statsGrid}>
          <View style={styles.statMiniCard}>
            <Text style={styles.statMiniLabel}>Total Belanjaan</Text>
            <Text style={styles.statMiniValue}>
              Rp {item.total_omset.toLocaleString('id-ID')}
            </Text>
          </View>
          <View style={styles.statMiniCard}>
            <Text style={styles.statMiniLabel}>Fee Jastip Kamu</Text>
            <Text style={styles.statMiniValueAccent}>
              Rp {item.total_pendapatan_jastip.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>Grand Total Transaksi</Text>
            <Text style={styles.totalAmount}>
              Rp {item.grand_total.toLocaleString('id-ID')}
            </Text>
          </View>

          <View style={styles.detailBtn}>
            <Text style={styles.detailBtnText}>Rincian Bill</Text>
            <ChevronRight size={15} color={colors.primary} />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <LinearGradientView colors={colors.bgGradient} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <Header
          title="Riwayat Transaksi"
          subtitle="Catatan titipan & sesi jastip kamu"
          onBack={() => navigation.goBack()}
        />

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
          {/* Top Summary Banner */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <View style={styles.summaryIconCircle}>
                {activeTab === 'penitip' ? (
                  <Wallet size={20} color={colors.primary} />
                ) : (
                  <TrendingUp size={20} color={colors.accent} />
                )}
              </View>
              <View>
                <Text style={styles.summaryTitle}>
                  {activeTab === 'penitip'
                    ? 'Total Titipan Kamu'
                    : 'Total Pendapatan Jastip'}
                </Text>
                <Text style={styles.summaryNumber}>
                  Rp{' '}
                  {(activeTab === 'penitip'
                    ? totalPenitipSpending
                    : totalJastiperRevenue
                  ).toLocaleString('id-ID')}
                </Text>
              </View>
            </View>
            <View style={styles.summaryCountBadge}>
              <Text style={styles.summaryCountText}>
                {activeTab === 'penitip'
                  ? `${penitipHistory.length} Transaksi`
                  : `${jastiperHistory.length} Sesi`}
              </Text>
            </View>
          </View>

          {/* Role Segmented Tabs (Penitip vs Jastiper) */}
          <View style={styles.segmentedTabWrap}>
            <TouchableOpacity
              style={[
                styles.segmentedTab,
                activeTab === 'penitip' && styles.segmentedTabActive,
              ]}
              onPress={() => setActiveTab('penitip')}
              activeOpacity={0.8}
            >
              <ShoppingBag
                size={16}
                color={
                  activeTab === 'penitip'
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.segmentedTabText,
                  activeTab === 'penitip' && styles.segmentedTabTextActive,
                ]}
              >
                Titipan Saya
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentedTab,
                activeTab === 'jastiper' && styles.segmentedTabActive,
              ]}
              onPress={() => setActiveTab('jastiper')}
              activeOpacity={0.8}
            >
              <Store
                size={16}
                color={
                  activeTab === 'jastiper'
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.segmentedTabText,
                  activeTab === 'jastiper' && styles.segmentedTabTextActive,
                ]}
              >
                Jastip Saya
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search size={16} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={
                activeTab === 'penitip'
                  ? 'Cari toko, barang, sirkel, jastiper...'
                  : 'Cari lokasi sesi atau sirkel...'
              }
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

          {/* Status Filter Chips */}
          <View style={styles.filterChipsRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                statusFilter === 'ALL' && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter('ALL')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === 'ALL' && styles.filterChipTextActive,
                ]}
              >
                Semua
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                statusFilter === 'PAID' && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter('PAID')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === 'PAID' && styles.filterChipTextActive,
                ]}
              >
                Lunas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                statusFilter === 'UNPAID' && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter('UNPAID')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === 'UNPAID' && styles.filterChipTextActive,
                ]}
              >
                Belum Lunas
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main List */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Memuat riwayat transaksi...</Text>
            </View>
          ) : activeTab === 'penitip' ? (
            filteredPenitipList.length > 0 ? (
              filteredPenitipList.map((item) => renderPenitipCard(item))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Receipt size={32} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Belum Ada Titipan</Text>
                <Text style={styles.emptySub}>
                  {searchQuery
                    ? 'Tidak ada riwayat yang cocok dengan pencarian kamu.'
                    : 'Kamu belum pernah nitip barang di sirkel manapun.'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => navigation.navigate('Home')}
                >
                  <Text style={styles.emptyActionBtnText}>Lihat Sirkel Aktif</Text>
                </TouchableOpacity>
              </View>
            )
          ) : filteredJastiperList.length > 0 ? (
            filteredJastiperList.map((item) => renderJastiperCard(item))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Store size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Belum Ada Sesi Jastip</Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? 'Tidak ada sesi yang cocok dengan pencarian kamu.'
                  : 'Buka sesi jastip di sirkel kamu dan dapatkan tip!'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.emptyActionBtnText}>Mulai Jastip</Text>
              </TouchableOpacity>
            </View>
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
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    summaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      ...colors.shadow,
    },
    summaryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    summaryIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryTitle: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    summaryNumber: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 2,
    },
    summaryCountBadge: {
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    summaryCountText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    segmentedTabWrap: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceSubtle,
      padding: 4,
      borderRadius: 12,
      marginBottom: 14,
    },
    segmentedTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 10,
      borderRadius: 8,
    },
    segmentedTabActive: {
      backgroundColor: colors.surface,
      ...colors.shadow,
    },
    segmentedTabText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    segmentedTabTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      height: 42,
      marginBottom: 12,
      ...colors.shadow,
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
      marginBottom: 16,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterChipTextActive: {
      color: colors.textInverse,
    },
    historyCard: {
      marginBottom: 14,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.surface,
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
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    sirkelBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      maxWidth: '60%',
    },
    sirkelBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    sirkelBadgeJastiper: {
      backgroundColor: colors.accentLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      maxWidth: '60%',
    },
    sirkelBadgeTextJastiper: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
    },
    statusPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    statusPillText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    dateText: {
      fontSize: 11,
      color: colors.textMuted,
    },

    storeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    storeIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    storeInfo: {
      flex: 1,
    },
    lokasiTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    jastiperSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    jastiperName: {
      fontWeight: '600',
      color: colors.primary,
    },
    itemsDivider: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginBottom: 10,
    },
    itemsWrapper: {
      marginBottom: 12,
      gap: 6,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    itemName: {
      fontSize: 12,
      color: colors.textPrimary,
      flex: 1,
      marginRight: 8,
    },
    itemPrice: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    itemFeeName: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    itemFeePrice: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    statMiniCard: {
      flex: 1,
      backgroundColor: colors.surfaceSubtle,
      padding: 10,
      borderRadius: 10,
    },
    statMiniLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    statMiniValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 2,
    },
    statMiniValueAccent: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.accentDark,
      marginTop: 2,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    totalLabel: {
      fontSize: 10,
      color: colors.textMuted,
      fontWeight: '500',
      textTransform: 'uppercase',
    },
    totalAmount: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 2,
    },
    detailBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
    },
    detailBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    loadingWrap: {
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    emptyState: {
      paddingVertical: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    emptySub: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 20,
    },
    emptyActionBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      ...colors.shadow,
    },
    emptyActionBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textInverse,
    },
  });
