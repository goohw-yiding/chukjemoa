# -*- coding: utf-8 -*-
# 소싱 판정의 1단계 — shop_click 이 «상품별로» 실제로 집계되는지 확인한다.
# 맞춤 측정기준이 등록돼 있지 않으면 item/place 는 보고서에 아예 안 뜬다.
import sys
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest, DateRange, Dimension, Metric, Filter, FilterExpression)
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
PROP = "properties/545108776"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)
admin = build("analyticsadmin", "v1beta", credentials=cred, cache_discovery=False)

print("=== 등록된 맞춤 측정기준 ===")
reg = {}
try:
    for cd in admin.properties().customDimensions().list(parent=PROP).execute().get("customDimensions", []):
        reg[cd.get("parameterName")] = cd.get("displayName")
        print("  %-14s -> %s" % (cd.get("parameterName"), cd.get("displayName")))
except Exception as e:
    print("  조회 실패:", e)
need = ["item", "merchant", "slot", "place", "page_kind", "fallback"]
miss = [p for p in need if p not in reg]
print("  ⚠️ 미등록:", ", ".join(miss) if miss else "없음")

def run(dims, mets, start="28daysAgo", end="today", n=100, ev=None):
    kw = {}
    if ev:
        kw["dimension_filter"] = FilterExpression(filter=Filter(
            field_name="eventName", string_filter=Filter.StringFilter(value=ev)))
    r = cl.run_report(RunReportRequest(property=PROP,
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets], limit=n, **kw))
    return [([d.value for d in x.dimension_values],
             [m.value for m in x.metric_values]) for x in r.rows]

print("\n=== shop_click 총량 (28일) ===")
for _d, m in run(["eventName"], ["eventCount"], ev="shop_click"):
    print("  shop_click:", m[0])

for p in ["item", "merchant", "slot", "page_kind", "fallback"]:
    if p not in reg:
        print("\n=== %s : 미등록이라 조회 불가 ===" % p)
        continue
    print("\n=== shop_click × %s (28일) ===" % p)
    try:
        rows = run(["customEvent:" + p], ["eventCount"], ev="shop_click", n=60)
        if not rows: print("  (행 없음)")
        for _dv, m in rows:
            print("  %-22s %s" % (_dv[0], m[0]))
    except Exception as e:
        print("  실패:", e)
