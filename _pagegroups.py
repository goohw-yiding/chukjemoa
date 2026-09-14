# -*- coding: utf-8 -*-
"""페이지 «묶음»별 세션. 어떤 상품을 어디에 걸지는 «사람이 실제로 보는 곳» 순서로 정해야 한다.
   상품 소싱 목록의 우선순위를 여기서 뽑는다.
"""
import datetime, sys, collections
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
ga = BetaAnalyticsDataClient(credentials=service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"]))
PROP = "properties/545108776"
end = datetime.date.today()
start = end - datetime.timedelta(days=27)

GROUPS = [
    ("월별 축제", lambda p: p.startswith("/2026-") or p.startswith("/2027-")),
    ("오일장", lambda p: p.startswith("/jangteo")),
    ("축제 상세", lambda p: p.startswith("/festival/")),
    ("도시", lambda p: any(p.startswith("/" + c + "/") for c in
        ("seoul","busan","jeju","incheon","daegu","gyeongju","gangneung","sokcho",
         "jeonju","cheongju","suwon","yeosu","tongyeong","geoje"))),
    ("자연·테마", lambda p: any(p.startswith(x) for x in
        ("/maple","/flower","/valley","/mountains","/trails","/onsen","/hot","/healing","/cafe"))),
    ("실내·무장애·반려", lambda p: any(p.startswith(x) for x in ("/indoor","/accessible","/pet"))),
    ("블로그", lambda p: p.startswith("/blog")),
    ("검색·코스·지도", lambda p: any(p.startswith(x) for x in ("/search","/course","/map","/trip","/test","/trend"))),
    ("연휴·추석", lambda p: p.startswith("/holiday") or p.startswith("/chuseok")),
    ("시티투어", lambda p: p.startswith("/citytour")),
    ("외국어", lambda p: any(p.startswith("/" + L + "/") for L in ("en","ja","zh","tw","es"))),
    ("홈", lambda p: p in ("/", "")),
]
r = ga.run_report(RunReportRequest(
    property=PROP, date_ranges=[DateRange(start_date=str(start), end_date=str(end))],
    dimensions=[Dimension(name="landingPage")], metrics=[Metric(name="sessions")], limit=30000))
tot = collections.Counter(); other = collections.Counter()
for x in r.rows:
    p = x.dimension_values[0].value or "/"
    n = int(x.metric_values[0].value)
    for name, f in GROUPS:
        if f(p): tot[name] += n; break
    else:
        tot["그 외"] += n; other[p] += n
allsum = sum(tot.values())
print("28일 (%s ~ %s) · 페이지 묶음별 세션\n" % (start, end))
for name, n in tot.most_common():
    print("  %-16s %6d  %5.1f%%" % (name, n, 100.0*n/max(1, allsum)))
print("  %-16s %6d" % ("합계", allsum))
if other:
    print("\n  「그 외」 상위: " + " · ".join("%s %d" % (p[:26], v) for p, v in other.most_common(10)))
