<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Le ricevute degli abbonamenti.
 *
 * POST (solo amministrazione): riceve il documento (PDF o immagine), lo mette
 * in una cartella NON raggiungibile dal web con un nome impossibile da
 * indovinare, e restituisce quel nome. La riga nel registro la scrive il
 * pannello, con le sue regole.
 *
 * GET ?f=<nome>: consegna il documento SOLO a chi ne ha diritto. Il diritto
 * non lo decide questo file: si chiede al database col biglietto di chi bussa,
 * e sono le regole per-utente a rispondere (il proprietario o l amministrazione).
 */

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/auth.php';

const RICEVUTE_DIR = '/var/www/poilove/ricevute';   // FUORI dalla cartella servita dal web
const REST_LOCALE  = 'http://127.0.0.1:3001';

function rest_col_biglietto(string $path, string $token): array {
    $ch = curl_init(REST_LOCALE . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token],
        CURLOPT_TIMEOUT => 10,
    ]);
    $r = curl_exec($ch);
    $arr = json_decode((string)$r, true);
    return is_array($arr) ? $arr : [];
}

$token = extract_bearer_token();
if (!$token) { http_response_code(401); echo json_encode(['error' => 'serve il biglietto d ingresso']); exit; }
$user = require_auth();

// ── GET: consegna, se il database dice che puoi ─────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $nome = basename(trim($_GET['f'] ?? ''));
    if (!preg_match('/^[a-f0-9]{32}\.(pdf|jpg|png|webp)$/', $nome)) {
        http_response_code(400); echo json_encode(['error' => 'nome non valido']); exit;
    }
    // le regole per-utente della tabella ricevute decidono: zero righe = non tua
    $righe = rest_col_biglietto('/ricevute?file_nome=eq.' . rawurlencode($nome) . '&select=id,numero', $token);
    if (!$righe) { http_response_code(403); echo json_encode(['error' => 'questa ricevuta non e tua']); exit; }
    $percorso = RICEVUTE_DIR . '/' . $nome;
    if (!is_file($percorso)) { http_response_code(404); echo json_encode(['error' => 'documento non trovato']); exit; }
    $mime = ['pdf'=>'application/pdf','jpg'=>'image/jpeg','png'=>'image/png','webp'=>'image/webp'][pathinfo($nome, PATHINFO_EXTENSION)];
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($percorso));
    header('Content-Disposition: inline; filename="ricevuta-' . preg_replace('/[^A-Za-z0-9-]/','', $righe[0]['numero'] ?? 'poilove') . '.' . pathinfo($nome, PATHINFO_EXTENSION) . '"');
    header('Cache-Control: private, no-store');
    readfile($percorso);
    exit;
}

// ── POST: solo l amministrazione carica ─────────────────────────────────────
$profilo = rest_col_biglietto('/profiles?id=eq.' . rawurlencode($user['id']) . '&select=is_admin', $token);
if (empty($profilo[0]['is_admin'])) { http_response_code(403); echo json_encode(['error' => 'solo l amministrazione']); exit; }

if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) { error_response('serve il documento'); }
$tmp = $_FILES['file']['tmp_name'];
if (filesize($tmp) > 10 * 1024 * 1024) { error_response('il documento supera i 10 MB'); }
$fi = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($fi, $tmp);
finfo_close($fi);
$est = ['application/pdf'=>'pdf','image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$mime] ?? null;
if (!$est) { error_response('si accettano PDF e immagini, questo e ' . $mime); }

if (!is_dir(RICEVUTE_DIR)) { mkdir(RICEVUTE_DIR, 0750, true); }
$nome = bin2hex(random_bytes(16)) . '.' . $est;
if (!move_uploaded_file($tmp, RICEVUTE_DIR . '/' . $nome)) { error_response('non sono riuscito a salvare'); }
chmod(RICEVUTE_DIR . '/' . $nome, 0640);

echo json_encode(['ok' => true, 'file_nome' => $nome], JSON_UNESCAPED_UNICODE);
