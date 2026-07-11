<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * HUB SEO/GEO/AIO: directory server-rendered di TUTTI i luoghi e rotte PUBBLICI, raggruppati per
 * città e categoria, con link interni a ogni scheda (booster di crawl: tutto a 2-3 click) + JSON-LD
 * CollectionPage/ItemList citabile dai motori AI. Filtri ?city= e ?type=routes|trips, ricerca ?q=.
 * Solo contenuti pubblici (RLS via anon). Numeri reali dal DB, mai finti.
 */
require __DIR__ . '/seo_lib.php';

$lang = seo_lang();
$city = isset($_GET['city']) ? trim($_GET['city']) : '';
$type = isset($_GET['type']) ? preg_replace('/[^a-z]/', '', $_GET['type']) : '';
$q    = isset($_GET['q']) ? trim(mb_substr($_GET['q'], 0, 60)) : '';

$T = array(
  'it' => array('h1'=>'Esplora i luoghi amati','h1c'=>'Cosa vedere a','h1r'=>'Rotte storiche','h1t'=>'Itinerari','lede'=>'POI•LOVE raccoglie {N} luoghi pubblici, {R} rotte e {T} itinerari in {K} città, salvati dalla community.','places'=>'luoghi','routes'=>'Rotte storiche','trips'=>'Itinerari','home'=>'Home','explore'=>'Esplora','faq'=>'Domande frequenti','cta'=>'Entra in POI•LOVE','foot'=>'La mappa comunitaria dei luoghi amati','search'=>'Risultati per','empty'=>'Ancora nessun luogo pubblico qui. Torna presto.','all_cities'=>'Tutte le città','stops'=>'tappe'),
  'sq' => array('h1'=>'Zbulo vendet e dashura','h1c'=>'Çfarë të shohësh në','h1r'=>'Rrugë historike','h1t'=>'Udhëtime','lede'=>'POI•LOVE mbledh {N} vende publike, {R} rrugë dhe {T} udhëtime në {K} qytete, të ruajtura nga komuniteti.','places'=>'vende','routes'=>'Rrugë historike','trips'=>'Udhëtime','home'=>'Home','explore'=>'Zbulo','faq'=>'Pyetje të shpeshta','cta'=>'Hyr në POI•LOVE','foot'=>'Harta e komunitetit e vendeve të dashura','search'=>'Rezultate për','empty'=>'Ende asnjë vend publik këtu. Kthehu së shpejti.','all_cities'=>'Të gjitha qytetet','stops'=>'ndalesa'),
  'en' => array('h1'=>'Explore beloved places','h1c'=>'What to see in','h1r'=>'Historic routes','h1t'=>'Trips','lede'=>'POI•LOVE gathers {N} public places, {R} routes and {T} trips across {K} cities, saved by the community.','places'=>'places','routes'=>'Historic routes','trips'=>'Trips','home'=>'Home','explore'=>'Explore','faq'=>'Frequently asked questions','cta'=>'Enter POI•LOVE','foot'=>'The community map of beloved places','search'=>'Results for','empty'=>'No public places here yet. Come back soon.','all_cities'=>'All cities','stops'=>'stops'),
);
$L = $T[$lang];

// ── Dati pubblici ──────────────────────────────────────────────────────────────
$poiQ = 'pois?visibility=eq.community&is_approved=eq.true&removed_at=is.null'
      . '&select=id,title,city,category,cover_photo,photos,love_count&order=love_count.desc&limit=1000';
if ($city !== '') $poiQ .= '&city=eq.' . rawurlencode($city);
// Sanitizzo q dai caratteri riservati ai filtri PostgREST (,()*.:%\) prima di comporre l'or() — difesa in profondità (oltre alla RLS).
$qFilter = trim(preg_replace('/[^\p{L}\p{N} ]/u', ' ', $q));
if ($q !== '' && $qFilter !== '') $poiQ .= '&or=(title.ilike.*' . rawurlencode($qFilter) . '*,city.ilike.*' . rawurlencode($qFilter) . '*,address.ilike.*' . rawurlencode($qFilter) . '*)';
$pois = seo_get($poiQ);
if (seo_upstream_down()) seo_send_503(); // outage Supabase → 503, non un hub finto-vuoto indicizzabile

$routes = seo_get('trips?is_historic=eq.true&is_published=eq.true&select=id,name,badge,badge_official,badge_essential,cover_url,trip_stops(id)&order=updated_at.desc&limit=200');
$trips  = seo_get('trips?is_historic=eq.false&visibility=eq.pub&select=id,name,cover_url,trip_stops(id)&order=updated_at.desc&limit=200');

