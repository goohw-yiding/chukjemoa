# -*- coding: utf-8 -*-
"""일본 검색어 «전량»과 그게 닿는 페이지. 어떤 질문에 답이 없는지 찾는다.
   ⚠️ 노출 1~2건짜리도 본다 — 일본 전체가 28일 1,245노출뿐이라 «작은 게 전부»다.
"""
import datetime, sys, collections
from google.oauth2 import service_account
from googleapiclient.discovery import build
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)
end = datetime.date.today() - datetime.timedelta(days=3)
start = end - datetime.timedelta(days=89)
F = [{"dimension": "country", "operator": "equals", "expression": "jpn"}]

def q(dims):
    out, row = [], 0
    while row < 10000:
        r = sc.searchanalytics().query(siteUrl=SITE, body={
            "startDate": str(start), "endDate": str(end), "dimensions": dims,
            "rowLimit": 1000, "startRow": row,
            "dimensionFilterGroups": [{"filters": F}]}).execute().get("rows", [])
        out += r
        if len(r) < 1000: break
        row += 1000
    return out

print("일본 · %s ~ %s (90일)\n" % (start, end))
rows = sorted(q(["query", "page"]), key=lambda r: -r["impressions"])
print("■ 검색어 %d개 · 노출 %d · 클릭 %d" % (
    len(rows), sum(r["impressions"] for r in rows), sum(r["clicks"] for r in rows)))
print("   %-34s %-26s %5s %4s %6s" % ("검색어", "닿는 페이지", "노출", "클릭", "순위"))
for r in rows[:45]:
    qq, pg = r["keys"]
    print("   %-34s %-26s %5d %4d %6.1f" % (
        qq[:34], pg.replace("https://chukjemoa.co.kr", "")[:26],
        r["impressions"], r["clicks"], r["position"]))

print("\n■ 페이지별 (일본)")
pr = sorted(q(["page"]), key=lambda r: -r["impressions"])
for r in pr[:20]:
    print("   %-40s 노출%5d 클릭%3d %5.1f위 CTR%5.1f%%" % (
        r["keys"][0].replace("https://chukjemoa.co.kr", "")[:40],
        r["impressions"], r["clicks"], r["position"], 100*r["ctr"]))
