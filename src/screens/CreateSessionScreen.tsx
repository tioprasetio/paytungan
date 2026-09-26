import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Header } from '../components/common/Header';
import { Colors } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';
import { jastipApi } from '../api/jastip.api';

type CreateSessionRouteProp = RouteProp<RootStackParamList, 'CreateSession'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateSession'>;

export const CreateSessionScreen: React.FC = () => {
  const route = useRoute<CreateSessionRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const currentUser = useAuthStore((state) => state.currentUser);

  const { circleId, circleName } = route.params;

  const [lokasi, setLokasi] = useState('');
  const [tarifJastip, setTarifJastip] = useState('5.000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTarifChange = (text: string) => {
    const numeric = text.replace(/\D/g, '');
    if (!numeric) {
      setTarifJastip('');
      return;
    }
    const formatted = parseInt(numeric, 10).toLocaleString('id-ID');
    setTarifJastip(formatted);
    if (error) setError('');
  };

  const handleCreate = async () => {
    if (!lokasi.trim()) {
      setError('Lokasi belanja wajib diisi');
      return;
    }

    const tarif = parseInt(tarifJastip.replace(/\D/g, ''), 10);
    if (isNaN(tarif) || tarif < 0) {
      setError('Tarif flat jastip tidak valid');
      return;
    }

    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError('');
      const newSession = await jastipApi.createSession({
        circleId,
        creatorId: currentUser.id,
        lokasi: lokasi.trim(),
        tarif_jastip: tarif,
      });

      // Directly go to newly created session
      navigation.replace('JastipSession', {
        sessionId: newSession.id,
        lokasi: newSession.lokasi,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuka sesi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Buka Sesi Jastip"
        subtitle={`Untuk Sirkel: ${circleName}`}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Lagi Mau Keluar Belanja?</Text>
          <Text style={styles.subtitle}>
            Beri tahu teman-teman sirkel ke mana kamu pergi. Mereka bisa menitipkan pesanan di keranjang bersama.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <Input
            label="Tujuan / Tempat Belanja"
            placeholder="Contoh: Kopi Kenangan / Superindo / Mie Gacoan"
            value={lokasi}
            onChangeText={(text) => {
              setLokasi(text);
              if (error) setError('');
            }}
          />

          <Input
            label="Tarif Flat Jastip (Rp per penitip)"
            placeholder="Contoh: 5.000"
            keyboardType="numeric"
            value={tarifJastip}
            onChangeText={handleTarifChange}
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 Info Transparansi Jastip:</Text>
            <Text style={styles.infoText}>
              • Tarif ini flat dikenakan satu kali kepada setiap teman yang menitip.{'\n'}
              • Harga barang asli di kasir akan kamu masukkan saat sesi dikunci.
            </Text>
          </View>

          <Button
            title="🚀 Buka Sesi Jastip Sekarang"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleCreate}
            style={styles.submitBtn}
          />
        </ScrollView>
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
  infoBox: {
    backgroundColor: Colors.primaryLight,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: 4,
  },
});
