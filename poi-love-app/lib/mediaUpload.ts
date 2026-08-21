/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * mediaUpload — le foto di un luogo verso il server delle immagini.
 * Il server legge poi_id dal modulo: va nel FormData, non nelle intestazioni.
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
  // Il server legge poi_id dal modulo, non dalle intestazioni: mandarlo solo
  // nell'intestazione X-POI-ID (come faceva lo scaffold) falliva sempre con
  // "poi_id obbligatorio".
  formData.append('poi_id', poiId);

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
      // NON impostare Content-Type: fetch mette da solo il confine del multipart
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
 * Toglie UNA foto dal server delle immagini.
 *
 * delete.php vuole { _method: "DELETE", url: "https://media.poilove.com/poi/…" }:
 * una url alla volta, niente slots. La versione vecchia mandava { slots } e
 * sarebbe fallita sempre: mai collegata per fortuna, riscritta prima che accada.
 */
export async function deletePOIPhoto(
  photoUrl: string,
  jwtToken: string,
): Promise<void> {
  const response = await fetch(`${Config.mediaServerUrl}/delete.php`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ _method: 'DELETE', url: photoUrl }),
  });
  const json = await response.json();
  if (!response.ok || !json.ok) {
    throw new Error(json.error ?? `Cancellazione non riuscita (${response.status})`);
  }
}
