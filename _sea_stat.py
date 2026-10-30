# -*- coding: utf-8 -*-
import json, sys, collections
sys.stdout.reconfigure(encoding="utf-8")
sea = json.load(open("data/sea_exp.json", encoding="utf-8"))
c = collections.Counter(s.get("sido") for s in sea)
print(c.most_common())
st = json.load(open("data/tide_stations.json", encoding="utf-8"))
for sd, _ in c.most_common():
    names = collections.Counter(st[s["tide_obs"]]["name"] for s in sea if s.get("sido") == sd and s.get("tide_obs") in st)
    print(sd, dict(names))
kw = collections.Counter()
for s in sea:
    t = (s.get("overview") or "") + json.dumps(s.get("intro") or {}, ensure_ascii=False)
    for k in ["해루질", "조개", "바지락", "갯벌", "낚시", "카약", "갯바위", "굴", "맛조개", "망둥어", "후릿그물", "독살", "개매기", "숙박", "체험료", "예약"]:
        if k in t: kw[k] += 1
print(kw.most_common())
