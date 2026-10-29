import sys, requests
sys.stdout.reconfigure(encoding="utf-8")
K = open(r"C:\dev\chukjemoa\khoa.key", encoding="utf-8").read().strip()   # 조석예보 전용 키(2026-10-29 장남 님 발급)
tests = [
 ("http://apis.data.go.kr/1192136/tideFcstHghLw/GetTideFcstHghLwApiService", {"obsCode": "DT_0001", "reqDate": "20261031", "type": "json", "numOfRows": 10, "pageNo": 1}),
 ("http://apis.data.go.kr/1192136/surveyTideLevel/GetSurveyTideLevelApiService", {"obsCode": "DT_0001", "reqDate": "20261028", "type": "json", "numOfRows": 3, "pageNo": 1}),
]
for u, p in tests:
    p["serviceKey"] = K
    try:
        r = requests.get(u, params=p, timeout=30)
        print(u.split("/")[-1], r.status_code, r.text[:400].replace("\n", " "))
    except Exception as e:
        print(u, "ERR", e)
