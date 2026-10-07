# 2026-10-07 영어 주간 회차 — festivals_en_fix.json / checked.json 항목만 끼운다(통째 재작성 금지)
import json, io
FIX = 'data/festivals_en_fix.json'
CHK = 'data/festivals_en_checked.json'

s = io.open(FIX, encoding='utf-8').read()
# ① 부산불꽃: TourAPI 가 날짜를 따라잡음 → 날짜 교정만 뺀다
old = '"1385298": {\n    "start": "20261107", "end": "20261107",\n'
if old not in s:
    old = old.replace('\n', '\r\n')
assert old in s, 'busan start/end line not found'
s = s.replace(old, old.split('{')[0] + '{\n' if '\r\n' not in old else old.split('{')[0] + '{\r\n', 1)

NL = '\r\n' if '\r\n' in s else '\n'
new = {
 "978249": {
  "note": "During the festival, two hands-on programs run only for international visitors at 893 Jeongjo-ro, Paldal-gu, Oct 5–11, 2026, both conducted in English: a Korean festive-food cooking class where you make japchae and jeon in pairs (1:00 pm and 3:00 pm, about 80 minutes, ages 12 and up, up to 16 people per session) and a traditional Korean liquor tasting (5:00 pm on weekends and public holidays, and 7:30 pm, ages 19 and up).",
  "noteUntil": "20261011",
  "noteFoot": "Program times and ages: the booking pages, checked Oct 7, 2026 — they can change, so confirm when you book.",
  "aff": {"until": "20261009", "url": "https://creatrip.com/en/spot/15902?utm_source=AFF-4ljv46f&aff_id=AFF-4ljv46f", "lead": "The cooking class is booked on Creatrip, up to 2 days before your date", "text": "See the Suwon festival cooking class (Oct 5–11)", "checked": "2026-10-07 상품 페이지(creatrip spot 15902) 직접 확인 — 운영 10/5~11, 13:00·15:00, 약 80분, 12세+, 회당 16명, 외국인 전용, 2일 전까지 예약, 정조로 893"},
  "src": "축제 기간은 한국어 3곳 교차확정(kv confirmed, 10/4~11). 프로그램은 Creatrip 상품 페이지 15902(요리)·15901(전통주, 17:00 주말·공휴일/19:30, 19세+, 전날 18시까지 예약) 2026-10-07 확인"
 },
 "3364856": {
  "intro": {"playtime": "9:00 am – 2:00 pm on each walk day"},
  "note": "The walk is held on three separate days, not continuously: Sep 19 (Gapyeong, meeting at Gapyeong Station), Oct 10 (Pocheon, Hantangang River UNESCO Global Geopark) and Nov 7, 2026 (Chuncheon, meeting at Chuncheon Station). Each walk runs 9 am – 2 pm. It is free for ages 8 and up, with online registration on the Han River Watershed Management Committee website (hanriver.or.kr). Every participant gets a tote bag and a souvenir; finishing all three courses earns a completion badge.",
  "noteUntil": "20261107",
  "noteFoot": "Source: Han River Watershed Management Committee official event page, checked Oct 7, 2026.",
  "src": "hanriver.or.kr/ecology/20110_info.php (2026 한강수계 걷기행사: 9/19 가평역·10/10 한탄강 유네스코 지질공원·11/7 춘천역, 09~14시, 8세+, 무료, 통합생태체험시스템 신청) 2026-10-07 확인"
 },
 "1037621": {
  "note": "As of Oct 7, 2026, the organizer (Pohang City and Pohang Culture Foundation) has not published the 2026 dates on its own site. The Korea Tourism Organization's festival listing shows Nov 19–21, 2026 around Yeongildae Beach, while another listing says Nov 20–22. Recent editions were held in late May or June, so treat the November dates as provisional and check again before you book travel.",
  "noteUntil": "20261121",
  "noteFoot": "Sources: Korea Tourism Organization festival listing (checked Oct 7, 2026); Daegu Ilbo on the June 2025 edition.",
  "src": "미확인 — 관광공사 kfes 11/19~21 영일대 vs pohang-mice.com 11/20~22(장소 미정). 2024 5/31~6/2 영일대, 2025 6/20~22 형산강체육공원(대구일보). 포항문화재단 공식 2026 공지 없음(2026-10-07)"
 },
 "790394": {
  "start": "20260905", "end": "20260905",
  "ko": {"title": "서울세계불꽃축제", "addr": "서울특별시 영등포구 여의동로 330 (여의도한강공원)"},
  "src": "한화 발표 — 2026-09-05(토) 여의도 개최(다음뉴스 2026-08-06 「한화, 9월 5일 여의도서 ‘서울세계불꽃축제 2026’ 개최」, SBS Biz). 지도 칸 한글 원제가 좌표만으로 「서울스프링페스티벌」에 붙던 것 교정"
 },
 "2394700": {
  "ko": {"title": "전주 국가유산 야행", "addr": "전북특별자치도 전주시 완산구 태조로 44 (경기전)"},
  "src": "지도 칸 한글 원제가 좌표만으로 「전주한옥마을 전통연희 퍼레이드-노상놀이야」에 붙던 것 교정. 2026 일정 10/2~3 경기전 일원(아이뉴스24 2026-10-01)"
 }
}
for k in new:
    assert ('"%s"' % k) not in s, 'already exists: ' + k
