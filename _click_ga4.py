# -*- coding: utf-8 -*-
# 구글 밖 유입 — 네이버는 referral/organic 으로 갈려 잡히니 합산해서 본다.
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)
PROP = "properties/545108776"

def run(dims, mets, start="28daysAgo", end="yesterday", n=50):
    r = cl.run_report(RunReportRequest(property=PROP,
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets], limit=n))
    return [([d.value for d in x.dimension_values],
             [x.metric_values[i].value for i in range(len(mets))]) for x in r.rows]

print("[28일 전체]")
for d, m in run([], ["sessions", "activeUsers", "screenPageViews"]):
    print("  세션 %s · 사용자 %s · PV %s" % (m[0], m[1], m[2]))

print("\n[소스/매체 — 상위 15]")
tot = 0
naver = 0
for d, m in run(["sessionSource", "sessionMedium"], ["sessions"], n=30):
    tot += int(m[0])
    if "naver" in d[0].lower():
        naver += int(m[0])
print("  (네이버 계열 합산 %d 세션 / 전체 상위30 합 %d)" % (naver, tot))
for d, m in run(["sessionSource", "sessionMedium"], ["sessions"], n=15):
    print("  %-28s %-10s %6s" % (d[0][:28], d[1][:10], m[0]))

print("\n[채널]")
for d, m in run(["sessionDefaultChannelGroup"], ["sessions", "activeUsers"], n=12):
    print("  %-22s 세션 %6s · 사용자 %6s" % (d[0][:22], m[0], m[1]))

print("\n[상위 페이지 — PV]")
for d, m in run(["pagePath"], ["screenPageViews", "activeUsers"], n=15):
    print("  %-46s PV %6s · 사용자 %5s" % (d[0][:46], m[0], m[1]))

print("\n[이벤트]")
for d, m in run(["eventName"], ["eventCount"], n=20):
    print("  %-26s %8s" % (d[0][:26], m[0]))
