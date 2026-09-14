# -*- coding: utf-8 -*-
"""일본 휴무일 계열 페이지가 «구글에» 색인돼 있나. IndexNow 는 빙·네이버에만 간다 — 구글은 따로 본다.
   한글날이 10/9 인데 그 페이지가 색인 안 돼 있으면 피크를 통째로 놓친다.
"""
import sys, time
from google.oauth2 import service_account
from googleapiclient.discovery import build
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)
URLS = ["https://chukjemoa.co.kr/ja/closed/",
        "https://chukjemoa.co.kr/ja/closed/hangeul-day/",
        "https://chukjemoa.co.kr/ja/closed/gaecheonjeol/",
        "https://chukjemoa.co.kr/ja/closed/chuseok/",
        "https://chukjemoa.co.kr/ja/closed/seollal/",
        "https://chukjemoa.co.kr/ja/closed/christmas/",
        "https://chukjemoa.co.kr/ja/closed/new-year/"]
for u in URLS:
    try:
        r = sc.urlInspection().index().inspect(body={
            "inspectionUrl": u, "siteUrl": SITE, "languageCode": "ko"}).execute()
        s = r.get("inspectionResult", {}).get("indexStatusResult", {})
        print("%-52s %s" % (u.replace("https://chukjemoa.co.kr", ""), s.get("coverageState", "?")))
        print("    최종크롤 %s · 로봇 %s · 정본 %s" % (
            (s.get("lastCrawlTime") or "없음")[:10], s.get("robotsTxtState", "?"),
            (s.get("googleCanonical") or "?").replace("https://chukjemoa.co.kr", "")))
    except Exception as e:
        print("%-52s 조회실패 %s" % (u, str(e)[:90]))
    time.sleep(1)
