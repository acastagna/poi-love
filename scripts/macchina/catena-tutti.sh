#!/bin/bash
# © Alessandro Castagna — 321.al / EVOLAB
# Tutti i diritti riservati. Uso non autorizzato vietato.
# info@321.it · https://321.al
#
# La catena su tutti e quindici i viaggi, uno dietro l'altro.
# Va piano di proposito: OpenStreetMap e Wikipedia sono servizi gratuiti di
# altri, e chi corre troppo viene messo alla porta.

LOG=/var/log/poilove-candidati.log
QUANTI=${1:-14}
for N in $(seq 1 15); do
  echo "$(date '+%d/%m/%Y %H:%M') · viaggio $N" >> "$LOG"
  python3 /opt/poilove/candidati.py "$N" "$QUANTI" >> "$LOG" 2>&1
  sleep 8
done
echo "$(date '+%d/%m/%Y %H:%M') · catena finita" >> "$LOG"
