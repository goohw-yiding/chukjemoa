# 2026-10-05 블로그 4편 — 고른 사진을 번호 이름으로 복사 + 워터마크 점검용 모서리 시트
import os, shutil, json
from PIL import Image, ImageDraw, ImageFont
P = r'C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업'
F = ImageFont.truetype(r'C:\Windows\Fonts\malgun.ttf', 16)
PICKS = json.load(open(os.path.join(os.path.dirname(__file__), '_pick_1005.json'), encoding='utf-8'))
for n, items in PICKS.items():
    base = os.path.join(P, f'{n}_사진_2026-10-05'); cand = os.path.join(base, '_후보')
    tiles = []
    for src, dst in items:
        shutil.copyfile(os.path.join(cand, src), os.path.join(base, dst))
        im = Image.open(os.path.join(cand, src)).convert('RGB'); w, h = im.size
        # 아래 20% 전체 폭 띠 (워터마크 위치 확인용)
        band = im.crop((0, int(h * 0.8), w, h)); band.thumbnail((900, 200))
        tiles.append((dst + f'  {w}x{h}', band))
    H = sum(t[1].size[1] + 22 for t in tiles)
    sheet = Image.new('RGB', (900, H), 'white'); dr = ImageDraw.Draw(sheet); y = 0
    for lab, b in tiles:
        dr.text((4, y), lab, fill='red', font=F); sheet.paste(b, (0, y + 20)); y += b.size[1] + 22
    sheet.save(os.path.join(base, '_wm_check.jpg'), quality=85); print(n, len(items))
