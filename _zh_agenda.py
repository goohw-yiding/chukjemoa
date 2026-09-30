# -*- coding: utf-8 -*-
"""중국어(번체 /tw/ · 간체 /zh/) 주간 «자동 안건» — 숫자 + 이번 주에 할 일을 _zh_agenda.md 로 쓴다.
   예약 세션(「축제모아 중국어 주간 관리」)이 이 파일을 먼저 읽고 위에서부터 처리한다. (2026-09-30 신설)
   실행: C:\\Users\\USER\\AppData\\Local\\Programs\\Python\\Python313\\python.exe _zh_agenda.py
   기획서: claude.ai 프로젝트 문서 claude/기획_2026-09-30_축제모아_중국어.md · 인계서 claude/중국어세션_인계서.md

   ⚠️ 봇 필터: 「중국 + 데스크톱 + Direct」 세션은 사람이 아니다(2026-09 실측: 164세션 중 116, 참여 4). 반드시 뺀다.
   ⚠️ GSC 「韩国庆典」 계열 노출은 봇(미국·영국·네덜란드 발, /zh/search/)이다 — 검색어 표에서 뺀다.
"""
import datetime, sys, json, os, re, html, collections, glob
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
END = TODAY - datetime.timedelta(days=3)                      # GSC 3일 지연
W1 = (END - datetime.timedelta(days=6), END); W0 = (W1[0] - datetime.timedelta(days=7), W1[0] - datetime.timedelta(days=1))
R28 = (END - datetime.timedelta(days=27), END); R90 = (END - datetime.timedelta(days=89), END)
GW1 = (TODAY - datetime.timedelta(days=7), TODAY - datetime.timedelta(days=1)); GW0 = (GW1[0] - datetime.timedelta(days=7), GW1[0] - datetime.timedelta(days=1))
FZH = [{"filters": [{"dimension": "page", "operator": "includingRegex", "expression": "chukjemoa\\.co\\.kr/(tw|zh)/"}]}]
out = []; P = out.append
BOT_Q = re.compile(r"韩国庆典")

def gsc(rng, dims, n=5000, flt=FZH):
    body = {"startDate": str(rng[0]), "endDate": str(rng[1]), "dimensions": dims, "rowLimit": n}
    if flt: body["dimensionFilterGroups"] = flt
    return sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])
def sf(field, val, mt="EXACT"):
    return FilterExpression(filter=Filter(field_name=field, string_filter=Filter.StringFilter(match_type=getattr(Filter.StringFilter.MatchType, mt), value=val)))
def rep(rng, dims, mets, flt, limit=500):
    r = ga.run_report(RunReportRequest(property=PROP, date_ranges=[DateRange(start_date=str(rng[0]), end_date=str(rng[1]))],
        dimensions=[Dimension(name=d) for d in dims], metrics=[Metric(name=m) for m in mets], dimension_filter=flt, limit=limit))
    return [([v.value for v in x.dimension_values], [float(v.value) for v in x.metric_values]) for x in r.rows]
def human(rows):   # rows: dims = [..., country, device, channel]
    s = e = b = 0
    for d, m in rows:
        if d[-3] == "China" and d[-2] == "desktop" and d[-1] == "Direct": b += m[0]; continue
        s += m[0]; e += m[1]
    return int(s), int(e), int(b)
LANDF = sf("landingPage", "^/(tw|zh)/.*", "FULL_REGEXP")
LANGF = sf("language", "Chinese", "CONTAINS")
def sess(rng, flt):
    return human(rep(rng, ["country", "deviceCategory", "sessionDefaultChannelGroup"], ["sessions", "engagedSessions"], flt))

