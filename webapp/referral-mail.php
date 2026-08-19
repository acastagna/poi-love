<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * https://321.al
 */
// Avvisa chi ha invitato: "hai guadagnato 200 punti".
// Lo chiama la webapp subito dopo che un invito e' stato accettato.
// Chi decide tutto e' il server: legge dal database chi ha invitato chi, e manda
// una volta sola (colonna referrals.notified_at). Nessun dato arriva dal chiamante.

header('Content-Type: application/json; charset=utf-8');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(405); echo '{"error":"metodo"}'; exit; }

$CREDS_FILE = '/var/www/poilove/private/mail-creds';
$LOG_FILE   = '/var/www/poilove/private/mailshare/registro.log';
$DB_DSN     = 'pgsql:host=127.0.0.1;port=5433;dbname=poilove';
$DB_CFG     = '/var/www/poilove/private/db-creds';   // formato utente:password

function fine($c, $e) { http_response_code($c); echo json_encode(['error' => $e]); exit; }
function nota($r) { global $LOG_FILE; @file_put_contents($LOG_FILE, gmdate('c') . ' [invito] ' . $r . "\n", FILE_APPEND); }

// ── chi sei ──
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!preg_match('/^Bearer\s+[A-Za-z0-9._-]+$/', $auth)) fine(401, 'accesso');
$ctx = stream_context_create(['http' => ['method' => 'GET', 'timeout' => 8,
    'header' => "Authorization: $auth\r\n", 'ignore_errors' => true]]);
$u = @file_get_contents('http://127.0.0.1:9999/user', false, $ctx);
$user = $u ? json_decode($u, true) : null;
if (!is_array($user) || empty($user['id']) || !preg_match('/^[0-9a-fA-F-]{36}$/', (string)$user['id'])) fine(401, 'accesso');

// ── il database dice chi mi ha invitato, e se l'avviso e' gia' partito ──
$dc = @file_get_contents($DB_CFG);
if (!is_string($dc) || strpos($dc, ':') === false) { nota('credenziali database assenti'); fine(500, 'db'); }
[$dbUser, $dbPass] = explode(':', trim($dc), 2);
try {
    $pdo = new PDO($DB_DSN, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 8]);
} catch (Throwable $t) { nota('database non raggiungibile'); fine(500, 'db'); }

$q = $pdo->prepare("SELECT rid, inviter_email, inviter_name, newcomer_name, inviter_lang FROM public.referral_to_notify(:id)");
$q->execute([':id' => $user['id']]);
$d = $q->fetch(PDO::FETCH_ASSOC);
if (!$d || empty($d['inviter_email'])) { echo '{"ok":true,"nulla":true}'; exit; }   // niente da avvisare

// una volta sola: se qualcun altro ha gia' segnato l'avviso, mi fermo
$seg = $pdo->prepare("SELECT public.referral_mark_notified(:rid)");
$seg->execute([':rid' => $d['rid']]);
if (!$seg->fetchColumn()) { echo '{"ok":true,"gia":true}'; exit; }

// ── il vestito, nella lingua di chi ha invitato ──
$lang = in_array($d['inviter_lang'], ['sq','it','en'], true) ? $d['inviter_lang'] : 'en';

