# -*- coding: utf-8 -*-
# 구독자 54명은 9/7~9/11 에 붙었다. 그 나흘의 «처음 들어온 페이지»가 그들이 뭘 보러 왔는지의 대리지표다.
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, Dimension, Metric, DateRange

cr = service_account.Credentials.from_service_account_file(
    r'C:\dev\traffic-dashboard\sa-key.json',
    scopes=['https://www.googleapis.com/auth/analytics.readonly'])
c = BetaAnalyticsDataClient(credentials=cr)

r = c.run_report(RunReportRequest(
    property='properties/545108776',
    dimensions=[Dimension(name='landingPage')],
    metrics=[Metric(name='sessions')],
    date_ranges=[DateRange(start_date='2026-09-07', end_date='2026-09-11')],
    limit=30))
rows = [(x.dimension_values[0].value, int(x.metric_values[0].value)) for x in r.rows]
tot = sum(n for _, n in rows) or 1
print('=== 9/7~9/11 처음 들어온 페이지 (총 %d 세션) ===' % tot)
for p, n in rows[:22]:
    print('%-46s %5d  %4.1f%%' % (p[:46], n, n * 100.0 / tot))

# 큰 분류로 묶기
import re
def cat(p):
    if p.startswith('/jangteo'): return '오일장'
    if p.startswith('/festival'): return '축제 상세'
    if re.match(r'^/20\d\d-\d\d', p): return '월별 축제'
    if p.startswith('/blog'): return '블로그'
    if re.match(r'^/(seoul|busan|jeju|gyeongju|incheon|daegu|gangneung|sokcho|jeonju|cheongju|suwon|yeosu|tongyeong|geoje)', p): return '도시'
    if re.match(r'^/(trails|walk|mountain|valley|maple|flower|onsen|healing|cafe)', p): return '자연·걷기'
    if p in ('/', ''): return '홈'
    return '기타'
g = {}
for p, n in rows:
    g[cat(p)] = g.get(cat(p), 0) + n
print('\n=== 묶어 보면 ===')
for k, v in sorted(g.items(), key=lambda x: -x[1]):
    print('%-12s %5d  %4.1f%%' % (k, v, v * 100.0 / tot))
