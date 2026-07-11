<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Landing SEO/GEO/AIO di una ROTTA STORICA pubblicata (trips is_historic+is_published). JSON-LD
 * TouristTrip + itinerary ItemList di TouristAttraction, tappe crawlabili, badge reali, hreflang
 * it/sq/en, FAQ dai dati. Server-rendered, solo contenuti pubblici (RLS via anon).
 */
require __DIR__ . '/seo_lib.php';

$id   = preg_replace('/[^A-Za-z0-9\-]/', '', isset($_GET['id']) ? $_GET['id'] : '');
$lang = seo_lang();

$rows = $id ? seo_get('trips?id=eq.' . rawurlencode($id) . '&is_historic=eq.true&is_published=eq.true'
  . '&select=id,name,description,cover_url,badge,badge_official,badge_essential,start_date,end_date,updated_at,'
  . 'trip_stops(name,lat,lng,sort_order,note,region,poi_id)') : array();
$r = count($rows) ? $rows[0] : null;
$isPublic = ($r !== null);

$T = array(
  'it' => array('kick'=>'Rotta storica su POI•LOVE','official'=>'Ufficiale','essential'=>'Indispensabile','stops'=>'tappe','stops_title'=>'Le tappe','faq'=>'Domande frequenti','updated'=>'Aggiornato il','cta'=>'Entra in POI•LOVE','foot'=>'La mappa comunitaria dei luoghi amati','home'=>'Home','routes'=>'Rotte','notfound'=>'Rotta non trovata','notfound_sub'=>'Questa rotta non è pubblicata o non esiste più. Scopri le altre rotte storiche.'),
  'sq' => array('kick'=>'Rrugë historike në POI•LOVE','official'=>'Zyrtare','essential'=>'E domosdoshme','stops'=>'ndalesa','stops_title'=>'Ndalesat','faq'=>'Pyetje të shpeshta','updated'=>'Përditësuar më','cta'=>'Hyr në POI•LOVE','foot'=>'Harta e komunitetit e vendeve të dashura','home'=>'Home','routes'=>'Rrugët','notfound'=>'Rruga nuk u gjet','notfound_sub'=>'Kjo rrugë nuk është publike ose nuk ekziston më. Zbulo rrugët e tjera historike.'),
  'en' => array('kick'=>'Historic route on POI•LOVE','official'=>'Official','essential'=>'Essential','stops'=>'stops','stops_title'=>'The stops','faq'=>'Frequently asked questions','updated'=>'Updated on','cta'=>'Enter POI•LOVE','foot'=>'The community map of beloved places','home'=>'Home','routes'=>'Routes','notfound'=>'Route not found','notfound_sub'=>'This route is not published or no longer exists. Discover other historic routes.'),
);
$L = $T[$lang];

// Tappe ordinate
$stops = ($r && !empty($r['trip_stops']) && is_array($r['trip_stops'])) ? $r['trip_stops'] : array();
usort($stops, function ($a, $b) { return intval(isset($a['sort_order'])?$a['sort_order']:0) - intval(isset($b['sort_order'])?$b['sort_order']:0); });
$stops = array_values(array_filter($stops, function ($s) { return !empty($s['name']); }));
$nStops = count($stops);
$firstStop = $nStops ? $stops[0]['name'] : '';
$lastStop  = $nStops ? $stops[$nStops-1]['name'] : '';
$area = ($r && !empty($r['badge'])) ? $r['badge'] : '';

// Titolo/descrizione
$tpls = seo_get("og_templates?entity_type=eq.route&lang=eq." . $lang . "&active=eq.true&select=title_tpl,desc_tpl,image_url&limit=1");
$tpl  = count($tpls) ? $tpls[0] : null;
$name = $r ? $r['name'] : ($lang==='it'?'Rotta storica su POI•LOVE':($lang==='sq'?'Rrugë historike në POI•LOVE':'Historic route on POI•LOVE'));
$descRaw = ($r && !empty($r['description'])) ? $r['description'] : '';

