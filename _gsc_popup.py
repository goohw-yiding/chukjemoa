# -*- coding: utf-8 -*-
# 축제모아가 이미 팝업·전시 계열로 «노출»을 받고 있나 — 구글이 우리를 그쪽으로 보고 있는지
import datetime, re
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

end = datetime.date.today() - datetime.timedelta(days=2)
start = end - datetime.timedelta(days=89)     # 90일로 넓게 본다
rows = sc.searchanalytics().query(siteUrl=SITE, body={
    "startDate": str(start), "endDate": str(end),
    "dimensions": ["query"], "rowLimit": 5000}).execute().get("rows", [])
print("90일 검색어 %d개 (%s ~ %s)" % (len(rows), start, end))

PAT = {
    "팝업": re.compile(r"팝업"),
    "전시": re.compile(r"전시"),
    "옥토버/맥주": re.compile(r"옥토버|맥주"),
    "가볼만한곳/나들이": re.compile(r"가볼만한|가볼 만한|나들이|데이트"),
    "성수/더현대": re.compile(r"성수|더현대"),
}
for lab, re_ in PAT.items():
    hit = [r for r in rows if re_.search(r["keys"][0])]
    i = sum(r["impressions"] for r in hit); c = sum(r["clicks"] for r in hit)
    print("\n=== %s — 검색어 %d개 · 노출 %d · 클릭 %d" % (lab, len(hit), i, c))
    for r in sorted(hit, key=lambda x: -x["impressions"])[:6]:
        print("    %5d노출 %3d클릭 %5.1f위  %s" % (r["impressions"], r["clicks"], r["position"], r["keys"][0]))
