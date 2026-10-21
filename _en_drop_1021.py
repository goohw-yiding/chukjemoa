# -*- coding: utf-8 -*-
"""10/21 영어 주간 클릭 하락 원인 + 노출 많고 클릭 0 페이지"""
import datetime, sys
from google.oauth2 import service_account
from googleapiclient.discovery import build
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
KEY = r"C:\dev\traffic-dashboard\sa-key.json"; SITE = "https://chukjemoa.co.kr/"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)
F = [{"filters": [{"dimension": "page", "operator": "contains", "expression": "chukjemoa.co.kr/en/"}]}]
def q(a, b, dims, n=5000):
    return sc.searchanalytics().query(siteUrl=SITE, body={"startDate": a, "endDate": b, "dimensions": dims, "dimensionFilterGroups": F, "rowLimit": n}).execute().get("rows", [])
S = lambda u: u.replace("https://chukjemoa.co.kr", "")
W0 = q("2026-10-12", "2026-10-18", ["page"]); W1 = q("2026-10-12", "2026-10-18", ["page"])
d0 = {r["keys"][0]: r for r in W0}; d1 = {r["keys"][0]: r for r in W1}
print("[페이지별 클릭 변화 전주→최근주] 클릭0 노출0 위치0 | 클릭1 노출1 위치1")
keys = sorted(set(d0) | set(d1), key=lambda k: -(d0.get(k, {}).get("clicks", 0) + d1.get(k, {}).get("clicks", 0)))
for k in keys[:20]:
    a = d0.get(k, {}); b = d1.get(k, {})
    print(f"  {a.get('clicks',0):3.0f} {a.get('impressions',0):5.0f} {a.get('position',0):5.1f} | {b.get('clicks',0):3.0f} {b.get('impressions',0):5.0f} {b.get('position',0):5.1f}  {S(k)}")
print("\n[일별 클릭·노출 9/28~10/11]")
for r in q("2026-10-05", "2026-10-18", ["date"]):
    print(f"  {r['keys'][0]} {r['clicks']:3.0f} {r['impressions']:5.0f} {r['position']:5.1f}")
print("\n[전주 클릭 검색어 상위]")
for r in sorted(q("2026-10-05", "2026-10-11", ["query"]), key=lambda r: -r["clicks"])[:12]:
    print(f"  {r['clicks']:3.0f} {r['impressions']:5.0f} {r['position']:5.1f}  {r['keys'][0]}")
print("\n[28일 노출 많고 클릭 0 — 상위 15 (끝나지 않은 페이지 판단은 사람이)]")
r28 = q("2026-09-21", "2026-10-18", ["page"])
for r in sorted([r for r in r28 if r["clicks"] == 0], key=lambda r: -r["impressions"])[:15]:
    print(f"  {r['impressions']:5.0f} {r['position']:5.1f}  {S(r['keys'][0])}")
print("\n[28일 노출 0클릭 페이지의 검색어 — 상위 5페이지]")
top = sorted([r for r in r28 if r["clicks"] == 0], key=lambda r: -r["impressions"])[:12]
for r in top:
    rows = sc.searchanalytics().query(siteUrl=SITE, body={"startDate": "2026-09-14", "endDate": "2026-10-11", "dimensions": ["query"], "dimensionFilterGroups": [{"filters": [{"dimension": "page", "operator": "equals", "expression": r["keys"][0]}]}], "rowLimit": 6}).execute().get("rows", [])
    print("  ", S(r["keys"][0]), [(x["keys"][0], int(x["impressions"]), round(x["position"], 1)) for x in rows])
