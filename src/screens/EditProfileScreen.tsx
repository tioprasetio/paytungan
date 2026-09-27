import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
import { User, Lock } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EditProfile'
>;

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, updateUser } = useAuthStore();
  const { showWarning, showError, showSuccess } = useAlert();

  const [nama, setNama] = useState(currentUser?.nama || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!currentUser?.id) return;

    if (!nama.trim() || nama.trim().length < 2) {
      showWarning(
        'Nama Terlalu Pendek',
        'Nama lengkap minimal terdiri dari 2 karakter.',
      );
      return;
    }

    if (nama.trim() === currentUser.nama) {
      showWarning(
        'Tidak Ada Perubahan',
        'Nama yang kamu masukkan sama dengan nama saat ini.',
      );
      return;
    }

    try {
      setSaving(true);
      const updated = await authApi.updateProfile(currentUser.id, nama.trim());
      updateUser({ nama: updated.nama });
      showSuccess(
        'Profil Diperbarui',
        `Nama kamu berhasil diubah menjadi "${updated.nama}".`,
      );
      navigation.goBack();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal memperbarui profil';
      showError('Gagal Memperbarui Nama', msg);
    } finally {
      setSaving(false);
    }
  };

  const userInitial = (nama || currentUser?.nama || 'U')
    .charAt(0)
    .toUpperCase();

  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header
        title="Informasi Profil"
        subtitle="Kelola identitas akun kamu"
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
          {/* Avatar Preview */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{userInitial}</Text>
            </View>
            <Text style={[styles.avatarTitle, { color: colors.textPrimary }]}>{currentUser?.nama}</Text>
            <Text style={[styles.avatarSub, { color: colors.textSecondary }]}>
              ID Pengguna: #{currentUser?.id}
            </Text>
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
              <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                <User size={18} color={colors.primary} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Nama Tampilan</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  Nama ini akan terlihat oleh teman sirkel jastip
                </Text>
              </View>
            </View>

            <Input
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap kamu"
              value={nama}
              onChangeText={setNama}
              containerStyle={styles.inputContainer}
            />

            {/* Read-Only WhatsApp Box */}
            <View style={styles.readOnlyContainer}>
              <Text style={[styles.readOnlyLabel, { color: colors.textPrimary }]}>Nomor WhatsApp</Text>
              <View
                style={[
                  styles.readOnlyBox,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.readOnlyValue, { color: colors.textPrimary }]}>
                  {currentUser?.no_whatsapp}
                </Text>
                <View style={styles.lockedPill}>
                  <Lock size={11} color={colors.textMuted} />
                  <Text style={styles.lockedPillText}>Terkunci</Text>
                </View>
              </View>
              <Text style={[styles.readOnlyHint, { color: colors.textMuted }]}>
                Nomor WhatsApp adalah identitas login utama akun kamu dan tidak
                dapat diubah sembarangan.
              </Text>
            </View>

            <Button
              title="Simpan Perubahan Nama"
              variant="primary"
              size="lg"
              loading={saving}
              onPress={handleSave}
              disabled={nama.trim() === currentUser?.nama}
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primary,
  },
  avatarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  avatarSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
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
  inputContainer: {
    marginBottom: 16,
  },
  readOnlyContainer: {
    marginBottom: 20,
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
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  readOnlyValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  lockedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  readOnlyHint: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    marginTop: 6,
  },
  saveBtn: {
    borderRadius: 14,
  },
});
