# -*- coding: utf-8 -*-
# 영어 진입로 페이지의 마지막 크롤 날짜 — 본문 링크를 «구글이 곧 다시 읽을» 페이지에 심기 위해
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)
U = ["/en/", "/en/festival/", "/en/jangteo/", "/en/closed/", "/en/calendar/", "/en/blog/ojang-day-guide-en/",
     "/en/blog/", "/en/festival/jeju-olle-walking-festival/"]
out = open(r"C:\dev\chukjemoa\_en_crawl_1006.txt", "w", encoding="utf-8")
for u in U:
    try:
        r = sc.urlInspection().index().inspect(body={"inspectionUrl": "https://chukjemoa.co.kr" + u, "siteUrl": "https://chukjemoa.co.kr/"}).execute()
        i = r["inspectionResult"]["indexStatusResult"]
        out.write(f"{u}\t{i.get('coverageState')}\t크롤 {i.get('lastCrawlTime','없음')}\t참조원 {len(i.get('referringUrls') or [])}\t사이트맵 {len(i.get('sitemap') or [])}\n")
    except Exception as e:
        out.write(f"{u}\t오류 {str(e)[:120]}\n")
    out.flush()
out.write("끝\n"); out.close()
