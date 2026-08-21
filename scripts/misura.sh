#!/bin/bash
# © Alessandro Castagna — 321.al / EVOLAB
# Tutti i diritti riservati. Uso non autorizzato vietato.
# info@321.it · https://321.al
#
# Le misure di velocita di POI-LOVE, rifacibili quando si vuole.
# Fino a oggi i numeri della pagina sal.poilove.com/velocita.html erano stati
# presi a mano con comandi scritti al momento e poi persi. Questo script sta nel
# repository: chiunque puo rilanciarlo e ottenere gli stessi numeri, oppure
# scoprire che sono cambiati.
#
# Uso:
#   scripts/misura.sh              dodici prove per passo, tabella a schermo
#   scripts/misura.sh 30           trenta prove per passo
#   scripts/misura.sh 12 --json    scrive anche docs/misure.json
#   scripts/misura.sh 12 --macchina  misura anche DALLA macchina (serve la chiave ssh)
#
# Cosa misura, e perche' proprio questo:
#   1. la pagina        quanto ci mette ad arrivare il primo file
#   2. il motore        app.js, il pezzo grosso che fa funzionare tutto
#   3. i primi dati     la vera prima domanda che l app fa al database
#   4. il lavoro nostro il tempo tolto il viaggio di rete e la cifratura:
#                       e' l unico pezzo su cui possiamo intervenire noi
set -u

QUANTE=${1:-12}
SCRIVI_JSON=0; DA_MACCHINA=0
for a in "$@"; do
  [ "$a" = "--json" ] && SCRIVI_JSON=1
  [ "$a" = "--macchina" ] && DA_MACCHINA=1
done

SITO=https://poilove.com
DATI="$SITO/db/rest/v1/pois?select=id,title&limit=20"
CURL=(curl -s -o /dev/null --max-time 20 -H 'Cache-Control: no-cache')

# millesimi di secondo, interi: i decimali qui non dicono niente a nessuno
ms(){ awk -v v="$1" 'BEGIN{printf "%d", v*1000}'; }

mediana(){
  # la mediana e non la media: una singola giornata storta non deve spostare il numero
  printf '%s\n' "$@" | sort -n | awk '{a[NR]=$1} END{ if(NR%2) print a[(NR+1)/2]; else print int((a[NR/2]+a[NR/2+1])/2) }'
}
minimo(){ printf '%s\n' "$@" | sort -n | head -1; }
massimo(){ printf '%s\n' "$@" | sort -n | tail -1; }

riga(){ printf "  %-24s %6s   %6s   %6s\n" "$1" "$2" "$3" "$4"; }

echo
echo "MISURE DI POI-LOVE · $(TZ=Europe/Rome date '+%d/%m/%Y %H:%M') · $QUANTE prove per passo"
echo "  Ogni numero e' in millesimi di secondo. Niente valori inventati:"
echo "  se una richiesta non risponde, il passo si ferma e lo dice."
echo
riga "passo" "mediana" "minimo" "massimo"
echo "  ────────────────────────────────────────────────────────"

declare -a P_PAGINA P_MOTORE P_DATI P_NOSTRO
FALLITE=0

for i in $(seq 1 "$QUANTE"); do
  # 1. la pagina (col segnalibro dell app, altrimenti arriva la presentazione)
  t=$("${CURL[@]}" -H 'Cookie: pl_app=1' -w '%{time_total}' "$SITO/") || t=""
  [ -n "$t" ] && P_PAGINA+=("$(ms "$t")") || FALLITE=$((FALLITE+1))

  # 2. il motore dell app
  t=$("${CURL[@]}" -w '%{time_total}' "$SITO/app.js") || t=""
  [ -n "$t" ] && P_MOTORE+=("$(ms "$t")") || FALLITE=$((FALLITE+1))

  # 3. i primi dati, e dentro la stessa chiamata il lavoro nostro:
  #    tempo fino al primo byte meno il tempo di collegamento e cifratura
  out=$("${CURL[@]}" -w '%{time_total} %{time_starttransfer} %{time_appconnect}' "$DATI") || out=""
  if [ -n "$out" ]; then
    set -- $out
    P_DATI+=("$(ms "$1")")
    P_NOSTRO+=("$(awk -v a="$2" -v b="$3" 'BEGIN{d=(a-b)*1000; if(d<0)d=0; printf "%d", d}')")
  else
    FALLITE=$((FALLITE+1))
  fi
  sleep 0.3
