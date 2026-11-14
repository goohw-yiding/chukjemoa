# -*- coding: utf-8 -*-
import json, sys, re, urllib.request
sys.stdout.reconfigure(encoding="utf-8")
fx = json.load(open(r"C:\dev\chukjemoa\data\festivals_en_fix.json", encoding="utf-8"))
en = json.load(open(r"C:\dev\chukjemoa\data\festivals_en.json", encoding="utf-8"))
L = en if isinstance(en, list) else en.get("items", en)
byid = {str(x.get("contentid") or x.get("id")): x for x in L} if isinstance(L, list) else {}
for k in ["293214","697445","1084180","1244634","1385298","3307792","3310546","3364856","3562124","4088990","3366992","4116386","4110303","3562082","1855864"]:
    v = fx.get(k)
    print(k, "IN_EN" if k in byid else "NOT_EN", sorted(v.keys()) if v else None)
print("---")
for k in ["2513248","3043397","3554627","4116443","3386385","4135883","4135897","1121607","1855864","4010852","1117592","3536904","4126454"]:
    x = byid.get(k, {})
    print(k, x.get("title"), x.get("eventstartdate") or x.get("start"), x.get("eventenddate") or x.get("end"), (x.get("addr1") or x.get("addr")), x.get("kv"), x.get("kvName"), "fix:" + str(sorted(fx.get(k, {}).keys())))
print(list(L[0].keys()) if isinstance(L, list) else type(L))