function apply_tpl($t, $vars) { foreach ($vars as $k=>$v) { $t = str_replace('{'.$k.'}', $v, $t); } return trim($t); }
$vars = array('name'=>$name,'desc'=>$descRaw,'area'=>$area,'city'=>$area,'stops'=>$nStops,'count'=>$nStops,'category'=>'');

$titleFb = array(
  'it' => $name . ($area ? (' · ' . $area) : '') . ' (' . $nStops . ' tappe) · POI•LOVE',
  'sq' => $name . ($area ? (' · ' . $area) : '') . ' (' . $nStops . ' ndalesa) · POI•LOVE',
  'en' => $name . ($area ? (' · ' . $area) : '') . ' (' . $nStops . ' stops) · POI•LOVE',
);
$title = ($tpl && !empty($tpl['title_tpl'])) ? apply_tpl($tpl['title_tpl'], $vars) : $titleFb[$lang];

$descFb = array(
  'it' => $descRaw !== '' ? $descRaw : ('Una rotta storica di ' . $nStops . ' tappe su POI•LOVE' . ($area?(', '.$area):'') . '. Percorri la storia, tappa dopo tappa.'),
  'sq' => $descRaw !== '' ? $descRaw : ('Një rrugë historike me ' . $nStops . ' ndalesa në POI•LOVE' . ($area?(', '.$area):'') . '. Ndiq historinë, ndalesë pas ndalese.'),
  'en' => $descRaw !== '' ? $descRaw : ('A historic route of ' . $nStops . ' stops on POI•LOVE' . ($area?(', '.$area):'') . '. Walk through history, stop by stop.'),
);
$desc = ($tpl && !empty($tpl['desc_tpl'])) ? apply_tpl($tpl['desc_tpl'], $vars) : $descFb[$lang];
$desc = trim(preg_replace('/\s+/', ' ', $desc));
if (mb_strlen($desc) > 300) $desc = mb_substr($desc, 0, 297) . '…';

$ogimg = ($r && !empty($r['cover_url'])) ? seo_abs($r['cover_url']) : ($tpl && !empty($tpl['image_url']) ? $tpl['image_url'] : SEO_OG_FALLBACK);

$path = '/route.php'; $params = array('id'=>$id);
$canonical = SEO_BASE . $path . '?' . http_build_query(array('id'=>$id,'lang'=>$lang));
$appUrl = SEO_BASE . '/?route=' . rawurlencode($id);

// FAQ dai dati reali
$faq = array();
if ($r) {
  $firstFew = array(); foreach (array_slice($stops,0,4) as $s) $firstFew[] = $s['name'];
  $firstFewTxt = implode(', ', $firstFew);
  if ($lang === 'it') {
    $faq[] = array('q'=>"Quante tappe ha la rotta $name?", 'a'=>"La rotta $name ha $nStops tappe" . ($firstFewTxt?": $firstFewTxt…":'') . ($area?" ($area).":"."));
    if ($firstStop) $faq[] = array('q'=>"Da dove parte e dove arriva $name?", 'a'=>"Parte da $firstStop e termina a $lastStop.");
    $faq[] = array('q'=>"Perché seguire la rotta $name?", 'a'=>($descRaw!==''?mb_substr($descRaw,0,180):"È una rotta storica della community POI•LOVE.") . (!empty($r['badge_official'])?" È una rotta ufficiale POI•LOVE.":''));
  } elseif ($lang === 'sq') {
    $faq[] = array('q'=>"Sa ndalesa ka rruga $name?", 'a'=>"Rruga $name ka $nStops ndalesa" . ($firstFewTxt?": $firstFewTxt…":'') . ".");
    if ($firstStop) $faq[] = array('q'=>"Nga nis dhe ku mbaron $name?", 'a'=>"Nis nga $firstStop dhe mbaron te $lastStop.");
    $faq[] = array('q'=>"Pse të ndjekësh rrugën $name?", 'a'=>($descRaw!==''?mb_substr($descRaw,0,180):"Është një rrugë historike e komunitetit POI•LOVE.") . (!empty($r['badge_official'])?" Është rrugë zyrtare POI•LOVE.":''));
  } else {
    $faq[] = array('q'=>"How many stops does the $name route have?", 'a'=>"The $name route has $nStops stops" . ($firstFewTxt?": $firstFewTxt…":'') . ".");
    if ($firstStop) $faq[] = array('q'=>"Where does $name start and end?", 'a'=>"It starts at $firstStop and ends at $lastStop.");
    $faq[] = array('q'=>"Why follow the $name route?", 'a'=>($descRaw!==''?mb_substr($descRaw,0,180):"It's a historic route from the POI•LOVE community.") . (!empty($r['badge_official'])?" It's an official POI•LOVE route.":''));
  }
}

