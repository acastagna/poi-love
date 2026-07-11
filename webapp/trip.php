<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Landing SEO/GEO/AIO di un ITINERARIO pubblico (trips visibility='pub'). JSON-LD TouristTrip +
 * itinerary ItemList, tappe crawlabili, hreflang it/sq/en, FAQ dai dati. Mantiene ?img=1 che serve
 * la cover come immagine vera (anche da data-URL) per l'anteprima OpenGraph. Solo dati pubblici (RLS).
 */
require __DIR__ . '/seo_lib.php';

$id   = preg_replace('/[^A-Za-z0-9\-]/', '', isset($_GET['id']) ? $_GET['id'] : '');
$lang = seo_lang();

$rows = $id ? seo_get('trips?id=eq.' . rawurlencode($id) . '&visibility=eq.pub'
  . '&select=id,name,description,cover_url,badge,badge_official,badge_essential,start_date,end_date,updated_at,'
  . 'trip_stops(name,stop_date_label,sort_order,lat,lng,note,region,poi_id)') : array();
$trip = count($rows) ? $rows[0] : null;
$isPublic = ($trip !== null);

// ── Proxy immagine cover (per OpenGraph, anche da data-URL) ─────────────────────
if (isset($_GET['img'])) {
  if ($trip && !empty($trip['cover_url'])) {
    $cov = $trip['cover_url'];
    if (preg_match('#^data:(image/[a-zA-Z0-9.+\-]+);base64,(.*)$#s', $cov, $mm)) {
      header('Content-Type: ' . $mm[1]); header('Cache-Control: public, max-age=86400');
      echo base64_decode($mm[2]); exit;
    }
    if (preg_match('#^https?://#', $cov)) { header('Location: ' . $cov, true, 302); exit; }
  }
  header('Location: ' . SEO_OG_FALLBACK, true, 302); exit;
}

$T = array(
  'it' => array('kick'=>'Itinerario su POI•LOVE','places'=>'luoghi','stops_title'=>'Le tappe','faq'=>'Domande frequenti','updated'=>'Aggiornato il','cta'=>'Entra in POI•LOVE','foot'=>'La mappa comunitaria dei luoghi amati','home'=>'Home','trips'=>'Itinerari','notfound'=>'Itinerario non trovato','notfound_sub'=>'Questo itinerario non è pubblico o non esiste più. Scopri gli altri itinerari.','dates'=>'Date'),
  'sq' => array('kick'=>'Udhëtim në POI•LOVE','places'=>'vende','stops_title'=>'Ndalesat','faq'=>'Pyetje të shpeshta','updated'=>'Përditësuar më','cta'=>'Hyr në POI•LOVE','foot'=>'Harta e komunitetit e vendeve të dashura','home'=>'Home','trips'=>'Udhëtimet','notfound'=>'Udhëtimi nuk u gjet','notfound_sub'=>'Ky udhëtim nuk është publik ose nuk ekziston më. Zbulo udhëtimet e tjera.','dates'=>'Datat'),
  'en' => array('kick'=>'Trip on POI•LOVE','places'=>'places','stops_title'=>'The stops','faq'=>'Frequently asked questions','updated'=>'Updated on','cta'=>'Enter POI•LOVE','foot'=>'The community map of beloved places','home'=>'Home','trips'=>'Trips','notfound'=>'Trip not found','notfound_sub'=>'This trip is not public or no longer exists. Discover other trips.','dates'=>'Dates'),
);
$L = $T[$lang];

$stops = ($trip && !empty($trip['trip_stops']) && is_array($trip['trip_stops'])) ? $trip['trip_stops'] : array();
usort($stops, function ($a, $b) { return intval(isset($a['sort_order'])?$a['sort_order']:0) - intval(isset($b['sort_order'])?$b['sort_order']:0); });
$stops = array_values(array_filter($stops, function ($s) { return !empty($s['name']); }));
$nStops = count($stops);

function _d($x) { if (!$x) return ''; $p = explode('-', substr($x, 0, 10)); return count($p) === 3 ? ($p[2].'/'.$p[1].'/'.$p[0]) : $x; }
$dFrom = $trip ? _d($trip['start_date']) : ''; $dTo = $trip ? _d($trip['end_date']) : '';
$dateRange = $dFrom ? ($dFrom . (($dTo && $dTo !== $dFrom) ? (' → ' . $dTo) : '')) : '';

$name = $trip ? $trip['name'] : ($lang==='it'?'Itinerario su POI•LOVE':($lang==='sq'?'Udhëtim në POI•LOVE':'Trip on POI•LOVE'));
$descRaw = ($trip && !empty($trip['description'])) ? $trip['description'] : '';

