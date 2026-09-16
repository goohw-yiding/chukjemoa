# -*- coding: utf-8 -*-
"""일본 사람은 우리 사이트에 «무엇을 타고» 오나 — 공개 통계 말고 우리 실측.
   GA4 를 국가=Japan 으로 걸러 유입 소스를 본다. 기간을 넉넉히(90일) 잡는다 — 일본 유입이 적어서."""
import io
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (RunReportRequest, DateRange,
    Dimension, Metric, Filter, FilterExpression)

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
PROP = "properties/545108776"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)
JP = FilterExpression(filter=Filter(field_name="country",
    string_filter=Filter.StringFilter(value="Japan")))
OUT = []
def p(s=""): OUT.append(s)

def rep(dims, mets, s="90daysAgo", e="today", n=40, filt=JP):
    r = cl.run_report(RunReportRequest(property=PROP,
        date_ranges=[DateRange(start_date=s, end_date=e)],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets],
        dimension_filter=filt, limit=n))
    return [([d.value for d in x.dimension_values],
             [m.value for m in x.metric_values]) for x in r.rows]

p("=== 일본 유입 — 최근 90일 (GA4, country=Japan)")
for d, m in rep([], ["sessions", "activeUsers", "screenPageViews"]):
    p("   세션 %s · 사용자 %s · PV %s" % (m[0], m[1], m[2]))

p("")
p("=== 채널")
for d, m in rep(["sessionDefaultChannelGroup"], ["sessions"]):
    p("   %-24s 세션 %s" % (d[0], m[0]))

p("")
p("=== 소스 / 매체 — «어느 검색엔진·어느 앱»을 타고 오나")
for d, m in rep(["sessionSource", "sessionMedium"], ["sessions"], n=40):
    p("   %-28s / %-12s 세션 %s" % (d[0][:28], d[1][:12], m[0]))

p("")
p("=== 기기 (모바일이 시장인지 확인)")
for d, m in rep(["deviceCategory"], ["sessions"]):
    p("   %-12s 세션 %s" % (d[0], m[0]))

p("")
p("=== 비교: 전체(모든 나라) 소스 상위 — 일본과 얼마나 다른가")
for d, m in rep(["sessionSource", "sessionMedium"], ["sessions"], n=12, filt=None):
    p("   %-28s / %-12s 세션 %s" % (d[0][:28], d[1][:12], m[0]))

io.open(r"C:\dev\chukjemoa\_jp_src.txt", "w", encoding="utf-8").write("\n".join(OUT))
print("done")
