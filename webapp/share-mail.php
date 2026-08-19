<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * https://321.al
 */
// Invia per email un luogo del cuore, col vestito POI•LOVE.
//
// Regole di sicurezza (riscritto il 19/08 dopo revisione avversariale, 21 rilievi):
//  - il NOME di chi manda lo decide il server dall'identita' verificata, mai il chiamante:
//    cosi la casella no-reply@poilove.com non puo' essere usata per travestimenti;
//  - l'oggetto e' una frase fissa nostra, il testo libero sta solo nel corpo, ripulito
//    da indirizzi web e da caratteri di controllo;
//  - il tetto giornaliero si conta PRIMA di spedire, con blocco esclusivo del file:
//    se non riusciamo a contare, non spediamo (mai aperto in caso di guasto);
//  - il dialogo con la posta ha tempi massimi veri e legge le risposte per intero.

header('Content-Type: application/json; charset=utf-8');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(405); echo '{"error":"metodo"}'; exit; }

$CREDS_FILE = '/var/www/poilove/private/mail-creds';
$RATE_DIR   = '/var/www/poilove/private/mailshare';
$LOG_FILE   = '/var/www/poilove/private/mailshare/registro.log';
$RATE_MAX   = 20;

function fine($codice, $errore) { http_response_code($codice); echo json_encode(['error' => $errore]); exit; }
function nota($riga) { global $LOG_FILE; @file_put_contents($LOG_FILE, gmdate('c') . ' ' . $riga . "\n", FILE_APPEND); }
function testo_pulito($v, $max) {
    if (!is_string($v)) return '';
    $v = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $v);        // niente caratteri di controllo (iniezioni)
    $v = preg_replace('#\b(?:https?://|www\.)\S+#iu', '', $v); // niente indirizzi web nel testo libero
    $v = trim(preg_replace('/\s+/u', ' ', $v));
    return mb_substr($v, 0, $max);
}

// ── 1. chi sei: il token deve valere per il nostro servizio accessi ──
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!preg_match('/^Bearer\s+[A-Za-z0-9._-]+$/', $auth)) fine(401, 'accesso');
$ctx = stream_context_create(['http' => ['method' => 'GET', 'timeout' => 8,
    'header' => "Authorization: $auth\r\n", 'ignore_errors' => true]]);
$u = @file_get_contents('http://127.0.0.1:9999/user', false, $ctx);
$user = $u ? json_decode($u, true) : null;
if (!is_array($user) || empty($user['id']) || empty($user['email'])) fine(401, 'accesso');
if (!preg_match('/^[0-9a-fA-F-]{36}$/', (string)$user['id'])) fine(401, 'accesso');

// Il nome di chi manda lo decide il SERVER dall'identita' verificata.
$meta = is_array($user['user_metadata'] ?? null) ? $user['user_metadata'] : [];
$mittente = '';
foreach (['display_name', 'name', 'username', 'full_name'] as $k) {
    if (!empty($meta[$k]) && is_string($meta[$k])) { $mittente = testo_pulito($meta[$k], 40); break; }
}
if ($mittente === '') $mittente = testo_pulito(strtok((string)$user['email'], '@'), 40);
if ($mittente === '') $mittente = 'POI•LOVE';

// ── 2. cosa mandi ──
$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) fine(400, 'dati');
$to      = is_string($in['to'] ?? null) ? trim($in['to']) : '';
$place   = testo_pulito($in['place'] ?? '', 80);
$address = testo_pulito($in['address'] ?? '', 140);
$nomeDest = testo_pulito($in['name'] ?? '', 40);   // nome di chi riceve: solo nel saluto, mai nell'oggetto
$lat     = is_numeric($in['lat'] ?? null) ? (float)$in['lat'] : null;
$lng     = is_numeric($in['lng'] ?? null) ? (float)$in['lng'] : null;
$lang    = (isset($in['lang']) && is_string($in['lang']) && in_array($in['lang'], ['sq', 'it', 'en'], true)) ? $in['lang'] : 'en';
if (!filter_var($to, FILTER_VALIDATE_EMAIL) || mb_strlen($to) > 254) fine(400, 'destinatario');
if ($place === '' || $lat === null || $lng === null) fine(400, 'dati');
if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) fine(400, 'dati');

