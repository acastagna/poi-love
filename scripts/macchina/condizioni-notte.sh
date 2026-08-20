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
RIGA=$(sudo -u postgres psql -p 5433 -d poilove -Atc \
  "select 'guardati '||guardati||', avvisati '||avvisati||', persi '||persi from public.controlla_condizioni();" 2>&1)
echo "$(date '+%d/%m/%Y %H:%M') · $RIGA" >> "$LOG"
