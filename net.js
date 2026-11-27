// Fiscal + crime tab: two metrics side by side, per origin. Fiscal score (fiscal tab) and crime rate vs natives (crime tab).
(function(){
const D=window.DATA,C=window.CRIME,NS="http://www.w3.org/2000/svg";
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const $=id=>document.getElementById(id);
function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a){if(a[k]!=null)e.setAttribute(k,a[k])}if(p)p.appendChild(e);return e}
const EST='regional aggregate / covariates only';
const USD=D.avg_usd/100;
const CR=[['ALL','All offences'],['VIOL','Violence'],['HOM','Homicide'],['SEX','Sexual'],['RAPE','Rape'],['ROB','Robbery'],['PROP','Property'],['THEFT','Theft'],['FRAUD','Fraud'],['DRUG','Drugs']];
const CN=Object.fromEntries(CR);
const REG={EU_EFTA_UK:'EU, EFTA, UK',EUR_OTH:'Other Europe',MENA:'Middle East, N. Africa',SSA:'Sub-Saharan Africa',ASIA_OTH:'Asia',LATAM:'Latin America',NA_OCE:'N. America, Oceania'};
const st={crime:'ALL',unit:'usd',sort:['F',-1],regSort:['m',-1],sel:null};

const cBy=Object.fromEntries(C.origins.map(o=>[o.iso,o]));
const O=D.origins.filter(o=>cBy[o.iso]).map(f=>{const c=cBy[f.iso];return{iso:f.iso,name:f.name.replace(' (unspecified)',''),f,c,reg:c.reg,mig:f.mig,est:f.ev===EST||c.hd===0}});
const byIso=Object.fromEntries(O.map(o=>[o.iso,o]));
const rr=o=>o.c.rr[st.crime];

// formats
const sg=v=>v>0?'+':v<0?'−':'';
function ffmt(p){if(st.unit==='usd'){const x=Math.round(p*USD/100)*100;return (x===0?'':sg(x))+'$'+Math.abs(x).toLocaleString('en-US')}const a=Math.abs(p);return (a<.05?'':sg(p))+(a<10?a.toFixed(1):a.toFixed(0))+'%'}
function cfmt(r){const p=(r-1)*100,a=Math.abs(p);return (a<.5?'':sg(p))+(a>=1000?Math.round(a).toLocaleString('en-US'):a.toFixed(0))+'%'}
const fUnit=()=>st.unit==='usd'?'US$ per person per year':'% of host GDP per capita';

// colours: fiscal tab ink for fiscal, crime tab scale for crime
const SC=PAL.scale([.25,.5,1,1.5,2,2.6,3.3,4.5,6],'low',true);
const fInk=v=>v<0?css('--neg'):css('--pos');
const cInk=r=>SC.ink(r);
const quad=o=>{const f=o.f.mean>=0,c=rr(o)[0]<=1;return f&&c?'pos':!f&&!c?'neg':'mix'};
const QL={pos:'Pays more · less crime',neg:'Costs more · more crime',mix:'Mixed'};
const qCol=q=>q==='pos'?css('--pos'):q==='neg'?css('--neg'):css('--mid');

const tip=$('tip');
function showTip(e,h){tip.innerHTML=h;tip.hidden=false;const w=tip.offsetWidth;let x=e.clientX+14;if(x+w>innerWidth-8)x=e.clientX-w-14;tip.style.left=x+'px';tip.style.top=(e.clientY+14)+'px'}
function hideTip(){tip.hidden=true}
const tipHtml=o=>{const r=rr(o);return `<b>${o.name}</b><br>Fiscal ${ffmt(o.f.mean)}<br>${CN[st.crime]} ${cfmt(r[0])} vs natives${o.mig?`<br>Immigrants in DK+SE+NL+FI: ${o.mig.toLocaleString('en-US')}`:''}${o.est?'<br><i>modelled</i>':''}`};

// controls
function crimeSeg(){
 $('n-crime').innerHTML=CR.map(c=>`<button data-k="${c[0]}"${c[0]===st.crime?' class="on"':''}>${c[1]}</button>`).join('');
 $('n-crime').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{st.crime=b.dataset.k;$('n-crime').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));render()}));
}
$('n-unit').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{st.unit=b.dataset.v;$('n-unit').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));render()}));

