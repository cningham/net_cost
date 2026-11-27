(function(){
const D=window.DATA, NS="http://www.w3.org/2000/svg";
const css=n=>getComputedStyle(document.querySelector('.viz-root')).getPropertyValue(n).trim();
const tip=document.getElementById('tip');
function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function txt(p,x,y,s,a){const t=el('text',Object.assign({x,y},a||{}),p);t.textContent=s;return t}
function lin(d0,d1,r0,r1){const f=v=>r0+(v-d0)/(d1-d0)*(r1-r0);f.d=[d0,d1];return f}
function logs(d0,d1,r0,r1){const a=Math.log10(d0),b=Math.log10(d1);return v=>r0+(Math.log10(v)-a)/(b-a)*(r1-r0)}
function lbl(g,cx,cy,t,W){const r=cx>W-110;return txt(g,r?cx-7:cx+7,cy-7,t,{class:'lab','text-anchor':r?'end':'start'})}
function hover(node,html){node.style.cursor='default';
 node.addEventListener('mousemove',e=>{tip.innerHTML=html;tip.hidden=false;const w=tip.offsetWidth;let x=e.clientX+14;if(x+w>innerWidth-8)x=e.clientX-w-14;tip.style.left=x+'px';tip.style.top=(e.clientY+12)+'px'});
 node.addEventListener('mouseleave',()=>tip.hidden=true)}
function frame(id,W,H){const c=document.getElementById(id);c.innerHTML='';return el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img'},c)}
function xAxis(s,x,ticks,y0,y1,fmt,label,W){const g=el('g',{class:'ax'},s),gr=el('g',{class:'grid'},s);
 ticks.forEach(t=>{el('line',{x1:x(t),x2:x(t),y1:y0,y2:y1},gr);txt(g,x(t),y1+14,fmt?fmt(t):t,{'text-anchor':'middle'})});
 if(label)txt(g,(W||0)/2||x(ticks[Math.floor(ticks.length/2)]),y1+30,label,{'text-anchor':'middle'});}
function yAxis(s,y,ticks,x0,x1,fmt,label){const g=el('g',{class:'ax'},s),gr=el('g',{class:'grid'},s);
 ticks.forEach(t=>{el('line',{x1:x0,x2:x1,y1:y(t),y2:y(t)},gr);txt(g,x0-6,y(t)+4,fmt?fmt(t):t,{'text-anchor':'end'})});
 if(label){const t=txt(g,0,0,label,{'text-anchor':'middle',transform:`translate(${x0-40},${(y(ticks[0])+y(ticks[ticks.length-1]))/2}) rotate(-90)`})}}
const pct=v=>(v>0?'+':'')+v+'%';
const col=v=>v<0?css('--neg'):css('--pos');
const usd=v=>(v<0?'−':'+')+'$'+Math.abs(Math.round(v/100)*100).toLocaleString('en-US');
document.getElementById('usd1').textContent=Math.round(D.avg_usd/100).toLocaleString('en-US');
const ring=css('--surface-1');

// 1. ranking
function rank(){
 const all=document.getElementById('showImputed').checked;
 const rows=D.origins.filter(o=>all||o.ev!=='regional aggregate / covariates only').sort((a,b)=>b.mean-a.mean);
 const L=190,R=60,T=44,rh=15,W=900,H=T+rows.length*rh+40;const s=frame('c-rank',W,H);
 const x=lin(-55,30,L,W-R);const y0=T,y1=T+rows.length*rh;
 xAxis(s,x,[-50,-40,-30,-20,-10,0,10,20,30],y0-6,y1,pct);
 el('line',{x1:x(0),x2:x(0),y1:y0-6,y2:y1,stroke:css('--mid'),'stroke-width':1.5},s);
 txt(s,x(0)+4,y0-9,'natives',{class:'lab'});
 txt(s,L,16,'Origin effect, % of host GDP per capita per person per year (mean and 90% interval)',{class:'title'});
 rows.forEach((o,i)=>{const cy=T+i*rh+rh/2,c=col(o.mean),imp=o.ev==='regional aggregate / covariates only';
  const g=el('g',{},s);
  el('rect',{x:0,y:cy-rh/2,width:W,height:rh,fill:'transparent'},g);
  txt(g,L-8,cy+4,o.name+(imp?' *':''),{'text-anchor':'end',fill:imp?css('--text-secondary'):css('--text-primary')});
  el('line',{x1:x(o.lo),x2:x(o.hi),y1:cy,y2:cy,stroke:c,'stroke-width':2,'stroke-linecap':'round',opacity:imp?.45:.9},g);
  el('circle',{cx:x(o.mean),cy,r:4.5,fill:imp?ring:c,stroke:imp?c:ring,'stroke-width':imp?1.5:2},g);
  hover(g,`<b>${o.name}</b><br>${pct(o.mean)} of GDP pc (90%: ${o.lo} to ${o.hi})<br>≈ ${usd(o.usd)} PPP per person per year<br>Rank ${o.rk} (90%: ${o.rlo}–${o.rhi}) of ${D.origins.length}<br>Evidence: ${o.ev}${o.hosts?' ('+o.hosts+')':''}`);
 });
 if(all)txt(s,L,H-6,'* estimated only: appears inside Dutch regional groups or predicted from covariates',{class:'lab'});
}
document.getElementById('showImputed').addEventListener('change',rank);

// 2. cross-host
function cross(){
 const H3=[['DNK','Denmark (2019)',css('--s1')],['SWE','Sweden (2022)',css('--s2')],['FIN','Finland (2011, ages 20–62, age-adj.)',css('--s3')]];
 const om=Object.fromEntries(D.origins.map(o=>[o.iso,o]));
 const rows=D.cross.filter(r=>H3.filter(h=>r[h[0]]!=null).length>=2).sort((a,b)=>(om[b.iso]?.mean??0)-(om[a.iso]?.mean??0));
 const L=190,R=60,T=48,rh=17,W=900,H=T+rows.length*rh+30;const s=frame('c-cross',W,H);
 const x=lin(-60,30,L,W-R);xAxis(s,x,[-60,-50,-40,-30,-20,-10,0,10,20,30],T-6,T+rows.length*rh,pct);
 el('line',{x1:x(0),x2:x(0),y1:T-6,y2:T+rows.length*rh,stroke:css('--mid'),'stroke-width':1.5},s);
 let lx=L;H3.forEach(h=>{el('circle',{cx:lx+5,cy:14,r:5,fill:h[2]},s);const t=txt(s,lx+14,18,h[1]);lx+=t.getComputedTextLength()+40});
 txt(s,L,36,'Gap vs natives as published, % of host GDP per capita',{class:'lab'});
 rows.forEach((r,i)=>{const cy=T+i*rh+rh/2;const g=el('g',{},s);el('rect',{x:0,y:cy-rh/2,width:W,height:rh,fill:'transparent'},g);
  txt(g,L-8,cy+4,r.name,{'text-anchor':'end'});
  const v=H3.map(h=>r[h[0]]).filter(a=>a!=null);el('line',{x1:x(Math.min(...v)),x2:x(Math.max(...v)),y1:cy,y2:cy,stroke:css('--axis'),'stroke-width':2},g);
  H3.forEach(h=>{if(r[h[0]]!=null)el('circle',{cx:x(r[h[0]]),cy,r:5,fill:h[2],stroke:ring,'stroke-width':2},g)});
  hover(g,`<b>${r.name}</b><br>`+H3.filter(h=>r[h[0]]!=null).map(h=>`${h[1].split(' (')[0]}: ${pct(r[h[0]])}`).join('<br>')+(om[r.iso]?`<br>Model: ${pct(om[r.iso].mean)}`:''));
 });
}

// 3. scatters
const obs=()=>D.origins.filter(o=>o.ev!=='regional aggregate / covariates only');
const LAB=new Set(['SOM','SYR','IRQ','AFG','ERI','IND','USA','GBR','FIN','IRN','CHN','POL','TUR','BIH','DEU','JPN']);
function scatter(id,title,xs,xticks,xfmt,xlab,xv,labs){
 const W=440,H=330,L=50,R=14,T=30,B=46;const s=frame(id,W,H);
 const y=lin(-45,30,H-B,T);yAxis(s,y,[-40,-30,-20,-10,0,10,20,30],L,W-R,pct);
 const x=xs(L,W-R);xAxis(s,x,xticks,T,H-B,xfmt);txt(s,(L+W-R)/2,H-8,xlab,{'text-anchor':'middle',class:'lab'});
 txt(s,L,16,title,{class:'title'});
 el('line',{x1:L,x2:W-R,y1:y(0),y2:y(0),stroke:css('--mid'),'stroke-width':1.5},s);
 obs().forEach(o=>{const cx=x(xv(o)),cy=y(o.mean);const g=el('g',{},s);
  el('circle',{cx,cy,r:9,fill:'transparent'},g);el('circle',{cx,cy,r:4.5,fill:col(o.mean),stroke:ring,'stroke-width':1.5},g);
  if(labs.has(o.iso))lbl(g,cx,cy,o.name,W);
  hover(g,`<b>${o.name}</b><br>Origin effect ${pct(o.mean)}<br>GDP pc ${'$'+o.gdp.toLocaleString('en-US')} PPP<br>Peak refugee outflow ${o.ref} per 1,000`)});
}
function betas(){
 const W=900,H=150,L=290,R=60,T=30;const s=frame('c-beta',W,H);const x=lin(-12,12,L,W-R);
 xAxis(s,x,[-12,-8,-4,0,4,8,12],T-4,T+3*24,v=>(v>0?'+':'')+v+' pp');el('line',{x1:x(0),x2:x(0),y1:T-4,y2:T+72,stroke:css('--mid'),'stroke-width':1.5},s);
 txt(s,L,16,'Effect on the origin effect, percentage points of GDP per capita (90% interval)',{class:'title'});
 const nm=['Origin GDP per capita (+1 SD of log)','Peak refugee outflow (+1 SD of log)','EU / EEA / Swiss origin'];
 D.betas.forEach((b,i)=>{const cy=T+i*24+12;const c=b.lo>0?css('--pos'):b.hi<0?css('--neg'):css('--mid');const g=el('g',{},s);
  txt(g,L-8,cy+4,nm[i],{'text-anchor':'end'});el('line',{x1:x(b.lo),x2:x(b.hi),y1:cy,y2:cy,stroke:c,'stroke-width':2,'stroke-linecap':'round'},g);
  el('circle',{cx:x(b.mean),cy,r:5,fill:c,stroke:ring,'stroke-width':2},g);hover(g,`<b>${nm[i]}</b><br>${b.mean} pp (90%: ${b.lo} to ${b.hi})`)});
 txt(s,L,H-4,`Remaining spread between origins after these: SD ${D.tau} pp`,{class:'lab'});
}
// 4. lambda + NL
function lambda(){
 const W=440,H=230,L=110,R=20,T=30;const s=frame('c-lambda',W,H);const x=logs(0.1,100,L,W-R);
 xAxis(s,x,[0.1,1,10,100],T-4,T+4*34,v=>v+'×');txt(s,L,16,'Scale factor λ vs Danish basis (log scale, 90% interval)',{class:'title'});
 const nm={DNK:'Denmark (anchor)',SWE:'Sweden',NLD:'Netherlands',FIN:'Finland'};
 D.hosts.forEach((h,i)=>{const cy=T+i*34+17;const g=el('g',{},s);txt(g,L-8,cy+4,nm[h.host],{'text-anchor':'end'});
  el('line',{x1:x(h.lo),x2:x(h.hi),y1:cy,y2:cy,stroke:css('--s1'),'stroke-width':2,'stroke-linecap':'round'},g);
  el('circle',{cx:x(h.lam),cy,r:5,fill:css('--s1'),stroke:ring,'stroke-width':2},g);txt(g,x(h.hi)+8,cy+4,(h.lam>=10?Math.round(h.lam):h.lam)+'×',{class:'lab'});
  hover(g,`<b>${nm[h.host]}</b><br>λ = ${h.lam} (90%: ${h.lo}–${h.hi})<br>shift α = ${h.alpha} pp`)});
}
function nl(){
 const W=440,H=330,L=56,R=14,T=30,B=46;const s=frame('c-nl',W,H);const h=D.hosts.find(h=>h.host==='NLD');
 const x=lin(-45,25,L,W-R),y=lin(-1800,400,H-B,T);
 xAxis(s,x,[-40,-30,-20,-10,0,10,20],T,H-B,pct);yAxis(s,y,[-1600,-1200,-800,-400,0,400],L,W-R,v=>v+'%');el('line',{x1:L,x2:W-R,y1:y(0),y2:y(0),stroke:css('--mid'),'stroke-width':1.5},s);
 txt(s,(L+W-R)/2,H-8,'Model origin effect (average of member countries)',{'text-anchor':'middle',class:'lab'});
 txt(s,L,16,'Netherlands: lifetime gap, % of GDP per capita',{class:'title'});
 const xa=Math.max(-45,(-1800-h.alpha)/h.lam),xb=Math.min(25,(400-h.alpha)/h.lam);el('line',{x1:x(xa),y1:y(h.alpha+h.lam*xa),x2:x(xb),y2:y(h.alpha+h.lam*xb),stroke:css('--mid'),'stroke-width':1.5,'stroke-dasharray':'4 3'},s);
 const lab=new Set(['Horn of Africa and Sudan','Morocco','Turkey','North America','Afghanistan, Iran, Syria and Iraq']);
 D.nl.forEach(r=>{const cx=x(r.model),cy=y(r.gap);const g=el('g',{},s);el('circle',{cx,cy,r:9,fill:'transparent'},g);
  el('circle',{cx,cy,r:4.5,fill:col(r.gap),stroke:ring,'stroke-width':1.5},g);if(lab.has(r.label))lbl(g,cx,cy,r.label.replace('Afghanistan, Iran, Syria and Iraq','Afg./Iran/Syria/Iraq'),W);
  hover(g,`<b>${r.label}</b><br>Lifetime gap ${r.gap}% of GDP pc<br>Model effect ${pct(r.model)}`)});
 txt(s,x(0)+6,y(-1500),'dashed: model fit, λ ≈ '+Math.round(h.lam),{class:'lab'});
}
// 5. UK + sensitivity
function uk(){
 const W=440,H=330,L=50,R=14,T=30,B=46;const s=frame('c-uk',W,H);
 const x=lin(-8000,32000,L,W-R),y=lin(-45,30,H-B,T);
 xAxis(s,x,[-8000,0,8000,16000,24000,32000],T,H-B,v=>(v<0?'−£':'£')+Math.abs(v/1000)+'k');yAxis(s,y,[-40,-30,-20,-10,0,10,20,30],L,W-R,pct);
 txt(s,(L+W-R)/2,H-8,'UK HMRC net per NIC payer, 2019-20 (partial measure)',{'text-anchor':'middle',class:'lab'});
 txt(s,L,16,`Origin effect vs UK tax data (Spearman ${D.uk_rho}, n=${D.uk.length})`,{class:'title'});
 el('line',{x1:L,x2:W-R,y1:y(0),y2:y(0),stroke:css('--mid'),'stroke-width':1.5},s);
 const lab=new Set(['SOM','IND','USA','AFG','SYR','JPN']);
 D.uk.forEach(o=>{const cx=x(Math.max(-8000,Math.min(32000,o.net))),cy=y(o.model);const g=el('g',{},s);el('circle',{cx,cy,r:9,fill:'transparent'},g);
  el('circle',{cx,cy,r:4.5,fill:col(o.model),stroke:ring,'stroke-width':1.5},g);if(lab.has(o.iso))lbl(g,cx,cy,o.name,W);
  hover(g,`<b>${o.name}</b><br>HMRC net £${o.net.toLocaleString('en-GB')} per NIC payer<br>Model effect ${pct(o.model)}`)});
}
function sens(){
 const W=440,H=270,L=190,R=30,T=30;const s=frame('c-sens',W,H);const x=lin(0.85,1,L,W-R);
 const nm={dk_with_descendants:'DK incl. descendants',no_FIN:'Without Finland',no_NLD:'Without Netherlands',no_covariates:'No covariates',anchor_SWE:'Sweden as anchor'};
 const rows=D.sens.filter(r=>r.run!=='main');xAxis(s,x,[0.85,0.9,0.95,1],T-4,T+rows.length*34,v=>v.toFixed(2));
 txt(s,L-170,16,'Rank correlation with main run (50 countries)',{class:'title'});
 rows.forEach((r,i)=>{const cy=T+i*34+17;const g=el('g',{},s);txt(g,L-8,cy+4,nm[r.run],{'text-anchor':'end'});
  el('line',{x1:x(0.85),x2:x(r.rho),y1:cy,y2:cy,stroke:css('--grid'),'stroke-width':2},g);
  el('circle',{cx:x(r.rho),cy,r:5,fill:css('--s1'),stroke:ring,'stroke-width':2},g);txt(g,x(r.rho)-8,cy-9,r.rho.toFixed(3),{class:'lab','text-anchor':'middle'});
  hover(g,`<b>${nm[r.run]}</b><br>Spearman ${r.rho}`)});
 txt(s,L-170,H-24,'Axis starts at 0.85.',{class:'lab'});txt(s,L-170,H-8,'Raw agreement between hosts: '+D.pairs.map(p=>p.pair+' '+p.rho).join(', '),{class:'lab'});
}
function draw(){rank();cross();
 scatter('c-gdp','Origin effect vs origin GDP per capita',(a,b)=>logs(1000,100000,a,b),[1000,3000,10000,30000,100000],v=>'$'+(v>=1000?v/1000+'k':v),'GDP per capita, PPP 2021 $ (log scale)',o=>Math.max(1000,o.gdp),new Set(['SOM','SYR','IRQ','ERI','IND','USA','CHN','PAK']));
 scatter('c-ref','Origin effect vs refugee outflow',(a,b)=>{const f=lin(0,Math.log10(401),a,b);return v=>f(Math.log10(1+v))},[0,3,10,30,100,300],v=>v,'Peak refugees per 1,000 population (log(1+x) scale)',o=>o.ref,new Set(['SOM','SYR','IRQ','BIH','IRN','ERI']));
 betas();lambda();nl();uk();sens();}
draw();matchMedia('(prefers-color-scheme: dark)').addEventListener('change',draw);
})();