body = s.rstrip()
assert body.endswith('}')
body = body[:-1].rstrip()
add = ''.join(',' + NL + '  "%s": %s' % (k, json.dumps(v, ensure_ascii=False)) for k, v in new.items())
s2 = body + add + NL + '}' + NL
json.loads(s2)
io.open(FIX, 'w', encoding='utf-8', newline='').write(s2)

c = io.open(CHK, encoding='utf-8').read()
NL2 = '\r\n' if '\r\n' in c else '\n'
d = json.loads(c)
rows = {
 "293106": ("Geumsan World K-Insam Festival", "맞음 10/2~11, 금산세계인삼엑스포광장·인삼약초거리", "더팩트 2026-09-30 금산군 발표(제44회)"),
 "293152": ("Hoengseong Hanu Festival", "맞음 10/7~11, 섬강 둔치", "K-Radio 우리방송 기사 603489 — 횡성문화관광재단 발표(제22회)"),
 "3364856": ("Han River Walk", "맞음 9/19·10/10·11/7 3회(연속 아님) → note 추가, 시간 9~14시로 교정", "hanriver.or.kr 공식 행사 페이지"),
 "3520887": ("Gyeryong Military Culture Festival", "맞음 10/1~5, 계룡대 활주로 일원", "더팩트 2026-10-01 개막 기사(제16회)"),
 "2394700": ("Jeonju Cultural Heritage Night Tour", "맞음 10/2~3 경기전 일원 + 한글 원제 오매칭 교정", "아이뉴스24 2026-10-01 전주시 10월 축제"),
 "790394": ("Hanwha Seoul International Fireworks Festival", "교정 2025-09-27 → 2026-09-05 + 한글 원제 오매칭 교정", "한화 발표(다음뉴스 2026-08-06)"),
 "4076928": ("Hangang River Festival", "맞음 가을 10/17~25", "seoul.go.kr/festa/hangang/y2026 공식"),
 "978249": ("Suwon Hwaseong Festival", "날짜는 kv 확정(대조 생략) — 외국인 전용 프로그램 note·Creatrip 링크", "Creatrip 15902·15901 상품 페이지"),
 "1037621": ("Pohang International Fireworks Festival", "미확인", "관광공사 11/19~21 vs 다른 목록 11/20~22, 포항문화재단 공식 공지 없음 — 잠정 안내 note 추가"),
}
lines = c.rstrip().rstrip('}').rstrip().splitlines()
lines = [l for l in lines if not l.strip().startswith('"1037621"')]
lines[-1] = lines[-1].rstrip().rstrip(',') + ','
out = []
items = list(rows.items())
for i, (k, (t, r, src)) in enumerate(items):
    out.append('  "%s": %s%s' % (k, json.dumps({"title": t, "date": "2026-10-07", "result": r, "src": src}, ensure_ascii=False).replace('{"', '{ "').replace('"}', '" }').replace('", "', '", "'), ',' if i < len(items) - 1 else ''))
c2 = NL2.join(lines + out) + NL2 + '}' + NL2
c2 = c2.replace('{' + NL2 + NL2, '{' + NL2)
json.loads(c2)
io.open(CHK, 'w', encoding='utf-8', newline='').write(c2)
print('ok', len(json.loads(s2)), len(json.loads(c2)))
