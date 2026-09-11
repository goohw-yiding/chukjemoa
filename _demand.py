# -*- coding: utf-8 -*-
# 알림으로 «무엇을» 보낼지는 취향이 아니라 수요로 정한다.
#   GSC = 사람들이 뭘 찾아서 들어오나 / GA4 = 들어와서 뭘 보나
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, Dimension, Metric, DateRange

KEY = r'C:\dev\traffic-dashboard\sa-key.json'
SITE = 'https://chukjemoa.co.kr/'
PROP = 'properties/545108776'

cr = service_account.Credentials.from_service_account_file(
    KEY, scopes=['https://www.googleapis.com/auth/webmasters.readonly',
                 'https://www.googleapis.com/auth/analytics.readonly'])
sc = build('searchconsole', 'v1', credentials=cr)

r = sc.searchanalytics().query(siteUrl=SITE, body={
    'startDate': '2026-08-12', 'endDate': '2026-09-08',
    'dimensions': ['query'], 'rowLimit': 40}).execute()
print('=== GSC 검색어 상위 40 (28일) ===')
print('%-34s %7s %7s %6s %6s' % ('검색어', '노출', '클릭', 'CTR', '순위'))
for x in r.get('rows', []):
    print('%-34s %7d %7d %5.1f%% %6.1f' % (
        x['keys'][0][:34], x['impressions'], x['clicks'], x['ctr'] * 100, x['position']))

ga = BetaAnalyticsDataClient(credentials=cr)
rep = ga.run_report(RunReportRequest(
    property=PROP, dimensions=[Dimension(name='pagePath')],
    metrics=[Metric(name='sessions')],
    date_ranges=[DateRange(start_date='28daysAgo', end_date='yesterday')], limit=25))
print('\n=== GA4 많이 본 페이지 25 (28일) ===')
for row in rep.rows:
    print('%-44s %6d' % (row.dimension_values[0].value[:44], int(row.metric_values[0].value)))
