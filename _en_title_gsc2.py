# -*- coding: utf-8 -*-
# 같은 자리끼리 비교 — /en/festival/ vs /ja/festival/ vs /ko 축제상세. 그리고 국가·기기로 쪼갠다.
import datetime, re
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

end = datetime.date.today() - datetime.timedelta(days=2)
start = end - datetime.timedelta(days=89)

def q(dims, path_contains, n=1000, extra=None):
    f = [{"dimension": "page", "operator": "contains", "expression": path_contains}]
    if extra: f += extra
    return sc.searchanalytics().query(siteUrl=SITE, body={
        "startDate": str(start), "endDate": str(end), "dimensions": dims,
        "rowLimit": n, "dimensionFilterGroups": [{"filters": f}]}).execute().get("rows", [])

print("== %s ~ %s ==" % (start, end))
print("\n-- 축제 상세, 언어별 (같은 자리끼리) --")
for label, p in [("한국어 /festival/", "chukjemoa.co.kr/festival/"),
                 ("영어  /en/festival/", "/en/festival/"),
                 ("일본어 /ja/festival/", "/ja/festival/")]:
    r = q([], p)
    if r:
        r = r[0]
        print("%-20s clicks=%4d imp=%6d ctr=%5.2f%% pos=%5.1f" %
              (label, r["clicks"], r["impressions"], r["ctr"]*100, r["position"]))
    else:
        print("%-20s (데이터 없음)" % label)

print("\n-- /en/festival/ 국가별 상위 10 --")
for r in sorted(q(["country"], "/en/festival/"), key=lambda x: -x["impressions"])[:10]:
    print("%6d imp %3d clk %5.2f%% %5.1f위  %s" %
          (r["impressions"], r["clicks"], r["ctr"]*100, r["position"], r["keys"][0]))

print("\n-- /ja/festival/ 검색어 상위 15 (왜 눌리나) --")
for r in sorted(q(["query"], "/ja/festival/"), key=lambda x: -x["impressions"])[:15]:
    print("%6d imp %3d clk %5.2f%% %5.1f위  %s" %
          (r["impressions"], r["clicks"], r["ctr"]*100, r["position"], r["keys"][0]))

# busan-food-film-festa 를 뺀 /en/festival/
rows = q(["page"], "/en/festival/")
ex = [r for r in rows if "busan-food-film-festa" not in r["keys"][0]]
i = sum(r["impressions"] for r in ex); c = sum(r["clicks"] for r in ex)
print("\nbusan-food-film-festa 제외 /en/festival/:  imp=%d clk=%d ctr=%.2f%%" % (i, c, c*100.0/max(i,1)))

# 순위 구간별 — 진짜 1페이지에 몇이 있나
print("\n-- /en/festival/ 페이지 순위 구간별 --")
b = {"1-5위":[0,0,0], "6-10위":[0,0,0], "11-20위":[0,0,0], "21위+":[0,0,0]}
for r in rows:
    p = r["position"]
    k = "1-5위" if p<=5 else "6-10위" if p<=10 else "11-20위" if p<=20 else "21위+"
    b[k][0]+=1; b[k][1]+=r["impressions"]; b[k][2]+=r["clicks"]
for k,v in b.items():
    print("%-8s 페이지 %3d개  imp %5d  clk %3d  ctr %.2f%%" % (k, v[0], v[1], v[2], v[2]*100.0/max(v[1],1)))
