/**
 * POI•LOVE — Share Card Sheet
 *
 * Bottom sheet di condivisione con:
 * - Anteprima card in tempo reale
 * - Toggle: mostra/nascondi titolo e sintesi
 * - Scelta formato: Feed (4:5) o Stories (9:16)
 * - Bottone condividi → share sheet nativo
 * - Bottone salva → galleria foto
 *
 * Il logo POI•LOVE è sempre presente e non togglable.
 * Il formato 9:16 viene generato on-device, non salvato su Plesk.
 */
import { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { supabase } from '@/lib/supabase';
import { generateAndUploadCard } from '@/lib/card/generateCard';
import { POI } from '@/lib/types';
import { CARD_QUALITY } from '@/constants/cardLayout';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import POICardRenderer from './POICardRenderer';
import StoryCardComposer from './StoryCardComposer';
import POICardWithQRStrip from './POICardWithQRStrip';

type CardFormat = 'feed' | 'story' | 'qr';

interface Props {
  poi:         POI;
  photoUri:    string;
  onClose:     () => void;
  onCardSaved?: (cardUrl: string) => void;
}

export default function ShareCardSheet({ poi, photoUri, onClose, onCardSaved }: Props) {
  const sheetRef    = useRef<BottomSheet>(null);
  const card45Ref   = useRef<View>(null);
  const card916Ref  = useRef<View>(null);
  const cardQRRef   = useRef<View>(null);

  const [format,      setFormat]      = useState<CardFormat>('feed');
  const [showTitle,   setShowTitle]   = useState(true);
  const [showSummary, setShowSummary] = useState(true);
  const [sharing,     setSharing]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [card45Uri,   setCard45Uri]   = useState<string | null>(null);

  // Genera la card 4:5 e la carica su Plesk (una volta sola)
  async function ensureCard45Generated(): Promise<string> {
    if (card45Uri) return card45Uri;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Sessione scaduta');

    const result = await generateAndUploadCard(card45Ref as React.RefObject<View>, poi.id, session.access_token);
    setCard45Uri(result.localUri);
    onCardSaved?.(result.cardUrl);
    return result.localUri;
  }

  async function captureCurrentFormat(): Promise<string> {
    const opts = { format: 'webp' as const, quality: CARD_QUALITY.webpQuality / 100, result: 'tmpfile' as const, pixelRatio: 3 };
    if (format === 'feed')  return ensureCard45Generated();
    if (format === 'story') return captureRef(card916Ref, opts);
    return captureRef(cardQRRef, opts); // 'qr'
  }

  async function handleShare() {
    try {
      setSharing(true);
      const uri = await captureCurrentFormat();
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Condivisione non disponibile', 'Il dispositivo non supporta la condivisione.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType:    'image/webp',
        dialogTitle: `Condividi ${poi.name}`,
        UTI:         'public.webp',
      });
    } catch (err: unknown) {
      Alert.alert('Errore', err instanceof Error ? err.message : 'Errore nella condivisione');
    } finally {
      setSharing(false);
    }
  }

  async function handleSaveToGallery() {
    try {
      setSaving(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permesso negato', 'Consenti l\'accesso alla galleria nelle impostazioni.');
        return;
      }
      const uri = await captureCurrentFormat();

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Salvata!', 'Card salvata nella galleria foto.');
    } catch (err: unknown) {
      Alert.alert('Errore', err instanceof Error ? err.message : 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={['75%', '95%']}
      enablePanDownToClose
      onChange={i => { if (i === -1) onClose(); }}
      backgroundStyle={{ backgroundColor: Colors.background }}
      handleIndicatorStyle={{ backgroundColor: Colors.border }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Condividi POI</Text>

        {/* Selezione formato */}
        <View style={styles.formatRow}>
          {(['feed', 'story', 'qr'] as CardFormat[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.formatBtn, format === f && styles.formatBtnActive]}
              onPress={() => setFormat(f)}
            >
              <Text style={[styles.formatBtnText, format === f && styles.formatBtnTextActive]}>
                {f === 'feed' ? '4:5 — Feed' : f === 'story' ? '9:16 — Stories' : '+ QR'}
              </Text>
              <Text style={[styles.formatSubtext, format === f && styles.formatSubtextActive]}>
                {f === 'feed'
                  ? 'Instagram · WhatsApp · Stampa'
                  : f === 'story'
                  ? 'Stories · Reels · TikTok'
                  : 'Con "Portami al luogo"'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Anteprima card */}
        <View style={styles.previewContainer}>
          {format === 'feed' && (
            <View ref={card45Ref} collapsable={false}>
              <POICardRenderer
                poi={poi}
                photoUri={photoUri}
                showTitle={showTitle}
                showSummary={showSummary}
              />
            </View>
          )}
          {format === 'story' && (
            <View ref={card916Ref} collapsable={false}>
              <StoryCardComposer
                poi={poi}
                cardUri={photoUri}
                showTitle={showTitle}
                showSummary={showSummary}
              />
            </View>
          )}
          {format === 'qr' && (
            <View ref={cardQRRef} collapsable={false}>
              <POICardWithQRStrip
                poi={poi}
                photoUri={photoUri}
                showTitle={showTitle}
                showSummary={showSummary}
              />
            </View>
          )}
        </View>

        {/* Toggle contenuti */}
        <View style={styles.togglesSection}>
          <Text style={styles.togglesLabel}>Contenuto card</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleName}>Titolo</Text>
              <Text style={styles.toggleDesc}>Nome del luogo sulla card</Text>
            </View>
            <Switch
              value={showTitle}
              onValueChange={setShowTitle}
              trackColor={{ false: Colors.border, true: Colors.red }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleName}>Sintesi</Text>
              <Text style={styles.toggleDesc}>Prime 80 caratteri della descrizione</Text>
            </View>
            <Switch
              value={showSummary}
              onValueChange={setShowSummary}
              trackColor={{ false: Colors.border, true: Colors.red }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={[styles.toggleRow, styles.toggleFixed]}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleName}>Logo POI•LOVE · Luogo · Data</Text>
              <Text style={styles.toggleDesc}>Fissi — sempre presenti</Text>
            </View>
            <Text style={styles.fixedBadge}>fisso</Text>
          </View>
        </View>

        {/* Azioni */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleSaveToGallery}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? <ActivityIndicator color={Colors.textPrimary} size="small" /> : (
              <Text style={styles.saveBtnText}>↓ Salva</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareBtn, sharing && styles.btnDisabled]}
            onPress={handleShare}
            disabled={sharing}
            activeOpacity={0.85}
          >
            {sharing ? <ActivityIndicator color={Colors.white} size="small" /> : (
              <Text style={styles.shareBtnText}>Condividi</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop:        Spacing.md,
    gap:               Spacing.lg,
  },
  title: {
    fontSize:   Typography.xl,
    fontWeight: Typography.bold,
    color:      Colors.textPrimary,
  },
  formatRow: {
    flexDirection: 'row',
    gap:           Spacing.sm,
  },
  formatBtn: {
    flex:            1,
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    gap:             2,
  },
  formatBtnActive: {
    borderColor:     Colors.red,
    backgroundColor: '#FFF8F8',
  },
  formatBtnText: {
    fontSize:   Typography.sm,
    fontWeight: Typography.semibold,
    color:      Colors.textPrimary,
  },
  formatBtnTextActive: {
    color: Colors.red,
  },
  formatSubtext: {
    fontSize: Typography.xs,
    color:    Colors.textMuted,
  },
  formatSubtextActive: {
    color: Colors.red,
    opacity: 0.7,
  },
  previewContainer: {
    alignItems:      'center',
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    padding:         Spacing.sm,
    ...Shadow.sm,
  },
  togglesSection: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    overflow:        'hidden',
    ...Shadow.sm,
  },
  togglesLabel: {
    fontSize:          Typography.xs,
    fontWeight:        Typography.semibold,
    color:             Colors.textMuted,
    textTransform:     'uppercase',
    letterSpacing:     0.5,
    paddingHorizontal: Spacing.md,
    paddingTop:        Spacing.md,
    paddingBottom:     Spacing.sm,
  },
  toggleRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderTopWidth:    0.5,
    borderTopColor:    Colors.border,
    gap:               Spacing.md,
  },
  toggleFixed: {
    backgroundColor: Colors.background,
    opacity:         0.7,
  },
  toggleInfo: {
    flex: 1,
    gap:  2,
  },
  toggleName: {
    fontSize:   Typography.sm,
    fontWeight: Typography.medium,
    color:      Colors.textPrimary,
  },
  toggleDesc: {
    fontSize: Typography.xs,
    color:    Colors.textMuted,
  },
  fixedBadge: {
    fontSize:          Typography.xs,
    fontWeight:        Typography.medium,
    color:             Colors.textMuted,
    backgroundColor:   Colors.border,
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      Radius.full,
  },
  actionsRow: {
    flexDirection: 'row',
    gap:           Spacing.md,
  },
  saveBtn: {
    flex:              1,
    backgroundColor:   Colors.surface,
    borderRadius:      Radius.md,
    paddingVertical:   Spacing.md,
    alignItems:        'center',
    borderWidth:       1,
    borderColor:       Colors.border,
  },
  saveBtnText: {
    fontSize:   Typography.base,
    fontWeight: Typography.semibold,
    color:      Colors.textPrimary,
  },
  shareBtn: {
    flex:            2,
    backgroundColor: Colors.red,
    borderRadius:    Radius.md,
    paddingVertical: Spacing.md,
    alignItems:      'center',
    ...Shadow.md,
  },
  shareBtnText: {
    fontSize:   Typography.base,
    fontWeight: Typography.bold,
    color:      Colors.white,
  },
  btnDisabled: {
    opacity: 0.55,
  },
});
