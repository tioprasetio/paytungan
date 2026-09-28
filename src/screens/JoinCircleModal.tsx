import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AlertCircle } from 'lucide-react-native';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Header } from '../components/common/Header';
import { useThemeColors, ThemeColors } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';
import { circleApi } from '../api/circle.api';

import { LinearGradientView } from '../components/common/LinearGradientView';

export const JoinCircleModal: React.FC = () => {
  const navigation = useNavigation();
  const currentUser = useAuthStore(state => state.currentUser);
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [kodeJoin, setKodeJoin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!kodeJoin.trim()) {
      setError('Kode join wajib diisi');
      return;
    }
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError('');
      await circleApi.joinCircle(kodeJoin.trim().toUpperCase(), currentUser.id);
      navigation.goBack();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Gagal bergabung ke sirkel',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradientView colors={colors.bgGradient} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <Header title="Gabung Sirkel" onBack={() => navigation.goBack()} transparent />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <View style={styles.content}>
            <Text style={styles.heading}>Masukkan Kode Sirkel</Text>
            <Text style={styles.subtitle}>
              Minta 6 karakter kode join unik dari teman atau pemilik sirkel.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <AlertCircle size={15} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Kode Join"
              placeholder="Contoh: KOS123"
              autoCapitalize="characters"
              value={kodeJoin}
              onChangeText={text => {
                setKodeJoin(text.toUpperCase());
                if (error) setError('');
              }}
            />

            <Button
              title="Gabung ke Sirkel"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleJoin}
              style={styles.submitBtn}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradientView>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    container: {
      flex: 1,
    },
    content: {
      padding: 24,
    },
    heading: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 20,
      lineHeight: 18,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.dangerLight,
      padding: 10,
      borderRadius: 10,
      marginBottom: 16,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: '600',
    },
    submitBtn: {
      marginTop: 10,
    },
  });
