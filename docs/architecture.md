# Cultural Bridge OS: Community-Driven Mapping Framework

## Overview

Cultural Bridge OS is an open-source initiative designed to document places that matter to communities—beyond what commercial mapping services capture. As the framework notes, "Google Maps knows where the McDonald's is. It does not know where the old man sits every morning and tells stories about the city before the war."

## Key Components

**Data Structure**: The system uses nine core database tables managing user profiles, points of interest, a "love-based" reputation system, curated lists, cultural routes connecting historical sites across regions, and a card generation system for social sharing.

**Reputation Model**: Rather than star ratings, the framework employs what creators call a "love metric"—measuring "the emotional resonance a place has for the person who discovered it and chose to share it."

**Cultural Routes**: The framework includes layered historical pathways. In Albania's implementation, routes include the Via Egnatia (Roman-era), Serenissima Routes (medieval Venetian), Illyrian Paths, and Greek Colonial sites.

**Card & Sharing System**: Every POI can be exported as a composited image card in three formats (feed 4:5, stories 9:16, QR strip), with SHA-256 notarization and explicit user consent flags for future uses (NFT minting, printed publications). See `docs/card-system.md`.

## Technical Architecture

The system combines Supabase/PostgreSQL for database management, Google Maps Platform for base mapping, and AI (Claude/Gemini) for semantic analysis and content categorization. Media storage uses a dedicated Plesk server rather than third-party cloud services.

### Database Schema

Nine tables with Row Level Security (RLS) enforced throughout:

| Table | Purpose |
|---|---|
| `profiles` | Public user data, extends auth.users |
| `pois` | Core POI data with geolocation and 3-state visibility |
| `loves` | One love per user/POI — the reputation system |
| `lists` | Personal curated collections (private or public) |
| `poi_lists` | Many-to-many relationship between POIs and lists |
| `media` | References to files hosted on Plesk media server |
| `categories` | Multilingual (IT/SQ/EN) category lookup |
| `cultural_routes` | Multilingual historical route lookup |
| `card_generations` | Generated share cards with SHA-256 and consent tracking |

### POI Visibility Model

POIs use a 3-state visibility enum rather than a boolean:

- `private` — visible only to the author
- `community` — visible to all authenticated POI•LOVE users
- `suggested_google` — queued for Google Maps suggestion pipeline (future)

### Mobile App

React Native (Expo SDK 52) with Expo Router v3, TypeScript. Google OAuth via Supabase Auth. Core flow: map view → tap to add POI → < 90 seconds from open to published.

## Deployment Model

The MIT-licensed framework is designed for replication. Communities can fork the codebase, configure local databases, translate category data, and customize cultural routes for their territories.

## Strategic Focus

Albania serves as the inaugural test case, chosen for its historical complexity, diaspora populations, and limited commercial map coverage—circumstances where community knowledge preservation becomes most critical.

---

*For implementation details, see:*
- `database/schema.sql` — baseline schema
- `database/migrations/` — incremental migrations
- `docs/card-system.md` — Card & Sharing System specification
