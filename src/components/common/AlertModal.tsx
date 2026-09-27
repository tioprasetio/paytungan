import React, { useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { useThemeColors, ThemeColors } from '../../theme/colors';

export type AlertType = 'warning' | 'error' | 'success' | 'info' | 'confirm';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
  onPress?: () => void;
}

export interface AlertModalProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: AlertType;
  icon?: string;
  buttons?: AlertButton[];
  onClose?: () => void;
}

const { width } = Dimensions.get('window');

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  type = 'info',
  icon,
  buttons,
  onClose,
}) => {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'warning':
        return {
          icon: icon || '⚠️',
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          accentColor: colors.warning,
        };
      case 'error':
        return {
          icon: icon || '❌',
          iconBg: '#FEE2E2',
          iconColor: '#DC2626',
          accentColor: colors.danger,
        };
      case 'success':
        return {
          icon: icon || '🎉',
          iconBg: '#D1FAE5',
          iconColor: '#059669',
          accentColor: colors.accent,
        };
      case 'confirm':
        return {
          icon: icon || '❓',
          iconBg: '#EEF2FF',
          iconColor: '#4F46E5',
          accentColor: colors.primary,
        };
      case 'info':
      default:
        return {
          icon: icon || '💡',
          iconBg: '#EEF2FF',
          iconColor: '#4F46E5',
          accentColor: colors.primary,
        };
    }
  };

  const config = getTypeConfig();

  // Default buttons if none provided
  const actionButtons: AlertButton[] =
    buttons && buttons.length > 0
      ? buttons
      : [
          {
            text: 'OK',
            style: 'primary',
            onPress: onClose,
          },
        ];

  const handleButtonPress = (btn: AlertButton) => {
    if (btn.onPress) {
      btn.onPress();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={e => e.stopPropagation?.()}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Type Accent Badge Header */}
            <View
              style={[styles.iconContainer, { backgroundColor: config.iconBg }]}
            >
              <Text style={styles.iconText}>{config.icon}</Text>
            </View>

            {/* Title & Message */}
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}

            {/* Action Buttons */}
            <View
              style={[
                styles.buttonContainer,
                actionButtons.length === 2
                  ? styles.twoButtonsRow
                  : styles.columnButtons,
              ]}
            >
              {actionButtons.map((btn, index) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';
                const isPrimary =
                  btn.style === 'primary' ||
                  (!btn.style && index === actionButtons.length - 1);

                let btnBgStyle = styles.btnDefaultBg;
                let btnTextStyle = styles.btnDefaultText;

                if (isDestructive) {
                  btnBgStyle = styles.btnDestructiveBg;
                  btnTextStyle = styles.btnDestructiveText;
                } else if (isCancel) {
                  btnBgStyle = styles.btnCancelBg;
                  btnTextStyle = styles.btnCancelText;
                } else if (isPrimary) {
                  btnBgStyle = styles.btnPrimaryBg;
                  btnTextStyle = styles.btnPrimaryText;
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      btnBgStyle,
                      actionButtons.length === 2 && styles.flexButton,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleButtonPress(btn)}
                  >
                    <Text style={[styles.btnText, btnTextStyle]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalCard: {
      width: Math.min(width - 48, 380),
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 22,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    iconText: {
      fontSize: 28,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: 24,
    },
    message: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
      paddingHorizontal: 6,
    },
    buttonContainer: {
      width: '100%',
    },
    twoButtonsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    columnButtons: {
      flexDirection: 'column',
      gap: 10,
    },
    flexButton: {
      flex: 1,
    },
    button: {
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnText: {
      fontSize: 14,
      fontWeight: '700',
    },
    btnPrimaryBg: {
      backgroundColor: colors.primary,
    },
    btnPrimaryText: {
      color: '#FFFFFF',
    },
    btnDestructiveBg: {
      backgroundColor: colors.danger,
    },
    btnDestructiveText: {
      color: '#FFFFFF',
    },
    btnCancelBg: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
    },
    btnCancelText: {
      color: colors.textSecondary,
    },
    btnDefaultBg: {
      backgroundColor: colors.primaryLight,
    },
    btnDefaultText: {
      color: colors.primaryDark,
    },
  });
