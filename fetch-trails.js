// 두루누비 걷기길 API(Durunubi/courseList) → data/trails.json
// 키는 tourapi.key(gitignore)에서 읽음. 실행: node fetch-trails.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const BASE = 'https://apis.data.go.kr/B551011/Durunubi/courseList';

// 시군 문자열 → 시도 추정
const SIDO_KEYS = ['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주'];
const SIDO_ALIAS = { '충청북도':'충북','충청남도':'충남','전라북도':'전북','전북특별자치도':'전북','전라남도':'전남','경상북도':'경북','경상남도':'경남','강원특별자치도':'강원','강원도':'강원','제주특별자치도':'제주','서울특별시':'서울','부산광역시':'부산','대구광역시':'대구','인천광역시':'인천','광주광역시':'광주','대전광역시':'대전','울산광역시':'울산','세종특별자치시':'세종','경기도':'경기' };
function sidoOf(sigun){
  const s = (sigun || '').trim();
  if (!s) return '';
  for (const k in SIDO_ALIAS) if (s.indexOf(k) === 0) return SIDO_ALIAS[k];
  for (const k of SIDO_KEYS) if (s.indexOf(k) >= 0) return k;
  return '';
}
const LEVEL = { '1':'쉬움','2':'보통','3':'어려움','4':'매우 어려움','5':'매우 어려움' };
function clean(s){
  return (s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ').trim();
}
function get(url){
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'chukjemoa' } }, res => {
      res.setEncoding('utf8'); let d=''; res.on('data', c => d += c); res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}
async function main(){
  const url = `${BASE}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=500&pageNo=1`;
  let txt; try { txt = await get(url); } catch(e){ console.error('req err', e.message); return; }
  let j; try { j = JSON.parse(txt); } catch(e){ console.error('parse err', txt.slice(0,200)); return; }
  const body = j.response && j.response.body;
  let items = body && body.items && body.items.item;
  if (!items) { console.error('no items', txt.slice(0,200)); return; }
  if (!Array.isArray(items)) items = [items];
  const out = [];
  for (const it of items) {
    const name = (it.crsKorNm || '').trim();
    if (!name) continue;
    const sigun = (it.sigun || '').trim();
    const distKm = parseFloat(it.crsDstnc) || 0;
    const min = parseInt(it.crsTotlRqrmHour, 10) || 0;
    // 테마: 코스명 접두(예: "남파랑길 2코스" → "남파랑길")
    const theme = (name.match(/^([가-힣A-Za-z]+길)/) || [])[1] || (name.split(/\s+/)[0] || '');
    out.push({
      id: it.crsIdx || (it.routeIdx + '_' + name),
      name,
      theme,
      sigun,
      sido: sidoOf(sigun),
      dist: distKm,                     // km
      min,                              // 소요(분)
      level: LEVEL[String(it.crsLevel)] || '',
      cycle: (it.crsCycle || '').trim(),
      summary: clean(it.crsSummary).slice(0, 160),
      desc: clean(it.crsContents).slice(0, 400),
      tour: clean(it.crsTourInfo).slice(0, 200)
    });
  }
  // ★ 기존 데이터와 병합 — 덮어쓰지 않는다.
  //   두루누비 API가 시기에 따라 코스를 적게 주는 일이 있다(2026-08 실측: 262개 → 152개).
  //   그대로 덮어쓰면 멀쩡한 코스가 사라지므로, id 기준으로 갱신·추가만 하고 기존 항목은 남긴다.
  const P = path.join(__dirname, 'data', 'trails.json');
  let prev = [];
  try { prev = JSON.parse(fs.readFileSync(P, 'utf8')); } catch (e) {}
  const merged = {};
  prev.forEach(t => { if (t && t.id) merged[t.id] = t; });
  let added = 0, updated = 0;
  out.forEach(t => { if (merged[t.id]) updated++; else added++; merged[t.id] = t; });
  const final = Object.values(merged);
  final.sort((a,b)=> (a.sido||'힣').localeCompare(b.sido||'힣') || (a.name||'').localeCompare(b.name||''));
  if (prev.length && final.length < prev.length) {
    console.error('⚠ 병합 후 개수가 줄었습니다(' + prev.length + '→' + final.length + '). 저장을 중단합니다.');
    return;
  }
  fs.writeFileSync(P, JSON.stringify(final));
  console.log('병합: 기존', prev.length, '+ 신규', added, '(갱신', updated, ') →', final.length, '코스');
  const out2 = final; out.length = 0; out.push(...out2);
  const byTheme = {}; out.forEach(t=> byTheme[t.theme]=(byTheme[t.theme]||0)+1);
  const bySido = {}; out.forEach(t=> bySido[t.sido||'전국']=(bySido[t.sido||'전국']||0)+1);
  console.log('저장:', out.length, '코스');
  console.log('테마:', JSON.stringify(byTheme));
  console.log('시도:', JSON.stringify(bySido));
  console.log('레벨 샘플:', out.slice(0,3).map(t=>t.name+'|'+t.dist+'km|'+t.level+'|'+t.sigun).join('  ||  '));
}
main();
