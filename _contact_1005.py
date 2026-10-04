# 사진 후보 접촉 시트(번호 라벨) 생성 — 2026-10-05 블로그 4편
import os, sys, math
from PIL import Image, ImageDraw, ImageFont
P = r'C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업'
F = ImageFont.truetype(r'C:\Windows\Fonts\malgun.ttf', 18)
for n in ['경기도자비엔날레', '감악산꽃별여행', '청원생명축제', '광주비엔날레']:
    d = os.path.join(P, f'{n}_사진_2026-10-05', '_후보')
    fs = sorted([f for f in os.listdir(d) if f.lower().endswith('.jpg')])
    per = 30; cols = 6; W = 300; H = 225
    for s in range(0, len(fs), per):
        chunk = fs[s:s + per]; rows = math.ceil(len(chunk) / cols)
        sheet = Image.new('RGB', (cols * W, rows * (H + 26)), 'white'); dr = ImageDraw.Draw(sheet)
        for i, f in enumerate(chunk):
            try:
                im = Image.open(os.path.join(d, f)).convert('RGB'); im.thumbnail((W - 4, H - 4))
            except Exception:
                continue
            x = (i % cols) * W; y = (i // cols) * (H + 26)
            sheet.paste(im, (x + 2, y + 2)); dr.text((x + 4, y + H), f[:26], fill='black', font=F)
        out = os.path.join(P, f'{n}_사진_2026-10-05', f'_sheet_{s // per + 1}.jpg')
        sheet.save(out, quality=80); print(out)
