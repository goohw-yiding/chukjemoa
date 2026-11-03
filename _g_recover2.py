# -*- coding: utf-8 -*-
"""정리 후보: 사이트맵 URL 중 급락 전 90일(7/24~10/22) 구글 노출 0인 페이지 — 묶음별 + GA4 네이버 유입"""
import sys, re, os, collections
sys.stdout.reconfigure(encoding="utf-8")
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric
K = r"C:\dev\traffic-dashboard\sa-key.json"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(K, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)
ga = BetaAnalyticsDataClient(credentials=service_account.Credentials.from_service_account_file(K, scopes=["https://www.googleapis.com/auth/analytics.readonly"]))
exec(open("_g_recover.py", encoding="utf-8").read().split("# 1)")[0].split("SITE = ")[1].join(["SITE = ", ""]) if False else "")
SITE = "https://chukjemoa.co.kr/"
def grp(u):
    p = u.replace("https://chukjemoa.co.kr", "")
    m = re.match(r"^/(en|ja|zh|tw|es)/", p)
    if m: return "외국어-" + m.group(1)
    seg = p.strip("/").split("/")[0]
    if re.match(r"^20\d\d-\d\d$", seg): return "월별"
    return seg or "홈"
xml = open("sitemap.xml", encoding="utf-8").read()
locs = re.findall(r"<loc>(.*?)</loc>", xml)
urls = []
for s in [l for l in locs if l.endswith(".xml")]:
    f = s.split("/")[-1]
    if os.path.exists(f): urls += re.findall(r"<loc>(.*?)</loc>", open(f, encoding="utf-8").read())
urls = urls or locs
r = sc.searchanalytics().query(siteUrl=SITE, body={"startDate": "2026-07-24", "endDate": "2026-10-22", "dimensions": ["page"], "rowLimit": 25000}).execute().get("rows", [])
imp = collections.Counter()
for x in r: imp[x["keys"][0].split("#")[0]] += x["impressions"]
# GA4 네이버 착지(28일)
rows = ga.run_report(RunReportRequest(property="properties/545108776", date_ranges=[DateRange(start_date="28daysAgo", end_date="yesterday")],
    dimensions=[Dimension(name="landingPage"), Dimension(name="sessionSource")], metrics=[Metric(name="sessions")], limit=20000)).rows
nav = collections.Counter()
for x in rows:
    if "naver" in x.dimension_values[1].value: nav["https://chukjemoa.co.kr" + x.dimension_values[0].value.rstrip("/") + "/"] += int(x.metric_values[0].value)
G = collections.defaultdict(lambda: [0, 0, 0, 0])  # 총, 구글0, 구글0&네이버0, 구글노출합
for u in urls:
    g = grp(u); i = imp.get(u, 0); n = nav.get(u.rstrip("/") + "/", 0)
    G[g][0] += 1; G[g][3] += i
    if i == 0: G[g][1] += 1
    if i == 0 and n == 0: G[g][2] += 1
print("묶음 | 사이트맵 | 구글 90일 노출0 | 구글0+네이버28일 0 | 구글 90일 노출합")
for g, v in sorted(G.items(), key=lambda kv: -kv[1][0]):
    print(f"{g:14s} {v[0]:4d} {v[1]:4d} {v[2]:4d} {int(v[3]):7d}")
t = [sum(v[i] for v in G.values()) for i in range(4)]
print("합계", t)
