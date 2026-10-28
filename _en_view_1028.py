# -*- coding: utf-8 -*-
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
fx = json.load(open(r"C:\dev\chukjemoa\data\festivals_en_fix.json", encoding="utf-8"))
en = json.load(open(r"C:\dev\chukjemoa\data\festivals_en.json", encoding="utf-8"))
L = en if isinstance(en, list) else en.get("items", en.get("festivals", []))
byid = {str(f.get("id") or f.get("contentid")): f for f in L}
ids = sys.argv[1:] or list(fx)
for k in ids:
    v = fx.get(k)
    f = byid.get(k, {})
    print("=" * 8, k, f.get("title"), f.get("start") or f.get("eventstartdate"), f.get("end") or f.get("eventenddate"), f.get("slug", ""))
    if v:
        for kk, vv in v.items():
            s = json.dumps(vv, ensure_ascii=False)
            print("  ", kk, ":", s[:300])
print("keys in fix:", len(fx)); print("sample en keys:", list(L[0].keys())[:30])
