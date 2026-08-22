<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Landing SEO/GEO/AIO di un LUOGO pubblico (pois community+approvati). Server-rendered: tutto il
 * contenuto è nell'HTML iniziale (crawler e LLM non eseguono JS). JSON-LD @graph, hreflang it/sq/en,
 * geo-meta, FAQ dai dati reali, luoghi vicini. Serve SOLO POI pubblici (RLS via anon) → mai leak.
 * Regola ferrea: si mostra solo ciò che è nel DB e visibile in pagina. Nessun dato finto.
 */
require __DIR__ . '/seo_lib.php';

$id   = preg_replace('/[^A-Za-z0-9\-]/', '', isset($_GET['id']) ? $_GET['id'] : '');
$lang = seo_lang();

$rows = $id ? seo_get('pois?id=eq.' . rawurlencode($id)
  . '&visibility=in.(community,official)&is_approved=eq.true&removed_at=is.null'
  . '&select=id,title,description,photos,cover_photo,address,city,country,lat,lng,category,subcategory,categories,tags,love_count,created_at,updated_at') : array();
$poi = count($rows) ? $rows[0] : null;
$isPublic = ($poi !== null);

// ── Quello che il luogo ha in piu', se ce l'ha ────────────────────────────────
// Recensioni pubblicate, orari e menu del locale, audioguida ufficiale: sono le
// cose che rendono una pagina utile a chi cerca, e che i motori sanno leggere.
$recensioni = array(); $mediaVoti = null;
$locale = null; $orari = array(); $piatti = array(); $guida = null; $creditiFoto = array();
if ($isPublic) {
  $rs = seo_get('recensioni?poi_id=eq.' . rawurlencode($id) . '&stato=eq.pubblicata&select=voto,testo,created_at,autore_id&limit=20');
  if (is_array($rs) && count($rs)) {
    $recensioni = $rs;
    $somma = 0; foreach ($rs as $r) { $somma += (float)$r['voto']; }
    $mediaVoti = round($somma / count($rs), 1);
  }
  $lo = seo_get('locali?poi_id=eq.' . rawurlencode($id) . '&select=telefono,sito,prenotazione_url,pagamenti,categoria_propria,valuta_base');
  if (is_array($lo) && count($lo)) $locale = $lo[0];
  $or = seo_get('locale_orari?poi_id=eq.' . rawurlencode($id) . '&select=giorno,apre,chiude,chiuso,ordine&order=giorno,ordine');
  if (is_array($or)) $orari = $or;
  $pi = seo_get('locale_piatti?poi_id=eq.' . rawurlencode($id) . '&select=nome,descrizione,prezzo,valuta,chef&order=ordine&limit=40');
  if (is_array($pi)) $piatti = $pi;
  $ag = seo_get('audioguide?poi_id=eq.' . rawurlencode($id) . '&lingua=eq.' . $lang . '&select=titolo,testo,url,secondi');
  if (!is_array($ag) || !count($ag)) $ag = seo_get('audioguide?poi_id=eq.' . rawurlencode($id) . '&select=titolo,testo,url,secondi&limit=1');
  if (is_array($ag) && count($ag)) $guida = $ag[0];
  $cf = seo_get('media_assets?poi_id=eq.' . rawurlencode($id) . '&select=autore,licenza,fonte_url,source');
  if (is_array($cf)) { foreach ($cf as $c) { if (!empty($c['source']) && $c['source'] !== 'utente' && !empty($c['autore'])) $creditiFoto[] = $c; } }
}

// Upstream Supabase giù → 503 (Google ritenta senza deindicizzare); 0 righe/4xx → 404 pulito, non soft-404.
if (seo_upstream_down()) seo_send_503();
if (!$isPublic) http_response_code(404);

