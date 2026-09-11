# -*- coding: utf-8 -*-
import os, io, sys, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PRJ = r'C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업\chukjemoa'
print('=== 프로젝트 폴더에 있는 키·스크립트 ===')
print('폴더 존재:', os.path.isdir(PRJ))
for f in ['onesignal.key', 'seoul.key', 'busan.key', '_push.js', '_push_log.json',
          'build.js', 'museum.js', '_push_tasks.ps1']:
    p = os.path.join(PRJ, f)
    print('  %-18s %s' % (f, ('있음 %d bytes' % os.path.getsize(p)) if os.path.exists(p) else '없음'))
print()

print('=== C:\\dev\\chukjemoa 쪽 키 ===')
for f in ['onesignal.key', 'seoul.key', 'busan.key']:
    p = os.path.join(r'C:\dev\chukjemoa', f)
    print('  %-18s %s' % (f, ('있음 %d bytes' % os.path.getsize(p)) if os.path.exists(p) else '없음'))
print()

print('=== Windows 작업 스케줄러에 등록된 chukjemoa 작업 ===')
try:
    out = subprocess.run(['schtasks', '/query', '/fo', 'csv', '/v'],
                         capture_output=True, timeout=60)
    txt = out.stdout.decode('cp949', 'ignore')
    hits = [l for l in txt.splitlines() if 'chukjemoa' in l.lower() or 'push' in l.lower()]
    if not hits:
        print('  (일치하는 작업 없음)')
    for l in hits[:20]:
        c = l.split('","')
        print('  이름=%s | 다음실행=%s | 상태=%s | 마지막결과=%s' % (
            c[1][:48] if len(c) > 1 else '?', c[2][:24] if len(c) > 2 else '?',
            c[3][:14] if len(c) > 3 else '?', c[6][:12] if len(c) > 6 else '?'))
except Exception as e:
    print('  ERR', e)
