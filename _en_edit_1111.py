# -*- coding: utf-8 -*-
"""11/11 영어 주간 — fix.json 정리·보강 4장·한글 원제 숨김, checked.json 기록, en_goals 유지 기록 (_en_edit_1104.py class F)"""
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
exec(open(r"C:\dev\chukjemoa\_en_edit_1104.py", encoding="utf-8").read().split('T = "2026-11-04')[0])
T = "2026-11-11 영어 세션"
f = F(FP)
# 1) 정리 — 영문 원본에서 사라진 항목 / 끝난 축제의 note·desc 전용 항목
for k in ():  # 11/11 커밋 관문(fix.json 항목 수 감소 금지) — 삭제하지 않고 둔다(자동 숨김)
    if k in f.data:
        if k in ("1244634", "3366992", "4116386", "4110303"):
            assert not ({"start", "end", "addr", "x", "y", "ko", "intro", "aff"} & set(f.data[k])), (k, list(f.data[k]))
        f.delete(k)
# 끝난 축제 — note 류만 빼고 intro·장소 교정은 유지
for k in ("3364856", "4088990", "1084180", "697445"):
    v = dict(f.data[k])
    for kk in ("note", "noteFoot", "noteUntil", "desc", "descUntil"):
        v.pop(kk, None)
    v["src"] = v.get("src", "") + " / 11/11 축제 끝남 → note·desc 정리. " + T
    f.setv(k, v)
# 2) 보강 4장
f.setv("1037621", {
    "note": "Pohang City has confirmed the 2026 festival for Nov 19–21 at Yeongildae Beach and Songdo Pier (moved from early summer because of the June local elections). Nov 19: a media-facade lighting ceremony at Songdo Pier and a citizens' fireworks show. Nov 20: the Asia DJ Festival and a Night Carnival. Nov 21: the International Fireworks Show with teams from France and Japan, followed by Korea's Grand Finale over Yeongildae Beach (an earlier report put the start at 8 pm). The city expects more than 150,000 visitors and will run AI crowd-monitoring cameras around Yeongildae Beach. Road closures and shuttle buses had not been announced as of Nov 11, 2026.",
    "noteUntil": "20261121",
    "noteFoot": "Sources: Kyongbuk Maeil, Oct 27 and Nov 6, 2026, citing Pohang City; News1, Oct 19, 2026. Checked Nov 11, 2026.",
    "desc": "Nov 19–21, 2026 · Pohang. Yeongildae Beach & Songdo Pier: lighting ceremony, DJ festival, and the Nov 21 international fireworks show (France, Japan, Korea finale).",
    "src": "경북매일 2026-10-27 article/20261027500411(포항시 발표): 11/19~21 영일대해수욕장·송도부두, 19일 미디어파사드 점등식·시민불꽃쇼, 20일 아시아 DJ 페스티벌·나이트카니발, 21일 국제불꽃쇼(프랑스·일본)+그랜드피날레. 경북매일 2026-11-06 article/20261106500141: 15만명 예상, AI CCTV. 20시는 뉴스1 10/19. 셔틀·통제 미발표. " + T})
f.setv("4116443", {
    "note": "The 2026 Citywide Energy Walk Festival is on Sunday, Nov 15, 13:30–17:00, and is free. It opens at Daejeon Expo Citizens' Plaza at 13:30; the mobile stamp walking tour (14:00–15:30) starts from the plaza and passes through Hanbat Arboretum, with four QR missions for a finisher reward. An energy OX quiz and six eco-energy hands-on booths are in Exhibition Hall 1 of DCC (Daejeon Convention Center).",
    "noteUntil": "20261115",
    "noteFoot": "Source: Special Times (Nov 8, 2026), festival listing (hosts include Daejeon City; organized by Daejeon Tourism Organization). Checked Nov 11, 2026.",
    "desc": "Sun Nov 15, 2026 · Daejeon. Free, non-competitive walk from Daejeon Expo Citizens' Plaza through Hanbat Arboretum, 13:30–17:00, with energy booths at DCC.",
    "src": "스페셜타임스 2026-11-08 idxno=483008: 11/15(일) 13:30~17:00 대전엑스포시민광장, 무료, 스탬프 워킹투어 14:00~15:30 엑스포시민광장~한밭수목원 QR 4개, DCC 제1전시장 OX퀴즈·체험 6종. 주최 기후에너지환경부·대전시·한국태양광발전학회, 주관 대전관광공사. " + T})
