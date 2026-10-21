# -*- coding: utf-8 -*-
"""10/21 영어 주간 — fix.json 항목만 교체(spans), checked.json 추가, posts_en ojang desc"""
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
FP = r"C:\dev\chukjemoa\data\festivals_en_fix.json"
CP = r"C:\dev\chukjemoa\data\festivals_en_checked.json"
PP = r"C:\dev\chukjemoa\data\posts_en.json"
raw = open(FP, encoding="utf-8", newline="").read()
data = json.loads(raw)
dec = json.JSONDecoder()
def EOL(t, path):
    o = open(path, "rb").read()
    t = t.replace("\r\n", "\n")
    return t.replace("\n", "\r\n") if b"\r\n" in o else t

def span(key):
    k = '"%s":' % key
    i = raw.index("\n  " + k) + 1
    j = i + 2 + len(k)
    while raw[j] in " \t": j += 1
    _, end = dec.raw_decode(raw, j)
    return i, j, end

def setv(key, val):
    global raw
    s = json.dumps(val, ensure_ascii=False)
    if key in data:
        i, j, end = span(key); raw = raw[:j] + s + raw[end:]
    else:
        k = raw.rstrip().rindex("}")
        body = raw[:k].rstrip()
        raw = body + ',\n  "%s": %s\n}\n' % (key, s)
    data[key] = val

def delete(key):
    global raw
    i, j, end = span(key)
    # 앞쪽 쉼표 처리: 뒤에 쉼표가 있으면 그걸 같이 지운다
    e = end
    while raw[e] in " \t": e += 1
    if raw[e] == ",":
        raw = raw[:i] + raw[e + 1:].lstrip("\r\n") if False else raw[:i] + raw[e + 1:].lstrip(" ").lstrip("\r").lstrip("\n")
    else:
        # 마지막 항목: 앞 쉼표 제거
        p = raw.rindex(",", 0, i)
        raw = raw[:p] + raw[end:]
    del data[key]

T = "2026-10-21 영어 세션"
# 1) 진주: 축제 끝·note/aff 기한 지남 → 항목 삭제
delete("697197")
# 2) 춘천막국수닭갈비: 끝남 → note/desc 정리, 주소·한글 원제는 유지
v = dict(data["1373574"])
for k in ("note", "noteUntil", "noteFoot", "desc"): v.pop(k, None)
v["src"] = v["src"] + " / " + T + ": 축제 끝(10/18) → note·desc 정리, 주소·한글 원제만 유지"
setv("1373574", v)
# 3) 부산불꽃: 클룩·Creatrip 모두 판매 종료 → aff 제거
v = dict(data["1385298"]); v.pop("aff", None)
v["src"] = v["src"] + " / " + T + ": 클룩 171795 「Currently unavailable」, Creatrip 12948 「Reservations closed / Sold Out」 확인 → aff 제거"
setv("1385298", v)
# 4) 포항불빛: 포항시 발표 확인 → 잠정 안내 교체
setv("1037621", {
  "note": "Pohang City has set the 2026 festival for Nov 19–21 around Yeongildae Beach — later than usual, because the early-summer slot clashed with the June local elections. Nov 19: a media-art lighting ceremony at Songdo Pier. Nov 20: a fireworks street parade with groups from all 29 town and neighborhood districts. Nov 21: the main fireworks show over Yeongildae Beach from 8 pm for about an hour, with teams from Korea, Japan and France and a finale by Korea's Hanwha. Road closures, shuttles and viewing areas had not been announced as of Oct 21, 2026.",
  "noteUntil": "20261121",
  "noteFoot": "Source: News1, Oct 19, 2026, citing Pohang City. Checked Oct 21, 2026.",
  "desc": "Nov 19–21, 2026 · Pohang. Main fireworks show Nov 21 from 8 pm over Yeongildae Beach (Korea, Japan, France, Hanwha finale); street parade Nov 20.",
  "src": "뉴스1 2026-10-19(스포탈코리아 idxno=2025052909553626445 게재) 「포항시 등에 따르면」 — 11/19 송도부두 미디어아트 점등, 11/20 불꽃 거리 퍼레이드(29개 읍면동), 11/21 20시 1시간 영일대해수욕장 불꽃쇼(한·일·프랑스+한화 피날레), 6월 지방선거로 연기. 관광공사 kfes 11/19~21 과 일치. " + T})
