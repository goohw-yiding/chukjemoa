# -*- coding: utf-8 -*-
"""일본에서 오는 노출은 별로 안 줄었는데 /ja/ 노출만 꺾였다.
   그러면 일본 사람들이 «어느 페이지»를 보고 있나. 그걸 본다."""
import io, collections
from google.oauth2 import service_account
from googleapiclient.discovery import build
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)
OUT = []
def p(s=""): OUT.append(s)

def q(s, e, dims, filters=None, n=500):
    body = {"startDate": s, "endDate": e, "dimensions": dims, "rowLimit": n, "type": "web"}
    if filters: body["dimensionFilterGroups"] = filters
    return sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])

JPN = [{"filters": [{"dimension": "country", "operator": "equals", "expression": "jpn"}]}]
for label, s, e in [("A 9/02~9/08", "2026-09-02", "2026-09-08"),
                    ("B 9/09~9/15", "2026-09-09", "2026-09-15")]:
    rows = q(s, e, ["page"], JPN)
    tot = sum(r["impressions"] for r in rows)
    ja = sum(r["impressions"] for r in rows if "/ja/" in r["keys"][0])
    p("=== %s — 일본 노출 %d (그중 /ja/ %d · %d%%)" % (label, tot, ja, round(ja / tot * 100) if tot else 0))
    for r in sorted(rows, key=lambda x: -x["impressions"])[:12]:
        p("   %-52s 노출 %-5d 클릭 %d" % (
            r["keys"][0].replace("https://chukjemoa.co.kr", "").replace("https://www.chukjemoa.co.kr", "")[:52],
            r["impressions"], r["clicks"]))
    p("")

p("=== 일본 검색어 (9/09~9/15) — 익명화되지 않은 것만")
for r in sorted(q("2026-09-09", "2026-09-15", ["query"], JPN), key=lambda x: -x["impressions"])[:15]:
    p("   %-40s 노출 %-4d 클릭 %d" % (r["keys"][0][:40], r["impressions"], r["clicks"]))

io.open(r"C:\dev\chukjemoa\_ja_q2.txt", "w", encoding="utf-8").write("\n".join(OUT))
print("done")
