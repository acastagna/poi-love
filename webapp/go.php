<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Redirect dei deep-link poilove.com/go/<slug> (o /go.php?s=<slug>): risolve lo slug via la RPC
 * resolve_deep_link (che conta il clic), poi 302 verso la destinazione. Il target lo imposta SOLO
 * l'admin (RLS), quindi è fidato: nessun open-redirect da input utente.
 */
$slug = preg_replace('/[^A-Za-z0-9\-_]/', '', isset($_GET['s']) ? $_GET['s'] : '');
$SUPA = 'https://ptppxwlafswfhbueakjt.supabase.co';
$ANON = 'sb_publishable_PC1xQ8XiQK9jpzwsAlFLxw_E-PKN40V';
$fallback = 'https://poilove.com/';

function go_home($u) { header('Location: ' . $u, true, 302); exit; }
if ($slug === '') go_home($fallback);

$ua  = isset($_SERVER['HTTP_USER_AGENT']) ? substr($_SERVER['HTTP_USER_AGENT'], 0, 300) : '';
$ref = isset($_SERVER['HTTP_REFERER'])    ? substr($_SERVER['HTTP_REFERER'], 0, 300)    : '';

$ch = curl_init($SUPA . '/rest/v1/rpc/resolve_deep_link');
curl_setopt_array($ch, array(
  CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => array('apikey: ' . $ANON, 'Authorization: Bearer ' . $ANON, 'Content-Type: application/json'),
  CURLOPT_POSTFIELDS => json_encode(array('p_slug' => $slug, 'p_ua' => $ua, 'p_ref' => $ref)),
  CURLOPT_TIMEOUT => 6,
));
$res = curl_exec($ch); curl_close($ch);
$target = json_decode($res, true); // la RPC ritorna direttamente il testo (URL) o null

// Sicurezza: accetta solo URL http(s) assoluti (i target li imposta solo l'admin, ma doppio controllo)
if (is_string($target) && preg_match('#^https?://#i', $target)) go_home($target);
go_home($fallback);
