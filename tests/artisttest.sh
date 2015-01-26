
#convert -size 512x512 xc:none -draw "roundrectangle 0,0,512,512,40,40" png:- |\
#convert image.jpg -matte - -compose DstIn -composite \( +clone -alpha on -fill 'rgb(182,70,34)' -colorize 90 -background "gray(5%)" -vignette 0x20 \) \( +clone -alpha set -channel A -evaluate set 100% \) -compose dissolve -composite test.png

#convert image.jpg -alpha set -virtual-pixel transparent -channel A -blur 0x8  -level 30%,100% +channel test.png

#Slow
#convert image.jpg -alpha set -virtual-pixel transparent -channel A -radial-blur 0x100 +channel test.png

convert image.jpg \
-fill 'green' -colorize 0,0,80 \
-alpha set -virtual-pixel transparent -channel A -blur 0x8  -level 30%,100% +channel \
\( +clone -alpha extract -virtual-pixel black \
-spread 10 -blur 0x3 -threshold 50% -spread 4 -blur 10x.7 \) \
-alpha off -compose Copy_Opacity \
-composite test.png

open test.png
