import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Bounty, User } from '../../types';
import { useThemeColors, ThemeColors } from '../../theme/colors';
import {
  Coins,
  MapPin,
  Home,
  ShoppingBag,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Receipt,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';

interface BountyCardProps {
  bounty: Bounty;
  currentUser?: User | null;
  onPress?: () => void;
  onClaim?: (bounty: Bounty) => void;
  onAction?: (bounty: Bounty) => void;
  style?: StyleProp<ViewStyle>;
}

export const BountyCard: React.FC<BountyCardProps> = ({
  bounty,
  currentUser,
  onPress,
  onClaim,
  onAction,
  style,
}) => {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const isCreator = currentUser?.id === bounty.creatorId;
  const isRunner = currentUser?.id === bounty.runnerId;

  const statusConfig = useMemo(() => {
    switch (bounty.status) {
      case 'OPEN':
        return {
          label: 'MENCARI RUNNER',
          color: '#EA580C',
          bg: '#FFF7ED',
          border: '#FED7AA',
          icon: Sparkles,
        };
      case 'TAKEN':
        return {
          label: 'SEDANG DIPROSES',
          color: '#4F46E5',
          bg: '#EEF2FF',
          border: '#C7D2FE',
          icon: ShoppingBag,
        };
      case 'BOUGHT':
        return {
          label: 'SUDAH DIBELI',
          color: '#059669',
          bg: '#ECFDF5',
          border: '#A7F3D0',
          icon: Receipt,
        };
      case 'COMPLETED':
        return {
          label: 'SELESAI',
          color: '#16A34A',
          bg: '#F0FDF4',
          border: '#BBF7D0',
          icon: CheckCircle2,
        };
      case 'CANCELLED':
        return {
          label: 'DIBATALKAN',
          color: '#6B7280',
          bg: '#F3F4F6',
          border: '#E5E7EB',
          icon: AlertCircle,
        };
      default:
        return {
          label: bounty.status,
          color: '#4F46E5',
          bg: '#EEF2FF',
          border: '#C7D2FE',
          icon: Sparkles,
        };
    }
  }, [bounty.status]);

  const handleWhatsAppChat = () => {
    const targetUser = isCreator ? bounty.runner : bounty.creator;
    if (!targetUser?.no_whatsapp) return;
    let cleanPhone = targetUser.no_whatsapp.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    const msg = `Halo ${targetUser.nama}, mengenai Bounty "${bounty.judul}" di PayTungan...`;
    Linking.openURL(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
    );
  };

  const StatusIcon = statusConfig.icon;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.card, style]}
    >
      {/* Header Row: Status Badge & Reward Badge */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusConfig.bg,
              borderColor: statusConfig.border,
            },
          ]}
        >
          <StatusIcon size={12} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>

        <View style={styles.rewardBadge}>
          <Coins size={14} color={colors.success} />
          <Text style={styles.rewardText}>
            +Rp {bounty.imbalan_bounty.toLocaleString('id-ID')}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {bounty.judul}
      </Text>

      {/* Description if any */}
      {Boolean(bounty.deskripsi) && (
        <Text style={styles.description} numberOfLines={2}>
          {bounty.deskripsi}
        </Text>
      )}

      {/* Info details */}
      <View style={styles.infoContainer}>
        {Boolean(bounty.lokasi_beli) && (
          <View style={styles.infoRow}>
            <MapPin size={13} color={colors.textSecondary} />
            <Text style={styles.infoText} numberOfLines={1}>
              Beli: {bounty.lokasi_beli}
            </Text>
          </View>
        )}
        {Boolean(bounty.lokasi_tujuan) && (
          <View style={styles.infoRow}>
            <Home size={13} color={colors.textSecondary} />
            <Text style={styles.infoText} numberOfLines={1}>
              Antar ke: {bounty.lokasi_tujuan}
            </Text>
          </View>
        )}
        {Boolean(bounty.estimasi_harga) && (
          <View style={styles.infoRow}>
            <ShoppingBag size={13} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              Est. Belanja: Rp {bounty.estimasi_harga?.toLocaleString('id-ID')}
            </Text>
          </View>
        )}
      </View>

      {/* Footer: User Avatars & Action Button */}
      <View style={styles.footerRow}>
        <View style={styles.userContainer}>
          <View style={styles.userAvatar}>
            <UserIcon size={13} color="#4F46E5" />
          </View>
          <View style={styles.userText}>
            <Text style={styles.userName} numberOfLines={1}>
              {bounty.creator?.nama || 'Member Sirkel'}
              {isCreator ? ' (Anda)' : ''}
            </Text>
            {bounty.runner ? (
              <Text style={styles.runnerText} numberOfLines={1}>
                Runner: {bounty.runner.nama} {isRunner ? '(Anda)' : ''}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Quick Action Button */}
        {bounty.status === 'OPEN' && !isCreator && onClaim && (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => onClaim(bounty)}
            activeOpacity={0.8}
          >
            <Text style={styles.claimButtonText}>Ambil</Text>
            <ChevronRight size={14} color="#FFF" />
          </TouchableOpacity>
        )}

        {bounty.status === 'TAKEN' && isRunner && onAction && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onAction(bounty)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Input Struk</Text>
          </TouchableOpacity>
        )}
        {/* WhatsApp Button when in progress */}
        {['TAKEN', 'BOUGHT'].includes(bounty.status) &&
          (isCreator || isRunner) && (
            <TouchableOpacity
              style={styles.waButton}
              onPress={handleWhatsAppChat}
              activeOpacity={0.7}
            >
              <MessageCircle size={15} color={colors.success} />
            </TouchableOpacity>
          )}
      </View>
      {bounty.status === 'BOUGHT' && isCreator && onAction && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: '#10B981', marginTop: 8 },
          ]}
          onPress={() => onAction(bounty)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.actionButtonText,
              { fontSize: 12, textAlign: 'center' },
            ]}
          >
            Bayar & Terima
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    rewardBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.successLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.successLight,
    },
    rewardText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.success,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    description: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 10,
      lineHeight: 18,
    },
    infoContainer: {
      gap: 5,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    infoText: {
      fontSize: 12,
      color: colors.textSecondary,
      flex: 1,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    userContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      marginRight: 8,
    },
    userAvatar: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#EEF2FF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    userText: {
      flex: 1,
      flexDirection: 'column',
      gap: 4,
    },
    userName: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    runnerText: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    claimButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#4F46E5',
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 10,
    },
    claimButtonText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '700',
    },
    actionButton: {
      backgroundColor: '#4F46E5',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      marginTop: 5,
    },
    actionButtonText: {
      color: '#FFF',
      fontSize: 11,
      fontWeight: '700',
    },
    waButton: {
      backgroundColor: colors.successLight,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 6,
    },
  });
