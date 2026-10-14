# -*- coding: utf-8 -*-
"""10/14 영어 회차 — festivals_en_fix.json / festivals_en_checked.json 항목만 끼우기(손 정렬 보존)"""
import json, collections, sys
sys.stdout.reconfigure(encoding="utf-8")

def spans(text):
    """맨 위 객체의 각 키 → (원문 조각) 순서대로"""
    dec = json.JSONDecoder(); i = text.index("{") + 1; out = collections.OrderedDict(); n = len(text)
    while True:
        while text[i] in " \r\n\t,": i += 1
        if text[i] == "}": break
        k, i = dec.raw_decode(text, i)
        while text[i] in " \t": i += 1
        assert text[i] == ":"; i += 1
        while text[i] in " \t": i += 1
        v0 = i; _, i = dec.raw_decode(text, i)
        out[k] = text[v0:i]
    return out

def write(path, sp, changed):
    lines = []
    for k, raw in sp.items():
        if k in changed:
            v = changed[k]
            if v is None: continue
            raw = json.dumps(v, ensure_ascii=False)
        lines.append(f"  {json.dumps(k, ensure_ascii=False)}: {raw}")
    for k, v in changed.items():
        if k not in sp and v is not None:
            lines.append(f"  {json.dumps(k, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False)}")
    txt = "{\n" + ",\n".join(lines) + "\n}\n"
    json.loads(txt)
    open(path, "w", encoding="utf-8", newline="\n").write(txt)

FP = "data/festivals_en_fix.json"; CP = "data/festivals_en_checked.json"
ft = open(FP, encoding="utf-8").read(); fs = spans(ft); F = json.loads(ft)
ch = {}
# ① 교정 파일 정리
t = dict(F["3310546"]); t.pop("start", None); t.pop("end", None); t["src"] += " / 2026-10-14 TourAPI 가 날짜(10/17~21)를 따라잡아 start·end 교정 뺌"; ch["3310546"] = t
s = dict(F["978249"]); print("수원 키:", list(s.keys()))
for k in ("note", "noteUntil", "noteFoot", "aff"): s.pop(k, None)
ch["978249"] = s if [k for k in s if k != "src"] else None

# ② 날짜 교정 — 광안리 드론쇼
ch["3115770"] = {
  "start": "20260103", "end": "20261231",
  "intro": {"playtime": "Every Saturday · 7:00 pm & 9:00 pm (Oct–Feb), 8:00 pm & 10:00 pm (Mar–Sep)"},
  "note": "The drone show runs every Saturday night in 2026 over Gwangalli Beach, twice a night: 7:00 pm and 9:00 pm from October to February, and 8:00 pm and 10:00 pm from March to September. Shows can be canceled for bad weather or technical problems, so check the Busan city event page on the day before you head out.",
  "noteUntil": "20261231",
  "noteFoot": "Sources: Busan Metropolitan City event page; Sports Kyunghyang, Jul 3, 2026 (year-round operation contract). Checked Oct 14, 2026.",
  "desc": "Every Saturday in 2026 · Busan. Hundreds of drones light up Gwangalli Beach, 7 pm & 9 pm (Oct–Feb) or 8 pm & 10 pm (Mar–Sep). Weather can cancel a show.",
  "src": "부산시 busan.go.kr/eng/bsevents/1713160 (매주 토 2회, 3~9월 20·22시, 10~2월 19·21시) + 스포츠경향 2026-07-03(유비파이 2026-07-01~2027-06-30 상설 계약). TourAPI 20260101 하루 → 2026-01-03~12-31 매주 토"}

