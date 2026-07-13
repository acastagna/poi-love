<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * LANDING server-rendered: strumenti di comunicazione costruiti col Landing Builder.
 * Non solo pagine fisse: una landing con Uso=POI/itinerario/rotta viene AUTOCOMPILATA
 * dall'azione di condivisione. Segnaposto: {{titolo}} {{descrizione}} {{foto}}
 * {{mittente}} {{link}}. Il link porta nell'app con &ref=<mittente>: chi entra da lì
 * fa scattare il referral della community (claim_referral al login).
 *
 * URL: /lp.php?s=<slug>[&poi=<uuid>|&trip=<uuid>|&route=<uuid>|&join=<codice>][&ref=<handle>]
 * Uso 'compagnia': &join=<codice> compila {{codice}} e il link porta l'invitato
 * direttamente nel flusso di adesione (?join=CODICE, gestito dall'app al login).
 */
require __DIR__ . '/seo_lib.php';

function lp_404(): void {
  http_response_code(404);
  header('Content-Type: text/html; charset=utf-8');
  echo '<!doctype html><meta charset="utf-8"><title>Non trovata</title><p style="font-family:sans-serif;padding:40px">Pagina non trovata o non pubblicata. <a href="https://poilove.com/">Vai a POI&bull;LOVE</a></p>';
  exit;
}

$slug = isset($_GET['s']) ? strtolower(trim($_GET['s'])) : '';
if ($slug === '' || !preg_match('/^[a-z0-9\-]{2,80}$/', $slug)) { lp_404(); }

$rows = seo_get('landing_pages?slug=eq.' . rawurlencode($slug) . '&published=eq.true&select=html,title,template_for&limit=1');
if (!is_array($rows) || !isset($rows[0]['html']) || $rows[0]['html'] === '') { lp_404(); }
$html = (string) $rows[0]['html'];
$tfor = (string) ($rows[0]['template_for'] ?? 'libera');

/* ── mittente/referral ── */
$ref = isset($_GET['ref']) ? trim($_GET['ref']) : '';
if (!preg_match('/^[A-Za-z0-9_.\-]{1,60}$/', $ref)) { $ref = ''; }

/* ── dati dell'azione (POI / itinerario / rotta) ── */
$uuid = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';
$titolo = ''; $descr = ''; $foto = ''; $link = 'https://poilove.com/'; $codice = '';
if ($tfor === 'compagnia' && isset($_GET['join']) && preg_match('/^[A-Za-z0-9]{4,12}$/', (string) $_GET['join'])) {
  $codice = strtoupper((string) $_GET['join']);
  $link = 'https://poilove.com/?join=' . rawurlencode($codice);
}
if ($tfor === 'poi' && isset($_GET['poi']) && preg_match($uuid, (string) $_GET['poi'])) {
  $pid = (string) $_GET['poi'];
  $p = seo_get('pois?id=eq.' . $pid . '&select=id,title,description,cover_photo,photos&limit=1');
  if (is_array($p) && isset($p[0]['id'])) {
    $titolo = (string) ($p[0]['title'] ?? '');
    $descr  = (string) ($p[0]['description'] ?? '');
    $foto   = (string) ($p[0]['cover_photo'] ?? '');
    if ($foto === '' && !empty($p[0]['photos'][0])) { $foto = (string) $p[0]['photos'][0]; }
    $link   = 'https://poilove.com/?poi=' . $pid;
  }
} elseif (($tfor === 'trip' || $tfor === 'route') && isset($_GET[$tfor]) && preg_match($uuid, (string) $_GET[$tfor])) {
  $tid = (string) $_GET[$tfor];
  $tr = seo_get('trips?id=eq.' . $tid . '&select=id,name,description,cover_url&limit=1');
  if (is_array($tr) && isset($tr[0]['id'])) {
    $titolo = (string) ($tr[0]['name'] ?? '');
    $descr  = (string) ($tr[0]['description'] ?? '');
    $foto   = (string) ($tr[0]['cover_url'] ?? '');
    $link   = 'https://poilove.com/' . ($tfor === 'route' ? 'route' : 'trip') . '/' . $tid;
  }
}
if ($ref !== '') { $link .= (strpos($link, '?') === false ? '?' : '&') . 'ref=' . rawurlencode($ref); }

/* ── sostituzione segnaposto (escape: i valori entrano in HTML) ── */
$e = static fn(string $v): string => htmlspecialchars($v, ENT_QUOTES, 'UTF-8');
$map = [
  '{{titolo}}'      => $e($titolo),
  '{{descrizione}}' => $e($descr),
  '{{foto}}'        => $e($foto),       // usato come src di un modulo immagine
  '{{mittente}}'    => $ref !== '' ? $e('@' . $ref) : 'POI&bull;LOVE', // neutro: la frase intorno cambia lingua da sola
  '{{link}}'        => $e($link),
  '{{codice}}'      => $e($codice),
];
$html = strtr($html, $map);

/* ── OpenGraph per le anteprime social (WhatsApp, Facebook, X) ── */
$ogTitle = $titolo !== '' ? $titolo : (string) ($rows[0]['title'] ?? 'POI•LOVE');
$og = "\n<meta property=\"og:title\" content=\"" . $e($ogTitle) . '">'
    . "\n<meta property=\"og:description\" content=\"" . $e(mb_substr($descr !== '' ? $descr : 'Scopri i luoghi del cuore su POI•LOVE.', 0, 180, 'UTF-8')) . '">'
    . ($foto !== '' ? "\n<meta property=\"og:image\" content=\"" . $e($foto) . '">' : '')
    . "\n<meta property=\"og:type\" content=\"website\">";
$html = preg_replace('/<head>/', '<head>' . $og, $html, 1);

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=120'); // breve: i contenuti dipendono dai parametri
echo $html;
