/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * I miei luoghi: l'elenco di quello che ho creato, con stato di visibilita'.
 */
import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase, fetchMyPOIs } from '@/lib/supabase';
import { POI, POIVisibility } from '@/lib/types';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';

const VISIBILITY_LABEL: Record<POIVisibility, string> = {
  private:          'Solo io',
  community:        'Tutta la community',
  suggested_google: 'Proposto dalla mappa',
  official:         'Ufficiale POI•LOVE',
};

const VISIBILITY_COLOR: Record<POIVisibility, string> = {
  private:          Colors.textMuted,
  community:        Colors.blue,
  suggested_google: Colors.red,
  official:         Colors.gold,
};

export default function MyPOIsScreen() {
  const [pois,    setPois]    = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [errore,  setErrore]  = useState<string | null>(null);
  const [userId,  setUserId]  = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadPOIs();
    }, [])
  );

  async function loadPOIs() {
    try {
      setLoading(true);
      setErrore(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const data = await fetchMyPOIs(user.id);
      setPois(data as POI[]);
    } catch (err) {
      // "Vuoto" e "non ho potuto leggere" sono due cose diverse: mostrare a uno
      // che HA dei luoghi la scritta "nessun posto ancora" e' una bugia.
      setErrore(err instanceof Error ? err.message : 'Non riesco a leggere i tuoi luoghi');
    } finally {
      setLoading(false);
    }
  }

  function renderPOI({ item }: { item: POI }) {
    const firstPhoto = item.cover_photo ?? item.photos?.[0];
    return (
      <View style={styles.card}>
        {firstPhoto ? (
          <Image source={{ uri: firstPhoto }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Text style={styles.placeholderText}>📍</Text>
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>{item.title}</Text>
          {item.description && (
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          )}
          <View style={styles.cardMeta}>
            {item.subcategory && <Text style={styles.tag}>{item.subcategory}</Text>}
            <Text style={[styles.visibility, { color: VISIBILITY_COLOR[item.visibility] }]}>
              {VISIBILITY_LABEL[item.visibility]}
            </Text>
            <Text style={styles.loves}>❤️ {item.love_count}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.red} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>I miei POI</Text>
      {errore ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Non riesco a leggere</Text>
          <Text style={styles.emptyDesc}>{errore}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadPOIs} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Riprova</Text>
          </TouchableOpacity>
        </View>
      ) : pois.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyTitle}>Nessun posto ancora</Text>
          <Text style={styles.emptyDesc}>
            Torna alla mappa e tieni premuto per aggiungere il tuo primo luogo.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pois}
          keyExtractor={item => item.id}
          renderItem={renderPOI}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.background,
    paddingTop:      60,
  },
  header: {
    fontSize:   Typography.xl,
    fontWeight: Typography.bold,
    color:      Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom:     Spacing.xl,
    gap:               Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    flexDirection:   'row',
    overflow:        'hidden',
    ...Shadow.sm,
  },
  cardImage: {
    width:  96,
    height: 96,
  },
  cardImagePlaceholder: {
    backgroundColor: Colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  cardBody: {
    flex:    1,
    padding: Spacing.md,
    gap:     4,
    justifyContent: 'center',
  },
  cardName: {
    fontSize:   Typography.md,
    fontWeight: Typography.semibold,
    color:      Colors.textPrimary,
  },
  cardDesc: {
    fontSize: Typography.sm,
    color:    Colors.textSecond,
  },
  cardMeta: {
    flexDirection: 'row',
    gap:           Spacing.sm,
    alignItems:    'center',
    marginTop:     4,
    flexWrap:      'wrap',
  },
  tag: {
    fontSize:        Typography.xs,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical:   2,
    borderRadius:    Radius.full,
    color:           Colors.textSecond,
  },
  visibility: {
    fontSize:   Typography.xs,
    fontWeight: Typography.medium,
  },
  loves: {
    fontSize: Typography.xs,
    color:    Colors.textMuted,
  },
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Spacing.xl,
  },
  retryBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.red,
    paddingHorizontal: 26,
    paddingVertical: 11,
    borderRadius: Radius.md,
  },
  retryBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize:   Typography.lg,
    fontWeight: Typography.semibold,
    color:      Colors.textPrimary,
    textAlign:  'center',
    marginBottom: Spacing.sm,
  },
  emptyDesc: {
    fontSize:  Typography.sm,
    color:     Colors.textSecond,
    textAlign: 'center',
  },
});
