(function(){
const C=window.CRIME,D=window.DATA,NS="http://www.w3.org/2000/svg";
const O=C.origins,byIso=Object.fromEntries(O.map(o=>[o.iso,o]));
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const $=id=>document.getElementById(id);
function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a){if(a[k]!=null)e.setAttribute(k,a[k])}if(p)p.appendChild(e);return e}
const CR=[['ALL','All offences'],['VIOL','Violence'],['HOM','Homicide'],['SEX','Sexual'],['RAPE','Rape'],['ROB','Robbery'],['PROP','Property'],['THEFT','Theft'],['FRAUD','Fraud'],['DRUG','Drugs']];
const UKC=[['ALL','All'],['VIOL','Violence'],['SEX','Sexual'],['ROB','Robbery'],['THEFT','Theft'],['FRAUD','Fraud'],['DRUG','Drugs'],['WEAP','Weapons'],['DAM','Damage'],['ORDER','Public order'],['MISC','Misc.']];
const CN=Object.fromEntries(CR);
const HOST={DK:'Denmark',NO:'Norway',FI:'Finland',NL:'Netherlands',NL_bg:'Netherlands (background)',DE:'Germany',CH:'Switzerland',ES:'Spain',EUS:'Basque Country'};
let crime='ALL',selIso=null,drawn=false;
const isEst=o=>o.hd===0;
const fmt=v=>v>=10?v.toFixed(0):String(+v.toFixed(2));
const fx=v=>'×'+fmt(v);
const SC=PAL.scale([.25,.5,1,1.5,2,2.6,3.3,4.5,6],'low',true);
const colorOf=v=>SC.col(v);
const inkOf=v=>SC.ink(v);
const xfmt=a=>'×'+a;
const tip=$('tip');
function showTip(e,h){tip.innerHTML=h;tip.hidden=false;const w=tip.offsetWidth;let x=e.clientX+14;if(x+w>innerWidth-8)x=e.clientX-w-14;tip.style.left=x+'px';tip.style.top=(e.clientY+14)+'px'}
function hideTip(){tip.hidden=true}
// log axis
const LMIN=Math.log(.2),LMAX=Math.log(20),pos=v=>(Math.log(Math.max(.2,Math.min(20,v)))-LMIN)/(LMAX-LMIN)*100;
const TICKS=[.25,.5,1,2,4,8,16];

