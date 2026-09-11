# -*- coding: utf-8 -*-
import io, os, re, collections
R = r"C:\dev\chukjemoa"
h = io.open(os.path.join(R, "index.html"), encoding="utf-8").read()
print("홈 - 알림버튼=%s NOTI_JS=%s hidden=%s" % (
    'id="home-noti"' in h, "noti_on" in h, 'id="home-noti" hidden' in h))
j = io.open(os.path.join(R, "jangteo", "index.html"), encoding="utf-8").read()
cnt = collections.Counter(re.findall(r'jt-today-card z-([a-z]+)', j))
css = dict(re.findall(r'\.z-([a-z]+)\{([^}]*)\}', j))
print("\n오일장 허브 - 카드 %d장 · 시·도 %d개 · CSS 정의 %d개" % (sum(cnt.values()), len(cnt), len(css)))
for k, v in cnt.most_common():
    print("   %-10s %3d   %s   CSS=%s" % (k, v, css.get(k, "(없음)")[:52], k in css))
miss = [k for k in cnt if k not in css]
print("   CSS 없는 클래스:", miss or "없음")
print("   범례=%s  지역글자=%s" % ('class="jt-zone"' in j, 'class="jt-rg"' in j))
