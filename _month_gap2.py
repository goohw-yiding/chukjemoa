# -*- coding: utf-8 -*-
import datetime, collections, re
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric
KEY = r"C:\dev\traffic-dashboard\sa-key.json"; PROP = "properties/545108776"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)
def run(dims, mets, n=2000):
    r = cl.run_report(RunReportRequest(property=PROP,
        date_ranges=[DateRange(start_date="28daysAgo", end_date="yesterday")],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets], limit=n))
    return [([d.value for d in x.dimension_values], [m.value for m in x.metric_values]) for x in r.rows]

def bucket(p):
    p = p or "(없음)"
    if p == "/": return "홈"
    m = re.match(r"^/(\d{4}-\d{2})", p)
    if m: return "월별"
    seg = p.strip("/").split("/")[0]
    if seg in ("en","ja","zh","tw","es"): return "외국어"
    if seg == "jangteo": return "오일장"
    if seg == "festival": return "축제상세"
    if seg == "blog": return "블로그"
    return "그 외"

sess = collections.Counter()
for d, m in run(["landingPage"], ["sessions"]):
    sess[bucket(d[0])] += int(m[0])

ev = collections.defaultdict(collections.Counter)
for d, m in run(["landingPage", "eventName"], ["eventCount"]):
    ev[bucket(d[0])][d[1]] += int(m[0])

KEYS = ["festival_open", "search_use", "map_click", "outbound", "shop_click", "ai_ask", "click", "scroll"]
order = ["홈", "월별", "오일장", "축제상세", "블로그", "외국어", "그 외"]
print("구획별 «세션 대비 이벤트 발생률» (28일)\n")
print("구획      세션 " + " ".join(k[:9].rjust(10) for k in KEYS))
for b in order:
    s = sess.get(b, 0)
    if not s: continue
    line = "%-8s %5d " % (b, s)
    for k in KEYS:
        c = ev[b].get(k, 0)
        line += ("%9.1f%%" % (c / s * 100)) if s else "        -"
        line += " "
    print(line)
print("\n(원 건수)")
for b in order:
    if not sess.get(b): continue
    print("  %-8s %s" % (b, " · ".join("%s %d" % (k, ev[b].get(k, 0)) for k in KEYS)))
