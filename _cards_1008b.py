# -*- coding: utf-8 -*-
# 2026-10-08 예산장날 개별 글 — 사진 복사 + 카드 렌더 (_cards_1008.py 의 함수 재사용)
import os, shutil, importlib.util, sys
spec = importlib.util.spec_from_file_location('c', r'C:\dev\chukjemoa\_cards_1008_lib.py')
P = r'C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업'
BASE = os.path.join(P, '예산장날_사진_2026-10-08'); C = os.path.join(BASE, '_후보')
src = open(r'C:\dev\chukjemoa\_cards_1008.py', encoding='utf-8').read()
head = src.split('CARDS = {')[0]
head = head.replace("BASE = os.path.join(P, '이번주말장날_사진_2026-10-08')", "BASE = os.path.join(P, '예산장날_사진_2026-10-08')")
head = head.split('for src, dst in')[0] + head.split('shutil.copyfile(os.path.join(C, src), os.path.join(BASE, dst))')[1]
exec(head)
for s, d in [('예산시장5,10일_6.jpg', '02_예산장날_좌판.jpg'), ('광시한우거리_3.jpg', '04_광시한우거리.jpg'),
             ('예산장터삼국축제_6.jpg', '05_삼국축제.jpg'), ('예당호출렁다리음악분수_7.jpg', '06_예당호출렁다리.jpg')]:
    shutil.copyfile(os.path.join(C, s), os.path.join(BASE, d))
def thumb2(img):
    h = thumb(img, '', '')
    return h.replace('이번 주말 장날 · 한글날 연휴', '충남 예산군 · 5·10일장').replace('경북·충남·충북 장날<br>10월 9일·10일·11일', '예산장날·예산시장').replace("<div class='t2'></div>", "<div class='t2'>10월·11월 장날 날짜와 국밥거리</div>")
CARDS = {
 '01_한눈에.png': card('예산군 장날 한눈에 · 5곳', [
  ('5·10일', '<b>예산장</b> · 예산상설시장 (예산읍)<br>상설시장은 매일 · 장날엔 노점이 더 들어섬'),
  ('3·8일', '역전시장 (예산읍 · 1955 · 40곳)<br>고덕시장 (고덕면 · 1961 · 30곳)<br>광시시장 (광시면 · 1925 · 9곳)'),
  ('이번 주', '<b>10월 10일(토)</b> 예산장'),
  ('문의', '예산상설시장 041-333-3318'),
  ('주차', '시장 옆 공영주차장 2곳 · <b>187면</b>')],
  '끝자리 3·5·8·0 — 열흘 중 나흘은 예산군 어딘가에 장이 섭니다'),
 '03_장날달력.png': card('예산장(5·10일) 10월~12월 날짜', [
  ('10월', '<b>10(토)</b> · 15(목) · 20(화) · <b>25(일)</b> · <span class="red">30(금)</span>'),
  ('11월', '5(목) · 10(화) · <b>15(일)</b> · 20(금) · 25(수) · 30(월)'),
  ('12월', '<b>5(토)</b> · 10(목) · 15(화) · <b>20(일)</b> · 25(금) · 30(수)'),
  ('겹치는 날', '<b>10/25(일)</b> 예산장터 삼국축제 마지막 날<br><span class="red">10/30(금)</span> 예산사과축제 첫날'),
  ('3·8일장', '10월 13(화) · <b>18(일)</b> · 23(금) · 28(수)')],
  '굵은 글씨 = 주말 장날 · 축제 일정은 예산군 발표(2026.9) 기준'),
 '07_실전정보.png': card('예산 장 보러 가기 전에', [
  ('시간', '장날 <b>오전</b> · 상설 점포는 대개 11~21시(점포별)'),
  ('아침', '시장 옆 국밥거리 · 새벽 5시 여는 국밥집'),
  ('결제', '<span class="red">현금</span> 챙기기 · 노점은 현금만 받는 곳이 많음'),
  ('주차', '공영주차장 187면 · 축제 주말엔 일찍'),
  ('축제', '삼국축제 10/22~25 (예산시장 일원)<br>사과축제 10/30~31 (예당관광지)<br>의좋은형제축제 11/7~8')]),
}
shot(thumb2(os.path.join(C, '예산장터삼국축제_3.jpg')), os.path.join(BASE, '00_썸네일.png'), 1000, 750, 1, False)
for fn, html in CARDS.items():
    shot(html, os.path.join(BASE, fn), W, 2200, 1.6, True)
PV = os.path.join(TMP, 'preview_yesan'); os.makedirs(PV, exist_ok=True)
for fn in sorted(os.listdir(BASE)):
    if fn[:2].isdigit():
        im = Image.open(os.path.join(BASE, fn)).convert('RGB'); r = 390 / im.size[0]
        im.resize((390, int(im.size[1] * r))).save(os.path.join(PV, fn.rsplit('.', 1)[0] + '.jpg'), quality=85)
print('done')
