# -*- coding: utf-8 -*-
"""GA4 일별 구글 자연검색 세션(사이트 전체 / 영어 착지) — GSC 10/23 급락이 실제인지 확인"""
import sys
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Metric, Dimension, FilterExpression, Filter, FilterExpressionList
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
KEY = r"C:\dev\traffic-dashboard\sa-key.json"; PROP = "properties/545108776"
ga = BetaAnalyticsDataClient(credentials=service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"]))
src = FilterExpression(filter=Filter(field_name="sessionSource", string_filter=Filter.StringFilter(value="google", match_type=Filter.StringFilter.MatchType.EXACT)))
en = FilterExpression(filter=Filter(field_name="landingPage", string_filter=Filter.StringFilter(value="/en/", match_type=Filter.StringFilter.MatchType.BEGINS_WITH)))
for name, f in [("google 전체", src), ("google /en/", FilterExpression(and_group=FilterExpressionList(expressions=[src, en])))]:
    rows = ga.run_report(RunReportRequest(property=PROP, date_ranges=[DateRange(start_date="2026-10-14", end_date="2026-10-27")], dimensions=[Dimension(name="date")], metrics=[Metric(name="sessions")], dimension_filter=f)).rows
    print(name, " ".join(f"{r.dimension_values[0].value[4:]}:{r.metric_values[0].value}" for r in sorted(rows, key=lambda r: r.dimension_values[0].value)))
