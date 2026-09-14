# -*- coding: utf-8 -*-
"""
축제모아 주간 SEO 리포트 — 페이지 축 + 봇 필터.

왜 이렇게 짰나 (2026-09-14 실측 근거):
  1) 검색어 축은 전체의 26%만 본다. 28일 기준 전체 클릭 1,093 / 검색어로 보이는 클릭 282(26%),
     노출 63,130 / 14,691(23%). 익명화 때문이다. 반면 «페이지» 축은 클릭 1,094 로 거의 온전하다.
     ⇒ 머리는 페이지로 잡고 검색어는 보조로 쓴다.
  2) 검색어 전량은 페이징해야 나온다(1,551개). rowLimit 만 올리면 1,000 에서 잘린다.
  3) 0클릭 대량 노출은 대부분 사람이 아니다. 「韩国庆典」 1,169노출은 데스크톱 100% ·
     미국/영국/네덜란드/독일 · 순위 10.x 고정 · 계단식 점프였다. 사이트 전체 모바일 비중은 33%.
     ⇒ 모바일 비중이 10% 미만인 0클릭 대량 검색어는 «봇 의심»으로 빼고 센다.
  4) 즉답형(추석 언제·날짜류)은 구글이 SERP 에서 답해 CTR 이 원래 0에 가깝다. 따로 접는다.
실행: py -3 _seo_weekly.py [기준일수=7]
"""
import datetime, re, sys, json, urllib.request, io, collections
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric

# ⚠️ 윈도우 기본 콘솔은 cp949 라서 «—» 하나에 UnicodeEncodeError 로 죽는다.
#    파일은 이미 다 써 놓고 마지막 print 에서 죽는 꼴이라 더 헷갈린다. 여기서 못 박는다.
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
PROP = "properties/545108776"
OUT = r"C:\dev\_seo_weekly.md"
DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 7

cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

# ⚠️ 이 사이트 트래픽의 70%는 네이버다(2026-09-14 실측: 네이버 7,163 / 구글·기타검색 1,419 / 10,152세션).
#    서치콘솔만 보면 «14%를 깊게 보고 70%를 안 보는» 리포트가 된다. 네이버는 검색어를 안 주므로
#    GA4 의 유입원·랜딩으로 본다. 네이버 서치어드바이저 자격증명은 이 PC 에 없다(2026-09-14 확인).
ga_cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
ga = BetaAnalyticsDataClient(credentials=ga_cred)

def g4(dims, mets, rng, n=300):
    r = ga.run_report(RunReportRequest(property=PROP,
        date_ranges=[DateRange(start_date=str(rng[0]), end_date=str(rng[1]))],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets], limit=n))
    return [([d.value for d in x.dimension_values], [m.value for m in x.metric_values]) for x in r.rows]

def channel_of(src, med):
    s, m = src.lower(), med.lower()
    if "naver" in s: return "네이버"
    if "ai-assistant" in m or any(k in s for k in ("chatgpt","perplexity","gemini","copilot","claude")): return "AI"
    if any(k in s for k in ("google","bing","daum","yahoo")): return "구글·기타검색"
    if "direct" in s: return "직접"
    return "기타"

end = datetime.date.today() - datetime.timedelta(days=2)      # 최근 2일은 덜 찬다
cur = (end - datetime.timedelta(days=DAYS - 1), end)
prev = (cur[0] - datetime.timedelta(days=DAYS), cur[0] - datetime.timedelta(days=1))

def q(dims, rng, filt=None):
    out, off = [], 0
    while True:
        body = {"startDate": str(rng[0]), "endDate": str(rng[1]),
                "dimensions": dims, "rowLimit": 25000, "startRow": off}
        if filt: body["dimensionFilterGroups"] = [{"filters": filt}]
        r = sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])
        if not r: break
        out += r; off += len(r)
        if len(r) < 25000: break
    return out

IMMEDIATE = re.compile(r'(언제|날짜|며칠|몇일|무슨요일|요일|when is|日付)')
def key(r, i=0): return r["keys"][i]

L = []
def w(s=""): L.append(s)

# ── 1. 헤드라인 ────────────────────────────────────────────────
tc, tp = (q([], cur) or [{}]), (q([], prev) or [{}])
a, b = tc[0], tp[0]
def d(x, y, pct=False):
    v = x - y
    return ("%+.2f%%p" % (v*100)) if pct else ("%+d" % v)
