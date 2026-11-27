// Fiscal + crime tab: net contribution per person per year vs natives.
(function(){
const D=window.DATA,C=window.CRIME,NS="http://www.w3.org/2000/svg";
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const $=id=>document.getElementById(id);
function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a){if(a[k]!=null)e.setAttribute(k,a[k])}if(p)p.appendChild(e);return e}
const EST='regional aggregate / covariates only';
const USD=D.avg_usd/100; // US$ per 1% of host GDP per capita

// Cost of crime per head of population, % of GDP per head. England and Wales 2019/20,
// Home Office unit costs (Table 3) x crime volumes incl. unreported (Table 4); population 59.44m, GDP per head £33,400.
// all = anticipation + consequence + response; pub = police + criminal justice + health + victim services.
const K=[
 ['VIOL','Violence','Violence with and without injury',.9611,.2071],
 ['HOM','Homicide','Homicide',.1135,.0219],
 ['RAPE','Rape','Rape',.3967,.0836],
 ['SEX','Other sexual','Other sexual offences',.6197,.1156],
 ['ROB','Robbery','Personal and commercial robbery',.4288,.0814],
 ['PROP','Burglary, damage','Domestic and commercial burglary, criminal damage',.5178,.0929],
 ['THEFT','Theft','Vehicle, personal and commercial theft',.4733,.0702],
 ['FRAUD','Fraud','Fraud and cybercrime against individuals',.4033,.0540]
];
const st={basis:'all',w:1,unit:'usd',on:Object.fromEntries(K.map(k=>[k[0],true])),sort:['N',-1],sel:null,regSort:['N',-1]};

// origins in both models
const cBy=Object.fromEntries(C.origins.map(o=>[o.iso,o]));
const O=D.origins.filter(o=>cBy[o.iso]).map(f=>{const c=cBy[f.iso];return{iso:f.iso,name:f.name.replace(' (unspecified)',''),f,c,reg:c.reg,mig:f.mig,est:f.ev===EST||c.hd===0}});
const byIso=Object.fromEntries(O.map(o=>[o.iso,o]));
const REG={EU_EFTA_UK:'EU, EFTA, UK',EUR_OTH:'Other Europe',MENA:'Middle East, N. Africa',SSA:'Sub-Saharan Africa',ASIA_OTH:'Asia',LATAM:'Latin America',NA_OCE:'N. America, Oceania'};

// Monte Carlo: fiscal ~ Normal from 90% CrI; log RR_k ~ Normal from 95% CrI, correlation 0.8 across crime types within an origin; fiscal independent of crime.
const ND=2000;let seed=12345;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return (seed+.5)/4294967296};
const gauss=()=>{const u=rnd(),v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
const RHO=.8,a=Math.sqrt(RHO),b=Math.sqrt(1-RHO);
O.forEach(o=>{
 const sdF=(o.f.hi-o.f.lo)/(2*1.645);o.fd=new Float64Array(ND);
 const z0=new Float64Array(ND);for(let d=0;d<ND;d++){o.fd[d]=o.f.mean+sdF*gauss();z0[d]=gauss()}
 o.rd={};K.forEach(([k])=>{const r=o.c.rr[k],mu=Math.log(r[0]),sd=(Math.log(r[2])-Math.log(r[1]))/(2*1.96),x=new Float64Array(ND);
  for(let d=0;d<ND;d++)x[d]=Math.exp(mu+sd*(a*z0[d]+b*gauss()));o.rd[k]=x});
});
const q=(arr,p)=>{const s=Array.from(arr).sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(p*s.length))]};
const mean=arr=>{let s=0;for(const v of arr)s+=v;return s/arr.length};
function compute(){
 const wt=Object.fromEntries(K.map(([k,,,all,pub])=>[k,st.on[k]?(st.basis==='all'?all:pub)*st.w:0]));
 O.forEach(o=>{
  const cr=new Float64Array(ND),nt=new Float64Array(ND),by={};
  K.forEach(([k])=>{const x=o.rd[k],w=wt[k];let s=0;for(let d=0;d<ND;d++){const v=-w*(x[d]-1);cr[d]+=v;s+=v}by[k]=s/ND});
  for(let d=0;d<ND;d++)nt[d]=o.fd[d]+cr[d];
  o.F=o.f.mean;o.Cr=mean(cr);o.N=mean(nt);o.Nlo=q(nt,.05);o.Nhi=q(nt,.95);o.Clo=q(cr,.05);o.Chi=q(cr,.95);o.by=by;
  let neg=0;for(let d=0;d<ND;d++)if(nt[d]<0)neg++;o.pneg=neg/ND;
 });
}