// quadrant scatter: x fiscal, y crime rate vs natives (log), bubble = immigrant stock
const YT=[.25,.5,1,2,4,8,16];
function scatter(){
 const svg=$('n-scatter');svg.innerHTML='';const narrow=svg.parentNode.clientWidth<600;
 const showEst=$('n-scEst').checked;
 const pts=O.filter(o=>showEst||!o.est);
 const BW=narrow?400:980,BH=narrow?560:620,L=narrow?50:62,R=14,T=narrow?64:70,B=46;svg.setAttribute('viewBox',`0 0 ${BW} ${BH}`);
 const fx=pts.map(o=>o.f.mean),xmin=Math.min(-40,Math.floor(Math.min(...fx)/10)*10),xmax=Math.max(30,Math.ceil(Math.max(...fx)/10)*10);
 const ymin=Math.log(.2),ymax=Math.log(Math.max(8,Math.max(...pts.map(o=>rr(o)[0]))*1.15));
 const X=v=>L+(v-xmin)/(xmax-xmin)*(BW-L-R),Y=r=>T+(ymax-Math.log(Math.max(.2,r)))/(ymax-ymin)*(BH-T-B);
 [[xmin,0,1,Math.exp(ymax),'neg'],[0,xmax,.2,1,'pos']].forEach(([a,b,lo,hi,q])=>el('rect',{x:X(a),y:Y(hi),width:X(b)-X(a),height:Y(lo)-Y(hi),fill:qCol(q),'fill-opacity':.06},svg));
 const gr=el('g',{class:'grid'},svg);
 const usd=st.unit==='usd',k=usd?USD:1,stp=usd?10000:10,xt=[];for(let v=Math.ceil(xmin*k/stp)*stp;v<=xmax*k;v+=stp)xt.push(v);
 xt.forEach((t,i)=>{const xv=X(t/k);el('line',{x1:xv,x2:xv,y1:T,y2:BH-B,style:t===0?`stroke:${css('--mid')};stroke-width:1.5`:null},gr);if(narrow&&(t/stp)%2)return;const tx=el('text',{x:xv,y:BH-B+18,'text-anchor':'middle'},svg);tx.textContent=usd?(t===0?'$0':sg(t)+'$'+Math.abs(t)/1000+'k'):(t>0?'+':t<0?'−':'')+Math.abs(t)+'%'});
 YT.filter(t=>Math.log(t)<=ymax).forEach(t=>{el('line',{x1:L,x2:BW-R,y1:Y(t),y2:Y(t),style:t===1?`stroke:${css('--mid')};stroke-width:1.5`:null},gr);const tx=el('text',{x:L-8,y:Y(t)+4,'text-anchor':'end'},svg);tx.textContent=cfmt(t)});
 const xl=el('text',{x:(L+BW-R)/2,y:BH-8,'text-anchor':'middle'},svg);xl.textContent=`Fiscal, ${fUnit()}`;
 const yl=el('text',{x:L,y:T-10,'text-anchor':'start',style:`fill:${css('--ink-2')}`},svg);yl.textContent=`↑ ${CN[st.crime]} vs natives (log scale)`;
 const ql=(x,y,anchor,txt)=>{const t=el('text',{x,y,'text-anchor':anchor,style:`fill:${css('--ink-2')};font-weight:600`},svg);t.textContent=txt};
 ql(L+6,T+14,'start','Costs more · more crime');ql(BW-R-6,T+14,'end','Pays more · more crime');
 ql(L+6,BH-B-8,'start','Costs more · less crime');ql(BW-R-6,BH-B-8,'end','Pays more · less crime');
 const rad=v=>v?Math.max(2.5,(narrow?18:26)*Math.sqrt(v/450000)):3;
 const LAB=new Set(narrow?['SOM','SYR','IND','USA','IRQ','GBR','MAR']:['SOM','SYR','IRQ','AFG','ERI','IND','USA','GBR','CHN','MAR','TUR','PAK','POL','DEU']);
 const labs=[];
 pts.slice().sort((a,b)=>(b.mig||0)-(a.mig||0)).forEach(o=>{const cx=X(o.f.mean),cy=Y(rr(o)[0]),r=rad(o.mig),q=quad(o),sel=o.iso===st.sel;
  const g=el('g',{},svg);el('circle',{cx,cy,r,fill:qCol(q),'fill-opacity':o.est?.35:.8,stroke:sel?css('--ink'):css('--surface'),'stroke-width':sel?2:1.2,'stroke-dasharray':o.est&&!sel?'2 2':null},g);
  if(LAB.has(o.iso)||sel)labs.push([cx,cy,r,o.name,sel]);
  g.style.cursor='pointer';g.addEventListener('mousemove',e=>showTip(e,tipHtml(o)));g.addEventListener('mouseleave',hideTip);g.addEventListener('click',()=>select(o));});
 const lg=el('g',{'pointer-events':'none'},svg);labs.forEach(([cx,cy,r,n,sel])=>{const right=cx>BW-140;const t=el('text',{x:right?cx-r-4:cx+r+4,y:cy+4,'text-anchor':right?'end':'start',style:`fill:${css('--ink')};paint-order:stroke;stroke:${css('--surface')};stroke-width:3px;stroke-linejoin:round${sel?';font-weight:700':''}`},lg);t.textContent=n});
 let x=narrow?4:L+6;const sy=narrow?22:26;const lt=el('text',{x,y:sy+4,style:`fill:${css('--ink-2')}`},svg);lt.textContent=narrow?'Immigrants:':'Immigrants (DK+SE+NL+FI):';x+=narrow?72:170;
 [[20000,'20k'],[100000,'100k'],[400000,'400k']].forEach(s=>{const r=rad(s[0]);el('circle',{cx:x+r,cy:sy,r,fill:'none',stroke:css('--ink-2')},svg);const t=el('text',{x:x+2*r+5,y:sy+4},svg);t.textContent=s[1];x+=2*r+(narrow?34:44)});
}
$('n-scEst').addEventListener('change',scatter);