# 5) 서울억새축제 — 서울시 공식
setv("293231", {
  "note": "The 25th Seoul Silver Grass Festival runs Oct 17–23, 2026, 10 am – 9 pm, across Haneul Park in World Cup Park (Mapo-gu). Seoul City asks visitors to come by public transport because the roads get very congested: get off at World Cup Stadium or Mapo-gu Office Station (Line 6) and walk up (about 40 minutes), or take the small electric shuttle (the 'Maengkkongi' e-car) from the Nanjicheon Park car park.",
  "noteUntil": "20261023",
  "noteFoot": "Source: Seoul Metropolitan Government environment news page, posted Sep 28, 2026. Checked Oct 21, 2026.",
  "desc": "Oct 17–23, 2026 · Seoul. Silver grass fields on Haneul Park, open 10 am–9 pm. Line 6 World Cup Stadium Stn, then a 40-min walk up or the e-car shuttle.",
  "src": "news.seoul.go.kr/env/archives/570795 (2026-09-28 게시: 제25회 2026.10.17~10.23 10:00~21:00 월드컵공원 하늘공원 일대, 6호선 월드컵경기장역·마포구청역 도보 약 40분 또는 난지천공원 주차장 맹꽁이 전기차, 대중교통 권장). " + T})
# 6) 익산 천만송이 국화축제 — 익산시 기자회견
setv("1853185", {
  "note": "The 23rd Iksan Chrysanthemum Festival (billed as 'Ten Million Chrysanthemums') runs Oct 23 – Nov 1, 2026 at Jungang Sports Park, Sinheung Neighborhood Park and around Iksan Station; the chrysanthemum sculptures stay on display until Nov 8. After dark there are interactive light installations and a chrysanthemum light tunnel, with EDM parties and circus shows planned for the evenings and fireworks on Oct 31. A sweet-potato zone lets children dig up and carry sweet potatoes. Opening hours, admission and parking were not given in the city's announcement.",
  "noteUntil": "20261101",
  "noteFoot": "Source: Inews24, Oct 14, 2026 (Iksan City press conference). Checked Oct 21, 2026.",
  "desc": "Oct 23 – Nov 1, 2026 · Iksan. Chrysanthemum displays at Jungang Sports Park and around Iksan Station, a light tunnel at night and fireworks on Oct 31.",
  "src": "아이뉴스24 2026-10-14 inews24.com/view/2014943 (익산시 기자회견: 제23회 10/23~11/1 중앙체육공원·신흥근린공원·익산역 일원, 조형물 11/8까지, 야간 인터랙티브 조명·국화빛 터널, EDM·동춘서커스, 10/31 불꽃, 고구마 놀이터). " + T})
# 7) 마산가고파국화축제 — 매일신문
setv("1244634", {
  "note": "The 26th Masan Gagopa Chrysanthemum Festival runs Oct 31 – Nov 8, 2026, and admission is free. This year it spreads along the waterfront across three areas: 3·15 Marine Nuri Park (about 100,000 chrysanthemum pots), Happo Waterfront Park and Masan Marine New Town. Its signature piece is a single chrysanthemum plant trained to carry 1,540 blooms, a Guinness World Record. The opening night starts with fireworks, and on the evening of Nov 4 a nakhwa ('falling fire') show is held over the sea for the first time, with more than 1,500 hanging fire sticks burning for about an hour. Changwon City provides about 5,500 parking spaces across the three sites and a free shuttle from Masan Station, but the weekday shuttle stops at 6 pm.",
  "noteUntil": "20261108",
  "noteFoot": "Source: Maeil Shinmun, Oct 16, 2026. Checked Oct 21, 2026.",
  "desc": "Oct 31 – Nov 8, 2026 · Changwon (Masan). Free chrysanthemum festival on the waterfront; first nakhwa fire show over the sea Nov 4. Free shuttle from Masan Stn.",
  "src": "매일신문 2026-10-16 imaeil.com/page/view/2026101607051923639 (제26회 10/31~11/8 무료, 3·15해양누리공원·합포수변공원·해양신도시, 국화 10만 본, 다륜대작 1천540송이 기네스, 개막 불꽃쇼, 11/4 해상 낙화놀이 낙화봉 1,500개+ 1시간, 주차 5,500면, 마산역 무료 셔틀 평일 18시 종료). " + T})
# 8) 광안리 M 드론쇼 — Creatrip 15648 (드론쇼 관람 실내 공간)
v = dict(data["3115770"])
v["aff"] = {"until": "20261231", "url": "https://creatrip.com/en/spot/15648?utm_source=AFF-4ljv46f&aff_id=AFF-4ljv46f",
  "lead": "If you would rather watch from indoors, a private room facing Gwangan Bridge (for 1–2 people, with a drone-show viewing option; the room's operator does not run the show) is sold on Creatrip",
  "text": "See the Gwangan Bridge drone-show viewing room",
  "checked": "2026-10-21 creatrip spot 15648 열어 확인 — Bridge1006 Busan, 광안대교 오션뷰 개인 실내 공간 1~2인, 드론쇼 관람 옵션(약 12분+, 업체가 드론쇼 운영 안 함), 날짜 지정 티켓, 3일 전까지 무료 취소/변경, From 36.19 USD"}
