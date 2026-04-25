/**
 * POI•LOVE — Share Card Utility
 *
 * Condivide la card già composta (card_url su Plesk) senza rirenderizzare.
 * Usato dai POI della community, dove non abbiamo accesso alla foto locale.
 *
 * Flow:
 *   1. Scarica la card da Plesk in un file temporaneo locale
 *   2. Apre lo share sheet nativo con il file
 *
 * Non usa ShareCardSheet (che serve per creare/personalizzare la card
 * e richiede la foto locale originale).
 */
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Scarica la card_url e apre lo share sheet nativo.
 * Ritorna true se la condivisione è andata a buon fine, false se annullata.
 * Lancia un errore in caso di rete o file system ko.
 */
export async function shareCardFromUrl(
  cardUrl:  string,
  poiName:  string,
): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Il dispositivo non supporta la condivisione.');
  }

  // Scarica in una directory temporanea — il file viene sovrascritto ad ogni share
  const localUri = FileSystem.cacheDirectory + 'poi_share_card.webp';

  const download = await FileSystem.downloadAsync(cardUrl, localUri);
  if (download.status !== 200) {
    throw new Error('Impossibile scaricare la card. Controlla la connessione.');
  }

  await Sharing.shareAsync(localUri, {
    mimeType:    'image/webp',
    dialogTitle: `Condividi ${poiName}`,
    UTI:         'public.webp',
  });
}
