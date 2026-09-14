# -*- coding: utf-8 -*-
"""일본어 페이지가 «실제로 구글에 색인됐나». 종류별로 표본을 잡아 본다.
   ⚠️ urlInspection 은 호출이 느리고 한도가 있다 — 종류당 2~3장만 본다.
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

GROUPS = [
    ("허브", ["/ja/", "/ja/search/", "/ja/closed/"]),
    ("도시(두꺼움)", ["/ja/busan/", "/ja/daegu/", "/ja/cities/"]),
    ("장소 시·도(가장 두꺼움)", ["/ja/places/seoul/", "/ja/places/gangwon/", "/ja/places/gyeonggi/"]),
    ("축제 상세", ["/ja/festival/", "/ja/festival/daeguchimaekpeseutibeol/",
                  "/ja/festival/andonggukjetalchumpeseutibeol/"]),
    ("달력·오일장", ["/ja/calendar/", "/ja/calendar/2026-10/", "/ja/jangteo/"]),
    ("기타", ["/ja/access/", "/ja/trip/", "/ja/chuseok/", "/ja/trend/"]),
]
for label, urls in GROUPS:
    print("■ " + label)
    for u in urls:
        full = "https://chukjemoa.co.kr" + u
        try:
            r = sc.urlInspection().index().inspect(body={
                "inspectionUrl": full, "siteUrl": SITE, "languageCode": "ko"}).execute()
            s = r.get("inspectionResult", {}).get("indexStatusResult", {})
            cov = s.get("coverageState", "?")
            crawl = (s.get("lastCrawlTime") or "없음")[:10]
            mark = "✅" if "색인이 생성되었습니다" in cov else "🔴"
            print("   %s %-42s %s · 크롤 %s" % (mark, u, cov, crawl))
        except Exception as e:
            print("   ❔ %-42s 조회실패 %s" % (u, str(e)[:70]))
        time.sleep(1)
    print("")
