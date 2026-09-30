# -*- coding: utf-8 -*-
"""영어(/en/) 90일 해부 — 페이지 유형·검색어·국가·유입원. 영어 운영 세션 기준선."""
import datetime, sys, collections, re
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric, FilterExpression, Filter
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
KEY = r"C:\dev\traffic-dashboard\sa-key.json"; SITE = "https://chukjemoa.co.kr/"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)
ga = BetaAnalyticsDataClient(credentials=service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"]))
PROP = "properties/545108776"
end = datetime.date.today() - datetime.timedelta(days=3); start = end - datetime.timedelta(days=89)
F = [{"filters": [{"dimension": "page", "operator": "contains", "expression": "chukjemoa.co.kr/en/"}]}]
def q(dims, n=1000):
    return sc.searchanalytics().query(siteUrl=SITE, body={"startDate": str(start), "endDate": str(end), "dimensions": dims, "dimensionFilterGroups": F, "rowLimit": n}).execute().get("rows", [])
def typ(p):
    p = p.replace("https://chukjemoa.co.kr", "")
    m = re.match(r"/en/([^/]+)/", p)
    return m.group(1) if m else "(home)"
print("기간", start, "~", end)
pages = q(["page"], 5000)
T = collections.defaultdict(lambda: [0, 0, 0])
for r in pages:
    t = T[typ(r["keys"][0])]; t[0] += 1; t[1] += r["impressions"]; t[2] += r["clicks"]
print("\n[유형별] 노출있는페이지 · 노출 · 클릭")
for k, v in sorted(T.items(), key=lambda x: -x[1][2] * 1000 - x[1][1]): print(f"  {k:14s} {v[0]:4d} {v[1]:6d} {v[2]:4d}")
print("\n[클릭 상위 페이지]")
for r in sorted(pages, key=lambda r: (-r["clicks"], -r["impressions"]))[:15]:
    print(f"  {r['clicks']:3.0f} {r['impressions']:6.0f} {r['position']:5.1f}  {r['keys'][0].replace('https://chukjemoa.co.kr','')}")
print("\n[검색어 상위 30 (노출순)] 노출 클릭 순위")
for r in sorted(q(["query"], 2000), key=lambda r: -r["impressions"])[:30]:
    print(f"  {r['impressions']:5.0f} {r['clicks']:3.0f} {r['position']:5.1f}  {r['keys'][0]}")
print("\n[국가×기기] 노출 클릭")
for r in sorted(q(["country", "device"]), key=lambda r: -r["impressions"])[:12]:
    print(f"  {r['keys'][0]:4s} {r['keys'][1]:8s} {r['impressions']:6.0f} {r['clicks']:3.0f}")
flt = FilterExpression(filter=Filter(field_name="landingPage", string_filter=Filter.StringFilter(match_type=Filter.StringFilter.MatchType.BEGINS_WITH, value="/en/")))
def g(dims):
    return ga.run_report(RunReportRequest(property=PROP, date_ranges=[DateRange(start_date=str(start), end_date=str(end))], dimensions=[Dimension(name=d) for d in dims], metrics=[Metric(name="sessions"), Metric(name="engagementRate"), Metric(name="averageSessionDuration")], dimension_filter=flt, limit=20)).rows
print("\n[GA4 /en/ 착지 — 국가] 세션 참여율 평균초")
for x in g(["country"]): print(f"  {x.dimension_values[0].value:22s} {x.metric_values[0].value:>4s} {float(x.metric_values[1].value):.2f} {float(x.metric_values[2].value):6.0f}")
print("\n[GA4 /en/ 착지 — 유입원]")
for x in g(["sessionSourceMedium"]): print(f"  {x.dimension_values[0].value:34s} {x.metric_values[0].value:>4s} {float(x.metric_values[1].value):.2f} {float(x.metric_values[2].value):6.0f}")
print("\n[GA4 /en/ 착지 — 페이지 상위]")
for x in g(["landingPage"])[:15]: print(f"  {x.metric_values[0].value:>4s} {float(x.metric_values[1].value):.2f} {float(x.metric_values[2].value):6.0f}  {x.dimension_values[0].value}")
