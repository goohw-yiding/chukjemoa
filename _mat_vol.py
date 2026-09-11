# -*- coding: utf-8 -*-
# 돗자리 계열이 지금(9월) 팔릴 말인지 «검색량으로» 먼저 잰다. 추측으로 자리를 바꾸지 않는다.
import sys
sys.path.insert(0, r"C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업")
from nv_volume import volumes

KW = ["돗자리", "피크닉매트", "접이식돗자리", "방수돗자리", "피크닉돗자리",
      "폴딩스툴", "캠핑의자", "캠핑테이블", "그늘막"]
out = []
for i in range(0, len(KW), 5):
    try:
        out += volumes(KW[i:i + 5]) or []
    except Exception as e:
        print("오류", str(e)[:80])
# 튜플 모양: (합계, 검색어, PC, 모바일, 경쟁강도)
want = {k.replace(" ", "") for k in KW}
rows = [t for t in out if str(t[1]).replace(" ", "") in want]
rows.sort(key=lambda t: -t[0])
print("%-14s %9s %9s %9s  %s" % ("검색어", "합계", "PC", "모바일", "경쟁"))
for tot, kw, pc, mo, comp in rows:
    print("%-14s %9s %9s %9s  %s" % (kw, format(tot, ","), format(pc, ","), format(mo, ","), comp))
