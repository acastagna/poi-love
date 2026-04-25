/**
 * POI•LOVE — Card Generator
 *
 * Cattura il componente POICardRenderer come immagine WebP via react-native-view-shot.
 * Calcola SHA-256 dell'immagine.
 * Carica la card su Plesk.
 * Salva hash in Supabase.
 *
 * Installare: npm install react-native-view-shot crypto-js
 */
import { captureRef } from 'react-native-view-shot';
import CryptoJS from 'crypto-js';
import { RefObject } from 'react';
import { View } from 'react-native';
import { CARD_4_5, CARD_QUALITY } from '@/constants/cardLayout';
import { Config } from '@/constants/config';
import { supabase } from '@/lib/supabase';

interface GenerateCardResult {
  localUri:  string;   // percorso locale immagine generata
  cardUrl:   string;   // URL pubblico su Plesk
  sha256:    string;   // hash dell'immagine
}

/**
 * Genera la card, la carica su Plesk, salva hash in Supabase.
 *
 * @param viewRef  Ref al componente POICardRenderer
 * @param poiId    UUID del POI già inserito in Supabase
 * @param jwtToken JWT Supabase dell'utente
 */
export async function generateAndUploadCard(
  viewRef:  RefObject<View>,
  poiId:    string,
  jwtToken: string,
): Promise<GenerateCardResult> {

  // 1. Cattura il componente come immagine WebP a risoluzione piena
  //    pixelRatio=3 porta da 360×450 display a 1080×1350 reali
  const localUri = await captureRef(viewRef, {
    format:     'webp',
    quality:    CARD_QUALITY.webpQuality / 100,
    result:     'tmpfile',
    width:      CARD_4_5.width,
    height:     CARD_4_5.height,
    pixelRatio: 3,
  });

  // 2. Leggi il file come base64 per calcolare SHA-256
  //    (react-native-fs o expo-file-system)
  const base64 = await readFileAsBase64(localUri);
  const sha256 = CryptoJS.SHA256(CryptoJS.enc.Base64.parse(base64)).toString(CryptoJS.enc.Hex);

  // 3. Carica la card su Plesk
  const cardUrl = await uploadCard(localUri, poiId, jwtToken);

  // 4. Salva hash in Supabase — colonna card_hash sulla tabella pois
  await supabase
    .from('pois')
    .update({
      card_url:   cardUrl,
      card_hash:  sha256,
      card_hashed_at: new Date().toISOString(),
    })
    .eq('id', poiId);

  return { localUri, cardUrl, sha256 };
}

/**
 * Adatta la card 4:5 per Stories/Reels/TikTok (9:16) on-device.
 * La card viene posizionata al centro verticale del 9:16
 * con bande scure sopra e sotto — rispetta le safe zones di ogni piattaforma.
 *
 * Non scrive nulla su Plesk — immagine temporanea solo per condivisione.
 */
export async function generateStoryCard(
  viewRef: RefObject<View>,
): Promise<string> {
  // Cattura la card 4:5
  const card45Uri = await captureRef(viewRef, {
    format:     'webp',
    quality:    CARD_QUALITY.webpQuality / 100,
    result:     'tmpfile',
    width:      CARD_4_5.width,
    height:     CARD_4_5.height,
    pixelRatio: 3,
  });

  // Il compositing 9:16 viene fatto nel componente StoryCardComposer
  // che wrappa questa card con bande scure sopra/sotto
  // Vedi: components/card/StoryCardComposer.tsx
  return card45Uri;
}

// ─── Helpers ──────────────────────────────────────

async function uploadCard(
  localUri: string,
  poiId:    string,
  jwtToken: string,
): Promise<string> {
  const formData = new FormData();
  formData.append('card', {
    uri:  localUri,
    name: 'card.webp',
    type: 'image/webp',
  } as unknown as Blob);

  const response = await fetch(`${Config.mediaServerUrl}/upload-card.php`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'X-POI-ID':      poiId,
    },
    body: formData,
  });

  const json = await response.json();
  if (!response.ok || !json.ok) {
    throw new Error(json.error ?? `Card upload failed (${response.status})`);
  }

  return json.data.url as string;
}

async function readFileAsBase64(uri: string): Promise<string> {
  // Usa expo-file-system (già dipendenza di expo-image-picker)
  const { readAsStringAsync, EncodingType } = await import('expo-file-system');
  return readAsStringAsync(uri, { encoding: EncodingType.Base64 });
}