f.setv("4135883", {
    "note": "Christmas Village Busan 2026 runs Nov 26 – Dec 25 at the Busan Cinema Center in Centum City. Entry is by paid ticket, sold on YES24; prices differ for weekdays, weekend daytime, weekend evenings and the Christmas days (Dec 24–25). Hours: weekdays 16:00–22:00, weekends and Dec 24–25 from 11:00 to 22:00.",
    "noteUntil": "20261225",
    "noteFoot": "Source: YES24 ticket page for Christmas Village Busan 2026. Checked Nov 11, 2026.",
    "desc": "Nov 26 – Dec 25, 2026 · Busan Cinema Center, Centum City. Paid-ticket Christmas village with a snowy plaza, parades and pop-ups; weekdays from 4 pm.",
    "src": "YES24 티켓 m.ticket.yes24.com/Perf/60679: 2026.11.26~12.25 영화의전당, 평일 16~22시·주말 11~22시·크리스마스 시즌 11~22시, 요금 구간 4개(평일·주말주간·주말야간·크리스마스). 요금 금액은 맘맘 등 다른 곳과 달라 안 씀. " + T})
f.setv("4135897", {
    "note": "Seoul Light Gwanghwamun is part of Seoul Winter Festa 2026, which Seoul's official culture portal lists for Dec 11, 2026 – Jan 31, 2027 at Gwanghwamun Square and six other sites. Its Gwanghwamun program includes the media-facade light show and the New Year countdown, alongside Gwanghwamun Market and the Seoul Lantern Festival along Cheonggyecheon.",
    "noteUntil": "20270103",
    "noteFoot": "Source: Seoul Culture Portal (festival.seoul.go.kr), Seoul Winter Festa listing. Checked Nov 11, 2026.",
    "desc": "From Dec 11, 2026 · Gwanghwamun Square, Seoul. Media-facade light show and New Year countdown, part of Seoul Winter Festa (Dec 11 – Jan 31).",
    "src": "서울문화포털 festivalView festacode=373 윈터페스타 2026-12-11~2027-01-31 광화문광장 외 6곳 — 서울라이트광화문(미디어파사드·신년 카운트다운)·광화문마켓·서울빛초롱축제(청계천). 서울라이트 종료일(1/3)은 원문 미확인. " + T})
# 3) 한글 원제 좌표만 매칭 — 회차 다름
for k, why in (("4010852", "「2027 ACE Fair」(2027-09-23) — 2026 회차(9/10~13)가 아님"), ("1117592", "「병오년 해맞이 행사」(2025-12-31) — 지난 회차, 2026-12-31 행사 이름 미발표")):
    v = dict(f.data.get(k, {})); v["ko"] = None
    v["src"] = (v.get("src", "") + " / " if v.get("src") else "") + why + " → 숨김. " + T
    f.setv(k, v)
f.save()

c = F(CP)
D = "2026-11-11"
add = {
    "1037621": {"title": "Pohang International Fireworks Festival", "date": D, "result": "맞음 11/19~21(포항시 10/27 발표) — note 프로그램 갱신·desc", "src": "경북매일 2026-10-27·11-06"},
    "4116443": {"title": "Citywide Energy Walk Festival", "date": D, "result": "맞음 11/15 13:30~17:00 — note·desc 추가", "src": "스페셜타임스 2026-11-08 idxno=483008"},
    "4135883": {"title": "Busan Christmas Village", "date": D, "result": "맞음 11/26~12/25 영화의전당 — note·desc 추가", "src": "YES24 Perf/60679"},
    "4135897": {"title": "Seoul Light Gwanghwamun", "date": D, "result": "시작 12/11 맞음(윈터페스타 12/11~1/31), 종료 1/3 원문 미확인 — note·desc 추가", "src": "서울문화포털 festacode=373"},
    "1121607": {"title": "Seoul Lantern Festival", "date": D, "result": "윈터페스타 12/11~1/31 과 일치, 빛초롱 자체 공지(festacode=360)는 날짜 비어 있음(예정)", "src": "서울문화포털 festacode=373"},
    "3043397": {"title": "Gwanghwamun Market", "date": D, "result": "시작 12/11 맞음(윈터페스타 프로그램), 종료 1/10 원문 미확인", "src": "서울문화포털 festacode=373"},
    "3554627": {"title": "The Souvenir Fair", "date": D, "result": "관광공사 자료와 일치 11/20~22 DDP 아트홀 1·2관 무료 — 문체부·관광공사 원문 미확인", "src": "여기유 place/26973(관광공사 API)"},
    "2513248": {"title": "E-World Illumination", "date": D, "result": "미확인 — eworld.kr 에 2026 공지 없음(검색 2회)", "src": "eworld.kr 2026-11-11"},
}
for k2, v2 in add.items():
    c.setv(k2, v2)
c.save()

g = json.load(open(GP, encoding="utf-8"))
basis = "11/11 유지(판정 보류 계속): 4주 주평균 2.8, 최근주 노출 18·클릭 0. 사이트 전체 일 노출 39~116(10/27~11/10)로 10/23 급감 뒤 미회복, 영어 대표 URL 색인·크롤 정상. 12/1 회복안 1차 판정 뒤 재설정"
g["history"].append({"date": "2026-11-11", "event": "유지(판정 보류)", "target": 200, "c90": 128, "basis": basis})
open(GP, "w", encoding="utf-8").write(json.dumps(g, ensure_ascii=False, indent=1) + "\n")
print("ok", len(f.data), len(c.data))
