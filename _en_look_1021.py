# -*- coding: utf-8 -*-
import json, sys, re
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
F = json.load(open(r"C:\dev\chukjemoa\data\festivals_en.json", encoding="utf-8"))
L = F if isinstance(F, list) else F.get("items", F.get("festivals", []))
fix = json.load(open(r"C:\dev\chukjemoa\data\festivals_en_fix.json", encoding="utf-8"))
chk = json.load(open(r"C:\dev\chukjemoa\data\festivals_en_checked.json", encoding="utf-8"))
ids = sys.argv[1:]
for f in L:
    fid = str(f.get("id") or f.get("contentid"))
    t = f.get("title", "")
    if fid in ids or any(i.lower() in t.lower() for i in ids if not i.isdigit()):
        print("==", fid, t, f.get("start") or f.get("eventstartdate"), f.get("end") or f.get("eventenddate"), "kv=", f.get("kv"), f.get("kvName"))
        print("   addr:", f.get("addr") or f.get("addr1"), "| hp:", (f.get("hp") or f.get("homepage") or "")[:150])
        print("   intro:", str(f.get("intro") or f.get("overview") or "")[:300])
        if fid in fix: print("   FIX:", json.dumps(fix[fid], ensure_ascii=False)[:600])
        if fid in chk: print("   CHK:", json.dumps(chk[fid], ensure_ascii=False)[:300])
