# -*- coding: utf-8 -*-
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
P = json.load(open(r"C:\dev\chukjemoa\data\posts_en.json", encoding="utf-8"))
L = P if isinstance(P, list) else P.get("posts", P)
print(type(P), len(L))
for p in L:
    if "ojang" in json.dumps(p):
        print({k: (v[:200] if isinstance(v, str) else type(v).__name__) for k, v in p.items()})
raw = open(r"C:\dev\chukjemoa\data\posts_en.json", encoding="utf-8").read()
print(raw[:300].replace("\n", "\\n"))
F = json.load(open(r"C:\dev\chukjemoa\data\festivals_en.json", encoding="utf-8"))
L = F if isinstance(F, list) else F.get("items", F.get("festivals", []))
for f in L:
    if "Starry Night in Busan" in f.get("title", ""):
        print(f.get("id"), f.get("title"), f.get("start"), f.get("end"))
