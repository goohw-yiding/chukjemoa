# -*- coding: utf-8 -*-
# 박물관·미술관 이름 검색량 → data/museum_volume.json
#
# 왜: 장남 님 — 「사람들이 많이 가는 곳을 중점적으로 앞쪽에 배치해줘.
#     그래야 사이트가 신뢰가 있다고 생각하거든.」
#     방문자 데이터(visitors.json)는 «시·군·구» 단위라 개별 시설을 못 가른다.
#     축제에서 이미 검증된 방법(검색량)을 그대로 쓴다.
import json, os, re, sys, time
sys.path.insert(0, r"C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업")
from nv_volume import volumes

BASE = r"C:\dev\chukjemoa"
OUT = os.path.join(BASE, "data", "museum_volume.json")
acc = json.load(open(os.path.join(BASE, "data", "accessible.json"), encoding="utf-8"))
TARGET = {"서울", "부산"}
rows = [x for x in acc
        if re.search(r"박물관|미술관|전시관|기념관|과학관", x.get("title") or "")
        and x.get("sido") in TARGET]
print("대상 %d곳 (서울 %d · 부산 %d)" % (
    len(rows), sum(1 for x in rows if x["sido"] == "서울"), sum(1 for x in rows if x["sido"] == "부산")))

def kw_of(n):
    s = re.sub(r"[\(\[（【][^\)\]）】]*[\)\]）】]", " ", n or "")
    s = re.sub(r"[^0-9A-Za-z가-힣]", "", s)
    return s

pairs = [(x["title"], kw_of(x["title"])) for x in rows]
pairs = [(n, k) for n, k in pairs if len(k) >= 2]
uniq = sorted({k for _, k in pairs})
print("고유 검색어 %d개 — 조회 시작" % len(uniq), flush=True)

vol, err = {}, 0
for i in range(0, len(uniq), 5):
    part = uniq[i:i + 5]
    try:
        res = volumes(part)
    except Exception as e:
        err += 1; print("  !! %s %s" % (part[0], str(e)[:50]), flush=True); time.sleep(1); continue
    got = set()
    for r in (res or []):
        if isinstance(r, (list, tuple)) and len(r) >= 4:
            vol[r[1]] = {"vol": int(r[0] or 0), "pc": int(r[2] or 0), "mo": int(r[3] or 0)}
            got.add(r[1])
    for k in part:
        if k not in got: vol[k] = {"vol": 0, "none": 1}
    if (i // 5) % 10 == 0: print("  %d/%d" % (i, len(uniq)), flush=True)
    time.sleep(0.3)

out = {}
for n, k in pairs:
    if k in vol: out[n] = dict(vol[k], kw=k)
json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
have = [v for v in out.values() if not v.get("none")]
print("저장 %d건 (검색량 잡힌 것 %d · 오류 %d)" % (len(out), len(have), err))
for n, d in sorted(out.items(), key=lambda x: -x[1]["vol"])[:20]:
    print("  %8s  %s" % (format(d["vol"], ","), n))
