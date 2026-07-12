// 공휴일 특일정보(SpcdeInfoService/getRestDeInfo) → data/holidays.json
// 올해~내년 공휴일 수집. 실행: node fetch-holidays.js
const fs=require('fs'), path=require('path'), https=require('https');
const KEY=fs.readFileSync(path.join(__dirname,'tourapi.key'),'utf8').trim();
const BASE='https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';
function get(u){return new Promise((res,rej)=>{https.get(u,{headers:{'User-Agent':'chukjemoa'}},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));}).on('error',rej);});}
async function year(y){
  const out=[];
  for(let m=1;m<=12;m++){
    const mm=String(m).padStart(2,'0');
    const u=`${BASE}?serviceKey=${KEY}&solYear=${y}&solMonth=${mm}&_type=json&numOfRows=30`;
    let t; try{t=await get(u);}catch(e){console.error('req err',y,mm,e.message);continue;}
    let j; try{j=JSON.parse(t);}catch(e){console.error('parse err',y,mm,t.slice(0,120));continue;}
    const b=j.response&&j.response.body; if(!b)continue;
    let it=b.items&&b.items.item; if(!it)continue; if(!Array.isArray(it))it=[it];
    it.forEach(x=>{ if(x.isHoliday==='Y'){ const d=String(x.locdate); out.push({ date:d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6,8), name:x.dateName }); } });
  }
  return out;
}
async function main(){
  const thisY=new Date().getFullYear();
  let all=[];
  for(const y of [thisY, thisY+1]){ all=all.concat(await year(y)); }
  // 중복 제거·정렬
  const seen=new Set(), uniq=[];
  all.sort((a,b)=>a.date.localeCompare(b.date));
  for(const h of all){ if(!seen.has(h.date)){ seen.add(h.date); uniq.push(h); } }
  fs.writeFileSync(path.join(__dirname,'data','holidays.json'), JSON.stringify(uniq));
  console.log('공휴일 저장:', uniq.length, '일 (', thisY, '~', thisY+1, ')');
  console.log(uniq.map(h=>h.date+' '+h.name).join(' | '));
}
main();
