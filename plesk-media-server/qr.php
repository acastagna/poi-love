<?php
// =============================================================================
// © Alessandro Castagna — 321.al / EVOLAB
// Tutti i diritti riservati. Uso non autorizzato vietato.
// info@321.it · https://321.al
// =============================================================================
// POI•LOVE — media.poilove.com — qr.php
//
// I QR li disegniamo noi. Non e' vezzo: un servizio esterno avrebbe i nostri
// indirizzi, e il giorno che chiude i cartelli stampati muoiono.
//
// Riscritto il 21/08/2026. Prima si disegnava a pixel con GD e il risultato era
// indecente: bordi seghettati, e al posto del marchio un cerchio colorato.
// Adesso il codice nasce VETTORIALE. L'SVG e' la forma vera: da li' escono il
// PNG e il JPG, disegnati da un motore che sa fare le curve, a qualunque
// dimensione. Un cartello stampato a un metro viene nitido come sullo schermo.
//
// GET /qr.php
//   d    l'indirizzo da mettere dentro (obbligatorio, solo poilove.com)
//   f    formato: svg | png | jpg            (predefinito png)
//   s    lato in punti, per png e jpg (200-4096, predefinito 1024)
//   sf   sfondo: trasparente | bianco | <colore esadecimale>
//        (il PNG puo essere trasparente, il JPG mai: diventa bianco)
//   t    una riga sotto il codice, per la stampa
//   c    colore dei punti · c2 secondo colore (sfumatura) · ca colore angoli
//        · cp colore della pupilla degli angoli
//   fp   forma dei punti:  quadrato | arrotondato | tondo | rombo | goccia
//   fa   forma degli angoli: quadrato | arrotondato | tondo | foglia | cuscino
//   lg   marchio in mezzo: poilove | poivoice | nessuno
//   lq   quanto e' grande il marchio, in percentuale del lato (10-30)
//   m    margine in moduli (0-6)
// Senza parametri di stile si usa quello salvato dall'amministrazione.
// =============================================================================

declare(strict_types=1);

$dato = (string)($_GET['d'] ?? '');
if ($dato === '' || strlen($dato) > 900) { http_response_code(400); exit('indirizzo mancante'); }
// Non basta guardare il nome del sito: va guardato anche COME comincia
// l'indirizzo. Una cosa come javascript://poilove.com/... ha il nome giusto ma
// non e' un indirizzo web, e passerebbe un controllo fatto solo sull'host.
$schema = strtolower((string)parse_url($dato, PHP_URL_SCHEME));
$host   = parse_url($dato, PHP_URL_HOST);
if ($schema !== 'https' || !str_starts_with(strtolower($dato), 'https://')
    || !$host || !preg_match('/(^|\.)poilove\.com$/i', $host)) {
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
    $v = strtoupper((string)preg_replace('/[^0-9A-Fa-f]/', '', (string)($_GET[$chiave] ?? '')));
    if (strlen($v) === 6) { return $v; }
    $sal = stile_salvato();
    $v2 = strtoupper((string)preg_replace('/[^0-9A-Fa-f]/', '', (string)($sal[$dai_dati] ?? '')));
    return strlen($v2) === 6 ? $v2 : $predefinito;
}
const FORME_PUNTI  = ['quadrato','arrotondato','tondo','rombo','goccia'];
const FORME_ANGOLI = ['quadrato','arrotondato','tondo','foglia','cuscino'];
function forma(string $chiave, string $dai_dati, array $ammesse): string {
    $v = strtolower(trim((string)($_GET[$chiave] ?? '')));
    if (in_array($v, $ammesse, true)) { return $v; }
    $sal = stile_salvato();
    $v2 = strtolower((string)($sal[$dai_dati] ?? ''));
    return in_array($v2, $ammesse, true) ? $v2 : $ammesse[0];
}

