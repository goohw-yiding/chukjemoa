# -*- coding: utf-8 -*-
"""2026-09-24 — 일본어 작업 성과 총점검 (GSC·GA4·색인)"""
import io, time, datetime, collections
from google.oauth2 import service_account
from googleapiclient.discovery import build
KEY=r"C:\dev\traffic-dashboard\sa-key.json"; SITE="https://chukjemoa.co.kr/"; PROP="properties/545108776"
O=[]; p=O.append
cred=service_account.Credentials.from_service_account_file(KEY,scopes=["https://www.googleapis.com/auth/webmasters"])
sc=build("searchconsole","v1",credentials=cred,cache_discovery=False)
def q(s,e,dims,n=25000,filt=None):
    b={"startDate":s,"endDate":e,"dimensions":dims,"rowLimit":n,"type":"web"}
    if filt: b["dimensionFilterGroups"]=[{"filters":filt}]
    return sc.searchanalytics().query(siteUrl=SITE,body=b).execute().get("rows",[])
JA=[{"dimension":"page","operator":"contains","expression":"/ja/"}]
p("=== A) GSC 주별 /ja/ vs 사이트 전체 (8/3~9/20, 최근 3일 제외) ===")
rows=q("2026-08-03","2026-09-20",["date"],filt=JA); allr=q("2026-08-03","2026-09-20",["date"])
wk=collections.defaultdict(lambda:[0,0,0,0])
for r in rows:
    d=datetime.date.fromisoformat(r["keys"][0]); w=d-datetime.timedelta(days=d.weekday())
    wk[w][0]+=r["impressions"]; wk[w][1]+=r["clicks"]
for r in allr:
    d=datetime.date.fromisoformat(r["keys"][0]); w=d-datetime.timedelta(days=d.weekday())
    wk[w][2]+=r["impressions"]; wk[w][3]+=r["clicks"]
for w in sorted(wk):
    a=wk[w]; p("%s주  /ja/ 노출 %5d 클릭 %3d | 전체 노출 %6d 클릭 %4d | /ja/ 노출비중 %.1f%%"%(w,a[0],a[1],a[2],a[3],100*a[0]/max(a[2],1)))
p("")
p("=== B) 최근 28일(8/24~9/20) /ja/ 페이지별 상위 25 ===")
pr=q("2026-08-24","2026-09-20",["page"],filt=JA)
tot=[0,0]
for r in pr: tot[0]+=r["impressions"]; tot[1]+=r["clicks"]
p("노출 받은 /ja/ URL 수: %d · 합계 노출 %d · 클릭 %d"%(len(pr),tot[0],tot[1]))
for r in sorted(pr,key=lambda r:-r["impressions"])[:25]:
    p("  %-50s 노출 %5d 클릭 %3d CTR %4.1f%% 순위 %5.1f"%(r["keys"][0].replace(SITE,"/"),r["impressions"],r["clicks"],100*r["ctr"],r["position"]))
# 유형별 합계
typ=collections.defaultdict(lambda:[0,0,0])
for r in pr:
    u=r["keys"][0].replace(SITE,"/"); seg=u.split("/")[2] if len(u.split("/"))>2 and u.split("/")[2] else "(home)"
    typ[seg][0]+=r["impressions"]; typ[seg][1]+=r["clicks"]; typ[seg][2]+=1
p("-- 유형별(두 번째 경로)")
for k,v in sorted(typ.items(),key=lambda x:-x[1][0])[:15]:
    p("  %-14s URL %3d 노출 %5d 클릭 %3d"%(k,v[2],v[0],v[1]))
p("")
p("=== C) 국가별 /ja/ (28일) ===")
for r in sorted(q("2026-08-24","2026-09-20",["country"],filt=JA),key=lambda r:-r["impressions"])[:8]:
    p("  %-5s 노출 %5d 클릭 %3d 순위 %.1f"%(r["keys"][0],r["impressions"],r["clicks"],r["position"]))
p("")
p("=== D) /ja/ 검색어 상위 20 (28일) ===")
for r in sorted(q("2026-08-24","2026-09-20",["query"],filt=JA),key=lambda r:-r["impressions"])[:20]:
    p("  %-36s 노출 %4d 클릭 %2d 순위 %.1f"%(r["keys"][0][:36],r["impressions"],r["clicks"],r["position"]))
