<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Pagina di condivisione di un POI PUBBLICO con OpenGraph (titolo/descrizione/immagine dai template
 * og_templates configurabili nella Zona Media dell'admin). Serve SOLO POI community (RLS via anon).
 */
$id   = preg_replace('/[^A-Za-z0-9\-]/', '', isset($_GET['id']) ? $_GET['id'] : '');
$SUPA = 'https://ptppxwlafswfhbueakjt.supabase.co';
$ANON = 'sb_publishable_PC1xQ8XiQK9jpzwsAlFLxw_E-PKN40V';

function supa_get($SUPA, $ANON, $path) {
  $ch = curl_init($SUPA . '/rest/v1/' . $path);
  curl_setopt_array($ch, array(
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => array('apikey: ' . $ANON, 'Authorization: Bearer ' . $ANON),
    CURLOPT_TIMEOUT => 6,
  ));
  $res = curl_exec($ch); curl_close($ch);
  $arr = json_decode($res, true);
  return is_array($arr) ? $arr : array();
}

$rows = $id ? supa_get($SUPA, $ANON,
  'pois?id=eq.' . rawurlencode($id) . '&visibility=eq.community&is_approved=eq.true'
  . '&select=title,description,photos,cover_photo,address,city,category') : array();
$poi = count($rows) ? $rows[0] : null;

// Immagine: prima foto reale del POI (o cover), altrimenti l'OG generico
function poi_img($poi) {
  if ($poi) {
    if (!empty($poi['photos']) && is_array($poi['photos']) && !empty($poi['photos'][0])) return $poi['photos'][0];
    if (!empty($poi['cover_photo'])) return $poi['cover_photo'];
  }
  return null;
}
$photo = poi_img($poi);

// Template OG configurabile (entity_type='poi', lingua 'it'); fallback ai default se assente.
$tpls = supa_get($SUPA, $ANON, "og_templates?entity_type=eq.poi&lang=eq.it&active=eq.true&select=title_tpl,desc_tpl,image_url&limit=1");
$tpl  = count($tpls) ? $tpls[0] : null;

$name = $poi ? $poi['title'] : 'Un luogo su POI•LOVE';
$area = $poi ? trim(($poi['city'] ? $poi['city'] : '') . '') : '';
$descRaw = ($poi && !empty($poi['description'])) ? $poi['description'] : '';

function apply_tpl($t, $vars) {
  foreach ($vars as $k => $v) { $t = str_replace('{' . $k . '}', $v, $t); }
  return trim($t);
}
$vars = array('name' => $name, 'desc' => $descRaw, 'area' => $area, 'stops' => '');
$title = $tpl ? apply_tpl($tpl['title_tpl'], $vars) : ($name . ' · POI•LOVE');
$desc  = $tpl ? apply_tpl($tpl['desc_tpl'],  $vars) : ($descRaw !== '' ? $descRaw : 'Un luogo del cuore su POI•LOVE, la mappa comunitaria dei luoghi amati. Entra e scoprilo.');
if ($desc === '') $desc = ($descRaw !== '' ? $descRaw : 'Un luogo su POI•LOVE. Entra e scoprilo.');
$ogimg = $photo ? $photo : ($tpl && !empty($tpl['image_url']) ? $tpl['image_url'] : 'https://poilove.com/img/opengraph.jpg');
$appUrl = 'https://poilove.com/?poi=' . rawurlencode($id);
function e($s) { return htmlspecialchars($s === null ? '' : $s, ENT_QUOTES, 'UTF-8'); }
?><!doctype html>
<html lang="it"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?php echo e($title); ?></title>
<meta name="description" content="<?php echo e($desc); ?>">
<meta property="og:type" content="website">
<meta property="og:site_name" content="POI•LOVE">
<meta property="og:title" content="<?php echo e($title); ?>">
<meta property="og:description" content="<?php echo e($desc); ?>">
<meta property="og:image" content="<?php echo e($ogimg); ?>">
<meta property="og:url" content="<?php echo e($appUrl); ?>">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?php echo e($title); ?>">
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
  .meta{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:#285EA7;background:#EBF2FC;border-radius:20px;padding:5px 12px;margin-bottom:16px}
  .cta{display:block;text-align:center;background:#D42B2B;color:#fff;text-decoration:none;font-weight:800;font-size:16px;padding:15px;border-radius:14px}
  .foot{text-align:center;font-size:12px;color:#8a8172;margin-top:14px}
</style>
</head><body>
  <div class="card">
    <img class="cover" src="<?php echo e($ogimg); ?>" alt="" onerror="this.style.display='none'">
    <div class="body">
      <div class="kick">Luogo su POI•LOVE</div>
      <h1><?php echo e($name); ?></h1>
      <?php if ($descRaw !== ''): ?><p><?php echo nl2br(e($descRaw)); ?></p><?php endif; ?>
      <?php if ($poi && !empty($poi['address'])): ?><div class="meta">📍 <?php echo e($poi['address']); ?></div><?php endif; ?>
      <a class="cta" href="<?php echo e($appUrl); ?>">Entra in POI•LOVE</a>
      <div class="foot">La mappa comunitaria dei luoghi amati</div>
    </div>
  </div>
</body></html>
