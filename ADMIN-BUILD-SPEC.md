# Roadmap build admin fedele all'app (ricognizione 12/07)

> Companion di ORCHESTRAZIONE-ADMIN-POILOVE.md e ADMIN-DECISIONI.md. Ordine 0-8 + componenti B1-B4.

# SPEC DI BUILD — Admin POI•LOVE fedele all'app

File cardine: `/Users/alessandrocastagna/AI (produzione)/POI•LOVE/POI•LOVE/admin/panel.html` (4142 righe) + `admin/js/*.js`. Sorgente app da cui copiare markup/CSS/logica: `webapp/index.html` (16.669 righe). Endpoint upload: `https://media.poilove.com/upload.php` (Bearer JWT). Regola ferrea: mai URL a mano, foto solo via upload/media manager, tutto persistito su Supabase, verificato dal vivo.

---

## (A) LISTA ORDINATA PER IMPATTO / VELOCITÀ

Ordine = massimo effetto visibile col minimo rischio prima. I punti 0-3 sono i "quick win ad alto impatto"; 4-6 sono i tre popup/editor pesanti; 7-8 sono rifiniture.

### 0. Barra input sempre sopra la tastiera (globale) — [richiesta 11] — VELOCISSIMO, ALTO IMPATTO
**Cosa:** nessun input dell'admin deve finire sotto la tastiera mobile.
- In `panel.html` meta viewport: aggiungere `,interactive-widget=resizes-content` (copre Android).
- Aggiungere un blocco JS globale che espone `--kb` via `visualViewport` (copre iOS):
  ```js
  const vv=window.visualViewport;
  function syncKb(){const kb=Math.max(0,window.innerHeight-vv.height-vv.offsetTop);
    document.documentElement.style.setProperty('--kb',kb+'px');}
  if(vv){vv.addEventListener('resize',syncKb);vv.addEventListener('scroll',syncKb);syncKb();}
  ```
- CSS: su composer messaggi (`#msgComposer`), input ricerca badge-picker, e ogni barra input fissa in fondo: `transform:translateY(calc(-1*var(--kb,0px)));transition:transform .15s;` e sui contenitori scrollabili `padding-bottom:calc(<base>+var(--kb,0px))`.
- Al focus dell'input: `setTimeout(()=>el.scrollIntoView({block:'center'}),300)`.

**Verifica dal vivo:** da telefono reale, aprire Messaggi admin, toccare il campo → la barra input resta visibile sopra la tastiera; idem sul search del badge-picker.

### 1. Messaggi: Enter invia + autocomplete destinatario + barra in alto — [richiesta 10] — VELOCE
**Dove:** `#sec-messages` (righe 671-687), `sendAdminSupport()` (1774-1785), `startNewSupportThread()` (1791-1800).
- **Enter=invia:** su `#msgBody` (riga 682) aggiungere `onkeydown` col pattern già esistente a riga 749: `if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAdminSupport();}`. Shift+Enter = a capo.
- **Barra destinatario in alto + tendina:** in testa alla colonna conversazione mettere un input handle/nome con dropdown live. Riusare il componente `RecipientPicker` (vedi §B4), che sostituisce l'`adminPrompt` di riga 1792. Query: `profiles.select('id,username,display_name,avatar_url').or('username.ilike.%q%,display_name.ilike.%q%').limit(6)`. Selezione → `openSupportConv(id,...)`.
- La tendina mostra avatar + nome + @handle, navigabile con frecce+Enter.

**Verifica:** cercare "ale", scegliere dalla tendina con la freccia+Enter, scrivere, premere Enter → il messaggio parte e compare nel thread reale su DB.

