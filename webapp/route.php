<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Pagina di condivisione di una ROTTA STORICA pubblicata con OpenGraph (template og_templates
 * entity_type='route'). Serve solo rotte is_historic=true & is_published=true (RLS via anon).
 */
$id   = preg_replace('/[^A-Za-z0-9\-]/', '', isset($_GET['id']) ? $_GET['id'] : '');
$SUPA = 'https://ptppxwlafswfhbueakjt.supabase.co';
$ANON = 'sb_publishable_PC1xQ8XiQK9jpzwsAlFLxw_E-PKN40V';

function supa_get($SUPA, $ANON, $path) {
  $ch = curl_init($SUPA . '/rest/v1/' . $path);
  curl_setopt_array($ch, array(CURLOPT_RETURNTRANSFER=>true,
    CURLOPT_HTTPHEADER=>array('apikey: '.$ANON,'Authorization: Bearer '.$ANON), CURLOPT_TIMEOUT=>6));
  $res = curl_exec($ch); curl_close($ch);
  $arr = json_decode($res, true); return is_array($arr) ? $arr : array();
}

$rows = $id ? supa_get($SUPA, $ANON,
  'trips?id=eq.'.rawurlencode($id).'&is_historic=eq.true&is_published=eq.true'
  .'&select=name,description,cover_url,badge,badge_official,badge_essential,trip_stops(name,sort_order)') : array();
$r = count($rows) ? $rows[0] : null;

$stopRows = ($r && isset($r['trip_stops']) && is_array($r['trip_stops'])) ? $r['trip_stops'] : array();
usort($stopRows, function($a,$b){ return intval(isset($a['sort_order'])?$a['sort_order']:0)-intval(isset($b['sort_order'])?$b['sort_order']:0); });
$nStops = 0; foreach ($stopRows as $s) { if (!empty($s['name'])) $nStops++; }

$tpls = supa_get($SUPA, $ANON, "og_templates?entity_type=eq.route&lang=eq.it&active=eq.true&select=title_tpl,desc_tpl,image_url&limit=1");
$tpl  = count($tpls) ? $tpls[0] : null;

$name = $r ? $r['name'] : 'Rotta storica su POI•LOVE';
$descRaw = ($r && !empty($r['description'])) ? $r['description'] : '';
function apply_tpl($t,$v){ foreach($v as $k=>$val){ $t=str_replace('{'.$k.'}',$val,$t); } return trim($t); }
$vars = array('name'=>$name,'desc'=>$descRaw,'area'=>($r&&!empty($r['badge'])?$r['badge']:''),'stops'=>$nStops);
$title = $tpl ? apply_tpl($tpl['title_tpl'],$vars) : ($name.' · POI•LOVE');
$ogExtra = $nStops ? ($nStops.' tappe') : '';
$desc  = $tpl ? apply_tpl($tpl['desc_tpl'],$vars) : ($descRaw!=='' ? ($descRaw.($ogExtra?("\n".$ogExtra):'')) : ('Una rotta storica di '.$nStops.' tappe su POI•LOVE. Percorri la storia.'));
if ($desc==='') $desc = 'Una rotta storica su POI•LOVE. Percorri la storia.';
$ogimg = ($r && !empty($r['cover_url'])) ? $r['cover_url'] : ($tpl && !empty($tpl['image_url']) ? $tpl['image_url'] : 'https://poilove.com/img/opengraph.jpg');
$appUrl = 'https://poilove.com/?route=' . rawurlencode($id);
function e($s){ return htmlspecialchars($s===null?'':$s,ENT_QUOTES,'UTF-8'); }
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
  .cover{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:linear-gradient(135deg,#B4823C,#7C3AED)}
  .body{padding:22px}
  .kick{font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#B4823C;margin-bottom:8px}
  h1{font-size:24px;font-weight:900;line-height:1.15;margin-bottom:10px}
  p{font-size:15px;line-height:1.5;color:#5f574a;margin-bottom:14px}
  .badges{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
  .b{font-size:11px;font-weight:800;color:#fff;border-radius:20px;padding:4px 11px}
  .b.off{background:#B4823C}.b.ess{background:#7C3AED}.b.st{background:#285EA7}
  .cta{display:block;text-align:center;background:#D42B2B;color:#fff;text-decoration:none;font-weight:800;font-size:16px;padding:15px;border-radius:14px}
  .foot{text-align:center;font-size:12px;color:#8a8172;margin-top:14px}
</style>
</head><body>
  <div class="card">
    <img class="cover" src="<?php echo e($ogimg); ?>" alt="" onerror="this.style.display='none'">
    <div class="body">
      <div class="kick">Rotta storica su POI•LOVE</div>
      <h1><?php echo e($name); ?></h1>
      <div class="badges">
        <?php if ($r && !empty($r['badge_official'])): ?><span class="b off">Ufficiale</span><?php endif; ?>
        <?php if ($r && !empty($r['badge_essential'])): ?><span class="b ess">Indispensabile</span><?php endif; ?>
        <?php if ($nStops): ?><span class="b st"><?php echo $nStops; ?> tappe</span><?php endif; ?>
      </div>
      <?php if ($descRaw !== ''): ?><p><?php echo nl2br(e($descRaw)); ?></p><?php endif; ?>
      <a class="cta" href="<?php echo e($appUrl); ?>">Entra in POI•LOVE</a>
      <div class="foot">La mappa comunitaria dei luoghi amati</div>
    </div>
  </div>
</body></html>
