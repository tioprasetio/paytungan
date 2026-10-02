import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SplitBillRecapResponse } from '../../types';
import { useThemeColors, ThemeColors } from '../../theme/colors';

interface ReceiptSummaryProps {
  recap: SplitBillRecapResponse;
}

export const ReceiptSummary: React.FC<ReceiptSummaryProps> = ({ recap }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const progress =
    recap.grand_total > 0
      ? Math.min(1, Math.max(0, recap.total_collected / recap.grand_total))
      : 0;
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={styles.title}>Ringkasan Pembayaran Sesi</Text>
          <Text style={styles.location}>{recap.lokasi}</Text>
        </View>
        <View
          style={[
            styles.percentageBadge,
            {
              backgroundColor:
                percentage === 100 ? colors.accentLight : colors.primaryLight,
              borderColor: percentage === 100 ? colors.accent : colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.percentageText,
              {
                color: percentage === 100 ? colors.accentDark : colors.primary,
              },
            ]}
          >
            {percentage}% Lunas
          </Text>
        </View>
      </View>

      {/* Hero Stats Card */}
      <View style={styles.statsCard}>
        {/* Total Belanja (Full Width Hero) */}
        <View style={styles.heroRow}>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroLabel}>Total Belanja Sesi</Text>
            <Text
              style={styles.heroValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Rp {recap.grand_total.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${percentage}%`,
                backgroundColor:
                  percentage === 100 ? colors.accent : colors.primary,
              },
            ]}
          />
        </View>

        {/* 2-Column Split: Terkumpul & Sisa Tertunda */}
        <View style={styles.splitRow}>
          {/* Kolom Terkumpul */}
          <View style={styles.splitCol}>
            <View style={styles.splitLabelRow}>
              <View
                style={[
                  styles.indicatorDot,
                  { backgroundColor: colors.accent },
                ]}
              />
              <Text style={styles.splitLabel}>Terkumpul</Text>
            </View>
            <Text
              style={[styles.splitValue, { color: colors.accentDark }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              Rp {recap.total_collected.toLocaleString('id-ID')}
            </Text>
          </View>

          {/* Divider Vertikal */}
          <View style={styles.verticalDivider} />

          {/* Kolom Sisa Tertunda */}
          <View style={styles.splitCol}>
            <View style={styles.splitLabelRow}>
              <View
                style={[
                  styles.indicatorDot,
                  {
                    backgroundColor:
                      recap.total_pending > 0
                        ? colors.danger
                        : colors.textMuted,
                  },
                ]}
              />
              <Text style={styles.splitLabel}>Sisa Tertunda</Text>
            </View>
            <Text
              style={[
                styles.splitValue,
                {
                  color:
                    recap.total_pending > 0
                      ? colors.danger
                      : colors.textSecondary,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              Rp {recap.total_pending.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>
      </View>

      {/* Runner Footer */}
      <View style={styles.buyerInfo}>
        <Text style={styles.buyerText}>
          Pembeli (Runner): <Text style={styles.bold}>{recap.buyer.nama}</Text>{' '}
          (WA: {recap.buyer.no_whatsapp})
        </Text>
      </View>
    </View>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    headerTitles: {
      flex: 1,
      marginRight: 8,
    },
    title: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    location: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    percentageBadge: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
    },
    percentageText: {
      fontSize: 11,
      fontWeight: '800',
    },
    statsCard: {
      backgroundColor: colors.background,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    heroRow: {
      marginBottom: 10,
    },
    heroTextCol: {
      gap: 2,
    },
    heroLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    heroValue: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.borderLight,
      overflow: 'hidden',
      marginBottom: 14,
    },
    progressBar: {
      height: '100%',
      borderRadius: 3,
    },
    splitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    splitCol: {
      flex: 1,
    },
    splitLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 4,
    },
    indicatorDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    splitLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    splitValue: {
      fontSize: 15,
      fontWeight: '800',
    },
    verticalDivider: {
      width: 1,
      height: 28,
      backgroundColor: colors.borderLight,
      marginHorizontal: 12,
    },
    buyerInfo: {
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    buyerText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    bold: {
      fontWeight: '700',
      color: colors.textPrimary,
    },
  });