# ══════════ 1. 숫자
P(f"# 중국어(번체 tw · 간체 zh) 주간 안건 — {TODAY} 자동 생성\n")
P("## 1. 숫자 — 봇(중국·데스크톱·Direct) 뺀 사람 기준")
try:
    g = {k: gsc(r, ["page"], 1000) for k, r in (("w0", W0), ("w1", W1), ("r90", R90))}
    def agg(rows, lang):
        rs = [x for x in rows if f"/{lang}/" in x["keys"][0] and "/zh/search/" not in x["keys"][0]]
        return sum(x["impressions"] for x in rs), sum(x["clicks"] for x in rs)
    (s0, e0, b0), (s1, e1, b1) = sess(GW0, LANDF), sess(GW1, LANDF)
    (h0, he0, _), (h1, he1, hb1) = sess(GW0, LANGF), sess(GW1, LANGF)
    P(f"| | 전주 | 최근주 |\n|---|---|---|")
    for lang, nm in (("tw", "번체"), ("zh", "간체")):
        (i0, c0), (i1, c1) = agg(g["w0"], lang), agg(g["w1"], lang)
        P(f"| {nm} 구글 노출 / 클릭 | {i0:,.0f} / {c0:.0f} | {i1:,.0f} / {c1:.0f} |")
    P(f"| /tw/·/zh/ 착지 세션(참여) | {s0}({e0}) | {s1}({e1}) |")
    P(f"| 중국어 브라우저 사람 세션(참여) · 사이트 전체 | {h0}({he0}) | {h1}({he1}) — 봇 {hb1} 제외 |")
    (it, ct), (iz, cz) = agg(g["r90"], "tw"), agg(g["r90"], "zh")
    P(f"\n90일 누적 클릭 — 번체 **{ct:.0f}** · 간체 **{cz:.0f}** (기준선 9/30: 번체 13 · 간체 5, 8주 판정 = 번체 2배↑면 번체 투자 계속)")
    P(f"(GSC 기간 {W0[0]:%m/%d}~{W1[1]:%m/%d}, GA4 기간 {GW0[0]:%m/%d}~{GW1[1]:%m/%d})\n")
except Exception as ex:
    P(f"- 숫자 조회 오류: {str(ex)[:300]}\n")

# ══════════ 2. 수익
P("## 2. 수익 링크 클릭 (shop_click · /tw/ /zh/ 페이지 · 최근 14일 / 60일)")
try:
    fl = FilterExpression(and_group=FilterExpressionList(expressions=[sf("eventName", "shop_click"), sf("pagePath", "^/(tw|zh)/.*", "FULL_REGEXP")]))
    for days in (14, 60):
        rows = rep((TODAY - datetime.timedelta(days=days), TODAY - datetime.timedelta(days=1)),
                   ["customEvent:merchant", "customEvent:item", "customEvent:place"], ["eventCount"], fl, 200)
        c = collections.Counter()
        for d, m in rows: c[" · ".join(d)] += int(m[0])
        P(f"- **{days}일**: " + (" / ".join(f"{k} {v}" for k, v in c.most_common(12)) if c else "0건"))
    P("- (9/30 검증 클릭 1건 포함: klook · klook-hotel · tw-busy)")
except Exception as ex:
    P(f"- GA4 조회 오류: {str(ex)[:200]}")
# 링크가 실제로 박혀 있는지 — 빌드 결과물 기준
KL = {"tw/closed": ("137183", "1467024"), "zh/closed": ("137184", "1467027"), "tw/busy": ("137183", "1467029")}
bad = []
for p, (aid, ad) in KL.items():
    try: s = open(os.path.join(ROOT, p, "index.html"), encoding="utf-8").read()
    except Exception: bad.append(f"{p} 파일 없음"); continue
    if f"aid={aid}" not in s or f"aff_adid={ad}" not in s: bad.append(f"/{p}/ 클룩 링크 빠짐(aid {aid}, 광고 {ad})")
    if "136460" in s and "aff_adid=1466" in s: bad.append(f"/{p}/ 폐기된 옛 광고 ID 남음")
kory = sum(1 for f in glob.glob(os.path.join(ROOT, "tw", "**", "index.html"), recursive=True) + glob.glob(os.path.join(ROOT, "zh", "**", "index.html"), recursive=True)
           if 'data-bb="kory-' in open(f, encoding="utf-8").read())