// formatting
const U=v=>st.unit==='usd'?v*USD:v;
const sgn=v=>(v>0?'+':v<0?'−':'');
function fmt(v){v=U(v);if(st.unit==='usd'){const r=Math.round(Math.abs(v)/100)*100;return (r===0?'':sgn(v))+'$'+r.toLocaleString('en-US')}const r=Math.abs(v)<10?Math.abs(v).toFixed(1):Math.abs(v).toFixed(0);return (+r===0?'':sgn(v))+r+'%'}
function fmtTot(v,m){if(m==null)return '–';const x=v*USD*m/1e6;return sgn(x)+'$'+Math.abs(x).toLocaleString('en-US',{maximumFractionDigits:Math.abs(x)<10?1:0})+'m'}
const unitLab=()=>st.unit==='usd'?'US$ per person per year':'% of host GDP per capita';

// colours: the fiscal tab's binned scale, on % of host GDP per capita
const BINS=[[-Infinity,-20,'--r3','below −20%'],[-20,-10,'--r2','−20 to −10%'],[-10,-3,'--r1','−10 to −3%'],[-3,3,'--z','±3%'],[3,10,'--b1','+3 to +10%'],[10,20,'--b2','+10 to +20%'],[20,Infinity,'--b3','above +20%']];
const colorOf=v=>css(BINS.find(b=>v>=b[0]&&v<b[1])[2]);
const inkOf=v=>v<0?css('--neg'):css('--pos');

const tip=$('tip');
function showTip(e,h){tip.innerHTML=h;tip.hidden=false;const w=tip.offsetWidth;let x=e.clientX+14;if(x+w>innerWidth-8)x=e.clientX-w-14;tip.style.left=x+'px';tip.style.top=(e.clientY+14)+'px'}
function hideTip(){tip.hidden=true}

// controls
function seg(id,key,parse){$(id).querySelectorAll('button').forEach(bt=>bt.addEventListener('click',()=>{st[key]=parse?parse(bt.dataset.v):bt.dataset.v;$(id).querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===bt));if(key!=='unit')compute();render()}))}
seg('n-basis','basis');seg('n-w','w',Number);seg('n-unit','unit');

// map
const W=D.world.w,H=D.world.h,map=$('n-map');
const VIEWS={world:[0,0,W,H-30],eu:[440,40,210,140]};
map.setAttribute('viewBox',VIEWS.world.join(' '));
const pat=el('pattern',{id:'n-hatch',width:3,height:3,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},el('defs',{},map));
el('line',{x1:0,y1:0,x2:0,y2:3,stroke:'rgba(255,255,255,.6)','stroke-width':1.2},pat);
function drawMap(){
 map.querySelectorAll('g').forEach(g=>g.remove());
 const g=el('g',{},map),gh=el('g',{'pointer-events':'none'},map);
 D.world.c.forEach(c=>{const o=byIso[c.iso];
  const p=el('path',{d:c.d,fill:o?colorOf(o.N):css('--nodata')},g);
  if(!o){p.addEventListener('mousemove',e=>showTip(e,`<b>${c.name}</b><br>no data`));p.addEventListener('mouseleave',hideTip);return}
  p.classList.add('has');p.dataset.iso=c.iso;if(c.iso===st.sel)p.classList.add('sel');
  if(o.est)el('path',{d:c.d,fill:'url(#n-hatch)'},gh);
  p.addEventListener('mousemove',e=>showTip(e,`<b>${o.name}</b> ${fmt(o.N)}<br>fiscal ${fmt(o.F)} · crime ${fmt(o.Cr)}${o.est?'<br><i>modelled</i>':''}`));
  p.addEventListener('mouseleave',hideTip);p.addEventListener('click',()=>select(o));
 });
}
function legend(){
 $('n-legend').innerHTML=BINS.map(b=>`<span><i style="background:${css(b[2])}"></i>${b[3]}</span>`).join('')+
 `<span><i style="background:repeating-linear-gradient(45deg,${css('--b2')} 0 2px,rgba(255,255,255,.75) 2px 3.5px)"></i>modelled</span><span><i style="background:${css('--nodata')};outline:1px solid ${css('--line')}"></i>no data</span>`+
 `<span class="muted">10% ≈ $${(Math.round(10*USD/100)*100).toLocaleString('en-US')}</span>`;
}
$('n-zoom').querySelectorAll('button').forEach(bt=>bt.addEventListener('click',()=>{
 $('n-zoom').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===bt));
 const to=VIEWS[bt.dataset.view],from=map.getAttribute('viewBox').split(' ').map(Number),t0=performance.now(),dur=500,red=matchMedia('(prefers-reduced-motion: reduce)').matches;
 (function step(t){const k=red?1:Math.min(1,(t-t0)/dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;map.setAttribute('viewBox',from.map((f,i)=>f+(to[i]-f)*e).join(' '));if(k<1)requestAnimationFrame(step)})(t0);
}));

