import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useThemeColors, ThemeColors } from '../../theme/colors';
import { Bounty, User } from '../../types';
import { SOCKET_URL } from '../../config/api.config';
import { useAlert } from '../../context/AlertContext';
import {
  X,
  Coins,
  MapPin,
  Home,
  ShoppingBag,
  User as UserIcon,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Receipt,
  CreditCard,
  Camera,
  Image as ImageIcon,
} from 'lucide-react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

interface BountyDetailModalProps {
  visible: boolean;
  bounty: Bounty | null;
  currentUser?: User | null;
  onClose: () => void;
  onClaim: (bounty: Bounty) => Promise<void>;
  onRelease: (bounty: Bounty) => Promise<void>;
  onCompletePurchase: (bounty: Bounty, hargaFinal: number, receiptUri?: string) => Promise<void>;
  onSubmitPayment: (bounty: Bounty, proofUri?: string) => Promise<void>;
  onFinish: (bounty: Bounty) => Promise<void>;
  onCancel: (bounty: Bounty) => Promise<void>;
}

export const BountyDetailModal: React.FC<BountyDetailModalProps> = ({
  visible,
  bounty,
  currentUser,
  onClose,
  onClaim,
  onRelease,
  onCompletePurchase,
  onSubmitPayment,
  onFinish,
  onCancel,
}) => {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { showAlert } = useAlert();

  const [inputHargaFinal, setInputHargaFinal] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [selectedPaymentProof, setSelectedPaymentProof] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!bounty) return null;

  const isCreator = currentUser?.id === bounty.creatorId;
  const isRunner = currentUser?.id === bounty.runnerId;

  const totalBayar = (bounty.harga_final || bounty.estimasi_harga || 0) + bounty.imbalan_bounty;

  const handleWhatsApp = (targetUser?: User | null) => {
    if (!targetUser?.no_whatsapp) return;
    let clean = targetUser.no_whatsapp.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    const msg = `Halo ${targetUser.nama}, mengenai Bounty "${bounty.judul}" di PayTungan...`;
    Linking.openURL(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`);
  };

  const handlePickReceipt = async (type: 'camera' | 'library') => {
    const fn = type === 'camera' ? launchCamera : launchImageLibrary;
    try {
      const res = await fn({ mediaType: 'photo', quality: 0.7 });
      if (res.assets && res.assets[0]?.uri) {
        setSelectedReceipt(res.assets[0].uri);
      }
    } catch (e) {
      console.warn('Image picker error', e);
    }
  };

  const handlePickPaymentProof = async (type: 'camera' | 'library') => {
    const fn = type === 'camera' ? launchCamera : launchImageLibrary;
    try {
      const res = await fn({ mediaType: 'photo', quality: 0.7 });
      if (res.assets && res.assets[0]?.uri) {
        setSelectedPaymentProof(res.assets[0].uri);
      }
    } catch (e) {
      console.warn('Image picker error', e);
    }
  };

  const handleClaim = async () => {
    try {
      setIsSubmitting(true);
      await onClaim(bounty);
      onClose();
    } catch (err: any) {
      showAlert({ title: 'Gagal Ambil', message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelease = async () => {
    try {
      setIsSubmitting(true);
      await onRelease(bounty);
      onClose();
    } catch (err: any) {
      showAlert({ title: 'Gagal Lepas', message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePurchaseSubmit = async () => {
    const price = parseInt(inputHargaFinal.replace(/\D/g, ''), 10);
    if (!price || price <= 0) {
      showAlert({
        title: 'Harga Belanja Wajib Diisi',
        message: 'Masukkan total harga belanja riil sesuai struk.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onCompletePurchase(bounty, price, selectedReceipt || undefined);
      onClose();
    } catch (err: any) {
      showAlert({ title: 'Gagal Simpan', message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmitPayment(bounty, selectedPaymentProof || undefined);
      await onFinish(bounty);
      onClose();
    } catch (err: any) {
      showAlert({ title: 'Gagal Memproses', message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsSubmitting(true);
      await onCancel(bounty);
      onClose();
    } catch (err: any) {
      showAlert({ title: 'Gagal Batalkan', message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.rewardPill}>
                <Coins size={14} color="#D97706" />
                <Text style={styles.rewardPillText}>
                  +Rp {bounty.imbalan_bounty.toLocaleString('id-ID')}
                </Text>
              </View>
              <Text style={styles.headerStatusText}>Status: {bounty.status}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Title & Desc */}
            <Text style={styles.title}>{bounty.judul}</Text>
            {Boolean(bounty.deskripsi) && (
              <Text style={styles.description}>{bounty.deskripsi}</Text>
            )}

            {/* Location & Delivery Info */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Rincian Lokasi</Text>
              {Boolean(bounty.lokasi_beli) && (
                <View style={styles.detailRow}>
                  <MapPin size={16} color="#4F46E5" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Toko / Lokasi Pembelian</Text>
                    <Text style={styles.detailValue}>{bounty.lokasi_beli}</Text>
                  </View>
                </View>
              )}
              {Boolean(bounty.lokasi_tujuan) && (
                <View style={styles.detailRow}>
                  <Home size={16} color="#059669" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Titik / Kamar Antar</Text>
                    <Text style={styles.detailValue}>{bounty.lokasi_tujuan}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* People Info */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Pihak Terkait</Text>
              <View style={styles.peopleRow}>
                <View style={styles.peopleItem}>
                  <Text style={styles.detailLabel}>Pembuat Bounty</Text>
                  <Text style={styles.peopleName}>{bounty.creator?.nama || '-'}</Text>
                  {Boolean(bounty.creator?.no_whatsapp) && (
                    <TouchableOpacity
                      style={styles.chatPill}
                      onPress={() => handleWhatsApp(bounty.creator)}
                    >
                      <MessageCircle size={12} color="#16A34A" />
                      <Text style={styles.chatPillText}>WhatsApp</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {bounty.runner && (
                  <View style={styles.peopleItem}>
                    <Text style={styles.detailLabel}>Runner (Penolong)</Text>
                    <Text style={styles.peopleName}>{bounty.runner.nama}</Text>
                    {Boolean(bounty.runner.no_whatsapp) && (
                      <TouchableOpacity
                        style={styles.chatPill}
                        onPress={() => handleWhatsApp(bounty.runner)}
                      >
                        <MessageCircle size={12} color="#16A34A" />
                        <Text style={styles.chatPillText}>WhatsApp</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Financial Breakdown */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Rincian Biaya</Text>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Imbalan Jasa / Bounty</Text>
                <Text style={styles.costVal}>Rp {bounty.imbalan_bounty.toLocaleString('id-ID')}</Text>
              </View>
              {Boolean(bounty.harga_final) ? (
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Harga Belanjaan Asli (Struk)</Text>
                  <Text style={styles.costVal}>Rp {bounty.harga_final?.toLocaleString('id-ID')}</Text>
                </View>
              ) : Boolean(bounty.estimasi_harga) ? (
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Estimasi Harga Belanjaan</Text>
                  <Text style={styles.costVal}>Rp {bounty.estimasi_harga?.toLocaleString('id-ID')}</Text>
                </View>
              ) : null}

              <View style={[styles.costRow, styles.costTotalRow]}>
                <Text style={styles.costTotalLabel}>Total Yang Harus Dibayar</Text>
                <Text style={styles.costTotalVal}>Rp {totalBayar.toLocaleString('id-ID')}</Text>
              </View>
            </View>

            {/* Struk Image if already uploaded */}
            {Boolean(bounty.bukti_struk) && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Foto Struk Pembelian</Text>
                <Image
                  source={{ uri: `${SOCKET_URL}${bounty.bukti_struk}` }}
                  style={styles.proofImage}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Runner Action Input: Complete Purchase */}
            {bounty.status === 'TAKEN' && isRunner && (
              <View style={[styles.sectionCard, styles.actionCard]}>
                <Text style={styles.sectionTitle}>Input Belanjaan Selesai</Text>
                <Text style={styles.sectionSubtitle}>
                  Masukkan total belanja asli di kasir/struk untuk ditagihkan:
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Total Harga Struk (Rp)"
                  placeholderTextColor={colors.textSecondary + '80'}
                  keyboardType="numeric"
                  value={inputHargaFinal}
                  onChangeText={setInputHargaFinal}
                />

                <View style={styles.photoPickerRow}>
                  <TouchableOpacity
                    style={styles.photoBtn}
                    onPress={() => handlePickReceipt('camera')}
                  >
                    <Camera size={16} color="#4F46E5" />
                    <Text style={styles.photoBtnText}>Foto Struk</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoBtn}
                    onPress={() => handlePickReceipt('library')}
                  >
                    <ImageIcon size={16} color="#4F46E5" />
                    <Text style={styles.photoBtnText}>Pilih Galeri</Text>
                  </TouchableOpacity>
                </View>

                {selectedReceipt && (
                  <Image source={{ uri: selectedReceipt }} style={styles.previewImage} />
                )}

                <TouchableOpacity
                  style={styles.submitActionBtn}
                  onPress={handlePurchaseSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.submitActionBtnText}>Simpan & Tagihkan</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.releaseBtn}
                  onPress={handleRelease}
                  disabled={isSubmitting}
                >
                  <Text style={styles.releaseBtnText}>Batalkan Pengambilan Tugas</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Creator Action: Pay and Finish */}
            {bounty.status === 'BOUGHT' && isCreator && (
              <View style={[styles.sectionCard, styles.actionCard]}>
                <Text style={styles.sectionTitle}>Konfirmasi Penerimaan & Bayar</Text>
                <Text style={styles.sectionSubtitle}>
                  Barang sudah dibeli oleh runner. Harap bayar total Rp {totalBayar.toLocaleString('id-ID')}.
                </Text>

                {bounty.runner?.nomor_rekening && (
                  <View style={styles.bankInfoBox}>
                    <CreditCard size={18} color="#4F46E5" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bankName}>{bounty.runner.nama_bank || 'Bank / E-Wallet'}</Text>
                      <Text style={styles.bankNumber}>{bounty.runner.nomor_rekening}</Text>
                      <Text style={styles.bankOwner}>a/n {bounty.runner.atas_nama || bounty.runner.nama}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.photoPickerRow}>
                  <TouchableOpacity
                    style={styles.photoBtn}
                    onPress={() => handlePickPaymentProof('library')}
                  >
                    <ImageIcon size={16} color="#4F46E5" />
                    <Text style={styles.photoBtnText}>Unggah Bukti Bayar</Text>
                  </TouchableOpacity>
                </View>

                {selectedPaymentProof && (
                  <Image source={{ uri: selectedPaymentProof }} style={styles.previewImage} />
                )}

                <TouchableOpacity
                  style={[styles.submitActionBtn, { backgroundColor: '#10B981' }]}
                  onPress={handlePaymentSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.submitActionBtnText}>Selesaikan & Konfirmasi Bayar</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Bottom Action Footer for OPEN state */}
          {bounty.status === 'OPEN' && (
            <View style={styles.footer}>
              {!isCreator ? (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleClaim}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      Ambil Bounty Ini (Dapat Rp {bounty.imbalan_bounty.toLocaleString('id-ID')})
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancel}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelBtnText}>Batalkan Bounty</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    sheetContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
      paddingTop: 16,
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    rewardPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#FDE68A',
    },
    rewardPillText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#B45309',
    },
    headerStatusText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    closeBtn: {
      padding: 6,
    },
    scrollArea: {
      marginTop: 14,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    sectionCard: {
      backgroundColor: colors.background,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 12,
      lineHeight: 18,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    detailLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    peopleRow: {
      flexDirection: 'row',
      gap: 16,
    },
    peopleItem: {
      flex: 1,
    },
    peopleName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 2,
      marginBottom: 6,
    },
    chatPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: '#DCFCE7',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    chatPillText: {
      fontSize: 11,
      color: '#16A34A',
      fontWeight: '700',
    },
    costRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 5,
    },
    costLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    costVal: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    costTotalRow: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 8,
      paddingTop: 8,
    },
    costTotalLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    costTotalVal: {
      fontSize: 16,
      fontWeight: '800',
      color: '#D97706',
    },
    proofImage: {
      width: '100%',
      height: 180,
      borderRadius: 10,
      backgroundColor: '#00000010',
    },
    actionCard: {
      borderColor: '#818CF8',
      backgroundColor: '#EEF2FF20',
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.textPrimary,
      marginBottom: 10,
    },
    photoPickerRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    photoBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 10,
    },
    photoBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#4F46E5',
    },
    previewImage: {
      width: '100%',
      height: 140,
      borderRadius: 8,
      marginBottom: 10,
    },
    submitActionBtn: {
      backgroundColor: '#4F46E5',
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 4,
    },
    submitActionBtnText: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: '700',
    },
    releaseBtn: {
      paddingVertical: 10,
      alignItems: 'center',
      marginTop: 6,
    },
    releaseBtnText: {
      color: '#EF4444',
      fontSize: 12,
      fontWeight: '600',
    },
    bankInfoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: '#EEF2FF',
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },
    bankName: {
      fontSize: 12,
      fontWeight: '700',
      color: '#4F46E5',
    },
    bankNumber: {
      fontSize: 16,
      fontWeight: '800',
      color: '#1E1B4B',
      letterSpacing: 1,
    },
    bankOwner: {
      fontSize: 11,
      color: '#6B7280',
    },
    footer: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    primaryBtn: {
      backgroundColor: '#4F46E5',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryBtnText: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
    },
    cancelBtn: {
      backgroundColor: '#FEE2E2',
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
    },
    cancelBtnText: {
      color: '#DC2626',
      fontSize: 14,
      fontWeight: '700',
    },
  });
