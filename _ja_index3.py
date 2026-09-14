# -*- coding: utf-8 -*-
"""내비에 있는 일본어 허브들이 «전부» 색인됐나. 허브가 막히면 그 아래가 통째로 막힌다.
   앞서 /ja/places/seoul/ 만 보고 「고아」라고 판단할 뻔했다 — 허브는 내비에 있었다.
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
URLS = ["/ja/places/", "/ja/mountains/", "/ja/cafe/", "/ja/cities/",
        "/ja/places/busan/", "/ja/places/jeju/", "/ja/calendar/2026-09/"]
for u in URLS:
    try:
        r = sc.urlInspection().index().inspect(body={
            "inspectionUrl": "https://chukjemoa.co.kr" + u, "siteUrl": SITE,
            "languageCode": "ko"}).execute()
        s = r.get("inspectionResult", {}).get("indexStatusResult", {})
        cov = s.get("coverageState", "?")
        mark = "✅" if "색인이 생성되었습니다" in cov else "🔴"
        print("%s %-26s %s · 크롤 %s · 참조원 %s" % (
            mark, u, cov, (s.get("lastCrawlTime") or "없음")[:10],
            len(s.get("referringUrls") or []) or "없음"))
    except Exception as e:
        print("❔ %-26s %s" % (u, str(e)[:70]))
    time.sleep(1)
