#!/bin/bash
# Builds the Invoyr email banner (logo left, tagline right, on a navy-tinted
# hero photo). It is one flat image because Outlook desktop and some Gmail
# setups drop CSS background images. Needs ImageMagick and node (sharp).
#
#   scripts/build-email-banner.sh [hero image] [crop gravity]
set -euo pipefail
cd "$(dirname "$0")/.."
HERO=${1:-public/hero/hero-1.jpg}
GRAV=${2:-north}
OUT=public/brand/invoyr-email-banner.jpg
FONT=public/fonts/Geom-Regular.ttf
TMP=$(mktemp -d)
W=1120; H=320   # 2x the 560px email width

# Reversed wordmark: navy letters become white, the lime dot stays lime.
sed 's/#081026/#ffffff/' public/brand/invoyr-logo.svg > "$TMP/logo.svg"
node -e "require('sharp')('$TMP/logo.svg',{density:600}).resize({height:84}).png().toFile('$TMP/logo.png')"

magick "$HERO" -resize ${W}x -gravity "$GRAV" -crop ${W}x${H}+0+0 +repage \
  \( -size ${H}x${W} gradient:"rgba(8,16,38,0.93)-rgba(8,16,38,0.76)" -rotate 90 \) -compose over -composite \
  "$TMP/logo.png" -gravity west -geometry +64+0 -compose over -composite \
  -font "$FONT" -fill white -pointsize 46 -gravity east -annotate +64-30 "Get paid faster." \
  -fill "#8CD600" -pointsize 34 -annotate +64+30 "Invoicing that runs itself." \
  \( -size ${W}x8 xc:"#8CD600" \) -gravity south -compose over -composite \
  -strip -quality 85 -interlace JPEG "$OUT"

rm -rf "$TMP"
echo "$OUT"
