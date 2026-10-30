# -*- coding: utf-8 -*-
"""한 번 요청에 며칠치가 오는지 시험 + 매칭된 관측소 수"""
import json, sys, requests, collections
sys.stdout.reconfigure(encoding="utf-8")
K = open(r"C:\dev\chukjemoa\khoa.key", encoding="utf-8").read().strip()
U = "http://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService"
j = requests.get(U, params={"serviceKey": K, "obsCode": "DT_0001", "reqDate": "20261101", "type": "json", "numOfRows": 300, "pageNo": 1}, timeout=30).json()
print("header", j.get("header"), "body keys", list((j.get("body") or {}).keys()), "total", (j.get("body") or {}).get("totalCount"))
it = j["body"]["items"]["item"]; it = it if isinstance(it, list) else [it]
print("rows", len(it), "first", it[0]["predcDt"], "last", it[-1]["predcDt"])
sea = json.load(open("data/sea_exp.json", encoding="utf-8"))
c = collections.Counter(s.get("tide_obs") for s in sea)
print("matched stations", len(c), c.most_common(5))
