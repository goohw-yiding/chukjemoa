# -*- coding: utf-8 -*-
# 지정 파일 크게 보기(워터마크 확인) — python _contact2_1012.py 폴더 출력 파일1 파일2 ...
import os, sys
from PIL import Image, ImageDraw, ImageFont
d, out, fs = sys.argv[1], sys.argv[2], sys.argv[3:]
tw, th = 600, 450; cols = 2; rows = (len(fs) + 1) // 2
sheet = Image.new('RGB', (cols * tw, rows * (th + 24)), 'white'); dr = ImageDraw.Draw(sheet)
font = ImageFont.truetype(r'C:\Windows\Fonts\malgun.ttf', 16)
for i, f in enumerate(fs):
    im = Image.open(os.path.join(d, f)).convert('RGB'); im.thumbnail((tw, th))
    x, y = (i % cols) * tw, (i // cols) * (th + 24); sheet.paste(im, (x, y)); dr.text((x + 3, y + th + 3), f, fill='black', font=font)
sheet.save(out, quality=85); print(out)
