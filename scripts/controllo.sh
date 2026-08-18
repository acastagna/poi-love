#!/bin/bash
# © Alessandro Castagna — 321.al / EVOLAB
# Tutti i diritti riservati. Uso non autorizzato vietato.
# info@321.al · https://321.al
#
# CONTROLLO POI•LOVE — verifica dall'ESTERNO, non si fida di nessuna affermazione.
# Risolve i nomi con un DNS pubblico: ignora il router di casa e il file /etc/hosts.
#
# Uso:   cd "/Users/alessandrocastagna/AI (produzione)/• POI•LOVE" && bash scripts/controllo.sh
#        bash scripts/controllo.sh 46.4.70.47     ← per controllare il server vecchio
#
# REGOLA DI COSTRUZIONE: una prova che non riesce a misurare DEVE fallire, mai passare.
# Ogni confronto rifiuta il valore vuoto: un dato mancante non e' mai una conferma.

set -uo pipefail
OK=0; KO=0
red(){ printf "\033[31m%s\033[0m" "$1"; }; grn(){ printf "\033[32m%s\033[0m" "$1"; }

IP="${1:-}"
if [ -z "$IP" ]; then
  IP=$(dig +short poilove.com @1.1.1.1 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | tail -1)
fi
if ! printf '%s' "$IP" | grep -qE '^[0-9]{1,3}(\.[0-9]{1,3}){3}$'; then
  red "  ERRORE"; echo " il DNS pubblico non ha dato un indirizzo valido ('$IP'). Controllo interrotto."
  exit 1
fi
RES="--resolve poilove.com:443:$IP --resolve poilove.com:80:$IP --resolve www.poilove.com:443:$IP"
for h in admin sal project media; do RES="$RES --resolve $h.poilove.com:443:$IP"; done
C="curl -s --max-time 25 $RES"

# prova NOME | COMANDO | ATTESO   → fallisce se il comando non produce nulla
prova(){
  local nome="$1" val
  val=$(eval "$2" 2>/dev/null | tr -d '\n\r')
  if [ -z "$val" ]; then
    red "  KO  "; echo "$nome → nessun dato misurato (prova non riuscita, non e' una conferma)"; KO=$((KO+1)); return
  fi
  if [ "$val" = "$3" ]; then grn "  OK  "; echo "$nome"; OK=$((OK+1))
  else red "  KO  "; echo "$nome → trovato '$val', atteso '$3'"; KO=$((KO+1)); fi
}

echo "═══ CONTROLLO POI•LOVE · $(TZ='Europe/Rome' date '+%d/%m/%Y %H:%M') ═══"
echo "  server misurato: $IP"
[ "$IP" = "46.4.70.47" ] && echo "  (questo e' il SERVER VECCHIO)"
echo

echo "── i siti rispondono ──"
for h in poilove.com www.poilove.com admin.poilove.com sal.poilove.com project.poilove.com; do
  prova "$h" "$C -o /dev/null -w '%{http_code}' https://$h/" "200"
done

echo
echo "── cifratura ──"
prova "certificato Let's Encrypt" \
  "echo | openssl s_client -connect $IP:443 -servername poilove.com 2>/dev/null | openssl x509 -noout -issuer | grep -o \"Let's Encrypt\"" \
  "Let's Encrypt"
prova "chi arriva in chiaro viene rimandato" \
  "$C -o /dev/null -w '%{http_code}' http://poilove.com/" "301"

echo
echo "── la versione dell'app coincide ovunque ──"
V=$($C "https://poilove.com/version.txt" | tr -d '\n\r ')
if [ -z "$V" ]; then
  red "  KO  "; echo "version.txt non leggibile"; KO=$((KO+1))
else
  prova "version.txt ($V) e codice dell'app" \
    "$C 'https://poilove.com/app.js' | grep -oE \"APP_VERSION *= *'[0-9.]+'\" | head -1 | grep -oE '[0-9]+\.[0-9]+'" "$V"
