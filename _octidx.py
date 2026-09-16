# -*- coding: utf-8 -*-
# 10월 허브가 6.7위다. 어제 넣은 내비 링크(160->976)가 «크롤됐는지»를 본다.
# 아직이면 색인 요청이 오늘의 실제 행동이고, 이미 됐으면 기다리는 게 맞다.
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

for u in ["https://chukjemoa.co.kr/2026-10/",
          "https://chukjemoa.co.kr/2026-09/",
          "https://chukjemoa.co.kr/jangteo/"]:
    try:
        r = sc.urlInspection().index().inspect(body={
            "inspectionUrl": u, "siteUrl": SITE, "languageCode": "ko"}).execute()
        s = r.get("inspectionResult", {}).get("indexStatusResult", {})
        print(f"{u}")
        print(f"   판정 {s.get('verdict','?')} · 상태 {s.get('coverageState','?')}")
        print(f"   마지막 크롤 {(s.get('lastCrawlTime') or '?')[:16]} · "
              f"로봇 {s.get('robotsTxtState','?')} · 색인허용 {s.get('indexingState','?')}")
    except Exception as e:
        print(u, "조회 실패:", str(e)[:120])
