# -*- coding: utf-8 -*-
import json, sys
fx = json.load(open(r"C:\dev\chukjemoa\data\festivals_en_fix.json", encoding="utf-8"))
en = json.load(open(r"C:\dev\chukjemoa\data\festivals_en.json", encoding="utf-8"))
out = []
for x in en:
    if "Pohang International" in x["title"] or x["id"] in ("2513248","4135883","4116443","4135897"):
        out.append({"en": x, "fix": fx.get(x["id"])})
open(r"C:\dev\chukjemoa\_look_1111b.json", "w", encoding="utf-8").write(json.dumps(out, ensure_ascii=False, indent=1))