fi

echo
echo "── condivisione di un POI ──"
PID=$($C "https://poilove.com/sitemap.php" | grep -oE 'poi\.php\?id=[0-9a-f-]{36}' | head -1 | cut -d= -f2)
if printf '%s' "$PID" | grep -qE '^[0-9a-f-]{36}$'; then
  prova "il link breve porta alla scheda" \
    "$C -o /dev/null -w '%{redirect_url}' 'https://poilove.com/p/$PID' | grep -o 'poi\.php'" "poi.php"
  prova "il referral viaggia col link" \
    "$C -o /dev/null -w '%{redirect_url}' 'https://poilove.com/p/$PID?ref=prova' | grep -o 'ref=prova'" "ref=prova"
  # l'anteprima si verifica in POSITIVO: deve esistere e NON essere quella generica
  OG=$($C -L -A 'WhatsApp/2.23' "https://poilove.com/p/$PID" | grep -oE '<meta property="og:image" content="[^"]+' | head -1 | sed 's/.*content="//')
  if [ -z "$OG" ]; then
    red "  KO  "; echo "anteprima: nessun og:image trovato"; KO=$((KO+1))
  elif printf '%s' "$OG" | grep -q 'img/opengraph.jpg'; then
    red "  KO  "; echo "anteprima: e' ancora quella generica ($OG)"; KO=$((KO+1))
  else
    prova "anteprima con foto vera, e l'immagine esiste" "$C -o /dev/null -w '%{http_code}' -L '$OG'" "200"
  fi
  prova "la scheda si vede senza accedere" \
    "$C -o /dev/null -w '%{http_code}' 'https://poilove.com/poi.php?id=$PID'" "200"
else
  red "  KO  "; echo "nessun POI valido trovato nella sitemap (trovato: '$PID')"; KO=$((KO+1))
fi

echo
echo "── peso delle foto (regola del progetto: sotto i 100 KB) ──"
FOTO=$($C "https://poilove.com/sitemap.php" | grep -oE 'poi\.php\?id=[0-9a-f-]{36}' | head -4 | cut -d= -f2)
PES=0; TOT=0
for f in $FOTO; do
  IMG=$($C "https://poilove.com/poi.php?id=$f" | grep -oE '<meta property="og:image" content="[^"]+' | head -1 | sed 's/.*content="//')
  [ -z "$IMG" ] && continue
  KB=$(( $(curl -s -o /dev/null -w '%{size_download}' --max-time 30 -L "$IMG") / 1024 ))
  TOT=$((TOT+1)); [ "$KB" -gt 100 ] && PES=$((PES+1))
  printf "    %5s KB  %s\n" "$KB" "$( [ "$KB" -gt 100 ] && red 'sopra il limite' || grn 'a posto')"
done
if [ "$TOT" -eq 0 ]; then
  red "  KO  "; echo "nessuna foto misurata"; KO=$((KO+1))
elif [ "$PES" -gt 0 ]; then
  red "  KO  "; echo "foto sopra i 100 KB: $PES su $TOT"; KO=$((KO+1))
else
  grn "  OK  "; echo "tutte le $TOT foto misurate sono sotto i 100 KB"; OK=$((OK+1))
fi

echo
echo "── pagine di servizio ──"
prova "pagina velocita del SAL" "$C -o /dev/null -w '%{http_code}' https://sal.poilove.com/velocita.html" "200"
for u in privacy terms sitemap.php robots.txt; do
  prova "/$u" "$C -o /dev/null -w '%{http_code}' -L https://poilove.com/$u" "200"
done

echo
printf "═══ ESITO: "; grn "$OK superate"; printf " · "
[ $KO -gt 0 ] && red "$KO fallite" || printf "0 fallite"
echo " ═══"
[ $KO -gt 0 ] && exit 1 || exit 0
