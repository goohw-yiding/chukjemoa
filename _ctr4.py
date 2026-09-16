# -*- coding: utf-8 -*-
# 진짜 범인은 /2026-09/ 였다 — 노출 +9,536 에 클릭 +1.
# «어떤 검색어로» 그 노출이 들어오는지 봐야 처방이 나온다.
import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

def q(s, e, dims, n=300, page=None):
    body = {"startDate": str(s), "endDate": str(e), "dimensions": dims, "rowLimit": n}
    if page:
        body["dimensionFilterGroups"] = [{"filters": [
            {"dimension": "page", "operator": "equals", "expression": page}]}]
    return sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])

end = datetime.date.today() - datetime.timedelta(days=2)
s, e = end - datetime.timedelta(days=6), end

for P in ["https://chukjemoa.co.kr/2026-09/",
          "https://chukjemoa.co.kr/2026-10/",
          "https://chukjemoa.co.kr/zh/search/"]:
    rows = q(s, e, ["query"], 300, P)
    tot_i = sum(r["impressions"] for r in rows); tot_c = sum(r["clicks"] for r in rows)
    print(f"\n=== {P}   (검색어로 잡힌 분: 노출 {tot_i:.0f} 클릭 {tot_c:.0f}) ===")
    rows.sort(key=lambda r: -r["impressions"])
    for r in rows[:15]:
        print(f"  {r['impressions']:>5.0f}노출 {r['clicks']:>3.0f}클릭 "
              f"CTR {r['ctr']*100:>5.2f}% 평균{r['position']:>5.1f}위  {r['keys'][0]}")
    if not rows:
        print("  (익명화되어 검색어가 안 잡힘)")
