<?php
// =============================================================================
// © Alessandro Castagna — 321.al / EVOLAB
// Tutti i diritti riservati. Uso non autorizzato vietato.
// info@321.it · https://321.al
// =============================================================================
// POI•LOVE — media.poilove.com — qr.php
//
// I QR li facciamo noi. Prima li disegnava un servizio esterno: ogni codice
// usciva da casa nostra e il giorno che quel servizio chiude i cartelli in
// vetrina smettono di funzionare.
//
// GET /qr.php?d=<indirizzo>&s=<lato in punti>&c=<colore>&t=<scritta sotto>
//   d  l'indirizzo da mettere dentro (obbligatorio, solo poilove.com)
//   s  600 di schermo, 1800 per la stampa (max 2400)
//   c  rosso (D42B2B, di casa) oppure blu (285EA7)
//   t  una riga di testo sotto il codice, per la stampa
//
// Risposta: un PNG. Correzione d'errore alta: il codice resta leggibile anche
// con il marchio in mezzo, o con una macchia sul cartello.
// =============================================================================

declare(strict_types=1);

$dato = (string)($_GET['d'] ?? '');
if ($dato === '' || strlen($dato) > 900) { http_response_code(400); exit('indirizzo mancante'); }

// Si disegnano solo indirizzi di casa: il QR di POI•LOVE non porta altrove.
$host = parse_url($dato, PHP_URL_HOST);
if (!$host || !preg_match('/(^|\.)poilove\.com$/i', $host)) {
    http_response_code(400); exit('questo QR porterebbe fuori da POI-LOVE');
}

$lato = (int)($_GET['s'] ?? 600);
if ($lato < 200)  { $lato = 200; }
if ($lato > 2400) { $lato = 2400; }

$colore = strtoupper(preg_replace('/[^0-9A-Fa-f]/', '', (string)($_GET['c'] ?? 'D42B2B')));
if (strlen($colore) !== 6) { $colore = 'D42B2B'; }

$scritta = trim((string)($_GET['t'] ?? ''));
if (mb_strlen($scritta) > 60) { $scritta = mb_substr($scritta, 0, 60); }

$qrencode = trim((string)shell_exec('command -v qrencode'));
if ($qrencode === '') { http_response_code(500); exit('generatore non installato'); }

// ── Il codice ───────────────────────────────────────────────────────────────
$tmp = tempnam(sys_get_temp_dir(), 'qr') . '.png';
$cmd = $qrencode . ' -o ' . escapeshellarg($tmp)
     . ' -s 20 -m 2 -l H'                       // correzione alta: regge il marchio in mezzo
     . ' --foreground=' . escapeshellarg($colore)
     . ' --background=FFFFFF'
     . ' ' . escapeshellarg($dato) . ' 2>&1';
shell_exec($cmd);
if (!file_exists($tmp) || filesize($tmp) < 100) { @unlink($tmp); http_response_code(500); exit('non sono riuscito a disegnare il codice'); }

$qr = imagecreatefrompng($tmp);
@unlink($tmp);
if (!$qr) { http_response_code(500); exit('immagine non leggibile'); }

$altezzaScritta = $scritta !== '' ? (int)round($lato * 0.13) : 0;
$foglio = imagecreatetruecolor($lato, $lato + $altezzaScritta);
$bianco = imagecolorallocate($foglio, 255, 255, 255);
imagefilledrectangle($foglio, 0, 0, $lato, $lato + $altezzaScritta, $bianco);
imagecopyresampled($foglio, $qr, 0, 0, 0, 0, $lato, $lato, imagesx($qr), imagesy($qr));
imagedestroy($qr);

// ── Il marchio in mezzo: un tondo bianco con il punto rosso di POI•LOVE ─────
$r  = (int)round($lato * 0.115);
$cx = (int)round($lato / 2);
$cy = (int)round($lato / 2);
imagefilledellipse($foglio, $cx, $cy, $r * 2, $r * 2, $bianco);
$rgb  = [hexdec(substr($colore,0,2)), hexdec(substr($colore,2,2)), hexdec(substr($colore,4,2))];
$tinta = imagecolorallocate($foglio, $rgb[0], $rgb[1], $rgb[2]);
imagefilledellipse($foglio, $cx, $cy, (int)round($r * 0.95), (int)round($r * 0.95), $tinta);
imagefilledellipse($foglio, $cx, $cy, (int)round($r * 0.55), (int)round($r * 0.55), $bianco);
imagefilledellipse($foglio, $cx, $cy, (int)round($r * 0.30), (int)round($r * 0.30), $tinta);

// ── La riga sotto, per la stampa ────────────────────────────────────────────
if ($scritta !== '') {
    $nero  = imagecolorallocate($foglio, 20, 20, 20);
    $corpo = 5;
    $largo = imagefontwidth($corpo) * strlen($scritta);
    $x = max(4, (int)round(($lato - $largo) / 2));
    $y = $lato + (int)round($altezzaScritta / 2) - imagefontheight($corpo) / 2;
    imagestring($foglio, $corpo, $x, (int)$y, $scritta, $nero);
}

header('Content-Type: image/png');
header('Cache-Control: public, max-age=86400');
imagepng($foglio);
imagedestroy($foglio);
