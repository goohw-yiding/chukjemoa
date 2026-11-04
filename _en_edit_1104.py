# -*- coding: utf-8 -*-
"""11/4 영어 주간 — fix.json 정리·보강 4장·한글 원제 숨김, checked.json 갱신, en_goals 판정 보류 기록 (_en_edit_1028.py 방식)"""
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
FP = r"C:\dev\chukjemoa\data\festivals_en_fix.json"
CP = r"C:\dev\chukjemoa\data\festivals_en_checked.json"
GP = r"C:\dev\chukjemoa\data\en_goals.json"
dec = json.JSONDecoder()

class F:
    def __init__(s, p):
        s.p = p; s.raw = open(p, encoding="utf-8", newline="").read(); s.data = json.loads(s.raw)
        s.nl = "\r\n" if "\r\n" in s.raw else "\n"
        b = s.raw.index("{") + 1 + len(s.nl)
        s.ind = s.raw[b:len(s.raw) - len(s.raw[b:].lstrip(" "))]
    def span(s, key):
        k = '"%s":' % key
        i = s.raw.index(s.nl + s.ind + k) + len(s.nl)
        j = i + len(s.ind) + len(k)
        while s.raw[j] in " \t": j += 1
        _, end = dec.raw_decode(s.raw, j)
        return i, j, end
    def setv(s, key, val):
        t = json.dumps(val, ensure_ascii=False)
        if key in s.data:
            i, j, end = s.span(key); s.raw = s.raw[:j] + t + s.raw[end:]
        else:
            k = s.raw.rstrip().rindex("}")
            body = s.raw[:k].rstrip()
            s.raw = body + "," + s.nl + s.ind + '"%s": %s' % (key, t) + s.nl + "}" + s.nl
        s.data[key] = val
    def delete(s, key):
        i, j, end = s.span(key)
        e = end
        while s.raw[e] in " \t": e += 1
        if s.raw[e] == ",":
            s.raw = s.raw[:i] + s.raw[e + 1:].lstrip(" ").lstrip("\r").lstrip("\n")
        else:
            p = s.raw.rindex(",", 0, i); s.raw = s.raw[:p] + s.raw[end:]
        del s.data[key]
    def save(s):
        open(s.p, "w", encoding="utf-8", newline="").write(s.raw)
        assert json.loads(open(s.p, encoding="utf-8").read()) == s.data

T = "2026-11-04 영어 세션"
f = F(FP)
# 1) 교정 파일 정리 — 기한 지난 note·desc 만 있는 항목
for k in ("1853185", "3396183"):
    assert not ({"start", "end", "addr", "x", "y", "ko", "intro", "aff"} & set(f.data[k])), (k, list(f.data[k]))
    f.delete(k)
# 2) 보강 4장 (2~3주 안 축제, 공식 발표 확인분만)
f.setv("3366992", {
    "note": "The 2026 Goesan Gimjang Festival (gimjang is the late-autumn custom of making a season's worth of kimchi) runs Nov 5–8, 10:00–20:00, around the Goesan Organic Expo Plaza.",
    "noteUntil": "20261108",
    "noteFoot": "Source: Ministry of Culture, Sports and Tourism festival listing (Goesan County). Checked Nov 4, 2026.",
    "desc": "Nov 5–8, 2026 · Goesan, North Chungcheong. Kimchi-making (gimjang) festival around the Goesan Organic Expo Plaza, open 10:00–20:00.",
    "src": "mcst.go.kr festivalView pSeq=11907: 2026.11.5~11.8 10:00~20:00 괴산유기농엑스포광장 일원. " + T})
f.setv("4116386", {
    "note": "BeautySum Suwon 2026 is a beauty expo hosted by Suwon City. It runs Nov 5–7 in the 1st-floor exhibition hall of Suwon Convention Center (Gwanggyo).",
    "noteUntil": "20261107",
    "noteFoot": "Source: Suwon City announcement as reported by Special Times (Oct 30, 2026). Checked Nov 4, 2026.",
    "desc": "Nov 5–7, 2026 · Suwon. Beauty expo hosted by Suwon City in the 1st-floor exhibition hall of Suwon Convention Center, Gwanggyo.",
    "src": "specialtimes.co.kr idxno=480063 (2026-10-30): 11/5~7 수원컨벤션센터 1층 전시홀, 주최 수원시, 주관 수원시·수원컨벤션센터·메쎄이상. " + T})
f.setv("1855864", {
    "note": "The 2026 Pohang Steel Art Festival runs for 23 days, Oct 24 – Nov 15. Works and programs are spread across the city: Dongbin Culture Warehouse 1969, Songdo Beach, Kkumteul-ro, Jungang Shopping Arcade and Jukdo Market.",
    "noteUntil": "20261115",
    "noteFoot": "Source: Kyongbuk Maeil (Oct 19, 2026). Checked Nov 4, 2026.",
    "desc": "Oct 24 – Nov 15, 2026 · Pohang. Steel art installations across the city, from Songdo Beach and Dongbin Culture Warehouse 1969 to Jukdo Market.",
    "src": "kbmaeil.com article/20261018500697 (2026-10-19): 10/24~11/15 23일간, 동빈문화창고1969·송도해수욕장·꿈틀로·중앙상가·죽도시장 등. " + T})