v["src"] = v["src"] + " / " + T + ": Creatrip 15648 aff"
setv("3115770", v)
# 9) 한글 원제 좌표 오매칭 4건 숨김
for k, why in [("3566502", "서울국제불교박람회"), ("293214", "홍천 사과축제"), ("3396183", "대한민국청소년박람회"), ("3547117", "홍성 국가유산야행")]:
    setv(k, {"ko": None, "src": "지도 칸 한글 원제가 좌표만으로 「%s」에 붙던 것 — 다른 행사라 숨김(%s)" % (why, T)})
json.loads(raw)
open(FP, "w", encoding="utf-8", newline="").write(EOL(raw, FP))
print("fix keys:", len(data))

# checked.json
craw = open(CP, encoding="utf-8", newline="").read(); cdat = json.loads(craw)
D = "2026-10-21"
add = {
 "293231": ("Seoul Silver Grass Festival", "맞음 10/17~23 하늘공원", "서울시 news.seoul.go.kr/env/archives/570795 (2026-09-28)"),
 "1853185": ("Iksan Gukhwa Festival", "맞음 10/23~11/1 (조형물 11/8까지)", "아이뉴스24 2026-10-14 익산시 기자회견"),
 "1244634": ("Masan Gagopa Chrysanthemum Festival", "맞음 10/31~11/8", "매일신문 2026-10-16"),
 "1037621": ("Pohang International Fireworks Festival", "맞음 11/19~21 영일대 (포항시 발표 확인 — 미확인 해제)", "뉴스1 2026-10-19 「포항시 등에 따르면」"),
 "697443": ("Gochang Moyang Fortress Festival", "맞음 10/15~19 고창읍성", "YTN 2026-10-13"),
 "978307": ("Sunchang Jangryu Festival", "맞음 10/15~18", "MTN 2026-10-08 (셔틀 3노선 기사)"),
 "697361": ("Bonghwa Pine Mushroom Festival", "맞음 10/15~18 내성천 일원", "더팩트 2026-09-29 봉화군 발표"),
 "1084180": ("Jeju Olle Walking Festival", "맞음 11/5~7 (10/6 두 곳 대조, fix.json note)", "서울신문 2026-07-08 · 제이누리 no=69060"),
 "3487931": ("Jeonju Hanok Village Traditional Performance Parade", "관광공사 자료와 일치 4/18~10/31 매주 토 15~16시 — 주최 원문 미확인", "노상놀이야 상세(내용출처 한국관광공사)"),
 "3562686": ("October Festa in Gwangalli", "미확인 — 2026 개최 발표 못 찾음(부산시 행사 목록엔 6월 어방축제만)", "busan.go.kr/eng/bsevents 검색 2026-10-21"),
}
lines = []
for k, (t, r, s) in add.items():
    lines.append('  "%s": %s' % (k, json.dumps({"title": t, "date": D, "result": r, "src": s}, ensure_ascii=False)))
    if k in cdat:
        i = craw.index('\n  "%s":' % k) + 1; j = craw.index(":", i) + 1
        while craw[j] == " ": j += 1
        _, e = dec.raw_decode(craw, j); craw = craw[:j] + json.dumps({"title": t, "date": D, "result": r, "src": s}, ensure_ascii=False) + craw[e:]
        lines.pop()
if lines:
    k = craw.rstrip().rindex("}")
    craw = craw[:k].rstrip() + ",\n" + ",\n".join(lines) + "\n}\n"
json.loads(craw)
open(CP, "w", encoding="utf-8", newline="").write(EOL(craw, CP))
print("checked:", len(json.loads(craw)))

# posts_en ojang desc
praw = open(PP, encoding="utf-8", newline="").read(); P = json.loads(praw)
old = [p for p in P if p["slug"] == "ojang-day-guide-en"][0]["desc"]
new = "Ojang (오일장) is Korea's five-day market. It opens on dates ending in, say, 2 and 7, not on weekdays. Here's how to read the dates and pick the right day."
hit = 0
for enc in (json.dumps(old, ensure_ascii=False), json.dumps(old)):
    if enc in praw:
        praw = praw.replace(enc, json.dumps(new, ensure_ascii=False) if enc == json.dumps(old, ensure_ascii=False) else json.dumps(new), 1); hit += 1; break
json.loads(praw)
open(PP, "w", encoding="utf-8", newline="").write(EOL(praw, PP))
print("ojang desc replaced:", hit, len(new))
