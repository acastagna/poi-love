# TODO — POI•LOVE
> Aggiornato: 21/06/2026

## 🔴 Bloccanti (fanno saltare il lancio)

- [ ] **Terms of Service** — creare `web/terms.html` → live su `poilove.com/terms`
- [ ] **Privacy Policy** — creare `web/privacy.html` → live su `poilove.com/privacy`
      *(richieste da X OAuth, Facebook OAuth, App Store, Play Store, GDPR)*
- [ ] **Bucket `poi_photos`** su Supabase Storage — mancante, le foto non si caricano
- [ ] **Plesk pull** demo.poilove.com — pullare tutti i commit della sessione 21/06

## 🟡 OAuth provider

- [x] Google — attivo ✅
- [ ] X (Twitter) — configurazione in corso (21/06)
- [ ] LinkedIn (OIDC) — da fare
- [ ] Facebook — da fare dopo Terms & Privacy
- [ ] Apple Sign In — rimandato a inizio luglio (fondi in arrivo)

## 🟡 Architettura / infra

- [ ] Compressione WebP upload ✅ (pushata 21/06, manca Plesk pull)
- [ ] Cloudflare R2 per immagini — quando si supera 10k utenti
- [ ] Service role key Supabase in `~/.supabase_poilove.env` — per autonomia Claude su DB

## 🟢 Feature in sviluppo

- [ ] Rotte storiche — visualizzazione, creazione, landing `/route/slug`
- [ ] App Expo (React Native) — push 17 file TypeScript, test su device fisico
- [ ] Migrazioni SQL versionate in Git (schema attuale non tracciato)

## 🔵 Futuro (non ora)

- [ ] demo.poilove.com → app ufficiale diretta (rinominare dominio al lancio)
- [ ] GoTrue self-hosted per Auth a scala alta
- [ ] ProductHunt launch (solo con app mobile pronta)
- [ ] Candidatura Claude for OSS (5000 stelle GitHub)
