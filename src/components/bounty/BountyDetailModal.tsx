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
  MapPin,
  Home,
  MessageCircle,
  CreditCard,
  Camera,
  Image as ImageIcon,
  Users,
  Eye,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

interface BountyDetailModalProps {
  visible: boolean;
  bounty: Bounty | null;
  currentUser?: User | null;
  onClose: () => void;
  onClaim: (bounty: Bounty) => Promise<void>;
  onRelease: (bounty: Bounty) => Promise<void>;
  onCompletePurchase: (
    bounty: Bounty,
    hargaFinal: number,
    receiptUri?: string,
  ) => Promise<void>;
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
  const [selectedPaymentProof, setSelectedPaymentProof] = useState<
    string | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  if (!bounty) return null;

  const getFullImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (
      path.startsWith('http') ||
      path.startsWith('file://') ||
      path.startsWith('content://')
    ) {
      return path;
    }
    return `${SOCKET_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const isCreator = currentUser?.id === bounty.creatorId;
  const isRunner = currentUser?.id === bounty.runnerId;

  const totalBayar =
    (bounty.harga_final || bounty.estimasi_harga || 0) + bounty.imbalan_bounty;

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
      showAlert({
        title: 'Gagal Memproses',
        message: err.message,
        type: 'error',
      });
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
      showAlert({
        title: 'Gagal Batalkan',
        message: err.message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{bounty.judul}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
          >
            {/* Title & Desc */}
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
                    <Text style={styles.detailLabel}>
                      Toko / Lokasi Pembelian
                    </Text>
                    <Text style={styles.detailValue}>{bounty.lokasi_beli}</Text>
                  </View>
                </View>
              )}
              {Boolean(bounty.lokasi_tujuan) && (
                <View style={styles.detailRow}>
                  <Home size={16} color="#059669" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Titik / Kamar Antar</Text>
                    <Text style={styles.detailValue}>
                      {bounty.lokasi_tujuan}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Bento Grid: Pihak Terkait & Sirkel */}
            <View style={styles.bentoSection}>
              <Text style={styles.sectionTitle}>Pihak Terkait</Text>

              {/* Row 1: Pembuat & Runner */}
              <View style={styles.bentoRow}>
                {/* Pembuat Bounty */}
                <View style={styles.bentoCard}>
                  <View style={styles.bentoCardHeader}>
                    <View
                      style={[
                        styles.bentoBadge,
                        { backgroundColor: colors.surfaceSubtle },
                      ]}
                    >
                      <Text
                        style={[
                          styles.bentoBadgeText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Pembuat
                      </Text>
                    </View>
                  </View>
                  <View style={styles.bentoCardBody}>
                    <Text style={styles.bentoName} numberOfLines={1}>
                      {bounty.creator?.nama || '-'}
                    </Text>
                    {bounty.creator?.no_whatsapp ? (
                      <TouchableOpacity
                        style={styles.bentoChatPill}
                        onPress={() => handleWhatsApp(bounty.creator)}
                        activeOpacity={0.8}
                      >
                        <MessageCircle size={12} color="#16A34A" />
                        <Text style={styles.bentoChatPillText}>WhatsApp</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.bentoMutedText}>Tidak ada nomor</Text>
                    )}
                  </View>
                </View>

                {/* Runner (Penolong) */}
                <View
                  style={[
                    styles.bentoCard,
                    !bounty.runner && styles.bentoCardEmpty,
                  ]}
                >
                  <View style={styles.bentoCardHeader}>
                    <View
                      style={[
                        styles.bentoBadge,
                        {
                          backgroundColor: colors.surfaceSubtle,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.bentoBadgeText,
                          {
                            color: colors.textSecondary,
                          },
                        ]}
                      >
                        Runner
                      </Text>
                    </View>
                  </View>
                  <View style={styles.bentoCardBody}>
                    <Text
                      style={[
                        styles.bentoName,
                        !bounty.runner && {
                          color: colors.textSecondary,
                          fontWeight: '600',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {bounty.runner?.nama || 'Belum Ada'}
                    </Text>
                    {bounty.runner?.no_whatsapp ? (
                      <TouchableOpacity
                        style={styles.bentoChatPill}
                        onPress={() => handleWhatsApp(bounty.runner)}
                        activeOpacity={0.8}
                      >
                        <MessageCircle size={12} color={colors.success} />
                        <Text style={styles.bentoChatPillText}>WhatsApp</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.bentoMutedText}>
                        {bounty.runner
                          ? 'Tidak ada nomor'
                          : 'Menunggu penolong'}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Row 2: Sirkel Asal */}
              {Boolean(bounty.circle?.nama_sirkel) && (
                <View style={styles.bentoCircleCard}>
                  <View style={styles.bentoCircleLeft}>
                    <View
                      style={[
                        styles.bentoIconWrap,
                        { backgroundColor: colors.primaryLight },
                      ]}
                    >
                      <Users size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bentoCircleLabel}>SIRKEL ASAL</Text>
                      <Text style={styles.bentoCircleName} numberOfLines={1}>
                        {bounty.circle?.nama_sirkel}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.bentoCircleBadge}>
                    <Text style={styles.bentoCircleBadgeText}>Komunitas</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Financial Breakdown */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Rincian Biaya</Text>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Imbalan Jasa / Bounty</Text>
                <Text style={styles.costVal}>
                  Rp {bounty.imbalan_bounty.toLocaleString('id-ID')}
                </Text>
              </View>
              {bounty.harga_final ? (
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>
                    Harga Belanjaan Asli (Struk)
                  </Text>
                  <Text style={styles.costVal}>
                    Rp {bounty.harga_final?.toLocaleString('id-ID')}
                  </Text>
                </View>
              ) : bounty.estimasi_harga ? (
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Estimasi Harga Belanjaan</Text>
                  <Text style={styles.costVal}>
                    Rp {bounty.estimasi_harga?.toLocaleString('id-ID')}
                  </Text>
                </View>
              ) : null}

              <View style={[styles.costRow, styles.costTotalRow]}>
                <Text style={styles.costTotalLabel}>
                  Total Yang Harus Dibayar
                </Text>
                <Text style={styles.costTotalVal}>
                  Rp {totalBayar.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>

            {/* Struk Image if already uploaded */}
            {Boolean(bounty.bukti_struk) && (
              <View style={styles.sectionCard}>
                <View style={styles.strukHeaderRow}>
                  <Text style={styles.sectionTitle}>Foto Struk Pembelian</Text>
                  <Text style={styles.tapToZoomText}>Ketuk untuk perbesar</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() =>
                    setPreviewModalImage(getFullImageUrl(bounty.bukti_struk))
                  }
                  style={styles.proofImageWrap}
                >
                  <Image
                    source={{ uri: getFullImageUrl(bounty.bukti_struk) }}
                    style={styles.proofImage}
                    resizeMode="cover"
                  />
                  <View style={styles.zoomOverlayBadge}>
                    <Eye size={12} color="#FFF" />
                    <Text style={styles.zoomOverlayText}>Lihat Jelas</Text>
                  </View>
                </TouchableOpacity>
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
                  <View style={styles.selectedReceiptWrap}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => setPreviewModalImage(selectedReceipt)}
                      style={styles.selectedReceiptTouchable}
                    >
                      <Image
                        source={{ uri: selectedReceipt }}
                        style={styles.previewImage}
                        resizeMode="cover"
                      />
                      <View style={styles.zoomOverlayBadge}>
                        <Eye size={12} color="#FFF" />
                        <Text style={styles.zoomOverlayText}>Lihat Preview</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeReceiptBtn}
                      onPress={() => setSelectedReceipt(null)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.submitActionBtn}
                  onPress={handlePurchaseSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.submitActionBtnText}>
                      Simpan & Tagihkan
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.releaseBtn}
                  onPress={handleRelease}
                  disabled={isSubmitting}
                >
                  <Text style={styles.releaseBtnText}>
                    Batalkan Pengambilan Tugas
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Creator Action: Pay and Finish */}
            {bounty.status === 'BOUGHT' && isCreator && (
              <View style={[styles.sectionCard, styles.actionCard]}>
                <Text style={styles.sectionTitle}>
                  Konfirmasi Penerimaan & Bayar
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Barang sudah dibeli oleh runner. Harap bayar total Rp{' '}
                  {totalBayar.toLocaleString('id-ID')}.
                </Text>

                {bounty.runner?.nomor_rekening && (
                  <View style={styles.bankInfoBox}>
                    <CreditCard size={18} color="#4F46E5" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bankName}>
                        {bounty.runner.nama_bank || 'Bank / E-Wallet'}
                      </Text>
                      <Text style={styles.bankNumber}>
                        {bounty.runner.nomor_rekening}
                      </Text>
                      <Text style={styles.bankOwner}>
                        a/n {bounty.runner.atas_nama || bounty.runner.nama}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.photoPickerRow}>
                  <TouchableOpacity
                    style={styles.photoBtn}
                    onPress={() => handlePickPaymentProof('library')}
                  >
                    <ImageIcon size={16} color={colors.primary} />
                    <Text style={styles.photoBtnText}>Unggah Bukti Bayar</Text>
                  </TouchableOpacity>
                </View>

                {selectedPaymentProof && (
                  <Image
                    source={{ uri: selectedPaymentProof }}
                    style={styles.previewImage}
                  />
                )}

                <TouchableOpacity
                  style={[
                    styles.submitActionBtn,
                    { backgroundColor: '#10B981' },
                  ]}
                  onPress={handlePaymentSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.submitActionBtnText}>
                      Selesaikan & Konfirmasi Bayar
                    </Text>
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
                      Ambil Bounty Ini (Dapat Rp{' '}
                      {bounty.imbalan_bounty.toLocaleString('id-ID')})
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

        {/* Fullscreen Struk Preview Overlay */}
        {Boolean(previewModalImage) && (
          <View style={styles.fullscreenBackdrop}>
            <SafeAreaView
              style={styles.fullscreenSafeArea}
              edges={['top', 'bottom']}
            >
              <View style={styles.fullscreenHeader}>
                <Text style={styles.fullscreenTitle}>Foto Struk Pembelian</Text>
                <TouchableOpacity
                  style={styles.fullscreenCloseBtn}
                  onPress={() => setPreviewModalImage(null)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <X size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.fullscreenImageWrap}>
                <Image
                  source={{ uri: previewModalImage || '' }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              </View>
            </SafeAreaView>
          </View>
        )}
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
    // Bento Styles
    bentoSection: {
      marginBottom: 12,
    },
    bentoRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    bentoCard: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 112,
      justifyContent: 'space-between',
    },
    bentoCardEmpty: {
      borderStyle: 'dashed',
      borderColor: colors.border,
      opacity: 0.9,
    },
    bentoCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    bentoCardBody: {
      justifyContent: 'flex-end',
    },
    bentoIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bentoBadge: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    bentoBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    bentoName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    bentoChatPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      backgroundColor: colors.successLight,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 8,
      alignSelf: 'stretch',
    },
    bentoChatPillText: {
      fontSize: 11,
      color: colors.success,
      fontWeight: '700',
    },
    bentoMutedText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '500',
    },
    bentoCircleCard: {
      backgroundColor: colors.background,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bentoCircleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    bentoCircleLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 0.5,
    },
    bentoCircleName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 2,
    },
    bentoCircleBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    bentoCircleBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.primary,
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
      color: colors.primary,
    },
    previewImage: {
      width: '100%',
      height: 140,
      borderRadius: 8,
    },
    strukHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    tapToZoomText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    proofImageWrap: {
      position: 'relative',
      borderRadius: 10,
      overflow: 'hidden',
    },
    zoomOverlayBadge: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(0,0,0,0.65)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    zoomOverlayText: {
      color: '#FFF',
      fontSize: 11,
      fontWeight: '600',
    },
    selectedReceiptWrap: {
      position: 'relative',
      marginBottom: 10,
    },
    selectedReceiptTouchable: {
      borderRadius: 8,
      overflow: 'hidden',
      position: 'relative',
    },
    removeReceiptBtn: {
      position: 'absolute',
      top: 6,
      right: 6,
      backgroundColor: 'rgba(0,0,0,0.65)',
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    fullscreenBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.95)',
      zIndex: 999,
    },
    fullscreenSafeArea: {
      flex: 1,
    },
    fullscreenHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    fullscreenTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFF',
    },
    fullscreenCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fullscreenImageWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingBottom: 20,
    },
    fullscreenImage: {
      width: '100%',
      height: '100%',
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
