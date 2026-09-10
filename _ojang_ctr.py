# -*- coding: utf-8 -*-
# 오일장 계열 검색어가 «어느 페이지»로 들어가는지 — page+query 교차
import datetime, collections, re
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

end = datetime.date.today() - datetime.timedelta(days=2)
start = end - datetime.timedelta(days=27)
rows = sc.searchanalytics().query(siteUrl=SITE, body={
    "startDate": str(start), "endDate": str(end),
    "dimensions": ["page", "query"], "rowLimit": 5000}).execute().get("rows", [])

OJ = re.compile(r"장날|오일장|5일장|5 ?일 ?장|오 ?일 ?장")
oj = [r for r in rows if OJ.search(r["keys"][1])]
tot_i = sum(r["impressions"] for r in oj); tot_c = sum(r["clicks"] for r in oj)
print("오일장 계열 — 노출 %d · 클릭 %d · CTR %.2f%%\n" % (tot_i, tot_c, tot_c/tot_i*100 if tot_i else 0))

byp = collections.defaultdict(lambda: [0, 0, [], 0.0])
for r in oj:
    p = r["keys"][0]; byp[p][0] += r["clicks"]; byp[p][1] += r["impressions"]
    byp[p][2].append((r["keys"][1], r["impressions"], r["clicks"], r["position"]))
    byp[p][3] += r["position"] * r["impressions"]

print("=== 페이지별 (노출순) ===")
for p, (c, i, qs, pw) in sorted(byp.items(), key=lambda x: -x[1][1])[:8]:
    print("\n%s" % p.replace("https://chukjemoa.co.kr", ""))
    print("   노출 %d · 클릭 %d · CTR %.2f%% · 가중평균순위 %.1f" % (i, c, c/i*100 if i else 0, pw/i if i else 0))
    for q, qi, qc, qp in sorted(qs, key=lambda x: -x[1])[:8]:
        print("     %5d노출 %3d클릭 %5.1f위  %s" % (qi, qc, qp, q))
