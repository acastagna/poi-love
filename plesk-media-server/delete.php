<?php
// =============================================================================
// POI•LOVE — media.poilove.com — delete.php
// Endpoint: DELETE /delete.php  (oppure POST con _method=DELETE)
// Cultural Bridge OS · MIT License
// =============================================================================
// Elimina un'immagine dal media server. Verifica che l'URL richiesto appartenga
// al dominio corretto e che il file esista prima di eliminarlo.
//
// SICUREZZA: Non verifichiamo ownership su questo server (non abbiamo accesso
// al database Supabase). La verifica ownership viene fatta lato app PRIMA di
// chiamare questo endpoint. L'unico check qui è che il token sia valido.
//
// Request:
//   Method:        DELETE (o POST con body { "_method": "DELETE" })
//   Authorization: Bearer {supabase_access_token}
//   Content-Type:  application/json
//   Body:          { "url": "https://media.poilove.com/poi/uuid/timestamp_random.webp" }
//
// Response 200:
//   { "ok": true, "deleted": "https://media.poilove.com/poi/..." }
//
// Response errore:
//   { "ok": false, "error": "messaggio" }
// =============================================================================

declare(strict_types=1);

// Bootstrap
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/auth.php';

// ---------------------------------------------------------------------------
// 1. Metodo HTTP — accetta DELETE e POST (per client che non supportano DELETE)
// ---------------------------------------------------------------------------
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($method !== 'DELETE' && $method !== 'POST') {
    method_not_allowed(['DELETE', 'POST', 'OPTIONS']);
}

// ---------------------------------------------------------------------------
// 2. Autenticazione JWT Supabase
// ---------------------------------------------------------------------------
$user = require_auth();

// ---------------------------------------------------------------------------
// 3. Leggi il body JSON
// ---------------------------------------------------------------------------
$raw_body = file_get_contents('php://input');
$body     = json_decode($raw_body, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    error_response('Body JSON non valido');
}

// Supporto POST con _method override
if ($method === 'POST') {
    if (($body['_method'] ?? '') !== 'DELETE') {
        error_response('Per POST usa _method: "DELETE" nel body');
    }
}

// ---------------------------------------------------------------------------
// 4. Valida URL
// ---------------------------------------------------------------------------
$url = trim($body['url'] ?? '');

if (empty($url)) {
    error_response('Campo url obbligatorio');
}

// Deve iniziare con la nostra base URL (prevenzione path traversal via URL)
if (strpos($url, STORAGE_BASE_URL . '/') !== 0) {
    error_response('URL non appartiene a media.poilove.com', 403);
}

// ---------------------------------------------------------------------------
// 5. Converti URL in percorso filesystem
// ---------------------------------------------------------------------------
// Esempio: https://media.poilove.com/poi/uuid/123456_abc.webp
//       → /var/www/.../httpdocs/poi/uuid/123456_abc.webp

$relative_path = substr($url, strlen(STORAGE_BASE_URL . '/'));

// Sanifica: prevenzione path traversal
$relative_path = ltrim($relative_path, '/');
if (strpos($relative_path, '..') !== false || strpos($relative_path, "\0") !== false) {
    error_response('URL non valido', 400);
}

// Solo file WebP permessi
if (!preg_match('/\.webp$/', $relative_path)) {
    error_response('Solo file .webp possono essere eliminati');
}

// Verifica che il path sia nella struttura attesa: poi/{uuid}/{file}.webp
if (!preg_match('/^poi\/[a-f0-9\-]+\/[a-f0-9_]+\.webp$/i', $relative_path)) {
    error_response('Percorso file non valido');
}

$file_path = STORAGE_BASE_PATH . '/' . $relative_path;

// ---------------------------------------------------------------------------
// 6. Verifica esistenza file
// ---------------------------------------------------------------------------
if (!file_exists($file_path)) {
    error_response('File non trovato', 404);
}

// Verifica che sia un file regolare (non symlink, non directory)
if (!is_file($file_path)) {
    error_response('Percorso non valido', 400);
}

// ---------------------------------------------------------------------------
// 7. Elimina il file
// ---------------------------------------------------------------------------
if (!unlink($file_path)) {
    error_log("POI•LOVE delete: impossibile eliminare $file_path — user {$user['id']}");
    error_response('Errore durante l\'eliminazione del file', 500);
}

// Pulizia: se la cartella POI è ora vuota, eliminala
$poi_dir = dirname($file_path);
$remaining = glob($poi_dir . '/*');
if ($remaining !== false && count($remaining) === 0) {
    @rmdir($poi_dir);
}

// ---------------------------------------------------------------------------
// 8. Risposta successo
// ---------------------------------------------------------------------------
success(['deleted' => $url]);