$sal      = stile_salvato();
$formato  = strtolower(trim((string)($_GET['f'] ?? 'png')));
if (!in_array($formato, ['svg','png','jpg'], true)) { $formato = 'png'; }
$lato     = (int)($_GET['s'] ?? 1024);
if ($lato < 200)  { $lato = 200; }
if ($lato > 4096) { $lato = 4096; }
$cPunti   = col('c',  'colore',        'D42B2B');
$cPunti2  = strtoupper((string)preg_replace('/[^0-9A-Fa-f]/', '', (string)($_GET['c2'] ?? '')));
if (strlen($cPunti2) !== 6) { $cPunti2 = ''; }          // vuoto = tinta unita
$cAngoli  = col('ca', 'colore_angoli', $cPunti);
$cPupilla = strtoupper((string)preg_replace('/[^0-9A-Fa-f]/', '', (string)($_GET['cp'] ?? '')));
if (strlen($cPupilla) !== 6) { $cPupilla = $cAngoli; }
$fPunti   = forma('fp','forma_punti',  FORME_PUNTI);
$fAngoli  = forma('fa','forma_angoli', FORME_ANGOLI);
$logo     = strtolower(trim((string)($_GET['lg'] ?? ($sal['logo'] ?? 'poilove'))));
if ($logo === 'nostro') { $logo = 'poilove'; }           // vecchio nome, resta valido
if (!in_array($logo, ['poilove','poivoice','nessuno'], true)) { $logo = 'poilove'; }
$logoQuota = (int)($_GET['lq'] ?? ($sal['logo_quota'] ?? 22));
if ($logoQuota < 10) { $logoQuota = 10; }
if ($logoQuota > 30) { $logoQuota = 30; }
$margine  = (int)($_GET['m'] ?? ($sal['margine'] ?? 4));
if ($margine < 0) { $margine = 0; }
if ($margine > 6) { $margine = 6; }
$scritta  = trim((string)($_GET['t'] ?? ''));
if (mb_strlen($scritta) > 60) { $scritta = mb_substr($scritta, 0, 60); }

// lo sfondo: trasparente vale solo per PNG e SVG, il JPG non sa cosa sia
$sfondoIn = strtolower(trim((string)($_GET['sf'] ?? 'bianco')));
if ($sfondoIn === 'trasparente') {
    $cSfondo = null;
} elseif ($sfondoIn === 'bianco' || $sfondoIn === '') {
    $cSfondo = 'FFFFFF';
} else {
    $c = strtoupper((string)preg_replace('/[^0-9A-Fa-f]/', '', $sfondoIn));
    $cSfondo = strlen($c) === 6 ? $c : 'FFFFFF';
}
if ($formato === 'jpg' && $cSfondo === null) { $cSfondo = 'FFFFFF'; }

// ── La griglia. Correzione alta (H): col marchio in mezzo si perde un pezzo
//    di codice, e con H se ne puo perdere fino a un terzo senza danno. ───────
$qrencode = trim((string)shell_exec('command -v qrencode'));
if ($qrencode === '') { http_response_code(500); exit('generatore non installato'); }
$ascii = shell_exec('timeout 15 ' . $qrencode . ' -t ASCII -m 0 -l H -o - ' . escapeshellarg($dato) . ' 2>/dev/null');
if (!is_string($ascii) || trim($ascii) === '') { http_response_code(500); exit('non sono riuscito a fare il codice'); }

$griglia = [];
foreach (explode("\n", trim($ascii)) as $r) {
    if ($r === '') { continue; }
    $riga = [];
    $len = strlen(rtrim($r, "\r"));
    for ($i = 0; $i < $len; $i += 2) { $riga[] = ($r[$i] === '#'); }
    $griglia[] = $riga;
}
$n = count($griglia);
if ($n < 21) { http_response_code(500); exit('codice non valido'); }

// ── Il disegno, in vettoriale ──────────────────────────────────────────────
// Si lavora in una griglia di N+2*margine unita: l'SVG poi si scala a piacere.
$N = $n + $margine * 2;

$dentroAngolo = static function (int $y, int $x) use ($n): bool {
    return ($y < 7 && $x < 7) || ($y < 7 && $x >= $n - 7) || ($y >= $n - 7 && $x < 7);
};

