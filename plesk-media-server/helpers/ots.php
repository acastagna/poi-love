<?php
/*
© Alessandro Castagna, 321.al / EVOLAB
Tutti i diritti riservati. Uso non autorizzato vietato.
https://321.al
*/

/**
 * Top Market, OpenTimestamps in PHP puro.
 *
 * Cosa fa DAVVERO questo modulo, senza finzioni:
 *  - invia il digest SHA-256 (binario) ai calendar pubblici OpenTimestamps
 *    e conserva le risposte binarie cosi come arrivano;
 *  - sa leggere il formato timestamp (varint, varbytes, op append/prepend/
 *    sha256..., attestazioni pending e Bitcoin) per VALIDARE le risposte;
 *  - costruisce il file .ots (magic header + versione + op sha256 + digest +
 *    albero delle attestazioni) SOLO se ogni pezzo viene ri-analizzato con
 *    successo; se qualcosa non torna, niente .ots: si offre il pacchetto di
 *    prova grezzo (JSON con digest e risposte base64) e lo si dichiara;
 *  - controlla l'ancoraggio richiedendo l'upgrade ai calendar: lo stato
 *    "ancorata" scatta SOLO se nella risposta compare una attestazione
 *    Bitcoin ben formata (tag ufficiale + altezza blocco). La verifica
 *    contro la blockchain resta possibile in autonomia col client ots.
 */

declare(strict_types=1);

/** Magic header dei file .ots (31 byte) e versione supportata. */
const TM_OTS_MAGIC = "\x00OpenTimestamps\x00\x00Proof\x00\xbf\x89\xe2\xe8\x84\xe8\x92\x94";

/** Tag delle attestazioni (8 byte ciascuno, dal protocollo ufficiale). */
const TM_OTS_TAG_BITCOIN  = "\x05\x88\x96\x0d\x73\xd7\x19\x01";
const TM_OTS_TAG_PENDING  = "\x83\xdf\xe3\x0d\x2e\xf9\x0c\x8e";
const TM_OTS_TAG_LITECOIN = "\x06\x86\x9a\x0d\x73\xd7\x1b\x45";

/** Limiti di parsing: gli STESSI del client ufficiale, mai piu larghi. */
const TM_OTS_MAX_MSG      = 4096;
const TM_OTS_MAX_RISPOSTA = 10000;
/**
 * Profondita massima di annidamento: ogni operazione apre un livello,
 * esattamente come il _recursion_limit=256 del client ufficiale (che conta
 * sia gli anelli di catena sia i fork). Il percorso reale di un upgrade
 * Bitcoin e una catena di 60-120 op: ci sta comodo. La soglia identica
 * garantisce che cio che si accetta qui resti leggibile anche dal client
 * ots, e che un file costruito qui non lo rifiuti mai per profondita.
 */
const TM_OTS_MAX_DEPTH    = 256;
/** Passi massimi della camminata: cintura dura contro input ostili. */
const TM_OTS_MAX_PASSI    = 65536;
/** Attestazioni massime per timestamp: oltre, input sospetto. */
const TM_OTS_MAX_ATTEST   = 64;

/** I calendar a cui si invia il digest. */
function tm_ots_calendars(): array
{
    return [
        'https://a.pool.opentimestamps.org/digest',
        'https://b.pool.opentimestamps.org/digest',
        'https://alice.btc.calendar.opentimestamps.org/digest',
    ];
}

// ─────────────────────────────────────────────────────────────
// Helper condivisi su una riga notarizzazione (registro, vista
// unita della relazione firmata, certificato PDF). Una fonte sola.
// ─────────────────────────────────────────────────────────────

/** Le due liste di ricevute (submit/upgrade) dal TEXT, sempre presenti. */
function tm_notar_ricevute_liste(?string $json): array
{
    $r = json_decode((string) $json, true);
    if (!is_array($r)) {
        $r = [];
    }
    return [
        'submit'  => is_array($r['submit'] ?? null) ? $r['submit'] : [],
        'upgrade' => is_array($r['upgrade'] ?? null) ? $r['upgrade'] : [],
    ];
}

