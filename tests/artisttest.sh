convert image.jpg \( +clone -alpha on -fill 'rgb(182,70,34)' -colorize 90 -background "gray(5%)" -vignette 0x20 \) \( +clone -alpha set -channel A -evaluate set 100% \) -compose dissolve -composite test.png
open test.png
