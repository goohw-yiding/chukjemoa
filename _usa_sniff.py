# -*- coding: utf-8 -*-
"""미국 5,908노출·클릭 5 가 «사람인가 봇인가».
   봇 판정 근거(이 사이트에서 이미 확인된 패턴): 0클릭 + 대량노출 + 모바일 비중 10% 미만
   + 순위가 한 자리에 고정 + 페이지축에 안 잡힘.
   사람이면 「안 눌리는 문제」이고, 봇이면 「그런 수요가 원래 없는 것」이다 — 처방이 정반대다.
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
start = end - datetime.timedelta(days=27)
F = [{"dimension": "country", "operator": "equals", "expression": "usa"}]

def q(dims, filters=F):
    out, row = [], 0
    while row < 10000:
        r = sc.searchanalytics().query(siteUrl=SITE, body={
            "startDate": str(start), "endDate": str(end), "dimensions": dims,
            "rowLimit": 1000, "startRow": row,
            "dimensionFilterGroups": [{"filters": filters}]}).execute().get("rows", [])
        out += r
        if len(r) < 1000: break
        row += 1000
    return out

print("미국 · %s ~ %s\n" % (start, end))
print("■ 기기별 — 사람이면 모바일이 절반 넘는다")
for r in sorted(q(["device"]), key=lambda r: -r["impressions"]):
    print("   %-10s 노출%6d 클릭%3d CTR%5.2f%% 순위%5.1f" % (
        r["keys"][0], r["impressions"], r["clicks"], 100*r["ctr"], r["position"]))

print("\n■ 날짜별 — 사람이면 완만하고, 봇이면 특정 날에 몰린다")
rows = sorted(q(["date"]), key=lambda r: r["keys"][0])
mx = max((r["impressions"] for r in rows), default=1)
for r in rows:
    bar = "█" * int(40 * r["impressions"] / mx)
    print("   %s 노출%5d 클릭%2d %s" % (r["keys"][0], r["impressions"], r["clicks"], bar))

print("\n■ 검색어별 — 무슨 말로 «미국에서» 찾나")
rows = sorted(q(["query"]), key=lambda r: -r["impressions"])
print("   검색어 총 %d개 · 합계 노출 %d · 클릭 %d" % (
    len(rows), sum(r["impressions"] for r in rows), sum(r["clicks"] for r in rows)))
for r in rows[:12]:
    print("   %-34s 노출%5d 클릭%2d %5.1f위" % (
        r["keys"][0][:34], r["impressions"], r["clicks"], r["position"]))

print("\n■ 일본과 대조 (일본은 클릭이 붙는다 = 사람이다)")
FJ = [{"dimension": "country", "operator": "equals", "expression": "jpn"}]
for r in sorted(q(["device"], FJ), key=lambda r: -r["impressions"]):
    print("   %-10s 노출%6d 클릭%3d CTR%5.2f%% 순위%5.1f" % (
        r["keys"][0], r["impressions"], r["clicks"], 100*r["ctr"], r["position"]))
rows = sorted(q(["query"], FJ), key=lambda r: -r["impressions"])
print("   일본 검색어 상위")
for r in rows[:10]:
    print("   %-34s 노출%5d 클릭%2d %5.1f위" % (
        r["keys"][0][:34], r["impressions"], r["clicks"], r["position"]))
