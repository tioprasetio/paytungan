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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../stores';
import { useCircle } from '../hooks';
import { jastipApi } from '../api';
import { JastipSession } from '../types';
import { Header, Card, AvatarStack } from '../components/common';
import { useThemeColors, ThemeColors } from '../theme/colors';
import { Plus, KeyRound, Search, ChevronRight, X } from 'lucide-react-native';
import { LinearGradientView } from '../components/common/LinearGradientView';

const CIRCLE_THEMES = [
  { bg: '#EEF2FF', border: '#C7D2FE', text: '#4F46E5' },
  { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A' },
  { bg: '#FFF7ED', border: '#FED7AA', text: '#EA580C' },
  { bg: '#FAF5FF', border: '#E9D5FF', text: '#9333EA' },
  { bg: '#ECFEFF', border: '#A5F3FC', text: '#0891B2' },
];

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MyCircles'
>;
type FilterTab = 'ALL' | 'OWNER' | 'MEMBER';

export const MyCirclesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser } = useAuthStore();
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { circles, fetchUserCircles } = useCircle(currentUser?.id);

  const [activeSessions, setActiveSessions] = useState<JastipSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
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
        console.warn('Failed to refresh circles:', err);
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

  const ownerCirclesCount = useMemo(() => {
    return circles.filter(c =>
      c.members?.some(m => m.userId === currentUser?.id && m.role === 'OWNER'),
    ).length;
  }, [circles, currentUser?.id]);

  const memberCirclesCount = circles.length - ownerCirclesCount;

  // Filter based on tab and search query
  const filteredCircles = useMemo(() => {
    return circles.filter(c => {
      const isOwner = c.members?.some(
        m => m.userId === currentUser?.id && m.role === 'OWNER',
      );

      // Tab filter
      if (activeTab === 'OWNER' && !isOwner) return false;
      if (activeTab === 'MEMBER' && isOwner) return false;

      // Search filter (name or join code)
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = c.nama_sirkel.toLowerCase().includes(query);
        const matchCode = c.kode_join.toLowerCase().includes(query);
        return matchName || matchCode;
      }

      return true;
    });
  }, [circles, activeTab, searchQuery, currentUser?.id]);

  return (
    <LinearGradientView colors={colors.bgGradient} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Header
          title="Sirkel Saya"
          subtitle={`${circles.length} sirkel terdaftar`}
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
              placeholder="Cari nama sirkel atau kode join..."
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

          {/* Filter Pills */}
          <View style={styles.tabRow}>
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
                Semua ({circles.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === 'OWNER' && styles.tabPillActive,
              ]}
              onPress={() => setActiveTab('OWNER')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'OWNER' && styles.tabTextActive,
                ]}
              >
                Owner ({ownerCirclesCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === 'MEMBER' && styles.tabPillActive,
              ]}
              onPress={() => setActiveTab('MEMBER')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'MEMBER' && styles.tabTextActive,
                ]}
              >
                Anggota ({memberCirclesCount})
              </Text>
            </TouchableOpacity>
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

          {/* List of Circles */}
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
              />
            }
          >
            {filteredCircles.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  {searchQuery.trim().length > 0
                    ? 'Sirkel Tidak Ditemukan'
                    : activeTab === 'OWNER'
                    ? 'Belum Ada Sirkel Buatanmu'
                    : activeTab === 'MEMBER'
                    ? 'Belum Ada Sirkel yang Diikuti'
                    : 'Belum Punya Sirkel'}
                </Text>
                <Text style={styles.emptyText}>
                  {searchQuery.trim().length > 0
                    ? `Tidak ada sirkel yang cocok dengan kata kunci "${searchQuery}".`
                    : 'Buat sirkel baru untuk mulai belanja bareng teman atau minta kode join.'}
                </Text>
              </Card>
            ) : (
              filteredCircles.map((circle, index) => {
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
                    activeOpacity={0.85}
                  >
                    {/* Top Row: Avatar, Names, Badges, Code */}
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
                              {isOwner ? '👑 Owner' : '👥 Anggota'}
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

                    {/* Bottom Row: Avatars & Clean Action Pill */}
                    <View style={styles.cardFooterRow}>
                      <View style={styles.footerLeft}>
                        <AvatarStack
                          users={
                            circle.members?.map(m => ({
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
                        <ChevronRight size={14} color={colors.primary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
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
    container: {
      flex: 1,
      paddingHorizontal: 16,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
      paddingVertical: 0,
    },
    tabRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    tabPill: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabPillActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    tabText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
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
    listContent: {
      paddingBottom: 30,
    },
    emptyCard: {
      padding: 30,
      alignItems: 'center',
      marginTop: 20,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    upgradedCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow.shadowColor,
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
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      flex: 1,
    },
    codePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    codePillHash: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      marginRight: 1,
    },
    codePillText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
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
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    memberBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
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
    cardFooterRow: {
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      paddingTop: 10,
      marginTop: 12,
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
      color: colors.textSecondary,
    },
    enterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      gap: 2,
    },
    enterPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
  });
