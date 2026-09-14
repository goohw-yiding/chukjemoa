# -*- coding: utf-8 -*-
"""오일장 실측 — «가장 큰 묶음인데 곁다리로 다루고 있다»를 근거로 바꾼다.
   GA4(네이버 유입 랜딩) + GSC(페이지·검색어)를 오일장 계열만 뽑는다.
   실행: py -3 _jangteo_audit.py [기준일수=7]
"""
import datetime, sys, collections, json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
PROP = "properties/545108776"
DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 7

cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)
ga = BetaAnalyticsDataClient(credentials=service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"]))

end = datetime.date.today() - datetime.timedelta(days=3)
cur = (end - datetime.timedelta(days=DAYS-1), end)
prev = (cur[0] - datetime.timedelta(days=DAYS), cur[0] - datetime.timedelta(days=1))

def g4(dims, mets, rng, n=5000):
    r = ga.run_report(RunReportRequest(
        property=PROP, date_ranges=[DateRange(start_date=str(rng[0]), end_date=str(rng[1]))],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets], limit=n))
    return [([d.value for d in x.dimension_values], [m.value for m in x.metric_values]) for x in r.rows]

def gsc(dims, rng, n=25000):
    # ⚠️ rowLimit 는 1회 1,000 이 상한이다. 페이징해야 전량이 나온다(2026-09-14 실측 교훈).
    out, start = [], 0
    while start < n:
        b = sc.searchanalytics().query(siteUrl=SITE, body={
            "startDate": str(rng[0]), "endDate": str(rng[1]),
            "dimensions": dims, "rowLimit": 1000, "startRow": start}).execute()
        rows = b.get("rows", [])
        out += rows
        if len(rows) < 1000: break
        start += 1000
    return out

def is_j(p):
    return "/jangteo" in p or "장날" in p or "오일장" in p

print("기간: %s ~ %s (직전 %s ~ %s)\n" % (cur[0], cur[1], prev[0], prev[1]))

# ── 1. GA4 네이버 랜딩 (오일장 계열 전량) ──────────────────────
def naver_land(rng):
    out = collections.Counter()
    for d, m in g4(["landingPage", "sessionSource"], ["sessions"], rng):
        if "naver" in d[1].lower() and is_j(d[0]): out[d[0]] += int(m[0])
    return out
nc, np_ = naver_land(cur), naver_land(prev)
print("■ 네이버 오일장 랜딩 — 이번 %d세션 / 직전 %d세션 (%+d)" % (
    sum(nc.values()), sum(np_.values()), sum(nc.values())-sum(np_.values())))
print("   페이지 수: 이번 %d개 / 직전 %d개" % (len(nc), len(np_)))
for p, v in nc.most_common(25):
    print("   %-42s %5d  (직전 %4d, %+d)" % (p[:42], v, np_.get(p,0), v-np_.get(p,0)))
gone = [(p, v) for p, v in np_.most_common() if p not in nc][:8]
if gone: print("   [사라진 것] " + " · ".join("%s %d" % (p[:26], v) for p, v in gone))
print()

# 계층별로 묶어 본다 — 허브 / 시·도 / 시·군
def tier(p):
    seg = [s for s in p.split("/") if s]
    if not seg or seg[0] != "jangteo": return "기타"
    if len(seg) == 1: return "허브"
    if len(seg) == 2: return "시·도"
    return "시·군"
tc, tp = collections.Counter(), collections.Counter()
for p, v in nc.items(): tc[tier(p)] += v
for p, v in np_.items(): tp[tier(p)] += v
print("■ 계층별 (네이버)")
for k in ("허브", "시·도", "시·군", "기타"):
    if tc.get(k) or tp.get(k):
        print("   %-6s 이번 %5d / 직전 %5d  (%+d)" % (k, tc.get(k,0), tp.get(k,0), tc.get(k,0)-tp.get(k,0)))
print()

# ── 2. GSC 페이지 (오일장 계열) ────────────────────────────────
pc = {r["keys"][0]: r for r in gsc(["page"], cur)}
pp = {r["keys"][0]: r for r in gsc(["page"], prev)}
jp = sorted([(u, r) for u, r in pc.items() if is_j(u) and "#" not in u],
            key=lambda x: -x[1]["impressions"])
print("■ GSC 오일장 페이지 — 노출 상위 20 (앵커 제외)")
print("   %-44s %6s %6s %6s %6s" % ("페이지", "클릭", "노출", "CTR", "순위"))
tot_c = sum(r["clicks"] for _, r in jp); tot_i = sum(r["impressions"] for _, r in jp)
for u, r in jp[:20]:
    print("   %-44s %6d %6d %5.1f%% %6.1f" % (
        u.replace("https://chukjemoa.co.kr", "")[:44], r["clicks"], r["impressions"],
        100*r["ctr"], r["position"]))
print("   ─ 오일장 계열 합계: 클릭 %d · 노출 %d · 페이지 %d개" % (tot_c, tot_i, len(jp)))
print()

# ── 3. GSC 검색어 (오일장 계열) ────────────────────────────────
qc = gsc(["query"], cur)
jq = sorted([r for r in qc if any(k in r["keys"][0] for k in ("장날", "오일장", "5일장", "전통시장", "장터"))],
            key=lambda r: -r["impressions"])
print("■ GSC 오일장 검색어 — 노출 상위 25")
print("   %-30s %6s %6s %6s %6s" % ("검색어", "클릭", "노출", "CTR", "순위"))
for r in jq[:25]:
    print("   %-30s %6d %6d %5.1f%% %6.1f" % (
        r["keys"][0][:30], r["clicks"], r["impressions"], 100*r["ctr"], r["position"]))
print("   ─ 검색어축 합계: 클릭 %d · 노출 %d · %d개" % (
    sum(r["clicks"] for r in jq), sum(r["impressions"] for r in jq), len(jq)))
print()

# ── 4. 10위 문턱 — 노출은 있는데 순위가 8~20위인 것 ────────────
near = [r for r in jq if 8 <= r["position"] <= 20 and r["impressions"] >= 10]
near.sort(key=lambda r: -r["impressions"])
print("■ 10위 문턱 (8~20위 · 노출 10+) — 조금만 올리면 클릭이 붙는 것")
for r in near[:20]:
    print("   %-30s 노출%5d 클릭%3d 순위%5.1f" % (
        r["keys"][0][:30], r["impressions"], r["clicks"], r["position"]))
print()
