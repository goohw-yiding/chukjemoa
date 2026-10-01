# -*- coding: utf-8 -*-
import re, urllib.request, collections, datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build
H={"User-Agent":"Mozilla/5.0"}
def get(u): return urllib.request.urlopen(urllib.request.Request(u,headers=H)).read().decode("utf-8","ignore")
for sm in ["sitemap-lang.xml","sitemap.xml"]:
    locs=re.findall(r"<loc>(.*?)</loc>",get("https://chukjemoa.co.kr/"+sm))
    c=collections.Counter()
    for u in locs:
        p=u.replace("https://chukjemoa.co.kr","")
        m=re.match(r"/(en|ja|tw|zh|es)/(festival/)?",p)
        c[(m.group(0) if m else "ko")]+=1
    print(sm,len(locs),dict(c))
for u in ["https://chukjemoa.co.kr/en/festival/cheonan-world-dance-festival/","https://chukjemoa.co.kr/ja/festival/gangneungkeopichukje/","https://chukjemoa.co.kr/en/festival/nonsan-strawberry-festival/","https://chukjemoa.co.kr/ja/festival/jeongseonarirangje/"]:
    h=get(u); print(u[-45:], "noindex" in h.lower(), re.findall(r'<meta[^>]*robots[^>]*>',h)[:1])
KEY=r"C:\dev\traffic-dashboard\sa-key.json"; SITE="https://chukjemoa.co.kr/"
cred=service_account.Credentials.from_service_account_file(KEY,scopes=["https://www.googleapis.com/auth/webmasters"])
sc=build("searchconsole","v1",credentials=cred,cache_discovery=False)
rows=sc.searchanalytics().query(siteUrl=SITE,body={"startDate":"2026-09-01","endDate":str(datetime.date.today()-datetime.timedelta(days=3)),"dimensions":["date","page"],"rowLimit":25000}).execute().get("rows",[])
d=collections.Counter()
for r in rows:
    if not re.search(r"chukjemoa.co.kr/(en|ja|tw|zh|es)/",r["keys"][1]): d[r["keys"][0]]+=r["clicks"]
print(" ".join(f"{k[5:]}:{int(v)}" for k,v in sorted(d.items())))