// ── Etichette UI trilingui ─────────────────────────────────────────────────────
$T = array(
  'it' => array('kick'=>'Luogo su POI•LOVE','addr'=>'Indirizzo','coords'=>'Coordinate','openmap'=>'Apri sulla mappa','directions'=>'Come arrivare','category'=>'Categoria','tags'=>'Tag','hearts'=>'cuori','nearby'=>'Luoghi vicini','faq'=>'Domande frequenti','updated'=>'Aggiornato il','cta'=>'Entra in POI•LOVE','foot'=>'La mappa comunitaria dei luoghi amati','home'=>'Home','notfound'=>'Luogo non trovato','notfound_sub'=>'Questo luogo non è pubblico o non esiste più. Scopri gli altri luoghi amati.','orari'=>'Orari','menu'=>'Menu','chef'=>'Consigli dello Chef','recensioni'=>'Recensioni','ascolta'=>'Audioguida','crediti'=>'Foto di','chiuso'=>'chiuso','paga'=>'Come si paga','telefono'=>'Telefono','su5'=>'su 5'),
  'sq' => array('kick'=>'Vend në POI•LOVE','addr'=>'Adresa','coords'=>'Koordinatat','openmap'=>'Hape në hartë','directions'=>'Si të shkosh','category'=>'Kategoria','tags'=>'Etiketa','hearts'=>'zemra','nearby'=>'Vende afër','faq'=>'Pyetje të shpeshta','updated'=>'Përditësuar më','cta'=>'Hyr në POI•LOVE','foot'=>'Harta e komunitetit e vendeve të dashura','home'=>'Home','notfound'=>'Vendi nuk u gjet','notfound_sub'=>'Ky vend nuk është publik ose nuk ekziston më. Zbulo vendet e tjera të dashura.','orari'=>'Orari','menu'=>'Menu','chef'=>'Këshillat e Chef-it','recensioni'=>'Vlerësime','ascolta'=>'Audioguidë','crediti'=>'Foto nga','chiuso'=>'mbyllur','paga'=>'Si paguhet','telefono'=>'Telefoni','su5'=>'nga 5'),
  'en' => array('kick'=>'Place on POI•LOVE','addr'=>'Address','coords'=>'Coordinates','openmap'=>'Open on the map','directions'=>'Get directions','category'=>'Category','tags'=>'Tags','hearts'=>'hearts','nearby'=>'Nearby places','faq'=>'Frequently asked questions','updated'=>'Updated on','cta'=>'Enter POI•LOVE','foot'=>'The community map of beloved places','home'=>'Home','notfound'=>'Place not found','notfound_sub'=>'This place is not public or no longer exists. Discover other beloved places.','orari'=>'Opening hours','menu'=>'Menu','chef'=>'Chef recommends','recensioni'=>'Reviews','ascolta'=>'Audioguide','crediti'=>'Photo by','chiuso'=>'closed','paga'=>'How to pay','telefono'=>'Phone','su5'=>'out of 5'),
);
$L = $T[$lang];

// ── Titolo/descrizione: og_templates configurabili + fallback localizzato ──────
$tpls = seo_get("og_templates?entity_type=eq.poi&lang=eq." . $lang . "&active=eq.true&select=title_tpl,desc_tpl,image_url&limit=1");
$tpl  = count($tpls) ? $tpls[0] : null;

$name    = $poi ? $poi['title'] : ($lang==='it'?'Un luogo su POI•LOVE':($lang==='sq'?'Një vend në POI•LOVE':'A place on POI•LOVE'));
$city    = ($poi && !empty($poi['city'])) ? $poi['city'] : '';
$country = ($poi && !empty($poi['country'])) ? $poi['country'] : '';
$descRaw = ($poi && !empty($poi['description'])) ? $poi['description'] : '';
$catLabel = ($poi && !empty($poi['category'])) ? seo_cat_label($poi['category'], $lang) : '';

function apply_tpl($t, $vars) { foreach ($vars as $k => $v) { $t = str_replace('{' . $k . '}', $v, $t); } return trim($t); }
$vars = array('name'=>$name, 'city'=>$city, 'category'=>$catLabel, 'desc'=>$descRaw, 'area'=>$city, 'stops'=>'');

