# -*- coding: utf-8 -*-
"""일본어(/ja/) 주간 «자동 안건» — 숫자 + 이번 주에 할 일을 _ja_agenda.md 로 쓴다.
   예약 세션(「축제모아 일본어 주간 관리 (화)」)이 이 파일을 먼저 읽고 위에서부터 처리한다. (2026-10-04 신설, _zh_agenda.py 를 본떠 만듦)
   실행: C:\\Users\\USER\\AppData\\Local\\Programs\\Python\\Python313\\python.exe _ja_agenda.py
   수익: 코리 블록(전 페이지) + 클룩 aid=136460 (palace 1447552 · closed 1447554 · daytrip 1447555/1447556)
"""
import datetime, sys, json, os, re, html, collections, glob, time
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (RunReportRequest, DateRange, Dimension, Metric,
    FilterExpression, Filter, FilterExpressionList)

ROOT = os.path.dirname(os.path.abspath(__file__))
KEY = r"C:\dev\traffic-dashboard\sa-key.json"; SITE = "https://chukjemoa.co.kr/"; PROP = "properties/545108776"
cred_w = service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred_w, cache_discovery=False)
ga = BetaAnalyticsDataClient(credentials=service_account.Credentials.from_service_account_file(KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"]))
def J(p, d=None):
    try: return json.load(open(os.path.join(ROOT, p), encoding="utf-8"))
    except Exception: return d
TODAY = datetime.date.today(); T8 = TODAY.strftime("%Y%m%d")
END = TODAY - datetime.timedelta(days=3)
W1 = (END - datetime.timedelta(days=6), END); W0 = (W1[0] - datetime.timedelta(days=7), W1[0] - datetime.timedelta(days=1))
R28 = (END - datetime.timedelta(days=27), END); R90 = (END - datetime.timedelta(days=89), END)
GW1 = (TODAY - datetime.timedelta(days=7), TODAY - datetime.timedelta(days=1)); GW0 = (GW1[0] - datetime.timedelta(days=7), GW1[0] - datetime.timedelta(days=1))
FJA = [{"filters": [{"dimension": "page", "operator": "includingRegex", "expression": "chukjemoa\\.co\\.kr/ja/"}]}]
out = []; P = out.append

def gsc(rng, dims, n=5000, flt=FJA):
    body = {"startDate": str(rng[0]), "endDate": str(rng[1]), "dimensions": dims, "rowLimit": n}
    if flt: body["dimensionFilterGroups"] = flt
    return sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])
def sf(field, val, mt="EXACT"):
    return FilterExpression(filter=Filter(field_name=field, string_filter=Filter.StringFilter(match_type=getattr(Filter.StringFilter.MatchType, mt), value=val)))
def rep(rng, dims, mets, flt, limit=500):
    r = ga.run_report(RunReportRequest(property=PROP, date_ranges=[DateRange(start_date=str(rng[0]), end_date=str(rng[1]))],
        dimensions=[Dimension(name=d) for d in dims], metrics=[Metric(name=m) for m in mets], dimension_filter=flt, limit=limit))
    return [([v.value for v in x.dimension_values], [float(v.value) for v in x.metric_values]) for x in r.rows]
def human(rows):   # 데스크톱·Direct·비일본 = 봇 의심으로 따로 센다
    s = e = b = 0
    for d, m in rows:
        if d[-3] not in ("Japan", "South Korea") and d[-2] == "desktop" and d[-1] == "Direct": b += m[0]; continue
        s += m[0]; e += m[1]
    return int(s), int(e), int(b)
LANDF = sf("landingPage", "^/ja/.*", "FULL_REGEXP")
LANGF = sf("language", "Japanese", "CONTAINS")
def sess(rng, flt):
    return human(rep(rng, ["country", "deviceCategory", "sessionDefaultChannelGroup"], ["sessions", "engagedSessions"], flt))

P(f"# 일본어(/ja/) 주간 안건 — {TODAY} 자동 생성\n")
P("## 1. 숫자 — 사람 기준(비일본·데스크톱·Direct 제외)")
try:
    g = {k: gsc(r, ["page"], 1000) for k, r in (("w0", W0), ("w1", W1), ("r90", R90))}
    def agg(rows): return sum(x["impressions"] for x in rows), sum(x["clicks"] for x in rows)
    (s0, e0, b0), (s1, e1, b1) = sess(GW0, LANDF), sess(GW1, LANDF)
    (h0, he0, _), (h1, he1, hb1) = sess(GW0, LANGF), sess(GW1, LANGF)
    (i0, c0), (i1, c1) = agg(g["w0"]), agg(g["w1"])
    P("| | 전주 | 최근주 |\n|---|---|---|")
    P(f"| 구글 노출 / 클릭 | {i0:,.0f} / {c0:.0f} | {i1:,.0f} / {c1:.0f} |")
    P(f"| /ja/ 착지 세션(참여) | {s0}({e0}) | {s1}({e1}) — 봇 의심 {b1} 제외 |")
    P(f"| 일본어 브라우저 사람 세션(참여) · 사이트 전체 | {h0}({he0}) | {h1}({he1}) |")
    ir, cr = agg(g["r90"])
    P(f"\n90일 누적 — 노출 {ir:,.0f} · 클릭 **{cr:.0f}**")
    P(f"(GSC {W0[0]:%m/%d}~{W1[1]:%m/%d}, GA4 {GW0[0]:%m/%d}~{GW1[1]:%m/%d})\n")
