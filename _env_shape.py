# -*- coding: utf-8 -*-
# .env 의 «모양»만 본다 — 값은 길이만 찍는다
p = r"C:\dev\onsellup-v2\.env"
raw = open(p, "rb").read()
print("bytes", len(raw), "· BOM", raw[:3] == b"\xef\xbb\xbf", "· CRLF", b"\r\n" in raw)
txt = raw.decode("utf-8-sig")
for line in txt.splitlines():
    if "NAVER_SEARCH" in line:
        k = line.split("=")[0] if "=" in line else line
        v = line.split("=", 1)[1] if "=" in line else ""
        print("줄: [%s] = (길이 %d, 앞2자 %r)" % (k, len(v), v[:2]))
