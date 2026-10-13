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
import { useCircle, useBounty } from '../hooks';
import { Bounty } from '../types';
import {
  BountyCard,
  CreateBountyModal,
  BountyDetailModal,
} from '../components/bounty';
import { useThemeColors, ThemeColors } from '../theme/colors';
import { Coins, Search, Plus, Sparkles, X } from 'lucide-react-native';
import { LinearGradientView } from '../components/common/LinearGradientView';
import { Header } from '../components/common';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'BountyBoard'
>;
type FilterTab = 'ALL' | 'IN_PROGRESS' | 'MINE' | 'COMPLETED';

export const BountyBoardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser } = useAuthStore();
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const { circles, fetchUserCircles } = useCircle(currentUser?.id);
  const {
    bounties,
    isLoading,
    refresh: refreshBounties,
    createBounty,
    claimBounty,
    releaseBounty,
    completePurchase,
    submitPayment,
    finishBounty,
    cancelBounty,
  } = useBounty(undefined, currentUser?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateBountyVisible, setIsCreateBountyVisible] = useState(false);
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);

  const loadData = useCallback(
    async (isPullToRefresh: boolean = false) => {
      if (!currentUser?.id) return;
      try {
        if (isPullToRefresh) setRefreshing(true);
        await Promise.all([fetchUserCircles(), refreshBounties()]);
      } catch (err) {
        console.warn('Failed to load bounties:', err);
      } finally {
        setRefreshing(false);
      }
    },
    [currentUser?.id, fetchUserCircles, refreshBounties],
  );

  useFocusEffect(
    useCallback(() => {
      loadData(false);
    }, [loadData]),
  );

  // Statistics
  const openBounties = useMemo(
    () => bounties.filter(b => b.status === 'OPEN'),
    [bounties],
  );
  const totalPotentialCash = useMemo(
    () => openBounties.reduce((acc, b) => acc + (b.imbalan_bounty || 0), 0),
    [openBounties],
  );
  const myTasksCount = useMemo(
    () =>
      bounties.filter(
        b => b.creatorId === currentUser?.id || b.runnerId === currentUser?.id,
      ).length,
    [bounties, currentUser?.id],
  );

  // Filtered List
  const filteredBounties = useMemo(() => {
    return bounties
      .filter(b => {
        if (activeFilter === 'ALL') return b.status === 'OPEN';
        if (activeFilter === 'IN_PROGRESS')
          return ['TAKEN', 'BOUGHT'].includes(b.status);
        if (activeFilter === 'MINE') {
          return (
            b.creatorId === currentUser?.id || b.runnerId === currentUser?.id
          );
        }
        if (activeFilter === 'COMPLETED') return b.status === 'COMPLETED';
        return true;
      })
      .filter(b => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
          b.judul?.toLowerCase().includes(query) ||
          b.deskripsi?.toLowerCase().includes(query) ||
          b.lokasi_beli?.toLowerCase().includes(query) ||
          b.lokasi_tujuan?.toLowerCase().includes(query) ||
          b.circle?.nama_sirkel?.toLowerCase().includes(query) ||
          b.creator?.nama?.toLowerCase().includes(query)
        );
      });
  }, [bounties, activeFilter, searchQuery, currentUser?.id]);

  return (
    <LinearGradientView colors={colors.bgGradient} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <Header
          title="Papan Tugas Bounty"
          subtitle={`${openBounties.length} tugas live siap diambil`}
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
          {/* Hero Cash Opportunity Banner */}
          <View style={styles.statsCard}>
            <View style={styles.statsLeft}>
              <View style={styles.statsIcon}>
                <Coins size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.statsLabel}>Potensi Uang Saku Sirkel</Text>
                <Text style={styles.statsValue}>
                  Rp {totalPotentialCash.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>
            <View style={styles.statsRightBadge}>
              <Sparkles size={12} color={colors.primary} />
              <Text style={styles.statsRightBadgeText}>
                {openBounties.length} Tersedia
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search
              size={16}
              color={colors.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari obat, makanan, titik antar..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={15} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === 'ALL' && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter('ALL')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'ALL' && styles.filterChipTextActive,
                ]}
              >
                Aktif ({openBounties.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === 'IN_PROGRESS' && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter('IN_PROGRESS')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'IN_PROGRESS' && styles.filterChipTextActive,
                ]}
              >
                Berlangsung (
                {
                  bounties.filter(b => ['TAKEN', 'BOUGHT'].includes(b.status))
                    .length
                }
                )
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === 'MINE' && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter('MINE')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'MINE' && styles.filterChipTextActive,
                ]}
              >
                Tugas Saya ({myTasksCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === 'COMPLETED' && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter('COMPLETED')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'COMPLETED' && styles.filterChipTextActive,
                ]}
              >
                Selesai
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* List Content */}
          {isLoading && !refreshing ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : filteredBounties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Coins size={26} color="#D97706" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery
                  ? 'Tidak Ada Bounty Yang Cocok'
                  : activeFilter === 'ALL'
                  ? 'Belum Ada Tugas Yang Tersedia'
                  : activeFilter === 'MINE'
                  ? 'Kamu Belum Memiliki Tugas'
                  : 'Tidak Ada Tugas Pada Kategori Ini'}
              </Text>
              <Text style={styles.emptyText}>
                {activeFilter === 'ALL'
                  ? 'Sedang butuh titipan mendesak? Pasang bounty sekarang dan beri imbalan buat teman kost/kampusmu!'
                  : 'Gunakan fitur pencarian atau pasang permintaan baru.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setIsCreateBountyVisible(true)}
              >
                <Plus size={15} color="#4F46E5" />
                <Text style={styles.emptyActionBtnText}>
                  Pasang Bounty Baru
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {filteredBounties.map(bounty => (
                <BountyCard
                  key={bounty.id}
                  bounty={bounty}
                  currentUser={currentUser}
                  onPress={() => setSelectedBounty(bounty)}
                  onClaim={async b => {
                    await claimBounty(b.id);
                  }}
                  onAction={b => setSelectedBounty(b)}
                />
              ))}
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.postBtn}
          onPress={() => setIsCreateBountyVisible(true)}
          activeOpacity={0.88}
        >
          <Plus size={18} color="#FFF" />
          <Text style={styles.postBtnText}>Pasang Bounty</Text>
        </TouchableOpacity>

        {/* Modals */}
        <CreateBountyModal
          visible={isCreateBountyVisible}
          onClose={() => setIsCreateBountyVisible(false)}
          onSubmit={async data => {
            if (!currentUser?.id) return;
            await createBounty({ ...data, creatorId: currentUser.id });
          }}
          circles={circles}
        />

        <BountyDetailModal
          visible={!!selectedBounty}
          bounty={selectedBounty}
          currentUser={currentUser}
          onClose={() => setSelectedBounty(null)}
          onClaim={async b => {
            const updated = await claimBounty(b.id);
            setSelectedBounty(updated);
          }}
          onRelease={async b => {
            const updated = await releaseBounty(b.id);
            setSelectedBounty(updated);
          }}
          onCompletePurchase={async (b, price, uri) => {
            const updated = await completePurchase(b.id, price, uri);
            setSelectedBounty(updated);
          }}
          onSubmitPayment={async (b, uri) => {
            const updated = await submitPayment(b.id, uri);
            setSelectedBounty(updated);
          }}
          onFinish={async b => {
            const updated = await finishBounty(b.id);
            setSelectedBounty(updated);
          }}
          onCancel={async b => {
            const updated = await cancelBounty(b.id);
            setSelectedBounty(updated);
          }}
        />
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
    postBtn: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
      zIndex: 99,
    },
    postBtnText: {
      color: '#FFF',
      fontSize: 13,
      fontWeight: '700',
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    statsCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.primaryDark,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.primaryDark,
      marginBottom: 16,
    },
    statsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    statsIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    statsLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textInverse,
    },
    statsValue: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textInverse,
    },
    statsRightBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.textInverse,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statsRightBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.textPrimary,
      padding: 0,
    },
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: '#EEF2FF',
      borderColor: '#4F46E5',
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterChipTextActive: {
      color: '#4F46E5',
      fontWeight: '700',
    },
    loadingWrap: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingVertical: 32,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 8,
    },
    emptyIconCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#FEF3C7',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 16,
    },
    emptyActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#EEF2FF',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#C7D2FE',
    },
    emptyActionBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#4F46E5',
    },
    listWrap: {
      gap: 2,
    },
  });
