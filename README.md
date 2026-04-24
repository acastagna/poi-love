<div align="center">

<img src="https://poilove.com/img/logo-completo.svg" alt="POI•LOVE" height="80">

# POI•LOVE

**Community map of beloved places — for any country you love**

[![License: MIT](https://img.shields.io/badge/License-MIT-D42B2B.svg)](LICENSE)
[![Framework: Cultural Bridge OS](https://img.shields.io/badge/Framework-Cultural%20Bridge%20OS-285EA7)](docs/architecture.md)
[![Stack: Supabase + Google Maps](https://img.shields.io/badge/Stack-Supabase%20%2B%20Google%20Maps-3ECF8E)](database/schema.sql)
[![Platform: iOS · Android · Web](https://img.shields.io/badge/Platform-iOS%20%C2%B7%20Android%20%C2%B7%20Web-EAE4D8?labelColor=333)](app/)
[![Status: MVP in progress](https://img.shields.io/badge/Status-MVP%20in%20progress-yellow)]()

🇬🇧 [English](#english) · 🇮🇹 [Italiano](#italiano) · 🇦🇱 [Shqip](#shqip)

---

**[🗺️ Live Demo →](https://acastagna.github.io/poi-love/)** &nbsp;|&nbsp; **[📋 Roadmap →](#roadmap)** &nbsp;|&nbsp; **[🤝 Contribute →](CONTRIBUTING.md)**

</div>

---

## English

POI•LOVE is an open source app for mapping the places you truly love — not the restaurants with 4.2 stars on Google, but the café where they sit next to you without asking anything, the quiet square at 7 in the morning, the wall that tells a hundred years of history.

**Anyone can fork this project for their own country — or for the country they love.** The infrastructure is the gift. The places are yours. That is what Cultural Bridge OS means: open source not just in code, but in spirit. A tool for inclusion and welcome, built for the geographies that commercial maps ignore.

### How it works

1. **Open the map** — see community-shared POIs in your area
2. **Add a POI in < 90 seconds** — GPS location, 1-3 photos, 200 characters, 1 category
3. **Give LOVE** — your like is real reputation for the person who shared it
4. **Create lists** — public or private, shareable via link
5. **Discover cultural routes** — Via Egnatia, Serenissima Routes, Greek Colonies, Illyrian Paths

### Fork it for your country

This is not just an app — it is a framework. Clone the repo, point it at your territory, translate the categories, add your cultural routes. POI•LOVE for Morocco. POI•LOVE for Sardinia. POI•LOVE for Tbilisi. The code is the same. The love for a place is universal.

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Database + Auth | [Supabase](https://supabase.com) (PostgreSQL + RLS) |
| Maps | Google Maps Platform (SDK + Places + Geocoding) |
| Mobile App | Expo / React Native (iOS + Android) |
| Media Storage | Dedicated Plesk server (proprietary API) |
| Web | HTML5 / GitHub Pages |
| AI Pipeline | Claude + Gemini |

### First instance: Albania · Tirana

Launch planned for **June 2026 in Tirana**. Albania is the ideal context: high historical density (Illyrian, Greek, Roman, Ottoman, Venetian layers), geographies underrepresented on commercial platforms, a local community with strong territorial identity. POI•LOVE serves exactly where Google Maps stops.

### Why open source?

Maps of loved places only work if the community builds them. Open source means any city, any country can make it their own — with their language, their cultural routes, their categories. And it means every local community keeps ownership of their data. No algorithm decides what matters. People do.

---

## Italiano

POI•LOVE è un app open source per mappare i luoghi che ami davvero — non i ristoranti con 4,2 stelle su Google, ma il bar dove ti siedono accanto senza chiederti niente, la piazza silenziosa alle 7 di mattina, il muro che racconta cento anni di storia.

**Chiunque può fare il fork di questo progetto per il proprio paese — o per il paese che ama.** L infrastruttura è il dono. I luoghi sono tuoi. È quello che significa Cultural Bridge OS: open source non solo nel codice, ma nello spirito. Uno strumento di inclusione e accoglienza, costruito per le geografie che le mappe commerciali ignorano.

### Come funziona

1. **Apri la mappa** — vedi i POI condivisi dalla community nella tua zona
2. **Inserisci un POI in < 90 secondi** — posizione GPS, 1-3 foto, 200 caratteri, 1 categoria
3. **Dai LOVE** — il tuo like è reputazione reale per chi l ha condiviso
4. **Crea liste** — pubbliche o private, condivisibili via link
5. **Scopri le rotte culturali** — Via Egnatia, Rotte della Serenissima, Colonie Greche, Tracciati Illirici

### Prima istanza: Albania · Tirana

Il lancio è previsto per **giugno 2026 a Tirana**. Albania è il contesto ideale: territorio ad alta densità storica, geografie sottorappresentate sulle piattaforme commerciali, comunità locale con forte identità territoriale.

---

## Shqip

POI•LOVE është një aplikacion me burim të hapur për të hartografuar vendet që vërtet i do — jo restorantet me 4.2 yje në Google, por kafeneja ku ulen pranë teje pa të pyetur asgjë, sheshi i qetë në orën 7 të mëngjesit, muri që tregon njëqind vjet histori.

**Çdokush mund të bëjë fork të këtij projekti për vendin e vet — ose për vendin që do.** Infrastruktura është dhurata. Vendet janë tuajat. Kjo është Cultural Bridge OS: burim i hapur jo vetëm në kod, por në shpirt.

### Si funksionon

1. **Hap hartën** — shiko POI-të e ndara nga komuniteti në zonën tënde
2. **Shto një POI në < 90 sekonda** — vendndodhja GPS, 1-3 foto, 200 karaktere, 1 kategori
3. **Jep LOVE** — pëlqimi yt është reputacion real për atë që e ka ndarë
4. **Krijo lista** — publike ose private, të ndashme me link
5. **Zbulo rrugët kulturore** — Via Egnatia, Rrugët e Serenissimes, Koloni Greke, Gjurmë Ilire

---

## Roadmap

| Milestone | Target | Status |
|-----------|--------|--------|
| Interactive web prototype | ✅ Done | [Demo](https://acastagna.github.io/poi-love/) |
| Supabase database schema | ✅ Done | [schema.sql](database/schema.sql) |
| MVP App iOS + Android | 🎯 June 2026 | — |
| Public launch Tirana | 🎯 June 2026 | — |
| POI•VOICE (AI audio guides) | 2027 Q1 | — |
| Il Libro dei Luoghi | 2027 Q3 | — |
| Payment system | 2028+ | — |

---

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. Open an issue before a PR, use separate branches per feature, respect the database structure and code of conduct.

---

## License

MIT — [Alessandro Castagna](https://altrostile.net) · [321.al](https://321.al) · Tirana, Albania

---

<div align="center">

**Made with ❤️ between Italy and Albania**

*POI•LOVE is part of the [Cultural Bridge OS](docs/architecture.md) framework*

</div>
