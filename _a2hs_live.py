# -*- coding: utf-8 -*-
# 배포된 «실물»을 연다. 커밋이 아니라 라이브가 증거다.
import time, urllib.request, json

def fetch(u):
    r = urllib.request.urlopen("https://chukjemoa.co.kr" + u, timeout=25)
    return r.status, r.read().decode("utf-8", "replace")

for i in range(20):
    try:
        s, b = fetch("/manifest.json")
        if s == 200:
            print("manifest 배포됨 (%d번째 확인)" % (i + 1))
            print(json.dumps(json.loads(b), ensure_ascii=False)[:220])
            break
    except Exception as e:
        print("  대기중 %d — %s" % (i + 1, str(e)[:40]))
    time.sleep(15)
else:
    print("manifest 아직 404 — 배포가 안 끝났습니다")

print()
for u in ["/", "/jangteo/", "/2026-10/", "/seoul/museum/"]:
    try:
        s, h = fetch(u)
        print('%-18s %s  manifest링크=%s  apple-cap=%s  홈화면안내=%s' % (
            u, s, 'rel="manifest"' in h,
            'apple-mobile-web-app-capable' in h, 'cjm_a2hs' in h))
    except Exception as e:
        print("%-18s %s" % (u, str(e)[:50]))
