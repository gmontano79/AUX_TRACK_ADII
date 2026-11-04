(()=>{'use strict';
const CFG=window.HOURS_CONFIG;
const AUX10=window.AUX10_INDEX||{codes:[],pages:[]};
// ADII only: official mission codes, never Nichole's custom worksheet categories.
const K='aux_track_adii_v0_1';const $=id=>document.getElementById(id);let entries=[];let editing=null;let currentView='dashboard';
try{const saved=JSON.parse(localStorage.getItem(K)||'[]');if(Array.isArray(saved))entries=saved}catch(e){alert('Saved records could not be read. Do not clear browser data; restore from a JSON backup.');}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sheetInfo=n=>CFG.sheets.find(s=>s.name===n);const durationLabel=m=>`${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`;
const fmtDate=s=>{if(!s)return '';const [y,m,d]=s.split('-');return `${m}/${d}/${y}`};
const total=(list,field)=>list.reduce((s,e)=>s+(+e[field]||0),0);
const durFromTimes=(a,b)=>{if(!a||!b)return null;let [ah,am]=a.split(':').map(Number),[bh,bm]=b.split(':').map(Number);let n=bh*60+bm-ah*60-am;return n<0?n+1440:n};
function toast(message,error=false){$('notice').textContent=message;$('notice').className='notice'+(error?' error':'');window.scrollTo({top:0,behavior:'smooth'})}
const store=()=>{try{localStorage.setItem(K,JSON.stringify(entries));return true}catch(e){toast('Unable to save to local storage. Download a backup and check storage space.',true);return false}};
function show(view){currentView=view;document.querySelectorAll('.view').forEach(el=>el.classList.toggle('hidden',el.id!==view));document.querySelectorAll('.nav').forEach(el=>el.classList.toggle('active',el.dataset.view===view));const titles={dashboard:['AUX TRACK ADII Dashboard','Track now. Enter into AUXDATA II when convenient.'],records:['Activity Records','Your personal log, organized by official mission code.'],report:['Export Reports','Export an AUXDATA II mission-code workbook or printable PDF.'],settings:['Backup & Settings','Protect your local activity log.'],codes:['Activity Codes · AUX10','Search mission codes and the original AUX10 reference.']};$('pageTitle').textContent=titles[view][0];$('pageSubtitle').textContent=titles[view][1];$('notice').classList.add('hidden');document.querySelectorAll('.bottom-nav button[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===view));render()}
const isImported=e=>Boolean(e?.sourceId||e?.source==='AUXDATA II'||String(e?.id||'').startsWith('auxdata:'));
const isLocked=e=>isImported(e)||e?.status==='reported';
const sorted=list=>[...list].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||(Number(b.created)||0)-(Number(a.created)||0));
function dashboardSelection(){
 const status=$('dashboardStatus').value, period=$('dashboardPeriod').value, now=new Date(), local=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
 const year=local.slice(0,4),month=local.slice(0,7);const from=$('dashboardFrom').value,to=$('dashboardTo').value;
 return entries.filter(e=>(!status||e.status===status)&&(period==='all'||(period==='year'&&e.date?.startsWith(year))||(period==='month'&&e.date?.startsWith(month))||(period==='custom'&&(!from||e.date>=from)&&(!to||e.date<=to))));
}
function render(){
 const year=String(new Date().getFullYear()), allYear=entries.filter(e=>e.date?.startsWith(year));
 $('mHours').textContent=(total(allYear,'minutes')/60).toFixed(1)+' hrs';
 $('mPending').textContent=(total(allYear.filter(e=>e.status!=='reported'),'minutes')/60).toFixed(1)+' hrs';
 $('mReported').textContent=(total(allYear.filter(e=>e.status==='reported'),'minutes')/60).toFixed(1)+' hrs';
 $('mMiles').textContent=total(entries,'miles').toFixed(1);
 const subset=dashboardSelection();$('dashboardCustom').classList.toggle('hidden',$('dashboardPeriod').value!=='custom');
 $('dashboardFilterSummary').textContent=`Showing ${subset.length} activities · ${durationLabel(total(subset,'minutes'))} hours. Historical YTD cards above remain unchanged.`;
 const recent=sorted(subset).slice(0,7);
 $('recent').innerHTML=recent.length?recent.map(e=>`<div class="activity"><div><strong>${esc(e.description)}</strong><small>${esc(e.sheet)} · ${fmtDate(e.date)} · ${e.status==='reported'?'Entered':'Pending'}</small></div><b>${durationLabel(e.minutes)}</b></div>`).join(''):'<div class="empty">No activities match these filters.</div>';
 const map=new Map();for(const e of subset){const code=e.missionCode||e.sheet||'UNASSIGNED';map.set(code,(map.get(code)||0)+Number(e.minutes||0))}
 const groups=[...map].map(([name,min])=>({name,min,label:sheetInfo(name)?.label||name})).filter(x=>x.min>0).sort((a,b)=>b.min-a.min).slice(0,9),max=groups[0]?.min||1;
 $('breakdown').innerHTML=groups.length?groups.map(s=>`<div class="breakdown-item"><div class="line"><span>${esc(s.name)} · ${esc(s.label.slice(0,35))}</span><strong>${durationLabel(s.min)}</strong></div><div class="progress"><i style="width:${100*s.min/max}%"></i></div></div>`).join(''):'<div class="empty">No matching mission hours.</div>';
 renderRecords();renderReportSummary();
}
const actionMarkup=e=>isImported(e)?'<span class="locked-note">AUXDATA II · Read only</span>':e.status==='reported'?`<button data-toggle="${esc(e.id)}">Undo to Pending</button>`:`<button data-edit="${esc(e.id)}">Edit</button><button data-toggle="${esc(e.id)}">Mark entered</button><button class="danger" data-delete="${esc(e.id)}">Delete</button>`;
function renderRecords(){
 const q=$('search').value.trim().toLowerCase(),sh=$('filterSheet').value,st=$('filterStatus').value,from=$('recordsFrom').value,to=$('recordsTo').value;
 const set=sorted(entries.filter(e=>(!sh||e.sheet===sh)&&(!st||e.status===st)&&(!from||e.date>=from)&&(!to||e.date<=to)&&(`${e.description} ${e.sheet} ${e.travel||''} ${e.sourceId||''}`.toLowerCase().includes(q))));
 $('recordCount').textContent=`${set.length} matching activities · ${durationLabel(total(set,'minutes'))} hours`;
 $('entriesTable').innerHTML=set.length?set.map(e=>`<tr><td>${fmtDate(e.date)}</td><td><strong>${esc(e.sheet)}</strong><div class="muted">${esc((sheetInfo(e.sheet)?.label||'').slice(0,40))}</div></td><td>${esc(e.description)}${e.travel?`<div class="muted">Travel: ${esc(e.travel)}</div>`:''}</td><td><b>${durationLabel(e.minutes)}</b><div class="muted">${esc(e.start||'')} ${e.end?'– '+esc(e.end):''}</div></td><td>${e.miles?Number(e.miles).toFixed(1):'—'}</td><td><span class="pill ${e.status}">${e.status==='reported'?'Entered':'Pending'}</span></td><td><div class="row-actions">${actionMarkup(e)}</div></td></tr>`).join(''):'<tr><td colspan="7" class="empty">No matching activity records</td></tr>';
 $('mobileRecordCards').innerHTML=set.length?set.map(e=>`<article class="record-card"><div class="record-card-head"><div><strong>${esc(e.sheet)}</strong><span class="record-date">${fmtDate(e.date)}</span></div><span class="pill ${e.status}">${e.status==='reported'?'Entered':'Pending'}</span></div><div class="record-description">${esc(e.description)}</div><div class="record-card-meta"><strong>${durationLabel(e.minutes)}</strong>${e.miles?`<span>${Number(e.miles).toFixed(1)} miles</span>`:''}${e.sourceId?`<small>MA: ${esc(e.sourceId)}</small>`:''}</div><div class="record-card-actions">${isImported(e)?'<span class="locked-note">AUXDATA II · Read only</span>':`<details><summary>Actions</summary><div class="record-action-list">${actionMarkup(e)}</div></details>`}</div></article>`).join(''):'<div class="empty">No matching activity records</div>';
}
function reportSelection(){const from=$('reportFrom').value,to=$('reportTo').value,sh=$('reportSheet').value,st=$('reportStatus').value;return entries.filter(e=>(!from||e.date>=from)&&(!to||e.date<=to)&&(!sh||e.sheet===sh)&&(!st||e.status===st)).sort((a,b)=>a.date.localeCompare(b.date)||a.created-b.created)}
function renderReportSummary(){const list=reportSelection();$('reportSummary').textContent=`${list.length} records   •   ${durationLabel(total(list,'minutes'))} total hours   •   ${total(list,'miles').toFixed(1)} miles`}
const fillSelect=id=>{$(id).innerHTML+=[...CFG.sheets].map(s=>`<option value="${esc(s.name)}">${esc(s.name)} — ${esc(s.label.slice(0,65))}</option>`).join('')};fillSelect('sheetInput');fillSelect('filterSheet');fillSelect('reportSheet');
const openForm=id=>{editing=id||null;const e=entries.find(x=>x.id===id);if(id&&(!e||isLocked(e))){toast('Confirmed activities are read-only. Return a manually entered record to Pending before editing.',true);return;}$('entryForm').reset();$('dialogTitle').textContent=e?'Edit Activity':'Log Activity';$('dateInput').value=e?.date||new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);$('sheetInput').value=e?.sheet||'99A';$('startInput').value=e?.start||'';$('endInput').value=e?.end||'';$('durationInput').value=e?durationLabel(e.minutes):'';$('milesInput').value=e?.miles??'';$('travelInput').value=e?.travel||'';$('descInput').value=e?.description||'';$('statusInput').value=e?.status||'pending';$('urlInput').value=e?.url||'';$('urlLabel').classList.toggle('hidden',$('sheetInput').value!=='10H');$('entryDialog').showModal()};
$('entryForm').addEventListener('submit',event=>{event.preventDefault();if(editing&&isLocked(entries.find(e=>e.id===editing))){toast('This activity is confirmed and cannot be edited.',true);return;}const start=$('startInput').value,end=$('endInput').value;const manual=$('durationInput').value.trim();const m=manual?(/^(\d+):([0-5]\d)$/.test(manual)?Number(manual.split(':')[0])*60+Number(manual.split(':')[1]):NaN):durFromTimes(start,end);if(!Number.isInteger(m)||m<=0||m>1440){toast('Please enter a valid duration (HH:MM), or both start and end times. Duration must be greater than zero and at most 24 hours.',true);return}const data={id:editing||`${Date.now()}_${Math.random().toString(36).slice(2,8)}`,created:editing?(entries.find(e=>e.id===editing)?.created||Date.now()):Date.now(),date:$('dateInput').value,sheet:$('sheetInput').value,start,end,minutes:m,miles:Number($('milesInput').value)||0,travel:$('travelInput').value.trim(),description:$('descInput').value.trim(),status:$('statusInput').value,url:$('urlInput').value.trim()};if(!data.date||!data.description){toast('Date and description are required.',true);return}if(editing)entries=entries.map(e=>e.id===editing?data:e);else entries.push(data);if(!store())return;$('entryDialog').close();render();toast(editing?'Activity updated.':'Activity saved.');});
$('sheetInput').addEventListener('change',()=>$('urlLabel').classList.toggle('hidden',$('sheetInput').value!=='10H'));const autoTime=()=>{const m=durFromTimes($('startInput').value,$('endInput').value);if(m!==null)$('durationInput').value=durationLabel(m)};$('startInput').addEventListener('change',autoTime);$('endInput').addEventListener('change',autoTime);
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>show(b.dataset.view));$('newTop').onclick=$('newRecord').onclick=$('quickLog').onclick=$('mobileLog').onclick=()=>openForm();$('closeDialog').onclick=$('cancelDialog').onclick=()=>$('entryDialog').close();for(const id of ['search','filterSheet','filterStatus','recordsFrom','recordsTo'])$(id).addEventListener('input',renderRecords);for(const id of ['dashboardStatus','dashboardPeriod','dashboardFrom','dashboardTo'])$(id).addEventListener('change',render);$('dashboardReset').onclick=()=>{$('dashboardStatus').value='pending';$('dashboardPeriod').value='year';$('dashboardFrom').value='';$('dashboardTo').value='';render()};for(const id of ['reportFrom','reportTo','reportSheet','reportStatus'])$(id).addEventListener('input',renderReportSummary);
function handleRecordAction(ev){
 const b=ev.target.closest('button[data-edit],button[data-toggle],button[data-delete]');if(!b)return;
 const id=b.dataset.edit||b.dataset.toggle||b.dataset.delete;
 const record=entries.find(x=>x.id===id);if(!record){toast('Activity not found.',true);return}
 if(isImported(record)){toast('Imported AUXDATA II records are read-only. Reimport an updated AUXDATA II report to reconcile changes.',true);return}
 if(b.dataset.edit){if(record.status!=='pending'){toast('First return this activity to Pending to edit it.',true);return}openForm(id);return}
 if(b.dataset.toggle){
  if(record.status==='reported'){if(!confirm('Return this manually confirmed activity to Pending? It will no longer count as confirmed until you mark it entered again.'))return}
  else if(!confirm('Mark this activity as entered into AUXDATA II?'))return;
  entries=entries.map(x=>x.id===id?{...x,status:record.status==='reported'?'pending':'reported'}:x);
  if(store())render();return;
 }
 if(b.dataset.delete){if(record.status!=='pending'){toast('Confirmed activities cannot be deleted.',true);return}if(confirm('Permanently delete this pending activity?')){entries=entries.filter(x=>x.id!==id);if(store())render()}}
}
$('entriesTable').addEventListener('click',handleRecordAction);
$('mobileRecordCards').addEventListener('click',handleRecordAction);
const download=(blob,name)=>{const a=document.createElement('a');const u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),15000)};
$('backup').onclick=()=>download(new Blob([JSON.stringify({app:'AUX_TRACK_ADII',version:1,edition:'ADII',exported:new Date().toISOString(),entries},null,2)],{type:'application/json'}),`AUX_TRACK_ADII_Backup_${new Date().toISOString().slice(0,10)}.json`);
$('restore').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const json=JSON.parse(await f.text());if(json.app!=='AUX_TRACK_ADII'||!Array.isArray(json.entries)||json.entries.some(x=>!x.id||!x.sheet||!x.date||!Number.isInteger(x.minutes)))throw Error('Not a valid AUX Hours Log backup');if(!confirm(`Restore ${json.entries.length} records? This REPLACES the current ${entries.length} records. Download a backup first if needed.`))return;entries=json.entries;if(store()){render();toast('Backup restored successfully.')}}catch(err){toast('Restore failed: '+err.message,true)}finally{e.target.value=''}});
const XML='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const direct=(e,local)=>Array.from(e?.children||[]).find(x=>x.localName===local);
async function excelExport(){
 const list=reportSelection();if(!list.length){toast('No records match your report filters.',true);return}
 try{
  const xmlEsc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  const cols=['Date','Mission Code','Mission Description','Activity Description','Start','End','Hours','Miles','Travel','AUXDATA Status','MA Record ID'];
  const data=list.map(e=>[e.date,e.sheet,sheetInfo(e.sheet)?.label||e.missionCode||'',e.description,e.start||'',e.end||'',Number((e.minutes/60).toFixed(4)),e.miles||0,e.travel||'',e.status==='reported'?'Entered':'Pending',e.sourceId||'']);
  const cell=(v,c,r)=>typeof v==='number'?`<c r="${c}${r}"><v>${v}</v></c>`:`<c r="${c}${r}" t="inlineStr"><is><t>${xmlEsc(v)}</t></is></c>`;
  const letters=i=>{let s='';for(let x=i+1;x;x=Math.floor((x-1)/26))s=String.fromCharCode(65+(x-1)%26)+s;return s;};
  const rows=[cols,...data].map((vals,i)=>`<row r="${i+1}">${vals.map((v,j)=>cell(v,letters(j),i+1)).join('')}</row>`).join('');
  const z=new JSZip();
  z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
  z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  z.file('xl/workbook.xml','<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="ADII Hours Log" sheetId="1" r:id="rId1"/></sheets></workbook>');
  z.file('xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
  z.file('xl/worksheets/sheet1.xml','<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="2" width="17" customWidth="1"/><col min="3" max="4" width="38" customWidth="1"/><col min="5" max="11" width="20" customWidth="1"/></cols><sheetData>'+rows+'</sheetData><autoFilter ref="A1:K'+(data.length+1)+'"/></worksheet>');
  const bytes=await z.generateAsync({type:'uint8array',compression:'DEFLATE'});
  download(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),`AUX_TRACK_ADII_${new Date().toISOString().slice(0,10)}.xlsx`);
  toast(`ADII Excel exported: ${list.length} records.`);
 }catch(err){console.error(err);toast('Excel export failed: '+err.message,true)}
}
$('exportExcel').onclick=excelExport;
$('exportPDF').onclick=()=>{
 const list=reportSelection();
 if(!list.length){toast('No records match your report filters.',true);return}
 // Group by the stored official mission code, not by workbook sheets.
 const groups=new Map();
 for(const record of list){
  const code=String(record.missionCode||record.sheet||'').trim().toUpperCase()||'UNASSIGNED';
  if(!groups.has(code))groups.set(code,[]);
  groups.get(code).push(record);
 }
 const groupList=[...groups].sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true}));
 const rowsFor=records=>records.map(e=>{
  const when=[e.start||'',e.end||''].filter(Boolean).join('–')||'—';
  const ma=e.sourceId||'—';
  return `<tr><td>${fmtDate(e.date)}</td><td>${esc(when)}</td><td>${durationLabel(e.minutes)}</td><td>${e.miles?Number(e.miles).toFixed(1):'—'}</td><td>${esc(e.description||'Not provided in source')}</td><td class="ma-cell">${esc(ma)}</td><td>${e.status==='reported'?'Entered':'Pending'}</td></tr>`;
 }).join('');
 const sections=groupList.map(([code,records])=>{
  const name=sheetInfo(code)?.label||records.find(e=>e.missionCode===code)?.description||'Unassigned mission code';
  const time=durationLabel(total(records,'minutes'));
  const pending=durationLabel(total(records.filter(e=>e.status!=='reported'),'minutes'));
  const subtotal=`<tr class="print-subtotal"><td colspan="2">TOTAL ${esc(code)} · ${records.length} ${records.length===1?'activity':'activities'}</td><td>${time}</td><td>${total(records,'miles').toFixed(1)}</td><td colspan="3">Pending AUXDATA II: ${pending}</td></tr>`;
  return `<section class="print-cat"><h2>${esc(code)} — ${esc(name)} · ${time}</h2><table><thead><tr><th>Date</th><th>Time</th><th>Duration</th><th>Mileage</th><th>Activity Description</th><th>AUXDATA MA ID</th><th>Status</th></tr></thead><tbody>${rowsFor(records)}${subtotal}</tbody></table></section>`;
 }).join('');
 const title='AUX TRACK ADII — PERSONAL HOURS LOG';
 $('printArea').innerHTML=`<h1>${title}</h1><div class="print-sub">AUXDATA II activity record · Generated ${new Date().toLocaleDateString()} · ${esc($('reportFrom').value||'All dates')} to ${esc($('reportTo').value||'All dates')} · Personal, unofficial report</div><div class="print-stats"><span>Records: <strong>${list.length}</strong></span><span>Total hours: <strong>${durationLabel(total(list,'minutes'))}</strong></span><span>Total mileage: <strong>${total(list,'miles').toFixed(1)}</strong></span><span>Pending: <strong>${durationLabel(total(list.filter(e=>e.status!=='reported'),'minutes'))}</strong></span></div>${sections}<footer class="print-footer">AUX TRACK ADII v0.1.3 · Developed by Gustavo Montano · GMTK Integrated Solutions · Unofficial</footer>`;
 window.print();
};

