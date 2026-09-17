# -*- coding: utf-8 -*-
# 어제(2026-09-16) 축제모아 상품 클릭(shop_click) — 자사/쿠팡으로 갈라서 센다.
import datetime
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest, DateRange, Dimension, Metric, Filter, FilterExpression)

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
PROP = "properties/545108776"          # 축제모아
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)

KST = datetime.datetime.utcnow() + datetime.timedelta(hours=9)
YDAY = (KST.date() - datetime.timedelta(days=1)).isoformat()
print(f"기준일(KST) 어제 = {YDAY}\n")

def run(dims, mets, start, end, n=100, ev=None):
    req = RunReportRequest(
        property=PROP,
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets], limit=n)
    if ev:
        req.dimension_filter = FilterExpression(filter=Filter(
            field_name="eventName", string_filter=Filter.StringFilter(value=ev)))
    r = cl.run_report(req)
    return [([d.value for d in x.dimension_values], [m.value for m in x.metric_values]) for x in r.rows]

# ① 어제 전체 이벤트 (shop_click 이 잡히는지부터)
print("=== 어제 이벤트 상위 ===")
for d, m in run(["eventName"], ["eventCount"], YDAY, YDAY, 25):
    print(f"  {d[0]:<24} {m[0]}")

# ② shop_click 을 자사/쿠팡으로
print("\n=== 어제 shop_click — 판매처별 ===")
rows = run(["customEvent:merchant"], ["eventCount"], YDAY, YDAY, 50, ev="shop_click")
tot = 0
for d, m in rows:
    print(f"  {d[0] or '(없음)':<12} {m[0]}건")
    tot += int(m[0])
print(f"  합계 {tot}건")

# ③ 무엇이 눌렸나
print("\n=== 어제 shop_click — 상품·판매처·자리 ===")
for d, m in run(["customEvent:item", "customEvent:merchant", "customEvent:slot", "customEvent:page_kind"],
                ["eventCount"], YDAY, YDAY, 50, ev="shop_click"):
    print(f"  {m[0]:>3}건  {d[0]:<14} {d[1]:<8} {d[2]:<8} {d[3]}")

# ④ 맥락 — 어제 방문자수와 최근 7일 추이
print("\n=== 어제 규모 ===")
for d, m in run([], ["activeUsers", "sessions", "screenPageViews"], YDAY, YDAY, 1):
    print(f"  활성사용자 {m[0]} · 세션 {m[1]} · 페이지뷰 {m[2]}")
print("\n=== 최근 8일 shop_click 추이 ===")
for d, m in run(["date"], ["eventCount"], "8daysAgo", "yesterday", 20, ev="shop_click"):
    print(f"  {d[0]}  {m[0]}건")
