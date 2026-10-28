# -*- coding: utf-8 -*-
"""10/28 영어 주간 — fix.json 항목 정리·여수 note·한글 원제 숨김, checked.json 추가, en_goals 재판정"""
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
FP = r"C:\dev\chukjemoa\data\festivals_en_fix.json"
CP = r"C:\dev\chukjemoa\data\festivals_en_checked.json"
GP = r"C:\dev\chukjemoa\data\en_goals.json"
raw = open(FP, encoding="utf-8", newline="").read()
data = json.loads(raw)
dec = json.JSONDecoder()

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
        nl = "\r\n" if "\r\n" in raw else "\n"
        raw = body + "," + nl + '  "%s": %s' % (key, s) + nl + "}" + nl
    data[key] = val

def delete(key):
    global raw
    i, j, end = span(key)
    e = end
    while raw[e] in " \t": e += 1
    if raw[e] == ",":
        raw = raw[:i] + raw[e + 1:].lstrip(" ").lstrip("\r").lstrip("\n")
    else:
        p = raw.rindex(",", 0, i)
        raw = raw[:p] + raw[end:]
    del data[key]

T = "2026-10-28 영어 세션"
# 1) 끝난 축제 note·desc 만 있던 항목 정리 (기한 지나 이미 자동 숨김)
for k in ("4076928", "1675246", "293231"):
    v = data[k]
    assert not ({"start", "end", "addr", "x", "y", "ko", "intro", "aff"} & set(v)), (k, list(v))
    delete(k)
# 2) 여수밤바다 불꽃축제 — 2026 장소·셔틀 안내
setv("3396183", {
    "note": "On Oct 31, 2026 the fireworks move to the Yeosu Expo site (Deokchung-dong, next to Yeosu-EXPO Station), which is a side venue of the 2026 Yeosu World Island Expo. An overseas pyrotechnics team stages an island-themed show. On the day, extra shuttle buses run between the Island Expo main venue (Dolsan Jinmo area) and Yeosu-EXPO Station; the city asks visitors to check the official festival site for show times, traffic control and parking.",
    "noteUntil": "20261031",
    "noteFoot": "Sources: Yeosu City announcement as reported by Jeonguk Maeil Sinmun (Oct 25, 2026) and Namhaean Sinmun (Oct 26, 2026). Checked Oct 28, 2026.",
    "desc": "Oct 31, 2026 · Yeosu. Night fireworks over the sea at the Yeosu Expo site, next to Yeosu-EXPO Station. Extra shuttle buses run on the day.",
    "src": "jeonmae.co.kr idxno=1304655 (2026-10-25: 31일 덕충동 여수세계박람회장, 섬박람회 부행사장, 진모지구 제외, 섬박람회 주행사장↔여수엑스포역 셔틀 증차, 교통·주차는 누리집) + nhanews.com idxno=93831 (2026-10-26: 해외 연출팀 '섬' 주제, 안전인력 570여 명). 시간은 기사에 없어 안 씀. " + T})
# 3) 한글 원제 좌표만 매칭 오류 숨김
v = dict(data.get("3554627", {})); v["ko"] = None
v["src"] = (v.get("src", "") + " / " if v.get("src") else "") + "「DDP 어린이 디자인 페스티벌」이 좌표만으로 붙음(다른 행사) — 숨김. " + T
setv("3554627", v)
open(FP, "w", encoding="utf-8", newline="").write(raw)
json.loads(open(FP, encoding="utf-8").read())

# 4) checked.json
craw = open(CP, encoding="utf-8", newline="").read()
nl = "\r\n" if "\r\n" in craw else "\n"
add = {
    "3547117": {"title": "Hongseong Global BBQ Festival", "date": "2026-10-28", "result": "맞음 10/29~11/1 홍주성 일원", "src": "쿠키뉴스 2026-10-20 kuk202610200041 (홍성군)"},
    "3544280": {"title": "100 Years Night Night Market", "date": "2026-10-28", "result": "맞음 10/30~31 16~21시 백년시장 일대, 무료", "src": "서울시 미디어허브 2026-10-12 archives/2019634"},
    "3358416": {"title": "Hantangang Garden Festa", "date": "2026-10-28", "result": "맞음 9/12~11/1 한탄강 생태경관단지", "src": "위키트리 2026-09-07 articles/1157739 (포천시)"},
    "1398781": {"title": "Cheongsong Apple Festival", "date": "2026-10-28", "result": "맞음 11/4~8 (제20회)", "src": "경북매일 2026-10-18 article/20261018500281 (청송군)"},
    "3396183": {"title": "Yeosu Night Sea Fireworks Festival", "date": "2026-10-28", "result": "맞음 10/31 여수세계박람회장 — note·desc 추가", "src": "전국매일신문 2026-10-25 idxno=1304655 · 남해안신문 2026-10-26 idxno=93831 (여수시)"},
    "3337796": {"title": "International Ki Sports Festival", "date": "2026-10-28", "result": "미확인 — 2026 개최 발표 못 찾음(검색 2회)", "src": "웹 검색 2026-10-28"},
    "752980": {"title": "Chungjang Street Festival of Recollection", "date": "2026-10-28", "result": "한국어 3곳 확정(kv=confirmed) 10/7~11, 끝남 처리 맞음 — 대조 생략", "src": "data/festival_bridge.json links.en"},
}
cdata = json.loads(craw)
k = craw.rstrip().rindex("}")
body = craw[:k].rstrip()
for key, val in add.items():
    if key in cdata:
        continue
    body += "," + nl + '  "%s": %s' % (key, json.dumps(val, ensure_ascii=False))
craw = body + nl + "}" + nl
open(CP, "w", encoding="utf-8", newline="").write(craw)
json.loads(open(CP, encoding="utf-8").read())

# 5) 목표 재판정
g = json.load(open(GP, encoding="utf-8"))
basis = "10/28 재판정: 최근 4주 주평균 19.0(1·10·11·54) < 25 → 속도 기준으로 낮춤. 10/23부터 사이트 전체 구글 노출 약 92% 급감(GSC 일 2,400→190, GA4 구글 세션 55→13, 색인·크롤 정상)이라 ×1.2 가산 없이 4주 속도(주 19 × 약 10.5주) 그대로 200"
g["clicks90"] = {"target": 200, "deadline": "2026-12-31", "set_on": "2026-10-28", "basis": basis}
g["history"].append({"date": "2026-10-28", "event": "하향(속도 기준 재설정)", "target": 200, "c90": 128, "basis": basis})
open(GP, "w", encoding="utf-8").write(json.dumps(g, ensure_ascii=False, indent=1) + "\n")
print("ok", len(data), len(json.loads(craw)))
