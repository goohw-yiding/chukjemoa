# -*- coding: utf-8 -*-
"""9/21 — /ja/closed/ 계열 검색어·CTR 점검 (한글날 2주 전 제목 점검용)"""
import io, collections
from google.oauth2 import service_account
from googleapiclient.discovery import build
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)
O=[]
def q(s,e,dims,n=1000):
    return sc.searchanalytics().query(siteUrl=SITE, body={"startDate":s,"endDate":e,"dimensions":dims,"rowLimit":n,"type":"web"}).execute().get("rows",[])
S,E="2026-08-24","2026-09-20"
O.append("=== 페이지별 (%s~%s) /ja/closed/ + /ja/busy/"%(S,E))
for r in sorted(q(S,E,["page"]),key=lambda r:-r["impressions"]):
    u=r["keys"][0]
    if "/ja/closed" in u or "/ja/busy" in u:
        O.append("%-55s 노출 %5d 클릭 %3d CTR %.1f%% 순위 %.1f"%(u.replace(SITE,"/"),r["impressions"],r["clicks"],100*r["ctr"],r["position"]))
O.append("")
O.append("=== 검색어 (페이지×검색어, 노출순 상위)")
rows=[r for r in q(S,E,["page","query"],5000) if "/ja/closed" in r["keys"][0] or "/ja/busy" in r["keys"][0]]
for r in sorted(rows,key=lambda r:-r["impressions"])[:45]:
    O.append("%-32s %-34s 노출 %4d 클릭 %2d 순위 %.1f"%(r["keys"][0].replace(SITE,"/")[:32],r["keys"][1][:34],r["impressions"],r["clicks"],r["position"]))
O.append("")
O.append("=== 한글날 관련 검색어 (사이트 전체)")
for r in sorted(q(S,E,["query","page"],5000),key=lambda r:-r["impressions"]):
    k=r["keys"][0]
    if any(w in k for w in ["ハングル","한글날","hangul","hangeul","10月9","10月の韓国","連休"]):
        O.append("%-36s %-40s 노출 %4d 클릭 %2d 순위 %.1f"%(k[:36],r["keys"][1].replace(SITE,"/")[:40],r["impressions"],r["clicks"],r["position"]))
io.open("_ja_closed_q.txt","w",encoding="utf-8").write("\n".join(O))
print("done",len(O))