// Se il destinatario e' gia' iscritto, la sua lingua vince su quella di chi manda.
$dc = @file_get_contents('/var/www/poilove/private/db-creds');
if (is_string($dc) && strpos($dc, ':') !== false) {
    [$dbU, $dbP] = explode(':', trim($dc), 2);
    try {
        $pdo = new PDO('pgsql:host=127.0.0.1;port=5433;dbname=poilove', $dbU, $dbP,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5]);
        $q = $pdo->prepare("SELECT raw_user_meta_data->>'lang' FROM auth.users WHERE lower(email) = lower(:e) LIMIT 1");
        $q->execute([':e' => $to]);
        $suaLingua = $q->fetchColumn();
        if (in_array($suaLingua, ['sq', 'it', 'en'], true)) $lang = $suaLingua;
    } catch (Throwable $t) { /* se il database non risponde, resta la lingua di chi manda */ }
}

// ── 3. tetto giornaliero: contato PRIMA di spedire, con blocco esclusivo ──
if (!is_dir($RATE_DIR) && !@mkdir($RATE_DIR, 0770, true)) { nota('tetto: cartella non creata'); fine(500, 'tetto'); }
$rf = $RATE_DIR . '/' . preg_replace('/[^0-9a-fA-F-]/', '', (string)$user['id']) . '.json';
$fh = @fopen($rf, 'c+');
if (!$fh || !flock($fh, LOCK_EX)) { nota('tetto: file non bloccabile ' . $rf); fine(500, 'tetto'); }
$oggi = gmdate('Y-m-d');
$r = json_decode((string)stream_get_contents($fh), true);
if (!is_array($r) || ($r['day'] ?? '') !== $oggi) $r = ['day' => $oggi, 'count' => 0];
if ((int)$r['count'] >= $RATE_MAX) { flock($fh, LOCK_UN); fclose($fh); fine(429, 'tetto'); }
$r['count'] = (int)$r['count'] + 1;                       // prenoto il posto PRIMA di spedire
rewind($fh); ftruncate($fh, 0);
if (fwrite($fh, json_encode($r)) === false) { flock($fh, LOCK_UN); fclose($fh); nota('tetto: scrittura fallita'); fine(500, 'tetto'); }
fflush($fh); flock($fh, LOCK_UN); fclose($fh);
$scala_tetto = function () use ($rf) {                    // se poi non spedisco, restituisco il posto
    $f = @fopen($rf, 'c+'); if (!$f) return;
    if (flock($f, LOCK_EX)) {
        $d = json_decode((string)stream_get_contents($f), true);
        if (is_array($d) && ($d['count'] ?? 0) > 0) { $d['count']--; rewind($f); ftruncate($f, 0); fwrite($f, json_encode($d)); fflush($f); }
        flock($f, LOCK_UN);
    }
    fclose($f);
};

// ── 4. il vestito, nella lingua scelta da chi manda ──
// L'invito di chi manda viaggia col link: se il destinatario si iscrive da qui,
// i punti vanno a tutti e due (regola degli inviti, 19/08).
$handle = '';
foreach (['username', 'handle', 'display_name'] as $k) {
    if (!empty($meta[$k]) && is_string($meta[$k])) { $handle = $meta[$k]; break; }
}
if ($handle === '' && isset($in['handle']) && is_string($in['handle'])) $handle = $in['handle'];
$handle = preg_replace('/[^A-Za-z0-9._-]/', '', (string)$handle);
$url = 'https://poilove.com/?lat=' . rawurlencode(number_format($lat, 6, '.', ''))
     . '&lng=' . rawurlencode(number_format($lng, 6, '.', ''))
     . '&label=' . rawurlencode($place)
     . ($handle !== '' ? '&ref=' . rawurlencode(mb_substr($handle, 0, 40)) : '');
