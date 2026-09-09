# -*- coding: utf-8 -*-
"""단풍 카드 대체 이미지 만들기 — 축제 등불 야경(/img/hero.webp) 대신 «진짜 단풍 사진»을 쓴다.
원본: 위키미디어 공용 File:Autumn in Chiak Mountain.jpg (치악산 단풍과 개울)
      저작자 Sohyeon Bak · CC BY-SA 3.0 · https://commons.wikimedia.org/wiki/File:Autumn_in_Chiak_Mountain.jpg
왜 이 컷인가: 랜드마크가 안 보인다. 대둔산 구름다리 컷은 더 화려하지만 «그 산으로 보이는» 사진이라
             다른 산 카드의 대체 이미지로 쓰면 사람을 속인다.
"""
import io, os
from PIL import Image

SRC = r"C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업\_maple_cand\b_chiaksan.jpg"
DST = r"C:\dev\chukjemoa\img\maple-fallback.webp"

im = Image.open(SRC).convert("RGB")
w, h = im.size
# 카드 썸네일 비율(3:2)에 맞춰 가운데를 자르고 1280폭으로 줄인다
tw, th = 3, 2
if w / h > tw / th:
    nw = int(h * tw / th); im = im.crop(((w - nw) // 2, 0, (w + nw) // 2, h))
else:
    nh = int(w * th / tw); im = im.crop((0, (h - nh) // 2, w, (h + nh) // 2))
# 카드 썸네일용이라 크게 갈 이유가 없다. 처음에 1280·q74 로 만들었더니 433KB —
# 카드 한 장 배경으로 쓰기엔 과하다(모바일 70%인 사이트다). 960·q60 으로 낮춘다.
im = im.resize((960, int(960 * th / tw)), Image.LANCZOS)
im.save(DST, "WEBP", quality=60, method=6)
print("저장:", DST, os.path.getsize(DST) // 1024, "KB", im.size)
