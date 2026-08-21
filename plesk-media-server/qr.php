<?php
// =============================================================================
// © Alessandro Castagna — 321.al / EVOLAB
// Tutti i diritti riservati. Uso non autorizzato vietato.
// info@321.it · https://321.al
// =============================================================================
// POI•LOVE — media.poilove.com — qr.php
//
// I QR li disegniamo noi, modulo per modulo. Non e' vezzo: un servizio esterno
// avrebbe i nostri indirizzi e il giorno che chiude i cartelli stampati muoiono.
// Disegnandoli in casa possiamo anche dargli la nostra faccia: punti tondi o
// quadrati, angoli morbidi, colori e marchio in mezzo. Lo stile predefinito lo
// decide l'amministrazione e sta nella tabella `qr_stile`.
//
// GET /qr.php
//   d   l'indirizzo da mettere dentro (obbligatorio, solo poilove.com)
//   s   lato in punti (200-2400)
//   t   una riga sotto il codice, per la stampa
//   c   colore dei punti · ca colore degli angoli · bg sfondo
//   fp  forma dei punti:  quadrato | arrotondato | tondo
//   fa  forma degli angoli: quadrato | arrotondato | tondo
//   lg  marchio in mezzo: nostro | nessuno
//   lq  quanto e' grande il marchio, in percentuale (10-30)
//   m   margine in moduli (0-6)
// Senza parametri di stile si usa quello salvato dall'amministrazione.
// =============================================================================

declare(strict_types=1);

$dato = (string)($_GET['d'] ?? '');
if ($dato === '' || strlen($dato) > 900) { http_response_code(400); exit('indirizzo mancante'); }
$host = parse_url($dato, PHP_URL_HOST);
if (!$host || !preg_match('/(^|\.)poilove\.com$/i', $host)) {
    http_response_code(400); exit('questo QR porterebbe fuori da POI-LOVE');
}

// ── Lo stile: quello chiesto, altrimenti quello dell'amministrazione ────────
function stile_salvato(): array {
    static $s = null;
    if ($s !== null) { return $s; }
    $s = [];
    $ch = curl_init('https://poilove.com/db/rest/v1/qr_stile?id=eq.1&select=*');
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 6]);
    $r = curl_exec($ch); curl_close($ch);
    $j = json_decode((string)$r, true);
    if (is_array($j) && isset($j[0])) { $s = $j[0]; }
    return $s;
}
function col(string $chiave, string $dai_dati, string $predefinito): string {
    $v = strtoupper(preg_replace('/[^0-9A-Fa-f]/', '', (string)($_GET[$chiave] ?? '')));
    if (strlen($v) === 6) { return $v; }
    $sal = stile_salvato();
    $v2 = strtoupper(preg_replace('/[^0-9A-Fa-f]/', '', (string)($sal[$dai_dati] ?? '')));
    return strlen($v2) === 6 ? $v2 : $predefinito;
}
function forma(string $chiave, string $dai_dati): string {
    $v = strtolower(trim((string)($_GET[$chiave] ?? '')));
    if (in_array($v, ['quadrato','arrotondato','tondo'], true)) { return $v; }
    $sal = stile_salvato();
    $v2 = strtolower((string)($sal[$dai_dati] ?? ''));
    return in_array($v2, ['quadrato','arrotondato','tondo'], true) ? $v2 : 'quadrato';
}

$lato = (int)($_GET['s'] ?? 600);
if ($lato < 200)  { $lato = 200; }
if ($lato > 2400) { $lato = 2400; }

$sal      = stile_salvato();
$cPunti   = col('c',  'colore',        'D42B2B');
$cAngoli  = col('ca', 'colore_angoli', $cPunti);
$cSfondo  = col('bg', 'sfondo',        'FFFFFF');
$fPunti   = forma('fp','forma_punti');
$fAngoli  = forma('fa','forma_angoli');
$logo     = strtolower(trim((string)($_GET['lg'] ?? ($sal['logo'] ?? 'nostro'))));
if (!in_array($logo, ['nostro','nessuno'], true)) { $logo = 'nostro'; }
$logoQuota = (int)($_GET['lq'] ?? ($sal['logo_quota'] ?? 22));
if ($logoQuota < 10) { $logoQuota = 10; }
if ($logoQuota > 30) { $logoQuota = 30; }
$margine = (int)($_GET['m'] ?? ($sal['margine'] ?? 2));
if ($margine < 0) { $margine = 0; }
if ($margine > 6) { $margine = 6; }

