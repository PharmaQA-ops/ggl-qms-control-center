const API = window.QMS_CONFIG.API_URL;
const ASSET = window.QMS_CONFIG.ASSET_BASE;

const S = {
  token: '',
  user: {name:'Main Dashboard', username:'MAIN_DASHBOARD', role:'ADMIN'},
  permissions: ['*'],
  page: 'dashboard'
};

const M = {
  quality_events:{t:'Quality Events',a:'QUALITY_EVENTS',p:'QUALITY_EVENT',id:'Quality Event ID',f:[['Date Raised','date'],['Event Type','text',1],['Department','text'],['Process','text'],['Description','textarea',1],['Severity','select',0,['LOW','MEDIUM','HIGH','CRITICAL']],['Risk Level','select',0,['LOW','MEDIUM','HIGH','CRITICAL']],['Owner','text'],['Target Date','date'],['Status','select',0,['OPEN','UNDER_REVIEW','ACTION_IN_PROGRESS','CLOSED']],['Root Cause','textarea'],['Corrective Action','textarea'],['Preventive Action','textarea'],['Closure Date','date'],['Evidence Link','url'],['Remarks','textarea']]},
  complaints:{t:'Complaints',a:'COMPLAINTS',p:'COMPLAINT',id:'Complaint ID',f:[['Received Date','date'],['Customer','text',1],['Country','text'],['Shipment / Job No.','text'],['Complaint Category','text',1],['Complaint Description','textarea',1],['Severity','select',0,['LOW','MEDIUM','HIGH','CRITICAL']],['Risk','select',0,['LOW','MEDIUM','HIGH','CRITICAL']],['Assigned To','text'],['Investigation','textarea'],['Root Cause','textarea'],['Immediate Action','textarea'],['CAPA Required','select',0,['NO','YES']],['CAPA ID','text'],['Customer Response','textarea'],['Target Closure','date'],['Actual Closure','date'],['Status','select',0,['OPEN','UNDER_REVIEW','ACTION_IN_PROGRESS','CLOSED']],['Evidence Link','url'],['Remarks','textarea']]},
  capa:{t:'CAPA',a:'CAPA',p:'CAPA',id:'CAPA ID',f:[['Date Raised','date'],['Source','text',1],['Department','text'],['Process','text'],['Issue / Nonconformity','textarea',1],['Problem Statement','textarea'],['Immediate Correction','textarea'],['Root Cause','textarea'],['Root Cause Method','text'],['Corrective Action','textarea'],['Preventive Action','textarea'],['Action Owner','text'],['Target Date','date'],['Priority','select',0,['LOW','MEDIUM','HIGH','CRITICAL']],['Risk Level','select',0,['LOW','MEDIUM','HIGH','CRITICAL']],['Status','select',0,['OPEN','UNDER_REVIEW','ACTION_IN_PROGRESS','PENDING_EFFECTIVENESS','CLOSED']],['Effectiveness Check','textarea'],['Effectiveness Date','date'],['Effectiveness Result','textarea'],['Closure Date','date'],['Closed By','text'],['Evidence Link','url'],['Complaint ID','text'],['Quality Event ID','text'],['Audit ID','text'],['Compliance ID','text'],['Remarks','textarea']]},
  documents:{t:'Document Control',a:'DOCUMENTS',p:'DOCUMENT',id:'Document ID',f:[['Document Name','text',1],['Document Type','select',1,['POLICY','SOP','WORK_INSTRUCTION','FORM','TEMPLATE','MANUAL','GUIDELINE','RECORD','EXTERNAL_DOCUMENT']],['Category','select',0,['QUALITY','COMPLIANCE','OPERATIONS','SAFETY','SECURITY','HR','IT','TRAINING','CUSTOMER','SUPPLIER']],['Revision','text'],['Version','text'],['Status','select',0,['DRAFT','UNDER_REVIEW','APPROVED','EFFECTIVE','OBSOLETE','ARCHIVED']],['Effective Date','date'],['Review Date','date'],['Owner','text'],['Department','text'],['Classification','select',0,['INTERNAL','CONFIDENTIAL','RESTRICTED']],['Related Module','text'],['Related Record ID','text'],['Description','textarea'],['Drive File ID','text'],['Drive URL','url']]},
  compliance:{t:'Compliance',a:'COMPLIANCE',p:'COMPLIANCE',id:'Compliance ID',f:[['Requirement','textarea',1],['Standard','text'],['Clause','text'],['Department','text'],['Owner','text'],['Due Date','date'],['Status','select',0,['OPEN','UNDER_REVIEW','COMPLIANT','NON_COMPLIANT','CLOSED']],['Risk Level','select',0,['LOW','MEDIUM','HIGH','CRITICAL']],['Last Review','date'],['Next Review','date'],['Evidence Link','url'],['Remarks','textarea']]},
  audits:{t:'Audits',a:'AUDITS',p:'AUDIT',id:'Audit ID',f:[['Audit Date','date',1],['Audit Type','text'],['Standard','text'],['Auditor','text'],['Department','text'],['Scope','textarea'],['Finding Count','number'],['Status','select',0,['PLANNED','IN_PROGRESS','COMPLETED','CLOSED']],['Report Link','url'],['Remarks','textarea']]},
  actions:{t:'Actions',a:'ACTIONS',p:'ACTION',id:'Action ID',f:[['Source','text'],['Source Record ID','text'],['Action Description','textarea',1],['Owner','text'],['Priority','select',0,['LOW','MEDIUM','HIGH','CRITICAL']],['Risk Level','select',0,['LOW','MEDIUM','HIGH','CRITICAL']],['Target Date','date'],['Status','select',0,['OPEN','IN_PROGRESS','COMPLETED','CLOSED']],['Completion Date','date'],['Evidence Link','url'],['Remarks','textarea']]},
  evidence:{t:'Evidence',a:'EVIDENCE',p:'EVIDENCE',id:'Evidence ID',f:[['Module','text',1],['Record ID','text',1],['Evidence Type','text'],['Description','textarea'],['Drive File ID','text'],['Drive URL','url'],['Status','select',0,['ACTIVE','SUPERSEDED','ARCHIVED']],['Remarks','textarea']]},
  training:{t:'Training',a:'TRAINING',p:'TRAINING',id:'Training ID',f:[['Training Topic','text',1],['Training Type','text'],['Trainer','text'],['Department','text'],['Training Date','date'],['Due Date','date'],['Participants','textarea'],['Status','select',0,['PLANNED','COMPLETED','OVERDUE','CANCELLED']],['Evidence Link','url'],['Remarks','textarea']]},
  approvals:{t:'Approvals',a:'APPROVALS',p:'APPROVAL',id:'Approval ID',f:[['Module','text',1],['Record ID','text',1],['Approval Type','text'],['Requested By','text'],['Requested Date','date'],['Approver','text'],['Decision','select',0,['PENDING','APPROVED','REJECTED']],['Decision Date','date'],['Comments','textarea'],['Status','select',0,['PENDING','APPROVED','REJECTED']] ]}
};

