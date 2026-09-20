# -*- coding: utf-8 -*-
import datetime, collections
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
PROP = "properties/545108776"
SITE = "https://chukjemoa.co.kr/"
TODAY = datetime.date.today()
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly",
                 "https://www.googleapis.com/auth/webmasters.readonly"])
ga = BetaAnalyticsDataClient(credentials=cred)
def g4(dims, mets, start, end, n=100000):
    r = ga.run_report(RunReportRequest(property=PROP,
        date_ranges=[DateRange(start_date=str(start), end_date=str(end))],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets], limit=n))
    return [([v.value for v in row.dimension_values], [v.value for v in row.metric_values]) for row in r.rows]

E = TODAY - datetime.timedelta(days=1)
W1 = (E - datetime.timedelta(days=6), E)          # 최근 7일
W2 = (E - datetime.timedelta(days=13), E - datetime.timedelta(days=7))

print("### 1. 소스/매체 상세 (최근7일 vs 직전7일)")
def sm(rng):
    c = collections.Counter()
    for d, m in g4(["sessionSource","sessionMedium"], ["sessions"], *rng):
        c[d[0]+" / "+d[1]] += int(m[0])
    return c
a, b = sm(W1), sm(W2)
for k, v in a.most_common(18):
    print("- %-42s %5d (지난 %d)" % (k, v, b.get(k,0)))

print()
print("### 2. 네이버 유입 랜딩 상위 20 (최근7일 vs 직전7일)")
def nl(rng):
    c = collections.Counter()
    for d, m in g4(["landingPage","sessionSource"], ["sessions"], *rng):
        if "naver" in d[1].lower(): c[d[0] or "/"] += int(m[0])
    return c
x, y = nl(W1), nl(W2)
print("네이버 합계 %d (지난 %d)" % (sum(x.values()), sum(y.values())))
for k, v in x.most_common(20):
    print("- %-52s %5d (지난 %d)" % (k[:52], v, y.get(k,0)))
print("↓ 지난주 대비 많이 줄어든 것")
for k, v in sorted(y.items(), key=lambda z: -(z[1]-x.get(z[0],0)))[:10]:
    print("- %-52s %d → %d" % (k[:52], v, x.get(k,0)))

print()
print("### 3. 신규 유입 랜딩 (이번주 새로 생긴 것 상위 10)")
for k, v in sorted([(k,v) for k,v in x.items() if y.get(k,0)==0], key=lambda z:-z[1])[:10]:
    print("- %-52s %d" % (k[:52], v))

print()
print("### 4. GSC 일자별 클릭·노출 (최근 21일)")
sc = build("searchconsole","v1",credentials=cred,cache_discovery=False)
gend = TODAY - datetime.timedelta(days=3)
rows = sc.searchanalytics().query(siteUrl=SITE, body={
    "startDate": str(gend - datetime.timedelta(days=20)), "endDate": str(gend),
    "dimensions": ["date"], "rowLimit": 100}).execute().get("rows", [])
for r in rows:
    print("- %s 클릭 %d · 노출 %d · %.1f위" % (r["keys"][0], r["clicks"], r["impressions"], r["position"]))
