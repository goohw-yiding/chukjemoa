// 무장애 여행 API(KorWithService2) areaBasedList2 + detailWithTour2 → data/accessible.json
// 키는 tourapi.key(gitignore)에서 읽음. 실행: node fetch-accessible.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const LIST = 'https://apis.data.go.kr/B551011/KorWithService2/areaBasedList2';
const DET  = 'https://apis.data.go.kr/B551011/KorWithService2/detailWithTour2';

const SIDO = {
  '서울특별시':'서울','부산광역시':'부산','대구광역시':'대구','인천광역시':'인천',
  '광주광역시':'광주','대전광역시':'대전','울산광역시':'울산','세종특별자치시':'세종',
  '경기도':'경기','강원특별자치도':'강원','강원도':'강원','충청북도':'충북','충청남도':'충남',
  '전라북도':'전북','전북특별자치도':'전북','전라남도':'전남','경상북도':'경북','경상남도':'경남',
  '제주특별자치도':'제주','제주도':'제주'
};
const VALID_SIDO = new Set(['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']);
function parseAddr(a){
  a=(a||'').trim(); const t=a.split(/\s+/); const first=t[0]||'', second=t[1]||'';
  let sido = SIDO[first] || first.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/,'') || '';
  const sigungu = /(시|군|구)$/.test(second) ? second : '';
  return { sido, sigungu };
}
const CAT = {'12':'관광지','14':'문화시설','15':'축제·행사','25':'여행코스','28':'레포츠','32':'숙박','38':'쇼핑','39':'음식점'};

function get(url){
  return new Promise((resolve,reject)=>{
    https.get(url,{headers:{'User-Agent':'chukjemoa'}},res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve(d));
    }).on('error',reject);
  });
}
// detailWithTour2 필드 → 접근성 배지 라벨 배열
function badges(d){
  const has = k => String(d[k]||'').trim().length>0;
  const b=[];
  if (has('wheelchair')||has('exit')||has('route')||has('publictransport')) b.push('휠체어');
  if (has('parking')) b.push('장애인주차');
  if (has('restroom')) b.push('장애인화장실');
  if (has('elevator')) b.push('엘리베이터');
  if (has('stroller')||has('lactationroom')||has('babysparechair')||has('infantsfamilyetc')) b.push('유아·수유');
  if (has('helpdog')||has('braileblock')||has('audioguide')||has('brailepromotion')||has('bigprint')) b.push('시각약자');
  if (has('signguide')||has('videoguide')||has('hearingroom')||has('hearinghandicapetc')) b.push('청각약자');
  return b;
}
async function main(){
  const rows=100; let page=1, total=Infinity, all=[];
  while ((page-1)*rows < total){
    const url = `${LIST}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=${rows}&pageNo=${page}&arrange=A`;
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
    if (page > 200) break;
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
      cat: CAT[it.contenttypeid] || '기타',
      addr: (it.addr1||'').trim(),
      sido, sigungu,
      img: it.firstimage || '',
      x: it.mapx||'', y: it.mapy||'',
      tel: (it.tel||'').trim()
    });
  }
  out.sort((a,b)=> (a.sido||'').localeCompare(b.sido||'') || (a.title||'').localeCompare(b.title||''));

  // ---- 접근성 상세 enrich (detailWithTour2) : 캐시 병합 + 부족분만, 하루한도 대비 CAP ----
  const outPath = path.join(__dirname, 'data', 'accessible.json');
  const cache = {};
  const encache = {};
  try { JSON.parse(fs.readFileSync(outPath,'utf8')).forEach(p=>{ if(Array.isArray(p.acc)) cache[p.id]=p.acc; if(p.enr) encache[p.id]=1; }); } catch(e){}
  out.forEach(p=>{ if(cache[p.id]) p.acc = cache[p.id]; if(encache[p.id]) p.enr = 1; });
  fs.writeFileSync(outPath, JSON.stringify(out)); // 목록 우선 저장(중단 대비)
  async function detail(cid){
    const u = `${DET}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${cid}`;
    // 반환값 3종: 배열=접근성 데이터 있음 / false=API 정상응답인데 데이터 없음(영구) / null=통신·파싱 오류(다음에 재시도)
    try { const j=JSON.parse(await get(u)); const it=j.response&&j.response.body&&j.response.body.items; const d=it&&it.item?(Array.isArray(it.item)?it.item[0]:it.item):null; if(!d) return false; return badges(d); } catch(e){ return null; }
  }
  // 운영계정 승인(2026-07-16) 하루 10만회 → 기본 전량(9천여건). 필요시 `set CAP=500`으로 제한 가능.
  // enr 플래그 = 조회 시도 완료(정상응답). detailWithTour2는 9,128곳 중 1,390곳만 데이터가 있어
  // 나머지 7,738곳을 매주 재조회하지 않도록 표시함. 통신오류(null)는 표시 안 해 다음 주에 재시도.
  const CAP = Number(process.env.CAP || 100000);
  const todo = out.filter(p=>!p.enr && !Array.isArray(p.acc)).slice(0, CAP);
  let got=0; const CB=8;
  for (let i=0;i<todo.length;i+=CB){
    const chunk = todo.slice(i,i+CB);
    const ds = await Promise.all(chunk.map(p=>detail(p.id)));
    ds.forEach((d,k)=>{ if(d!==null){ chunk[k].enr=1; if(d){ chunk[k].acc=d; got++; } } });
    process.stdout.write('\r상세 '+Math.min(i+CB,todo.length)+'/'+todo.length+' (신규 '+got+')');
    if ((i/CB) % 20 === 0) fs.writeFileSync(outPath, JSON.stringify(out)); // 주기적 저장
  }
  console.log('');
  fs.writeFileSync(outPath, JSON.stringify(out));
  const byCat={}; out.forEach(p=> byCat[p.cat]=(byCat[p.cat]||0)+1);
  const bySido={}; out.forEach(p=> bySido[p.sido]=(bySido[p.sido]||0)+1);
  console.log('총 수집:', all.length, '→ 저장:', out.length);
  console.log('접근성 상세 보유:', out.filter(p=>Array.isArray(p.acc)).length, '/', out.length);
  console.log('카테고리:', JSON.stringify(byCat));
  console.log('시도:', JSON.stringify(bySido));
}
main();
