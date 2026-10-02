import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Share,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Header } from '../components/common/Header';
import {
  ReceiptSummary,
  UserRecapCard,
  PaymentInfoCard,
  PaymentProofModal,
} from '../components/splitBill';
import { useThemeColors, ThemeColors } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';
import { useSplitBill } from '../hooks/useSplitBill';
import { jastipApi } from '../api/jastip.api';
import { useAlert } from '../context/AlertContext';
import { UserBillDetail } from '../types';
import {
  Share2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Camera,
  RefreshCw,
  Users,
  Check,
} from 'lucide-react-native';
import { LinearGradientView } from '../components/common/LinearGradientView';

type SplitBillRecapRouteProp = RouteProp<RootStackParamList, 'SplitBillRecap'>;
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SplitBillRecap'
>;

export const SplitBillRecapScreen: React.FC = () => {
  const route = useRoute<SplitBillRecapRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const currentUser = useAuthStore(state => state.currentUser);
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { showConfirm, showError, showAlert } = useAlert();

  const { sessionId } = route.params;
  const {
    recap,
    isLoading,
    fetchRecap,
    toggleUserPaymentBatch,
    toggleItemPayment,
    uploadProof,
    verifyProof,
  } = useSplitBill(sessionId);

  const [completing, setCompleting] = useState(false);

  // Proof Modal State
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [proofModalMode, setProofModalMode] = useState<'UPLOAD' | 'REVIEW'>(
    'UPLOAD',
  );
  const [selectedUserBill, setSelectedUserBill] =
    useState<UserBillDetail | null>(null);

  useEffect(() => {
    fetchRecap();
  }, [fetchRecap]);

  const isBuyer = recap?.buyer?.id === currentUser?.id;
  const isCompleted = recap?.status === 'COMPLETED';
  const canEditPayment = isBuyer && !isCompleted;

  const handleShareWhatsApp = async () => {
    if (!recap) return;

    let message = `*REKAP SPLIT BILL JASTIP - ${recap.lokasi.toUpperCase()}*\n`;
    message += `Pembeli (Runner): ${recap.buyer.nama}\n`;
    if (recap.buyer.nama_bank && recap.buyer.nomor_rekening) {
      message += `Transfer ke: ${recap.buyer.nama_bank} - ${
        recap.buyer.nomor_rekening
      } (a/n ${recap.buyer.atas_nama || recap.buyer.nama})\n`;
    }
    message += `Tarif Jastip Flat: Rp ${recap.tarif_jastip_per_user.toLocaleString(
      'id-ID',
    )}/orang\n\n`;
    message += `*Rincian Tagihan per Teman:*\n`;

    recap.recap_per_user.forEach(u => {
      message += `\n*${u.nama}* (Total: Rp ${u.total_bayar.toLocaleString(
        'id-ID',
      )})\n`;
      u.items.forEach(it => {
        message += `  - ${it.nama_barang}: Rp ${it.harga_final.toLocaleString(
          'id-ID',
        )}\n`;
      });
      message += `  - Flat Jastip: Rp ${u.tarif_jastip.toLocaleString(
        'id-ID',
      )}\n`;
      message += `  Status: ${u.is_all_paid ? '[LUNAS]' : '[BELUM BAYAR]'}\n`;
    });

    message += `\n*Grand Total: Rp ${recap.grand_total.toLocaleString(
      'id-ID',
    )}*\n`;
    message += `Mohon segera transfer & unggah bukti pembayaran di aplikasi ya!`;

    try {
      await Share.share({ message });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleCompleteSession = () => {
    if (!currentUser?.id) return;
    showConfirm(
      'Selesaikan Sesi Jastip?',
      'Apakah kamu ingin menyelesaikan sesi belanja ini? Sesi akan ditutup dan dipindahkan ke arsip riwayat selesai.',
      async () => {
        try {
          setCompleting(true);
          await jastipApi.completeSession(sessionId, currentUser.id);
          fetchRecap();
          showAlert({
            title: 'Sesi Selesai',
            message:
              'Sesi belanja ini telah berhasil diselesaikan dan diarsipkan.',
            type: 'success',
            buttons: [
              {
                text: 'Kembali ke Beranda',
                style: 'primary',
                onPress: () => navigation.navigate('Home'),
              },
            ],
          });
        } catch (err: unknown) {
          showError(
            'Gagal Menyelesaikan Sesi',
            err instanceof Error ? err.message : 'Terjadi kesalahan',
          );
        } finally {
          setCompleting(false);
        }
      },
      undefined,
      'Selesaikan Sesi',
      'Batal',
    );
  };

  return (
    <LinearGradientView colors={colors.bgGradient} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <Header
          title="Rekap Split Bill"
          subtitle={recap?.lokasi ? `Lokasi: ${recap.lokasi}` : undefined}
          onBack={() => navigation.goBack()}
          transparent
          rightAction={
            <TouchableOpacity
              style={styles.headerShareBtn}
              onPress={handleShareWhatsApp}
              activeOpacity={0.7}
            >
              <Share2 size={17} color={colors.textPrimary} />
            </TouchableOpacity>
          }
        />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchRecap} />
          }
        >
          {isLoading && !recap ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Menghitung split bill...</Text>
            </View>
          ) : !recap ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>
                Rekap split bill belum tersedia.
              </Text>
            </View>
          ) : (
            <>
              {/* Top Quick Alert for Runner: Pending Payment Proofs to Verify */}
              {isBuyer &&
                (() => {
                  const pendingProofs = recap.recap_per_user.filter(
                    u => u.payment_proof?.status === 'PENDING',
                  );
                  if (pendingProofs.length === 0) return null;
                  return (
                    <View style={styles.pendingVerifyAlert}>
                      <View style={styles.pendingVerifyIcon}>
                        <Clock size={18} color="#B45309" />
                      </View>
                      <View style={styles.pendingVerifyTextWrap}>
                        <Text style={styles.pendingVerifyTitle}>
                          {pendingProofs.length} Bukti Transfer Perlu
                          Diverifikasi
                        </Text>
                        <Text style={styles.pendingVerifySub} numberOfLines={1}>
                          {pendingProofs.map(p => p.nama).join(', ')} sudah
                          transfer
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.pendingVerifyActionBtn}
                        onPress={() => {
                          setSelectedUserBill(pendingProofs[0]);
                          setProofModalMode('REVIEW');
                          setProofModalVisible(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <Check
                          size={13}
                          color="#FFFFFF"
                          style={styles.btnIconMargin}
                        />
                        <Text style={styles.pendingVerifyActionText}>
                          Periksa
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}

              {/* Top Quick Card for Penitip: Personal Bill & 1-Tap Upload */}
              {!isBuyer &&
                (() => {
                  const myBill = recap.recap_per_user.find(
                    u => u.userId === currentUser?.id,
                  );
                  if (!myBill) return null;
                  const proof = myBill.payment_proof;
                  return (
                    <View
                      style={[
                        styles.myQuickBillCard,
                        myBill.is_all_paid && styles.myQuickBillCardPaid,
                      ]}
                    >
                      <View style={styles.myQuickBillHeader}>
                        <View style={styles.myQuickBillInfo}>
                          <Text style={styles.myQuickBillTitle}>
                            Tagihan Pribadimu
                          </Text>
                          <Text style={styles.myQuickBillAmount}>
                            Rp {myBill.total_bayar.toLocaleString('id-ID')}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.quickStatusBadge,
                            myBill.is_all_paid
                              ? styles.quickStatusPaid
                              : proof?.status === 'PENDING'
                              ? styles.quickStatusPending
                              : styles.quickStatusUnpaid,
                          ]}
                        >
                          {myBill.is_all_paid ? (
                            <CheckCircle2
                              size={12}
                              color="#166534"
                              style={styles.statusBadgeIcon}
                            />
                          ) : proof?.status === 'PENDING' ? (
                            <Clock
                              size={12}
                              color="#92400E"
                              style={styles.statusBadgeIcon}
                            />
                          ) : (
                            <AlertCircle
                              size={12}
                              color="#991B1B"
                              style={styles.statusBadgeIcon}
                            />
                          )}
                          <Text
                            style={[
                              styles.quickStatusText,
                              myBill.is_all_paid
                                ? styles.quickStatusPaidText
                                : proof?.status === 'PENDING'
                                ? styles.quickStatusPendingText
                                : styles.quickStatusUnpaidText,
                            ]}
                          >
                            {myBill.is_all_paid
                              ? 'Lunas'
                              : proof?.status === 'PENDING'
                              ? 'Menunggu Konfirmasi'
                              : 'Belum Bayar'}
                          </Text>
                        </View>
                      </View>

                      {!myBill.is_all_paid && (
                        <TouchableOpacity
                          style={[
                            styles.myQuickUploadBtn,
                            proof && styles.myQuickUploadBtnSecondary,
                          ]}
                          onPress={() => {
                            setSelectedUserBill(myBill);
                            setProofModalMode('UPLOAD');
                            setProofModalVisible(true);
                          }}
                          activeOpacity={0.8}
                        >
                          {proof?.status === 'REJECTED' ? (
                            <RefreshCw
                              size={14}
                              color="#FFFFFF"
                              style={styles.btnIconMargin}
                            />
                          ) : proof ? (
                            <RefreshCw
                              size={14}
                              color={colors.primary}
                              style={styles.btnIconMargin}
                            />
                          ) : (
                            <Camera
                              size={14}
                              color="#FFFFFF"
                              style={styles.btnIconMargin}
                            />
                          )}
                          <Text
                            style={[
                              styles.myQuickUploadBtnText,
                              proof && styles.myQuickUploadBtnTextSecondary,
                            ]}
                          >
                            {proof?.status === 'REJECTED'
                              ? 'Unggah Ulang Bukti (Sebelumnya Ditolak)'
                              : proof
                              ? 'Perbarui / Cek Bukti Transfer'
                              : 'Unggah Bukti Transfer Sekarang'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })()}

              {/* Payment Destination (Runner Account Info) for Requesters */}
              {!isBuyer ? <PaymentInfoCard buyer={recap.buyer} /> : null}

              {/* Receipt and Collection Summary */}
              <ReceiptSummary recap={recap} />

              {/* Quick Command Dock (Replaces generic isolated buttons) */}
              <View style={styles.quickDock}>
                {/* Command 1: Share to WhatsApp */}
                <TouchableOpacity
                  style={styles.quickDockCardPrimary}
                  onPress={handleShareWhatsApp}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickIconCircleWhite}>
                    <Share2 size={16} color={colors.primary} />
                  </View>
                  <View style={styles.quickDockInfo}>
                    <Text style={styles.quickDockTitleLight}>
                      Bagikan Rekap
                    </Text>
                    <Text style={styles.quickDockSubLight}>
                      Kirim ke WhatsApp sirkel
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Command 2: Role-based Action (Complete / Status / Upload) */}
                {isBuyer ? (
                  isCompleted ? (
                    <View style={styles.quickDockCardCompleted}>
                      <View style={styles.quickIconCircleTint}>
                        <CheckCircle2 size={16} color="#059669" />
                      </View>
                      <View style={styles.quickDockInfo}>
                        <Text style={styles.quickDockTitleCompleted}>
                          Sesi Selesai
                        </Text>
                        <Text style={styles.quickDockSubDark}>
                          Telah diarsipkan
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.quickDockCardSecondary}
                      onPress={handleCompleteSession}
                      activeOpacity={0.85}
                      disabled={completing}
                    >
                      <View style={styles.quickIconCircleTint}>
                        <CheckCircle2 size={16} color={colors.primary} />
                      </View>
                      <View style={styles.quickDockInfo}>
                        <Text style={styles.quickDockTitleDark}>
                          {completing ? 'Menyimpan...' : 'Selesaikan'}
                        </Text>
                        <Text style={styles.quickDockSubDark}>
                          Tutup & arsipkan sesi
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )
                ) : (
                  (() => {
                    const myBill = recap.recap_per_user.find(
                      u => u.userId === currentUser?.id,
                    );
                    if (!myBill) return null;
                    const proof = myBill.payment_proof;

                    if (myBill.is_all_paid) {
                      return (
                        <View style={styles.quickDockCardCompleted}>
                          <View style={styles.quickIconCircleTint}>
                            <CheckCircle2 size={16} color="#059669" />
                          </View>
                          <View style={styles.quickDockInfo}>
                            <Text style={styles.quickDockTitleCompleted}>
                              Tagihan Lunas
                            </Text>
                            <Text style={styles.quickDockSubDark}>
                              Terverifikasi
                            </Text>
                          </View>
                        </View>
                      );
                    }

                    return (
                      <TouchableOpacity
                        style={styles.quickDockCardSecondary}
                        onPress={() => {
                          setSelectedUserBill(myBill);
                          setProofModalMode('UPLOAD');
                          setProofModalVisible(true);
                        }}
                        activeOpacity={0.85}
                      >
                        <View style={styles.quickIconCircleTint}>
                          <Camera size={16} color={colors.primary} />
                        </View>
                        <View style={styles.quickDockInfo}>
                          <Text style={styles.quickDockTitleDark}>
                            {proof ? 'Bukti Bayar' : 'Upload Bukti'}
                          </Text>
                          <Text
                            style={styles.quickDockSubDark}
                            numberOfLines={1}
                          >
                            {proof?.status === 'REJECTED'
                              ? 'Kirim ulang bukti'
                              : proof
                              ? 'Cek bukti transfer'
                              : 'Kirim bukti foto'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })()
                )}
              </View>

              {/* Per-User Breakdown List */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionTitleIconRow}>
                    <Users
                      size={16}
                      color={colors.primary}
                      style={styles.sectionTitleIcon}
                    />
                    <Text style={styles.sectionTitle}>
                      Rincian per Teman ({recap.recap_per_user.length})
                    </Text>
                  </View>
                  {isCompleted && (
                    <View style={styles.completedPill}>
                      <CheckCircle2
                        size={11}
                        color={colors.textSecondary}
                        style={styles.btnIconMargin}
                      />
                      <Text style={styles.completedPillText}>
                        Selesai (Arsip)
                      </Text>
                    </View>
                  )}
                </View>
                {canEditPayment && (
                  <Text style={styles.buyerHint}>
                    Verifikasi via bukti transfer atau tap "Tandai Lunas"
                  </Text>
                )}
              </View>

              {recap.recap_per_user.map(userBill => (
                <UserRecapCard
                  key={userBill.userId}
                  bill={userBill}
                  isBuyer={canEditPayment}
                  isCurrentUser={userBill.userId === currentUser?.id}
                  onToggleUserPaid={() =>
                    canEditPayment &&
                    toggleUserPaymentBatch(
                      userBill.userId,
                      userBill.is_all_paid,
                    )
                  }
                  onToggleItemPaid={(itemId, curr) =>
                    canEditPayment && toggleItemPayment(itemId, curr)
                  }
                  onViewProof={bill => {
                    setSelectedUserBill(bill);
                    setProofModalMode('REVIEW');
                    setProofModalVisible(true);
                  }}
                  onUploadProof={bill => {
                    setSelectedUserBill(bill);
                    setProofModalMode('UPLOAD');
                    setProofModalVisible(true);
                  }}
                />
              ))}
            </>
          )}
        </ScrollView>

        {/* Payment Proof Upload & Verification Modal */}
        {recap && (
          <PaymentProofModal
            visible={proofModalVisible}
            onClose={() => setProofModalVisible(false)}
            mode={proofModalMode}
            sessionId={sessionId}
            currentUserId={currentUser?.id || 0}
            buyerName={recap.buyer.nama}
            bankName={recap.buyer.nama_bank}
            bankAccount={recap.buyer.nomor_rekening}
            bankHolder={recap.buyer.atas_nama}
            totalBill={
              proofModalMode === 'UPLOAD'
                ? recap.recap_per_user.find(u => u.userId === currentUser?.id)
                    ?.total_bayar
                : selectedUserBill?.total_bayar
            }
            targetUserBill={
              selectedUserBill
                ? recap.recap_per_user.find(
                    u => u.userId === selectedUserBill.userId,
                  ) || selectedUserBill
                : undefined
            }
            onConfirmApprove={async targetUserId => {
              if (!currentUser?.id) return;
              await verifyProof({
                verifierUserId: currentUser.id,
                targetUserId,
                action: 'APPROVE',
              });
              setSelectedUserBill(prev => {
                if (!prev || prev.userId !== targetUserId) return prev;
                return {
                  ...prev,
                  is_all_paid: true,
                  items: prev.items.map(it => ({ ...it, status_bayar: true })),
                  payment_proof: prev.payment_proof
                    ? { ...prev.payment_proof, status: 'APPROVED' }
                    : null,
                };
              });
            }}
            onConfirmReject={async (targetUserId, alasan) => {
              if (!currentUser?.id) return;
              await verifyProof({
                verifierUserId: currentUser.id,
                targetUserId,
                action: 'REJECT',
                alasanTolak: alasan,
              });
              setSelectedUserBill(prev => {
                if (!prev || prev.userId !== targetUserId) return prev;
                return {
                  ...prev,
                  payment_proof: prev.payment_proof
                    ? {
                        ...prev.payment_proof,
                        status: 'REJECTED',
                        alasan_tolak: alasan,
                      }
                    : null,
                };
              });
            }}
            onUploadSubmit={async (catatanText, base64Img) => {
              if (!currentUser?.id) return;
              await uploadProof({
                userId: currentUser.id,
                image_base64: base64Img,
                catatan: catatanText,
              });
            }}
          />
        )}
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
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    centerContainer: {
      paddingVertical: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      color: colors.textSecondary,
      fontSize: 13,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '600',
    },

    // Top Pending Verification Alert (Crisp hairline & soft amber glow)
    pendingVerifyAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFBEB',
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.25)',
      borderRadius: 16,
      padding: 13,
      marginBottom: 14,
      gap: 10,
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 1,
    },
    pendingVerifyIcon: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: '#FEF3C7',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pendingVerifyTextWrap: {
      flex: 1,
    },
    pendingVerifyTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: '#92400E',
    },
    pendingVerifySub: {
      fontSize: 11,
      color: '#B45309',
      marginTop: 2,
    },
    pendingVerifyActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#D97706',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 9,
    },
    pendingVerifyActionText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
    },

    // Personal Bill Card
    myQuickBillCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      shadowColor: colors.shadow.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    myQuickBillCardPaid: {
      borderColor: 'rgba(16, 185, 129, 0.25)',
      backgroundColor: colors.surfaceSubtle,
    },
    myQuickBillHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    myQuickBillInfo: {
      flex: 1,
    },
    myQuickBillTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    myQuickBillAmount: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.primary,
      marginTop: 2,
      letterSpacing: -0.3,
    },
    quickStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 9,
      paddingVertical: 4.5,
      borderRadius: 7,
      gap: 4,
    },
    statusBadgeIcon: {
      marginRight: 2,
    },
    quickStatusPaid: {
      backgroundColor: '#DCFCE7',
    },
    quickStatusPending: {
      backgroundColor: '#FEF3C7',
    },
    quickStatusUnpaid: {
      backgroundColor: '#FEE2E2',
    },
    quickStatusText: {
      fontSize: 11,
      fontWeight: '700',
    },
    quickStatusPaidText: {
      color: '#166534',
    },
    quickStatusPendingText: {
      color: '#92400E',
    },
    quickStatusUnpaidText: {
      color: '#991B1B',
    },
    myQuickUploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 11,
      borderRadius: 11,
      justifyContent: 'center',
    },
    myQuickUploadBtnSecondary: {
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    myQuickUploadBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    myQuickUploadBtnTextSecondary: {
      color: colors.primary,
    },

    // Quick Command Dock (Replaces isolated boxy buttons)
    quickDock: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 18,
    },
    quickDockCardPrimary: {
      flex: 1.1,
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
    quickDockCardCompleted: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.25)',
      gap: 8,
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
    quickDockTitleCompleted: {
      fontSize: 13,
      fontWeight: '800',
      color: '#166534',
    },

    // Per-User Breakdown List Header
    sectionHeader: {
      marginBottom: 12,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    sectionTitleIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionTitleIcon: {
      marginRight: 6,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    buyerHint: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 16,
      marginTop: 2,
    },
    completedPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    completedPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    btnIconMargin: {
      marginRight: 4,
    },
  });
