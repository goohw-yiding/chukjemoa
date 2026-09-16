# -*- coding: utf-8 -*-
# 🔴 앵커(#) 노출은 부모 URL과 «중복»으로 잡히고 클릭은 거의 0이다(기록된 함정).
#    사이트 전체 CTR 하락이 정말 「제목이 약해서」인지, 아니면 「앵커 노출이 분모만 불린 것」인지
#    두 주를 앵커/본체로 갈라서 잰다. 여기서 갈리면 처방이 완전히 달라진다.
import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

def q(s, e, dims, n=25000):
    return sc.searchanalytics().query(siteUrl=SITE, body={
        "startDate": str(s), "endDate": str(e), "dimensions": dims,
        "rowLimit": n}).execute().get("rows", [])

end = datetime.date.today() - datetime.timedelta(days=2)
w1s, w1e = end - datetime.timedelta(days=6), end
w2s, w2e = w1s - datetime.timedelta(days=7), w1s - datetime.timedelta(days=1)

print("=== 앵커(#) 노출을 빼면 CTR 이 어떻게 되나 ===")
for lab, (s, e) in [("이번주", (w1s, w1e)), ("지난주", (w2s, w2e))]:
    rows = q(s, e, ["page"], 25000)
    a = [r for r in rows if "#" in r["keys"][0]]
    b = [r for r in rows if "#" not in r["keys"][0]]
    def f(rs):
        c = sum(r["clicks"] for r in rs); i = sum(r["impressions"] for r in rs)
        return c, i, (c / i * 100 if i else 0)
    ac, ai, act = f(a); bc, bi, bct = f(b); tc, ti, tct = f(rows)
    print(f"  [{lab}]  전체 클릭 {tc:.0f} 노출 {ti:.0f} CTR {tct:.2f}%")
    print(f"     앵커(#)  클릭 {ac:>5.0f} 노출 {ai:>7.0f} CTR {act:>5.2f}%  ({len(a)}행)")
    print(f"     본체     클릭 {bc:>5.0f} 노출 {bi:>7.0f} CTR {bct:>5.2f}%  ({len(b)}행)")

print("\n=== 노출이 가장 많이 «늘어난» 페이지 상위 12 (이번주-지난주) ===")
d = {}
for r in q(w2s, w2e, ["page"], 25000):
    d[r["keys"][0]] = [-r["impressions"], -r["clicks"]]
for r in q(w1s, w1e, ["page"], 25000):
    k = r["keys"][0]
    d.setdefault(k, [0, 0])
    d[k][0] += r["impressions"]; d[k][1] += r["clicks"]
for k, (di, dc) in sorted(d.items(), key=lambda x: -x[1][0])[:12]:
    print(f"  노출 {di:>+7.0f}  클릭 {dc:>+5.0f}   {k}")
