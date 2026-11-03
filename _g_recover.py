# -*- coding: utf-8 -*-
"""구글 회복안 근거: 사이트맵 구성 · 급락 전후 살아남은 페이지 · 묶음별 글자수"""
import sys, re, os, collections, urllib.request
sys.stdout.reconfigure(encoding="utf-8")
from google.oauth2 import service_account
from googleapiclient.discovery import build
cred = service_account.Credentials.from_service_account_file(r"C:\dev\traffic-dashboard\sa-key.json", scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)
SITE = "https://chukjemoa.co.kr/"
def grp(u):
    p = u.replace("https://chukjemoa.co.kr", "")
    m = re.match(r"^/(en|ja|zh|tw|es)/", p)
    if m: return "외국어-" + m.group(1)
    for k in ["festival", "jangteo", "blog", "seoul", "busan", "jeju", "city", "maple", "winter", "tide", "course", "trails", "walk", "pet", "accessible", "indoor", "museum", "cafe", "hot", "mountains", "onsen", "valley", "flower", "healing"]:
        if p.startswith("/" + k): return k
    if re.match(r"^/20\d\d-\d\d", p): return "월별"
    if p == "/": return "홈"
    return "기타"
# 1) 사이트맵 구성 (색인 대상)
xml = open(r"C:\dev\chukjemoa\sitemap.xml", encoding="utf-8").read()
locs = re.findall(r"<loc>(.*?)</loc>", xml)
subs = [l for l in locs if l.endswith(".xml")]
urls = []
if subs:
    for s in subs:
        f = os.path.join(r"C:\dev\chukjemoa", s.split("/")[-1])
        if os.path.exists(f): urls += re.findall(r"<loc>(.*?)</loc>", open(f, encoding="utf-8").read())
else:
    urls = locs
c = collections.Counter(grp(u) for u in urls)
print("사이트맵 URL", len(urls)); print(" ", c.most_common())
# 2) 페이지별 노출 전(10/9~22) 후(10/23~11/1)
def q(s, e):
    r = sc.searchanalytics().query(siteUrl=SITE, body={"startDate": s, "endDate": e, "dimensions": ["page"], "rowLimit": 5000}).execute().get("rows", [])
    return {x["keys"][0]: (x["impressions"], x["clicks"], x["position"]) for x in r}
pre, post = q("2026-10-09", "2026-10-22"), q("2026-10-23", "2026-11-01")
print("노출 있는 페이지 수: 전", len(pre), "후", len(post))
gp, gq = collections.Counter(), collections.Counter()
for u, v in pre.items(): gp[grp(u)] += v[0]
for u, v in post.items(): gq[grp(u)] += v[0]
print("묶음별 노출 전→후:")
for k, v in gp.most_common(18): print(f"  {k:12s} {int(v):6d} → {int(gq.get(k,0)):5d}")
print("급락 후에도 노출 상위 15:")
for u, v in sorted(post.items(), key=lambda kv: -kv[1][0])[:15]:
    print(f"  {int(v[0]):4d} 클릭{int(v[1])} {v[2]:.1f}위 {u.replace('https://chukjemoa.co.kr','')}  (전 {int(pre.get(u,(0,))[0])})")
# 3) 검색어: 전후
def qq(s, e):
    r = sc.searchanalytics().query(siteUrl=SITE, body={"startDate": s, "endDate": e, "dimensions": ["query"], "rowLimit": 30}).execute().get("rows", [])
    return [(x["keys"][0], int(x["impressions"]), int(x["clicks"]), round(x["position"], 1)) for x in r]
print("전 검색어 상위:", qq("2026-10-09", "2026-10-22")[:15])
print("후 검색어 상위:", qq("2026-10-23", "2026-11-01")[:15])
