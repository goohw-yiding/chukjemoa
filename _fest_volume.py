# -*- coding: utf-8 -*-
# 축제 이름 검색량 전수 측정 → data/fest_volume.json
#
# 왜: 홈 「이번 주말」·「지금 & 곧」이 «시작일 순»이라 217일짜리 상설 프로그램이 1위로 뜬다.
#     실측(2026-09-10): 금남로 차 없는 거리 걷자잉 «50» vs 무주반딧불축제 «214,200» — 4,284배.
#     사람이 무엇을 찾는지는 시작일이 아니라 검색량이다.
# ⚠️ nv_volume.volumes() 반환은 dict 가 아니라 «리스트» 다:
#    [[총검색량, 키워드, pc, mobile, 경쟁도], ...] — 총검색량 내림차순.
# ⚠️ 축제 이름은 길고 특수문자가 많다. 네이버 keywordstool 은 공백·특수문자를 못 받는다.
#    다듬은 뒤 2글자 미만이면 버린다(0으로 지어내지 않는다).
import json, os, re, sys, time

sys.path.insert(0, r"C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업")
from nv_volume import volumes  # noqa

BASE = r"C:\dev\chukjemoa"
BUDGET = float(sys.argv[1]) if len(sys.argv) > 1 else 900.0
T0 = time.time()

cur = json.load(open(os.path.join(BASE, "fest.json"), encoding="utf-8"))
api = json.load(open(os.path.join(BASE, "data", "festivals_api.json"), encoding="utf-8"))
if isinstance(api, dict):
    api = api.get("items") or list(api.values())

names = {}
for f in cur:
    n = (f.get("n") or "").strip()
    if n: names[n] = 1
for f in api:
    n = (f.get("title") or "").strip()
    if n: names[n] = 1
print("축제 이름 %d개" % len(names), flush=True)

def kw_of(n):
    s = re.sub(r"[\(\[（【][^\)\]）】]*[\)\]）】]", " ", n)
    s = re.sub(r"20\d\d\s*년?", " ", s)
    s = re.sub(r"제\s*\d+\s*회", " ", s)
    s = re.sub(r"[^0-9A-Za-z가-힣]", "", s)
    return s

pairs = [(n, kw_of(n)) for n in names]
pairs = [(n, k) for n, k in pairs if len(k) >= 2]
uniq = sorted({k for _, k in pairs})
print("검색 가능 %d개 · 고유 검색어 %d개" % (len(pairs), len(uniq)), flush=True)

OUT = os.path.join(BASE, "data", "fest_volume.json")
vol = {}
if os.path.exists(OUT):
    try:
        old = json.load(open(OUT, encoding="utf-8"))
        for _, d in old.items():
            if d.get("kw"): vol[d["kw"]] = d
    except Exception:
        pass
todo = [k for k in uniq if k not in vol]
print("남은 %d개" % len(todo), flush=True)

def save():
    out = {}
    for n, k in pairs:
        d = vol.get(k)
        if d: out[n] = d
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    return len(out)

err = 0
for i in range(0, len(todo), 5):
    if time.time() - T0 > BUDGET:
        print("시간 예산 소진 — 여기까지 저장", flush=True); break
    part = todo[i:i + 5]
    try:
        rows = volumes(part)
    except Exception as e:
        err += 1; print("  !! %s %s" % (part[0], str(e)[:60]), flush=True); time.sleep(1.0); continue
    got = set()
    for r in (rows or []):
        if not isinstance(r, (list, tuple)) or len(r) < 4: continue
        tot, kw, pc, mo = r[0], r[1], r[2], r[3]
        vol[kw] = {"kw": kw, "vol": int(tot or 0), "pc": int(pc or 0), "mo": int(mo or 0)}
        got.add(kw)
    # 응답에 안 온 검색어 = 검색량 자체가 없음. 0으로 «기록»해 둬야 다음 회차에 또 묻지 않는다.
    for k in part:
        if k not in got: vol[k] = {"kw": k, "vol": 0, "pc": 0, "mo": 0, "none": 1}
    if (i // 5) % 25 == 0:
        print("  %d/%d · %ds" % (i, len(todo), int(time.time() - T0)), flush=True); save()
    time.sleep(0.32)

n = save()
print("저장 %d건 (API오류 %d)" % (n, err))
have = [d for d in vol.values() if not d.get("none")]
print("검색량 잡힌 것 %d / 조회 %d" % (len(have), len(vol)))
top = sorted(have, key=lambda d: -d["vol"])[:20]
for d in top:
    print("  %8d  %s" % (d["vol"], d["kw"]))
