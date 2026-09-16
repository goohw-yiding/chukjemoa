# -*- coding: utf-8 -*-
# 보고서가 말한 「노출 +56% / CTR 1.72->1.09」는 주간 비교로 보인다. 그 창으로 다시 잰다.
# 그리고 지목된 두 페이지를 «검색어별로» 열어 본다 — 순위가 낮아서 안 눌리는 건지,
# 순위는 좋은데 제목이 약해서 안 눌리는 건지는 완전히 다른 처방이다.
import datetime, collections
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

def q(s, e, dims, n=25000, filters=None):
    body = {"startDate": str(s), "endDate": str(e), "dimensions": dims, "rowLimit": n}
    if filters:
        body["dimensionFilterGroups"] = [{"filters": filters}]
    return sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])

end = datetime.date.today() - datetime.timedelta(days=2)
w1s, w1e = end - datetime.timedelta(days=6), end
w2s, w2e = w1s - datetime.timedelta(days=7), w1s - datetime.timedelta(days=1)
print(f"주간 비교  이번 {w1s}~{w1e}  vs  지난 {w2s}~{w2e}")
for lab, (s, e) in [("이번주", (w1s, w1e)), ("지난주", (w2s, w2e))]:
    r = q(s, e, [])
    if r:
        x = r[0]
        print(f"  {lab}: 클릭 {x['clicks']:.0f} · 노출 {x['impressions']:.0f} · "
              f"CTR {x['ctr']*100:.2f}% · 평균순위 {x['position']:.1f}")

# ── 지목된 두 페이지를 검색어별로
TARGETS = [("봉평", "bongpyeong"), ("오일장", "/jangteo/")]
for label, needle in TARGETS:
    print(f"\n=== {label} — 페이지 찾기 (최근 7일) ===")
    pages = [r for r in q(w1s, w1e, ["page"], 5000) if needle in r["keys"][0]]
    pages.sort(key=lambda r: -r["impressions"])
    for r in pages[:6]:
        print(f"  {r['impressions']:>6.0f}노출 {r['clicks']:>4.0f}클릭 "
              f"CTR {r['ctr']*100:>5.2f}% 평균{r['position']:>5.1f}위  {r['keys'][0]}")
    if not pages:
        print("  (해당 없음)")
        continue
    top = pages[0]["keys"][0]
    print(f"  ↳ 검색어별: {top}")
    rows = q(w1s, w1e, ["query"], 200,
             [{"dimension": "page", "operator": "equals", "expression": top}])
    rows.sort(key=lambda r: -r["impressions"])
    for r in rows[:12]:
        print(f"     {r['impressions']:>5.0f}노출 {r['clicks']:>3.0f}클릭 "
              f"CTR {r['ctr']*100:>5.2f}% 평균{r['position']:>5.1f}위  {r['keys'][0]}")
