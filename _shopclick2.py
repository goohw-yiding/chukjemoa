# -*- coding: utf-8 -*-
# 2단계 — 어느 «면»에서 눌리나, 그리고 그 면의 세션 대비 클릭률(=구매박스 CTR).
import sys
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest, DateRange, Dimension, Metric, Filter, FilterExpression)

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
PROP = "properties/545108776"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)

def run(dims, mets, start="28daysAgo", end="today", n=200, ev=None):
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

print("=== shop_click : 상품 × 게재면 (28일) ===")
for dv, m in run(["customEvent:item", "customEvent:place"], ["eventCount"], ev="shop_click", n=80):
    print("  %-20s %-28s %s" % (dv[0], dv[1] or "(없음)", m[0]))

print("\n=== 면(page_kind)별 세션 대비 구매박스 클릭률 ===")
# 세션은 페이지경로로 묶어 직접 분류한다 (page_kind 는 이벤트 파라미터라 세션에 못 붙는다)
sess = run(["pagePath"], ["screenPageViews"], n=800)
import re
def kind(p):
    if re.match(r"^/(en|ja|es|zh|tw)/", p): return "lang"
    if p.startswith("/festival/"): return "festival-hub" if p == "/festival/" else "festival-detail"
    if p.startswith("/blog/"): return "blog-hub" if p == "/blog/" else "blog-post"
    if p.startswith("/jangteo"): return "jangteo"
    if re.match(r"^/20\d\d-\d\d/", p): return "month"
    if p == "/": return "home"
    return p.strip("/").split("/")[0] or "other"
agg = {}
for dv, m in sess:
    agg[kind(dv[0])] = agg.get(kind(dv[0]), 0) + int(m[0])
clicks = {}
for dv, m in run(["customEvent:page_kind"], ["eventCount"], ev="shop_click", n=80):
    clicks[dv[0]] = int(m[0])
rows = []
for k, pv in agg.items():
    c = clicks.get(k, 0)
    if pv >= 100:
        rows.append((k, pv, c, c / pv * 100))
rows.sort(key=lambda r: -r[1])
print("  %-18s %8s %7s %8s" % ("면", "조회수", "클릭", "클릭률"))
for k, pv, c, r in rows:
    print("  %-18s %8d %7d %7.2f%%" % (k, pv, c, r))
