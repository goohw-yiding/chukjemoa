# -*- coding: utf-8 -*-
# 웹푸시가 «닿을 수 있는» 기기가 실제 트래픽에서 얼마인가를 실측한다.
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest, DateRange, Dimension, Metric)

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
PROP = "properties/545108776"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)

def run(dims, mets, start, end, n=50):
    r = cl.run_report(RunReportRequest(property=PROP,
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets], limit=n))
    return [([d.value for d in x.dimension_values],
             [m.value for m in x.metric_values]) for x in r.rows]

for label, s, e in [("구독자가 붙은 나흘 9/07~9/11", "2026-09-07", "2026-09-11"),
                    ("최근 28일", "28daysAgo", "today")]:
    print("=" * 60)
    print(label)
    tot = run([], ["sessions"], s, e)
    T = int(tot[0][1][0]) if tot else 0
    print("세션 합계", T)

    print("-- 기기 --")
    for d, m in run(["deviceCategory"], ["sessions"], s, e):
        print("  %-10s %6s  %5.1f%%" % (d[0], m[0], int(m[0]) * 100.0 / max(T, 1)))

    print("-- OS x 브라우저 (상위 20) --")
    for d, m in run(["operatingSystem", "browser"], ["sessions"], s, e, 20):
        print("  %-10s %-22s %6s  %5.1f%%" % (d[0], d[1], m[0],
                                              int(m[0]) * 100.0 / max(T, 1)))