// Title pattern (città in evidenza)
$titleFb = array(
  'it' => $name . ($city ? (', ' . $city) : '') . ': foto, mappa e info · POI•LOVE',
  'sq' => $name . ($city ? (', ' . $city) : '') . ': foto, harta dhe info · POI•LOVE',
  'en' => $name . ($city ? (', ' . $city) : '') . ': photos, map & info · POI•LOVE',
);
$title = ($tpl && !empty($tpl['title_tpl'])) ? apply_tpl($tpl['title_tpl'], $vars) : $titleFb[$lang];

$descFb = array(
  'it' => $descRaw !== '' ? $descRaw : ($name . ($city ? (' a ' . $city) : '') . ($catLabel ? (': ' . $catLabel) : '') . ' salvato dalla community POI•LOVE. Foto reali, indirizzo e coordinate.'),
  'sq' => $descRaw !== '' ? $descRaw : ($name . ($city ? (' në ' . $city) : '') . ($catLabel ? (': ' . $catLabel) : '') . ' i ruajtur nga komuniteti POI•LOVE. Foto reale, adresë dhe koordinata.'),
  'en' => $descRaw !== '' ? $descRaw : ($name . ($city ? (' in ' . $city) : '') . ($catLabel ? (': ' . $catLabel) : '') . ' saved by the POI•LOVE community. Real photos, address and coordinates.'),
);
$desc = ($tpl && !empty($tpl['desc_tpl'])) ? apply_tpl($tpl['desc_tpl'], $vars) : $descFb[$lang];
$desc = trim(preg_replace('/\s+/', ' ', $desc));
if (mb_strlen($desc) > 300) $desc = mb_substr($desc, 0, 297) . '…';

// ── Immagine (prima foto reale, poi cover, poi og_templates, poi fallback) ─────
$photos = ($poi && !empty($poi['photos']) && is_array($poi['photos'])) ? array_values(array_filter($poi['photos'])) : array();
$photo  = count($photos) ? $photos[0] : (($poi && !empty($poi['cover_photo'])) ? $poi['cover_photo'] : null);
$ogimg  = $photo ? seo_abs($photo) : ($tpl && !empty($tpl['image_url']) ? $tpl['image_url'] : SEO_OG_FALLBACK);

// ── URL ────────────────────────────────────────────────────────────────────────
$path     = '/poi.php';
$params   = array('id' => $id);
$canonical = SEO_BASE . $path . '?' . http_build_query(array('id'=>$id,'lang'=>$lang));
// Il codice di chi ha condiviso viaggia fino all'app: e' quello che assegna i punti referral.
$refRaw    = isset($_GET['ref']) ? preg_replace('/[^A-Za-z0-9_.-]/', '', (string)$_GET['ref']) : '';
$refQs     = ($refRaw !== '') ? '&ref=' . rawurlencode(substr($refRaw, 0, 40)) : '';
$appUrl    = SEO_BASE . '/?poi=' . rawurlencode($id) . $refQs;
$lat = $poi ? $poi['lat'] : null; $lng = $poi ? $poi['lng'] : null;

// ── Luoghi vicini (stessa area, pubblici) per crawl + contenuto ────────────────
$nearby = array();
if ($poi && $lat !== null && $lng !== null) {
  $dLat = 0.06; $dLng = 0.09;
  $q = 'pois?visibility=in.(community,official)&is_approved=eq.true&removed_at=is.null'
     . '&id=neq.' . rawurlencode($id)
     . '&lat=gte.' . ($lat - $dLat) . '&lat=lte.' . ($lat + $dLat)
     . '&lng=gte.' . ($lng - $dLng) . '&lng=lte.' . ($lng + $dLng)
     . '&select=id,title,city,category,cover_photo,photos,lat,lng&limit=30';
  $cand = seo_get($q);
  foreach ($cand as $c) {
    if ($c['lat'] === null || $c['lng'] === null) continue;
    $c['_km'] = seo_km($lat, $lng, $c['lat'], $c['lng']);
    $nearby[] = $c;
  }
  usort($nearby, function ($a, $b) { return $a['_km'] < $b['_km'] ? -1 : 1; });
  $nearby = array_slice($nearby, 0, 6);
}

