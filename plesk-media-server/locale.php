<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * La porta dell intelligenza che gira sulla nostra macchina.
 *
 * Il modello sta chiuso dentro la macchina, ascolta solo se stesso e da fuori
 * non lo raggiunge nessuno. Le funzioni che rispondono a ILLI e al copilota
 * pero girano altrove, quindi serve una porta. Questa e la porta: chiede il
 * biglietto di servizio, e solo allora passa la domanda al modello.
 *
 * Senza biglietto giusto non risponde. Non e un servizio pubblico: un modello
 * aperto a tutti verrebbe usato da chiunque, a spese nostre di corrente.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['errore' => 'solo POST']); exit;
}

// ── il biglietto di servizio ────────────────────────────────────────────────
$atteso = defined('LOCALE_TOKEN') ? LOCALE_TOKEN : '';
$dato = '';
$h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (!$h && function_exists('getallheaders')) {
    foreach (getallheaders() as $k => $v) { if (strtolower($k) === 'authorization') { $h = $v; } }
}
if (preg_match('/^Bearer\s+(.+)$/i', $h, $m)) { $dato = trim($m[1]); }
if ($atteso === '' || !hash_equals($atteso, $dato)) {
    http_response_code(403); echo json_encode(['errore' => 'biglietto non valido']); exit;
}

// ── la domanda ──────────────────────────────────────────────────────────────
$corpo = json_decode((string)file_get_contents('php://input'), true) ?: [];
$prompt = trim((string)($corpo['prompt'] ?? ''));
$sistema = trim((string)($corpo['sistema'] ?? ''));
$modello = (string)($corpo['modello'] ?? 'qwen2.5:7b-instruct-q4_K_M');
$massimo = min(1200, max(32, (int)($corpo['massimo'] ?? 400)));
if ($prompt === '') { http_response_code(400); echo json_encode(['errore' => 'serve una domanda']); exit; }
if (!preg_match('/^[a-z0-9._:\-]+$/i', $modello)) {
    http_response_code(400); echo json_encode(['errore' => 'nome del modello non valido']); exit;
}

$messaggi = [];
if ($sistema !== '') { $messaggi[] = ['role' => 'system', 'content' => $sistema]; }
$messaggi[] = ['role' => 'user', 'content' => $prompt];

$inizio = microtime(true);
$ch = curl_init('http://127.0.0.1:11434/api/chat');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_TIMEOUT        => 110,
    CURLOPT_POSTFIELDS     => json_encode([
        'model' => $modello, 'messages' => $messaggi, 'stream' => false,
        'options' => ['num_predict' => $massimo, 'temperature' => (float)($corpo['calore'] ?? 0.6)],
    ]),
]);
$r = curl_exec($ch);
$stato = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

if ($r === false || $stato >= 300) {
    http_response_code(502);
    echo json_encode(['errore' => 'il modello non ha risposto: ' . ($err ?: ('stato ' . $stato))]);
    exit;
}
$j = json_decode((string)$r, true) ?: [];
echo json_encode([
    'ok'      => true,
    'testo'   => $j['message']['content'] ?? '',
    'modello' => $modello,
    'secondi' => round(microtime(true) - $inizio, 2),
    'parole'  => $j['eval_count'] ?? 0,
], JSON_UNESCAPED_UNICODE);
