# -*- coding: utf-8 -*-
import datetime, re, collections, urllib.request, json
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

end = datetime.date.today() - datetime.timedelta(days=2)
start = end - datetime.timedelta(days=89)
rows = sc.searchanalytics().query(siteUrl=SITE, body={
    "startDate": str(start), "endDate": str(end),
    "dimensions": ["page"], "rowLimit": 25000}).execute().get("rows", [])
print("period", start, end, "pages_with_impressions", len(rows))

LANG = re.compile(r"^/([a-z]{2}(?:-[a-z]{2})?)/")
def pref(u):
    p = u.replace("https://chukjemoa.co.kr", "")
    m = LANG.match(p)
    return m.group(1) if m else "ko"

agg = collections.defaultdict(lambda: [0,0,0])
pagedata = {}
for r in rows:
    u = r["keys"][0]; k = pref(u)
    a = agg[k]; a[0] += r["clicks"]; a[1] += r["impressions"]; a[2] += 1
    pagedata[u] = (r["clicks"], r["impressions"])

# sitemap counts
try:
    sm = urllib.request.urlopen(SITE + "sitemap.xml").read().decode("utf-8")
    locs = re.findall(r"<loc>(.*?)</loc>", sm)
    if locs and locs[0].endswith(".xml"):
        allu = []
        for s2 in locs:
            allu += re.findall(r"<loc>(.*?)</loc>", urllib.request.urlopen(s2).read().decode("utf-8"))
        locs = allu
except Exception as e:
    locs = []; print("sitemap err", e)
smcnt = collections.Counter(pref(u) for u in locs)
print("sitemap_total", len(locs))

print("\nprefix | sitemap_pages | pages_with_impr | clicks | impressions")
for k, v in sorted(agg.items(), key=lambda x: -x[1][0]):
    print(f"{k:8} | {smcnt.get(k,0):5} | {v[2]:5} | {v[0]:6} | {v[1]:7}")
for k in smcnt:
    if k not in agg:
        print(f"{k:8} | {smcnt[k]:5} | {0:5} | {0:6} | {0:7}   <= 노출 0")

json.dump({"agg":{k:v for k,v in agg.items()}, "sitemap":dict(smcnt),
           "pages":{k:list(v) for k,v in pagedata.items()}},
          open(r"C:\dev\chukjemoa\_gsc_lang.json","w",encoding="utf-8"), ensure_ascii=False)
