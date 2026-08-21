#!/bin/bash
# © Alessandro Castagna — 321.al / EVOLAB
# Tutti i diritti riservati. Uso non autorizzato vietato.
# info@321.it · https://321.al
#
# Il capo della coda che sta sul Mac.
#
# Il pannello mette una domanda nella coda; questo comando la tira fuori e la
# stampa, perche' a rispondere sia chi sta gia' girando qui con la connessione
# di Alessandro. Cosi' ricerca e copione non costano niente: non passano da
# nessuna chiave a pagamento.
#
# Uso:
#   scripts/coda.sh              guarda cosa c'e' in coda
#   scripts/coda.sh prendi       prende la prossima e la stampa
#   scripts/coda.sh rispondi <id> <file>   riporta la risposta scritta in un file
#   scripts/coda.sh sblocca      libera quelle prese e mai finite
set -u

MACCHINA="ssh -i $HOME/.ssh/poilove_srv root@178.104.87.47"
PSQL="sudo -u postgres psql -p 5433 -d poilove"

sql(){ $MACCHINA "$PSQL -A -t -c \"$1\"" 2>/dev/null; }

case "${1:-guarda}" in
  guarda)
    echo "── la coda ──"
    $MACCHINA "$PSQL -A -F' | ' -c \"
      select stato, count(*), min(chiesto_il)::timestamp(0) as la_piu_vecchia
        from public.ai_coda group by stato order by 1\""
    echo
    $MACCHINA "$PSQL -A -F' | ' -c \"
      select left(id::text,8) as id, fase, left(domanda,58) as domanda, chiesto_il::timestamp(0)
        from public.ai_coda where stato='in_attesa' order by chiesto_il limit 10\""
    ;;

  prendi)
    riga=$(sql "select id||E'\t'||fase||E'\t'||coalesce(poi_id::text,'')||E'\t'||replace(domanda, E'\n', '\\\\n') from public.coda_prendi('mac')")
    if [ -z "$riga" ]; then echo "niente in coda"; exit 0; fi
    id=$(echo "$riga"   | cut -f1)
    fase=$(echo "$riga" | cut -f2)
    poi=$(echo "$riga"  | cut -f3)
    echo "id:   $id"
    echo "fase: $fase"
    [ -n "$poi" ] && echo "luogo: $poi"
    echo "── domanda ──"
    sql "select domanda from public.ai_coda where id='$id'"
    ;;

  rispondi)
    id="${2:-}"; file="${3:-}"
    if [ -z "$id" ] || [ ! -f "$file" ]; then
      echo "uso: scripts/coda.sh rispondi <id> <file con la risposta>"; exit 1
    fi
    scp -i "$HOME/.ssh/poilove_srv" -q "$file" root@178.104.87.47:/tmp/risposta.txt
    $MACCHINA "$PSQL -v ON_ERROR_STOP=1 -A -t -c \"
      select public.coda_rispondi('$id', pg_read_file('/tmp/risposta.txt'), 0)\"; rm -f /tmp/risposta.txt"
    ;;

  sblocca)
    echo -n "sbloccate: "; sql "select public.coda_sblocca()"
    ;;

  *) echo "uso: scripts/coda.sh [guarda|prendi|rispondi <id> <file>|sblocca]"; exit 1 ;;
esac
