import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Header, Badge, Button } from '../components/common';
import { BlindCartItem, AddItemModal, SessionTimer } from '../components/jastip';
import { useThemeColors, ThemeColors } from '../theme/colors';
import { useAuthStore } from '../stores';
import { useJastipSession } from '../hooks';
import { useAlert } from '../context/AlertContext';

type JastipSessionRouteProp = RouteProp<RootStackParamList, 'JastipSession'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'JastipSession'>;

export const JastipSessionScreen: React.FC = () => {
  const route = useRoute<JastipSessionRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const currentUser = useAuthStore((state) => state.currentUser);
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { showConfirm, showError, showWarning } = useAlert();

  const { sessionId, lokasi } = route.params;

  const {
    currentSession,
    items,
    isLoading,
    loadSession,
    addItem,
    removeItem,
    extendTime,
    lockSession,
  } = useJastipSession(sessionId, currentUser?.id);

  const [modalVisible, setModalVisible] = useState(false);
  const [locking, setLocking] = useState(false);
  const [extending, setExtending] = useState(false);
  const [isTimeExpired, setIsTimeExpired] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSession();
    }, [loadSession])
  );

  const isBuyer = currentSession?.creatorId === currentUser?.id;
  const isSessionOpen = currentSession?.status === 'OPEN';
  const isSessionLocked = currentSession?.status === 'LOCKED';
  const isSessionCompleted = currentSession?.status === 'COMPLETED';

  useEffect(() => {
    if (!currentSession?.waktu_tutup || !isSessionOpen) {
      setIsTimeExpired(false);
      return;
    }

    const checkTime = () => {
      const expired = new Date(currentSession.waktu_tutup!).getTime() <= Date.now();
      setIsTimeExpired(expired);
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [currentSession?.waktu_tutup, isSessionOpen]);

  // Calculate totals and distinct requesters
  const uniqueRequesters = new Set(
    items.filter((it) => it.userId !== currentSession?.creatorId).map((it) => it.userId)
  );
  const requestersCount = uniqueRequesters.size;
  const estimatedErrandEarnings = requestersCount * (currentSession?.tarif_jastip || 0);

  const totalItemCost = items.reduce((acc, it) => acc + (it.harga_final || 0), 0);
  const myItems = items.filter((it) => it.userId === currentUser?.id);
  const myItemCost = myItems.reduce((acc, it) => acc + (it.harga_final || 0), 0);
  const myShare = isBuyer
    ? 0
    : myItemCost + (myItems.length > 0 ? (currentSession?.tarif_jastip || 0) : 0);

  const handleExtendTime = (mins: number) => {
    showConfirm(
      'Perpanjang Waktu Belanja?',
      `Apakah kamu ingin menambah waktu buka keranjang selama +${mins} menit agar teman sirkel bisa terus menitip?`,
      async () => {
        try {
          setExtending(true);
          await extendTime(mins);
        } catch (err: unknown) {
          showError('Gagal Memperpanjang Waktu', err instanceof Error ? err.message : 'Gagal memperpanjang waktu');
        } finally {
          setExtending(false);
        }
      },
      undefined,
      `+${mins} Menit`,
      'Batal'
    );
  };

  const handleLock = () => {
    showConfirm(
      'Kunci Sesi Keranjang Bersama?',
      'Setelah dikunci, anggota sirkel tidak dapat menambah atau mengubah pesanan titipan.',
      async () => {
        try {
          setLocking(true);
          await lockSession();
          // Navigate to input prices screen for buyer
          navigation.navigate('InputPrices', {
            sessionId,
            lokasi: currentSession?.lokasi || lokasi,
          });
        } catch (err: unknown) {
          showError('Gagal Mengunci Sesi', err instanceof Error ? err.message : 'Gagal mengunci sesi');
        } finally {
          setLocking(false);
        }
      },
      undefined,
      'Kunci Sesi',
      'Batal',
      true
    );
  };

  const handleAddItem = async (nama_barang: string, catatan?: string) => {
    if (isTimeExpired) {
      showWarning(
        'Waktu Titip Habis',
        'Waktu menitip pesanan telah habis. Minta pembeli untuk memperpanjang sesi belanja.'
      );
      return;
    }
    await addItem(nama_barang, catatan);
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeItem(itemId);
    } catch (err: unknown) {
      showError('Gagal Menghapus Barang', err instanceof Error ? err.message : 'Failed to remove item');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Keranjang"
        subtitle={currentSession?.lokasi || lokasi}
        onBack={() => navigation.goBack()}
        rightAction={currentSession ? <Badge status={currentSession.status} /> : null}
      />

      <View style={styles.container}>
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Radial Countdown Timer */}
              {isSessionOpen ? (
                <SessionTimer
                  waktuTutup={currentSession?.waktu_tutup}
                  label="menitipkan pesanan barang"
                  isLocked={!isSessionOpen}
                  isBuyer={isBuyer}
                  onExtendTime={handleExtendTime}
                  extending={extending}
                />
              ) : null}

              {/* Errand Fee Info Pill */}
              <View style={styles.feeBanner}>
                <View>
                  <Text style={styles.feeTitle}>Biaya Jastip (Flat)</Text>
                  <Text style={styles.feeSubtitle}>
                    {isBuyer ? 'Pendapatan flat per penitip' : 'Dikenakan flat per penitip'}
                  </Text>
                </View>
                <Text style={styles.feeAmount}>
                  Rp {currentSession?.tarif_jastip.toLocaleString('id-ID') || '0'}
                </Text>
              </View>

              {/* Items List Heading */}
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>
                  Permintaan Barang ({items.length})
                </Text>
                <View style={styles.liveTag}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>Keranjang</Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            isLoading && items.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Perbarui Keranjang...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyTitle}>Keranjang Masih Kosong</Text>
                <Text style={styles.emptySub}>
                  {isSessionOpen
                    ? isBuyer
                      ? 'Menunggu teman-teman sirkel menitip pesanan...'
                      : 'Tekan tombol di bawah untuk menambah titipan barang kamu!'
                    : 'Belum ada barang yang dititipkan pada sesi ini.'}
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <BlindCartItem
              item={item}
              currentUserId={currentUser?.id || 0}
              isBuyer={isBuyer}
              canRemove={isSessionOpen}
              onRemove={handleRemoveItem}
            />
          )}
          contentContainerStyle={styles.listContent}
        />

        {/* Live Total & Split Calculation Summary */}
        {items.length > 0 && (
          <View style={styles.splitSummaryCard}>
            <View style={styles.splitRow}>
              <Text style={styles.splitLabel}>
                {isBuyer ? 'Total Belanja Titipan:' : 'Total Belanja Sirkel:'}
              </Text>
              <Text style={styles.splitValue}>
                {totalItemCost > 0
                  ? `Rp ${totalItemCost.toLocaleString('id-ID')}`
                  : 'Menunggu struk kasir'}
              </Text>
            </View>
            <View style={[styles.splitRow, styles.splitRowTopSpace]}>
              <Text style={styles.splitLabel}>
                {isBuyer ? `Fee Jastip Kamu (${requestersCount} penitip):` : 'Tagihan Kamu:'}
              </Text>
              <Text style={isBuyer ? styles.buyerEarningValue : styles.myShareValue}>
                {isBuyer
                  ? `+Rp ${estimatedErrandEarnings.toLocaleString('id-ID')}`
                  : myShare > 0
                    ? `Rp ${myShare.toLocaleString('id-ID')}`
                    : myItems.length > 0
                      ? `${myItems.length} item (+Rp ${(currentSession?.tarif_jastip || 0).toLocaleString('id-ID')})`
                      : 'Rp 0'}
              </Text>
            </View>
          </View>
        )}

        {/* Sticky Action Panel */}
        <View style={styles.bottomBar}>
          {isSessionOpen ? (
            isBuyer ? (
              <TouchableOpacity
                style={[styles.lockSessionBtn, locking && styles.btnDisabled]}
                disabled={locking}
                onPress={handleLock}
              >
                <Text style={styles.lockSessionBtnText}>
                  {locking ? 'Mengunci...' : 'Kunci Keranjang (Lock Session)'}
                </Text>
              </TouchableOpacity>
            ) : isTimeExpired ? (
              <TouchableOpacity
                style={[styles.requestItemBtn, styles.expiredRequestBtn]}
                onPress={() =>
                  showWarning(
                    'Waktu Titip Habis',
                    'Waktu menitip pesanan telah habis. Kamu bisa meminta pembeli (runner) untuk memperpanjang waktu jika masih belanja.'
                  )
                }
              >
                <Text style={styles.expiredRequestBtnText}>
                  Waktu Titip Habis (Menunggu Runner)
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.requestItemBtn}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.requestItemBtnText}>
                  + Titip Barang (Add Item Request)
                </Text>
              </TouchableOpacity>
            )
          ) : isSessionLocked ? (
            <View style={styles.actionRow}>
              {isBuyer ? (
                <Button
                  title="Input Harga Struk"
                  variant="primary"
                  onPress={() =>
                    navigation.navigate('InputPrices', {
                      sessionId,
                      lokasi: currentSession?.lokasi || lokasi,
                    })
                  }
                  style={styles.buyerLeftBtn}
                />
              ) : null}
              <Button
                title="Rekap Split Bill"
                variant="secondary"
                onPress={() =>
                  navigation.navigate('SplitBillRecap', {
                    sessionId,
                    lokasi: currentSession?.lokasi || lokasi,
                  })
                }
                style={styles.fullFlexBtn}
              />
            </View>
          ) : isSessionCompleted ? (
            <Button
              title="Lihat Rekap Pembayaran & Tagihan"
              variant="secondary"
              size="lg"
              onPress={() =>
                navigation.navigate('SplitBillRecap', {
                  sessionId,
                  lokasi: currentSession?.lokasi || lokasi,
                })
              }
            />
          ) : null}
        </View>
      </View>

      <AddItemModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleAddItem}
      />
    </SafeAreaView>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
    },
    feeBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 16,
      marginTop: 6,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    feeTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    feeSubtitle: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    feeAmount: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.primary,
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      marginBottom: 8,
    },
    listTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    liveTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
      marginRight: 5,
    },
    liveText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accentDark,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
    },
    loadingContainer: {
      paddingVertical: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 13,
      color: colors.textSecondary,
    },
    emptyContainer: {
      paddingVertical: 36,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    emptyIcon: {
      fontSize: 44,
      marginBottom: 10,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    emptySub: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    splitSummaryCard: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    splitRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    splitRowTopSpace: {
      marginTop: 4,
    },
    splitLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    splitValue: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    myShareValue: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.accentDark,
    },
    buyerEarningValue: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.primary,
    },
    bottomBar: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    actionColumn: {
      flexDirection: 'column',
    },
    actionRow: {
      flexDirection: 'row',
    },
    lockSessionBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },
    btnDisabled: {
      opacity: 0.7,
    },
    lockSessionBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    requestItemBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    expiredRequestBtn: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.warningLight,
    },
    expiredRequestBtnText: {
      color: colors.warning,
      fontSize: 14,
      fontWeight: '800',
    },
    buyerAddReqBtn: {
      marginTop: 8,
      backgroundColor: colors.surfaceSubtle,
    },
    buyerAddReqText: {
      color: colors.primary,
    },
    requestItemBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    buyerLeftBtn: {
      flex: 1,
      marginRight: 8,
    },
    fullFlexBtn: {
      flex: 1,
    },
  });