// ── FAQ dai dati reali (visibili + JSON-LD) ────────────────────────────────────
$faq = array();
if ($poi) {
  $addrTxt = trim(($poi['address'] ? $poi['address'] : '') . ($city ? (($poi['address'] ? ', ' : '') . $city) : '') . ($country ? (' (' . $country . ')') : ''));
  $hasCoord = ($lat !== null && $lng !== null);       // coordinate solo se presenti (niente "Coordinate: , .")
  if ($lang === 'it') {
    if ($addrTxt) $faq[] = array('q'=>"Dove si trova $name?", 'a'=>"$name si trova in $addrTxt." . ($hasCoord ? " Coordinate: $lat, $lng." : ''));
    if ($catLabel) $faq[] = array('q'=>"Che tipo di luogo è $name?", 'a'=>"È un $catLabel salvato dalla community POI•LOVE.");
    if ((int)$poi['love_count'] > 0) $faq[] = array('q'=>"Quante persone amano $name?", 'a'=>$poi['love_count']." persone hanno segnato $name tra i luoghi amati su POI•LOVE.");
    elseif ($hasCoord) $faq[] = array('q'=>"Come arrivo a $name?", 'a'=>"Apri le indicazioni verso le coordinate $lat, $lng dalla mappa di POI•LOVE.");
  } elseif ($lang === 'sq') {
    if ($addrTxt) $faq[] = array('q'=>"Ku ndodhet $name?", 'a'=>"$name ndodhet në $addrTxt." . ($hasCoord ? " Koordinatat: $lat, $lng." : ''));
    if ($catLabel) $faq[] = array('q'=>"Çfarë lloj vendi është $name?", 'a'=>"Është një $catLabel i ruajtur nga komuniteti POI•LOVE.");
    if ((int)$poi['love_count'] > 0) $faq[] = array('q'=>"Sa persona e duan $name?", 'a'=>$poi['love_count']." persona e kanë shënuar $name mes vendeve të dashura në POI•LOVE.");
    elseif ($hasCoord) $faq[] = array('q'=>"Si shkoj te $name?", 'a'=>"Hap udhëzimet drejt koordinatave $lat, $lng nga harta e POI•LOVE.");
  } else {
    if ($addrTxt) $faq[] = array('q'=>"Where is $name?", 'a'=>"$name is located at $addrTxt." . ($hasCoord ? " Coordinates: $lat, $lng." : ''));
    if ($catLabel) $faq[] = array('q'=>"What kind of place is $name?", 'a'=>"It's a $catLabel saved by the POI•LOVE community.");
    if ((int)$poi['love_count'] > 0) $faq[] = array('q'=>"How many people love $name?", 'a'=>$poi['love_count']." people have marked $name among beloved places on POI•LOVE.");
    elseif ($hasCoord) $faq[] = array('q'=>"How do I get to $name?", 'a'=>"Open directions to coordinates $lat, $lng from the POI•LOVE map.");
  }
}