// JSON-LD @graph
$graph = seo_org_nodes();
$graph[] = seo_breadcrumb(array(
  array('name'=>$L['home'], 'url'=>SEO_BASE . '/?lang=' . $lang),
  array('name'=>$L['routes'], 'url'=>SEO_BASE . '/esplora.php?type=routes&lang=' . $lang),
  array('name'=>$name),
));
if ($r) {
  $items = array(); $pos = 0;
  foreach ($stops as $s) {
    $pos++;
    if (!empty($s['poi_id'])) {
      $item = array('@type'=>'TouristAttraction', '@id'=>SEO_BASE . '/poi.php?id=' . $s['poi_id'] . '&lang=' . $lang . '#place', 'name'=>$s['name']);
    } else {
      $item = array('@type'=> !empty($s['region']) ? 'TouristDestination' : 'TouristAttraction', 'name'=>$s['name']);
      if ($s['lat'] !== null && $s['lng'] !== null) $item['geo'] = array('@type'=>'GeoCoordinates','latitude'=>(float)$s['lat'],'longitude'=>(float)$s['lng']);
      if (!empty($s['note'])) $item['description'] = $s['note'];
    }
    $items[] = array('@type'=>'ListItem', 'position'=>$pos, 'item'=>$item);
  }
  $trip = array(
    '@type'=>'TouristTrip', '@id'=>$canonical . '#trip',
    'name'=>$name, 'url'=>$canonical,
    'provider'=>array('@id'=>SEO_BASE . '/#org'),
    'isPartOf'=>array('@id'=>SEO_BASE . '/#website'),
    'itinerary'=>array('@type'=>'ItemList', 'numberOfItems'=>count($items), 'itemListElement'=>$items),
  );
  if ($descRaw !== '') $trip['description'] = trim(preg_replace('/\s+/', ' ', strip_tags($descRaw)));
  if ($ogimg) $trip['image'] = $ogimg;
  if (!empty($r['start_date'])) $trip['startDate'] = date('Y-m-d', strtotime($r['start_date']));
  if (!empty($r['end_date']))   $trip['endDate']   = date('Y-m-d', strtotime($r['end_date']));
  if (!empty($r['badge_official'])) $trip['award'] = 'Rotta ufficiale POI•LOVE';
  if (!empty($r['updated_at'])) $trip['dateModified'] = gmdate('c', strtotime($r['updated_at']));
  $graph[] = $trip;
}
$faqNode = seo_faq($faq); if ($faqNode) $graph[] = $faqNode;
?><!doctype html>
<html lang="<?php echo $lang; ?>" dir="ltr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?php echo e($title); ?></title>
<meta name="description" content="<?php echo e($desc); ?>">
<?php echo seo_alternates($path, $params, $lang); ?>
<meta name="robots" content="<?php echo $isPublic ? 'index,follow,max-image-preview:large' : 'noindex,follow'; ?>">
<meta property="og:locale" content="<?php echo seo_locale($lang); ?>">
<meta property="og:locale:alternate" content="it_IT"><meta property="og:locale:alternate" content="sq_AL"><meta property="og:locale:alternate" content="en_US">
<?php echo seo_og($title, $desc, $ogimg, $canonical, 'website'); ?>
<link rel="icon" href="https://poilove.com/img/favicon.svg">
<?php echo seo_jsonld($graph); ?>
<?php echo seo_css(); ?>
</head><body>
<div class="wrap">
  <nav class="bc" aria-label="breadcrumb">
    <a href="<?php echo e(SEO_BASE . '/?lang=' . $lang); ?>"><?php echo e($L['home']); ?></a>
    <span class="sep">›</span><a href="<?php echo e(SEO_BASE . '/esplora.php?type=routes&lang=' . $lang); ?>"><?php echo e($L['routes']); ?></a>
    <span class="sep">›</span><span><?php echo e($name); ?></span>
  </nav>

  <article class="card">
    <img class="cover" src="<?php echo e($ogimg); ?>" alt="<?php echo e($name); ?>" onerror="this.style.display='none'" width="1200" height="675">
    <div class="pad">
      <div class="kick"><?php echo e($isPublic ? $L['kick'] : $L['notfound']); ?></div>
      <h1><?php echo e($name); ?></h1>
      <?php if (!$isPublic): ?>
        <p class="lead"><?php echo e($L['notfound_sub']); ?></p>
        <a class="cta" href="<?php echo e(SEO_BASE . '/esplora.php?type=routes&lang=' . $lang); ?>"><?php echo e($L['cta']); ?></a>
      <?php else: ?>
        <p class="lead"><?php echo e($name . ' · ' . $nStops . ' ' . $L['stops'] . ($area ? (' · ' . $area) : '')); ?></p>
        <div class="chips">
          <?php if (!empty($r['badge_official'])): ?><span class="chip gold">★ <?php echo e($L['official']); ?></span><?php endif; ?>
          <?php if (!empty($r['badge_essential'])): ?><span class="chip purple">◆ <?php echo e($L['essential']); ?></span><?php endif; ?>
          <span class="chip">📍 <?php echo $nStops; ?> <?php echo e($L['stops']); ?></span>
        </div>
        <?php if ($descRaw !== ''): ?><p class="desc"><?php echo nl2br(e($descRaw)); ?></p><?php endif; ?>

        <a class="cta" href="<?php echo e($appUrl); ?>"><?php echo e($L['cta']); ?></a>

        <?php if ($nStops): ?>
        <h2><?php echo e($L['stops_title']); ?> · <?php echo $nStops; ?></h2>
        <ol class="stops-ol">
          <?php $i=0; foreach ($stops as $s): $i++; ?>
          <li>
            <span class="n"><?php echo $i; ?></span>
            <span>
              <span class="snm"><?php echo e($s['name']); ?></span>
              <?php if (!empty($s['region'])): ?><span class="ssub"><?php echo e($s['region']); ?></span><?php endif; ?>
              <?php if (!empty($s['note'])): ?><span class="ssub"><?php echo e($s['note']); ?></span><?php endif; ?>
              <?php if ($s['lat'] !== null && $s['lng'] !== null): ?><span class="ssub"><a href="https://www.openstreetmap.org/?mlat=<?php echo e($s['lat']); ?>&mlon=<?php echo e($s['lng']); ?>#map=16/<?php echo e($s['lat']); ?>/<?php echo e($s['lng']); ?>" rel="nofollow noopener" target="_blank"><?php echo e($s['lat']); ?>, <?php echo e($s['lng']); ?></a></span><?php endif; ?>
            </span>
          </li>
          <?php endforeach; ?>
        </ol>
        <?php endif; ?>

        <?php if (!empty($r['updated_at'])): ?><p class="foot" style="text-align:left"><?php echo e($L['updated'] . ' ' . date('d/m/Y', strtotime($r['updated_at']))); ?></p><?php endif; ?>

        <?php echo seo_faq_html($L['faq'], $faq); ?>
      <?php endif; ?>
    </div>
  </article>

  <?php echo seo_langbar($path, $params, $lang); ?>
  <p class="foot"><a href="<?php echo e(SEO_BASE . '/?lang=' . $lang); ?>">POI•LOVE</a> · <?php echo e($L['foot']); ?></p>
</div>
</body></html>
