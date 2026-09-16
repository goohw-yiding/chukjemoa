# -*- coding: utf-8 -*-
"""/ja/ 노출이 9/8 이후 왜 꺾였나 — 검색어로 확인한다. 추측하지 않는다."""
import io, datetime, collections
from google.oauth2 import service_account
from googleapiclient.discovery import build
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)
OUT = []
def p(s=""): OUT.append(s)

def q(start, end, dims, n=500):
    return sc.searchanalytics().query(siteUrl=SITE, body={
        "startDate": start, "endDate": end, "dimensions": dims,
        "rowLimit": n, "type": "web"}).execute().get("rows", [])

# 앞구간 vs 뒷구간 — /ja/ 검색어
for label, s, e in [("A 9/02~9/08 (노출 많던 때)", "2026-09-02", "2026-09-08"),
                    ("B 9/09~9/15 (꺾인 뒤)", "2026-09-09", "2026-09-15")]:
    rows = [r for r in q(s, e, ["page", "query"]) if "/ja/" in r["keys"][0]]
    tot = sum(r["impressions"] for r in rows)
    p("=== %s — /ja/ 노출 %d" % (label, tot))
    agg = collections.defaultdict(int)
    for r in rows:
        agg[r["keys"][1]] += r["impressions"]
    for kw, imp in sorted(agg.items(), key=lambda x: -x[1])[:12]:
        p("   %-38s 노출 %d" % (kw[:38], imp))
    p("")

# 사이트 전체도 같은 기간으로 — 일본어만 꺾인 건지 전체가 꺾인 건지
p("=== 사이트 전체 비교 (일본어만의 문제인지 가른다)")
for label, s, e in [("A 9/02~9/08", "2026-09-02", "2026-09-08"),
                    ("B 9/09~9/15", "2026-09-09", "2026-09-15")]:
    r = q(s, e, [])
    if r:
        p("   %s  노출 %d · 클릭 %d" % (label, r[0]["impressions"], r[0]["clicks"]))

# 국가별 — 일본에서 오는 게 줄었나
p("")
p("=== 일본(jpn) 노출 — 사이트 전체 기준")
for label, s, e in [("A 9/02~9/08", "2026-09-02", "2026-09-08"),
                    ("B 9/09~9/15", "2026-09-09", "2026-09-15")]:
    rows = q(s, e, ["country"], 300)
    jp = [r for r in rows if r["keys"][0] == "jpn"]
    p("   %s  일본 노출 %d · 클릭 %d" % (label, jp[0]["impressions"] if jp else 0, jp[0]["clicks"] if jp else 0))

io.open(r"C:\dev\chukjemoa\_ja_q.txt", "w", encoding="utf-8").write("\n".join(OUT))
print("done")
