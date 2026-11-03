# -*- coding: utf-8 -*-
# 축제 «제철 검색량» 추정 → data/fest_peak.json   (2026-11-03 장남 님 «미리 써 주면 좋겠다»)
#
# 왜: 검색광고 API 월 검색량은 «지난 30일»이라, 개막 두세 달 전 겨울 축제는 작게 잡힌다
#     (화천산천어축제 11월 6,550 — 1월엔 훨씬 크다). 그래서 1만↑ 기준에 안 걸려 «미리» 칸을 못 잡았다.
# 방법: 데이터랩 검색어트렌드(월 단위, 지난 13개월)로 «가장 높았던 달 ÷ 지난달» 배수를 구해
#       지금 월 검색량에 곱한다(같은 계열끼리 나누므로 정규화가 상쇄된다). 배수 상한 30.
# 대상: 앞으로 120일 안에 열리는(또는 작년 회차를 1년 옮기면 열리는) 축제 중 지금 검색 1,000↑.
import json, os, re, sys, time, datetime, urllib.request

BASE = r"C:\dev\chukjemoa"
src = open(r"C:\dev\_datalab.py", encoding="utf-8").read()
CID = re.search(r'CID\s*=\s*"([^"]+)"', src).group(1)
CSEC = re.search(r'CSEC\s*=\s*"([^"]+)"', src).group(1)
URL = "https://openapi.naver.com/v1/datalab/search"

TODAY = datetime.date.today()
END = TODAY - datetime.timedelta(days=1)
START = (TODAY.replace(day=1) - datetime.timedelta(days=380)).replace(day=1)
LASTM = (TODAY.replace(day=1) - datetime.timedelta(days=1)).strftime("%Y-%m")   # 지난달(꽉 찬 달)

def dash(s):
    s = re.sub(r"[^0-9]", "", str(s or ""))
    return f"{s[:4]}-{s[4:6]}-{s[6:8]}" if len(s) >= 8 else ""
def plus_year(s):
    return str(int(s[:4]) + 1) + s[4:]

fv = json.load(open(os.path.join(BASE, "data", "fest_volume.json"), encoding="utf-8"))
alias = {}
try:
    alias = json.load(open(r"C:\dev\_bp\fest_alias.json", encoding="utf-8")).get("items", {})
except Exception:
    pass
api = json.load(open(os.path.join(BASE, "data", "festivals_api.json"), encoding="utf-8"))
api = api if isinstance(api, list) else next(v for v in api.values() if isinstance(v, list))
seen = json.load(open(os.path.join(BASE, "data", "festival_seen.json"), encoding="utf-8"))

lo, hi = str(TODAY), str(TODAY + datetime.timedelta(days=120))
targets = {}
for f in list(api) + list(seen.values()):
    if not isinstance(f, dict) or not f.get("title"): continue
    s, e = dash(f.get("start")), dash(f.get("end") or f.get("start"))
    if not s: continue
    if e < lo:
        s = plus_year(s)                       # 작년 회차 → 올해 예상
    if not (lo <= s <= hi) and not (s <= lo <= e): continue
    t = f["title"]
    x = fv.get(t); a = alias.get(t)
    kw, vol = (x["kw"], x.get("vol", 0)) if x else (None, 0)
    if a and a.get("vol", 0) > vol: kw, vol = a["kw"], a["vol"]
    if not kw or vol < 1000: continue
    targets[t] = {"kw": kw, "vol": vol, "s": s}

kws = sorted({v["kw"] for v in targets.values()})
print("대상 %d곳 · 검색어 %d개 · 기간 %s~%s · 기준달 %s" % (len(targets), len(kws), START, END, LASTM), flush=True)

mult = {}
for i in range(0, len(kws), 5):
    part = kws[i:i + 5]
    body = {"startDate": str(START), "endDate": str(END), "timeUnit": "month",
            "keywordGroups": [{"groupName": k, "keywords": [k]} for k in part]}
    req = urllib.request.Request(URL, data=json.dumps(body).encode("utf-8"),
        headers={"X-Naver-Client-Id": CID, "X-Naver-Client-Secret": CSEC, "Content-Type": "application/json"})
    try:
        r = json.loads(urllib.request.urlopen(req, timeout=30).read().decode("utf-8"))
    except Exception as ex:
        print("ERR", part, str(ex)[:80], flush=True); time.sleep(1); continue
    for g in r.get("results", []):
        d = {p["period"][:7]: p["ratio"] for p in g.get("data", [])}
        base = d.get(LASTM, 0)
        full = {m: v for m, v in d.items() if m != TODAY.strftime("%Y-%m")}
        if not full: continue
        pm = max(full, key=full.get)
        mult[g["title"]] = (base, full)
    time.sleep(0.15)

out = {}
for t, v in targets.items():
    m = mult.get(v["kw"])
    if not m: continue
    base, full = m
    # 작년 «그 축제가 열린 달»과 그 전달만 본다(엉뚱한 달의 반짝 검색을 제철로 착각하지 않게)
    ly = str(int(v["s"][:4]) - 1) + v["s"][4:7]
    y, mo = int(ly[:4]), int(ly[5:7])
    prevm = f"{y - 1}-12" if mo == 1 else f"{y}-{mo - 1:02d}"
    cand = {k: full[k] for k in (ly, prevm) if k in full}
    if not cand: continue
    pm = max(cand, key=cand.get)
    x = min(15.0, cand[pm] / base) if base > 0 else 1.0     # 지난달 0이면 배수를 못 믿는다
    x = max(1.0, x)
    out[t] = {"kw": v["kw"], "vol": v["vol"], "peak": int(round(v["vol"] * x)), "x": round(x, 2), "peakMonth": pm}
out_sorted = dict(sorted(out.items(), key=lambda kv: -kv[1]["peak"]))
json.dump({"about": "제철 검색량 추정(지난달 월검색량 × 데이터랩 최고달/지난달). planner.js 가 아직 안 열린 축제의 1만↑ 판정에 씀",
           "updated": str(TODAY), "items": out_sorted},
          open(os.path.join(BASE, "data", "fest_peak.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for t, v in list(out_sorted.items())[:30]:
    print("%8s  지금 %7s  x%-5s %s  %s" % (f"{v['peak']:,}", f"{v['vol']:,}", v["x"], v["peakMonth"], t), flush=True)
