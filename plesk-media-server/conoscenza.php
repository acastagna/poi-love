<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Caricare un PDF nella conoscenza degli assistenti.
 *
 * Qui si fa solo la parte che non ha bisogno di chiavi: si prende il file, si
 * tira fuori il testo pagina per pagina, si spezza in pezzi corti e si scrivono
 * nel database col nome di chi li ha caricati. Il numero che descrive il
 * significato di ogni pezzo lo mette dopo la funzione con la chiave: qui una
 * chiave non ci arriva mai.
 *
 * Chi scrive e' l'amministratore stesso: si usa il suo biglietto d'ingresso,
 * quindi valgono le stesse regole del pannello, secondo fattore compreso.
 */

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/auth.php';

const REST_BASE   = 'http://127.0.0.1:3001';
const PEZZO_LUNGO = 900;   // caratteri per pezzo: un paragrafo pieno
const PEZZO_CODA  = 150;   // quanto si ripete del pezzo prima, per non tagliare a meta un discorso
const MAX_PDF     = 25 * 1024 * 1024;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { method_not_allowed(['POST', 'OPTIONS']); }

$user  = require_auth();
$token = extract_bearer_token();
if (!$token) { http_response_code(401); echo json_encode(['error' => 'manca il biglietto d ingresso']); exit; }

/** Chiamata al database col biglietto di chi ha caricato. */
function db(string $metodo, string $path, $corpo = null, array $extra = []) {
    global $token;
    $ch = curl_init(REST_BASE . $path);
    $head = ['Authorization: Bearer ' . $token, 'Content-Type: application/json'];
    foreach ($extra as $h) { $head[] = $h; }
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $metodo,
        CURLOPT_HTTPHEADER     => $head,
        CURLOPT_TIMEOUT        => 30,
    ]);
    if ($corpo !== null) { curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($corpo)); }
    $r = curl_exec($ch);
    $c = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$c, json_decode((string)$r, true), (string)$r];
}

// ── 1. il file ──────────────────────────────────────────────────────────────
if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    error_response('serve un file');
}
$tmp = $_FILES['file']['tmp_name'];
if (filesize($tmp) > MAX_PDF) { error_response('il PDF supera i 25 MB'); }

$fi   = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($fi, $tmp);
finfo_close($fi);
if ($mime !== 'application/pdf') { error_response('per ora si caricano solo PDF, questo e ' . $mime); }

$titolo = trim($_POST['titolo'] ?? '') ?: preg_replace('/\.pdf$/i', '', (string)$_FILES['file']['name']);
$ambito = in_array($_POST['ambito'] ?? '', ['illi', 'copilota', 'entrambi'], true) ? $_POST['ambito'] : 'entrambi';
$lingua = in_array($_POST['lingua'] ?? '', ['it', 'sq', 'en'], true) ? $_POST['lingua'] : 'it';

// ── 2. il testo, pagina per pagina ──────────────────────────────────────────
// pdftotext con -f e -l una pagina alla volta: cosi si sa da quale pagina
// viene ogni pezzo, e chi legge la risposta puo andare a controllare.
$quante = 0;
$out = [];
exec('pdfinfo ' . escapeshellarg($tmp) . ' 2>&1', $out);
foreach ($out as $riga) { if (preg_match('/^Pages:\s+(\d+)/', $riga, $m)) { $quante = (int)$m[1]; } }
if ($quante < 1) { error_response('non riesco a leggere questo PDF'); }
if ($quante > 400) { error_response('il PDF ha ' . $quante . ' pagine: oltre le 400 va diviso'); }

$pagine = [];
for ($p = 1; $p <= $quante; $p++) {
    $t = shell_exec('pdftotext -f ' . $p . ' -l ' . $p . ' -enc UTF-8 -nopgbrk ' .
                    escapeshellarg($tmp) . ' - 2>/dev/null');
    // Le parole spezzate a fine riga con il trattino tornano intere: senza
    // questo, "esperienza" scritta "esper-\nienza" diventa due parole che non
    // esistono, e la ricerca per senso non le riconosce piu.
    $t = preg_replace('/(\p{L})-\n(\p{Ll})/u', '$1$2', (string)$t);
    $t = trim(preg_replace('/[ \t]+/', ' ', preg_replace('/\n{3,}/', "\n\n", $t)));
    if ($t !== '') { $pagine[$p] = $t; }
}
if (!$pagine) {
    error_response('questo PDF non ha testo: e fatto di immagini. Serve prima passarlo a un lettore ottico.');
}

