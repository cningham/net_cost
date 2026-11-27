(function(){
const D=window.DATA,NS="http://www.w3.org/2000/svg";
const O=D.origins, byIso=Object.fromEntries(O.map(o=>[o.iso,o]));
const EST='regional aggregate / covariates only';
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const $=id=>document.getElementById(id);
function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a){if(a[k]!=null)e.setAttribute(k,a[k])}if(p)p.appendChild(e);return e}
const sgn=v=>(v>0?'+':v<0?'−':'')+Math.abs(v).toFixed(Math.abs(v)<10?1:0)+'%';
const money=v=>(v<0?'−':'+')+'US$'+Math.abs(Math.round(v/100)*100).toLocaleString('en-US');
$('usd10').textContent=(Math.round(D.avg_usd*0.1/100)*100).toLocaleString('en-US');
const HOST={DNK:'Denmark',SWE:'Sweden',FIN:'Finland',NLD:'Netherlands'};

// binned diverging colour, equal arms (3 red, neutral, 3 blue)
const BINS=[[-Infinity,-20,'--r3','below −20%'],[-20,-10,'--r2','−20 to −10%'],[-10,-3,'--r1','−10 to −3%'],[-3,3,'--z','±3% (like natives)'],[3,10,'--b1','+3 to +10%'],[10,20,'--b2','+10 to +20%'],[20,Infinity,'--b3','above +20%']];
const colorOf=v=>css(BINS.find(b=>v>=b[0]&&v<b[1])[2]);
const inkOf=v=>v<0?css('--neg'):css('--pos');
const tip=$('tip');
function showTip(e,html){tip.innerHTML=html;tip.hidden=false;const w=tip.offsetWidth;let x=e.clientX+14;if(x+w>innerWidth-8)x=e.clientX-w-14;tip.style.left=x+'px';tip.style.top=(e.clientY+14)+'px'}
function hideTip(){tip.hidden=true}
function detail(o){
 const est=o.ev===EST;
 const who=est?'<b>Estimated:</b> not reported on its own by any of the four countries, so it is inferred from regional data, origin income and refugee history.'
   :'Measured by '+o.hosts.split(',').map(h=>HOST[h]).join(', ')+(o.ev==='multi-host'?'':' (one study only)')+'.';
 $('detail').innerHTML=`<div class="row"><h3>${o.name.replace(' (unspecified)','')}</h3><span class="val" style="color:${inkOf(o.mean)}">${sgn(o.mean)}</span><span class="muted">≈ ${money(o.usd)} per person per year compared with a native</span></div>
 <div class="muted small">Likely range ${sgn(o.lo)} to ${sgn(o.hi)} · rank ${o.rk} of ${O.length} · ${who}</div>`;
}

