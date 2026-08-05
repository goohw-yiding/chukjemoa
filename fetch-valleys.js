// 계곡명소 API(KorService2 areaBasedList2, cat3=A01010900 계곡) + detailCommon2(개요) → data/valleys.json
// 키는 tourapi.key(gitignore)에서 읽음. 실행: node fetch-valleys.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const LIST = 'https://apis.data.go.kr/B551011/KorService2/areaBasedList2';
const DET  = 'https://apis.data.go.kr/B551011/KorService2/detailCommon2';

const SIDO = {
  '서울특별시':'서울','부산광역시':'부산','대구광역시':'대구','인천광역시':'인천',
  '광주광역시':'광주','대전광역시':'대전','울산광역시':'울산','세종특별자치시':'세종',
  '경기도':'경기','강원특별자치도':'강원','강원도':'강원','충청북도':'충북','충청남도':'충남',
  '전라북도':'전북','전북특별자치도':'전북','전라남도':'전남','경상북도':'경북','경상남도':'경남',
  '제주특별자치도':'제주','제주도':'제주',
  // TourAPI가 광주/전남을 붙여 쓰는 변칙 표기 방어
  '전남광주통합특별시':'광주'
};
const VALID_SIDO = new Set(['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']);
function parseAddr(a){
  a=(a||'').trim(); const t=a.split(/\s+/); const first=t[0]||'', second=t[1]||'';
  let sido = SIDO[first] || first.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/,'') || '';
  const sigungu = /(시|군|구)$/.test(second) ? second : '';
  return { sido, sigungu };
}
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
  const cache = {};
  try { JSON.parse(fs.readFileSync(outPath,'utf8')).forEach(p=>{ if(p.ov) cache[p.id]=p.ov; }); } catch(e){}
  out.forEach(p=>{ if(cache[p.id]) p.ov = cache[p.id]; });
  fs.writeFileSync(outPath, JSON.stringify(out)); // 목록 우선 저장
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
    process.stdout.write('\r개요 '+Math.min(i+CB,todo.length)+'/'+todo.length+' (신규 '+got+')');
    if ((i/CB) % 10 === 0) fs.writeFileSync(outPath, JSON.stringify(out));
  }
  console.log('');
  fs.writeFileSync(outPath, JSON.stringify(out));
  const bySido={}; out.forEach(p=> bySido[p.sido]=(bySido[p.sido]||0)+1);
  console.log('총 수집:', all.length, '→ 저장:', out.length);
  console.log('개요 보유:', out.filter(p=>p.ov).length, '/', out.length);
  console.log('시도별:', JSON.stringify(bySido));
}
main();
