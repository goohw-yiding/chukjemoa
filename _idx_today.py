# -*- coding: utf-8 -*-
"""오늘(2026-09-15) 색인 요청할 후보를 «상태부터» 확인한다.
   UI 색인 요청은 하루 10~12건이 한계라, 이미 색인된 걸 요청하면 그만큼 버린다.
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

CAND = [
    ("일본어 한글날 휴무", "/ja/closed/hangeul-day/"),
    ("일본어 가볼 곳 허브", "/ja/places/"),
    ("끝자리 1·6일장",     "/jangteo/1-6/"),
    ("끝자리 2·7일장",     "/jangteo/2-7/"),
    ("끝자리 3·8일장",     "/jangteo/3-8/"),
    ("끝자리 4·9일장",     "/jangteo/4-9/"),
    ("끝자리 5·10일장",    "/jangteo/5-10/"),
    ("오일장 허브",        "/jangteo/"),
    ("일본어 混む日",      "/ja/busy/"),
    ("일본어 휴무 허브",    "/ja/closed/"),
]
print("%-18s %-24s %s" % ("무엇", "주소", "상태"))
print("-" * 92)
for name, u in CAND:
    try:
        r = sc.urlInspection().index().inspect(body={
            "inspectionUrl": "https://chukjemoa.co.kr" + u, "siteUrl": SITE,
            "languageCode": "ko"}).execute()
        s = r.get("inspectionResult", {}).get("indexStatusResult", {})
        cov = s.get("coverageState", "?")
        ok = "색인이 생성되었습니다" in cov
        print("%s %-18s %-24s %s · 크롤 %s · 참조원 %s" % (
            "✅" if ok else "🔴", name, u, cov,
            (s.get("lastCrawlTime") or "없음")[:10],
            len(s.get("referringUrls") or []) or 0))
    except Exception as e:
        print("❔ %-18s %-24s %s" % (name, u, str(e)[:60]))
    time.sleep(1)
