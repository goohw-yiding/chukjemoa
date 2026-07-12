// 시도별 방문자수(DataLabService/metcoRegnVisitrDDList) → data/visitors.json
// 최근 가용 구간의 '외지인+외국인' 방문자를 시도별 합산해 인기 랭킹 생성. 실행: node fetch-visitors.js
const fs=require('fs'), path=require('path'), https=require('https');
const KEY=fs.readFileSync(path.join(__dirname,'tourapi.key'),'utf8').trim();
const BASE='https://apis.data.go.kr/B551011/DataLabService/metcoRegnVisitrDDList';
function get(u){return new Promise((res,rej)=>{https.get(u,{headers:{'User-Agent':'chukjemoa'}},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));}).on('error',rej);});}
function ymd(d){return d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');}
function shortNm(n){return (n||'').replace(/(특별자치시|특별자치도|특별시|광역시|자치도|도)$/,'').replace('충청','충').replace('전라','전').replace('경상','경').replace('라북','북').replace('라남','남');}
async function main(){
  const end=new Date(); const start=new Date(); start.setDate(start.getDate()-90);
  const agg={}, dates=new Set();
  let page=1, total=Infinity;
  while((page-1)*1000<total){
    const u=`${BASE}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1000&pageNo=${page}&startYmd=${ymd(start)}&endYmd=${ymd(end)}`;
    let j; try{ j=JSON.parse(await get(u)); }catch(e){ console.error('parse err p'+page); break; }
    const b=j.response&&j.response.body; if(!b){ console.error('no body p'+page); break; }
    total=Number(b.totalCount)||0; let it=b.items&&b.items.item; if(!it)break; if(!Array.isArray(it))it=[it];
    for(const r of it){
      dates.add(r.baseYmd);
      if(String(r.touDivCd)==='1')continue; // 현지인 제외 → 외지인+외국인만
      const key=r.areaCode; const nm=shortNm(r.areaNm);
      if(!agg[key])agg[key]={name:nm, num:0};
      agg[key].num += Math.round(+r.touNum||0);
    }
    process.stdout.write('\rpage '+page+'/'+Math.ceil(total/1000)+' (rows '+total+')');
    if(it.length<1000)break; page++; if(page>10)break;
  }
  console.log('');
  const ranked=Object.values(agg).sort((a,b)=>b.num-a.num).map((r,i)=>({rank:i+1,name:r.name,num:r.num}));
  const ds=[...dates].sort();
  const out={ updated:ds.length?ds[0]+'~'+ds[ds.length-1]:'', ranked };
  fs.writeFileSync(path.join(__dirname,'data','visitors.json'), JSON.stringify(out));
  console.log('방문자 랭킹 저장:', ranked.length, '개 시도 | 기간', out.updated);
  console.log(ranked.slice(0,8).map(r=>r.rank+'.'+r.name+'('+(r.num/10000).toFixed(0)+'만)').join('  '));
}
main();
