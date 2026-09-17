# -*- coding: utf-8 -*-
# ⚠️ 날짜가 헷갈린다 — 이 컨테이너는 9/17, PC(KST)는 9/18 로 보인다.
#    「어제」를 잘못 잡으면 답이 통째로 틀리니 PC 실제 시각을 찍고 이틀치를 같이 낸다.
import datetime, subprocess
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest, DateRange, Dimension, Metric, Filter, FilterExpression)

print("PC 로컬 시각:", datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S %A"))
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
PROP = "properties/545108776"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)

def run(dims, mets, start, end, n=100, ev=None):
    req = RunReportRequest(property=PROP,
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets], limit=n)
    if ev:
        req.dimension_filter = FilterExpression(filter=Filter(
            field_name="eventName", string_filter=Filter.StringFilter(value=ev)))
    r = cl.run_report(req)
    return [([d.value for d in x.dimension_values], [m.value for m in x.metric_values]) for x in r.rows]

for day in ["2026-09-16", "2026-09-17"]:
    print(f"\n════ {day} ════")
    rows = run(["customEvent:merchant"], ["eventCount"], day, day, 50, ev="shop_click")
    tot = sum(int(m[0]) for _, m in rows)
    if not rows:
        print("  shop_click 0건")
    for d, m in rows:
        print(f"  {d[0] or '(없음)':<10} {m[0]}건")
    print(f"  합계 {tot}건")
    for d, m in run(["customEvent:item", "customEvent:merchant", "customEvent:slot", "customEvent:page_kind"],
                    ["eventCount"], day, day, 50, ev="shop_click"):
        print(f"     {m[0]:>2}건  {d[0]:<14} {d[1]:<8} {d[2]:<8} {d[3]}")
    for d, m in run([], ["activeUsers", "sessions"], day, day, 1):
        print(f"  (그날 활성사용자 {m[0]} · 세션 {m[1]})")
