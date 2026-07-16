// 축제 근처 가볼 곳(KorService2 locationBasedList2) → data/nearby.json { 축제id: [ {t,ty,d,img} ] }
// 키는 tourapi.key. 실행: node fetch-nearby.js
const fs=require('fs'), path=require('path'), https=require('https');
const KEY=fs.readFileSync(path.join(__dirname,'tourapi.key'),'utf8').trim();
const BASE='https://apis.data.go.kr/B551011/KorService2/locationBasedList2';
const TYPE={'12':'관광지','14':'문화시설','28':'레포츠','32':'숙소','39':'맛집'};
const SKIP=new Set(['15','25','38']); // 축제·코스·쇼핑 제외
function get(u){return new Promise((res,rej)=>{https.get(u,{headers:{'User-Agent':'chukjemoa'}},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));}).on('error',rej);});}
async function near(f){
  const u=`${BASE}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=15&pageNo=1&mapX=${f.x}&mapY=${f.y}&radius=6000&arrange=E`;
  try{
    const j=JSON.parse(await get(u)); const b=j.response&&j.response.body; let it=b&&b.items&&b.items.item; if(!it)return [];
    if(!Array.isArray(it))it=[it];
    const out=[];
    for(const s of it){
      if(String(s.contentid)===String(f.id))continue;
      if(SKIP.has(String(s.contenttypeid)))continue;
      if(!s.title)continue;
      out.push({ t:s.title.trim(), ty:TYPE[s.contenttypeid]||'관광지', d:Math.round((+s.dist||0)/100)/10, img:s.firstimage||'' });
      if(out.length>=5)break;
    }
    return out;
  }catch(e){ return null; }
}
async function main(){
  const fests=JSON.parse(fs.readFileSync(path.join(__dirname,'data','festivals_api.json'),'utf8'));
  const outPath=path.join(__dirname,'data','nearby.json');
  let cache={}; try{ cache=JSON.parse(fs.readFileSync(outPath,'utf8')); }catch(e){}
  const targets=fests.filter(f=>f.x&&f.y&&!(cache[f.id]&&cache[f.id].length!==undefined));
  const CAP=Number(process.env.CAP || 100000); // 운영계정 승인(2026-07-16) 하루 10만회 → 기본 전량
  const todo=targets.slice(0,CAP);
  let got=0; const CB=8;
  for(let i=0;i<todo.length;i+=CB){
    const chunk=todo.slice(i,i+CB);
    const rs=await Promise.all(chunk.map(f=>near(f)));
    rs.forEach((r,k)=>{ if(r!==null){ cache[chunk[k].id]=r; got++; } });
    process.stdout.write('\r근처 '+Math.min(i+CB,todo.length)+'/'+todo.length+' (신규 '+got+')');
    if((i/CB)%25===0) fs.writeFileSync(outPath, JSON.stringify(cache));
  }
  console.log('');
  fs.writeFileSync(outPath, JSON.stringify(cache));
  const withN=Object.values(cache).filter(v=>v&&v.length).length;
  console.log('근처정보 보유 축제:', Object.keys(cache).length, '| 실제 장소있음:', withN, '/', fests.length);
}
main();
