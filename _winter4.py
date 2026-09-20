# -*- coding: utf-8 -*-
# /winter/ 는 981장이 링크하고 본문 1.1만 자인데 35위다. 구글이 색인은 했나 — 이게 제일 먼저다.
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)
for u in ["https://chukjemoa.co.kr/winter/", "https://chukjemoa.co.kr/2026-12/"]:
    r = sc.urlInspection().index().inspect(body={"inspectionUrl": u, "siteUrl": SITE, "languageCode": "ko"}).execute()
    s = r.get("inspectionResult", {}).get("indexStatusResult", {})
    print(u.replace("https://chukjemoa.co.kr", ""), "|", s.get("verdict"), "|", s.get("coverageState"),
          "| 크롤", (s.get("lastCrawlTime") or "?")[:10], "| 구글정규", (s.get("googleCanonical") or "?"), flush=True)