p("")
p("=== E) 색인 상태 (핵심 페이지) ===")
for u in ["ja/","ja/closed/","ja/closed/chuseok/","ja/closed/hangeul-day/","ja/closed/gaecheonjeol/","ja/busy/","ja/palace/","ja/daytrip/","ja/places/","ja/chuseok/","ja/jangteo/","ja/calendar/"]:
    try:
        s=sc.urlInspection().index().inspect(body={"inspectionUrl":SITE+u,"siteUrl":SITE}).execute()["inspectionResult"]["indexStatusResult"]
        p("  %-26s %-8s %-40s 크롤 %s"%(u,s.get("verdict"),s.get("coverageState","")[:40],(s.get("lastCrawlTime") or "-")[:10]))
    except Exception as e: p("  %s ERR %s"%(u,str(e)[:80]))
    time.sleep(0.5)
p("")
p("=== F) GA4 ===")
try:
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import RunReportRequest,DateRange,Dimension,Metric,Filter,FilterExpression
    g=BetaAnalyticsDataClient(credentials=service_account.Credentials.from_service_account_file(KEY,scopes=["https://www.googleapis.com/auth/analytics.readonly"]))
    jf=FilterExpression(filter=Filter(field_name="landingPage",string_filter=Filter.StringFilter(match_type=Filter.StringFilter.MatchType.BEGINS_WITH,value="/ja/")))
    pf=FilterExpression(filter=Filter(field_name="pagePath",string_filter=Filter.StringFilter(match_type=Filter.StringFilter.MatchType.BEGINS_WITH,value="/ja/")))
    def rep(dims,mets,s,e,n=50,f=None):
        r=g.run_report(RunReportRequest(property=PROP,date_ranges=[DateRange(start_date=s,end_date=e)],dimensions=[Dimension(name=d) for d in dims],metrics=[Metric(name=m) for m in mets],dimension_filter=f,limit=n))
        return [([d.value for d in x.dimension_values],[m.value for m in x.metric_values]) for x in r.rows]
    p("-- 주별: /ja/ 랜딩 세션 · 일본 국가 세션")
    wkj=collections.defaultdict(lambda:[0,0])
    for d,m in rep(["date"],["sessions"],"2026-08-03","2026-09-23",200,jf):
        dd=datetime.date(int(d[0][:4]),int(d[0][4:6]),int(d[0][6:])); wkj[dd-datetime.timedelta(days=dd.weekday())][0]+=int(m[0])
    jc=FilterExpression(filter=Filter(field_name="country",string_filter=Filter.StringFilter(value="Japan")))
    for d,m in rep(["date"],["sessions"],"2026-08-03","2026-09-23",200,jc):
        dd=datetime.date(int(d[0][:4]),int(d[0][4:6]),int(d[0][6:])); wkj[dd-datetime.timedelta(days=dd.weekday())][1]+=int(m[0])
    for w in sorted(wkj): p("  %s주  /ja/랜딩 세션 %4d · 일본 접속 세션 %4d"%(w,wkj[w][0],wkj[w][1]))
    p("-- /ja/ 랜딩 유입원 (9/1~9/23)")
    for d,m in sorted(rep(["sessionSource","sessionMedium"],["sessions","engagementRate"],"2026-09-01","2026-09-23",20,jf),key=lambda x:-int(x[1][0])):
        p("  %-28s 세션 %4s 참여율 %.0f%%"%(d[0]+"/"+d[1],m[0],100*float(m[1])))
    p("-- /ja/ 페이지 이벤트 (9/1~9/23)")
    for d,m in sorted(rep(["eventName"],["eventCount"],"2026-09-01","2026-09-23",40,pf),key=lambda x:-int(x[1][0])):
        p("  %-28s %s"%(d[0],m[0]))
    p("-- 인스타 유입 (9/21~9/23, 사이트 전체)")
    ig=FilterExpression(filter=Filter(field_name="sessionSource",string_filter=Filter.StringFilter(match_type=Filter.StringFilter.MatchType.CONTAINS,value="instagram")))
    rr=rep(["sessionSource","landingPage"],["sessions"],"2026-09-21","2026-09-23",20,ig)
    if not rr: p("  (0)")
    for d,m in rr: p("  %s %s 세션 %s"%(d[0],d[1],m[0]))
except Exception as e: p("GA4 ERR "+str(e)[:300])
io.open("_ja_review.txt","w",encoding="utf-8").write("\n".join(O)); print("done",len(O))