/** Risposte binarie valide (ok) dai submit di una riga notarizzazione. */
function tm_notar_risposte_valide(array $notar): array
{
    $ricevute = tm_notar_ricevute_liste($notar['ricevute'] ?? null);
    $out = [];
    foreach ($ricevute['submit'] as $s) {
        if (!empty($s['ok']) && is_string($s['b64'] ?? null)) {
            $bin = base64_decode((string) $s['b64'], true);
            if (is_string($bin) && $bin !== '') {
                $out[] = $bin;
            }
        }
    }
    return $out;
}

/**
 * True se il file .ots di questa notarizzazione e ricostruibile in modo
 * affidabile (serializzazione completa che si rilegge da cima a fondo).
 */
function tm_notar_ots_disponibile(array $notar): bool
{
    $digest = @hex2bin((string) ($notar['hash_sha256'] ?? ''));
    if (!is_string($digest) || strlen($digest) !== 32) {
        return false;
    }
    $risposte = tm_notar_risposte_valide($notar);
    if ($risposte === []) {
        return false;
    }
    return tm_ots_file($digest, $risposte) !== null;
}

/**
 * Altezza del blocco Bitcoin in cui la notarizzazione risulta ancorata,
 * o null. Fonte tecnica vera: le attestazioni nelle ricevute. Ripiego
 * leggibile: la nota "blocco NNN" scritta nel registro.
 */
function tm_notar_blocco_bitcoin(array $notar): ?int
{
    $digest = @hex2bin((string) ($notar['hash_sha256'] ?? ''));
    if (is_string($digest) && strlen($digest) === 32) {
        foreach (tm_notar_risposte_valide($notar) as $bin) {
            $att = tm_ots_attestazioni($digest, $bin);
            if (!is_array($att)) {
                continue;
            }
            foreach ($att as $a) {
                if (($a['tipo'] ?? '') === 'bitcoin' && $a['height'] !== null) {
                    return (int) $a['height'];
                }
            }
        }
    }
    if (preg_match('/blocco\s+(\d{3,})/i', (string) ($notar['note'] ?? ''), $m) === 1) {
        return (int) $m[1];
    }
    return null;
}

/** Host di calendar da cui e lecito chiedere l'upgrade (anti SSRF). */
function tm_ots_calendario_consentito(string $uri): bool
{
    $p = parse_url($uri);
    if (!is_array($p) || strtolower((string) ($p['scheme'] ?? '')) !== 'https') {
        return false;
    }
    $host = strtolower((string) ($p['host'] ?? ''));
    return in_array($host, [
        'a.pool.opentimestamps.org',
        'b.pool.opentimestamps.org',
        'alice.btc.calendar.opentimestamps.org',
        'bob.btc.calendar.opentimestamps.org',
        'finney.calendar.eternitywall.com',
        'btc.calendar.catallaxy.com',
    ], true);
}

// ─────────────────────────────────────────────────────────────
// Lettura del formato: varint, varbytes, albero timestamp
// ─────────────────────────────────────────────────────────────

/** Varint non firmato (7 bit per byte, bit alto = continua). Null se rotto. */
function tm_ots_varint(string $b, int &$p): ?int
{
    $v = 0;
    $shift = 0;
    while (true) {
        if ($p >= strlen($b)) {
            return null;
        }
        $byte = ord($b[$p]);
        $p++;
        $v |= ($byte & 0x7F) << $shift;
        if (($byte & 0x80) === 0) {
            return $v;
        }
        $shift += 7;
        if ($shift > 42) {
            return null; // oltre ogni valore sensato
        }
    }
}