// ── JSON-LD @graph ─────────────────────────────────────────────────────────────
$graph = seo_org_nodes();
$graph[] = seo_breadcrumb(array(
  array('name'=>$L['home'], 'url'=>SEO_BASE . '/?lang=' . $lang),
  $city ? array('name'=>$city, 'url'=>SEO_BASE . '/esplora.php?city=' . rawurlencode($city) . '&lang=' . $lang) : null,
  array('name'=>$name),
));
if ($poi) {
  $place = array(
    '@type' => seo_poi_types($poi['category'], $poi['subcategory']),
    '@id' => $canonical . '#place',
    'name' => $name,
    'url' => $canonical,
    'isPartOf' => array('@id' => SEO_BASE . '/#website'),
  );
  if ($descRaw !== '') $place['description'] = trim(preg_replace('/\s+/', ' ', strip_tags($descRaw)));
  $imgs = array(); foreach (($photos ?: array($poi['cover_photo'])) as $p) { if ($p) $imgs[] = seo_abs($p); }
  if (count($imgs)) $place['image'] = array_values($imgs);
  $addr = array('@type' => 'PostalAddress');
  if (!empty($poi['address'])) $addr['streetAddress'] = $poi['address'];
  if ($city) $addr['addressLocality'] = $city;
  if ($country) $addr['addressCountry'] = $country;
  if (count($addr) > 1) $place['address'] = $addr;
  if ($lat !== null && $lng !== null) $place['geo'] = array('@type'=>'GeoCoordinates','latitude'=>(float)$lat,'longitude'=>(float)$lng);
  if (!empty($poi['updated_at'])) $place['dateModified'] = gmdate('c', strtotime($poi['updated_at']));
  if ((int)$poi['love_count'] > 0) $place['interactionStatistic'] = array(
    '@type'=>'InteractionCounter', 'interactionType'=>array('@type'=>'LikeAction'), 'userInteractionCount'=>(int)$poi['love_count']);
  // La media dei voti e le recensioni: e' quello che fa comparire le stelline
  // nei risultati di ricerca, e viene dai voti veri, non da un numero inventato.
  if ($mediaVoti !== null && count($recensioni)) {
    $place['aggregateRating'] = array('@type'=>'AggregateRating',
      'ratingValue'=>$mediaVoti, 'reviewCount'=>count($recensioni), 'bestRating'=>5, 'worstRating'=>0);
    $rev = array();
    foreach (array_slice($recensioni, 0, 5) as $r) {
      if (trim((string)$r['testo']) === '') continue;
      $rev[] = array('@type'=>'Review',
        'reviewRating'=>array('@type'=>'Rating','ratingValue'=>(float)$r['voto'],'bestRating'=>5),
        'reviewBody'=>mb_substr(trim($r['testo']), 0, 400),
        'datePublished'=>gmdate('c', strtotime($r['created_at'])));
    }
    if (count($rev)) $place['review'] = $rev;
  }
  // Il locale: orari giorno per giorno, telefono, come si paga, il menu.
  if ($locale || count($orari)) {
    if (!empty($locale['telefono'])) $place['telephone'] = $locale['telefono'];
    if (!empty($locale['sito']))     $place['sameAs'] = array($locale['sito']);
    if (!empty($locale['pagamenti']) && is_array($locale['pagamenti'])) $place['paymentAccepted'] = implode(', ', $locale['pagamenti']);
    if (!empty($locale['prenotazione_url'])) $place['potentialAction'] = array('@type'=>'ReserveAction',
      'target'=>array('@type'=>'EntryPoint','urlTemplate'=>$locale['prenotazione_url']));
    $giorniSchema = array('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday');
    $spec = array();
    foreach ($orari as $o) {
      if (!empty($o['chiuso']) || empty($o['apre']) || empty($o['chiude'])) continue;
      $g = (int)$o['giorno']; if ($g < 0 || $g > 6) continue;
      $spec[] = array('@type'=>'OpeningHoursSpecification', 'dayOfWeek'=>$giorniSchema[$g],
        'opens'=>substr($o['apre'],0,5), 'closes'=>substr($o['chiude'],0,5));
    }
    if (count($spec)) $place['openingHoursSpecification'] = $spec;
    if (count($piatti)) {
      $voci = array();
      foreach ($piatti as $pt) {
        $v = array('@type'=>'MenuItem', 'name'=>$pt['nome']);
        if (!empty($pt['descrizione'])) $v['description'] = mb_substr($pt['descrizione'], 0, 300);
        if ($pt['prezzo'] !== null) $v['offers'] = array('@type'=>'Offer',
          'price'=>(string)(float)$pt['prezzo'], 'priceCurrency'=>($pt['valuta'] ? $pt['valuta'] : 'ALL'));
        $voci[] = $v;
      }
      $place['hasMenu'] = array('@type'=>'Menu', 'hasMenuItem'=>$voci);
    }
  }
  // L'audioguida ufficiale: il copione e' testo vero, e per chi cerca vale piu'
  // di dieci parole chiave.
  if ($guida && !empty($guida['url'])) {
    $place['subjectOf'] = array('@type'=>'AudioObject',
      'name'=>$guida['titolo'], 'contentUrl'=>$guida['url'],
      'encodingFormat'=>'audio/mpeg',
      'duration'=>'PT' . (int)round((float)$guida['secondi']) . 'S',
      'transcript'=>($guida['testo'] ? mb_substr($guida['testo'], 0, 3000) : null));
    if ($place['subjectOf']['transcript'] === null) unset($place['subjectOf']['transcript']);
  }
  $graph[] = $place;
}
$faqNode = seo_faq($faq); if ($faqNode) $graph[] = $faqNode;

