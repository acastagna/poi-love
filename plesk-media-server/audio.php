<?php
// =============================================================================
// © Alessandro Castagna — 321.al / EVOLAB
// Tutti i diritti riservati. Uso non autorizzato vietato.
// info@321.it · https://321.al
// =============================================================================
// POI•LOVE — media.poilove.com — audio.php
//
// La voce di chi ha il profilo: il professionista registra un minuto, il locale
// tre. Non e' un'audioguida ufficiale (quelle le fa l'amministrazione): e' la
// sua voce, sul suo luogo.
//
// Quanto puo' durare non lo decide il telefono: si legge il livello della
// persona dal database, con il suo stesso permesso, e da li' i secondi concessi.
// Quello che arriva viene riscritto in MP3 a 192 kbit al secondo, e i dati
// nascosti della registrazione spariscono per strada.
//
// Richiesta (multipart/form-data):
//   Authorization: Bearer {token} · poi_id: UUID · audio: il file
// Risposta:
//   { "ok": true, "url": "...mp3", "secondi": 47.2, "kb": 1128 }
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

const AUDIO_TETTO_DURO = 180;          // tre minuti: il massimo previsto, per il locale
const AUDIO_BYTE_MAX   = 60 * 1024 * 1024;
const AUDIO_BITRATE    = '192k';
const REST             = 'https://poilove.com/db/rest/v1';

// ── Quanti secondi gli spettano: lo dice il suo livello ─────────────────────
function chiedi(string $url, string $token): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token, 'Accept: application/json'],
    ]);
    $r = curl_exec($ch); curl_close($ch);
    $j = json_decode((string)$r, true);
    return is_array($j) ? $j : [];
}
$prof   = chiedi(REST . '/profiles?select=special_tier&id=eq.' . urlencode($user['id']), $token);
$tier   = $prof[0]['special_tier'] ?? 'free';
$liv    = chiedi(REST . '/livelli?select=audio_secondi,nome&chiave=eq.' . urlencode((string)$tier), $token);
$concessi = (int)($liv[0]['audio_secondi'] ?? 0);
$nomeLiv  = (string)($liv[0]['nome'] ?? 'Persona');

if ($concessi <= 0) {
    error_response('Il livello ' . $nomeLiv . ' non prevede la voce sul luogo', 403);
}
if ($concessi > AUDIO_TETTO_DURO) { $concessi = AUDIO_TETTO_DURO; }

// ── Il luogo dev'essere suo: lo verifica il database, non il telefono ───────
$poi_id = trim($_POST['poi_id'] ?? '');
if ($poi_id === '' || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $poi_id)) {
    error_response('poi_id non valido');
}
$poi = chiedi(REST . '/pois?select=author_id&id=eq.' . urlencode($poi_id), $token);
if (empty($poi[0]['author_id']) || $poi[0]['author_id'] !== $user['id']) {
    error_response('Questo luogo non e\' tuo', 403);
}

if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
    error_response('Nessun audio ricevuto');
}
$tmp  = $_FILES['audio']['tmp_name'];
$byte = (int)$_FILES['audio']['size'];
if ($byte > AUDIO_BYTE_MAX) { error_response('La registrazione pesa troppo'); }

$ffmpeg  = trim((string)shell_exec('command -v ffmpeg'));
$ffprobe = trim((string)shell_exec('command -v ffprobe'));
if ($ffmpeg === '' || $ffprobe === '') {
    error_log('POI•LOVE audio: ffmpeg non installato');
    error_response('Il server non e\' pronto a convertire l\'audio', 500);
}

// ── E' davvero audio, e quanto dura? ───────────────────────────────────────
$json = shell_exec($ffprobe . ' -v error -print_format json -show_streams -show_format ' . escapeshellarg($tmp) . ' 2>/dev/null');
$info = json_decode((string)$json, true);
if (!is_array($info) || empty($info['streams'])) { error_response('Questo file non e\' un audio'); }
$haAudio = false;
foreach ($info['streams'] as $st) { if (($st['codec_type'] ?? '') === 'audio') { $haAudio = true; } }
if (!$haAudio) { error_response('Questo file non e\' un audio'); }
$durata = (float)($info['format']['duration'] ?? 0);
if ($durata <= 0) { error_response('Non riesco a leggere la durata'); }
if ($durata > $concessi + 0.6) {
    error_response('La registrazione dura ' . (int)round($durata) . ' secondi: il tuo livello (' . $nomeLiv . ') ne prevede ' . $concessi . '.');
}

// ── La conversione ─────────────────────────────────────────────────────────
$dir = STORAGE_BASE_PATH . '/' . preg_replace('/[^a-f0-9\-]/i', '', $poi_id);
if (!is_dir($dir) && !mkdir($dir, 0755, true)) { error_response('Errore storage server', 500); }
$nome = 'voce-' . bin2hex(random_bytes(6));
$out  = $dir . '/' . $nome . '.mp3';

$cmd = $ffmpeg . ' -y -i ' . escapeshellarg($tmp)
     . ' -vn -c:a libmp3lame -b:a ' . AUDIO_BITRATE . ' -ar 44100'
     . ' -map_metadata -1 '
     . escapeshellarg($out) . ' 2>&1';
$log = shell_exec($cmd);

if (!file_exists($out) || filesize($out) < 512) {
    error_log('POI•LOVE audio: ffmpeg non ha prodotto niente. ' . substr((string)$log, -300));
    @unlink($out);
    error_response('Non sono riuscito a convertire la registrazione', 500);
}

success([
    'ok'      => true,
    'url'     => STORAGE_BASE_URL . '/' . $poi_id . '/' . $nome . '.mp3',
    'secondi' => round($durata, 1),
    'kb'      => (int)round(filesize($out) / 1024),
    'livello' => $nomeLiv,
]);