$D = [
  'sq' => ['sub' => 'të dërgon një vend zemre · POI•LOVE', 'line' => 'të dërgon një vend zemre:', 'ciao' => 'Përshëndetje',
           'btn' => 'HAPE NË HARTË', 'fall' => 'Nëse butoni nuk punon, kopjo këtë link në shfletues:',
           'ign' => 'Nëse nuk e prisje këtë email, injoroje.'],
  'it' => ['sub' => 'ti manda un luogo del cuore · POI•LOVE', 'line' => 'ti manda un luogo del cuore:', 'ciao' => 'Ciao',
           'btn' => 'APRILO SULLA MAPPA', 'fall' => 'Se il bottone non funziona, copia questo link nel browser:',
           'ign' => "Se non aspettavi questa email, ignorala."],
  'en' => ['sub' => 'sends you a beloved place · POI•LOVE', 'line' => 'sends you a beloved place:', 'ciao' => 'Hi',
           'btn' => 'OPEN IT ON THE MAP', 'fall' => 'If the button does not work, copy this link into your browser:',
           'ign' => 'If you were not expecting this email, ignore it.'],
];
$T = $D[$lang];
$e = function ($x) { return htmlspecialchars((string)$x, ENT_QUOTES, 'UTF-8'); };
$html = '<!DOCTYPE html><html lang="' . $lang . '"><head><meta charset="utf-8"></head>'
 . '<body style="margin:0;padding:0;background-color:#EAE4D8;">'
 . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EAE4D8;padding:24px 12px;"><tr><td align="center">'
 . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;">'
 . '<tr><td style="background-color:#D42B2B;padding:26px 28px 22px;text-align:center;">'
 . '<img src="https://poilove.com/img/logo-bianco.png" alt="POI&#8226;LOVE" width="200" style="width:200px;max-width:80%;height:auto;border:0;display:inline-block;"></td></tr>'
 . '<tr><td style="padding:30px 28px 4px;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c;text-align:center;">'
 . ($nomeDest !== '' ? '<p style="margin:0 0 12px;font-size:17px;font-weight:800;">' . $e($T['ciao']) . ' ' . $e($nomeDest) . ',</p>' : '')
 . '<p style="margin:0 0 6px;font-size:15px;color:#8a8a8a;"><strong style="color:#1c1c1c;">' . $e($mittente) . '</strong> ' . $e($T['line']) . '</p>'
 . '<p style="margin:10px 0 4px;font-size:22px;line-height:1.3;font-weight:800;">' . $e($place) . '</p>'
 . ($address !== '' ? '<p style="margin:0;font-size:14px;color:#8a8a8a;">' . $e($address) . '</p>' : '')
 . '</td></tr>'
 . '<tr><td align="center" style="padding:22px 28px 10px;">'
 . '<a href="' . $e($url) . '" style="display:inline-block;background-color:#D42B2B;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;text-decoration:none;padding:15px 36px;border-radius:99px;letter-spacing:.5px;">' . $e($T['btn']) . '</a></td></tr>'
 . '<tr><td style="padding:12px 28px 6px;font-family:Arial,Helvetica,sans-serif;color:#8a8a8a;font-size:12px;text-align:center;">'
 . $e($T['fall']) . '<br><a href="' . $e($url) . '" style="color:#D42B2B;word-break:break-all;font-size:11px;">' . $e($url) . '</a></td></tr>'
 . '<tr><td style="padding:16px 28px 26px;font-family:Arial,Helvetica,sans-serif;color:#b0a99c;font-size:11px;text-align:center;border-top:1px solid #f0ece3;">'
 . $e($T['ign']) . '<br><strong style="color:#8a8a8a;">POI&#8226;LOVE</strong> &#183; poilove.com</td></tr>'
 . '</table></td></tr></table></body></html>';