// Un modulo, disegnato dentro il suo quadratino di lato 1.
$modulo = static function (float $x, float $y, string $f): string {
    $x = round($x, 3); $y = round($y, 3);
    switch ($f) {
        case 'tondo':
            return sprintf('<circle cx="%.3f" cy="%.3f" r="0.46"/>', $x + 0.5, $y + 0.5);
        case 'arrotondato':
            return sprintf('<rect x="%.3f" y="%.3f" width="0.92" height="0.92" rx="0.3"/>', $x + 0.04, $y + 0.04);
        case 'rombo':
            return sprintf('<path d="M%.3f %.3f L%.3f %.3f L%.3f %.3f L%.3f %.3f Z"/>',
                $x + 0.5, $y + 0.04, $x + 0.96, $y + 0.5, $x + 0.5, $y + 0.96, $x + 0.04, $y + 0.5);
        case 'goccia':
            // tondo con un angolo vivo in alto a sinistra: da carattere senza
            // togliere leggibilita', perche' il baricentro resta al centro
            return sprintf('<path d="M%.3f %.3f L%.3f %.3f A0.46 0.46 0 1 1 %.3f %.3f Z"/>',
                $x + 0.04, $y + 0.04, $x + 0.5, $y + 0.04, $x + 0.04, $y + 0.5);
        default:
            return sprintf('<rect x="%.3f" y="%.3f" width="1.02" height="1.02"/>', $x, $y);
    }
};

// I tre quadrati agli angoli: cornice, buco, pupilla. Sono quelli che il
// telefono cerca per primi, quindi la forma si puo' addolcire ma non stravolgere.
$occhio = static function (float $x, float $y, string $f, string $cCornice, string $cPupilla, ?string $cBuco): string {
    // Un rettangolo con gli angoli tondi, scritto come percorso: serve poter
    // fare l'anello in un pezzo solo. Col buco dipinto sopra, su sfondo
    // trasparente il ritaglio non avveniva e il codice diventava illeggibile.
    $rett = static function (float $ax, float $ay, float $l, float $rad, bool $orario = true) : string {
        $rad = max(0.0, min($rad, $l / 2.0));
        if ($rad <= 0.001) {
            return $orario
                ? sprintf('M%.3f %.3f H%.3f V%.3f H%.3f Z', $ax, $ay, $ax + $l, $ay + $l, $ax)
                : sprintf('M%.3f %.3f V%.3f H%.3f V%.3f Z', $ax, $ay, $ay + $l, $ax + $l, $ay);
        }
        if ($orario) {
            return sprintf('M%.3f %.3f H%.3f A%.3f %.3f 0 0 1 %.3f %.3f V%.3f A%.3f %.3f 0 0 1 %.3f %.3f H%.3f A%.3f %.3f 0 0 1 %.3f %.3f V%.3f A%.3f %.3f 0 0 1 %.3f %.3f Z',
                $ax + $rad, $ay, $ax + $l - $rad, $rad, $rad, $ax + $l, $ay + $rad,
                $ay + $l - $rad, $rad, $rad, $ax + $l - $rad, $ay + $l,
                $ax + $rad, $rad, $rad, $ax, $ay + $l - $rad,
                $ay + $rad, $rad, $rad, $ax + $rad, $ay);
        }
        return sprintf('M%.3f %.3f A%.3f %.3f 0 0 0 %.3f %.3f V%.3f A%.3f %.3f 0 0 0 %.3f %.3f H%.3f A%.3f %.3f 0 0 0 %.3f %.3f V%.3f A%.3f %.3f 0 0 0 %.3f %.3f Z',
            $ax + $rad, $ay, $rad, $rad, $ax, $ay + $rad,
            $ay + $l - $rad, $rad, $rad, $ax + $rad, $ay + $l,
            $ax + $l - $rad, $rad, $rad, $ax + $l, $ay + $l - $rad,
            $ay + $rad, $rad, $rad, $ax + $l - $rad, $ay);
    };
    // La foglia: due angoli tondi opposti e due vivi. Arrotondarli tutti e
    // quattro rendeva il codice illeggibile, provato con un lettore vero.
    $foglia = static function (float $ax, float $ay, float $l, float $rad, bool $orario = true) : string {
        $rad = max(0.0, min($rad, $l / 2.0));
        if ($orario) {
            return sprintf('M%.3f %.3f H%.3f V%.3f A%.3f %.3f 0 0 1 %.3f %.3f H%.3f V%.3f A%.3f %.3f 0 0 1 %.3f %.3f Z',
                $ax + $rad, $ay, $ax + $l, $ay + $l - $rad, $rad, $rad, $ax + $l - $rad, $ay + $l,
                $ax, $ay + $rad, $rad, $rad, $ax + $rad, $ay);
        }
        return sprintf('M%.3f %.3f A%.3f %.3f 0 0 0 %.3f %.3f V%.3f H%.3f A%.3f %.3f 0 0 0 %.3f %.3f V%.3f H%.3f Z',
            $ax + $rad, $ay, $rad, $rad, $ax, $ay + $rad,
            $ay + $l, $ax + $l - $rad, $rad, $rad, $ax + $l, $ay + $l - $rad,
            $ay, $ax + $rad);
    };

    $raggi = ['quadrato' => 0.0, 'arrotondato' => 1.6, 'tondo' => 2.6, 'cuscino' => 2.1, 'foglia' => 2.5];
    $rr = $raggi[$f] ?? 0.0;
    $disegna = ($f === 'foglia') ? $foglia : $rett;

    // L'anello: bordo esterno in un verso e buco nell'altro, riempimento a
    // regola alternata. Cosi' il buco e' vuoto davvero, anche senza sfondo.
    $fuori  = $disegna($x, $y, 7.0, $rr, true);
    $dentro = $disegna($x + 1.0, $y + 1.0, 5.0, $rr * 5.0 / 7.0, false);
    $out  = '<path fill="#' . $cCornice . '" fill-rule="evenodd" d="' . $fuori . ' ' . $dentro . '"/>';
    $out .= '<path fill="#' . $cPupilla . '" d="' . $disegna($x + 2.0, $y + 2.0, 3.0, $rr * 3.0 / 7.0, true) . '"/>';
    return $out;
};

