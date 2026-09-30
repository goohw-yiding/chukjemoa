# -*- coding: utf-8 -*-
import datetime, sys
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric, FilterExpression, Filter, FilterExpressionList
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ga = BetaAnalyticsDataClient(credentials=service_account.Credentials.from_service_account_file(r"C:\dev\traffic-dashboard\sa-key.json", scopes=["https://www.googleapis.com/auth/analytics.readonly"]))
end = datetime.date.today() - datetime.timedelta(days=1); start = end - datetime.timedelta(days=179)
def run(ev, dims):
    f = FilterExpression(and_group=FilterExpressionList(expressions=[
        FilterExpression(filter=Filter(field_name="pagePath", string_filter=Filter.StringFilter(match_type=Filter.StringFilter.MatchType.BEGINS_WITH, value="/en/"))),
        FilterExpression(filter=Filter(field_name="eventName", string_filter=Filter.StringFilter(value=ev)))]))
    try:
        r = ga.run_report(RunReportRequest(property="properties/545108776", date_ranges=[DateRange(start_date=str(start), end_date=str(end))], dimensions=[Dimension(name=d) for d in dims], metrics=[Metric(name="eventCount")], dimension_filter=f, limit=50)).rows
        print(f"\n[{ev}] {dims}")
        for x in r: print("  ", x.metric_values[0].value, [d.value for d in x.dimension_values])
    except Exception as e: print(ev, dims, "오류", str(e)[:200])
run("click", ["linkUrl", "pagePath"])
run("outbound", ["pagePath"])
for d in ["customEvent:url", "customEvent:link_url", "customEvent:dest", "customEvent:host"]:
    run("outbound", [d])
