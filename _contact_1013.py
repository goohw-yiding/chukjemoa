# -*- coding: utf-8 -*-
import os
from PIL import Image, ImageDraw, ImageFont
P = r'C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업'
F = ImageFont.truetype(r'C:\Windows\Fonts\malgun.ttf', 22)
for d in ['칠곡낙동강평화축제_사진_2026-10-13', '충청주말축제_사진_2026-10-13', '황매산억새_사진_2026-10-13']:
    c = os.path.join(P, d, '_후보'); fs = sorted(os.listdir(c)); fs = [f for f in fs if f.endswith('.jpg')]
    cols = 3; tw, th = 420, 300; rows = (len(fs) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * tw, rows * (th + 30)), 'white'); dr = ImageDraw.Draw(sheet)
    for i, f in enumerate(fs):
        im = Image.open(os.path.join(c, f)).convert('RGB'); im.thumbnail((tw, th))
        x, y = (i % cols) * tw, (i // cols) * (th + 30)
        sheet.paste(im, (x, y)); dr.text((x + 4, y + th + 2), f, fill='black', font=F)
    sheet.save(os.path.join(r'C:\dev\chukjemoa\_cards_tmp_1012', 'cs_' + d[:4] + '.jpg'), quality=80)
print('ok')
