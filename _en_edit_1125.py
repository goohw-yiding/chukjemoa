# -*- coding: utf-8 -*-
"""11/25 영어 주간 — 끝난 축제 note 정리(항목은 둠)·보강(화천산천어 + Creatrip 투어, MATERIALISM)·checked 기록·en_goals 유지 기록"""
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
exec(open(r"D:\dev\chukjemoa\_en_edit_1104.py", encoding="utf-8").read().split('T = "2026-11-04')[0])
T = "2026-11-25 영어 세션"
f = F(FP)
n0 = len(f.data)
# 1) 끝난 축제 — note 류만 뺀다(항목·intro·aff 는 둠, 커밋 관문)
for k in ("1037621", "1244634", "3554627", "3366992", "4116386", "1855864", "4110303", "4116443"):
    if k not in f.data: continue
    v = dict(f.data[k]); had = [kk for kk in ("note", "noteFoot", "noteUntil", "desc", "descUntil") if kk in v]
    if not had: continue
    for kk in had: v.pop(kk)
    v["src"] = v.get("src", "") + " / 11/25 축제 끝남 → note·desc 정리. " + T
    f.setv(k, v)
# 2) 보강
f.setv("685135", {
    "note": "Hwacheon County has confirmed the 2027 festival for Jan 9–31 (23 days) on the frozen Hwacheon Stream in Hwacheon-eup. Detailed programs and advance booking for ice fishing will be posted later on the official site (narafestival.com) and county channels. For 2027 the county is reviewing a higher adult ice-fishing fee — KRW 25,000 with KRW 15,000 returned as local vouchers, up from KRW 15,000 in 2026 — so check the final price before you go.",
    "noteUntil": "20270131",
    "noteFoot": "Sources: Hwacheon County announcement reported by Gukje News (Nov 13, 2026); Aju Business Daily (Oct 2, 2026) for the fee plan. Checked Nov 25, 2026.",
    "desc": "Jan 9–31, 2027 · Hwacheon, Gangwon. Ice fishing for mountain trout on the frozen stream, ice sledding and an ice sculpture plaza. Seoul day tours run Jan 11–31.",
    "aff": {
        "until": "20270129",
        "url": "https://creatrip.com/en/spot/14421?utm_source=AFF-4ljv46f&aff_id=AFF-4ljv46f",
        "lead": "No car? A day tour from Seoul runs daily Jan 11–31, 2027 (pickup at Hongik Univ. Stn, near Myeongdong Stn and Dongdaemun History & Culture Park Stn; festival admission, ice fishing and sledding included; foreign passport holders only; book by 5 pm two days before)",
        "text": "See the Hwacheon ice festival day tour from Seoul",
        "checked": "2026-11-25 creatrip spot/14421 열어 확인 — 「2027 Hwacheon Sancheoneo Ice Festival Day Tour (Departing from Seoul)」, Operating Period January 11–31, 2027, 예약 마감 투어 이틀 전 17:00, From 39.41 USD, 08:30 홍대입구역 8번·09:00 남산예장 공영주차장·09:10 동대문역사문화공원역 11번, 포함: 입장료·얼음낚시(3마리)·썰매 3회·전통 썰매 1시간·송어구이 1마리, 한국 여권 불가, 최소 10명. Reservations closed/Sold Out 없음"
    },
    "src": "국제뉴스 2026-11-13 idxno=3751017(화천군: 2027 얼음나라 화천산천어축제 1/9~31, 23일간, 화천군 일원) · 아주경제 2026-10-02(같은 날짜, 성인 이용료 1.5만→2.5만·1.5만 환급 검토 중). " + T
})
f.setv("4149562", {
    "note": "The exhibition runs Nov 7, 2026 – Feb 28, 2027 on basement levels 2 and 3 of the Seoul Hall of Urbanism & Architecture (by Deoksugung Palace, City Hall Station). It is BIG's first curated exhibition in Korea, with more than 110 architectural models organized around ten materials. Open 10 am–6 pm (to 9 pm on Saturdays), closed Mondays, and admission is free.",
    "noteUntil": "20270228",
    "noteFoot": "Source: Seoul Metropolitan Government (Seoul News, Nov 6, 2026). Checked Nov 25, 2026.",
    "desc": "Nov 7, 2026 – Feb 28, 2027 · Seoul Hall of Urbanism & Architecture. Free BIG exhibition with 110+ models; to 9 pm on Saturdays, closed Mondays.",
    "src": "서울시 미디어허브 2026-11-06 archives/2019950: 11/7~2027-2/28 서울도시건축전시관 지하 2·3층, 10~18시(토 21시), 월 휴관, 무료, 모형 110여 점·재료 10가지. " + T
})
assert len(f.data) >= n0
f.save()

