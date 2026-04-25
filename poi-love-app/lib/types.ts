/**
 * POI•LOVE — TypeScript Types
 * Allineati allo schema Supabase
 */

// ─── Visibilità POI (3 stati) ──────────────────────
export type POIVisibility = 'private' | 'community' | 'suggested_google';

// ─── POI — entità principale ───────────────────────
export interface POI {
  id:           string;      // UUID
  user_id:      string;      // UUID utente owner
  name:         string;      // Nome del luogo
  description:  string | null; // Max 200 caratteri
  latitude:     number;
  longitude:    number;
  tag:          string | null; // 1 tag (es. "cibo", "natura", "storia")
  visibility:   POIVisibility;
  photo_urls:   string[];    // Array di URL Plesk (max 3)
  love_count:   number;      // Conteggio LOVE ricevuti
  // Card composita — generata al salvataggio, salvata su Plesk
  card_url?:         string | null; // URL WebP 4:5 su Plesk
  card_hash?:        string | null; // SHA-256 per notarizzazione blockchain
  card_hashed_at?:   string | null; // ISO timestamp ultima generazione
  // Consenso usi creativi (default OFF)
  license_book?:     boolean;
  license_nft?:      boolean;
  created_at:   string;      // ISO timestamp
  updated_at:   string;
  // Join opzionali (quando fetched con relazioni)
  profiles?:    Profile;
}

// ─── Profilo utente ────────────────────────────────
export interface Profile {
  id:           string;      // UUID (= auth.users.id)
  username:     string | null;
  full_name:    string | null;
  avatar_url:   string | null;
  bio:          string | null;
  created_at:   string;
}

// ─── LOVE (relazione user→POI) ──────────────────────
export interface Love {
  id:         string;
  user_id:    string;
  poi_id:     string;
  created_at: string;
}

// ─── Lista POI ─────────────────────────────────────
export interface POIList {
  id:          string;
  user_id:     string;
  name:        string;
  description: string | null;
  is_public:   boolean;
  created_at:  string;
  poi_list_items?: POIListItem[];
}

export interface POIListItem {
  id:         string;
  list_id:    string;
  poi_id:     string;
  position:   number;
  added_at:   string;
  pois?:      POI;
}

// ─── Nuovo POI (form input) ────────────────────────
export interface NewPOIInput {
  name:        string;
  description: string;
  latitude:    number;
  longitude:   number;
  tag:         string;
  visibility:  POIVisibility;
  photos:      string[];     // Percorsi locali prima dell'upload
}

// ─── Sessione utente ────────────────────────────────
export interface AuthUser {
  id:         string;
  email:      string | null;
  full_name:  string | null;
  avatar_url: string | null;
}

// ─── Regione mappa ─────────────────────────────────
export interface MapRegion {
  latitude:       number;
  longitude:      number;
  latitudeDelta:  number;
  longitudeDelta: number;
}
