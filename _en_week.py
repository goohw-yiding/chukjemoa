# -*- coding: utf-8 -*-
"""영어(/en/) 주간 비교 — 최근 7일 vs 그 전 7일 (GSC·GA4) + 11~20위 축제 페이지 + shop_click(en-*)"""
import datetime, sys, collections, re
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric, FilterExpression, Filter, FilterExpressionList
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
KEY = r"C:\dev\traffic-dashboard\sa-key.json"; SITE = "https://chukjemoa.co.kr/"; PROP = "properties/545108776"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)
ga = BetaAnalyticsDataClient(credentials=service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"]))
F = [{"filters": [{"dimension": "page", "operator": "contains", "expression": "chukjemoa.co.kr/en/"}]}]
end = datetime.date.today() - datetime.timedelta(days=3)
W1 = (end - datetime.timedelta(days=6), end); W0 = (W1[0] - datetime.timedelta(days=7), W1[0] - datetime.timedelta(days=1))
def q(rng, dims, n=5000):
    return sc.searchanalytics().query(siteUrl=SITE, body={"startDate": str(rng[0]), "endDate": str(rng[1]), "dimensions": dims, "dimensionFilterGroups": F, "rowLimit": n}).execute().get("rows", [])
def tot(rng):
    r = q(rng, [], 1); return (r[0]["impressions"], r[0]["clicks"], r[0]["position"]) if r else (0, 0, 0)
enflt = FilterExpression(filter=Filter(field_name="landingPage", string_filter=Filter.StringFilter(match_type=Filter.StringFilter.MatchType.BEGINS_WITH, value="/en/")))
def gsess(rng):
    rows = ga.run_report(RunReportRequest(property=PROP, date_ranges=[DateRange(start_date=str(rng[0]), end_date=str(rng[1]))], metrics=[Metric(name="sessions"), Metric(name="engagedSessions")], dimension_filter=enflt)).rows
    return (int(rows[0].metric_values[0].value), int(rows[0].metric_values[1].value)) if rows else (0, 0)
print("최근주", W1, "전주", W0)
for name, rng in (("전주", W0), ("최근주", W1)):
    i, c, p = tot(rng); s, e = gsess(rng)
    print(f"  {name}: GSC 노출 {i:.0f} 클릭 {c:.0f} 평균순위 {p:.1f} | GA4 /en/ 착지 세션 {s} (참여 {e})")
# 90일 롤링 클릭 (목표 100)
r90 = (end - datetime.timedelta(days=89), end); i, c, p = tot(r90); print(f"  90일 롤링 {r90[0]}~{r90[1]}: 노출 {i:.0f} 클릭 {c:.0f}")
# 최근 28일 11~20위 축제 페이지
r28 = (end - datetime.timedelta(days=27), end)
print("\n[28일 축제 상세 순위 10.5~20.5, 노출순]")
for r in sorted(q(r28, ["page"]), key=lambda r: -r["impressions"]):
    u = r["keys"][0]
    if "/en/festival/" in u and u.rstrip("/").count("/") > 4 and 10.5 <= r["position"] <= 20.5:
        print(f"  {r['impressions']:5.0f} {r['clicks']:3.0f} {r['position']:5.1f}  {u.replace('https://chukjemoa.co.kr','')}")
print("\n[28일 축제 상세 노출 상위 15]")
for r in sorted(q(r28, ["page"]), key=lambda r: -r["impressions"])[:15]:
    print(f"  {r['impressions']:5.0f} {r['clicks']:3.0f} {r['position']:5.1f}  {r['keys'][0].replace('https://chukjemoa.co.kr','')}")
print("\n[최근주 검색어 상위 20]")
for r in sorted(q(W1, ["query"]), key=lambda r: -r["impressions"])[:20]:
    print(f"  {r['impressions']:5.0f} {r['clicks']:3.0f} {r['position']:5.1f}  {r['keys'][0]}")
# shop_click
print("\n[shop_click 최근 14일 — merchant×place]")
try:
    ev = FilterExpression(filter=Filter(field_name="eventName", string_filter=Filter.StringFilter(value="shop_click")))
    rows = ga.run_report(RunReportRequest(property=PROP, date_ranges=[DateRange(start_date=str(end - datetime.timedelta(days=13)), end_date="today")],
        dimensions=[Dimension(name="date"), Dimension(name="customEvent:merchant"), Dimension(name="customEvent:place"), Dimension(name="pagePath")], metrics=[Metric(name="eventCount")], dimension_filter=ev, limit=200)).rows
    for r in rows:
        d = [x.value for x in r.dimension_values]
        if d[2].startswith("en") or d[3].startswith("/en/"):
            print("  ", d, r.metric_values[0].value)
    print("  (전체 shop_click 행", len(rows), ")")
except Exception as e:
    print("  오류:", str(e)[:300])