// Raggruppa POI per città → categoria
$byCity = array();
foreach ($pois as $p) {
  $ct = !empty($p['city']) ? $p['city'] : '—';
  $byCity[$ct][] = $p;
}
uksort($byCity, function ($a, $b) use ($byCity) { return count($byCity[$b]) - count($byCity[$a]); });
$nPlaces = count($pois); $nRoutes = count($routes); $nTrips = count($trips); $nCities = count(array_diff(array_keys($byCity), array('—')));

// ── Head vars ──────────────────────────────────────────────────────────────────
$path = '/esplora.php';
$params = array(); if ($city !== '') $params['city'] = $city; if ($type !== '') $params['type'] = $type; if ($q !== '') $params['q'] = $q;
$canonical = SEO_BASE . $path . '?' . http_build_query(array_merge($params, array('lang'=>$lang)));

if ($city !== '')      $h1 = $L['h1c'] . ' ' . $city;
elseif ($type==='routes') $h1 = $L['h1r'];
elseif ($type==='trips')  $h1 = $L['h1t'];
elseif ($q !== '')     $h1 = $L['search'] . ' “' . $q . '”';
else                   $h1 = $L['h1'];

$title = $h1 . ' · POI•LOVE';
$lede = str_replace(array('{N}','{R}','{T}','{K}'), array($nPlaces,$nRoutes,$nTrips,$nCities), $L['lede']);
$desc = $lede; if (mb_strlen($desc) > 300) $desc = mb_substr($desc,0,297).'…';
$ogimg = SEO_OG_FALLBACK;

// robots: le pagine di ricerca interna (?q=) e quelle senza contenuto reale NON vanno indicizzate (no index bloat / soft-404)
$hasContent = ($type === 'routes') ? (count($routes) > 0) : (($type === 'trips') ? (count($trips) > 0) : ($nPlaces > 0));
$robots = ($q !== '' || !$hasContent) ? 'noindex,follow,max-image-preview:large' : 'index,follow,max-image-preview:large';

// ── JSON-LD: CollectionPage + ItemList dei luoghi ──────────────────────────────
$graph = seo_org_nodes();
$graph[] = seo_breadcrumb(array(
  array('name'=>$L['home'], 'url'=>SEO_BASE . '/?lang=' . $lang),
  array('name'=>$L['explore'] . ($city!==''?(' · '.$city):'')),
));
$graph[] = array('@type'=>'CollectionPage', '@id'=>$canonical . '#page', 'name'=>$h1, 'isPartOf'=>array('@id'=>SEO_BASE . '/#website'), 'inLanguage'=>$lang);
$liEl = array(); $pos = 0;
foreach ($pois as $p) { $pos++; if ($pos > 100) break; $liEl[] = array('@type'=>'ListItem','position'=>$pos,
  'url'=>SEO_BASE . '/poi.php?id=' . rawurlencode($p['id']) . '&lang=' . $lang, 'name'=>$p['title']); }
if (count($liEl)) $graph[] = array('@type'=>'ItemList', '@id'=>$canonical . '#list', 'numberOfItems'=>count($liEl), 'itemListElement'=>$liEl);