// detail: waterfall fiscal -> crime types -> net
function select(o){st.sel=o.iso;map.querySelectorAll('path.sel').forEach(p=>p.classList.remove('sel'));map.querySelectorAll(`path[data-iso="${o.iso}"]`).forEach(p=>p.classList.add('sel'));detail(o)}
function detail(o){
 const steps=[['Fiscal',0,o.F,'f']];let cum=o.F;
 K.forEach(([k,n])=>{if(!st.on[k])return;const v=o.by[k];steps.push([n,cum,cum+v,'c']);cum+=v});
 steps.push(['Net',0,o.N,'n']);
 const vals=steps.flatMap(s=>[s[1],s[2]]).concat([0]);let lo=Math.min(...vals),hi=Math.max(...vals);const pad=(hi-lo)*.06||1;lo-=pad;hi+=pad;
 const P=v=>(v-lo)/(hi-lo)*100;
 const rows=steps.map(([n,x0,x1,t])=>{const l=Math.min(P(x0),P(x1)),w=Math.max(.6,Math.abs(P(x1)-P(x0))),d=x1-x0;
  const col=t==='n'?colorOf(o.N):t==='f'?colorOf(o.F):(d<0?css('--r2'):css('--b2'));
  return `<div class="wf${t==='n'?' tot':''}"><span>${n}</span><div class="wtrack"><div class="zero" style="left:${P(0)}%"></div><b style="left:${l}%;width:${w}%;background:${col}"></b></div><span class="v" style="color:${inkOf(d)}">${fmt(d)}</span></div>`}).join('');
 $('n-detail').innerHTML=`<div class="row"><h3>${o.name}</h3><span class="val" style="color:${inkOf(o.N)}">${fmt(o.N)}</span><span class="muted">${unitLab()}, net vs natives</span></div>
 <div class="muted small">90% CrI ${fmt(o.Nlo)} to ${fmt(o.Nhi)} · P(net &lt; 0) ${Math.round(o.pneg*100)}%${o.est?' · modelled':''}</div><div class="wfs">${rows}</div>`;
}

