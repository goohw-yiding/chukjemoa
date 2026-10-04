# -*- coding: utf-8 -*-
# 2026-10-05 블로그 4편 카드·썸네일 렌더 (Windows Chrome headless + PIL 자르기)
import os, subprocess, pathlib
from PIL import Image, ImageChops
P = r'C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업'
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
TMP = r'C:\dev\chukjemoa\_cards_tmp_1005'
os.makedirs(TMP, exist_ok=True)
W = 860
CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Noto Sans KR","Noto Sans CJK KR","Malgun Gothic",sans-serif;background:#fff;width:%dpx}
.card{border:2px solid #e3e6e4}
.head{background:#1f3a2e;color:#fff;padding:22px 26px;font-weight:800;font-size:38px;letter-spacing:-.03em;line-height:1.3}
table{width:100%%;border-collapse:collapse}
td{padding:19px 24px;font-size:28px;color:#41504a;border-bottom:2px solid #f1f3f2;letter-spacing:-.02em;line-height:1.5;vertical-align:top}
td.k{width:210px;background:#f7faf9;font-weight:800;color:#1f3a2e}
tr:last-child td{border-bottom:0}
b{color:#0f766e}
.red{color:#c2410c;font-weight:800}
.note{background:#f7faf9;padding:19px 24px;font-size:25px;color:#54635c;line-height:1.6;border-top:2px solid #e3e6e4}
""" % W

def card(title, rows, note=None):
    tr = ''.join("<tr><td class='k'>%s</td><td>%s</td></tr>" % r for r in rows)
    nt = "<div class='note'>%s</div>" % note if note else ''
    return "<!doctype html><html><head><meta charset='utf-8'><style>%s</style></head><body><div class='card'><div class='head'>%s</div><table>%s</table>%s</div></body></html>" % (CSS, title, tr, nt)

def thumb(img, t1, t2):
    u = pathlib.Path(img).as_uri()
    css = """*{margin:0;padding:0;box-sizing:border-box}
body{width:1000px;height:750px;background:#1f3a2e;font-family:"Noto Sans KR","Malgun Gothic",sans-serif;overflow:hidden}
.ph{width:1000px;height:520px;background:#14271f url('%s') center/contain no-repeat}
.t{padding:26px 44px 0;color:#fff}
.t1{font-size:62px;font-weight:800;letter-spacing:-.04em;line-height:1.15}
.t2{font-size:34px;font-weight:700;color:#b8f0e6;margin-top:14px;letter-spacing:-.03em}
.brand{position:absolute;right:30px;bottom:22px;font-size:22px;color:#9fc5b6;font-weight:700}""" % u
    return "<!doctype html><html><head><meta charset='utf-8'><style>%s</style></head><body><div class='ph'></div><div class='t'><div class='t1'>%s</div><div class='t2'>%s</div></div><div class='brand'>축제모아</div></body></html>" % (css, t1, t2)

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

J = {}
# ---------------- ① 경기도자비엔날레
J['경기도자비엔날레'] = {
 'thumb': ('src_thumb.jpg', '경기도자비엔날레 2026', '이천·광주·여주 세 곳 · 9.18~11.1'),
 'cards': {
  '01_한눈에.png': card('① 한눈에', [
   ('기간', '2026년 <b>9월 18일(금)~11월 1일(일)</b><br>45일간 · 휴관 없음'),
   ('시간', '10:00~18:00 · <span class="red">입장 마감 17:00</span>'),
   ('주제', '«땅이 만든다 Earth Makes» · 제13회'),
   ('장소', '이천 경기도자미술관<br>광주 경기도자박물관<br>여주 경기생활도자미술관'),
   ('관람료', '<b>통합권 11,000원</b><br>이천 6,000원 · 광주·여주 각 4,000원'),
   ('문의', '이천 031-645-0730<br>광주 031-799-1500<br>여주 031-887-8252')]),
  '06_세곳_어디서뭘.png': card('② 세 곳에서 무엇을 보나', [
   ('이천', '<b>경기도자미술관</b><br>본전시 «땅이 만든다» <b>14개국 28팀</b><br>국제공모전 58점 (대상 〈펀치카드 하우스〉)<br>물레 체험 1:1 30,000원'),
   ('광주', '<b>경기도자박물관</b> (곤지암도자공원)<br>«우리 시대 도예 명장» 64점<br>«아름다운 우리도자» 공모전 37점<br>공예포차 물레 체험 5,000원'),
   ('여주', '<b>경기생활도자미술관</b> (도자세상)<br>«낯선 전통» 작가 6명 · 소장품전 300여 점<br>도자 판매장 (3만 원↑ 구매 시 통합권 2매)')],
   '하루에 한 곳만 간다면 <b>이천</b>. 경강선이 광주(곤지암역)와 여주(여주역)를 잇습니다.'),
  '15_실전정보.png': card('③ 가기 전에', [
   ('이천', '이천역·이천종합터미널 → 시내버스<br>«설봉산입구» 하차, 도보 약 25분'),
   ('광주', '경강선 곤지암역·초월역 → 버스<br>«곤지암도자공원» 하차'),
   ('여주', '경강선 <b>여주역 1번 출구</b> → 버스<br>«신륵사» 하차, 도보 약 7분'),
   ('자가용', '서이천IC · 곤지암IC · 여주IC'),
   ('할인', '만 7~18세·경기도민·문화누리카드 등<br>→ 통합권 7,000원'),
   ('무료', '만 6세 이하·만 65세 이상 등 (증빙 지참)')],
   '사전 예매 할인은 9월 17일에 끝났습니다. 주차 요금·대수는 공식 안내에 없습니다.')}}
# ---------------- ② 감악산 꽃별여행
J['감악산꽃별여행'] = {
 'thumb': ('src_thumb.jpg', '감악산 꽃별여행 2026', '~10.11 · 차량 예약제 · 셔틀 3,000원'),
 'cards': {
  '01_한눈에.png': card('① 한눈에', [
   ('기간', '9월 18일~<b>10월 11일(일)</b>, 24일간 · 제6회'),
   ('시간', '07:00~19:00'),
   ('장소', '거창군 신원면 연수사길 452<br>감악산 정상 별바람언덕 일원'),
   ('꽃', '아스타 <b>5ha 30만 본</b><br>구절초·벌개미취·쑥부쟁이 4ha 40만 본'),
   ('차량', '<span class="red">사전예약제</span> · 승용차 6,000원 · 버스 10,000원'),
   ('셔틀', '1인 3,000원 (거창군민 무료)'),
   ('문의', '055-940-8227')]),
  '04_예약과셔틀.png': card('② 차로 갈까, 셔틀로 갈까', [
   ('승용차 예약', 'YES24 · <b>6,000원</b><br>하루 4회차(3시간 간격) 1,080대<br><span class="red">당일 예매분 취소·환불 불가</span>'),
   ('셔틀 탑승장', '거창첨단일반산업단지<br>(남상면 대산리 산147) · 임시주차 약 1,500대'),
   ('셔틀버스', '30대 · 11km · 10분 간격 목표<br><b>1인 3,000원</b> (군민 무료)'),
   ('막차', '올라가는 막차 <b>16:30</b><br>내려오는 막차 <b>18:30</b>')],
   '예약 없이 정상 행사장까지 차로 갈 수 없습니다. 연휴엔 탑승장에 일찍 도착하세요.'),
  '12_실전정보.png': card('③ 가기 전에', [
   ('남은 날', '평일 10/6~8 · 한글날 연휴 10/9~11'),
   ('음악회', '노을빛 언덕 음악회 <b>10월 10일(토)</b> (보도 기준)'),
   ('걷기', '무장애나눔길 데크 <b>3.8km</b> · 경사 8도 이하'),
   ('먹거리', '부녀회 장터(비빔밥·국밥·전·두부김치)<br>꽃별마켓 · 푸드트럭존'),
   ('근처', '연수사 0.9km · 감악사지 승탑 1.4km<br>거창사건추모공원 3.7km')],
   '해발 약 900m 산 위라 바람이 셉니다. 겉옷을 챙기세요.')}}
# ---------------- ③ 청원생명축제
J['청원생명축제'] = {
 'thumb': ('src_thumb.jpg', '청원생명축제 2026', '10.2~10.11 · 입장권 5,000원 = 장바구니'),
 'cards': {
  '01_한눈에.png': card('① 한눈에', [
   ('기간', '<b>10월 2일(금)~11일(일)</b>, 열흘 · 제16회'),
   ('시간', '10:00~20:00 · 매표 10:00~18:00'),
   ('장소', '청주시 청원구 오창읍<br>미래지 농촌테마공원'),
   ('입장권', '<b>5,000원</b> → 축제장 농·축산물 구매에 전액 사용'),
   ('무료', '<b>18시 이후 입장</b><br>65세 이상·어린이·청소년·임신부·삼대 동반 등'),
   ('문의', '043-201-0254')]),
  '04_일정과프로그램.png': card('② 남은 일정과 볼거리', [
   ('10/6~8<br>(화~목)', '평일 · 장보기 좋은 날'),
   ('10/7 (수)', '시민화합 라디엔티어링 걷기대회<br>(오창저수지 국가생태탐방로)'),
   ('10/9 (금)<br>한글날', '<b>8090 슈퍼콘서트 17:00</b> · 무료<br>현진영·영턱스클럽 등 (보도 기준)'),
   ('10/10~11', '폐막 주말 · 혼잡 예상'),
   ('매일', '야간 레이저쇼(올해 처음) · 고구마 수확 체험<br>모닥불 구이존 · 청원골 막걸리 주막')],
   '레이저쇼 시작 시각은 현장 시간표로 확인하세요.'),
  '14_실전정보.png': card('③ 가기 전에', [
   ('주차', '내·외부 약 4,000대 (보도)<br>승용차 제1·2·5·6·7주차장'),
   ('순환버스', '오창프라자 ↔ 축제장 · 10:00~21:06<br>15~20분 간격 · 성인 700원'),
   ('시내버스', '53·535·702·710·712·713·723번 → 오창프라자'),
   ('자가용', '오창IC · 서오창IC · 목천IC'),
   ('연계 혜택', '입장권 제시 시 <b>청남대 2,000원 할인</b>'),
   ('주의', '<span class="red">반려동물 출입 불가</span> · 무료 대상은 증빙 지참')])}}
# ---------------- ④ 광주비엔날레
J['광주비엔날레'] = {
 'thumb': ('src_thumb.jpg', '제16회 광주비엔날레', '9.5~11.15 · 관람료·셔틀·해설 시간'),
 'cards': {
  '01_한눈에.png': card('① 한눈에', [
   ('기간', '<b>9월 5일(토)~11월 15일(일)</b>, 72일'),
   ('시간', '화~일 10:00~18:00 (입장 마감 17:30)'),
   ('휴관', '<span class="red">매주 월요일</span> · 10월 5일(월)은 개관'),
   ('장소', '광주비엔날레전시관<br>(북구 비엔날레로 111)'),
   ('주제', '«너는 네 삶을 바꿔야 한다»<br>22개국 43명(팀) · 300여 점'),
   ('문의', '062-608-4500')]),
  '04_관람요금.png': card('② 관람료', [
   ('성인 (19~64세)', '<b>20,000원</b>'),
   ('청소년 (13~18세)', '10,000원'),
   ('어린이 (4~12세)', '7,000원'),
   ('재관람', '성인 10,000원'),
   ('특별할인', '6,000원 (65세 이상·문화누리카드 등)'),
   ('무료', '만 3세 이하·국가유공자 본인·중증장애인 본인')],
   '<b>제5전시실</b>과 외벽 영상(매일 19~21시)은 입장권 없이 볼 수 있습니다. 예매는 인터파크.'),
  '09_주차와셔틀.png': card('③ 주차와 셔틀', [
   ('P3 대형주차장', '매곡동 · <span class="red">전시관까지 걸어갈 수 없음</span><br>(굴다리 공사)'),
   ('셔틀', '약 3km · 8~9분 · 2대 각 30분 간격'),
   ('주차장 출발', '첫차 10:00 · 막차 <b>17:30</b>'),
   ('전시관 출발', '막차 <b>18:15</b>'),
   ('쉬는 시간', '12:30~13:00 운행 없음'),
   ('버스', '터미널 상무64 · 광주역 용봉83<br>광주송정역 송정29')]),
  '16_실전정보.png': card('④ 가기 전에', [
   ('전시해설', '매일 10·11·13·14·15·16·17시<br>제1전시실 앞 · 약 50분 · <b>예약 없음</b>'),
   ('AI 도슨트', '전시장 QR · 여러 언어'),
   ('무료 작품', '제5전시실 · 외벽 영상 〈사과〉 19~21시'),
   ('도보투어', '토·일 11시·14시 · 무료 · 네이버 예약 15명'),
   ('파빌리온', '26개 국가·기관 · 광주 27곳<br>네덜란드관은 사전 예약'),
   ('혼잡', '한글날 연휴 10/9~11 → 대중교통 권장')])}}

for n, d in J.items():
    base = os.path.join(P, f'{n}_사진_2026-10-05')
    src, t1, t2 = d['thumb']
    shot(thumb(os.path.join(base, src), t1, t2), os.path.join(base, '00_썸네일.png'), 1000, 750, 1, False)
    for fn, html in d['cards'].items():
        shot(html, os.path.join(base, fn), W, 1600, 1.6, True)
