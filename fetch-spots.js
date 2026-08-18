// 범용 명소 수집기 — TourAPI 지역기반(관광지) 카테고리별 명소 + 개요 → data/{theme}.json
// 키는 tourapi.key(gitignore). 실행: node fetch-spots.js <theme>   (theme: maple|flower|onsen)
//   또는 인자 없이 실행하면 전체 테마를 순차 수집한다.
const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const LIST = 'https://apis.data.go.kr/B551011/KorService2/areaBasedList2';
const DET  = 'https://apis.data.go.kr/B551011/KorService2/detailCommon2';

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
  const cache = {};
  try { JSON.parse(fs.readFileSync(outPath,'utf8')).forEach(p=>{ if(p.ov) cache[p.id]=p.ov; }); } catch(e){}
  out.forEach(p=>{ if(cache[p.id]) p.ov = cache[p.id]; });
  fs.writeFileSync(outPath, JSON.stringify(out));
  async function overview(cid){
    const u = `${DET}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${cid}`;
    try { const j=JSON.parse(await get(u)); const it=j.response&&j.response.body&&j.response.body.items; const d=it&&it.item?(Array.isArray(it.item)?it.item[0]:it.item):null; if(!d) return null; return clean(d.overview||'').slice(0,300); } catch(e){ return null; }
  }
  const CAP = Number(process.env.CAP || 100000);
  const todo = out.filter(p=>!p.ov).slice(0, CAP);
  let got=0; const CB=8;
  for (let i=0;i<todo.length;i+=CB){
    const chunk = todo.slice(i,i+CB);
    const ds = await Promise.all(chunk.map(p=>overview(p.id)));
    ds.forEach((d,k)=>{ if(d){ chunk[k].ov=d; got++; } });
    process.stdout.write('\r['+key+'] 개요 '+Math.min(i+CB,todo.length)+'/'+todo.length+' (신규 '+got+')');
    if ((i/CB) % 10 === 0) fs.writeFileSync(outPath, JSON.stringify(out));
  }
  console.log('');
  fs.writeFileSync(outPath, JSON.stringify(out));
  const bySido={}; out.forEach(p=> bySido[p.sido]=(bySido[p.sido]||0)+1);
  console.log(`[${key}] 저장: ${out.length}곳 · 사진 ${out.filter(p=>p.img).length} · 개요 ${out.filter(p=>p.ov).length}`);
}
async function main(){
  const arg = (process.argv[2]||'').trim();
  const keys = arg ? [arg] : Object.keys(THEMES);
  for (const k of keys) await fetchTheme(k);
}
main();