$punti = '';
for ($y = 0; $y < $n; $y++) {
    for ($x = 0; $x < count($griglia[$y]); $x++) {
        if (!$griglia[$y][$x]) { continue; }
        if ($dentroAngolo($y, $x)) { continue; }
        $punti .= $modulo((float)($x + $margine), (float)($y + $margine), $fPunti);
    }
}

// il marchio in mezzo, preso dal file vero e messo dentro come immagine
$marchio = '';
if ($logo !== 'nessuno') {
    $file = __DIR__ . '/marchi/' . $logo . '.svg';
    if (is_file($file)) {
        $svgLogo = (string)file_get_contents($file);
        $q  = $N * $logoQuota / 100.0;          // lato del marchio in unita di griglia
        $q  = min($q, $N * 0.30);
        $cx = ($N - $q) / 2.0;
        // la piazzola sotto: se lo sfondo e' trasparente resta trasparente, e
        // il marchio si stacca lo stesso perche' i moduli sotto non ci sono
        $piazzola = $cSfondo !== null
            ? sprintf('<rect x="%.3f" y="%.3f" width="%.3f" height="%.3f" rx="%.3f" fill="#%s"/>',
                      $cx - 0.6, $cx - 0.6, $q + 1.2, $q + 1.2, $q * 0.18, $cSfondo)
            : '';
        // Il marchio si innesta: si prende il suo riquadro e il suo contenuto e
        // si mettono dentro un <svg> annidato. Passandolo come immagine il
        // motore lo appiattiva e veniva sfocato.
        $vb = '0 0 100 100';
        if (preg_match('/viewBox="([^"]+)"/i', $svgLogo, $mm)) { $vb = $mm[1]; }
        $dentro = $svgLogo;
        if (preg_match('/<svg[^>]*>(.*)<\/svg>/is', $svgLogo, $mm2)) { $dentro = $mm2[1]; }
        $dentro = preg_replace('/<\?xml[^>]*\?>/i', '', (string)$dentro);
        $dentro = preg_replace('/<!--.*?-->/s', '', (string)$dentro);
        $marchio = $piazzola . sprintf(
            '<svg x="%.3f" y="%.3f" width="%.3f" height="%.3f" viewBox="%s" preserveAspectRatio="xMidYMid meet" overflow="visible">%s</svg>',
            $cx, $cx, $q, $q, htmlspecialchars($vb, ENT_QUOTES | ENT_XML1, 'UTF-8'), $dentro);
    }
}

// la sfumatura sui punti, se ne e' stato chiesto un secondo colore
$riempimento = '#' . $cPunti;
$difese = '';
if ($cPunti2 !== '') {
    $difese = '<linearGradient id="sfuma" x1="0" y1="0" x2="1" y2="1">'
            . '<stop offset="0%" stop-color="#' . $cPunti . '"/>'
            . '<stop offset="100%" stop-color="#' . $cPunti2 . '"/></linearGradient>';
    $riempimento = 'url(#sfuma)';
}

