import sys
sys.stdout.reconfigure(encoding="utf-8")
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric, OrderBy
cred = service_account.Credentials.from_service_account_file(r"C:\dev\traffic-dashboard\sa-key.json", scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred); P = "properties/545108776"
def run(dims, mets, s, e="yesterday", n=50, order=None):
    r = cl.run_report(RunReportRequest(property=P, date_ranges=[DateRange(start_date=s, end_date=e)], dimensions=[Dimension(name=d) for d in dims], metrics=[Metric(name=m) for m in mets], limit=n, order_bys=order or []))
    return [([d.value for d in x.dimension_values], [m.value for m in x.metric_values]) for x in r.rows]
print("== 일별 (세션·사용자·페이지뷰)")
for d, m in run(["date"], ["sessions", "activeUsers", "screenPageViews"], "28daysAgo", "today", order=[OrderBy(dimension=OrderBy.DimensionOrderBy(dimension_name="date"))]):
    print(d[0], m)
print("== 7일 유입처 상위")
for d, m in run(["sessionSource", "sessionMedium"], ["sessions"], "7daysAgo", n=12, order=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="sessions"), desc=True)]):
    print(d, m)
print("== 7일 도시 상위(봇 확인)")
for d, m in run(["city"], ["sessions"], "7daysAgo", n=6, order=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="sessions"), desc=True)]):
    print(d, m)
