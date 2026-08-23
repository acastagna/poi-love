/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * POI•LOVE — I tipi, allineati al database VERO (21/08/2026).
 *
 * Lo scaffold del 2026-05 usava colonne che non esistono piu' (name, latitude,
 * longitude, user_id, tag, photo_urls). Qui c'e' lo schema attuale: chi aggiunge
 * un campo al database lo aggiunge anche qui, altrimenti l'app mente.
 */

// ─── Visibilita' di un luogo ────────────────────────────────────────────────
// private: solo chi l'ha creato · community: tutti · suggested_google: proposto
// dalla mappa, in attesa · official: curato da POI•LOVE, modificabile solo admin
export type POIVisibility = 'private' | 'community' | 'suggested_google' | 'official';

export type Lingua = 'it' | 'sq' | 'en';

// ─── Il luogo ───────────────────────────────────────────────────────────────
export interface POI {
  id:          string;
  author_id:   string;
  title:       string;
  description: string | null;
  lat:         number;
  lng:         number;
  address:     string | null;
  city:        string | null;
  country:     string | null;

  // Tassonomia: famiglia + fino a 3 categorie, la prima e' quella del marcatore
  category:    string;
  subcategory: string | null;
  categories:  string[] | null;
  tags:        string[] | null;

  photos:      string[] | null;
  cover_photo: string | null;
  video_url:      string | null;
  video_poster:   string | null;
  video_secondi:  number | null;

  love_count:  number;
  visibility:  POIVisibility;
  is_approved: boolean;

  // Badge e assegnazione (decisi dall'amministrazione)
  badge_official:   boolean;
  badge_essential:  boolean;
  is_featured:      boolean;   // messo in evidenza dall'amministrazione (stella d'oro)
  badge_tier:       string | null;
  badge_ids:        string[] | null;
  assigned_user_id: string | null;

  // Tre lingue: il testo nella lingua dell'utente si sceglie con testoLuogo()
  title_it:       string | null;
  title_sq:       string | null;
  title_en:       string | null;
  description_it: string | null;
  description_sq: string | null;
  description_en: string | null;
  lingua_originale: string | null;

  created_at:  string;
  updated_at:  string;

  // Join opzionale
  profiles?:   Profile;
}

// I campi che servono alla mappa: chiedere solo questi fa la differenza
// fra una mappa che vola e una che scarica mezzo database.
export const POI_CAMPI_MAPPA =
  'id,title,title_it,title_sq,title_en,lat,lng,category,subcategory,categories,' +
  'cover_photo,love_count,visibility,is_approved,badge_official,badge_essential,is_featured,city';

// ─── Il profilo ─────────────────────────────────────────────────────────────
export interface Profile {
  id:           string;
  username:     string | null;
  display_name: string | null;
  avatar_url:   string | null;
  bio:          string | null;
  language:     string | null;
  cover_url:    string | null;
  cover_type:   string | null;   // 'gradient' | 'image'
  points:       number;
  special_tier: string | null;   // la chiave del livello (tabella `livelli`)
  citta:        string | null;
  professione:  string | null;
  is_admin:     boolean;
  moderation_status: string | null;
  created_at:   string;
}

// ─── Il livello: le regole vere che il server fa rispettare ─────────────────
export interface Livello {
  chiave:              string;
  nome:                string;
  foto_max:            number;
  video_max:           number;
  video_secondi:       number;
  audio_secondi:       number;
  audioguide_max:      number;
  ascolta_audioguide:  boolean;
  evidenze_luoghi:     number;
  evidenze_itinerari:  number;
  spunta:              boolean;
  muro:                boolean;
  badge_icona:         string | null;
  badge_colore:        string | null;
  prezzo:              number | null;
  valuta:              string;
  periodo:             'mese' | 'anno' | 'una_volta' | 'gratis';
  descrizione:         string | null;
  visibile:            boolean;
}

// ─── LOVE ───────────────────────────────────────────────────────────────────
export interface Love {
  id:         string;
  user_id:    string;
  poi_id:     string;
  created_at: string;
}

// ─── Liste ──────────────────────────────────────────────────────────────────
export interface POIList {
  id:          string;
  owner_id:    string;
  name:        string;
  description: string | null;
  visibility:  'private' | 'public';
  share_token: string | null;
  cover_poi_id: string | null;
  created_at:  string;
}

// ─── Itinerari (viaggi personali e culturali) ───────────────────────────────
export interface Trip {
  id:          string;
  owner_id:    string;
  name:        string;
  badge:       string | null;
  tipo:        'personale' | 'culturale' | 'storica';
  dates_label: string | null;
  created_at:  string;
}

export interface TripStop {
  id:         string;
  trip_id:    string;
  name:       string;
  status:     'planned' | 'done' | 'suspended';
  lat:        number | null;
  lng:        number | null;
  poi_id:     string | null;
  note:       string | null;
  sort_order: number;
}

// ─── Compagnie di viaggio ───────────────────────────────────────────────────
export interface Companion {
  id:         string;
  owner_id:   string;
  code:       string;
  name:       string;
  type:       'forever' | 'trip' | 'dinner';
  date:       string | null;
  created_at: string;
}

// ─── Audioguida pubblicata (quella che l'app suona) ─────────────────────────
export interface Audioguida {
  id:         string;
  poi_id:     string | null;
  trip_id:    string | null;
  lingua:     Lingua;
  titolo:     string;
  testo:      string | null;
  url:        string;
  secondi:    number;
  voce:       string | null;
  pubblicata: boolean;
}

// ─── Il testo giusto per la lingua del telefono ─────────────────────────────
export function testoLuogo(p: POI, lingua: Lingua): { titolo: string; descrizione: string } {
  const t = (lingua === 'sq' ? p.title_sq : lingua === 'en' ? p.title_en : p.title_it) || p.title;
  const d = (lingua === 'sq' ? p.description_sq : lingua === 'en' ? p.description_en : p.description_it)
    || p.description || '';
  return { titolo: t, descrizione: d };
}
