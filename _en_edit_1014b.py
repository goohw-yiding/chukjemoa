# -*- coding: utf-8 -*-
"""10/14 desc 155자 이내로 줄이기 (문자열 치환만)"""
import json, sys; sys.stdout.reconfigure(encoding="utf-8")
P = "data/festivals_en_fix.json"; t = open(P, encoding="utf-8").read()
R = {
 "Nov 6–10, 2026 · Gimhae. Korea's Buncheong pottery festival moves to Lotte Garden Park in Jangyu this year: potters' market, clay workshops and a kiln firing.":
 "Nov 6–10, 2026 · Gimhae. The Buncheong pottery festival moves to Lotte Garden Park in Jangyu this year: potters' market, clay workshops, a kiln firing.",
 "Oct 14–18, 2026 · Chuncheon. Makguksu 6,900 won and dakgalbi 9,900 won at every stall, 11 am–9 pm by Gongjicheon Stream, plus free tastings by overseas chefs.":
 "Oct 14–18, 2026 · Chuncheon. Makguksu 6,900 won, dakgalbi 9,900 won at every stall, 11 am–9 pm by Gongjicheon Stream, plus free tastings by global chefs.",
 "Oct 17–25, 2026 · Seoul. Autumn festival at 7 Hangang parks: free K-street-food truck contest at Ttukseom, yacht and kayak rides at Banpo, free zipline in Gangseo.":
 "Oct 17–25, 2026 · Seoul. Autumn festival at 7 Hangang parks: free K-street-food truck contest at Ttukseom, yacht and kayak rides at Banpo, zipline in Gangseo.",
 "Oct 21–25, 2026 · Gangneung. Coffee Street at Anmok Beach, 10 am–8 pm: free local café tastings, a coffee-bean photo zone and busking. Buses 212/212-1 from the station.":
 "Oct 21–25, 2026 · Gangneung. Coffee Street at Anmok Beach, 10 am–8 pm: free café tastings, a coffee-bean photo zone, busking. Bus 212 from the station.",
}
for a, b in R.items():
    assert a in t, a[:40]; t = t.replace(a, b)
F = json.loads(t)
for k, v in F.items():
    if isinstance(v, dict) and v.get("desc"): print(k, len(v["desc"]))
open(P, "w", encoding="utf-8", newline="\n").write(t)
