# -*- coding: utf-8 -*-
# 2026-10-08 이번 주말 장날 2회차 — 사진 복사 + 카드·썸네일 렌더 (Windows Chrome headless)
import os, shutil, subprocess, pathlib
from PIL import Image, ImageChops
P = r'C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업'
BASE = os.path.join(P, '이번주말장날_사진_2026-10-08')
C = os.path.join(BASE, '_후보')
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
TMP = r'C:\dev\chukjemoa\_cards_tmp_1008'
os.makedirs(TMP, exist_ok=True)
W = 860
for src, dst in [('강경대흥시장_2.jpg', '02_강경대흥시장.jpg'), ('옥천장5,10일_8.jpg', '03_옥천장.jpg'),
                 ('공주산성시장_1.jpg', '04_공주산성시장.jpg'), ('합덕장1,6일_1.jpg', '05_합덕장.jpg'),
                 ('보은장1,6일_1.jpg', '06_보은장.jpg'), ('단양장1,6일단양구경시장_3.jpg', '07_단양구경시장.jpg')]:
    shutil.copyfile(os.path.join(C, src), os.path.join(BASE, dst))
CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Noto Sans KR","Noto Sans CJK KR","Malgun Gothic",sans-serif;background:#fff;width:%dpx}
.card{border:2px solid #e3e6e4}
.head{background:#1f3a2e;color:#fff;padding:22px 26px;font-weight:800;font-size:38px;letter-spacing:-.03em;line-height:1.3}
table{width:100%%;border-collapse:collapse}
td{padding:17px 22px;font-size:28px;color:#41504a;border-bottom:2px solid #f1f3f2;letter-spacing:-.02em;line-height:1.5;vertical-align:top}
td.k{width:200px;background:#f7faf9;font-weight:800;color:#1f3a2e}
tr.d td{background:#fff7e6;font-weight:800;color:#9a3412;font-size:30px;padding:14px 22px}
tr:last-child td{border-bottom:0}
b{color:#0f766e}
.red{color:#c2410c;font-weight:800}
.note{background:#f7faf9;padding:19px 24px;font-size:25px;color:#54635c;line-height:1.6;border-top:2px solid #e3e6e4}
""" % W

def card(title, rows, note=None):
    tr = ''
    for r in rows:
        if len(r) == 1:
            tr += "<tr class='d'><td colspan='2'>%s</td></tr>" % r[0]
        else:
            tr += "<tr><td class='k'>%s</td><td>%s</td></tr>" % r
    nt = "<div class='note'>%s</div>" % note if note else ''
    return "<!doctype html><html><head><meta charset='utf-8'><style>%s</style></head><body><div class='card'><div class='head'>%s</div><table>%s</table>%s</div></body></html>" % (CSS, title, tr, nt)

def thumb(img, t1, t2):
    u = pathlib.Path(img).as_uri()
    css = """*{margin:0;padding:0;box-sizing:border-box}
body{width:1000px;height:750px;font-family:"Noto Sans KR","Malgun Gothic",sans-serif;overflow:hidden;position:relative;background:#1f3a2e}
.ph{position:absolute;inset:0;background:url('%s') center/cover no-repeat}
.gr{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 30%%,rgba(15,35,27,.92) 72%%)}
.t{position:absolute;left:44px;right:44px;bottom:64px;color:#fff}
.t0{display:inline-block;background:#f59e0b;color:#1f2937;font-size:30px;font-weight:800;padding:6px 16px;border-radius:8px;margin-bottom:14px}
.t1{font-size:66px;font-weight:800;letter-spacing:-.04em;line-height:1.15}
.t2{font-size:36px;font-weight:700;color:#b8f0e6;margin-top:14px;letter-spacing:-.03em}
.brand{position:absolute;right:30px;bottom:20px;font-size:22px;color:#9fc5b6;font-weight:700}""" % u
    return "<!doctype html><html><head><meta charset='utf-8'><style>%s</style></head><body><div class='ph'></div><div class='gr'></div><div class='t'><div class='t0'>이번 주말 장날 · 한글날 연휴</div><div class='t1'>경북·충남·충북 장날<br>10월 9일·10일·11일</div><div class='t2'>%s</div></div><div class='brand'>축제모아</div></body></html>" % (css, t2)

def shot(html, out, w, h, scale, trim):
    hp = os.path.join(TMP, os.path.basename(out) + '.html')
    open(hp, 'w', encoding='utf-8').write(html)
    raw = os.path.join(TMP, os.path.basename(out) + '.raw.png')
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=%s' % scale,
                    '--window-size=%d,%d' % (w, h), '--screenshot=' + raw, '--allow-file-access-from-files', pathlib.Path(hp).as_uri()],
                   check=True, capture_output=True, timeout=90)
    im = Image.open(raw).convert('RGB')
    if trim:
        bg = Image.new('RGB', im.size, (255, 255, 255))
        bb = ImageChops.difference(im, bg).getbbox()
        im = im.crop((0, 0, im.size[0], bb[3] + 2))
    else:
        im = im.resize((w, h))
    im.save(out); print(out, im.size)

CARDS = {
 '01_장날표.png': card('한글날 연휴 장날표 · 경북·충남·충북', [
  ('10월 9일(금·한글날) — 4·9일장',),
  ('경북', '봉화 <b>억지춘양시장</b> · 고령대가야시장<br>청도공설시장 · 경산 하양공설시장 · 영덕시장'),
  ('충남', '논산 <b>강경대흥시장</b> · 홍성 광천전통시장<br>아산 온양온천시장 · 예산 덕산시장'),
  ('충북', '영동전통시장 · 괴산 목도재래시장<br>충주 연원시장 · 보은 회인·관기시장'),
  ('10월 10일(토) — 5·10일장',),
  ('경북', '경산공설시장 · 김천 황금·평화시장<br>영덕 영해만세시장 · 의성 단촌·봉양시장'),
  ('충남', '<b>예산장</b>(예산상설시장) · 당진전통시장<br>청양 정산시장 · 논산 연산전통시장'),
  ('충북', '<b>진천</b> 생거진천전통·중앙시장 · <b>옥천장</b><br>충주자유시장 · 괴산 청천전통시장'),
  ('10월 11일(일) — 1·6일장',),
  ('경북', '의성 금성시장·안계공설시장'),
  ('충남', '<b>공주산성시장</b> · <b>홍성장</b><br>당진 합덕전통시장'),
  ('충북', '보은 결초보은·보은전통시장<br>단양구경시장')],
  '굵은 글씨 = 본문에서 자세히 소개한 장 · 끝자리 기준, 상인 사정으로 빈자리가 있을 수 있음'),
 '08_대표장안서는곳.png': card('대표 장이 이번 연휴엔 쉬는 곳', [
  ('의성', '의성장 2·7 → <span class="red">다음 10/12(월)</span><br>대신: 토 단촌·봉양(5·10) · 일 금성·안계(1·6)'),
  ('괴산', '괴산장 3·8 → <span class="red">다음 10/13(화)</span><br>대신: 금 목도(4·9) · 토 청천(5·10)'),
  ('청양', '청양장 2·7 → <span class="red">다음 10/12(월)</span><br>대신: 토 정산시장(5·10)'),
  ('금산', '금산장 2·7 → <span class="red">다음 10/12(월)</span><br>대신: 금 추부 마전시장(4·9)')],
  '«○○장날»은 군 이름이지 시장 이름이 아닙니다. 가려는 <b>시장 이름</b>의 끝자리를 보세요.'),
 '09_실전정보.png': card('장 보러 가기 전에', [
  ('시간', '<b>오전</b>에 가세요 · 이른 오후부터 좌판을 걷습니다'),
  ('결제', '<span class="red">현금</span> 챙기기 · 좌판은 현금만 받는 곳이 많음'),
  ('연휴', '오일장은 대개 날짜대로 서지만<br>멀리서 가면 시장에 전화로 확인'),
  ('점심', '장날엔 장터 식당이 일찍 붐빔 · 11시 반 전에'),
  ('문의', '강경대흥 041-745-5130 · 예산상설 041-333-3318<br>공주산성 041-856-5427 · 홍성장 041-632-8833<br>결초보은 043-543-1211 · 단양구경 043-422-1706')],
  '축제 동선: 진천 ← 생거진천 문화축제 10/9~11 · 공주 ← 백제문화제 ~10/11'),
}
shot(thumb(os.path.join(C, '옥천장5,10일_6.jpg'), '', '공주장·예산장·홍성장·진천장 서는 날'), os.path.join(BASE, '00_썸네일.png'), 1000, 750, 1, False)
for fn, html in CARDS.items():
    shot(html, os.path.join(BASE, fn), W, 2200, 1.6, True)
# 390px 미리보기(눈 확인용)
PV = os.path.join(TMP, 'preview'); os.makedirs(PV, exist_ok=True)
for fn in sorted(os.listdir(BASE)):
    if fn[:2].isdigit():
        im = Image.open(os.path.join(BASE, fn)).convert('RGB'); r = 390 / im.size[0]
        im.resize((390, int(im.size[1] * r))).save(os.path.join(PV, fn.rsplit('.', 1)[0] + '.jpg'), quality=85)
print('done')
