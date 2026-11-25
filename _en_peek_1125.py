# -*- coding: utf-8 -*-
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
fix = json.load(open("data/festivals_en_fix.json", encoding="utf-8"))
en = json.load(open("data/festivals_en.json", encoding="utf-8"))
rows = en if isinstance(en, list) else en.get("items", en.get("list", []))
byid = {str(r.get("contentid") or r.get("id")): r for r in rows}
for i in ["685135", "4149562", "3115770", "1876890", "4060947", "2758139"]:
    r = byid.get(i, {})
    print(i, "| EN:", {k: r.get(k) for k in ["title", "eventstartdate", "eventenddate", "start", "end", "addr1", "addr", "slug", "kvName"] if r.get(k)})
    print("   FIX:", json.dumps(fix.get(i), ensure_ascii=False)[:600])
print(open("_en_edit_1111.py", encoding="utf-8").read()[:1500])