$testo = ($nomeDest !== '' ? $T['ciao'] . ' ' . $nomeDest . ",\n\n" : '')
       . $mittente . ' ' . $T['line'] . "\n\n" . $place . ($address !== '' ? "\n" . $address : '')
       . "\n\n" . $T['btn'] . ":\n" . $url . "\n\n" . $T['ign'] . "\nPOI-LOVE - poilove.com\n";

// ── 5. invio dalla nostra casella ──
$c = @file_get_contents($CREDS_FILE);
if (!is_string($c) || strpos($c, ':') === false) { $scala_tetto(); nota('posta: credenziali illeggibili'); fine(500, 'posta'); }
[$smtpUser, $smtpPass] = explode(':', trim($c), 2);

// Legge una risposta SMTP INTERA (anche su piu' righe) e ne restituisce il codice, o 0 se la lettura fallisce.
function smtp_codice($fp) {
    $codice = 0;
    while (true) {
        $l = fgets($fp, 2048);
        $m = stream_get_meta_data($fp);
        if ($l === false || !empty($m['timed_out'])) return 0;      // niente risposta: NON e' un successo
        if (!preg_match('/^(\d{3})([ -])/', $l, $mm)) return 0;
        $codice = (int)$mm[1];
        if ($mm[2] === ' ') return $codice;                          // riga terminale
    }
}

$fp = @stream_socket_client('ssl://mail.themeli.al:465', $errno, $errstr, 15);
if (!$fp) { $scala_tetto(); nota('posta: connessione fallita ' . $errno . ' ' . $errstr); fine(502, 'invio'); }
stream_set_timeout($fp, 25);                                          // tempo massimo VERO su ogni lettura

$passo = function ($cmd, $atteso) use ($fp) {
    if ($cmd !== null) fwrite($fp, $cmd . "\r\n");
    return smtp_codice($fp) === $atteso;
};
$ok = ($passo(null, 220))
   && $passo('EHLO poilove.com', 250)
   && $passo('AUTH LOGIN', 334)
   && $passo(base64_encode($smtpUser), 334)
   && $passo(base64_encode($smtpPass), 235)
   && $passo('MAIL FROM:<' . $smtpUser . '>', 250)
   && $passo('RCPT TO:<' . $to . '>', 250)
   && $passo('DATA', 354);
if (!$ok) { @fclose($fp); $scala_tetto(); nota('posta: dialogo interrotto verso ' . $to); fine(502, 'invio'); }

$bnd = 'plb' . bin2hex(random_bytes(8));
$msg  = 'From: =?UTF-8?B?' . base64_encode('POI•LOVE') . "?= <{$smtpUser}>\r\n";
$msg .= 'To: <' . $to . ">\r\n";
$msg .= 'Subject: =?UTF-8?B?' . base64_encode($mittente . ' ' . $T['sub']) . "?=\r\n";
$msg .= "MIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary=\"$bnd\"\r\n\r\n";
$msg .= "--$bnd\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($testo));
$msg .= "\r\n--$bnd\r\nContent-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html));
$msg .= "\r\n--$bnd--";
fwrite($fp, $msg . "\r\n.\r\n");

// Dopo il punto finale il messaggio e' gia' in mano al server: se la risposta non arriva
// NON dichiaro errore (il cliente rimanderebbe due volte la stessa email), lo annoto.
$fin = smtp_codice($fp);
@fwrite($fp, "QUIT\r\n"); @fclose($fp);
if ($fin === 250) { nota('inviata a ' . $to . ' da ' . $user['email']); echo '{"ok":true}'; exit; }
if ($fin === 0)   { nota('DUBBIA (nessuna risposta finale) a ' . $to); echo '{"ok":true,"dubbia":true}'; exit; }
$scala_tetto();
nota('rifiutata (' . $fin . ') a ' . $to);
fine(502, 'invio');
