# -*- coding: utf-8 -*-
# 「○○장날」이 «정말 오일장 검색인가»를 SERP 본문으로 판정한다.
#
# ⚠️ 왜 필요한가 (2026-09-09 실측)
#   검색량 1위 「영주장날」 15,420 은 오일장이 아니었다 —
#   yjmarket.cyso.co.kr(영주시 농특산물 «쇼핑몰 이름»)과 「영주장날 농특산물대축제」였다.
#   검색량만으로 자르면 우리가 답할 수 없는 말에 페이지를 만들게 된다.
#
# ⚠️ 파싱 주의: 네이버 SERP 클래스명은 계속 바뀐다(제목 정규식이 2026-09-09에 또 0건을 냈다).
#   그래서 «클래스»가 아니라 «본문 텍스트»로 센다. 텍스트는 마크업이 바뀌어도 남는다.
import sys, io, re, json, os, time, urllib.request, urllib.parse
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
BASE = r"C:\dev\chukjemoa"

POS = ["오일장", "5일장", "오일시장", "전통시장", "재래시장", "장서는", "장이 서", "민속시장", "상설시장"]
NEG = ["농특산물", "쇼핑몰", "입점", "배송", "주문", "할인전", "기획전", "대축제", "온라인몰", "직거래장터"]

def serp_text(kw):
    u = "https://search.naver.com/search.naver?query=" + urllib.parse.quote(kw)
    req = urllib.request.Request(u, headers={"User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9"})
    try:
        h = urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "ignore")
    except Exception as e:
        return None
    t = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", h)
    t = re.sub(r"<[^>]+>", " ", t)
    t = re.sub(r"\s+", " ", t)
    # 검색옵션 UI 부분을 건너뛰고 «결과»부터 본다
    i = t.find("검색옵션 가이드")
    return t[i:i + 4000] if i > 0 else t[:4000]

rows = json.load(open(os.path.join(BASE, "data", "jangteo_volume.json"), encoding="utf-8"))
rows = [r for r in rows if r["vol"] >= 200]
print("판정 대상 %d곳 (검색량 200 이상)\n" % len(rows))

out, t0 = [], time.time()
for n, r in enumerate(rows, 1):
    t = serp_text(r["kw"])
    if t is None:
        r["gate"] = "ERR"; out.append(r); continue
    p = sum(t.count(w) for w in POS)
    g = sum(t.count(w) for w in NEG)
    r["pos"], r["neg"] = p, g
    # 오일장 신호가 있고, 상업/축제 신호에 눌리지 않아야 통과
    r["gate"] = "OK" if (p >= 3 and p > g) else ("애매" if p >= 3 else "탈락")
    out.append(r)
    if n % 20 == 0:
        print("  %d/%d (%.0f초)" % (n, len(rows), time.time() - t0))
    time.sleep(0.9)

json.dump(out, open(os.path.join(BASE, "data", "jangteo_gate.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)

for verdict in ("OK", "애매", "탈락", "ERR"):
    sel = [r for r in out if r["gate"] == verdict]
    if not sel:
        continue
    print("\n=== %s %d곳 · 검색량 합 %d" % (verdict, len(sel), sum(r["vol"] for r in sel)))
    for r in sel[:60]:
        print("  %-8s %-4s %6d  시장%2d  오일장신호%3d 상업신호%3d  %s" % (
            r["city"], r["sido"], r["vol"], r["markets"], r.get("pos", 0), r.get("neg", 0), r["kw"]))
