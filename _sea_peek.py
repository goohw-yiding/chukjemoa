import json, sys, collections
sys.stdout.reconfigure(encoding="utf-8")
sea = json.load(open("data/sea_exp.json", encoding="utf-8"))
s = sea[0]
print({k: (str(v)[:120] if not isinstance(v, (dict, list)) else type(v).__name__) for k, v in s.items()})
print("intro keys:", collections.Counter(k for x in sea for k, v in (x.get("intro") or {}).items() if v).most_common())
print(json.dumps(s.get("intro"), ensure_ascii=False)[:800])
print("images", str(s.get("images"))[:300])
print("ctype", collections.Counter(x.get("ctype") for x in sea))
print("tel", sum(1 for x in sea if x.get("tel")), "home", sum(1 for x in sea if x.get("homepage")), "img", sum(1 for x in sea if x.get("firstimage")))
f = json.load(open("data/tide_fcst.json", encoding="utf-8"))
print(list(f["DT_0001"].items())[:2])
st = json.load(open("data/tide_stations.json", encoding="utf-8")); print(list(st.items())[:2])
