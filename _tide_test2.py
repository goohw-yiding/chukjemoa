import json, sys, requests
sys.stdout.reconfigure(encoding="utf-8")
K = open("khoa.key", encoding="utf-8").read().strip()
for x in json.load(open("data/sea_exp.json", encoding="utf-8")):
    if not any(k in x["title"] for k in ("백미리", "마시안", "만돌")): continue
    j = requests.get("http://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService",
                     params={"serviceKey": K, "obsCode": x["tide_obs"], "reqDate": "20261101", "type": "json", "numOfRows": 10, "pageNo": 1}, timeout=30).json()
    it = (j.get("body") or {}).get("items", {}).get("item", [])
    print(x["title"], "→", x["tide_obs_name"], x["tide_km"], "km |",
          ", ".join("%s %s %scm" % (i["predcDt"][11:], "물빠짐" if i["extrSe"] in ("2", "4") else "물참", int(i["predcTdlvVl"])) for i in it) or str(j)[:200])
