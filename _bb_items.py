# -*- coding: utf-8 -*-
import io, sys, re, json, os
out = open(r'C:\dev\chukjemoa\_bb_items.txt', 'w', encoding='utf-8')
t = open(r'C:\dev\chukjemoa\build.js', encoding='utf-8').read()

i = t.find('COUPANG')
out.write('=== COUPANG 정의 근처 ===\n')
# COUPANG 정의부를 찾아 items 키들을 뽑는다
m = re.search(r'const\s+COUPANG\s*=\s*', t)
if m:
    out.write('정의 위치: %d번째 글자\n' % m.start())
    seg = t[m.start():m.start()+6000]
    out.write(seg[:5200])
else:
    # 외부 파일일 수 있다
    out.write('build.js 안에 const COUPANG 정의 없음\n')
    for mm in re.finditer(r"require\(['\"]([^'\"]*coupang[^'\"]*)['\"]\)", t, re.I):
        out.write('  require: %s\n' % mm.group(1))
    for f in os.listdir(r'C:\dev\chukjemoa'):
        if 'coupang' in f.lower() or 'shop' in f.lower():
            out.write('  파일: %s\n' % f)

out.write('\n\n=== shop_click 이벤트 코드 ===\n')
for mm in re.finditer(r'shop_click', t):
    s = max(0, mm.start()-400)
    out.write(re.sub(r'\s+', ' ', t[s:mm.start()+260])[-620:] + '\n---\n')
out.close()
print('done')