// AUXDATA II import: read XLSX using bundled JSZip, no external service.
function xmlText(cell,strings){if(!cell)return '';const type=cell.getAttribute('t');let v=direct(cell,'v');if(type==='inlineStr'){const inline=direct(cell,'is');return inline?Array.from(inline.getElementsByTagNameNS(XML,'t')).map(t=>t.textContent).join(''):''}if(!v)return '';return type==='s'?(strings[+v.textContent]||''):v.textContent}
async function auxdataImport(file){
 const z=await JSZip.loadAsync(await file.arrayBuffer());
 const parse=s=>new DOMParser().parseFromString(s,'application/xml');
 const strings=[];const sf=z.file('xl/sharedStrings.xml');if(sf){const root=parse(await sf.async('string'));for(const si of Array.from(root.getElementsByTagNameNS(XML,'si')))strings.push(Array.from(si.getElementsByTagNameNS(XML,'t')).map(t=>t.textContent).join(''))}
 const s=z.file('xl/worksheets/sheet1.xml');if(!s)throw Error('No worksheet found in AUXDATA II report.');
 const root=parse(await s.async('string'));const rows=Array.from(root.getElementsByTagNameNS(XML,'row'));
 const data=rows.map(row=>{let vals={};for(const c of Array.from(row.getElementsByTagNameNS(XML,'c'))){const col=c.getAttribute('r').match(/^[A-Z]+/)[0];vals[col]=xmlText(c,strings)}return vals});
 // Read the actual AUXDATA II Total Mission structure. Some exports vary
 // their header labels, but the MA identifier and adjoining record values
 // provide a safe structural cross-check; never import by position alone.
 const canonical=v=>String(v??'').normalize('NFKC').replace(/[\u00a0\u200b]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
 const expected={
  ma:['member activity record number','member activity record','activity record number'],
  date:['mission date','date of mission'],
  code:['mission code','mission type'],
  hours:['activity duration','duration of activity','hours']
 };
 const findColumn=(row,aliases)=>Object.entries(row).find(([col,val])=>aliases.some(a=>canonical(val).includes(a)))?.[0]||'';
 const isDate=v=>/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(String(v??'').trim())||/^\d{4}-\d\d-\d\d/.test(String(v??'').trim())||(/^\d{5}$/.test(String(v??'').trim())&&Number(v)>20000);
 const isCode=v=>/^\d{1,2}[A-Z]?(?:\s*:\s*.+)?$/i.test(String(v??'').trim());
 const isHours=v=>/^\d+(?:\.\d+)?$/.test(String(v??'').trim())&&Number(v)>0&&Number(v)<=24;
 let header=-1,columns=null,method='header';
 for(let i=0;i<Math.min(data.length,80);i++){
  const found=Object.fromEntries(Object.entries(expected).map(([key,aliases])=>[key,findColumn(data[i],aliases)]));
  if(Object.values(found).every(Boolean)&&new Set(Object.values(found)).size===4){header=i;columns=found;break;}
 }
 if(header<0){
  // AUXDATA II reports have a title in the heading and MA identifiers in
  // the record table. Infer columns from repeated records only if ALL four
  // values form a consistent, validated pattern (e.g. F/G/H/I).
  const hasReportTitle=data.slice(0,12).some(r=>Object.values(r).some(v=>/total mission/i.test(String(v??''))));
  if(hasReportTitle){
   const matches=[];
   for(let i=0;i<Math.min(data.length,100);i++){
    const r=data[i];const ma=Object.entries(r).find(([,v])=>/^MA-\d+$/i.test(String(v??'').trim()));
    if(!ma)continue;
    const cols=Object.keys(r).sort((a,b)=>a.length-b.length||a.localeCompare(b));
    const dates=cols.filter(k=>isDate(r[k]));const codes=cols.filter(k=>isCode(r[k]));const hours=cols.filter(k=>isHours(r[k]));
    if(dates.length===1&&codes.length===1&&hours.length===1&&new Set([ma[0],dates[0],codes[0],hours[0]]).size===4)
     matches.push({i,columns:{ma:ma[0],date:dates[0],code:codes[0],hours:hours[0]}});
   }
   const sig=c=>[c.ma,c.date,c.code,c.hours].join('|');
   const counts=new Map();for(const match of matches){const k=sig(match.columns);counts.set(k,(counts.get(k)||0)+1)}
   const winner=[...counts.entries()].sort((a,b)=>b[1]-a[1])[0];
   if(winner&&winner[1]>=Math.min(3,matches.length)&&winner[1]>=2){
    const match=matches.find(x=>sig(x.columns)===winner[0]);
    header=match.i-1;columns=match.columns;method='validated record structure';
   }
  }
 }
 if(header<0){
  const preview=data.slice(0,24).flatMap(r=>Object.values(r)).filter(Boolean).map(String).filter(v=>/mission|activity|duration|record|hours/i.test(v)).slice(0,12);
  throw Error('Could not identify AUXDATA II Total Mission columns in "'+file.name+'". Found: '+(preview.join(' | ')||'no recognizable headers')+'. Select the unmodified Total Mission report downloaded from AUXDATA II.');
 }
 const sourceRows=data.slice(header+1).map(r=>({I:r[columns.ma],F:r[columns.date],G:r[columns.code],H:r[columns.hours]}));
 const incoming=[],seen=new Set();let malformed=0;
 for(const r of sourceRows){
  const ma=String(r.I||'').trim();if(!/^MA-\d+$/i.test(ma))continue;
  if(seen.has(ma))continue;seen.add(ma);
  const raw=String(r.F||'').trim();let date='';if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)){const [m,d,y]=raw.split('/');date=`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`}else if(/^\d{4}-\d\d-\d\d/.test(raw))date=raw.slice(0,10);else if(/^\d{5}$/.test(raw)){const d=new Date((Number(raw)-25569)*86400000);if(!Number.isNaN(+d))date=d.toISOString().slice(0,10)}
  const hours=Number(String(r.H||'').replace(/,/g,'')),minutes=Math.round(hours*60);
  if(!date||!Number.isFinite(minutes)||minutes<0){malformed++;continue}
  const rawcode=String(r.G||'').trim();const code=rawcode.split(':')[0].trim().toUpperCase()||'UNASSIGNED';
  let known=CFG.sheets.find(x=>x.name===code)||null;if(!known&&/^[0-9]{1,2}[A-Z]?$/.test(code)){known={name:code,label:rawcode.split(':').slice(1).join(':').trim()||code,capacity:999999};CFG.sheets.push(known);for(const id of ['sheetInput','filterSheet','reportSheet']){const opt=document.createElement('option');opt.value=code;opt.textContent=code+' — '+known.label;$(id).appendChild(opt);}}
  incoming.push({id:'auxdata:'+ma,sourceId:ma,source:'AUXDATA II',created:Date.now(),date,sheet:known?.name||code,missionCode:code,description:rawcode.split(':').slice(1).join(':').trim()||rawcode,start:'',end:'',minutes,miles:0,travel:'',status:'reported',url:''});
 }
 if(!incoming.length)throw Error('No valid Member Activity (MA-) records detected.');
 const byid=new Map(entries.map(e=>[e.id,e]));const bySource=new Map(entries.filter(e=>e.sourceId).map(e=>[e.sourceId,e]));let added=0,updated=0,unchanged=0;
 for(const item of incoming){const old=byid.get(item.id)||bySource.get(item.sourceId);if(old){const changed=old.minutes!==item.minutes||old.date!==item.date||old.missionCode!==item.missionCode;if(changed){updated++;}else unchanged++}else added++}
 const unmapped=[...new Set(incoming.filter(e=>e.sheet==='UNMAPPED').map(e=>e.missionCode))];
 const msg=`AUXDATA II import preview (${method}):\nFound: ${incoming.length} valid records\nNew: ${added}\nUpdated: ${updated}\nUnchanged: ${unchanged}\nSkipped invalid: ${malformed}\nUnmapped mission codes: ${unmapped.join(', ')||'none'}\n\nApply this import?`;
 if(!confirm(msg))return {cancelled:true};
 const snapshot=[...entries];
 for(const item of incoming){const idx=entries.findIndex(e=>e.id===item.id||e.sourceId===item.sourceId);if(idx<0)entries.push(item);else{const old=entries[idx];entries[idx]={...old,...item,id:old.id,description:old.description&&old.description!==old.missionCode&&old.description!==item.description?old.description:item.description,miles:old.miles||0,travel:old.travel||'',start:old.start||'',end:old.end||''}}}
 if(!store()){entries=snapshot;throw Error('Unable to save imported records. Nothing changed.');}
 render();return {added,updated,unchanged,malformed,unmapped};
}
$('auxImport').addEventListener('change',async ev=>{const f=ev.target.files[0];if(!f)return;try{const r=await auxdataImport(f);if(r.cancelled){$('importResult').textContent='Import cancelled.';return}const msg=`Imported: ${r.added} new, ${r.updated} updated, ${r.unchanged} unchanged. Unmapped mission codes: ${r.unmapped.length}.`;$('importResult').textContent=msg;toast(msg)}catch(e){console.error(e);$('importResult').textContent='Import failed: '+e.message;toast('AUXDATA import failed: '+e.message,true)}finally{ev.target.value=''}});

