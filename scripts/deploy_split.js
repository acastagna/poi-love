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
fs.writeFileSync(path.join(OUT, 'app.js'), appJs);
fs.writeFileSync(path.join(OUT, 'index.html'), newHtml);
console.log('index.html:', newHtml.length, 'chars; app.js:', appJs.length, 'chars');
if (newHtml.length > 1000000) console.error('ATTENZIONE: index.html ancora > 1 MB!');
