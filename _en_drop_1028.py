# -*- coding: utf-8 -*-
"""10/28 회차 주간 클릭 하락 원인 + 노출 많고 클릭 0 페이지 (W0=10/12~18, W1=10/19~25 직접 지정)"""
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
KEY = r"C:\dev\traffic-dashboard\sa-key.json"; SITE = "https://chukjemoa.co.kr/"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)
F = [{"filters": [{"dimension": "page", "operator": "contains", "expression": "chukjemoa.co.kr/en/"}]}]
def q(a, b, dims, n=5000, flt=F):
    return sc.searchanalytics().query(siteUrl=SITE, body={"startDate": a, "endDate": b, "dimensions": dims, "dimensionFilterGroups": flt, "rowLimit": n}).execute().get("rows", [])
S = lambda u: u.replace("https://chukjemoa.co.kr", "")
W0 = q("2026-10-12", "2026-10-18", ["page"]); W1 = q("2026-10-19", "2026-10-25", ["page"])
d0 = {r["keys"][0]: r for r in W0}; d1 = {r["keys"][0]: r for r in W1}
print("[페이지별 W0(10/12~18) | W1(10/19~25)] 클릭 노출 위치")
keys = sorted(set(d0) | set(d1), key=lambda k: -(d0.get(k, {}).get("impressions", 0) - d1.get(k, {}).get("impressions", 0)))
for k in keys[:25]:
    a = d0.get(k, {}); b = d1.get(k, {})
    print(f"  {a.get('clicks',0):3.0f} {a.get('impressions',0):5.0f} {a.get('position',0):5.1f} | {b.get('clicks',0):3.0f} {b.get('impressions',0):5.0f} {b.get('position',0):5.1f}  {S(k)}")
print("\n[W0 클릭 페이지]")
for r in sorted(W0, key=lambda r: -r["clicks"])[:10]:
    if r["clicks"]: print(f"  {r['clicks']:3.0f} {r['impressions']:5.0f} {r['position']:5.1f} {S(r['keys'][0])}")
print("\n[W1 클릭 페이지]")
for r in sorted(W1, key=lambda r: -r["clicks"])[:10]:
    if r["clicks"]: print(f"  {r['clicks']:3.0f} {r['impressions']:5.0f} {r['position']:5.1f} {S(r['keys'][0])}")
print("\n[일별 10/12~10/25]")
for r in q("2026-10-12", "2026-10-25", ["date"]):
    print(f"  {r['keys'][0]} {r['clicks']:3.0f} {r['impressions']:5.0f} {r['position']:5.1f}")
print("\n[검색어 W0 vs W1 노출 감소 상위]")
a = {r["keys"][0]: r for r in q("2026-10-12", "2026-10-18", ["query"])}; b = {r["keys"][0]: r for r in q("2026-10-19", "2026-10-25", ["query"])}
for k in sorted(set(a) | set(b), key=lambda k: -(a.get(k, {}).get("impressions", 0) - b.get(k, {}).get("impressions", 0)))[:15]:
    print(f"  {a.get(k,{}).get('clicks',0):2.0f} {a.get(k,{}).get('impressions',0):4.0f} {a.get(k,{}).get('position',0):5.1f} | {b.get(k,{}).get('clicks',0):2.0f} {b.get(k,{}).get('impressions',0):4.0f} {b.get(k,{}).get('position',0):5.1f}  {k}")
print("\n[28일(9/28~10/25) 노출 많고 클릭 0 — 상위 15]")
r28 = q("2026-09-28", "2026-10-25", ["page"])
top = sorted([r for r in r28 if r["clicks"] == 0], key=lambda r: -r["impressions"])[:15]
for r in top:
    print(f"  {r['impressions']:5.0f} {r['position']:5.1f}  {S(r['keys'][0])}")
print("\n[그 페이지들의 검색어 상위 5]")
for r in top[:10]:
    rows = q("2026-09-28", "2026-10-25", ["query"], 5, [{"filters": [{"dimension": "page", "operator": "equals", "expression": r["keys"][0]}]}])
    print("  ", S(r["keys"][0]), [(x["keys"][0], int(x["impressions"]), round(x["position"], 1)) for x in rows])
print("\n[10/21 보강·설명 개선 페이지 W0 vs W1]")
for p in ["pohang-international-fireworks-festival", "seoul-silver-grass-festival", "iksan-gukhwa-festival", "masan-gagopa-chrysanthemum-festival", "gwangalli-m-drone-light-show", "gimhae-buncheong-ceramic-festival", "han-river-walk", "jeju-olle-walking-festival"]:
    for k in set(d0) | set(d1):
        if p in k:
            a_ = d0.get(k, {}); b_ = d1.get(k, {})
            print(f"  {a_.get('clicks',0):2.0f} {a_.get('impressions',0):4.0f} {a_.get('position',0):5.1f} | {b_.get('clicks',0):2.0f} {b_.get('impressions',0):4.0f} {b_.get('position',0):5.1f}  {S(k)}")
