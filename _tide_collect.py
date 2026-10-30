# -*- coding: utf-8 -*-
"""체험마을에 짝지어진 관측소(32곳)의 날짜별 고·저조 수집 → data/tide_fcst.json (이어받기 가능)
사용: py -3 _tide_collect.py 20261101 20261231
API는 요청 1번에 하루치만 준다(확인 2026-10-30). 초당 제한이 있어 하나씩."""
import json, sys, os, time, datetime, requests
sys.stdout.reconfigure(encoding="utf-8")
K = open(r"C:\dev\chukjemoa\khoa.key", encoding="utf-8").read().strip()
U = "http://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService"
OUT = "data/tide_fcst.json"
d0 = datetime.datetime.strptime(sys.argv[1], "%Y%m%d").date()
d1 = datetime.datetime.strptime(sys.argv[2], "%Y%m%d").date()
sea = json.load(open("data/sea_exp.json", encoding="utf-8"))
obs = sorted({s["tide_obs"] for s in sea if s.get("tide_obs")})
db = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else {}
def get(code, ymd):
    for t in range(6):
        try:
            j = requests.get(U, params={"serviceKey": K, "obsCode": code, "reqDate": ymd, "type": "json", "numOfRows": 10, "pageNo": 1}, timeout=30).json()
            if "OpenAPI_ServiceResponse" in j:
                time.sleep(2 + 2 * t); continue
            it = (((j.get("body") or {}).get("items") or {}) or {}).get("item")
            if not it: return []
            it = it if isinstance(it, list) else [it]
            return [[x["predcDt"][11:16], int(x["extrSe"]) % 2 == 0 and "L" or "H", round(float(x["predcTdlvVl"]))] for x in it]
        except Exception:
            time.sleep(3)
    return None
n = 0
for code in obs:
    db.setdefault(code, {})
    d = d0
    while d <= d1:
        ymd = d.strftime("%Y%m%d")
        if ymd not in db[code]:
            r = get(code, ymd)
            if r is not None:
                db[code][ymd] = r; n += 1
            time.sleep(0.8)
            if n % 50 == 0:
                json.dump(db, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
                print(code, ymd, n, flush=True)
        d += datetime.timedelta(days=1)
json.dump(db, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
miss = sum(1 for c in obs for k in range((d1 - d0).days + 1) if (d0 + datetime.timedelta(days=k)).strftime("%Y%m%d") not in db.get(c, {}))
print("DONE new", n, "missing", miss)
