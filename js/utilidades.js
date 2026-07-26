
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
const localNow=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return{date:`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`,time:`${p(d.getHours())}:${p(d.getMinutes())}`}};
const stamp=r=>new Date(`${r.date}T${r.time||'00:00'}`).getTime();
const fmtDate=iso=>{if(!iso)return'';const[y,m,d]=iso.split('-');return`${d}/${m}/${y}`};
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2600)}
function download(name,text,type='text/plain'){const b=new Blob([text],{type}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
