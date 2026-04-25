/**
 * POI•LOVE — Card dettaglio POI
 *
 * Appare in basso quando l'utente seleziona un marker.
 * Mostra foto, nome, tag, love count, bottone LOVE e bottone Condividi.
 *
 * Il pulsante "Condividi" è sempre visibile se il POI ha una card_url.
 * Usa share diretto (download + native sheet) — non apre ShareCardSheet,
 * perché per i POI community non abbiamo accesso alla foto locale originale.
 */
import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import { supabase, toggleLove } from '@/lib/supabase';
import { shareCardFromUrl } from '@/lib/card/shareCard';
import { POI } from '@/lib/types';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface Props {
  poi:     POI;
  onClose: () => void;
}

export default function POIDetailCard({ poi, onClose }: Props) {
  const [loveCount,    setLoveCount]    = useState(poi.love_count);
  const [loved,        setLoved]        = useState(false);
  const [lovePending,  setLovePending]  = useState(false);
  const [sharing,      setSharing]      = useState(false);

  async function handleLove() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || lovePending) return;
      setLovePending(true);
      const added = await toggleLove(poi.id, user.id);
      setLoved(added);
      setLoveCount(prev => added ? prev + 1 : Math.max(0, prev - 1));
    } catch (err) {
      console.warn('toggleLove error:', err);
    } finally {
      setLovePending(false);
    }
  }

  async function handleShare() {
    if (!poi.card_url) {
      Alert.alert('Card non disponibile', 'Questo POI non ha ancora una card generata.');
      return;
    }
    try {
      setSharing(true);
      await shareCardFromUrl(poi.card_url, poi.name);
    } catch (err: unknown) {
      Alert.alert('Errore', err instanceof Error ? err.message : 'Errore nella condivisione');
    } finally {
      setSharing(false);
    }
  }

  return (
    <View style={styles.card}>
      {/* Close */}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeIcon}>×</Text>
      </TouchableOpacity>

      {/* Foto */}
      {poi.photo_urls?.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photosScroll}
        >
          {poi.photo_urls.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={styles.photo} />
          ))}
        </ScrollView>
      )}

      {/* Card preview se non ci sono foto raw ma c'è la card */}
      {(!poi.photo_urls || poi.photo_urls.length === 0) && poi.card_url && (
        <Image source={{ uri: poi.card_url }} style={styles.cardPreview} resizeMode="cover" />
      )}

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={2}>{poi.name}</Text>
          <TouchableOpacity
            style={[styles.loveBtn, loved && styles.loveBtnActive]}
            onPress={handleLove}
            disabled={lovePending}
            activeOpacity={0.8}
          >
            <Text style={styles.loveIcon}>{loved ? '❤️' : '🤍'}</Text>
            <Text style={[styles.loveCount, loved && styles.loveCountActive]}>
              {loveCount}
            </Text>
          </TouchableOpacity>
        </View>

        {poi.tag && (
          <Text style={styles.tag}>{poi.tag}</Text>
        )}

        {poi.description && (
          <Text style={styles.description} numberOfLines={3}>
            {poi.description}
          </Text>
        )}

        {poi.profiles?.username && (
          <Text style={styles.author}>
            Aggiunto da @{poi.profiles.username}
          </Text>
        )}

        {/* Azioni — Condividi sempre accessibile */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.shareBtn,
              (!poi.card_url || sharing) && styles.shareBtnDisabled,
            ]}
            onPress={handleShare}
            disabled={!poi.card_url || sharing}
            activeOpacity={0.85}
          >
            {sharing ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.shareBtnText}>
                {poi.card_url ? 'Condividi POI' : 'Card non disponibile'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position:        'absolute',
    bottom:          16,
    left:            16,
    right:           16,
    backgroundColor: Colors.surface,
    borderRadius:    Radius.lg,
    overflow:        'hidden',
    ...Shadow.lg,
  },
  closeBtn: {
    position:        'absolute',
    top:             8,
    right:           8,
    zIndex:          10,
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: 'rgba(26,23,20,0.4)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  closeIcon: {
    fontSize:   20,
    color:      Colors.white,
    lineHeight: 22,
    fontWeight: Typography.bold,
  },
  photosScroll: {
    maxHeight: 160,
  },
  photo: {
    width:      width - 32,
    height:     160,
    resizeMode: 'cover',
  },
  // Fallback: mostra la card composita se non ci sono foto raw
  cardPreview: {
    width:  width - 32,
    height: 160,
  },
  info: {
    padding: Spacing.md,
    gap:     Spacing.sm,
  },
  titleRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    gap:            Spacing.md,
  },
  name: {
    flex:       1,
    fontSize:   Typography.lg,
    fontWeight: Typography.bold,
    color:      Colors.textPrimary,
  },
  loveBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: 10,
    paddingVertical:   6,
    borderRadius:      Radius.full,
    borderWidth:       1,
    borderColor:       Colors.border,
    backgroundColor:   Colors.background,
  },
  loveBtnActive: {
    borderColor:     Colors.red,
    backgroundColor: '#FFF0F0',
  },
  loveIcon: {
    fontSize: 16,
  },
  loveCount: {
    fontSize:   Typography.sm,
    fontWeight: Typography.semibold,
    color:      Colors.textSecond,
  },
  loveCountActive: {
    color: Colors.red,
  },
  tag: {
    alignSelf:         'flex-start',
    fontSize:          Typography.xs,
    backgroundColor:   Colors.background,
    paddingHorizontal: 10,
    paddingVertical:   3,
    borderRadius:      Radius.full,
    color:             Colors.textSecond,
    fontWeight:        Typography.medium,
    borderWidth:       1,
    borderColor:       Colors.border,
  },
  description: {
    fontSize:   Typography.sm,
    color:      Colors.textSecond,
    lineHeight: Typography.sm * 1.6,
  },
  author: {
    fontSize: Typography.xs,
    color:    Colors.textMuted,
  },
  actionsRow: {
    marginTop: Spacing.xs,
  },
  shareBtn: {
    backgroundColor: Colors.red,
    borderRadius:    Radius.md,
    paddingVertical: Spacing.sm + 2,
    alignItems:      'center',
    ...Shadow.sm,
  },
  shareBtnDisabled: {
    opacity: 0.45,
  },
  shareBtnText: {
    fontSize:   Typography.sm,
    fontWeight: Typography.bold,
    color:      Colors.white,
  },
});
