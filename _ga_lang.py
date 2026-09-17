# -*- coding: utf-8 -*-
import collections
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)
PROP = "properties/545108776"

def run(dims, mets, start="90daysAgo", end="today", n=100000):
    r = cl.run_report(RunReportRequest(property=PROP,
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets], limit=n))
    return [([d.value for d in x.dimension_values],
             [m.value for m in x.metric_values]) for x in r.rows]

def pref(p):
    s = p.strip("/").split("/")
    return s[0] if s and s[0] in ("en","ja","es","zh","tw") else "ko"

rows = run(["pagePath","sessionDefaultChannelGroup","sessionSource"], ["sessions"])
agg = collections.defaultdict(lambda: collections.Counter())
tot = collections.Counter()
for (p, ch, src), (s,) in rows:
    k = pref(p); s = int(s)
    tot[k] += s
    agg[k][f"{ch} / {src}"] += s

print("=== 90일 세션 (GA4) — 언어별 ===")
for k in ["ko","ja","en","tw","zh","es"]:
    print(f"\n/{k}/  총 {tot[k]} 세션")
    for src, n in agg[k].most_common(8):
        print(f"      {n:6}  {src}")
