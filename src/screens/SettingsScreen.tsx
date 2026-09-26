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
import { Input, Button, Card } from '../components/common';
import { Colors } from '../theme/colors';
import { useAlert } from '../context/AlertContext';
import {
  ArrowLeft,
  User as UserIcon,
  ShieldCheck,
  KeyRound,
  LogOut,
  CheckCircle2,
  Lock,
  Sparkles,
  CreditCard,
  Wallet,
} from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, updateUser, logout } = useAuthStore();
  const { showWarning, showError, showSuccess, showConfirm } = useAlert();

  // Profile Edit State
  const [nama, setNama] = useState(currentUser?.nama || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Bank & E-Wallet State
  const [namaBank, setNamaBank] = useState(currentUser?.nama_bank || '');
  const [nomorRekening, setNomorRekening] = useState(currentUser?.nomor_rekening || '');
  const [atasNama, setAtasNama] = useState(currentUser?.atas_nama || currentUser?.nama || '');
  const [savingPayment, setSavingPayment] = useState(false);

  // Change PIN State
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [savingPin, setSavingPin] = useState(false);

  // Handle Save Profile Name
  const handleSaveProfile = async () => {
    Keyboard.dismiss();
    if (!currentUser?.id) return;

    if (!nama.trim() || nama.trim().length < 2) {
      showWarning(
        'Nama Terlalu Pendek',
        'Nama lengkap minimal terdiri dari 2 karakter.'
      );
      return;
    }

    if (nama.trim() === currentUser.nama) {
      showWarning(
        'Tidak Ada Perubahan',
        'Nama yang kamu masukkan sama dengan nama saat ini.'
      );
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await authApi.updateProfile(currentUser.id, nama.trim());
      updateUser({ nama: updated.nama });
      showSuccess(
        'Profil Diperbarui 🎉',
        `Nama kamu berhasil diubah menjadi "${updated.nama}".`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui profil';
      showError('Gagal Memperbarui Nama', msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Save Payment Info (Bank & E-Wallet)
  const handleSavePaymentInfo = async () => {
    Keyboard.dismiss();
    if (!currentUser?.id) return;

    if (!namaBank.trim()) {
      showWarning(
        'Nama Bank / E-Wallet Diperlukan',
        'Silakan pilih atau ketik nama bank atau e-wallet kamu.'
      );
      return;
    }

    if (!nomorRekening.trim() || nomorRekening.trim().length < 4) {
      showWarning(
        'Nomor Rekening Kurang Lengkap',
        'Nomor rekening atau nomor HP e-wallet minimal 4 karakter.'
      );
      return;
    }

    if (!atasNama.trim() || atasNama.trim().length < 2) {
      showWarning(
        'Nama Pemilik Diperlukan',
        'Nama pemilik rekening (atas nama) minimal 2 karakter.'
      );
      return;
    }

    try {
      setSavingPayment(true);
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
        'Rekening Tersimpan! 💳',
        `Informasi ${updated.nama_bank} (${updated.nomor_rekening}) a/n ${updated.atas_nama} berhasil disimpan dan siap ditampilkan ke penitip.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan informasi rekening';
      showError('Gagal Menyimpan Rekening', msg);
    } finally {
      setSavingPayment(false);
    }
  };

  // Handle Change PIN
  const handleChangePin = async () => {
    Keyboard.dismiss();
    if (!currentUser?.id) return;

    // 1. Validasi PIN lama
    if (!oldPin.trim()) {
      showWarning(
        'PIN Saat Ini Diperlukan',
        'Silakan masukkan 6-digit PIN saat ini untuk verifikasi keamanan.'
      );
      return;
    }

    if (oldPin.trim().length !== 6 || !/^\d{6}$/.test(oldPin.trim())) {
      showWarning(
        'PIN Saat Ini Tidak Valid',
        'PIN saat ini wajib terdiri dari 6 digit angka.'
      );
      return;
    }

    // 2. Validasi PIN baru
    if (!newPin.trim()) {
      showWarning(
        'PIN Baru Diperlukan',
        'Silakan masukkan 6 digit angka untuk PIN baru kamu.'
      );
      return;
    }

    if (newPin.trim().length !== 6 || !/^\d{6}$/.test(newPin.trim())) {
      showWarning(
        'PIN Baru Harus 6 Digit',
        'PIN baru wajib terdiri dari tepat 6 digit angka.'
      );
      return;
    }

    if (newPin.trim() === oldPin.trim()) {
      showWarning(
        'PIN Tidak Berubah',
        'PIN baru tidak boleh sama dengan PIN saat ini.'
      );
      return;
    }

    // 3. Validasi konfirmasi PIN baru
    if (confirmNewPin.trim() !== newPin.trim()) {
      showWarning(
        'Konfirmasi PIN Tidak Cocok',
        'Konfirmasi PIN baru tidak sama dengan PIN baru. Pastikan kedua kolom terisi identik.'
      );
      return;
    }

    try {
      setSavingPin(true);
      const message = await authApi.changePin(currentUser.id, oldPin.trim(), newPin.trim());
      setOldPin('');
      setNewPin('');
      setConfirmNewPin('');
      showSuccess('PIN Berhasil Diubah 🔒', message || 'PIN keamanan baru kamu telah aktif.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah PIN';
      showError('Gagal Mengubah PIN', msg);
    } finally {
      setSavingPin(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    Keyboard.dismiss();
    showConfirm(
      'Keluar dari Akun?',
      'Apakah kamu yakin ingin keluar dari PayTungan? Kamu perlu memasukkan Nomor WhatsApp dan PIN untuk masuk kembali.',
      () => {
        logout();
      },
      undefined,
      'Keluar Sekarang',
      'Batal',
      true
    );
  };

  const userInitial = currentUser?.nama?.charAt(0).toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengaturan Akun</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexOne}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* User Profile Hero Card */}
          <View style={styles.profileHeroCard}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{userInitial}</Text>
              </View>
              <View style={styles.badgeCheck}>
                <CheckCircle2 size={18} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.profileName}>{currentUser?.nama || 'Pengguna'}</Text>
            <View style={styles.phoneBadgeRow}>
              <ShieldCheck size={14} color={Colors.accent} />
              <Text style={styles.phoneBadgeText}>
                {currentUser?.no_whatsapp || '-'} • Terverifikasi
              </Text>
            </View>

            <Text style={styles.accountIdText}>
              ID Pengguna: #{currentUser?.id || '-'}
            </Text>
          </View>

          {/* Section 1: Ubah Nama Profil */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#EEF2FF' }]}>
                <UserIcon size={18} color={Colors.primary} />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Informasi Profil</Text>
                <Text style={styles.sectionSub}>Perbarui nama tampilan akun kamu</Text>
              </View>
            </View>

            <Input
              label="Nama Lengkap"
              placeholder="Nama kamu"
              value={nama}
              onChangeText={setNama}
              containerStyle={styles.inputContainer}
            />

            {/* Read-only WhatsApp */}
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyLabel}>Nomor WhatsApp (Akun Utama)</Text>
              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyValue}>{currentUser?.no_whatsapp}</Text>
                <View style={styles.lockBadge}>
                  <Lock size={12} color={Colors.textMuted} />
                  <Text style={styles.lockBadgeText}>Terkunci</Text>
                </View>
              </View>
              <Text style={styles.readOnlyHint}>
                Nomor WhatsApp adalah identitas login unik dan tidak dapat diubah sembarangan.
              </Text>
            </View>

            <Button
              title="Simpan Perubahan Nama"
              variant="primary"
              size="md"
              loading={savingProfile}
              onPress={handleSaveProfile}
              disabled={nama.trim() === currentUser?.nama}
              style={styles.saveBtn}
            />
          </Card>

          {/* Section 2: Rekening & E-Wallet Pembayaran */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#E0F2FE' }]}>
                <CreditCard size={18} color={Colors.primary} />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Rekening & E-Wallet</Text>
                <Text style={styles.sectionSub}>Ditampilkan ke penitip saat kamu jadi Runner</Text>
              </View>
            </View>

            {/* Quick Bank Chips */}
            <Text style={styles.chipsLabel}>Pilih Cepat Bank / E-Wallet:</Text>
            <View style={styles.chipsRow}>
              {['BCA', 'Mandiri', 'BRI', 'BNI', 'GoPay', 'DANA', 'OVO', 'ShopeePay', 'SeaBank', 'Bank Jago'].map((bank) => {
                const isSelected = namaBank.toLowerCase() === bank.toLowerCase();
                return (
                  <TouchableOpacity
                    key={bank}
                    style={[styles.bankChip, isSelected && styles.bankChipSelected]}
                    onPress={() => setNamaBank(bank)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.bankChipText, isSelected && styles.bankChipTextSelected]}>
                      {bank}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label="Nama Bank / E-Wallet"
              placeholder="Contoh: BCA / GoPay / DANA"
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
              title="Simpan Info Rekening & E-Wallet"
              variant="primary"
              size="md"
              loading={savingPayment}
              onPress={handleSavePaymentInfo}
              style={styles.saveBtn}
            />
          </Card>

          {/* Section 3: Keamanan & Ganti PIN */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#FEF3C7' }]}>
                <KeyRound size={18} color={Colors.warning} />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Keamanan PIN 6-Digit</Text>
                <Text style={styles.sectionSub}>Ganti PIN keamanan untuk melindungi akun</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPin(!showPin)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.togglePinText}>
                  {showPin ? '🙈 Tutup' : '👁️ Lihat'}
                </Text>
              </TouchableOpacity>
            </View>

            <Input
              label="PIN Saat Ini"
              placeholder="● ● ● ● ● ● (6 digit angka)"
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry={!showPin}
              value={oldPin}
              onChangeText={(t) => setOldPin(t.replace(/[^0-9]/g, ''))}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="PIN Baru (6 Digit)"
              placeholder="Masukkan 6 digit angka baru"
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry={!showPin}
              value={newPin}
              onChangeText={(t) => setNewPin(t.replace(/[^0-9]/g, ''))}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Konfirmasi PIN Baru"
              placeholder="Ulangi 6 digit PIN baru"
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry={!showPin}
              value={confirmNewPin}
              onChangeText={(t) => setConfirmNewPin(t.replace(/[^0-9]/g, ''))}
              containerStyle={styles.inputContainer}
            />

            <Button
              title="Perbarui PIN Keamanan"
              variant="secondary"
              size="md"
              loading={savingPin}
              onPress={handleChangePin}
              style={styles.saveBtn}
            />
          </Card>

          {/* Section 3: Info Aplikasi */}
          <Card style={styles.appInfoCard}>
            <View style={styles.appInfoRow}>
              <View style={styles.appInfoLeft}>
                <Sparkles size={16} color={Colors.primary} />
                <Text style={styles.appInfoTitle}>PayTungan</Text>
              </View>
              <Text style={styles.appInfoVersion}>Versi 1.2.0 (Stabil)</Text>
            </View>
            <Text style={styles.appInfoDesc}>
              Platform Social Errand Jastip & Split-Bill Otomatis. Dilindungi enkripsi hash PBKDF2.
            </Text>
          </Card>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut size={18} color={Colors.danger} />
            <Text style={styles.logoutBtnText}>Keluar dari Akun PayTungan</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  backButton: {
    padding: 6,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerRightPlaceholder: {
    width: 34,
  },
  scrollContent: {
    padding: 20,
  },
  profileHeroCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical: 26,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  badgeCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  phoneBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
  },
  phoneBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  accountIdText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  sectionCard: {
    marginBottom: 16,
    padding: 18,
    borderRadius: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  togglePinText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  inputContainer: {
    marginBottom: 12,
  },
  readOnlyField: {
    marginBottom: 16,
  },
  readOnlyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  readOnlyBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  readOnlyValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  readOnlyHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
    lineHeight: 15,
  },
  saveBtn: {
    marginTop: 6,
  },
  appInfoCard: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  appInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  appInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appInfoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  appInfoVersion: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  appInfoDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 16,
    paddingVertical: 15,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger,
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
    gap: 6,
    marginBottom: 14,
  },
  bankChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bankChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  bankChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  bankChipTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 40,
  },
});