### 2. Color picker EvoLab con GRADIENTE per badge e categorie — [richiesta 2] — MEDIO, ALTO IMPATTO
**Dove:** `badge-admin.js` (input colore righe 68-69, preview 57, upsert RPC 112, chip lista 129); categorie `loadCategoriesAdmin` (2626-2681, colori famiglia).
- Costruire il componente condiviso `POIColorPicker` (vedi §B2), portando `colorpicker.js` EvoLab con aggiunta modalità Tinta/Gradiente.
- In badge-admin: sostituire i due `<input type=color>` con due trigger `POIColorPicker` (fondo + colore testo/icona) e un toggle "Singolo/Gradiente" sul fondo. Il valore fondo diventa stringa: `#rrggbb` oppure `linear-gradient(<deg>, #a p%, #b p%)`.
- **Persistenza reale:** estendere RPC `admin_upsert_badge` con `p_color` che accetta anche la stringa gradient (colonna `color text` già stringa) + eventuale `p_text_color`. Applicare il valore in: preview (57), chip lista (`background:b.color`, 129), chip picker (`badge-picker.js` 85), chip rotte `panel.html` 3881-3883 (togliere i `#B4823C/#7C3AED/#D42B2B` hardcoded → leggere dal badge reale).
- Categorie: stesso picker per il colore famiglia/categoria custom, salvato su `poi_categories.color`.

**Verifica:** creare un badge con gradiente, salvarlo, ricaricare la pagina → il gradiente persiste su DB e compare identico nella lista, nel picker e sulle rotte; nessun colore hardcoded residuo.

### 3. Categorie/Tag/Badge in 3 colonne + LIVELLO categorie utente — [richieste 6,7] — MEDIO
**Dove:** `loadCategoriesAdmin` (2626-2681), `#catReqTable` (883), badge lista già 3-col (`badge-admin.js` 39-41).
- **Layout 3 colonne:** wrappare Categorie | Tag | Badge in un grid `repeat(3,minmax(0,1fr))` con fallback 2-col <1100px e 1-col <680px (stessa regola già in badge-admin 39-41). Adattare le card `.ba-list-row` (136) a verticalizzarsi dentro 1/3 di larghezza (chip sopra, meta sotto, azioni in fondo) invece della riga larga attuale.
- **Livello categorie utente:** oggi mostra solo `uses/20` con barra a soglia unica (2638-2648). Aggiungere:
  - `level = Math.floor(uses/20)` (o soglie 20/50/100), badge "Livello N".
  - barra verso la soglia successiva: `pct = (uses - level*20)/20*100`, etichetta "manca X al Livello N+1".
  - Verificare che la RPC `admin_list_custom_categories` ritorni il conteggio POI reali; se "POI fatti" ≠ "usi", estendere la RPC con un campo `poi_count` distinto e mostrarlo separato dal contatore usi.

**Verifica:** vista a 3 colonne su desktop, collassa a 1 su mobile; una categoria custom con 25 usi mostra "Livello 1" e barra al 25% verso Livello 2, coerente col conteggio reale su DB.

