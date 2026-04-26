<?php
// =============================================================================
// POI•LOVE — media.poilove.com — upload.php
// Endpoint: POST /upload.php
// Cultural Bridge OS · MIT License
// =============================================================================
// Accetta fino a 3 immagini per POI, le processa in WebP ottimizzato,
// le salva nella struttura /poi/{uuid}/ e restituisce gli URL pubblici.
//
// Request (multipart/form-data):
//   Authorization: Bearer {supabase_access_token}
//   poi_id:        UUID del POI (obbligatorio)
//   photos[]:      File immagine (max 3, max 5MB cad.)
//
// Response 200:
//   { "ok": true, "urls": ["https://media.poilove.com/poi/...webp", ...] }
//
// Response errore:
//   { "ok": false, "error": "messaggio" }
// =============================================================================

declare(strict_types=1);

// Bootstrap
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/auth.php';
require_once __DIR__ . '/helpers/image.php';

// ---------------------------------------------------------------------------
// 1. Metodo HTTP
// ---------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    method_not_allowed(['POST', 'OPTIONS']);
}

// ---------------------------------------------------------------------------
// 2. Autenticazione JWT Supabase
// ---------------------------------------------------------------------------
$user = require_auth(); // termina con 401 se non valido

// ---------------------------------------------------------------------------
// 3. Validazione input: poi_id
// ---------------------------------------------------------------------------
$poi_id = trim($_POST['poi_id'] ?? '');

if (empty($poi_id)) {
    error_response('poi_id obbligatorio');
}

// Valida formato UUID v4
if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $poi_id)) {
    error_response('poi_id non valido (deve essere UUID v4)');
}

// ---------------------------------------------------------------------------
// 4. Verifica file in arrivo
// ---------------------------------------------------------------------------
if (!isset($_FILES['photos'])) {
    error_response('Nessuna foto ricevuta. Campo richiesto: photos[]');
}

// Normalizza struttura $_FILES['photos'] (gestisce sia photos[] che photos)
$files = $_FILES['photos'];

// Se è stato inviato un singolo file (non array), lo trasforma in array
if (!is_array($files['name'])) {
    $files = [
        'name'     => [$files['name']],
        'type'     => [$files['type']],
        'tmp_name' => [$files['tmp_name']],
        'error'    => [$files['error']],
        'size'     => [$files['size']],
    ];
}

$file_count = count($files['name']);

if ($file_count === 0) {
    error_response('Nessun file ricevuto');
}

if ($file_count > MAX_PHOTOS_PER_POI) {
    error_response('Troppi file. Massimo ' . MAX_PHOTOS_PER_POI . ' foto per POI');
}

// ---------------------------------------------------------------------------
// 5. Verifica che la cartella storage esista / sia scrivibile
// ---------------------------------------------------------------------------
$poi_storage_dir = STORAGE_BASE_PATH . '/' . preg_replace('/[^a-f0-9\-]/i', '', $poi_id);

if (!is_dir($poi_storage_dir)) {
    if (!mkdir($poi_storage_dir, 0755, true)) {
        error_log("POI•LOVE upload: impossibile creare directory $poi_storage_dir");
        error_response('Errore storage server', 500);
    }
}

if (!is_writable($poi_storage_dir)) {
    error_log("POI•LOVE upload: directory non scrivibile $poi_storage_dir");
    error_response('Errore permessi storage', 500);
}

// ---------------------------------------------------------------------------
// 6. Conta foto esistenti per questo POI (limite 3 totali)
// ---------------------------------------------------------------------------
$existing_photos = glob($poi_storage_dir . '/*.webp') ?: [];
$existing_count  = count($existing_photos);

if ($existing_count + $file_count > MAX_PHOTOS_PER_POI) {
    $remaining = MAX_PHOTOS_PER_POI - $existing_count;
    if ($remaining <= 0) {
        error_response("Il POI ha già il massimo di " . MAX_PHOTOS_PER_POI . " foto");
    }
    error_response("Puoi aggiungere ancora $remaining foto (hai già $existing_count)");
}

// ---------------------------------------------------------------------------
// 7. Processa e salva ogni foto
// ---------------------------------------------------------------------------
$uploaded_urls   = [];
$uploaded_paths  = []; // per rollback in caso di errore parziale
$errors          = [];

for ($i = 0; $i < $file_count; $i++) {
    $upload_error = $files['error'][$i];

    // Errore PHP upload
    if ($upload_error !== UPLOAD_ERR_OK) {
        $php_errors = [
            UPLOAD_ERR_INI_SIZE   => 'File troppo grande (php.ini)',
            UPLOAD_ERR_FORM_SIZE  => 'File troppo grande (form)',
            UPLOAD_ERR_PARTIAL    => 'Upload parziale — riprova',
            UPLOAD_ERR_NO_FILE    => 'Nessun file inviato',
            UPLOAD_ERR_NO_TMP_DIR => 'Cartella temporanea PHP mancante',
            UPLOAD_ERR_CANT_WRITE => 'Impossibile scrivere su disco',
            UPLOAD_ERR_EXTENSION  => 'Upload bloccato da estensione PHP',
        ];
        $errors[] = 'Foto ' . ($i + 1) . ': ' . ($php_errors[$upload_error] ?? 'Errore sconosciuto');
        continue;
    }

    $tmp_path  = $files['tmp_name'][$i];
    $file_size = $files['size'][$i];

    // Genera percorso destinazione
    $rel_path  = generate_safe_filename($poi_id);
    $dest_path = STORAGE_BASE_PATH . '/' . $rel_path;

    // Assicura che la sottocartella esista
    $dest_dir = dirname($dest_path);
    if (!is_dir($dest_dir)) {
        mkdir($dest_dir, 0755, true);
    }

    // Processo immagine
    $result = process_and_save_image($tmp_path, $file_size, $dest_path);

    if (!$result['ok']) {
        $errors[] = 'Foto ' . ($i + 1) . ': ' . $result['error'];
        continue;
    }

    $uploaded_urls[]  = $result['url'];
    $uploaded_paths[] = $result['path'];
}

// ---------------------------------------------------------------------------
// 8. Gestione errori parziali
// ---------------------------------------------------------------------------
if (!empty($errors) && empty($uploaded_urls)) {
    // Nessuna foto salvata — risposta di errore totale
    error_response('Nessuna foto salvata', 422, implode('; ', $errors));
}

// ---------------------------------------------------------------------------
// 9. Risposta successo
// ---------------------------------------------------------------------------
$response = [
    'urls'     => $uploaded_urls,
    'poi_id'   => $poi_id,
    'user_id'  => $user['id'],
    'count'    => count($uploaded_urls),
];

// Se ci sono stati errori parziali, li includiamo (non bloccanti)
if (!empty($errors)) {
    $response['warnings'] = $errors;
}

success($response);
