<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Il diario del ricevitore push (spia diagnostica, 22/08): il service worker
 * segna qui le fasi di ogni push (ricevuta, mostrata, errore). Nessun dato
 * personale: solo fase, versione e ora. Si legge da macchina, non dal web.
 */
$fase = preg_replace('/[^a-z0-9_.-]/i', '', $_GET['fase'] ?? '');
$ver  = preg_replace('/[^0-9.]/', '', $_GET['v'] ?? '');
if ($fase !== '') {
    file_put_contents('/var/www/poilove/sw-diario.log',
        date('c') . " fase=$fase v=$ver ua=" . substr(preg_replace('/[^\x20-\x7e]/','',$_SERVER['HTTP_USER_AGENT'] ?? ''),0,90) . "\n",
        FILE_APPEND | LOCK_EX);
}
header('Content-Type: text/plain');
echo 'ok';
