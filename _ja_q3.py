# -*- coding: utf-8 -*-
"""일본 검색어에서 클릭이 0이다. 순위가 밀린 건가, 순위는 그대로인데 안 눌리는 건가.
   둘은 처방이 다르다 — 가른다."""
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)
OUT = []
def p(s=""): OUT.append(s)
JPN = [{"filters": [{"dimension": "country", "operator": "equals", "expression": "jpn"}]}]

def q(s, e, dims, n=500):
    return sc.searchanalytics().query(siteUrl=SITE, body={
        "startDate": s, "endDate": e, "dimensions": dims, "rowLimit": n,
        "type": "web", "dimensionFilterGroups": JPN}).execute().get("rows", [])

p("=== 일본 주요 검색어 — 순위가 밀렸나 (A 9/02~9/08 vs B 9/09~9/15)")
A = {r["keys"][0]: r for r in q("2026-09-02", "2026-09-08", ["query"])}
B = {r["keys"][0]: r for r in q("2026-09-09", "2026-09-15", ["query"])}
keys = sorted(set(list(A) + list(B)), key=lambda k: -(B.get(k, {}).get("impressions", 0) + A.get(k, {}).get("impressions", 0)))
p("%-34s | %-22s | %s" % ("검색어", "A 노출/클릭/순위", "B 노출/클릭/순위"))
for k in keys[:14]:
    a, b = A.get(k), B.get(k)
    fa = "%3d / %d / %.1f" % (a["impressions"], a["clicks"], a["position"]) if a else "      —      "
    fb = "%3d / %d / %.1f" % (b["impressions"], b["clicks"], b["position"]) if b else "      —      "
    p("%-34s | %-22s | %s" % (k[:34], fa, fb))

p("")
p("=== /ja/closed/ 자체 — 일본 기준")
for label, s, e in [("A 9/02~9/08", "2026-09-02", "2026-09-08"), ("B 9/09~9/15", "2026-09-09", "2026-09-15")]:
    rows = [r for r in q(s, e, ["page"]) if r["keys"][0].endswith("/ja/closed/")]
    if rows:
        r = rows[0]
        p("   %s  노출 %d · 클릭 %d · 평균순위 %.1f" % (label, r["impressions"], r["clicks"], r["position"]))
    else:
        p("   %s  (행 없음)" % label)

io.open(r"C:\dev\chukjemoa\_ja_q3.txt", "w", encoding="utf-8").write("\n".join(OUT))
print("done")
