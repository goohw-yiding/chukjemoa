# -*- coding: utf-8 -*-
"""방향을 잡기 전 마지막 확인: 지금 뭐가 «자라고» 있나. 주별 추세."""
import io, collections
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (RunReportRequest, DateRange,
    Dimension, Metric, Filter, FilterExpression)
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
PROP = "properties/545108776"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)
OUT = []
def p(s=""): OUT.append(s)
def rep(dims, mets, s="90daysAgo", e="today", n=500, filt=None):
    r = cl.run_report(RunReportRequest(property=PROP,
        date_ranges=[DateRange(start_date=s, end_date=e)],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets], dimension_filter=filt, limit=n))
    return [([d.value for d in x.dimension_values], [m.value for m in x.metric_values]) for x in r.rows]

p("=== 주별 세션 — 채널 묶음 (네이버/구글/직접)")
rows = rep(["week", "sessionSource"], ["sessions"])
byw = collections.defaultdict(lambda: collections.Counter())
for d, m in rows:
    w, src = d[0], d[1].lower()
    g = "네이버" if "naver" in src else ("구글" if src == "google" else ("직접" if "direct" in src else "기타"))
    byw[w][g] += int(m[0])
p("   주   네이버   구글   직접   기타   합계")
for w in sorted(byw):
    c = byw[w]; t = sum(c.values())
    p("   %-4s %-7d %-6d %-6d %-6d %d" % (w, c["네이버"], c["구글"], c["직접"], c["기타"], t))

p("")
p("=== 주별 shop_click (수익 이벤트)")
SC = FilterExpression(filter=Filter(field_name="eventName",
    string_filter=Filter.StringFilter(value="shop_click")))
for d, m in sorted(rep(["week"], ["eventCount"], filt=SC)):
    p("   %s주  %s건" % (d[0], m[0]))

p("")
p("=== 주별 외국어 섹션 PV (en+ja+zh+tw+es 합)")
rows = rep(["week", "pagePath"], ["screenPageViews"], n=5000)
byw2 = collections.Counter()
for d, m in rows:
    if d[1][:4] in ("/en/", "/ja/", "/zh/", "/tw/", "/es/"):
        byw2[d[0]] += int(m[0])
for w in sorted(byw2):
    p("   %s주  PV %d" % (w, byw2[w]))

io.open(r"C:\dev\chukjemoa\_trend.txt", "w", encoding="utf-8").write("\n".join(OUT))
print("done")
