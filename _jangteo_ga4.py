# -*- coding: utf-8 -*-
# 오일장 페이지 실측 — 어느 시·도/시·군 장날 페이지가 많이 보이나, 요일별 흐름(2026-10-02)
import json
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (RunReportRequest, DateRange, Dimension, Metric,
    FilterExpression, Filter, OrderBy)

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
cred = service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)
PROP = "properties/545108776"

def run(dims, mets, start="28daysAgo", end="yesterday", n=200, flt=None, order=None):
    r = cl.run_report(RunReportRequest(property=PROP, date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[Dimension(name=d) for d in dims], metrics=[Metric(name=m) for m in mets], limit=n,
        dimension_filter=flt, order_bys=order or []))
    return [([d.value for d in x.dimension_values], [float(x.metric_values[i].value) for i in range(len(mets))]) for x in r.rows]

JT = FilterExpression(filter=Filter(field_name="pagePath", string_filter=Filter.StringFilter(match_type=Filter.StringFilter.MatchType.BEGINS_WITH, value="/jangteo/")))
out = {}
tot = run([], ["screenPageViews", "sessions", "activeUsers"])
jt = run([], ["screenPageViews"], flt=JT)
out["total_28d"] = {"pv": tot[0][1][0], "sessions": tot[0][1][1], "users": tot[0][1][2], "jangteo_pv": jt[0][1][0]}
out["jangteo_pages"] = [{"path": d[0], "title": d[1][:60], "pv": m[0], "users": m[1], "eng_sec": round(m[2] / max(m[1], 1))}
    for d, m in run(["pagePath", "pageTitle"], ["screenPageViews", "activeUsers", "userEngagementDuration"], flt=JT,
                    order=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="screenPageViews"), desc=True)], n=60)]
# 요일별(0=일요일) — 사이트 전체 vs 오일장
dow = {d[0]: m[0] for d, m in run(["dayOfWeek"], ["screenPageViews"])}
dowj = {d[0]: m[0] for d, m in run(["dayOfWeek"], ["screenPageViews"], flt=JT)}
out["dow"] = {k: {"all": dow.get(k, 0), "jangteo": dowj.get(k, 0)} for k in sorted(dow)}
# 날짜별 추이(최근 28일)
out["daily"] = sorted([[d[0], m[0], 0] for d, m in run(["date"], ["screenPageViews"])])
dj = {d[0]: m[0] for d, m in run(["date"], ["screenPageViews"], flt=JT)}
for r in out["daily"]: r[2] = dj.get(r[0], 0)
# 오일장 페이지 유입 소스
out["jangteo_source"] = [[d[0], m[0]] for d, m in run(["sessionSource"], ["screenPageViews"], flt=JT, n=10,
    order=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="screenPageViews"), desc=True)])]
# 오일장 페이지에서 일어난 클릭 이벤트
out["jangteo_events"] = [[d[0], m[0]] for d, m in run(["eventName"], ["eventCount"], flt=JT, n=25,
    order=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="eventCount"), desc=True)])]
json.dump(out, open(r"C:\dev\chukjemoa\_jangteo_ga4.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok")