w("# 축제모아 주간 검색 리포트 — %s ~ %s (%d일)" % (cur[0], cur[1], DAYS))
w("")
w("직전 %d일(%s~%s) 대비" % (DAYS, prev[0], prev[1]))
w("")

# ── 0. 채널 (GA4) — 트래픽의 70%가 네이버다. 여기부터 본다 ─────
def ch_sessions(rng):
    b = collections.Counter()
    for d, m in g4(["sessionSource", "sessionMedium"], ["sessions"], rng):
        b[channel_of(d[0], d[1])] += int(m[0])
    return b
cc, cp = ch_sessions(cur), ch_sessions(prev)
tc, tp2 = sum(cc.values()), sum(cp.values())
w("## 0. 어디서 오나 (GA4 세션)")
w("")
w("| 채널 | 이번 | 지난 | 변화 | 비중 |")
w("|---|---:|---:|---:|---:|")
w("| **전체** | **%d** | %d | %+d | |" % (tc, tp2, tc-tp2))
for k in ["네이버", "구글·기타검색", "직접", "기타", "AI"]:
    if not cc.get(k) and not cp.get(k): continue
    w("| %s | %d | %d | %+d | %.1f%% |" % (k, cc.get(k,0), cp.get(k,0), cc.get(k,0)-cp.get(k,0),
                                            100.0*cc.get(k,0)/max(1,tc)))
w("")
w("> **이 사이트는 네이버 사이트입니다.** 아래 2절(구글)은 전체의 %.0f%%만 다룹니다 — 거기 숫자가 좋다고"
  % (100.0*cc.get("구글·기타검색",0)/max(1,tc)))
w("> 사이트가 잘 되는 것도, 나쁘다고 사이트가 나쁜 것도 아닙니다.")
w("")

# ── 1. 네이버 ─────────────────────────────────────────────────
w("## 1. 네이버 — 랜딩으로 봅니다")
w("")
w("네이버는 검색어를 안 알려 줍니다(서치어드바이저 자격증명도 이 PC 에 없습니다).")
w("그래서 «어느 페이지로 들어왔나»로 봅니다.")
w("")
def land(rng, naver_only=True):
    out = collections.Counter()
    for d, m in g4(["landingPage", "sessionSource"], ["sessions"], rng, n=2000):
        if naver_only and "naver" not in d[1].lower(): continue
        out[d[0] or "(없음)"] += int(m[0])
    return out
nl, npv = land(cur), land(prev)
w("### 네이버 랜딩 상위 12")
w("")
w("| 랜딩 | 이번 | 지난 | 변화 |")
w("|---|---:|---:|---:|")
for p, v in nl.most_common(12):
    w("| %s | %d | %d | %+d |" % (p[:46], v, npv.get(p,0), v-npv.get(p,0)))
w("")
GROUPS = [("오일장", "/jangteo"), ("월별", ("/2026","/2027")), ("축제상세", "/festival"),
          ("블로그", "/blog"), ("외국어", ("/en","/ja","/zh","/tw","/es"))]
def grp(counter):
    g = collections.Counter()
    for p, v in counter.items():
        for name, pref in GROUPS:
            if p.startswith(pref if isinstance(pref, tuple) else (pref,)):
                g[name] += v; break
        else: g["그 외"] += v
    return g
gc, gp2 = grp(nl), grp(npv)
w("### 묶음별 — 무엇이 주력인가")
w("")
w("| 묶음 | 이번 | 지난 | 변화 |")
w("|---|---:|---:|---:|")
for name, _ in GROUPS + [("그 외", None)]:
    if not gc.get(name) and not gp2.get(name): continue
    w("| %s | %d | %d | %+d |" % (name, gc.get(name,0), gp2.get(name,0), gc.get(name,0)-gp2.get(name,0)))
w("")

