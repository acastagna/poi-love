<?php
/**
 * POI•LOVE — Media Server: Upload Card Composita
 *
 * POST /media/upload-card.php
 *
 * Headers richiesti:
 *   Authorization: Bearer <supabase_jwt>
 *   X-POI-ID: <poi_uuid>
 *
 * Body: multipart/form-data
 *   card  — file WebP della card composita (unico file)
 *
 * Response 200:
 *   { "ok": true, "data": { "poi_id": "...", "url": "...", "sha256": "..." } }
 *
 * Questo endpoint sostituisce upload.php per le card composite.
 * Salva UN solo file: card.webp per POI.
 * Le foto grezze non esistono più — la card è l'unico artefatto.
 */

require_once __DIR__ . '/helpers.php';

handle_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', 405);
}

// ─── Auth ─────────────────────────────────────────
$user_id = authenticate_request();

// ─── POI ID ───────────────────────────────────────
$poi_id = trim($_SERVER['HTTP_X_POI_ID'] ?? '');
if (!$poi_id || !validate_poi_id($poi_id)) {
    json_error('Missing or invalid X-POI-ID header');
}

// ─── File ─────────────────────────────────────────
if (empty($_FILES['card'])) {
    json_error('Missing card file');
}

$file = $_FILES['card'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    json_error("Upload error code: {$file['error']}");
}

// Max 1MB per la card (già ottimizzata lato app)
if ($file['size'] > 1 * 1024 * 1024) {
    json_error('Card file exceeds 1MB limit');
}

// Verifica MIME — accetta WebP e JPEG
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime  = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mime, ['image/webp', 'image/jpeg'], true)) {
    json_error("Unsupported card format: $mime");
}

// ─── Crea cartella POI ────────────────────────────
$poi_dir = safe_poi_dir($poi_id);
if (!is_dir($poi_dir)) {
    if (!mkdir($poi_dir, 0755, true)) {
        json_error('Cannot create upload directory', 500);
    }
    file_put_contents($poi_dir . '/.htaccess', "Options -Indexes\n");
}

// ─── Salva la card ────────────────────────────────
$ext      = $mime === 'image/webp' ? 'webp' : 'jpg';
$dest     = $poi_dir . '/card.' . $ext;

if (!move_uploaded_file($file['tmp_name'], $dest)) {
    json_error('Cannot save card file', 500);
}

// ─── SHA-256 dell'immagine ────────────────────────
$sha256 = hash_file('sha256', $dest);

// ─── URL pubblico ─────────────────────────────────
$url = MEDIA_BASE_URL . '/uploads/' . strtolower($poi_id) . '/card.' . $ext;

json_ok([
    'poi_id' => $poi_id,
    'url'    => $url,
    'sha256' => $sha256,
    'size'   => $file['size'],
    'mime'   => $mime,
], 201);
