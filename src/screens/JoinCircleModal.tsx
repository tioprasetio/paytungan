import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Header } from '../components/common/Header';
import { Colors } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';
import { circleApi } from '../api/circle.api';

export const JoinCircleModal: React.FC = () => {
  const navigation = useNavigation();
  const currentUser = useAuthStore((state) => state.currentUser);

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
      setError(err instanceof Error ? err.message : 'Gagal bergabung ke sirkel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Gabung Sirkel" onBack={() => navigation.goBack()} />

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
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <Input
            label="Kode Join"
            placeholder="Contoh: KOS123"
            autoCapitalize="characters"
            value={kodeJoin}
            onChangeText={(text) => {
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
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
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
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 10,
  },
});
