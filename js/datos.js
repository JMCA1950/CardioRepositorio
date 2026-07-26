
'use strict';
const STORAGE_KEY='cardioRegistro_v3';
const LEGACY_KEYS=['cardioRegistro_prueba3','cardioRegistro_v25_rc1'];
const MAX_READINGS=30;
const defaultState=()=>({version:'3.0.1',activePatient:'jose',patients:{jose:{name:'José María',note:'',medications:[],readings:[]},susana:{name:'Susana',note:'',medications:[],readings:[]}},diagnostics:[]});
function migrate(x){
 if(!x||!x.patients)throw Error('El archivo no contiene pacientes');
 if(x.patients.jose&&x.patients.susana){
  ['jose','susana'].forEach(k=>{const p=x.patients[k];p.name=p.name||k;p.note=p.note||'';p.readings=Array.isArray(p.readings)?p.readings:[];p.medications=(p.medications||[]).map(m=>({id:m.id||uid('med'),name:m.name||'',dose:m.dose||'',times:m.times||m.time||'',notes:m.notes||''}))});
  x.activePatient=['jose','susana'].includes(x.activePatient)?x.activePatient:'jose';x.diagnostics=Array.isArray(x.diagnostics)?x.diagnostics:[];x.version='3.0.1';return x;
 }
 if(x.patients.p1&&x.patients.p2){
  const cv=(p,n)=>({name:p.name||n,note:'',readings:(p.measurements||[]).map(r=>({id:r.id||uid('read'),date:r.date||'',time:r.time||'',sys:+r.sys,dia:+r.dia,pulse:+r.pulse,medRelation:'',notes:r.notes||''})),medications:(p.medications||[]).map(m=>({id:m.id||uid('med'),name:m.name||'',dose:m.dose||'',times:m.times||m.time||'',notes:m.notes||''}))});
  return{version:'3.0.1',activePatient:x.currentPatient==='p1'?'susana':'jose',patients:{susana:cv(x.patients.p1,'Susana'),jose:cv(x.patients.p2,'José María')},diagnostics:[{at:new Date().toISOString(),action:'migracion_v2',detail:'Datos históricos incorporados'}]};
 }
 throw Error('Formato de respaldo no reconocido');
}
function loadState(){
 try{
  const own=localStorage.getItem(STORAGE_KEY);if(own)return migrate(JSON.parse(own));
  for(const key of LEGACY_KEYS){const raw=localStorage.getItem(key);if(raw){const x=migrate(JSON.parse(raw));localStorage.setItem(STORAGE_KEY,JSON.stringify(x));return x}}
  if(window.CARDIO_BACKUP_INICIAL){const x=migrate(window.CARDIO_BACKUP_INICIAL);localStorage.setItem(STORAGE_KEY,JSON.stringify(x));return x}
 }catch(e){console.error(e)}
 return defaultState();
}
let state=loadState();
const patient=()=>state.patients[state.activePatient];
function log(action,detail=''){state.diagnostics.push({at:new Date().toISOString(),action,detail});state.diagnostics=state.diagnostics.slice(-200)}
function save(msg=''){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));if(msg)toast(msg)}catch(e){alert('No se pudo guardar en el navegador. Descargue un respaldo.');log('error_guardado',e.message)}}
