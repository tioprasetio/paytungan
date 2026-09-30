import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useThemeColors, ThemeColors } from '../../theme/colors';

interface SessionTimerProps {
  waktuTutup?: string | Date | null;
  initialSeconds?: number;
  label?: string;
  isLocked?: boolean;
  isBuyer?: boolean;
  onExtendTime?: (minutes: number) => Promise<void> | void;
  extending?: boolean;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({
  waktuTutup,
  initialSeconds = 300, // default 5 mins if no waktuTutup
  label = 'titip pesanan barang',
  isLocked = false,
  isBuyer = false,
  onExtendTime,
  extending = false,
}) => {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const calculateRemaining = useCallback(() => {
    if (waktuTutup) {
      const target = new Date(waktuTutup).getTime();
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
      return diff;
    }
    return initialSeconds;
  }, [waktuTutup, initialSeconds]);

  const [secondsRemaining, setSecondsRemaining] = useState(calculateRemaining);

  useEffect(() => {
    setSecondsRemaining(calculateRemaining());
  }, [calculateRemaining]);

  useEffect(() => {
    if (isLocked) return;

    const timer = setInterval(() => {
      if (waktuTutup) {
        setSecondsRemaining(calculateRemaining());
      } else {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, waktuTutup, calculateRemaining]);

  const isExpired = secondsRemaining <= 0;
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(
    seconds,
  ).padStart(2, '0')}`;

  const handleQuickExtend = (mins: number) => {
    if (onExtendTime && !extending) {
      onExtendTime(mins);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerCircle}>
        <View
          style={[
            styles.outerBorderRing,
            isExpired && styles.expiredRing,
            isLocked && styles.lockedRing,
          ]}
        />
        <View style={styles.innerContent}>
          <Text
            style={[styles.remainingLabel, isExpired && styles.expiredLabel]}
          >
            {isLocked ? 'Status' : isExpired ? 'Waktu Habis' : 'Sisa Waktu'}
          </Text>
          <Text style={[styles.timerDigits, isExpired && styles.expiredDigits]}>
            {isLocked ? 'Locked' : formattedTime}
          </Text>
          <Text style={styles.subLabel} numberOfLines={1}>
            {isLocked
              ? 'Sesi Dikunci'
              : isExpired
              ? 'Bisa Diperpanjang'
              : label}
          </Text>
        </View>
      </View>

      {/* Time Expired Notice & Quick Extend Controls */}
      {isExpired && !isLocked ? (
        <View style={styles.expiredNoticeBox}>
          <Text style={styles.expiredNoticeText}>
            {isBuyer
              ? 'Waktu titip habis! Kunci keranjang sekarang atau perpanjang waktu:'
              : 'Waktu titip habis. Menunggu pembeli mengunci atau memperpanjang waktu.'}
          </Text>
        </View>
      ) : null}

      {/* Buyer Quick Extend Action Buttons */}
      {isBuyer && !isLocked ? (
        <View style={styles.extendSection}>
          <Text style={styles.extendHeading}>
            {isExpired
              ? 'Pilih Tambahan Waktu:'
              : '+ Perpanjang Waktu Belanja:'}
          </Text>
          <View style={styles.extendButtonsRow}>
            {[5, 10, 15].map(mins => (
              <TouchableOpacity
                key={mins}
                style={[styles.extendBtn, extending && styles.btnDisabled]}
                disabled={extending}
                onPress={() => handleQuickExtend(mins)}
                activeOpacity={0.7}
              >
                {extending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.extendBtnText}>+{mins} Mnt</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 14,
    },
    timerCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    outerBorderRing: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 6,
      borderColor: colors.surfaceSubtle,
      borderTopColor: colors.primary,
      borderRightColor: colors.primary,
      transform: [{ rotate: '-45deg' }],
    },
    expiredRing: {
      borderColor: colors.surfaceSubtle,
      borderTopColor: colors.warning,
      borderRightColor: colors.warning,
    },
    lockedRing: {
      borderColor: colors.surfaceSubtle,
      borderTopColor: colors.textMuted,
      borderRightColor: colors.textMuted,
    },
    innerContent: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    remainingLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    expiredLabel: {
      color: colors.warning,
      fontWeight: '800',
    },
    timerDigits: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
    expiredDigits: {
      color: colors.warning,
    },
    subLabel: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
      textAlign: 'center',
    },
    expiredNoticeBox: {
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      marginTop: 14,
      maxWidth: 320,
      borderWidth: 1,
      borderColor: colors.warningLight,
    },
    expiredNoticeText: {
      fontSize: 12,
      color: colors.warning,
      textAlign: 'center',
      fontWeight: '600',
      lineHeight: 17,
    },
    extendSection: {
      alignItems: 'center',
      marginTop: 12,
      width: '100%',
    },
    extendHeading: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    extendButtonsRow: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
    },
    extendBtn: {
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderLight,
      minWidth: 72,
      alignItems: 'center',
    },
    extendBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    btnDisabled: {
      opacity: 0.6,
    },
  });
