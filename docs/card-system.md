# POI•LOVE — Sistema Card e Condivisione

> **Cultural Bridge OS** · Versione 1.0 · Aprile 2026

---

## Cos'è la Card Composita

Ogni POI su POI•LOVE può essere trasformato in una **Card Composita** — un'immagine autonoma, visivamente ricca, condivisibile su qualsiasi piattaforma social o messaging. La card non è uno screenshot: è un artefatto generato programmaticamente, con struttura dati firmata crittograficamente.

La Card Composita è il vettore primario di **crescita organica** del progetto. Un utente che condivide una card porta l'identità visiva di POI•LOVE su Instagram, WhatsApp, Telegram e TikTok senza che l'app debba fare advertising.

---

## Formati

| ID enum | Dimensioni | Ratio | Piattaforma target |
|---|---|---|---|
| `feed_4_5` | 1080 × 1350 px | 4:5 | Instagram feed, Facebook, LinkedIn |
| `stories_9_16` | 1080 × 1920 px | 9:16 | Stories, Reels, TikTok, YouTube Shorts |
| `qr_strip` | 1080 × 400 px | Libero | WhatsApp, Telegram, email, print |

Il formato `feed_4_5` è il **formato primario** — quello mostrato per default al momento della condivisione.

---

## Anatomia della Card (feed_4_5)

```
┌─────────────────────────────────┐  1080px
│ [FOTO POI — full bleed]         │
│                                 │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░  foto principale o collage  ░│
│  ░  3 foto → collage 1+2       ░│
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                 │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← gradiente overlay dal basso
│ ♥ 42                           │ ← love_count + icona Phosphor
│ Nome POI                        │ ← testo grande, bold
│ Categoria · Tirana, Albania     │ ← subtitle
│ "Descrizione max 200 char..."   │ ← testo corpo
│                                 │
│ [POI•LOVE logo]   [QR code]    │ ← footer brand
└─────────────────────────────────┘
                               1350px
```

### Palette e font
- **Sfondo overlay**: gradiente `rgba(0,0,0,0)` → `rgba(0,0,0,0.72)` dal 40% verticale
- **Accento rosso**: `#D42B2B` per il cuore ♥ e il logo wordmark
- **Testo**: bianco puro `#FFFFFF` — nome POI in Manrope 700, corpo in Manrope 400
- **Font di sistema** usato come fallback per generazione server-side

---

## Flusso Utente

```
[POI Detail Card]
       │
       ▼
  tap "Condividi"
       │
       ├── [Scegli formato: Feed / Stories / QR Strip]
       │
       ▼
  [Preview Card] ← generata client-side con Canvas API o server-side
       │
       ├── tap "Scarica" → save to Camera Roll (iOS/Android native)
       │
       └── tap "Condividi" → iOS Share Sheet / Android Intent
                │
                └── (opzionale) "Vuoi che questa card venga conservata?"
                         │ YES → POST /api/card-generate → Supabase + Plesk
                         │ NO  → solo download locale, nessun salvataggio
```

### Principio di privacy
La generazione locale (client-side) non richiede salvataggio su server. Il record in `card_generations` viene creato **solo su consenso esplicito** dell'utente — la card è sua, non nostra.

---

## Notarizzazione SHA-256

Ogni card salvata su server riceve un **hash SHA-256** calcolato sul payload di generazione:

```json
{
  "poi_id": "uuid-del-poi",
  "poi_name": "Pazari i Ri",
  "poi_lat": 41.3275,
  "poi_lng": 19.8187,
  "love_count": 42,
  "format": "feed_4_5",
  "photo_urls": ["https://media.poilove.com/..."],
  "generated_at": "2026-06-01T10:30:00Z",
  "app_version": "0.1.0"
}
```

L'hash viene calcolato su questo JSON (chiavi ordinate, minified) e salvato in `card_generations.sha256_hash`.

**Utilizzo pratico:**
- Verifica di integrità: la card non è stata alterata post-generazione
- Deduplicazione: `UNIQUE (sha256_hash, user_id)` impedisce duplicati
- Base per futura certificazione NFT (Fase 3, opzionale)

---

## Consensi Espliciti (consent_*)

Al momento del salvataggio, due flag documentano il consenso dell'utente:

| Campo | Default | Significato |
|---|---|---|
| `consent_nft` | `FALSE` | L'utente acconsente all'eventuale minting NFT della card su OpenSea o marketplace equivalente (Fase 3 — opzionale, mai automatico) |
| `consent_book` | `FALSE` | L'utente acconsente all'uso della card in pubblicazioni fisiche o digitali (es. un libro fotografico "POI•LOVE Albania") |

Entrambi i consensi sono **off per default**, mostrati come checkbox opzionali nella UI solo se l'utente sceglie di salvare la card.

---

## Schema Database

```sql
-- Vedere: database/migrations/001_visibility_and_card_system.sql
CREATE TABLE public.card_generations (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  poi_id          UUID          NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
  user_id         UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  format          card_format   NOT NULL DEFAULT 'feed_4_5',
  sha256_hash     TEXT          NOT NULL CHECK (sha256_hash ~ '^[a-f0-9]{64}$'),
  media_url       TEXT,
  metadata        JSONB         NOT NULL DEFAULT '{}',
  consent_nft     BOOLEAN       NOT NULL DEFAULT FALSE,
  consent_book    BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_card_hash_user UNIQUE (sha256_hash, user_id)
);
```

**RLS implementata:**
- SELECT: il generatore vede le proprie card; gli altri vedono solo le card di POI `community` / `suggested_google`
- INSERT: solo utenti autenticati, `user_id = auth.uid()`
- UPDATE / DELETE: solo il generatore

---

## Implementazione Tecnica (Roadmap)

### Fase 1 — MVP (Giugno 2026)
- [ ] Generazione client-side con **Canvas API** (React Native `react-native-view-shot`)
- [ ] Solo formato `feed_4_5`
- [ ] Condivisione via Share Sheet nativa (senza salvataggio su server)
- [ ] UI: button "Condividi" nella POI Detail Card

### Fase 2 — Post-lancio Tirana
- [ ] Generazione server-side su Plesk (Node.js + `sharp` + `canvas`)
- [ ] Salvataggio `card_generations` su Supabase + media su Plesk
- [ ] Formati `stories_9_16` e `qr_strip`
- [ ] API endpoint: `POST /api/v1/cards/generate`

### Fase 3 — Futuro opzionale
- [ ] NFT minting via OpenSea API (solo per utenti con `consent_nft = TRUE`)
- [ ] Libro fotografico generativo "POI•LOVE Albania"
- [ ] Certificazione timestamp su blockchain pubblica

---

## API Endpoint (Fase 2)

```
POST /api/v1/cards/generate
Authorization: Bearer <supabase-jwt>
Content-Type: application/json

{
  "poi_id": "uuid",
  "format": "feed_4_5",
  "consent_nft": false,
  "consent_book": false
}

Response 201:
{
  "card_id": "uuid",
  "media_url": "https://media.poilove.com/cards/uuid.jpg",
  "sha256_hash": "abc123...64chars",
  "format": "feed_4_5"
}
```

---

## File correlati

- `database/migrations/001_visibility_and_card_system.sql` — Schema + RLS
- `docs/architecture.md` — Architettura generale Cultural Bridge OS
- `app/` — Implementazione React Native (Expo SDK 52)

---

*Cultural Bridge OS è rilasciato sotto licenza MIT. Chiunque può forkare questo sistema e adattarlo al proprio territorio.*
