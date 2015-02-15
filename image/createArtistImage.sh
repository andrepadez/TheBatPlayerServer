#!/bin/bash
# createArtistImage.sh originalImage.jpg "rgb(10,38,80)" outputImage.png

convert $1 \
-depth 8 \
-strip \
-fill $2 -colorize 13% \
-resize 500x330^ \
\( +clone -alpha extract -virtual-pixel black \
-spread 50 -blur 0x3 -threshold 50% \) \
-alpha off -compose Copy_Opacity \
-depth 8 \
-composite \
-trim \
png:$3