# ③ 보강 4장 (공식 확인 사실만)
ch["697445"] = {
  "addr": "Lotte Garden Park area (next to Lotte Premium Outlets Gimhae), Sinmun-dong, Gimhae-si, Gyeongsangnam-do",
  "x": "128.826623242068", "y": "35.183024156029",
  "ko": {"title": "김해분청도자기축제", "addr": "경상남도 김해시 신문동 1410 롯데가든파크 일원"},
  "intro": {"place": "Lotte Garden Park area in Jangyu, Gimhae (next to Lotte Premium Outlets Gimhae)"},
  "note": "The 31st edition runs Nov 6–10, 2026 and, for the first time in its 31 years, moves out of Jillye (the Buncheong Ceramics Museum area) to Lotte Garden Park next to Lotte Premium Outlets Gimhae in Jangyu. Expect potters' exhibitions and sales, clay-shaping workshops, a traditional kiln firing and large-scale pottery demonstrations. Shuttle and parking details had not been announced as of Oct 14, 2026, and older pages on the festival site still describe the Jillye venue.",
  "noteUntil": "20261110",
  "noteFoot": "Sources: official festival site main page (festival.buncheong.co.kr); Newspim and Gimhae Ilbo, Oct 12, 2026.",
  "desc": "Nov 6–10, 2026 · Gimhae. Korea's Buncheong pottery festival moves to Lotte Garden Park in Jangyu this year: potters' market, clay workshops and a kiln firing.",
  "src": "festival.buncheong.co.kr 메인(2026 제31회 11/6~10 장유 롯데가든파크) + 뉴스핌·김해일보 2026-10-12. 좌표: 카카오 「롯데가든파크」 신문동 1410. 하위 페이지(오시는길)는 2025 진례 기준이라 안 씀"}
ch["1373574"] = {
  "addr": "Gongjicheon Stream waterfront (586 Onui-dong), Chuncheon-si, Gangwon-do",
  "ko": {"title": "춘천막국수닭갈비축제", "addr": "강원특별자치도 춘천시 온의동 586 (공지천 일원)"},
  "note": "The 2026 festival runs Oct 14–18 (five days this year, one more than usual) along the Gongjicheon Stream waterfront walkway. Food stalls open at 11 am and take last orders at 9 pm, and prices are the same at every stall: makguksu 6,900 won, dakgalbi 9,900 won. New this year is an international zone where chefs from six overseas cities give free tastings and cooking classes. Live music on the waterside stage runs 7–9 pm every night. A shuttle bus runs every 30 minutes from the Gongjicheon suspension bridge car park to Chuncheon KBS next to the venue.",
  "noteUntil": "20261018",
  "noteFoot": "Sources: Financial News, Oct 13, 2026; Kangwon Domin Ilbo; Vegan News (shuttle and stage schedule). Checked Oct 14, 2026.",
  "desc": "Oct 14–18, 2026 · Chuncheon. Makguksu 6,900 won and dakgalbi 9,900 won at every stall, 11 am–9 pm by Gongjicheon Stream, plus free tastings by overseas chefs.",
  "src": "mdfestival.com + 파이낸셜뉴스 2026-10-13(11시~21시 주문마감, 6,900/9,900원) + 강원도민일보 idxno=2077787(국제존 6개 도시) + 비건뉴스 392434(수변무대 19~21시, 출렁다리 주차장↔춘천KBS 30분 셔틀)"}
ch["4076928"] = {
  "note": "The autumn edition runs Oct 17–25, 2026 at seven Hangang parks (including Jamwon, Ttukseom, Banpo and Gangseo) and on the river itself. Highlights: The Road Chef Hangang, a K-street-food truck contest by 20 young chefs at the Ttukseom Hangang Park swimming pool (Oct 23, 5–9 pm; Oct 24, 1–9 pm; Oct 25, 1–8 pm; free entry); yacht rides (20,000–31,000 won, 2–10 pm) and kayaking (12,500–30,000 won, 2–5:30 pm) at Sebitseom in Banpo; and a free zipline and tree-climbing course at Gangseo Hangang Park on Oct 24–25, 1–5 pm. For Ttukseom, Jayang Station (Line 7) exits 2 and 3 lead straight into the park. For questions in English, call the Seoul city help line 120.",
  "noteUntil": "20261025",
  "noteFoot": "Sources: Seoul Metropolitan Government festival site and official leaflet (seoul.go.kr/festa/hangang), Seoul Media Hub. Checked Oct 14, 2026.",
  "desc": "Oct 17–25, 2026 · Seoul. Autumn festival at 7 Hangang parks: free K-street-food truck contest at Ttukseom, yacht and kayak rides at Banpo, free zipline in Gangseo.",
  "src": "seoul.go.kr/festa/hangang/y2026 + 공식 리플릿 PDF(6ab22b523721f9.32360278.pdf) + mediahub.seoul.go.kr/archives/2019582 + 한강공원 뚝섬 교통안내(자양역 2·3번). TourAPI ov 가 5월 내용이라 가을 정보로 보강"}