/** Varbytes: varint lunghezza + contenuto. Null se rotto o oltre il massimo. */
function tm_ots_varbytes(string $b, int &$p, int $max): ?string
{
    $len = tm_ots_varint($b, $p);
    if ($len === null || $len < 0 || $len > $max || $p + $len > strlen($b)) {
        return null;
    }
    $out = substr($b, $p, $len);
    $p  += $len;
    return $out;
}

/**
 * Legge UNA voce dal byte tag: attestazione (si chiude qui) oppure testa di
 * operazione (il sotto-albero resta al chiamante). Aggiorna $p, calcola il
 * messaggio trasformato in $nuovo (null se non calcolabile, es. keccak256)
 * e accumula le attestazioni in $out: [tipo, msg, uri|height, span_start,
 * span_end]. Ritorna: 1 attestazione, 2 operazione, 0 formato non fidato.
 */
function tm_ots_voce(string $b, int &$p, ?string $msg, array &$out, ?string &$nuovo): int
{
    if (count($out) >= TM_OTS_MAX_ATTEST) {
        return 0;
    }
    $start = $p;
    if ($p >= strlen($b)) {
        return 0;
    }
    $tag = $b[$p];
    $p++;

    // Attestazione: 0x00 + tag di 8 byte + payload varbytes.
    if ($tag === "\x00") {
        if ($p + 8 > strlen($b)) {
            return 0;
        }
        $atag = substr($b, $p, 8);
        $p   += 8;
        $payload = tm_ots_varbytes($b, $p, 8192);
        if ($payload === null) {
            return 0;
        }
        $voce = [
            'tipo'       => 'sconosciuta',
            'msg'        => $msg,
            'uri'        => null,
            'height'     => null,
            'span_start' => $start,
            'span_end'   => $p,
        ];
        // Regole IDENTICHE al client ufficiale per le attestazioni note:
        // payload consumato per intero (assert_eof) e, per le pending,
        // solo i caratteri ammessi nell'URI. Cosi una risposta che il
        // client ots rifiuterebbe non entra mai in un file .ots nostro.
        if ($atag === TM_OTS_TAG_PENDING) {
            $voce['tipo'] = 'pending';
            $pp  = 0;
            $uri = tm_ots_varbytes($payload, $pp, 1000);
            if ($uri === null || $pp !== strlen($payload)
                || !preg_match('~^[A-Za-z0-9._/:-]{1,1000}$~', $uri)) {
                return 0; // URI del calendar illeggibile: risposta non fidata
            }
            $voce['uri'] = $uri;
        } elseif ($atag === TM_OTS_TAG_BITCOIN || $atag === TM_OTS_TAG_LITECOIN) {
            $voce['tipo'] = $atag === TM_OTS_TAG_BITCOIN ? 'bitcoin' : 'litecoin';
            $pp = 0;
            $h  = tm_ots_varint($payload, $pp);
            if ($h === null || $h < 0 || $pp !== strlen($payload)) {
                return 0;
            }
            $voce['height'] = $h;
        }
        $out[] = $voce;
        return 1;
    }

    // Operazione: trasforma il messaggio; il sotto-albero e del chiamante.
    switch ($tag) {
        case "\xf0": // append
            $arg = tm_ots_varbytes($b, $p, TM_OTS_MAX_MSG);
            if ($arg === null || $arg === '') {
                return 0;
            }
            $nuovo = $msg !== null ? $msg . $arg : null;
            break;
        case "\xf1": // prepend
            $arg = tm_ots_varbytes($b, $p, TM_OTS_MAX_MSG);
            if ($arg === null || $arg === '') {
                return 0;
            }
            $nuovo = $msg !== null ? $arg . $msg : null;
            break;
        case "\xf2": // reverse (deprecata ma leggibile)
            $nuovo = $msg !== null ? strrev($msg) : null;
            break;
        case "\xf3": // hexlify
            $nuovo = $msg !== null ? bin2hex($msg) : null;
            break;
        case "\x02": // sha1
            $nuovo = $msg !== null ? hash('sha1', $msg, true) : null;
            break;
        case "\x03": // ripemd160
            $nuovo = $msg !== null ? hash('ripemd160', $msg, true) : null;
            break;
        case "\x08": // sha256
            $nuovo = $msg !== null ? hash('sha256', $msg, true) : null;
            break;
        case "\x67": // keccak256: non calcolabile in PHP puro, si legge senza commitment
            $nuovo = null;
            break;
        default:
            return 0; // tag mai visto: non ci si fida
    }
    if ($nuovo !== null && strlen($nuovo) > TM_OTS_MAX_MSG) {
        return 0;
    }
    return 2;
}

