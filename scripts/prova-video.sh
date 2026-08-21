#!/bin/bash
# © Alessandro Castagna — 321.al / EVOLAB
# Tutti i diritti riservati. Uso non autorizzato vietato.
# info@321.it · https://321.al
#
# Prova della compressione dei video del luogo, da lanciare SULLA macchina.
# Fabbrica un video finto delle dimensioni di quelli di un telefono, lo passa
# per la stessa strada che fa un video vero (video.php) e dice quanto pesa
# prima, quanto dopo e quanto ci mette. Serve per sapere se la macchina regge
# il video di un locale senza far aspettare la persona.
#
# Uso, dentro la macchina:  bash prova-video.sh [secondi]
set -u
SECONDI=${1:-20}
cd /tmp || exit 1

echo "Fabbrico un video di prova di $SECONDI secondi, come quello di un telefono…"
ffmpeg -y -f lavfi -i "testsrc2=size=1080x1920:rate=30:duration=$SECONDI" \
       -f lavfi -i "sine=frequency=440:duration=$SECONDI" \
       -c:v libx264 -preset ultrafast -qp 0 -pix_fmt yuv420p -c:a aac \
       /tmp/prova-telefono.mp4 >/dev/null 2>&1 || { echo "ffmpeg non c'e' o non ce l'ha fatta"; exit 1; }
echo "  prima:  $(du -m /tmp/prova-telefono.mp4 | cut -f1) MB"

A=$(date +%s)
# Le stesse istruzioni che usa video.php sulla macchina: se cambiano li',
# vanno cambiate anche qui, altrimenti questa prova non misura piu' niente.
ffmpeg -y -i /tmp/prova-telefono.mp4 \
  -vf "scale='if(gt(iw,ih),min(1080,iw),-2)':'if(gt(iw,ih),-2,min(1080,ih))'" \
  -c:v libx264 -preset veryfast -crf 23 -maxrate 2500k -bufsize 5000k \
  -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k -ac 2 -map_metadata -1 \
  /tmp/prova-compresso.mp4 >/dev/null 2>&1
B=$(date +%s)
echo "  dopo:   $(du -m /tmp/prova-compresso.mp4 | cut -f1) MB, in $((B-A)) secondi"

ffprobe -v error -select_streams v:0 -show_entries stream=width,height,codec_name \
        -show_entries format=duration -of default=nw=1 /tmp/prova-compresso.mp4 | sed 's/^/  /'

ffmpeg -y -ss 1 -i /tmp/prova-compresso.mp4 -frames:v 1 -q:v 4 /tmp/prova-poster.jpg >/dev/null 2>&1
echo "  copertina: $(du -k /tmp/prova-poster.jpg | cut -f1) KB"
rm -f /tmp/prova-telefono.mp4 /tmp/prova-compresso.mp4 /tmp/prova-poster.jpg
