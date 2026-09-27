import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { OrderItem } from '../../types';
import { useThemeColors, ThemeColors } from '../../theme/colors';
import { NotebookPen, X } from 'lucide-react-native';

interface BlindCartItemProps {
  item: OrderItem;
  currentUserId: number;
  isBuyer: boolean;
  canRemove: boolean;
  onRemove: (itemId: number) => void;
}

const ITEM_EMOJIS: Record<string, string> = {
  milk: '🥛',
  coffee: '☕',
  bread: '🍞',
  avocado: '🥑',
  snack: '🍿',
  tea: '🧋',
  food: '🍱',
};

const getItemIcon = (name: string): string => {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(ITEM_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  if (lower.includes('susu') || lower.includes('oat')) return '🥛';
  if (lower.includes('kopi') || lower.includes('latte')) return '☕';
  if (lower.includes('roti')) return '🍞';
  if (lower.includes('buah') || lower.includes('alpukat')) return '🥑';
  if (lower.includes('mie') || lower.includes('nasi') || lower.includes('ayam')) return '🍱';
  return '📦';
};

export const BlindCartItem: React.FC<BlindCartItemProps> = ({
  item,
  currentUserId,
  isBuyer,
  canRemove,
  onRemove,
}) => {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const isMyItem = item.userId === currentUserId;
  const requesterName = isMyItem ? 'Kamu' : item.user?.nama || `Teman #${item.userId}`;
  const iconEmoji = getItemIcon(item.nama_barang);

  return (
    <View style={styles.container}>
      {/* Icon / Thumbnail Box */}
      <View style={styles.iconBox}>
        <Text style={styles.iconEmoji}>{iconEmoji}</Text>
      </View>

      {/* Main Info */}
      <View style={styles.middleContent}>
        <View style={styles.titleRow}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.nama_barang}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>
            Dititip oleh <Text style={styles.metaHighlight}>{requesterName}</Text>
          </Text>
        </View>

        {item.catatan ? (
          <View style={styles.notesRow}>
            <NotebookPen size={13} color={colors.textMuted} />
            <Text style={styles.notes} numberOfLines={1}>
              {item.catatan}
            </Text>
          </View>
        ) : null}

        {item.harga_final !== null && item.harga_final !== undefined ? (
          <Text style={styles.finalPrice}>
            Rp {item.harga_final.toLocaleString('id-ID')}
          </Text>
        ) : (
          <View style={styles.blindPill}>
            <Text style={styles.blindText}>Menunggu harga kasir</Text>
          </View>
        )}
      </View>

      {/* Right Column: Qty and Actions */}
      <View style={styles.rightContent}>
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyText}>1 pcs</Text>
        </View>

        {canRemove && (isMyItem || isBuyer) ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onRemove(item.id)}
            style={styles.deleteButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={15} color={colors.danger} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 14,
      borderRadius: 18,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 1,
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.surfaceSubtle,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    iconEmoji: {
      fontSize: 22,
    },
    middleContent: {
      flex: 1,
      justifyContent: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 3,
    },
    itemName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    metaRow: {
      marginBottom: 4,
    },
    metaLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    metaHighlight: {
      fontWeight: '600',
      color: colors.textPrimary,
    },
    notesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 4,
    },
    notes: {
      fontSize: 11,
      color: colors.textSecondary,
      fontStyle: 'italic',
      flex: 1,
    },
    finalPrice: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.accent,
      marginTop: 2,
    },
    blindPill: {
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginTop: 2,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    blindText: {
      fontSize: 10,
      color: colors.textMuted,
      fontWeight: '600',
    },
    rightContent: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingLeft: 8,
      height: 48,
    },
    qtyBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    qtyText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    deleteButton: {
      padding: 4,
      borderRadius: 8,
      backgroundColor: colors.dangerLight,
    },
  });