done

for nome in pagina motore dati nostro; do
  case $nome in
    pagina) vals=("${P_PAGINA[@]}");  etichetta="la pagina" ;;
    motore) vals=("${P_MOTORE[@]}");  etichetta="il motore dell app" ;;
    dati)   vals=("${P_DATI[@]}");    etichetta="i primi dati" ;;
    nostro) vals=("${P_NOSTRO[@]}");  etichetta="il lavoro nostro" ;;
  esac
  if [ ${#vals[@]} -eq 0 ]; then
    riga "$etichetta" "—" "—" "—"
  else
    riga "$etichetta" "$(mediana "${vals[@]}")" "$(minimo "${vals[@]}")" "$(massimo "${vals[@]}")"
  fi
done

AVVIO=$(( $(mediana "${P_PAGINA[@]}") + $(mediana "${P_MOTORE[@]}") + $(mediana "${P_DATI[@]}") ))
echo "  ────────────────────────────────────────────────────────"
riga "un avvio intero" "$AVVIO" "" ""
echo
[ "$FALLITE" -gt 0 ] && echo "  ATTENZIONE: $FALLITE richieste non hanno risposto." && echo

echo "  Queste misure sono prese da questo computer: dentro ci sta anche il"
echo "  viaggio fino in Albania, che nessun server puo togliere. Per sapere"
echo "  quanto lavora davvero la macchina, si misura da dentro: --macchina."
echo

if [ "$DA_MACCHINA" = "1" ]; then
  echo "  DALLA MACCHINA (nessun viaggio di rete: e' solo lavoro sui dati)"
  DENTRO=$(ssh -i ~/.ssh/poilove_srv -o ConnectTimeout=10 root@178.104.87.47 \
    "for i in \$(seq 1 $QUANTE); do curl -s -o /dev/null -w '%{time_total}\n' \
       'http://127.0.0.1:3001/pois?select=id,title&limit=20' \
       -H 'Authorization: Bearer '\$(cat /opt/poilove/service.jwt); done" 2>/dev/null)
  if [ -n "$DENTRO" ]; then
    declare -a P_DENTRO
    while read -r v; do [ -n "$v" ] && P_DENTRO+=("$(ms "$v")"); done <<< "$DENTRO"
    riga "lavoro sui dati" "$(mediana "${P_DENTRO[@]}")" "$(minimo "${P_DENTRO[@]}")" "$(massimo "${P_DENTRO[@]}")"
  else
    echo "  non sono riuscito a entrare nella macchina: misura saltata"
  fi

  # Quanto e' occupata la macchina: e' il numero che dice se regge il lancio.
  CARICO=$(ssh -i ~/.ssh/poilove_srv -o ConnectTimeout=10 root@178.104.87.47 \
    "echo \"cuori \$(nproc) · carico \$(cut -d' ' -f1 /proc/loadavg) · memoria \$(free -m | awk '/^Mem:/{printf \"%d di %d MB\", \$3, \$2}') · disco \$(df -h / | awk 'NR==2{print \$5\" di \"\$2}')\"" 2>/dev/null)
  if [ -n "$CARICO" ]; then
    echo
    echo "  COM E MESSA LA MACCHINA"
    echo "  $CARICO"
  fi
  echo
fi

if [ "$SCRIVI_JSON" = "1" ]; then
  DEST="$(cd "$(dirname "$0")/.." && pwd)/docs/misure.json"
  {
    printf '{\n'
    printf '  "quando": "%s",\n' "$(TZ=Europe/Rome date '+%Y-%m-%d %H:%M')"
    printf '  "prove": %d,\n' "$QUANTE"
    printf '  "non_risposte": %d,\n' "$FALLITE"
    printf '  "pagina": [%s],\n' "$(IFS=,; echo "${P_PAGINA[*]}")"
    printf '  "motore": [%s],\n' "$(IFS=,; echo "${P_MOTORE[*]}")"
    printf '  "dati": [%s],\n' "$(IFS=,; echo "${P_DATI[*]}")"
    printf '  "lavoro_nostro": [%s],\n' "$(IFS=,; echo "${P_NOSTRO[*]}")"
    printf '  "avvio_mediano": %d\n' "$AVVIO"
    printf '}\n'
  } > "$DEST"
  echo "  scritto $DEST"
  echo
fi
