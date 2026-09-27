import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../stores';
import { authApi } from '../api';
import { Header, Input, Button, Card } from '../components/common';
import { Colors, useThemeColors } from '../theme/colors';
import { useAlert } from '../context/AlertContext';
import { CreditCard, ShieldCheck, Wallet } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PaymentSettings'
>;

const POPULAR_BANKS = [
  'BCA',
  'Mandiri',
  'BRI',
  'BNI',
  'GoPay',
  'DANA',
  'OVO',
  'ShopeePay',
  'SeaBank',
  'Bank Jago',
];

export const PaymentSettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, updateUser } = useAuthStore();
  const { showWarning, showError, showSuccess } = useAlert();

  const [namaBank, setNamaBank] = useState(currentUser?.nama_bank || '');
  const [nomorRekening, setNomorRekening] = useState(
    currentUser?.nomor_rekening || '',
  );
  const [atasNama, setAtasNama] = useState(
    currentUser?.atas_nama || currentUser?.nama || '',
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!currentUser?.id) return;

    if (!namaBank.trim()) {
      showWarning(
        'Nama Bank / E-Wallet Diperlukan',
        'Silakan pilih atau ketik nama bank atau e-wallet kamu.',
      );
      return;
    }

    if (!nomorRekening.trim() || nomorRekening.trim().length < 4) {
      showWarning(
        'Nomor Rekening Kurang Lengkap',
        'Nomor rekening atau nomor HP e-wallet minimal 4 karakter.',
      );
      return;
    }

    if (!atasNama.trim() || atasNama.trim().length < 2) {
      showWarning(
        'Nama Pemilik Diperlukan',
        'Nama pemilik rekening (atas nama) minimal 2 karakter.',
      );
      return;
    }

    try {
      setSaving(true);
      const updated = await authApi.updatePaymentInfo(currentUser.id, {
        nama_bank: namaBank.trim(),
        nomor_rekening: nomorRekening.trim(),
        atas_nama: atasNama.trim(),
      });
      updateUser({
        nama_bank: updated.nama_bank,
        nomor_rekening: updated.nomor_rekening,
        atas_nama: updated.atas_nama,
      });
      showSuccess(
        'Rekening Tersimpan',
        `Informasi ${updated.nama_bank} (${updated.nomor_rekening}) a/n ${updated.atas_nama} berhasil disimpan.`,
      );
      navigation.goBack();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan informasi rekening';
      showError('Gagal Menyimpan Rekening', msg);
    } finally {
      setSaving(false);
    }
  };

  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header
        title="Rekening & E-Wallet"
        subtitle="Tujuan transfer saat kamu jadi Runner"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexOne}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Virtual Card Preview */}
          <View style={styles.cardPreviewWrapper}>
            <View style={styles.virtualCard}>
              <View style={styles.virtualCardHeader}>
                <View style={styles.virtualCardLogoRow}>
                  <Wallet size={20} color="#FFFFFF" />
                  <Text style={styles.virtualCardBankName}>
                    {namaBank || 'Bank / E-Wallet'}
                  </Text>
                </View>
                <ShieldCheck size={18} color="rgba(255, 255, 255, 0.8)" />
              </View>

              <View style={styles.virtualCardNumberWrap}>
                <Text style={styles.virtualCardNumber}>
                  {nomorRekening || '•••• •••• ••••'}
                </Text>
              </View>

              <View style={styles.virtualCardFooter}>
                <View>
                  <Text style={styles.virtualCardLabel}>ATAS NAMA</Text>
                  <Text style={styles.virtualCardHolder} numberOfLines={1}>
                    {(
                      atasNama ||
                      currentUser?.nama ||
                      'NAMA PEMILIK'
                    ).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.chipSim}>
                  <View style={styles.chipSimInner} />
                </View>
              </View>
            </View>
          </View>

          {/* Form Section */}
          <Card
            style={[
              styles.formCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                <CreditCard size={18} color={colors.primary} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Detail Pembayaran</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  Ditampilkan kepada teman sirkel di struk split bill
                </Text>
              </View>
            </View>

            {/* Quick Chips */}
            <Text style={[styles.chipsLabel, { color: colors.textSecondary }]}>Pilih Cepat Bank / E-Wallet:</Text>
            <View style={styles.chipsRow}>
              {POPULAR_BANKS.map(bank => {
                const isSelected =
                  namaBank.toLowerCase() === bank.toLowerCase();
                return (
                  <TouchableOpacity
                    key={bank}
                    style={[
                      styles.bankChip,
                      isSelected && styles.bankChipSelected,
                    ]}
                    onPress={() => setNamaBank(bank)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.bankChipText,
                        isSelected && styles.bankChipTextSelected,
                      ]}
                    >
                      {bank}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Nama Bank / E-Wallet"
              placeholder="Contoh: BCA, Mandiri, GoPay, DANA"
              value={namaBank}
              onChangeText={setNamaBank}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Nomor Rekening / No. HP E-Wallet"
              placeholder="Contoh: 1234567890 atau 0812xxxx"
              keyboardType="numeric"
              value={nomorRekening}
              onChangeText={setNomorRekening}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Nama Pemilik Rekening (Atas Nama)"
              placeholder="Contoh: Budi Santoso"
              value={atasNama}
              onChangeText={setAtasNama}
              containerStyle={styles.inputContainer}
            />

            <Button
              title="Simpan Info Pembayaran"
              variant="primary"
              size="lg"
              loading={saving}
              onPress={handleSave}
              style={styles.saveBtn}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cardPreviewWrapper: {
    marginBottom: 16,
  },
  virtualCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    padding: 20,
    minHeight: 170,
    justifyContent: 'space-between',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  virtualCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  virtualCardLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  virtualCardBankName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  virtualCardNumberWrap: {
    marginVertical: 10,
  },
  virtualCardNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  virtualCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  virtualCardLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  virtualCardHolder: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    maxWidth: 220,
  },
  chipSim: {
    width: 32,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#FCD34D',
    padding: 3,
  },
  chipSimInner: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#B45309',
    borderRadius: 2,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.07)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  chipsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 16,
  },
  bankChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  bankChipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: 'rgba(79, 70, 229, 0.3)',
  },
  bankChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  bankChipTextSelected: {
    color: Colors.primary,
    fontWeight: '800',
  },
  inputContainer: {
    marginBottom: 14,
  },
  saveBtn: {
    marginTop: 6,
    borderRadius: 14,
  },
});
