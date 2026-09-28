import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, {
  Path,
  Rect,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { useThemeColors } from '../theme/colors';
import { useThemeStore } from '../stores/themeStore';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
  isReady?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  isReady = true,
}) => {
  const colors = useThemeColors();
  const isDarkMode = useThemeStore(state => state.isDarkMode);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;
  const footerFade = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  // 1. Entrance animation (runs once on mount)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(contentFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(contentY, {
            toValue: 0,
            friction: 7,
            tension: 60,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(footerFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Subtle breathing pulse on logo
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.04,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [contentFade, contentY, footerFade, logoOpacity, logoScale, pulseScale]);

  // 2. Minimum display timer & exit transition when ready
  useEffect(() => {
    if (!isReady || !onFinish) return;

    const timer = setTimeout(() => {
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 1800);

    return () => clearTimeout(timer);
  }, [exitOpacity, isReady, onFinish]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          opacity: exitOpacity,
        },
      ]}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        {...(Platform.OS === 'android'
          ? { backgroundColor: colors.background }
          : {})}
      />

      {/* Ambient Background Decorative Glow */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            <LinearGradient id="bgGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop
                offset="0%"
                stopColor={colors.primary}
                stopOpacity={isDarkMode ? 0.15 : 0.08}
              />
              <Stop
                offset="50%"
                stopColor={colors.accent}
                stopOpacity={isDarkMode ? 0.08 : 0.04}
              />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Circle
            cx={width * 0.5}
            cy={height * 0.42}
            r={width * 0.65}
            fill="url(#bgGlow)"
          />
        </Svg>
      </View>

      {/* Main Center Content */}
      <View style={styles.centerContent}>
        {/* Animated Brand Emblem */}
        <Animated.View
          style={[
            styles.emblemWrapper,
            {
              transform: [{ scale: Animated.multiply(logoScale, pulseScale) }],
              opacity: logoOpacity,
              shadowColor: colors.primary,
            },
          ]}
        >
          <Svg width={96} height={96} viewBox="0 0 96 96">
            <Defs>
              <LinearGradient
                id="emblemGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <Stop offset="0%" stopColor="#6366F1" />
                <Stop offset="100%" stopColor="#4338CA" />
              </LinearGradient>
              <LinearGradient
                id="accentGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <Stop offset="0%" stopColor="#34D399" />
                <Stop offset="100%" stopColor="#059669" />
              </LinearGradient>
            </Defs>

            {/* Rounded Squircle Container */}
            <Rect
              x="4"
              y="4"
              width="88"
              height="88"
              rx="26"
              fill="url(#emblemGrad)"
            />

            {/* Subtle Inner Highlight border */}
            <Rect
              x="5"
              y="5"
              width="86"
              height="86"
              rx="25"
              fill="none"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="1.5"
            />

            {/* Left Vertical Bill Pillar (Stem of P) */}
            <Rect
              x="26"
              y="26"
              width="13"
              height="44"
              rx="6.5"
              fill="#FFFFFF"
            />

            {/* Top Loop of P (Card / Fold motif) */}
            <Path
              d="M39 26H52C60.8366 26 68 33.1634 68 42C68 50.8366 60.8366 58 52 58H39V26Z"
              fill="#FFFFFF"
            />

            {/* Accent Split Bar (Emerald Mint slice) */}
            <Rect
              x="40"
              y="37"
              width="14"
              height="10"
              rx="4"
              fill="url(#accentGrad)"
            />

            {/* Micro Coin Dot */}
            <Circle cx="64" cy="67" r="4.5" fill="url(#accentGrad)" />
          </Svg>
        </Animated.View>

        {/* Text Header Content */}
        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: contentFade,
              transform: [{ translateY: contentY }],
            },
          ]}
        >
          <View style={styles.brandTitleRow}>
            <Text
              style={[styles.brandTitleText, { color: colors.textPrimary }]}
            >
              Pay<Text style={{ color: colors.primary }}>Tungan</Text>
            </Text>
          </View>

          <Text
            style={[styles.brandSubtitleText, { color: colors.textSecondary }]}
          >
            Split Bill & Jastip Bareng Sirkel
          </Text>

          {/* Micro Tagline Pill */}
          <View
            style={[
              styles.taglinePill,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[styles.dotPill, { backgroundColor: colors.accent }]}
            />
            <Text style={[styles.taglinePillText, { color: colors.primary }]}>
              Hitung Adil, Bayar Mudah
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Footer Branding */}
      <Animated.View style={[styles.footerBlock, { opacity: footerFade }]}>
        <View style={styles.loadingTrack}>
          <View
            style={[
              styles.loadingIndicator,
              { backgroundColor: colors.primary },
            ]}
          />
        </View>
        <Text style={[styles.footerBrandText, { color: colors.textMuted }]}>
          Aman • Transparan • Otomatis
        </Text>
        <Text style={[styles.footerVersionText, { color: colors.textMuted }]}>
          v1.0.0
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emblemWrapper: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  textBlock: {
    alignItems: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandTitleText: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  brandSubtitleText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: 16,
  },
  taglinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  dotPill: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  taglinePillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footerBlock: {
    alignItems: 'center',
    gap: 8,
  },
  loadingTrack: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  loadingIndicator: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  footerBrandText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  footerVersionText: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.7,
  },
});
