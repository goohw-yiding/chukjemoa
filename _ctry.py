# -*- coding: utf-8 -*-
"""국가축 «단독» 합계와 «페이지축» 합계를 나란히 본다.
   둘이 다르면 어느 쪽이 맞는지부터 정하고 나서 처방을 말해야 한다.
   (검색어축이 익명화로 26%만 보이는 것과 같은 함정이 국가축에도 있는지 확인)
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

def run(days, label):
    start = end - datetime.timedelta(days=days-1)
    def q(dims, filters=None):
        out, row = [], 0
        while row < 25000:
            body = {"startDate": str(start), "endDate": str(end), "dimensions": dims,
                    "rowLimit": 1000, "startRow": row}
            if filters: body["dimensionFilterGroups"] = [{"filters": filters}]
            r = sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])
            out += r
            if len(r) < 1000: break
            row += 1000
        return out
    print("\n===== %s (%s ~ %s) =====" % (label, start, end))
    rows = q(["country"])
    rows.sort(key=lambda r: -r["impressions"])
    print("국가축 단독")
    print("  %-6s %8s %8s %7s %6s" % ("국가", "노출", "클릭", "CTR", "순위"))
    for r in rows[:8]:
        print("  %-6s %8d %8d %6.2f%% %6.1f" % (
            r["keys"][0], r["impressions"], r["clicks"], 100*r["ctr"], r["position"]))
    tot = sum(r["impressions"] for r in rows)
    kor = next((r["impressions"] for r in rows if r["keys"][0] == "kor"), 0)
    print("  합계 %d · 한국 %d(%.0f%%) · 해외 %d(%.0f%%)" % (
        tot, kor, 100*kor/max(1,tot), tot-kor, 100*(tot-kor)/max(1,tot)))
    for c in ("usa", "jpn"):
        one = next((r for r in rows if r["keys"][0] == c), None)
        pg = q(["page"], [{"dimension": "country", "operator": "equals", "expression": c}])
        pgi = sum(r["impressions"] for r in pg)
        print("  %s — 국가축 노출 %d / 페이지축 합 %d (차이 %d)" % (
            c.upper(), one["impressions"] if one else 0, pgi,
            (one["impressions"] if one else 0) - pgi))

for d, l in ((90, "90일"), (28, "28일")):
    run(d, l)