P(f"- 클룩 링크 점검: " + ("✅ 3면 정상" if not bad else "🔴 " + " · ".join(bad)))
P(f"- 코리 블록이 붙은 중국어 페이지: {kory}장\n")

# ══════════ 3. 날짜 정확성 — 중국어 달력에 뜨는 45일 안 축제
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
def checked(fid):
    c = CHK.get(str(fid))
    if not c: return False
    try: return (TODAY - datetime.date.fromisoformat(c["date"])).days < 30 and c.get("result") != "미확인"
    except Exception: return False
rows = []
for f in KO:
    s, e, x, c = eff(f)
    if not (e >= T8 and s <= lim) or x.get("cancel"): continue
    m = man.get(nz(f["title"]))
    why = []
    ms, me = (m["start"].replace("-", ""), m["end"].replace("-", "")) if m else ("", "")
    # 60일 넘게 떨어진 건 다른 회차(봄·가을 따로 하는 축제)라 비교하지 않는다
    near = m and abs((datetime.date(int(ms[:4]), int(ms[4:6]), int(ms[6:])) - datetime.date(int(s[:4]), int(s[4:6]), int(s[6:]))).days) <= 60
    if near and not c and (ms, me) != (s, e):
        why.append(f"한국어 수동목록과 다름({m['start'][5:]}~{m['end'][5:]})")
    if m and not near: m = None
    if nz(f["title"]) in lognote: why.append("한국어 쪽도 미발표")
    major = bool(m)
    if (why or major) and not checked(f["id"]) and not c:
        rows.append((0 if why else 1, s, f, e, why))
rows.sort(key=lambda r: (r[0], r[1]))
if rows:
    P("| id | 축제 | 달력 날짜 | 왜 |\n|---|---|---|---|")
    for _, s, f, e, why in rows[:14]:
        P(f"| {f['id']} | {f['title']} | {s[4:6]}/{s[6:]}~{e[4:6]}/{e[6:]} | {' · '.join(why) or '큰 축제(수동목록) — 공식 확인 필요'} |")
    P(f"\n(후보 {len(rows)}건 — 문제 있는 것 먼저, 최대 14건. 확인하면 data/festivals_intl_checked.json 에 {{id: {{title, date, result, src}}}} → 30일 빠짐.)")
    P("(한국어 「Chukjemoa festival date check」가 공식 URL 로 확정한 날짜는 intl.js 가 매일 자동 반영한다 — 여기엔 안 나온다.)")
else: P("- 없음")
P("")

# ══════════ 4. 교정 파일 정리
P("## 4. 교정 파일 점검 (festivals_intl_fix.json)")
byid = {str(f["id"]): f for f in KO}; n4 = 0
for fid, x in FIX.items():
    if fid.startswith("_") or not isinstance(x, dict): continue
    f = byid.get(fid)
    if not f: P(f"- {fid}: TourAPI 원본에서 사라짐 — 항목 정리"); n4 += 1; continue
    if x.get("start") and x["start"].replace("-", "") == str(f["start"]) and x.get("end", "").replace("-", "") in ("", str(f["end"])):
        P(f"- {fid} {f['title']}: 원본이 교정 날짜를 따라잡음 → 날짜 교정 빼도 됨"); n4 += 1
    if (x.get("end") or str(f["end"])).replace("-", "") < T8 and not x.get("name"):
        P(f"- {fid} {f['title']}: 끝난 축제 — 항목 정리"); n4 += 1
if not n4: P("- 정리할 것 없음")
P("")

# ══════════ 5. 중국어 이름 없는 큰 축제
P("## 5. 중국어 이름이 없는 축제 (45일 안 · 수동목록 큰 축제 먼저) — 공식 중문 명칭 찾기 → 없으면 뜻을 옮겨 name:{tw,zh}")
TR = {}
for l in ("tw", "zh"):
    TR[l] = {}
    for g_ in J(f"data/festivals_{l}.json", []) or []:
        try: TR[l][f"{float(g_['x']):.3f}|{float(g_['y']):.3f}|{str(g_['start'])[:8]}"] = g_
        except Exception: pass
