<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Sitemap XML dinamica (servita anche come /sitemap.xml via rewrite). Elenca SOLO contenuti pubblici
 * (RLS via anon): luoghi community+approvati, rotte pubblicate, itinerari pubblici, hub + pagine città
 * + statiche. hreflang xhtml:link reciproci it/sq/en + x-default, lastmod reale da updated_at,
 * image:image dalla foto reale. Niente priority/changefreq (Google li ignora). Cache leggera.
 */
require __DIR__ . '/seo_lib.php';

header('Content-Type: application/xml; charset=UTF-8');
header('Cache-Control: public, max-age=3600');

$langs = array('it', 'sq', 'en');

function xurl($path, $params, $lastmod, $img) {
  global $langs;
  $mk = function ($lg) use ($path, $params) { $p = $params; $p['lang'] = $lg; return SEO_BASE . $path . '?' . http_build_query($p); };
  $out = '<url>';
  $out .= '<loc>' . e($mk('it')) . '</loc>';
  if ($lastmod) $out .= '<lastmod>' . e(gmdate('c', strtotime($lastmod))) . '</lastmod>';
  foreach ($langs as $lg) $out .= '<xhtml:link rel="alternate" hreflang="' . $lg . '" href="' . e($mk($lg)) . '"/>';
  $out .= '<xhtml:link rel="alternate" hreflang="x-default" href="' . e($mk('it')) . '"/>'; // x-default = it canonico (self-canonical)
  $abs = seo_abs($img);
  if ($img && preg_match('#^https?://#i', $abs)) $out .= '<image:image><image:loc>' . e($abs) . '</image:loc></image:image>'; // mai data: URI nella sitemap immagini
  return $out . '</url>';
}

$pois   = seo_get('pois?visibility=eq.community&is_approved=eq.true&removed_at=is.null&select=id,cover_photo,photos,updated_at,city&order=updated_at.desc&limit=5000');
$routes = seo_get('trips?is_historic=eq.true&is_published=eq.true&select=id,cover_url,updated_at&order=updated_at.desc&limit=1000');
$trips  = seo_get('trips?is_historic=eq.false&visibility=eq.pub&select=id,cover_url,updated_at&order=updated_at.desc&limit=1000');

// città distinte con almeno un POI pubblico
$cities = array();
foreach ($pois as $p) { if (!empty($p['city'])) $cities[$p['city']] = true; }

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
   . ' xmlns:xhtml="http://www.w3.org/1999/xhtml"'
   . ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' . "\n";

// Statiche: hub esplora
echo xurl('/esplora.php', array(), null, null) . "\n";

// Pagine città
foreach (array_keys($cities) as $c) echo xurl('/esplora.php', array('city' => $c), null, null) . "\n";

// Luoghi
foreach ($pois as $p) {
  $img = (!empty($p['photos']) && is_array($p['photos']) && !empty($p['photos'][0])) ? $p['photos'][0] : (!empty($p['cover_photo']) ? $p['cover_photo'] : null);
  echo xurl('/poi.php', array('id' => $p['id']), $p['updated_at'], $img) . "\n";
}
// Rotte
foreach ($routes as $r) echo xurl('/route.php', array('id' => $r['id']), $r['updated_at'], !empty($r['cover_url']) ? $r['cover_url'] : null) . "\n";
// Itinerari
foreach ($trips as $tr) echo xurl('/trip.php', array('id' => $tr['id']), $tr['updated_at'], null) . "\n";

echo '</urlset>';
