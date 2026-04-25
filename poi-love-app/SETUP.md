# POI•LOVE App — Setup Rapido

## 1. Installa dipendenze
```bash
cd poi-love-app
npm install
```

## 2. Crea il file .env
```bash
cp .env.example .env
```
Compila i valori:
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` → Supabase Dashboard → Settings → API → anon key
- Gli altri valori sono già corretti per il progetto

## 3. Avvia in sviluppo
```bash
npx expo start
```
- Premi `i` per iOS Simulator
- Premi `a` per Android Emulator
- Scansiona il QR con Expo Go su un dispositivo reale

## 4. Google OAuth — Configurazione callback
Nel tuo Google Cloud Console (project: poi-love), aggiungi nei redirect URI autorizzati:
```
poilove://auth/callback
https://auth.expo.io/@tuo-username/poi-love
```

In Supabase Dashboard → Authentication → Providers → Google:
- Abilita Google
- Incolla Client ID e Client Secret da Google Cloud

## 5. Plesk Media Server
Carica la cartella `plesk-media-server/` sul tuo dominio Plesk.
Accedi a `https://[tuo-dominio]/media/test.php` per verificare la configurazione.
Poi aggiorna `EXPO_PUBLIC_MEDIA_SERVER_URL` nel `.env`.

## Struttura app
```
app/
  _layout.tsx         → Root (auth guard + session)
  (auth)/login.tsx    → Login Google
  (tabs)/index.tsx    → Mappa principale
  (tabs)/my-pois.tsx  → I miei POI
  (tabs)/profile.tsx  → Profilo

components/
  POIMarker.tsx       → Marker mappa
  POIDetailCard.tsx   → Card dettaglio POI
  AddPOISheet.tsx     → Sheet aggiunta POI (< 90 sec)

lib/
  supabase.ts         → Client + query helpers
  mediaUpload.ts      → Upload foto → Plesk
  types.ts            → TypeScript types

constants/
  theme.ts            → Brand colors, typography, spacing
  config.ts           → Env vars + costanti business
```

## Note Phosphor Icons
Quando disponibile, sostituire le emoji con Phosphor v2.1.1:
```bash
npm install phosphor-react-native
```
Poi in ogni file: `import { MapPin, Heart, User } from 'phosphor-react-native'`
