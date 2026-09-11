# -*- coding: utf-8 -*-
# 만든 것이 «실제 HTML 안»에 들어갔는지 센다. 배포 전 로컬 확인.
import io, os, re, collections
R = r"C:\dev\chukjemoa"
h = io.open(os.path.join(R, "index.html"), encoding="utf-8").read()
print("홈 —  알림버튼=%s  NOTI_JS=%s  hidden속성=%s" % (
    'id="home-noti"' in h, "noti_on" in h, 'id="home-noti" hidden' in h))

j = io.open(os.path.join(R, "jangteo", "index.html"), encoding="utf-8").read()
cnt = collections.Counter(re.findall(r'jt-today-card z-(\w+)', j))
print("\n오일장 허브 — 카드 %d장" % sum(cnt.values()))
NAME = {"cap": "수도권", "gw": "강원", "cc": "충청", "jl": "전라", "gs": "경상", "jj": "제주"}
for k, v in cnt.most_common():
    print("   %-5s %-4s %3d" % (k, NAME.get(k, "?"), v))
print("   범례=%s   지역글자=%s" % ('class="jt-zone"' in j, 'class="jt-rg"' in j))

# 색이 «진짜로» 6가지인지, CSS 변수가 다 정의됐는지
for k in NAME:
    print("   .z-%-4s 정의됨=%s" % (k, (".z-" + k + "{") in j or (".z-" + k + " {") in j))
