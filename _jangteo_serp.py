# -*- coding: utf-8 -*-
# 「○○장날」 검색량이 커도 «그게 오일장 검색인가»는 따로 재야 한다.
# 영주장날 15,420(시장 1곳)·고령장날 4,340 처럼 말 자체가 다른 뜻일 수 있다.
# 네이버 SERP 제목을 실제로 뜯어 본다.
import sys, io, re, urllib.request, urllib.parse, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

def fetch(u):
    try:
        req = urllib.request.Request(u, headers={"User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9"})
        with urllib.request.urlopen(req, timeout=25) as r:
            raw = r.read()
        return raw.decode("utf-8", "ignore")
    except Exception as ex:
        return "ERR:" + str(ex)

KWS = sys.argv[1:] or ["영주장날", "고령장날", "양양장날", "김포장날", "의성장날", "괴산장날"]
# 오일장 검색이 맞다면 이런 말이 제목에 섞여야 한다
GOOD = ("오일장", "5일장", "시장", "장터", "장날", "전통시장", "구경", "먹거리")
for kw in KWS:
    h = fetch("https://search.naver.com/search.naver?query=" + urllib.parse.quote(kw))
    print("\n" + "=" * 60 + "\n■ " + kw)
    if h.startswith("ERR:"):
        print("  " + h); continue
    secs = re.findall(r'<h2[^>]*class="[^"]*api_title[^"]*"[^>]*>([\s\S]*?)</h2>', h)
    secs = [re.sub(r"<[^>]+>", "", s).strip() for s in secs]
    secs = [s for s in dict.fromkeys(secs) if s]
    print("  [영역] " + (" > ".join(secs[:8]) or "파싱 실패"))
    # 결과 제목들
    tt = re.findall(r'class="[^"]*(?:total_tit|title_link|api_txt_lines|name_link|fds-comps-right-image-text-title)[^"]*"[^>]*>([\s\S]{2,120}?)<', h)
    tt = [re.sub(r"<[^>]+>", "", t).replace("&amp;", "&").strip() for t in tt]
    tt = [t for t in dict.fromkeys(tt) if len(t) > 4][:14]
    hit = sum(1 for t in tt if any(g in t for g in GOOD))
    print("  [제목 %d개 중 시장·장날 관련 %d개]" % (len(tt), hit))
    for t in tt[:10]:
        mark = "○" if any(g in t for g in GOOD) else "×"
        print("    %s %s" % (mark, t[:70]))
    time.sleep(1.2)
