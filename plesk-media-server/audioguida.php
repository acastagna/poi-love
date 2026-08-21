<?php
// =============================================================================
// © Alessandro Castagna — 321.al / EVOLAB
// Tutti i diritti riservati. Uso non autorizzato vietato.
// info@321.it · https://321.al
// =============================================================================
// POI•LOVE — media.poilove.com — audioguida.php
//
// Le audioguide ufficiali POI•VOICE. Le carica SOLO l'amministrazione, durano
// quanto serve, e vengono riscritte in MP3 a 192 kbit come tutto il resto.
// La voce del proprietario e' un'altra cosa e passa da audio.php.
//
// Richiesta (multipart/form-data):
//   Authorization: Bearer {token di un amministratore}
//   casa: 'poi' | 'trip' · id: UUID · lingua: it|sq|en · audio: il file
// Risposta:
//   { "ok": true, "url": "...mp3", "secondi": 312.4, "kb": 7500 }
// =============================================================================

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { method_not_allowed(['POST', 'OPTIONS']); }

$user  = require_auth();
$token = extract_bearer_token();

const GUIDA_SECONDI_MAX = 3600;                 // un'ora: oltre e' un errore, non una guida
const GUIDA_BYTE_MAX    = 300 * 1024 * 1024;
const GUIDA_BITRATE     = '192k';
const REST              = 'https://poilove.com/db/rest/v1';

function chiedi_json(string $url, string $token): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 12,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token, 'Accept: application/json'],
    ]);
    $r = curl_exec($ch); curl_close($ch);
    $j = json_decode((string)$r, true);
    return is_array($j) ? $j : [];
}

// ── Solo l'amministrazione ─────────────────────────────────────────────────
$io = chiedi_json(REST . '/profiles?select=is_admin&id=eq.' . urlencode($user['id']), $token);
if (empty($io[0]['is_admin'])) {
    error_response('Le audioguide ufficiali le carica solo l\'amministrazione', 403);
}

$casa   = trim($_POST['casa'] ?? '');
$id     = trim($_POST['id'] ?? '');
$lingua = strtolower(trim($_POST['lingua'] ?? ''));
if (!in_array($casa, ['poi', 'trip'], true))            { error_response('casa deve essere poi oppure trip'); }
if (!in_array($lingua, ['it', 'sq', 'en'], true))        { error_response('lingua deve essere it, sq oppure en'); }
if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id)) {
    error_response('id non valido');
}

if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) { error_response('Nessun audio ricevuto'); }
$tmp = $_FILES['audio']['tmp_name'];
if ((int)$_FILES['audio']['size'] > GUIDA_BYTE_MAX) { error_response('Il file pesa troppo'); }

$ffmpeg  = trim((string)shell_exec('command -v ffmpeg'));
$ffprobe = trim((string)shell_exec('command -v ffprobe'));
if ($ffmpeg === '' || $ffprobe === '') { error_response('Il server non e\' pronto a convertire l\'audio', 500); }

$info = json_decode((string)shell_exec('timeout 20 ' . $ffprobe . ' -v error -print_format json -show_streams -show_format ' . escapeshellarg($tmp) . ' 2>/dev/null'), true);
if (!is_array($info) || empty($info['streams'])) { error_response('Questo file non e\' un audio'); }
$haAudio = false;
foreach ($info['streams'] as $st) { if (($st['codec_type'] ?? '') === 'audio') { $haAudio = true; } }
if (!$haAudio) { error_response('Questo file non e\' un audio'); }
$durata = (float)($info['format']['duration'] ?? 0);
if ($durata <= 0)                  { error_response('Non riesco a leggere la durata'); }
if ($durata > GUIDA_SECONDI_MAX)   { error_response('L\'audioguida supera un\'ora: controlla il file'); }

$dir = STORAGE_BASE_PATH . '/guide/' . preg_replace('/[^a-f0-9\-]/i', '', $id);
if (!is_dir($dir) && !mkdir($dir, 0755, true)) { error_response('Errore storage server', 500); }
$nome = $lingua . '-' . bin2hex(random_bytes(5));
$out  = $dir . '/' . $nome . '.mp3';

$log = shell_exec('timeout 170 ' . $ffmpeg . ' -y -i ' . escapeshellarg($tmp)
     . ' -vn -c:a libmp3lame -b:a ' . GUIDA_BITRATE . ' -ar 44100 -map_metadata -1 '
     . escapeshellarg($out) . ' 2>&1');

if (!file_exists($out) || filesize($out) < 1024) {
    error_log('POI•LOVE audioguida: ffmpeg non ha prodotto niente. ' . substr((string)$log, -300));
    @unlink($out);
    error_response('Non sono riuscito a convertire l\'audioguida', 500);
}

success([
    'ok'      => true,
    'url'     => STORAGE_BASE_URL . '/guide/' . $id . '/' . $nome . '.mp3',
    'secondi' => round($durata, 1),
    'kb'      => (int)round(filesize($out) / 1024),
    'lingua'  => $lingua,
]);
