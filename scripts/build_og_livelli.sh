#!/bin/bash
# © Alessandro Castagna — 321.al / EVOLAB
# Tutti i diritti riservati. Uso non autorizzato vietato.
# info@321.it · https://321.al
#
# Costruisce l'immagine di anteprima (OpenGraph) della pagina dei livelli, una per
# lingua, con dentro SCHERMATE VERE dell'app messe di traverso (niente disegni finti).
#
#   bash scripts/build_og_livelli.sh
#
# Come funziona: apre l'app dentro tre telefoni finti (cornice), la fotografa con
# Chrome a 1200x630 e comprime in JPEG finche' sta sotto i 100 KB veri (98.000 byte).
# Scrive: web/img/og-livelli-{it,sq,en}.jpg e la copia sul SAL.
set -e
cd "$(dirname "$0")/.."
LAVORO=$(mktemp -d)
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Chrome non trovato: serve per fotografare l'app"; exit 1; }

modello() {   # $1 lingua, $2 titolo, $3 sottotitolo, $4..$6 righe, $7 firma
cat > "$LAVORO/comp-$1.html" <<HTML
<!DOCTYPE html><html lang="$1"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1200px;height:630px;overflow:hidden;position:relative;
       background:radial-gradient(120% 130% at 12% 10%, #D42B2B 0%, #8f1c1c 42%, #2a0d0d 100%);
       font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif;color:#fff}
  .trama{position:absolute;inset:0;background:repeating-linear-gradient(115deg, rgba(255,255,255,.05) 0 2px, transparent 2px 26px);opacity:.5}
  .testo{position:absolute;left:64px;top:96px;width:470px;z-index:3}
  .occhiello{display:inline-flex;align-items:center;gap:9px;font-size:17px;font-weight:900;letter-spacing:2px;
       text-transform:uppercase;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);
       border-radius:30px;padding:9px 18px;margin-bottom:22px}
  h1{font-size:76px;line-height:.98;font-weight:900;letter-spacing:-2px}
  h1 small{display:block;font-size:29px;font-weight:800;letter-spacing:-.4px;opacity:.92;margin-top:16px;line-height:1.25}
  .righe{margin-top:26px;display:flex;flex-direction:column;gap:9px;font-size:19px;font-weight:800}
  .righe span{display:flex;align-items:center;gap:10px}
  .righe i{font-size:21px;opacity:.95}
  .telefoni{position:absolute;right:-6px;top:0;bottom:0;width:720px;z-index:2}
  .tel{position:absolute;width:390px;height:844px;border-radius:44px;overflow:hidden;
       border:11px solid #0d0b0a;box-shadow:0 40px 90px rgba(0,0,0,.55);background:#EAE4D8;transform-origin:center}
  .tel img{width:390px;height:844px;object-fit:cover;object-position:top center;display:block}
  .t1{left:0px;   top:158px; transform:rotate(-13deg) scale(.60)}
  .t2{left:196px; top:104px; transform:rotate(-7deg)  scale(.70);z-index:2}
  .t3{left:388px; top:176px; transform:rotate(-2deg)  scale(.60)}
  .firma{position:absolute;left:64px;bottom:52px;display:flex;align-items:center;gap:12px;font-size:20px;font-weight:900;z-index:3}
  .firma .cuore{color:#fff;font-size:26px}
  .firma .sotto{font-size:15px;font-weight:700;opacity:.85}
</style></head><body>
  <div class="trama"></div>
  <div class="testo">
    <div class="occhiello"><i class="ph-fill ph-medal"></i> POI•LOVE</div>
    <h1>$2<small>$3</small></h1>
    <div class="righe">
      <span><i class="ph-fill ph-star"></i> $4</span>
      <span><i class="ph-fill ph-hand-heart"></i> $5</span>
      <span><i class="ph-fill ph-storefront"></i> $6</span>
    </div>
  </div>
  <div class="telefoni">
    <div class="tel t1"><img src="schermo-mappa.png"></div>
    <div class="tel t2"><img src="schermo-livelli-$1.png"></div>
    <div class="tel t3"><img src="schermo-presentazione-$1.png"></div>
  </div>
  <div class="firma"><i class="ph-fill ph-heart cuore"></i>
    <div>POI•LOVE<div class="sotto">$7</div></div></div>
</body></html>
HTML
}

modello it "I livelli" "Personali, di sostegno, professionali: cosa danno e cosa serve per tenerli." \
  "5 livelli personali a punti" "Sostenitore e Mecenate" "Influencer, Professionista, Plus" \
  "poilove.com · la mappa fatta dalle persone"
modello sq "Nivelet" "Personale, mbështetjeje, profesionale: çfarë japin dhe çfarë duhet për t'i mbajtur." \
  "5 nivele personale me pikë" "Mbështetës dhe Mecen" "Influencer, Profesionist, Plus" \
  "poilove.com · harta e bërë nga njerëzit"
modello en "The levels" "Personal, support, professional: what they give and what it takes to keep them." \
  "5 personal levels by points" "Supporter and Patron" "Influencer, Professional, Plus" \
  "poilove.com · the map made by people"

# ── Le schermate vere, una alla volta: cosi' ognuna ha il tempo di caricare ──
foto(){ "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
        --virtual-time-budget=25000 --window-size=390,844 --screenshot="$LAVORO/$1" "$2" >/dev/null 2>&1; }
foto schermo-mappa.png "https://poilove.com/?ospite=1&scatto=1"
for L in it sq en; do
  foto "schermo-livelli-$L.png"       "https://poilove.com/?livelli=1&lang=$L&scatto=$L"
  foto "schermo-presentazione-$L.png" "https://poilove.com/$L/?scatto=$L"
done

mkdir -p web/img sal/img
for L in it sq en; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --virtual-time-budget=34000 --window-size=1200,630 --allow-file-access-from-files \
    --screenshot="$LAVORO/og-$L.png" "file://$LAVORO/comp-$L.html" >/dev/null 2>&1
  # JPEG sempre sotto i 100 KB: scendo di qualita' finche' ci sta
  for Q in 62 55 48 42 36 30; do
    sips -s format jpeg -s formatOptions $Q "$LAVORO/og-$L.png" --out "web/img/og-livelli-$L.jpg" >/dev/null 2>&1
    PESO=$(stat -f%z "web/img/og-livelli-$L.jpg")
    if [ "$PESO" -lt 98000 ]; then break; fi
  done
  cp "web/img/og-livelli-$L.jpg" "sal/img/og-livelli-$L.jpg"
  echo "  og-livelli-$L.jpg · qualita $Q · $((PESO/1024)) KB"
done
rm -rf "$LAVORO"
echo "Fatto: tre immagini di anteprima, una per lingua."
