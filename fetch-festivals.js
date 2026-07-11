// TourAPI(KorService2) searchFestival2 → data/festivals_api.json
// 키는 tourapi.key(gitignore)에서 읽음. 실행: node fetch-festivals.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const BASE = 'https://apis.data.go.kr/B551011/KorService2/searchFestival2';

const SIDO = {
  '서울특별시':'서울','부산광역시':'부산','대구광역시':'대구','인천광역시':'인천',
  '광주광역시':'광주','대전광역시':'대전','울산광역시':'울산','세종특별자치시':'세종',
  '경기도':'경기','강원특별자치도':'강원','강원도':'강원','충청북도':'충북','충청남도':'충남',
  '전라북도':'전북','전북특별자치도':'전북','전라남도':'전남','경상북도':'경북','경상남도':'경남',
  '제주특별자치도':'제주','제주도':'제주'
};
function parseAddr(a){
  a = (a||'').trim();
  const t = a.split(/\s+/);
  const first = t[0]||'', second = t[1]||'';
  let sido;
  if (/^전남광주통합/.test(first)) {          // API 병합 명칭: 둘째 토큰이 '구'면 광주, 아니면 전남
    sido = /구$/.test(second) ? '광주' : '전남';
  } else if (/^서울/.test(first)) {
    sido = '서울';
  } else {
    sido = SIDO[first] || first.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/,'') || '';
  }
  const sigungu = /(시|군|구)$/.test(second) ? second : '';
  return { sido, sigungu };
}

function get(url){
  return new Promise((resolve,reject)=>{
    https.get(url,{headers:{'User-Agent':'chukjemoa'}},res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve(d));
    }).on('error',reject);
  });
}
function ymd(d){ return d.toISOString().slice(0,10).replace(/-/g,''); }

async function main(){
  const start = new Date(Date.now() - 1000*60*60*24*60); // 60일 전부터(진행중 포함)
  const eventStartDate = ymd(start);
  const rows = 100;
  let page = 1, total = Infinity, all = [];
  while ((page-1)*rows < total){
    const url = `${BASE}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json`
      + `&numOfRows=${rows}&pageNo=${page}&eventStartDate=${eventStartDate}&arrange=A`;
    let txt;
    try { txt = await get(url); } catch(e){ console.error('req err p'+page, e.message); break; }
    let j; try { j = JSON.parse(txt); } catch(e){ console.error('parse err p'+page, txt.slice(0,150)); break; }
    const body = j.response && j.response.body;
    if (!body){ console.error('no body p'+page, txt.slice(0,150)); break; }
    total = Number(body.totalCount)||0;
    let items = body.items && body.items.item;
    if (!items){ break; }
    if (!Array.isArray(items)) items = [items];
    all.push(...items);
    process.stdout.write(`\rpage ${page} / total ${total} (got ${all.length})`);
    if (items.length < rows) break;
    page++;
    if (page > 80) break;
  }
  console.log('');

  // 중복 제거 + 변환
  const seen = new Set();
  const out = [];
  for (const it of all){
    if (!it.contentid || seen.has(it.contentid)) continue;
    seen.add(it.contentid);
    if (!it.title || !it.eventenddate) continue;
    const { sido, sigungu } = parseAddr(it.addr1);
    out.push({
      id: it.contentid,
      title: it.title.trim(),
      start: it.eventstartdate,
      end: it.eventenddate,
      addr: (it.addr1||'').trim(),
      sido, sigungu,
      img: it.firstimage || '',
      x: it.mapx || '', y: it.mapy || '',
      tel: (it.tel||'').trim()
    });
  }
  // 종료일 오름차순
  out.sort((a,b)=> (a.end||'').localeCompare(b.end||''));
  const dir = path.join(__dirname, 'data');
  fs.writeFileSync(path.join(dir, 'festivals_api.json'), JSON.stringify(out));
  // 시도별 카운트 요약
  const bySido = {};
  out.forEach(f=> bySido[f.sido||'기타'] = (bySido[f.sido||'기타']||0)+1);
  console.log('총 수집:', all.length, '→ 저장:', out.length);
  console.log('시도별:', JSON.stringify(bySido));
}
main();
