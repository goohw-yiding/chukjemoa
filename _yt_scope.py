# -*- coding: utf-8 -*-
# 축제모아 채널 토큰이 «읽기 전용»인지 «쓰기»도 되는지 + 채널 현재 상태
import json, urllib.request, urllib.parse
T = json.load(open(r"C:\dev\traffic-dashboard\yt_token_chukjemoa.json", encoding="utf-8"))
print("토큰 키:", ", ".join(T.keys()))
print("scope:", T.get("scope", "(없음)"))

# 액세스 토큰 갱신
d = urllib.parse.urlencode({
    "client_id": T["client_id"], "client_secret": T["client_secret"],
    "refresh_token": T["refresh_token"], "grant_type": "refresh_token"}).encode()
r = json.loads(urllib.request.urlopen(
    urllib.request.Request("https://oauth2.googleapis.com/token", data=d), timeout=25).read())
AT = r["access_token"]
print("갱신 OK · 이 토큰의 scope:", r.get("scope", "(응답에 없음)"))

def api(u):
    q = urllib.request.Request(u, headers={"Authorization": "Bearer " + AT})
    return json.loads(urllib.request.urlopen(q, timeout=25).read())

ch = api("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings,status&mine=true")
for c in ch.get("items", []):
    s, st, b = c["snippet"], c["statistics"], c.get("brandingSettings", {})
    print("\n=== 채널:", s["title"], "(", c["id"], ")")
    print("  개설:", s.get("publishedAt", "")[:10])
    print("  설명 길이:", len(s.get("description", "") or ""), "자")
    print("  설명:", repr((s.get("description") or "")[:200]))
    print("  맞춤 URL:", s.get("customUrl", "(없음)"))
    print("  구독 %s · 영상 %s · 조회 %s" % (st.get("subscriberCount"), st.get("videoCount"), st.get("viewCount")))
    bc = b.get("channel", {})
    print("  키워드:", repr((bc.get("keywords") or "")[:160]))
    print("  배너:", "있음" if (b.get("image") or {}).get("bannerExternalUrl") else "없음")
    print("  기본 언어:", bc.get("defaultLanguage"), "· 국가:", bc.get("country"))
