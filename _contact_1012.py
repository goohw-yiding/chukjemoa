# -*- coding: utf-8 -*-
# 후보 사진 접촉 인화(번호 라벨) — 눈으로 고르기용
import os, sys
from PIL import Image, ImageDraw, ImageFont
d = sys.argv[1]; out = sys.argv[2]; start = int(sys.argv[3]) if len(sys.argv) > 3 else 0; n = int(sys.argv[4]) if len(sys.argv) > 4 else 24
fs = sorted([f for f in os.listdir(d) if f.lower().endswith('.jpg')])[start:start + n]
cols = 4; tw, th = 300, 225
rows = (len(fs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * (th + 24)), 'white')
dr = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype(r'C:\Windows\Fonts\malgun.ttf', 15)
except: font = ImageFont.load_default()
for i, f in enumerate(fs):
    try:
        im = Image.open(os.path.join(d, f)).convert('RGB'); im.thumbnail((tw, th))
        x, y = (i % cols) * tw, (i // cols) * (th + 24)
        sheet.paste(im, (x, y)); dr.text((x + 3, y + th + 3), f[:34], fill='black', font=font)
    except Exception as e: print('ERR', f, e)
sheet.save(out, quality=80); print(out, len(fs))
