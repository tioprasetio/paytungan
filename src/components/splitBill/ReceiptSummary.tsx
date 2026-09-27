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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ringkasan Pembayaran Sesi</Text>
        <Text style={styles.location}>{recap.lokasi}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Belanja</Text>
          <Text style={styles.statValue}>
            Rp {recap.grand_total.toLocaleString('id-ID')}
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Terkumpul</Text>
          <Text style={[styles.statValue, { color: colors.accentDark }]}>
            Rp {recap.total_collected.toLocaleString('id-ID')}
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Sisa Tertunda</Text>
          <Text style={[styles.statValue, { color: colors.danger }]}>
            Rp {recap.total_pending.toLocaleString('id-ID')}
          </Text>
        </View>
      </View>

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
      marginBottom: 12,
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
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    statBox: {
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 3,
      fontWeight: '500',
    },
    statValue: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    buyerInfo: {
      paddingTop: 8,
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
