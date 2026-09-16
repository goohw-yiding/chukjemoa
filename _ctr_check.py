# -*- coding: utf-8 -*-
# 「노출 +56%, CTR 1.72->1.09」이 정말 제목 문제인지부터 확인한다.
# 노출이 크게 늘 때 CTR 하락은 «순위 희석»인 경우가 많다 — 새 노출이 20위권에서 들어오면
# 클릭은 안 나오고 분모만 커진다. 그러면 제목을 고쳐도 안 오른다.
import datetime, collections
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

end = datetime.date.today() - datetime.timedelta(days=2)
start = end - datetime.timedelta(days=27)
pend = start - datetime.timedelta(days=1)
pstart = pend - datetime.timedelta(days=27)

def q(s, e, dims, n=25000, filters=None):
    body = {"startDate": str(s), "endDate": str(e), "dimensions": dims, "rowLimit": n}
    if filters:
        body["dimensionFilterGroups"] = [{"filters": filters}]
    return sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])

def tot(rows):
    c = sum(r["clicks"] for r in rows); i = sum(r["impressions"] for r in rows)
    return c, i, (c / i * 100 if i else 0)

print(f"기간  최근 {start}~{end}   직전 {pstart}~{pend}")
for lab, (s, e) in [("최근", (start, end)), ("직전", (pstart, pend))]:
    r = q(s, e, [])
    if r:
        x = r[0]
        print(f"  {lab}: 클릭 {x['clicks']:.0f} · 노출 {x['impressions']:.0f} · "
              f"CTR {x['ctr']*100:.2f}% · 평균순위 {x['position']:.1f}")

# ── 순위 구간별로 노출이 어디서 늘었나 (희석 여부를 가르는 핵심)
print("\n=== 순위 구간별 노출·클릭 (페이지+검색어 단위) ===")
BANDS = [(1, 3), (4, 10), (11, 20), (21, 50), (51, 999)]
for lab, (s, e) in [("최근", (start, end)), ("직전", (pstart, pend))]:
    rows = q(s, e, ["query"], 25000)
    agg = collections.OrderedDict((f"{a}-{b}위", [0, 0]) for a, b in BANDS)
    for r in rows:
        p = r["position"]
        for a, b in BANDS:
            if a <= p <= b:
                agg[f"{a}-{b}위"][0] += r["clicks"]; agg[f"{a}-{b}위"][1] += r["impressions"]; break
    print(f"  [{lab}]")
    for k, (c, i) in agg.items():
        print(f"    {k:>8}  노출 {i:>7.0f}  클릭 {c:>5.0f}  CTR {(c/i*100 if i else 0):>5.2f}%")
