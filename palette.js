// Continuous green (favourable) -> red (unfavourable) scale, no grey. t in [0,1].
(function(){
const LIGHT=['#17753a','#3a9e4f','#86bb45','#d9b92c','#ec8a34','#d9473a','#a11f1f'];
const DARK=['#2f9e57','#4fb662','#97c955','#e3c443','#f0954a','#e65a4c','#c13a33'];
const dark=()=>matchMedia('(prefers-color-scheme: dark)').matches;
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const toHex=a=>'#'+a.map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
function rgb(t){const S=(dark()?DARK:LIGHT).map(hex);t=Math.max(0,Math.min(1,t));const x=t*(S.length-1),i=Math.min(S.length-2,Math.floor(x)),f=x-i;return S[i].map((v,k)=>v+(S[i+1][k]-v)*f)}
const lum=c=>{const l=c.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*l[0]+.7152*l[1]+.0722*l[2]};
window.PAL={
 col:t=>toHex(rgb(t)),
 // text/ink colour: darken in light mode so the yellow middle stays legible on white
 ink:t=>{const c=rgb(t);if(dark())return toHex(c);const L=lum(c),k=L>.3?.62:L>.18?.8:1;return toHex(c.map(v=>v*k))},
 textOn:t=>lum(rgb(t))>.33?'#191919':'#ffffff',
 grad:(rev)=>{const S=(dark()?DARK:LIGHT).slice();if(rev)S.reverse();return 'linear-gradient(90deg,'+S.join(',')+')'}
};
})();
