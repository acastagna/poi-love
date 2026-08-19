<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * https://321.al
 */
// Invia per email un luogo del cuore, con il vestito POI•LOVE, nella lingua scelta.
// Sicurezza: solo utenti loggati (verifica del token via GoTrue locale),
// tetto giornaliero per utente, destinatario validato, credenziali SMTP fuori dal repo.

header('Content-Type: application/json; charset=utf-8');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(405); echo '{"error":"metodo"}'; exit; }

$CREDS_FILE = '/var/www/poilove/private/mail-creds';       // formato casella:password, mai nel repo
$RATE_DIR   = '/var/www/poilove/private/mailshare';
$RATE_MAX   = 20;                                           // email al giorno per utente

// ── 1. chi sei? il token deve essere valido per il nostro servizio accessi ──
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!preg_match('/^Bearer\s+\S+/', $auth)) { http_response_code(401); echo '{"error":"accesso"}'; exit; }
$ctx = stream_context_create(['http' => ['method' => 'GET', 'timeout' => 8,
    'header' => "Authorization: $auth\r\n", 'ignore_errors' => true]]);
$u = @file_get_contents('http://127.0.0.1:9999/user', false, $ctx);
$user = $u ? json_decode($u, true) : null;
if (!$user || empty($user['id']) || empty($user['email'])) { http_response_code(401); echo '{"error":"accesso"}'; exit; }

// ── 2. cosa mandi? ──
$in = json_decode(file_get_contents('php://input'), true) ?: [];
$to      = trim($in['to'] ?? '');
$place   = mb_substr(trim($in['place'] ?? ''), 0, 80);
$address = mb_substr(trim($in['address'] ?? ''), 0, 140);
$lat     = floatval($in['lat'] ?? 0);
$lng     = floatval($in['lng'] ?? 0);
$lang    = in_array($in['lang'] ?? '', ['sq', 'it', 'en']) ? $in['lang'] : 'en';
if (!filter_var($to, FILTER_VALIDATE_EMAIL) || $place === '' || !$lat || !$lng) {
    http_response_code(400); echo '{"error":"dati"}'; exit;
}

// ── 3. tetto giornaliero ──
@mkdir($RATE_DIR, 0700, true);
$rf = $RATE_DIR . '/' . preg_replace('/[^a-f0-9-]/', '', $user['id']) . '.json';
$r = @json_decode(@file_get_contents($rf), true) ?: [];
$oggi = gmdate('Y-m-d');
if (($r['day'] ?? '') !== $oggi) $r = ['day' => $oggi, 'count' => 0];
if ($r['count'] >= $RATE_MAX) { http_response_code(429); echo '{"error":"tetto"}'; exit; }

// ── 4. il vestito, nella lingua giusta ──
$mittente = mb_substr(trim($in['sender'] ?? '') ?: strtok($user['email'], '@'), 0, 40);
$url = 'https://poilove.com/?lat=' . rawurlencode(number_format($lat, 6, '.', ''))
     . '&lng=' . rawurlencode(number_format($lng, 6, '.', ''))
     . '&label=' . rawurlencode($place);
