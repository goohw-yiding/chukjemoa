// 프로젝트폴더 ↔ C:\dev 원본 파일 차이 확인 (그 세션 안에 0개로 맞춘다)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const DEV = 'C:\\dev\\chukjemoa';
const PRJ = 'C:\\Users\\USER\\Documents\\Claude\\Projects\\프로그램만들기 신사업\\chukjemoa';
const md5 = p => { try { return crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex'); } catch (e) { return null; } };
const SRC = ['build.js', 'fetch-markets.js', 'fetch-spots.js', 'fetch-valleys.js', 'fetch-accessible.js',
  'fetch-mountains.js', 'fetch-cafes.js', 'fetch-pets.js', 'fetch-ov.js',
  'winter.js', 'course.js', 'course-data.js', 'course/render.js', 'course/engine.js',
  // 2026-08-19 추가 — build.js 가 require 하는데 목록에 없어 «검사 안 되는 사각지대»였다.
  'map.js', 'festival.js', 'intl.js', 'chuseok.js', 'chuseok-text.js',
  'region.js', 'fix-data.js', 'audit.js', 'audit-pages.js', '_sync.js', 'vercel.json',
  'data/markets_api.json', 'data/markets.json',
  // 2026-08-20 추가 — 영문 축제 상세/오일장 신설. build.js 가 require 하는데 빠지면 사각지대.
  'festival-en.js', 'jangteo-en.js', 'fetch-markets-en.js', 'data/markets_en.json',
  // 2026-08-20 추가(2) — 영문 블로그 신설.
  'en-blog.js', 'data/posts_en.json',
  // 2026-08-20 추가(3) — IndexNow(빙 웹마스터 추천). indexnow.key 는 git에는 안 올리지만(*.key
  // gitignore) 프로젝트폴더에는 반드시 있어야 build.js 가 매번 같은 키 파일을 만든다.
  'indexnow.key', 'submit-indexnow.js',
  // 2026-08-20 추가(4) — 메타 디스크립션 보강 작업 중 발견: intl.js 는 있었는데 그게 실제로 쓰는
  // intl-text.js(다국어 문안)·trip.js(방문차수별 추천, trip-data.js 사용)·data/posts.json(한국어
  // 블로그 원문)이 목록에 없었다 — build.js 가 require 하는데 빠지면 그대로 사각지대가 된다.
  'intl-text.js', 'trip.js', 'trip-data.js', 'data/posts.json',
  // 2026-08-21 추가 — 카드뉴스 자동 생성 파이프라인(뉴스레터 시리즈용). build.js 가 require 하진 않지만
  // 매주 예약작업이 참조하는 자산이라 드리프트 감시 대상에 포함.
  'cardnews/template.html', 'cardnews/render.py',
  // 2026-08-24 추가 — .vercelignore. 배포에서 cardnews/·data/ 를 빼는 파일이라
  // 한쪽에만 있으면 «한쪽 배포에는 내부 파일이 그대로 공개»되는 사고가 난다.
  '.vercelignore',
  // 2026-08-27 추가 — 일문·서어·중문 간체 오일장 페이지 신설. build.js 가 require 하는데 빠지면 사각지대.
  'jangteo-ja.js', 'jangteo-es.js', 'jangteo-zh.js',
  'fetch-markets-ja.js', 'fetch-markets-es.js', 'fetch-markets-zh.js',
  'data/markets_ja.json', 'data/markets_es.json', 'data/markets_zh.json',
  // 2026-08-31 추가 — 네이버 발행 파이프라인. build.js 가 require 하진 않지만 «무엇을 언제 쓸지»를
  // 정하는 판단 도구라 드리프트가 나면 예약작업이 옛 기준으로 큐를 만든다. .vercelignore 도 같이 바뀌었다.
  'naver-queue.js', 'naver-brief.js',
  // 2026-08-31 추가 — 상품 매칭 감사. 「붙어 있냐」가 아니라 「맞는 게 붙어 있냐」를 숫자로 본다.
  'audit-buybox.js',
  // 2026-08-31 추가 — 붐빔 커버리지 감사(행정구역 통합으로 광주·전남이 통째로 빠졌던 사고 재발 방지).
  //   ⚠️ fetch-visitors.js 는 매주 도는 수집기인데 지금까지 목록에 없어 사각지대였다.
  'audit-busy.js', 'fetch-visitors.js',
  // 2026-09-01 추가 — 행안부 전국문화축제표준데이터(월별 재고 3번째 소스).
  //   ⚠️ cltur-fstvl.key 는 *.key 라 git 제외 — 양쪽에 다 있어야 수집기가 돈다(indexnow.key 와 같은 이유).
  'fetch-cltur-fstvl.js', 'cltur-fstvl.key', 'data/cltur_fstvl.json', 'audit-supply.js',
  // 2026-09-01 추가 — 전국전통시장표준데이터(오일장 149→469곳). /jangteo/ 는 네이버 유입의 48%다.
  'fetch-markets-std.js', 'data/markets_std.json',
  // 2026-09-01 추가 — 시티투어(/citytour/ 신설) · 지자체 공연(월별 페이지 별도 섹션)
  'fetch-citytour.js', 'data/citytour.json', 'fetch-perform.js', 'data/perform.json',
  // 2026-09-09 추가 — 시티투어 «손으로 확인한» 교체분. 표준데이터를 직접 고치면 수집기가 되돌리므로
  //   별도 파일로 두고 build.js 가 시·도 단위로 갈아끼운다. ⚠️ 한쪽에만 있으면 다음 빌드에서
  //   대전이 통째로 2020년 코스로 되돌아간다(수집기가 만드는 파일이 아니라 «사람이 쓴» 파일이다).
  'data/citytour_override.json',
  // 2026-09-01 추가 — 새 데이터가 «읽을 만한가»를 재는 감사도구. 건수만 보면 품질을 놓친다.
  'audit-newdata.js',
  // 2026-09-01 추가 — 전국관광지정보표준데이터(축제 상세 「근처 관광지 — 주차 대수까지」).
  //   처음엔 「TourAPI와 중복」이라 넘겼다가, 재보니 852곳 중 608곳이 고유였다.
  'fetch-trrsrt.js', 'data/trrsrt.json',
  // 2026-09-01 추가 — 외국어 축제 심화·허브. build.js 가 festival-en.js/festival-ja.js 를 require 하고
  //   그 둘이 다시 intl-fest-extra.js·intl-fest-index.js 를 require 한다.
  //   ⚠️ 「require 하는 파일만 넣고 그게 다시 require 하는 걸 빠뜨리는」 실수가 반복됐다(intl.js↔intl-text.js).
  'festival-ja.js', 'intl-fest-extra.js', 'intl-fest-index.js',
  // 2026-09-01 추가 — 일본어 연휴별 「문 닫는 날」. intl.js 가 ja-holiday.js 를 require 한다(링크용).
  //   ⚠️ ja_festival_slugs.json 은 festival-ja.js 가 «만드는» 파일이라 감시 대상이 아니다(빌드 산출물).
  'ja-holiday.js', 'fetch-ja-places.js', 'data/places_ja.json',
  // 2026-09-14 추가 — 🇯🇵 /ja/busy/ 「混む日」. build.js 가 ja-busy.js 를 require 하고,
  //   그 모듈이 data/jp_holidays.json(内閣府 공식 CSV → fetch-jp-holidays.js)을 읽는다.
  //   ⚠️ 세 개가 한 묶음이다. 하나라도 한쪽에만 있으면 다음 빌드에서 페이지가 통째로 안 만들어진다.
  //   ⚠️ 春分の日·秋分の日 는 해마다 국립천문대가 정한다 — 이 수집기 없이는 손으로 박게 된다.
  'ja-busy.js', 'fetch-jp-holidays.js', 'data/jp_holidays.json',
  // 2026-09-14 추가 — 🚄 서울→각 역 열차 소요시간 수집기.
  //   ⚠️ 네이버 지도 API 로는 못 한다(Directions 5 는 «자동차에 한해서만» — 공식 문서 확인).
  //      apikeys.json 의 `tago` 키로 받는다. 열차정보 활용신청이 승인되면 수집기가 돌아간다.
  //   ⚠️ 수집이 되면 'data/train_time.json' 도 이 목록에 넣을 것 — 안 넣으면 한쪽에서 조용히 사라진다.
  'fetch-train-time.js',
  // 2026-09-14 — 🚄 결론: API 셋을 다 두드려 봤는데 **코레일 공식 XLSX 가 제일 정확했다**.
  //   parse-train-timetable.py 가 data/raw/ktx-timetable.xlsx + ktx-fare.xls 를 읽어
  //   data/train_time.json(79개 역 · 소요시간+운임)을 만든다.
  //   ⚠️ 파서와 결과 JSON 은 «둘 다» 감시한다 — JSON 만 있고 파서가 없으면 갱신을 못 한다.
  //   ⚠️ data/raw/*.xlsx|xls 원본은 여기 «안» 넣는다(7MB 를 양쪽에 두지 않는다). git 에는 남는다.
  'parse-train-timetable.py', 'data/train_time.json',
  // 2026-09-14 — 🚄 /ja/daytrip/ 「ソウルから日帰り」. build.js 가 ja-daytrip.js 를 require 하고,
  //   그 모듈이 train_time.json + train_station_geo.json + places_ja + markets_std 를 읽는다.
  //   ⚠️ 역 좌표(geo)가 없으면 페이지가 통째로 안 만들어진다 — 셋이 한 묶음이다.
  'ja-daytrip.js', 'fetch-station-geo.js', 'data/train_station_geo.json',
  // 2026-09-15 — 🏯 /ja/palace/ 「ソウルの王宮」. 고궁 실무정보(휴관일·요금·한복 무료·일본어 해설)는
  //   «공식 사이트를 열어 읽고 손으로 옮긴» 값이라 이 파일 자체가 자료다. 갱신은 royal.khs.go.kr 재확인.
  //   야행 일정은 cltur_fstvl.json + festivals_api.json 에서 빌드마다 다시 추린다(별도 파일 없음).
  'ja-palace.js',
  // 2026-09-02 추가 — 네이버 지도 임베드. festival.js·festival-en.js·festival-ja.js 가 nmap.js 를 require 하고,
  //   nmap.js 는 data/ncp.json(공개용 client_id)을 읽는다. 둘 다 없으면 지도가 통째로 안 뜬다.
  //   ⚠️ client_secret 은 C:\dev\ncp_maps\config.json 에만 있고 리포에 넣지 않는다(배치 전용).
  'nmap.js', 'data/ncp.json',
  // 2026-09-09 추가 — 시·군 「○○장날」 페이지 88장. build.js 가 jangteo-sigungu.js 를 require 하고
  //   그 모듈이 data/jangteo_gate.json(SERP 게이트 판정)과 data/sigungu_slug.json(슬러그 표)을 읽는다.
  //   ⚠️ 셋 중 하나라도 한쪽에만 있으면 다음 빌드가 88장을 통째로 못 만들고,
  //      «유령 페이지 삭제»가 이미 있는 폴더까지 지운다.
  'jangteo-sigungu.js', 'data/jangteo_gate.json', 'data/sigungu_slug.json', 'data/jangteo_volume.json',
  // 2026-09-10 추가 — 축제 «그 축제만의 것»(요금·운영시간·주최·연령·행사프로그램).
  //   festival.js 가 data/fest_intro.json 을 읽는다. 수집기는 fetch-fest-intro.js.
  //   🔴 festivals_api.json 에 넣지 «않은» 이유: 그건 수집기가 만드는 파일이라 다음 회차가 되돌린다.
  //      대신 별도 파일이라 **감시 목록에 없으면 한쪽에서 조용히 사라진다** — 그래서 여기 넣는다.
  'fetch-fest-intro.js', 'data/fest_intro.json',
  // 2026-09-10 추가(2) — 외국어 축제도 같은 것. festival-en.js·festival-ja.js 가 각각 읽는다.
  //   🔴 외국어 서비스는 축제의 contentTypeId 가 **85**다(15 는 «정상 응답인데 0건»으로 온다).
  'fetch-fest-intro-intl.js',
  '_fest_volume.py', 'data/fest_volume.json',
  '_fest_trend.py', 'data/fest_trend.json',
  '_daily.ps1', '_daily_msg.txt',   // ⏰ 매일 07시 자동 실행(chukjemoa-daily-rank)이 이 파일을 돌린다   // 📈 최근 7일 추세 — 매일 갱신된다   // 🔍 축제 이름 검색량 — 홈 카드 정렬이 이걸 읽는다 'data/fest_intro_en.json', 'data/fest_intro_ja.json',
  // 2026-09-02 추가 — 일문 축제의 「近くの見どころ」. festival-ja.js 가 require 하고 places_ja.json 을 읽는다.
  'ja-nearby.js',
  // 2026-09-02 추가(2) — 영문 축제의 「Nearby Attractions」.
  //   festival-en.js 가 en-nearby.js 를 require 하고, 그게 data/places_en.json 을 읽는다.
  //   ⚠️ 개요 수집이 TourAPI 일일 한도로 여러 날에 걸쳐 이어진다 → **예약작업이 매주 이어받는다**.
  //      그래서 places_en.json 도 감시 대상이다(한쪽만 최신이면 다음 회차가 되돌린다).
  //   match-addr-ko.js / fix-addr-ko.js 는 build 가 require 하진 않지만 **주소를 «만드는» 도구**라
  //   드리프트가 나면 다음 회차가 옛 규칙으로 주소를 덮어쓴다.
  'en-nearby.js', 'fetch-en-places.js', 'data/places_en.json',
  'match-addr-ko.js', 'fix-addr-ko.js',
  // 2026-09-03 추가 — 축제 당일 날씨. festival.js 가 weather.js 를 require 하고, 그게 data/weather.json 을 읽는다.
  //   ⚠️ weather.json 은 «하루만 지나도 틀린» 파일이라 매일 새로 만든다 → 양쪽이 어긋나면
  //      한쪽 빌드에서 날씨가 통째로 사라진다(weather.js 의 신선도 가드가 막는다).
  //   ⚠️ data/weather.json 은 «매일 새로 만드는» 파일이라 감시 대상이 아니다 — 어제 것이 남아 있으면
  //      weather.js 의 신선도 가드가 통째로 날씨를 지운다. git 에도 넣지 않는다(.gitignore).
  'weather.js', 'fetch-weather.js',
  // 2026-09-03 추가 — 서울시 문화행사. ⚠️ `seoul.key` 는 *.key 라 git 제외 → **양쪽에 다 있어야** 수집기가 돈다
  //   (indexnow.key·cltur-fstvl.key 와 같은 함정. 한쪽에만 있으면 예약작업이 조용히 0건을 만든다.)
  //   seoul.js 는 build.js 가 require 한다 — 빠지면 «검사 안 되는 사각지대»가 된다(intl.js↔intl-text.js 재발 방지).
  'fetch-seoul.js', 'seoul.js', 'seoul.key', 'data/seoul_events.json',
  // 🏛 2026-09-11 — /seoul/museum/ · /busan/museum/ · /seoul/venue/ 한 벌.
  //   museum.js 는 build.js 가 require 한다 — 빠지면 한쪽에서 조용히 사라진다.
  'museum.js', '_museum_volume.py', 'data/museum_volume.json',
  'fetch-seoul-venue.js', 'data/seoul_culture.json',
  // 🔔 2026-09-11 — 브라우저 알림은 **OneSignal 이 이미 깔려 있다**(전 페이지 SDK + 루트 워커).
  //   OneSignalSDKWorker.js 는 .vercelignore 에서 `!` 로 되살려 둔 «진짜 서비스워커»다 — 감시 대상.
  'OneSignalSDKWorker.js',
  // 🔔 자동 발송. ⚠️ onesignal.key 는 *.key 라 git 제외 → **양쪽에 다 있어야** 예약작업이 돈다
  //   (seoul.key·busan.key 와 같은 함정. 한쪽에만 있으면 조용히 0건이 된다.)
  //   _push_log.json 은 «언제 보냈나»를 기억해 과다 발송을 막는 자물쇠다 — 지우면 중복 발송이 난다.
  '_push.js', '_push.ps1', '_push_tasks.ps1', 'onesignal.key', '_push_log.json',
  // 인수인계 노트 — 다음 세션이 먼저 읽는 파일. .vercelignore 의 `/*.md` 라 배포에는 안 나간다.
  'handoff-2026-09-11.md',
  // 🇯🇵 2026-09-14 — 일본어 전용 인수인계. 일본어 작업만 시작하는 세션은 «이것부터» 읽는다.
  //   왜 따로 뒀나: 일본이 우리 유일하게 사람이 오는 외국 시장인데(모바일 CTR 3.97%)
  //   제품이 틀려 있다(축제 사이트인데 일본인은 휴무일을 찾는다). 그 판단 근거가 전부 여기 있다.
  'handoff-ja-2026-09-14.md',
  // 2026-09-04 추가 — 부산(5개어 공식번역) · 외국어 도시 페이지 · 외국어 장소 수집기 일반화판.
  //   ⚠️ busan.key 도 *.key 라 git 제외 → 양쪽에 다 있어야 한다.
  'fetch-busan.js', 'busan.key', 'data/busan_festivals.json',
  'intl-city.js', 'fetch-places.js',
  // 2026-09-04 추가(2) — 부산 한국어. ⚠️ busan_places.json(문화공간 601곳)이 없으면 전시·공연에 주소·좌표가 안 붙는다.
  'busan.js', 'fetch-busan-culture.js', 'fetch-busan-place.js',
  'data/busan_culture.json', 'data/busan_places.json',
  // 2026-09-04 추가(3) — 제주 한국어. build.js 가 require 하므로 빠지면 «검사 안 되는 사각지대»가 된다.
  //   ⚠️ 제주는 «새 데이터 파일이 없다» — 비짓제주 API 없이 기존 재고(accessible·cafes_ko·mountains_ko 등)로 만든다.
  //      그래서 여기 추가할 data/*.json 이 없는 게 정상이다.
  'jeju.js',
  // 2026-09-07 추가 — 🏙 도시 페이지 공통 뼈대 + 도시 설정 11개.
  //   ⚠️ `gyeongju.js` 는 여기로 흡수돼 «삭제**됐다** — 목록에서도 뺀다(없는 파일을 감시하면 늘 「다름」이 뜬다).
  //   ⚠️ 제주와 같이 «새 데이터 파일이 없다» — 기존 재고(accessible·restaurants_ko·stays_ko·pets)로 만든다.
  'city-core.js', 'cities.js',
  // 2026-09-07 추가 — 🇰🇷 코리 연결. ⚠️ build.js·city-core·seoul·busan·jeju·intl-city **여섯 곳**이 require 한다.
  //   빠지면 「검사 안 되는 사각지대」가 되고 예약작업이 조용히 되돌린다.
  'kory.js',
  // 2026-09-04 추가(4) — 제주 신규 데이터 2종. ⚠️ `jejuhub.key`·`visitjeju.key` 는 *.key 라 git 제외 →
  //   **양쪽에 다 있어야** 예약작업이 돈다(indexnow.key·busan.key 와 같은 함정).
  //   ⚠️ `jejuhub-ids.json` 은 «프록시ID 표»다 — 이게 어긋나면 수집기가 엉뚱한 데이터를 받는다.
  'fetch-jeju.js', 'fetch-visitjeju.js', 'jejuhub-ids.json', 'jejuhub.key', 'visitjeju.key',
  'data/jeju_hub.json', 'data/visitjeju.json',
  // 2026-09-04 추가 — **또 사각지대였다.** `fetch-visitors.js`(수집기)는 목록에 있는데
  //   그게 만드는 `data/visitors.json`(결과)이 없었다. 그래서 양쪽이 어긋나도 「차이 0개」로 통과한다.
  //   ⚠️ 수집기를 목록에 넣을 땐 «그 수집기가 만드는 파일»도 같이 넣는다.
  //   (weather.json 만 예외 — 매일 새로 만드는 파일이라 감시하면 늘 「다름」이 뜬다.)
  'data/visitors.json',
  // 2026-09-04 추가 — 🚇 지하철(수집기 + 산출물을 «같이» 넣는다, 위 교훈 그대로)
  'fetch-subway.js', 'data/subway.json',
  // 2026-09-04 추가 — 중문·번체·서어 장소. `fetch-places.js` 는 이미 목록에 있는데 산출물이 없었다.
  //   ⚠️ 이 셋은 «일일 한도에 걸려 며칠에 걸쳐 채워지는» 파일이라 한동안 양쪽이 다를 수 있다.
  //      다르면 «C:\dev 쪽이 최신»이다(수집기가 거기서 돈다) → d2p 로 가져온다.
  'data/places_zh.json', 'data/places_tw.json', 'data/places_es.json',
  // 2026-09-09 추가 — 명소 사진 보강기 2종과 «그것이 채우는 파일». 수집기만 넣고 산출물을 빼면
  //   양쪽이 어긋나도 「차이 0개」로 통과한다(visitors.json 에서 겪은 그대로).
  //   ⚠️ data/maple.json 의 img·imgTried 는 fetch-spots.js 의 CARRY 로 «물려받아» 유지되는 값이다.
  //      한쪽이 옛 파일이면 다음 수집이 사진 48곳을 도로 지운다.
  'fetch-spot-img.js', 'fetch-spot-img2.js', 'data/maple.json',
  // 2026-09-09 추가 — 일문 장소 시·도 허브. build.js 가 require 한다(빠지면 사각지대).
  //   data/places_ja.json 은 이미 위 64줄에 있다.
  'places-ja.js',
  // 2026-09-14 추가 — 📊 주간 검색 리포트. ⏰ 월 08:00 윈도우 예약작업(chukjemoa-seo-weekly)이 이 둘을 돌린다.
  //   ⚠️ 만든 날 감시 목록에 안 넣어 하마터면 사각지대가 될 뻔했다 — 예약작업이 참조하는 파일은 반드시 넣는다.
  //   ⚠️ .ps1 은 ASCII 전용이다(윈도우 PowerShell 5.1 이 BOM 없는 UTF-8 한글을 깨뜨린다).
  '_seo_weekly.py', '_seo_weekly.ps1'];
const L = [];
let diff = 0;
for (const f of SRC) {
  const a = md5(path.join(DEV, f)), b = md5(path.join(PRJ, f));
  if (a === null) { L.push('dev 없음  ' + f); continue; }
  if (a !== b) { diff++; L.push((b === null ? '프로젝트폴더 없음  ' : '다름  ') + f); }
}
L.unshift('차이 ' + diff + '개 / 검사 ' + SRC.length + '개');
console.log(L.join('\n'));
