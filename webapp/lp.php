<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * LANDING PAGE server-rendered: serve le landing PUBBLICATE costruite col
 * Landing Builder dell'admin (motore unico EvolabBuilder). L'HTML completo è
 * già reso e salvato in landing_pages.html: qui si legge (RLS: solo published)
 * e si consegna. URL: https://poilove.com/lp.php?s=<slug>
 */
require __DIR__ . '/seo_lib.php';

$slug = isset($_GET['s']) ? strtolower(trim($_GET['s'])) : '';
if ($slug === '' || !preg_match('/^[a-z0-9\-]{2,80}$/', $slug)) {
  http_response_code(404);
  header('Content-Type: text/html; charset=utf-8');
  echo '<!doctype html><meta charset="utf-8"><title>Non trovata</title><p style="font-family:sans-serif;padding:40px">Pagina non trovata. <a href="https://poilove.com/">Vai a POI&bull;LOVE</a></p>';
  exit;
}

$rows = seo_get('landing_pages?slug=eq.' . rawurlencode($slug) . '&published=eq.true&select=html,title,updated_at&limit=1');
if (!is_array($rows) || !isset($rows[0]['html']) || $rows[0]['html'] === '') {
  http_response_code(404);
  header('Content-Type: text/html; charset=utf-8');
  echo '<!doctype html><meta charset="utf-8"><title>Non trovata</title><p style="font-family:sans-serif;padding:40px">Pagina non trovata o non pubblicata. <a href="https://poilove.com/">Vai a POI&bull;LOVE</a></p>';
  exit;
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=300'); // 5 minuti: le modifiche arrivano comunque in fretta
echo $rows[0]['html'];
