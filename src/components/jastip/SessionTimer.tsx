import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../theme/colors';

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
  label = 'menitipkan pesanan barang',
  isLocked = false,
  isBuyer = false,
  onExtendTime,
  extending = false,
}) => {
  const calculateRemaining = () => {
    if (waktuTutup) {
      const target = new Date(waktuTutup).getTime();
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
      return diff;
    }
    return initialSeconds;
  };

  const [secondsRemaining, setSecondsRemaining] = useState(calculateRemaining);

  useEffect(() => {
    setSecondsRemaining(calculateRemaining());
  }, [waktuTutup]);

  useEffect(() => {
    if (isLocked) return;

    const timer = setInterval(() => {
      if (waktuTutup) {
        setSecondsRemaining(calculateRemaining());
      } else {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, waktuTutup]);

  const isExpired = secondsRemaining <= 0;
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

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
          <Text style={[styles.remainingLabel, isExpired && styles.expiredLabel]}>
            {isLocked ? 'Status' : isExpired ? 'Waktu Habis' : 'Sisa Waktu'}
          </Text>
          <Text style={[styles.timerDigits, isExpired && styles.expiredDigits]}>
            {isLocked ? 'Locked' : formattedTime}
          </Text>
          <Text style={styles.subLabel} numberOfLines={1}>
            {isLocked ? 'Sesi Dikunci' : isExpired ? 'Bisa Diperpanjang' : label}
          </Text>
        </View>
      </View>

      {/* Time Expired Notice & Quick Extend Controls */}
      {isExpired && !isLocked ? (
        <View style={styles.expiredNoticeBox}>
          <Text style={styles.expiredNoticeText}>
            {isBuyer
              ? '⏱️ Waktu titip habis! Kunci keranjang sekarang atau perpanjang waktu:'
              : '⏱️ Waktu titip habis. Menunggu pembeli mengunci atau memperpanjang waktu.'}
          </Text>
        </View>
      ) : null}

      {/* Buyer Quick Extend Action Buttons */}
      {isBuyer && !isLocked ? (
        <View style={styles.extendSection}>
          <Text style={styles.extendHeading}>
            {isExpired ? 'Pilih Tambahan Waktu:' : '+ Perpanjang Waktu Belanja:'}
          </Text>
          <View style={styles.extendButtonsRow}>
            {[5, 10, 15].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[styles.extendBtn, extending && styles.btnDisabled]}
                disabled={extending}
                onPress={() => handleQuickExtend(mins)}
                activeOpacity={0.7}
              >
                {extending ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
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

const styles = StyleSheet.create({
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
    backgroundColor: Colors.surface,
    shadowColor: Colors.shadow.shadowColor,
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
    borderColor: '#EEF2FF',
    borderTopColor: Colors.primary,
    borderRightColor: Colors.primary,
    transform: [{ rotate: '-45deg' }],
  },
  expiredRing: {
    borderColor: '#FEF3C7',
    borderTopColor: Colors.warning,
    borderRightColor: Colors.warning,
  },
  lockedRing: {
    borderColor: '#F1F5F9',
    borderTopColor: Colors.textMuted,
    borderRightColor: Colors.textMuted,
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  remainingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expiredLabel: {
    color: Colors.warning,
    fontWeight: '800',
  },
  timerDigits: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  expiredDigits: {
    color: Colors.warning,
  },
  subLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  expiredNoticeBox: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 14,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  expiredNoticeText: {
    fontSize: 12,
    color: '#92400E',
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
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  extendButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  extendBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    minWidth: 72,
    alignItems: 'center',
  },
  extendBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
