#!/bin/bash
# © Alessandro Castagna — 321.al / EVOLAB
# Tutti i diritti riservati. Uso non autorizzato vietato.
# info@321.it · https://321.al
#
# Il cambio ufficiale della Banca d'Albania, una volta al giorno.
# Legge la pagina ufficiale, prende quanti Lek vale una unita' di ogni moneta
# e lo scrive nella tabella `cambi`. Se la pagina non risponde o cambia forma,
# non inventa niente: riporta l'ultimo valore conosciuto e lo segna come ricaduta.
# Gira alle 04:10 e alle 13:10 (vedi /etc/cron.d/poilove-cambio).

LOG=/var/log/poilove-cambio.log
PAGINA=https://www.bankofalbania.org/Tregjet/Kursi_zyrtar_i_kembimit/
TMP=$(mktemp)

curl -s --max-time 40 -A "Mozilla/5.0 (POILOVE)" "$PAGINA" -o "$TMP"

VALORI=$(python3 - "$TMP" <<'PY'
import re, sys
try:
    h = open(sys.argv[1], encoding='utf-8', errors='ignore').read()
except Exception:
    sys.exit(1)
# <TD nowrap>EUR</TD> <td align="right" nowrap>92.60</td>
# la data che la Banca stessa scrive come ultimo aggiornamento
giorno = ''
m = re.search(r'P&euml;rdit|Përdit', h)
if m:
    d = re.search(r'([0-3][0-9])\.([0-1][0-9])\.(20[0-9]{2})', h[m.end():m.end()+900])
    if d:
        giorno = d.group(3) + '-' + d.group(2) + '-' + d.group(1)

trovati = re.findall(r'<TD[^>]*>\s*(EUR|USD|GBP|CHF)\s*</TD>\s*<td[^>]*>\s*([0-9]+[.,][0-9]+)\s*</td>', h, re.I)
visti, righe = set(), []
for valuta, valore in trovati:
    v = valuta.upper()
    if v in visti:      # la prima tabella e' quella ufficiale del giorno
        continue
    visti.add(v)
    righe.append(v + '=' + valore.replace(',', '.'))
if not righe:
    sys.exit(2)
print((giorno or 'oggi') + ' ' + ' '.join(righe))
PY
)
ESITO=$?
rm -f "$TMP"

if [ $ESITO -ne 0 ] || [ -z "$VALORI" ]; then
  # ricaduta: si riporta a oggi l'ultimo valore conosciuto, segnandolo
  RIGA=$(sudo -u postgres psql -p 5433 -d poilove -Atc "
    insert into public.cambi(giorno, valuta, lek, fonte, ricaduta)
    select current_date, c.valuta, c.lek, c.fonte, true
      from public.cambi c
      join (select valuta, max(giorno) g from public.cambi where giorno < current_date group by valuta) u
        on u.valuta = c.valuta and u.g = c.giorno
    on conflict (giorno, valuta) do nothing;
    select 'ricaduta sull ultimo noto: '||count(*)||' monete' from public.cambi where giorno = current_date;" 2>&1 | tail -1)
  echo "$(date '+%d/%m/%Y %H:%M') · pagina non letta · $RIGA" >> "$LOG"
  exit 0
fi

GIORNO=${VALORI%% *}
VALORI=${VALORI#* }
if printf '%s' "$GIORNO" | grep -qE '^20[0-9]{2}-[01][0-9]-[0-3][0-9]$'; then DATA="date '$GIORNO'"; else DATA="current_date"; fi

SQL=""
for COPPIA in $VALORI; do
  V=${COPPIA%%=*}; L=${COPPIA##*=}
  # Prima di entrare in una istruzione SQL, la moneta e il numero si controllano:
  # la pagina della banca e' fuori casa nostra e un giorno puo' cambiare forma.
  case "$V" in EUR|USD|GBP|CHF) ;; *) echo "$(date '+%d/%m/%Y %H:%M') · moneta strana, saltata: $V" >> "$LOG"; continue ;; esac
  if ! printf '%s' "$L" | grep -qE '^[0-9]{1,6}(\.[0-9]{1,4})?$'; then
    echo "$(date '+%d/%m/%Y %H:%M') · numero strano per $V, saltato: $L" >> "$LOG"; continue
  fi
  SQL="$SQL insert into public.cambi(giorno,valuta,lek,ricaduta) values ($DATA,'$V',$L,false)
       on conflict (giorno,valuta) do update set lek=excluded.lek, ricaduta=false, preso=now();"
done
if [ -z "$SQL" ]; then
  echo "$(date '+%d/%m/%Y %H:%M') · nessun valore utilizzabile nella pagina" >> "$LOG"; exit 1
fi
RIGA=$(sudo -u postgres psql -p 5433 -d poilove -v ON_ERROR_STOP=1 -Atc "$SQL select to_char(max(giorno),'DD/MM/YYYY')||': '||string_agg(valuta||' '||lek,', ') from public.cambi where giorno=(select max(giorno) from public.cambi);" 2>&1 | tail -1)
echo "$(date '+%d/%m/%Y %H:%M') · $RIGA" >> "$LOG"
