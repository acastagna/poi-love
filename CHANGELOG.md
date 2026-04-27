# Changelog — POI•LOVE

All notable changes to this project are documented here.  
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) · Versioning: [SemVer](https://semver.org/)

---

## [Unreleased] — active development

### In Progress
- Travel Itineraries — Migration 002 (Supabase) + React Native UI + Geofencing
- HeyGen avatar Liri — 3 video IT/SQ/EN (60s each)
- Social accounts setup: TikTok, Instagram, LinkedIn

---

## [0.2.0] — 2026-05-01 · Digital Launch 🚀

**Show HN · May 6 · Social · GitHub Pages**

### Added
- Interactive HTML demo with full Leaflet map (Tirana real POIs)
- Profile view: badge system (Amatore / Viaggiatore / Avventuriero / Galattico)
- Profile view: public/private toggle, interactive tags + lists + POI board
- Itinerary page: full-screen map, bottom drawer, micro-calendar, GPS banner
- Itinerary page: rich POI cards with image / title / description / address / coordinates
- Travel companions sheet with block/message actions
- Phosphor Icons v2.1.1 throughout (no emoji in UI)
- Trilingual IT / SQ / EN — auto-detected by device locale
- `deploy.php` webhook for zero-SSH Plesk auto-deploy
- `CHANGELOG.md` and semantic versioning

### Changed
- Demo redesign: profile hero without duplicate logo, stats bar floating
- Map type selector: Street / Satellite / Historic Routes (Via Egnatia polyline)
- FAB: submenu with 2 options (Add POI / Itinerary Stop)
- Detail sheet: added address, coordinates, Navigate button

### Infrastructure
- GitHub Pages: serves `web/` from `main` branch
- Plesk webhook: `poilove.com/demo/` auto-synced on every push
- GitHub Actions: `pages.yml` (GitHub Pages) + `deploy-media-server.yml` (media.poilove.com)

---

## [0.1.0] — 2026-04-26 · Foundation ✅

**Infrastructure complete · Supabase live · Media server live**

### Added
- Supabase schema: 12 tables with RLS policies
  - `profiles`, `pois`, `loves`, `lists`, `poi_lists`, `tags`, `poi_tags`
  - `card_generations`, `historical_routes`, `poi_routes`
  - `itineraries`, `itinerary_stops`, `itinerary_interests` (Migration 002)
- Migration 001: `poi_visibility` ENUM + `card_generations` table
- Migration 002: Travel Itineraries — 3 new tables + full RLS
- Google OAuth authentication (Supabase)
- Google Maps Platform configuration
- Media server live at `media.poilove.com` (PHP 8.3, GD/WebP, EXIF)
- GitHub Actions CI/CD: auto-deploy to media.poilove.com on push
- React Native / Expo SDK 52 app scaffold — 17 TypeScript files
  - Root layout with AuthContext (Supabase)
  - Google OAuth login screen
  - Map view with react-native-maps (warm beige style)
  - AddPOISheet: < 90 sec flow (name, 200 chars, 10 tags, 3 photos, visibility)
  - POIDetailCard with horizontal photo scroll
  - LoveButton with optimistic animation
  - POIMarker with love_count badge
  - MediaUpload JWT Bearer → media.poilove.com
- Card System spec: feed 4:5 / stories 9:16 / qr_strip / SHA-256 / consent NFT
- Trilingual SAL (Stato Avanzamento Lavori) — IT / SQ / EN
- `SAL-data.json` as single source of truth for project status
- `docs/architecture.md` — full system architecture
- `docs/card-system.md` — card composite spec

### Infrastructure
- Repository: github.com/acastagna/poi-love (MIT License)
- CI/CD: GitHub Actions (Pages + Plesk SSH)
- Database: Supabase (PostgreSQL, RLS enabled, 0 security errors)
- Media: media.poilove.com (PHP/Plesk, ED25519 deploy key)

---

## Roadmap

| Milestone | Target | Status |
|-----------|--------|--------|
| v0.2.0 Digital Launch | May 1, 2026 | 🔄 In progress |
| Show HN worldwide | May 6, 2026 | Planned |
| Anthropic Claude for OSS | May 8, 2026 | Planned |
| v0.3.0 Tirana Physical | June 2026 | Planned |
| Travel Itineraries (Atto I.5) | Post-launch | Spec ready |
| iOS/Android TestFlight | June 2026 | In development |

---

*POI•LOVE is part of the Cultural Bridge OS framework.*  
*Open source · MIT License · Built with love in Tirana 🇦🇱*
