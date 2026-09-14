# -*- coding: utf-8 -*-
"""외국인 노출이 «어느 페이지»에 붙나 — 처방이 갈리는 지점이다.
   영어 쿼리에 한국어 페이지가 뜨는 것이면 → 영어 페이지를 만들어야 한다.
   영어 페이지가 뜨는데 안 눌리는 것이면 → 제목·사이트명을 고쳐야 한다.
   둘은 완전히 다른 처방이라 반드시 갈라 봐야 한다.
"""
import datetime, sys, collections
from google.oauth2 import service_account
from googleapiclient.discovery import build
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)

end = datetime.date.today() - datetime.timedelta(days=3)
start = end - datetime.timedelta(days=89)

def q(dims, filters=None, n=25000):
    out, row = [], 0
    while row < n:
        body = {"startDate": str(start), "endDate": str(end),
                "dimensions": dims, "rowLimit": 1000, "startRow": row}
        if filters: body["dimensionFilterGroups"] = [{"filters": filters}]
        b = sc.searchanalytics().query(siteUrl=SITE, body=body).execute()
        r = b.get("rows", [])
        out += r
        if len(r) < 1000: break
        row += 1000
    return out

print("기간: %s ~ %s (90일)\n" % (start, end))

def lang_of(u):
    p = u.replace("https://chukjemoa.co.kr", "")
    for L in ("en", "ja", "zh", "tw", "es"):
        if p.startswith("/" + L + "/"): return L
    return "ko"

for ctry in ("usa", "jpn", "twn", "hkg", "sgp", "gbr"):
    rows = q(["page"], [{"dimension": "country", "operator": "equals", "expression": ctry}])
    if not rows: continue
    ci = sum(r["impressions"] for r in rows); cc = sum(r["clicks"] for r in rows)
    by = collections.Counter(); byc = collections.Counter()
    for r in rows:
        L = lang_of(r["keys"][0]); by[L] += r["impressions"]; byc[L] += r["clicks"]
    print("■ %s — 노출 %d · 클릭 %d · CTR %.2f%%" % (ctry.upper(), ci, cc, 100*cc/max(1,ci)))
    print("   언어별 노출: " + " · ".join(
        "%s %d(%.0f%%)%s" % (k, v, 100*v/ci, "" if not byc[k] else " 클릭%d" % byc[k])
        for k, v in by.most_common()))
    top = sorted(rows, key=lambda r: -r["impressions"])[:6]
    for r in top:
        print("     %-40s 노출%5d 클릭%3d %5.1f위" % (
            r["keys"][0].replace("https://chukjemoa.co.kr", "")[:40],
            r["impressions"], r["clicks"], r["position"]))
    print()

# 영어권 쿼리가 «한국어 페이지»에 붙는지 직접 본다
print("■ USA 검색어 상위 20 (어떤 말로 찾아오나)")
rows = q(["query", "page"], [{"dimension": "country", "operator": "equals", "expression": "usa"}])
rows.sort(key=lambda r: -r["impressions"])
for r in rows[:20]:
    qq, pg = r["keys"]
    print("   %-38s → %-26s 노출%4d 클릭%2d %5.1f위 [%s]" % (
        qq[:38], pg.replace("https://chukjemoa.co.kr", "")[:26],
        r["impressions"], r["clicks"], r["position"], lang_of(pg)))
