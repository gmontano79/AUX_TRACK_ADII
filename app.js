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
function render(){const pending=entries.filter(e=>e.status!=='reported'),reported=entries.filter(e=>e.status==='reported');$('mHours').textContent=(total(entries.filter(e=>e.date?.startsWith(String(new Date().getFullYear()))),'minutes')/60).toFixed(1)+' hrs';$('mPending').textContent=(total(pending.filter(e=>e.date?.startsWith(String(new Date().getFullYear()))),'minutes')/60).toFixed(1)+' hrs';$('mReported').textContent=(total(reported.filter(e=>e.date?.startsWith(String(new Date().getFullYear()))),'minutes')/60).toFixed(1)+' hrs';$('mMiles').textContent=total(entries,'miles').toFixed(1);const recent=[...entries].sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created).slice(0,7);$('recent').innerHTML=recent.length?recent.map(e=>`<div class="activity"><div><strong>${esc(e.description)}</strong><small>${esc(e.sheet)} · ${fmtDate(e.date)} · ${e.status==='reported'?'Entered':'Pending'}</small></div><b>${durationLabel(e.minutes)}</b></div>`).join(''):'<div class="empty">No entries yet. Add your first activity.</div>';
const groups=CFG.sheets.map(s=>({...s,min:total(entries.filter(e=>e.sheet===s.name),'minutes')})).filter(s=>s.min>0);const importedUnmapped=entries.filter(e=>e.sheet==='UNMAPPED');if(importedUnmapped.length)groups.push({name:'UNMAPPED',label:'Other AUXDATA II mission codes',min:total(importedUnmapped,'minutes')});groups.sort((a,b)=>b.min-a.min);groups.splice(9);const max=groups.length?groups[0].min:1;$('breakdown').innerHTML=groups.length?groups.map(s=>`<div class="breakdown-item"><div class="line"><span>${esc(s.name)} · ${esc(s.label.slice(0,35))}</span><strong>${durationLabel(s.min)}</strong></div><div class="progress"><i style="width:${100*s.min/max}%"></i></div></div>`).join(''):'<div class="empty">Your mission breakdown will appear here.</div>';renderRecords();renderReportSummary()}
function renderRecords(){const q=$('search').value.toLowerCase(),sh=$('filterSheet').value,st=$('filterStatus').value;const set=entries.filter(e=>(!sh||e.sheet===sh)&&(!st||e.status===st)&&(`${e.description} ${e.sheet} ${e.travel}`.toLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created);$('entriesTable').innerHTML=set.length?set.map(e=>`<tr><td>${fmtDate(e.date)}</td><td><strong>${esc(e.sheet)}</strong><div class="muted">${esc((sheetInfo(e.sheet)?.label||'').slice(0,40))}</div></td><td>${esc(e.description)}${e.travel?`<div class="muted">Travel: ${esc(e.travel)}</div>`:''}</td><td><b>${durationLabel(e.minutes)}</b><div class="muted">${esc(e.start||'')} ${e.end?'– '+esc(e.end):''}</div></td><td>${e.miles?e.miles.toFixed(1):'—'}</td><td><span class="pill ${e.status}">${e.status==='reported'?'Entered':'Pending'}</span></td><td><div class="row-actions"><button data-edit="${esc(e.id)}">Edit</button><button data-toggle="${esc(e.id)}">${e.status==='reported'?'Undo':'Mark entered'}</button><button class="danger" data-delete="${esc(e.id)}">Delete</button></div></td></tr>`).join(''):'<tr><td colspan="7" class="empty">No matching activity records</td></tr>'}
function reportSelection(){const from=$('reportFrom').value,to=$('reportTo').value,sh=$('reportSheet').value,st=$('reportStatus').value;return entries.filter(e=>(!from||e.date>=from)&&(!to||e.date<=to)&&(!sh||e.sheet===sh)&&(!st||e.status===st)).sort((a,b)=>a.date.localeCompare(b.date)||a.created-b.created)}
function renderReportSummary(){const list=reportSelection();$('reportSummary').textContent=`${list.length} records   •   ${durationLabel(total(list,'minutes'))} total hours   •   ${total(list,'miles').toFixed(1)} miles`}
const fillSelect=id=>{$(id).innerHTML+=[...CFG.sheets].map(s=>`<option value="${esc(s.name)}">${esc(s.name)} — ${esc(s.label.slice(0,65))}</option>`).join('')};fillSelect('sheetInput');fillSelect('filterSheet');fillSelect('reportSheet');$('mileagePreset').innerHTML+=CFG.mileage.map((m,i)=>`<option value="${i}">${esc(m.label)} (${m.miles} mi)</option>`).join('');
const openForm=id=>{editing=id||null;const e=entries.find(x=>x.id===id);$('entryForm').reset();$('dialogTitle').textContent=e?'Edit Activity':'Log Activity';$('dateInput').value=e?.date||new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);$('sheetInput').value=e?.sheet||'99A';$('startInput').value=e?.start||'';$('endInput').value=e?.end||'';$('durationInput').value=e?durationLabel(e.minutes):'';$('milesInput').value=e?.miles??'';$('travelInput').value=e?.travel||'';$('descInput').value=e?.description||'';$('statusInput').value=e?.status||'pending';$('urlInput').value=e?.url||'';$('urlLabel').classList.toggle('hidden',$('sheetInput').value!=='10H');$('entryDialog').showModal()};
$('entryForm').addEventListener('submit',event=>{event.preventDefault();const start=$('startInput').value,end=$('endInput').value;const manual=$('durationInput').value.trim();const m=manual?(/^(\d+):([0-5]\d)$/.test(manual)?Number(manual.split(':')[0])*60+Number(manual.split(':')[1]):NaN):durFromTimes(start,end);if(!Number.isInteger(m)||m<=0||m>1440){toast('Please enter a valid duration (HH:MM), or both start and end times. Duration must be greater than zero and at most 24 hours.',true);return}const data={id:editing||`${Date.now()}_${Math.random().toString(36).slice(2,8)}`,created:editing?(entries.find(e=>e.id===editing)?.created||Date.now()):Date.now(),date:$('dateInput').value,sheet:$('sheetInput').value,start,end,minutes:m,miles:Number($('milesInput').value)||0,travel:$('travelInput').value.trim(),description:$('descInput').value.trim(),status:$('statusInput').value,url:$('urlInput').value.trim()};if(!data.date||!data.description){toast('Date and description are required.',true);return}if(editing)entries=entries.map(e=>e.id===editing?data:e);else entries.push(data);if(!store())return;$('entryDialog').close();render();toast(editing?'Activity updated.':'Activity saved.');});
$('sheetInput').addEventListener('change',()=>$('urlLabel').classList.toggle('hidden',$('sheetInput').value!=='10H'));$('mileagePreset').addEventListener('change',()=>{const m=CFG.mileage[+$('mileagePreset').value];if($('mileagePreset').value!==''&&m){$('travelInput').value=m.label;$('milesInput').value=m.miles}});const autoTime=()=>{const m=durFromTimes($('startInput').value,$('endInput').value);if(m!==null)$('durationInput').value=durationLabel(m)};$('startInput').addEventListener('change',autoTime);$('endInput').addEventListener('change',autoTime);
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>show(b.dataset.view));$('newTop').onclick=$('newRecord').onclick=$('quickLog').onclick=$('mobileLog').onclick=()=>openForm();$('closeDialog').onclick=$('cancelDialog').onclick=()=>$('entryDialog').close();for(const id of ['search','filterSheet','filterStatus'])$(id).addEventListener('input',renderRecords);for(const id of ['reportFrom','reportTo','reportSheet','reportStatus'])$(id).addEventListener('input',renderReportSummary);
$('entriesTable').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.edit)openForm(b.dataset.edit);if(b.dataset.toggle){entries=entries.map(x=>x.id===b.dataset.toggle?{...x,status:x.status==='reported'?'pending':'reported'}:x);if(store())render()}if(b.dataset.delete){if(confirm('Permanently delete this activity record?')){entries=entries.filter(x=>x.id!==b.dataset.delete);if(store())render()}}});
const download=(blob,name)=>{const a=document.createElement('a');const u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),15000)};
$('backup').onclick=()=>download(new Blob([JSON.stringify({app:'AUX_TRACK_ADII',version:1,edition:'ADII',exported:new Date().toISOString(),entries},null,2)],{type:'application/json'}),`AUX_TRACK_ADII_Backup_${new Date().toISOString().slice(0,10)}.json`);
$('restore').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const json=JSON.parse(await f.text());if(json.app!=='AUX_TRACK_ADII'||!Array.isArray(json.entries)||json.entries.some(x=>!x.id||!x.sheet||!x.date||!Number.isInteger(x.minutes)))throw Error('Not a valid AUX Hours Log backup');if(!confirm(`Restore ${json.entries.length} records? This REPLACES the current ${entries.length} records. Download a backup first if needed.`))return;entries=json.entries;if(store()){render();toast('Backup restored successfully.')}}catch(err){toast('Restore failed: '+err.message,true)}finally{e.target.value=''}});
function dateSerial(s){const [y,m,d]=s.split('-').map(Number);return Math.round((Date.UTC(y,m-1,d)-Date.UTC(1899,11,30))/86400000)};
const XML='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const direct=(e,local)=>Array.from(e?.children||[]).find(x=>x.localName===local);
function putCell(row,col,value,asText=false){let cell=Array.from(row.children).find(c=>c.localName==='c'&&c.getAttribute('r')===col+row.getAttribute('r'));if(!cell){cell=row.ownerDocument.createElementNS(XML,'c');cell.setAttribute('r',col+row.getAttribute('r'));const idx=c=>{const x=c.getAttribute('r').match(/^[A-Z]+/)[0];return [...x].reduce((v,k)=>v*26+k.charCodeAt(0)-64,0)};const after=Array.from(row.children).find(x=>x.localName==='c'&&idx(x)>idx(cell));row.insertBefore(cell,after||null)}Array.from(cell.children).forEach(ch=>{if(['f','v','is'].includes(ch.localName))cell.removeChild(ch)});if(value===null||value===undefined||value===''){cell.removeAttribute('t');return}if(asText){cell.setAttribute('t','inlineStr');const is=row.ownerDocument.createElementNS(XML,'is'),t=row.ownerDocument.createElementNS(XML,'t');t.textContent=String(value);is.appendChild(t);cell.appendChild(is)}else{cell.removeAttribute('t');const v=row.ownerDocument.createElementNS(XML,'v');v.textContent=String(value);cell.appendChild(v)}}
function rowAt(doc,r){const rows=Array.from(doc.getElementsByTagNameNS(XML,'row'));return rows.find(n=>Number(n.getAttribute('r'))===r)}
function splitSheet(s){const side=s.startsWith('93W-');return {travel:['99-A','99-B','99-C','99-D','99-E'].includes(s),side}}
function renderXlsSheet(doc,sheet,list){const {travel,side}=splitSheet(sheet);const info=sheetInfo(sheet);const reserved=info?.capacity||25;const regular=side?list.filter(e=>!e.description.toLowerCase().startsWith('call:')):list;const calls=side?list.filter(e=>e.description.toLowerCase().startsWith('call:')):[];if(regular.length>reserved||(side&&calls.length>reserved))throw Error(`Worksheet "${sheet}" has ${regular.length} entries (and ${calls.length} calls) but only ${reserved} available original template rows. Export a narrower date range or select one sheet. No data was exported.`);for(let i=0;i<regular.length;i++){const e=regular[i],r=rowAt(doc,i+2);if(!r)throw Error(`Template row ${i+2} is missing in ${sheet}.`);putCell(r,'A',dateSerial(e.date));putCell(r,'B',e.start?timeFraction(e.start):null);putCell(r,'C',e.end?timeFraction(e.end):null);putCell(r,'D',e.minutes/1440);if(travel){putCell(r,'E',e.travel,true);putCell(r,'F',e.miles||null);putCell(r,'G',e.description,true)}else{putCell(r,'E',e.description,true);if(sheet==='10H')putCell(r,'F',e.url,true)}}if(side){for(let i=0;i<calls.length;i++){const e=calls[i],r=rowAt(doc,i+2);putCell(r,'G',dateSerial(e.date));putCell(r,'H',e.start?timeFraction(e.start):null);putCell(r,'I',e.end?timeFraction(e.end):null);putCell(r,'J',e.minutes/1440);putCell(r,'K',e.description.replace(/^call:\s*/i,''),true)}}}
const timeFraction=s=>{const [h,m]=s.split(':').map(Number);return (h*60+m)/1440};
const recapMapping={'99-A':2,'99-A NATIONAL HD':3,'99-B':4,'99-C':5,'99-D':6,'99-E':7,'07D':12,'08A-DIRAUX':13,'08A-CSO (BMB)':14,'08-STAMIA':15,'08 Calls':16,'10A':17,'10C':18,'10D':19,'10E':20,'10H':21,'10J':22,'10K':23,'10K Calls':24,'10L':25,'28A':26,'28B':27,'28P':28,'28T':29,'70N':30,'70N Calls':31,'93W-OMB (SE)':32,'93W-OMB (BMB)':34,'93W-OMB (STAMIA)':36};
function updateRecap(doc,records){for(const [sheet,row]of Object.entries(recapMapping)){const r=rowAt(doc,row);if(!r)continue;let items=records.filter(e=>e.sheet===sheet);if(sheet==='99-A')items=records.filter(e=>e.sheet==='99-A'||e.sheet==='99-A NM');if(sheet==='99-D')items=records.filter(e=>e.sheet==='99-D'||e.sheet==='99-D NM');if(sheet==='99-E')items=records.filter(e=>e.sheet==='99-E'||e.sheet==='99-E NM');putCell(r,'A',total(items,'minutes')/60);if(row<=7)putCell(r,'D',total(items,'miles'));}const r=rowAt(doc,8);if(r){putCell(r,'A',total(records.filter(e=>['99-A','99-A NM','99-A NATIONAL HD','99-B','99-C','99-D','99-D NM','99-E','99-E NM'].includes(e.sheet)),'minutes')/60);putCell(r,'D',total(records.filter(e=>['99-A','99-B','99-C','99-D','99-E'].includes(e.sheet)),'miles'))}}
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
$('exportPDF').onclick=()=>{const list=reportSelection();if(!list.length){toast('No records match your report filters.',true);return}const grouped=CFG.sheets.map(s=>({...s,records:list.filter(e=>e.sheet===s.name)})).filter(s=>s.records.length);const other=list.filter(e=>!sheetInfo(e.sheet));if(other.length)grouped.push({name:'OTHER AUXDATA CODES',label:'Imported missions without a matching original worksheet',records:other});$('printArea').innerHTML=`<h1>AUX TRACK ADII — PERSONAL HOURS LOG</h1><div class="print-sub">Activity record and AUXDATA II entry tracker · Generated ${new Date().toLocaleDateString()} · ${esc($('reportFrom').value||'All dates')} to ${esc($('reportTo').value||'All dates')} · Personal, unofficial report</div><div class="print-stats"><span>Records: <strong>${list.length}</strong></span><span>Total hours: <strong>${durationLabel(total(list,'minutes'))}</strong></span><span>Total mileage: <strong>${total(list,'miles').toFixed(1)}</strong></span><span>Pending: <strong>${durationLabel(total(list.filter(e=>e.status!=='reported'),'minutes'))}</strong></span></div>${grouped.map(s=>`<div class="print-cat"><h2>${esc(s.name)} — ${esc(s.label)} · ${durationLabel(total(s.records,'minutes'))}</h2><table><thead><tr><th>Date</th><th>Start</th><th>End</th><th>Total</th><th>Travel to/from</th><th>Mileage</th><th>Activity Description</th><th>AUXDATA II</th></tr></thead><tbody>${s.records.map(e=>`<tr><td>${fmtDate(e.date)}</td><td>${esc(e.start)}</td><td>${esc(e.end)}</td><td>${durationLabel(e.minutes)}</td><td>${esc(e.travel)}</td><td>${e.miles?e.miles.toFixed(1):''}</td><td>${esc(e.description)}</td><td>${e.status==='reported'?'Entered':'Pending'}</td></tr>`).join('')}<tr class="print-subtotal"><td colspan="3">TOTAL ${esc(s.name)} · ${s.records.length} ${s.records.length===1?'activity':'activities'}</td><td>${durationLabel(total(s.records,'minutes'))}</td><td></td><td>${total(s.records,'miles').toFixed(1)}</td><td colspan="2">Pending AUXDATA II: ${durationLabel(total(s.records.filter(e=>e.status!=='reported'),'minutes'))}</td></tr></tbody></table></div>`).join('')}`;window.print()};

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
