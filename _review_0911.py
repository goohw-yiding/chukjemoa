# -*- coding: utf-8 -*-
import os, io, sys, json, glob
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print('=== 1. onesignal.key 위치 ===')
for p in glob.glob(r'C:\dev\**\onesignal.key', recursive=True):
    try:
        n = len(open(p, encoding='utf-8').read().strip())
    except Exception as e:
        n = 'ERR %s' % e
    print('  %s  (%s자)' % (p, n))
print()

print('=== 2. 푸시 관련 파일 ===')
for p in [r'C:\dev\chukjemoa\_push.js', r'C:\dev\chukjemoa\_push_log.json',
          r'C:\dev\chukjemoa\_push_tasks.ps1', r'C:\dev\_push_chukjemoa.txt',
          r'C:\dev\chukjemoa\_d2p.js', r'C:\dev\chukjemoa\museum.js',
          r'C:\dev\chukjemoa\OneSignalSDKWorker.js']:
    if os.path.exists(p):
        print('  있음  %-46s %8d bytes' % (os.path.basename(p), os.path.getsize(p)))
    else:
        print('  없음  %s' % p)
print()

print('=== 3. _push_log.json 내용 ===')
p = r'C:\dev\chukjemoa\_push_log.json'
if os.path.exists(p):
    print(open(p, encoding='utf-8').read()[:800])
else:
    print('  (파일 없음 — 아직 한 번도 안 보냈다는 뜻)')
print()

print('=== 4. _push_chukjemoa.txt (실행 로그) ===')
p = r'C:\dev\_push_chukjemoa.txt'
if os.path.exists(p):
    t = open(p, encoding='utf-8', errors='ignore').read()
    print(t[-1500:] if t.strip() else '  (비어 있음)')
else:
    print('  (파일 없음 — 예약작업이 아직 한 번도 안 돌았다)')
