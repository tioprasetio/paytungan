import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useThemeColors, ThemeColors } from '../../theme/colors';
import { Circle } from '../../types';
import { X, Coins, Sparkles, MapPin, Home, ShoppingBag, Check } from 'lucide-react-native';
import { useAlert } from '../../context/AlertContext';

interface CreateBountyModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    circleId: number;
    judul: string;
    deskripsi?: string;
    imbalan_bounty: number;
    estimasi_harga?: number;
    lokasi_tujuan?: string;
    lokasi_beli?: string;
  }) => Promise<void>;
  circles: Circle[];
  defaultCircleId?: number;
}

const PRESET_REWARDS = [5000, 10000, 15000, 20000, 30000];

export const CreateBountyModal: React.FC<CreateBountyModalProps> = ({
  visible,
  onClose,
  onSubmit,
  circles,
  defaultCircleId,
}) => {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { showAlert } = useAlert();

  const [selectedCircleId, setSelectedCircleId] = useState<number>(
    defaultCircleId || (circles[0]?.id ?? 0)
  );
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [imbalanBounty, setImbalanBounty] = useState<number>(10000);
  const [customReward, setCustomReward] = useState('');
  const [isCustomReward, setIsCustomReward] = useState(false);
  const [estimasiHarga, setEstimasiHarga] = useState('');
  const [lokasiBeli, setLokasiBeli] = useState('');
  const [lokasiTujuan, setLokasiTujuan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync circle if default changes
  React.useEffect(() => {
    if (defaultCircleId) {
      setSelectedCircleId(defaultCircleId);
    } else if (circles.length > 0 && !selectedCircleId) {
      setSelectedCircleId(circles[0].id);
    }
  }, [defaultCircleId, circles]);

  const handleSelectPreset = (reward: number) => {
    setIsCustomReward(false);
    setImbalanBounty(reward);
    setCustomReward('');
  };

  const handleCustomRewardChange = (text: string) => {
    const clean = text.replace(/\D/g, '');
    setCustomReward(clean);
    setIsCustomReward(true);
    if (clean) {
      setImbalanBounty(parseInt(clean, 10));
    }
  };

  const handleSubmit = async () => {
    if (!selectedCircleId) {
      showAlert({
        title: 'Pilih Sirkel',
        message: 'Silakan pilih sirkel tempat Anda ingin membagikan bounty.',
        type: 'warning',
      });
      return;
    }

    if (!judul.trim()) {
      showAlert({
        title: 'Judul Wajib Diisi',
        message: 'Tuliskan barang atau bantuan yang Anda butuhkan.',
        type: 'warning',
      });
      return;
    }

    const tip = isCustomReward ? parseInt(customReward || '0', 10) : imbalanBounty;
    if (tip < 1000) {
      showAlert({
        title: 'Imbalan Tidak Valid',
        message: 'Imbalan/ongkir bounty minimal Rp 1.000.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        circleId: selectedCircleId,
        judul: judul.trim(),
        deskripsi: deskripsi.trim() || undefined,
        imbalan_bounty: tip,
        estimasi_harga: estimasiHarga ? parseInt(estimasiHarga.replace(/\D/g, ''), 10) : undefined,
        lokasi_beli: lokasiBeli.trim() || undefined,
        lokasi_tujuan: lokasiTujuan.trim() || undefined,
      });

      // Reset fields
      setJudul('');
      setDeskripsi('');
      setEstimasiHarga('');
      setLokasiBeli('');
      setLokasiTujuan('');
      onClose();
    } catch (err: any) {
      showAlert({
        title: 'Gagal Membuat Bounty',
        message: err.message || 'Terjadi kesalahan sistem.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.headerIcon}>
                <Coins size={20} color="#D97706" />
              </View>
              <View>
                <Text style={styles.title}>Pasang Bounty Baru</Text>
                <Text style={styles.subtitle}>Tawarkan imbalan untuk teman sirkel yang bisa bantu</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Circle Selector if not fixed */}
            {!defaultCircleId && circles.length > 1 && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Pilih Sirkel</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {circles.map(circle => (
                    <TouchableOpacity
                      key={circle.id}
                      style={[
                        styles.chip,
                        selectedCircleId === circle.id && styles.chipActive,
                      ]}
                      onPress={() => setSelectedCircleId(circle.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedCircleId === circle.id && styles.chipTextActive,
                        ]}
                      >
                        {circle.nama_sirkel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Judul Kebutuhan */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Butuh Apa? <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Cth: Panadol Extra 1 strip & Pocari Sweat"
                placeholderTextColor={colors.textSecondary + '80'}
                value={judul}
                onChangeText={setJudul}
              />
            </View>

            {/* Imbalan / Bounty Reward */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  Imbalan/Ongkir untuk Runner <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.rewardHighlight}>
                  Rp {(isCustomReward ? parseInt(customReward || '0', 10) : imbalanBounty).toLocaleString('id-ID')}
                </Text>
              </View>

              {/* Preset Chips */}
              <View style={styles.presetsGrid}>
                {PRESET_REWARDS.map(val => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.presetChip,
                      !isCustomReward && imbalanBounty === val && styles.presetChipActive,
                    ]}
                    onPress={() => handleSelectPreset(val)}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        !isCustomReward && imbalanBounty === val && styles.presetChipTextActive,
                      ]}
                    >
                      {val / 1000}rb
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom input */}
              <TextInput
                style={[styles.input, isCustomReward && styles.inputActive]}
                placeholder="Atau ketik nominal custom (Rp)"
                placeholderTextColor={colors.textSecondary + '80'}
                keyboardType="numeric"
                value={customReward}
                onChangeText={handleCustomRewardChange}
              />
            </View>

            {/* Estimasi Biaya Belanjaan */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Estimasi Harga Belanja (Opsional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Cth: 25000 (untuk ditalangi runner dulu)"
                placeholderTextColor={colors.textSecondary + '80'}
                keyboardType="numeric"
                value={estimasiHarga}
                onChangeText={setEstimasiHarga}
              />
            </View>

            {/* Toko / Lokasi Beli */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Lokasi Toko / Pembelian (Opsional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Cth: Apotek K24, Indomaret, atau Bebas"
                placeholderTextColor={colors.textSecondary + '80'}
                value={lokasiBeli}
                onChangeText={setLokasiBeli}
              />
            </View>

            {/* Lokasi Antar */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Alamat / Titik Antar (Opsional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Cth: Kost Griya Lavender Kamar 102"
                placeholderTextColor={colors.textSecondary + '80'}
                value={lokasiTujuan}
                onChangeText={setLokasiTujuan}
              />
            </View>

            {/* Catatan / Detail */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Catatan Tambahan (Opsional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Cth: Kalau Panadol merah habis, ganti Paramex ya"
                placeholderTextColor={colors.textSecondary + '80'}
                multiline
                numberOfLines={3}
                value={deskripsi}
                onChangeText={setDeskripsi}
              />
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Sparkles size={18} color="#FFF" />
                  <Text style={styles.submitBtnText}>Pasang Bounty Sekarang 🚀</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
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
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FEF3C7',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    closeBtn: {
      padding: 6,
    },
    scrollArea: {
      marginTop: 14,
    },
    formGroup: {
      marginBottom: 16,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    required: {
      color: '#EF4444',
    },
    rewardHighlight: {
      fontSize: 14,
      fontWeight: '800',
      color: '#D97706',
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.textPrimary,
    },
    inputActive: {
      borderColor: '#D97706',
      backgroundColor: '#FFFBEB',
    },
    textArea: {
      minHeight: 70,
      textAlignVertical: 'top',
    },
    chipsScroll: {
      flexDirection: 'row',
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    chipActive: {
      backgroundColor: '#EEF2FF',
      borderColor: '#4F46E5',
    },
    chipText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    chipTextActive: {
      color: '#4F46E5',
      fontWeight: '700',
    },
    presetsGrid: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    presetChip: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    presetChipActive: {
      backgroundColor: '#FEF3C7',
      borderColor: '#F59E0B',
    },
    presetChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    presetChipTextActive: {
      color: '#B45309',
      fontWeight: '700',
    },
    footer: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    submitBtn: {
      backgroundColor: '#4F46E5',
      borderRadius: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      shadowColor: '#4F46E5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    submitBtnText: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });
