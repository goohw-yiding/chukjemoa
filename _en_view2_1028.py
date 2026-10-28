# -*- coding: utf-8 -*-
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
b = json.load(open(r"C:\dev\chukjemoa\data\festival_bridge.json", encoding="utf-8"))
en = json.load(open(r"C:\dev\chukjemoa\data\festivals_en.json", encoding="utf-8"))
byid = {str(f["id"]): f for f in en}
ids = sys.argv[1:]
links = b.get("links", [])
print("bridge keys:", list(b.keys())[:10], "links type", type(links).__name__, len(links))
sample = links[0] if isinstance(links, list) and links else (list(links.items())[0] if isinstance(links, dict) and links else None)
print("sample link:", json.dumps(sample, ensure_ascii=False)[:400])
for i in ids:
    f = byid.get(i, {})
    print(i, f.get("title"), f.get("start"), f.get("end"), f.get("addr"), f.get("tel"), f.get("kv"), f.get("kvName"))
    s = json.dumps(links, ensure_ascii=False)
    p = s.find('"' + i + '"')
    if p >= 0: print("   bridge:", s[max(0, p - 200):p + 250])