# ── 1-2. AI 유입 ──────────────────────────────────────────────
# AEO 계측기(Perplexity·ChatGPT)는 «물었을 때 우리가 언급되나»를 잰다.
# 여기는 «AI 가 사람을 실제로 보냈나»다. 둘은 다른 것이고, 이쪽은 공짜로 정확하다.
# 2026-09-14 실측: 유입 1위가 Gemini 인데 계측기는 Gemini 를 안 잰다(약관상 실사용축 금지 + 무료티어 소진).
# ⚠️ 같은 엔진이 여러 이름으로 들어온다(gemini.google.com 과 gemini, perplexity.ai 와 perplexity).
#    엔진 단위로 합치지 않으면 1위가 쪼개져서 «누가 제일 많이 보내나»를 잘못 읽는다.
AI_ENGINE = (("gemini","Gemini"), ("chatgpt","ChatGPT"), ("openai","ChatGPT"),
             ("perplexity","Perplexity"), ("copilot","Copilot"),
             ("claude","Claude"), ("anthropic","Claude"))
def ai_name(src):
    s = src.lower()
    for k, n in AI_ENGINE:
        if k in s: return n
    return src

def ai_rows(rng):
    out = collections.Counter()
    for d, m in g4(["sessionSource", "sessionMedium"], ["sessions"], rng):
        if channel_of(d[0], d[1]) == "AI": out[ai_name(d[0])] += int(m[0])
    return out
ac, ap = ai_rows(cur), ai_rows(prev)
w("### 1-2. AI 유입 — 어느 AI 가 사람을 보내나")
w("")
if sum(ac.values()):
    w("| 엔진 | 이번 | 지난 | 변화 |")
    w("|---|---:|---:|---:|")
    for s, v in ac.most_common(8):
        w("| %s | %d | %d | %+d |" % (s, v, ap.get(s,0), v-ap.get(s,0)))
    w("| **합계** | **%d** | %d | %+d |" % (sum(ac.values()), sum(ap.values()),
                                            sum(ac.values())-sum(ap.values())))
    w("")
    al = collections.Counter()
    # ⚠️ 여기서 반복변수를 d 로 쓰면 «전역 d(증감 표기 함수)»를 덮어쓴다. 실제로 한 번 그렇게 터졌다.
    # ⚠️ medium 이 ai-assistant 인 것만 세면 일부가 빠진다(위 표 57 인데 페이지합이 46 이었다).
    #    위 표와 «같은 판정»(channel_of)을 써야 합계가 맞는다.
    for _d, m in g4(["landingPage", "sessionSource", "sessionMedium"], ["sessions"], cur, n=2000):
        if channel_of(_d[1], _d[2]) == "AI": al[_d[0] or "(없음)"] += int(m[0])
    if al:
        w("AI 가 보낸 사람이 들어온 페이지: " + " · ".join("%s %d" % (p[:28], v) for p, v in al.most_common(6)))
        w("")
    w("> AEO 계측기는 **Perplexity·ChatGPT 만** 잽니다. 위 표의 1위가 그 둘이 아니면")
    w("> **재는 것과 오는 것이 어긋나 있다**는 뜻입니다. (Gemini 는 grounding 약관·무료티어 문제로 계측 보류)")
else:
    w("이번 기간 AI 유입이 잡히지 않았습니다.")
w("")

w("## 2. 구글 (서치콘솔)")
w("")
w("| | 이번 | 지난 | 변화 |")
w("|---|---:|---:|---:|")
w("| 클릭 | %d | %d | %s |" % (a.get("clicks",0), b.get("clicks",0), d(a.get("clicks",0), b.get("clicks",0))))
w("| 노출 | %d | %d | %s |" % (a.get("impressions",0), b.get("impressions",0), d(a.get("impressions",0), b.get("impressions",0))))
w("| CTR | %.2f%% | %.2f%% | %s |" % (a.get("ctr",0)*100, b.get("ctr",0)*100, d(a.get("ctr",0), b.get("ctr",0), True)))
w("| 평균순위 | %.2f | %.2f | %+.2f |" % (a.get("position",0), b.get("position",0), b.get("position",0)-a.get("position",0)))
w("")
# CTR 이 떨어졌다면 «노출이 어디서 늘었나»로 설명한다 — 순위·클릭이 같이 올랐는데 CTR 만 내려가는 건
# 대개 «큰 머리 검색어에 새로 노출이 붙어서»다. 성과 악화가 아니다.
di = a.get("impressions",0)-b.get("impressions",0)
dc = a.get("clicks",0)-b.get("clicks",0)
if a.get("ctr",0) < b.get("ctr",0) and dc > 0:
    w("> **CTR 은 떨어졌지만 클릭은 늘었습니다**(클릭 %+d · 노출 %+d). 노출이 클릭보다 빨리 늘면 CTR 은 산술적으로 내려갑니다." % (dc, di))
    w("> 이건 성과가 나빠진 게 아니라 «더 큰 검색어에 새로 노출이 붙었다»는 뜻일 때가 많습니다.")
    w("> 아래 봇 표와 페이지 표에서 **노출이 어디서 늘었는지**를 먼저 보고 판단하세요.")
    w("")

