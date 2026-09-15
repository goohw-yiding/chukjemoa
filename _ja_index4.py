# -*- coding: utf-8 -*-
"""2026-09-15 — 새로 만든 일본어 3장 + 그 진입로가 크롤됐나.
   요점: 153장 중 12장만 크롤되는 상태에서 3장을 더 얹었다. 그 3장이 크롤될 «길»이 있는지 본다.
   길은 크롤 날짜가 신선한 페이지에서만 열린다 — 홈(8/28)보다 mountains(9/13)가 빠르다.
"""
import sys, time, io
from google.oauth2 import service_account
from googleapiclient.discovery import build
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)
URLS = ["/ja/palace/", "/ja/daytrip/", "/ja/busy/",
        "/ja/", "/ja/closed/", "/ja/mountains/", "/ja/access/", "/ja/search/", "/ja/places/"]
out = []
for u in URLS:
    try:
        r = sc.urlInspection().index().inspect(body={
            "inspectionUrl": "https://chukjemoa.co.kr" + u, "siteUrl": SITE,
            "languageCode": "ko"}).execute()
        s = r.get("inspectionResult", {}).get("indexStatusResult", {})
        cov = s.get("coverageState", "?")
        mark = "OK " if "색인이 생성되었습니다" in cov else "NO "
        out.append("%s %-16s %-34s crawl=%s ref=%s" % (
            mark, u, cov[:34], (s.get("lastCrawlTime") or "none")[:10],
            len(s.get("referringUrls") or []) or 0))
    except Exception as e:
        out.append("ERR %-16s %s" % (u, str(e)[:90]))
    time.sleep(1)
io.open(r"C:\dev\chukjemoa\_idx4.txt", "w", encoding="utf-8").write("\n".join(out))
print("done")
