# -*- coding: utf-8 -*-
# 손으로 정렬된 파일이라 json.dump 로 다시 쓰지 않고 마지막 } 앞에 한 항목만 끼운다
import json
P = r"C:\dev\chukjemoa\data\festivals_en_fix.json"
s = open(P, encoding="utf-8").read().rstrip()
assert s.endswith("}") and '"1084180"' not in s
entry = {
    "intro": {
        "place": "Jeju Olle Routes 19 and 20 (Jocheon-eup to Gujwa-eup, Jeju-si)",
        "fee": "KRW 30,000; KRW 25,000 for groups of 20 or more, youth, people with disabilities and national merit recipients"
    },
    "note": "The 2026 Jeju Olle Walking Festival runs Nov 5–7 on Olle Routes 19 and 20. Day 1: opening at Jocheon Sports Ground, then 13 km to Dongbok-ri Sports Park. Day 2: Dongbok-ri Sports Park to Jeju Batdam Theme Park (11.5 km). Day 3: Jeju Haenyeo Anti-Japanese Movement Memorial Park back to Jeju Batdam Theme Park (12.9 km). Pre-registration period: Jul 8 – Oct 9, 2026, in the official Olle Pass app — foreign visitors register in the same app. The organizers say this is the last edition in the three-day, one-route format; from 2027 the festival is planned to spread across 23 routes over 25 days.",
    "noteUntil": "20261107",
    "noteFoot": "Checked against two reports of the organizer's announcement (Seoul Shinmun 2026-07-08, Jnuri 2026-07). The participation fee appears in one of them only — confirm in the Olle Pass app.",
    "src": "서울신문 2026-07-08 (seoul.co.kr/news/society/2026/07/08/20260708500087) — 11/5~7·19·20코스·참가비·올레패스·10/9 마감·내년 25일 23코스 개편 / 제이누리 no=69060 — 11/5~7·일자별 구간(13·11.5·12.9km)·사전신청 7/8~10/9·외국인 같은 앱. 2026-10-06 영어 세션"
}
s = s[:-1].rstrip() + ',\n  "1084180": ' + json.dumps(entry, ensure_ascii=False) + "\n}\n"
json.loads(s)
open(P, "w", encoding="utf-8", newline="\n").write(s)
print("ok")