/**
 * Una voce COMPLETA dell'albero: attestazione, oppure operazione con tutto
 * il suo sotto-albero (che parte un livello piu in basso).
 */
function tm_ots_parse_entry(string $b, int &$p, ?string $msg, int $depth, array &$out): bool
{
    $nuovo = null;
    $esito = tm_ots_voce($b, $p, $msg, $out, $nuovo);
    if ($esito === 1) {
        return true;
    }
    return $esito === 2 && tm_ots_parse_ts($b, $p, $nuovo, $depth + 1, $out);
}

/**
 * Albero timestamp a partire da $p: voci separate da 0xff, l'ultima nuda.
 *
 * Camminata ITERATIVA con pila esplicita dei nodi aperti, provata sui byte
 * veri dei calendar: il percorso di un upgrade Bitcoin e una CATENA lineare
 * di 60-120 operazioni (albero del calendar + transazione + merkle del
 * blocco). La vecchia ricorsione PHP rischiava lo stack overflow; qui la
 * pila e un array e la profondita si conta come nel client ufficiale:
 * ogni operazione apre un livello (catena o fork non importa), limite
 * TM_OTS_MAX_DEPTH identico al suo. Ogni giro consuma almeno un byte:
 * la terminazione e garantita dall'input, TM_OTS_MAX_PASSI e la cintura.
 */
function tm_ots_parse_ts(string $b, int &$p, ?string $msg, int $depth, array &$out): bool
{
    // Sulla pila: [messaggio del nodo, profondita del nodo]. In cima il
    // nodo di cui leggere la prossima voce.
    $pila  = [[$msg, $depth]];
    $passi = 0;
    while ($pila !== []) {
        if (++$passi > TM_OTS_MAX_PASSI) {
            return false;
        }
        [$m, $d] = array_pop($pila);
        if ($d >= TM_OTS_MAX_DEPTH) {
            return false; // stessa soglia del client ufficiale (256)
        }
        if ($p >= strlen($b)) {
            return false;
        }
        if ($b[$p] === "\xff") {
            // Fork: dopo questa voce il nodo ne ha altre, ci si tornera.
            $p++;
            $pila[] = [$m, $d];
        }
        $nuovo = null;
        $esito = tm_ots_voce($b, $p, $m, $out, $nuovo);
        if ($esito === 0) {
            return false;
        }
        if ($esito === 2) {
            // Si scende subito nel sotto-albero dell'operazione.
            $pila[] = [$nuovo, $d + 1];
        }
    }
    return true;
}

/**
 * Analizza una risposta di calendar (timestamp serializzato che parte dal
 * digest): consumo totale obbligatorio. Ritorna le attestazioni o null.
 */
function tm_ots_attestazioni(string $digest, string $risposta): ?array
{
    if ($risposta === '' || strlen($risposta) > TM_OTS_MAX_RISPOSTA) {
        return null;
    }
    $p   = 0;
    $out = [];
    if (!tm_ots_parse_ts($risposta, $p, $digest, 0, $out) || $p !== strlen($risposta)) {
        return null;
    }
    return $out;
}

/**
 * Le voci di primo livello di un timestamp serializzato: [inizio, fine] di
 * ognuna, senza i separatori 0xff. Serve a fondere piu risposte in un file.
 */
