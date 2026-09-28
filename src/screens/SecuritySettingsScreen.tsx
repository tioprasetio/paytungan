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
import { KeyRound, ShieldCheck, Eye, EyeOff, ShieldAlert } from 'lucide-react-native';
import { LinearGradientView } from '../components/common/LinearGradientView';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SecuritySettings'>;

export const SecuritySettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const currentUser = useAuthStore((state) => state.currentUser);
  const { showWarning, showError, showSuccess } = useAlert();

  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePin = async () => {
    Keyboard.dismiss();
    if (!currentUser?.id) return;

    // 1. Validasi PIN lama
    if (!oldPin.trim()) {
      showWarning(
        'PIN Saat Ini Diperlukan',
        'Silakan masukkan 6-digit PIN saat ini untuk verifikasi keamanan.',
      );
      return;
    }

    if (oldPin.trim().length !== 6 || !/^\d{6}$/.test(oldPin.trim())) {
      showWarning(
        'PIN Saat Ini Tidak Valid',
        'PIN saat ini wajib terdiri dari 6 digit angka.',
      );
      return;
    }

    // 2. Validasi PIN baru
    if (!newPin.trim()) {
      showWarning(
        'PIN Baru Diperlukan',
        'Silakan masukkan 6 digit angka untuk PIN baru kamu.',
      );
      return;
    }

    if (newPin.trim().length !== 6 || !/^\d{6}$/.test(newPin.trim())) {
      showWarning(
        'PIN Baru Harus 6 Digit',
        'PIN baru wajib terdiri dari tepat 6 digit angka.',
      );
      return;
    }

    if (newPin.trim() === oldPin.trim()) {
      showWarning(
        'PIN Tidak Berubah',
        'PIN baru tidak boleh sama dengan PIN saat ini.',
      );
      return;
    }

    // 3. Validasi konfirmasi PIN baru
    if (confirmNewPin.trim() !== newPin.trim()) {
      showWarning(
        'Konfirmasi PIN Tidak Cocok',
        'Konfirmasi PIN baru tidak sama dengan PIN baru. Pastikan kedua kolom terisi identik.',
      );
      return;
    }

    try {
      setSaving(true);
      const message = await authApi.changePin(
        currentUser.id,
        oldPin.trim(),
        newPin.trim(),
      );
      setOldPin('');
      setNewPin('');
      setConfirmNewPin('');
      showSuccess(
        'PIN Berhasil Diperbarui',
        message || 'PIN keamanan baru kamu telah aktif.',
      );
      navigation.goBack();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah PIN';
      showError('Gagal Mengubah PIN', msg);
    } finally {
      setSaving(false);
    }
  };

  const colors = useThemeColors();

  return (
    <LinearGradientView colors={colors.bgGradient} style={{ flex: 1 }}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
        <Header
          title="Keamanan PIN"
          subtitle="PIN 6-digit untuk otentikasi akun"
          onBack={() => navigation.goBack()}
          transparent
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
          {/* Security Notice Card */}
          <View
            style={[
              styles.securityNoticeCard,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.securityIconBox, { backgroundColor: colors.surface }]}>
              <ShieldCheck size={20} color={colors.primary} />
            </View>
            <View style={styles.securityNoticeText}>
              <Text style={[styles.securityNoticeTitle, { color: colors.primary }]}>Proteksi Akun Aktif</Text>
              <Text style={[styles.securityNoticeSub, { color: colors.textSecondary }]}>
                PIN 6-digit digunakan saat login dan verifikasi transaksi penting di PayTungan.
              </Text>
            </View>
          </View>

          {/* Form Card */}
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
              <View style={styles.iconBox}>
                <KeyRound size={18} color="#D97706" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Ganti PIN Keamanan</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  Masukkan PIN saat ini dan buat PIN baru
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleVisibilityBtn,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowPin(!showPin)}
                activeOpacity={0.7}
              >
                {showPin ? (
                  <EyeOff size={16} color={colors.textSecondary} />
                ) : (
                  <Eye size={16} color={colors.textSecondary} />
                )}
                <Text style={[styles.toggleVisibilityText, { color: colors.textSecondary }]}>
                  {showPin ? 'Sembunyi' : 'Lihat'}
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
              label="PIN Baru (6 Digit Angka)"
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

            <View
              style={[
                styles.tipsBox,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                },
              ]}
            >
              <ShieldAlert size={14} color={colors.textMuted} style={styles.tipsIcon} />
              <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
                Hindari menggunakan tanggal lahir atau angka berurutan seperti 123456 agar akun tetap aman.
              </Text>
            </View>

            <Button
              title="Perbarui PIN Keamanan"
              variant="primary"
              size="lg"
              loading={saving}
              onPress={handleChangePin}
              style={styles.saveBtn}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </LinearGradientView>
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
  securityNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.15)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  securityIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityNoticeText: {
    flex: 1,
  },
  securityNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  securityNoticeSub: {
    fontSize: 11,
    color: Colors.primaryDark,
    marginTop: 2,
    lineHeight: 16,
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
    backgroundColor: '#FEF3C7',
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
  toggleVisibilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  toggleVisibilityText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  inputContainer: {
    marginBottom: 14,
  },
  tipsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  tipsIcon: {
    marginRight: 6,
    marginTop: 1,
  },
  tipsText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  saveBtn: {
    borderRadius: 14,
  },
});