$altezzaScritta = $scritta !== '' ? 3.2 : 0.0;
$hTot = $N + $altezzaScritta;

$svg  = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
$svg .= sprintf('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 %d %.2f" width="%d" height="%d" shape-rendering="geometricPrecision">',
                $N, $hTot, $lato, (int)round($lato * $hTot / $N));
$svg .= '<defs>' . $difese . '</defs>';
if ($cSfondo !== null) {
    $svg .= sprintf('<rect width="%d" height="%.2f" fill="#%s"/>', $N, $hTot, $cSfondo);
}
$svg .= '<g fill="' . $riempimento . '">' . $punti . '</g>';
$svg .= $occhio((float)$margine, (float)$margine, $fAngoli, $cAngoli, $cPupilla, $cSfondo);
$svg .= $occhio((float)($n - 7 + $margine), (float)$margine, $fAngoli, $cAngoli, $cPupilla, $cSfondo);
$svg .= $occhio((float)$margine, (float)($n - 7 + $margine), $fAngoli, $cAngoli, $cPupilla, $cSfondo);
$svg .= $marchio;
if ($scritta !== '') {
    $svg .= sprintf('<text x="%.2f" y="%.2f" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="1.6" font-weight="700" fill="#%s">%s</text>',
        $N / 2.0, $N + 2.0, $cPunti, htmlspecialchars($scritta, ENT_QUOTES | ENT_XML1, 'UTF-8'));
}
$svg .= '</svg>';

// ── Consegna ───────────────────────────────────────────────────────────────
$nomeFile = 'poilove-qr';
if ($formato === 'svg') {
    header('Content-Type: image/svg+xml; charset=utf-8');
    header('Content-Disposition: inline; filename="' . $nomeFile . '.svg"');
    header('Cache-Control: public, max-age=3600');
    echo $svg;
    exit;
}

// PNG e JPG: il disegno vettoriale viene messo su carta da un motore che sa
// fare le curve. Cosi' i bordi non sono mai seghettati, a nessuna dimensione.
$rsvg = trim((string)shell_exec('command -v rsvg-convert'));
if ($rsvg === '') { http_response_code(500); exit('manca il motore di disegno'); }

$tmpSvg = tempnam(sys_get_temp_dir(), 'qr') . '.svg';
$tmpPng = $tmpSvg . '.png';
file_put_contents($tmpSvg, $svg);
$hPng = (int)round($lato * $hTot / $N);
$cmd = sprintf('timeout 20 %s --width=%d --height=%d --format=png --output=%s %s 2>/dev/null',
               $rsvg, $lato, $hPng, escapeshellarg($tmpPng), escapeshellarg($tmpSvg));
shell_exec($cmd);

if (!is_file($tmpPng) || filesize($tmpPng) < 100) {
    @unlink($tmpSvg); @unlink($tmpPng);
    http_response_code(500); exit('non sono riuscito a disegnarlo');
}

if ($formato === 'png') {
    header('Content-Type: image/png');
    header('Content-Disposition: inline; filename="' . $nomeFile . '.png"');
    header('Cache-Control: public, max-age=3600');
    readfile($tmpPng);
    @unlink($tmpSvg); @unlink($tmpPng);
    exit;
}

// JPG: si appoggia su un fondo pieno, perche' il JPG non ha trasparenza
$src = @imagecreatefrompng($tmpPng);
if (!$src) { @unlink($tmpSvg); @unlink($tmpPng); http_response_code(500); exit('non sono riuscito a convertirlo'); }
$w = imagesx($src); $h = imagesy($src);
$out = imagecreatetruecolor($w, $h);
$rr = (int)hexdec(substr($cSfondo, 0, 2));
$gg = (int)hexdec(substr($cSfondo, 2, 2));
$bb = (int)hexdec(substr($cSfondo, 4, 2));
imagefilledrectangle($out, 0, 0, $w, $h, imagecolorallocate($out, $rr, $gg, $bb));
imagecopy($out, $src, 0, 0, 0, 0, $w, $h);
header('Content-Type: image/jpeg');
header('Content-Disposition: inline; filename="' . $nomeFile . '.jpg"');
header('Cache-Control: public, max-age=3600');
imagejpeg($out, null, 92);
imagedestroy($src); imagedestroy($out);
@unlink($tmpSvg); @unlink($tmpPng);
