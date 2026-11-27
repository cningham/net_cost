// Temperature-style scale: dark blue (favourable) -> blue -> green -> yellow -> orange -> red -> dark red (unfavourable).
// Each tab anchors the nine colours on real values, so steps across the data range stay distinct. No grey.
(function(){
const LIGHT=['#1f4e9c','#3a86c8','#2e9b4b','#8fc456','#f1d13f','#f5a03a','#ea6a2f','#d1342f','#8e1a1a'];
const DARK =['#4a7fd4','#5aa8e6','#3cb25c','#9fd065','#f3d651','#f7a94c','#ef7840','#e04a42','#b83030'];
// Red-to-green variant (no blue), best -> worst
const RG_LIGHT=['#1e7b3a','#3f9e46','#78bb4f','#b5cf4a','#f1d13f','#f5a03a','#ea6a2f','#d1342f','#8e1a1a'];
const RG_DARK =['#2f9a4c','#4fb257','#88c85e','#c2da5a','#f3d651','#f7a94c','#ef7840','#e04a42','#b83030'];
const dark=()=>matchMedia('(prefers-color-scheme: dark)').matches;
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const toHex=a=>'#'+a.map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
const lum=c=>{const l=c.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*l[0]+.7152*l[1]+.0722*l[2]};
// anchors: 9 values in ascending order; good: 'low' if low values are favourable (crime), 'high' if high values are (fiscal); log: interpolate in log space; set: 'rg' for red-to-green only
window.PAL={scale(anchors,good,log,set){
 const f=log?Math.log:x=>x, A=anchors.map(f);
 const stops=()=>{const S=(set==='rg'?(dark()?RG_DARK:RG_LIGHT):(dark()?DARK:LIGHT)).map(hex);return good==='low'?S:S.slice().reverse()};
 function rgb(v){const S=stops(),x=f(v);if(x<=A[0])return S[0];if(x>=A[8])return S[8];let i=0;while(x>A[i+1])i++;const k=(x-A[i])/(A[i+1]-A[i]);return S[i].map((c,j)=>c+(S[i+1][j]-c)*k)}
 return {
  col:v=>toHex(rgb(v)),
  ink:v=>{const c=rgb(v);if(dark())return toHex(c);const L=lum(c),k=L>.45?.55:L>.25?.72:1;return toHex(c.map(x=>x*k))},
  text:v=>lum(rgb(v))>.3?'#191919':'#ffffff',
  // segmented bar: equal-width segments between anchors, value labels at each boundary
  bar:(fmt)=>{const S=stops().map(toHex);return `<div class="tbar">${S.slice(0,8).map((c,i)=>`<b style="background:linear-gradient(90deg,${c},${S[i+1]})"></b>`).join('')}</div><div class="tlab">${anchors.map((a,i)=>`<span style="left:${i/8*100}%">${fmt(a)}</span>`).join('')}</div>`}
 }}};
})();
