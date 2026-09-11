# -*- coding: utf-8 -*-
import io, sys, urllib.request, re
out = open(r'C:\dev\chukjemoa\_bb_where2.txt', 'w', encoding='utf-8')
H = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
urls = ['https://chukjemoa.co.kr/2026-09/',
        'https://chukjemoa.co.kr/2026-10/',
        'https://chukjemoa.co.kr/jangteo/',
        'https://chukjemoa.co.kr/',
        'https://chukjemoa.co.kr/seoul/museum/',
        'https://chukjemoa.co.kr/blog/']
for u in urls:
    try:
        b = urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=25).read().decode('utf-8', 'ignore')
    except Exception as e:
        out.write('%-44s ERR %s\n' % (u, e)); continue
    i = b.find('<body')
    body = b[i:] if i >= 0 else b
    # 텍스트만 남겨 «읽는 사람 기준» 위치를 잰다
    txt = re.sub(r'<script[\s\S]*?</script>', '', body)
    txt = re.sub(r'<style[\s\S]*?</style>', '', txt)
    plain = re.sub(r'<[^>]+>', '', txt)
    n = body.count('class="buybox"')
    pos = txt.find('class="buybox"')
    before_txt = len(re.sub(r'<[^>]+>', '', txt[:pos])) if pos >= 0 else -1
    out.write('%-44s 박스 %d개 | 본문글자 %d자 | 박스 앞 글자수 %s (%s)\n' % (
        u, n, len(plain), before_txt,
        ('%.1f%% 지점' % (before_txt / len(plain) * 100)) if before_txt >= 0 else '없음'))
    if pos >= 0:
        seg = txt[pos - 400:pos + 700]
        seg = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', seg)).strip()
        out.write('    [박스 주변] ...%s...\n' % seg[:520])
out.close()
print('done')