// detail card
const LMIN=Math.log(.2),LMAX=Math.log(20),pos=v=>(Math.log(Math.max(.2,Math.min(20,v)))-LMIN)/(LMAX-LMIN)*100;
function select(o){st.sel=o.iso;scatter();detail(o)}
function detail(o){
 const r=rr(o);
 const minis=CR.map(([k,n])=>{const v=o.c.rr[k],cc=cInk(v[0]);return `<div class="mini${k===st.crime?' cur':''}"><span>${n}</span><div class="track"><div class="zero" style="left:${pos(1)}%"></div><div class="ci" style="left:${pos(v[1])}%;width:${pos(v[2])-pos(v[1])}%;background:${cc}"></div><div class="pt" style="left:${pos(v[0])}%;background:${cc}"></div></div><span class="v" style="color:${cc}">${cfmt(v[0])}</span></div>`}).join('');
 $('n-detail').innerHTML=`<div class="row"><h3>${o.name}</h3>
 <span class="kv"><span class="val" style="color:${fInk(o.f.mean)}">${ffmt(o.f.mean)}</span><span class="muted small">fiscal, ${fUnit()}<br>90% CrI ${ffmt(o.f.lo)} to ${ffmt(o.f.hi)}</span></span>
 <span class="kv"><span class="val" style="color:${cInk(r[0])}">${cfmt(r[0])}</span><span class="muted small">${CN[st.crime].toLowerCase()} vs natives<br>95% CrI ${cfmt(r[1])} to ${cfmt(r[2])}</span></span></div>
 <div class="muted small">${QL[quad(o)]}${o.est?' · modelled':''}${o.c.note?' · '+o.c.note:''}</div><div class="minis">${minis}</div>`;
}

