import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import { Input, Button } from '../components/common';
import { useThemeColors, ThemeColors } from '../theme/colors';
import { authApi } from '../api';
import { useAuthStore } from '../stores';
import { useAlert } from '../context/AlertContext';

type AuthMode = 'LOGIN' | 'REGISTER';

export const AuthScreen: React.FC = () => {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [nama, setNama] = useState('');
  const [noWhatsapp, setNoWhatsapp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useAuthStore(state => state.login);
  const { showWarning, showError, showSuccess, showConfirm } = useAlert();

  const handleSwitchMode = (newMode: AuthMode) => {
    Keyboard.dismiss();
    setMode(newMode);
    setError('');
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();

    const cleanPhone = noWhatsapp.trim().replace(/[^0-9+]/g, '');

    if (mode === 'REGISTER') {
      // 1. Validasi Nama
      if (!nama.trim()) {
        showWarning(
          'Nama Lengkap Diperlukan',
          'Silakan masukkan nama lengkap kamu sebelum melanjutkan.',
        );
        setError('Nama lengkap wajib diisi');
        return;
      }

      if (nama.trim().length < 2) {
        showWarning(
          'Nama Terlalu Pendek',
          'Nama lengkap minimal terdiri dari 2 karakter.',
        );
        setError('Nama minimal 2 karakter');
        return;
      }

      // 2. Validasi WhatsApp
      if (!noWhatsapp.trim()) {
        showWarning(
          'Nomor WhatsApp Diperlukan',
          'Nomor WhatsApp belum diisi. Masukkan nomor telepon/WhatsApp agar kamu dapat dihubungi teman sirkel.',
        );
        setError('Nomor WhatsApp wajib diisi');
        return;
      }

      if (cleanPhone.length < 8) {
        showWarning(
          'Nomor WhatsApp Tidak Valid',
          'Nomor WhatsApp minimal terdiri dari 8 digit angka.',
        );
        setError('Nomor WhatsApp tidak valid (min 8 digit)');
        return;
      }

      // 3. Validasi PIN
      if (!pin.trim()) {
        showWarning(
          'PIN Keamanan Diperlukan',
          'Buat PIN 6 digit angka untuk melindungi akun kamu agar tidak bisa diakses orang lain.',
        );
        setError('PIN wajib dibuat');
        return;
      }

      if (pin.trim().length !== 6 || !/^\d{6}$/.test(pin.trim())) {
        showWarning(
          'PIN Harus 6 Digit Angka',
          'PIN keamanan wajib terdiri dari tepat 6 digit angka (misal: 123456).',
        );
        setError('PIN harus 6 digit angka');
        return;
      }

      if (confirmPin.trim() !== pin.trim()) {
        showWarning(
          'Konfirmasi PIN Tidak Cocok',
          'PIN konfirmasi yang kamu masukkan tidak sama. Pastikan kedua kolom PIN terisi identik.',
        );
        setError('Konfirmasi PIN tidak cocok');
        return;
      }

      try {
        setLoading(true);
        setError('');
        const { user, token } = await authApi.register(
          nama.trim(),
          cleanPhone,
          pin.trim(),
        );
        showSuccess(
          'Pendaftaran Berhasil 🎉',
          `Akun ${user.nama} berhasil dibuat dan diamankan dengan PIN. Selamat datang di PayTungan!`,
          () => login(user, token),
        );
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat pendaftaran';
        setError(errorMsg);

        if (errorMsg.toLowerCase().includes('sudah terdaftar')) {
          showConfirm(
            'Nomor Sudah Terdaftar',
            'Nomor WhatsApp ini sudah memiliki akun di PayTungan. Mau langsung masuk menggunakan PIN?',
            () => {
              setMode('LOGIN');
              setError('');
            },
            undefined,
            'Ke Halaman Masuk',
            'Batal',
          );
        } else {
          showError('Gagal Mendaftar', errorMsg);
        }
      } finally {
        setLoading(false);
      }
    } else {
      // MODE LOGIN
      // 1. Validasi WhatsApp
      if (!noWhatsapp.trim()) {
        showWarning(
          'Nomor WhatsApp Diperlukan',
          'Nomor WhatsApp belum diisi. Masukkan nomor telepon/WhatsApp akun kamu untuk masuk.',
        );
        setError('Nomor WhatsApp wajib diisi');
        return;
      }

      if (cleanPhone.length < 8) {
        showWarning(
          'Nomor WhatsApp Tidak Valid',
          'Nomor WhatsApp minimal terdiri dari 8 digit angka.',
        );
        setError('Nomor WhatsApp tidak valid (min 8 digit)');
        return;
      }

      // 2. Validasi PIN
      if (!pin.trim()) {
        showWarning(
          'PIN Diperlukan',
          'Masukkan 6 digit PIN keamanan akun kamu untuk masuk.',
        );
        setError('PIN wajib diisi');
        return;
      }

      if (pin.trim().length !== 6 || !/^\d{6}$/.test(pin.trim())) {
        showWarning(
          'PIN Harus 6 Digit',
          'PIN akun kamu terdiri dari 6 digit angka.',
        );
        setError('PIN harus 6 digit angka');
        return;
      }

      try {
        setLoading(true);
        setError('');
        const { user, token } = await authApi.login(cleanPhone, pin.trim());
        login(user, token);
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : 'Terjadi kesalahan saat masuk';
        setError(errorMsg);

        if (errorMsg.toLowerCase().includes('belum terdaftar')) {
          showConfirm(
            'Akun Belum Terdaftar',
            'Nomor WhatsApp ini belum memiliki akun PayTungan. Ingin mendaftar sekarang?',
            () => {
              setMode('REGISTER');
              setError('');
            },
            undefined,
            'Daftar Akun Baru',
            'Coba Lagi',
          );
        } else {
          showError('Gagal Masuk', errorMsg);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Brand */}
          <View style={styles.heroSection}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoP}>P</Text>
            </View>
            <Text style={styles.brandTitle}>PayTungan</Text>
            <Text style={styles.brandSubtitle}>
              Social Split-Bill & Group Errand App
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Tab Switcher: Masuk vs Daftar */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  mode === 'LOGIN' && styles.tabButtonActive,
                ]}
                onPress={() => handleSwitchMode('LOGIN')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabText,
                    mode === 'LOGIN' && styles.tabTextActive,
                  ]}
                >
                  Masuk
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  mode === 'REGISTER' && styles.tabButtonActive,
                ]}
                onPress={() => handleSwitchMode('REGISTER')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabText,
                    mode === 'REGISTER' && styles.tabTextActive,
                  ]}
                >
                  Daftar Akun
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cardTitle}>
              {mode === 'LOGIN'
                ? 'Selamat Datang Kembali 👋'
                : 'Buat Akun Baru ✨'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {mode === 'LOGIN'
                ? 'Masuk dengan Nomor WhatsApp dan PIN 6-digit keamanan akun kamu.'
                : 'Daftarkan nama, nomor WhatsApp, dan buat PIN 6-digit untuk keamanan.'}
            </Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* Field Nama (Hanya di mode Register) */}
            {mode === 'REGISTER' && (
              <Input
                label="Nama Lengkap"
                placeholder="misal: Alex Chandra"
                value={nama}
                onChangeText={text => {
                  setNama(text);
                  if (error) setError('');
                }}
              />
            )}

            {/* Field WhatsApp */}
            <Input
              label="Nomor WhatsApp"
              placeholder="misal: 081234567890"
              keyboardType="phone-pad"
              value={noWhatsapp}
              onChangeText={text => {
                setNoWhatsapp(text);
                if (error) setError('');
              }}
            />

            {/* Field PIN */}
            <View style={styles.pinWrapper}>
              <View style={styles.pinHeader}>
                <Text style={styles.fieldLabel}>
                  {mode === 'REGISTER'
                    ? 'Buat PIN Keamanan (6 Digit)'
                    : 'PIN Keamanan (6 Digit)'}
                </Text>
                <TouchableOpacity
                  style={styles.showPinBtn}
                  onPress={() => setShowPin(!showPin)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  {showPin ? (
                    <EyeOff size={16} color={colors.textSecondary} />
                  ) : (
                    <Eye size={16} color={colors.primary} />
                  )}
                  <Text
                    style={[
                      styles.showPinText,
                      !showPin && styles.showPinTextPrimary,
                    ]}
                  >
                    {showPin ? 'Sembunyikan' : 'Lihat PIN'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Input
                placeholder="● ● ● ● ● ● (6 digit angka)"
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry={!showPin}
                value={pin}
                onChangeText={text => {
                  const numericOnly = text.replace(/[^0-9]/g, '');
                  setPin(numericOnly);
                  if (error) setError('');
                }}
                containerStyle={styles.pinInputContainer}
              />
            </View>

            {/* Field Konfirmasi PIN (Hanya di mode Register) */}
            {mode === 'REGISTER' && (
              <View style={styles.pinWrapper}>
                <Text style={styles.fieldLabel}>Konfirmasi PIN (6 Digit)</Text>
                <Input
                  placeholder="Ulangi 6 digit PIN kamu"
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry={!showPin}
                  value={confirmPin}
                  onChangeText={text => {
                    const numericOnly = text.replace(/[^0-9]/g, '');
                    setConfirmPin(numericOnly);
                    if (error) setError('');
                  }}
                  containerStyle={styles.pinInputContainer}
                />
              </View>
            )}

            <Button
              title={
                mode === 'LOGIN'
                  ? 'Masuk ke PayTungan →'
                  : 'Selesaikan & Buat Akun →'
              }
              size="lg"
              loading={loading}
              onPress={handleSubmit}
              style={styles.actionBtn}
            />

            {/* Toggle Footer Link */}
            <TouchableOpacity
              style={styles.switchModeFooter}
              onPress={() =>
                handleSwitchMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')
              }
              activeOpacity={0.7}
            >
              <Text style={styles.switchModeText}>
                {mode === 'LOGIN' ? (
                  <>
                    Belum punya akun?{' '}
                    <Text style={styles.switchModeHighlight}>
                      Daftar Sekarang
                    </Text>
                  </>
                ) : (
                  <>
                    Sudah memiliki akun?{' '}
                    <Text style={styles.switchModeHighlight}>
                      Masuk di Sini
                    </Text>
                  </>
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    heroSection: {
      alignItems: 'center',
      marginBottom: 20,
    },
    logoBadge: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 4,
    },
    logoP: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 30,
    },
    brandTitle: {
      fontSize: 30,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    brandSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
      paddingHorizontal: 20,
      lineHeight: 18,
    },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 22,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.05,
      shadowRadius: 14,
      elevation: 3,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 14,
      padding: 4,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 10,
    },
    tabButtonActive: {
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '800',
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 18,
      lineHeight: 18,
    },
    errorContainer: {
      backgroundColor: colors.dangerLight,
      padding: 10,
      borderRadius: 10,
      marginBottom: 16,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: '600',
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    pinWrapper: {
      marginBottom: 2,
    },
    pinHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    showPinBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 2,
      paddingHorizontal: 4,
      marginBottom: 4,
    },
    showPinText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    showPinTextPrimary: {
      color: colors.primary,
      fontWeight: '700',
    },
    pinInputContainer: {
      marginBottom: 14,
    },
    actionBtn: {
      marginTop: 6,
    },
    switchModeFooter: {
      alignItems: 'center',
      paddingVertical: 14,
    },
    switchModeText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    switchModeHighlight: {
      color: colors.primary,
      fontWeight: '800',
      textDecorationLine: 'underline',
    },
    featureHighlights: {
      marginTop: 8,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      flexDirection: 'column',
    },
    highlightItem: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
      marginVertical: 2,
    },
  });
