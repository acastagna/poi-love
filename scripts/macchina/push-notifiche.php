<?php
/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * Il postino delle notifiche push web (seguito di mig 047, 162, 169).
 *
 * Ogni minuto guarda le notifiche appena nate (push_sent_at nullo), e per
 * ognuna spedisce la push ai dispositivi iscritti del destinatario, ma SOLO
 * se per quel tipo di avviso l'utente ha acceso la levetta del browser
 * (notification_prefs.browser). Il testo e' composto qui, nella lingua del
 * dispositivo, con le stesse parole dell'app. Un dispositivo che il servizio
 * push dichiara morto (404/410) viene tolto dal registro.
 *
 * Gira come utente postgres, via presa locale, come i fratelli notarizza e
 * condizioni. Le chiavi VAPID vivono in /etc/poilove-vapid.env (solo qui).
 */

require '/usr/local/lib/poilove/push/vendor/autoload.php';

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

$env = parse_ini_file('/etc/poilove-vapid.env');
if (!$env || empty($env['VAPID_PUBLIC']) || empty($env['VAPID_PRIVATE'])) {
    fwrite(STDERR, date('c') . " chiavi VAPID mancanti\n");
    exit(1);
}

$pdo = new PDO('pgsql:host=/var/run/postgresql;port=5433;dbname=poilove', 'postgres');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

/* Il lucchetto: se il giro precedente e' ancora in corso (rete lenta),
   questo si fa da parte. Il lucchetto cade da solo a fine processo. */
$libero = $pdo->query('select pg_try_advisory_lock(42421)')->fetchColumn();
if (!$libero) exit(0);

/* Le stesse parole dell'app, nelle tre lingue. Lingua sconosciuta -> inglese. */
$TESTI = [
    'it' => [
        'someone' => 'Qualcuno', 'new_follower' => 'ha iniziato a seguirti',
        'poi_received_love' => 'ha messo LOVE al tuo luogo', 'followed_user_new_poi' => 'ha aggiunto un nuovo luogo',
        'companion_invite_received' => 'Ti hanno invitato in una compagnia', 'companion_member_joined' => 'è entrato nella compagnia',
        'companion_new_voice' => 'ha lasciato un vocale in', 'route_suggestion_published' => 'La tua rotta storica è stata pubblicata, grazie!',
        'route_adopted' => 'ha adottato la tua rotta', 'segui_invito' => 'ti chiede di ricambiare',
        'abbonamento_promemoria' => 'Il tuo abbonamento scade fra', 'giorni' => 'giorni',
        'livello_avviso' => 'Un promemoria sul tuo livello', 'livello_perso' => 'Hai perso il livello',
        'generic' => 'Novità su POI•LOVE',
    ],
    'sq' => [
        'someone' => 'Dikush', 'new_follower' => 'filloi të të ndjekë',
        'poi_received_love' => 'i vuri LOVE vendit tënd', 'followed_user_new_poi' => 'shtoi një vend të ri',
        'companion_invite_received' => 'Të ftuan në një shoqëri', 'companion_member_joined' => 'hyri në shoqëri',
        'companion_new_voice' => 'la një zë në', 'route_suggestion_published' => 'Rruga jote historike u botua, faleminderit!',
        'route_adopted' => 'adoptoi rrugën tënde', 'segui_invito' => 'te kerkon ta ndjekesh',
        'abbonamento_promemoria' => 'Abonimi yt skadon pas', 'giorni' => 'dite',
        'livello_avviso' => 'Nje kujtese per nivelin tend', 'livello_perso' => 'Ke humbur nivelin',
        'generic' => 'Të reja në POI•LOVE',
    ],
    'en' => [
        'someone' => 'Someone', 'new_follower' => 'started following you',
        'poi_received_love' => 'loved your place', 'followed_user_new_poi' => 'added a new place',
        'companion_invite_received' => 'You were invited to a companion group', 'companion_member_joined' => 'joined the companion group',
        'companion_new_voice' => 'left a voice note in', 'route_suggestion_published' => 'Your historic route was published, thank you!',
        'route_adopted' => 'adopted your route', 'segui_invito' => 'asks you to follow back',
        'abbonamento_promemoria' => 'Your subscription expires in', 'giorni' => 'days',
        'livello_avviso' => 'A reminder about your level', 'livello_perso' => 'You lost the level',
        'generic' => 'News on POI•LOVE',
    ],
];

function componi(array $t, string $event, array $data, string $actor): string
{
    $who   = $actor !== '' ? $actor : $t['someone'];
    $title = isset($data['title']) ? (string)$data['title'] : '';
    $name  = isset($data['name'])  ? (string)$data['name']  : '';
    switch ($event) {
        case 'new_follower':              return "$who {$t['new_follower']}";
        case 'poi_received_love':         return "$who {$t['poi_received_love']}" . ($title !== '' ? " \"$title\"" : '');
        case 'followed_user_new_poi':     return "$who {$t['followed_user_new_poi']}" . ($title !== '' ? " \"$title\"" : '');
        case 'companion_invite_received': return $t['companion_invite_received'] . ($name !== '' ? " \"$name\"" : '');
        case 'companion_member_joined':   return "$who {$t['companion_member_joined']}" . ($name !== '' ? " \"$name\"" : '');
        case 'companion_new_voice':       return "$who {$t['companion_new_voice']}" . ($name !== '' ? " \"$name\"" : '');
        case 'route_suggestion_published':return $t['route_suggestion_published'];
        case 'route_adopted':             return "$who {$t['route_adopted']}";
        case 'segui_invito':              return "$who {$t['segui_invito']}";
        case 'abbonamento_promemoria':
            $g = isset($data['giorni']) ? (string)$data['giorni'] : '';
            $l = isset($data['livello']) ? (string)$data['livello'] : '';
            return "{$t['abbonamento_promemoria']} $g {$t['giorni']}" . ($l !== '' ? " ($l)" : '');
        case 'livello_avviso':            return $t['livello_avviso'] . (isset($data['motivo']) ? ': ' . $data['motivo'] : '');
        case 'livello_perso':             return $t['livello_perso'] . (isset($data['livello']) ? ' ' . $data['livello'] : '');
        default:                          return $t['generic'];
    }
}

