# -*- coding: utf-8 -*-
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
PROP = "properties/545108776"

cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)

def run(dims, mets, start="7daysAgo", end="today", n=20):
    r = cl.run_report(RunReportRequest(property=PROP,
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets], limit=n))
    return [([d.value for d in x.dimension_values],
             [m.value for m in x.metric_values]) for x in r.rows]

print("=== 이벤트별 카운트 (최근 7일) ===")
for d, m in run(["eventName"], ["eventCount"]):
    print(d, m)

print("\n=== 주요 이벤트(conversion event) 목록 ===")
admin_cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
admin = build("analyticsadmin", "v1beta", credentials=admin_cred, cache_discovery=False)
try:
    resp = admin.properties().conversionEvents().list(parent=PROP).execute()
    for ev in resp.get("conversionEvents", []):
        print(" ", ev.get("eventName"), "| custom:", ev.get("custom"))
except Exception as e:
    print("conversionEvents 조회 실패:", e)

print("\n=== 등록된 맞춤 측정기준 ===")
try:
    resp2 = admin.properties().customDimensions().list(parent=PROP).execute()
    for cd in resp2.get("customDimensions", []):
        print(" ", cd.get("parameterName"), "->", cd.get("displayName"))
except Exception as e:
    print("customDimensions 조회 실패:", e)