$titleFb = array(
  'it' => $name . ': itinerario (' . $nStops . ' luoghi) · POI•LOVE',
  'sq' => $name . ': udhëtim (' . $nStops . ' vende) · POI•LOVE',
  'en' => $name . ': trip (' . $nStops . ' places) · POI•LOVE',
);
$title = $titleFb[$lang];

$descFb = array(
  'it' => $descRaw !== '' ? $descRaw : ('Un itinerario di ' . $nStops . ' luoghi su POI•LOVE' . ($dateRange?(', '.$dateRange):'') . '. Entra e scoprilo.'),
  'sq' => $descRaw !== '' ? $descRaw : ('Një udhëtim me ' . $nStops . ' vende në POI•LOVE' . ($dateRange?(', '.$dateRange):'') . '. Hyr dhe zbuloje.'),
  'en' => $descRaw !== '' ? $descRaw : ('A trip of ' . $nStops . ' places on POI•LOVE' . ($dateRange?(', '.$dateRange):'') . '. Enter and discover it.'),
);
$desc = trim(preg_replace('/\s+/', ' ', $descFb[$lang]));
if (mb_strlen($desc) > 300) $desc = mb_substr($desc, 0, 297) . '…';

$ogimg = ($trip && !empty($trip['cover_url']))
  ? (SEO_BASE . '/trip.php?id=' . rawurlencode($id) . '&img=1')
  : SEO_OG_FALLBACK;

$path = '/trip.php'; $params = array('id'=>$id);
$canonical = SEO_BASE . $path . '?' . http_build_query(array('id'=>$id,'lang'=>$lang));
$appUrl = SEO_BASE . '/?trip=' . rawurlencode($id);

// FAQ
$faq = array();
if ($trip) {
  $firstFew = array(); foreach (array_slice($stops,0,3) as $s) $firstFew[] = $s['name'];
  $firstFewTxt = implode(', ', $firstFew);
  if ($lang === 'it') {
    $faq[] = array('q'=>"Cosa include l'itinerario $name?", 'a'=>"$name raccoglie $nStops luoghi" . ($firstFewTxt?": $firstFewTxt…":'') . ".");
    if ($dateRange) $faq[] = array('q'=>"Quando si svolge $name?", 'a'=>"Dal $dFrom" . ($dTo && $dTo!==$dFrom ? " al $dTo." : "."));
    else $faq[] = array('q'=>"Quanto dura $name?", 'a'=>"Puoi seguirlo al tuo ritmo: sono $nStops tappe.");
    $faq[] = array('q'=>"Chi ha creato l'itinerario $name?", 'a'=>"È un itinerario pubblico della community POI•LOVE" . (!empty($trip['updated_at'])?", aggiornato il " . date('d/m/Y', strtotime($trip['updated_at'])) . "." : "."));
  } elseif ($lang === 'sq') {
    $faq[] = array('q'=>"Çfarë përfshin udhëtimi $name?", 'a'=>"$name mbledh $nStops vende" . ($firstFewTxt?": $firstFewTxt…":'') . ".");
    if ($dateRange) $faq[] = array('q'=>"Kur zhvillohet $name?", 'a'=>"Nga $dFrom" . ($dTo && $dTo!==$dFrom ? " deri më $dTo." : "."));
    else $faq[] = array('q'=>"Sa zgjat $name?", 'a'=>"Mund ta ndjekësh me ritmin tënd: janë $nStops ndalesa.");
    $faq[] = array('q'=>"Kush e krijoi udhëtimin $name?", 'a'=>"Është një udhëtim publik i komunitetit POI•LOVE.");
  } else {
    $faq[] = array('q'=>"What does the $name trip include?", 'a'=>"$name gathers $nStops places" . ($firstFewTxt?": $firstFewTxt…":'') . ".");
    if ($dateRange) $faq[] = array('q'=>"When does $name take place?", 'a'=>"From $dFrom" . ($dTo && $dTo!==$dFrom ? " to $dTo." : "."));
    else $faq[] = array('q'=>"How long is $name?", 'a'=>"You can follow it at your own pace: $nStops stops.");
    $faq[] = array('q'=>"Who created the $name trip?", 'a'=>"It's a public trip from the POI•LOVE community.");
  }
}

