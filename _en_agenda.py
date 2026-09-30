# -*- coding: utf-8 -*-
"""영어(/en/) 주간 «자동 안건» — 숫자 + 이번 주에 할 일 목록을 만들어 _en_agenda.md 로 쓴다.
   예약 세션은 이 파일을 먼저 읽고 위에서부터 처리한다. (2026-09-30 영어 세션 신설)
   실행: Python313\\python.exe _en_agenda.py
"""
import datetime, sys, json, os, collections
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric, FilterExpression, Filter, FilterExpressionList

ROOT = os.path.dirname(os.path.abspath(__file__))
KEY = r"C:\dev\traffic-dashboard\sa-key.json"; SITE = "https://chukjemoa.co.kr/"; PROP = "properties/545108776"
sc = build("searchconsole", "v1", credentials=service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/webmasters"]), cache_discovery=False)
ga = BetaAnalyticsDataClient(credentials=service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"]))
J = lambda p: json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
TODAY = datetime.date.today(); T8 = TODAY.strftime("%Y%m%d")
END = TODAY - datetime.timedelta(days=3)
W1 = (END - datetime.timedelta(days=6), END); W0 = (W1[0] - datetime.timedelta(days=7), W1[0] - datetime.timedelta(days=1))
R28 = (END - datetime.timedelta(days=27), END); R90 = (END - datetime.timedelta(days=89), END)
F = [{"filters": [{"dimension": "page", "operator": "contains", "expression": "chukjemoa.co.kr/en/"}]}]
out = []; P = out.append

def gsc(rng, dims, n=5000):
    return sc.searchanalytics().query(siteUrl=SITE, body={"startDate": str(rng[0]), "endDate": str(rng[1]), "dimensions": dims, "dimensionFilterGroups": F, "rowLimit": n}).execute().get("rows", [])
def tot(rng):
    r = gsc(rng, [], 1); return (r[0]["impressions"], r[0]["clicks"]) if r else (0, 0)
def sf(field, val, begins=False):
    mt = Filter.StringFilter.MatchType.BEGINS_WITH if begins else Filter.StringFilter.MatchType.EXACT
    return FilterExpression(filter=Filter(field_name=field, string_filter=Filter.StringFilter(match_type=mt, value=val)))
def sess(rng):
    r = ga.run_report(RunReportRequest(property=PROP, date_ranges=[DateRange(start_date=str(rng[0]), end_date=str(rng[1]))], metrics=[Metric(name="sessions"), Metric(name="engagedSessions")], dimension_filter=sf("landingPage", "/en/", True))).rows
    return (int(r[0].metric_values[0].value), int(r[0].metric_values[1].value)) if r else (0, 0)

# ── 데이터
EN = J("data/festivals_en.json"); FIX = J("data/festivals_en_fix.json")
try: CHK = J("data/festivals_en_checked.json")
except Exception: CHK = {}
KO = J("data/festivals_api.json")
SLUGS = {}
try:
    for k, v in J("data/en_festival_slugs.json").items(): SLUGS[str(k)] = v
except Exception: pass
import re
def slugify(t): return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", t.lower())).strip("-")[:60]
eff = {}
for f in EN:
    g = dict(f); fx = FIX.get(str(f["id"]))
    if isinstance(fx, dict):
        for k in ("start", "end", "addr", "x", "y"):
            if k in fx: g[k] = fx[k]
    eff[str(f["id"])] = g

# ── 1. 숫자
(i0, c0), (i1, c1) = tot(W0), tot(W1); (s0, e0), (s1, e1) = sess(W0), sess(W1); i90, c90 = tot(R90)
P(f"# 영어 페이지 주간 안건 — {TODAY} 자동 생성\n")
P("## 1. 숫자 (GSC 3일 지연)")
P(f"| | 전주 {W0[0]:%m/%d}~{W0[1]:%m/%d} | 최근주 {W1[0]:%m/%d}~{W1[1]:%m/%d} |\n|---|---|---|")
P(f"| 구글 노출 | {i0:,.0f} | {i1:,.0f} |\n| 구글 클릭 | {c0:.0f} | {c1:.0f} |\n| 영어 착지 세션(참여) | {s0}({e0}) | {s1}({e1}) |")
P(f"\n90일 누적 클릭 **{c90:.0f}** / 목표 100 (12월 말)\n")

# ── 2. 수익 클릭
P("## 2. 수익 링크 클릭 (shop_click, /en/ 페이지, 최근 14일)")
try:
    rows = ga.run_report(RunReportRequest(property=PROP, date_ranges=[DateRange(start_date=str(TODAY - datetime.timedelta(days=14)), end_date="yesterday")],
        dimensions=[Dimension(name="customEvent:merchant"), Dimension(name="customEvent:item"), Dimension(name="pagePath")], metrics=[Metric(name="eventCount")],
        dimension_filter=FilterExpression(and_group=FilterExpressionList(expressions=[sf("eventName", "shop_click"), sf("pagePath", "/en/", True)])), limit=200)).rows
    agg = collections.Counter()
    for r in rows:
        d = [x.value for x in r.dimension_values]; agg[(d[0], d[1])] += int(r.metric_values[0].value)
    if agg:
        for (m, it), n in agg.most_common(): P(f"- {m} · {it}: {n}")
    else: P("- 0건")
    P("- (참고: 9/30 Creatrip 발사 테스트 1건 포함 가능)")
except Exception as e:
    P(f"- GA4 조회 오류: {str(e)[:200]}")
P("")

# ── GSC 28일 페이지 노출
pg28 = {r["keys"][0].replace("https://chukjemoa.co.kr", ""): r for r in gsc(R28, ["page"])}
def imp_of(f):
    for u, r in pg28.items():
        if u.startswith("/en/festival/") and slugify(f["title"]) in u: return r["impressions"], r["position"], u
    return 0, 0, ""

# ── 3. 날짜 대조 안건
P("## 3. 날짜 대조 안건 (공식 발표로 확인 → 틀리면 data/festivals_en_fix.json)")
def recently_checked(fid):
    c = CHK.get(fid); 
    if not c: return False
    try: return (TODAY - datetime.date.fromisoformat(c["date"])).days < 30 and c.get("result") != "미확인"
    except Exception: return False
cand = []
lim = (TODAY + datetime.timedelta(days=45)).strftime("%Y%m%d")
for fid, f in eff.items():
    if len(f.get("ov", "")) < 200: continue
    imp, pos, u = imp_of(f)
    upcoming = f["end"] >= T8 and f["start"] <= lim
    stale = f["end"] < T8 and imp >= 10
    if (upcoming or stale) and not recently_checked(fid):
        why = "45일 안" if upcoming else "끝남 처리인데 검색 노출"
        cand.append((imp, fid, f, why, pos))
cand.sort(key=lambda x: -x[0])
if cand:
    P("| 28일 노출 | id | 축제 | 현재 날짜 | 왜 |\n|---|---|---|---|---|")
    for imp, fid, f, why, pos in cand[:15]:
        P(f"| {imp:.0f} | {fid} | {f['title']} | {f['start']}~{f['end']} | {why} |")
    P(f"\n(후보 {len(cand)}건 중 노출순 15건. 확인하면 data/festivals_en_checked.json 에 {{id: {{date, src, result}}}} 기록 → 30일 동안 안건에서 빠진다)")
else: P("- 없음")
unconf = [f"{k} {eff.get(k, {}).get('title', '')}" for k, v in CHK.items() if v.get("result") == "미확인"]
if unconf: P("\n**미확인으로 남은 것(매주 다시 본다):** " + " · ".join(unconf))
P("")

# ── 4. 교정 파일 점검
P("## 4. 교정 파일 점검 (festivals_en_fix.json)")
raw = {str(f["id"]): f for f in EN}; n4 = 0
for fid, fx in FIX.items():
    if not isinstance(fx, dict) or fid.startswith("_"): continue
    r = raw.get(fid)
    if not r: P(f"- {fid}: TourAPI 영문에서 사라짐 — 항목 정리"); n4 += 1; continue
    if "start" in fx and r["start"] == fx["start"] and r["end"] == fx.get("end", r["end"]):
        P(f"- {fid} {r['title']}: TourAPI 가 교정 날짜를 따라잡음 → 날짜 교정 빼도 됨"); n4 += 1
    for key in ("aff", "note"):
        until = (fx.get(key) or {}).get("until") if key == "aff" else fx.get("noteUntil")
        if until and until < T8: P(f"- {fid} {r['title']}: {key} 기한({until}) 지남 → 페이지에서 자동으로 빠짐, 항목 정리"); n4 += 1
    end = fx.get("end", r["end"])
    if end < T8 and (fx.get("aff") or fx.get("note")): P(f"- {fid} {r['title']}: 축제 끝남({end}) — note/aff 는 자동 숨김, 다음 해 날짜 나오면 교체"); n4 += 1
if not n4: P("- 정리할 것 없음")
P("")

# ── 5. 한글 원제 오매칭 후보
P("## 5. 지도 복사 칸 한글 원제 — 좌표만으로 붙은 새 건 (눈으로 확인)")
import math
def k3(x, y): return f"{float(x):.3f},{float(y):.3f}"
D, X = {}, {}
for f in KO:
    try:
        if float(f["x"]) > 0 and float(f["y"]) > 0:
            D[k3(f["x"], f["y"]) + "|" + f["start"]] = f; X.setdefault(k3(f["x"], f["y"]), f)
    except Exception: pass
KNOWN_OK = {"705394", "3547242", "2657121", "3544525", "3307776", "292836", "697199", "4091877"}
n5 = 0
for fid, f in eff.items():
    if len(f.get("ov", "")) < 200 or fid in FIX or fid in KNOWN_OK: continue
    try:
        if not (float(f["x"]) > 0): continue
    except Exception: continue
    if D.get(k3(f["x"], f["y"]) + "|" + f["start"]): continue
    x = X.get(k3(f["x"], f["y"]))
    if x: P(f"- {fid} {f['title']} → 「{x['title']}」 ({x['start']})"); n5 += 1
if not n5: P("- 새 건 없음")
P("")

# ── 6. 11~20위 축제 페이지 (보강 후보)
P("## 6. 11~20위 축제 페이지 (28일, 보강 후보 — 검색어 먼저)")
mid = sorted([(r["impressions"], r["position"], u) for u, r in pg28.items() if u.startswith("/en/festival/") and u.count("/") > 3 and 10.5 <= r["position"] <= 20.5], reverse=True)[:8]
for imp, pos, u in mid: P(f"- {imp:.0f}노출 · {pos:.1f}위 · {u}")
if not mid: P("- 없음")
P("")

# ── 7. 제휴 상품 후보 — 45일 안 + 노출 있는 축제 중 상품 링크가 아직 없는 것
P("## 7. 제휴 상품 찾을 축제 (45일 안, 노출순, aff 없음) — Creatrip 먼저 검색, 상품 페이지 열어 날짜 확인 뒤")
pool = []
for fid, f in eff.items():
    if f["end"] >= T8 and f["start"] <= lim and not (FIX.get(fid) or {}).get("aff"):
        imp, pos, u = imp_of(f)
        if imp > 0: pool.append((imp, f["title"], f["start"], f["end"]))
for imp, t, s, e in sorted(pool, reverse=True)[:8]: P(f"- {t} ({s}~{e}) · 28일 노출 {imp:.0f}")
if not pool: P("- 없음")

open(os.path.join(ROOT, "_en_agenda.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print("\n".join(out))
