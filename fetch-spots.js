// 범용 명소 수집기 — TourAPI 지역기반(관광지) 카테고리별 명소 + 개요 → data/{theme}.json
// 키는 tourapi.key(gitignore). 실행: node fetch-spots.js <theme>   (theme: maple|flower|onsen)
//   또는 인자 없이 실행하면 전체 테마를 순차 수집한다.
const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const LIST = 'https://apis.data.go.kr/B551011/KorService2/areaBasedList2';
const DET  = 'https://apis.data.go.kr/B551011/KorService2/detailCommon2';
const DET2 = 'https://apis.data.go.kr/B551011/KorService2/detailIntro2';   // 영업시간·휴무·주차·문의처

// 테마별 카테고리(TourAPI 분류코드)
const THEMES = {
  maple:  { file: 'maple.json',  cat1: 'A01', cat2: 'A0101', cat3: 'A01010400' }, // 산 (단풍)
  flower: { file: 'flower.json', cat1: 'A01', cat2: 'A0101', cat3: 'A01010700' }, // 수목원 (봄 꽃·정원)
  onsen:  { file: 'onsen.json',  cat1: 'A02', cat2: 'A0202', cat3: 'A02020300' }, // 온천/스파 (겨울)
};

// ⚠️ 여기 있던 표는 '전남광주통합특별시':'광주' 로 뭉뚱그려 두고 있었다.
//    그 결과 2026-08-18 실측에서 **온천 5 · 봄꽃 7 · 단풍 21곳(전부 전남)이 광주로** 들어가 있었다.
//    광양·고흥·곡성·해남이 「광주 단풍」으로 뜨고, 「전남 단풍 0곳」이 됐다.
//    이제 공용 region.js 가 주소 두 번째 토큰으로 광주/전남을 가른다.
const { parseAddr, VALID_SIDO } = require('./region');
function clean(s){
  return (s||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
}
function get(url){
  return new Promise((resolve,reject)=>{
    https.get(url,{headers:{'User-Agent':'chukjemoa'}},res=>{
      res.setEncoding('utf8'); let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve(d));
    }).on('error',reject);
  });
}
async function fetchTheme(key){
  const T = THEMES[key];
  if(!T){ console.error('알 수 없는 테마:', key, '(maple|flower|onsen)'); return; }
  const rows=100; let page=1, total=Infinity, all=[];
  while ((page-1)*rows < total){
    const url = `${LIST}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=${rows}&pageNo=${page}&contentTypeId=12&cat1=${T.cat1}&cat2=${T.cat2}&cat3=${T.cat3}&arrange=A`;
    let txt; try { txt = await get(url); } catch(e){ console.error('req err p'+page, e.message); break; }
    let j; try { j = JSON.parse(txt); } catch(e){ console.error('parse err p'+page, txt.slice(0,150)); break; }
    const body = j.response && j.response.body;
    if (!body){ console.error('no body p'+page, txt.slice(0,150)); break; }
    total = Number(body.totalCount)||0;
    let items = body.items && body.items.item;
    if (!items) break;
    if (!Array.isArray(items)) items=[items];
    all.push(...items);
    process.stdout.write(`\r[${key}] 목록 page ${page} / total ${total} (got ${all.length})`);
    if (items.length < rows) break;
    page++; if (page>100) break;
  }
  console.log('');
  const seen=new Set(); const out=[];
  for (const it of all){
    if (!it.contentid || seen.has(it.contentid)) continue;
    seen.add(it.contentid);
    if (!it.title) continue;
    const { sido, sigungu } = parseAddr(it.addr1);
    if (!VALID_SIDO.has(sido)) continue;
    out.push({ id: it.contentid, title: it.title.trim(), addr: (it.addr1||'').trim(), sido, sigungu, img: it.firstimage || '', x: it.mapx||'', y: it.mapy||'', tel: (it.tel||'').trim() });
  }
  out.sort((a,b)=> (a.sido||'').localeCompare(b.sido||'') || (a.title||'').localeCompare(b.title||''));

  const outPath = path.join(__dirname, 'data', T.file);
  // 이미 받아 둔 값은 다시 받지 않는다(재실행이 싸야 매주 돌릴 수 있다).
  // ⚠️ 물려받을 필드를 «하나라도 빠뜨리면 재수집이 곧 삭제»다 — 2026-08-18에 카페에서 그렇게
  //    영업시간·대표메뉴 2,018곳을 날렸다. 새 필드를 추가하면 이 목록에도 반드시 넣을 것.
  const CARRY = ['ov','tel','hp','open','rest','park'];
  const cache = {};
  try { JSON.parse(fs.readFileSync(outPath,'utf8')).forEach(p=>{ const k={}; let any=false; CARRY.forEach(f=>{ if(p[f]){k[f]=p[f];any=true;} }); if(any) cache[p.id]=k; }); } catch(e){}
  out.forEach(p=>{ const c=cache[p.id]; if(!c) return; CARRY.forEach(f=>{ if(c[f] && !p[f]) p[f]=c[f]; }); });
  fs.writeFileSync(outPath, JSON.stringify(out));
  // ⚠️ 2026-08-18 점검: 이 단계가 «끝까지 돈 적이 없었다».
  //    onsen 개요 0% · flower 0% · maple 15% — 그래서 /onsen/·/flower/ 가 항목당 25~27자(이름+시군)뿐이었다.
  //    개요가 91% 있는 계곡은 항목당 145자다. 데이터만 채우면 페이지가 5배가 된다.
  //    detailCommon2 는 개요와 «전화번호»를 같이 준다(목록 API의 tel 은 늘 비어 있어 전 데이터 0%였다).
  // 🚨 왜 이 단계가 «한 번도 끝까지 못 돌았나» (2026-08-18 원인 규명)
  //    동시에 8개씩 던지고 있었는데 TourAPI 는 **초당 요청 제한**이 있다.
  //    응답이 {"OpenAPI_ServiceResponse":{"cmmMsgHeader":{"errMsg":"LIMITED_NUMBER_OF_SERVICE_REQUESTS_PER_SECOND_EXCEEDS_ERROR"}}} 로 오는데
  //    코드가 `if(!d) return null` 로 조용히 삼켜서 **「데이터가 없다」로 보였다.**
  //    → 순차 + 120ms 간격(fetch-markets.js 와 같은 방식)으로 바꾸고, 에러는 «세어서 보고»한다.
  // ⭐ detailIntro2(contentTypeId=12)도 같이 받는다 — 영업시간·휴무·주차·문의처가 여기 있다.
  //    오일장에서 쓴 것과 같은 수법이다.
  const sleep = ms => new Promise(r=>setTimeout(r, ms));
  let apiErr = 0;
  async function detail(cid){
    const out2 = {};
    try {
      const j = JSON.parse(await get(`${DET}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${cid}`));
      if (j.OpenAPI_ServiceResponse) { apiErr++; return null; }          // ← 조용히 삼키지 않는다
      const it = j.response && j.response.body && j.response.body.items;
      const d = it && it.item ? (Array.isArray(it.item) ? it.item[0] : it.item) : null;
      if (d) { out2.ov = clean(d.overview||'').slice(0,300); out2.tel = clean(d.tel||'').slice(0,60); out2.hp = clean(d.homepage||'').replace(/<[^>]*>/g,'').slice(0,200); }
    } catch(e){ apiErr++; }
    await sleep(120);
    try {
      const j2 = JSON.parse(await get(`${DET2}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${cid}&contentTypeId=12`));
      if (j2.OpenAPI_ServiceResponse) { apiErr++; }
      else {
        const it2 = j2.response && j2.response.body && j2.response.body.items;
        const d2 = it2 && it2.item ? (Array.isArray(it2.item) ? it2.item[0] : it2.item) : null;
        if (d2) {
          out2.open = clean(d2.usetime||'').slice(0,60);
          out2.rest = clean(d2.restdate||'').slice(0,50);
          out2.park = clean(d2.parking||'').slice(0,60);
          if (!out2.tel && d2.infocenter) out2.tel = clean(d2.infocenter).slice(0,60);   // 문의처가 전화번호 대체
        }
      }
    } catch(e){ apiErr++; }
    return out2;
  }
  const CAP = Number(process.env.CAP || 100000);
  const todo = out.filter(p=>!p.ov || !p.tel || p.open === undefined).slice(0, CAP);
  const KEYS = ['ov','tel','hp','open','rest','park'];
  const n = {}; KEYS.forEach(k=> n[k]=0);
  for (let i=0;i<todo.length;i++){
    const p = todo[i];
    const d = await detail(p.id);
    if (d) KEYS.forEach(k=>{ if (d[k] && !p[k]) { p[k]=d[k]; n[k]++; } });
    if (i % 10 === 0 || i === todo.length-1) {
      process.stdout.write('\r['+key+'] 상세 '+(i+1)+'/'+todo.length+' (개요+'+n.ov+' 전화+'+n.tel+' 영업+'+n.open+' 주차+'+n.park+(apiErr?' ⚠️API오류'+apiErr:'')+')');
      if (i % 50 === 0) fs.writeFileSync(outPath, JSON.stringify(out));
    }
    await sleep(120);
  }
  console.log('');
  fs.writeFileSync(outPath, JSON.stringify(out));
  const pct = k => Math.round(out.filter(p=>p[k]).length / out.length * 100) + '%';
  console.log(`[${key}] 저장: ${out.length}곳 · 사진 ${pct('img')} · 개요 ${pct('ov')} · 전화 ${pct('tel')} · 영업시간 ${pct('open')} · 주차 ${pct('park')}`
    + (apiErr ? `  ⚠️ API 오류 ${apiErr}회 (초당 제한이면 간격을 늘릴 것)` : ''));
}
async function main(){
  const arg = (process.argv[2]||'').trim();
  const keys = arg ? [arg] : Object.keys(THEMES);
  for (const k of keys) await fetchTheme(k);
}
main();