c = F(CP)
D = "2026-11-25"
add = {
    "685135": {"title": "Hwacheon Sancheoneo Ice Festival", "date": D, "result": "맞음 2027-01-09~31 — note·desc·Creatrip 14421 추가", "src": "국제뉴스 2026-11-13·아주경제 2026-10-02"},
    "4149562": {"title": "MATERIALISM | BIG", "date": D, "result": "맞음 11/7~2027-2/28 서울도시건축전시관 무료 — note·desc 추가", "src": "서울시 미디어허브 2026-11-06"},
    "3115770": {"title": "Gwangalli M Drone Light Show", "date": D, "result": "맞음 매주 토, 10~2월 19·21시(11/28 프로그램까지 공지) — 12월 프로그램은 공식 누리집 확인 필요", "src": "부산시 영문 게시 2026-11-11 bsnews01/1763224"},
    "1876890": {"title": "Yangpyeong Icefish Festival", "date": D, "result": "한글 원제 「양평빙송어축제」 = 같은 행사(곱다니길 55-2, 수미마을) — 오매칭 아님. 2026-27 날짜 미발표(TourAPI 영문은 2025-26판)", "src": "관광공사 ktriptips kor/1762432·ger/1907097"},
    "2758139": {"title": "Korea Grand Sale", "date": D, "result": "미확인 — 관광공사 자료 12/23~2/13 뿐, 문체부·위원회 원문 발표 못 찾음", "src": "여기유 place/3673(관광공사 API)"},
    "4060947": {"title": "Gugak Performance Jinyeon", "date": D, "result": "미확인 — 주최 공식 일정 못 찾음", "src": "검색 2026-11-25"},
    "293277": {"title": "Homigot Sunrise Festival", "date": D, "result": "미확인 — 2027 행사 발표 전(12월 초 예상)", "src": "검색 2026-11-25"},
    "1117592": {"title": "Jeongdongjin Sunrise Festival", "date": D, "result": "미확인 — 2027 행사 발표 전", "src": "검색 2026-11-25"},
    "1490063": {"title": "Yeosu Hyangiram Sunrise Festival", "date": D, "result": "미확인 — 2027 행사 발표 전", "src": "검색 2026-11-25"},
}
for k2, v2 in add.items():
    c.setv(k2, v2)
c.save()

g = json.load(open(GP, encoding="utf-8"))
basis = "11/25 유지(판정 보류 계속): 4주 주평균 0.0, 최근주(11/16~22) 노출 23·클릭 0, 90일 누적 121(9월 말 클릭이 90일 창에서 빠지는 중). 사이트 전체 일 노출 22~103(11/8~24)로 10/23 급감 뒤 미회복, 영어 대표 URL 색인·크롤 정상(/en/ 11/21·/en/festival/ 11/20). 12/1 회복안 1차 판정 뒤 12/2 회차에 재설정"
g["history"].append({"date": "2026-11-25", "event": "유지(판정 보류)", "target": 200, "c90": 121, "basis": basis})
open(GP, "w", encoding="utf-8").write(json.dumps(g, ensure_ascii=False, indent=1) + "\n")
print("ok", n0, len(f.data), len(c.data))