// JSON-LD
$graph = seo_org_nodes();
$graph[] = seo_breadcrumb(array(
  array('name'=>$L['home'], 'url'=>SEO_BASE . '/?lang=' . $lang),
  array('name'=>$L['trips'], 'url'=>SEO_BASE . '/esplora.php?type=trips&lang=' . $lang),
  array('name'=>$name),
));
if ($trip) {
  $items = array(); $pos = 0;
  foreach ($stops as $s) {
    $pos++;
    if (!empty($s['poi_id'])) {
      $item = array('@type'=>'TouristAttraction', '@id'=>SEO_BASE . '/poi.php?id=' . $s['poi_id'] . '&lang=' . $lang . '#place', 'name'=>$s['name']);
    } else {
      $item = array('@type'=>'TouristAttraction', 'name'=>$s['name']);
      if ($s['lat'] !== null && $s['lng'] !== null) $item['geo'] = array('@type'=>'GeoCoordinates','latitude'=>(float)$s['lat'],'longitude'=>(float)$s['lng']);
      if (!empty($s['note'])) $item['description'] = $s['note'];
    }
    $items[] = array('@type'=>'ListItem', 'position'=>$pos, 'item'=>$item);
  }
  $tn = array(
    '@type'=>'TouristTrip', '@id'=>$canonical . '#trip',
    'name'=>$name, 'url'=>$canonical,
    'provider'=>array('@id'=>SEO_BASE . '/#org'),
    'isPartOf'=>array('@id'=>SEO_BASE . '/#website'),
    'itinerary'=>array('@type'=>'ItemList', 'numberOfItems'=>count($items), 'itemListElement'=>$items),
  );
  if ($descRaw !== '') $tn['description'] = trim(preg_replace('/\s+/', ' ', strip_tags($descRaw)));
  if (!empty($trip['cover_url'])) $tn['image'] = $ogimg;
  if (!empty($trip['start_date'])) $tn['startDate'] = date('Y-m-d', strtotime($trip['start_date']));
  if (!empty($trip['end_date']))   $tn['endDate']   = date('Y-m-d', strtotime($trip['end_date']));
  if (!empty($trip['badge_official'])) $tn['award'] = 'Itinerario ufficiale POI•LOVE';
  if (!empty($trip['updated_at'])) $tn['dateModified'] = gmdate('c', strtotime($trip['updated_at']));
  $graph[] = $tn;
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
    <span class="sep">›</span><a href="<?php echo e(SEO_BASE . '/esplora.php?type=trips&lang=' . $lang); ?>"><?php echo e($L['trips']); ?></a>
    <span class="sep">›</span><span><?php echo e($name); ?></span>
  </nav>

  <article class="card">
    <img class="cover" src="<?php echo e($ogimg); ?>" alt="<?php echo e($name); ?>" onerror="this.style.display='none'" width="1200" height="675">
    <div class="pad">
      <div class="kick"><?php echo e($isPublic ? $L['kick'] : $L['notfound']); ?></div>
      <h1><?php echo e($name); ?></h1>
      <?php if (!$isPublic): ?>
        <p class="lead"><?php echo e($L['notfound_sub']); ?></p>
        <a class="cta" href="<?php echo e(SEO_BASE . '/esplora.php?type=trips&lang=' . $lang); ?>"><?php echo e($L['cta']); ?></a>
      <?php else: ?>
        <p class="lead"><?php echo e($name . ' · ' . $nStops . ' ' . $L['places'] . ($dateRange ? (' · ' . $dateRange) : '')); ?></p>
        <?php if ($descRaw !== ''): ?><p class="desc"><?php echo nl2br(e($descRaw)); ?></p><?php endif; ?>
        <div class="chips">
          <?php if ($dateRange): ?><span class="chip gold">📅 <?php echo e($dateRange); ?></span><?php endif; ?>
          <span class="chip">📍 <?php echo $nStops; ?> <?php echo e($L['places']); ?></span>
        </div>

        <a class="cta" href="<?php echo e($appUrl); ?>"><?php echo e($L['cta']); ?></a>

        <?php if ($nStops): ?>
        <h2><?php echo e($L['stops_title']); ?> · <?php echo $nStops; ?></h2>
        <ol class="stops-ol">
          <?php $i=0; foreach ($stops as $s): $i++; ?>
          <li>
            <span class="n"><?php echo $i; ?></span>
            <span>
              <span class="snm"><?php echo e($s['name']); ?></span>
              <?php if (!empty($s['stop_date_label'])): ?><span class="ssub"><?php echo e(_d($s['stop_date_label'])); ?></span><?php endif; ?>
              <?php if (!empty($s['note'])): ?><span class="ssub"><?php echo e($s['note']); ?></span><?php endif; ?>
            </span>
          </li>
          <?php endforeach; ?>
        </ol>
        <?php endif; ?>

        <?php if (!empty($trip['updated_at'])): ?><p class="foot" style="text-align:left"><?php echo e($L['updated'] . ' ' . date('d/m/Y', strtotime($trip['updated_at']))); ?></p><?php endif; ?>
        <?php echo seo_faq_html($L['faq'], $faq); ?>
      <?php endif; ?>
    </div>
  </article>

  <?php echo seo_langbar($path, $params, $lang); ?>
  <p class="foot"><a href="<?php echo e(SEO_BASE . '/?lang=' . $lang); ?>">POI•LOVE</a> · <?php echo e($L['foot']); ?></p>
</div>
</body></html>