// dumbbell: fiscal (ring) -> net (dot), 90% CrI on net
function nice(lo,hi){const span=hi-lo,step=[1,2,5,10,20,25,50].map(x=>x*Math.pow(10,Math.floor(Math.log10(span/5)))).find(s=>span/s<=6);const t=[];for(let v=Math.ceil(lo/step)*step;v<=hi;v+=step)t.push(+v.toFixed(6));return t}
function list(){
 const qs=$('n-search').value.trim().toLowerCase(),showEst=$('n-showEst').checked||qs.length>0;
 const rows=O.filter(o=>(showEst||!o.est)&&(!qs||o.name.toLowerCase().includes(qs))).sort((x,y)=>y.N-x.N);
 const lo=U(Math.min(...O.map(o=>Math.min(o.Nlo,o.F)))),hi=U(Math.max(...O.map(o=>Math.max(o.Nhi,o.F))));
 const ticks=nice(lo,hi),stp=ticks[1]-ticks[0],L=Math.floor(lo/stp)*stp,R=Math.ceil(hi/stp)*stp,pos=v=>(Math.max(L,Math.min(R,U(v)))-L)/(R-L)*100,tpos=t=>(t-L)/(R-L)*100;
 const tl=t=>(t>0?'+':t<0?'−':'')+(st.unit==='usd'?'$'+(Math.abs(t)>=1000?Math.abs(t)/1000+'k':Math.abs(t)):Math.abs(t)+'%');
 let h=`<div class="axis"><span class="small">${st.unit==='usd'?'US$':'% GDP pc'}</span><div class="t">${ticks.map((t,i)=>`<span class="${i%2?'odd':''}" style="left:${tpos(t)}%">${tl(t)}</span>`).join('')}</div><span></span></div>`;
 h+=rows.map(o=>{const cc=inkOf(o.N),l=Math.min(pos(o.F),pos(o.N)),w=Math.abs(pos(o.F)-pos(o.N));
  return `<div class="li${o.est?' est':''}" data-iso="${o.iso}"><span class="nm">${o.name}${o.est?' <small>mod.</small>':''}</span>
  <div class="track"><div class="zero" style="left:${pos(0)}%"></div><div class="ci" style="left:${pos(o.Nlo)}%;width:${pos(o.Nhi)-pos(o.Nlo)}%;background:${cc}"></div><div class="link" style="left:${l}%;width:${w}%"></div><div class="ring" style="left:${pos(o.F)}%"></div><div class="pt" style="left:${pos(o.N)}%;background:${cc}"></div></div>
  <span class="v" style="color:${cc}">${fmt(o.N)}</span></div>`}).join('');
 if(!rows.length)h+='<p class="muted">No match.</p>';
 $('n-list').innerHTML=h;
 $('n-list').querySelectorAll('.li').forEach(r=>{const o=byIso[r.dataset.iso];
  r.addEventListener('mousemove',e=>showTip(e,`<b>${o.name}</b><br>fiscal ${fmt(o.F)}<br>crime ${fmt(o.Cr)}<br>net ${fmt(o.N)} (90% CrI ${fmt(o.Nlo)} to ${fmt(o.Nhi)})`));
  r.addEventListener('mouseleave',hideTip);r.addEventListener('click',()=>{select(o);$('n-detail').scrollIntoView({behavior:'smooth',block:'center'})});});
}
$('n-search').addEventListener('input',list);$('n-showEst').addEventListener('change',list);

// sortable table
const COLS=[['name','Origin',o=>o.name],['F','Fiscal',o=>o.F],['Cr','Crime',o=>o.Cr],['N','Net',o=>o.N],['ci','90% CrI',o=>o.Nlo],['share','Crime share',o=>shareOf(o)],['mig','Immigrants',o=>o.mig??-1],['tot','Total, 4 hosts (US$/yr)',o=>o.mig==null?-Infinity:o.N*o.mig]];
const shareOf=o=>Math.abs(o.Cr)/(Math.abs(o.F)+Math.abs(o.Cr)||1);
function table(){
 const qs=$('n-tsearch').value.trim().toLowerCase();
 const [sk,sd]=st.sort,col=COLS.find(c=>c[0]===sk);
 const rows=O.filter(o=>!qs||o.name.toLowerCase().includes(qs)).sort((x,y)=>{const a=col[2](x),b=col[2](y);return typeof a==='string'?sd*a.localeCompare(b):sd*(a-b)});
 $('n-table').innerHTML=`<thead><tr>${COLS.map(([k,n])=>`<th data-k="${k}" class="${k===sk?(sd>0?'asc':'desc'):''}">${n}</th>`).join('')}</tr></thead><tbody>`+
  rows.map(o=>`<tr data-iso="${o.iso}"><td>${o.name}${o.est?' <small class="muted">mod.</small>':''}</td><td style="color:${inkOf(o.F)}">${fmt(o.F)}</td><td style="color:${inkOf(o.Cr)}">${fmt(o.Cr)}</td><td><span class="chip" style="background:${colorOf(o.N)}"></span><b style="color:${inkOf(o.N)}">${fmt(o.N)}</b></td><td class="muted">${fmt(o.Nlo)} to ${fmt(o.Nhi)}</td><td>${Math.round(shareOf(o)*100)}%</td><td>${o.mig==null?'–':o.mig.toLocaleString('en-US')}</td><td style="color:${inkOf(o.N)}">${fmtTot(o.N,o.mig)}</td></tr>`).join('')+'</tbody>';
 $('n-table').querySelectorAll('th').forEach(th=>th.addEventListener('click',()=>{const k=th.dataset.k;st.sort=[k,st.sort[0]===k?-st.sort[1]:(k==='name'?1:-1)];table()}));
 $('n-table').querySelectorAll('tbody tr').forEach(r=>r.addEventListener('click',()=>{select(byIso[r.dataset.iso]);$('n-detail').scrollIntoView({behavior:'smooth',block:'center'})}));
}
$('n-tsearch').addEventListener('input',table);

