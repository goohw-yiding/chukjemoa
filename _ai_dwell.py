# -*- coding: utf-8 -*-
"""테마 페이지 vs 월별 페이지 체류·참여율 (지난 14일, 착지 기준) — AI 노출 개선 지시 2026-10-30"""
import sys
sys.stdout.reconfigure(encoding="utf-8")
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric, FilterExpression, Filter
cred = service_account.Credentials.from_service_account_file(r"C:\dev\traffic-dashboard\sa-key.json", scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)
P = "properties/545108776"
def run(start, ai=False):
    f = None
    if ai:
        f = FilterExpression(filter=Filter(field_name="sessionSource", string_filter=Filter.StringFilter(match_type=Filter.StringFilter.MatchType.FULL_REGEXP, value=".*(chatgpt|openai|perplexity|gemini|claude|copilot).*")))
    r = cl.run_report(RunReportRequest(property=P, date_ranges=[DateRange(start_date=start, end_date="yesterday")],
        dimensions=[Dimension(name="landingPage")],
        metrics=[Metric(name="sessions"), Metric(name="engagementRate"), Metric(name="averageSessionDuration")],
        dimension_filter=f, limit=400))
    return {x.dimension_values[0].value: [float(m.value) for m in x.metric_values] for x in r.rows}
keys = ["/winter/light/", "/maple/", "/blog/autumn-flower-peak-timing-data/", "/2026-10/", "/2026-11/", "/flower/", "/valley/", "/onsen/", "/mountain/", "/seoul/2026-11/"]
for lab, st, ai in [("전체 14일", "14daysAgo", False), ("전체 28일", "28daysAgo", False), ("AI 28일", "28daysAgo", True)]:
    d = run(st, ai)
    print("==", lab)
    for k in keys:
        v = None
        for p, m in d.items():
            if p.rstrip("/") == k.rstrip("/"):
                v = m if v is None else [v[0] + m[0], v[1], v[2]]
        print(f"  {k:42s}", "없음" if not v else f"세션 {int(v[0]):4d}  참여율 {v[1]*100:4.0f}%  평균체류 {v[2]:5.0f}초")
    if ai:
        for p, m in sorted(d.items(), key=lambda kv: -kv[1][0])[:15]:
            print("   AI top", p, int(m[0]), f"{m[1]*100:.0f}%", f"{m[2]:.0f}s")
