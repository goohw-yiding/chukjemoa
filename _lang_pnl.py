# -*- coding: utf-8 -*-
"""외국어 5개가 각각 «몇 장을 유지하고 몇을 버는가». 분리 여부를 정하려면 이게 먼저다.
   GSC(노출·클릭) + GA4(세션)를 언어별로 갈라 페이지 수와 나란히 놓는다.
"""
import datetime, sys, collections, os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)
ga = BetaAnalyticsDataClient(credentials=service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"]))
PROP = "properties/545108776"
end = datetime.date.today() - datetime.timedelta(days=3)
start = end - datetime.timedelta(days=89)

LANGS = ["en", "ja", "zh", "tw", "es"]
def lang_of(p):
    for L in LANGS:
        if p.startswith("/" + L + "/") or p == "/" + L:
            return L
    return "ko"

# 페이지 수
ROOT = r"C:\dev\chukjemoa"
cnt = collections.Counter()
for L in LANGS:
    d = os.path.join(ROOT, L)
    if not os.path.isdir(d): continue
    for r, _, fs in os.walk(d):
        cnt[L] += sum(1 for f in fs if f == "index.html")

# GSC
rows, row = [], 0
while row < 30000:
    b = sc.searchanalytics().query(siteUrl=SITE, body={
        "startDate": str(start), "endDate": str(end),
        "dimensions": ["page"], "rowLimit": 1000, "startRow": row}).execute().get("rows", [])
    rows += b
    if len(b) < 1000: break
    row += 1000
imp, clk = collections.Counter(), collections.Counter()
for r in rows:
    L = lang_of(r["keys"][0].replace("https://chukjemoa.co.kr", ""))
    imp[L] += r["impressions"]; clk[L] += r["clicks"]

# GA4 세션
ses = collections.Counter()
g = ga.run_report(RunReportRequest(
    property=PROP, date_ranges=[DateRange(start_date=str(start), end_date=str(end))],
    dimensions=[Dimension(name="landingPage")], metrics=[Metric(name="sessions")], limit=20000))
for x in g.rows:
    ses[lang_of(x.dimension_values[0].value or "/")] += int(x.metric_values[0].value)

print("90일 (%s ~ %s) · 언어별 손익\n" % (start, end))
print("%-6s %7s %9s %8s %8s %10s %12s" % ("언어", "페이지", "노출", "클릭", "세션", "페이지당클릭", "페이지당세션"))
for L in ["ko"] + LANGS:
    p = cnt[L] if L != "ko" else "—"
    pc = ("%.2f" % (clk[L] / cnt[L])) if L != "ko" and cnt[L] else "—"
    ps = ("%.2f" % (ses[L] / cnt[L])) if L != "ko" and cnt[L] else "—"
    print("%-6s %7s %9d %8d %8d %10s %12s" % (L, p, imp[L], clk[L], ses[L], pc, ps))
tot_f = sum(cnt[L] for L in LANGS)
print("\n외국어 합계: 페이지 %d장 · 노출 %d · 클릭 %d · 세션 %d" % (
    tot_f, sum(imp[L] for L in LANGS), sum(clk[L] for L in LANGS), sum(ses[L] for L in LANGS)))
print("한국어 대비 클릭 비중: %.1f%%" % (100.0*sum(clk[L] for L in LANGS)/max(1, clk["ko"]+sum(clk[L] for L in LANGS))))