// AUX10 full-text and mission-code search. Original PDF is not rewritten.
const normalizeCodeQuery=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
// Strictly limited search normalization. "Photography" and "photographs" share the documented photo root.
function aux10Terms(q){return normalizeCodeQuery(q).split(/\s+/).filter(Boolean).map(t=>/^photograph(y|ies|s|ic|er|ers)?$/.test(t)?'photograph':t)}
function aux10Matches(t,text){const v=normalizeCodeQuery(text);return t==='photograph'?v.includes('photograph'):v.includes(t)}
function renderAux10(){
 const q=normalizeCodeQuery($('codeSearch').value).trim();const tokens=aux10Terms(q);
 const own=c=>(c.code+' '+c.title).toLowerCase();
 const directCodes=tokens.length?AUX10.codes.filter(c=>tokens.every(t=>aux10Matches(t,own(c)))):AUX10.codes;
 const codes=directCodes.sort((a,b)=>{
  const rank=c=>c.code.toLowerCase()===q?0:c.title.toLowerCase().startsWith(q)?1:c.title.toLowerCase().includes(q)?2:3;
  return rank(a)-rank(b)||a.code.localeCompare(b.code,undefined,{numeric:true});
 });
 const refs=[];
 if(tokens.length){for(let i=0;i<AUX10.pages.length;i++){
  const p=AUX10.pages[i],raw=String(typeof p==='string'?p:(p.text||p.content||p.snippet||''));
  if(tokens.every(t=>aux10Matches(t,raw))){const at=raw.toLowerCase().indexOf(tokens[0]);refs.push({page:(typeof p==='string'?i+1:p.page||i+1),snippet:raw.slice(Math.max(0,at-35),Math.max(0,at-35)+210)});}
  if(refs.length>=12)break;
 }}
 $('codeSearchSummary').textContent=(q?`${codes.length} matching official codes · ${refs.length} PDF references`:`${codes.length} official code references`);
 const cs=codes.slice(0,60).map(c=>`<article class="code-result"><div><strong class="code-chip">${esc(c.code)}</strong><div><b>${esc(c.title)}</b><small>AUX10${c.page?' · page '+c.page:''}</small></div></div><div class="code-actions"><button type="button" class="primary small" data-pickcode="${esc(c.code)}">Use code</button>${c.page?`<a href="aux10-reference.pdf#page=${c.page}" target="_blank" rel="noopener">View PDF page</a>`:''}</div></article>`).join('');
 const ps=refs.map(p=>`<article class="code-result"><div><strong class="code-chip">p. ${p.page}</strong><div><b>PDF text reference (not a code)</b><small>${esc(p.snippet)}</small></div></div><div class="code-actions"><a href="aux10-reference.pdf#page=${p.page}" target="_blank" rel="noopener">View page</a></div></article>`).join('');
 $('codeSearchResults').innerHTML=(cs?'<h3>Official mission codes</h3>'+cs:'<div class="empty">No matching mission codes. Check PDF references below.</div>')+(ps?'<h3>Mentions in AUX10 (reference only)</h3>'+ps:'');
}
$('codeSearch').addEventListener('input',renderAux10);
$('codesClear').addEventListener('click',()=>{$('codeSearch').value='';renderAux10();$('codeSearch').focus()});
$('codeSearchResults').addEventListener('click',event=>{
 const btn=event.target.closest('button[data-pickcode]');if(!btn)return;
 const code=btn.dataset.pickcode;
 if(!CFG.sheets.some(s=>s.name===code))return;
 show('dashboard');openForm();$('sheetInput').value=code;
 $('urlLabel').classList.toggle('hidden',code!=='10H');
});
$('chooseMissionCode').addEventListener('click',()=>{$('entryDialog').close();show('codes');$('codeSearch').focus()});
renderAux10();

if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(console.warn);
render();
})();
