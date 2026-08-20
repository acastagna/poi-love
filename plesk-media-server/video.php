<?php
// =============================================================================
// © Alessandro Castagna — 321.al / EVOLAB
// Tutti i diritti riservati. Uso non autorizzato vietato.
// info@321.it · https://321.al
// =============================================================================
// POI•LOVE — media.poilove.com — video.php
// Endpoint: POST /video.php
//
// Un video per luogo, compresso sulla macchina e non lasciato come esce dal
// telefono: un filmato da telefono pesa 80-150 MB, qui esce a 15-20 MB senza
// differenza visibile sullo schermo di un telefono.
//
// Regole (decise il 20/08/2026):
//   durata massima 60 secondi · lato lungo 1080 · H.264 + audio AAC
//   circa 2,5 Mbit al secondo · immagine di copertina presa dal video stesso
//
// Richiesta (multipart/form-data):
//   Authorization: Bearer {token}
//   poi_id: UUID del POI
//   video:  il file
//
// Risposta:
//   { "ok": true, "url": "...mp4", "poster": "...webp", "secondi": 42,
//     "mb_prima": 118.4, "mb_dopo": 16.2 }
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

$user = require_auth();

// ── Quanto puo' durare: dipende da chi carica ───────────────────────────────
// Il livello lo dice l'app, ma qui non ci si fida: il tetto duro e' 180 secondi
// (tre minuti, il massimo previsto per i locali). L'app manda il suo limite.
const VIDEO_SECONDI_MAX_DURO = 180;
const VIDEO_BYTE_MAX         = 400 * 1024 * 1024;  // quello che arriva, prima di comprimere
const VIDEO_LATO_LUNGO       = 1080;
const VIDEO_BITRATE          = '2500k';

$poi_id = trim($_POST['poi_id'] ?? '');
if ($poi_id === '' || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $poi_id)) {
    error_response('poi_id non valido');
}
$secondi_max = (int)($_POST['secondi_max'] ?? 60);
if ($secondi_max < 5)  { $secondi_max = 5; }
if ($secondi_max > VIDEO_SECONDI_MAX_DURO) { $secondi_max = VIDEO_SECONDI_MAX_DURO; }

if (!isset($_FILES['video']) || $_FILES['video']['error'] !== UPLOAD_ERR_OK) {
    error_response('Nessun video ricevuto');
}
$tmp   = $_FILES['video']['tmp_name'];
$byte  = (int)$_FILES['video']['size'];
if ($byte > VIDEO_BYTE_MAX) {
    error_response('Il video pesa troppo: il massimo e\' 400 MB');
}

// ── Serve ffmpeg: se non c'e', si dice, non si finge ───────────────────────
$ffmpeg  = trim((string)shell_exec('command -v ffmpeg'));
$ffprobe = trim((string)shell_exec('command -v ffprobe'));
if ($ffmpeg === '' || $ffprobe === '') {
    error_log('POI•LOVE video: ffmpeg non installato sulla macchina');
    error_response('Il server non e\' pronto a comprimere i video', 500);
}

// ── E' davvero un video? Lo dice ffprobe, non il nome del file ─────────────
$json = shell_exec($ffprobe . ' -v error -print_format json -show_streams -show_format ' . escapeshellarg($tmp) . ' 2>/dev/null');
$info = json_decode((string)$json, true);
if (!is_array($info) || empty($info['streams'])) {
    error_response('Questo file non e\' un video');
}
$haVideo = false; $durata = (float)($info['format']['duration'] ?? 0);
foreach ($info['streams'] as $st) { if (($st['codec_type'] ?? '') === 'video') { $haVideo = true; } }
if (!$haVideo)  { error_response('Questo file non e\' un video'); }
if ($durata <= 0) { error_response('Non riesco a leggere la durata del video'); }

if ($durata > $secondi_max + 0.5) {
    $m = floor($durata / 60); $s = (int)round($durata - $m * 60);
    $quanto = $m > 0 ? ($m . ' minuti e ' . $s . ' secondi') : ($s . ' secondi');
    error_response('Il video dura ' . $quanto . ': il massimo qui e\' ' . $secondi_max . ' secondi. Taglialo e riprova.');
}

// ── Dove finisce ───────────────────────────────────────────────────────────
$dir = STORAGE_BASE_PATH . '/' . preg_replace('/[^a-f0-9\-]/i', '', $poi_id);
if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
    error_response('Errore storage server', 500);
}
$nome    = 'video-' . bin2hex(random_bytes(6));
$outVid  = $dir . '/' . $nome . '.mp4';
$outPos  = $dir . '/' . $nome . '.jpg';

// ── La compressione vera ───────────────────────────────────────────────────
// scale: lato lungo 1080, l'altro si adegua e resta pari (i codificatori lo pretendono)
$scale = 'scale=\'if(gt(iw,ih),min(' . VIDEO_LATO_LUNGO . ',iw),-2)\':\'if(gt(iw,ih),-2,min(' . VIDEO_LATO_LUNGO . ',ih))\'';
$cmd = $ffmpeg . ' -y -i ' . escapeshellarg($tmp)
     . ' -vf ' . $scale
     . ' -c:v libx264 -preset veryfast -crf 23'
     . ' -maxrate ' . VIDEO_BITRATE . ' -bufsize 5000k'
     . ' -pix_fmt yuv420p -movflags +faststart'
     . ' -c:a aac -b:a 128k -ac 2'
     . ' -map_metadata -1'                    // via i dati nascosti del telefono, posizione compresa
     . ' ' . escapeshellarg($outVid) . ' 2>&1';
$log = shell_exec($cmd);

if (!file_exists($outVid) || filesize($outVid) < 1024) {
    error_log('POI•LOVE video: ffmpeg non ha prodotto niente. ' . substr((string)$log, -400));
    @unlink($outVid);
    error_response('Non sono riuscito a comprimere questo video', 500);
}

// ── L'immagine di copertina, presa dal video stesso ────────────────────────
$sec = $durata > 2 ? 1 : 0;
shell_exec($ffmpeg . ' -y -ss ' . $sec . ' -i ' . escapeshellarg($outVid)
         . ' -frames:v 1 -vf ' . $scale . ' -q:v 4 ' . escapeshellarg($outPos) . ' 2>&1');

$url    = STORAGE_BASE_URL . '/' . $poi_id . '/' . $nome . '.mp4';
$poster = file_exists($outPos) ? (STORAGE_BASE_URL . '/' . $poi_id . '/' . $nome . '.jpg') : null;

success([
    'ok'       => true,
    'url'      => $url,
    'poster'   => $poster,
    'secondi'  => round($durata, 1),
    'mb_prima' => round($byte / 1048576, 1),
    'mb_dopo'  => round(filesize($outVid) / 1048576, 1),
]);