$T = [
  'sq' => ['sub' => $mittente . ' të dërgon një vend zemre · POI•LOVE',
           'line' => 'të dërgon një vend zemre:',
           'btn' => 'HAPE NË HARTË',
           'fall' => 'Nëse butoni nuk punon, kopjo këtë link në shfletues:',
           'ign' => 'Nëse nuk e prisje këtë email, injoroje.'],
  'it' => ['sub' => $mittente . ' ti manda un luogo del cuore · POI•LOVE',
           'line' => 'ti manda un luogo del cuore:',
           'btn' => 'APRILO SULLA MAPPA',
           'fall' => 'Se il bottone non funziona, copia questo link nel browser:',
           'ign' => 'Se non aspettavi questa email, ignorala.'],
  'en' => ['sub' => $mittente . ' sends you a beloved place · POI•LOVE',
           'line' => 'sends you a beloved place:',
           'btn' => 'OPEN IT ON THE MAP',
           'fall' => 'If the button does not work, copy this link into your browser:',
           'ign' => 'If you were not expecting this email, ignore it.'],
][$lang];
$e = fn($x) => htmlspecialchars($x, ENT_QUOTES, 'UTF-8');
$html = '<!DOCTYPE html><html lang="' . $lang . '"><head><meta charset="utf-8"></head>'
 . '<body style="margin:0;padding:0;background-color:#EAE4D8;">'
 . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EAE4D8;padding:24px 12px;"><tr><td align="center">'
 . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;">'
 . '<tr><td style="background-color:#D42B2B;padding:26px 28px 22px;text-align:center;">'
 . '<img src="https://poilove.com/img/logo-bianco.png" alt="POI&#8226;LOVE" width="200" style="width:200px;max-width:80%;height:auto;border:0;display:inline-block;"></td></tr>'
 . '<tr><td style="padding:30px 28px 4px;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c;text-align:center;">'
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

// ── 5. invio dalla nostra casella via Stalwart ──
$c = trim(@file_get_contents($CREDS_FILE));
if (!$c || strpos($c, ':') === false) { http_response_code(500); echo '{"error":"posta"}'; exit; }
[$smtpUser, $smtpPass] = explode(':', $c, 2);

function smtp_ok($fp, $attesi) {
    $riga = '';
    while (($l = fgets($fp, 1024)) !== false) { $riga = $l; if (isset($l[3]) && $l[3] === ' ') break; }
    return in_array(intval(substr($riga, 0, 3)), $attesi);
}
$fp = @stream_socket_client('ssl://mail.themeli.al:465', $en1, $es1, 20);
$ok = $fp && smtp_ok($fp, [220]);
$cmd = function ($c2, $attesi) use ($fp) { fwrite($fp, $c2 . "\r\n"); return smtp_ok($fp, $attesi); };
$ok = $ok && $cmd('EHLO poilove.com', [250]);
$ok = $ok && $cmd('AUTH LOGIN', [334]) && $cmd(base64_encode($smtpUser), [334]) && $cmd(base64_encode($smtpPass), [235]);
$ok = $ok && $cmd('MAIL FROM:<' . $smtpUser . '>', [250]);
$ok = $ok && $cmd('RCPT TO:<' . $to . '>', [250]);
$ok = $ok && $cmd('DATA', [354]);
if ($ok) {
    $subB64 = '=?UTF-8?B?' . base64_encode($T['sub']) . '?=';
    $msg  = 'From: =?UTF-8?B?' . base64_encode('POI•LOVE') . "?= <{$smtpUser}>\r\n";
    $msg .= "To: <{$to}>\r\n";
    $msg .= "Subject: {$subB64}\r\n";
    $msg .= "Reply-To: <" . str_replace(["\r", "\n"], '', $user['email']) . ">\r\n";
    $testo = $mittente . ' ' . $T['line'] . "\n\n" . $place
           . ($address !== '' ? "\n" . $address : '')
           . "\n\n" . $T['btn'] . ":\n" . $url . "\n\n" . $T['ign'] . "\nPOI-LOVE - poilove.com\n";
    $bnd = 'plb' . bin2hex(random_bytes(8));
    $msg .= "MIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary=\"$bnd\"\r\n\r\n";
    $msg .= "--$bnd\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n";
    $msg .= chunk_split(base64_encode($testo));
    $msg .= "\r\n--$bnd\r\nContent-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n";
    $msg .= chunk_split(base64_encode($html));
    $msg .= "\r\n--$bnd--";
    fwrite($fp, $msg . "\r\n.\r\n");
    $ok = smtp_ok($fp, [250]);
    @fwrite($fp, "QUIT\r\n");
}
if ($fp) @fclose($fp);
if (!$ok) { http_response_code(502); echo '{"error":"invio"}'; exit; }

// ── 6. registro del tetto e risposta ──
$r['count']++;
@file_put_contents($rf, json_encode($r));
echo '{"ok":true}';