// regions, weighted by immigrant stock
function regions(){
 const g={};O.forEach(o=>{if(o.mig==null)return;const r=g[o.reg]||(g[o.reg]={n:0,m:0,F:0,Cr:0,N:0});r.n++;r.m+=o.mig;r.F+=o.F*o.mig;r.Cr+=o.Cr*o.mig;r.N+=o.N*o.mig});
 const all={n:0,m:0,F:0,Cr:0,N:0};Object.values(g).forEach(r=>{for(const k in all)all[k]+=r[k]});
 const rows=Object.entries(g).map(([k,r])=>({name:REG[k],...r}));
 const [sk,sd]=st.regSort;const rv=r=>sk==='m'?r.m:sk==='n'?r.n:sk==='tot'?r.N:r[sk]/r.m;rows.sort((x,y)=>sk==='name'?sd*x.name.localeCompare(y.name):sd*(rv(x)-rv(y)));
 const tr=(r,cls)=>`<tr class="${cls||''}"><td>${r.name}</td><td>${r.n}</td><td>${r.m.toLocaleString('en-US')}</td><td style="color:${inkOf(r.F)}">${fmt(r.F/r.m)}</td><td style="color:${inkOf(r.Cr)}">${fmt(r.Cr/r.m)}</td><td><span class="chip" style="background:${colorOf(r.N/r.m)}"></span><b style="color:${inkOf(r.N)}">${fmt(r.N/r.m)}</b></td><td style="color:${inkOf(r.N)}">${fmtTot(r.N/r.m,r.m)}</td></tr>`;
 const H=[['name','Region'],['n','Origins'],['m','Immigrants'],['F','Fiscal'],['Cr','Crime'],['N','Net'],['tot','Total, 4 hosts (US$/yr)']];
 $('n-reg').innerHTML=`<thead><tr>${H.map(([k,n])=>`<th data-k="${k}" class="${k===sk?(sd>0?'asc':'desc'):''}">${n}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>tr(r)).join('')}${tr({name:'All',...all},'sum')}</tbody>`;
 $('n-reg').querySelectorAll('th').forEach(th=>th.addEventListener('click',()=>{const k=th.dataset.k;st.regSort=[k,st.regSort[0]===k?-st.regSort[1]:(k==='name'?1:-1)];regions()}));
}

// crime cost weights (toggle per type)
function weights(){
 const v=x=>st.unit==='usd'?'$'+(Math.round(x*USD/10)*10).toLocaleString('en-US'):x.toFixed(2)+'%';
 const sum=K.reduce((s,k)=>s+(st.on[k[0]]?(st.basis==='all'?k[3]:k[4]):0),0)*st.w;
 $('n-wt').innerHTML=`<thead><tr><th></th><th>Crime type</th><th>Includes</th><th>All social costs</th><th>Public spending</th></tr></thead><tbody>`+
  K.map(([k,n,inc,all,pub])=>`<tr class="${st.on[k]?'':'off'}"><td><input type="checkbox" data-k="${k}"${st.on[k]?' checked':''} aria-label="Include ${n}"></td><td>${n}</td><td class="muted">${inc}</td><td class="${st.basis==='all'?'cur':''}">${v(all*st.w)}</td><td class="${st.basis==='pub'?'cur':''}">${v(pub*st.w)}</td></tr>`).join('')+
  `<tr class="sum"><td></td><td>Used</td><td class="muted">${st.basis==='all'?'all social costs':'public spending'}${st.w!==1?', ×'+st.w:''}</td><td colspan="2">${v(sum)} per head per year</td></tr></tbody>`;
 $('n-wt').querySelectorAll('input').forEach(i=>i.addEventListener('change',()=>{st.on[i.dataset.k]=i.checked;compute();render()}));
}

function render(){drawMap();legend();list();table();regions();weights();if(st.sel)detail(byIso[st.sel]);
 document.querySelectorAll('.n-unitlab').forEach(e=>e.textContent=unitLab())}
let drawn=false;
window.NETTAB={show(){if(!drawn){compute();render();select(byIso['MAR']);drawn=true}}};
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(drawn)render()});
})();
