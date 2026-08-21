/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Il mio profilo: chi sono, quanti luoghi, quanti cuori ricevuti.
 */
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Alert, ScrollView, Linking,
} from 'react-native';
import { supabase, getProfile } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email,   setEmail]   = useState<string | null>(null);
  const [stats,   setStats]   = useState({ pois: 0, loves: 0 });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? null);

      const p = await getProfile(user.id);
      setProfile(p);

      // Statistiche: prima gli id dei miei luoghi, poi i due conteggi davvero
      // in parallelo. La versione vecchia annidava un await dentro Promise.all
      // e il parallelismo era finto.
      const miei = await supabase.from('pois').select('id').eq('author_id', user.id);
      if (miei.error) throw miei.error;
      const ids = (miei.data ?? []).map(r => r.id);

      const [poisCount, lovesCount] = await Promise.all([
        Promise.resolve(ids.length),
        ids.length
          ? supabase.from('loves').select('*', { count: 'exact', head: true }).in('poi_id', ids)
              .then(r => { if (r.error) throw r.error; return r.count ?? 0; })
          : Promise.resolve(0),
      ]);

      setStats({ pois: poisCount, loves: lovesCount });
    } catch (err) {
      // Il profilo che non arriva non deve sembrare un profilo vuoto.
      console.warn('profilo non caricato:', err);
      Alert.alert('Profilo non caricato', 'Controlla la connessione e riapri questa scheda.');
    }
  }

  async function handleLogout() {
    Alert.alert('Esci', 'Sei sicuro di voler uscire?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Esci',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  }

  const displayName = profile?.display_name ?? profile?.username ?? email ?? 'Utente';
  const avatarUri   = profile?.avatar_url;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header profilo */}
      <View style={styles.profileHeader}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>
              {displayName[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{displayName}</Text>
        {email && <Text style={styles.email}>{email}</Text>}
      </View>

      {/* Statistiche */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.pois}</Text>
          <Text style={styles.statLabel}>POI aggiunti</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: Colors.red }]}>{stats.loves}</Text>
          <Text style={styles.statLabel}>❤️ ricevuti</Text>
        </View>
      </View>

      {/* Azioni: solo quelle vere. Notifiche e lingua arrivano coi loro
          blocchi del programma (37 e 43): un tasto che non fa niente e' peggio
          di un tasto che non c'e'. */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.actionRow}
          activeOpacity={0.7}
          onPress={() => Linking.openURL('https://poilove.com')}
        >
          <Text style={styles.actionIcon}>ℹ️</Text>
          <Text style={styles.actionText}>Su POI•LOVE</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={styles.logoutText}>Esci dall'account</Text>
      </TouchableOpacity>

      <Text style={styles.version}>POI•LOVE v1.0.0 — Cultural Bridge OS</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingTop:    60,
    paddingBottom: 48,
    paddingHorizontal: Spacing.lg,
    gap:           Spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    gap:        Spacing.sm,
  },
  avatar: {
    width:        88,
    height:       88,
    borderRadius: 44,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.red,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarInitial: {
    fontSize:   Typography.xxl,
    fontWeight: Typography.bold,
    color:      Colors.white,
  },
  name: {
    fontSize:   Typography.xl,
    fontWeight: Typography.bold,
    color:      Colors.textPrimary,
  },
  email: {
    fontSize: Typography.sm,
    color:    Colors.textMuted,
  },
  statsRow: {
    flexDirection:   'row',
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    padding:         Spacing.lg,
    alignItems:      'center',
    justifyContent:  'center',
    ...Shadow.sm,
  },
  statBox: {
    flex:       1,
    alignItems: 'center',
    gap:        4,
  },
  statNumber: {
    fontSize:   Typography.xxl,
    fontWeight: Typography.extrabold,
    color:      Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.xs,
    color:    Colors.textMuted,
  },
  statDivider: {
    width:           1,
    height:          40,
    backgroundColor: Colors.border,
  },
  actionsSection: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    overflow:        'hidden',
    ...Shadow.sm,
  },
  actionRow: {
    flexDirection:  'row',
    alignItems:     'center',
    padding:        Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap:            Spacing.md,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    flex:       1,
    fontSize:   Typography.base,
    color:      Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  actionChevron: {
    fontSize: Typography.lg,
    color:    Colors.textMuted,
  },
  logoutBtn: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     Colors.error,
  },
  logoutText: {
    fontSize:   Typography.base,
    fontWeight: Typography.semibold,
    color:      Colors.error,
  },
  version: {
    fontSize:  Typography.xs,
    color:     Colors.textMuted,
    textAlign: 'center',
  },
});
