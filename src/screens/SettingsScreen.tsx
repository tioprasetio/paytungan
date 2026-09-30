import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore, useThemeStore } from '../stores';
import { Header } from '../components/common/Header';
import { useThemeColors } from '../theme/colors';
import { useAlert } from '../context/AlertContext';
import {
  User,
  CreditCard,
  KeyRound,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Info,
  Moon,
  History,
} from 'lucide-react-native';
import { LinearGradientView } from '../components/common/LinearGradientView';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const colors = useThemeColors();
  const { showConfirm } = useAlert();

  const handleLogout = () => {
    showConfirm(
      'Keluar dari Akun?',
      'Apakah kamu yakin ingin keluar dari PayTungan? Kamu perlu memasukkan Nomor WhatsApp dan PIN untuk masuk kembali.',
      () => {
        logout();
      },
      undefined,
      'Keluar Sekarang',
      'Batal',
      true,
    );
  };

  const userInitial = currentUser?.nama?.charAt(0).toUpperCase() || 'U';
  const hasPaymentAccount = !!(
    currentUser?.nama_bank && currentUser?.nomor_rekening
  );

  return (
    <LinearGradientView colors={colors.bgGradient} style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: 'transparent' }]}
      >
        <Header
          title="Pengaturan"
          onBack={() => navigation.goBack()}
          transparent
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Summary Card */}
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: colors.primaryDark,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[styles.avatarCircle, { backgroundColor: colors.surface }]}
            >
              <Text
                style={[styles.avatarText, { color: colors.secondaryThird }]}
              >
                {userInitial}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text
                style={[styles.profileName, { color: colors.textInverse }]}
                numberOfLines={1}
              >
                {currentUser?.nama || 'Pengguna'}
              </Text>
              <View style={styles.phoneRow}>
                <ShieldCheck size={13} color={colors.accentDark} />
                <Text style={[styles.phoneText, { color: colors.textInverse }]}>
                  {currentUser?.no_whatsapp || '-'}
                </Text>
              </View>
              <Text style={[styles.idText, { color: colors.textInverse }]}>
                ID: #{currentUser?.id || '-'}
              </Text>
            </View>
          </View>

          {/* Section 1: Informasi Akun (Grouped Card persis seperti screenshot referensi) */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Informasi Akun
          </Text>
          <View
            style={[
              styles.cardGroup,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Row 1: Informasi Profil */}
            <TouchableOpacity
              style={[
                styles.itemRow,
                styles.itemRowBorder,
                { borderBottomColor: colors.borderLight },
              ]}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.65}
            >
              <User
                size={21}
                color={colors.textSecondary}
                style={styles.itemIcon}
              />
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                  Informasi Profil
                </Text>
                <Text
                  style={[styles.itemSub, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {currentUser?.nama
                    ? `${currentUser.nama} • Data akun & nama tampilan`
                    : 'Data pribadi dan nama akun'}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Row 2: Rekening & E-Wallet */}
            <TouchableOpacity
              style={[
                styles.itemRow,
                styles.itemRowBorder,
                { borderBottomColor: colors.borderLight },
              ]}
              onPress={() => navigation.navigate('PaymentSettings')}
              activeOpacity={0.65}
            >
              <CreditCard
                size={21}
                color={colors.textSecondary}
                style={styles.itemIcon}
              />
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                  Rekening & E-Wallet
                </Text>
                <Text
                  style={[styles.itemSub, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {hasPaymentAccount
                    ? `${currentUser.nama_bank} - ${currentUser.nomor_rekening}`
                    : 'Atur rekening penerima transfer split bill'}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Row 3: Keamanan PIN */}
            <TouchableOpacity
              style={[
                styles.itemRow,
                styles.itemRowBorder,
                { borderBottomColor: colors.borderLight },
              ]}
              onPress={() => navigation.navigate('SecuritySettings')}
              activeOpacity={0.65}
            >
              <KeyRound
                size={21}
                color={colors.textSecondary}
                style={styles.itemIcon}
              />
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                  Keamanan PIN
                </Text>
                <Text
                  style={[styles.itemSub, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  PIN 6-digit untuk otentikasi akun
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Row 4: Riwayat Transaksi */}
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => navigation.navigate('History')}
              activeOpacity={0.65}
            >
              <History
                size={21}
                color={colors.textSecondary}
                style={styles.itemIcon}
              />
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                  Riwayat Transaksi
                </Text>
                <Text
                  style={[styles.itemSub, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  Catatan titipan barang & sesi jastip kamu
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>


          {/* Section 2: Preferensi & Lainnya */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Preferensi & Lainnya
          </Text>
          <View
            style={[
              styles.cardGroup,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Row 1: Mode Gelap Toggle */}
            <View
              style={[
                styles.itemRow,
                styles.itemRowBorder,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <Moon
                size={21}
                color={colors.textSecondary}
                style={styles.itemIcon}
              />
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                  Mode Gelap
                </Text>
                <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                  {isDarkMode
                    ? 'Tampilan gelap aktif'
                    : 'Gunakan tampilan terang'}
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#E2E8F0', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Row 2: App Info */}
            <View
              style={[
                styles.itemRow,
                styles.itemRowBorder,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <Info
                size={21}
                color={colors.textSecondary}
                style={styles.itemIcon}
              />
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                  Tentang PayTungan
                </Text>
                <Text
                  style={[styles.itemSub, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  Versi 1.2.0 • Social errand & split bill
                </Text>
              </View>
              <View
                style={[
                  styles.versionBadge,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <Text
                  style={[
                    styles.versionBadgeText,
                    { color: colors.textSecondary },
                  ]}
                >
                  v1.2.0
                </Text>
              </View>
            </View>

            {/* Row 3: Logout */}
            <TouchableOpacity
              style={styles.itemRow}
              onPress={handleLogout}
              activeOpacity={0.65}
            >
              <LogOut size={21} color={colors.danger} style={styles.itemIcon} />
              <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, { color: colors.danger }]}>
                  Keluar dari Akun
                </Text>
                <Text
                  style={[styles.itemSub, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  Keluar dari sesi login akun kamu
                </Text>
              </View>
              <ChevronRight size={18} color="#FCA5A5" />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradientView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '500',
  },
  idText: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: -0.2,
  },
  cardGroup: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
  },
  itemIcon: {
    marginRight: 14,
  },
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  itemSub: {
    fontSize: 12.5,
    marginTop: 2,
    lineHeight: 17,
  },
  versionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  versionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 16,
  },
});
