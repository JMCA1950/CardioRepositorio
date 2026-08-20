
'use strict';
const STORAGE_KEY='cardioRegistro_v33_dev09';
const SETUP_KEY='cardioRegistro_v33_dev09_setup_complete';
const LEGACY_KEYS=['cardioRegistro_v33_dev08','cardioRegistro_v33_dev07','cardioRegistro_v33_dev06','cardioRegistro_v33_dev05','cardioRegistro_v33_dev04','cardioRegistro_v33_dev03','cardioRegistro_v33_dev01','cardioRegistro_v32_dev01','cardioRegistro_v3','cardioRegistro_prueba3','cardioRegistro_v25_rc1'];
const LEGACY_SETUP_KEYS=['cardioRegistro_v33_dev08_setup_complete','cardioRegistro_v33_dev07_setup_complete','cardioRegistro_v33_dev06_setup_complete','cardioRegistro_v33_dev05_setup_complete','cardioRegistro_v33_dev04_setup_complete','cardioRegistro_v33_dev03_setup_complete','cardioRegistro_v33_dev01_setup_complete','cardioRegistro_v32_dev01_setup_complete'];
const MAX_READINGS=30;
const emptyPatient=(name='Paciente 1')=>({name,note:'',medications:[],readings:[],medicationPeriod:{startReadingId:'',endReadingId:''}});
const defaultState=()=>({version:'3.3-desarrollo-09',activePatient:'p1',patients:{p1:emptyPatient('Paciente 1')},diagnostics:[]});
function normalizePatient(p={},fallback='Paciente'){
 return {
  name:p.name||fallback,
  note:p.note||'',
  readings:Array.isArray(p.readings)?p.readings:(p.measurements||[]).map(r=>({id:r.id||uid('read'),date:r.date||'',time:r.time||'',sys:+r.sys,dia:+r.dia,pulse:+r.pulse,medRelation:r.medRelation||'',notes:r.notes||''})),
  medications:(p.medications||[]).map(m=>({id:m.id||uid('med'),name:m.name||'',dose:m.dose||'',times:m.times||m.time||'',notes:m.notes||''})),
  medicationPeriod:{startReadingId:(p.medicationPeriod&&p.medicationPeriod.startReadingId)||'',endReadingId:(p.medicationPeriod&&p.medicationPeriod.endReadingId)||''}
 };
}
function migrate(x){
 if(!x||!x.patients||typeof x.patients!=='object')throw Error('El archivo no contiene pacientes');
 // Formato histórico p1/p2.
 if(x.patients.p1&&x.patients.p2&&('measurements' in x.patients.p1||'measurements' in x.patients.p2)){
  x={version:'3.3-desarrollo-09',activePatient:x.currentPatient==='p1'?'susana':'jose',patients:{susana:normalizePatient(x.patients.p1,'Susana'),jose:normalizePatient(x.patients.p2,'José María')},diagnostics:[{at:new Date().toISOString(),action:'migracion_v2',detail:'Datos históricos incorporados'}]};
 }else{
  const normalized={};
  Object.entries(x.patients).forEach(([k,p],i)=>normalized[k]=normalizePatient(p,`Paciente ${i+1}`));
  if(!Object.keys(normalized).length)normalized.p1=emptyPatient('Paciente 1');
  x.patients=normalized;
  x.activePatient=x.activePatient&&x.patients[x.activePatient]?x.activePatient:Object.keys(x.patients)[0];
  x.diagnostics=Array.isArray(x.diagnostics)?x.diagnostics:[];
  x.version='3.3-desarrollo-09';
 }
 return x;
}
function loadState(){
 try{
  const own=localStorage.getItem(STORAGE_KEY);if(own)return migrate(JSON.parse(own));
  for(const key of LEGACY_KEYS){const raw=localStorage.getItem(key);if(raw){const x=migrate(JSON.parse(raw));localStorage.setItem(STORAGE_KEY,JSON.stringify(x));return x}}
 }catch(e){console.error(e)}
 return defaultState();
}
let state=loadState();
const patient=()=>state.patients[state.activePatient];
function log(action,detail=''){state.diagnostics.push({at:new Date().toISOString(),action,detail});state.diagnostics=state.diagnostics.slice(-200)}
function save(msg=''){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));if(msg)toast(msg)}catch(e){alert('No se pudo guardar en el navegador. Descargue un respaldo.');log('error_guardado',e.message)}}

function hasCompletedSetup(){if(localStorage.getItem(SETUP_KEY)==='1')return true;for(const key of LEGACY_SETUP_KEYS){if(localStorage.getItem(key)==='1'){localStorage.setItem(SETUP_KEY,'1');return true}}return false}
function markSetupComplete(){localStorage.setItem(SETUP_KEY,'1')}
function clearApplicationData(){
 localStorage.removeItem(STORAGE_KEY);
 LEGACY_KEYS.forEach(k=>localStorage.removeItem(k));
 localStorage.removeItem(SETUP_KEY);
}
function createDemoState(){
 const source=window.CARDIO_BACKUP_INICIAL;
 if(!source)throw Error('No se encontraron los datos de demostración.');
 const copy=JSON.parse(JSON.stringify(source));
 const demo=migrate(copy);
 const keys=Object.keys(demo.patients);
 if(keys[0])demo.patients[keys[0]].name='MARÍA';
 if(keys[1])demo.patients[keys[1]].name='JUAN';
 demo.version='3.3-desarrollo-09';
 return demo;
}
