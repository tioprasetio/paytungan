import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useThemeColors, ThemeColors } from '../../theme/colors';
import { UserTrustScore } from '../../types';
import {
  X,
  ShieldCheck,
  Crown,
  Sparkles,
  AlertTriangle,
  ShoppingBag,
  Receipt,
  Info,
} from 'lucide-react-native';

interface TrustScoreModalProps {
  visible: boolean;
  trustScore: UserTrustScore | null;
  onClose: () => void;
}

export const TrustScoreModal: React.FC<TrustScoreModalProps> = ({
  visible,
  trustScore,
  onClose,
}) => {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  if (!trustScore) return null;

  const scoreColor = trustScore.isNgaret
    ? '#EF4444'
    : trustScore.overallScore >= 90
    ? '#10B981'
    : trustScore.overallScore >= 75
    ? '#4F46E5'
    : trustScore.overallScore >= 60
    ? '#F59E0B'
    : '#6B7280';

  const scoreVerdict = trustScore.isNgaret
    ? 'Perlu Perbaikan Segera'
    : trustScore.overallScore >= 90
    ? 'Sangat Terpercaya 🌟'
    : trustScore.overallScore >= 75
    ? 'Amanah & Tertib 👍'
    : 'Warga Standar Sirkel ☕';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconWrap, { backgroundColor: scoreColor + '18' }]}>
                <ShieldCheck size={20} color={scoreColor} />
              </View>
              <View style={styles.headerTextWrap}>
                <Text style={styles.title}>Rapor Tongkrongan</Text>
                <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
                  Reputasi & Skor Kepercayaan {trustScore.nama}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Big Score Gauge Card */}
            <View style={[styles.scoreHeroCard, { borderColor: scoreColor + '30' }]}>
              <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
                <Text style={[styles.scoreValueText, { color: scoreColor }]}>
                  {trustScore.overallScore}
                </Text>
                <Text style={styles.scoreMaxText}>/ 100</Text>
              </View>
              <View style={styles.scoreHeroInfo}>
                <Text style={[styles.scoreVerdictText, { color: scoreColor }]}>
                  {scoreVerdict}
                </Text>
                <Text style={styles.scoreDescText}>
                  Dihitung otomatis dari rekam jejak ketepatan pembayaran & keandalan saat belanja.
                </Text>
              </View>
            </View>

            {/* Warning Banner if Ngaret */}
            {trustScore.isNgaret && (
              <View style={styles.warningBanner}>
                <AlertTriangle size={20} color="#DC2626" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.warningTitle}>Status Peringatan: Tukang Ngaret!</Text>
                  <Text style={styles.warningDesc}>
                    Ada pesanan yang belum dibayar melewati batas waktu atau bukti transfer pernah ditolak runner.
                  </Text>
                </View>
              </View>
            )}

            {/* Section 1: Rapor Pembeli / Penitip */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <ShoppingBag size={16} color="#4F46E5" />
                <Text style={styles.sectionTitle}>Rapor Pembeli (Penitip)</Text>
              </View>

              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.badgeChip,
                    {
                      backgroundColor: trustScore.buyerBadge.color + '18',
                      borderColor: trustScore.buyerBadge.color + '40',
                    },
                  ]}
                >
                  <Sparkles size={14} color={trustScore.buyerBadge.color} />
                  <Text
                    style={[
                      styles.badgeChipText,
                      { color: trustScore.buyerBadge.color },
                    ]}
                  >
                    {trustScore.buyerBadge.title}
                  </Text>
                </View>
                <Text style={styles.badgeScoreText}>
                  Skor Bayar: {trustScore.buyerScore}%
                </Text>
              </View>

              <Text style={styles.badgeDesc}>{trustScore.buyerBadge.description}</Text>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{trustScore.stats.totalPesanan}</Text>
                  <Text style={styles.statLabel}>Total Titipan</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: '#16A34A' }]}>
                    {trustScore.stats.pesananLunas}
                  </Text>
                  <Text style={styles.statLabel}>Lunas Tepat Waktu</Text>
                </View>
                <View style={styles.statItem}>
                  <Text
                    style={[
                      styles.statVal,
                      { color: trustScore.stats.pesananPending > 0 ? '#EF4444' : colors.textPrimary },
                    ]}
                  >
                    {trustScore.stats.pesananPending}
                  </Text>
                  <Text style={styles.statLabel}>Pending Bayar</Text>
                </View>
              </View>
            </View>

            {/* Section 2: Rapor Penalang / Runner */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <Receipt size={16} color="#D97706" />
                <Text style={styles.sectionTitle}>Rapor Penalang (Runner)</Text>
              </View>

              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.badgeChip,
                    {
                      backgroundColor: trustScore.runnerBadge.color + '18',
                      borderColor: trustScore.runnerBadge.color + '40',
                    },
                  ]}
                >
                  <Crown size={14} color={trustScore.runnerBadge.color} />
                  <Text
                    style={[
                      styles.badgeChipText,
                      { color: trustScore.runnerBadge.color },
                    ]}
                  >
                    {trustScore.runnerBadge.title}
                  </Text>
                </View>
                <Text style={styles.badgeScoreText}>
                  Keandalan: {trustScore.runnerScore}%
                </Text>
              </View>

              <Text style={styles.badgeDesc}>{trustScore.runnerBadge.description}</Text>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{trustScore.stats.sesiDibuat}</Text>
                  <Text style={styles.statLabel}>Sesi Dibuka</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: '#16A34A' }]}>
                    {trustScore.stats.sesiSelesai}
                  </Text>
                  <Text style={styles.statLabel}>Sesi Sukses</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: '#D97706' }]}>
                    {trustScore.stats.bountySelesai}
                  </Text>
                  <Text style={styles.statLabel}>Bounty Dibantu</Text>
                </View>
              </View>
            </View>

            {/* Section 3: Kamus Gelar Tongkrongan */}
            <View style={styles.glossaryBox}>
              <View style={styles.glossaryHeader}>
                <Info size={15} color="#4F46E5" />
                <Text style={styles.glossaryTitle}>Tingkatan Gelar Sirkel</Text>
              </View>

              <View style={styles.glossaryItem}>
                <Text style={styles.glossaryBadge}>👑 Jastip Master</Text>
                <Text style={styles.glossaryText}>
                  Penalang dengan min. 5 sesi belanja sukses & skor $\ge 95\%$.
                </Text>
              </View>

              <View style={styles.glossaryItem}>
                <Text style={styles.glossaryBadge}>💎 Sultan Anti-Ngutang</Text>
                <Text style={styles.glossaryText}>
                  Pembeli dengan riwayat bayar 100% lunas tanpa pernah nunggak.
                </Text>
              </View>

              <View style={styles.glossaryItem}>
                <Text style={styles.glossaryBadge}>⚠️ Tukang Ngaret</Text>
                <Text style={styles.glossaryText}>
                  Peringatan visual jika sering telat bayar atau ada bukti palsu/ditolak.
                </Text>
              </View>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Close Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Tutup Rapor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
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
      gap: 12,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    headerTextWrap: {
      flex: 1,
    },
    headerIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    title: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    scrollArea: {
      marginTop: 14,
    },
    scoreHeroCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: colors.background,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1.5,
      marginBottom: 14,
    },
    scoreCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 4,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    scoreValueText: {
      fontSize: 22,
      fontWeight: '900',
      lineHeight: 26,
    },
    scoreMaxText: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    scoreHeroInfo: {
      flex: 1,
    },
    scoreVerdictText: {
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 4,
    },
    scoreDescText: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: '#FEF2F2',
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: '#FCA5A5',
      marginBottom: 14,
    },
    warningTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: '#DC2626',
      marginBottom: 2,
    },
    warningDesc: {
      fontSize: 11,
      color: '#B91C1C',
      lineHeight: 15,
    },
    sectionBox: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    badgeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    badgeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
    },
    badgeChipText: {
      fontSize: 12,
      fontWeight: '800',
    },
    badgeScoreText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    badgeDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
      marginBottom: 12,
    },
    statsGrid: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statVal: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    glossaryBox: {
      backgroundColor: '#EEF2FF30',
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: '#C7D2FE',
      marginBottom: 12,
    },
    glossaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    glossaryTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: '#4F46E5',
    },
    glossaryItem: {
      marginBottom: 8,
    },
    glossaryBadge: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    glossaryText: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 15,
    },
    footer: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    doneBtn: {
      backgroundColor: '#4F46E5',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    doneBtnText: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });
