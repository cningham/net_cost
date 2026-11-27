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

// continuous green (above natives) -> red (below natives)
const SC=PAL.scale([-40,-30,-20,-12,-5,0,5,12,22],'high',false);
const colorOf=v=>SC.col(v);
const inkOf=v=>SC.ink(v);
const pfmt=a=>(a>0?'+':a<0?'−':'')+Math.abs(a)+'%';
const tip=$('tip');
function showTip(e,html){tip.innerHTML=html;tip.hidden=false;const w=tip.offsetWidth;let x=e.clientX+14;if(x+w>innerWidth-8)x=e.clientX-w-14;tip.style.left=x+'px';tip.style.top=(e.clientY+14)+'px'}
function hideTip(){tip.hidden=true}
function detail(o){
 const est=o.ev===EST;
 $('detail').innerHTML=`<div class="row"><h3>${o.name.replace(' (unspecified)','')}</h3><span class="val" style="color:${inkOf(o.mean)}">${sgn(o.mean)}</span><span class="muted">≈ ${money(o.usd)} / person / year</span></div>
 <div class="muted small">90% CrI ${sgn(o.lo)} to ${sgn(o.hi)} · rank ${o.rk}/${O.length}${est?' · modelled':''}</div>`;
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
  path.addEventListener('mousemove',e=>showTip(e,`<b>${o.name}</b> ${sgn(o.mean)}<br>${money(o.usd)} / person / year${o.ev===EST?'<br><i>modelled</i>':''}`));
  path.addEventListener('mouseleave',hideTip);
  path.addEventListener('click',()=>select(o));
 });
}
function select(o){selIso=o.iso;map.querySelectorAll('path.sel').forEach(p=>p.classList.remove('sel'));map.querySelectorAll(`path[data-iso="${o.iso}"]`).forEach(p=>p.classList.add('sel'));detail(o)}
function legend(){
 $('legend').innerHTML=`<div class="tscale">${SC.bar(pfmt)}</div>`+
 `<span><i style="background:repeating-linear-gradient(45deg,${SC.col(0)} 0 2px,rgba(255,255,255,.75) 2px 3.5px)"></i>modelled</span><span><i style="background:${css('--nodata')};outline:1px solid ${css('--line')}"></i>no data</span>`;
}
document.querySelectorAll('#tab-fiscal .seg button').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('#tab-fiscal .seg button').forEach(x=>x.classList.toggle('on',x===b));
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
  r.addEventListener('mousemove',e=>showTip(e,`<b>${o.name}</b> ${sgn(o.mean)}<br>90% CrI ${sgn(o.lo)} to ${sgn(o.hi)}<br>${money(o.usd)} / person / year`));
  r.addEventListener('mouseleave',hideTip);r.addEventListener('click',()=>{select(o);$('detail').scrollIntoView({behavior:'smooth',block:'center'})});});
}
$('search').addEventListener('input',list);$('showEst').addEventListener('change',list);

// ---------- BUBBLE ----------
function bubble(){
 const svg=$('bubble');svg.innerHTML='';const narrow=svg.parentNode.clientWidth<600;
 const BW=narrow?400:980,BH=narrow?600:620,L=narrow?46:54,R=14,T=narrow?62:70,B=50;svg.setAttribute('viewBox',`0 0 ${BW} ${BH}`);
 const lx=v=>L+(Math.log10(v)-3)/2*(BW-L-R),ly=v=>T+(28-v)/72*(BH-T-B);
 const gr=el('g',{class:'grid'},svg);
 [-40,-20,0,20].forEach(t=>{el('line',{x1:L,x2:BW-R,y1:ly(t),y2:ly(t),style:t===0?`stroke:${css('--mid')};stroke-width:1.5`:null},gr);const tx=el('text',{x:L-8,y:ly(t)+4,'text-anchor':'end'},svg);tx.textContent=(t>0?'+':'')+t+'%'});
 [1000,3000,10000,30000,100000].forEach(t=>{el('line',{x1:lx(t),x2:lx(t),y1:T,y2:BH-B},gr);const tx=el('text',{x:lx(t),y:BH-B+18,'text-anchor':'middle'},svg);tx.textContent='$'+(t/1000)+'k'});
 const xl=el('text',{x:(L+BW-R)/2,y:BH-8,'text-anchor':'middle'},svg);xl.textContent='Income per head in the country of origin (PPP, log scale)';
 const nat=el('text',{x:BW-R-4,y:ly(0)-6,'text-anchor':'end'},svg);nat.textContent='natives';
 const pts=O.filter(o=>o.ev!==EST&&o.mig).sort((a,b)=>b.mig-a.mig);
 const rr=v=>Math.max(2.5,(narrow?19:27)*Math.sqrt(v/450000));
 const LAB=new Set(narrow?['SOM','SYR','IND','USA','PAK','IRQ','GBR']:['SOM','SYR','IRQ','AFG','ERI','IND','USA','GBR','CHN','MAR','IRN','TUR','PAK','POL']);
 pts.forEach(o=>{const cx=lx(Math.max(1000,o.gdp)),cy=ly(o.mean),c=colorOf(o.mean),r=rr(o.mig);
  const g=el('g',{},svg);el('circle',{cx,cy,r,fill:c,'fill-opacity':.88,stroke:css('--surface'),'stroke-width':1.5},g);
  if(LAB.has(o.iso)){const off={GBR:-13,USA:24,IRN:-12,BIH:6}[o.iso]||0;const right=cx>BW-150||o.iso==='ERI';const t=el('text',{x:right?cx-r-4:cx+r+4,y:cy+4+off,'text-anchor':right?'end':'start',style:`fill:${css('--ink')}`},g);t.textContent=o.name}
  g.style.cursor='pointer';
  g.addEventListener('mousemove',e=>showTip(e,`<b>${o.name}</b> ${sgn(o.mean)}<br>origin income $${o.gdp.toLocaleString('en-US')}<br>immigrants in DK+SE+NL+FI: ${o.mig.toLocaleString('en-US')}`));
  g.addEventListener('mouseleave',hideTip);g.addEventListener('click',()=>select(o));});
 // size legend
 let x=narrow?4:L+6;const sy=narrow?24:30;const lt=el('text',{x,y:sy+4,style:`fill:${css('--ink-2')}`},svg);lt.textContent=narrow?'Immigrants:':'Immigrants (DK+SE+NL+FI):';x+=narrow?72:170;
 [[20000,'20k'],[100000,'100k'],[400000,'400k']].forEach(s=>{const r=rr(s[0]);el('circle',{cx:x+r,cy:sy,r,fill:'none',stroke:css('--ink-2')},svg);const t=el('text',{x:x+2*r+5,y:sy+4},svg);t.textContent=s[1];x+=2*r+(narrow?34:44)});
}
function all(){drawMap();legend();list();bubble();document.querySelectorAll('#tab-fiscal .scale').forEach(b=>b.innerHTML=`<div class="tscale big">${SC.bar(pfmt)}</div><div class="scale-labels"><span>below natives</span><span>above natives</span></div>`)}
all();select(byIso['SOM']);
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(bubble,150)});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{all();if(selIso)select(byIso[selIso])});
})();
