import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Receipt, NotebookPen } from 'lucide-react-native';
import { Header } from '../components/common/Header';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useThemeColors, ThemeColors } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';
import { jastipApi } from '../api/jastip.api';
import { OrderItem } from '../types';
import { useAlert } from '../context/AlertContext';
import { LinearGradientView } from '../components/common/LinearGradientView';

type InputPricesRouteProp = RouteProp<RootStackParamList, 'InputPrices'>;
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'InputPrices'
>;

export const InputPricesScreen: React.FC = () => {
  const route = useRoute<InputPricesRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const currentUser = useAuthStore(state => state.currentUser);
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { showAlert, showWarning, showError } = useAlert();

  const { sessionId, lokasi } = route.params;

  const [items, setItems] = useState<OrderItem[]>([]);
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const session = await jastipApi.getSessionById(sessionId);
        setItems(session.items || []);

        const initialPrices: Record<number, string> = {};
        session.items?.forEach(item => {
          if (item.harga_final !== null && item.harga_final !== undefined) {
            initialPrices[item.id] = item.harga_final.toLocaleString('id-ID');
          }
        });
        setPrices(initialPrices);
      } catch {
        showError(
          'Gagal Memuat Data',
          'Gagal memuat barang untuk input harga.',
        );
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [sessionId, showError]);

  const handlePriceChange = (itemId: number, text: string) => {
    const numeric = text.replace(/\D/g, '');
    if (!numeric) {
      setPrices(prev => ({ ...prev, [itemId]: '' }));
      return;
    }
    const formatted = parseInt(numeric, 10).toLocaleString('id-ID');
    setPrices(prev => ({ ...prev, [itemId]: formatted }));
  };

  const handleSavePrices = async () => {
    // Validate all items have price
    const unpricedItems = items.filter(item => {
      const numeric = (prices[item.id] || '').replace(/\D/g, '');
      return !numeric || parseInt(numeric, 10) <= 0;
    });

    if (unpricedItems.length > 0) {
      showWarning(
        'Harga Belum Lengkap',
        `Masih ada ${unpricedItems.length} barang yang belum dimasukkan harganya.`,
      );
      return;
    }

    if (!currentUser?.id) return;

    try {
      setSubmitting(true);
      const pricePayload = items.map(item => ({
        itemId: item.id,
        harga_final: parseInt((prices[item.id] || '0').replace(/\D/g, ''), 10),
      }));

      await jastipApi.inputPrices(sessionId, currentUser.id, pricePayload);

      showAlert({
        title: 'Berhasil Disimpan!',
        message:
          'Harga asli dari struk telah tersimpan. Split bill otomatis dihitung untuk seluruh anggota sirkel.',
        type: 'success',
        buttons: [
          {
            text: 'Lihat Rekap Split Bill',
            style: 'primary',
            onPress: () => {
              navigation.replace('SplitBillRecap', { sessionId, lokasi });
            },
          },
        ],
      });
    } catch (err: unknown) {
      showError(
        'Gagal Menyimpan Harga',
        err instanceof Error ? err.message : 'Gagal menyimpan harga',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradientView colors={colors.bgGradient} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <Header
          title="Input Harga Kasir / Struk"
          subtitle={`Lokasi: ${lokasi}`}
          onBack={() => navigation.goBack()}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Memuat daftar pesanan...</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                Tidak ada barang dalam sesi ini.
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.banner}>
                <View style={styles.bannerHeaderRow}>
                  <Receipt size={18} color={colors.primary} />
                  <Text style={styles.bannerTitle}>
                    Masukkan Harga Sesuai Struk Belanja
                  </Text>
                </View>
                <Text style={styles.bannerSub}>
                  Input nominal harga satuan final dari setiap barang penitip
                  untuk otomatisasi split bill.
                </Text>
              </View>

              {items.map(item => (
                <Card key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.nama_barang}</Text>
                    <Text style={styles.itemRequester}>
                      Penitip:{' '}
                      <Text style={styles.bold}>
                        {item.user?.nama || 'Teman'}
                      </Text>
                    </Text>
                  </View>

                  {item.catatan ? (
                    <View style={styles.noteRow}>
                      <NotebookPen size={12} color={colors.textSecondary} />
                      <Text style={styles.itemNotes}>
                        Catatan: {item.catatan}
                      </Text>
                    </View>
                  ) : null}

                  <Input
                    label="Harga Final Kasir (Rp)"
                    placeholder="Contoh: 30.000"
                    keyboardType="numeric"
                    value={prices[item.id] || ''}
                    onChangeText={text => handlePriceChange(item.id, text)}
                    containerStyle={styles.priceInputContainer}
                  />
                </Card>
              ))}

              <Button
                title="Simpan & Hitung Split Bill"
                size="lg"
                loading={submitting}
                onPress={handleSavePrices}
                style={styles.saveBtn}
              />
            </ScrollView>
          )}
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
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 10,
      color: colors.textSecondary,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    banner: {
      backgroundColor: colors.surfaceSubtle,
      padding: 14,
      borderRadius: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    bannerHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    bannerTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    bannerSub: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    itemCard: {
      marginBottom: 12,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    itemName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
      marginRight: 8,
    },
    itemRequester: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    bold: {
      fontWeight: '700',
      color: colors.textPrimary,
    },
    noteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 4,
    },
    itemNotes: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
      flex: 1,
    },
    priceInputContainer: {
      marginBottom: 0,
      marginTop: 8,
    },
    saveBtn: {
      marginTop: 12,
    },
  });
