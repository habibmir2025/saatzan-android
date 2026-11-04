
try {
  const savedSettings = JSON.parse(localStorage.getItem('saatzan_settings_v1') || '{}');
  if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform() && savedSettings.biometricEnabled) {
    document.documentElement.classList.add('biometric-required');
  }
} catch (_) {}


(function () {
  function paintClock() {
    var clock = document.getElementById('liveClock');
    if (!clock) return;
    var now = new Date();
    var two = function (n) { return String(n).padStart(2, '0'); };
    var digits = function (s) { return String(s).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[Number(d)]; }); };
    clock.textContent = digits(two(now.getHours()) + ':' + two(now.getMinutes()) + ':' + two(now.getSeconds()));
  }
  paintClock();
  window.setInterval(paintClock, 1000);
})();


const $ = id => document.getElementById(id);
const storeKey = 'saatzan_records_v1';
const settingsKey = 'saatzan_settings_v1';
let records = JSON.parse(localStorage.getItem(storeKey) || '[]');
if(!records.length && 'indexedDB' in window){
 try{const req=indexedDB.open('saatzan_local_db',1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('appdata'))db.createObjectStore('appdata')};req.onsuccess=()=>{const db=req.result;try{const get=db.transaction('appdata','readonly').objectStore('appdata').get(storeKey);get.onsuccess=()=>{if(get.result){try{const restored=JSON.parse(get.result);if(Array.isArray(restored)&&restored.length){records=restored;localStorage.setItem(storeKey,JSON.stringify(records));render();}}catch(_){}}db.close();};get.onerror=()=>db.close();}catch(e){db.close();}};}catch(e){console.warn('IndexedDB restore failed',e);}
}
let settings = JSON.parse(localStorage.getItem(settingsKey) || '{"requiredHours":8}');
settings = {requiredHours:8, annualLeaveDays:26, workplaceName:'', biometricEnabled:false, ...settings};
$('requiredHours').value = settings.requiredHours || 8;
$('annualLeaveDays').value = settings.annualLeaveDays ?? 26;
$('workplaceName').value = settings.workplaceName || '';
$('biometricEnabled').checked = !!settings.biometricEnabled;
const pad = n => String(n).padStart(2,'0');
function localDate(d=new Date()){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function localMonth(d=new Date()){return `${d.getFullYear()}-${pad(d.getMonth()+1)}`}
function faNum(s){return String(s).replace(/[0-9]/g, d=>'۰۱۲۳۴۵۶۷۸۹'[d])}
function toLatinDigits(s){return String(s).replace(/[۰-۹٠-٩]/g,ch=>{const fa='۰۱۲۳۴۵۶۷۸۹',ar='٠١٢٣٤٥٦٧٨٩';const i=fa.indexOf(ch);return String(i>=0?i:ar.indexOf(ch))})}
function jalaliParts(date=new Date()){
 const parts=new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{year:'numeric',month:'numeric',day:'numeric'}).formatToParts(date);
 const get=t=>Number(parts.find(p=>p.type===t).value);return {y:get('year'),m:get('month'),d:get('day')};
}
function jalaliText(date=new Date()){const p=jalaliParts(date);return `${faNum(p.y)}/${faNum(pad(p.m))}/${faNum(pad(p.d))}`}
function jalaliToISO(value){
 const m=toLatinDigits(value).trim().match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/);
 if(!m)return null;const jy=+m[1],jm=+m[2],jd=+m[3];if(jm<1||jm>12||jd<1||jd>31)return null;
 const start=new Date(jy+621,2,1,12),end=new Date(jy+623,3,1,12);
 for(let d=new Date(start);d<end;d.setDate(d.getDate()+1)){const p=jalaliParts(d);if(p.y===jy&&p.m===jm&&p.d===jd)return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
 return null;
}