// ---------- MAP ----------
const W=D.world.w,H=D.world.h,map=$('map');
const VIEWS={world:[0,0,W,H-30],eu:[440,40,210,140]};
map.setAttribute('viewBox',VIEWS.world.join(' '));
const defs=el('defs',{},map);
const pat=el('pattern',{id:'hatch',width:3,height:3,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},defs);
el('line',{x1:0,y1:0,x2:0,y2:3,stroke:'rgba(255,255,255,.6)','stroke-width':1.2},pat);
let selIso=null;
function drawMap(){
 map.querySelectorAll('g').forEach(g=>g.remove());
 const g=el('g',{},map),gh=el('g',{'pointer-events':'none'},map);
 D.world.c.forEach(c=>{const o=byIso[c.iso];
  const path=el('path',{d:c.d,fill:o?colorOf(o.mean):css('--nodata')},g);
  if(!o){path.addEventListener('mousemove',e=>showTip(e,`<b>${c.name}</b><br>no data`));path.addEventListener('mouseleave',hideTip);return}
  path.classList.add('has');path.dataset.iso=c.iso;if(c.iso===selIso)path.classList.add('sel');
  if(o.ev===EST)el('path',{d:c.d,fill:'url(#hatch)'},gh);
  path.addEventListener('mousemove',e=>showTip(e,`<b>${o.name}</b> ${sgn(o.mean)}<br>${money(o.usd)} per person per year${o.ev===EST?'<br><i>estimated</i>':''}`));
  path.addEventListener('mouseleave',hideTip);
  path.addEventListener('click',()=>select(o));
 });
}
function select(o){selIso=o.iso;map.querySelectorAll('path.sel').forEach(p=>p.classList.remove('sel'));map.querySelectorAll(`path[data-iso="${o.iso}"]`).forEach(p=>p.classList.add('sel'));detail(o)}
function legend(){
 $('legend').innerHTML=BINS.map(b=>`<span><i style="background:${css(b[2])}"></i>${b[3]}</span>`).join('')+
 `<span><i style="background:repeating-linear-gradient(45deg,${css('--b2')} 0 2px,rgba(255,255,255,.75) 2px 3.5px)"></i>estimated</span><span><i style="background:${css('--nodata')};outline:1px solid ${css('--line')}"></i>no data</span>`;
}
document.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('.seg button').forEach(x=>x.classList.toggle('on',x===b));
 animateView(VIEWS[b.dataset.view]);}));
