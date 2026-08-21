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

// CORS — consente chiamate fetch da demo.poilove.com e domini POI•LOVE
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

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
$user = require_auth();
$token = extract_bearer_token();   // uno solo per tutta la richiesta // termina con 401 se non valido

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

if ($file_count > 22) {   // il tetto vero lo decide il livello, piu' avanti
    error_response('Troppi file in una volta sola');
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

// ── Il luogo dev'essere suo ─────────────────────────────────────────────────
// Mancava: con un collegamento valido si potevano mettere foto sul luogo di
// chiunque altro. Adesso si chiede al database chi lo ha creato, e se non e'
// chi sta caricando, si rifiuta. Se il database non risponde, si rifiuta lo
// stesso: nel dubbio non si scrive sul luogo di un altro.
{
    $tok_pro = $token;
    $mio = false;
    if ($tok_pro) {
        $ch = curl_init('https://poilove.com/db/rest/v1/pois?select=author_id&id=eq.' . urlencode($poi_id));
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8,
            CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $tok_pro, 'Accept: application/json'],
        ]);
        $r = curl_exec($ch); curl_close($ch);
        $j = json_decode((string)$r, true);
        $mio = (is_array($j) && isset($j[0]['author_id']) && $j[0]['author_id'] === $user['id']);
    }
    if (!$mio) {
        error_response('Le foto le mette chi ha creato il luogo', 403);
    }
}

// Quante foto puo' avere questo luogo lo dice il LIVELLO di chi lo ha creato
// (tabella `livelli`), non piu' un numero fisso uguale per tutti: con il tetto
// fisso a 3 i livelli superiori non avrebbero potuto caricare le loro foto.
$tetto_foto = MAX_PHOTOS_PER_POI;
{
    $tok_liv = $token;
    if ($tok_liv) {
        $ch = curl_init('https://poilove.com/db/rest/v1/rpc/foto_massime');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $tok_liv, 'Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode(['p_user' => $user['id']]),
        ]);
        $r = curl_exec($ch); curl_close($ch);
        $n_liv = (int)trim((string)$r, "\" \n\r\t");
        if ($n_liv > 0) { $tetto_foto = $n_liv + 1; }   // le foto del livello, piu' la copertina
    }
}

if ($existing_count + $file_count > $tetto_foto) {
    $remaining = $tetto_foto - $existing_count;
    if ($remaining <= 0) {
        error_response("Il tuo livello arriva a " . $tetto_foto . " foto per luogo");
    }
    error_response("Puoi aggiungere ancora $remaining foto (ne hai gia $existing_count)");
}

// ---------------------------------------------------------------------------
// 7. Processa e salva ogni foto
// ---------------------------------------------------------------------------
$uploaded_urls   = [];
$uploaded_paths  = []; // per rollback in caso di errore parziale
$errors          = [];
$volti_totali    = 0;

// Come trattare i volti lo decide l'amministrazione (tabella impostazioni_volti);
// chi carica puo' solo chiedere una sfocatura piu' forte o piu' leggera.
$volti_attiva = true; $volti_intensita = 6; $volti_margine = 18;
{
    $ch = curl_init('https://poilove.com/db/rest/v1/impostazioni_volti?id=eq.1&select=*');
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 6]);
    $r = curl_exec($ch); curl_close($ch);
    $j = json_decode((string)$r, true);
    if (is_array($j) && isset($j[0])) {
        $volti_attiva    = !empty($j[0]['attiva']);
        $volti_intensita = (int)($j[0]['intensita'] ?? 6);
        $volti_margine   = (int)($j[0]['margine'] ?? 18);
    }
}
if (isset($_POST['volti_intensita'])) {
    $v = (int)$_POST['volti_intensita'];
    if ($v >= 0 && $v <= 10) { if ($v === 0) { $volti_attiva = false; } else { $volti_intensita = $v; } }
}

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

    // ── I volti di chi e' finito nella foto per caso ───────────────────────
    // Si sfocano PRIMA di salvare: la foto che resta sul server e' gia' pulita,
    // l'originale con le facce non lo conserviamo da nessuna parte.
    $sfocata = null;
    if ($volti_attiva) {
        // Prima di dare il file a un altro programma si controlla che sia
        // davvero un'immagine: il controllo vero arrivava solo dopo.
        $fi = new finfo(FILEINFO_MIME_TYPE);
        $tipo_vero = (string)$fi->file($tmp_path);
        if (!in_array($tipo_vero, ALLOWED_MIME_TYPES, true)) {
            $errors[] = 'Foto ' . ($i + 1) . ': non e\' un\'immagine';
            continue;
        }
        $sfocata = $tmp_path . '-volti.jpg';
        // 'timeout' perche' un programma che si pianta terrebbe occupato il server
        $cmd = 'timeout 20 python3 /usr/local/bin/poilove-volti.py ' . escapeshellarg($tmp_path) . ' ' .
               escapeshellarg($sfocata) . ' ' . (int)$volti_intensita . ' ' . (int)$volti_margine . ' 2>/dev/null';
        $out = shell_exec($cmd);
        $esito = json_decode((string)$out, true);
        if (is_array($esito) && !empty($esito['ok']) && file_exists($sfocata) && filesize($sfocata) > 1024) {
            $tmp_path  = $sfocata;
            $file_size = filesize($sfocata);
            $volti_totali += (int)($esito['volti'] ?? 0);
        } else {
            // NON si salva la foto originale facendo finta di niente: se la
            // sfocatura non ha funzionato, i volti resterebbero riconoscibili.
            error_log('POI•LOVE volti: sfocatura non riuscita, foto rifiutata. ' . substr((string)$out, 0, 200));
            if ($sfocata && file_exists($sfocata)) { @unlink($sfocata); }
            $errors[] = 'Foto ' . ($i + 1) . ': non sono riuscito a proteggere i volti, riprova fra poco';
            continue;
        }
    }

    // Processo immagine
    $result = process_and_save_image($tmp_path, $file_size, $dest_path);

    if (!$result['ok']) {
        $errors[] = 'Foto ' . ($i + 1) . ': ' . $result['error'];
        continue;
    }

    if ($sfocata && file_exists($sfocata)) { @unlink($sfocata); }

    $uploaded_urls[]  = $result['url'];
    $uploaded_paths[] = $result['path'];

    // Da dove viene questa foto resta scritto. Per le foto scattate da chi le
    // carica l'autore e' lui: si segna 'utente'. Per quelle prese da fuori
    // servono licenza e autore, e il database le rifiuta se mancano.
    {
        $tok_m = $token;
        if ($tok_m) {
            $riga = [
                'owner_id' => $user['id'],
                'poi_id'   => $poi_id,
                'url'      => $result['url'],
                'kind'     => 'foto',
                'source'   => 'utente',
                'bytes'    => (file_exists($result['path']) ? filesize($result['path']) : null),
                'mime'     => 'image/webp',
            ];
            $ch = curl_init('https://poilove.com/db/rest/v1/media_assets');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_POST => true,
                CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $tok_m, 'Content-Type: application/json', 'Prefer: return=minimal'],
                CURLOPT_POSTFIELDS => json_encode($riga),
            ]);
            curl_exec($ch); curl_close($ch);
        }
    }
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
    'urls'          => $uploaded_urls,
    'poi_id'        => $poi_id,
    'user_id'       => $user['id'],
    'count'         => count($uploaded_urls),
    'volti_sfocati' => $volti_totali,
];

// Se ci sono stati errori parziali, li includiamo (non bloccanti)
if (!empty($errors)) {
    $response['warnings'] = $errors;
}

success($response);
