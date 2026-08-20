/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Split di deploy webapp: estrae il grosso <script> inline in app.js così index.html
 * resta sotto 1 MB (limite WAF ModSecurity). Uso: node scripts/deploy_split.js webapp/index.html OUTDIR VERSIONE
 */
const fs = require('fs');
const path = require('path');
const SRC = process.argv[2], OUT = process.argv[3], VER = process.argv[4] || '';
const html = fs.readFileSync(SRC, 'utf8');
const startMarker = '\n<script>\n';
const start = html.indexOf(startMarker);
if (start < 0) { console.error('ERR: <script> bare non trovato'); process.exit(1); }
const bodyStart = start + startMarker.length;
const endMarker = '\n</script>\n';
const end = html.indexOf(endMarker, bodyStart);
if (end < 0) { console.error('ERR: </script> di chiusura non trovato'); process.exit(1); }
const appJs = html.slice(bodyStart, end);
const newHtml = html.slice(0, start) + '\n<script src="app.js' + (VER ? ('?v=' + VER) : '') + '"></script>\n' + html.slice(end + endMarker.length);
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// Se il codice supera i 900 KB si divide in due file: oltre il megabyte il
// filtro del server rifiuta la richiesta e il sito resta bianco. Il punto dove
// tagliare non si sceglie a occhio: si prova, e si tiene solo se ENTRAMBE le
// meta' sono codice valido da sole.
// PROVATO IL 21/08/2026 E RIMANDATO: dividere in due file rompe l'avvio.
// Le due meta' sono codice valido da sole, ma la prima registra risposte che
// arrivano PRIMA che la seconda sia stata letta, e chiama funzioni che ancora
// non esistono (visto dal vivo: loadMyVanityHandle non definita, accesso rotto).
// Per dividere davvero serve prima spostare l'avvio in fondo alla seconda meta'.
// Fino ad allora il taglio resta spento e il file viaggia intero: il filtro che
// rifiutava oltre il megabyte stava sulla macchina vecchia, questa non ce l'ha.
const LIMITE = Number(process.env.POILOVE_LIMITE_JS || 99000000);
function tagliaInDue(codice) {
  const righe = codice.split('\n');
  const inizio = Math.floor(righe.length * 0.35), fine = Math.floor(righe.length * 0.65);
  const buono = /^(function |async function |\/\* |window\.|const |let )/;
  for (let i = inizio; i < fine; i++) {
    if (!buono.test(righe[i])) continue;
    const a = righe.slice(0, i).join('\n'), b = righe.slice(i).join('\n');
    try { new Function(a); new Function(b); } catch (e) { continue; }
    return [a, b];
  }
  return null;
}

let script = '\n<script src="app.js' + (VER ? ('?v=' + VER) : '') + '"></script>\n';
let due = null;
if (appJs.length > LIMITE) {
  due = tagliaInDue(appJs);
  if (due) {
    script = '\n<script src="app.js' + (VER ? ('?v=' + VER) : '') + '"></script>\n' +
             '<script src="app2.js' + (VER ? ('?v=' + VER) : '') + '"></script>\n';
  } else {
    console.error('ATTENZIONE: oltre 900 KB e non ho trovato un punto sicuro dove dividere');
  }
}
const htmlFinale = html.slice(0, start) + script + html.slice(end + endMarker.length);

fs.writeFileSync(path.join(OUT, 'app.js'), due ? due[0] : appJs);
if (due) fs.writeFileSync(path.join(OUT, 'app2.js'), due[1]);
fs.writeFileSync(path.join(OUT, 'index.html'), htmlFinale);
console.log('index.html:', htmlFinale.length, 'chars; app.js:', (due ? due[0] : appJs).length,
            'chars' + (due ? ('; app2.js: ' + due[1].length + ' chars') : ''));
if (htmlFinale.length > 1000000) console.error('ATTENZIONE: index.html ancora > 1 MB!');
if (!due && appJs.length > 1000000) console.error('ATTENZIONE: app.js oltre 1 MB, il server puo rifiutarlo!');