// ── Meta OG place-extra + head ─────────────────────────────────────────────────
$geoMeta = ($lat !== null) ? seo_geo_meta($lat, $lng, $city, $country) : '';
$placeOg = ($lat !== null) ? ('<meta property="place:location:latitude" content="' . e($lat) . '">' . "\n"
         . '<meta property="place:location:longitude" content="' . e($lng) . '">' . "\n") : '';
?><!doctype html>
<html lang="<?php echo $lang; ?>" dir="ltr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?php echo e($title); ?></title>
<meta name="description" content="<?php echo e($desc); ?>">
<?php echo seo_alternates($path, $params, $lang); ?>
<meta name="robots" content="<?php echo $isPublic ? 'index,follow,max-image-preview:large' : 'noindex,follow'; ?>">
<?php echo $geoMeta; ?>
<meta property="og:locale" content="<?php echo seo_locale($lang); ?>">
<meta property="og:locale:alternate" content="it_IT"><meta property="og:locale:alternate" content="sq_AL"><meta property="og:locale:alternate" content="en_US">
<?php echo seo_og($title, $desc, seo_http_or($ogimg, SEO_OG_FALLBACK), $canonical, 'place'); ?><?php echo $placeOg; ?>
<link rel="icon" href="https://poilove.com/img/favicon.svg">
<?php echo seo_jsonld($graph); ?>
<?php echo seo_css(); ?>
</head><body>
<div class="wrap">
  <nav class="bc" aria-label="breadcrumb">
    <a href="<?php echo e(SEO_BASE . '/?lang=' . $lang); ?>"><?php echo e($L['home']); ?></a>
    <?php if ($city): ?><span class="sep">›</span><a href="<?php echo e(SEO_BASE . '/esplora.php?city=' . rawurlencode($city) . '&lang=' . $lang); ?>"><?php echo e($city); ?></a><?php endif; ?>
    <span class="sep">›</span><span><?php echo e($name); ?></span>
  </nav>

  <article class="card">
    <img class="cover" src="<?php echo e($ogimg); ?>" alt="<?php echo e($name . ($city ? (', ' . $city) : '')); ?>" onerror="this.style.display='none'" width="1200" height="675">
    <div class="pad">
      <div class="kick"><?php echo e($isPublic ? $L['kick'] : $L['notfound']); ?></div>
      <h1><?php echo e($name); ?></h1>
      <?php if (!$isPublic): ?>
        <p class="lead"><?php echo e($L['notfound_sub']); ?></p>
        <a class="cta" href="<?php echo e(SEO_BASE . '/esplora.php?lang=' . $lang); ?>"><?php echo e($L['cta']); ?></a>
      <?php else: ?>
        <p class="lead"><?php echo e($name . ($catLabel ? (' · ' . $catLabel) : '') . ($city ? (' · ' . $city) : '')); ?></p>
        <?php if ($descRaw !== ''): ?><p class="desc"><?php echo nl2br(e($descRaw)); ?></p><?php endif; ?>

        <div class="chips">
          <?php if ($catLabel): ?><span class="chip cat"><?php echo e($catLabel); ?></span><?php endif; ?>
          <?php if ((int)$poi['love_count'] > 0): ?><span class="chip">❤ <?php echo (int)$poi['love_count']; ?> <?php echo e($L['hearts']); ?></span><?php endif; ?>
          <?php if (!empty($poi['tags']) && is_array($poi['tags'])): foreach (array_slice($poi['tags'],0,6) as $tg): if($tg==='')continue; ?><span class="chip"><?php echo e($tg); ?></span><?php endforeach; endif; ?>
        </div>

        <ul class="facts">
          <?php if (!empty($poi['address']) || $city): ?><li><span class="k"><?php echo e($L['addr']); ?></span><address style="font-style:normal"><?php echo e(trim(($poi['address']?:'') . ($city?(($poi['address']?', ':'').$city):'') . ($country?(' · '.$country):''))); ?></address></li><?php endif; ?>
          <?php if ($lat !== null): ?>
          <li><span class="k"><?php echo e($L['coords']); ?></span><span><?php echo e($lat); ?>, <?php echo e($lng); ?></span></li>
          <li><span class="k"><?php echo e($L['openmap']); ?></span><a href="https://www.openstreetmap.org/?mlat=<?php echo e($lat); ?>&mlon=<?php echo e($lng); ?>#map=17/<?php echo e($lat); ?>/<?php echo e($lng); ?>" rel="nofollow noopener" target="_blank">OpenStreetMap</a> · <a href="https://www.google.com/maps/dir/?api=1&destination=<?php echo e($lat); ?>,<?php echo e($lng); ?>" rel="nofollow noopener" target="_blank"><?php echo e($L['directions']); ?></a></li>
          <?php endif; ?>
          <?php if (!empty($poi['updated_at'])): ?><li><span class="k"><?php echo e($L['updated']); ?></span><span><?php echo e(date('d/m/Y', strtotime($poi['updated_at']))); ?></span></li><?php endif; ?>
        </ul>

        <?php if (count($photos) > 1): ?>
        <div class="near" style="grid-template-columns:1fr 1fr 1fr">
          <?php foreach (array_slice($photos,1,3) as $ph): ?><a href="<?php echo e($appUrl); ?>"><img src="<?php echo e(seo_abs($ph)); ?>" alt="<?php echo e($name); ?>" loading="lazy" style="width:100%;height:90px"></a><?php endforeach; ?>
        </div>
        <?php endif; ?>

        <a class="cta" href="<?php echo e($appUrl); ?>"><?php echo e($L['cta']); ?></a>

        <?php if (count($orari)):
          $giorniNomi = array('it'=>array('lunedì','martedì','mercoledì','giovedì','venerdì','sabato','domenica'),
                              'sq'=>array('e hënë','e martë','e mërkurë','e enjte','e premte','e shtunë','e diel'),
                              'en'=>array('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'));
          $gn = $giorniNomi[$lang]; ?>
        <h2><?php echo e($L['orari']); ?></h2>
        <ul class="facts">
          <?php for ($g=0; $g<7; $g++):
            $turni = array();
            foreach ($orari as $o) { if ((int)$o['giorno']===$g && empty($o['chiuso']) && !empty($o['apre'])) $turni[] = substr($o['apre'],0,5).'-'.substr($o['chiude'],0,5); } ?>
          <li><span class="k"><?php echo e($gn[$g]); ?></span><span><?php echo e($turni ? implode(' · ', $turni) : $L['chiuso']); ?></span></li>
          <?php endfor; ?>
          <?php if (!empty($locale['telefono'])): ?><li><span class="k"><?php echo e($L['telefono']); ?></span><a href="tel:<?php echo e(preg_replace('/[^0-9+]/','',$locale['telefono'])); ?>"><?php echo e($locale['telefono']); ?></a></li><?php endif; ?>
          <?php if (!empty($locale['pagamenti']) && is_array($locale['pagamenti'])): ?><li><span class="k"><?php echo e($L['paga']); ?></span><span><?php echo e(implode(', ', $locale['pagamenti'])); ?></span></li><?php endif; ?>
        </ul>
        <?php endif; ?>

        <?php if (count($piatti)): ?>
        <h2><?php echo e($L['menu']); ?></h2>
        <ul class="facts">
          <?php foreach (array_slice($piatti,0,25) as $pt): ?>
          <li><span class="k"><?php echo e($pt['nome']); ?><?php if (!empty($pt['chef'])): ?> · <?php echo e($L['chef']); ?><?php endif; ?></span><span><?php
            if ($pt['prezzo'] !== null) echo e(round((float)$pt['prezzo']) . ' ' . ($pt['valuta']==='EUR' ? '€' : 'Lek'));
            if (!empty($pt['descrizione'])) echo '<br><small style="opacity:.7">' . e(mb_substr($pt['descrizione'],0,140)) . '</small>';
          ?></span></li>
          <?php endforeach; ?>
        </ul>
        <?php endif; ?>

        <?php if ($guida && !empty($guida['testo'])): ?>
        <h2><?php echo e($L['ascolta']); ?><?php if (!empty($guida['titolo'])): ?>: <?php echo e($guida['titolo']); ?><?php endif; ?></h2>
        <p style="line-height:1.6"><?php echo e(mb_substr($guida['testo'], 0, 1500)); ?></p>
        <?php endif; ?>

        <?php if ($mediaVoti !== null): ?>
        <h2><?php echo e($L['recensioni']); ?> · <?php echo e(str_replace('.', ',', (string)$mediaVoti)); ?> <?php echo e($L['su5']); ?></h2>
        <ul class="facts">
          <?php foreach (array_slice($recensioni,0,6) as $r): if (trim((string)$r['testo'])===''): continue; endif; ?>
          <li><span class="k"><?php echo e(str_replace('.', ',', (string)(float)$r['voto'])); ?>/5</span><span><?php echo e(mb_substr(trim($r['testo']),0,300)); ?></span></li>
          <?php endforeach; ?>
        </ul>
        <?php endif; ?>

        <?php if (count($creditiFoto)): $viste=array(); ?>
        <p style="font-size:12px;opacity:.65;line-height:1.5"><?php echo e($L['crediti']); ?>
          <?php foreach ($creditiFoto as $c): $k=$c['autore'].'|'.$c['licenza']; if (isset($viste[$k])) continue; $viste[$k]=1; ?>
            <?php if (!empty($c['fonte_url'])): ?><a href="<?php echo e($c['fonte_url']); ?>" rel="nofollow noopener" target="_blank"><?php echo e($c['autore']); ?></a><?php else: ?><?php echo e($c['autore']); ?><?php endif; ?>
            · <?php echo e($c['licenza']); ?>
          <?php endforeach; ?>
        </p>
        <?php endif; ?>

        <?php if (count($nearby)): ?>
        <h2><?php echo e($L['nearby']); ?></h2>
        <div class="near">
          <?php foreach ($nearby as $nb): $nbImg = (!empty($nb['photos']) && is_array($nb['photos']) && !empty($nb['photos'][0])) ? $nb['photos'][0] : ($nb['cover_photo'] ?: ''); ?>
          <a href="<?php echo e(SEO_BASE . '/poi.php?id=' . rawurlencode($nb['id']) . '&lang=' . $lang); ?>">
            <?php if ($nbImg): ?><img src="<?php echo e(seo_abs($nbImg)); ?>" alt="<?php echo e($nb['title']); ?>" loading="lazy"><?php else: ?><span class="near" style="width:52px;height:52px;display:flex;align-items:center;justify-content:center;border:none;background:var(--line)">📍</span><?php endif; ?>
            <span><span class="nm"><?php echo e($nb['title']); ?></span><?php if (!empty($nb['city'])): ?><span class="sub"><?php echo e($nb['city']); ?> · <?php echo e(round($nb['_km'],1)); ?> km</span><?php endif; ?></span>
          </a>
          <?php endforeach; ?>
        </div>
        <?php endif; ?>

        <?php echo seo_faq_html($L['faq'], $faq); ?>
      <?php endif; ?>
    </div>
  </article>

  <?php echo seo_langbar($path, $params, $lang); ?>
  <p class="foot"><a href="<?php echo e(SEO_BASE . '/?lang=' . $lang); ?>">POI•LOVE</a> · <?php echo e($L['foot']); ?></p>
</div>
</body></html>