$punti = 200;
$D = [
  'sq' => ['sub' => 'Wow! 200 pikë për ty · POI•LOVE', 'wow' => 'Wow, faleminderit!',
           'line' => 'u bashkua me POI•LOVE me ftesën tënde.', 'pts' => 'pikë për ty',
           'btn' => 'SHIKO PROFILIN TËND', 'ign' => 'Ftesat e tua sjellin pikë sa herë dikush bashkohet.'],
  'it' => ['sub' => 'Wow! 200 punti per te · POI•LOVE', 'wow' => 'Wow, grazie!',
           'line' => 'si è iscritto a POI•LOVE col tuo invito.', 'pts' => 'punti per te',
           'btn' => 'GUARDA IL TUO PROFILO', 'ign' => 'I tuoi inviti portano punti ogni volta che qualcuno entra.'],
  'en' => ['sub' => 'Wow! 200 points for you · POI•LOVE', 'wow' => 'Wow, thank you!',
           'line' => 'joined POI•LOVE with your invitation.', 'pts' => 'points for you',
           'btn' => 'SEE YOUR PROFILE', 'ign' => 'Your invitations earn points every time someone joins.'],
][$lang];
$e = function ($x) { return htmlspecialchars((string)$x, ENT_QUOTES, 'UTF-8'); };
$nomeArrivato = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string)$d['nome_arrivato']);
$url = 'https://poilove.com/';
$html = '<!DOCTYPE html><html lang="' . $lang . '"><head><meta charset="utf-8"></head>'
 . '<body style="margin:0;padding:0;background-color:#EAE4D8;">'
 . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EAE4D8;padding:24px 12px;"><tr><td align="center">'
 . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;">'
 . '<tr><td style="background-color:#D42B2B;padding:26px 28px 22px;text-align:center;">'
 . '<img src="https://poilove.com/img/logo-bianco.png" alt="POI&#8226;LOVE" width="200" style="width:200px;max-width:80%;height:auto;border:0;display:inline-block;"></td></tr>'
 . '<tr><td style="padding:30px 28px 6px;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c;text-align:center;">'
 . '<p style="margin:0 0 10px;font-size:22px;font-weight:800;">' . $e($D['wow']) . '</p>'
 . '<p style="margin:0;font-size:15px;color:#8a8a8a;"><strong style="color:#1c1c1c;">' . $e($nomeArrivato) . '</strong> ' . $e($D['line']) . '</p>'
 . '<p style="margin:18px 0 2px;font-size:40px;line-height:1;font-weight:900;color:#D42B2B;">+' . $punti . '</p>'
 . '<p style="margin:0;font-size:14px;color:#8a8a8a;">' . $e($D['pts']) . '</p>'
 . '</td></tr>'
 . '<tr><td align="center" style="padding:22px 28px 12px;">'
 . '<a href="' . $e($url) . '" style="display:inline-block;background-color:#D42B2B;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;text-decoration:none;padding:15px 34px;border-radius:99px;">' . $e($D['btn']) . '</a></td></tr>'
 . '<tr><td style="padding:14px 28px 26px;font-family:Arial,Helvetica,sans-serif;color:#b0a99c;font-size:11px;text-align:center;border-top:1px solid #f0ece3;">'
 . $e($D['ign']) . '<br><strong style="color:#8a8a8a;">POI&#8226;LOVE</strong> &#183; poilove.com</td></tr>'
 . '</table></td></tr></table></body></html>';
$testo = $D['wow'] . "\n\n" . $nomeArrivato . ' ' . $D['line'] . "\n\n+" . $punti . ' ' . $D['pts'] . "\n\n" . $url . "\n";

// ── invio ──
$c = @file_get_contents($CREDS_FILE);
if (!is_string($c) || strpos($c, ':') === false) { nota('credenziali posta illeggibili'); fine(500, 'posta'); }
[$smtpUser, $smtpPass] = explode(':', trim($c), 2);
function smtp_codice($fp) {
    while (true) {
        $l = fgets($fp, 2048); $m = stream_get_meta_data($fp);
        if ($l === false || !empty($m['timed_out'])) return 0;
        if (!preg_match('/^(\d{3})([ -])/', $l, $mm)) return 0;
        if ($mm[2] === ' ') return (int)$mm[1];
    }
}
$fp = @stream_socket_client('ssl://mail.themeli.al:465', $errno, $errstr, 15);
if (!$fp) { nota('connessione posta fallita'); fine(502, 'invio'); }
stream_set_timeout($fp, 25);
$passo = function ($cmd, $atteso) use ($fp) { if ($cmd !== null) fwrite($fp, $cmd . "\r\n"); return smtp_codice($fp) === $atteso; };
$ok = $passo(null, 220) && $passo('EHLO poilove.com', 250) && $passo('AUTH LOGIN', 334)
   && $passo(base64_encode($smtpUser), 334) && $passo(base64_encode($smtpPass), 235)
   && $passo('MAIL FROM:<' . $smtpUser . '>', 250) && $passo('RCPT TO:<' . $d['mail_invitante'] . '>', 250)
   && $passo('DATA', 354);
if (!$ok) { @fclose($fp); nota('dialogo interrotto verso ' . $d['mail_invitante']); fine(502, 'invio'); }
$bnd = 'plb' . bin2hex(random_bytes(8));
$msg  = 'From: =?UTF-8?B?' . base64_encode('POI•LOVE') . "?= <{$smtpUser}>\r\n";
$msg .= 'To: <' . $d['mail_invitante'] . ">\r\n";
$msg .= 'Subject: =?UTF-8?B?' . base64_encode($D['sub']) . "?=\r\n";
$msg .= "MIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary=\"$bnd\"\r\n\r\n";
$msg .= "--$bnd\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($testo));
$msg .= "\r\n--$bnd\r\nContent-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html));
$msg .= "\r\n--$bnd--";
fwrite($fp, $msg . "\r\n.\r\n");
$fin = smtp_codice($fp);
@fwrite($fp, "QUIT\r\n"); @fclose($fp);
if ($fin === 250 || $fin === 0) { nota('avviso 200 punti a ' . $d['mail_invitante']); echo '{"ok":true}'; exit; }
nota('avviso rifiutato (' . $fin . ') a ' . $d['mail_invitante']);
fine(502, 'invio');
