<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * La prova del rapporto: il file .ots da scaricare.
 *
 *   rapporto-ots.php?id=<rapporto>
 *
 * Chi ha il rapporto deve avere anche il modo di verificarlo fuori di qui,
 * con gli strumenti ufficiali OpenTimestamps: altrimenti l'impronta resta
 * una parola data. Il diritto lo decide il database col biglietto di chi
 * bussa (il rapporto e' suo, o e' amministrazione): zero righe, zero file.
 */

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers/auth.php';
require_once __DIR__ . '/helpers/ots.php';

$token = extract_bearer_token();
if (!$token) { http_response_code(401); header('Content-Type: application/json'); echo json_encode(['error'=>'serve il biglietto']); exit; }
require_auth();

$id = trim($_GET['id'] ?? '');
if (!preg_match('/^[0-9a-f-]{36}$/', $id)) { http_response_code(400); header('Content-Type: application/json'); echo json_encode(['error'=>'id non valido']); exit; }

$ch = curl_init('http://127.0.0.1:3001/rapporti?id=eq.' . $id . '&select=periodo,impronta,stato,ricevute,blocco');
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$token], CURLOPT_TIMEOUT=>10]);
$righe = json_decode((string) curl_exec($ch), true);
if (!is_array($righe) || !isset($righe[0])) { http_response_code(403); header('Content-Type: application/json'); echo json_encode(['error'=>'questo rapporto non e tuo']); exit; }
$r = $righe[0];
if (($r['stato'] ?? '') !== 'ancorata') { http_response_code(409); header('Content-Type: application/json'); echo json_encode(['error'=>'la prova arriva quando il rapporto entra nel blocco']); exit; }

$digest = hex2bin((string) $r['impronta']);
$ric = json_decode((string) json_encode($r['ricevute']), true) ?: [];
$risposte = [];
foreach (($ric['risposte'] ?? $ric) as $x) {
    if (!empty($x['ok']) && !empty($x['b64'])) {
        $b = base64_decode((string) $x['b64'], true);
        if (is_string($b) && $b !== '') { $risposte[] = $b; }
    }
}
$upgrades = $ric['upgrades'] ?? [];
$ots = tm_ots_file($digest, $risposte, is_array($upgrades) ? $upgrades : []);
if ($ots === null || $ots === '') { http_response_code(503); header('Content-Type: application/json'); echo json_encode(['error'=>'la prova non si ricostruisce: riprova al prossimo giro del firmatario']); exit; }

header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="rapporto-' . preg_replace('/[^0-9-]/','', (string)$r['periodo']) . '-' . substr((string)$r['impronta'], 0, 8) . '.ots"');
header('Content-Length: ' . strlen($ots));
header('X-Content-Type-Options: nosniff');
echo $ots;
