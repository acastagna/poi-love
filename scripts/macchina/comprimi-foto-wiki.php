<?php
/**
 * (c) Alessandro Castagna - 321.al / EVOLAB
 * Una tantum: le foto Wikimedia dei luoghi ufficiali pesano mezzo mega l'una.
 * Le porto in casa: scarico l'originale (con User-Agent, Wikimedia lo esige),
 * riduco a 1200px, riscrivo in WebP qualita' 82, e aggiorno il luogo.
 * La paternita' NON si tocca: vive in media_assets, indipendente dall'URL.
 * L'originale non si perde: resta su Wikimedia, e il rimando sta in media_assets.
 */
$pdo = new PDO('pgsql:host=127.0.0.1;port=5433;dbname=poilove', 'postgres');
$righe = $pdo->query("select id, photos, cover_photo from pois
  where exists (select 1 from unnest(photos) f where f like 'https://upload.wikimedia%')")->fetchAll(PDO::FETCH_ASSOC);
echo count($righe), " luoghi da sistemare\n";
$ctx = stream_context_create(['http'=>['header'=>"User-Agent: POI-LOVE/1.0 (https://poilove.com; info@321.it)\r\n",'timeout'=>30]]);
foreach ($righe as $r) {
  $id = $r['id'];
  $foto = json_decode('['.trim($r['photos'],'{}').']', true);
  if (!is_array($foto)) { $foto = str_getcsv(trim($r['photos'],'{}')); }
  $nuove = []; $n = 0; $cambiate = 0;
  $dir = "/var/www/poilove/media/poi/$id";
  @mkdir($dir, 0755, true);
  foreach ($foto as $f) {
    $f = trim($f, '"');
    if (strpos($f, 'https://upload.wikimedia') !== 0) { $nuove[] = $f; continue; }
    $n++;
    $dati = @file_get_contents($f, false, $ctx);
    if ($dati === false) { echo "  $id: scarico fallito, foto lasciata com'era\n"; $nuove[] = $f; continue; }
    $img = @imagecreatefromstring($dati);
    if (!$img) { echo "  $id: immagine illeggibile, lasciata\n"; $nuove[] = $f; continue; }
    $w = imagesx($img); $h = imagesy($img);
    $lato = max($w, $h);
    if ($lato > 1200) { $s = 1200 / $lato; $img = imagescale($img, (int)($w*$s), (int)($h*$s), IMG_BICUBIC); }
    $dest = "$dir/wiki-$n.webp";
    // qualita' a scendere finche' non sta sotto i 100 KB
    foreach ([82, 72, 62, 52] as $q) {
      imagewebp($img, $dest, $q);
      if (filesize($dest) <= 100 * 1024) break;
    }
    imagedestroy($img);
    chown($dest, 'www-data'); chgrp($dest, 'www-data');
    $nuove[] = "https://media.poilove.com/poi/$id/wiki-$n.webp";
    $cambiate++;
  }
  if ($cambiate) {
    $arr = '{' . implode(',', array_map(fn($u) => '"'.$u.'"', $nuove)) . '}';
    $cover = $nuove[0];
    $st = $pdo->prepare("update pois set photos = :p, cover_photo = :c where id = :id");
    $st->execute([':p'=>$arr, ':c'=>$cover, ':id'=>$id]);
    echo "  $id: $cambiate foto portate in casa\n";
  }
}
echo "fatto\n";
