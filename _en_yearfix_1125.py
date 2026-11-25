# -*- coding: utf-8 -*-
"""11/25 festival-en.js — 해를 넘기는 축제의 제목·설명 날짜에 양쪽 연도를 붙인다"""
p = r"D:\dev\chukjemoa\festival-en.js"
s = open(p, encoding="utf-8", newline="").read()
a = "    const span = ended ? '' : dateSpan(f);"
b = ("    // 2026-11-25 해를 넘기는 축제(예: Dec 4 – Mar 14)는 «Dec 4, 2026–Mar 14, 2027» 로 양쪽 연도를 쓴다\n"
     "    //   (전엔 «Dec 4–Mar 14, 2026» 처럼 끝 날짜에 시작 연도가 붙어 틀렸다). 제목 머리의 연도는 이때 뺀다.\n"
     "    const crossYr = !ended && !!yearOf(f.end) && !!yearOf(f.start) && yearOf(f.end) !== yearOf(f.start);\n"
     "    const span = ended ? '' : (crossYr ? `${fmtShort(f.start)}, ${yearOf(f.start)}–${fmtShort(f.end)}, ${yearOf(f.end)}` : dateSpan(f));")
assert s.count(a) == 1; s = s.replace(a, b)
a2 = ": fitTitle(`${f.title}${useYr ? ' ' + useYr : ''}`,"
b2 = ": fitTitle(`${f.title}${useYr && !crossYr ? ' ' + useYr : ''}`,"
assert s.count(a2) == 1; s = s.replace(a2, b2)
a3 = "[span && useYr ? `${span}, ${useYr}` : (span || useYr), cnm]"
b3 = "[span && useYr && !crossYr ? `${span}, ${useYr}` : (span || useYr), cnm]"
assert s.count(a3) == 1; s = s.replace(a3, b3)
open(p, "w", encoding="utf-8", newline="").write(s)
print("ok")
