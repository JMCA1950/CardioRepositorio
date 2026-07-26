
'use strict';
function filteredReadings(){
 const all=[...patient().readings].sort((a,b)=>stamp(a)-stamp(b)),v=$('rangeSelect').value;
 if(v==='all')return all;const limit=Date.now()-Number(v)*86400000;return all.filter(r=>stamp(r)>=limit)
}
const avg=(a,k)=>a.length?Math.round(a.reduce((s,x)=>s+Number(x[k]||0),0)/a.length):'—';
function daily(arr){const m={};arr.forEach(r=>{m[r.date]??={date:r.date,sys:[],dia:[],pulse:[]};m[r.date].sys.push(+r.sys);m[r.date].dia.push(+r.dia);m[r.date].pulse.push(+r.pulse)});return Object.values(m).sort((a,b)=>a.date.localeCompare(b.date)).map(d=>({date:d.date,sys:Math.round(d.sys.reduce((a,b)=>a+b)/d.sys.length),dia:Math.round(d.dia.reduce((a,b)=>a+b)/d.dia.length),pulse:Math.round(d.pulse.reduce((a,b)=>a+b)/d.pulse.length)}))}
function rolling(s,k,i){const end=new Date(s[i].date+'T12:00:00'),start=new Date(end-6*86400000),v=s.filter((d,j)=>j<=i&&new Date(d.date+'T12:00:00')>=start).map(d=>+d[k]);return v.reduce((a,b)=>a+b,0)/v.length}
function drawChart(arr){
 const c=$('chart'),ctx=c.getContext('2d'),dpr=devicePixelRatio||1,r=c.getBoundingClientRect(),w=Math.max(320,r.width),h=Math.max(240,r.height);c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const d=daily(arr);if(!d.length){ctx.fillStyle='#667085';ctx.font='16px system-ui';ctx.textAlign='center';ctx.fillText('Sin datos para graficar',w/2,h/2);return}
 const p={l:48,r:20,t:24,b:44},pw=w-p.l-p.r,ph=h-p.t-p.b,vals=d.flatMap(x=>[x.sys,x.dia,x.pulse]);let lo=Math.max(20,Math.floor((Math.min(...vals)-15)/10)*10),hi=Math.ceil((Math.max(...vals)+15)/10)*10;if(hi-lo<60)hi=lo+60;
 const X=i=>p.l+(d.length===1?pw/2:i*pw/(d.length-1)),Y=v=>p.t+(hi-v)*ph/(hi-lo);ctx.strokeStyle='#d7deea';ctx.fillStyle='#667085';ctx.font='11px system-ui';ctx.textAlign='right';
 for(let i=0;i<=5;i++){let v=Math.round(lo+(hi-lo)*i/5),y=Y(v);ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.stroke();ctx.fillText(v,p.l-7,y+4)}
 const colors={sys:'#c62828',dia:'#2457c5',pulse:'#067647'};
 function line(k,dash=false){ctx.strokeStyle=colors[k];ctx.lineWidth=dash?2:2.4;ctx.setLineDash(dash?[6,5]:[]);ctx.beginPath();d.forEach((o,i)=>{let v=dash?rolling(d,k,i):o[k];i?ctx.lineTo(X(i),Y(v)):ctx.moveTo(X(i),Y(v))});ctx.stroke();ctx.setLineDash([])}
 line('sys');line('dia');line('pulse');line('sys',true);line('dia',true);
 ctx.textAlign='center';const n=Math.min(d.length,6);for(let j=0;j<n;j++){const i=Math.round(j*(d.length-1)/Math.max(1,n-1));ctx.fillStyle='#667085';ctx.fillText(fmtDate(d[i].date).slice(0,5),X(i),h-18)}
}