### 4. Popup "Crea POI/tappa/…" COME L'APP (largo, estetica app, foto upload, badge) — [richieste 3,4] — PESANTE, MASSIMO IMPATTO
**Cosa:** rifare i 4 popup "Crea" replicando il sheet `#addPoiSheet` dell'app (webapp/index.html 3282-3520).
- **Shell:** copiare markup `#addPoiSheet` in un overlay admin; riusare classi `.sheet`/`.sh-head`/`.sh-body`/`.sec-lbl`/`.field-in`. Per "LARGO" su desktop usare contenitore centrato `max-width:680px` con `padding:14px 20px` (NON lo split 50vw dell'app).
- **Foto via upload/media (mai URL):** riusare `.photo-row`/`.photo-slot` (3411-3421) collegate al Media Manager condiviso (§B1). Ogni slot apre il picker Carica/Libreria, salva `File` reale → upload → URL su DB. Bordo verde su `.has-photo`.
- **Categorie:** riusare `#catPicker`/`#catChosen` + `loadPoiCategories`/`buildCatPicker`/`selectCat` (data-driven da `poi_categories`, colori famiglia `_CAT_FAMS`).
- **Tag/Indirizzo/Coord:** `.tag-band` + blocco `.loc-*` (o solo `#locAddrIn`+`#locMiniMap` "Fissa il punto" per admin desktop). Coordinate SOLO da `currentLocLatLng`, mai dal DOM.
- **Badge:** nuova sezione stile `.vis-row`/`.hrb` con i 3 stati (Ufficiale `#B4823C seal-check`, Indispensabile `#7C3AED star`, Più votato `#D42B2B trophy`), persistiti su colonne `badge_official`/`badge_essential`/flag top — usando però il colore reale del badge dal DB (vedi punto 2), non hardcoded.
- **Save:** `savePOIToDB`/`savePOIEdit` (foto→WebP→media server, DB solo URL, `category`/`subcategory`/`categories[]`, `tags[]`, `visibility`).

**Verifica:** creare un POI dall'admin con 2 foto caricate + gradiente badge → compare identico nella webapp pubblica; le foto sono URL `media.poilove.com`, mai base64/URL incollati.

### 5. Assegna utente al POI via @handle (autocomplete) — [richiesta 1] — MEDIO
**Dove:** già presente in `badge-picker.js` (101-132), da generalizzare al popup POI.
- Nel popup Crea/Modifica POI aggiungere sezione "Autore/Assegnatario" con `RecipientPicker` (§B4): input @handle → tendina con avatar+nome+@handle (oggi cerca solo `username` riga 120: aggiungere `display_name`), selezione → chip con avatar (l'`avatar_url` è già preso a riga 125 ma non mostrato).
- Salvataggio: settare `pois.author_id` all'id scelto (RPC admin dedicata; garantire FK `profiles.id`).

**Verifica:** assegnare un POI a @utenteX → nella webapp il POI risulta di quell'autore (avatar+handle in `.pdm-author`).

### 6. Clic su utente: cambiare avatar E cover con popup + upload — [richiesta 5] — MEDIO
**Dove:** user-card (`admin/js/user-card.js`), `loadUsers` (1808).
- Al clic utente aprire popup profilo con due zone immagine (avatar tondo + cover) che aprono il Media Manager (§B1). Salvataggio su `profiles.avatar_url` e `profiles.cover_url`.
- **Attenzione (regola mai-URL):** oggi avatar/cover in app sono base64 in DB (`compressToDataURL` 384px). Per l'admin preferire upload reale a `media.poilove.com` e salvare l'URL; se si mantiene base64 per compatibilità, comunque passare dal picker upload/libreria, mai da campo URL.

**Verifica:** cambiare avatar+cover di un utente reale dal popup → persistono e compaiono nel profilo pubblico in webapp.

### 7. Itinerari: aggiungi tappa/rotta senza chiudere il pannello — [richiesta 8] — MEDIO
**Dove:** `_renderStopEditor` (3777-3838), `loadRoutesAdmin` (3888), `loadItinerariesAdmin` (3973).
- Replicare il pattern a due overlay dell'app: pannello itinerario resta aperto, la scheda "Aggiungi tappa" è un overlay separato sopra (app: `openTripDetail` 13823 + `addNewStop` 14403).
- Al salvataggio tappa NON chiudere/riaprire il pannello: **push nell'array → riscrivere solo il sotto-contenitore lista** (`#stops-<id>`.innerHTML) → persist debounced (app: `saveStop` 15824 → `refreshStops` 14393 → `_persistTripStops` 13707, RPC `replace_trip_stops`). Chiudere solo la scheda input.

**Verifica:** aggiungere 3 tappe di fila in un itinerario → il pannello resta aperto, la lista si aggiorna in-place, le tappe persistono su DB (RPC), nessun flicker di chiusura.

### 8. Tappe: immagini ingrandibili + editor + cambio — [richiesta 9] — PESANTE
**Dove:** `_renderStopEditor` foto (3796-3800), `_pickStopImage` (3641-3652), `_findStopPhoto` (3730-3739), CSS `.stop-card-photo` (285-286).
- Sostituire il thumb 88px `background:cover` con un `<img>` reale ispezionabile.
- Separare i click: click sull'immagine → **lightbox/zoom** a piena risoluzione; azione dedicata (icona) → cambia foto via Media Manager (§B1); azione → **image editor** (§B3: crop/rotate/replace).
- Aggiungere rimozione foto + indicatore di caricamento sulla singola tappa. Salvataggio su `trip_stops.image_url` (stesso path 3647/3736).

**Verifica:** aprire una tappa con foto storta → zoom la mostra grande, l'editor permette crop+rotate, salva → la nuova immagine persiste su `trip_stops.image_url` e si vede in app.

---

## (B) COMPONENTI CONDIVISI DA COSTRUIRE UNA VOLTA

### B1. Media Manager / Uploader (`window.POIMedia`)
Il mattone upload esiste già ed è solido (`uploadPhotosToMediaServer` webapp 5478-5524 + `compressToWebP` 5430 + fallback bucket `poi_photos`). Mancano: inventario `media_assets` e UI libreria. Estrarlo in `admin/js/media-manager.js`.

- **DB (nuova migrazione versionata, schema `public`, con RLS):** tabella `media_assets(id uuid pk, owner_id uuid→profiles.id, url text, storage_path text, bucket text, width int, height int, bytes int, mime text, kind text, source text, created_at)`. RLS: owner o admin. INSERT dopo ogni upload (oggi non avviene).
- **Server:** `upload.php` valida `poi_id` come UUID v4 (57-60): per uso generico serve un param/path senza vincolo POI, oppure passare un UUID generato lato admin come chiave asset.
- **API JS:**
  ```js
  POIMedia.pick({ kind, allowUpload:true, allowLibrary:true }) → Promise<{url,width,height,id}|null>
  POIMedia.upload(file, {kind}) → Promise<{url,id,width,height}>   // compressToWebP + POST bearer + INSERT media_assets
  POIMedia.library({ kind, ownerId, limit }) → Promise<asset[]>     // SELECT media_assets
  POIMedia.attachSlot(el, {kind, onPick})                           // aggancia uno slot .photo-slot
  ```
- **UI:** due tab Carica (drag&drop→compress→upload) e Libreria (griglia da `media_assets`), stile `.photo-picker-grid`/`.photo-picker-thumb` già presente (webapp CSS 364-402). Nessun campo URL, mai.

### B2. Color Picker EvoLab + Gradiente (`window.POIColorPicker`)
Portare `/Users/alessandrocastagna/AI (produzione)/• EvoLab/tools-linear-playout/public/colorpicker.js` (308 righe, HSV, area SV + slider Hue + HEX/RGB + palette) e il blocco CSS `.cp-*` (admin.html 314-386). Rinominare namespace `LPO→POI`, localStorage `lpo-palette→poi-badge-palette`, mappare le variabili `--ch/--bl` sui token admin.

- **Aggiunta gradiente:** toggle a due tab `Tinta | Gradiente` in `.cp-body`; in modalità gradiente barra stop trascinabili (ognuno riapre lo stesso editor SV/Hue), `+`/`✕` stop (min 2), slider Angolo 0-360°. Preview e trigger accettano sia hex sia stringa `linear-gradient(...)` (è pur sempre un `background`).
- **Contratto:** su Applica scrive `input.value` (stringa hex o gradient) e dispatcha `input`+`change`. NON usare `<input type=color>` per i gradienti (accetta solo hex): usare `<input type=hidden/text>` + trigger `.cp-trigger` + `data-target`.
- **API JS:**
  ```js
  POIColorPicker.init()
  POIColorPicker.attach(inputEl, { gradient:true, palette:'poi-badge-palette' })
  POIColorPicker.open(inputEl)
  // input.value → '#rrggbb' | 'linear-gradient(90deg,#a 0%,#b 100%)'
  ```
- **Persistenza reale:** il valore va su Supabase (`badges.color`, `poi_categories.color`), non solo localStorage (quello resta solo per i preferiti operatore).

### B3. Image Editor tappe (`window.POIImageEditor`)
Modale con ingrandimento + crop/rotate/replace su canvas, output WebP via `compressToWebP`, salvataggio su colonna target.
- **API JS:**
  ```js
  POIImageEditor.open({ url, aspect, onSave(blob){...} }) → Promise<{url}|null>
  // internamente: carica img → canvas → crop/rotate → toBlob('image/webp') → POIMedia.upload → onSave
  ```
- Riusato da tappe (`trip_stops.image_url`) e riutilizzabile per cover utente.

### B4. Recipient/Handle Picker (`window.POIRecipientPicker`)
Generalizzare il blocco già in `badge-picker.js` (103-129: input `.bp-search` + `.bp-drop`, debounce 300ms, `ilike` limit 6).
- Aggiunte: ricerca su `username` **e** `display_name`, avatar+nome+@handle nella tendina e nel chip, navigazione tastiera (frecce+Enter), stato "nessun risultato".
- **API JS:**
  ```js
  POIRecipientPicker.mount(el, { onSelect(user){...}, placeholder })
  // query: profiles.select('id,username,display_name,avatar_url')
  //        .or('username.ilike.%q%,display_name.ilike.%q%').limit(6)
  ```
- Riusato da: Messaggi (barra destinatario), Assegna utente POI, badge-picker assegnazione.

---

## (C) RISCHI — COSA NON ROMPERE

1. **Webapp condivisa.** `webapp/index.html` è la stessa base da cui si copia: NON modificarla per l'admin. Copiare markup/CSS/funzioni in file/moduli admin dedicati, non fare import incrociati che alterino il comportamento della app pubblica. La app è già live e usata dagli investitori.
2. **RLS / permessi admin.** Ogni nuova scrittura (assegna autore POI, avatar/cover utente, media_assets, badge gradiente) deve passare da RPC admin già autorizzate o nuove con `security definer` corrette. Non aprire `pois.author_id`, `profiles.avatar_url/cover_url` a scritture client non filtrate. `media_assets` nasce con RLS owner-o-admin. Non allentare le policy esistenti.
3. **Upload / media server.** Non toccare la validazione UUID v4 di `upload.php` per i POI reali (57-60): per il Media Manager generico aggiungere un path/param nuovo, non rilassare quello esistente. Mantenere il fallback bucket `poi_photos` (health-check 4900-4904 lo attende). Rispettare limiti (3 foto/POI, 5MB, WebP 1200/q82). Mai salvare base64 in colonne pensate per URL (`pois.photos[]` è URL, esplicito a 11291).
4. **Regola mai-URL / mai-finto.** Nessun campo URL testuale in nessun popup (Crea POI, tappe, avatar, cover). Ogni immagine passa da upload o libreria reale. Ogni scelta colore/badge/categoria persiste su DB e va verificata ricaricando, non con toast fittizi.
5. **Colori badge hardcoded.** I `#B4823C`/`#7C3AED`/`#D42B2B` sono duplicati in più punti (badge-admin, badge-picker 85, panel.html 3881-3883). Introducendo il gradiente, centralizzarli sul valore reale del badge dal DB: se se ne aggiorna uno solo si crea incoerenza tra lista, picker e rotte.
6. **Itinerari — persistenza.** Il pattern "non chiudere il pannello" si regge sul re-render del solo `#stops-<id>` + persist debounced (RPC `replace_trip_stops`). Se si ri-renderizza l'intero overlay si perde lo scroll e si rischia race col debounce: toccare solo il sotto-nodo.
7. **Tastiera.** `interactive-widget=resizes-content` cambia il comportamento di layout su Android: verificare che non sfondi i pannelli fixed esistenti dell'admin. iOS dipende solo da `visualViewport` (Safari ignora il meta): servono entrambe le strade.
8. **Versioning/deploy.** Ogni deploy webapp/admin incrementa `APP_VERSION` di 0.01 (regola). Deploy split >1MB già attivo (index.html + app.js): se l'admin cresce oltre 1MB applicare lo stesso split, altrimenti il WAF ModSecurity risponde 500.