noname = []
for f in KO:
    s, e, x, c = eff(f)
    if not (e >= T8 and s <= lim) or (x.get("name") or {}).get("tw"): continue
    try: k = f"{float(f['x']):.3f}|{float(f['y']):.3f}|{str(f['start'])[:8]}"
    except Exception: continue
    if k in TR["tw"] and k in TR["zh"]: continue
    noname.append((0 if nz(f["title"]) in man else 1, s, f))
noname.sort(key=lambda r: (r[0], r[1]))
for _, s, f in noname[:10]: P(f"- {f['id']} {f['title']} ({s[4:6]}/{s[6:]}~)")
P(f"(총 {len(noname)}건 중 10건)" if noname else "- 없음")
P("")

# ══════════ 6. 데이터 신선도
P("## 6. 데이터 신선도")
import time
def age(p):
    try: return (time.time() - os.path.getmtime(os.path.join(ROOT, p))) / 86400
    except Exception: return 9999
for p, lim_d in (("data/festivals_api.json", 5), ("data/festivals_zh.json", 10), ("data/festivals_tw.json", 10),
                 ("data/tw_holidays.json", 25), ("data/holidays.json", 60), ("tw/index.html", 2), ("zh/index.html", 2)):
    a = age(p); P(f"- {'🔴' if a > lim_d else '✅'} {p} — {a:.1f}일 전" + (f" (기준 {lim_d}일)" if a > lim_d else ""))
tw = J("data/tw_holidays.json", []) or []
ny = str(TODAY.year + 1)
if TODAY.month >= 8 and not any(h["date"].startswith(ny) for h in tw):
    P(f"- 🔴 대만 공휴일에 {ny}년이 없다 — 8월인데 아직 안 올라왔는지 data.gov.tw 14718 확인")
ko_h = J("data/holidays.json", []) or []
if TODAY.month >= 8 and not any(str(h.get("date", "")).startswith(ny) for h in ko_h):
    P(f"- 🔴 한국 공휴일에 {ny}년이 없다")
P("")

# ══════════ 7. 검색어 — 사람이 친 중국어
P("## 7. 사람이 친 중국어 검색어 (28일, 봇 계열 제외) — 제목·본문·새 페이지 근거")
try:
    q = gsc(R28, ["query", "page"], 25000, None)
    hq = [r for r in q if re.search(r"[\u4e00-\u9fff]", r["keys"][0]) and not re.search(r"[\u3040-\u30ff\uac00-\ud7a3]", r["keys"][0]) and not BOT_Q.search(r["keys"][0]) and "/ja/" not in r["keys"][1]]
    hq.sort(key=lambda r: -r["impressions"])
    for r in hq[:15]:
        P(f"- 「{r['keys'][0]}」 노출 {r['impressions']:.0f} · 클릭 {r['clicks']:.0f} · {r['position']:.1f}위 → {r['keys'][1].replace('https://chukjemoa.co.kr', '')}")
    if not hq: P("- 없음")
except Exception as ex:
    P(f"- 조회 오류: {str(ex)[:200]}")
P("")

# ══════════ 8. 11~20위 중국어 페이지 (보강 후보)
P("## 8. 순위 4~20위 중국어 페이지 (28일, 노출순) — 한 칸 올리면 클릭이 나는 자리")
try:
    pg = [r for r in gsc(R28, ["page"], 500) if "/zh/search/" not in r["keys"][0]]
    mid = sorted([r for r in pg if 3.5 <= r["position"] <= 20.5], key=lambda r: -r["impressions"])[:8]
    for r in mid: P(f"- {r['impressions']:.0f}노출 · {r['clicks']:.0f}클릭 · {r['position']:.1f}위 · {r['keys'][0].replace('https://chukjemoa.co.kr', '')}")
    if not mid: P("- 없음")
except Exception as ex:
    P(f"- 조회 오류: {str(ex)[:200]}")

open(os.path.join(ROOT, "_zh_agenda.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print("\n".join(out))
