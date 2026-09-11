# -*- coding: utf-8 -*-
# 홈 4.7% vs 월별 0.6% — 그 차이가 «어디서» 나는지
import datetime, collections, re
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (RunReportRequest, DateRange, Dimension, Metric,
                                                FilterExpression, Filter)
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
PROP = "properties/545108776"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)

def run(dims, mets, start="28daysAgo", end="yesterday", n=300, dim_filter=None):
    req = RunReportRequest(property=PROP,
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets], limit=n)
    if dim_filter is not None:
        req.dimension_filter = dim_filter
    r = cl.run_report(req)
    return [([d.value for d in x.dimension_values], [m.value for m in x.metric_values]) for x in r.rows]

print("=== 최근 28일 · 이벤트 종류")
for d, m in run(["eventName"], ["eventCount"], n=30):
    print("   %-22s %s" % (d[0], m[0]))

print("\n=== 착지 페이지 구획별 (세션·이벤트)")
rows = run(["landingPage"], ["sessions", "eventCount", "screenPageViews", "bounceRate"], n=500)
def bucket(p):
    p = p or "(없음)"
    if p == "/" : return "홈 /"
    m = re.match(r"^/(\d{4}-\d{2})", p)
    if m: return "월별 /" + m.group(1)
    seg = p.strip("/").split("/")[0]
    if seg in ("en","ja","zh","tw","es"): return "외국어"
    return "/" + seg + "/"
agg = collections.defaultdict(lambda: [0,0,0])
for d, m in rows:
    b = bucket(d[0])
    agg[b][0] += int(m[0]); agg[b][1] += int(m[1]); agg[b][2] += int(m[2])
for b,(s,e,v) in sorted(agg.items(), key=lambda x: -x[1][0])[:18]:
    print("   %-16s 세션 %5d · 이벤트 %6d · PV %5d · 세션당 PV %.2f" % (b, s, e, v, v/s if s else 0))
