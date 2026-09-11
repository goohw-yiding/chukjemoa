# -*- coding: utf-8 -*-
from google.oauth2 import service_account
from googleapiclient.discovery import build
cr = service_account.Credentials.from_service_account_file(
    r'C:\dev\traffic-dashboard\sa-key.json',
    scopes=['https://www.googleapis.com/auth/webmasters.readonly'])
sc = build('searchconsole', 'v1', credentials=cr)
for s in sc.sites().list().execute().get('siteEntry', []):
    print(s['permissionLevel'], s['siteUrl'])
