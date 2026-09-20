# -*- coding: utf-8 -*-
import datetime, collections
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric
KEY=r"C:\dev\traffic-dashboard\sa-key.json"; PROP="properties/545108776"; SITE="https://chukjemoa.co.kr/"
TODAY=datetime.date.today()
cred=service_account.Credentials.from_service_account_file(KEY,scopes=[
 "https://www.googleapis.com/auth/analytics.readonly","https://www.googleapis.com/auth/webmasters.readonly"])
ga=BetaAnalyticsDataClient(credentials=cred)
def g4(dims,mets,s,e,n=100000):
    r=ga.run_report(RunReportRequest(property=PROP,date_ranges=[DateRange(start_date=str(s),end_date=str(e))],
        dimensions=[Dimension(name=d) for d in dims],metrics=[Metric(name=m) for m in mets],limit=n))
    return [([v.value for v in q.dimension_values],[v.value for v in q.metric_values]) for q in r.rows]
E=TODAY-datetime.timedelta(days=1); S=E-datetime.timedelta(days=13)

print("### 1. (not set)·직접 유입 정체 — 랜딩·기기·일자")
for d,m in sorted(g4(["date","sessionSource","landingPage"],["sessions"],S,E),key=lambda z:-int(z[1][0]))[:20]:
    if d[1] in ("(not set)","(direct)","(data not available)"):
        print("- %s | %s | %s | %s" % (d[0],d[1],(d[2] or "/")[:40],m[0]))

print()
print("### 2. 오일장 계열 일자별 세션 (14일)")
day=collections.defaultdict(int); day2=collections.defaultdict(int)
for d,m in g4(["date","landingPage"],["sessions"],S,E):
    p=d[1] or "/"
    if p.startswith("/jangteo"): day[d[0]]+=int(m[0])
    if p.startswith("/2026"): day2[d[0]]+=int(m[0])
for k in sorted(day|day2 if hasattr(dict,'__or__') else set(list(day)+list(day2))):
    print("- %s 오일장 %d · 월별 %d" % (k, day.get(k,0), day2.get(k,0)))

print()
print("### 3. GSC 노출 급감 원인 — 9/12~14 vs 9/16~18 페이지·검색어")
sc=build("searchconsole","v1",credentials=cred,cache_discovery=False)
def q(dims,s,e):
    out,off=[],0
    while True:
        r=sc.searchanalytics().query(siteUrl=SITE,body={"startDate":str(s),"endDate":str(e),
            "dimensions":dims,"rowLimit":25000,"startRow":off}).execute().get("rows",[])
        if not r: break
        out+=r; off+=len(r)
        if len(r)<25000: break
    return out
def cnt(rows,idx=0):
    c=collections.Counter()
    for r in rows: c[r["keys"][idx]]+=r["impressions"]
    return c
a=cnt(q(["page"],"2026-09-12","2026-09-14")); b=cnt(q(["page"],"2026-09-16","2026-09-18"))
print("[페이지] 노출 감소 상위")
for k in sorted(set(a)|set(b), key=lambda k:-(a.get(k,0)-b.get(k,0)))[:12]:
    print("- %-60s %d → %d" % (k.replace("https://chukjemoa.co.kr","")[:60], a.get(k,0), b.get(k,0)))
qa=cnt(q(["query"],"2026-09-12","2026-09-14")); qb=cnt(q(["query"],"2026-09-16","2026-09-18"))
print("[검색어] 노출 감소 상위")
for k in sorted(set(qa)|set(qb), key=lambda k:-(qa.get(k,0)-qb.get(k,0)))[:12]:
    print("- %-40s %d → %d" % (k[:40], qa.get(k,0), qb.get(k,0)))
print("[검색어] 노출 증가 상위")
for k in sorted(set(qa)|set(qb), key=lambda k:(qa.get(k,0)-qb.get(k,0)))[:8]:
    print("- %-40s %d → %d" % (k[:40], qa.get(k,0), qb.get(k,0)))
