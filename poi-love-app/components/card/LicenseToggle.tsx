/**
 * POI•LOVE — License Toggle
 *
 * Consenso esplicito per uso creativo della card.
 * Appare in fondo all'AddPOISheet e nella sezione "Le mie opere" del profilo.
 *
 * Due toggle separati e indipendenti:
 *   license_book — libro fotografico annuale POI•LOVE
 *   license_nft  — collezione NFT / blockchain
 *
 * Entrambi default OFF.
 * L'utente può cambiarli in qualsiasi momento.
 * Il timestamp del consenso viene salvato in Supabase.
 *
 * Hash spiegato in linguaggio umano — non tecnico.
 */
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

interface LicenseState {
  book: boolean;
  nft:  boolean;
}

interface Props {
  value:    LicenseState;
  onChange: (val: LicenseState) => void;
}

export default function LicenseToggle({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>

      {/* Header sezione */}
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🔐</Text>
          <View>
            <Text style={styles.headerTitle}>Proprietà e uso creativo</Text>
            <Text style={styles.headerSub}>
              {value.book || value.nft
                ? `${[value.book && 'Libro', value.nft && 'NFT'].filter(Boolean).join(' · ')} attivi`
                : 'Nessun consenso — solo tuo'}
            </Text>
          </View>
        </View>
        <Text style={styles.chevron}>{expanded ? '∧' : '∨'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>

          {/* Spiegazione hash in linguaggio umano */}
          <View style={styles.hashExplain}>
            <Text style={styles.hashTitle}>Come funziona la tua firma digitale</Text>
            <Text style={styles.hashText}>
              Ogni card che crei riceve un'impronta digitale unica — chiamata hash —
              calcolata matematicamente dal contenuto esatto dell'immagine.{'\n\n'}
              Se anche un solo pixel cambia, l'hash cambia completamente.{'\n\n'}
              Questa firma è la prova che sei tu l'autore originale, in quel momento,
              di quel luogo. Nessuno può rivendicare l'opera prima di te.{'\n\n'}
              In futuro potrà essere registrata su blockchain — rendendola un'opera
              digitale certificata e collezionabile.
            </Text>
          </View>

          {/* Toggle Libro annuale */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleIcon}>📖</Text>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Libro fotografico annuale</Text>
                <Text style={styles.toggleDesc}>
                  La tua card potrà essere inclusa nella pubblicazione annuale
                  dei luoghi più amati su POI•LOVE. Il tuo nome apparirà come autore.
                </Text>
              </View>
            </View>
            <Switch
              value={value.book}
              onValueChange={v => onChange({ ...value, book: v })}
              trackColor={{ false: Colors.border, true: Colors.blue }}
              thumbColor={Colors.white}
            />
          </View>

          {/* Toggle NFT */}
          <View style={[styles.toggleRow, styles.toggleRowLast]}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleIcon}>🎨</Text>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Collezione NFT</Text>
                <Text style={styles.toggleDesc}>
                  La tua card potrà essere tokenizzata come opera digitale unica
                  su blockchain e inclusa nella collezione ufficiale POI•LOVE su OpenSea.
                  Riceverai una quota delle royalty di ogni rivendita.
                </Text>
              </View>
            </View>
            <Switch
              value={value.nft}
              onValueChange={v => onChange({ ...value, nft: v })}
              trackColor={{ false: Colors.border, true: Colors.red }}
              thumbColor={Colors.white}
            />
          </View>

          {/* Nota legale minima */}
          <Text style={styles.legalNote}>
            Puoi revocare il consenso in qualsiasi momento dal tuo profilo → Le mie opere.
            La revoca non rimuove le opere già pubblicate ma impedisce usi futuri.
          </Text>

        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    flex:          1,
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize:   Typography.sm,
    fontWeight: Typography.semibold,
    color:      Colors.textPrimary,
  },
  headerSub: {
    fontSize: Typography.xs,
    color:    Colors.textMuted,
    marginTop: 1,
  },
  chevron: {
    fontSize: Typography.sm,
    color:    Colors.textMuted,
  },
  body: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  hashExplain: {
    padding:         Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    gap:             Spacing.sm,
  },
  hashTitle: {
    fontSize:   Typography.sm,
    fontWeight: Typography.semibold,
    color:      Colors.textPrimary,
  },
  hashText: {
    fontSize:   Typography.xs,
    color:      Colors.textSecond,
    lineHeight: Typography.xs * 1.7,
  },
  toggleRow: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    padding:           Spacing.md,
    gap:               Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  toggleRowLast: {
    borderBottomWidth: 0,
  },
  toggleLeft: {
    flex:          1,
    flexDirection: 'row',
    gap:           Spacing.sm,
    alignItems:    'flex-start',
  },
  toggleIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  toggleText: {
    flex: 1,
    gap:  3,
  },
  toggleTitle: {
    fontSize:   Typography.sm,
    fontWeight: Typography.semibold,
    color:      Colors.textPrimary,
  },
  toggleDesc: {
    fontSize:   Typography.xs,
    color:      Colors.textSecond,
    lineHeight: Typography.xs * 1.6,
  },
  legalNote: {
    fontSize:   Typography.xs,
    color:      Colors.textMuted,
    padding:    Spacing.md,
    lineHeight: Typography.xs * 1.6,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
});
