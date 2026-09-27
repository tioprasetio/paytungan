import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ShoppingBag, X, AlertCircle } from 'lucide-react-native';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useThemeColors, ThemeColors } from '../../theme/colors';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (nama_barang: string, catatan?: string) => Promise<void>;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [namaBarang, setNamaBarang] = useState('');
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!namaBarang.trim()) {
      setError('Nama barang wajib diisi');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit(namaBarang.trim(), catatan.trim() || undefined);
      setNamaBarang('');
      setCatatan('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan barang');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <ShoppingBag size={20} color={colors.primary} />
              <Text style={styles.modalTitle}>Titip Barang</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Tulis barang yang ingin kamu titipkan. Harga akan di-input oleh pembeli saat di kasir (Blind Cart).
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={15} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Nama Barang & Varian"
            placeholder="Contoh: Kopi Susu Aren (Less Sugar, Ice)"
            value={namaBarang}
            onChangeText={(text) => {
              setNamaBarang(text);
              if (error) setError('');
            }}
          />

          <Input
            label="Catatan Tambahan (Opsional)"
            placeholder="Contoh: Jangan pakai sedotan / beli di outlet A"
            value={catatan}
            onChangeText={setCatatan}
          />

          <View style={styles.actionRow}>
            <Button
              title="Batal"
              variant="outline"
              onPress={onClose}
              style={styles.cancelBtn}
            />
            <Button
              title="Tambah ke Keranjang"
              variant="primary"
              loading={loading}
              onPress={handleSubmit}
              style={styles.submitBtn}
            />
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      borderTopWidth: 1,
      borderColor: colors.borderLight,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    closeBtn: {
      padding: 4,
      borderRadius: 16,
      backgroundColor: colors.surfaceSubtle,
    },
    modalSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 18,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.dangerLight,
      padding: 10,
      borderRadius: 8,
      marginBottom: 16,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: '600',
    },
    actionRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    cancelBtn: {
      flex: 1,
    },
    submitBtn: {
      flex: 2,
    },
  });
