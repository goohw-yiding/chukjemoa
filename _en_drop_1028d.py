# -*- coding: utf-8 -*-
"""사이트 전체 10/19~22 vs 10/23~26 페이지·검색어 비교 (위치 변화로 원인 구분)"""
import sys
from google.oauth2 import service_account
from googleapiclient.discovery import build
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
KEY = r"C:\dev\traffic-dashboard\sa-key.json"; SITE = "https://chukjemoa.co.kr/"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)
def q(a, b, dims, n=2000):
    return {tuple(r["keys"]): r for r in sc.searchanalytics().query(siteUrl=SITE, body={"startDate": a, "endDate": b, "dimensions": dims, "rowLimit": n, "dataState": "all"}).execute().get("rows", [])}
for dims in (["page"], ["query"], ["device"], ["searchAppearance"]):
    A = q("2026-10-19", "2026-10-22", dims); B = q("2026-10-23", "2026-10-26", dims)
    print(f"\n[{dims[0]}] 앞4일 클릭/노출/위치 | 뒤4일")
    for k in sorted(set(A) | set(B), key=lambda k: -A.get(k, {}).get("impressions", 0))[:15]:
        a = A.get(k, {}); b = B.get(k, {})
        print(f"  {a.get('clicks',0):4.0f} {a.get('impressions',0):6.0f} {a.get('position',0):5.1f} | {b.get('clicks',0):4.0f} {b.get('impressions',0):6.0f} {b.get('position',0):5.1f}  {k[0].replace('https://chukjemoa.co.kr','')}")