$scritta = trim((string)($_GET['t'] ?? ''));
if (mb_strlen($scritta) > 60) { $scritta = mb_substr($scritta, 0, 60); }

// ── La griglia del codice ───────────────────────────────────────────────────
$qrencode = trim((string)shell_exec('command -v qrencode'));
if ($qrencode === '') { http_response_code(500); exit('generatore non installato'); }
$ascii = shell_exec($qrencode . ' -t ASCII -m 0 -l H -o - ' . escapeshellarg($dato) . ' 2>/dev/null');
$righe = array_values(array_filter(explode("\n", (string)$ascii), fn($r) => trim($r, " \r") !== ''));
if (!count($righe)) { http_response_code(500); exit('non sono riuscito a disegnare il codice'); }

$griglia = [];
foreach ($righe as $r) {
    $riga = [];
    for ($i = 0; $i < strlen(rtrim($r, "\r")); $i += 2) { $riga[] = ($r[$i] === '#'); }
    $griglia[] = $riga;
}
$n = count($griglia);

// ── Il disegno. Si disegna in grande e si rimpicciolisce: i bordi vengono
//    morbidi senza dover fare i conti a mano. ─────────────────────────────────
$modulo  = 12;                                   // punti per modulo nel disegno grande
$grande  = ($n + $margine * 2) * $modulo;
$img = imagecreatetruecolor($grande, $grande);
imagealphablending($img, true);
$rgb = fn(string $h) => [hexdec(substr($h,0,2)), hexdec(substr($h,2,2)), hexdec(substr($h,4,2))];
[$sr,$sg,$sb] = $rgb($cSfondo); $sfondo = imagecolorallocate($img, $sr,$sg,$sb);
[$pr,$pg,$pb] = $rgb($cPunti);  $punto  = imagecolorallocate($img, $pr,$pg,$pb);
[$ar,$ag,$ab] = $rgb($cAngoli); $angolo = imagecolorallocate($img, $ar,$ag,$ab);
imagefilledrectangle($img, 0, 0, $grande, $grande, $sfondo);

$dentroAngolo = function(int $y, int $x) use ($n): bool {
    return ($y < 7 && $x < 7) || ($y < 7 && $x >= $n-7) || ($y >= $n-7 && $x < 7);
};
$disegna = function(int $x, int $y, string $f, int $colore) use ($img, $modulo, $margine) {
    $x0 = ($x + $margine) * $modulo; $y0 = ($y + $margine) * $modulo;
    if ($f === 'tondo') {
        imagefilledellipse($img, (int)($x0 + $modulo/2), (int)($y0 + $modulo/2), (int)($modulo*0.92), (int)($modulo*0.92), $colore);
    } elseif ($f === 'arrotondato') {
        $r = (int)($modulo * 0.35);
        imagefilledrectangle($img, $x0+$r, $y0, $x0+$modulo-1-$r, $y0+$modulo-1, $colore);
        imagefilledrectangle($img, $x0, $y0+$r, $x0+$modulo-1, $y0+$modulo-1-$r, $colore);
        foreach ([[$x0+$r,$y0+$r], [$x0+$modulo-1-$r,$y0+$r], [$x0+$r,$y0+$modulo-1-$r], [$x0+$modulo-1-$r,$y0+$modulo-1-$r]] as $c) {
            imagefilledellipse($img, $c[0], $c[1], $r*2, $r*2, $colore);
        }
    } else {
        imagefilledrectangle($img, $x0, $y0, $x0+$modulo-1, $y0+$modulo-1, $colore);
    }
};

