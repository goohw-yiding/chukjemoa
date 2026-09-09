# -*- coding: utf-8 -*-
# 앵커 허수가 «전체 노출»의 몇 %인가 — 페이지 차원으로(검색어 차원은 익명필터로 줄어든다).
import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)
end = datetime.date.today() - datetime.timedelta(days=2)
start = end - datetime.timedelta(days=27)
def q(dims, n=25000):
    return sc.searchanalytics().query(siteUrl=SITE, body={
        "startDate": str(start), "endDate": str(end),
        "dimensions": dims, "rowLimit": n}).execute().get("rows", [])
tot = q([], 1)[0]
pages = q(["page"])
ai = sum(r["impressions"] for r in pages if "#" in r["keys"][0])
ac = sum(r["clicks"] for r in pages if "#" in r["keys"][0])
pi = sum(r["impressions"] for r in pages)
print("서치콘솔 전체 : 노출 %d · 클릭 %d · CTR %.2f%%" % (
    tot["clicks"] and tot["impressions"] or tot["impressions"], tot["clicks"], tot["ctr"] * 100))
print("페이지 합계   : 노출 %d" % pi)
print("그중 #앵커    : 노출 %d (%.1f%%) · 클릭 %d" % (ai, ai / pi * 100, ac))
print("앵커 뺀 값    : 노출 %d · 클릭 %d · CTR %.2f%%" % (
    pi - ai, tot["clicks"] - ac, (tot["clicks"] - ac) / (pi - ai) * 100))