/* Le notifiche appena nate. Solo le ultime 24 ore: un arretrato piu' vecchio
   (per esempio dopo un fermo lungo) non deve gonfiare i telefoni. */
$pdo->exec("update notifications set push_sent_at = now()
             where push_sent_at is null and created_at < now() - interval '24 hours'");
$coda = $pdo->query(
    "select n.id, n.user_id, n.event::text as event, n.data,
            coalesce(pr.username, '') as actor
       from notifications n
       left join profiles pr on pr.id = n.actor_id
      where n.push_sent_at is null
      order by n.created_at
      limit 200"
)->fetchAll(PDO::FETCH_ASSOC);

if (!$coda) exit(0);

$webPush = new WebPush([
    'VAPID' => [
        'subject'    => $env['VAPID_SUBJECT'] ?? 'mailto:info@321.it',
        'publicKey'  => $env['VAPID_PUBLIC'],
        'privateKey' => $env['VAPID_PRIVATE'],
    ],
]);
$webPush->setDefaultOptions(['TTL' => 86400, 'urgency' => 'normal']);

/* Gli avvisi "di conto" (promemoria abbonamento, livello, invito a
   ricambiare) non hanno una levetta propria nel pannello: partono se
   l'utente ha acceso il canale browser su QUALUNQUE tipo. Chi ha detto
   si' agli avvisi non deve perdersi proprio quelli che contano. */
$stDisp = $pdo->prepare(
    "select s.endpoint, s.p256dh, s.auth, s.lingua
       from push_iscrizioni s
      where s.user_id = ?
        and case when ? in ('segui_invito','abbonamento_promemoria','livello_avviso','livello_perso')
             then exists (select 1 from notification_prefs np
                           where np.user_id = s.user_id and np.browser)
             else exists (select 1 from notification_prefs np
                           where np.user_id = s.user_id
                             and np.event::text = ?
                             and np.browser)
            end"
);
$stTimbro = $pdo->prepare("update notifications set push_sent_at = now() where id = ?");
$stMorto  = $pdo->prepare("delete from push_iscrizioni where endpoint = ?");

$spedite = 0; $morti = 0;
foreach ($coda as $n) {
    $stDisp->execute([$n['user_id'], $n['event'], $n['event']]);
    $dispositivi = $stDisp->fetchAll(PDO::FETCH_ASSOC);
    $data = json_decode($n['data'] ?: '{}', true) ?: [];
    foreach ($dispositivi as $d) {
        $lingua = isset($TESTI[$d['lingua']]) ? $d['lingua'] : 'en';
        $corpo = json_encode([
            'title' => 'POI•LOVE',
            'body'  => componi($TESTI[$lingua], $n['event'], $data, $n['actor']),
            'tag'   => 'poilove-' . $n['id'],
            'url'   => 'https://poilove.com/',
        ], JSON_UNESCAPED_UNICODE);
        $webPush->queueNotification(Subscription::create([
            'endpoint' => $d['endpoint'],
            'keys'     => ['p256dh' => $d['p256dh'], 'auth' => $d['auth']],
        ]), $corpo);
    }
    // Timbrata PRIMA dell'invio, di proposito: se il processo muore tra il
    // timbro e la spedizione si perde al massimo una push (che vive comunque
    // nella campanella in-app), mentre il contrario, timbro dopo, potrebbe
    // rispedire la stessa push a ogni giro su una riga avvelenata. Meglio
    // una persa che cento doppie.
    $stTimbro->execute([$n['id']]);
}

try {
    foreach ($webPush->flush() as $rapporto) {
        if ($rapporto->isSuccess()) { $spedite++; continue; }
        if ($rapporto->isSubscriptionExpired()) {
            $stMorto->execute([$rapporto->getEndpoint()]);
            $morti++;
            continue;
        }
        fwrite(STDERR, date('c') . ' push respinta: ' . $rapporto->getReason() . "\n");
    }
} catch (Throwable $e) {
    // Un errore di rete o della libreria non deve uccidere il giro in
    // silenzio: si scrive nel diario e il prossimo minuto si riprova
    // con le notifiche nuove (queste restano timbrate: vedi sopra).
    fwrite(STDERR, date('c') . ' spedizione fallita: ' . $e->getMessage() . "\n");
}
if ($spedite || $morti) {
    echo date('c') . " notifiche " . count($coda) . ", push spedite $spedite, iscrizioni morte tolte $morti\n";
}