except Exception as ex:
    P(f"- 숫자 조회 오류: {str(ex)[:300]}\n")

P("## 2. 수익 링크 클릭 (shop_click · /ja/ · 최근 14일 / 60일)")
try:
    fl = FilterExpression(and_group=FilterExpressionList(expressions=[sf("eventName", "shop_click"), sf("pagePath", "^/ja/.*", "FULL_REGEXP")]))
    for days in (14, 60):
        rows = rep((TODAY - datetime.timedelta(days=days), TODAY - datetime.timedelta(days=1)),
                   ["customEvent:merchant", "customEvent:item", "customEvent:place"], ["eventCount"], fl, 200)
        c = collections.Counter()
        for d, m in rows: c[" · ".join(d)] += int(m[0])
        P(f"- **{days}일**: " + (" / ".join(f"{k} {v}" for k, v in c.most_common(12)) if c else "0건"))
except Exception as ex:
    P(f"- GA4 조회 오류: {str(ex)[:200]}")
KL = {"ja/palace": "1447552", "ja/daytrip": "1447555"}
bad = []
for p, ad in KL.items():
    try: s = open(os.path.join(ROOT, p, "index.html"), encoding="utf-8").read()
    except Exception: bad.append(f"{p} 파일 없음"); continue
    if "aid=136460" not in s or f"aff_adid={ad}" not in s: bad.append(f"/{p}/ 클룩 링크 빠짐(광고 {ad})")
cl = [f for f in glob.glob(os.path.join(ROOT, "ja", "closed", "*", "index.html"))]
cl_ok = sum(1 for f in cl if "aff_adid=1447554" in open(f, encoding="utf-8").read())
if cl and cl_ok == 0: bad.append("/ja/closed/*/ eSIM 링크 0장")
jaf = glob.glob(os.path.join(ROOT, "ja", "**", "index.html"), recursive=True)
kory = sum(1 for f in jaf if 'data-bb="kory-' in open(f, encoding="utf-8").read())
P("- 클룩 링크 점검: " + ("✅ 정상" if not bad else "🔴 " + " · ".join(bad)) + f" (closed eSIM {cl_ok}/{len(cl)}장)")
P(f"- 코리 블록이 붙은 일본어 페이지: {kory}/{len(jaf)}장\n")

P("## 3. 날짜 대조 안건 (공식 발표로 확인 → 틀리면 data/festivals_intl_fix.json)")
KO = J("data/festivals_api.json", []); MAN = J("data/festivals.json", []); LOG = J("data/festival_confirm_log.json", [])
FIX = J("data/festivals_intl_fix.json", {}) or {}; CHK = J("data/festivals_intl_checked.json", {}) or {}
def nz(s): return re.sub(r"제\s*\d+\s*회|\d{4}|[\s·・\-_()（）\[\]「」<>〈〉:：,.&]", "", html.unescape(s or "")).lower()
logto = {}; lognote = {}
for r in LOG if isinstance(LOG, list) else []:
    if r.get("to") and str(r.get("source", "")).startswith("http"): logto[nz(r["name"])] = r
    elif r.get("note"): lognote[nz(r["name"])] = r
man = {nz(m["name"]): m for m in MAN}
lim = (TODAY + datetime.timedelta(days=45)).strftime("%Y%m%d")
def eff(f):
    x = FIX.get(str(f["id"])) or {}
    s, e = str(f["start"]), str(f["end"])
    c = logto.get(nz(f["title"]))
    if c: s, e = c["to"][:10].replace("-", ""), c["to"][11:].replace("-", "")
    if x.get("start"): s = x["start"].replace("-", "")
    if x.get("end"): e = x["end"].replace("-", "")
    return s, e, x, c
BR = J("data/festival_bridge.json", {}) or {}
CONFIRMED = {str(v.get("apiId")) for v in ((BR.get("links") or {}).get("ja") or {}).values() if v.get("kv") == "confirmed"}
def checked(fid):
    if str(fid) in CONFIRMED: return True
    c = CHK.get(str(fid))
    if not c: return False
    try: return (TODAY - datetime.date.fromisoformat(c["date"])).days < 30 and c.get("result") != "미확인"
    except Exception: return False
