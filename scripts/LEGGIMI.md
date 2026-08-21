# Gli script di POI•LOVE

Tutto quello che si lancia a mano sta qui dentro, non in una cartella temporanea.
Regola nata il 21/08/2026: se un numero finisce in una pagina o in un rapporto,
lo script che lo ha prodotto deve stare nel repository, altrimenti quel numero
non si può più rifare.

| Script | Dove si lancia | Cosa fa |
|---|---|---|
| `controllo.sh` | sul Mac | I diciotto controlli dal vivo: versione, condivisione, peso delle foto, pagine di servizio. Devono passare tutti prima di considerare finita una sessione. |
| `misura.sh` | sul Mac | Le misure di velocità: pagina, motore dell'app, primi dati, lavoro nostro. Con `--macchina` misura anche da dentro il server e dice quanto è occupato. Con `--json` scrive `docs/misure.json`. |
| `prova-video.sh` | sulla macchina | Fabbrica un video come quello di un telefono e lo comprime con le stesse istruzioni di `video.php`: dice quanto pesa prima, dopo, e in quanti secondi. |
| `deploy_split.js` | sul Mac | Divide `webapp/index.html` in pagina e motore: serve perché il file intero supera il megabyte. |
| `build_livelli.js`, `build_og_livelli.sh` | sul Mac | Costruiscono le pagine dei livelli e le immagini di anteprima. |
| `ritorno-accessi.sh` | sul Mac | Riporta gli accessi su Supabase se la macchina nuova avesse un problema. Da usare solo in emergenza. |

## Nella cartella `macchina/`

Sono i lavori che girano da soli sul server, copiati in `/opt/poilove/`.

| Script | Quando | Cosa fa |
|---|---|---|
| `condizioni-notte.sh` | 03:20 ogni notte | Guarda chi ha un livello e se sta rispettando il patto. Avvisa, e dopo quattordici giorni spegne il livello. Scrive `NON FATTO` se il database non risponde. |
| `cambio-giorno.sh` | 04:10 e 13:10 | Il cambio ufficiale della Banca d'Albania. Se la pagina non risponde riporta l'ultimo valore noto e lo segna come ricaduta. |
| `candidati.py` | a mano | La catena dei contenuti: pesca luoghi veri dai dati aperti, cerca la foto con licenza su Wikidata e il testo su Wikipedia nelle tre lingue. |
| `catena-tutti.sh` | a mano | La catena su tutti e quindici i viaggi, uno dietro l'altro, con le pause giuste. |
| `volti.py` | chiamato da `upload.php` | Trova i volti e li sfoca con bordi sfumati. Se non ci riesce, la foto non passa. |
| `logrotate-poilove` | ogni settimana | I registri dei lavori automatici si tengono otto settimane, poi si buttano. |

## Le misure di oggi

L'ultima misura sta in `docs/misure.json`, con la data. Per rifarla:

```
scripts/misura.sh 12 --macchina --json
```
