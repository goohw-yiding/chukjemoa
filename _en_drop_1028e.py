# -*- coding: utf-8 -*-
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
KEY = r"C:\dev\traffic-dashboard\sa-key.json"; SITE = "https://chukjemoa.co.kr/"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)
for p in ["/busan/festival/", "/seoul/festival/", "/seoul/2026-10/", "/2026-10/", "/cafe/"]:
    u = "https://chukjemoa.co.kr" + p
    r = sc.urlInspection().index().inspect(body={"inspectionUrl": u, "siteUrl": SITE}).execute()["inspectionResult"]["indexStatusResult"]
    print(p, r.get("verdict"), r.get("coverageState"), r.get("lastCrawlTime"), r.get("pageFetchState"), r.get("googleCanonical", "")[-40:])
