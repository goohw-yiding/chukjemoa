# -*- coding: utf-8 -*-
"""10/23 이후 /en/ 노출 급감이 사이트 전체인지 확인 + 영어 대표 URL 색인 상태"""
import sys, json
from google.oauth2 import service_account
from googleapiclient.discovery import build
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
KEY = r"C:\dev\traffic-dashboard\sa-key.json"; SITE = "https://chukjemoa.co.kr/"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)
def q(a, b, dims, flt=None, n=1000):
    body = {"startDate": a, "endDate": b, "dimensions": dims, "rowLimit": n, "dataState": "all"}
    if flt: body["dimensionFilterGroups"] = [{"filters": [{"dimension": "page", "operator": "contains", "expression": flt}]}]
    return sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])
for name, f in [("전체", None), ("/en/", "chukjemoa.co.kr/en/"), ("/ja/", "chukjemoa.co.kr/ja/"), ("/zh/", "chukjemoa.co.kr/zh/")]:
    rows = q("2026-10-16", "2026-10-27", ["date"], f)
    print(name, " ".join(f"{r['keys'][0][5:]}:{int(r['impressions'])}/{int(r['clicks'])}" for r in rows))
print()
for u in ["https://chukjemoa.co.kr/en/", "https://chukjemoa.co.kr/en/festival/", "https://chukjemoa.co.kr/en/festival/seoul-silver-grass-festival/", "https://chukjemoa.co.kr/en/festival/jeju-olle-walking-festival/", "https://chukjemoa.co.kr/en/jangteo/", "https://chukjemoa.co.kr/en/festival/masan-gagopa-chrysanthemum-festival/"]:
    try:
        r = sc.urlInspection().index().inspect(body={"inspectionUrl": u, "siteUrl": SITE}).execute()["inspectionResult"]["indexStatusResult"]
        print(u.replace("https://chukjemoa.co.kr", ""), r.get("verdict"), r.get("coverageState"), r.get("lastCrawlTime"), r.get("robotsTxtState"), r.get("indexingState"), r.get("googleCanonical", "")[-50:])
    except Exception as e:
        print(u, "ERR", e)
