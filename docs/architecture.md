# Cultural Bridge OS

## A framework for mapping what matters — anywhere in the world

---

### The problem

Google Maps knows where the McDonald's is. It does not know where the old man sits every morning and tells stories about the city before the war. It does not know the courtyard hidden behind the blue door, the spring that has no name but that everyone in the village knows, the market that only exists on Thursdays.

Commercial maps are optimized for transactions. They measure stars, reviews, opening hours. What they cannot measure — and therefore ignore — is meaning. The meaning a place holds for the people who love it.

This gap is not a bug. It is structural. No algorithm trained on click-through rates will ever surface the things that make a territory alive. That knowledge lives in communities. And it disappears when communities lose the tools to record it.

**Cultural Bridge OS exists to give those tools back.**

---

### What it is

Cultural Bridge OS is an open source framework for building community-driven maps of beloved places. It provides:

- A **data architecture** designed for human meaning, not commercial relevance
- A **reputation system** based on love, not stars
- A **cultural routes layer** that connects places across historical and geographical contexts
- A **multilingual foundation** built for territories where identity is expressed in more than one language
- An **AI pipeline** for semantic understanding of place descriptions, automatic categorization, and future audio narration

The first implementation is **POI•LOVE** — launched in Albania, June 2026.

---

### Core principles

**1. Community ownership**
Data belongs to the community that creates it. No central authority decides what is worth mapping. The people who live in a place are its most accurate cartographers.

**2. Open by design**
The framework is MIT licensed. Any city, any country, any community can fork it, adapt it, and run it for their territory. POI•LOVE for Tirana is one instance. The framework is designed to become hundreds.

**3. Inclusion through welcome**
The name is not accidental. LOVE is the metric. Not popularity, not commercial value — the emotional resonance a place has for the person who discovered it and chose to share it. This creates a fundamentally different kind of map: one built on care rather than consumption.

**4. Geographies the algorithms ignore**
The framework is optimized for territories where commercial map coverage is thin: emerging economies, post-conflict regions, rural areas, diaspora communities mapping the homelands they left. These are precisely the places where community knowledge matters most and where it is most at risk of being lost.

---

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                   POI•LOVE App                       │
│         iOS · Android · Web (Expo/React Native)      │
└──────────────┬───────────────────────┬──────────────┘
               │                       │
    ┌──────────▼──────────┐  ┌────────▼────────────┐
    │      Supabase        │  │   Google Maps        │
    │  PostgreSQL + RLS    │  │   Platform           │
    │  Auth + Realtime     │  │   SDK + Places +     │
    │  Row Level Security  │  │   Geocoding          │
    └──────────┬──────────┘  └─────────────────────┘
               │
    ┌──────────▼──────────┐  ┌─────────────────────┐
    │   Plesk Media        │  │   AI Pipeline        │
    │   Server             │  │   Claude + Gemini    │
    │   Proprietary API    │  │   Categorization +   │
    │   Photo storage      │  │   Semantic analysis  │
    └─────────────────────┘  └─────────────────────┘
```

**Database (Supabase / PostgreSQL)**
Seven core tables: `profiles`, `pois`, `loves`, `lists`, `poi_lists`, `categories`, `cultural_routes`. Row Level Security enforced at database level — a private list is private even if someone queries the API directly. The LOVE system uses a unique constraint on `(user_id, poi_id)` and updates the reputation counter via database trigger in real time.

**Media storage (Plesk dedicated server)**
All photos are stored on a dedicated server via proprietary API, not on third-party cloud storage. This is a deliberate architectural choice: it keeps operational costs predictable, keeps data under direct control, and removes dependency on services that may change pricing or terms. Files are served as WebP, compressed client-side before upload.

**Maps (Google Maps Platform)**
The map layer uses the Maps SDK for the base view, Places API for address autocomplete, and Geocoding API for coordinate-to-address resolution. Cultural routes are rendered as GeoJSON overlays — not static images, but interactive layers that respond to zoom and filter.

**AI pipeline (Claude + Gemini)**
Claude handles semantic understanding: given a 200-character POI description, it can suggest the most appropriate category, detect language, and in future versions generate the audio narration (POI•VOICE module). Gemini supports research and content enrichment tasks.

---

### Cultural routes

One of the distinguishing features of Cultural Bridge OS is the cultural routes layer — a set of historical paths that connect places across national borders and centuries.

The first four routes implemented for the Albanian context:

| Route | Period | Territory |
|-------|--------|-----------|
| Via Egnatia | 146 BC (Roman) | Albania → Greece → Turkey |
| Serenissima Routes | XIV–XVIII century | Albania → Croatia → Greece |
| Illyrian Paths | Antiquity | Albania → Bosnia → Slovenia |
| Greek Colonies | VII–IV century BC | Albania → Greece |

A POI can be tagged to a cultural route. This creates a layer of historical meaning on top of the community layer: a café in Durrës becomes not just a café, but a point on the same road that Roman legions walked two thousand years ago.

New instances of the framework can define their own routes — the Silk Road, the Camino de Santiago, the old Ottoman postal roads, the routes of the Trans-Saharan trade.

---

### Forking the framework

To deploy Cultural Bridge OS for a new territory:

1. Clone the repository
2. Apply `database/schema.sql` to a new Supabase project
3. Configure the environment variables (Supabase URL + keys, Google Maps API key, Plesk server credentials)
4. Translate `categories` and `cultural_routes` tables for your territory
5. Add your cultural routes to the `cultural_routes` lookup table
6. Deploy the Expo app with your territory's branding

The framework handles everything else: auth, RLS, realtime LOVE updates, list management, media upload, map rendering.

---

### Roadmap

| Phase | Timeline | Feature |
|-------|----------|---------|
| Atto I | June 2026 | MVP iOS + Android, public launch Tirana |
| Atto II | Q1 2027 | POI•VOICE — AI-generated audio guides in 3 languages |
| Atto III | Q3 2027 | Il Libro dei Luoghi — curated editorial layer |
| Atto IV | 2028+ | Payment infrastructure for local guides and experiences |

---

### Why Albania first

Albania is not an arbitrary choice. It is the ideal stress test for the framework:

- High historical density (six civilizations in one territory: Illyrian, Greek, Roman, Byzantine, Ottoman, Venetian)
- Low commercial map coverage (significant gaps in Google Maps data outside major cities)
- Strong territorial identity in the local community
- A large diaspora (Albania has one of the highest emigration rates in Europe) that maintains deep emotional connections to specific places in the homeland
- A moment of rapid transformation where local knowledge risks being lost faster than it can be recorded

If the framework works here, it works anywhere.

---

*Cultural Bridge OS — MIT License*
*[Alessandro Castagna](https://altrostile.net) · [321.al](https://321.al) · Tirana, Albania*