function tm_ots_voci_primo_livello(string $b): ?array
{
    $p     = 0;
    $spans = [];
    while (true) {
        if ($p >= strlen($b)) {
            return null;
        }
        $separata = false;
        if ($b[$p] === "\xff") {
            $p++;
            $separata = true;
        }
        $s   = $p;
        $out = [];
        if (!tm_ots_parse_entry($b, $p, null, 0, $out)) {
            return null;
        }
        $spans[] = [$s, $p];
        if (!$separata) {
            break;
        }
    }
    return $p === strlen($b) ? $spans : null;
}

// ─────────────────────────────────────────────────────────────
// Costruzione del file .ots (solo se ogni pezzo si rilegge)
// ─────────────────────────────────────────────────────────────

/**
 * Innesta gli upgrade nelle attestazioni pending di una risposta:
 * la voce "0x00 + tag pending + payload" viene sostituita dal timestamp
 * di upgrade che continua dallo stesso commitment. Solo upgrade lineari
 * (che non iniziano con 0xff, quindi una sola voce di primo livello).
 * Se qualcosa non combacia, la risposta resta com'era: mai forzare.
 */
function tm_ots_innesta_upgrades(string $digest, string $risposta, array $upgrades): string
{
    if ($upgrades === []) {
        return $risposta;
    }
    $att = tm_ots_attestazioni($digest, $risposta);
    if ($att === null) {
        return $risposta;
    }
    $sostituzioni = [];
    foreach ($att as $a) {
        if ($a['tipo'] !== 'pending' || $a['msg'] === null) {
            continue;
        }
        foreach ($upgrades as $up) {
            if (!hash_equals(bin2hex($a['msg']), bin2hex((string) $up['commitment']))) {
                continue;
            }
            $bytes = (string) $up['bytes'];
            if ($bytes === '' || $bytes[0] === "\xff") {
                continue; // upgrade a piu rami: innesto non sicuro, si lascia pending
            }
            // L'upgrade deve rileggersi dal commitment.
            if (tm_ots_attestazioni($a['msg'], $bytes) === null) {
                continue;
            }
            $sostituzioni[] = [$a['span_start'], $a['span_end'], $bytes];
            break;
        }
    }
    if ($sostituzioni === []) {
        return $risposta;
    }
    // Dalla fine verso l'inizio, per non spostare gli offset.
    usort($sostituzioni, static fn(array $x, array $y): int => $y[0] <=> $x[0]);
    foreach ($sostituzioni as [$da, $a_, $bytes]) {
        $risposta = substr($risposta, 0, $da) . $bytes . substr($risposta, $a_);
    }
    return $risposta;
}

/**
 * Costruisce il file .ots completo: magic + versione 1 + op sha256 + digest
 * + fusione delle risposte dei calendar (con eventuali upgrade innestati).
 * Ogni risposta viene validata prima; il file finale viene ri-analizzato
 * per intero. Se QUALSIASI passaggio fallisce: null, niente finzioni.
 */
function tm_ots_file(string $digest, array $risposte, array $upgrades = []): ?string
{
    if (strlen($digest) !== 32) {
        return null;
    }
    $valide = [];
    foreach ($risposte as $r) {
        if (!is_string($r) || $r === '') {
            continue;
        }
        if (tm_ots_attestazioni($digest, $r) === null) {
            continue; // risposta illeggibile: fuori dal file
        }
        $con_upgrade = tm_ots_innesta_upgrades($digest, $r, $upgrades);
        if (tm_ots_attestazioni($digest, $con_upgrade) !== null) {
            $valide[] = $con_upgrade;
        } else {
            $valide[] = $r; // l'innesto ha guastato qualcosa: si tiene l'originale
        }
    }
    if ($valide === []) {
        return null;
    }

    // Fusione: tutte le voci di primo livello di ogni risposta, in fila;
    // 0xff davanti a ognuna tranne l'ultima (grammatica del formato).
    $voci = [];
    foreach ($valide as $r) {
        $spans = tm_ots_voci_primo_livello($r);
        if ($spans === null) {
            return null;
        }
        foreach ($spans as [$s, $e]) {
            $voci[] = substr($r, $s, $e - $s);
        }
    }
    $corpo = '';
    $n     = count($voci);
    foreach ($voci as $i => $v) {
        if ($i < $n - 1) {
            $corpo .= "\xff";
        }
        $corpo .= $v;
    }

    $file = TM_OTS_MAGIC . "\x01" . "\x08" . $digest . $corpo;

    // Autoverifica finale: il file deve rileggersi da cima a fondo.
    return tm_ots_verifica_file($file) === null ? null : $file;
}