$catLabels = seo_cat_labels();
function _catlabel_local($key, $lang, $catLabels) {
  if (isset($catLabels[$key])) { $v = $catLabels[$key]['label_' . $lang]; if (!empty($v)) return $v; if (!empty($catLabels[$key]['label_it'])) return $catLabels[$key]['label_it']; }
  return $key ? ucfirst(str_replace('_',' ',$key)) : '—';
}
?><!doctype html>
<html lang="<?php echo $lang; ?>" dir="ltr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?php echo e($title); ?></title>
<meta name="description" content="<?php echo e($desc); ?>">
<?php echo seo_alternates($path, $params, $lang); ?>
<meta name="robots" content="<?php echo $robots; ?>">
<meta property="og:locale" content="<?php echo seo_locale($lang); ?>">
<?php echo seo_og($title, $desc, $ogimg, $canonical, 'website'); ?>
<link rel="icon" href="https://poilove.com/img/favicon.svg">
<?php echo seo_jsonld($graph); ?>
<?php echo seo_css(); ?>
<style>.hub h2{border-top:1px solid var(--line);padding-top:18px}.catgrp{margin:6px 0 14px}.catgrp h3{font-size:14px;font-weight:800;color:var(--red);margin:12px 0 6px}.linklist{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}.linklist a{font-size:13px;text-decoration:none;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:12px;padding:7px 12px}.linklist a:hover{border-color:var(--red)}.linklist .c{color:var(--muted);font-size:11px}</style>
</head><body>
<div class="wrap hub">
  <nav class="bc" aria-label="breadcrumb">
    <a href="<?php echo e(SEO_BASE . '/?lang=' . $lang); ?>"><?php echo e($L['home']); ?></a>
    <span class="sep">›</span><a href="<?php echo e(SEO_BASE . '/esplora.php?lang=' . $lang); ?>"><?php echo e($L['explore']); ?></a>
    <?php if ($city!==''): ?><span class="sep">›</span><span><?php echo e($city); ?></span><?php endif; ?>
  </nav>

  <h1><?php echo e($h1); ?></h1>
  <p class="lead"><?php echo e($lede); ?></p>
  <a class="cta" href="<?php echo e(SEO_BASE . '/?lang=' . $lang); ?>"><?php echo e($L['cta']); ?></a>

  <?php if ($type !== 'routes' && $type !== 'trips'): ?>
    <?php if (!$nPlaces): ?>
      <p class="desc" style="margin-top:20px"><?php echo e($L['empty']); ?></p>
    <?php else: ?>
      <?php foreach ($byCity as $ctName => $list): ?>
        <h2><?php echo e($ctName === '—' ? $L['all_cities'] : $ctName); ?> · <?php echo count($list); ?></h2>
        <?php
          // sotto-raggruppa per categoria
          $byCat = array();
          foreach ($list as $p) { $k = !empty($p['category']) ? $p['category'] : 'altro'; $byCat[$k][] = $p; }
          foreach ($byCat as $catKey => $items):
        ?>
        <div class="catgrp">
          <h3><?php echo e(_catlabel_local($catKey, $lang, $catLabels)); ?></h3>
          <ul class="linklist">
            <?php foreach ($items as $p): ?>
              <li><a href="<?php echo e(SEO_BASE . '/poi.php?id=' . rawurlencode($p['id']) . '&lang=' . $lang); ?>"><?php echo e($p['title']); ?><?php if ((int)$p['love_count']>0): ?> <span class="c">❤<?php echo (int)$p['love_count']; ?></span><?php endif; ?></a></li>
            <?php endforeach; ?>
          </ul>
        </div>
        <?php endforeach; ?>
      <?php endforeach; ?>
    <?php endif; ?>
  <?php endif; ?>

  <?php if (($type==='' || $type==='routes') && $city==='' && $q==='' && count($routes)): ?>
    <h2><?php echo e($L['routes']); ?> · <?php echo count($routes); ?></h2>
    <ul class="linklist">
      <?php foreach ($routes as $rt): $ns = isset($rt['trip_stops'])?count($rt['trip_stops']):0; ?>
        <li><a href="<?php echo e(SEO_BASE . '/route.php?id=' . rawurlencode($rt['id']) . '&lang=' . $lang); ?>"><?php echo e($rt['name']); ?><?php if(!empty($rt['badge_official'])): ?> <span class="c">★</span><?php endif; ?> <span class="c"><?php echo $ns; ?> <?php echo e($L['stops']); ?></span></a></li>
      <?php endforeach; ?>
    </ul>
  <?php endif; ?>

  <?php if (($type==='' || $type==='trips') && $city==='' && $q==='' && count($trips)): ?>
    <h2><?php echo e($L['trips']); ?> · <?php echo count($trips); ?></h2>
    <ul class="linklist">
      <?php foreach ($trips as $tr): $ns = isset($tr['trip_stops'])?count($tr['trip_stops']):0; ?>
        <li><a href="<?php echo e(SEO_BASE . '/trip.php?id=' . rawurlencode($tr['id']) . '&lang=' . $lang); ?>"><?php echo e($tr['name']); ?> <span class="c"><?php echo $ns; ?> <?php echo e($L['stops']); ?></span></a></li>
      <?php endforeach; ?>
    </ul>
  <?php endif; ?>

  <?php echo seo_langbar($path, $params, $lang); ?>
  <p class="foot"><a href="<?php echo e(SEO_BASE . '/?lang=' . $lang); ?>">POI•LOVE</a> · <?php echo e($L['foot']); ?></p>
</div>
</body></html>
