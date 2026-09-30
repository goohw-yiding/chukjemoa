@echo off
chcp 65001 >nul
cd /d C:\dev\chukjemoa
rem 2026-09-30 밀린 17건 교차확인 반영 — 조사자 A·B 독립 조사(날짜 16건 완전 일치) + 근거 페이지 기계 검증 통과분만
rem 확정 = 서로 다른 사이트 3곳 통과 / 후보(pending) = 2곳 통과
node confirm-festivals.js --propose "무안연꽃축제" 2026-06-26 2026-06-28 "https://www.ajunews.com/view/20260626090848833" "https://go.seoul.co.kr/news/newsView.php?id=20260622500053"
node confirm-festivals.js --approve "무안연꽃축제" 2026-06-26 2026-06-28 "https://www.etoday.co.kr/news/view/2596140"
node confirm-festivals.js --propose "대관령음악제" 2026-07-23 2026-08-02 "https://www.asiatoday.co.kr/kn/view.php?key=20260504010000344" "https://www.hankyung.com/article/202605269140i"
node confirm-festivals.js --approve "대관령음악제" 2026-07-23 2026-08-02 "https://v.daum.net/v/20260724092839905"
node confirm-festivals.js --propose "이호테우축제" 2026-07-31 2026-08-02 "https://www.visitjeju.net/kr/festival/view?contentsid=CNTS_300000000014662" "https://v.daum.net/v/4M16Wp3GYX"
node confirm-festivals.js --approve "이호테우축제" 2026-07-31 2026-08-02 "https://www.newsjeju.net/news/articleView.html?idxno=423956"
node confirm-festivals.js --propose "평창효석문화제" 2026-09-04 2026-09-13 "https://www.khan.co.kr/article/202609011024001/" "https://www.gukjenews.com/news/articleView.html?idxno=3697177"
node confirm-festivals.js --approve "평창효석문화제" 2026-09-04 2026-09-13 "https://www.seoul.co.kr/news/life/sc_culture/sc_local/2026/09/04/20260904500035"
node confirm-festivals.js --propose "명량대첩축제" 2026-09-11 2026-09-13 "https://mldc.kr/" "https://view.asiae.co.kr/article/2026083115255933873" "진도 녹진관광지·해남 울돌목 일원"
node confirm-festivals.js --approve "명량대첩축제" 2026-09-11 2026-09-13 "https://www.m-i.kr/news/articleView.html?idxno=1413727"
node confirm-festivals.js --propose "시흥갯골축제" 2026-09-18 2026-09-20 "https://view.asiae.co.kr/article/2026091408245575106" "https://www.newspim.com/news/view/20260909000151"
node confirm-festivals.js --approve "시흥갯골축제" 2026-09-18 2026-09-20 "https://www.kifuture.com/news/article.html?no=176257"
node confirm-festivals.js --propose "원주 다이내믹댄싱카니발" 2026-09-18 2026-09-20 "https://www.wonju.go.kr/tour/selectBbsNttView.do?nttNo=490014&bbsNo=984&key=5538" "https://www.kado.net/news/articleView.html?idxno=2073456"
node confirm-festivals.js --approve "원주 다이내믹댄싱카니발" 2026-09-18 2026-09-20 "https://www.newspim.com/news/view/20260916001018"
node confirm-festivals.js --propose "서울거리예술축제" 2026-09-19 2026-09-20 "https://festival.seoul.go.kr/festival/main/festivalView.do?festacode=382" "http://www.gwangjin.com/27998" "뚝섬한강공원~서울숲 일대"
node confirm-festivals.js --approve "서울거리예술축제" 2026-09-19 2026-09-20 "https://www.swtvnews.com/news/newsview.php?ncode=1065575810147922"
rem 후보(2곳) — 다음 검증자 회차가 세 번째 근거를 찾으면 확정
node confirm-festivals.js --propose "한성백제문화제" 2026-10-23 2026-10-25 "https://www.songpa.go.kr/hanseong/" "https://festival.seoul.go.kr/festival/main/festivalView.do?festacode=581" "올림픽공원 88잔디마당 일대"
node confirm-festivals.js --propose "평창더위사냥축제" 2026-07-24 2026-08-02 "https://v.daum.net/v/20260721000700485" "https://supple.kr/news/cmryp0yl90018145xyld3k1d8"
node confirm-festivals.js --propose "홍천강 별빛음악 맥주축제" 2026-08-05 2026-08-09 "https://www.seoul.co.kr/news/society/2026/08/04/20260804500198" "https://www.devtimes.co.kr/news/502302"
node confirm-festivals.js --propose "화천토마토축제" 2026-07-31 2026-08-09 "https://www.chamnews.net/news/articleView.html?idxno=241521" "https://news.mtn.co.kr/news-detail/2026080314184261962" "화천군 사내면 사내체육공원"
node confirm-festivals.js --propose "정동진독립영화제" 2026-08-07 2026-08-10 "https://edaily.co.kr/News/Read?mediaCodeNo=257&newsId=05566166645544696" "https://tvreport.co.kr/movie/article/1066883/"
node confirm-festivals.js --propose "괴산고추축제" 2026-09-03 2026-09-06 "https://www.newspim.com/news/view/20260903000289" "https://www.ftimes.kr/news/articleView.html?idxno=39201"
rem 근거 부족 — 기록만
node confirm-festivals.js --note "영월 동강축제" "2026-09-30 교차조사: 조사자 A·B 모두 2026-07-31~08-02(명칭 「제28회 동강뗏목축제」). 근거가 다음(v.daum.net) 한 사이트뿐이라 후보 등록 못 함 — 다른 사이트 근거 필요"
node confirm-festivals.js --note "영동포도축제" "2026-09-30 교차조사: 조사자 A·B 모두 2026-08-27~08-30, 장소 영동레인보우힐링관광지로 변경. 근거 페이지가 종료일 기계 검증 통과 못 함 — 다른 근거 필요"
node confirm-festivals.js --note "물의나라 화천쪽배축제" "2026-09-30 교차조사: 조사자 A·B 모두 「2026년 미개최(축제 중단)」 판단. 근거: ajunews 2026-07-16 「축제가 중단된 이후」, narafestival.com 쪽배 페이지 404. 목록에서 뺄지 장남님 판단 대기"
node confirm-festivals.js --list
