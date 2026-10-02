import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserBillDetail } from '../../types';
import { useThemeColors, ThemeColors } from '../../theme/colors';
import { useAlert } from '../../context/AlertContext';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Camera,
  RefreshCw,
} from 'lucide-react-native';

interface UserRecapCardProps {
  bill: UserBillDetail;
  isBuyer: boolean;
  isCurrentUser?: boolean;
  onToggleUserPaid?: () => void;
  onToggleItemPaid?: (itemId: number, currentStatus: boolean) => void;
  onViewProof?: (bill: UserBillDetail) => void;
  onUploadProof?: (bill: UserBillDetail) => void;
}

export const UserRecapCard: React.FC<UserRecapCardProps> = ({
  bill,
  isBuyer,
  isCurrentUser,
  onToggleUserPaid,
  onToggleItemPaid: _onToggleItemPaid,
  onViewProof,
  onUploadProof,
}) => {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const proof = bill.payment_proof;
  const { showConfirm } = useAlert();

  return (
    <View style={[styles.container, bill.is_all_paid && styles.paidContainer]}>
      {/* Header Member Info */}
      <View style={styles.header}>
        <View>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{bill.nama}</Text>
            {isCurrentUser && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>Kamu</Text>
              </View>
            )}
          </View>
          <Text style={styles.userPhone}>WA: {bill.no_whatsapp}</Text>
        </View>

        {bill.is_all_paid ? (
          isBuyer ? (
            <TouchableOpacity
              style={[styles.statusBadge, styles.paidBadge]}
              activeOpacity={0.8}
              onLongPress={() => {
                showConfirm(
                  'Ubah Status Pembayaran',
                  `Apakah Anda ingin membatalkan status Lunas untuk ${bill.nama}?`,
                  () => onToggleUserPaid && onToggleUserPaid(),
                  undefined,
                  'Ubah ke Belum Lunas',
                  'Batal',
                  true,
                );
              }}
            >
              <CheckCircle2
                size={12}
                color={colors.accentDark}
                style={styles.badgeIcon}
              />
              <Text style={[styles.statusText, styles.paidText]}>Lunas</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.statusBadge, styles.paidBadge]}>
              <CheckCircle2
                size={12}
                color={colors.accentDark}
                style={styles.badgeIcon}
              />
              <Text style={[styles.statusText, styles.paidText]}>Lunas</Text>
            </View>
          )
        ) : isBuyer ? (
          <TouchableOpacity
            style={[styles.statusBadge, styles.unpaidActionBadge]}
            onPress={() => {
              showConfirm(
                'Konfirmasi Pembayaran',
                `Tandai tagihan ${
                  bill.nama
                } sebesar Rp ${bill.total_bayar.toLocaleString(
                  'id-ID',
                )} sebagai LUNAS (misal: bayar tunai / transfer langsung)?`,
                () => onToggleUserPaid && onToggleUserPaid(),
                undefined,
                'Tandai Lunas',
                'Batal',
              );
            }}
            activeOpacity={0.7}
          >
            <Clock size={12} color="#B45309" style={styles.badgeIcon} />
            <Text style={[styles.statusText, styles.unpaidActionText]}>
              Tandai Lunas
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.statusBadge, styles.unpaidBadge]}>
            <AlertCircle
              size={12}
              color={colors.warning}
              style={styles.badgeIcon}
            />
            <Text style={[styles.statusText, styles.unpaidText]}>
              Belum Bayar
            </Text>
          </View>
        )}
      </View>

      {/* Items Breakdown */}
      <View style={styles.itemsList}>
        {bill.items.map(item => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.nama_barang}
              </Text>
              {item.catatan ? (
                <Text style={styles.itemNote} numberOfLines={1}>
                  {item.catatan}
                </Text>
              ) : null}
            </View>
            <Text style={styles.itemPrice}>
              Rp {item.harga_final.toLocaleString('id-ID')}
            </Text>
          </View>
        ))}

        {/* Flat Jastip Fee */}
        {bill.tarif_jastip > 0 && (
          <View style={[styles.itemRow, styles.feeRow]}>
            <Text style={styles.feeLabel}>Tarif Flat Jastip</Text>
            <Text style={styles.feePrice}>
              Rp {bill.tarif_jastip.toLocaleString('id-ID')}
            </Text>
          </View>
        )}
      </View>

      {/* Total Footer */}
      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Total Tagihan:</Text>
        <Text style={styles.totalAmount}>
          Rp {bill.total_bayar.toLocaleString('id-ID')}
        </Text>
      </View>

      {/* Payment Proof Status & Action Bar */}
      <View style={styles.proofActionBar}>
        {proof ? (
          <View style={styles.proofStatusRow}>
            <View
              style={[
                styles.proofBadge,
                (proof.status === 'APPROVED' || bill.is_all_paid) &&
                  styles.proofBadgeApproved,
                proof.status === 'REJECTED' &&
                  !bill.is_all_paid &&
                  styles.proofBadgeRejected,
                proof.status === 'PENDING' &&
                  !bill.is_all_paid &&
                  styles.proofBadgePending,
              ]}
            >
              {proof.status === 'APPROVED' || bill.is_all_paid ? (
                <CheckCircle2
                  size={12}
                  color="#166534"
                  style={styles.badgeIcon}
                />
              ) : proof.status === 'REJECTED' ? (
                <AlertCircle
                  size={12}
                  color="#991B1B"
                  style={styles.badgeIcon}
                />
              ) : (
                <Clock size={12} color="#92400E" style={styles.badgeIcon} />
              )}
              <Text
                style={[
                  styles.proofBadgeText,
                  (proof.status === 'APPROVED' || bill.is_all_paid) &&
                    styles.proofBadgeTextApproved,
                  proof.status === 'REJECTED' &&
                    !bill.is_all_paid &&
                    styles.proofBadgeTextRejected,
                  proof.status === 'PENDING' &&
                    !bill.is_all_paid &&
                    styles.proofBadgeTextPending,
                ]}
              >
                {proof.status === 'APPROVED' || bill.is_all_paid
                  ? 'Bukti Disetujui (Lunas)'
                  : proof.status === 'REJECTED'
                  ? 'Bukti Ditolak'
                  : 'Menunggu Konfirmasi'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.viewProofBtn}
              onPress={() => onViewProof && onViewProof(bill)}
              activeOpacity={0.7}
            >
              <Text style={styles.viewProofBtnText}>Lihat Bukti</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Penitip (Requester) Upload Button */}
        {isCurrentUser && !bill.is_all_paid ? (
          <TouchableOpacity
            style={[
              styles.uploadProofBtn,
              proof && styles.uploadProofBtnSecondary,
            ]}
            onPress={() => onUploadProof && onUploadProof(bill)}
            activeOpacity={0.8}
          >
            {proof?.status === 'REJECTED' ? (
              <RefreshCw size={13} color="#FFFFFF" style={styles.badgeIcon} />
            ) : proof ? (
              <RefreshCw
                size={13}
                color={colors.primary}
                style={styles.badgeIcon}
              />
            ) : (
              <Camera size={13} color="#FFFFFF" style={styles.badgeIcon} />
            )}
            <Text
              style={[
                styles.uploadProofBtnText,
                proof && styles.uploadProofBtnTextSecondary,
              ]}
            >
              {proof?.status === 'REJECTED'
                ? 'Unggah Ulang Bukti Transfer'
                : proof
                ? 'Perbarui Bukti Transfer'
                : 'Unggah Bukti Transfer'}
            </Text>
          </TouchableOpacity>
        ) : null}
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
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
    paidContainer: {
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      paddingBottom: 10,
      marginBottom: 10,
    },
    userName: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    userPhone: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 9,
      paddingVertical: 4.5,
      borderRadius: 7,
      gap: 4,
    },
    badgeIcon: {
      marginRight: 2,
    },
    paidBadge: {
      backgroundColor: '#DCFCE7',
    },
    unpaidBadge: {
      backgroundColor: '#FEF3C7',
    },
    unpaidActionBadge: {
      backgroundColor: '#FEF3C7',
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
    },
    paidText: {
      color: colors.accentDark,
    },
    unpaidText: {
      color: '#92400E',
    },
    unpaidActionText: {
      color: '#B45309',
    },
    itemsList: {
      gap: 6,
      marginBottom: 10,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    itemTextContainer: {
      flex: 1,
      marginRight: 10,
    },
    itemName: {
      fontSize: 13,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    itemNote: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    itemPrice: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    feeRow: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: 'transparent',
    },
    feeLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    feePrice: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      paddingTop: 10,
    },
    totalLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    totalAmount: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.primary,
      letterSpacing: -0.2,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    youBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    youBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.primary,
    },
    proofActionBar: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      gap: 8,
    },
    proofStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceSubtle,
      padding: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    proofBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: '#FEF3C7',
      gap: 4,
    },
    proofBadgePending: {
      backgroundColor: '#FEF3C7',
    },
    proofBadgeApproved: {
      backgroundColor: '#DCFCE7',
    },
    proofBadgeRejected: {
      backgroundColor: '#FEE2E2',
    },
    proofBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#92400E',
    },
    proofBadgeTextPending: {
      color: '#92400E',
    },
    proofBadgeTextApproved: {
      color: '#166534',
    },
    proofBadgeTextRejected: {
      color: '#991B1B',
    },
    viewProofBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 7,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    viewProofBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    uploadProofBtn: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    uploadProofBtnSecondary: {
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    uploadProofBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    uploadProofBtnTextSecondary: {
      color: colors.primary,
    },
  });