// i tre quadrati agli angoli, disegnati come blocco unico e non modulo per modulo
$disegnaAngolo = function(int $cx, int $cy) use ($img, $modulo, $margine, $fAngoli, $angolo, $sfondo) {
    $x0 = ($cx + $margine) * $modulo; $y0 = ($cy + $margine) * $modulo;
    $l  = 7 * $modulo;
    $blocco = function(int $x, int $y, int $lato, int $colore, string $f) use ($img, $modulo) {
        if ($f === 'tondo') { imagefilledellipse($img, (int)($x+$lato/2), (int)($y+$lato/2), $lato, $lato, $colore); return; }
        if ($f === 'arrotondato') {
            $r = (int)($lato * 0.28);
            imagefilledrectangle($img, $x+$r, $y, $x+$lato-1-$r, $y+$lato-1, $colore);
            imagefilledrectangle($img, $x, $y+$r, $x+$lato-1, $y+$lato-1-$r, $colore);
            foreach ([[$x+$r,$y+$r],[$x+$lato-1-$r,$y+$r],[$x+$r,$y+$lato-1-$r],[$x+$lato-1-$r,$y+$lato-1-$r]] as $c) {
                imagefilledellipse($img, $c[0], $c[1], $r*2, $r*2, $colore);
            }
            return;
        }
        imagefilledrectangle($img, $x, $y, $x+$lato-1, $y+$lato-1, $colore);
    };
    $blocco($x0, $y0, $l, $angolo, $fAngoli);                                              // cornice
    $blocco($x0+$modulo, $y0+$modulo, $l-2*$modulo, $sfondo, $fAngoli);                    // buco
    $blocco($x0+2*$modulo, $y0+2*$modulo, $l-4*$modulo, $angolo, $fAngoli);                // occhio
};

for ($y = 0; $y < $n; $y++) {
    for ($x = 0; $x < count($griglia[$y]); $x++) {
        if (!$griglia[$y][$x]) { continue; }
        if ($dentroAngolo($y, $x)) { continue; }
        $disegna($x, $y, $fPunti, $punto);
    }
}
$disegnaAngolo(0, 0);
$disegnaAngolo($n-7, 0);
$disegnaAngolo(0, $n-7);

// ── Il marchio in mezzo ────────────────────────────────────────────────────
if ($logo === 'nostro') {
    $r  = (int)($grande * $logoQuota / 200);
    $cx = (int)($grande / 2); $cy = (int)($grande / 2);
    imagefilledellipse($img, $cx, $cy, $r*2, $r*2, $sfondo);
    imagefilledellipse($img, $cx, $cy, (int)($r*1.62), (int)($r*1.62), $punto);
    imagefilledellipse($img, $cx, $cy, (int)($r*0.95), (int)($r*0.95), $sfondo);
    imagefilledellipse($img, $cx, $cy, (int)($r*0.52), (int)($r*0.52), $punto);
}

// ── Rimpicciolimento (bordi morbidi) e riga sotto ──────────────────────────
$altezzaScritta = $scritta !== '' ? (int)round($lato * 0.13) : 0;
$foglio = imagecreatetruecolor($lato, $lato + $altezzaScritta);
imagefilledrectangle($foglio, 0, 0, $lato, $lato + $altezzaScritta, imagecolorallocate($foglio, $sr,$sg,$sb));
imagecopyresampled($foglio, $img, 0, 0, 0, 0, $lato, $lato, $grande, $grande);
imagedestroy($img);

if ($scritta !== '') {
    $nero  = imagecolorallocate($foglio, 20, 20, 20);
    $corpo = 5;
    $largo = imagefontwidth($corpo) * strlen($scritta);
    $x = max(4, (int)round(($lato - $largo) / 2));
    $y = (int)($lato + $altezzaScritta/2 - imagefontheight($corpo)/2);
    imagestring($foglio, $corpo, $x, $y, $scritta, $nero);
}

header('Content-Type: image/png');
header('Cache-Control: public, max-age=3600');
imagepng($foglio);
imagedestroy($foglio);
