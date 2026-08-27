# Migrazione della mappa al vettoriale (blocco 71)

> Aperta il 27/08/2026 dopo la promozione della prova viva
> (poilove.com/prova-vettoriale.html). Specifica ufficiale di Alessandro:
> entrano stradale+satellite con levetta Vie, tema chiaro/scuro, nomi in
> tre lingue, edifici 3D, calore come densita' di persone AMPLIFICATA,
> volo da punto a punto. NIENTE globo. Le rotte animate si valutano a parte.

## L'inventario misurato (27/08, dal sorgente webapp/index.html)

| Pezzo Leaflet | Quanti | Dove vive |
|---|---|---|
| Mappe (`L.map`) | 4 | principale, lente d'ingrandimento, minimappa, posizione condivisa |
| Tegole (`L.tileLayer`) | 10 | stradale, satellite, etichette, lente (3 livelli), minimappa, itinerari |
| Marcatori (`L.marker` + `L.divIcon`) | 9+9 | luoghi dal DB, demo, tu-sei-qui, scelte su mappa |
| Raggruppatore (`markerClusterGroup`) | 1 | i luoghi quando si affollano |
| Linee (`L.polyline`) | 7 | rotte storiche, percorsi, deviazioni |
| Cerchi (`L.circleMarker`) | 6 | posizione utente, geofence, condivisione |
| Ganci (`map.on`) | 6 | click, doppio tap, spostamenti |

## Le tappe (ognuna si chiude verificata dal vivo, mai mezze cose in produzione)

1. **Doppio motore dietro porta di servizio**: `?mappa=vettoriale` carica
   MapLibre al posto di Leaflet SOLO per chi lo chiede. La produzione non
   cambia di un pixel finche' la porta non diventa la porta principale.
2. **Il cuore**: mappa principale MapLibre con Voyager GL (chiave Carto,
   ripiego OSM raster), viste stradale/satellite+Vie, tema chiaro/scuro
   agganciato al tema dell'app, nomi nella lingua dell'utente, marcatori
   goccia (DOM marker, stessi tracciati), popup/schede agganciati.
3. **Gli attrezzi**: raggruppatore (cluster nativo MapLibre), lente
   d'ingrandimento (seconda mappa sincronizzata), doppio tap per aggiungere,
   tu-sei-qui, minimappa.
4. **I disegni sopra**: rotte storiche (linee), geofence e posizione
   condivisa (cerchi), calore densita' di persone amplificato, edifici 3D,
   volo da punto a punto (apertura scheda e tappe itinerario).
5. **Il cambio della porta**: il vettoriale diventa il default, Leaflet
   resta un giro come ripiego (`?mappa=classica`), poi si smonta.

## Regole della migrazione

- La pagina di prova (prova-vettoriale.html) e' il banco: ogni pezzo si
  assaggia li' prima di entrare nel motore doppio.
- Ogni tappa: versione +0.01, deploy sui due server, controllo.sh verde,
  verifica dal vivo col browser, commit.
- L'app nativa (blocco 33+) montera' LO STESSO disegno con MapLibre RN:
  niente lavoro doppio, un solo linguaggio visivo.
