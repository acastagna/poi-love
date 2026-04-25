/**
 * POI•LOVE — Media Upload Helper
 *
 * Carica fino a 3 foto verso il Plesk Media Server.
 * Usato da AddPOISheet dopo aver scelto le foto con expo-image-picker.
 */
import { Config } from '@/constants/config';

interface UploadResult {
  urls:     string[];
  count:    number;
  warnings?: string[];
}

/**
 * Carica le foto di un POI sul media server Plesk.
 *
 * @param poiId     UUID del POI (già inserito in Supabase)
 * @param localUris Array di URI locali (max 3) da expo-image-picker
 * @param jwtToken  JWT Supabase dell'utente corrente
 */
export async function uploadPOIPhotos(
  poiId:     string,
  localUris: string[],
  jwtToken:  string,
): Promise<UploadResult> {
  if (localUris.length === 0) return { urls: [], count: 0 };
  if (localUris.length > Config.maxPhotosPerPOI) {
    throw new Error(`Max ${Config.maxPhotosPerPOI} foto per POI`);
  }

  const formData = new FormData();

  for (const uri of localUris) {
    const filename  = uri.split('/').pop() ?? 'photo.jpg';
    const extension = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType  = extension === 'png'  ? 'image/png'
                    : extension === 'webp' ? 'image/webp'
                    : 'image/jpeg';

    // React Native FormData accetta questo formato
    formData.append('photos[]', {
      uri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);
  }

  const response = await fetch(`${Config.mediaServerUrl}/upload.php`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'X-POI-ID':      poiId,
      // NON impostare Content-Type — fetch lo imposta automaticamente con boundary
    },
    body: formData,
  });

  const json = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.error ?? `Upload failed (${response.status})`);
  }

  return {
    urls:     json.data.urls,
    count:    json.data.count,
    warnings: json.data.warnings,
  };
}

/**
 * Cancella le foto di un POI (es. quando il POI viene eliminato).
 */
export async function deletePOIPhotos(
  poiId:    string,
  slots:    number[],
  jwtToken: string,
): Promise<void> {
  const response = await fetch(`${Config.mediaServerUrl}/delete.php`, {
    method:  'DELETE',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'X-POI-ID':      poiId,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ slots }),
  });

  const json = await response.json();
  if (!response.ok || !json.ok) {
    throw new Error(json.error ?? `Delete failed (${response.status})`);
  }
}