function createJalaliPicker(inputId,containerId,monthOnly=false){
 const input=$(inputId),container=$(containerId);
 const current=jalaliParts(new Date());
 const year=document.createElement('select'),month=document.createElement('select'),day=document.createElement('select');
 const add=(el,value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;el.appendChild(o)};
 for(let y=Math.max(1300,current.y-10);y<=current.y+15;y++)add(year,String(y),faNum(y));
 for(let m=1;m<=12;m++)add(month,String(m),faNum(m).padStart(2,'۰'));
 if(!monthOnly)for(let d=1;d<=31;d++)add(day,String(d),faNum(d));
 year.setAttribute('aria-label','سال شمسی');month.setAttribute('aria-label','ماه شمسی');day.setAttribute('aria-label','روز شمسی');
 container.append(year,month);if(!monthOnly)container.append(day);
 function updateDays(){
  if(monthOnly)return;
  const y=Number(year.value),m=Number(month.value),old=Number(day.value)||1;
  let max=31;
  while(max>0&&!jalaliToISO(`${y}/${m}/${max}`))max--;
  day.innerHTML='';
  for(let d=1;d<=max;d++)add(day,String(d),faNum(d));
  day.value=String(Math.min(old,max));
 }
 function sync(){
  updateDays();
  const value=`${year.value}/${String(month.value).padStart(2,'0')}`+(monthOnly?'':`/${String(day.value).padStart(2,'0')}`);
  input.value=value;
  input.dispatchEvent(new Event('change',{bubbles:true}));
  input.dispatchEvent(new Event('input',{bubbles:true}));
 }
 function load(value){
  const parts=toLatinDigits(value||'').split('/');
  year.value=parts[0]||String(current.y);month.value=String(Number(parts[1])||current.m);
  updateDays();
  if(!monthOnly)day.value=String(Number(parts[2])||current.d);
  sync();
 }
 year.addEventListener('change',sync);month.addEventListener('change',sync);if(!monthOnly)day.addEventListener('change',sync);
 load(monthOnly?`${current.y}/${current.m}`:`${current.y}/${current.m}/${current.d}`);
 return {set:load};
}
function jalaliMonthToISO(value){
 const s=toLatinDigits(String(value||'').trim()).replace(/[.-]/g,'/');
 const m=s.match(/^(\d{4})\/(\d{1,2})$/);if(!m)return '';
 const jy=+m[1],jm=+m[2];if(jm<1||jm>12)return '';
 const start=new Date(jy+621,0,1,12),end=new Date(jy+623,0,1,12);
 for(let d=new Date(start);d<end;d.setDate(d.getDate()+1)){const q=jalaliParts(d);if(q.y===jy&&q.m===jm)return `${d.getFullYear()}-${pad(d.getMonth()+1)}`;}
 return '';
}
function recordMatchesJalaliMonth(isoDate, selectedMonth){
 const s=toLatinDigits(String(selectedMonth||'').trim()).replace(/[.-]/g,'/');
 const m=s.match(/^(\d{4})\/(\d{1,2})$/);if(!m||!isoDate)return false;
 const dmatch=String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!dmatch)return false;
 const d=new Date(+dmatch[1],+dmatch[2]-1,+dmatch[3],12);const q=jalaliParts(d);
 return q.y===+m[1] && q.m===+m[2];
}
function selectedJalaliMonth(){
 const val=String($('month').value||'').trim();
 return /^\d{4}[\/.-]\d{1,2}$/.test(toLatinDigits(val)) ? toLatinDigits(val).replace(/[.-]/g,'/') : isoMonthToJalali(localMonth());
}
function isoMonthToJalali(value){
 const m=String(value||'').match(/^(\d{4})-(\d{2})$/);if(!m)return jalaliText(new Date()).slice(0,7);
 const d=new Date(+m[1],+m[2]-1,15,12),q=jalaliParts(d);return `${faNum(q.y)}/${faNum(pad(q.m))}`;
}
function displayDate(iso){if(!iso)return '—';const m=String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return faNum(iso);const d=new Date(+m[1],+m[2]-1,+m[3],12);const weekday=new Intl.DateTimeFormat('fa-IR',{weekday:'long'}).format(d);return `${weekday}، ${jalaliText(d)}`}
function jalaliInputValue(iso){if(!iso)return '';const m=String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return '';const d=new Date(+m[1],+m[2]-1,+m[3],12);const parts=new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);const o={};parts.forEach(p=>{if(p.type!=='literal')o[p.type]=p.value});return `${o.year}/${String(o.month).padStart(2,'0')}/${String(o.day).padStart(2,'0')}`;}
function jalaliInputToISO(value){const s=toLatinDigits(String(value||'').trim()).replace(/[.-]/g,'/');const m=s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);if(!m)return '';const jy=+m[1],jm=+m[2],jd=+m[3];if(jm<1||jm>12||jd<1||jd>31)return '';const target=`${jy}-${String(jm).padStart(2,'0')}-${String(jd).padStart(2,'0')}`;const fmt=new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{year:'numeric',month:'2-digit',day:'2-digit'});const start=new Date(jy+621,0,1,12);for(let delta=-120;delta<=400;delta++){const d=new Date(start);d.setDate(d.getDate()+delta);const ps=fmt.formatToParts(d);const o={};ps.forEach(p=>{if(p.type!=='literal')o[p.type]=p.value});if(+o.year===jy&&+o.month===jm&&+o.day===jd)return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}return '';}
function updateClock(){const now=new Date();const el=$('liveClock');if(el)el.textContent=faNum(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);const de=$('todayDate');if(de)de.textContent=now.toLocaleDateString('fa-IR-u-ca-persian',{weekday:'long',year:'numeric',month:'long',day:'numeric'});const wp=$('workplaceDisplay');if(wp)wp.textContent=settings.workplaceName?`📍 ${settings.workplaceName}`:'📍 مکان کاری تنظیم نشده';}
function time(d){return d?new Date(d).toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit',hour12:false}):'—'}
function fmtHours(mins){mins=Math.max(0,Math.round(mins||0));return `${faNum(Math.floor(mins/60))}:${faNum(pad(mins%60))}`}
function save(){
 const payload=JSON.stringify(records);
 try{localStorage.setItem(storeKey,payload);}catch(e){console.warn('localStorage save failed',e);}
 try{const req=indexedDB.open('saatzan_local_db',1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('appdata'))db.createObjectStore('appdata')};req.onsuccess=()=>{const db=req.result;try{const tx=db.transaction('appdata','readwrite');tx.objectStore('appdata').put(payload,storeKey);tx.oncomplete=()=>db.close();tx.onerror=()=>db.close();}catch(e){db.close();}};}catch(e){console.warn('IndexedDB backup failed',e);}
}
function isAttendance(r){return r && (r.type==='attendance'||!r.type) && (r.in||r.out)}
function todayAttendance(){return records.filter(r=>r.date===localDate()&&isAttendance(r)).sort((a,b)=>String(b.in||b.out||'').localeCompare(String(a.in||a.out||'')))}
function getToday(){return todayAttendance()[0]||null}
function duration(r){return r?.in && r?.out ? Math.max(0,Math.round((new Date(r.out)-new Date(r.in))/60000)) : 0}
function localInputValue(iso){if(!iso)return '';const d=new Date(iso);if(Number.isNaN(d.getTime()))return '';return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`}
function inputToISO(value){if(!value)return '';const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toISOString()}
function safeAttr(s){return escapeHtml(s||'')}
function extras(date,kind){return records.filter(r=>r.date===date && r.type===kind).reduce((s,r)=>s+(Number(r.duration)||0)*60,0)}
function render(){
 updateClock();
 const todayRows=todayAttendance(); const t=todayRows[0]; $('todayIn').textContent=todayRows.length?time(todayRows[todayRows.length-1].in):'—'; $('todayOut').textContent=t?time(t.out):'—';
 const mins=todayRows.reduce((sum,r)=>sum+duration(r),0); $('todayHours').textContent=fmtHours(mins);
 const required=(Number($('requiredHours').value)||8)*60;
 $('todayOvertime').textContent=fmtHours(Math.max(0,mins-required)+extras(localDate(),'overtime'));
 $('status').textContent=!t?'وضعیت امروز: هنوز ورود ثبت نشده':t.in&&!t.out?`وضعیت امروز: در حال کار (ورود باز شماره ${faNum(todayRows.length)})`:`وضعیت امروز: ${faNum(todayRows.length)} نوبت ثبت شده`;
 const month=selectedJalaliMonth();
 const monthRecords=records.filter(r=>recordMatchesJalaliMonth(r.date,month));
 const worked=monthRecords.reduce((s,r)=>s+duration(r),0);
 const overtime=monthRecords.reduce((s,r)=>s+Math.max(0,duration(r)-required)+ (r.type==='overtime'?(Number(r.duration)||0)*60:0),0);
 const leave=monthRecords.filter(r=>r.type==='leave').reduce((s,r)=>s+(Number(r.duration)||0)*60,0);
 const leaveDays=monthRecords.filter(r=>r.type==='leave_daily').reduce((s,r)=>s+(Number(r.duration)||0),0);
 $('monthHours').textContent=fmtHours(worked); $('monthOvertime').textContent=fmtHours(overtime); $('monthLeave').textContent=fmtHours(leave); $('monthLeaveDays').textContent=faNum(leaveDays);
 $('monthDays').textContent=faNum(new Set(monthRecords.filter(r=>r.in||r.out).map(r=>r.date)).size);
 const list=monthRecords.slice().sort((a,b)=>b.date.localeCompare(a.date));
 $('entries').innerHTML=list.length?list.map(r=>{
  const labels={leave:'مرخصی ساعتی',leave_daily:'مرخصی روزانه',overtime:'اضافه‌کاری دستی',mission:'مأموریت',absence:'غیبت'};
  const rid=String(r.id);
  return `<div class="entry"><div class="row"><strong>${displayDate(r.date||'')}</strong><span class="pill">${labels[r.type]||'حضور و غیاب'}</span></div>
  <div class="muted" style="margin:6px 0">کارکرد این نوبت: ${fmtHours(duration(r))}${r.duration?` | مدت ثبت: ${faNum(r.duration)} ${r.type==='leave_daily'?'روز':'ساعت'}`:''}</div>
  ${isAttendance(r)?`<div class="grid" style="margin-top:8px">
    <div><label>تاریخ شمسی (سال/ماه/روز)</label><input type="text" inputmode="numeric" placeholder="۱۴۰۵/۰۸/۰۵" id="editDate-${safeAttr(rid)}" value="${safeAttr(jalaliInputValue(r.date||''))}"></div>
    <div><label>محل کار / مکان</label><input type="text" id="editPlace-${safeAttr(rid)}" value="${safeAttr(r.workplace||'')}" placeholder="مثلاً کارخانه، شعبه ۲"></div>
    <div><label>ساعت ورود</label><input type="datetime-local" id="editIn-${safeAttr(rid)}" value="${safeAttr(localInputValue(r.in))}"></div>
    <div><label>ساعت خروج</label><input type="datetime-local" id="editOut-${safeAttr(rid)}" value="${safeAttr(localInputValue(r.out))}"></div>
  </div><button class="primary" onclick="editAttendance('${safeAttr(rid)}')" style="width:100%;margin-top:8px">ذخیره تغییرات این نوبت</button>`:''}
  ${r.notes?`<div style="margin-top:6px">${escapeHtml(r.notes)}</div>`:''}
  <div style="text-align:left;margin-top:7px"><button class="danger" onclick="deleteRecord('${safeAttr(rid)}')" style="padding:6px 10px;font-size:12px">حذف</button></div></div>`;
 }).join(''):'<p class="note">برای این ماه هنوز موردی ثبت نشده است.</p>';
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function newId(){return crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(16).slice(2)}
function openAttendance(date){return records.filter(r=>r.date===date&&isAttendance(r)&&r.in&&!r.out).sort((a,b)=>String(b.in).localeCompare(String(a.in)))[0]||null}
$('inBtn').onclick=()=>{const date=localDate();if(openAttendance(date)){alert('برای نوبت قبلی هنوز خروج ثبت نشده است. ابتدا خروج را ثبت کنید.');return}const now=new Date();records.push({id:newId(),date,type:'attendance',in:now.toISOString(),out:'',workplace:settings.workplaceName||''});save();render()};
$('outBtn').onclick=()=>{const date=localDate();const r=openAttendance(date);if(!r){alert('ورود باز برای امروز پیدا نشد. ابتدا «ثبت ورود» را بزنید.');return}r.out=new Date().toISOString();save();render()};
window.editAttendance=id=>{const r=records.find(x=>String(x.id)===String(id));if(!r)return;const date=jalaliInputToISO($('editDate-'+id)?.value);const inValue=$('editIn-'+id)?.value||'';const outValue=$('editOut-'+id)?.value||'';const place=$('editPlace-'+id)?.value.trim()||'';if(!date){alert('تاریخ شمسی را به شکل سال/ماه/روز وارد کنید؛ مثال ۱۴۰۵/۰۸/۰۵.');return}const newIn=inputToISO(inValue),newOut=inputToISO(outValue);if(inValue&&!newIn){alert('ساعت ورود معتبر نیست.');return}if(outValue&&!newOut){alert('ساعت خروج معتبر نیست.');return}if(newIn&&newOut&&new Date(newOut)<new Date(newIn)){alert('ساعت خروج نمی‌تواند قبل از ساعت ورود باشد.');return}r.date=date;r.in=newIn;r.out=newOut;r.workplace=place;save();render();alert('تغییرات ذخیره شد.')};
$('saveExtra').onclick=()=>{
 const entered=$('recordDate').value.trim(),date=jalaliToISO(entered),type=$('kind').value,duration=Number($('duration').value)||0,notes=$('notes').value.trim();
 if(!date){alert('تاریخ شمسی را به شکل ۱۴۰۵/۰۸/۰۴ وارد کنید.');return}
 if(['leave','overtime','leave_daily'].includes(type)&&duration<=0){alert(type==='leave_daily'?'تعداد روز مرخصی را وارد کنید.':'مدت را به ساعت وارد کنید.');return}
 records.push({id:newId(),date,type,duration,notes});save();$('duration').value='';$('notes').value='';render();
};
$('manualAttendanceSave').onclick=()=>{
 const date=jalaliToISO($('manualDate').value.trim()),iv=$('manualIn').value,ov=$('manualOut').value;
 if(!date){alert('تاریخ شمسی معتبر وارد کنید.');return}
 if(!iv||!ov){alert('ساعت ورود و خروج را وارد کنید.');return}
 const toDateTime=(d,t)=>{const [y,m,day]=d.split('-').map(Number),[h,mi]=t.split(':').map(Number);return new Date(y,m-1,day,h,mi).toISOString()};
 const inIso=toDateTime(date,iv),outIso=toDateTime(date,ov);
 if(new Date(outIso)<=new Date(inIso)){alert('ساعت خروج باید بعد از ساعت ورود باشد.');return}
 records.push({id:newId(),date,type:'attendance',in:inIso,out:outIso,workplace:settings.workplaceName||'',manual:true});
 save();render();alert('سابقه روز گذشته ثبت شد و در خروجی قرار می‌گیرد.');
};
$('backupExport').onclick=async()=>{
 try{
  const payload={format:'saatzan-backup',version:1,createdAt:new Date().toISOString(),records,settings};
  const content=JSON.stringify(payload,null,2),filename='saatzan-backup-'+localDate()+'.json';
  if(typeof window.saatzanExportFile==='function'){await window.saatzanExportFile(content,filename);return;}
  const blob=new Blob([content],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),120000);
 }catch(err){alert('پشتیبان‌گیری انجام نشد: '+(err.message||String(err)));}
};
$('backupImportBtn').onclick=()=>$('backupFile').click();
$('backupFile').onchange=async(e)=>{
 const file=e.target.files&&e.target.files[0];if(!file)return;
 try{
  const data=JSON.parse(await file.text());
  if(!data||data.format!=='saatzan-backup'||!Array.isArray(data.records)||!data.settings||typeof data.settings!=='object')throw new Error('ساختار فایل پشتیبان معتبر نیست.');
  if(!confirm('اطلاعات فعلی با فایل پشتیبان جایگزین شود؟'))return;
  records=data.records;settings={requiredHours:8,annualLeaveDays:26,workplaceName:'',biometricEnabled:false,...data.settings};
  localStorage.setItem(storeKey,JSON.stringify(records));localStorage.setItem(settingsKey,JSON.stringify(settings));
  $('requiredHours').value=settings.requiredHours||8;$('annualLeaveDays').value=settings.annualLeaveDays??26;$('workplaceName').value=settings.workplaceName||'';$('biometricEnabled').checked=!!settings.biometricEnabled;
  render();updateClock();alert('بازیابی اطلاعات انجام شد.');
 }catch(err){alert('بازیابی انجام نشد: '+(err.message||String(err)));}
 finally{$('backupFile').value='';}
};
$('kind').addEventListener('change',()=>{const daily=$('kind').value==='leave_daily';$('durationLabel').textContent=daily?'مدت (روز)':'مدت (ساعت)';$('duration').max=daily?'31':'24';$('duration').step=daily?'0.5':'0.25';$('duration').placeholder=daily?'مثلاً ۱':'مثلاً ۱٫۵';});

$('requiredHours').onchange=()=>{settings.requiredHours=Number($('requiredHours').value)||8;localStorage.setItem(settingsKey,JSON.stringify(settings));render()};
$('annualLeaveDays').onchange=()=>{settings.annualLeaveDays=Math.max(0,Number($('annualLeaveDays').value)||0);localStorage.setItem(settingsKey,JSON.stringify(settings));render()};
$('workplaceName').onchange=()=>{settings.workplaceName=$('workplaceName').value.trim();localStorage.setItem(settingsKey,JSON.stringify(settings));updateClock()};
$('biometricEnabled').onchange=async()=>{const desired=$('biometricEnabled').checked;if(typeof window.saatzanConfigureBiometric!=='function'){alert('برای اثر انگشت، نسخه اندروید جدید را نصب کنید. این قابلیت در مرورگر قابل فعال‌سازی نیست.');$('biometricEnabled').checked=!!settings.biometricEnabled;return;}const ok=await window.saatzanConfigureBiometric(desired);if(ok){settings.biometricEnabled=desired;localStorage.setItem(settingsKey,JSON.stringify(settings));}else{$('biometricEnabled').checked=!!settings.biometricEnabled;}};
window.deleteRecord=id=>{if(confirm('این مورد حذف شود؟')){records=records.filter(r=>r.id!==id);save();render()}};
$('exportCsv').onclick=async()=>{
 const month=selectedJalaliMonth();
 if(!/^\d{4}\/\d{1,2}$/.test(month)){alert('ماه را به شکل سال/ماه وارد کنید؛ مثال ۱۴۰۵/۰۸.');return;}
 const monthly=records.filter(r=>recordMatchesJalaliMonth(r.date,month)).sort((a,b)=>a.date.localeCompare(b.date));
 const daily=new Map();
 monthly.filter(isAttendance).forEach(r=>{
  const key=r.date;
  if(!daily.has(key))daily.set(key,{date:key,ins:[],outs:[],minutes:0});
  const d=daily.get(key);d.minutes+=duration(r);
  if(r.in)d.ins.push(r.in);if(r.out)d.outs.push(r.out);
 });
 const dateKeys=[...daily.keys()].sort();
 const detail=[['روز هفته','تاریخ شمسی','اولین ورود','آخرین خروج','جمع کارکرد','ساعت موظفی','اضافه‌کاری','کم‌کاری','تعداد نوبت']];
 let totalMinutes=0,totalOvertime=0,totalShort=0;
 const fmt=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
 const requiredMinutes=(Number(settings.requiredHours)||8)*60;
 const toTime=iso=>iso?new Date(iso).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false}):'';
 dateKeys.forEach(date=>{
  const d=daily.get(date),worked=d.minutes,regular=requiredMinutes,ot=Math.max(0,worked-regular),short=Math.max(0,regular-worked);
  totalMinutes+=worked;totalOvertime+=ot;totalShort+=short;
  const ins=d.ins.sort(),outs=d.outs.sort();
  detail.push([new Intl.DateTimeFormat('fa-IR',{weekday:'long'}).format(new Date(+date.slice(0,4),+date.slice(5,7)-1,+date.slice(8,10),12)),jalaliText(new Date(+date.slice(0,4),+date.slice(5,7)-1,+date.slice(8,10),12)),toTime(ins[0]),toTime(outs[outs.length-1]),fmt(worked),fmt(regular),fmt(ot),fmt(short),d.ins.length]);
 });
 detail.push(['جمع کل ماه','','','',fmt(totalMinutes),fmt(dateKeys.length*requiredMinutes),fmt(totalOvertime),fmt(totalShort),dateKeys.length]);
 const summary=[
  ['خلاصه کارکرد ماهانه',month],
  ['تعداد روزهای دارای ثبت',dateKeys.length],
  ['جمع کل کارکرد (ساعت:دقیقه)',fmt(totalMinutes)],
  ['جمع ساعت موظفی ('+(Number(settings.requiredHours)||8)+' ساعت × روزهای دارای ثبت)',fmt(dateKeys.length*requiredMinutes)],
  ['جمع کل اضافه‌کاری',fmt(totalOvertime)],
  ['جمع کل کم‌کاری',fmt(totalShort)],
  ['مبنای محاسبه','کارکرد هر روز منهای '+(Number(settings.requiredHours)||8)+' ساعت؛ اضافه‌کاری فقط مقدار مثبت است']
 ];
 const leaveRecords=monthly.filter(r=>['leave','leave_daily'].includes(r.type)).sort((a,b)=>a.date.localeCompare(b.date));
 const leaveRows=[['تاریخ شمسی','نوع مرخصی','مدت','معادل ساعت','توضیحات']];
 leaveRecords.forEach(r=>{const day=new Date(+r.date.slice(0,4),+r.date.slice(5,7)-1,+r.date.slice(8,10),12);const daily=r.type==='leave_daily';leaveRows.push([jalaliText(day),daily?'مرخصی روزانه':'مرخصی ساعتی',`${r.duration||0} ${daily?'روز':'ساعت'}`,fmt((Number(r.duration)||0)*(daily?requiredMinutes:60)),r.notes||'']);});
 const annualDays=Number(settings.annualLeaveDays)||0, yearNow=Number(toLatinDigits(month).split('/')[0]);
 const annualUsed=records.filter(r=>['leave','leave_daily'].includes(r.type)&&Number(jalaliInputValue(r.date).slice(0,4))===yearNow).reduce((sum,r)=>sum+(r.type==='leave_daily'?(Number(r.duration)||0):(Number(r.duration)||0)/(Number(settings.requiredHours)||8)),0);
 summary.push(['سهمیه مرخصی استحقاقی سالانه (روز)',annualDays],['مصرف مرخصی استحقاقی در سال انتخابی (روز)',Number(annualUsed.toFixed(2))],['مانده مرخصی سالانه (روز)',Number((annualDays-annualUsed).toFixed(2))]);
 const exportData={filename:`saatzan-${month.replace('/','-')}.xlsx`,sheets:[{name:'کارکرد روزانه',rows:detail},{name:'خلاصه ماه',rows:summary},{name:'سوابق مرخصی',rows:leaveRows}]};
 try{
  if(typeof window.saatzanExportXlsx==='function'){await window.saatzanExportXlsx(exportData);return;}
  const isNative=!!(window.Capacitor&&typeof window.Capacitor.isNativePlatform==='function'&&window.Capacitor.isNativePlatform());
  if(isNative)throw new Error('ماژول خروجی اکسل در APK نصب‌شده نیست؛ APK جدید را نصب کنید.');
  if(typeof window.saatzanCreateXlsx==='function'){
    const base64=window.saatzanCreateXlsx(exportData);
    const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
    const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=exportData.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),120000);return;
  }
  throw new Error('کتابخانه ساخت فایل اکسل بارگذاری نشده است.');
 }catch(err){console.error('XLSX export failed',err);alert('ساخت خروجی اکسل ناموفق بود: '+(err.message||String(err)));}
};
document.querySelectorAll('.nav-btn').forEach(btn=>btn.onclick=()=>{
 document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b===btn));
 document.querySelectorAll('.page-panel').forEach(panel=>panel.hidden=panel.id!==btn.dataset.page);
});
const manualPicker=createJalaliPicker('manualDate','manualDatePicker');
const leavePicker=createJalaliPicker('recordDate','recordDatePicker');
const reportPicker=createJalaliPicker('month','monthPicker',true);
$('month').addEventListener('change',render);
$('month').addEventListener('input',()=>{if(/^\d{4}[\/.-]\d{1,2}$/.test(toLatinDigits($('month').value.trim())))render();});
$('refresh').onclick=render;
render();updateClock();setInterval(updateClock,1000);
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
