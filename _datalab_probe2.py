# -*- coding: utf-8 -*-
# 데이터랩 「최근 1주일」이 축제 순위에 쓸 만한지 확인
import json, re, datetime, urllib.request

src = open(r"C:\dev\_datalab.py", encoding="utf-8").read()
CID = re.search(r'CID\s*=\s*"([^"]+)"', src).group(1)
CSEC = re.search(r'CSEC\s*=\s*"([^"]+)"', src).group(1)
URL = "https://openapi.naver.com/v1/datalab/search"

def q(start, end, unit, groups):
    body = {"startDate": start, "endDate": end, "timeUnit": unit,
            "keywordGroups": [{"groupName": g, "keywords": [g]} for g in groups]}
    req = urllib.request.Request(URL, data=json.dumps(body).encode("utf-8"),
        headers={"X-Naver-Client-Id": CID, "X-Naver-Client-Secret": CSEC,
                 "Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read().decode("utf-8"))

end = datetime.date.today() - datetime.timedelta(days=1)
start = end - datetime.timedelta(days=60)
# 앵커(축제)를 매 호출에 넣어 서로 다른 호출끼리 비교할 수 있게 한다
G = ["축제", "무주반딧불축제", "평창효석문화제", "진주남강유등축제", "김제지평선축제"]
r = q(str(start), str(end), "date", G)
print("기간 %s ~ %s" % (r["startDate"], r["endDate"]))
avg = lambda a: (sum(a) / len(a)) if a else 0.0
for g in r["results"]:
    d = {x["period"]: x["ratio"] for x in g["data"]}
    days = sorted(d)
    last7 = [d[p] for p in days[-7:]]
    prev = [d[p] for p in days[:-7]]
    print("  %-16s 최근7일 %7.2f · 그전 %7.2f · 배수 %5.2f · 최대 %6.1f"
          % (g["title"], avg(last7), avg(prev), (avg(last7)/avg(prev)) if avg(prev) else 0,
             max(d.values()) if d else 0))
print("\n무주반딧불 마지막 10일:", json.dumps(
    [(x["period"][5:], x["ratio"]) for x in r["results"][1]["data"][-10:]], ensure_ascii=False))
