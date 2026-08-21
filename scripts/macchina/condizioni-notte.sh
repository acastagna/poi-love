#!/bin/bash
# © Alessandro Castagna — 321.al / EVOLAB
# Tutti i diritti riservati. Uso non autorizzato vietato.
# info@321.it · https://321.al
#
# Il controllo della notte: guarda chi ha un livello e se sta rispettando il patto.
# Chi e' fuori riceve un avviso; se dopo quattordici giorni non e' cambiato niente,
# il livello si spegne da solo. Tutto resta scritto nella tabella livello_eventi.
# Gira alle 03:20 ogni notte (vedi /etc/cron.d/poilove-condizioni).

LOG=/var/log/poilove-condizioni.log
RIGA=$(sudo -u postgres psql -p 5433 -d poilove -v ON_ERROR_STOP=1 -Atc \
  "select 'guardati '||guardati||', avvisati '||avvisati||', persi '||persi from public.controlla_condizioni();" 2>&1)
ESITO=$?
if [ $ESITO -ne 0 ]; then
  # Se il database non risponde il lavoro NON e' stato fatto: va scritto cosi',
  # altrimenti domani il registro sembra a posto e nessuno se ne accorge.
  echo "$(date '+%d/%m/%Y %H:%M') · NON FATTO (il database ha risposto male) · $RIGA" >> "$LOG"
  exit 1
fi
echo "$(date '+%d/%m/%Y %H:%M') · $RIGA" >> "$LOG"
