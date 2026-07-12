// 영문 축제(EngService2 searchFestival2 + detailCommon2) → data/festivals_en.json
const fs=require('fs'), path=require('path'), https=require('https');
const KEY=fs.readFileSync(path.join(__dirname,'tourapi.key'),'utf8').trim();
const BASE='https://apis.data.go.kr/B551011/EngService2';
const RMAP={'11':'Seoul','26':'Busan','27':'Daegu','28':'Incheon','29':'Gwangju','30':'Daejeon','31':'Ulsan','36':'Sejong','41':'Gyeonggi','43':'Chungbuk','44':'Chungnam','46':'Jeonnam','47':'Gyeongbuk','48':'Gyeongnam','50':'Jeju','51':'Gangwon','52':'Jeonbuk'};
function get(u){return new Promise((res,rej)=>{https.get(u,{headers:{'User-Agent':'chukjemoa'}},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));}).on('error',rej);});}
function ymd(d){return d.toISOString().slice(0,10).replace(/-/g,'');}
function cleanEn(t){ t=(t||'').trim(); const i=t.indexOf('('); if(i>0 && /[가-힣]/.test(t.slice(i))) return t.slice(0,i).trim(); return t; }
function hpUrl(s){ if(!s) return ''; const m=String(s).match(/href=["']?([^"'\s>]+)/i); return m?m[1]:''; }

async function main(){
  const start=new Date(new Date().getFullYear()-1,0,1);
  const esd=ymd(start); const rows=100; let page=1,total=Infinity,all=[];
  while((page-1)*rows<total){
    const url=`${BASE}/searchFestival2?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=${rows}&pageNo=${page}&eventStartDate=${esd}&arrange=A`;
    let txt; try{txt=await get(url);}catch(e){console.error('req err',e.message);break;}
    let j; try{j=JSON.parse(txt);}catch(e){console.error('parse err',txt.slice(0,120));break;}
    const b=j.response&&j.response.body; if(!b){console.error('no body',txt.slice(0,120));break;}
    total=Number(b.totalCount)||0; let items=b.items&&b.items.item; if(!items)break; if(!Array.isArray(items))items=[items];
    all.push(...items); process.stdout.write(`\rpage ${page}/${Math.ceil(total/rows)} (${all.length}/${total})`);
    if(items.length<rows)break; page++; if(page>60)break;
  }
  console.log('');
  const seen=new Set(), out=[];
  for(const it of all){
    if(!it.contentid||seen.has(it.contentid))continue; seen.add(it.contentid);
    if(!it.title||!it.eventenddate)continue;
    out.push({ id:it.contentid, title:cleanEn(it.title), start:it.eventstartdate, end:it.eventenddate,
      addr:(it.addr1||'').trim(), region:RMAP[it.lDongRegnCd]||'', img:it.firstimage||'', x:it.mapx||'', y:it.mapy||'', tel:(it.tel||'').trim() });
  }
  out.sort((a,b)=>(a.end||'').localeCompare(b.end||''));
  // overview enrich (EngService2/detailCommon2), 캐시+부족분, CAP
  const fpath=path.join(__dirname,'data','festivals_en.json'); const cache={};
  try{JSON.parse(fs.readFileSync(fpath,'utf8')).forEach(f=>{if(f.ov||f.hp)cache[f.id]={ov:f.ov||'',hp:f.hp||''};});}catch(e){}
  out.forEach(f=>{const c=cache[f.id];if(c){if(c.ov)f.ov=c.ov;if(c.hp)f.hp=c.hp;}});
  async function common(cid){const u=`${BASE}/detailCommon2?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${cid}`;try{const j=JSON.parse(await get(u));const it=j.response&&j.response.body&&j.response.body.items;const d=it&&it.item?(Array.isArray(it.item)?it.item[0]:it.item):null;if(!d)return null;return{ov:(d.overview||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s{2,}/g,' ').trim().slice(0,600),hp:hpUrl(d.homepage)};}catch(e){return null;}}
  const need=out.filter(f=>!(f.ov||f.hp)).slice(0,600); let en=0;
  for(let i=0;i<need.length;i+=10){const ch=need.slice(i,i+10);const ds=await Promise.all(ch.map(f=>common(f.id)));ds.forEach((d,k)=>{if(d){if(d.ov){ch[k].ov=d.ov;en++;}if(d.hp)ch[k].hp=d.hp;}});process.stdout.write('\roverview '+Math.min(i+10,need.length)+'/'+need.length);}
  console.log('');
  fs.writeFileSync(fpath, JSON.stringify(out));
  const byr={}; out.forEach(f=>byr[f.region||'-']=(byr[f.region||'-']||0)+1);
  console.log('영문 축제 저장:', out.length, '| 개요:', out.filter(f=>f.ov).length, '| 지역:', JSON.stringify(byr));
}
main();
