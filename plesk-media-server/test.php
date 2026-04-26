<?php
// =============================================================================
// POI•LOVE — media.poilove.com — test.php
// Endpoint diagnostico — DISABILITARE in produzione dopo setup completato
// Cultural Bridge OS · MIT License
// =============================================================================
// Accesso: GET https://media.poilove.com/test.php
// Nessuna autenticazione richiesta (è un check di setup server).
// Dopo aver verificato che tutto funziona, rinomina questo file o eliminalo.
// =============================================================================

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

$checks = [];
$all_ok = true;

// ---------------------------------------------------------------------------
// Check 1: PHP version
// ---------------------------------------------------------------------------
$php_ver  = phpversion();
$php_ok   = version_compare($php_ver, '8.0.0', '>=');
$checks[] = [
    'name'   => 'PHP Version',
    'status' => $php_ok ? 'ok' : 'warning',
    'value'  => $php_ver,
    'note'   => $php_ok ? 'OK (≥ 8.0)' : 'Consigliato PHP 8.0+',
];
if (!$php_ok) $all_ok = false;

// ---------------------------------------------------------------------------
// Check 2: GD Extension
// ---------------------------------------------------------------------------
$gd_ok    = extension_loaded('gd') && function_exists('imagewebp');
$gd_info  = $gd_ok ? (gd_info()['GD Version'] ?? 'loaded') : 'non trovata';
$checks[] = [
    'name'   => 'GD Extension (WebP)',
    'status' => $gd_ok ? 'ok' : 'error',
    'value'  => $gd_info,
    'note'   => $gd_ok ? 'WebP supportato' : 'CRITICO: installa php-gd con WebP support',
];
if (!$gd_ok) $all_ok = false;

// ---------------------------------------------------------------------------
// Check 3: cURL
// ---------------------------------------------------------------------------
$curl_ok  = extension_loaded('curl');
$checks[] = [
    'name'   => 'cURL Extension',
    'status' => $curl_ok ? 'ok' : 'error',
    'value'  => $curl_ok ? curl_version()['version'] : 'non trovata',
    'note'   => $curl_ok ? 'Disponibile' : 'CRITICO: richiesto per auth Supabase',
];
if (!$curl_ok) $all_ok = false;

// ---------------------------------------------------------------------------
// Check 4: EXIF
// ---------------------------------------------------------------------------
$exif_ok  = function_exists('exif_read_data');
$checks[] = [
    'name'   => 'EXIF Extension',
    'status' => $exif_ok ? 'ok' : 'warning',
    'value'  => $exif_ok ? 'disponibile' : 'non trovata',
    'note'   => $exif_ok ? 'Rotazione JPEG automatica OK' : 'Opzionale: le foto JPEG potrebbero avere orientamento sbagliato',
];

// ---------------------------------------------------------------------------
// Check 5: Storage directory
// ---------------------------------------------------------------------------
$storage_path = STORAGE_BASE_PATH;
$storage_exists   = is_dir($storage_path);
$storage_writable = $storage_exists && is_writable($storage_path);

if (!$storage_exists) {
    // Tentativo di creazione
    $created = @mkdir($storage_path, 0755, true);
    $storage_exists   = $created;
    $storage_writable = $created;
}

$checks[] = [
    'name'   => 'Storage Directory',
    'status' => $storage_writable ? 'ok' : 'error',
    'value'  => $storage_path,
    'note'   => $storage_writable
        ? 'Esiste e scrivibile'
        : ($storage_exists ? 'Esiste ma NON scrivibile — controlla permessi Plesk' : 'Non esiste — creala via Plesk File Manager'),
];
if (!$storage_writable) $all_ok = false;

// ---------------------------------------------------------------------------
// Check 6: Supabase raggiungibile
// ---------------------------------------------------------------------------
$supabase_ok = false;
$supabase_note = '';

if ($curl_ok) {
    $ch = curl_init(SUPABASE_URL . '/rest/v1/');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 5,
        CURLOPT_HTTPHEADER     => ['apikey: ' . SUPABASE_ANON_KEY],
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    $supabase_ok   = ($code >= 200 && $code < 500 && empty($err));
    $supabase_note = $supabase_ok
        ? "Raggiungibile (HTTP $code)"
        : "Errore: " . ($err ?: "HTTP $code");
} else {
    $supabase_note = 'Skip: cURL non disponibile';
}

$checks[] = [
    'name'   => 'Supabase Connectivity',
    'status' => $supabase_ok ? 'ok' : ($curl_ok ? 'error' : 'skip'),
    'value'  => SUPABASE_URL,
    'note'   => $supabase_note,
];
if ($curl_ok && !$supabase_ok) $all_ok = false;

// ---------------------------------------------------------------------------
// Check 7: Upload limits PHP
// ---------------------------------------------------------------------------
$upload_max = ini_get('upload_max_filesize');
$post_max   = ini_get('post_max_size');
$checks[]   = [
    'name'   => 'PHP Upload Limits',
    'status' => 'info',
    'value'  => "upload_max_filesize=$upload_max, post_max_size=$post_max",
    'note'   => 'Assicurati che siano ≥ 10M e ≥ 12M rispettivamente',
];

// ---------------------------------------------------------------------------
// Check 8: max_execution_time
// ---------------------------------------------------------------------------
$max_exec  = ini_get('max_execution_time');
$exec_ok   = (int)$max_exec >= 30 || (int)$max_exec === 0;
$checks[]  = [
    'name'   => 'max_execution_time',
    'status' => $exec_ok ? 'ok' : 'warning',
    'value'  => $max_exec . 's',
    'note'   => $exec_ok ? 'OK' : 'Consigliato ≥ 30s per upload multiple foto',
];

// ---------------------------------------------------------------------------
// Output finale
// ---------------------------------------------------------------------------
$status_code = $all_ok ? 200 : 503;
http_response_code($status_code);

echo json_encode([
    'service'     => 'POI•LOVE Media Server',
    'version'     => API_VERSION,
    'base_url'    => STORAGE_BASE_URL,
    'overall'     => $all_ok ? 'ok' : 'error',
    'checks'      => $checks,
    'timestamp'   => date('c'),
    'php_version' => PHP_VERSION,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
