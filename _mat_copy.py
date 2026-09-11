# -*- coding: utf-8 -*-
# 돗자리가 «메인»으로 붙은 페이지에서 문구가 실제로 뭐라고 나오는지 라이브에서 본다.
import re, urllib.request
for u in ["/festival/2026-byeolbadabusan-naiteu-kaemkeunik/",
          "/festival/2026-je14hoe-gyeonggijeongwonmunhwabangnamhoe/",
          "/maple/", "/flower/"]:
    try:
        h = urllib.request.urlopen("https://chukjemoa.co.kr" + u, timeout=25).read().decode("utf-8", "replace")
    except Exception as e:
        print(u, "→", str(e)[:50]); continue
    i = h.find("13737049813")
    if i < 0:
        print("%-56s 돗자리 없음" % u); continue
    seg = h[max(0, i - 900):i + 300]
    seg = re.sub("<[^>]+>", " ", seg)
    seg = re.sub(r"\s+", " ", seg).strip()
    print("%-56s\n    …%s…\n" % (u, seg[-330:]))
