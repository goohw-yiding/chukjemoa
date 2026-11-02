@echo off
chcp 65001 > nul
cd /d C:\dev\chukjemoa
node confirm-festivals.js --note "서울빛초롱축제" "2026-11-02: 미발표 — FUN SEOUL festacode=360 여전히 '(예정) 12월'만, visitkorea kfes는 2025.12.12~2026.01.18(종료). 적힌 종료일 1/17 의심" > _notes.txt 2>&1
node confirm-festivals.js --note "평창송어축제" "2026-11-02: 2026-27 시즌 미발표(공식·2026 하반기 기사 없음). trazy 투어상품만 '1월 9일~2월 9일'(불인정)" >> _notes.txt 2>&1
node confirm-festivals.js --note "대관령눈꽃축제" "2026-11-02: 2027 회차 미발표" >> _notes.txt 2>&1
node confirm-festivals.js --note "정읍 내장산단풍축제" "2026-11-02: 여전히 미발표 — 2026 공식·기사 없음(wikitree 1166749 손님맞이 점검 기사만). 예년 날짜 자체가 의심" >> _notes.txt 2>&1
node confirm-festivals.js --note "서울김장문화제" "2026-11-02: 2026 미발표. 서울시 미디어허브 최신 공지 없음. 2025엔 '대한민국 김장대축제'로 대체 — 명칭 변경·중단 의심" >> _notes.txt 2>&1
node confirm-festivals.js --note "파주장단콩축제" "2026-11-02: 근거 1곳 — 공식 tour.paju.go.kr 축제소개 '2026. 11. 27.(금) ~ 11. 29.(일)' ✅. 2번째 인정 근거(2026 기사) 못 찾음(make2t 블로그·thefestival 불인정). 적힌 11/20~22와 다름 — 예년 날짜 의심" >> _notes.txt 2>&1
node confirm-festivals.js --note "아침고요수목원 오색별빛정원전" "2026-11-02: 2026-27 시즌 미발표. 작년 2025.12.5~2026.3.15" >> _notes.txt 2>&1
node confirm-festivals.js --note "부산크리스마스트리문화축제" "2026-11-02: 2026 미발표. 현 명칭 '광복로 겨울빛 트리축제'(litt.ly/gwangbok_treefestival 2025판)" >> _notes.txt 2>&1
node confirm-festivals.js --note "2026 캠핑요리축제" "2026-11-02: 공식 campingcook.isplus.com ✅ 1곳. nate 20260613n10203/08591/08612/08596 모두 종료일 문구 없음 ❌, ktriptips·themade 집계사이트 불인정" >> _notes.txt 2>&1
node confirm-festivals.js --note "인천어린이과학관 과학으로 자라는 어린이" "2026-11-02: 근거 1곳 — 경인일보 kyeongin.com/article/1762586(2026-04-27) '5일 오전 10시~오후 5시 과학으로 자라는 어린이' ✅. 2번째 근거 못 찾음(fnnews·metroseoul은 다른 기관 기사)" >> _notes.txt 2>&1
echo END >> _notes.txt
