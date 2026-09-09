# -*- coding: utf-8 -*-
# 네이버 검색어는 서치어드바이저에만 있다. 하지만 「네이버가 어느 페이지로 보내는가」는 GA4로 보인다.
# 검색어를 모르더라도 «무엇이 먹히는지»는 여기서 거의 다 드러난다.
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest, DateRange, Dimension, Metric, Filter, FilterExpression,
    FilterExpressionList)

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)
PROP = "properties/545108776"

def naver_filter():
    return FilterExpression(filter=Filter(
        field_name="sessionSource",
        string_filter=Filter.StringFilter(
            match_type=Filter.StringFilter.MatchType.CONTAINS, value="naver")))

def google_filter():
    return FilterExpression(filter=Filter(
        field_name="sessionSource",
        string_filter=Filter.StringFilter(
            match_type=Filter.StringFilter.MatchType.EXACT, value="google")))

def run(dims, mets, filt=None, start="28daysAgo", end="yesterday", n=40):
    r = cl.run_report(RunReportRequest(property=PROP,
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets],
        dimension_filter=filt, limit=n))
    return [([d.value for d in x.dimension_values],
             [m.value for m in x.metric_values]) for x in r.rows]

print("=== 네이버가 보내는 «착지 페이지» 상위 30 (28일)")
print("  %-44s %7s %7s %8s" % ("페이지", "세션", "사용자", "이탈률"))
nv = run(["landingPage"], ["sessions", "activeUsers", "bounceRate"], naver_filter(), n=30)
for d, m in nv:
    print("  %-44s %7s %7s %7.1f%%" % (d[0][:44], m[0], m[1], float(m[2]) * 100))

print("\n=== 같은 기간 구글이 보내는 착지 페이지 상위 15 — 비교용")
for d, m in run(["landingPage"], ["sessions", "activeUsers"], google_filter(), n=15):
    print("  %-44s %7s %7s" % (d[0][:44], m[0], m[1]))

print("\n=== 네이버 유입의 기기")
for d, m in run(["deviceCategory"], ["sessions"], naver_filter(), n=5):
    print("  %-12s %6s" % (d[0], m[0]))

print("\n=== 네이버 유입이 사이트 안에서 무엇을 누르나")
for d, m in run(["eventName"], ["eventCount"], naver_filter(), n=15):
    print("  %-24s %8s" % (d[0][:24], m[0]))

print("\n=== 네이버 유입 PV/세션")
for d, m in run([], ["sessions", "screenPageViews"], naver_filter()):
    s, p = int(m[0]), int(m[1])
    print("  세션 %d · PV %d · PV/세션 %.2f" % (s, p, p / s))
