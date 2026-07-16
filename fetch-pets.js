// 반려동물 동반여행 API(KorPetTourService2) petTourSyncList2 → data/pets.json
// 키는 tourapi.key(gitignore)에서 읽음. 실행: node fetch-pets.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const BASE = 'https://apis.data.go.kr/B551011/KorPetTourService2/petTourSyncList2';

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
  if (/^전남광주통합/.test(first)) sido = /구$/.test(second) ? '광주' : '전남';
  else if (/^서울/.test(first)) sido = '서울';
  else sido = SIDO[first] || first.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/,'') || '';
  const sigungu = /(시|군|구)$/.test(second) ? second : '';
  return { sido, sigungu };
}
const CAT = {'12':'관광지','14':'문화시설','15':'축제·행사','25':'여행코스','28':'레포츠','32':'숙박','38':'쇼핑','39':'음식점'};
const VALID_SIDO = new Set(['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']);
const SKIP_TYPE = new Set(['15','25','38']); // 축제·여행코스·쇼핑(약국/마트 다수) 제외

function get(url){
  return new Promise((resolve,reject)=>{
    https.get(url,{headers:{'User-Agent':'chukjemoa'}},res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve(d));
    }).on('error',reject);
  });
}
async function main(){
  const rows = 100;
  let page = 1, total = Infinity, all = [];
  while ((page-1)*rows < total){
    const url = `${BASE}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=${rows}&pageNo=${page}`;
    let txt; try { txt = await get(url); } catch(e){ console.error('req err p'+page, e.message); break; }
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
    if (page > 200) break;
  }
  console.log('');
  const seen = new Set(); const out = [];
  for (const it of all){
    if (!it.contentid || seen.has(it.contentid)) continue;
    seen.add(it.contentid);
    if (!it.title) continue;
    if (SKIP_TYPE.has(it.contenttypeid)) continue;
    const { sido, sigungu } = parseAddr(it.addr1);
    if (!VALID_SIDO.has(sido)) continue; // 주소 불량/인코딩 깨진 항목 제외
    out.push({
      id: it.contentid,
      title: it.title.trim(),
      cat: CAT[it.contenttypeid] || '기타',
      addr: (it.addr1||'').trim(),
      sido, sigungu,
      img: it.firstimage || '',
      x: it.mapx || '', y: it.mapy || '',
      tel: (it.tel||'').trim()
    });
  }
  out.sort((a,b)=> (a.sido||'').localeCompare(b.sido||'') || (a.title||'').localeCompare(b.title||''));
  // ---- 상세 반려동물 정보 enrich (KorPetTourService2/detailPetTour2) : 캐시 병합 + 부족분만, 하루한도 대비 캡 ----
  const petsPath = path.join(__dirname, 'data', 'pets.json');
  const cache = {};
  try { JSON.parse(fs.readFileSync(petsPath,'utf8')).forEach(p=>{ if(p.psbl||p.type||p.need||p.note||p.enr) cache[p.id]={psbl:p.psbl||'',type:p.type||'',need:p.need||'',note:p.note||'',enr:p.enr?1:0}; }); } catch(e){}
  out.forEach(p=>{ const c=cache[p.id]; if(c){ if(c.psbl)p.psbl=c.psbl; if(c.type)p.type=c.type; if(c.need)p.need=c.need; if(c.note)p.note=c.note; if(c.enr)p.enr=1; } });
  const DET = 'https://apis.data.go.kr/B551011/KorPetTourService2/detailPetTour2';
  function clean(s){ return (s||'').replace(/^[\s\-·]+/,'').replace(/\s*\n\s*/g,' · ').replace(/\s{2,}/g,' ').trim(); }
  async function detail(cid){
    const u = `${DET}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${cid}`;
    try { const j = JSON.parse(await get(u)); const it = j.response && j.response.body && j.response.body.items; const d = it && it.item ? (Array.isArray(it.item)?it.item[0]:it.item) : null; if(!d) return null;
      return { psbl:(d.acmpyPsblCpam||'').trim(), type:(d.acmpyTypeCd||'').trim(), need:(d.acmpyNeedMtr||'').trim(), note:clean(d.etcAcmpyInfo) }; } catch(e){ return null; }
  }
  // 운영계정 승인(2026-07-16)으로 하루 10만회 → 기본 전량. 필요시 `set CAP=500`으로 제한 가능.
  // enr 플래그 = 조회 시도 완료 표시(상세정보가 아예 없는 장소를 매주 무한 재조회하지 않도록).
  const CAP = Number(process.env.CAP || 100000);
  const todo = out.filter(p=>!p.enr).slice(0, CAP);
  let got=0; const CB = 8;
  for (let i=0;i<todo.length;i+=CB){
    const chunk = todo.slice(i,i+CB);
    const ds = await Promise.all(chunk.map(p=>detail(p.id)));
    ds.forEach((d,k)=>{ if(d){ chunk[k].enr=1; if(d.psbl){chunk[k].psbl=d.psbl;got++;} if(d.type)chunk[k].type=d.type; if(d.need)chunk[k].need=d.need; if(d.note)chunk[k].note=d.note; } });
    process.stdout.write('\r상세 '+Math.min(i+CB,todo.length)+'/'+todo.length+' (신규수집 '+got+')');
  }
  console.log('');
  console.log('상세정보 보유:', out.filter(p=>p.psbl||p.type||p.need||p.note).length, '/', out.length, '(남은 미수집은 다음 주간갱신에서 채움)');
  fs.writeFileSync(petsPath, JSON.stringify(out));
  const byCat = {}; out.forEach(p=> byCat[p.cat]=(byCat[p.cat]||0)+1);
  const bySido = {}; out.forEach(p=> bySido[p.sido||'기타']=(bySido[p.sido||'기타']||0)+1);
  console.log('총 수집:', all.length, '→ 저장:', out.length);
  console.log('카테고리:', JSON.stringify(byCat));
  console.log('시도:', JSON.stringify(bySido));
}
main();
