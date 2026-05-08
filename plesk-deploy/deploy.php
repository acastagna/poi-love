<?php
/**
 * POI•LOVE — Deploy Webhook Receiver
 * File: httpdocs/deploy.php  (su poilove.com)
 *
 * Funzionamento:
 *   GitHub invia un POST firmato con HMAC-SHA256 su ogni push a main.
 *   Questo script verifica la firma, poi scarica i file da web/ via
 *   GitHub API e li salva in httpdocs/demo/ e httpdocs/sal/
 *
 * Setup: vedi deploy-strategy.md
 * MIT License · POI•LOVE · Cultural Bridge OS
 */

// ─── CONFIG ───────────────────────────────────────────────────────────────────

// Segreto condiviso con GitHub Webhook (da impostare in .htaccess o hardcoded)
// Ideale: getenv('DEPLOY_SECRET') da variabile d'ambiente Plesk
$DEPLOY_SECRET = getenv('DEPLOY_SECRET') ?: 'CAMBIA_QUESTO_SEGRETO';

// Repository GitHub
$GITHUB_REPO = 'acastagna/poi-love';
$GITHUB_BRANCH = 'main';

// Mappatura: percorso nel repo → cartella locale su Plesk
// __DIR__ = httpdocs/ di poilove.com
$FILE_MAP = [
    'web/index.html'        => __DIR__ . '/demo/index.html',
    'web/itinerari.html'    => __DIR__ . '/demo/itinerari.html',
    'web/POI-LOVE-SAL.html' => __DIR__ . '/sal/index.html',
    'web/SAL-data.json'     => __DIR__ . '/sal/SAL-data.json',
];

// ─── HEALTH CHECK (GET ?check=1) ─────────────────────────────────────────────

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['check'])) {
    header('Content-Type: application/json');
    $status = [];
    foreach ($FILE_MAP as $src => $dst) {
        $status[$src] = [
            'exists'   => file_exists($dst),
            'modified' => file_exists($dst) ? date('c', filemtime($dst)) : null,
        ];
    }
    echo json_encode([
        'ok'      => true,
        'repo'    => $GITHUB_REPO,
        'branch'  => $GITHUB_BRANCH,
        'files'   => $status,
        'php'     => PHP_VERSION,
        'time'    => date('c'),
    ], JSON_PRETTY_PRINT);
    exit;
}

// ─── VERIFICA METODO ─────────────────────────────────────────────────────────

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['error' => 'Method Not Allowed']));
}

// ─── LEGGI PAYLOAD ───────────────────────────────────────────────────────────

$rawPayload = file_get_contents('php://input');

// ─── VERIFICA FIRMA HMAC-SHA256 ───────────────────────────────────────────────

$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
$expected  = 'sha256=' . hash_hmac('sha256', $rawPayload, $DEPLOY_SECRET);

if (!hash_equals($expected, $signature)) {
    http_response_code(403);
    die(json_encode(['error' => 'Invalid signature']));
}

// ─── CONTROLLA CHE SIA UN PUSH SU MAIN ───────────────────────────────────────

$payload = json_decode($rawPayload, true);
$ref     = $payload['ref'] ?? '';

if ($ref !== 'refs/heads/' . $GITHUB_BRANCH) {
    http_response_code(200);
    die(json_encode(['ok' => true, 'message' => "Ignored ref: $ref"]));
}

// ─── SCARICA FILE DA GITHUB API ───────────────────────────────────────────────

$results  = [];
$errors   = [];
$ghApiBase = "https://api.github.com/repos/{$GITHUB_REPO}/contents";

foreach ($FILE_MAP as $repoPath => $localPath) {

    // Assicura che la cartella di destinazione esista
    $dir = dirname($localPath);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    // Chiama GitHub API (no auth per repo pubblico)
    $url = "{$ghApiBase}/{$repoPath}?ref={$GITHUB_BRANCH}";
    $ctx = stream_context_create([
        'http' => [
            'method'     => 'GET',
            'header'     => "User-Agent: POI-LOVE-Deploy/1.0\r\n",
            'timeout'    => 15,
        ]
    ]);

    $response = @file_get_contents($url, false, $ctx);

    if ($response === false) {
        $errors[] = "fetch_failed: $repoPath";
        continue;
    }

    $data    = json_decode($response, true);
    $content = base64_decode(str_replace("\n", '', $data['content'] ?? ''));

    if (!$content) {
        $errors[] = "empty_content: $repoPath";
        continue;
    }

    // Scrivi file locale
    if (file_put_contents($localPath, $content) === false) {
        $errors[] = "write_failed: $localPath";
    } else {
        $results[] = [
            'src'     => $repoPath,
            'dst'     => str_replace(__DIR__, '', $localPath),
            'size'    => strlen($content),
            'sha'     => $data['sha'] ?? null,
        ];
    }
}

// ─── LOG ──────────────────────────────────────────────────────────────────────

$logLine = date('c') . ' push:' . substr($payload['after'] ?? 'unknown', 0, 8)
    . ' files:' . count($results)
    . ' errors:' . count($errors) . PHP_EOL;
@file_put_contents(__DIR__ . '/deploy.log', $logLine, FILE_APPEND | LOCK_EX);

// ─── RISPOSTA ─────────────────────────────────────────────────────────────────

header('Content-Type: application/json');
http_response_code(count($errors) > 0 ? 207 : 200);
echo json_encode([
    'ok'      => count($errors) === 0,
    'commit'  => substr($payload['after'] ?? '', 0, 8),
    'updated' => $results,
    'errors'  => $errors,
    'time'    => date('c'),
], JSON_PRETTY_PRINT);
