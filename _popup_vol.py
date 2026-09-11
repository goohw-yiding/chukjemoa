# -*- coding: utf-8 -*-
# 팝업스토어·전시 계열 검색량 — 축제모아가 이 영역을 다룰 값어치가 있나
import sys, time, json
sys.path.insert(0, r"C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업")
from nv_volume import volumes

GROUPS = [
    ["팝업스토어", "성수팝업", "성수동팝업", "팝업스토어일정", "서울팝업"],
    ["더현대팝업", "잠실팝업", "홍대팝업", "여의도팝업", "강남팝업"],
    ["전시회", "서울전시회", "요즘전시회", "이번주전시회", "무료전시회"],
    ["옥토버페스트", "옥토버페스트서울", "맥주축제", "서울맥주축제", "가을축제"],
    ["이번주말갈만한곳", "주말나들이", "서울가볼만한곳", "데이트코스", "이번주말행사"],
    ["9월팝업스토어", "10월팝업스토어", "성수동가볼만한곳", "성수동전시", "팝업"],
]
out = []
for g in GROUPS:
    try:
        rows = volumes(g)
    except Exception as e:
        print("실패", g[0], str(e)[:60]); time.sleep(1); continue
    for r in rows:
        if isinstance(r, (list, tuple)) and len(r) >= 4:
            out.append((r[0], r[1], r[2], r[3], r[4] if len(r) > 4 else ""))
    time.sleep(0.35)

out.sort(key=lambda x: -x[0])
print("%-20s %10s %9s %9s  %s" % ("검색어", "월 총합", "PC", "모바일", "경쟁도"))
for tot, kw, pc, mo, comp in out:
    print("%-20s %10s %9s %9s  %s" % (kw, format(tot, ","), format(pc, ","), format(mo, ","), comp))