/**
 * Rilegge un file .ots completo. Ritorna le attestazioni, o null se rotto.
 */
function tm_ots_verifica_file(string $file): ?array
{
    $ml = strlen(TM_OTS_MAGIC);
    if (strncmp($file, TM_OTS_MAGIC, $ml) !== 0) {
        return null;
    }
    $p = $ml;
    $versione = tm_ots_varint($file, $p);
    if ($versione !== 1) {
        return null;
    }
    if ($p >= strlen($file) || $file[$p] !== "\x08") {
        return null; // qui si emette solo SHA-256
    }
    $p++;
    if ($p + 32 > strlen($file)) {
        return null;
    }
    $digest = substr($file, $p, 32);
    $p     += 32;
    $out = [];
    if (!tm_ots_parse_ts($file, $p, $digest, 0, $out) || $p !== strlen($file)) {
        return null;
    }
    return $out;
}

// ─────────────────────────────────────────────────────────────
// Rete: invio del digest e controllo dell'ancoraggio
// ─────────────────────────────────────────────────────────────

/** HTTP verso un calendar, con i vincoli del protocollo. */
function tm_ots_http(string $url, ?string $post_body): array
{
    $ch = curl_init($url);
    $headers = [
        'Accept: application/vnd.opentimestamps.v1',
        'User-Agent: Top Market-OTS/1.0',
    ];
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_MAXFILESIZE    => TM_OTS_MAX_RISPOSTA,
    ];
    if ($post_body !== null) {
        $headers[] = 'Content-Type: application/vnd.opentimestamps.v1';
        $opts[CURLOPT_POST]       = true;
        $opts[CURLOPT_POSTFIELDS] = $post_body;
    }
    $opts[CURLOPT_HTTPHEADER] = $headers;
    curl_setopt_array($ch, $opts);
    $body = curl_exec($ch);
    $http = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err  = $body === false ? (string) curl_error($ch) : '';
    unset($ch); // niente curl_close: deprecata da PHP 8.5, senza effetto dall'8.0
    if (is_string($body) && strlen($body) > TM_OTS_MAX_RISPOSTA) {
        return ['ok' => false, 'http' => $http, 'body' => null, 'errore' => 'risposta oltre il limite'];
    }
    return [
        'ok'     => $body !== false && $http === 200,
        'http'   => $http,
        'body'   => is_string($body) ? $body : null,
        'errore' => $err !== '' ? $err : null,
    ];
}

/**
 * Invia il digest (32 byte binari) ai calendar. Per ogni calendar:
 * url, ok, http, b64 della risposta binaria, errore onesto.
 * ok = true SOLO se la risposta si rilegge come timestamp valido del digest.
 */
function tm_ots_invia(string $digest): array
{
    $esiti = [];
    foreach (tm_ots_calendars() as $url) {
        $r  = tm_ots_http($url, $digest);
        $ts = date('Y-m-d H:i:s');
        if (!$r['ok'] || $r['body'] === null || $r['body'] === '') {
            $esiti[] = [
                'url' => $url, 'ok' => false, 'http' => $r['http'], 'b64' => null,
                'errore' => $r['errore'] ?? ('HTTP ' . $r['http']), 'ts' => $ts,
            ];
            continue;
        }
        if (tm_ots_attestazioni($digest, $r['body']) === null) {
            $esiti[] = [
                'url' => $url, 'ok' => false, 'http' => $r['http'],
                'b64' => base64_encode($r['body']),
                'errore' => 'risposta ricevuta ma non riconosciuta come timestamp valido',
                'ts' => $ts,
            ];
            continue;
        }
        $esiti[] = [
            'url' => $url, 'ok' => true, 'http' => $r['http'],
            'b64' => base64_encode($r['body']), 'errore' => null, 'ts' => $ts,
        ];
    }
    return $esiti;
}

