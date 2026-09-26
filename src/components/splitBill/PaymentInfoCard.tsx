import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { CreditCard, Copy, Check, Info } from 'lucide-react-native';
import { useAlert } from '../../context/AlertContext';

interface PaymentInfoCardProps {
  buyer: {
    id: number;
    nama: string;
    no_whatsapp: string;
    nama_bank?: string | null;
    nomor_rekening?: string | null;
    atas_nama?: string | null;
  };
}

export const PaymentInfoCard: React.FC<PaymentInfoCardProps> = ({ buyer }) => {
  const [copied, setCopied] = useState(false);
  const { showSuccess } = useAlert();

  const hasBankInfo = Boolean(buyer.nama_bank && buyer.nomor_rekening);

  const handleCopy = () => {
    if (!buyer.nomor_rekening) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    showSuccess(
      'Nomor Rekening Disalin! 📋',
      `Nomor ${buyer.nama_bank || 'Rekening'}: ${buyer.nomor_rekening} (${buyer.atas_nama || buyer.nama}) berhasil disalin.`
    );
  };

  if (!hasBankInfo) {
    return (
      <View style={styles.emptyContainer}>
        <Info size={18} color={Colors.warning} />
        <View style={styles.emptyTextWrapper}>
          <Text style={styles.emptyTitle}>Info Rekening Runner Belum Diatur</Text>
          <Text style={styles.emptySub}>
            Runner ({buyer.nama}) belum mencantumkan info rekening di profilnya. Silakan hubungi via WhatsApp untuk nomor rekening.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <CreditCard size={18} color={Colors.primary} />
        </View>
        <View style={styles.headerTitles}>
          <Text style={styles.title}>Tujuan Transfer</Text>
          <Text style={styles.subtitle}>Bayar ke {buyer.nama} sesuai tagihanmu</Text>
        </View>
        <View style={styles.bankBadge}>
          <Text style={styles.bankBadgeText}>{buyer.nama_bank?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.accountBox}>
        <View style={styles.accountInfo}>
          <Text style={styles.accountNumberLabel}>Nomor Rekening / E-Wallet</Text>
          <Text style={styles.accountNumber} selectable>
            {buyer.nomor_rekening}
          </Text>
          <Text style={styles.accountHolder}>
            a/n <Text style={styles.holderBold}>{buyer.atas_nama || buyer.nama}</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
          onPress={handleCopy}
          activeOpacity={0.7}
        >
          {copied ? (
            <>
              <Check size={14} color="#FFFFFF" />
              <Text style={styles.copyBtnTextSuccess}>Disalin</Text>
            </>
          ) : (
            <>
              <Copy size={14} color={Colors.primary} />
              <Text style={styles.copyBtnText}>Salin</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.instruction}>
        *Setelah transfer, jangan lupa unggah foto struk bukti transfer di bawah agar Runner bisa langsung mengonfirmasi status lunas.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  subtitle: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 1,
  },
  bankBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  bankBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  accountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginBottom: 10,
  },
  accountInfo: {
    flex: 1,
  },
  accountNumberLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
    letterSpacing: 1,
  },
  accountHolder: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  holderBold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  copyBtnSuccess: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  copyBtnTextSuccess: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  instruction: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  emptyTextWrapper: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  emptySub: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 16,
  },
});
