# -*- coding: utf-8 -*-
# 네이버 데이터랩 「검색어트렌드」가 열려 있는지, 반환 모양이 어떤지 확인
import json, os, re, datetime, urllib.request

ENV = r"C:\dev\onsellup-v2\.env"
cfg = {}
for line in open(ENV, encoding="utf-8"):
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line: continue
    k, v = line.split("=", 1)
    cfg[k.strip()] = v.strip().strip('"').strip("'")

CID = cfg.get("NAVER_SEARCH_CLIENT_ID")
CSE = cfg.get("NAVER_SEARCH_CLIENT_SECRET")
print("client_id 있음:", bool(CID), "· secret 있음:", bool(CSE))

end = datetime.date.today() - datetime.timedelta(days=1)
start = end - datetime.timedelta(days=89)
body = {
    "startDate": str(start), "endDate": str(end), "timeUnit": "date",
    "keywordGroups": [
        {"groupName": "무주반딧불축제", "keywords": ["무주반딧불축제"]},
        {"groupName": "평창효석문화제", "keywords": ["평창효석문화제"]},
        {"groupName": "금남로차없는거리", "keywords": ["금남로 차 없는 거리"]},
        {"groupName": "진주남강유등축제", "keywords": ["진주남강유등축제"]},
        {"groupName": "축제", "keywords": ["축제"]},
    ],
}
req = urllib.request.Request(
    "https://openapi.naver.com/v1/datalab/search",
    data=json.dumps(body).encode("utf-8"),
    headers={"X-Naver-Client-Id": CID, "X-Naver-Client-Secret": CSE,
             "Content-Type": "application/json"})
try:
    r = json.loads(urllib.request.urlopen(req, timeout=20).read().decode("utf-8"))
except Exception as e:
    body_txt = ""
    if hasattr(e, "read"):
        try: body_txt = e.read().decode("utf-8")[:300]
        except Exception: pass
    print("실패:", str(e)[:120], body_txt)
    raise SystemExit(1)

print("기간 %s ~ %s · 그룹 %d개" % (r["startDate"], r["endDate"], len(r["results"])))
for g in r["results"]:
    d = g["data"]
    last7 = [x["ratio"] for x in d[-7:]]
    prev = [x["ratio"] for x in d[:-7]]
    avg = lambda a: (sum(a) / len(a)) if a else 0
    print("  %-18s 점수 최대 %6.1f · 최근7일 평균 %6.2f · 그 앞 평균 %6.2f · 배수 %.2f" % (
        g["title"], max(x["ratio"] for x in d) if d else 0,
        avg(last7), avg(prev), (avg(last7) / avg(prev)) if avg(prev) else 0))
print("\n마지막 5일 원본:", json.dumps(r["results"][0]["data"][-5:], ensure_ascii=False))
