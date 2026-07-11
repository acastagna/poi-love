<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Libreria condivisa per le landing SEO/GEO/AIO server-rendered (poi.php, route.php, trip.php,
 * esplora.php, sitemap.php). Rende contenuto REALE dal DB pubblico (RLS via anon key): niente
 * dati finti. Frontend = SPA JS invisibile ai crawler, quindi QUESTE pagine sono la superficie
 * indicizzabile del sito. Trilingue it/sq/en via ?lang=, con hreglang reciproco + x-default.
 */
if (!defined('SEO_LIB')) {
  define('SEO_LIB', 1);

  // I deprecation warning (es. curl_close in PHP 8.5) sono innocui ma, se display_errors è on,
  // inquinerebbero l'output (fatale per l'XML della sitemap). Li silenziamo, lasciando visibili i veri errori.
  error_reporting(E_ALL & ~E_DEPRECATED);

  define('SEO_SUPA', 'https://ptppxwlafswfhbueakjt.supabase.co');
  define('SEO_ANON', 'sb_publishable_PC1xQ8XiQK9jpzwsAlFLxw_E-PKN40V');
  define('SEO_BASE', 'https://poilove.com');
  define('SEO_OG_FALLBACK', 'https://poilove.com/img/opengraph.jpg');

  /** GET REST verso Supabase (solo dati pubblici via RLS anon). Ritorna array (vuoto se errore). */
  function seo_get($path) {
    $ch = curl_init(SEO_SUPA . '/rest/v1/' . $path);
    curl_setopt_array($ch, array(
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_HTTPHEADER => array('apikey: ' . SEO_ANON, 'Authorization: Bearer ' . SEO_ANON),
      CURLOPT_TIMEOUT => 6,
      CURLOPT_CONNECTTIMEOUT => 4,
    ));
    $res = curl_exec($ch); // curl_close() non serve (no-op dal PHP 8.0, deprecato in 8.5): l'handle si libera da sé
    $arr = json_decode($res, true);
    if (!is_array($arr)) return array();
    // PostgREST ritorna una LISTA di righe su successo, un OGGETTO {code,message} su errore
    // (es. id non-UUID). Accettiamo solo le liste: così le pagine non trattano mai un errore come dati.
    if ($arr && array_keys($arr) !== range(0, count($arr) - 1)) return array();
    return $arr;
  }

  /** Escape HTML sicuro. */
  function e($s) { return htmlspecialchars($s === null ? '' : (string)$s, ENT_QUOTES, 'UTF-8'); }

  /** Lingua richiesta: ?lang= (it/sq/en), poi Accept-Language, default it. */
  function seo_lang() {
    $l = isset($_GET['lang']) ? strtolower(substr($_GET['lang'], 0, 2)) : '';
    if (in_array($l, array('it', 'sq', 'en'), true)) return $l;
    $al = isset($_SERVER['HTTP_ACCEPT_LANGUAGE']) ? strtolower($_SERVER['HTTP_ACCEPT_LANGUAGE']) : '';
    if (strpos($al, 'sq') === 0) return 'sq';
    if (strpos($al, 'en') === 0) return 'en';
    return 'it';
  }

  /** Codice ISO 639-1 completo per l'attributo lang dell'HTML. */
  function seo_html_lang($lang) { return $lang; }

  /**
   * Blocco <link rel="canonical"> + hreflang reciproci (it/sq/en) + x-default.
   * $path es '/poi.php', $params es array('id'=>$id). Il canonical punta alla lingua corrente.
   */
  function seo_alternates($path, $params, $curLang) {
    $out = '';
    $mk = function ($lg) use ($path, $params) {
      $p = $params; $p['lang'] = $lg;
      return SEO_BASE . $path . '?' . http_build_query($p);
    };
    // canonical = lingua corrente
    $out .= '<link rel="canonical" href="' . e($mk($curLang)) . '">' . "\n";
    foreach (array('it', 'sq', 'en') as $lg) {
      $out .= '<link rel="alternate" hreflang="' . $lg . '" href="' . e($mk($lg)) . '">' . "\n";
    }
    // x-default = versione senza lang (italiano di default)
    $out .= '<link rel="alternate" hreflang="x-default" href="' . e(SEO_BASE . $path . '?' . http_build_query($params)) . '">' . "\n";
    return $out;
  }

  /** Meta geografici. $region = ISO paese (es 'AL','IT') o '' per ometterlo. */
  function seo_geo_meta($lat, $lng, $placename, $region) {
    if ($lat === null || $lng === null || $lat === '' || $lng === '') return '';
    $la = e($lat); $ln = e($lng);
    $o  = '<meta name="geo.position" content="' . $la . ';' . $ln . '">' . "\n";
    $o .= '<meta name="ICBM" content="' . $la . ', ' . $ln . '">' . "\n";
    if ($placename !== '') $o .= '<meta name="geo.placename" content="' . e($placename) . '">' . "\n";
    if ($region !== '')    $o .= '<meta name="geo.region" content="' . e($region) . '">' . "\n";
    return $o;
  }

  /** Blocco OpenGraph + Twitter completo. */
  function seo_og($title, $desc, $img, $url, $type) {
    $t = e($title); $d = e($desc); $i = e($img); $u = e($url); $ty = e($type ? $type : 'website');
    return '<meta property="og:type" content="' . $ty . '">' . "\n"
      . '<meta property="og:site_name" content="POI•LOVE">' . "\n"
      . '<meta property="og:title" content="' . $t . '">' . "\n"
      . '<meta property="og:description" content="' . $d . '">' . "\n"
      . '<meta property="og:image" content="' . $i . '">' . "\n"
      . '<meta property="og:url" content="' . $u . '">' . "\n"
      . '<meta name="twitter:card" content="summary_large_image">' . "\n"
      . '<meta name="twitter:title" content="' . $t . '">' . "\n"
      . '<meta name="twitter:description" content="' . $d . '">' . "\n"
      . '<meta name="twitter:image" content="' . $i . '">' . "\n";
  }

  /** Emette uno o più oggetti JSON-LD dentro un unico <script type="application/ld+json"> @graph. */
  function seo_jsonld($graph) {
    $doc = array('@context' => 'https://schema.org', '@graph' => array_values(array_filter($graph)));
    return '<script type="application/ld+json">'
      . json_encode($doc, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
      . '</script>' . "\n";
  }

  /** Nodo Organization + WebSite (identità del sito, con SearchAction). Riusabile in ogni pagina. */
  function seo_org_nodes() {
    return array(
      array(
        '@type' => 'Organization',
        '@id' => SEO_BASE . '/#org',
        'name' => 'POI•LOVE',
        'url' => SEO_BASE . '/',
        'logo' => SEO_BASE . '/img/logo-completo.svg',
        'description' => 'La mappa comunitaria dei luoghi amati. Un\'alternativa umana e culturale a Google Maps.',
        'sameAs' => array()
      ),
      array(
        '@type' => 'WebSite',
        '@id' => SEO_BASE . '/#website',
        'url' => SEO_BASE . '/',
        'name' => 'POI•LOVE',
        'inLanguage' => array('it', 'sq', 'en'),
        'publisher' => array('@id' => SEO_BASE . '/#org'),
        'potentialAction' => array(
          '@type' => 'SearchAction',
          'target' => array('@type' => 'EntryPoint', 'urlTemplate' => SEO_BASE . '/esplora.php?q={search_term_string}'),
          'query-input' => 'required name=search_term_string'
        )
      )
    );
  }

  /** Nodo BreadcrumbList da una lista [ ['name'=>..,'url'=>..], .. ]. */
  function seo_breadcrumb($items) {
    $el = array(); $i = 0;
    foreach ($items as $it) {
      if (!$it || empty($it['name'])) continue; // salta i livelli assenti (es. città mancante) → position sequenziali
      $i++;
      $node = array('@type' => 'ListItem', 'position' => $i, 'name' => $it['name']);
      if (!empty($it['url'])) $node['item'] = $it['url']; // l'ultimo livello (senza url) resta senza item
      $el[] = $node;
    }
    return array('@type' => 'BreadcrumbList', 'itemListElement' => $el);
  }

  /** Nodo FAQPage da [ ['q'=>..,'a'=>..], .. ]. Domande/risposte REALI dai dati. */
  function seo_faq($qas) {
    $main = array();
    foreach ($qas as $qa) {
      if (empty($qa['q']) || empty($qa['a'])) continue;
      $main[] = array('@type' => 'Question', 'name' => $qa['q'],
        'acceptedAnswer' => array('@type' => 'Answer', 'text' => $qa['a']));
    }
    if (!count($main)) return null;
    return array('@type' => 'FAQPage', 'mainEntity' => $main);
  }

  /** HTML visibile di un blocco FAQ (per gli utenti e per i motori AI). */
  function seo_faq_html($title, $qas) {
    $rows = '';
    foreach ($qas as $qa) {
      if (empty($qa['q']) || empty($qa['a'])) continue;
      $rows .= '<div class="faq-item"><h3 class="faq-q">' . e($qa['q']) . '</h3><p class="faq-a">' . e($qa['a']) . '</p></div>';
    }
    if ($rows === '') return '';
    return '<section class="faq"><h2>' . e($title) . '</h2>' . $rows . '</section>';
  }

  /** Distanza approssimata in km (haversine) per ordinare i "vicini". */
  function seo_km($la1, $lo1, $la2, $lo2) {
    $R = 6371; $dLa = deg2rad($la2 - $la1); $dLo = deg2rad($lo2 - $lo1);
    $a = sin($dLa / 2) * sin($dLa / 2) + cos(deg2rad($la1)) * cos(deg2rad($la2)) * sin($dLo / 2) * sin($dLo / 2);
    return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
  }

  /** CSS di base condiviso dalle landing (brand POI•LOVE, chiaro/scuro, mobile-first). */
  function seo_css() {
    return '<style>
  :root{--bg:#EAE4D8;--card:#fff;--ink:#241f18;--muted:#6b6355;--line:#EDE6D8;--red:#D42B2B;--blue:#285EA7;--purple:#7C3AED;--gold:#B4823C}
  @media (prefers-color-scheme:dark){:root{--bg:#17130d;--card:#221c14;--ink:#F3ECDD;--muted:#a89e8c;--line:#2e2619}}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:var(--ink);line-height:1.55;-webkit-font-smoothing:antialiased}
  .wrap{max-width:760px;margin:0 auto;padding:20px 18px 60px}
  .bc{font-size:12px;color:var(--muted);margin:6px 0 16px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
  .bc a{color:var(--muted);text-decoration:none}.bc a:hover{color:var(--red)}.bc .sep{opacity:.5}
  .card{background:var(--card);border-radius:22px;overflow:hidden;box-shadow:0 18px 50px rgba(30,20,5,.16)}
  .cover{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:linear-gradient(135deg,var(--red),var(--purple))}
  .pad{padding:22px}
  .kick{font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--red);margin-bottom:8px}
  h1{font-size:27px;font-weight:900;line-height:1.14;margin-bottom:10px;letter-spacing:-.01em}
  h2{font-size:18px;font-weight:800;margin:26px 0 12px}
  .lead{font-size:16px;color:var(--ink);margin-bottom:16px}
  .desc{font-size:15px;color:var(--muted);margin-bottom:16px;white-space:pre-line}
  .chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
  .chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;border-radius:20px;padding:6px 12px;background:rgba(40,94,167,.10);color:var(--blue)}
  .chip.cat{background:rgba(212,43,43,.10);color:var(--red)}
  .chip.gold{background:rgba(180,130,60,.14);color:var(--gold)}
  .chip.purple{background:rgba(124,58,237,.12);color:var(--purple)}
  .facts{list-style:none;border:1px solid var(--line);border-radius:16px;overflow:hidden;margin-bottom:20px}
  .facts li{display:flex;gap:10px;padding:11px 14px;font-size:14px;border-bottom:1px solid var(--line)}
  .facts li:last-child{border-bottom:none}.facts .k{color:var(--muted);min-width:120px;font-weight:700}
  .facts a{color:var(--blue);text-decoration:none}
  .near{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px}
  @media(max-width:520px){.near{grid-template-columns:1fr}}
  .near a{display:flex;gap:10px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px;text-decoration:none;color:var(--ink)}
  .near img{width:52px;height:52px;border-radius:10px;object-fit:cover;flex-shrink:0;background:var(--line)}
  .near .nm{font-size:14px;font-weight:700;line-height:1.2}.near .sub{font-size:12px;color:var(--muted)}
  .stops-ol{list-style:none;margin:0 0 20px;padding:0;counter-reset:st}
  .stops-ol li{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}
  .stops-ol li:last-child{border-bottom:none}
  .stops-ol .n{flex-shrink:0;width:26px;height:26px;border-radius:50%;background:var(--purple);color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center}
  .stops-ol .snm{font-weight:700;font-size:15px}.stops-ol .ssub{font-size:12px;color:var(--muted)}
  .faq{margin-top:8px}
  .faq-item{border-top:1px solid var(--line);padding:14px 0}
  .faq-q{font-size:15px;font-weight:800;margin-bottom:6px}
  .faq-a{font-size:14px;color:var(--muted)}
  .cta{display:block;text-align:center;background:var(--red);color:#fff;text-decoration:none;font-weight:800;font-size:16px;padding:16px;border-radius:14px;margin-top:22px}
  .langbar{display:flex;gap:8px;justify-content:center;margin-top:20px}
  .langbar a{font-size:12px;font-weight:700;color:var(--muted);text-decoration:none;padding:5px 11px;border-radius:20px;border:1px solid var(--line)}
  .langbar a.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
  .foot{text-align:center;font-size:12px;color:var(--muted);margin-top:20px}
  .foot a{color:var(--muted)}
</style>';
  }

  /** Barra lingua (link reciproci, preserva i parametri). */
  function seo_langbar($path, $params, $cur) {
    $names = array('it' => 'Italiano', 'sq' => 'Shqip', 'en' => 'English');
    $out = '<nav class="langbar" aria-label="lingua">';
    foreach ($names as $lg => $nm) {
      $p = $params; $p['lang'] = $lg;
      $out .= '<a hreflang="' . $lg . '"' . ($lg === $cur ? ' class="on" aria-current="true"' : '') . ' href="' . e($path . '?' . http_build_query($p)) . '">' . $nm . '</a>';
    }
    return $out . '</nav>';
  }

  /** Rende assoluto un URL immagine (lascia http/https e data: intatti). */
  function seo_abs($u) {
    if (!$u) return '';
    if (preg_match('#^(https?:)?//#i', $u) || strpos($u, 'data:') === 0) return $u;
    return SEO_BASE . '/' . ltrim($u, '/');
  }

  /** Slug ASCII per URL leggibili (breadcrumb/canonical estetici). */
  function seo_slug($s) {
    $s = (string)$s;
    if (function_exists('iconv')) { $t = @iconv('UTF-8', 'ASCII//TRANSLIT', $s); if ($t !== false) $s = $t; }
    $s = strtolower(preg_replace('/[^A-Za-z0-9]+/', '-', $s));
    return trim($s, '-');
  }

  /** og:locale corretto per lingua. */
  function seo_locale($lang) {
    return $lang === 'sq' ? 'sq_AL' : ($lang === 'en' ? 'en_US' : 'it_IT');
  }

  /**
   * Categoria/subcategoria POI → array di @type schema.org più specifici.
   * Default TouristAttraction (POI•LOVE = luoghi d'interesse), mai 'Place' generico per una meta.
   */
  function seo_poi_types($category, $subcategory) {
    $c = strtolower(trim((string)$category . ' ' . (string)$subcategory));
    $map = array(
      'fast_food' => array('FastFoodRestaurant'),
      'cibo_gourmet' => array('Restaurant', 'TouristAttraction'),
      'cibo' => array('Restaurant'),
      'pernottare' => array('LodgingBusiness'),
      'acquisti' => array('Store'),
      'benessere' => array('HealthAndBeautyBusiness'),
      'cultura' => array('TouristAttraction'),
      'natura' => array('TouristAttraction'),
      'vacanze' => array('TouristAttraction'),
      'festa' => array('TouristAttraction'),
      'audioguida' => array('TouristAttraction'),
    );
    foreach ($map as $key => $types) { if (strpos($c, $key) !== false) return $types; }
    // parole comuni multilingua
    if (preg_match('/ristorant|restaurant|trattor|pizzer/', $c)) return array('Restaurant');
    if (preg_match('/caff|coffee|café|bar\b/', $c)) return array('CafeOrCoffeeShop');
    if (preg_match('/museo|museum/', $c)) return array('Museum', 'TouristAttraction');
    if (preg_match('/parco|park|natur/', $c)) return array('TouristAttraction');
    if (preg_match('/hotel|albergo|guest|b&b/', $c)) return array('LodgingBusiness');
    if (preg_match('/negozio|shop|store/', $c)) return array('Store');
    return array('TouristAttraction');
  }

  /** Mappa etichetta categoria per lingua da poi_categories (una fetch, cache in-request). */
  function seo_cat_labels() {
    static $cache = null;
    if ($cache !== null) return $cache;
    $cache = array();
    $rows = seo_get('poi_categories?select=key,label_it,label_sq,label_en');
    foreach ($rows as $r) { if (!empty($r['key'])) $cache[$r['key']] = $r; }
    return $cache;
  }
  function seo_cat_label($key, $lang) {
    if (!$key) return '';
    $labels = seo_cat_labels();
    if (isset($labels[$key])) {
      $r = $labels[$key];
      $v = $r['label_' . $lang]; if (!empty($v)) return $v;
      if (!empty($r['label_it'])) return $r['label_it'];
    }
    return ucfirst(str_replace('_', ' ', $key));
  }
}
