<?php
/**
 * POI•LOVE — Media Server: Cancella Foto
 *
 * DELETE /media/delete.php
 *
 * Headers richiesti:
 *   Authorization: Bearer <supabase_jwt>
 *   X-POI-ID: <poi_uuid>
 *
 * Body JSON (opzionale):
 *   { "slots": [1, 2, 3] }  — quali slot cancellare (default: tutti)
 *
 * Response 200:
 *   { "ok": true, "data": { "poi_id": "...", "deleted": [...] } }
 */

require_once __DIR__ . '/helpers.php';

handle_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    json_error('Method not allowed', 405);
}

// ─── Auth ─────────────────────────────────────────
$user_id = authenticate_request();

// ─── POI ID ───────────────────────────────────────
$poi_id = trim($_SERVER['HTTP_X_POI_ID'] ?? '');
if (!$poi_id || !validate_poi_id($poi_id)) {
    json_error('Missing or invalid X-POI-ID header');
}

// ─── Slots opzionali dal body JSON ─────────────────
$body  = json_decode(file_get_contents('php://input'), true);
$slots = $body['slots'] ?? [1, 2, 3]; // default: cancella tutto
$slots = array_filter($slots, fn($s) => in_array($s, [1, 2, 3], true));

if (empty($slots)) {
    json_error('Invalid slots array — valid values: 1, 2, 3');
}

// ─── Cartella POI ─────────────────────────────────
$poi_dir = safe_poi_dir($poi_id);
if (!is_dir($poi_dir)) {
    json_error("No media found for POI $poi_id", 404);
}

// ─── Cancella file richiesti ──────────────────────
$deleted  = [];
$not_found = [];

foreach ($slots as $slot) {
    $file_path = $poi_dir . "/photo_{$slot}.jpg";
    if (file_exists($file_path)) {
        unlink($file_path);
        $deleted[] = "photo_{$slot}.jpg";
    } else {
        $not_found[] = "photo_{$slot}.jpg";
    }
}

// Se la cartella è vuota dopo la cancellazione, rimuovila
$remaining = glob($poi_dir . '/photo_*.jpg');
if (empty($remaining)) {
    // Rimuovi anche .htaccess e la directory
    @unlink($poi_dir . '/.htaccess');
    @rmdir($poi_dir);
}

json_ok([
    'poi_id'    => $poi_id,
    'user_id'   => $user_id,
    'deleted'   => $deleted,
    'not_found' => $not_found,
]);
