# -*- coding: utf-8 -*-
import json, sys
exec(open(r"C:\dev\chukjemoa\_en_edit_1104.py", encoding="utf-8").read().split('T = "2026-11-04')[0])
f = F(FP)
v = dict(f.data["1037621"])
v["desc"] = "Nov 19–21, 2026 · Pohang. Yeongildae Beach & Songdo Pier: lighting ceremony, Asia DJ Festival, and the Nov 21 international fireworks show."
assert len(v["desc"]) <= 150, len(v["desc"])
f.setv("1037621", v)
f.save()
print("ok", len(v["desc"]))
