import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Colors } from '../../theme/colors';

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
            <Text style={styles.modalTitle}>🛍️ Titip Barang</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Tulis barang yang ingin kamu titipkan. Harga akan di-input oleh pembeli saat di kasir (Blind Cart).
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    marginRight: 8,
  },
  submitBtn: {
    flex: 2,
  },
});
