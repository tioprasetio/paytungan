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
import { LinearGradientView } from '../components/common/LinearGradientView';
import { CreditCard, ShieldCheck, Wallet, Wifi, Check } from 'lucide-react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

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

interface BankCardTheme {
  primaryBg: string;
  secondaryBg: string;
  tertiaryBg: string;
  glow1: string;
  glow2: string;
  strokeColor: string;
  chipColor: string;
  chipBorder: string;
  badgeBg: string;
}

const BANK_CARD_THEMES: Record<string, BankCardTheme> = {
  bca: {
    primaryBg: '#08214D',
    secondaryBg: '#004B87',
    tertiaryBg: '#041530',
    glow1: '#00A3E0',
    glow2: '#1D4ED8',
    strokeColor: 'rgba(0, 163, 224, 0.28)',
    chipColor: '#FBBF24',
    chipBorder: '#92400E',
    badgeBg: 'rgba(0, 163, 224, 0.22)',
  },
  mandiri: {
    primaryBg: '#0B2347',
    secondaryBg: '#1E3A8A',
    tertiaryBg: '#051224',
    glow1: '#F59E0B',
    glow2: '#2563EB',
    strokeColor: 'rgba(245, 158, 11, 0.28)',
    chipColor: '#FCD34D',
    chipBorder: '#B45309',
    badgeBg: 'rgba(245, 158, 11, 0.22)',
  },
  bri: {
    primaryBg: '#092540',
    secondaryBg: '#0284C7',
    tertiaryBg: '#041424',
    glow1: '#38BDF8',
    glow2: '#0369A1',
    strokeColor: 'rgba(56, 189, 248, 0.28)',
    chipColor: '#FDE047',
    chipBorder: '#A16207',
    badgeBg: 'rgba(56, 189, 248, 0.22)',
  },
  bni: {
    primaryBg: '#06302B',
    secondaryBg: '#059669',
    tertiaryBg: '#021815',
    glow1: '#10B981',
    glow2: '#047857',
    strokeColor: 'rgba(16, 185, 129, 0.28)',
    chipColor: '#FCD34D',
    chipBorder: '#B45309',
    badgeBg: 'rgba(16, 185, 129, 0.22)',
  },
  gopay: {
    primaryBg: '#082D36',
    secondaryBg: '#0891B2',
    tertiaryBg: '#03161A',
    glow1: '#00AED6',
    glow2: '#0E7490',
    strokeColor: 'rgba(0, 174, 214, 0.3)',
    chipColor: '#FDE047',
    chipBorder: '#A16207',
    badgeBg: 'rgba(0, 174, 214, 0.25)',
  },
  dana: {
    primaryBg: '#0A2D5C',
    secondaryBg: '#0284C7',
    tertiaryBg: '#04162E',
    glow1: '#118EEA',
    glow2: '#2563EB',
    strokeColor: 'rgba(17, 142, 234, 0.3)',
    chipColor: '#FCD34D',
    chipBorder: '#B45309',
    badgeBg: 'rgba(17, 142, 234, 0.25)',
  },
  ovo: {
    primaryBg: '#2E1065',
    secondaryBg: '#7C3AED',
    tertiaryBg: '#170833',
    glow1: '#A855F7',
    glow2: '#9333EA',
    strokeColor: 'rgba(168, 85, 247, 0.3)',
    chipColor: '#FDE047',
    chipBorder: '#A16207',
    badgeBg: 'rgba(168, 85, 247, 0.25)',
  },
  shopeepay: {
    primaryBg: '#431407',
    secondaryBg: '#C2410C',
    tertiaryBg: '#230B04',
    glow1: '#EA580C',
    glow2: '#F97316',
    strokeColor: 'rgba(249, 115, 22, 0.3)',
    chipColor: '#FDE047',
    chipBorder: '#A16207',
    badgeBg: 'rgba(249, 115, 22, 0.25)',
  },
  seabank: {
    primaryBg: '#451A03',
    secondaryBg: '#D97706',
    tertiaryBg: '#220D01',
    glow1: '#F59E0B',
    glow2: '#B45309',
    strokeColor: 'rgba(245, 158, 11, 0.3)',
    chipColor: '#FDE047',
    chipBorder: '#A16207',
    badgeBg: 'rgba(245, 158, 11, 0.25)',
  },
  'bank jago': {
    primaryBg: '#3B0764',
    secondaryBg: '#6B21A8',
    tertiaryBg: '#1D0332',
    glow1: '#F59E0B',
    glow2: '#9333EA',
    strokeColor: 'rgba(245, 158, 11, 0.3)',
    chipColor: '#FDE047',
    chipBorder: '#A16207',
    badgeBg: 'rgba(245, 158, 11, 0.25)',
  },
  default: {
    primaryBg: '#090D16',
    secondaryBg: '#1E1B4B',
    tertiaryBg: '#05070B',
    glow1: '#6366F1',
    glow2: '#3B82F6',
    strokeColor: 'rgba(99, 102, 241, 0.28)',
    chipColor: '#FCD34D',
    chipBorder: '#B45309',
    badgeBg: 'rgba(255, 255, 255, 0.12)',
  },
};

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

  const normalizedBank = namaBank.trim().toLowerCase();
  const cardTheme =
    BANK_CARD_THEMES[normalizedBank] || BANK_CARD_THEMES.default;

  const formattedCardNumber = React.useMemo(() => {
    if (!nomorRekening.trim()) {
      return '••••  ••••  ••••  ••••';
    }
    const clean = nomorRekening.replace(/\s+/g, '');
    const chunks = clean.match(/.{1,4}/g);
    return chunks ? chunks.join('   ') : clean;
  }, [nomorRekening]);

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!currentUser?.id) return;

    if (!namaBank.trim()) {
      showWarning(
        'Pilih Bank / E-Wallet',
        'Silakan pilih salah satu bank atau e-wallet dari pilihan di atas.',
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
    <LinearGradientView colors={colors.bgGradient} style={{ flex: 1 }}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
        <Header
          title="Rekening & E-Wallet"
          subtitle="Tujuan transfer saat kamu jadi Runner"
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
          {/* Virtual Card Preview */}
          <View style={styles.cardPreviewWrapper}>
            <View
              style={[
                styles.virtualCard,
                { backgroundColor: cardTheme.primaryBg },
              ]}
            >
              {/* Geometric SVG Background Pattern */}
              <Svg
                style={StyleSheet.absoluteFill}
                width="100%"
                height="100%"
                viewBox="0 0 360 215"
                preserveAspectRatio="none"
              >
                <Defs>
                  <LinearGradient
                    id="cardBgGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <Stop
                      offset="0%"
                      stopColor={cardTheme.secondaryBg}
                      stopOpacity="0.85"
                    />
                    <Stop
                      offset="55%"
                      stopColor={cardTheme.primaryBg}
                      stopOpacity="1"
                    />
                    <Stop
                      offset="100%"
                      stopColor={cardTheme.tertiaryBg}
                      stopOpacity="0.95"
                    />
                  </LinearGradient>
                </Defs>

                {/* Base Gradient Fill */}
                <Rect
                  x="0"
                  y="0"
                  width="360"
                  height="215"
                  rx="22"
                  fill="url(#cardBgGrad)"
                />

                {/* Flowing Topographic Waves */}
                <Path
                  d="M-30,45 Q70,5 170,55 T370,25 T440,80"
                  fill="none"
                  stroke={cardTheme.strokeColor}
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />
                <Path
                  d="M-40,90 Q80,45 180,95 T380,75 T450,130"
                  fill="none"
                  stroke={cardTheme.strokeColor}
                  strokeWidth="1.5"
                />
                <Path
                  d="M-30,140 Q90,95 200,145 T390,125 T460,185"
                  fill="none"
                  stroke={cardTheme.strokeColor}
                  strokeWidth="1.2"
                  strokeDasharray="6 6"
                />
                <Path
                  d="M-20,190 Q110,140 220,190 T400,175 T470,230"
                  fill="none"
                  stroke={cardTheme.strokeColor}
                  strokeWidth="1.8"
                />

                {/* Concentric Radar Rings from top-right */}
                <Circle
                  cx="330"
                  cy="25"
                  r="55"
                  stroke={cardTheme.strokeColor}
                  strokeWidth="1"
                  fill="none"
                  opacity="0.9"
                />
                <Circle
                  cx="330"
                  cy="25"
                  r="95"
                  stroke={cardTheme.strokeColor}
                  strokeWidth="1.2"
                  strokeDasharray="5 5"
                  fill="none"
                  opacity="0.75"
                />
                <Circle
                  cx="330"
                  cy="25"
                  r="140"
                  stroke={cardTheme.strokeColor}
                  strokeWidth="1.4"
                  fill="none"
                  opacity="0.6"
                />
                <Circle
                  cx="330"
                  cy="25"
                  r="190"
                  stroke={cardTheme.strokeColor}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  fill="none"
                  opacity="0.4"
                />
                <Circle
                  cx="330"
                  cy="25"
                  r="245"
                  stroke={cardTheme.strokeColor}
                  strokeWidth="1.2"
                  fill="none"
                  opacity="0.3"
                />

                {/* Micro-dot matrix pattern */}
                {[0, 1, 2, 3].map(row =>
                  [0, 1, 2, 3, 4, 5].map(col => (
                    <Circle
                      key={`dot-${row}-${col}`}
                      cx={20 + col * 12}
                      cy={130 + row * 12}
                      r="1"
                      fill={cardTheme.strokeColor}
                      opacity="0.8"
                    />
                  )),
                )}
              </Svg>

              {/* Ambient Glowing Orbs */}
              <View
                pointerEvents="none"
                style={[
                  styles.glowOrbTopRight,
                  { backgroundColor: cardTheme.glow1 },
                ]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.glowOrbBottomLeft,
                  { backgroundColor: cardTheme.glow2 },
                ]}
              />

              {/* Card Header */}
              <View style={styles.virtualCardHeader}>
                <View style={styles.virtualCardLogoRow}>
                  <View
                    style={[
                      styles.bankIconBadge,
                      { backgroundColor: cardTheme.badgeBg },
                    ]}
                  >
                    <Wallet size={15} color="#FFFFFF" />
                  </View>
                  <Text style={styles.virtualCardBankName}>
                    {namaBank || 'Bank / E-Wallet'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.verifiedPill,
                    { backgroundColor: cardTheme.badgeBg },
                  ]}
                >
                  <ShieldCheck size={12} color="#FFFFFF" />
                  <Text style={styles.verifiedPillText}>VERIFIED</Text>
                </View>
              </View>

              {/* Chip & Contactless */}
              <View style={styles.cardMidRow}>
                <View style={styles.chipNfcGroup}>
                  <View
                    style={[
                      styles.chipSim,
                      {
                        backgroundColor: cardTheme.chipColor,
                        borderColor: cardTheme.chipBorder,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.chipSimInner,
                        { borderColor: cardTheme.chipBorder },
                      ]}
                    >
                      <View
                        style={[
                          styles.chipLineH,
                          { backgroundColor: cardTheme.chipBorder },
                        ]}
                      />
                      <View
                        style={[
                          styles.chipLineV,
                          { backgroundColor: cardTheme.chipBorder },
                        ]}
                      />
                      <View
                        style={[
                          styles.chipCenterPad,
                          { borderColor: cardTheme.chipBorder },
                        ]}
                      />
                    </View>
                  </View>
                  <Wifi
                    size={16}
                    color="rgba(255, 255, 255, 0.75)"
                    style={styles.nfcIcon}
                  />
                </View>
                <Text style={styles.cardTypeLabel}>RUNNER CARD</Text>
              </View>

              {/* Number */}
              <View style={styles.virtualCardNumberWrap}>
                <Text style={styles.virtualCardNumber} numberOfLines={1}>
                  {formattedCardNumber}
                </Text>
              </View>

              {/* Footer */}
              <View style={styles.virtualCardFooter}>
                <View style={styles.holderColumn}>
                  <Text style={styles.virtualCardLabel}>CARD HOLDER</Text>
                  <Text style={styles.virtualCardHolder} numberOfLines={1}>
                    {(
                      atasNama ||
                      currentUser?.nama ||
                      'NAMA PEMILIK'
                    ).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.hologramSeal}>
                  <View style={styles.hologramCircle1} />
                  <View style={styles.hologramCircle2} />
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

            {/* Bank Selection */}
            <Text style={[styles.chipsLabel, { color: colors.textSecondary }]}>
              Pilih Bank / E-Wallet:
            </Text>
            <View style={styles.chipsRow}>
              {POPULAR_BANKS.map(bank => {
                const isSelected =
                  namaBank.toLowerCase() === bank.toLowerCase();
                return (
                  <TouchableOpacity
                    key={bank}
                    style={[
                      styles.bankChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primaryLight
                          : colors.surface,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => setNamaBank(bank)}
                    activeOpacity={0.7}
                  >
                    {isSelected && (
                      <Check
                        size={12}
                        color={colors.primary}
                        strokeWidth={2.8}
                      />
                    )}
                    <Text
                      style={[
                        styles.bankChipText,
                        {
                          color: isSelected
                            ? colors.primary
                            : colors.textPrimary,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {bank}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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
  cardPreviewWrapper: {
    marginBottom: 16,
  },
  virtualCard: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 20,
    minHeight: 200,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    overflow: 'hidden',
    position: 'relative',
  },
  glowOrbTopRight: {
    position: 'absolute',
    top: -45,
    right: -45,
    width: 170,
    height: 170,
    borderRadius: 85,
    opacity: 0.28,
  },
  glowOrbBottomLeft: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.2,
  },
  virtualCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  virtualCardLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bankIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  virtualCardBankName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  cardMidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 6,
    zIndex: 2,
  },
  chipNfcGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chipSim: {
    width: 36,
    height: 27,
    borderRadius: 6,
    padding: 3,
    borderWidth: 1,
  },
  chipSimInner: {
    flex: 1,
    borderRadius: 3,
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  chipLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  chipCenterPad: {
    width: 11,
    height: 9,
    borderRadius: 2,
    borderWidth: 1,
  },
  nfcIcon: {
    transform: [{ rotate: '90deg' }],
  },
  cardTypeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 1.5,
  },
  virtualCardNumberWrap: {
    marginVertical: 8,
    zIndex: 2,
  },
  virtualCardNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  virtualCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 2,
  },
  holderColumn: {
    flex: 1,
    marginRight: 12,
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
  },
  hologramSeal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hologramCircle1: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  hologramCircle2: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.55)',
    marginLeft: -10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  bankChipText: {
    fontSize: 12,
  },
  inputContainer: {
    marginBottom: 14,
  },
  saveBtn: {
    marginTop: 6,
    borderRadius: 14,
  },
});
