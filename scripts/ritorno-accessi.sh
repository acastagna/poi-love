#!/bin/bash
# © Alessandro Castagna — 321.al / EVOLAB
# RITORNO INDIETRO: riporta gli accessi di POI•LOVE su Supabase.
set -uo pipefail
cd "/Users/alessandrocastagna/AI (produzione)/• POI•LOVE" || exit 1
ORIG="https://ptppxwlafswfhbueakjt.supabase.co"
echo "Riporto gli accessi su Supabase..."
sed -i '' "s#https://poilove.com/db#$ORIG#g" webapp/index.html webapp/*.php
grep -n "SUPABASE_URL =" webapp/index.html | head -1
V=$(grep -oE "APP_VERSION='[0-9.]+'" webapp/index.html | grep -oE '[0-9]+\.[0-9]+')
OUT=$(mktemp -d)
node scripts/deploy_split.js webapp/index.html "$OUT" "$V" >/dev/null
rsync -e "ssh -i ~/.ssh/poilove_srv -o StrictHostKeyChecking=no" -a "$OUT/index.html" "$OUT/app.js" root@178.104.87.47:/var/www/poilove/httpdocs/
rsync -e "ssh -i ~/.ssh/evolab_deploy -o StrictHostKeyChecking=no" -a "$OUT/index.html" "$OUT/app.js" root@46.4.70.47:/var/www/vhosts/poilove.com/httpdocs/
ssh -i ~/.ssh/poilove_srv -o StrictHostKeyChecking=no root@178.104.87.47 'chown poilove:poilove /var/www/poilove/httpdocs/{index.html,app.js}'
echo "Fatto. Verifica in corso:"
bash scripts/controllo.sh | tail -3
