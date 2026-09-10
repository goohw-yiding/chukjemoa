# -*- coding: utf-8 -*-
import datetime, collections
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

end = datetime.date.today() - datetime.timedelta(days=2)
start = end - datetime.timedelta(days=27)
def q(dims, n=200):
    return sc.searchanalytics().query(siteUrl=SITE, body={
        "startDate": str(start), "endDate": str(end),
        "dimensions": dims, "rowLimit": n}).execute().get("rows", [])

t = q([], 1)
if t:
    r = t[0]
    print("28일 합계 — 클릭 %d · 노출 %d · CTR %.2f%% · 평균순위 %.1f"
          % (r["clicks"], r["impressions"], r["ctr"]*100, r["position"]))
print("기간 %s ~ %s\n" % (start, end))

print("=== 검색어 상위 40 (노출순) ===")
rows = q(["query"], 200)
rows.sort(key=lambda r: -r["impressions"])
for r in rows[:40]:
    print("  %6d노출 %4d클릭 %5.1f위  %s" % (r["impressions"], r["clicks"], r["position"], r["keys"][0]))

print("\n=== 클릭 0인데 노출 많은 검색어 상위 25 ===")
z = [r for r in rows if r["clicks"] == 0]
z.sort(key=lambda r: -r["impressions"])
for r in z[:25]:
    print("  %6d노출 %5.1f위  %s" % (r["impressions"], r["position"], r["keys"][0]))

print("\n=== 페이지 구획별 합계 ===")
pr = q(["page"], 500)
def bucket(u):
    p = u.replace("https://chukjemoa.co.kr/", "").split("/")
    s = p[0] if p[0] else "(첫화면)"
    if s in ("en","ja","zh","tw","es"): return "외국어/" + (p[1] if len(p)>1 else "")
    return s
agg = collections.defaultdict(lambda: [0,0,0])
for r in pr:
    b = bucket(r["keys"][0]); agg[b][0]+=r["clicks"]; agg[b][1]+=r["impressions"]; agg[b][2]+=1
for b,(c,i,n) in sorted(agg.items(), key=lambda x:-x[1][1])[:22]:
    print("  %-16s 클릭 %5d · 노출 %7d · URL %3d · CTR %.2f%%" % (b,c,i,n,(c/i*100 if i else 0)))