const NAV = [['dashboard','Dashboard'],['quality_events','Quality Events','QUALITY_EVENT.VIEW'],['complaints','Complaints','COMPLAINT.VIEW'],['capa','CAPA','CAPA.VIEW'],['documents','Documents','DOCUMENT.VIEW'],['compliance','Compliance','COMPLIANCE.VIEW'],['audits','Audits','AUDIT.VIEW'],['actions','Actions','ACTION.VIEW'],['evidence','Evidence','EVIDENCE.VIEW'],['training','Training','TRAINING.VIEW'],['approvals','Approvals','APPROVAL.VIEW'],['reports','Reports','REPORT.VIEW'],['users','Users','USER.VIEW'],['auditlog','Audit Log','AUDIT_LOG.VIEW']];
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const has = p => S.permissions.includes('*') || S.permissions.includes(p);
const toast = m => { const e=$('toast'); e.textContent=m; e.classList.add('show'); setTimeout(()=>e.classList.remove('show'),2600); };

async function api(payload){
  let response;
  try { response=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)}); }
  catch(e){ throw new Error('API_CONNECTION_FAILED'); }
  let data;
  try { data=await response.json(); } catch(e){ throw new Error('API_INVALID_RESPONSE'); }
  if(!data.success && ['AUTH_REQUIRED','SESSION_EXPIRED'].includes(data.error)){ throw new Error(data.error); }
  return data;
}

function buildNav(){
  const n=$('nav'); n.innerHTML='';
  NAV.forEach(x=>{ if(x[2]&&!has(x[2])) return; const b=document.createElement('button'); b.className='nav'; b.dataset.page=x[0]; b.textContent=x[1]; b.onclick=()=>go(x[0]); n.appendChild(b); });
}
function go(p){
  S.page=p; const x=NAV.find(n=>n[0]===p); $('title').textContent=x?x[1]:p;
  document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.page===p));
  if(p==='dashboard') dashboard(); else if(p==='reports') reports(); else if(p==='users') users(); else if(p==='auditlog') auditlog(); else modulePage(p);
  document.querySelector('aside').classList.remove('open');
}

