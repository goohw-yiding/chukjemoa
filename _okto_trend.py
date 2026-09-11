# -*- coding: utf-8 -*-
# 옥토버페스트 서울 — 지금 검색이 «오르는 중»인지 확인 (데이터랩)
import json, re, datetime, urllib.request
src = open(r"C:\dev\_datalab.py", encoding="utf-8").read()
CID = re.search(r'CID\s*=\s*"([^"]+)"', src).group(1)
CSEC = re.search(r'CSEC\s*=\s*"([^"]+)"', src).group(1)

def q(start, end, unit, groups):
    body = {"startDate": start, "endDate": end, "timeUnit": unit,
            "keywordGroups": [{"groupName": g, "keywords": [g]} for g in groups]}
    r = urllib.request.Request("https://openapi.naver.com/v1/datalab/search",
        data=json.dumps(body).encode("utf-8"),
        headers={"X-Naver-Client-Id": CID, "X-Naver-Client-Secret": CSEC,
                 "Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(r, timeout=30).read().decode("utf-8"))

end = datetime.date.today() - datetime.timedelta(days=1)
G = ["옥토버페스트서울", "옥토버페스트", "서울억새축제", "마포나루새우젓축제"]

print("=== 최근 45일 (일별)")
r = q(str(end - datetime.timedelta(days=44)), str(end), "date", G)
for g in r["results"]:
    d = [x["ratio"] for x in g["data"]]
    if not d: print("  %-16s 자료 없음" % g["title"]); continue
    a7 = sum(d[-7:]) / min(7, len(d)); a = sum(d) / len(d)
    print("  %-16s 최근7일 %6.2f · 45일평균 %6.2f · 배수 %.2f" % (g["title"], a7, a, a7 / a if a else 0))

print("\n=== 작년 9~10월 (주별) — 언제 정점이었나")
r2 = q("2025-08-15", "2025-11-15", "week", ["옥토버페스트서울", "서울억새축제"])
for g in r2["results"]:
    print("  " + g["title"])
    for x in g["data"]:
        if x["ratio"] > 0: print("     %s  %6.1f" % (x["period"], x["ratio"]))
