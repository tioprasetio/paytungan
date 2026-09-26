import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserBillDetail } from '../../types';
import { Colors } from '../../theme/colors';
import { useAlert } from '../../context/AlertContext';

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
              activeOpacity={0.9}
              onLongPress={() => {
                showConfirm(
                  'Ubah Status Pembayaran',
                  `Apakah Anda ingin membatalkan status Lunas untuk ${bill.nama}?`,
                  () => onToggleUserPaid && onToggleUserPaid(),
                  undefined,
                  'Ubah ke Belum Lunas',
                  'Batal',
                  true
                );
              }}
            >
              <Text style={[styles.statusText, styles.paidText]}>✅ Lunas</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.statusBadge, styles.paidBadge]}>
              <Text style={[styles.statusText, styles.paidText]}>✅ Lunas</Text>
            </View>
          )
        ) : isBuyer ? (
          <TouchableOpacity
            style={[styles.statusBadge, styles.unpaidActionBadge]}
            onPress={() => {
              showConfirm(
                'Konfirmasi Pembayaran',
                `Tandai tagihan ${bill.nama} sebesar Rp ${bill.total_bayar.toLocaleString('id-ID')} sebagai LUNAS (misal: bayar tunai / transfer langsung)?`,
                () => onToggleUserPaid && onToggleUserPaid(),
                undefined,
                'Tandai Lunas',
                'Batal'
              );
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.statusText, styles.unpaidActionText]}>
              ⏳ Tandai Lunas
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.statusBadge, styles.unpaidBadge]}>
            <Text style={[styles.statusText, styles.unpaidText]}>⏳ Belum Bayar</Text>
          </View>
        )}
      </View>

      {/* Items Breakdown */}
      <View style={styles.itemsList}>
        {bill.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemName}>• {item.nama_barang}</Text>
              {item.catatan ? (
                <Text style={styles.itemNote}>{item.catatan}</Text>
              ) : null}
            </View>
            <Text style={styles.itemPrice}>
              Rp {item.harga_final.toLocaleString('id-ID')}
            </Text>
          </View>
        ))}

        {/* Flat Jastip Fee */}
        <View style={styles.itemRow}>
          <Text style={styles.feeLabel}>• Tarif Flat Jastip</Text>
          <Text style={styles.feePrice}>
            Rp {bill.tarif_jastip.toLocaleString('id-ID')}
          </Text>
        </View>
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
                (proof.status === 'APPROVED' || bill.is_all_paid) && styles.proofBadgeApproved,
                proof.status === 'REJECTED' && !bill.is_all_paid && styles.proofBadgeRejected,
                proof.status === 'PENDING' && !bill.is_all_paid && styles.proofBadgePending,
              ]}
            >
              <Text
                style={[
                  styles.proofBadgeText,
                  (proof.status === 'APPROVED' || bill.is_all_paid) && styles.proofBadgeTextApproved,
                  proof.status === 'REJECTED' && !bill.is_all_paid && styles.proofBadgeTextRejected,
                  proof.status === 'PENDING' && !bill.is_all_paid && styles.proofBadgeTextPending,
                ]}
              >
                {proof.status === 'APPROVED' || bill.is_all_paid
                  ? '✅ Bukti Disetujui (Lunas)'
                  : proof.status === 'REJECTED'
                  ? '❌ Bukti Ditolak'
                  : '⏳ Menunggu Konfirmasi'}
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
            style={[styles.uploadProofBtn, proof && styles.uploadProofBtnSecondary]}
            onPress={() => onUploadProof && onUploadProof(bill)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.uploadProofBtnText,
                proof && styles.uploadProofBtnTextSecondary,
              ]}
            >
              {proof?.status === 'REJECTED'
                ? '🔄 Unggah Ulang Bukti Transfer'
                : proof
                ? '🔄 Perbarui Bukti Transfer'
                : '📸 Unggah Bukti Transfer'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  paidContainer: {
    borderColor: Colors.successLight,
    backgroundColor: '#F7FEFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 10,
    marginBottom: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  userPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paidBadge: {
    backgroundColor: Colors.successLight,
  },
  unpaidBadge: {
    backgroundColor: Colors.warningLight,
  },
  unpaidActionBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  paidText: {
    color: Colors.accentDark,
  },
  unpaidText: {
    color: Colors.warning,
  },
  unpaidActionText: {
    color: '#B45309',
  },
  itemsList: {
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  itemNote: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginLeft: 10,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  feeLabel: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  feePrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  youBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  proofActionBar: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 8,
  },
  proofStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 10,
  },
  proofBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
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
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  viewProofBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  uploadProofBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadProofBtnSecondary: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  uploadProofBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  uploadProofBtnTextSecondary: {
    color: Colors.primary,
  },
});
