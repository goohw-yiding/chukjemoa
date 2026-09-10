# -*- coding: utf-8 -*-
import re, urllib.request
from google.oauth2 import service_account
from googleapiclient.discovery import build
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)
print("=== 사이트맵 ===")
for m in sc.sitemaps().list(siteUrl=SITE).execute().get("sitemap", []):
    cnt = sum(int(c.get("submitted", 0)) for c in m.get("contents", []))
    print("  %s | 마지막 읽음 %s | %d개 | 오류 %s 경고 %s" % (
        m["path"], (m.get("lastDownloaded") or "-")[:16], cnt,
        m.get("errors", 0), m.get("warnings", 0)))
# 라이브 사이트맵에 시·군이 실려 있나
sm = urllib.request.urlopen(SITE + "sitemap.xml").read().decode("utf-8")
locs = re.findall(r"<loc>(.*?)</loc>", sm)
sig = [u for u in locs if re.match(r"^https://chukjemoa\.co\.kr/jangteo/[a-z\-]+/$", u)]
print("\n라이브 사이트맵 %d개 · /jangteo/xxx/ 형태 %d개" % (len(locs), len(sig)))
print("  예:", ", ".join(u.split("/")[-2] for u in sig[:12]))
for want in ["andong", "hongcheon", "yongin"]:
    print("  %s 사이트맵에 있나 → %s" % (want, any(u.endswith("/" + want + "/") for u in sig)))
