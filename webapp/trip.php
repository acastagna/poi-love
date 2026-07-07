<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Pagina di condivisione di un itinerario PUBBLICO con OpenGraph: titolo + descrizione + immagine
 * (anche se la cover e' una data-URL: la serviamo come immagine vera con ?img=1). Spiega l'itinerario
 * e invita a entrare in POI•LOVE. Legge solo itinerari visibility='pub' (RLS, mig 060), via anon key.
 */
$id   = preg_replace('/[^A-Za-z0-9\-]/', '', isset($_GET['id']) ? $_GET['id'] : '');
$SUPA = 'https://ptppxwlafswfhbueakjt.supabase.co';
$ANON = 'sb_publishable_PC1xQ8XiQK9jpzwsAlFLxw_E-PKN40V';

function fetch_trip($SUPA, $ANON, $id) {
  if (!$id) return null;
  $u = $SUPA . '/rest/v1/trips?id=eq.' . rawurlencode($id) . '&visibility=eq.pub'
     . '&select=name,description,cover_url,badge,start_date,end_date,trip_stops(name,sort_order)';
  $ch = curl_init($u);
  curl_setopt_array($ch, array(
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => array('apikey: ' . $ANON, 'Authorization: Bearer ' . $ANON),
    CURLOPT_TIMEOUT => 6,
  ));
  $res = curl_exec($ch); curl_close($ch);
  $arr = json_decode($res, true);
  return (is_array($arr) && count($arr)) ? $arr[0] : null;
}

$trip = fetch_trip($SUPA, $ANON, $id);

// ── Modalita' immagine: serve la cover come IMMAGINE VERA (per l'OpenGraph), anche da data-URL ──
if (isset($_GET['img'])) {
  if ($trip && !empty($trip['cover_url'])) {
    $cov = $trip['cover_url'];
    if (preg_match('#^data:(image/[a-zA-Z0-9.+\-]+);base64,(.*)$#s', $cov, $mm)) {
      header('Content-Type: ' . $mm[1]);
      header('Cache-Control: public, max-age=86400');
      echo base64_decode($mm[2]); exit;
    }
    if (preg_match('#^https?://#', $cov)) { header('Location: ' . $cov, true, 302); exit; }
  }
  header('Location: https://poilove.com/img/opengraph.jpg', true, 302); exit;
}

$appUrl  = 'https://poilove.com/?trip=' . rawurlencode($id);
$name    = $trip ? $trip['name'] : 'Itinerario';
$stops   = ($trip && isset($trip['trip_stops'])) ? count($trip['trip_stops']) : 0;
$descRaw = ($trip && !empty($trip['description'])) ? $trip['description'] : '';
$desc    = $descRaw !== '' ? $descRaw : ($stops
             ? ('Un itinerario con ' . $stops . ' tappe su POI•LOVE. Entra e scoprilo.')
             : 'Un itinerario su POI•LOVE, la mappa comunitaria dei luoghi amati. Entra e scoprilo.');
$ogimg   = ($trip && !empty($trip['cover_url']))
             ? ('https://poilove.com/trip.php?id=' . rawurlencode($id) . '&img=1')
             : 'https://poilove.com/img/opengraph.jpg';
function e($s) { return htmlspecialchars($s === null ? '' : $s, ENT_QUOTES, 'UTF-8'); }
?><!doctype html>
<html lang="it"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?php echo e($name); ?> · POI•LOVE</title>
<meta name="description" content="<?php echo e($desc); ?>">
<meta property="og:type" content="website">
<meta property="og:site_name" content="POI•LOVE">
<meta property="og:title" content="<?php echo e($name); ?> · POI•LOVE">
<meta property="og:description" content="<?php echo e($desc); ?>">
<meta property="og:image" content="<?php echo e($ogimg); ?>">
<meta property="og:url" content="<?php echo e($appUrl); ?>">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?php echo e($name); ?> · POI•LOVE">
<meta name="twitter:description" content="<?php echo e($desc); ?>">
<meta name="twitter:image" content="<?php echo e($ogimg); ?>">
<link rel="icon" href="https://poilove.com/img/favicon.svg">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#EAE4D8;color:#241f18;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .card{width:100%;max-width:440px;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 20px 60px rgba(40,30,10,.18)}
  .cover{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:linear-gradient(135deg,#D42B2B,#7C3AED)}
  .body{padding:22px}
  .kick{font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#D42B2B;margin-bottom:8px}
  h1{font-size:24px;font-weight:900;line-height:1.15;margin-bottom:10px}
  p{font-size:15px;line-height:1.5;color:#5f574a;margin-bottom:14px}
  .meta{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:#285EA7;background:#EBF2FC;border-radius:20px;padding:5px 12px;margin-bottom:18px}
  .cta{display:block;text-align:center;background:#D42B2B;color:#fff;text-decoration:none;font-weight:800;font-size:16px;padding:15px;border-radius:14px}
  .foot{text-align:center;font-size:12px;color:#8a8172;margin-top:14px}
</style>
</head><body>
  <div class="card">
    <img class="cover" src="<?php echo e($ogimg); ?>" alt="" onerror="this.style.display='none'">
    <div class="body">
      <div class="kick">Itinerario su POI•LOVE</div>
      <h1><?php echo e($name); ?></h1>
      <p><?php echo e($desc); ?></p>
      <?php if ($stops): ?><div class="meta">📍 <?php echo $stops; ?> tappe</div><?php endif; ?>
      <a class="cta" href="<?php echo e($appUrl); ?>">Entra in POI•LOVE</a>
      <div class="foot">La mappa comunitaria dei luoghi amati</div>
    </div>
  </div>
</body></html>
