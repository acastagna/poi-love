# Contribuire a POI•LOVE

Grazie per l'interesse nel progetto. POI•LOVE è open source perché crediamo che le mappe dei luoghi amati funzionino solo se la community le costruisce insieme. Ogni contributo è benvenuto — codice, traduzioni, documentazione, segnalazioni.

## Prima di tutto: apri una Issue

Non aprire mai una Pull Request senza una Issue associata. La Issue ci permette di discutere l'approccio prima che tu scriva codice. Eccezione: correzioni di typo e bug ovvi nel README.

## Flusso di lavoro

1. Fork del repository
2. Crea un branch: `git checkout -b feature/nome-feature` oppure `fix/descrizione-bug`
3. Scrivi il codice — vedi le linee guida sotto
4. Apri una PR con descrizione chiara di cosa fa e perché

## Linee guida codice

**Database (Supabase):** qualsiasi modifica allo schema deve aggiornare `database/schema.sql` e includere la migration corrispondente. Non alterare le RLS policy senza discuterlo prima.

**App (Expo/React Native):** rispetta la struttura delle cartelle in `app/`. Componenti in `components/`, schermate in `screens/`, logica Supabase in `lib/supabase.ts`. Niente logica di business nei componenti di visualizzazione.

**Storage media:** il sistema di upload punta al server Plesk dedicato via API proprietaria. Non introdurre dipendenze da provider cloud terzi (no Cloudflare R2, no AWS S3, no Firebase Storage). Vedi `docs/api-plesk.md` per gli endpoint.

**Mappe:** usa esclusivamente Google Maps Platform. Non introdurre librerie alternative (Mapbox, Leaflet, ecc.) senza discussione preliminare.

**TTS / Audio:** il modulo audio è proprietario e in sviluppo per la Fase 2. Non integrare ElevenLabs o altri servizi TTS terzi.

## Brand identity

Rispetta rigorosamente i colori ufficiali:
- POI•LOVE Red: `#D42B2B`
- POI•VOICE Blue: `#285EA7`
- Background Light: `#EAE4D8`

Icone: usa esclusivamente **Phosphor Icons v2.1.1**.

## Localizzazione

L'app supporta tre lingue native: italiano (IT), albanese (SQ), inglese (EN). Le traduzioni in albanese devono essere fatte da madrelingua o revisionate da un nativo — non accettiamo output di traduzione automatica non revisionati.

## Codice di condotta

Tratta tutti con rispetto. Questo progetto nasce in un contesto italo-albanese, con radici in comunità che hanno storie complesse. Ogni forma di discriminazione — etnica, culturale, di genere — è incompatibile con lo spirito del progetto.

## Domande?

Apri una Issue con label `question` oppure scrivi a: **it@altrostile.app**
