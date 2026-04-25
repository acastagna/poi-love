<?php
/**
 * POI•LOVE — Media Server: Upload Foto
 *
 * POST /media/upload.php
 *
 * Headers richiesti:
 *   Authorization: Bearer <supabase_jwt>
 *   X-POI-ID: <poi_uuid>
 *
 * Body: multipart/form-data
 *   photos[]  — da 1 a 3 file immagine
 *
 * Response 200:
 *   { "ok": true, "data": { "poi_id": "...", "urls": [...], "count": N } }
 *
 * Response 4xx/5xx:
 *   { "ok": false, "error": "..." }
 */

require_once __DIR__ . '/helpers.php';

// ─── CORS + preflight ───────────────────────────────
handle_cors();

// ─── Solo POST ─────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed', 405);
}

// ─── Autenticazione ────────────────────────────────
$user_id = authenticate_request();

// ─── Leggi POI ID dall'header ──────────────────────
$poi_id = trim($_SERVER['HTTP_X_POI_ID'] ?? '');
if (!$poi_id) {
    json_error('Missing X-POI-ID header');
}
if (!validate_poi_id($poi_id)) {
    json_error('Invalid POI ID format');
}

// ─── Controlla che ci siano file ───────────────────
if (empty($_FILES['photos'])) {
    json_error('No photos field in request');
}

// Normalizza struttura $_FILES['photos'] (gestisce sia singolo che multiplo)
$files = $_FILES['photos'];
if (!is_array($files['name'])) {
    // Singolo file — converti in array
    $files = [
        'name'     => [$files['name']],
        'type'     => [$files['type']],
        'tmp_name' => [$files['tmp_name']],
        'error'    => [$files['error']],
        'size'     => [$files['size']],
    ];
}

$file_count = count($files['name']);

// ─── Validazione numero file ───────────────────────
if ($file_count === 0) {
    json_error('No files uploaded');
}
if ($file_count > MAX_PHOTOS_PER_POI) {
    json_error('Max ' . MAX_PHOTOS_PER_POI . ' photos per POI allowed');
}

// ─── Crea cartella POI ─────────────────────────────
$poi_dir = safe_poi_dir($poi_id);
if (!is_dir($poi_dir)) {
    if (!mkdir($poi_dir, 0755, true)) {
        json_error('Cannot create upload directory', 500);
    }
    // Proteggi la cartella da listing
    file_put_contents($poi_dir . '/.htaccess', "Options -Indexes\n");
}

// ─── Processa ogni file ────────────────────────────
$saved_urls = [];
$errors     = [];

for ($i = 0; $i < $file_count; $i++) {
    // Errore upload PHP
    if ($files['error'][$i] !== UPLOAD_ERR_OK) {
        $errors[] = "File $i: upload error code " . $files['error'][$i];
        continue;
    }

    $tmp    = $files['tmp_name'][$i];
    $size   = $files['size'][$i];
    $orig   = strtolower($files['name'][$i]);

    // Dimensione
    if ($size > MAX_FILE_SIZE) {
        $mb = round(MAX_FILE_SIZE / 1024 / 1024);
        $errors[] = "File $i exceeds maximum size of {$mb}MB";
        continue;
    }

    // MIME reale (non fidarsi dell'input client)
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime  = finfo_file($finfo, $tmp);
    finfo_close($finfo);

    if (!in_array($mime, ALLOWED_MIME_TYPES, true)) {
        $errors[] = "File $i has unsupported type: $mime";
        continue;
    }

    // Slot foto: 1, 2, 3 — sovrascrive se già esiste
    $slot      = $i + 1; // 1-indexed
    $dest_name = "photo_{$slot}.jpg"; // convertiamo sempre in JPEG
    $dest_path = $poi_dir . '/' . $dest_name;

    // Resize + salvataggio
    if (!resize_and_save($tmp, $dest_path, $mime)) {
        $errors[] = "File $i could not be saved";
        continue;
    }

    $saved_urls[] = MEDIA_BASE_URL . '/uploads/' . strtolower($poi_id) . '/' . $dest_name;
}

// ─── Risposta ──────────────────────────────────────
if (empty($saved_urls)) {
    json_error('No photos were saved. Errors: ' . implode('; ', $errors), 422);
}

$response = [
    'poi_id'  => $poi_id,
    'user_id' => $user_id,
    'urls'    => $saved_urls,
    'count'   => count($saved_urls),
];

if (!empty($errors)) {
    $response['warnings'] = $errors;
}

json_ok($response, 201);