# ── 2. 봇 필터 ─────────────────────────────────────────────────
qc = q(["query"], cur)
dev_all = {key(r): r["impressions"] for r in q(["device"], cur)}
site_mobile = 100.0*dev_all.get("MOBILE",0)/max(1,sum(dev_all.values()))
suspects = []
for x in sorted([x for x in qc if x["clicks"]==0 and x["impressions"]>=50], key=lambda z:-z["impressions"])[:25]:
    F=[{"dimension":"query","operator":"equals","expression":key(x)}]
    dv={key(r):r["impressions"] for r in q(["device"], cur, F)}
    mob=100.0*dv.get("MOBILE",0)/max(1,sum(dv.values()))
    ct=sorted(q(["country"], cur, F), key=lambda z:-z["impressions"])[:3]
    foreign = not any(r["keys"][0]=="kor" for r in ct[:1])
    if mob < 10:
        suspects.append((key(x), x["impressions"], x["position"], mob,
                         " · ".join("%s %d"%(r["keys"][0],r["impressions"]) for r in ct), foreign))
bot_imp = sum(s[1] for s in suspects)
w("### 2-1. 봇 의심 — 빼고 보세요")
w("")
w("사이트 전체 모바일 비중은 **%.0f%%**입니다. 아래는 0클릭 대량 노출인데 모바일이 10%% 미만인 것 —" % site_mobile)
w("사람의 검색으로 보기 어렵습니다(순위 추적기·스크레이퍼로 추정).")
w("")
if suspects:
    w("| 검색어 | 노출 | 순위 | 모바일 | 국가 |")
    w("|---|---:|---:|---:|---|")
    for s in suspects:
        w("| %s | %d | %.1f | %.0f%% | %s |" % (s[0], s[1], s[2], s[3], s[4]))
    w("")
    w("합계 노출 **%d** — 검색어로 보이는 노출의 %.0f%%입니다. 「노출이 늘었다」를 이걸로 설명하지 마세요."
      % (bot_imp, 100.0*bot_imp/max(1,sum(x["impressions"] for x in qc))))
else:
    w("이번 주는 없습니다.")
w("")

# ── 3. 페이지 축 (머리) ────────────────────────────────────────
# ⚠️ 점프 링크(#sec1…)는 «부모와 중복»이다. 2026-09-14 실측으로 확인했다 —
#    9/06~12 주에 전체 합계 노출 32,053 / 앵커 뺀 페이지합 32,349(차이 296, 0.9%) /
#    앵커 더한 페이지합 41,661(차이 9,608, 30%). 즉 같은 노출을 두 번 세는 것이다.
#    ⛔ 부모에 «더하면» 안 된다(한 번 그렇게 만들었다가 30% 부풀렸다). 빼고 세고, 따로 적는다.
def split_anchor(rows):
    m, anch_i, anch_c = {}, 0, 0
    for r in rows:
        u = key(r)
        if "#" in u:
            anch_i += r["impressions"]; anch_c += r["clicks"]
            continue
        m[u] = r
    return m, anch_i, anch_c

pc, anch_i, anch_c = split_anchor(q(["page"], cur))
pp, _, _ = split_anchor(q(["page"], prev))
w("### 2-2. 페이지 — 클릭이 온전하게 보이는 쪽")
w("")
w("검색어 축은 익명화로 클릭의 일부만 보입니다. 판단은 이 표로 하세요.")
w("")
w("> ⚠️ **점프 링크(`#sec1` 같은 것)는 «뺐습니다».** 이번 주 앵커 노출 %d · 클릭 %d —" % (anch_i, anch_c))
w("> 같은 노출을 두 번 세는 것이라 부모에 더하면 30% 부풀어 오릅니다(2026-09-14 실측 확인).")
w("> 아래 노출 숫자는 앵커를 뺀 값이고, 맨 위 전체 합계와 0.9% 안에서 맞습니다.")
w("")
rows=[]
for u,r in pc.items():
    o=pp.get(u,{})
    rows.append((u, r["clicks"], o.get("clicks",0), r["impressions"], r["position"]))
