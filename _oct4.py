# -*- coding: utf-8 -*-
# 「10월 페이지 타이틀·설명이 아직 9월 기준」이 사실인지 오늘 숫자로 다시 본다.
import datetime, re, io
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

def q(s, e, dims, n=300, page=None):
    body = {"startDate": str(s), "endDate": str(e), "dimensions": dims, "rowLimit": n}
    if page:
        body["dimensionFilterGroups"] = [{"filters": [
            {"dimension": "page", "operator": "equals", "expression": page}]}]
    return sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])

end = datetime.date.today() - datetime.timedelta(days=2)
w1s, w1e = end - datetime.timedelta(days=6), end
w2s, w2e = w1s - datetime.timedelta(days=7), w1s - datetime.timedelta(days=1)
print(f"주간  이번 {w1s}~{w1e}  vs  지난 {w2s}~{w2e}")
for lab, (s, e) in [("이번주", (w1s, w1e)), ("지난주", (w2s, w2e))]:
    r = q(s, e, [])
    if r:
        x = r[0]
        print(f"  {lab}: 클릭 {x['clicks']:.0f} · 노출 {x['impressions']:.0f} · CTR {x['ctr']*100:.2f}%")

P = "https://chukjemoa.co.kr/2026-10/"
rows = q(w1s, w1e, ["query"], 300, P)
rows.sort(key=lambda r: -r["impressions"])
ti = sum(r["impressions"] for r in rows); tc = sum(r["clicks"] for r in rows)
print(f"\n/2026-10/ 검색어로 잡힌 분: 노출 {ti:.0f} 클릭 {tc:.0f}")
for r in rows[:12]:
    print(f"  {r['impressions']:>5.0f}노출 {r['clicks']:>3.0f}클릭 CTR {r['ctr']*100:>5.2f}% "
          f"평균{r['position']:>5.1f}위  {r['keys'][0]}")

pg = [r for r in q(w1s, w1e, ["page"], 5000) if "/2026-10/" in r["keys"][0] or "/2026-09/" in r["keys"][0]]
print("\n페이지 합계:")
for r in sorted(pg, key=lambda r: -r["impressions"])[:6]:
    print(f"  {r['impressions']:>6.0f}노출 {r['clicks']:>4.0f}클릭 CTR {r['ctr']*100:>5.2f}% "
          f"평균{r['position']:>5.1f}위  {r['keys'][0].replace('https://chukjemoa.co.kr','')}")

# 지금 실제 타이틀·설명 (배포본)
import urllib.request
for u in ["https://chukjemoa.co.kr/2026-10/", "https://chukjemoa.co.kr/2026-11/"]:
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 selfcheck"})
        h = urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "replace")
        t = (re.search(r"<title>(.*?)</title>", h, re.S) or [None, "(없음)"])[1]
        d = (re.search(r'<meta name="description" content="(.*?)"', h, re.S) or [None, "(없음)"])[1]
        print(f"\n[라이브 {u}]\n  title: {t}\n  desc : {d[:160]}")
    except Exception as e:
        print(u, "실패", str(e)[:80])
