# -*- coding: utf-8 -*-
import io, sys, os, re, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

def get(u):
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=20)
        return r.status, r.read().decode("utf-8", "ignore")
    except Exception as e:
        return "ERR", str(e)

for u in ["https://chukjemoa.co.kr/ads.txt", "https://chukjemoa.co.kr/robots.txt"]:
    s, b = get(u)
    print("=== %s -> %s" % (u, s))
    print(b[:300] if isinstance(b, str) else b)
    print()

s, b = get("https://chukjemoa.co.kr/")
print("=== 홈 -> %s" % s)
if isinstance(b, str):
    pubs = sorted(set(re.findall(r"ca-pub-\d+", b)))
    print("  ca-pub:", pubs or "(없음)")
    print("  adsbygoogle 스크립트:", "있음" if "adsbygoogle.js" in b else "없음")
    print("  OneSignal SDK:", "있음" if "onesignal" in b.lower() else "없음")
    print("  ins.adsbygoogle 광고자리 수:", b.count("<ins class=\"adsbygoogle"))

print()
print("=== 로컬 ads.txt 파일 ===")
for p in [r"C:\dev\chukjemoa\ads.txt", r"C:\dev\chukjemoa\public\ads.txt"]:
    print(" ", p, "있음" if os.path.exists(p) else "없음")
print()
print("=== build.js 안의 ADSENSE 값 ===")
t = open(r"C:\dev\chukjemoa\build.js", encoding="utf-8").read()
for m in re.finditer(r"ADSENSE\s*=\s*['\"]([^'\"]+)", t):
    print("  ", m.group(1))
print("  ins.adsbygoogle 삽입 지점 수:", t.count("adsbygoogle"))
