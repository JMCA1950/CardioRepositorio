
'use strict';
function sortedReadings(){return[...patient().readings].sort((a,b)=>stamp(b)-stamp(a))}
function resetForms(){medForm.reset();medId.value='';readingForm.reset();readingId.value='';const n=localNow();readingDate.value=n.date;readingTime.value=n.time;if($('readingPatient'))readingPatient.value=state.activePatient}
function refreshCurrentDateTime(){if(readingId.value||sys.value||dia.value||pulse.value||readingNotes.value)return;const n=localNow();readingDate.value=n.date;readingTime.value=n.time}
addEventListener('pageshow',()=>refreshCurrentDateTime());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshCurrentDateTime()});
function renderProfiles(){const entries=Object.entries(state.patients);patientSwitch.innerHTML=entries.map(([k,p])=>`<button class="patient-button ${k===state.activePatient?'active':''}" data-p="${k}"><strong class="patient-name">${esc(p.name)}</strong></button>`).join('');patientSwitch.classList.toggle('single-patient',entries.length===1);if($('readingPatient')){readingPatient.innerHTML=entries.map(([k,p])=>`<option value="${k}">${esc(p.name)}</option>`).join('');readingPatient.value=state.activePatient;readingPatient.closest('div').hidden=entries.length===1}if($('removePatientBtn'))removePatientBtn.disabled=entries.length===1;document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{state.activePatient=b.dataset.p;save();resetForms();renderAll()})}
function renderPatient(){patientName.value=patient().name;patientNote.value=patient().note||''}
function renderPatientContexts(){const name=patient().name||'Paciente';document.querySelectorAll('[data-patient-context]').forEach(el=>{el.textContent=`— ${name}`;el.setAttribute('aria-label',`Paciente: ${name}`)})}
function renderMeds(){medRows.innerHTML=patient().medications.length?patient().medications.map(m=>`<tr><td>${esc(m.name)}</td><td>${esc(m.dose)}</td><td>${esc(m.times)}</td><td>${esc(m.notes)}</td><td class="no-print"><button class="small" data-me="${m.id}">Editar</button> <button class="small danger" data-md="${m.id}">Eliminar</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty">No hay medicamentos registrados.</td></tr>';document.querySelectorAll('[data-me]').forEach(b=>b.onclick=()=>editMed(b.dataset.me));document.querySelectorAll('[data-md]').forEach(b=>b.onclick=()=>deleteMed(b.dataset.md))}
function medicationPeriod(){
 const p=patient();
 p.medicationPeriod=p.medicationPeriod||{startReadingId:'',endReadingId:''};
 return p.medicationPeriod;
}
function periodReading(id){return id?patient().readings.find(r=>r.id===id):null}
function periodBuckets(){
 const cfg=medicationPeriod(),start=periodReading(cfg.startReadingId),end=periodReading(cfg.endReadingId);
 if(!start)return{start:null,end:null,before:[],during:[],after:[]};
 const startStamp=stamp(start),endStamp=end?stamp(end):Infinity;
 // V3.3 Desarrollo 05: la comparación por cambio de medicación se rige por las fechas de sectorización,
 // independientemente del período elegido para Estadísticas y el gráfico.
 const chron=[...patient().readings].sort((a,b)=>stamp(a)-stamp(b));
 return{
  start,end,
  before:chron.filter(r=>stamp(r)<startStamp),
  during:chron.filter(r=>stamp(r)>=startStamp&&stamp(r)<=endStamp),
  after:end?chron.filter(r=>stamp(r)>endStamp):[]
 };
}
function summaryStats(arr){
 const min=k=>arr.length?Math.min(...arr.map(x=>+x[k])):'—',max=k=>arr.length?Math.max(...arr.map(x=>+x[k])):'—';
 const last=arr[arr.length-1];
 return[['Mediciones',arr.length],['Promedio sistólica',avg(arr,'sys')],['Promedio diastólica',avg(arr,'dia')],['Promedio pulso',avg(arr,'pulse')],['Rango sistólica',arr.length?`${min('sys')}–${max('sys')}`:'—'],['Última toma',last?`${last.sys}/${last.dia}`:'—']];
}
function statsBlock(title,subtitle,arr,kind=''){
 return`<section class="period-block ${kind}"><h3>${esc(title)}</h3><p class="muted">${esc(subtitle)}</p><div class="period-stats">${summaryStats(arr).map(([k,v])=>`<div class="stat"><span class="muted">${k}</span><b>${v}</b></div>`).join('')}</div></section>`;
}
function renderPeriodComparison(){
 const box=$('periodComparison'),clear=$('clearMedicationPeriodBtn'),cfg=medicationPeriod(),b=periodBuckets();
 if(!b.start){box.hidden=true;box.innerHTML='';clear.hidden=true;return}
 clear.hidden=false;box.hidden=false;
 const startLabel=`Registros anteriores al ${fmtDate(b.start.date)} ${b.start.time||''}`.trim();
 const duringLabel=b.end?`${fmtDate(b.start.date)} ${b.start.time||''} a ${fmtDate(b.end.date)} ${b.end.time||''}`:`Desde ${fmtDate(b.start.date)} ${b.start.time||''}`;
 const ds=avg(b.during,'sys')==='—'||avg(b.before,'sys')==='—'?'—':avg(b.during,'sys')-avg(b.before,'sys');
 const dd=avg(b.during,'dia')==='—'||avg(b.before,'dia')==='—'?'—':avg(b.during,'dia')-avg(b.before,'dia');
 const dp=avg(b.during,'pulse')==='—'||avg(b.before,'pulse')==='—'?'—':avg(b.during,'pulse')-avg(b.before,'pulse');
 const sign=v=>v==='—'?'—':`${v>0?'+':''}${v}`;
 box.innerHTML=`<div class="period-comparison-title"><strong>Comparación descriptiva por cambio de medicación <em class="comparison-patient">— ${esc(patient().name)}</em></strong><span>Según fechas del cambio</span></div><div class="period-blocks">${statsBlock('Antes del cambio',startLabel,b.before)}${statsBlock(b.end?'Durante el cambio':'Desde el cambio',duringLabel,b.during,'active-period')}</div><div class="difference-strip"><strong>Diferencias de promedios</strong><span>Sistólica: <b>${sign(ds)} mmHg</b></span><span>Diastólica: <b>${sign(dd)} mmHg</b></span><span>Pulso: <b>${sign(dp)} lpm</b></span></div>${b.after.length?`<p class="period-note">Hay ${b.after.length} medición${b.after.length===1?'':'es'} posterior${b.after.length===1?'':'es'} a la fecha de finalización. Se muestran en la tabla, pero no se incluyen en esta comparación.</p>`:''}<p class="period-note"><strong>CardioRegistro muestra diferencias entre períodos. La interpretación clínica corresponde al médico.</strong></p>`;
}
function setPeriodStart(id){
 const r=periodReading(id);if(!r)return;
 if(!confirm(`¿Marcar la medición del ${fmtDate(r.date)} a las ${r.time} como inicio del cambio de medicación?`))return;
 const cfg=medicationPeriod();cfg.startReadingId=id;
 if(cfg.endReadingId){const end=periodReading(cfg.endReadingId);if(!end||stamp(end)<stamp(r))cfg.endReadingId='';}
 log('inicio_cambio_medicacion',`${r.date} ${r.time}`);save('Inicio del cambio marcado');renderAll();
}
function setPeriodEnd(id){
 const r=periodReading(id),cfg=medicationPeriod(),start=periodReading(cfg.startReadingId);if(!r)return;
 if(!start)return alert('Primero marque el inicio del cambio de medicación.');
 if(stamp(r)<stamp(start))return alert('La finalización no puede ser anterior al inicio del cambio.');
 if(!confirm(`¿Marcar la medición del ${fmtDate(r.date)} a las ${r.time} como finalización del período de cambio?`))return;
 cfg.endReadingId=id;log('fin_cambio_medicacion',`${r.date} ${r.time}`);save('Finalización del cambio marcada');renderAll();
}
function clearMedicationPeriod(){
 if(!confirm('¿Quitar la sectorización por cambio de medicación? Las mediciones no se eliminarán.'))return;
 patient().medicationPeriod={startReadingId:'',endReadingId:''};log('quitar_sectorizacion');save('Sectorización quitada');renderAll();
}
function renderReadings(){
 const a=sortedReadings(),cfg=medicationPeriod(),b=periodBuckets();
 if(!a.length){readingRows.innerHTML='<tr><td colspan="8" class="empty">Todavía no hay mediciones.</td></tr>';renderPeriodComparison();return}
 let html='';
 a.forEach(r=>{
  const isStart=r.id===cfg.startReadingId,isEnd=r.id===cfg.endReadingId;
  if(isEnd&&b.end&&b.after.length)html+=`<tr class="period-divider end-divider"><td colspan="8">↓ Fin del cambio de medicación · ${fmtDate(r.date)} ${esc(r.time)}</td></tr>`;
  html+=`<tr class="${isStart?'marked-start ':''}${isEnd?'marked-end':''}"><td>${fmtDate(r.date)}</td><td>${esc(r.time)}</td><td><strong>${r.sys}</strong></td><td><strong>${r.dia}</strong></td><td>${r.pulse}</td><td>${esc(r.medRelation)}</td><td>${esc(r.notes)}</td><td class="no-print reading-actions"><div class="record-action-stack"><div class="record-edit-actions"><button class="small" data-re="${r.id}">Editar</button><button class="small danger" data-rd="${r.id}">Eliminar</button></div><div class="period-actions-row"><button class="small period-action" data-ps="${r.id}" ${isStart?'disabled':''}>Inicio cambio</button><button class="small period-action" data-pe="${r.id}" ${!cfg.startReadingId||isEnd?'disabled':''}>Fin cambio</button></div></div></td></tr>`;
  if(isStart)html+=`<tr class="period-divider start-divider"><td colspan="8">↑ Inicio del cambio de medicación · ${fmtDate(r.date)} ${esc(r.time)}</td></tr>`;
 });
 readingRows.innerHTML=html;
 document.querySelectorAll('[data-re]').forEach(btn=>btn.onclick=()=>editReading(btn.dataset.re));
 document.querySelectorAll('[data-rd]').forEach(btn=>btn.onclick=()=>deleteReading(btn.dataset.rd));
 document.querySelectorAll('[data-ps]').forEach(btn=>btn.onclick=()=>setPeriodStart(btn.dataset.ps));
 document.querySelectorAll('[data-pe]').forEach(btn=>btn.onclick=()=>setPeriodEnd(btn.dataset.pe));
 renderPeriodComparison();
}
function renderStats(){const a=filteredReadings(),last=a[a.length-1];periodLabel.textContent=a.length?`${fmtDate(a[0].date)} a ${fmtDate(last.date)}`:'Sin registros en el período';const min=(k)=>a.length?Math.min(...a.map(x=>+x[k])):'—',max=(k)=>a.length?Math.max(...a.map(x=>+x[k])):'—';stats.innerHTML=[['Mediciones',a.length],['Promedio sistólica',avg(a,'sys')],['Promedio diastólica',avg(a,'dia')],['Promedio pulso',avg(a,'pulse')],['Rango sistólica',a.length?`${min('sys')}–${max('sys')}`:'—'],['Última toma',last?`${last.sys}/${last.dia}`:'—']].map(([k,v])=>`<div class="stat"><span class="muted">${k}</span><b>${v}</b></div>`).join('');drawChart(a)}
function renderAll(){renderProfiles();renderPatient();renderPatientContexts();renderMeds();renderReadings();renderStats();renderPrintSummary()}

function patientPeriodBuckets(p){
 const cfg=p.medicationPeriod||{startReadingId:'',endReadingId:''};
 const start=cfg.startReadingId?p.readings.find(r=>r.id===cfg.startReadingId):null;
 const end=cfg.endReadingId?p.readings.find(r=>r.id===cfg.endReadingId):null;
 const chron=[...(p.readings||[])].sort((a,b)=>stamp(a)-stamp(b));
 if(!start)return{start:null,end:null,before:[],during:[],after:chron};
 const ss=stamp(start),es=end?stamp(end):Infinity;
 return{start,end,before:chron.filter(r=>stamp(r)<ss),during:chron.filter(r=>stamp(r)>=ss&&stamp(r)<=es),after:end?chron.filter(r=>stamp(r)>es):[]};
}
function compactStats(a){return{n:a.length,sys:avg(a,'sys'),dia:avg(a,'dia'),pulse:avg(a,'pulse')}}
function dateRangeFor(p){const a=[...(p.readings||[])].sort((x,y)=>stamp(x)-stamp(y));return a.length?`${fmtDate(a[0].date)} al ${fmtDate(a[a.length-1].date)}`:'Sin mediciones'}
function deltaText(from,to,label){
 if(!from.length||!to.length)return`${label}: sin datos suficientes para comparar.`;
 const d=(k)=>avg(to,k)-avg(from,k),fmt=v=>`${v>0?'+':''}${v}`;
 return`${label}: sistólica ${fmt(d('sys'))} mmHg; diastólica ${fmt(d('dia'))} mmHg; pulso ${fmt(d('pulse'))} lpm.`;
}
function miniPeriodRow(title,arr,dates,divider=false,closing=false){const x=compactStats(arr),style=[divider?'border-top:1.5px solid #7b8798!important;':'',closing?'border-bottom:1px solid #ccd3df!important;':''].join('');return`<tr><td class="summary-period-name" style="${style}"><strong>${esc(title)}</strong><small>${esc(dates)}</small></td><td style="${style}">${x.n}</td><td style="${style}">${x.sys}</td><td style="${style}">${x.dia}</td><td style="${style}">${x.pulse}</td></tr>`}
function patientPrintBlock(p){
 const all=[...(p.readings||[])].sort((a,b)=>stamp(a)-stamp(b)),overall=compactStats(all),b=patientPeriodBuckets(p);
 const beforeDates=b.start?`Hasta ${fmtDate(b.start.date)} ${b.start.time||''}`:'—';
 const duringDates=b.start?(b.end?`${fmtDate(b.start.date)} ${b.start.time||''} a ${fmtDate(b.end.date)} ${b.end.time||''}`:`Desde ${fmtDate(b.start.date)} ${b.start.time||''}`):'Sin sectorización';
 const afterDates=b.end?`Después de ${fmtDate(b.end.date)} ${b.end.time||''}`:'—';
 let compare='<p class="summary-no-period">No se definió un período de cambio de medicación para este paciente.</p>';
 if(b.start){
  const parts=[deltaText(b.before,b.during,'Antes → cambio')];
  if(b.end&&b.after.length)parts.push(deltaText(b.during,b.after,'Cambio → posterior'));
  compare=`<ul class="summary-deltas">${parts.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`;
 }
 return`<section class="summary-patient"><h3>${esc(p.name||'Paciente')}</h3><div class="summary-overall"><span><b>${all.length}</b> mediciones</span><span><b>${overall.sys}/${overall.dia}</b> promedio</span><span><b>${overall.pulse}</b> pulso promedio</span><span>${esc(dateRangeFor(p))}</span></div><table class="summary-period-table"><thead><tr><th>Período</th><th>Med.</th><th>Sist.</th><th>Diast.</th><th>Pulso</th></tr></thead><tbody>${miniPeriodRow('Antes del cambio',b.before,beforeDates,false,false)}${miniPeriodRow(b.end?'Durante el cambio':'Desde el cambio',b.during,duringDates,true,!b.end)}${b.end?miniPeriodRow('Posterior al cambio',b.after,afterDates,true,true):''}</tbody></table><h4>Comparación descriptiva</h4>${compare}</section>`;
}
function renderPrintSummary(){
 const box=$('printSummaryContent');if(!box)return;
 const pts=[patient()],now=new Date().toLocaleDateString('es-AR');
 box.innerHTML=`<header class="summary-print-head"><div><strong>CardioRegistro</strong><span>Registro domiciliario de presión arterial</span></div><div><h2>Resumen final de mediciones</h2><p>Paciente: ${esc(patient().name||'Paciente')}</p></div><div><span>Fecha del informe</span><b>${esc(now)}</b></div></header><div class="summary-patient-grid">${pts.map(patientPrintBlock).join('')}</div><div class="summary-print-note"><strong>Lectura descriptiva.</strong> Los valores muestran diferencias entre períodos y no constituyen diagnóstico ni recomendación terapéutica. La interpretación clínica corresponde al médico.</div><div class="summary-print-footer">© 2026 José María Condomí Alcorta. Todos los derechos reservados.<br>CardioRegistro V3.3 Estable — Desarrollado por José María Condomí Alcorta y Data (ChatGPT).</div>`;
}
patientName.onchange=e=>{patient().name=e.target.value.trim()||'Paciente';save('Nombre actualizado');renderAll()};patientNote.onchange=e=>{patient().note=e.target.value.trim();save('Observación actualizada')};
function nextPatientKey(){let i=1;while(state.patients[`p${i}`])i++;return`p${i}`}
if($('addPatientBtn'))addPatientBtn.onclick=()=>{const suggested=`Paciente ${Object.keys(state.patients).length+1}`,name=prompt('Nombre del nuevo paciente:',suggested);if(name===null)return;const clean=name.trim()||suggested,key=nextPatientKey();state.patients[key]=emptyPatient(clean);state.activePatient=key;log('agregar_paciente',clean);save('Paciente agregado');resetForms();renderAll()};
if($('removePatientBtn'))removePatientBtn.onclick=()=>{const keys=Object.keys(state.patients);if(keys.length<=1)return alert('CardioRegistro debe conservar al menos un paciente.');const p=patient(),name=p.name||'Paciente';if(!confirm(`¿Desea eliminar a ${name} y todos sus registros, medicación y sectorizaciones? Esta acción no puede deshacerse.\n\nSi desea conservar esos datos, guarde antes un respaldo.`))return;delete state.patients[state.activePatient];state.activePatient=Object.keys(state.patients)[0];log('eliminar_paciente',name);save('Paciente eliminado');resetForms();renderAll()};
medForm.onsubmit=e=>{e.preventDefault();const o={id:medId.value||uid('med'),name:medName.value.trim(),dose:medDose.value.trim(),times:medTimes.value.trim(),notes:medNotes.value.trim()},i=patient().medications.findIndex(x=>x.id===o.id);i>=0?patient().medications[i]=o:patient().medications.push(o);log(i>=0?'editar_medicamento':'agregar_medicamento',o.name);save('Medicamento guardado');resetForms();renderAll()};
function editMed(x){const m=patient().medications.find(v=>v.id===x);if(!m)return;medId.value=m.id;medName.value=m.name;medDose.value=m.dose;medTimes.value=m.times;medNotes.value=m.notes;medName.focus()}
function deleteMed(x){const m=patient().medications.find(v=>v.id===x);if(m&&confirm(`¿Eliminar ${m.name}?`)){patient().medications=patient().medications.filter(v=>v.id!==x);save('Medicamento eliminado');renderMeds()}}
cancelMed.onclick=resetForms;
if($('readingPatient'))readingPatient.onchange=e=>{state.activePatient=e.target.value;save();resetForms();renderAll()};
readingForm.onsubmit=e=>{e.preventDefault();const o={id:readingId.value||uid('read'),date:readingDate.value,time:readingTime.value,sys:+sys.value,dia:+dia.value,pulse:+pulse.value,medRelation:medRelation.value,notes:readingNotes.value.trim()};if(o.sys<=o.dia)return alert('La sistólica debe ser mayor que la diastólica.');const a=patient().readings,i=a.findIndex(x=>x.id===o.id);i>=0?a[i]=o:a.push(o);a.sort((x,y)=>stamp(x)-stamp(y));let removed=false;if(a.length>MAX_READINGS){a.shift();removed=true}log(i>=0?'editar_medicion':'agregar_medicion',`${o.date} ${o.sys}/${o.dia}`);save(removed?'Medición guardada; se eliminó la más antigua.':'Medición guardada');resetForms();renderAll()};
function editReading(x){const r=patient().readings.find(v=>v.id===x);if(!r)return;readingId.value=r.id;readingDate.value=r.date;readingTime.value=r.time;sys.value=r.sys;dia.value=r.dia;pulse.value=r.pulse;medRelation.value=r.medRelation||'';readingNotes.value=r.notes||'';readingDate.focus();scrollTo({top:readingForm.getBoundingClientRect().top+scrollY-20,behavior:'smooth'})}
function deleteReading(x){const r=patient().readings.find(v=>v.id===x);if(r&&confirm(`¿Eliminar la medición del ${fmtDate(r.date)}?`)){const cfg=medicationPeriod();if(cfg.startReadingId===x){cfg.startReadingId='';cfg.endReadingId=''}else if(cfg.endReadingId===x){cfg.endReadingId=''}patient().readings=patient().readings.filter(v=>v.id!==x);save('Medición eliminada');renderAll()}}
cancelReading.onclick=resetForms;rangeSelect.onchange=()=>{renderStats();renderPeriodComparison()};if($('clearMedicationPeriodBtn'))clearMedicationPeriodBtn.onclick=clearMedicationPeriod;addEventListener('resize',()=>drawChart(filteredReadings()));
backupBtn.onclick=()=>{save();download(`CardioRegistro_V3_respaldo_${localNow().date}.json`,JSON.stringify(state,null,2),'application/json');toast('El respaldo ha sido guardado correctamente.')};
restoreBtn.onclick=()=>restoreFile.click();restoreFile.onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const x=migrate(JSON.parse(await f.text()));if(confirm('¿Reemplazar los datos actuales por este respaldo?')){state=x;save('Respaldo recuperado');resetForms();renderAll()}}catch(err){alert('No se pudo recuperar: '+err.message)}finally{e.target.value=''}};
diagnosticBtn.onclick=()=>{log('informe_tecnico');save();download(`CardioRegistro_V3_3_Estable_informe_tecnico_${localNow().date}.txt`,['CardioRegistro V3.3 Estable — Informe técnico',`Fecha: ${new Date().toLocaleString('es-AR')}`,`Navegador: ${navigator.userAgent}`,`Paciente: ${patient().name}`,`Mediciones: ${patient().readings.length}`,`Medicamentos: ${patient().medications.length}`,'','Historial:',...state.diagnostics.map(x=>`${x.at} | ${x.action} | ${x.detail}`),'','Descripción del inconveniente:','................................................................'].join('\n'));toast('Informe técnico descargado')};
printBtn.onclick=()=>{log('imprimir_pdf',patient().name);save('La sesión fue guardada. Se abrirá la impresión/PDF.');setTimeout(()=>print(),350)};
function showModal(el){el.hidden=false;document.body.classList.add('modal-open')}
function hideModal(el){el.hidden=true;document.body.classList.remove('modal-open')}
if($('helpBtn')&&$('helpModal')&&$('closeHelpBtn')){helpBtn.onclick=()=>showModal(helpModal);closeHelpBtn.onclick=()=>hideModal(helpModal);helpModal.addEventListener('click',e=>{if(e.target===helpModal)hideModal(helpModal)});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!helpModal.hidden)hideModal(helpModal)})}
const CONTEXT_HELP={patient:{title:'Paciente/s',html:'<p>CardioRegistro puede utilizarse con una sola persona o con varias en el mismo dispositivo.</p><p>Use <strong>Agregar paciente</strong> sólo cuando lo necesite. Para quitar uno, selecciónelo y pulse <strong>Eliminar paciente</strong>. La eliminación borra sus mediciones, medicación y sectorizaciones, por lo que conviene guardar un respaldo si desea conservarlos.</p>'},reading:{title:'Nueva medición',html:'<p>Registre fecha, hora, presión sistólica, presión diastólica y frecuencia cardíaca. La relación con la medicación y las observaciones son opcionales.</p><p><strong>Antes de medir:</strong> permanezca sentado y en reposo unos 5 minutos, con espalda apoyada, pies en el suelo y brazo a la altura del corazón. Durante la medición permanezca quieto y no hable.</p><p>Siga siempre las indicaciones de su médico y las instrucciones de su tensiómetro.</p>'},medication:{title:'Medicación habitual',html:'<p>Registre aquí los medicamentos que toma habitualmente, indicando nombre, dosis y horario. Puede editarlos o eliminarlos cuando cambie el tratamiento.</p><p>Este registro es informativo: <strong>no modifique su medicación sin indicación del profesional tratante.</strong></p>'},print:{title:'Guardar e imprimir/PDF',html:'<p>Este botón guarda primero la sesión actual y luego abre la vista de impresión del navegador.</p><p>Desde esa ventana puede imprimir el informe o elegir <strong>Guardar como PDF</strong> si desea conservarlo en su dispositivo o enviarlo al médico.</p>'},backup:{title:'Guardar respaldo',html:'<p>Guarda una copia de seguridad de los datos del paciente activo en un archivo <strong>JSON</strong>.</p><p>Conviene usarlo antes de hacer cambios importantes, reiniciar la aplicación o trasladar la información a otro dispositivo.</p>'},restore:{title:'Recuperar respaldo',html:'<p>Permite volver a cargar en CardioRegistro un archivo de respaldo previamente guardado.</p><p>Use esta opción si desea recuperar datos anteriores o trasladar sus registros desde otro dispositivo.</p>'}};
function openContextHelp(topic){const h=CONTEXT_HELP[topic];if(!h)return;contextHelpTitle.textContent=h.title;contextHelpBody.innerHTML=h.html;showModal(contextHelpModal)}
document.querySelectorAll('[data-help-topic]').forEach(b=>b.onclick=()=>openContextHelp(b.dataset.helpTopic));
if($('closeContextHelpBtn'))closeContextHelpBtn.onclick=()=>hideModal(contextHelpModal);
if($('contextHelpModal'))contextHelpModal.addEventListener('click',e=>{if(e.target===contextHelpModal)hideModal(contextHelpModal)});
function beginWithDemo(){
 try{state=createDemoState();markSetupComplete();save();hideModal(welcomeModal);resetForms();renderAll();toast('Datos ficticios de demostración cargados.')}
 catch(e){alert(e.message)}
}
function beginEmpty(){
 state=defaultState();markSetupComplete();save();hideModal(welcomeModal);resetForms();renderAll();toast('Nueva base iniciada.');
}
demoStartBtn.onclick=beginWithDemo;
emptyStartBtn.onclick=beginEmpty;
resetAppBtn.onclick=()=>showModal(resetModal);
cancelResetBtn.onclick=()=>hideModal(resetModal);
confirmResetBtn.onclick=()=>{
 clearApplicationData();
 state=defaultState();
 hideModal(resetModal);
 resetForms();renderAll();
 showModal(welcomeModal);
};
resetModal.addEventListener('click',e=>{if(e.target===resetModal)hideModal(resetModal)});

resetForms();renderAll();
if(hasCompletedSetup()){
 log('inicio','CardioRegistro V3.3 Estable');save();
 setTimeout(()=>{const n=Object.values(state.patients).reduce((s,p)=>s+p.readings.length,0);if(n)toast(`CardioRegistro V3.3 Estable listo: ${n} mediciones cargadas.`)},450);
}else{
 showModal(welcomeModal);
}

const MERCADO_PAGO_ALIAS='jmcondomialcorta.mp';
if($('mercadoPagoAlias')&&MERCADO_PAGO_ALIAS){
 mercadoPagoAlias.textContent=MERCADO_PAGO_ALIAS;
 copyAliasBtn.disabled=false;
 aliasHint.textContent='';
 copyAliasBtn.onclick=async()=>{try{await navigator.clipboard.writeText(MERCADO_PAGO_ALIAS);toast('El alias fue copiado al portapapeles.')}catch(e){alert('No se pudo copiar automáticamente. Alias: '+MERCADO_PAGO_ALIAS)}};
}
