#!/bin/bash
# createArtistImage.sh originalImage.jpg "rgb(10,38,80)" outputImage.png
convert $1 \
-strip \
-fill $2 -colorize 20,20,20 \
\( +clone -alpha extract -virtual-pixel black \
-spread 30 -blur 0x3 -threshold 50% -spread 10 -blur 10x5 \) \
-alpha off -compose Copy_Opacity \
-depth 8 \
-composite png:$3