// table
const COLS=[['name','Origin',o=>o.name],['F','Fiscal',o=>o.f.mean],['Fci','90% CrI',o=>o.f.lo],['C','Crime',o=>rr(o)[0]],['Cci','95% CrI',o=>rr(o)[1]],['mig','Immigrants',o=>o.mig??-1],['q','Quadrant',o=>({pos:0,mix:1,neg:2})[quad(o)]]];
function table(){
 const qs=$('n-tsearch').value.trim().toLowerCase();
 const [sk,sd]=st.sort,col=COLS.find(c=>c[0]===sk);
 const rows=O.filter(o=>!qs||o.name.toLowerCase().includes(qs)).sort((x,y)=>{const a=col[2](x),b=col[2](y);return typeof a==='string'?sd*a.localeCompare(b):sd*(a-b)});
 const head=COLS.map(([k,n])=>`<th data-k="${k}" class="${k===sk?(sd>0?'asc':'desc'):''}">${k==='C'?CN[st.crime]:n}</th>`).join('');
 $('n-table').innerHTML=`<thead><tr>${head}</tr></thead><tbody>`+
  rows.map(o=>{const r=rr(o),q=quad(o);return `<tr data-iso="${o.iso}"><td>${o.name}${o.est?' <small class="muted">mod.</small>':''}</td><td><b style="color:${fInk(o.f.mean)}">${ffmt(o.f.mean)}</b></td><td class="muted">${ffmt(o.f.lo)} to ${ffmt(o.f.hi)}</td><td><span class="chip" style="background:${SC.col(r[0])}"></span><b style="color:${cInk(r[0])}">${cfmt(r[0])}</b></td><td class="muted">${cfmt(r[1])} to ${cfmt(r[2])}</td><td>${o.mig==null?'–':o.mig.toLocaleString('en-US')}</td><td><span class="chip" style="background:${qCol(q)}"></span>${QL[q]}</td></tr>`}).join('')+'</tbody>';
 $('n-table').querySelectorAll('th').forEach(th=>th.addEventListener('click',()=>{const k=th.dataset.k;st.sort=[k,st.sort[0]===k?-st.sort[1]:(k==='name'||k==='q'?1:-1)];table()}));
 $('n-table').querySelectorAll('tbody tr').forEach(r=>r.addEventListener('click',()=>{select(byIso[r.dataset.iso]);$('n-detail').scrollIntoView({behavior:'smooth',block:'center'})}));
}
$('n-tsearch').addEventListener('input',table);

// regions: stock-weighted mean fiscal score, stock-weighted geometric mean rate ratio
function regions(){
 const g={};O.forEach(o=>{if(!o.mig)return;const r=g[o.reg]||(g[o.reg]={n:0,m:0,F:0,L:0});r.n++;r.m+=o.mig;r.F+=o.f.mean*o.mig;r.L+=Math.log(rr(o)[0])*o.mig});
 const all={n:0,m:0,F:0,L:0};Object.values(g).forEach(r=>{for(const k in all)all[k]+=r[k]});
 const val=(r,k)=>k==='m'?r.m:k==='n'?r.n:k==='F'?r.F/r.m:Math.exp(r.L/r.m);
 const rows=Object.entries(g).map(([k,r])=>({name:REG[k],...r}));
 const [sk,sd]=st.regSort;rows.sort((x,y)=>sk==='name'?sd*x.name.localeCompare(y.name):sd*(val(x,sk)-val(y,sk)));
 const tr=(r,cls)=>{const f=val(r,'F'),c=val(r,'C');return `<tr class="${cls||''}"><td>${r.name}</td><td>${r.n}</td><td>${r.m.toLocaleString('en-US')}</td><td><b style="color:${fInk(f)}">${ffmt(f)}</b></td><td><span class="chip" style="background:${SC.col(c)}"></span><b style="color:${cInk(c)}">${cfmt(c)}</b></td></tr>`};
 const H=[['name','Region'],['n','Origins'],['m','Immigrants'],['F','Fiscal'],['C',CN[st.crime]]];
 $('n-reg').innerHTML=`<thead><tr>${H.map(([k,n])=>`<th data-k="${k}" class="${k===sk?(sd>0?'asc':'desc'):''}">${n}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>tr(r)).join('')}${tr({name:'All',...all},'sum')}</tbody>`;
 $('n-reg').querySelectorAll('th').forEach(th=>th.addEventListener('click',()=>{const k=th.dataset.k;st.regSort=[k,st.regSort[0]===k?-st.regSort[1]:(k==='name'?1:-1)];regions()}));
}

function render(){scatter();table();regions();if(st.sel)detail(byIso[st.sel]);document.querySelectorAll('.n-unitlab').forEach(e=>e.textContent=fUnit())}
let drawn=false;
window.NETTAB={show(){if(!drawn){crimeSeg();st.sel='MAR';render();drawn=true}}};
let rt;addEventListener('resize',()=>{if(!drawn||$('tab-net').hidden)return;clearTimeout(rt);rt=setTimeout(scatter,150)});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(drawn)render()});
})();
