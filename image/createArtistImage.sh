#!/bin/bash
# createArtistImage.sh originalImage.jpg "rgb(10,38,80)" outputImage.png
convert $1 \
-fill $2 -colorize 0,0,80 \
-alpha set -virtual-pixel transparent -channel A -blur 0x8  -level 30%,100% +channel \
\( +clone -alpha extract -virtual-pixel black \
-spread 10 -blur 0x3 -threshold 50% -spread 4 -blur 10x.7 \) \
-alpha off -compose Copy_Opacity \
-composite png:$3
