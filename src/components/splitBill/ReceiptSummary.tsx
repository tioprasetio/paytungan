import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SplitBillRecapResponse } from '../../types';
import { Colors } from '../../theme/colors';

interface ReceiptSummaryProps {
  recap: SplitBillRecapResponse;
}

export const ReceiptSummary: React.FC<ReceiptSummaryProps> = ({ recap }) => {
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
          <Text style={[styles.statValue, { color: Colors.accentDark }]}>
            Rp {recap.total_collected.toLocaleString('id-ID')}
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Sisa Tertunda</Text>
          <Text style={[styles.statValue, { color: Colors.danger }]}>
            Rp {recap.total_pending.toLocaleString('id-ID')}
          </Text>
        </View>
      </View>

      <View style={styles.buyerInfo}>
        <Text style={styles.buyerText}>
          Pembeli (Buyer): <Text style={styles.bold}>{recap.buyer.nama}</Text> (WA: {recap.buyer.no_whatsapp})
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  location: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  buyerInfo: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  buyerText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
