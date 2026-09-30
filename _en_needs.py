# -*- coding: utf-8 -*-
"""영어 방문자가 무엇을 찾는가 — 180일 /en/ 검색어 전량 + GA4 /en/ 이벤트(shop_click·map_click 등)."""
import datetime, sys, collections, json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric, FilterExpression, Filter, FilterExpressionList
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
KEY = r"C:\dev\traffic-dashboard\sa-key.json"; SITE = "https://chukjemoa.co.kr/"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)
ga = BetaAnalyticsDataClient(credentials=service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"]))
PROP = "properties/545108776"
end = datetime.date.today() - datetime.timedelta(days=3); start = end - datetime.timedelta(days=179)
F = [{"filters": [{"dimension": "page", "operator": "contains", "expression": "chukjemoa.co.kr/en/"}]}]
rows = sc.searchanalytics().query(siteUrl=SITE, body={"startDate": str(start), "endDate": str(end), "dimensions": ["query"], "dimensionFilterGroups": F, "rowLimit": 5000}).execute().get("rows", [])
json.dump(rows, open(r"C:\dev\chukjemoa\_en_needs_queries.json", "w", encoding="utf-8"), ensure_ascii=False)
B = collections.OrderedDict([
 ("transport(ktx/train/bus/subway/airport/t-money)", ["ktx", "train", "bus", "subway", "metro", "airport", "t-money", "tmoney", "transport", "shuttle", "taxi"]),
 ("sim/internet/wifi", ["sim", "wifi", "internet", "data"]),
 ("hotel/stay", ["hotel", "stay", "hostel", "accommodation", "hanok stay", "where to stay"]),
 ("tour/ticket", ["tour", "ticket", "admission", "fee", "price", "booking", "reserve", "day trip"]),
 ("food/market", ["food", "market", "ojang", "jangteo", "street food", "restaurant", "eat"]),
 ("closed/holiday", ["closed", "holiday", "chuseok", "seollal", "open on", "hangul day", "business hours"]),
 ("mountain/hike", ["mountain", "hike", "hiking", "trail", "trek"]),
 ("hanbok/palace", ["hanbok", "palace", "gyeongbok"]),
 ("pet/dog", ["dog", "pet"]),
 ("festival(name)", ["festival", "fest", "fireworks", "lantern", "parade"]),
])
agg = {k: [0, 0, 0] for k in B}; agg["other"] = [0, 0, 0]; other = []
for r in rows:
    q = r["keys"][0].lower(); hit = None
    for k, ws in B.items():
        if any(w in q for w in ws): hit = k; break
    k = hit or "other"; agg[k][0] += 1; agg[k][1] += r["impressions"]; agg[k][2] += r["clicks"]
    if not hit: other.append(r)
print("180일", start, "~", end, "검색어", len(rows), "개")
print("\n[의도 묶음] 검색어수 노출 클릭")
for k, v in agg.items(): print(f"  {k:48s} {v[0]:4d} {v[1]:6.0f} {v[2]:4.0f}")
print("\n[기타 상위 25]")
for r in sorted(other, key=lambda r: -r["impressions"])[:25]: print(f"  {r['impressions']:5.0f} {r['clicks']:3.0f} {r['position']:5.1f} {r['keys'][0]}")
for k in ["transport(ktx/train/bus/subway/airport/t-money)", "sim/internet/wifi", "hotel/stay", "tour/ticket", "hanbok/palace"]:
    print(f"\n[{k}] 상위")
    for r in sorted([r for r in rows if any(w in r['keys'][0].lower() for w in B[k])], key=lambda r: -r["impressions"])[:10]:
        print(f"  {r['impressions']:5.0f} {r['clicks']:3.0f} {r['position']:5.1f} {r['keys'][0]}")
flt = FilterExpression(filter=Filter(field_name="pagePath", string_filter=Filter.StringFilter(match_type=Filter.StringFilter.MatchType.BEGINS_WITH, value="/en/")))
g = ga.run_report(RunReportRequest(property=PROP, date_ranges=[DateRange(start_date=str(start), end_date=str(end))], dimensions=[Dimension(name="eventName")], metrics=[Metric(name="eventCount")], dimension_filter=flt, limit=50)).rows
print("\n[GA4 /en/ 이벤트 180일]")
for x in g: print(f"  {x.dimension_values[0].value:28s} {x.metric_values[0].value}")
flt2 = FilterExpression(and_group=FilterExpressionList(expressions=[flt, FilterExpression(filter=Filter(field_name="eventName", string_filter=Filter.StringFilter(value="shop_click")))]))
try:
    g2 = ga.run_report(RunReportRequest(property=PROP, date_ranges=[DateRange(start_date=str(start), end_date=str(end))], dimensions=[Dimension(name="customEvent:merchant"), Dimension(name="customEvent:item"), Dimension(name="pagePath")], metrics=[Metric(name="eventCount")], dimension_filter=flt2, limit=50)).rows
    print("\n[/en/ shop_click 상세]")
    for x in g2: print("  ", [d.value for d in x.dimension_values], x.metric_values[0].value)
except Exception as e: print("shop_click 상세 오류", e)
