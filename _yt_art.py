# -*- coding: utf-8 -*-
# 축제모아 유튜브 채널 아트 — 배너 2560x1440(안전영역 1546x423) + 프로필 800x800
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_ytart')
os.makedirs(OUT, exist_ok=True)
BD = 'C:/Windows/Fonts/malgunbd.ttf'
RG = 'C:/Windows/Fonts/malgun.ttf'

TEAL = (15, 157, 143)
DARK = (10, 60, 56)
CREAM = (246, 251, 250)
WHITE = (255, 255, 255)


def f(path, size):
    return ImageFont.truetype(path, size)


def center(d, text, font, cx, y, fill):
    x0, y0, x1, y1 = d.textbbox((0, 0), text, font=font)
    d.text((cx - (x1 - x0) / 2 - x0, y), text, font=font, fill=fill)
    return y1 - y0

# ---------- 배너 ----------
W, H = 2560, 1440
img = Image.new('RGB', (W, H), DARK)
d = ImageDraw.Draw(img)

# 세로 그라데이션(진한 청록 → 조금 밝은 청록)
for y in range(H):
    t = y / H
    d.line([(0, y), (W, y)], fill=(
        int(10 + (15 - 10) * t), int(60 + (110 - 60) * t), int(56 + (104 - 56) * t)))

cx, cy = W // 2, H // 2

# 안전영역(1546x423) 안에만 글자를 넣는다 — 휴대폰에서는 이 밖이 다 잘린다
d.text((cx, cy - 110), '축제모아', font=f(BD, 148), fill=WHITE, anchor='mm')
d.text((cx, cy + 8), '전국 축제 · 오일장 · 걷기길을 한곳에',
       font=f(BD, 62), fill=(180, 235, 226), anchor='mm')
d.text((cx, cy + 92), '공공데이터를 매일 받아, 사람들이 많이 찾는 순서대로',
       font=f(RG, 44), fill=(140, 205, 196), anchor='mm')
d.text((cx, cy + 175), 'chukjemoa.co.kr', font=f(BD, 52), fill=(126, 226, 210), anchor='mm')

img.save(os.path.join(OUT, 'banner.png'))
print('banner.png', img.size)

# ---------- 프로필 사진 ----------
S = 800
p = Image.new('RGB', (S, S), TEAL)
dp = ImageDraw.Draw(p)
for y in range(S):
    t = y / S
    dp.line([(0, y), (S, y)], fill=(
        int(13 + (8 - 13) * t), int(140 + (90 - 140) * t), int(128 + (86 - 128) * t)))

# 아주 작은 원(프로필은 96px로도 보인다) — 글자는 「축제」 두 자만
dp.text((S // 2, S // 2 - 108), '축제', font=f(BD, 215), fill=WHITE, anchor='mm')
dp.text((S // 2, S // 2 + 112), '모아', font=f(BD, 215), fill=(186, 238, 228), anchor='mm')

p.save(os.path.join(OUT, 'avatar.png'))
print('avatar.png', p.size)
print('저장 위치', OUT)