rows.sort(key=lambda x:-x[1])
w("### 벌고 있는 페이지 상위 15")
w("")
w("| 페이지 | 클릭 | 지난주 | 노출 | 순위 |")
w("|---|---:|---:|---:|---:|")
for u,c,pcl,i,pos in rows[:15]:
    w("| %s | %d | %d | %d | %.1f |" % (u.replace("https://chukjemoa.co.kr",""), c, pcl, i, pos))
w("")
w("### 늘고 준 것 (클릭 기준, 3 이상 변한 것만)")
w("")
mv=sorted([r for r in rows if abs(r[1]-r[2])>=3], key=lambda x:-(x[1]-x[2]))
w("| 페이지 | 지난주 → 이번 | 노출 | 순위 |")
w("|---|---:|---:|---:|")
for u,c,pcl,i,pos in mv[:8]+mv[-8:] if len(mv)>16 else mv:
    w("| %s | %d → %d | %d | %.1f |" % (u.replace("https://chukjemoa.co.kr",""), pcl, c, i, pos))
w("")

# ── 4. 못 벌고 있는 페이지 ─────────────────────────────────────
w("### 노출은 큰데 못 버는 페이지 (노출 100+ · CTR 1% 미만)")
w("")
w("| 페이지 | 노출 | 클릭 | 순위 | 지금 제목 |")
w("|---|---:|---:|---:|---|")
poor=[r for r in rows if r[3]>=100 and (r[1]/max(1,r[3]))<0.01]
poor.sort(key=lambda x:-x[3])
def title_of(u):
    try:
        rq=urllib.request.Request(u, headers={"User-Agent":"Mozilla/5.0"})
        h=urllib.request.urlopen(rq, timeout=12).read().decode("utf-8","ignore")
        m=re.search(r"<title[^>]*>(.*?)</title>", h, re.S)
        return re.sub(r"\s+"," ", m.group(1)).strip()[:70] if m else "?"
    except Exception as e:
        return "(못 읽음)"
for u,c,pcl,i,pos in poor[:10]:
    w("| %s | %d | %d | %.1f | %s |" % (u.replace("https://chukjemoa.co.kr",""), i, c, pos, title_of(u)))
w("")
w("> 제목이 이미 그 검색어를 겨냥하고 있는지 «표의 마지막 칸»으로 확인하세요. 이미 돼 있으면 제목 문제가 아닙니다.")
w("")

# ── 5. 검색어 (보조) ──────────────────────────────────────────
botset={s[0] for s in suspects}
human=[x for x in qc if key(x) not in botset]
imm=[x for x in human if IMMEDIATE.search(key(x))]
real=[x for x in human if not IMMEDIATE.search(key(x))]
w("### 2-3. 검색어 — 보조 지표")
w("")
w("(익명화로 클릭의 일부만 보입니다. 추세만 참고하세요.)")
w("")
w("### 순위 문턱 — 8~15위인데 노출이 큰 것 (한 칸만 올리면 클릭이 붙는 자리)")
w("")
w("| 검색어 | 노출 | 클릭 | 순위 |")
w("|---|---:|---:|---:|")
edge=[x for x in real if 8<=x["position"]<=15 and x["impressions"]>=30]
edge.sort(key=lambda x:-x["impressions"])
for x in edge[:12]:
    w("| %s | %d | %d | %.1f |" % (key(x), x["impressions"], x["clicks"], x["position"]))
w("")
w("### 즉답형 — CTR 판정에서 제외")
w("")
w("구글이 검색결과에서 바로 답해 버리는 말들입니다. 클릭 0이 정상이니 여기로 성과를 재지 마세요.")
w("")
imm.sort(key=lambda x:-x["impressions"])
w("노출 합계 %d · 클릭 %d — " % (sum(x["impressions"] for x in imm), sum(x["clicks"] for x in imm))
  + ", ".join("%s(%d)"%(key(x),x["impressions"]) for x in imm[:8]))
w("")

open(OUT,"w",encoding="utf-8").write("\n".join(L))
print("\n".join(L))
print("\n\n>>> 저장: " + OUT)
