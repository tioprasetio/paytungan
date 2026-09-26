import React, { useEffect, useState } from 'react';
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
import { Button } from '../components/common/Button';
import { ReceiptSummary, UserRecapCard, PaymentInfoCard, PaymentProofModal } from '../components/splitBill';
import { Colors } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';
import { useSplitBill } from '../hooks/useSplitBill';
import { jastipApi } from '../api/jastip.api';
import { useAlert } from '../context/AlertContext';
import { UserBillDetail } from '../types';

type SplitBillRecapRouteProp = RouteProp<RootStackParamList, 'SplitBillRecap'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SplitBillRecap'>;

export const SplitBillRecapScreen: React.FC = () => {
  const route = useRoute<SplitBillRecapRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const currentUser = useAuthStore((state) => state.currentUser);
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
  const [proofModalMode, setProofModalMode] = useState<'UPLOAD' | 'REVIEW'>('UPLOAD');
  const [selectedUserBill, setSelectedUserBill] = useState<UserBillDetail | null>(null);

  useEffect(() => {
    fetchRecap();
  }, [fetchRecap]);

  const isBuyer = recap?.buyer?.id === currentUser?.id;
  const isCompleted = recap?.status === 'COMPLETED';
  const canEditPayment = isBuyer && !isCompleted;

  const handleShareWhatsApp = async () => {
    if (!recap) return;

    let message = `*🧾 REKAP SPLIT BILL JASTIP - ${recap.lokasi.toUpperCase()}*\n`;
    message += `Pembeli (Runner): ${recap.buyer.nama}\n`;
    if (recap.buyer.nama_bank && recap.buyer.nomor_rekening) {
      message += `Transfer ke: ${recap.buyer.nama_bank} - ${recap.buyer.nomor_rekening} (a/n ${recap.buyer.atas_nama || recap.buyer.nama})\n`;
    }
    message += `Tarif Jastip Flat: Rp ${recap.tarif_jastip_per_user.toLocaleString('id-ID')}/orang\n\n`;
    message += `*Rincian Tagihan per Teman:*\n`;

    recap.recap_per_user.forEach((u) => {
      message += `\n👤 *${u.nama}* (Total: Rp ${u.total_bayar.toLocaleString('id-ID')})\n`;
      u.items.forEach((it) => {
        message += `  - ${it.nama_barang}: Rp ${it.harga_final.toLocaleString('id-ID')}\n`;
      });
      message += `  - Flat Jastip: Rp ${u.tarif_jastip.toLocaleString('id-ID')}\n`;
      message += `  Status: ${u.is_all_paid ? '✅ LUNAS' : '⏳ BELUM BAYAR'}\n`;
    });

    message += `\n*Grand Total: Rp ${recap.grand_total.toLocaleString('id-ID')}*\n`;
    message += `Mohon segera transfer & upload bukti di aplikasi ya! 🙏`;

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
            title: 'Sesi Selesai! 🎉',
            message: 'Sesi belanja ini telah berhasil diselesaikan dan diarsipkan.',
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
            err instanceof Error ? err.message : 'Terjadi kesalahan'
          );
        } finally {
          setCompleting(false);
        }
      },
      undefined,
      'Selesaikan Sesi',
      'Batal'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Rekap Split Bill"
        subtitle={recap?.lokasi ? `Lokasi: ${recap.lokasi}` : 'Memuat...'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchRecap} />}
      >
        {isLoading && !recap ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Menghitung split bill...</Text>
          </View>
        ) : !recap ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Rekap split bill belum tersedia.</Text>
          </View>
        ) : (
          <>
            {/* Top Quick Alert for Runner: Pending Payment Proofs to Verify */}
            {isBuyer && (() => {
              const pendingProofs = recap.recap_per_user.filter((u) => u.payment_proof?.status === 'PENDING');
              if (pendingProofs.length === 0) return null;
              return (
                <View style={styles.pendingVerifyAlert}>
                  <View style={styles.pendingVerifyIcon}>
                    <Text style={styles.pendingVerifyEmoji}>⚡</Text>
                  </View>
                  <View style={styles.pendingVerifyTextWrap}>
                    <Text style={styles.pendingVerifyTitle}>
                      {pendingProofs.length} Bukti Transfer Perlu Diverifikasi!
                    </Text>
                    <Text style={styles.pendingVerifySub} numberOfLines={1}>
                      {pendingProofs.map((p) => p.nama).join(', ')} sudah transfer
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
                    <Text style={styles.pendingVerifyActionText}>Periksa</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}

            {/* Top Quick Card for Penitip: Personal Bill & 1-Tap Upload */}
            {!isBuyer && (() => {
              const myBill = recap.recap_per_user.find((u) => u.userId === currentUser?.id);
              if (!myBill) return null;
              const proof = myBill.payment_proof;
              return (
                <View style={[styles.myQuickBillCard, myBill.is_all_paid && styles.myQuickBillCardPaid]}>
                  <View style={styles.myQuickBillHeader}>
                    <View style={styles.myQuickBillInfo}>
                      <Text style={styles.myQuickBillTitle}>Total Tagihan Pribadimu</Text>
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
                          ? '✅ Lunas'
                          : proof?.status === 'PENDING'
                            ? '⏳ Menunggu Konfirmasi'
                            : '⏳ Belum Bayar'}
                      </Text>
                    </View>
                  </View>

                  {!myBill.is_all_paid && (
                    <TouchableOpacity
                      style={[styles.myQuickUploadBtn, proof && styles.myQuickUploadBtnSecondary]}
                      onPress={() => {
                        setSelectedUserBill(myBill);
                        setProofModalMode('UPLOAD');
                        setProofModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.myQuickUploadBtnText,
                          proof && styles.myQuickUploadBtnTextSecondary,
                        ]}
                      >
                        {proof?.status === 'REJECTED'
                          ? '🔄 Unggah Ulang Bukti (Sebelumnya Ditolak)'
                          : proof
                            ? '🔄 Perbarui / Cek Bukti Transfer'
                            : '📸 Upload Bukti Transfer Sekarang'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}

            {/* Payment Destination (Runner Account Info) for Requesters */}
            {!isBuyer ? (
              <PaymentInfoCard buyer={recap.buyer} />
            ) : null}

            {/* Receipt and Collection Summary */}
            <ReceiptSummary recap={recap} />

            {/* Share to WhatsApp Group CTA */}
            <Button
              title="Bagikan Rincian ke WhatsApp Sirkel"
              variant="primary"
              size="lg"
              onPress={handleShareWhatsApp}
              style={styles.shareBtn}
            />

            {/* Per-User Breakdown List */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>
                  👥 Rincian per Teman ({recap.recap_per_user.length})
                </Text>
                {isCompleted && (
                  <View style={styles.completedPill}>
                    <Text style={styles.completedPillText}>Selesai (Arsip)</Text>
                  </View>
                )}
              </View>
              {canEditPayment && (
                <Text style={styles.buyerHint}>
                  *Verifikasi via bukti transfer atau tap "Tandai Lunas"
                </Text>
              )}
            </View>

            {recap.recap_per_user.map((userBill) => (
              <UserRecapCard
                key={userBill.userId}
                bill={userBill}
                isBuyer={canEditPayment}
                isCurrentUser={userBill.userId === currentUser?.id}
                onToggleUserPaid={() =>
                  canEditPayment && toggleUserPaymentBatch(userBill.userId, userBill.is_all_paid)
                }
                onToggleItemPaid={(itemId, curr) => canEditPayment && toggleItemPayment(itemId, curr)}
                onViewProof={(bill) => {
                  setSelectedUserBill(bill);
                  setProofModalMode('REVIEW');
                  setProofModalVisible(true);
                }}
                onUploadProof={(bill) => {
                  setSelectedUserBill(bill);
                  setProofModalMode('UPLOAD');
                  setProofModalVisible(true);
                }}
              />
            ))}

            {/* Complete Session Action Button for Buyer (Only if active) */}
            {isBuyer && !isCompleted ? (
              <Button
                title={completing ? 'Menyelesaikan...' : 'Tandai Sesi Jastip Selesai'}
                variant="secondary"
                size="md"
                loading={completing}
                onPress={handleCompleteSession}
                style={styles.completeBtn}
              />
            ) : isCompleted ? (
              <View style={styles.completedBanner}>
                <Text style={styles.completedBannerText}>
                  Sesi jastip ini telah selesai dan diarsipkan.
                </Text>
              </View>
            ) : null}
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
              ? recap.recap_per_user.find((u) => u.userId === currentUser?.id)?.total_bayar
              : selectedUserBill?.total_bayar
          }
          targetUserBill={
            selectedUserBill
              ? recap.recap_per_user.find((u) => u.userId === selectedUserBill.userId) || selectedUserBill
              : undefined
          }
          onConfirmApprove={async (targetUserId) => {
            if (!currentUser?.id) return;
            await verifyProof({
              verifierUserId: currentUser.id,
              targetUserId,
              action: 'APPROVE',
            });
            setSelectedUserBill((prev) => {
              if (!prev || prev.userId !== targetUserId) return prev;
              return {
                ...prev,
                is_all_paid: true,
                items: prev.items.map((it) => ({ ...it, status_bayar: true })),
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
            setSelectedUserBill((prev) => {
              if (!prev || prev.userId !== targetUserId) return prev;
              return {
                ...prev,
                payment_proof: prev.payment_proof
                  ? { ...prev.payment_proof, status: 'REJECTED', alasan_tolak: alasan }
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
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    paddingVertical: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  shareBtn: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  buyerHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  completedPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  completedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  completeBtn: {
    marginTop: 20,
    borderColor: '#C7D2FE',
    backgroundColor: Colors.primaryLight,
  },
  completedBanner: {
    marginTop: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  completedBannerText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  pendingVerifyAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  pendingVerifyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingVerifyEmoji: {
    fontSize: 18,
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
    backgroundColor: '#D97706',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pendingVerifyActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  myQuickBillCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  myQuickBillCardPaid: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
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
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  myQuickBillAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 2,
  },
  quickStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
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
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myQuickUploadBtnSecondary: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  myQuickUploadBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  myQuickUploadBtnTextSecondary: {
    color: Colors.primary,
  },
});
