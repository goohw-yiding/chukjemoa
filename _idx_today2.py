# -*- coding: utf-8 -*-
"""연휴 페이지 색인 상태 — 추석(9월)·개천절(10/3)·한글날(10/9) 중 무엇이 급한가."""
import sys, time, re, io
from google.oauth2 import service_account
from googleapiclient.discovery import build
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)
PAGES = ["chuseok", "gaecheonjeol", "hangeul-day", "christmas", "new-year", "seollal"]
for p in PAGES:
    u = "/ja/closed/%s/" % p
    # 페이지 본문에서 «실제 날짜»를 뽑는다
    try:
        h = io.open(r"C:\dev\chukjemoa\ja\closed\%s\index.html" % p, encoding="utf-8").read()
        m = re.search(r"(20\d\d)年\s*(\d{1,2})月\s*(\d{1,2})日", h)
        day = "%s-%s-%s" % (m.group(1), m.group(2).zfill(2), m.group(3).zfill(2)) if m else "?"
    except Exception:
        day = "?"
    try:
        r = sc.urlInspection().index().inspect(body={
            "inspectionUrl": "https://chukjemoa.co.kr" + u, "siteUrl": SITE,
            "languageCode": "ko"}).execute()
        s = r.get("inspectionResult", {}).get("indexStatusResult", {})
        cov = s.get("coverageState", "?")
        ok = "색인이 생성되었습니다" in cov
        print("%s %-26s 날짜 %-11s %s · 크롤 %s" % (
            "✅" if ok else "🔴", u, day, cov, (s.get("lastCrawlTime") or "없음")[:10]))
    except Exception as e:
        print("❔ %-26s %s" % (u, str(e)[:60]))
    time.sleep(1)