/**
 * Controlla l'ancoraggio: per ogni risposta valida cerca le attestazioni
 * pending e chiede ai rispettivi calendar l'upgrade del commitment.
 * Ritorna:
 *   ancorata  true SOLO con attestazione Bitcoin ben formata nella risposta
 *   height    altezza del blocco Bitcoin (se ancorata)
 *   upgrades  [{url, commitment(hex), b64, height}] da conservare
 *   dettagli  righe di esito oneste, una per calendar interrogato
 */
function tm_ots_controlla(string $digest, array $risposte): array
{
    $ancorata = false;
    $height   = null;
    $upgrades = [];
    $dettagli = [];

    foreach ($risposte as $r) {
        if (!is_string($r) || $r === '') {
            continue;
        }
        $att = tm_ots_attestazioni($digest, $r);
        if ($att === null) {
            $dettagli[] = 'una ricevuta salvata non si rilegge: esclusa dal controllo';
            continue;
        }
        foreach ($att as $a) {
            if ($a['tipo'] === 'bitcoin') {
                // Gia ancorata nella ricevuta originale (raro ma possibile).
                $ancorata = true;
                $height   = $height ?? $a['height'];
                continue;
            }
            if ($a['tipo'] !== 'pending' || $a['msg'] === null || $a['uri'] === null) {
                continue;
            }
            if (!tm_ots_calendario_consentito($a['uri'])) {
                $dettagli[] = 'calendar fuori whitelist ignorato: ' . $a['uri'];
                continue;
            }
            $url = rtrim($a['uri'], '/') . '/timestamp/' . bin2hex($a['msg']);
            $up  = tm_ots_http($url, null);
            if (!$up['ok'] || $up['body'] === null || $up['body'] === '') {
                $dettagli[] = $a['uri'] . ': non ancora ancorato (HTTP ' . $up['http'] . ')';
                continue;
            }
            $att_up = tm_ots_attestazioni($a['msg'], $up['body']);
            if ($att_up === null) {
                $dettagli[] = $a['uri'] . ': upgrade ricevuto ma non riconosciuto, ignorato';
                continue;
            }
            $btc = null;
            foreach ($att_up as $au) {
                if ($au['tipo'] === 'bitcoin') {
                    $btc = $au;
                    break;
                }
            }
            if ($btc === null) {
                $dettagli[] = $a['uri'] . ': risposta valida ma senza attestazione Bitcoin, si resta in attesa';
                continue;
            }
            $ancorata   = true;
            $height     = $height ?? $btc['height'];
            // Merkle root del blocco ricostruita camminando l'albero, nel
            // byte order dei block explorer: chiunque puo confrontarla con
            // il blocco vero (es. blockstream.info) in autonomia.
            $merkle = is_string($btc['msg']) && strlen($btc['msg']) === 32
                ? bin2hex(strrev($btc['msg'])) : null;
            $upgrades[] = [
                'url'        => $a['uri'],
                'commitment' => bin2hex($a['msg']),
                'b64'        => base64_encode($up['body']),
                'height'     => $btc['height'],
                'merkle'     => $merkle,
                'ts'         => date('Y-m-d H:i:s'),
            ];
            $dettagli[] = $a['uri'] . ': attestazione Bitcoin nel blocco ' . $btc['height'];
        }
    }

    return [
        'ancorata' => $ancorata,
        'height'   => $height,
        'upgrades' => $upgrades,
        'dettagli' => $dettagli,
    ];
}
