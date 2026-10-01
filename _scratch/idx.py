# -*- coding: utf-8 -*-
import datetime, re, json, urllib.request, collections, time, random
from concurrent.futures import ThreadPoolExecutor
from google.oauth2 import service_account
from googleapiclient.discovery import build
KEY=r"C:\dev\traffic-dashboard\sa-key.json"; SITE="https://chukjemoa.co.kr/"
cred=service_account.Credentials.from_service_account_file(KEY,scopes=["https://www.googleapis.com/auth/webmasters"])
sc=build("searchconsole","v1",credentials=cred,cache_discovery=False)
print("== sitemaps")
for m in sc.sitemaps().list(siteUrl=SITE).execute().get("sitemap",[]):
    cnt=sum(int(c.get("submitted",0)) for c in m.get("contents",[]))
    print(m["path"],(m.get("lastDownloaded") or "")[:10],(m.get("lastSubmitted") or "")[:10],cnt,"err",m.get("errors",0),"warn",m.get("warnings",0))
def pq(s,e,dims,n=25000,filt=None):
    b={"startDate":str(s),"endDate":str(e),"dimensions":dims,"rowLimit":n}
    if filt: b["dimensionFilterGroups"]=[{"filters":filt}]
    return sc.searchanalytics().query(siteUrl=SITE,body=b).execute().get("rows",[])
end=datetime.date.today()-datetime.timedelta(days=3)
def bucket(u):
    p=u.replace("https://chukjemoa.co.kr","")
    for k in ["/en/festival/","/ja/festival/","/tw/","/zh/","/es/","/en/","/ja/"]:
        if p.startswith(k): return k
    return "ko"
print("== weekly page buckets (pages w/ impressions, clicks)")
for w in range(4):
    e=end-datetime.timedelta(days=7*w); s=e-datetime.timedelta(days=6)
    rows=pq(s,e,["page"])
    pages=collections.Counter(); clk=collections.Counter(); imp=collections.Counter()
    for r in rows:
        b=bucket(r["keys"][0]); pages[b]+=1; clk[b]+=r["clicks"]; imp[b]+=r["impressions"]
    print(s,e,{k:(pages[k],int(clk[k]),int(imp[k])) for k in ["ko","/en/festival/","/ja/festival/","/tw/","/zh/","/es/"]})
# samples: ended en/ja festival pages not in sitemap
lang_sm={}
for l in ["en","ja"]:
    try:
        x=urllib.request.urlopen(urllib.request.Request(SITE+"sitemap-%s.xml"%l,headers={"User-Agent":"Mozilla/5.0"})).read().decode()
        lang_sm[l]=set(re.findall(r"<loc>(.*?)</loc>",x))
    except Exception as ex: print("sm",l,ex); lang_sm[l]=set()
# candidates: pages with impressions in older period (before 9/17)
old=pq(datetime.date(2026,8,20),datetime.date(2026,9,16),["page"])
cand={"en":[],"ja":[]}
for r in old:
    u=r["keys"][0]
    for l in ["en","ja"]:
        if u.startswith(SITE+l+"/festival/") and u not in lang_sm[l]: cand[l].append(u)
print("cand",{k:len(v) for k,v in cand.items()}, "smsize",{k:len(v) for k,v in lang_sm.items()})
random.seed(1)
sample=random.sample(cand["en"],min(10,len(cand["en"])))+random.sample(cand["ja"],min(10,len(cand["ja"])))
def check(u):
    svc=build("searchconsole","v1",credentials=cred,cache_discovery=False)
    for _ in range(3):
        try:
            r=svc.urlInspection().index().inspect(body={"inspectionUrl":u,"siteUrl":SITE,"languageCode":"ko"}).execute()
            s=r.get("inspectionResult",{}).get("indexStatusResult",{})
            return (u,s.get("coverageState","?"),s.get("indexingState","?"),(s.get("lastCrawlTime") or "")[:10])
        except Exception as e:
            if "429" in str(e): time.sleep(6); continue
            return (u,"ERR "+str(e)[:60],"","")
with ThreadPoolExecutor(8) as ex: out=list(ex.map(check,sample))
for o in out: print(o)
print(collections.Counter(o[1] for o in out))
