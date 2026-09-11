# -*- coding: utf-8 -*-
import io, sys, os, re, glob, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print('=== A. 키가 git 에 올라가 있나 ===')
os.chdir(r'C:\dev\chukjemoa')
for cmd in [['git','check-ignore','-v','onesignal.key'],
            ['git','log','--oneline','-3','--','onesignal.key']]:
    try:
        r = subprocess.run(cmd, capture_output=True, timeout=30)
        o = (r.stdout + r.stderr).decode('utf-8','ignore').strip()
        print('  $ %s' % ' '.join(cmd))
        print('    %s' % (o if o else '(출력 없음)'))
    except Exception as e:
        print('  ERR', e)
print()

print('=== B. build.js 안의 buybox 등장 지점 ===')
t = open('build.js', encoding='utf-8').read()
lines = t.split('\n')
for i, l in enumerate(lines):
    if 'buybox' in l or 'BB_HTML' in l or 'FEST_BB' in l or 'bbFor' in l:
        s = l.strip()
        print('  %5d | %s' % (i+1, s[:150]))
print()

print('=== C. 라이브 페이지에서 구매박스가 «몇 번째 글자»에 있나 ===')
import urllib.request
H={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
for u in ['https://chukjemoa.co.kr/2026-09/',
          'https://chukjemoa.co.kr/jangteo/',
          'https://chukjemoa.co.kr/',
          'https://chukjemoa.co.kr/seoul/museum/']:
    try:
        b = urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=20).read().decode('utf-8','ignore')
    except Exception as e:
        print('  %-46s ERR %s' % (u, e)); continue
    body = b[b.find('<body'):]
    n = body.count('class="buybox"')
    pos = body.find('class="buybox"')
    pct = (pos / len(body) * 100) if pos >= 0 else -1
    print('  %-46s 박스 %d개 · 본문 %d자 중 %s' % (
        u, n, len(body), ('%.1f%% 지점' % pct) if pos >= 0 else '없음'))
