/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * AddPOISheet — il foglio per creare un luogo dal lungo-tocco sulla mappa.
 *
 * Tre passi veri: il luogo nel database (colonne attuali: title, lat, lng,
 * author_id), le foto sul server delle immagini, gli indirizzi delle foto
 * di nuovo sul luogo. Almeno una foto e' obbligatoria.
 */
import { useRef, useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ScrollView, ActivityIndicator, Alert, Keyboard,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { supabase, insertPOI, updatePOI, deletePOI } from '@/lib/supabase';
import { uploadPOIPhotos } from '@/lib/mediaUpload';
import { POI, POIVisibility } from '@/lib/types';
import { Config } from '@/constants/config';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';

const TAGS = ['🍕 Cibo', '🌿 Natura', '🏛️ Storia', '🎨 Arte', '☕ Caffè', '🛍️ Shopping', '🎵 Musica', '🏖️ Spiaggia'];

const VISIBILITY_OPTIONS: { value: POIVisibility; label: string; desc: string }[] = [
  { value: 'private',   label: 'Solo io',            desc: 'Lo vedi solo tu'                  },
  { value: 'community', label: 'Tutta la community', desc: 'Visibile a tutti su POI•LOVE' },
];

interface Props {
  coordinate: { latitude: number; longitude: number };
  onClose:    () => void;
  onSaved:    (poi: POI) => void;
}

export default function AddPOISheet({ coordinate, onClose, onSaved }: Props) {
  const sheetRef  = useRef<BottomSheet>(null);
  const snapPoints = ['60%', '95%'];

  const [name,       setName]       = useState('');
  const [desc,       setDesc]       = useState('');
  const [tag,        setTag]        = useState('');
  const [photos,     setPhotos]     = useState<string[]>([]);
  const [visibility, setVisibility] = useState<POIVisibility>('community');
  const [saving,     setSaving]     = useState(false);
  const [saveStep,   setSaveStep]   = useState<string>('');

  const descRemaining = Config.maxDescriptionLen - desc.length;

  // Picker foto
  async function pickPhoto() {
    if (photos.length >= Config.maxPhotosPerPOI) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.85,
      allowsEditing: true,
      aspect:     [4, 3],
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Nome obbligatorio', 'Dai un nome al luogo prima di salvare.');
      return;
    }
    if (photos.length === 0) {
      Alert.alert('Foto richiesta', 'Aggiungi almeno una foto: un luogo senza foto non racconta niente.');
      return;
    }

    Keyboard.dismiss();
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessione scaduta: esci e rientra');

      // Fino a dieci tag, separati da virgola
      const tags = tag.split(',')
        .map(t => t.replace(/^[\p{Emoji}\s#]+/u, '').trim().toLowerCase())
        .filter(Boolean)
        .slice(0, Config.maxTagsPerPOI);

      // ── Passo 1: il luogo nel database, con le colonne vere ──
      setSaveStep('Salvataggio luogo…');
      const newPOI = await insertPOI({
        author_id:   session.user.id,
        title:       name.trim(),
        description: desc.trim() || null,
        lat:         coordinate.latitude,
        lng:         coordinate.longitude,
        category:    'altro',           // la famiglia la si affina dalla scheda
        tags,
        visibility,
        photos:      [],                // arrivano al passo 2
      });

      try {
        // ── Passo 2: le foto sul server delle immagini ──
        // Il biglietto si richiede QUI, non all'inizio: su una rete lenta quello
        // preso prima puo' essere gia' scaduto quando le foto partono.
        setSaveStep('Carico le foto…');
        const { data: { session: fresca } } = await supabase.auth.getSession();
        if (!fresca) throw new Error('Sessione scaduta: esci e rientra');
        const upload = await uploadPOIPhotos(newPOI.id, photos, fresca.access_token);

        // ── Passo 3: gli indirizzi delle foto tornano sul luogo ──
        // Rileggendo la riga: zero righe = le regole hanno rifiutato, non successo.
        setSaveStep('Finalizzazione…');
        const salvato = await updatePOI(newPOI.id, {
          photos:      upload.urls,
          cover_photo: upload.urls[0] ?? null,
        });

        onSaved(salvato);
      } catch (dentro) {
        // Compensazione: il luogo senza foto non resta nel database come un
        // guscio vuoto, e il prossimo tentativo non crea un doppione.
        try { await deletePOI(newPOI.id); } catch { /* al peggio resta privato di chi l'ha creato */ }
        throw dentro;
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore nel salvataggio';
      Alert.alert('Non ho salvato', msg + '\n\nIl luogo non e stato creato: riprova.');
    } finally {
      setSaving(false);
      setSaveStep('');
    }
  }

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) onClose();
  }, [onClose]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleSheetChange}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nuovo POI</Text>
          <Text style={styles.coords}>
            {coordinate.latitude.toFixed(5)}, {coordinate.longitude.toFixed(5)}
          </Text>
        </View>

        {/* Nome */}
        <View style={styles.field}>
          <Text style={styles.label}>Nome del luogo *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Es. Il caffè della nonna"
            placeholderTextColor={Colors.textMuted}
            maxLength={80}
            returnKeyType="next"
            autoFocus
          />
        </View>

        {/* Descrizione */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Descrizione{' '}
            <Text style={{ color: descRemaining < 20 ? Colors.error : Colors.textMuted }}>
              ({descRemaining} rimasti)
            </Text>
          </Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={desc}
            onChangeText={setDesc}
            placeholder="Cosa rende speciale questo posto?"
            placeholderTextColor={Colors.textMuted}
            maxLength={Config.maxDescriptionLen}
            multiline
            numberOfLines={3}
            returnKeyType="next"
          />
        </View>

        {/* Tag */}
        <View style={styles.field}>
          <Text style={styles.label}>Tag</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
            {TAGS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tagChip, tag === t && styles.tagChipActive]}
                onPress={() => setTag(prev => prev === t ? '' : t)}
              >
                <Text style={[styles.tagChipText, tag === t && styles.tagChipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Foto */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Foto ({photos.length}/{Config.maxPhotosPerPOI})
          </Text>
          <View style={styles.photosRow}>
            {photos.map((uri, i) => (
              <View key={i} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.photoImg} />
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                >
                  <Text style={styles.photoRemoveText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < Config.maxPhotosPerPOI && (
              <TouchableOpacity style={styles.photoAdd} onPress={pickPhoto}>
                <Text style={styles.photoAddText}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Visibilità */}
        <View style={styles.field}>
          <Text style={styles.label}>Visibilità</Text>
          {VISIBILITY_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.visibilityRow, visibility === opt.value && styles.visibilityRowActive]}
              onPress={() => setVisibility(opt.value)}
            >
              <View style={styles.visibilityInfo}>
                <Text style={styles.visibilityLabel}>{opt.label}</Text>
                <Text style={styles.visibilityDesc}>{opt.desc}</Text>
              </View>
              <View style={[styles.radio, visibility === opt.value && styles.radioActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Salva */}
        <TouchableOpacity
          style={[styles.saveBtn, (!name.trim() || photos.length === 0 || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!name.trim() || photos.length === 0 || saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <View style={styles.savingRow}>
              <ActivityIndicator color={Colors.white} size="small" />
              <Text style={styles.saveBtnText}>{saveStep || 'Salvataggio…'}</Text>
            </View>
          ) : (
            <Text style={styles.saveBtnText}>Salva POI</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </BottomSheetScrollView>

    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: Colors.background,
    borderRadius:    Radius.lg,
  },
  handle: {
    backgroundColor: Colors.border,
    width:           40,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop:        Spacing.md,
    gap:               Spacing.lg,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize:   Typography.xl,
    fontWeight: Typography.bold,
    color:      Colors.textPrimary,
  },
  coords: {
    fontSize: Typography.xs,
    color:    Colors.textMuted,
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize:   Typography.sm,
    fontWeight: Typography.semibold,
    color:      Colors.textSecond,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 2,
    fontSize:        Typography.base,
    color:           Colors.textPrimary,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  inputMultiline: {
    height:      88,
    textAlignVertical: 'top',
  },
  tagScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical:    8,
    borderRadius:      Radius.full,
    backgroundColor:   Colors.surface,
    borderWidth:       1,
    borderColor:       Colors.border,
    marginRight:       Spacing.sm,
  },
  tagChipActive: {
    backgroundColor: Colors.red,
    borderColor:     Colors.red,
  },
  tagChipText: {
    fontSize:   Typography.sm,
    color:      Colors.textSecond,
    fontWeight: Typography.medium,
  },
  tagChipTextActive: {
    color: Colors.white,
  },
  photosRow: {
    flexDirection: 'row',
    gap:           Spacing.sm,
  },
  photoThumb: {
    width:        80,
    height:       80,
    borderRadius: Radius.md,
    overflow:     'hidden',
    position:     'relative',
  },
  photoImg: {
    width:  80,
    height: 80,
  },
  photoRemove: {
    position:        'absolute',
    top:             2,
    right:           2,
    width:           22,
    height:          22,
    borderRadius:    11,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  photoRemoveText: {
    color:      Colors.white,
    fontSize:   14,
    fontWeight: Typography.bold,
    lineHeight: 16,
  },
  photoAdd: {
    width:           80,
    height:          80,
    borderRadius:    Radius.md,
    backgroundColor: Colors.surface,
    borderWidth:     2,
    borderColor:     Colors.border,
    borderStyle:     'dashed',
    alignItems:      'center',
    justifyContent:  'center',
  },
  photoAddText: {
    fontSize:   32,
    color:      Colors.textMuted,
    fontWeight: Typography.bold,
  },
  visibilityRow: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor: Colors.surface,
    borderRadius:   Radius.md,
    padding:        Spacing.md,
    borderWidth:    1,
    borderColor:    Colors.border,
    gap:            Spacing.md,
  },
  visibilityRowActive: {
    borderColor:     Colors.red,
    backgroundColor: '#FFF8F8',
  },
  visibilityInfo: {
    flex: 1,
    gap:  2,
  },
  visibilityLabel: {
    fontSize:   Typography.base,
    fontWeight: Typography.semibold,
    color:      Colors.textPrimary,
  },
  visibilityDesc: {
    fontSize: Typography.xs,
    color:    Colors.textMuted,
  },
  radio: {
    width:        20,
    height:       20,
    borderRadius: 10,
    borderWidth:  2,
    borderColor:  Colors.border,
  },
  radioActive: {
    borderColor:     Colors.red,
    backgroundColor: Colors.red,
  },
  saveBtn: {
    backgroundColor: Colors.red,
    borderRadius:    Radius.md,
    paddingVertical: Spacing.md,
    alignItems:      'center',
    ...Shadow.md,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize:   Typography.md,
    fontWeight: Typography.bold,
    color:      Colors.white,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
});