f.setv("4110303", {
    "note": "The Moonlit Night Exercise Busan Challenge runs on weekends from Sep 19 to Nov 7, 2026 (seven sessions in total), at Busan Citizens Park, Bukhang Waterfront Park and Hwamyeong Ecological Park.",
    "noteUntil": "20261107",
    "noteFoot": "Source: Busan Metropolitan City news (Sep 2, 2026). Checked Nov 4, 2026.",
    "desc": "Sep 19 – Nov 7, 2026 · Busan. Weekend evening workout sessions (seven in total) at Busan Citizens Park, Bukhang Waterfront Park and Hwamyeong Ecological Park.",
    "src": "busan.go.kr nbtnewsBU/1752265 (2026-09-02): 9/19~11/7 주말 총 7회, 부산시민공원·북항친수공원·화명생태공원. 회차별 장소·시간은 원문에 없어 안 씀. " + T})
# 3) 한글 원제 좌표만 매칭 오류
v = dict(f.data.get("3562082", {})); v["ko"] = None
v["src"] = (v.get("src", "") + " / " if v.get("src") else "") + "「2026 용골 댄스 페스타」가 좌표만으로 붙음(다른 행사) — 숨김. " + T
f.setv("3562082", v)
f.save()

# 4) checked.json (있는 항목도 갱신)
c = F(CP)
add = {
    "3366992": {"title": "Goesan Gimjang Festival", "date": "2026-11-04", "result": "맞음 11/5~8 10~20시 괴산유기농엑스포광장 — note·desc 추가", "src": "문체부 축제 목록 pSeq=11907"},
    "4116386": {"title": "Beautysum Suwon", "date": "2026-11-04", "result": "맞음 11/5~7 수원컨벤션센터 — note·desc 추가", "src": "스페셜타임스 2026-10-30 idxno=480063 (수원시)"},
    "1855864": {"title": "Pohang Steel Art Festival", "date": "2026-11-04", "result": "맞음 10/24~11/15 — note·desc 추가", "src": "경북매일 2026-10-19 article/20261018500697"},
    "4110303": {"title": "Moonlit Night Exercise Busan Challenge", "date": "2026-11-04", "result": "맞음 9/19~11/7 주말 7회 — note·desc 추가", "src": "부산시 2026-09-02 nbtnewsBU/1752265"},
    "1385298": {"title": "Busan Fireworks Festival", "date": "2026-11-04", "result": "한국어 3곳 확정(kv=confirmed) 11/7 — 맞음", "src": "busanfireworks.com · data/festival_bridge.json"},
    "4126454": {"title": "Sium Sium Morning", "date": "2026-11-04", "result": "미확인 — 강동구 발표 못 찾음(검색 2회)", "src": "웹 검색 2026-11-04"},
    "4066947": {"title": "Peace On: Dam", "date": "2026-11-04", "result": "미확인 — 2026 개최 발표 못 찾음(검색 2회)", "src": "웹 검색 2026-11-04"},
    "1057670": {"title": "Baekje Cultural Festival", "date": "2026-11-04", "result": "2026 끝남(10/3~11, 9/30 공식 확인) — 2027 발표 대기", "src": "baekjeculturalfestival.kr (9/30 대조)"},
    "3310546": {"title": "Tamna Culture Festival", "date": "2026-11-04", "result": "2026 끝남(10/17~21, kv=confirmed) — 2027 발표 대기", "src": "제주시·제주예총 발표 (9/30 대조)"},
    "2561910": {"title": "Goyang Autumn Flower Festival", "date": "2026-11-04", "result": "2026 끝남(10/1~11, 9/30 확인) — 2027 발표 대기", "src": "고양시 발표 (9/30 대조)"},
    "3307792": {"title": "Sejong Hangeul Festival", "date": "2026-11-04", "result": "2026 끝남(10/9~11, 9/30 교정) — 2027 발표 대기", "src": "세종시 발표 (9/30 대조)"},
    "3345888": {"title": "Gangnam Festival", "date": "2026-11-04", "result": "2026 끝남(10/3~5, 9/30 확인) — 2027 발표 대기", "src": "서울시 대표 축제 (9/30 대조)"},
}
for k2, v2 in add.items():
    c.setv(k2, v2)
c.save()

# 5) 목표 — 판정 보류 기록 (값 유지)
g = json.load(open(GP, encoding="utf-8"))
basis = "11/4 판정 보류(200 유지): 4주 주평균 5.5, 최근주 노출 18·클릭 0. 원인은 10/23부터의 사이트 전체 구글 노출 급감(일 2,400→100, 11/3에도 미회복, 색인·크롤 정상). 회복안(claude/회복안_2026-11-03_구글노출.md) 1차 판정이 12/1이라, 영어 쪽 속도로 목표를 다시 낮추면 회복 후 기준이 무너진다 — 12/1 판정 뒤 재설정"
g["history"].append({"date": "2026-11-04", "event": "유지(판정 보류)", "target": 200, "c90": 128, "basis": basis})
open(GP, "w", encoding="utf-8").write(json.dumps(g, ensure_ascii=False, indent=1) + "\n")
print("ok", len(f.data), len(c.data))
