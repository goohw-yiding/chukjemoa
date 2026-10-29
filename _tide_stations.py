# -*- coding: utf-8 -*-
"""조석예보(고·저조) 관측소 목록 만들기 + 체험마을 85곳에 가장 가까운 관측소 짝짓기 (2026-10-29)"""
import json, sys, math, requests, concurrent.futures as cf
sys.stdout.reconfigure(encoding="utf-8")
K = open(r"C:\dev\chukjemoa\khoa.key", encoding="utf-8").read().strip()
U = "http://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService"
def probe(code):
    for t in range(6):
        try:
            j = requests.get(U, params={"serviceKey": K, "obsCode": code, "reqDate": "20261101", "type": "json", "numOfRows": 4, "pageNo": 1}, timeout=30).json()
            if "OpenAPI_ServiceResponse" in j:     # 초당 제한 등 → 기다렸다 다시
                time.sleep(2 + t * 2); continue
            items = (j.get("body") or {}).get("items") or {}
            it = items.get("item") if isinstance(items, dict) else None
            if not it: return code, None           # 없는 관측소
            it = it[0] if isinstance(it, list) else it
            return code, {"name": it["obsvtrNm"], "lat": it["lat"], "lon": it["lot"]}
        except Exception:
            time.sleep(2)
    return code, "retry"
import time, os
codes = ["DT_%04d" % i for i in range(1, 70)] + ["SO_%04d" % i for i in range(1, 30)]
st, miss = {}, []
for c in codes:   # 초당 요청 제한이 있어 하나씩 천천히, 제한에 걸리면 기다렸다 재시도
    c, v = probe(c)
    if v == "retry": miss.append(c)
    elif v: st[c] = v
    time.sleep(1.0)
print("still rate-limited:", miss)
json.dump(st, open("data/tide_stations.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("stations", len(st))
def km(a, b, c, d):
    r = math.radians; x = math.sin(r(c - a) / 2) ** 2 + math.cos(r(a)) * math.cos(r(c)) * math.sin(r(d - b) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(x))
sea = json.load(open("data/sea_exp.json", encoding="utf-8"))
far = []
for s in sea:
    lat, lon = float(s["y"]), float(s["x"])
    c, v = min(st.items(), key=lambda kv: km(lat, lon, kv[1]["lat"], kv[1]["lon"]))
    s["tide_obs"] = c; s["tide_obs_name"] = v["name"]; s["tide_km"] = round(km(lat, lon, v["lat"], v["lon"]), 1)
    if s["tide_km"] > 30: far.append((s["title"], v["name"], s["tide_km"]))
json.dump(sea, open("data/sea_exp.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("matched", len(sea), "far>30km", len(far)); [print("  ", *f) for f in far]
