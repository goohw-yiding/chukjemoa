# -*- coding: utf-8 -*-
"""테마별 카드 대체 이미지 만들기 — 축제 등불 야경(/img/hero.webp) 대신 «그 테마의 그림»을 쓴다.

maple  : 위키미디어 공용 File:Autumn in Chiak Mountain.jpg (치악산 단풍과 개울)
         Sohyeon Bak · CC BY-SA 3.0
flower : 위키미디어 공용 File:20250412 wonju photo walk shulla 30.jpg (원주 동화마을 수목원 벚꽃)
         슐라 · CC BY-SA 4.0
         ⚠️ 원본 아래쪽에 동화마을 캐릭터 조형물이 있다 — «위쪽만» 잘라 쓴다.
onsen  : 자체 제작 일러스트(Higgsfield recraft_v4_1). 무료 출처에 쓸 만한 «진짜 온천 사진»이 없었다.
         유일한 후보(유성온천 족욕체험장)는 행인 얼굴이 그대로 찍힌 영상 캡처라 못 쓴다.
         → 사이트가 이미 쓰는 cat2-*.webp 와 같은 플랫 일러스트 계열로 맞췄다.

⚠️ 랜드마크가 보이는 컷은 쓰지 않는다 — 다른 장소 카드에 깔리면 「거기가 저렇게 생겼다」로 읽힌다.
"""
import os
from PIL import Image

CAND = r"C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업\_maple_cand"
IMG = r"C:\dev\chukjemoa\img"
# (원본, 결과, 위에서부터 남길 비율)  1.0 = 통째로 가운데 크롭
JOBS = [
    ("b_chiaksan.jpg", "maple-fallback.webp", 1.0),
    ("f_wonju.jpg",    "flower-fallback.webp", 0.86),   # 아래 14% = 캐릭터 조형물, 잘라낸다
    ("on_a.png",       "onsen-fallback.webp",  1.0),
]
TW, TH = 3, 2      # 카드 썸네일 비율
OUT_W, Q = 960, 60  # 카드용이라 크게 갈 이유가 없다(1280·q74는 433KB였다)

for src, dst, keep in JOBS:
    p = os.path.join(CAND, src)
    if not os.path.isfile(p):
        print("건너뜀 — 원본 없음:", src); continue
    im = Image.open(p).convert("RGB")
    w, h = im.size
    if keep < 1.0:
        im = im.crop((0, 0, w, int(h * keep))); w, h = im.size
    if w / h > TW / TH:
        nw = int(h * TW / TH); im = im.crop(((w - nw) // 2, 0, (w + nw) // 2, h))
    else:
        nh = int(w * TH / TW); im = im.crop((0, (h - nh) // 2, w, (h + nh) // 2))
    im = im.resize((OUT_W, int(OUT_W * TH / TW)), Image.LANCZOS)
    out = os.path.join(IMG, dst)
    im.save(out, "WEBP", quality=Q, method=6)
    print("저장 %-24s %4dKB %s" % (dst, os.path.getsize(out) // 1024, im.size))
