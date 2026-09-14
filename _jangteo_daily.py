# -*- coding: utf-8 -*-
"""/jangteo 허브가 정말 «무너졌나»를 날짜별로 확인한다.
   주간 리포트는 -210 이라 했고 같은 창을 하루 민 감사는 -18 이라 했다. 둘 중 하나는 오독이다.
   오일장은 «장 서는 날»에 몰리는 페이지라 요일/날짜 효과가 크다 — 날짜별로 봐야 안다.
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
r = ga.run_report(RunReportRequest(
    property=PROP, date_ranges=[DateRange(start_date=str(start), end_date=str(end))],
    dimensions=[Dimension(name="date"), Dimension(name="landingPage"), Dimension(name="sessionSource")],
    metrics=[Metric(name="sessions")], limit=50000))

hub, sido, tot = collections.Counter(), collections.Counter(), collections.Counter()
for x in r.rows:
    d, p, s = [v.value for v in x.dimension_values]
    n = int(x.metric_values[0].value)
    if "naver" not in s.lower(): continue
    tot[d] += n
    if p.rstrip("/") == "/jangteo": hub[d] += n
    elif p.startswith("/jangteo/"): sido[d] += n

print("날짜별 네이버 세션 — /jangteo 허브 · 하위 · 오일장합 · 전체")
print("%-12s %6s %6s %7s %7s  %s" % ("날짜", "허브", "하위", "오일장", "전체", "요일"))
WD = "월화수목금토일"
for d in sorted(tot):
    dt = datetime.date(int(d[:4]), int(d[4:6]), int(d[6:]))
    print("%-12s %6d %6d %7d %7d  %s" % (
        d, hub.get(d,0), sido.get(d,0), hub.get(d,0)+sido.get(d,0), tot[d], WD[dt.weekday()]))
