# -*- coding: utf-8 -*-
# 「클릭을 더 얻으려면 뭘 해야 하나」 — 추측 전에 실측부터.
# 순위 구간으로 쪼개지 않으면 「CTR 낮다=제목 탓」이라는 오진이 난다.
import datetime, collections, json
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

end = datetime.date.today() - datetime.timedelta(days=2)
start = end - datetime.timedelta(days=27)
prev_end = start - datetime.timedelta(days=1)
prev_start = prev_end - datetime.timedelta(days=27)

def q(dims, n=25000, s=None, e=None):
    return sc.searchanalytics().query(siteUrl=SITE, body={
        "startDate": str(s or start), "endDate": str(e or end),
        "dimensions": dims, "rowLimit": n}).execute().get("rows", [])

print("기간 %s ~ %s (직전 28일 %s ~ %s)" % (start, end, prev_start, prev_end))

tot = q([], 1)
prev = q([], 1, prev_start, prev_end)
def line(r):
    return "클릭 %d · 노출 %d · CTR %.2f%% · 평균순위 %.1f" % (
        r["clicks"], r["impressions"], r["ctr"] * 100, r["position"])
print("\n[전체] 이번 28일  " + (line(tot[0]) if tot else "없음"))
print("[전체] 직전 28일  " + (line(prev[0]) if prev else "없음"))

# ── 순위 구간별
rows = q(["query"])
BANDS = [(1, 3), (4, 10), (11, 20), (21, 50), (51, 200)]
agg = collections.OrderedDict((b, [0, 0, 0]) for b in BANDS)   # 클릭, 노출, 검색어수
for r in rows:
    p = r["position"]
    for b in BANDS:
        if b[0] <= p <= b[1]:
            agg[b][0] += r["clicks"]; agg[b][1] += r["impressions"]; agg[b][2] += 1
            break
print("\n[순위 구간별 — 검색어 %d개]" % len(rows))
print("  구간      검색어    노출     클릭    CTR")
for b, v in agg.items():
    ctr = (v[0] / v[1] * 100) if v[1] else 0
    print("  %3d~%-4d  %6d  %7d  %6d  %5.2f%%" % (b[0], b[1], v[2], v[1], v[0], ctr))

# ── 「10위 안인데 클릭이 적은」 검색어 = 제목·설명이 진짜 문제인 것
top = [r for r in rows if r["position"] <= 10 and r["impressions"] >= 20]
top.sort(key=lambda r: (r["ctr"], -r["impressions"]))
print("\n[10위 안 · 노출 20+ · CTR 낮은 순 — 제목/설명이 의심되는 것]")
for r in top[:20]:
    print("  %-34s 노출%5d 클릭%4d CTR%5.1f%% 순위%5.1f" % (
        r["keys"][0][:34], r["impressions"], r["clicks"], r["ctr"] * 100, r["position"]))

# ── 「11~20위」 = 조금만 밀면 1페이지 = 가장 값싼 클릭
edge = [r for r in rows if 11 <= r["position"] <= 20 and r["impressions"] >= 30]
edge.sort(key=lambda r: -r["impressions"])
print("\n[11~20위 · 노출 30+ — 조금만 올리면 1페이지]")
for r in edge[:20]:
    print("  %-34s 노출%5d 클릭%4d 순위%5.1f" % (
        r["keys"][0][:34], r["impressions"], r["clicks"], r["position"]))

# ── 페이지별 — 노출은 큰데 클릭이 안 붙는 페이지
pages = q(["page"])
pages.sort(key=lambda r: -r["impressions"])
print("\n[페이지별 상위 25 — 노출순]")
for r in pages[:25]:
    u = r["keys"][0].replace("https://chukjemoa.co.kr", "")
    print("  %-46s 노출%6d 클릭%5d CTR%5.2f%% 순위%5.1f" % (
        u[:46], r["impressions"], r["clicks"], r["ctr"] * 100, r["position"]))

# ── 종류별로 묶어서
def kind(u):
    p = u.replace("https://chukjemoa.co.kr", "")
    if p.startswith(("/en/", "/ja/", "/zh/", "/es/")): return "외국어"
    if p.startswith("/festival/"): return "축제상세"
    if p.startswith("/blog/"): return "블로그"
    if p.startswith("/jangteo"): return "오일장"
    if p.startswith("/trip"): return "방문차수"
    if p.startswith("/course"): return "코스"
    if len(p) > 1 and p[1:5].isdigit(): return "월별"
    if p in ("/", ""): return "홈"
    return "그 외 국내"
k = collections.defaultdict(lambda: [0, 0, 0])
for r in pages:
    a = k[kind(r["keys"][0])]
    a[0] += r["clicks"]; a[1] += r["impressions"]; a[2] += 1
print("\n[종류별]")
print("  종류        페이지   노출     클릭    CTR")
for name, v in sorted(k.items(), key=lambda x: -x[1][1]):
    ctr = (v[0] / v[1] * 100) if v[1] else 0
    print("  %-10s %5d  %7d  %6d  %5.2f%%" % (name, v[2], v[1], v[0], ctr))

json.dump({"rows": len(rows), "pages": len(pages)}, open("_click_audit_meta.json", "w"))