// ── 3. i pezzi ──────────────────────────────────────────────────────────────
// Si taglia alla fine di una frase quando si puo, mai in mezzo a una parola.
function spezza(string $testo): array {
    $pezzi = [];
    $len = mb_strlen($testo);
    $da = 0;
    while ($da < $len) {
        // Coda della pagina: si prende tutta e si chiude. Senza questa uscita
        // il passo in avanti diventava di un carattere e la stessa coda veniva
        // scritta centinaia di volte: otto pagine facevano novecento pezzi.
        if ($da + PEZZO_LUNGO >= $len) {
            $coda = trim(mb_substr($testo, $da));
            if ($coda !== '') { $pezzi[] = $coda; }
            break;
        }
        $fetta = mb_substr($testo, $da, PEZZO_LUNGO);
        $taglio = max(mb_strrpos($fetta, '. ') ?: 0, mb_strrpos($fetta, "\n") ?: 0);
        if ($taglio > PEZZO_LUNGO * 0.5) { $fetta = mb_substr($fetta, 0, $taglio + 1); }
        $fetta = trim($fetta);
        if ($fetta !== '') { $pezzi[] = $fetta; }
        // Il passo non scende mai sotto meta pezzo: e' la garanzia che il giro finisca.
        $avanti = max((int)(PEZZO_LUNGO / 2), mb_strlen($fetta) - PEZZO_CODA);
        $da += $avanti;
    }
    return $pezzi;
}

$righe = [];
$ordine = 0;
foreach ($pagine as $num => $testo) {
    foreach (spezza($testo) as $pezzo) {
        if (mb_strlen($pezzo) < 40) { continue; }   // avanzi di impaginazione
        $righe[] = ['pagina' => $num, 'ordine' => $ordine++, 'testo' => $pezzo];
    }
}
if (!$righe) { error_response('non ho trovato testo utile in questo PDF'); }

// ── 4. il documento e i suoi pezzi ──────────────────────────────────────────
[$c, $doc] = db('POST', '/conoscenza_documenti', [
    'titolo' => $titolo, 'ambito' => $ambito, 'lingua' => $lingua,
    'pagine' => count($pagine), 'pezzi' => count($righe), 'stato' => 'in_lavorazione',
    'caricato_da' => $user['id'] ?? null,
], ['Prefer: return=representation']);
if ($c >= 300 || empty($doc[0]['id'])) {
    http_response_code(403);
    echo json_encode(['error' => 'il database non ha accettato il documento: se la sessione non ha il secondo fattore, esci e rientra col codice a sei cifre']);
    exit;
}
$docId = $doc[0]['id'];

$scritti = 0;
foreach (array_chunk($righe, 60) as $gruppo) {
    $corpo = array_map(function ($r) use ($docId) {
        return ['documento_id' => $docId, 'pagina' => $r['pagina'], 'ordine' => $r['ordine'], 'testo' => $r['testo']];
    }, $gruppo);
    [$cc] = db('POST', '/conoscenza_pezzi', $corpo);
    if ($cc < 300) { $scritti += count($gruppo); }
}

if ($scritti === 0) {
    db('PATCH', '/conoscenza_documenti?id=eq.' . urlencode($docId),
       ['stato' => 'fallito', 'motivo' => 'i pezzi non sono stati scritti']);
    http_response_code(500);
    echo json_encode(['error' => 'i pezzi non sono stati scritti']);
    exit;
}

// ── 5. il file resta, cosi si puo rileggere ─────────────────────────────────
$dir = __DIR__ . '/conoscenza';
if (!is_dir($dir)) { @mkdir($dir, 0755, true); }
$nome = $docId . '.pdf';
@move_uploaded_file($tmp, $dir . '/' . $nome);
db('PATCH', '/conoscenza_documenti?id=eq.' . urlencode($docId),
   ['file_url' => 'https://media.poilove.com/conoscenza/' . $nome]);

echo json_encode([
    'ok' => true, 'id' => $docId, 'titolo' => $titolo,
    'pagine' => count($pagine), 'pezzi' => $scritti,
    'nota' => 'testo pronto: manca il numero del significato, lo mette la funzione con la chiave',
], JSON_UNESCAPED_UNICODE);
