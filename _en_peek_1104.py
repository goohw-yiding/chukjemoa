# -*- coding: utf-8 -*-
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
fix = json.load(open("data/festivals_en_fix.json", encoding="utf-8"))
chk = json.load(open("data/festivals_en_checked.json", encoding="utf-8"))
en = json.load(open("data/festivals_en.json", encoding="utf-8"))
en = en if isinstance(en, list) else en.get("items", en.get("list", []))
br = json.load(open("data/festival_bridge.json", encoding="utf-8"))
links = br.get("links", [])
ids = sys.argv[1].split(",")
byid = {str(f.get("contentid") or f.get("id")): f for f in en}
for i in ids:
    f = byid.get(i, {})
    print("==", i, f.get("title"), f.get("eventstartdate") or f.get("start"), f.get("eventenddate") or f.get("end"), "kv=", f.get("kv"), f.get("kvName"), "| addr", (f.get("addr1") or f.get("addr") or "")[:60])
    if i in fix: print("  FIX keys:", {k: (str(v)[:90]) for k, v in fix[i].items()})
    if i in chk: print("  CHK:", chk[i])
print("goals:", json.dumps(json.load(open("data/en_goals.json", encoding="utf-8")), ensure_ascii=False)[:1500])
print("conflicts:", len(br.get("conflicts", [])), [c for c in br.get("conflicts", []) if str(c.get("en") or c.get("id")) in ids][:5])