function animateView(to){const from=map.getAttribute('viewBox').split(' ').map(Number);const t0=performance.now(),dur=500;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function step(t){const k=reduce?1:Math.min(1,(t-t0)/dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
  map.setAttribute('viewBox',from.map((f,i)=>f+(to[i]-f)*e).join(' '));if(k<1)requestAnimationFrame(step)}requestAnimationFrame(step)}

// ---------- RANKED LIST ----------
const XMIN=-50,XMAX=30,pos=v=>((Math.max(XMIN,Math.min(XMAX,v))-XMIN)/(XMAX-XMIN)*100);
function list(){
 const q=$('search').value.trim().toLowerCase(),showEst=$('showEst').checked||q.length>0;
 const rows=O.filter(o=>(showEst||o.ev!==EST)&&(!q||o.name.toLowerCase().includes(q))).sort((a,b)=>b.mean-a.mean);
 const ticks=[-40,-20,0,20];
 let h=`<div class="axis"><span></span><div class="t">${ticks.map(t=>`<span style="left:${pos(t)}%">${t>0?'+':''}${t}%</span>`).join('')}</div><span></span></div>`;
 h+=rows.map(o=>{const cc=inkOf(o.mean);
  return `<div class="li${o.ev===EST?' est':''}" data-iso="${o.iso}"><span class="nm">${o.name.replace(' (unspecified)','')}${o.ev===EST?' <small>est.</small>':''}</span>
  <div class="track"><div class="zero" style="left:${pos(0)}%"></div><div class="ci" style="left:${pos(o.lo)}%;width:${pos(o.hi)-pos(o.lo)}%;background:${cc}"></div><div class="pt" style="left:${pos(o.mean)}%;background:${cc}"></div></div>
  <span class="v" style="color:${cc}">${sgn(o.mean)}</span></div>`}).join('');
 if(!rows.length)h+='<p class="muted">No match.</p>';
 $('list').innerHTML=h;
 $('list').querySelectorAll('.li').forEach(r=>{const o=byIso[r.dataset.iso];
  r.addEventListener('mousemove',e=>showTip(e,`<b>${o.name}</b> ${sgn(o.mean)}<br>likely ${sgn(o.lo)} to ${sgn(o.hi)}<br>${money(o.usd)} per person per year`));
  r.addEventListener('mouseleave',hideTip);r.addEventListener('click',()=>{select(o);$('detail').scrollIntoView({behavior:'smooth',block:'center'})});});
}
$('search').addEventListener('input',list);$('showEst').addEventListener('change',list);

// ---------- BUBBLE ----------
function bubble(){
 const svg=$('bubble');svg.innerHTML='';const narrow=svg.parentNode.clientWidth<600;
 const BW=narrow?400:980,BH=narrow?440:430,L=narrow?46:54,R=14,T=48,B=50;svg.setAttribute('viewBox',`0 0 ${BW} ${BH}`);
 const lx=v=>L+(Math.log10(v)-3)/2*(BW-L-R),ly=v=>T+(28-v)/72*(BH-T-B);
 const gr=el('g',{class:'grid'},svg);
 [-40,-20,0,20].forEach(t=>{el('line',{x1:L,x2:BW-R,y1:ly(t),y2:ly(t),style:t===0?`stroke:${css('--mid')};stroke-width:1.5`:null},gr);const tx=el('text',{x:L-8,y:ly(t)+4,'text-anchor':'end'},svg);tx.textContent=(t>0?'+':'')+t+'%'});
 [1000,3000,10000,30000,100000].forEach(t=>{el('line',{x1:lx(t),x2:lx(t),y1:T,y2:BH-B},gr);const tx=el('text',{x:lx(t),y:BH-B+18,'text-anchor':'middle'},svg);tx.textContent='$'+(t/1000)+'k'});
 const xl=el('text',{x:(L+BW-R)/2,y:BH-8,'text-anchor':'middle'},svg);xl.textContent='Income per head in the country of origin (PPP, log scale)';
 const nat=el('text',{x:BW-R-4,y:ly(0)-6,'text-anchor':'end'},svg);nat.textContent='natives';
 const pts=O.filter(o=>o.ev!==EST).sort((a,b)=>b.ref-a.ref);
 const rr=v=>(narrow?3.5:4.5)+Math.sqrt(v)*(narrow?0.85:1.45);
 const LAB=new Set(narrow?['SOM','SYR','IND','USA','PAK','IRQ','GBR']:['SOM','SYR','IRQ','AFG','ERI','IND','USA','GBR','CHN','BIH','IRN','TUR','PAK','POL']);
 pts.forEach(o=>{const cx=lx(Math.max(1000,o.gdp)),cy=ly(o.mean),c=colorOf(o.mean),r=rr(o.ref);
  const g=el('g',{},svg);el('circle',{cx,cy,r,fill:c,'fill-opacity':.88,stroke:css('--surface'),'stroke-width':1.5},g);
  if(LAB.has(o.iso)){const off={GBR:-13,USA:15,BIH:17,TUR:-11}[o.iso]||0;const right=cx>BW-150||o.iso==='ERI';const t=el('text',{x:right?cx-r-4:cx+r+4,y:cy+4+off,'text-anchor':right?'end':'start',style:`fill:${css('--ink')}`},g);t.textContent=o.name}
  g.style.cursor='pointer';
  g.addEventListener('mousemove',e=>showTip(e,`<b>${o.name}</b> ${sgn(o.mean)}<br>origin income $${o.gdp.toLocaleString('en-US')}<br>peak refugees ${o.ref} per 1,000 people`));
  g.addEventListener('mouseleave',hideTip);g.addEventListener('click',()=>select(o));});
 // size legend
 let x=narrow?4:L+6;const sy=narrow?22:20;const lt=el('text',{x,y:sy+4,style:`fill:${css('--ink-2')}`},svg);lt.textContent=narrow?'Refugees per 1,000:':'Refugees (peak, per 1,000 people):';x+=narrow?128:226;
 [[1,'few'],[100,'100'],[300,'300']].forEach(s=>{const r=rr(s[0]);el('circle',{cx:x+r,cy:sy,r,fill:'none',stroke:css('--ink-2')},svg);const t=el('text',{x:x+2*r+5,y:sy+4},svg);t.textContent=s[1];x+=2*r+(narrow?34:44)});
}
function all(){drawMap();legend();list();bubble()}
all();select(byIso['SOM']);
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(bubble,150)});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{all();if(selIso)select(byIso[selIso])});
})();