rows = []
for f in KO:
    s, e, x, c = eff(f)
    if not (e >= T8 and s <= lim) or x.get("cancel"): continue
    m = man.get(nz(f["title"])); why = []
    ms, me = (m["start"].replace("-", ""), m["end"].replace("-", "")) if m else ("", "")
    near = m and abs((datetime.date(int(ms[:4]), int(ms[4:6]), int(ms[6:])) - datetime.date(int(s[:4]), int(s[4:6]), int(s[6:]))).days) <= 60
    if near and not c and (ms, me) != (s, e): why.append(f"한국어 수동목록과 다름({m['start'][5:]}~{m['end'][5:]})")
    if m and not near: m = None
    if nz(f["title"]) in lognote: why.append("한국어 쪽도 미발표")
    if (why or m) and not checked(f["id"]) and not c: rows.append((0 if why else 1, s, f, e, why))
rows.sort(key=lambda r: (r[0], r[1]))
if rows:
    P("| id | 축제 | 달력 날짜 | 왜 |\n|---|---|---|---|")
    for _, s, f, e, why in rows[:14]:
        P(f"| {f['id']} | {f['title']} | {s[4:6]}/{s[6:]}~{e[4:6]}/{e[6:]} | {' · '.join(why) or '큰 축제(수동목록) — 공식 확인 필요'} |")
    P(f"\n(후보 {len(rows)}건 — 최대 14건. 확인하면 data/festivals_intl_checked.json 에 기록 → 30일 빠짐. 한국어 확정 날짜는 intl.js 가 자동 반영)")
else: P("- 없음")
P("")

P("## 4. 일본어 이름이 없는 축제 (45일 안 · 큰 축제 먼저) — 공식 일본어 명칭 → 없으면 뜻을 옮겨 name:{ja}")
TRJ = {}
for g_ in J("data/festivals_ja.json", []) or []:
    try: TRJ[f"{float(g_['x']):.3f}|{float(g_['y']):.3f}|{str(g_['start'])[:8]}"] = g_
    except Exception: pass
noname = []
for f in KO:
    s, e, x, c = eff(f)
    if not (e >= T8 and s <= lim) or (x.get("name") or {}).get("ja"): continue
    try: k = f"{float(f['x']):.3f}|{float(f['y']):.3f}|{str(f['start'])[:8]}"
    except Exception: continue
    if k in TRJ: continue
    noname.append((0 if nz(f["title"]) in man else 1, s, f))
noname.sort(key=lambda r: (r[0], r[1]))
for _, s, f in noname[:10]: P(f"- {f['id']} {f['title']} ({s[4:6]}/{s[6:]}~)")
P(f"(총 {len(noname)}건 중 10건)" if noname else "- 없음")
P("")

P("## 5. 데이터 신선도")
def age(p):
    try: return (time.time() - os.path.getmtime(os.path.join(ROOT, p))) / 86400
    except Exception: return 9999
for p, lim_d in (("data/festivals_api.json", 5), ("data/festivals_ja.json", 10), ("data/holidays.json", 60), ("ja/index.html", 2)):
    a = age(p); P(f"- {'🔴' if a > lim_d else '✅'} {p} — {a:.1f}일 전" + (f" (기준 {lim_d}일)" if a > lim_d else ""))
P("")

P("## 6. 사람이 친 일본어 검색어 (28일) — 제목·본문·새 페이지 근거")
try:
    q = gsc(R28, ["query", "page"], 25000, None)
    hq = [r for r in q if re.search(r"[\u3040-\u30ff]", r["keys"][0]) or ("/ja/" in r["keys"][1] and re.search(r"[\u4e00-\u9fff]", r["keys"][0]) and not re.search(r"[\uac00-\ud7a3]", r["keys"][0]))]
    hq.sort(key=lambda r: -r["impressions"])
    for r in hq[:15]:
        P(f"- 「{r['keys'][0]}」 노출 {r['impressions']:.0f} · 클릭 {r['clicks']:.0f} · {r['position']:.1f}위 → {r['keys'][1].replace('https://chukjemoa.co.kr', '')}")
    if not hq: P("- 없음")
except Exception as ex:
    P(f"- 조회 오류: {str(ex)[:200]}")
P("")

P("## 7. 순위 4~20위 일본어 페이지 (28일, 노출순) — 한 칸 올리면 클릭이 나는 자리")
try:
    pg = gsc(R28, ["page"], 500)
    mid = sorted([r for r in pg if 3.5 <= r["position"] <= 20.5], key=lambda r: -r["impressions"])[:8]
    for r in mid: P(f"- {r['impressions']:.0f}노출 · {r['clicks']:.0f}클릭 · {r['position']:.1f}위 · {r['keys'][0].replace('https://chukjemoa.co.kr', '')}")
    if not mid: P("- 없음")
except Exception as ex:
    P(f"- 조회 오류: {str(ex)[:200]}")

open(os.path.join(ROOT, "_ja_agenda.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print("\n".join(out))
