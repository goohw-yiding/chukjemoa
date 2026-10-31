import json, sys
sys.stdout.reconfigure(encoding="utf-8")
F = json.load(open("data/tide_fcst.json", encoding="utf-8"))
ST = json.load(open("data/tide_stations.json", encoding="utf-8"))
sea = json.load(open("data/sea_exp.json", encoding="utf-8"))
for code in sorted(F, key=lambda c: ST.get(c, {}).get("name", c)):
    rs = []
    for d, r in F[code].items():
        H = [x[2] for x in r if x[1] == "H"]; L = [x[2] for x in r if x[1] == "L"]
        if H and L: rs.append(max(H) - min(L))
    sidos = sorted({s["sido"] for s in sea if s.get("tide_obs") == code})
    print(ST.get(code, {}).get("name", code), code, "days", len(F[code]), "range", min(rs), "~", max(rs), sidos, "has1031", "20261031" in F[code])