function crimeSeg(){
 $('c-crime').innerHTML=CR.map(c=>`<button data-k="${c[0]}"${c[0]===crime?' class="on"':''}>${c[1]}</button>`).join('');
 $('c-crime').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{crime=b.dataset.k;$('c-crime').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));drawMap();list();if(selIso)detail(byIso[selIso])}));
}
function detail(o){
 const r=o.rr[crime];
 const rows=CR.map(([k,n])=>{const v=o.rr[k];const cc=inkOf(v[0]);return `<div class="mini${k===crime?' cur':''}"><span>${n}</span><div class="track"><div class="zero" style="left:${pos(1)}%"></div><div class="ci" style="left:${pos(v[1])}%;width:${pos(v[2])-pos(v[1])}%;background:${cc}"></div><div class="pt" style="left:${pos(v[0])}%;background:${cc}"></div></div><span class="v" style="color:${cc}">${fx(v[0])}</span></div>`}).join('');
 $('c-detail').innerHTML=`<div class="row"><h3>${o.name}</h3><span class="val" style="color:${inkOf(r[0])}">${fx(r[0])}</span><span class="muted">${CN[crime].toLowerCase()} vs natives</span></div>
 <div class="muted small">95% CrI ${fx(r[1])} to ${fx(r[2])}${isEst(o)?' · modelled':''}${o.note?' · '+o.note:''}</div><div class="minis">${rows}</div>`;
}
// map
const W=D.world.w,H=D.world.h,map=$('c-map');
const VIEWS={world:[0,0,W,H-30],eu:[440,40,210,140]};
map.setAttribute('viewBox',VIEWS.world.join(' '));
const pat=el('pattern',{id:'c-hatch',width:3,height:3,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},el('defs',{},map));
el('line',{x1:0,y1:0,x2:0,y2:3,stroke:'rgba(255,255,255,.6)','stroke-width':1.2},pat);
function drawMap(){
 map.querySelectorAll('g').forEach(g=>g.remove());
 const g=el('g',{},map),gh=el('g',{'pointer-events':'none'},map);
 D.world.c.forEach(c=>{const o=byIso[c.iso];
  const p=el('path',{d:c.d,fill:o?colorOf(o.rr[crime][0]):css('--nodata')},g);
  if(!o){p.addEventListener('mousemove',e=>showTip(e,`<b>${c.name}</b><br>no data`));p.addEventListener('mouseleave',hideTip);return}
  p.classList.add('has');p.dataset.iso=c.iso;if(c.iso===selIso)p.classList.add('sel');
  if(isEst(o))el('path',{d:c.d,fill:'url(#c-hatch)'},gh);
  p.addEventListener('mousemove',e=>showTip(e,`<b>${o.name}</b> ${fx(o.rr[crime][0])}<br>${CN[crime]} vs natives${isEst(o)?'<br><i>modelled</i>':''}`));
  p.addEventListener('mouseleave',hideTip);p.addEventListener('click',()=>select(o));
 });
}
function select(o){selIso=o.iso;map.querySelectorAll('path.sel').forEach(p=>p.classList.remove('sel'));map.querySelectorAll(`path[data-iso="${o.iso}"]`).forEach(p=>p.classList.add('sel'));detail(o)}
function legend(){
 $('c-legend').innerHTML=`<div class="tscale">${SC.bar(xfmt)}</div>`+
 `<span><i style="background:repeating-linear-gradient(45deg,${SC.col(1)} 0 2px,rgba(255,255,255,.75) 2px 3.5px)"></i>modelled</span><span><i style="background:${css('--nodata')};outline:1px solid ${css('--line')}"></i>no data</span>`;
}
$('c-zoom').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
 $('c-zoom').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
 const to=VIEWS[b.dataset.view],from=map.getAttribute('viewBox').split(' ').map(Number),t0=performance.now(),dur=500,red=matchMedia('(prefers-reduced-motion: reduce)').matches;
 (function step(t){const k=red?1:Math.min(1,(t-t0)/dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;map.setAttribute('viewBox',from.map((f,i)=>f+(to[i]-f)*e).join(' '));if(k<1)requestAnimationFrame(step)})(t0);
}));
// ranking
function list(){
 const q=$('c-search').value.trim().toLowerCase(),showEst=$('c-showEst').checked||q.length>0;
 const rows=O.filter(o=>(showEst||!isEst(o))&&(!q||o.name.toLowerCase().includes(q))).sort((a,b)=>b.rr[crime][0]-a.rr[crime][0]);
 let h=`<div class="axis"><span class="small">${CN[crime]}</span><div class="t">${TICKS.map((t,i)=>`<span class="${i%2?'odd':''}" style="left:${pos(t)}%">×${t}</span>`).join('')}</div><span></span></div>`;
 h+=rows.map(o=>{const v=o.rr[crime],cc=inkOf(v[0]);
  return `<div class="li${isEst(o)?' est':''}" data-iso="${o.iso}"><span class="nm">${o.name}${isEst(o)?' <small>mod.</small>':''}</span>
  <div class="track"><div class="zero" style="left:${pos(1)}%"></div><div class="ci" style="left:${pos(v[1])}%;width:${pos(v[2])-pos(v[1])}%;background:${cc}"></div><div class="pt" style="left:${pos(v[0])}%;background:${cc}"></div></div>
  <span class="v" style="color:${cc}">${fx(v[0])}</span></div>`}).join('');
 if(!rows.length)h+='<p class="muted">No match.</p>';
 $('c-list').innerHTML=h;
 $('c-list').querySelectorAll('.li').forEach(r=>{const o=byIso[r.dataset.iso],v=o.rr[crime];
  r.addEventListener('mousemove',e=>showTip(e,`<b>${o.name}</b> ${fx(v[0])}<br>95% CrI ${fx(v[1])} to ${fx(v[2])}`));
  r.addEventListener('mouseleave',hideTip);r.addEventListener('click',()=>{select(o);$('c-detail').scrollIntoView({behavior:'smooth',block:'center'})});});
}
$('c-search').addEventListener('input',list);$('c-showEst').addEventListener('change',list);
// heatmaps
function cell(v,extra){return `<td style="background:${colorOf(v)};color:${SC.text(v)}"${extra||''}>${fmt(v)}</td>`}
function heat(){
 const all=$('c-heatAll').checked;let rows=O.filter(o=>!isEst(o)).sort((a,b)=>b.rr.ALL[0]-a.rr.ALL[0]);if(!all)rows=rows.slice(0,30);
 $('c-heat').innerHTML=`<thead><tr><th></th>${CR.map(c=>`<th>${c[1]}</th>`).join('')}</tr></thead><tbody>`+
  rows.map(o=>`<tr data-iso="${o.iso}"><th>${o.name}</th>${CR.map(([k])=>cell(o.rr[k][0],o.rr[k][3]?'':' class="inf"')).join('')}</tr>`).join('')+'</tbody>';
 $('c-heat').querySelectorAll('tbody tr').forEach(r=>r.addEventListener('click',()=>{select(byIso[r.dataset.iso]);$('c-detail').scrollIntoView({behavior:'smooth',block:'center'})}));
}
$('c-heatAll').addEventListener('change',heat);
let ukl='agg';
function uk(){
 const rows=C.uk[ukl];
 $('c-uk').innerHTML=`<thead><tr><th></th>${UKC.map(c=>`<th>${c[1]}</th>`).join('')}</tr></thead><tbody>`+
  rows.map(r=>`<tr><th>${r.g}</th>${UKC.map(([k])=>cell(r.rr[k][0])).join('')}</tr>`).join('')+'</tbody>';
}
$('c-ukLevel').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ukl=b.dataset.l;$('c-ukLevel').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));uk()}));
// method tables
function tables(){
 const B=C.beta,L=C.lam,S=C.sig,s=v=>(v>0?'+':v<0?'−':'')+Math.abs(v).toFixed(2);
 $('c-est').innerHTML=`<thead><tr><th>Parameter</th><th>Mean</th><th>89% CrI</th></tr></thead><tbody>
 <tr><td>\\(\\beta_1\\) GDP per capita (per SD)</td><td>${s(B[0][0])}</td><td>[${s(B[0][1])}, ${s(B[0][2])}]</td></tr>
 <tr><td>\\(\\beta_2\\) refugee outflow (per SD)</td><td>${s(B[1][0])}</td><td>[${s(B[1][1])}, ${s(B[1][2])}]</td></tr>
 <tr><td>\\(\\beta_3\\) EU/EEA/CH</td><td>${s(B[2][0])}</td><td>[${s(B[2][1])}, ${s(B[2][2])}]</td></tr>
 <tr><td>\\(\\sigma_\\rho\\) region / \\(\\sigma_\\eta\\) origin / \\(\\sigma_\\varepsilon\\) crime×origin</td><td>${S.region} / ${S.origin} / ${S.eps}</td><td></td></tr>
 <tr><td>\\(\\lambda_k\\): ${CR.slice(1).map(c=>c[1].toLowerCase()).join(', ')}</td><td colspan="2">${CR.slice(1).map(c=>L[c[0]].toFixed(2)).join(', ')}</td></tr></tbody>`;
 $('c-alpha').innerHTML=`<thead><tr><th>Host</th><th>\\(e^{a_h+d_{h,\\text{ALL}}}\\)</th></tr></thead><tbody>`+
  Object.entries(C.alpha).sort((a,b)=>b[1].ALL-a[1].ALL).map(([h,v])=>`<tr><td>${HOST[h]}</td><td>${v.ALL.toFixed(2)}</td></tr>`).join('')+'</tbody>';
 const T={no_DE:'Without Germany',convictions_only:'Convictions only (DK, NO, ES)',no_groups:'Without regional groups (FI, ES, Basque Country)'};
 $('c-sens').innerHTML='<thead><tr><th>Test</th><th>ρ</th></tr></thead><tbody>'+Object.entries(C.sens).map(([k,v])=>`<tr><td>${T[k]}</td><td>${v.toFixed(2)}</td></tr>`).join('')+'</tbody>';
}
function all(){document.querySelectorAll('#tab-crime .scale').forEach(b=>b.innerHTML=`<div class="tscale big">${SC.bar(xfmt)}</div><div class="scale-labels"><span>below natives</span><span>above natives</span></div>`);crimeSeg();drawMap();legend();list();heat();uk()}
function show(){if(!drawn){all();select(byIso['MAR']);drawn=true}}
tables();
// tabs
function route(){const t=location.hash==='#crime'?'crime':'fiscal';
 document.querySelectorAll('.tabs a').forEach(a=>{a.classList.toggle('on',a.dataset.tab===t);a.setAttribute('aria-selected',a.dataset.tab===t)});
 $('tab-fiscal').hidden=t!=='fiscal';$('tab-crime').hidden=t!=='crime';
 if(t==='crime')show();else dispatchEvent(new Event('resize'));}
addEventListener('hashchange',()=>{route();scrollTo(0,0)});route();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(drawn){all();if(selIso)select(byIso[selIso])}});
})();