async function login(e){
  e.preventDefault(); $('loginError').textContent=''; $('loginBtn').disabled=true; $('loginBtn').textContent='Signing in…';
  try{
    const r=await api({action:'LOGIN',username:$('username').value.trim(),password:$('password').value});
    if(!r.success) throw new Error(r.error||'LOGIN_FAILED');
    S.token=r.token; S.user=r.user; S.permissions=r.permissions||[];
    localStorage.setItem('GGL_QMS_TOKEN',S.token); localStorage.setItem('GGL_QMS_USER',JSON.stringify(S.user)); localStorage.setItem('GGL_QMS_PERMISSIONS',JSON.stringify(S.permissions));
    show();
  }catch(x){ $('loginError').textContent=x.message; }
  finally{ $('loginBtn').disabled=false; $('loginBtn').textContent='Sign In'; }
}
function show(){ $('login').classList.add('hidden'); $('app').classList.remove('hidden'); $('who').textContent=`${S.user?.name||S.user?.username||''} • ${S.user?.role||''}`; buildNav(); go('dashboard'); }
function logout(remote=true){ if(remote&&S.token) api({action:'LOGOUT',token:S.token}).catch(()=>{}); localStorage.removeItem('GGL_QMS_TOKEN'); localStorage.removeItem('GGL_QMS_USER'); localStorage.removeItem('GGL_QMS_PERMISSIONS'); S.token=''; S.user=null; S.permissions=[]; $('app').classList.add('hidden'); $('login').classList.remove('hidden'); $('password').value=''; }

async function dashboard(){
  $('content').innerHTML='<div class="head"><div><h1>QMS Dashboard</h1><p>Production operational overview.</p></div></div><div id="dash" class="cards"><div class="panel loading">Loading…</div></div>';
  try{ const r=await api({action:'QMS_DASHBOARD',token:S.token}); if(!r.success) throw new Error(r.error); $('dash').innerHTML=Object.entries(r.counts||{}).map(([k,v])=>`<div class="card"><small>${esc(k.replaceAll('_',' '))}</small><strong>${v.total}</strong><span>${v.open} open • ${v.overdue} overdue</span></div>`).join('')||'<div class="panel empty">No modules available.</div>'; }catch(e){ $('dash').innerHTML=`<div class="panel empty">${esc(e.message)}</div>`; }
}

