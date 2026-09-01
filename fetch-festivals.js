// TourAPI(KorService2) searchFestival2 → data/festivals_api.json
// 키는 tourapi.key(gitignore)에서 읽음. 실행: node fetch-festivals.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const BASE = 'https://apis.data.go.kr/B551011/KorService2/searchFestival2';

// ⚠️ 2026-09-01 — 여기 자체 parseAddr 가 있었는데 **시·도 값을 검증하지 않았다.**
//    「포항시 북구 두호동…」처럼 주소에 시·도가 빠진 레코드에서 `sido='포항시'`가 그대로 저장돼,
//    그 축제가 경북 목록에서 통째로 빠지고 붐빔 지표도 안 붙었다(주간 품질점검에서 잡힘).
//    region.js 의 parseAddr 는 VALID_SIDO 에 없으면 ''를 돌려준다 — **그걸 쓴다.**
//    ⭐ region.js 주석에 「새 수집 스크립트는 반드시 여기 함수를 쓸 것」이라고 적혀 있었는데
//       정작 가장 오래된 이 수집기가 안 쓰고 있었다.
const { parseAddr } = require('./region');

// 주소에 시·도가 없으면 «시·군·구 이름»으로 되찾는다.
// 표를 새로 만들지 않고, 제대로 파싱된 다른 레코드에서 «시·군 → 시·도» 대응을 학습한다.
function fillMissingSido(list) {
  const map = {};
  for (const r of list) {
    if (!r.sido || !r.sigungu) continue;
    if (!map[r.sigungu]) map[r.sigungu] = r.sido;
  }
  let fixed = 0, still = [];
  for (const r of list) {
    if (r.sido) continue;
    const toks = String(r.addr || '').trim().split(/\s+/);
    // 첫 토큰이 「포항시」처럼 시·군이면 그것으로, 아니면 둘째 토큰으로 찾는다
    const cand = [toks[0], toks[1]].filter(t => t && /(시|군)$/.test(t));
    for (const c of cand) {
      if (map[c]) { r.sido = map[c]; if (!r.sigungu) r.sigungu = c; fixed++; break; }
    }
    if (!r.sido) still.push(r.title);
  }
  if (fixed) console.log('  ↩ 주소에 시·도가 없던 ' + fixed + '건을 시·군 이름으로 복원');
  if (still.length) console.log('  ⚠️ 시·도를 끝내 못 정한 축제 ' + still.length + '건: ' + still.slice(0, 5).join(' · '));
  return list;
}

function get(url){
  return new Promise((resolve,reject)=>{
    https.get(url,{headers:{'User-Agent':'chukjemoa'}},res=>{
      res.setEncoding('utf8'); let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve(d));
    }).on('error',reject);
  });
}
function ymd(d){ return d.toISOString().slice(0,10).replace(/-/g,''); }

async function main(){
  const start = new Date(new Date().getFullYear() - 1, 0, 1); // 작년 1/1부터(지난 축제 아카이브 포함)
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
      tel: (it.tel||'').trim(),
      pet: /반려|반려견|반려동물|댕댕|멍멍|펫\b|펫페어|강아지|도그|\bdog\b|\bpet\b/i.test(it.title||'') ? 1 : 0
    });
  }
  // 주소에 시·도가 빠진 것 복원 (정렬·저장 전에 해야 한다)
  fillMissingSido(out);
  // 종료일 오름차순
  out.sort((a,b)=> (a.end||'').localeCompare(b.end||''));
  const dir = path.join(__dirname, 'data');
  const fpath = path.join(dir, 'festivals_api.json');
  // ---- 상세 개요·공식홈페이지 enrich (KorService2/detailCommon2) : 캐시병합 + 부족분만, 하루한도 대비 CAP ----
  const fcache = {};
  try { JSON.parse(fs.readFileSync(fpath,'utf8')).forEach(f=>{ if(f.ov||f.hp||f.enr) fcache[f.id]={ov:f.ov||'',hp:f.hp||'',enr:f.enr?1:0}; }); } catch(e){}
  out.forEach(f=>{ const c=fcache[f.id]; if(c){ if(c.ov)f.ov=c.ov; if(c.hp)f.hp=c.hp; if(c.enr)f.enr=1; } });
  const DC='https://apis.data.go.kr/B551011/KorService2/detailCommon2';
  function hpUrl(s){ if(!s) return ''; const m=String(s).match(/href=["']([^"']+)["']/i); return m?m[1]:''; }
  async function common(cid){ const u=`${DC}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${cid}`; try{ const j=JSON.parse(await get(u)); const it=j.response&&j.response.body&&j.response.body.items; const d=it&&it.item?(Array.isArray(it.item)?it.item[0]:it.item):null; if(!d)return null; return {ov:(d.overview||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s{2,}/g,' ').trim().slice(0,600), hp:hpUrl(d.homepage)}; }catch(e){ return null; } }
  // CAP: 운영계정 승인(2026-07-16)으로 하루 10만회 → 기본 전량. 필요시 `set CAP=500`으로 제한 가능.
  // enr 플래그 = 조회 시도 완료 표시(공식홈피 없는 축제를 매주 무한 재조회하지 않도록). 기존 데이터엔 없으므로 최초 1회 전량 재조회됨.
  const CAP = Number(process.env.CAP || 100000);
  const need = out.filter(f=>!f.enr).slice(0, CAP);
  let en=0; const CB2=10;
  for(let i=0;i<need.length;i+=CB2){ const ch=need.slice(i,i+CB2); const ds=await Promise.all(ch.map(f=>common(f.id))); ds.forEach((d,k)=>{ if(d){ ch[k].enr=1; if(d.ov){ch[k].ov=d.ov;en++;} if(d.hp)ch[k].hp=d.hp; } }); process.stdout.write('\r개요 '+Math.min(i+CB2,need.length)+'/'+need.length+' (신규 '+en+')'); }
  console.log('');
  console.log('개요 보유:', out.filter(f=>f.ov).length, '/', out.length, '| 공식홈피:', out.filter(f=>f.hp).length);
  fs.writeFileSync(fpath, JSON.stringify(out));
  // 시도별 카운트 요약
  const bySido = {};
  out.forEach(f=> bySido[f.sido||'기타'] = (bySido[f.sido||'기타']||0)+1);
  console.log('총 수집:', all.length, '→ 저장:', out.length);
  console.log('시도별:', JSON.stringify(bySido));
}
main();
