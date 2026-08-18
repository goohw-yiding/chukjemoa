// 계곡명소 API(KorService2 areaBasedList2, cat3=A01010900 계곡) + detailCommon2(개요) → data/valleys.json
// 키는 tourapi.key(gitignore)에서 읽음. 실행: node fetch-valleys.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const LIST = 'https://apis.data.go.kr/B551011/KorService2/areaBasedList2';
const DET  = 'https://apis.data.go.kr/B551011/KorService2/detailCommon2';
const DET2 = 'https://apis.data.go.kr/B551011/KorService2/detailIntro2';   // 영업시간·휴무·주차·문의처

// ⚠️ 「변칙 표기 방어」라고 적어 뒀지만 **방어가 아니라 오분류였다.**
//    '전남광주통합특별시':'광주' 로 뭉뚱그려 담양·장성·곡성·광양·순천 계곡 9곳이 전부 광주로 들어갔다
//    (2026-08-18 실측: 「광주」 라벨 9건 중 진짜 광주는 0건).
//    이제 공용 region.js 가 주소 두 번째 토큰으로 광주/전남을 가른다.
const { parseAddr, VALID_SIDO } = require('./region');
function clean(s){
  return (s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"')
    .replace(/\s+/g, ' ').trim();
}
function get(url){
  return new Promise((resolve,reject)=>{
    https.get(url,{headers:{'User-Agent':'chukjemoa'}},res=>{
      res.setEncoding('utf8'); let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve(d));
    }).on('error',reject);
  });
}
async function main(){
  const rows=100; let page=1, total=Infinity, all=[];
  while ((page-1)*rows < total){
    const url = `${LIST}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=${rows}&pageNo=${page}&contentTypeId=12&cat1=A01&cat2=A0101&cat3=A01010900&arrange=A`;
    let txt; try { txt = await get(url); } catch(e){ console.error('req err p'+page, e.message); break; }
    let j; try { j = JSON.parse(txt); } catch(e){ console.error('parse err p'+page, txt.slice(0,150)); break; }
    const body = j.response && j.response.body;
    if (!body){ console.error('no body p'+page, txt.slice(0,150)); break; }
    total = Number(body.totalCount)||0;
    let items = body.items && body.items.item;
    if (!items) break;
    if (!Array.isArray(items)) items=[items];
    all.push(...items);
    process.stdout.write(`\r목록 page ${page} / total ${total} (got ${all.length})`);
    if (items.length < rows) break;
    page++;
    if (page > 100) break;
  }
  console.log('');
  const seen=new Set(); const out=[];
  for (const it of all){
    if (!it.contentid || seen.has(it.contentid)) continue;
    seen.add(it.contentid);
    if (!it.title) continue;
    const { sido, sigungu } = parseAddr(it.addr1);
    if (!VALID_SIDO.has(sido)) continue;
    out.push({
      id: it.contentid,
      title: it.title.trim(),
      addr: (it.addr1||'').trim(),
      sido, sigungu,
      img: it.firstimage || '',
      x: it.mapx||'', y: it.mapy||'',
      tel: (it.tel||'').trim()
    });
  }
  out.sort((a,b)=> (a.sido||'').localeCompare(b.sido||'') || (a.title||'').localeCompare(b.title||''));

  // ---- 개요(overview) enrich : 캐시 병합 + 부족분만(중단 대비 주기 저장) ----
  const outPath = path.join(__dirname, 'data', 'valleys.json');
  // ⚠️ 물려받을 필드를 «하나라도 빠뜨리면 재수집이 곧 삭제»다 — 2026-08-18에 카페에서 그렇게
  //    영업시간·대표메뉴 2,018곳을 날렸다. 새 필드를 추가하면 이 목록에도 반드시 넣을 것.
  const CARRY = ['ov','tel','hp','open','rest','park'];
  const cache = {};
  try { JSON.parse(fs.readFileSync(outPath,'utf8')).forEach(p=>{ const k={}; let any=false; CARRY.forEach(f=>{ if(p[f]){k[f]=p[f];any=true;} }); if(any) cache[p.id]=k; }); } catch(e){}
  out.forEach(p=>{ const c=cache[p.id]; if(!c) return; CARRY.forEach(f=>{ if(c[f] && !p[f]) p[f]=c[f]; }); });
  fs.writeFileSync(outPath, JSON.stringify(out)); // 목록 우선 저장
  // 🚨 동시 8개는 TourAPI 초당 제한에 걸린다. 응답이 OpenAPI_ServiceResponse 로 오는데
  //    예전 코드가 조용히 삼켜 「데이터 없음」으로 보였다(fetch-spots.js 와 같은 사고).
  //    순차 + 120ms. 그리고 detailIntro2 로 영업시간·주차·문의처도 같이 받는다.
  const sleep = ms => new Promise(r=>setTimeout(r, ms));
  let apiErr = 0;
  async function detail(cid){
    const o = {};
    try {
      const j = JSON.parse(await get(`${DET}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${cid}`));
      if (j.OpenAPI_ServiceResponse) { apiErr++; return null; }
      const it = j.response && j.response.body && j.response.body.items;
      const d = it && it.item ? (Array.isArray(it.item)?it.item[0]:it.item) : null;
      if (d) { o.ov = clean(d.overview||'').slice(0,300); o.tel = clean(d.tel||'').slice(0,60); o.hp = clean(d.homepage||'').replace(/<[^>]*>/g,'').slice(0,200); }
    } catch(e){ apiErr++; }
    await sleep(120);
    try {
      const j2 = JSON.parse(await get(`${DET2}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${cid}&contentTypeId=12`));
      if (j2.OpenAPI_ServiceResponse) apiErr++;
      else {
        const it2 = j2.response && j2.response.body && j2.response.body.items;
        const d2 = it2 && it2.item ? (Array.isArray(it2.item)?it2.item[0]:it2.item) : null;
        if (d2) {
          o.open = clean(d2.usetime||'').slice(0,60);
          o.rest = clean(d2.restdate||'').slice(0,50);
          o.park = clean(d2.parking||'').slice(0,60);
          if (!o.tel && d2.infocenter) o.tel = clean(d2.infocenter).slice(0,60);
        }
      }
    } catch(e){ apiErr++; }
    return o;
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
      process.stdout.write('\r상세 '+(i+1)+'/'+todo.length+' (개요+'+n.ov+' 전화+'+n.tel+' 영업+'+n.open+' 주차+'+n.park+(apiErr?' ⚠️API오류'+apiErr:'')+')');
      if (i % 50 === 0) fs.writeFileSync(outPath, JSON.stringify(out));
    }
    await sleep(120);
  }
  console.log('');
  fs.writeFileSync(outPath, JSON.stringify(out));
  const bySido={}; out.forEach(p=> bySido[p.sido]=(bySido[p.sido]||0)+1);
  const pct = k => Math.round(out.filter(p=>p[k]).length / out.length * 100) + '%';
  console.log('총 수집:', all.length, '→ 저장:', out.length);
  console.log('개요 ' + pct('ov') + ' · 전화 ' + pct('tel') + ' · 영업시간 ' + pct('open') + ' · 주차 ' + pct('park')
    + (apiErr ? '  ⚠️ API 오류 ' + apiErr + '회' : ''));
  console.log('시도별:', JSON.stringify(bySido));
}
main();