function field(f,val=''){ const [n,t,req,opts]=f; const label=`${esc(n)}${req?' *':''}`; if(t==='textarea') return `<label class="full">${label}<textarea name="${esc(n)}" rows="3" ${req?'required':''}>${esc(val)}</textarea></label>`; if(t==='select') return `<label>${label}<select name="${esc(n)}" ${req?'required':''}><option value="">Select</option>${opts.map(o=>`<option value="${esc(o)}" ${o===val?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`; return `<label>${label}<input name="${esc(n)}" type="${t}" value="${esc(val)}" ${req?'required':''}></label>`; }
function openForm(page,old=null){
  const m=M[page]; $('modal').innerHTML=`<div class="modalbg"><div class="modalbox"><div class="modalhead"><div><h2>${old?'Edit':'New'} ${esc(m.t)}</h2><small>${esc(old?.[m.id]||'')}</small></div><button class="close" type="button" onclick="closeModal()">×</button></div><form id="recordForm" class="form">${m.f.map(f=>field(f,old?.[f[0]])).join('')}<div class="actions"><button type="button" class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" id="saveBtn">Save</button></div></form></div></div>`;
  $('recordForm').onsubmit=async e=>{e.preventDefault();$('saveBtn').disabled=true;$('saveBtn').textContent='Saving…';let d={};new FormData($('recordForm')).forEach((v,k)=>d[k]=v);try{const r=await api({action:old?'QMS_UPDATE':'QMS_CREATE',module:m.a,recordId:old?.[m.id],record:d,token:S.token});if(!r.success)throw new Error(r.error);closeModal();toast(old?'Record updated':'Record created');modulePage(page);}catch(x){toast(x.message);}finally{$('saveBtn').disabled=false;$('saveBtn').textContent='Save';}};
}
function closeModal(){ $('modal').innerHTML=''; }
function rowActions(page,r){ const m=M[page], id=esc(r[m.id]); let a=''; if(has(m.p+'.EDIT')||has('*')) a+=`<button class="mini" onclick='editRecord(${JSON.stringify(page)},${JSON.stringify(r)})'>Edit</button>`; if(has('*')) a+=`<button class="mini danger" onclick='deleteRecord(${JSON.stringify(page)},${JSON.stringify(r[m.id])})'>Delete</button>`; return a||'—'; }
function rows(page,rs){ const m=M[page]; if(!rs.length)return'<tr><td colspan="9" class="empty">No records.</td></tr>'; const cols=[m.id,...m.f.map(f=>f[0])].slice(0,8); return rs.map(r=>`<tr>${cols.map(c=>`<td>${c===m.id?'<b>'+esc(r[c])+'</b>':c==='Status'?'<span class="badge">'+esc(r[c])+'</span>':c.endsWith('Link')&&r[c]?`<a href="${esc(r[c])}" target="_blank" rel="noopener">Open</a>`:esc(r[c])}</td>`).join('')}<td class="actionscell">${rowActions(page,r)}</td></tr>`).join(''); }
async function editRecord(page,r){ openForm(page,r); }
async function deleteRecord(page,id){ if(!confirm(`Delete ${id}? This cannot be undone.`))return; const m=M[page]; try{const r=await api({action:'QMS_DELETE',module:m.a,recordId:id,token:S.token});if(!r.success)throw new Error(r.error);toast('Record deleted');modulePage(page);}catch(e){toast(e.message);} }
async function modulePage(p){
  const m=M[p]; if(!m)return;
  $('content').innerHTML=`<div class="head"><div><h1>${esc(m.t)}</h1><p>Production QMS register.</p></div>${has(m.p+'.CREATE')||has('*')?`<button class="btn primary" id="newBtn">+ New</button>`:''}</div><div class="toolbar"><input class="search" id="searchBox" placeholder="Search records"><span id="recordCount">Loading…</span></div><div class="panel"><div class="tablewrap"><table class="table"><thead><tr>${[m.id,...m.f.map(f=>f[0])].slice(0,8).map(x=>`<th>${esc(x)}</th>`).join('')}<th>Actions</th></tr></thead><tbody id="tbody"><tr><td colspan="9" class="empty">Loading…</td></tr></tbody></table></div></div>`;
  if($('newBtn')) $('newBtn').onclick=()=>openForm(p);
  try{const r=await api({action:'QMS_LIST',module:m.a,token:S.token});if(!r.success)throw new Error(r.error);const rs=r.records||[];$('recordCount').textContent=`${rs.length} record${rs.length===1?'':'s'}`;const render=arr=>{$('tbody').innerHTML=rows(p,arr)};render(rs);$('searchBox').oninput=()=>{const v=$('searchBox').value.toLowerCase();render(rs.filter(x=>Object.values(x).some(y=>String(y??'').toLowerCase().includes(v))))};}catch(e){$('tbody').innerHTML=`<tr><td colspan="9" class="empty">${esc(e.message)}</td></tr>`;}
}

async function reports(){
  $('content').innerHTML=`<div class="head"><div><h1>Quality Reports</h1><p>Quality Events • Complaints • CAPA</p></div></div><div class="panel"><div class="filters"><label>From<input type="date" id="reportFrom"></label><label>To<input type="date" id="reportTo"></label><label>Status<select id="reportStatus"><option>ALL</option><option>OPEN</option><option>CLOSED</option></select></label></div></div><div class="reports">${rc('QRT-001','Quality Events Report','Quality events, risk, ownership, overdue and closure.','QUALITY_EVENTS')}${rc('QRT-002','Complaints Report','Customer complaints, severity, investigation and CAPA linkage.','COMPLAINTS')}${rc('QRT-003','CAPA Management Report','CAPA status, priority, risk, overdue and effectiveness.','CAPA')}</div><div id="reportResult"></div>`;
}
function rc(id,t,d,m){return `<div class="panel report"><small>${id}</small><h2>${t}</h2><p>${d}</p><button class="btn primary reportBtn" data-report="${id}">Generate Report</button></div>`;}
async function report(id,b){ b.disabled=true;b.textContent='Generating…';try{const r=await api({action:'REPORT',reportId:id,token:S.token,options:{fromDate:$('reportFrom').value,toDate:$('reportTo').value,status:$('reportStatus').value}});if(!r.success)throw new Error(r.error);const s=r.summary||{},f=r.files||{};$('reportResult').innerHTML=`<div class="panel"><h2>${esc(r.reportName)}</h2><p>${r.recordCount} records</p><div class="stats"><div>Total<b>${s.total||0}</b></div><div>Open<b>${s.open||0}</b></div><div>Closed<b>${s.closed||0}</b></div><div>Overdue<b>${s.overdue||0}</b></div></div><div class="download">${Object.entries(f).map(([k,v])=>`<a class="btn" target="_blank" rel="noopener" href="${esc(v.url)}">${k.toUpperCase()}</a>`).join('')}</div></div>`;toast('Report generated');}catch(e){toast(e.message);}finally{b.disabled=false;b.textContent='Generate Report';} }

async function users(){
  $('content').innerHTML=`<div class="head"><div><h1>Users</h1><p>Access administration.</p></div>${has('USER.CREATE')?'<button class="btn primary" id="newUser">+ New User</button>':''}</div><div class="panel"><div class="tablewrap"><table class="table"><thead><tr><th>ID</th><th>Username</th><th>Name</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody id="userRows"><tr><td colspan="6" class="empty">Loading…</td></tr></tbody></table></div></div>`;
  if($('newUser')) $('newUser').onclick=()=>userForm();
  try{const r=await api({action:'LIST_USERS',token:S.token});if(!r.success)throw new Error(r.error);$('userRows').innerHTML=(r.users||[]).map(u=>`<tr><td>${esc(u.userId)}</td><td>${esc(u.username)}</td><td>${esc(u.name)}</td><td><span class="badge">${esc(u.role)}</span></td><td>${esc(u.status)}</td><td>${has('USER.EDIT')?`<button class="mini" onclick='userForm(${JSON.stringify(u)})'>Edit</button>`:''}${has('USER.DISABLE')&&u.status==='ACTIVE'?`<button class="mini danger" onclick='disableUser(${JSON.stringify(u.userId)})'>Disable</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">No users.</td></tr>';}catch(e){$('userRows').innerHTML=`<tr><td colspan="6" class="empty">${esc(e.message)}</td></tr>`;}
}
function userForm(old=null){$('modal').innerHTML=`<div class="modalbg"><div class="modalbox small"><div class="modalhead"><div><h2>${old?'Edit':'New'} User</h2><small>${esc(old?.username||'')}</small></div><button class="close" type="button" onclick="closeModal()">×</button></div><form id="userForm" class="form"><label>Username<input name="username" ${old?'disabled':''} value="${esc(old?.username||'')}" required></label><label>Name<input name="name" value="${esc(old?.name||'')}" required></label>${old?'':'<label>Password<input name="password" type="password" minlength="8" required></label>'}<label>Role<select name="role" required>${['ADMIN','QUALITY','AUDITOR','MANAGER','USER'].map(x=>`<option ${x===old?.role?'selected':''}>${x}</option>`).join('')}</select></label><label>Department<input name="department" value="${esc(old?.department||'')}" ></label><label>Designation<input name="designation" value="${esc(old?.designation||'')}" ></label><div class="actions"><button type="button" class="btn" onclick="closeModal()">Cancel</button><button class="btn primary">Save</button></div></form></div></div>`;$('userForm').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData($('userForm')).entries());try{const r=await api(old?{action:'UPDATE_USER',token:S.token,userId:old.userId,name:d.name,role:d.role,department:d.department,designation:d.designation}:{action:'CREATE_USER',token:S.token,username:d.username,password:d.password,name:d.name,role:d.role,department:d.department,designation:d.designation});if(!r.success)throw new Error(r.error);closeModal();toast(old?'User updated':'User created');users();}catch(x){toast(x.message);}};}
async function disableUser(id){if(!confirm(`Disable ${id}?`))return;try{const r=await api({action:'DISABLE_USER',token:S.token,userId:id});if(!r.success)throw new Error(r.error);toast('User disabled');users();}catch(e){toast(e.message);}}

async function auditlog(){try{const r=await api({action:'AUDIT_LOG',token:S.token});if(!r.success)throw new Error(r.error);$('content').innerHTML=`<div class="head"><div><h1>Audit Log</h1><p>System activity trail.</p></div></div><div class="panel"><div class="tablewrap"><table class="table"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Module</th><th>Record</th><th>Result</th></tr></thead><tbody>${(r.records||[]).map(x=>`<tr><td>${esc(x.Timestamp)}</td><td>${esc(x.Username)}</td><td>${esc(x.Action)}</td><td>${esc(x.Module)}</td><td>${esc(x['Record ID'])}</td><td>${esc(x.Result)}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">No activity.</td></tr>'}</tbody></table></div></div>`;}catch(e){$('content').innerHTML=`<div class="panel empty">${esc(e.message)}</div>`;}}

window.openForm=openForm; window.closeModal=closeModal; window.editRecord=editRecord; window.deleteRecord=deleteRecord; window.report=report; window.userForm=userForm; window.disableUser=disableUser;

document.addEventListener('click',e=>{const b=e.target.closest('.reportBtn');if(b)report(b.dataset.report,b);});
$('backDashboard').addEventListener('click',()=>window.history.back()); $('menu').addEventListener('click',()=>$('app').querySelector('aside').classList.toggle('open'));
show();
