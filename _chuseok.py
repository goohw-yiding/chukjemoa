# -*- coding: utf-8 -*-
# 추석은 9/25 — 9일 남았다. 이 페이지는 노출 2,202에 클릭 7이었다(리포트 9/14).
# 「즉답형이라 원래 0에 가깝다」인지, 「갈 만한 곳을 찾는 사람인데 못 끌고 있는지」를 가른다.
# 추천하기 전에 근거부터 본다.
import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

end = datetime.date.today() - datetime.timedelta(days=2)
s = end - datetime.timedelta(days=6)

def q(dims, n=300, page=None):
    body = {"startDate": str(s), "endDate": str(end), "dimensions": dims, "rowLimit": n}
    if page:
        body["dimensionFilterGroups"] = [{"filters": [
            {"dimension": "page", "operator": "equals", "expression": page}]}]
    return sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])

P = "https://chukjemoa.co.kr/blog/chuseok-2026-holiday-guide/"
rows = q(["query"], 300, P)
rows.sort(key=lambda r: -r["impressions"])
ti = sum(r["impressions"] for r in rows); tc = sum(r["clicks"] for r in rows)
print(f"=== {P}\n    검색어로 잡힌 분: 노출 {ti:.0f} 클릭 {tc:.0f}  ({s}~{end})")
# 즉답형(날짜만 묻는 것) 과 탐색형(갈 만한 곳)을 갈라 본다
IMMEDIATE = ("언제", "며칠", "날짜", "연휴 기간", "몇일")
a = [r for r in rows if any(k in r["keys"][0] for k in IMMEDIATE)]
b = [r for r in rows if not any(k in r["keys"][0] for k in IMMEDIATE)]
def f(rs):
    c = sum(r["clicks"] for r in rs); i = sum(r["impressions"] for r in rs)
    return c, i, (c / i * 100 if i else 0)
for lab, rs in [("즉답형(언제·날짜)", a), ("탐색형(그 밖)", b)]:
    c, i, ct = f(rs)
    print(f"  {lab}: 노출 {i:>5.0f} 클릭 {c:>3.0f} CTR {ct:>5.2f}%  ({len(rs)}개 검색어)")
print("\n  상위 검색어:")
for r in rows[:14]:
    print(f"    {r['impressions']:>5.0f}노출 {r['clicks']:>3.0f}클릭 "
          f"CTR {r['ctr']*100:>5.2f}% 평균{r['position']:>5.1f}위  {r['keys'][0]}")
