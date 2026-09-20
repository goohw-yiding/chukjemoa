# -*- coding: utf-8 -*-
# 축제모아 성장 기울기 진단 — GA4 + GSC
import datetime, collections, json, sys
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

END = TODAY - datetime.timedelta(days=1)
START = END - datetime.timedelta(days=55)

def chan(src, med):
    s = (src or "").lower(); m = (med or "").lower()
    if "naver" in s: return "네이버"
    if "google" in s and "organic" in m: return "구글"
    if any(k in s for k in ["chatgpt","perplexity","gemini","copilot","claude","openai"]): return "AI"
    if s in ("(direct)","direct") or m == "(none)": return "직접"
    if "bing" in s or "daum" in s: return "기타검색"
    return "기타"

print("### A. 일자별 세션 (채널)")
day = collections.defaultdict(collections.Counter)
for d, m in g4(["date","sessionSource","sessionMedium"], ["sessions"], START, END):
    day[d[0]][chan(d[1], d[2])] += int(m[0])
keys = sorted(day)
# 주 단위(7일)로 묶어 기울기
weeks = []
for i in range(0, len(keys)//7*7, 7):
    blk = keys[i:i+7]
    c = collections.Counter()
    for k in blk:
        c.update(day[k])
    weeks.append((blk[0], blk[-1], c, sum(c.values())))
print("| 주 | 전체 | 네이버 | 구글 | 직접 | AI | 기타 |")
for a, b, c, t in weeks:
    print("| %s~%s | %d | %d | %d | %d | %d | %d |" % (a[4:], b[4:], t, c["네이버"], c["구글"], c["직접"], c["AI"], c["기타검색"]+c["기타"]))

print()
print("### B. 랜딩 묶음별 세션 (주 단위)")
GROUPS = [("오일장허브","/jangteo"),("월별","/2026"),("축제상세","/festival"),("블로그","/blog"),
          ("외국어",("/en","/ja","/zh","/tw","/es")),("홈","/")]
def grp(p):
    if p.startswith("/jangteo"):
        seg=[s for s in p.split("/") if s]
        if len(seg)==1: return "오일장 허브"
        if len(seg)==2 and "-" in seg[1]: return "오일장 끝자리"
        return "오일장 지역"
    for n,pref in GROUPS[1:]:
        if p.startswith(pref if isinstance(pref,tuple) else (pref,)): return n
    if p=="/" : return "홈"
    return "그 외"
lw = collections.defaultdict(collections.Counter)
for d, m in g4(["date","landingPage"], ["sessions"], START, END):
    lw[d[0]][grp(d[1] or "/")] += int(m[0])
names = ["오일장 허브","오일장 지역","오일장 끝자리","월별","축제상세","블로그","외국어","홈","그 외"]
print("| 주 | " + " | ".join(names) + " |")
for i in range(0, len(keys)//7*7, 7):
    blk = keys[i:i+7]; c = collections.Counter()
    for k in blk: c.update(lw[k])
    print("| %s~%s | " % (blk[0][4:], blk[-1][4:]) + " | ".join(str(c[n]) for n in names) + " |")

print()
print("### C. 서치콘솔 28일 vs 직전 28일 (페이지 묶음)")
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)
def q(dims, rng, limit=25000):
    out, off = [], 0
    while True:
        body = {"startDate": str(rng[0]), "endDate": str(rng[1]), "dimensions": dims,
                "rowLimit": limit, "startRow": off}
        r = sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])
        if not r: break
        out += r; off += len(r)
        if len(r) < limit: break
    return out
gend = TODAY - datetime.timedelta(days=3)
cur = (gend - datetime.timedelta(days=27), gend)
prev = (cur[0] - datetime.timedelta(days=28), cur[0] - datetime.timedelta(days=1))
def pages(rng):
    c = collections.Counter(); i = collections.Counter()
    for r in q(["page"], rng):
        u = r["keys"][0]
        if "#" in u: continue
        g = grp(u.replace("https://chukjemoa.co.kr",""))
        c[g] += r["clicks"]; i[g] += r["impressions"]
    return c, i
c1, i1 = pages(cur); c2, i2 = pages(prev)
print("기간: %s~%s vs %s~%s" % (cur[0], cur[1], prev[0], prev[1]))
print("| 묶음 | 클릭 | 지난 | 노출 | 지난 |")
for n in names:
    if not (i1[n] or i2[n]): continue
    print("| %s | %d | %d | %d | %d |" % (n, c1[n], c2[n], i1[n], i2[n]))

print()
print("### D. 검색어 — 이번 28일 상위 25 (클릭)")
qq = sorted(q(["query"], cur), key=lambda z: -z["clicks"])[:25]
for x in qq:
    print("- %s | 클릭 %d · 노출 %d · %.1f위 · CTR %.1f%%" % (x["keys"][0], x["clicks"], x["impressions"], x["position"], 100*x["ctr"]))

print()
print("### E. 노출 큰데 8~20위 (기회)")
op = [x for x in q(["query"], cur) if x["impressions"] >= 80 and 8 <= x["position"] <= 20]
op.sort(key=lambda z: -z["impressions"])
for x in op[:20]:
    print("- %s | 노출 %d · 클릭 %d · %.1f위" % (x["keys"][0], x["impressions"], x["clicks"], x["position"]))
