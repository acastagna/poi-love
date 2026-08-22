<?php
/*
© Alessandro Castagna, 321.al / EVOLAB
Tutti i diritti riservati. Uso non autorizzato vietato.
info@321.it · https://321.al
*/

/**
 * IL FIRMATARIO DELLA NOTTE: notarizza i rapporti di POI-LOVE.
 *
 * Gira sulla macchina (cron), mai dal browser: lo stato della prova lo puo
 * scrivere solo chi non ha interesse a falsificarlo. Prende i rapporti
 * in_coda, manda l'impronta ai calendar OpenTimestamps (motore di Top Market,
 * riusato tale e quale), e a ogni giro chiede l'upgrade di quelli inviati:
 * quando compare l'attestazione Bitcoin, scrive il numero del blocco.
 *
 * Uso: sudo -u postgres php notarizza-rapporti.php
 */

declare(strict_types=1);

require __DIR__ . '/ots.php';   // il motore: tm_ots_invia, tm_ots_upgrade

$pdo = new PDO('pgsql:host=/var/run/postgresql;port=5433;dbname=poilove', 'postgres');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// ── 1) le impronte mai partite ──────────────────────────────────────────────
$daInviare = $pdo->query("select id, impronta from rapporti where stato in ('in_coda','errore') limit 20")->fetchAll(PDO::FETCH_ASSOC);
foreach ($daInviare as $r) {
    $digest = hex2bin($r['impronta']);
    if (!is_string($digest) || strlen($digest) !== 32) { continue; }
    $esiti = tm_ots_invia($digest);
    $buone = 0;
    foreach ($esiti as $e) { if (!empty($e['ok'])) { $buone++; } }
    $st = $pdo->prepare("update rapporti set stato = ?, ricevute = ?, inviato_il = now() where id = ?");
    $st->execute([$buone > 0 ? 'inviata' : 'errore', json_encode($esiti, JSON_UNESCAPED_UNICODE), $r['id']]);
    echo $r['id'], ': ', ($buone > 0 ? "inviata a $buone calendar" : 'nessun calendar ha risposto'), "\n";
}

// ── 2) quelle inviate: c'e' gia' il blocco? ─────────────────────────────────
$daControllare = $pdo->query("select id, impronta, ricevute from rapporti where stato = 'inviata' limit 40")->fetchAll(PDO::FETCH_ASSOC);
foreach ($daControllare as $r) {
    $digest = hex2bin($r['impronta']);
    $ricevute = json_decode((string) $r['ricevute'], true) ?: [];
    $bin = [];
    foreach ($ricevute as $x) {
        if (!empty($x['ok']) && !empty($x['b64'])) {
            $b = base64_decode((string) $x['b64'], true);
            if (is_string($b) && $b !== '') { $bin[] = $b; }
        }
    }
    if (!$bin) { continue; }
    $up = tm_ots_controlla($digest, $bin);
    if (!empty($up['ancorata']) && !empty($up['height'])) {
        $st = $pdo->prepare("update rapporti set stato = 'ancorata', blocco = ?, ancorato_il = now() where id = ?");
        $st->execute([(int) $up['height'], $r['id']]);
        echo $r['id'], ': ANCORATA nel blocco ', (int) $up['height'], "\n";
    } else {
        echo $r['id'], ': in attesa del blocco', "\n";
    }
}
echo "giro finito\n";