ch["1675246"] = {
  "note": "The 18th Gangneung Coffee Festival runs Oct 21–25, 2026, 10 am–8 pm, on Gangneung Coffee Street at Anmok Beach. From Gangneung Station, city buses 212 and 212-1 go to Anmok; the organizer asks visitors to come by public transport. Free to enjoy: a beach photo zone built from two tonnes of coffee beans, open-air cafés, coffee busking (11 am, 2 pm, 4 pm and 6:30 pm) and tastings from local Gangneung cafés (11 am, 1 pm, 3 pm and 6 pm, near the main information booth). The paid Barista's Table session (20,000 won, 30 seats) runs at 2 pm on Oct 21, 22, 23 and 25 at the Global Coffee Lounge.",
  "noteUntil": "20261025",
  "noteFoot": "Source: official festival site coffeefestival.net (overview, transport and program pages). Checked Oct 14, 2026.",
  "desc": "Oct 21–25, 2026 · Gangneung. Coffee Street at Anmok Beach, 10 am–8 pm: free local café tastings, a coffee-bean photo zone and busking. Buses 212/212-1 from the station.",
  "src": "coffeefestival.net page=338(개요 10/21~25 10~20시 안목 커피거리) · 358(교통 212·212-1) · 1357(프로그램) · 341(바리스타의 테이블 20,000원 30명)"}

for k, v in ch.items():
    if v and v.get("desc") and len(v["desc"]) > 155: print("desc 초과", k, len(v["desc"]))
write(FP, fs, ch)

ct = open(CP, encoding="utf-8").read(); cs = spans(ct)
D = "2026-10-14"
C = {
 "1273884": {"title": "Bupyeong Pungmul Festival", "date": D, "result": "맞음 10/2~4 부평대로·굴포천 일원(제30회)", "src": "국제뉴스 2026-09-28(부평구 발표 인용)"},
 "697195": {"title": "Cheonan World Dance Festival", "date": D, "result": "맞음 10/1~5 천안종합운동장 + 10/3~5 삼거리공원", "src": "시사뉴스 2026-08-14(천안시 발표)"},
 "293144": {"title": "Bucheon International Comics Festival", "date": D, "result": "맞음 9/18~20 한국만화박물관(제29회)", "src": "데일리안 2026-09-17"},
 "1829490": {"title": "Seosan Haemi Eupseong Festival", "date": D, "result": "맞음 10/9~11 해미읍성", "src": "경향신문 2026-09-29"},
 "3115770": {"title": "Gwangalli M Drone Light Show", "date": D, "result": "틀림 2026-01-01 하루 → 2026-01-03~12-31 매주 토 2회 교정 + note·desc", "src": "부산시 busan.go.kr/eng/bsevents/1713160, 스포츠경향 2026-07-03"},
 "1037621": {"title": "Pohang International Fireworks Festival", "date": D, "result": "미확인", "src": "관광공사 kfes 11/19~21 영일대(2026 업데이트 중 표기). 포항시·포항문화재단 발표·기사 없음(2026-10-14)"},
 "697445": {"title": "Gimhae Buncheong Ceramics Festival", "date": D, "result": "날짜 맞음 11/6~10, 장소 틀림 진례 → 장유 롯데가든파크 교정", "src": "festival.buncheong.co.kr 메인, 뉴스핌·김해일보 2026-10-12"},
 "1373574": {"title": "Chuncheon Makguksu & Dakgalbi Festival", "date": D, "result": "맞음 10/14~18 공지천 일원 + note·desc", "src": "세계일보 2026-07-30, 파이낸셜뉴스 2026-10-13"},
 "4108424": {"title": "Jangseong Hwangryonggang Autumn Flower Festival", "date": D, "result": "맞음 10/8~11 황룡강 일원", "src": "아시아경제 2026-07-28(장성군 발표)"},
}
write(CP, cs, C)
print("ok", len(ch), len(C))
