var signupType='s';
var accounts=[
{id:'student',pw:'student123',type:'student',fname:'Juan',lname:'Dela Cruz',grade:'Grade 10 - Rizal',lrn:'136789012345'},
{id:'teacher',pw:'teacher123',type:'teacher',fname:'Elena',lname:'Bautista',dept:'Mathematics',eid:'T-2024-001'},
{id:'parent',pw:'parent123',type:'parent',fname:'Roberto',lname:'Dela Cruz',childLrn:'136789012345',childName:'Juan Dela Cruz'}
];

// Load signup accounts from Firebase (loaded via loadAllFromFirebase)
function loadSavedAccounts() {
  var saved = loadData('accounts', []);
  saved.forEach(function(a) {
    if (!accounts.find(function(x) { return x.id === a.id; })) {
      accounts.push(a);
    }
  });
}

var curUser=null;

// === RENDER DYNAMIC CONTENT FROM SHARED DATA ===
function renderPortalContent() {
  console.log('renderPortalContent called!');
  // Render stats from settings
  var settings = loadData('settings', DEFAULT_SETTINGS);
  var s1=document.getElementById('pStat1');
  var s2=document.getElementById('pStat2');
  var s3=document.getElementById('pStat3');
  var s4=document.getElementById('pStat4');
  if(s1 && settings.stat1) s1.textContent=settings.stat1;
  if(s2 && settings.stat2) s2.textContent=settings.stat2;
  if(s3 && settings.stat3) s3.textContent=settings.stat3;
  if(s4 && settings.stat4) s4.textContent=settings.stat4;
  // Render enrollment chart from settings
  var grades = ['G7','G8','G9','G10','G11','G12'];
  var defaults = {G7:'210',G8:'198',G9:'185',G10:'172',G11:'250',G12:'232'};
  var vals = [];
  var maxVal = 0;
  grades.forEach(function(g) {
    var v = parseInt(settings['g'+g.replace('G','')]) || parseInt(defaults[g]) || 0;
    vals.push(v);
    if (v > maxVal) maxVal = v;
  });
  grades.forEach(function(g, i) {
    var el = document.getElementById('e'+g);
    var bar = document.getElementById('bar'+g);
    if (el) el.textContent = vals[i];
    if (bar && maxVal > 0) {
      bar.style.width = Math.max(10, Math.round((vals[i]/maxVal)*100)) + '%';
    }
  });
  var news = loadData('news', DEFAULT_NEWS);
  var events = loadData('events', DEFAULT_EVENTS);
  var published = news.filter(function(n) { return n.status === 'Published'; });
  var upcoming = events.filter(function(e) { return e.status === 'Upcoming'; });

  // Render news
  var newsEl = document.getElementById('portalNews');
  console.log('portalNews element:', newsEl ? 'FOUND' : 'NOT FOUND');
  console.log('Published news:', published.length);
  if (newsEl && published.length > 0) {
    var colors = ['ni-a','ni-b','ni-c','ni-d'];
    var icons = ['&#127942;','&#128227;','&#127793;','&#128218;'];
    var html = '';
    // Main featured
    var feat = published[0];
    html += '<div class="ncard nmain"><div class="nimg ' + (feat.image ? '" style="background:none' : colors[0]) + '">' + (feat.image ? '<img src="'+feat.image+'" style="width:100%;height:100%;object-fit:cover">' : icons[0]) + '</div><span class="nbadge">Featured</span><div class="nbody"><div class="ndate">' + formatDate(feat.date) + '</div><h3>' + feat.title + '</h3><p>' + (feat.content || '') + '</p><a href="#" class="nlink">Read more &#8594;</a></div></div>';
    // Side cards
    for (var i = 1; i < Math.min(published.length, 3); i++) {
      var n = published[i];
      html += '<div class="ncard"><div class="nimg ' + (n.image ? '" style="background:none' : colors[i % 4]) + '">' + (n.image ? '<img src="'+n.image+'" style="width:100%;height:100%;object-fit:cover">' : icons[i % 4]) + '</div><div class="nbody"><div class="ndate">' + formatDate(n.date) + '</div><h3>' + n.title + '</h3><p>' + (n.content || '') + '</p><a href="#" class="nlink">Read more &#8594;</a></div></div>';
    }
    newsEl.innerHTML = html;
  }

  // Render events
  var evEl = document.getElementById('portalEvents');
  console.log('portalEvents element:', evEl ? 'FOUND' : 'NOT FOUND');
  console.log('Upcoming events:', upcoming.length);
  if (evEl && upcoming.length > 0) {
    var ehtml = '';
    upcoming.forEach(function(e) {
      var ds = formatDateShort(e.date);
      ehtml += '<div class="ecard"><div class="ebox"><div class="m">' + ds.month + '</div><div class="d">' + ds.day + '</div></div><div class="einfo"><h3>' + e.name + '</h3><p>' + (e.desc || '') + '</p></div><div class="etime">' + e.time + '</div></div>';
    });
    evEl.innerHTML = ehtml;
  }
}

// Run on page load
// Run immediately since script is at bottom of body
// Load data from Firebase, then render
loadAllFromFirebase(function() {
  try {
    renderPortalContent();
    populateSectionDropdowns();
    renderCalendar();
    renderCommunity();
    console.log('Portal content rendered from Firebase!');
  } catch(e) {
    console.error('renderPortalContent ERROR:', e);
  }
});
// Listen for real-time changes from admin
listenForChanges(function() {
  renderPortalContent();
    populateSectionDropdowns();
    renderCalendar();
    renderCommunity();
  console.log('Real-time update received!');
});

// Real-time updates handled by Firebase listener above

// === AUTH FUNCTIONS ===
function openM(m){document.getElementById('authModal').classList.add('act');switchMode(m||'login')}
function closeM(){document.getElementById('authModal').classList.remove('act')}
function switchMode(m){var l=m==='login';document.getElementById('loginForm').style.display=l?'block':'none';document.getElementById('signupForm').style.display=l?'none':'block';document.getElementById('mtL').className='tab'+(l?' act':'');document.getElementById('mtS').className='tab'+(l?'':' act')}
function stab(el){el.parentElement.querySelectorAll('.tab').forEach(function(t){t.className='tab'});el.className='tab act'}
function stype(el,t){stab(el);signupType=t;document.getElementById('fLrn').style.display=t==='s'?'block':'none';document.getElementById('fGender').style.display=t==='s'?'block':'none';document.getElementById('fEmp').style.display=t==='t'?'block':'none';document.getElementById('fChild').style.display=t==='p'?'block':'none';document.getElementById('fGrade').style.display=t==='s'?'block':'none'}

function doLogin(){
loadSavedAccounts();
var id=document.getElementById('liId').value.trim().toLowerCase();
var pw=document.getElementById('liPw').value;
var user=accounts.find(function(a){return (a.id===id||a.lrn===id||a.eid===id||(a.email&&a.email.toLowerCase()===id))&&a.pw===pw});
if(!user){toast('Invalid credentials. Please check your ID and password.','er');return}
completeLogin(user);
}

function completeLogin(user){
curUser=user;closeM();
document.getElementById('publicSite').style.display='none';
if(user.type==='student'){
document.getElementById('studentDash').classList.add('act');
document.getElementById('sdAv').textContent=user.fname[0];
document.getElementById('sdName').textContent=user.fname+' '+user.lname;
document.getElementById('sdWelcome').textContent=user.fname;
}else if(user.type==='teacher'){
document.getElementById('teacherDash').classList.add('act');
// Look up advisory sections from the Teachers Directory (matched by Employee ID)
var teacherRecords = loadData('teachers', DEFAULT_TEACHERS);
var teacherRecord = teacherRecords.find(function(t){return t.eid===user.eid});
curUser.sections = (teacherRecord && teacherRecord.sections && teacherRecord.sections.length > 0) ? teacherRecord.sections : null;
setTimeout(function() {
  try { populateSectionDropdowns(); } catch(e) { console.error('populateSectionDropdowns error:', e); }
  try { loadMyClasses(); } catch(e) { console.error('loadMyClasses error:', e); }
  try { loadTeacherQuizzes(); } catch(e) { console.error('loadTeacherQuizzes error:', e); }
  try { updateTeacherStats(); } catch(e) { console.error('updateTeacherStats error:', e); }
}, 200);
document.getElementById('tdAv').textContent=user.fname[0];
document.getElementById('tdName').textContent=user.fname+' '+user.lname;
document.getElementById('tdWelcome').textContent=user.fname;
}else if(user.type==='parent'){
document.getElementById('parentDash').classList.add('act');
document.getElementById('pdAv').textContent=user.fname[0];
document.getElementById('pdName').textContent=user.fname+' '+user.lname;
document.getElementById('pdWelcome').textContent=user.fname;
if(document.getElementById('pdChild'))document.getElementById('pdChild').textContent=user.childName||'Your Child';
setTimeout(function() { loadParentGrades(); loadParentAttendance(); }, 200);
}
toast('Welcome, '+user.fname+'!');
}

// ============================================
// FINGERPRINT LOGIN (WebAuthn) - Teacher accounts only
// ============================================
// NOTE: this is a convenience feature, not a full security implementation.
// There is no backend server to verify the cryptographic signature - we only
// check that the browser's platform authenticator (fingerprint/Face ID/Windows Hello)
// returns a credential ID matching one stored for a teacher account. The actual
// biometric check happens at the OS/hardware level via the browser, which is what
// prevents someone without the registered fingerprint from completing the prompt.

function isWebAuthnAvailable() {
  return !!(window.PublicKeyCredential && navigator.credentials);
}

function closeFingerprintModal() {
  document.getElementById('fingerprintModal').style.display = 'none';
}

function openFingerprintEnroll() {
  if (!isWebAuthnAvailable()) {
    toast('Fingerprint login is not supported on this browser/device.', 'er');
    return;
  }
  if (!window.isSecureContext) {
    toast('Fingerprint login requires a secure (HTTPS) connection.', 'er');
    return;
  }
  var already = curUser && curUser.webauthnCredentialId;
  var body = '<p style="font-size:13px;color:var(--g5);margin-bottom:14px">' +
    (already
      ? 'Fingerprint login is already enabled for your account on a registered device. You can re-enroll if you\'re setting this up on a new device.'
      : 'This will use your device\'s fingerprint sensor, Face ID, or Windows Hello as a quick way to log in next time, instead of typing your password. Your password will still work as a backup.') +
    '</p>' +
    '<div style="display:flex;gap:10px"><button class="btn btn-p" onclick="enrollFingerprint()">&#128272; ' + (already ? 'Re-enroll on this device' : 'Set Up Fingerprint Login') + '</button><button class="btn btn-s" onclick="closeFingerprintModal()">Cancel</button></div>';
  document.getElementById('fingerprintModalContent').innerHTML = body;
  document.getElementById('fingerprintModal').style.display = 'flex';
}

function enrollFingerprint() {
  var challenge = crypto.getRandomValues(new Uint8Array(32));
  var userIdBytes = new TextEncoder().encode(curUser.id);
  
  navigator.credentials.create({
    publicKey: {
      challenge: challenge,
      rp: { name: 'DBAMINHS Teacher Portal' },
      user: {
        id: userIdBytes,
        name: curUser.email || curUser.id,
        displayName: curUser.fname + ' ' + curUser.lname
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
      timeout: 60000,
      attestation: 'none'
    }
  }).then(function(credential) {
    var credentialId = btoa(String.fromCharCode.apply(null, new Uint8Array(credential.rawId)));
    curUser.webauthnCredentialId = credentialId;
    
    // Persist to the saved accounts list in Firebase
    var saved = loadData('accounts', []);
    var idx = saved.findIndex(function(a) { return a.id === curUser.id; });
    if (idx > -1) {
      saved[idx].webauthnCredentialId = credentialId;
    } else {
      saved.push(curUser);
    }
    saveData('accounts', saved);
    
    closeFingerprintModal();
    toast('Fingerprint login enabled on this device!', 'su');
  }).catch(function(err) {
    console.error('Fingerprint enrollment error:', err);
    toast('Could not set up fingerprint login: ' + err.message, 'er');
  });
}

function loginWithFingerprint() {
  if (!isWebAuthnAvailable()) {
    toast('Fingerprint login is not supported on this browser/device.', 'er');
    return;
  }
  if (!window.isSecureContext) {
    toast('Fingerprint login requires a secure (HTTPS) connection.', 'er');
    return;
  }
  
  loadSavedAccounts();
  var enrolled = accounts.filter(function(a) { return a.type === 'teacher' && a.webauthnCredentialId; });
  if (enrolled.length === 0) {
    toast('No teacher account on this device has fingerprint login set up yet. Log in with your password first, then enable it from the dashboard.', 'er');
    return;
  }
  
  var allowCredentials = enrolled.map(function(a) {
    var binary = atob(a.webauthnCredentialId);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { id: bytes, type: 'public-key' };
  });
  
  var challenge = crypto.getRandomValues(new Uint8Array(32));
  
  navigator.credentials.get({
    publicKey: {
      challenge: challenge,
      allowCredentials: allowCredentials,
      userVerification: 'required',
      timeout: 60000
    }
  }).then(function(assertion) {
    var credentialId = btoa(String.fromCharCode.apply(null, new Uint8Array(assertion.rawId)));
    var matchedUser = enrolled.find(function(a) { return a.webauthnCredentialId === credentialId; });
    if (!matchedUser) {
      toast('Fingerprint not recognized for any enrolled account.', 'er');
      return;
    }
    completeLogin(matchedUser);
  }).catch(function(err) {
    console.error('Fingerprint login error:', err);
    toast('Fingerprint login failed or was cancelled.', 'er');
  });
}

// ============================================
// FORGOT PASSWORD (Admin-assisted reset)
// ============================================
// There is no email server in this setup, so a true self-service reset isn't possible.
// Instead, the person submits a reset request (ID + the new password they want), which is
// stored for an admin to review and approve. The password is only changed once an admin
// confirms the requester's identity and approves the request.

function closeForgotPasswordModal() {
  document.getElementById('forgotPasswordModal').style.display = 'none';
}

function openForgotPassword() {
  var body = '<p style="font-size:13px;color:var(--g5);margin-bottom:14px">' +
    'There is no automatic email reset for this portal. Instead, submit your ID and the new password you\'d like \u2014 a school administrator will verify your identity and approve the change. You\'ll be notified once it\'s approved.' +
    '</p>' +
    '<div class="fg"><label>LRN / Employee ID / Email</label><input type="text" id="fpId" placeholder="Enter your ID or email"></div>' +
    '<div class="fg"><label>New Password (at least 8 characters)</label><input type="password" id="fpNewPw" placeholder="Enter a new password"></div>' +
    '<div class="fg"><label>Confirm New Password</label><input type="password" id="fpNewPw2" placeholder="Re-enter the new password"></div>' +
    '<button class="btn btn-p btn-full" onclick="submitPasswordResetRequest()">Submit Request</button>';
  document.getElementById('forgotPasswordModalContent').innerHTML = body;
  document.getElementById('forgotPasswordModal').style.display = 'flex';
}

function submitPasswordResetRequest() {
  loadSavedAccounts();
  var id = document.getElementById('fpId').value.trim();
  var pw1 = document.getElementById('fpNewPw').value;
  var pw2 = document.getElementById('fpNewPw2').value;
  
  if (!id) { toast('Please enter your ID or email.', 'er'); return; }
  if (!pw1 || pw1.length < 8) { toast('New password must be at least 8 characters.', 'er'); return; }
  if (pw1 !== pw2) { toast('Passwords do not match.', 'er'); return; }
  
  var idLower = id.toLowerCase();
  var account = accounts.find(function(a) {
    return a.id === idLower || a.lrn === id || a.eid === id || (a.email && a.email.toLowerCase() === idLower);
  });
  
  if (!account) {
    toast('No account found with that ID or email.', 'er');
    return;
  }
  
  var requests = loadData('passwordResetRequests', []);
  // Replace any existing pending request for the same account so there's only one active request at a time.
  requests = requests.filter(function(r) { return r.accountId !== account.id; });
  requests.unshift({
    id: Date.now(),
    accountId: account.id,
    accountType: account.type,
    name: (account.fname || '') + ' ' + (account.lname || ''),
    lookupId: id,
    newPassword: pw1,
    status: 'pending',
    requestedAt: new Date().toISOString().split('T')[0]
  });
  saveData('passwordResetRequests', requests);
  
  closeForgotPasswordModal();
  toast('Request submitted! An administrator will review and approve it shortly.', 'su');
}

function doLogout(){
curUser=null;
document.querySelectorAll('.dash-page').forEach(function(p){p.classList.remove('act')});
document.getElementById('publicSite').style.display='block';
window.scrollTo({top:0});
toast('Logged out successfully');
}

function doSignup(){
loadSavedAccounts();
var fn=document.getElementById('sf').value.trim();
var ln=document.getElementById('sl').value.trim();
var em=document.getElementById('se').value.trim();
var p1=document.getElementById('sp1').value;
var p2=document.getElementById('sp2').value;
var ag=document.getElementById('sag').checked;
if(!fn||!ln){toast('Please enter your full name.','er');return}
if(!em){toast('Please enter email.','er');return}
if(!p1||p1.length<8){toast('Password must be at least 8 characters.','er');return}
if(p1!==p2){toast('Passwords do not match.','er');return}
if(!ag){toast('Please agree to Terms & Conditions.','er');return}
var newAcc={id:em.toLowerCase(),pw:p1,type:signupType==='s'?'student':signupType==='t'?'teacher':'parent',fname:fn,lname:ln,email:em};
if(signupType==='s'){
newAcc.lrn=document.getElementById('sLrn').value.trim();
newAcc.grade=document.getElementById('sGradeSection').value||'TBA';
newAcc.gender=document.getElementById('sGender').value||'';
if(!newAcc.lrn){toast('Please enter LRN.','er');return}
if(!newAcc.gender){toast('Please select your gender.','er');return}
if(accounts.find(function(a){return a.lrn===newAcc.lrn})){toast('This LRN is already registered. Please log in instead, or contact the admin if this is a mistake.','er');return}
newAcc.id=newAcc.lrn;
}else if(signupType==='t'){
newAcc.eid=document.getElementById('sEmp').value.trim();
newAcc.dept='TBA';
if(!newAcc.eid){toast('Please enter Employee ID.','er');return}
if(accounts.find(function(a){return a.eid===newAcc.eid})){toast('This Employee ID is already registered. Please log in instead, or contact the admin if this is a mistake.','er');return}
newAcc.id=newAcc.eid;
}else{
newAcc.childLrn=document.getElementById('sChild').value.trim();
newAcc.childName='Your Child';
if(!newAcc.childLrn){toast('Please enter child LRN.','er');return}
}
if(accounts.find(function(a){return a.id===newAcc.id})){toast('An account with this ID already exists. Please log in instead.','er');return}
accounts.push(newAcc);
// Save account to Firebase
var accts = loadData('accounts', []);
accts.push(newAcc);
saveData('accounts', accts);
// Add to pending signups - load fresh from Firebase first
db.collection('portal_data').doc('pending').get().then(function(doc) {
  var pending = [];
  if (doc.exists) {
    try { pending = JSON.parse(doc.data().data); } catch(e) { pending = []; }
  }
  var maxId = 0;
  pending.forEach(function(p) { if (p.id > maxId) maxId = p.id; });
  pending.unshift({
    id: maxId + 1,
    name: fn + ' ' + ln,
    type: newAcc.type.charAt(0).toUpperCase() + newAcc.type.slice(1),
    email: em,
    idnum: newAcc.lrn || newAcc.eid || newAcc.childLrn || '',
    grade: newAcc.grade || '',
    date: new Date().toISOString().split('T')[0]
  });
  saveData('pending', pending);
  console.log('Signup added to pending! Total pending:', pending.length);
}).catch(function(err) {
  console.error('Error adding to pending:', err);
});

toast('Account created! Welcome, '+fn+'! You can now log in.');
switchMode('login');
document.getElementById('liId').value=newAcc.id;
document.getElementById('liPw').value='';
}

function sdTab(el,id){el.parentElement.querySelectorAll('button').forEach(function(b){b.className=''});el.className='act';['sdGrades','sdSched','sdTasks','sdAtt'].forEach(function(x){document.getElementById(x).style.display=x===id?'block':'none'})}
function tdTab(el,id){el.parentElement.querySelectorAll('button').forEach(function(b){b.className=''});el.className='act';['tdClasses','tdGrade','tdAttendance','tdQuiz','tdSchedule','tdAnnounce'].forEach(function(x){var e=document.getElementById(x);if(e)e.style.display=x===id?'block':'none'})}
function pdTab(el,id){el.parentElement.querySelectorAll('button').forEach(function(b){b.className=''});el.className='act';['pdGrades','pdAtt','pdMsg'].forEach(function(x){document.getElementById(x).style.display=x===id?'block':'none'})}

var tt;
function toast(m,c){
var t=document.getElementById('toastEl');
if(!t)return;
t.textContent=m;
t.className='toast'+(c==='er'?' er':'')+' show';
clearTimeout(tt);
tt=setTimeout(function(){t.classList.remove('show')},3500);
}

window.addEventListener('scroll',function(){
var nb=document.getElementById('navbar');
var st=document.getElementById('stt');
if(nb)nb.classList.toggle('scrolled',window.scrollY>50);
if(st)st.classList.toggle('vis',window.scrollY>400);
});

document.querySelectorAll('a[href^="#"]').forEach(function(a){
a.addEventListener('click',function(e){
var h=this.getAttribute('href');
if(h&&h.length>1){
e.preventDefault();
var t=document.querySelector(h);
if(t){t.scrollIntoView({behavior:'smooth'});var nl=document.querySelector('.nlinks');if(nl)nl.classList.remove('open')}
}
});
});

var lpw=document.getElementById('liPw');
if(lpw)lpw.addEventListener('keydown',function(e){if(e.key==='Enter')doLogin()});

// ============================================
// GRADE UPLOAD SYSTEM
// ============================================


// Parses a single CSV line into fields, respecting double-quoted fields that may contain commas
// (needed now that Name is formatted as "Last Name, First Name").
function parseCSVLine(line) {
  var fields = [];
  var cur = '';
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}
// splitName, toLastFirst, fromLastFirst, and sortByLastName are defined in firebase-data.js
// (shared with admin.html), which is loaded before this file.

function downloadTemplate() {
  var cls = document.getElementById('gradeClass').value;
  var settings = loadData('settings', DEFAULT_SETTINGS);
  var secs = (settings.sections && settings.sections.length > 0) ? settings.sections : DEFAULT_SECTIONS;
  var subjects = getSubjectsForSection(cls, secs);
  
  var students = loadData('students', DEFAULT_STUDENTS);
  var classStudents = students.filter(function(s) { return s.grade === cls && s.status === 'Active'; });
  
  // Sort: Male first (A-Z by last name), then Female (A-Z by last name), then no gender (A-Z)
  var males = sortByLastName(classStudents.filter(function(s){ return s.gender === 'Male'; }));
  var females = sortByLastName(classStudents.filter(function(s){ return s.gender === 'Female'; }));
  var others = sortByLastName(classStudents.filter(function(s){ return !s.gender || (s.gender !== 'Male' && s.gender !== 'Female'); }));
  var sorted = males.concat(females).concat(others);

  var csv = 'LRN,"Name (Last Name, First Name)",' + subjects.join(',') + '\n';

  // Male section
  if (males.length > 0) {
    csv += '"--- MALE ---","",'; subjects.forEach(function(){ csv += ','; }); csv = csv.slice(0,-1) + '\n';
    males.forEach(function(s) {
      csv += s.lrn + ',"' + toLastFirst(s.name) + '"';
      subjects.forEach(function() { csv += ','; });
      csv += '\n';
    });
  }

  // Female section
  if (females.length > 0) {
    csv += '"--- FEMALE ---","",'; subjects.forEach(function(){ csv += ','; }); csv = csv.slice(0,-1) + '\n';
    females.forEach(function(s) {
      csv += s.lrn + ',"' + toLastFirst(s.name) + '"';
      subjects.forEach(function() { csv += ','; });
      csv += '\n';
    });
  }

  // No gender assigned
  if (others.length > 0) {
    if (males.length > 0 || females.length > 0) {
      csv += '"--- OTHER/UNSET ---","",'; subjects.forEach(function(){ csv += ','; }); csv = csv.slice(0,-1) + '\n';
    }
    others.forEach(function(s) {
      csv += s.lrn + ',"' + toLastFirst(s.name) + '"';
      subjects.forEach(function() { csv += ','; });
      csv += '\n';
    });
  }
  
  var blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'grades_' + cls.replace(/\s/g,'_') + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  
  showUploadStatus('Template downloaded! Open in Excel, fill in grades for all subjects, save as CSV, then upload.', 'success');
}

function handleCSVUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  
  var reader = new FileReader();
  reader.onload = function(e) {
    var text = e.target.result;
    var lines = text.trim().split('\n');
    
    if (lines.length < 2) {
      showUploadStatus('Error: CSV file is empty or has no data rows.', 'error');
      return;
    }
    
    var header = parseCSVLine(lines[0]).map(function(h) { return h.trim(); });
    if (header.length < 4) {
      showUploadStatus('Error: CSV must have LRN, Name, and at least one subject column.', 'error');
      return;
    }
    
    var records = [];
    var errors = [];
    for (var i = 1; i < lines.length; i++) {
      var row = parseCSVLine(lines[i]);
      if (!row[0] || !row[0].trim()) continue;
      
      var lrn = row[0].trim();
      var name = row[1] ? fromLastFirst(row[1].trim()) : '';
      var grades = {};
      var hasError = false;
      
      for (var j = 2; j < header.length && j < row.length; j++) {
        var val = row[j] ? row[j].trim() : '';
        if (val === '') continue;
        var num = parseFloat(val);
        if (isNaN(num) || num < 60 || num > 100) {
          errors.push('Row '+(i+1)+': '+name+' - invalid grade for '+header[j]);
          hasError = true;
          continue;
        }
        grades[header[j]] = Math.round(num * 10) / 10;
      }
      
      // Auto-compute MAPEH (JHS only)
      var ma = grades['Music & Arts'];
      var pe = grades['PE & Health'];
      if (ma !== undefined && pe !== undefined) {
        grades['MAPEH'] = Math.round(((ma + pe) / 2) * 10) / 10;
      }
      
      if (!hasError || Object.keys(grades).length > 0) {
        records.push({lrn: lrn, name: name, grades: grades});
      }
    }
    
    if (records.length === 0) {
      showUploadStatus('Error: No valid records found. ' + errors.join('; '), 'error');
      return;
    }
    
    var cls = document.getElementById('gradeClass').value;
    var settings = loadData('settings', DEFAULT_SETTINGS);
    var secs = (settings.sections && settings.sections.length > 0) ? settings.sections : DEFAULT_SECTIONS;
    var baseSubjects = getSubjectsForSection(cls, secs);
    var allSubjects = baseSubjects.slice();
    if (baseSubjects.indexOf('Music & Arts') > -1) allSubjects.push('MAPEH');
    
    var html = '<div style="margin-bottom:12px"><strong>' + records.length + ' students</strong> parsed';
    if (errors.length > 0) html += ' <span style="color:var(--da)">(' + errors.length + ' warnings)</span>';
    html += '</div>';
    html += '<div style="overflow-x:auto"><table><thead><tr><th>LRN</th><th>Name</th>';
    allSubjects.forEach(function(s) {
      var label = s === 'Mathematics' ? 'Math' : s === 'Music & Arts' ? 'M&A' : s === 'PE & Health' ? 'PE' : s;
      html += '<th style="font-size:11px">' + label + '</th>';
    });
    html += '<th>Average</th><th>Remarks</th></tr></thead><tbody>';
    
    records.forEach(function(r) {
      html += '<tr><td style="font-family:monospace;font-size:11px">' + r.lrn + '</td><td style="font-size:12px">' + r.name + '</td>';
      var total = 0, count = 0;
      allSubjects.forEach(function(s) {
        var v = r.grades[s];
        if (v !== undefined) { total += v; count++; }
        var color = v !== undefined ? (v >= 75 ? '#22c55e' : '#ef4444') : '#ccc';
        html += '<td style="text-align:center;color:' + color + ';font-weight:600;font-size:12px">' + (v !== undefined ? v : '--') + '</td>';
      });
      var avg = count > 0 ? Math.round((total / count) * 10) / 10 : '';
      var remarks = avg >= 75 ? 'Passed' : (avg ? 'Failed' : '');
      var badge = avg >= 75 ? 'b-g' : 'b-r';
      html += '<td style="text-align:center"><strong>' + (avg || '--') + '</strong></td>';
      html += '<td>' + (remarks ? '<span class="badge ' + badge + '">' + remarks + '</span>' : '') + '</td></tr>';
    });
    
    html += '</tbody></table></div>';
    html += '<div style="display:flex;gap:10px;margin-top:16px">';
    html += '<button class="btn btn-p btn-sm" onclick="saveUploadedGrades()">&#128190; Save All Grades</button>';
    html += '<button class="btn btn-s btn-sm" onclick="cancelUpload()">Cancel</button>';
    html += '</div>';
    
    document.getElementById('gradePreview').innerHTML = html;
    window._pendingRecords = records;
    window._pendingClass = cls;
    
    showUploadStatus('CSV parsed! Review grades and click Save.', 'success');
  };
  reader.readAsText(file, 'UTF-8');
  event.target.value = '';
}

function saveUploadedGrades() {
  if (!window._pendingRecords || !window._pendingClass) {
    toast('No grades to save. Upload a CSV first.', 'er');
    return;
  }
  
  var cls = window._pendingClass;
  var records = window._pendingRecords;
  var key = 'grades_' + cls.replace(/\s/g, '_');
  
  var existing = loadData(key, {});
  
  records.forEach(function(r) {
    existing[r.lrn] = {name: r.name, grades: r.grades};
  });
  
  saveData(key, existing);
  
  window._pendingRecords = null;
  window._pendingClass = null;
  document.getElementById('gradePreview').innerHTML = '';
  
  toast(records.length + ' students grades saved! Students can now view their grades.', 'su');
  showUploadStatus(records.length + ' students grades saved for ' + cls + '!', 'success');
  
  updateGradeView();
}

function cancelUpload() {
  window._pendingGrades = null;
  window._pendingMeta = null;
  document.getElementById('gradePreview').innerHTML = '';
  document.getElementById('uploadStatus').style.display = 'none';
}

function updateGradeView() {
  var cls = document.getElementById('gradeClass').value;
  var key = 'grades_' + cls.replace(/\s/g, '_');
  var data = loadData(key, {});
  var lrns = Object.keys(data);
  
  var el = document.getElementById('savedGrades');
  if (lrns.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--g5);font-size:14px">No grades uploaded yet. Download template, fill in grades, then upload.</div>';
    return;
  }
  
  var settings = loadData('settings', DEFAULT_SETTINGS);
  var secs = (settings.sections && settings.sections.length > 0) ? settings.sections : DEFAULT_SECTIONS;
  var baseSubjects = getSubjectsForSection(cls, secs);
  var allSubjects = baseSubjects.slice();
  if (baseSubjects.indexOf('Music & Arts') > -1) allSubjects.push('MAPEH');
  var html = '<h4 style="font-size:15px;margin-bottom:12px">&#128202; Grades &mdash; ' + cls + '</h4>';
  html += '<div style="overflow-x:auto"><table><thead><tr><th>LRN</th><th>Name</th>';
  allSubjects.forEach(function(s) {
    var label = s === 'Mathematics' ? 'Math' : s === 'Music & Arts' ? 'M&A' : s === 'PE & Health' ? 'PE' : s;
    html += '<th style="font-size:11px">' + label + '</th>';
  });
  html += '<th>Avg</th><th>Remarks</th></tr></thead><tbody>';
  
  var sortedLrns = sortByLastName(lrns, function(lrn) { return data[lrn].name; });
  
  sortedLrns.forEach(function(lrn) {
    var r = data[lrn];
    var g = r.grades || {};
    html += '<tr><td style="font-family:monospace;font-size:11px">' + lrn + '</td><td style="font-size:12px">' + r.name.toUpperCase() + '</td>';
    var total = 0, count = 0;
    allSubjects.forEach(function(s) {
      var v = g[s];
      if (v !== undefined) { total += v; count++; }
      html += '<td style="text-align:center;font-size:12px">' + (v !== undefined ? v : '--') + '</td>';
    });
    var avg = count > 0 ? Math.round((total / count) * 10) / 10 : '';
    var remarks = avg >= 75 ? 'Passed' : (avg ? 'Failed' : '');
    var badge = avg >= 75 ? 'b-g' : 'b-r';
    html += '<td style="text-align:center"><strong>' + (avg || '--') + '</strong></td>';
    html += '<td>' + (remarks ? '<span class="badge ' + badge + '">' + remarks + '</span>' : '') + '</td></tr>';
  });
  
  html += '</tbody></table></div>';
  el.innerHTML = html;
}

function showUploadStatus(msg, type) {
  var el = document.getElementById('uploadStatus');
  el.style.display = 'block';
  el.textContent = msg;
  if (type === 'success') {
    el.style.background = 'var(--sub)';
    el.style.color = 'var(--su)';
    el.style.border = '1px solid var(--su)';
  } else {
    el.style.background = 'var(--dab)';
    el.style.color = 'var(--da)';
    el.style.border = '1px solid var(--da)';
  }
}

// Update student dashboard to load grades from Firebase
function loadStudentGrades() {
  if (!curUser || curUser.type !== 'student') return;
  var lrn = curUser.lrn;
  if (!lrn) return;
  
  var grades = null;
  var keys = Object.keys(_cache);
  
  keys.forEach(function(k) {
    if (k.startsWith('grades_')) {
      var data = _cache[k];
      if (data && data[lrn]) {
        grades = data[lrn];
      }
    }
  });
  
  if (!grades || !grades.grades) return;
  
  var el = document.getElementById('sdGrades');
  if (!el) return;
  
  var g = grades.grades;
  var allSubjects = Object.keys(g);
  var html = '<h3>&#128202; My Grades</h3>';
  html += '<div style="overflow-x:auto"><table><thead><tr><th>Subject</th><th>Final Grade</th><th>Remarks</th></tr></thead><tbody>';
  
  var total = 0, count = 0;
  allSubjects.forEach(function(s) {
    var v = g[s];
    if (v === undefined) return;
    total += v; count++;
    var remarks = v >= 75 ? 'Passed' : 'Failed';
    var badge = v >= 75 ? 'b-g' : 'b-r';
    var isMAPEH = s === 'MAPEH';
    html += '<tr style="' + (isMAPEH ? 'background:#f0f7ff;font-weight:600' : '') + '">';
    html += '<td>' + (isMAPEH ? '&#128900; ' : '') + s + '</td>';
    html += '<td style="text-align:center"><strong>' + v + '</strong></td>';
    html += '<td><span class="badge ' + badge + '">' + remarks + '</span></td></tr>';
  });
  
  var avg = count > 0 ? Math.round((total / count) * 10) / 10 : '';
  html += '<tr style="background:#f9f9f9;border-top:2px solid #ddd"><td><strong>General Average</strong></td>';
  html += '<td style="text-align:center"><strong style="font-size:18px;color:' + (avg >= 75 ? '#22c55e' : '#ef4444') + '">' + avg + '</strong></td>';
  html += '<td><span class="badge ' + (avg >= 75 ? 'b-g' : 'b-r') + '">' + (avg >= 75 ? 'Passed' : 'Failed') + '</span></td></tr>';
  
  html += '</tbody></table></div>';
  el.innerHTML = html;
}



// ============================================
// ATTENDANCE UPLOAD SYSTEM
// ============================================

function downloadAttTemplate() {
  var cls = document.getElementById('attClass').value;
  var students = loadData('students', DEFAULT_STUDENTS);
  var classStudents = students.filter(function(s) { return s.grade === cls && s.status === 'Active'; });

  // Sort: Male first (A-Z), then Female (A-Z), then no gender
  var males = sortByLastName(classStudents.filter(function(s){ return s.gender === 'Male'; }));
  var females = sortByLastName(classStudents.filter(function(s){ return s.gender === 'Female'; }));
  var others = sortByLastName(classStudents.filter(function(s){ return !s.gender || (s.gender !== 'Male' && s.gender !== 'Female'); }));

  var csv = 'LRN,"Name (Last Name, First Name)",Days Present,Days Absent,Days Late,Total School Days\n';

  if (males.length > 0) {
    csv += '"--- MALE ---","",,,, \n';
    males.forEach(function(s){ csv += s.lrn + ',"' + toLastFirst(s.name) + '",,,,\n'; });
  }
  if (females.length > 0) {
    csv += '"--- FEMALE ---","",,,, \n';
    females.forEach(function(s){ csv += s.lrn + ',"' + toLastFirst(s.name) + '",,,,\n'; });
  }
  if (others.length > 0) {
    if (males.length > 0 || females.length > 0) csv += '"--- OTHER/UNSET ---","",,,, \n';
    others.forEach(function(s){ csv += s.lrn + ',"' + toLastFirst(s.name) + '",,,,\n'; });
  }
  
  var blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'attendance_' + cls.replace(/\s/g,'_') + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  
  showAttStatus('Template downloaded! Fill in attendance data, save as CSV, then upload.', 'success');
}

function handleAttUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  
  var reader = new FileReader();
  reader.onload = function(e) {
    var text = e.target.result;
    var lines = text.trim().split('\n');
    
    if (lines.length < 2) {
      showAttStatus('Error: CSV is empty.', 'error');
      return;
    }
    
    var records = [];
    for (var i = 1; i < lines.length; i++) {
      var row = parseCSVLine(lines[i]);
      if (!row[0] || !row[0].trim()) continue;
      
      var lrn = row[0].trim();
      var name = row[1] ? fromLastFirst(row[1].trim()) : '';
      var present = parseInt(row[2]) || 0;
      var absent = parseInt(row[3]) || 0;
      var late = parseInt(row[4]) || 0;
      var totalDays = parseInt(row[5]) || 0;
      
      if (totalDays === 0) totalDays = present + absent;
      var rate = totalDays > 0 ? Math.round((present / totalDays) * 1000) / 10 : 0;
      
      records.push({lrn: lrn, name: name, present: present, absent: absent, late: late, totalDays: totalDays, rate: rate});
    }
    
    if (records.length === 0) {
      showAttStatus('Error: No valid records found.', 'error');
      return;
    }
    
    var cls = document.getElementById('attClass').value;
    
    var html = '<div style="margin-bottom:12px"><strong>' + records.length + ' students</strong> parsed</div>';
    html += '<div style="overflow-x:auto"><table><thead><tr><th>LRN</th><th>Name</th><th>Present</th><th>Absent</th><th>Late</th><th>Total Days</th><th>Rate</th></tr></thead><tbody>';
    
    records.forEach(function(r) {
      var rateColor = r.rate >= 90 ? '#22c55e' : (r.rate >= 80 ? '#f59e0b' : '#ef4444');
      html += '<tr><td style="font-family:monospace;font-size:11px">' + r.lrn + '</td>';
      html += '<td style="font-size:12px">' + r.name + '</td>';
      html += '<td style="text-align:center;color:#22c55e;font-weight:600">' + r.present + '</td>';
      html += '<td style="text-align:center;color:#ef4444;font-weight:600">' + r.absent + '</td>';
      html += '<td style="text-align:center;color:#f59e0b;font-weight:600">' + r.late + '</td>';
      html += '<td style="text-align:center">' + r.totalDays + '</td>';
      html += '<td style="text-align:center;color:' + rateColor + ';font-weight:700">' + r.rate + '%</td></tr>';
    });
    
    html += '</tbody></table></div>';
    html += '<div style="display:flex;gap:10px;margin-top:16px">';
    html += '<button class="btn btn-p btn-sm" onclick="saveAttendance()">&#128190; Save Attendance</button>';
    html += '<button class="btn btn-s btn-sm" onclick="cancelAtt()">Cancel</button>';
    html += '</div>';
    
    document.getElementById('attPreview').innerHTML = html;
    window._pendingAtt = records;
    window._pendingAttClass = cls;
    
    showAttStatus('CSV parsed! Review and click Save.', 'success');
  };
  reader.readAsText(file, 'UTF-8');
  event.target.value = '';
}

function saveAttendance() {
  if (!window._pendingAtt || !window._pendingAttClass) {
    toast('No attendance to save.', 'er');
    return;
  }
  
  var cls = window._pendingAttClass;
  var records = window._pendingAtt;
  var key = 'attendance_' + cls.replace(/\s/g, '_');
  
  var data = {};
  records.forEach(function(r) {
    data[r.lrn] = {name: r.name, present: r.present, absent: r.absent, late: r.late, totalDays: r.totalDays, rate: r.rate};
  });
  
  saveData(key, data);
  
  window._pendingAtt = null;
  window._pendingAttClass = null;
  document.getElementById('attPreview').innerHTML = '';
  
  toast(records.length + ' attendance records saved!', 'su');
  showAttStatus(records.length + ' records saved for ' + cls + '!', 'success');
  updateAttView();
}

function cancelAtt() {
  window._pendingAtt = null;
  window._pendingAttClass = null;
  document.getElementById('attPreview').innerHTML = '';
  var el = document.getElementById('attUploadStatus');
  if (el) el.style.display = 'none';
}

function updateAttView() {
  var cls = document.getElementById('attClass').value;
  var key = 'attendance_' + cls.replace(/\s/g, '_');
  var data = loadData(key, {});
  var lrns = Object.keys(data);
  
  var el = document.getElementById('savedAttendance');
  if (!el) return;
  if (lrns.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--g5);font-size:14px">No attendance records yet. Download template, fill in data, then upload.</div>';
    return;
  }
  
  var html = '<h4 style="font-size:15px;margin-bottom:12px">&#128203; Saved Attendance &mdash; ' + cls + '</h4>';
  html += '<div style="overflow-x:auto"><table><thead><tr><th>LRN</th><th>Name</th><th>Present</th><th>Absent</th><th>Late</th><th>Total</th><th>Rate</th></tr></thead><tbody>';
  
  var sortedLrns = sortByLastName(lrns, function(lrn) { return data[lrn].name; });
  
  sortedLrns.forEach(function(lrn) {
    var r = data[lrn];
    var rateColor = r.rate >= 90 ? '#22c55e' : (r.rate >= 80 ? '#f59e0b' : '#ef4444');
    html += '<tr><td style="font-family:monospace;font-size:11px">' + lrn + '</td>';
    html += '<td style="font-size:12px">' + r.name.toUpperCase() + '</td>';
    html += '<td style="text-align:center">' + r.present + '</td>';
    html += '<td style="text-align:center">' + r.absent + '</td>';
    html += '<td style="text-align:center">' + r.late + '</td>';
    html += '<td style="text-align:center">' + r.totalDays + '</td>';
    html += '<td style="text-align:center;color:' + rateColor + ';font-weight:700">' + r.rate + '%</td></tr>';
  });
  
  html += '</tbody></table></div>';
  el.innerHTML = html;
}

function showAttStatus(msg, type) {
  var el = document.getElementById('attUploadStatus');
  if (!el) return;
  el.style.display = 'block';
  el.textContent = msg;
  if (type === 'success') {
    el.style.background = 'var(--sub)'; el.style.color = 'var(--su)'; el.style.border = '1px solid var(--su)';
  } else {
    el.style.background = 'var(--dab)'; el.style.color = 'var(--da)'; el.style.border = '1px solid var(--da)';
  }
}

// Load student attendance from Firebase
function loadStudentAttendance() {
  if (!curUser || curUser.type !== 'student') return;
  var lrn = curUser.lrn;
  if (!lrn) return;
  
  var attendance = null;
  var keys = Object.keys(_cache);
  keys.forEach(function(k) {
    if (k.startsWith('attendance_')) {
      var data = _cache[k];
      if (data && data[lrn]) {
        attendance = data[lrn];
      }
    }
  });
  
  var el = document.getElementById('sdAttContent');
  if (!el) return;
  
  if (!attendance) {
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--g5)">No attendance records yet.</div>';
    return;
  }
  
  var r = attendance;
  var rateColor = r.rate >= 90 ? '#22c55e' : (r.rate >= 80 ? '#f59e0b' : '#ef4444');
  var rateLabel = r.rate >= 90 ? 'Excellent' : (r.rate >= 80 ? 'Good' : 'Needs Improvement');
  
  var html = '<h3>&#128203; My Attendance Record</h3>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin:20px 0">';
  html += '<div style="background:#f0fdf4;border-radius:12px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#22c55e">' + r.present + '</div><div style="font-size:12px;color:#666;margin-top:4px">Days Present</div></div>';
  html += '<div style="background:#fef2f2;border-radius:12px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#ef4444">' + r.absent + '</div><div style="font-size:12px;color:#666;margin-top:4px">Days Absent</div></div>';
  html += '<div style="background:#fffbeb;border-radius:12px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#f59e0b">' + r.late + '</div><div style="font-size:12px;color:#666;margin-top:4px">Days Late</div></div>';
  html += '<div style="background:#f8fafc;border-radius:12px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#334155">' + r.totalDays + '</div><div style="font-size:12px;color:#666;margin-top:4px">Total School Days</div></div>';
  html += '</div>';
  
  // Attendance rate bar
  html += '<div style="background:#f7f7f7;border-radius:20px;height:32px;overflow:hidden;margin:16px 0">';
  html += '<div style="height:100%;background:linear-gradient(90deg,' + rateColor + ',' + rateColor + '80);border-radius:20px;width:' + r.rate + '%;display:flex;align-items:center;justify-content:center;transition:width 1s ease">';
  html += '<span style="color:#fff;font-size:13px;font-weight:700">' + r.rate + '% Attendance Rate</span>';
  html += '</div></div>';
  html += '<div style="text-align:center;font-size:14px;color:' + rateColor + ';font-weight:600">' + rateLabel + '</div>';
  
  el.innerHTML = html;
}


// ============================================
// DYNAMIC SECTIONS FROM SETTINGS
// ============================================
var DEFAULT_SECTIONS = [
  {name:'Grade 7 - Bonifacio',cluster:'JHS'},{name:'Grade 8 - Luna',cluster:'JHS'},
  {name:'Grade 9 - Mabini',cluster:'JHS'},{name:'Grade 10 - Rizal',cluster:'JHS'},
  {name:'Grade 11 - ABM',cluster:'Business'},{name:'Grade 11 - HUMSS',cluster:'ASSH'},
  {name:'Grade 12 - ABM',cluster:'Business'},{name:'Grade 12 - HUMSS',cluster:'ASSH'}
];

function populateSectionDropdowns() {
  var settings = loadData('settings', DEFAULT_SETTINGS);
  var allSecs = (settings.sections && settings.sections.length > 0) ? settings.sections : DEFAULT_SECTIONS;
  
  // Teacher-only dropdowns get filtered to the logged-in teacher's advisory sections (if assigned).
  // sGradeSection (used during public student signup) always shows all sections.
  var teacherDropdowns = ['gradeClass', 'attClass', 'schedClass', 'announceClass'];
  var restrictedSecs = null;
  if (curUser && curUser.type === 'teacher' && curUser.sections && curUser.sections.length > 0) {
    restrictedSecs = allSecs.filter(function(s) {
      var name = typeof s === 'object' ? s.name : s;
      return curUser.sections.indexOf(name) > -1;
    });
  }
  
  var dropdowns = ['gradeClass', 'attClass', 'schedClass', 'announceClass', 'sGradeSection'];
  dropdowns.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var current = el.value;
    el.innerHTML = '';
    var secs = (teacherDropdowns.indexOf(id) > -1 && restrictedSecs) ? restrictedSecs : allSecs;
    if (id === 'announceClass') {
      var opt = document.createElement('option');
      opt.value = 'All My Classes';
      opt.textContent = 'All My Classes';
      el.appendChild(opt);
    }
    if (id === 'sGradeSection') {
      var opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Select Section';
      el.appendChild(opt);
    }
    secs.forEach(function(s) {
      var name = typeof s === 'object' ? s.name : s;
      var cluster = typeof s === 'object' ? s.cluster : '';
      var opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name + (cluster ? ' [' + cluster + ']' : '');
      el.appendChild(opt);
    });
    if (current) el.value = current;
  });
  console.log('Section dropdowns populated:', allSecs.length, 'total sections' + (restrictedSecs ? ', restricted to ' + restrictedSecs.length + ' for this teacher' : ''));
}



// ============================================
// PARENT DASHBOARD - LIVE GRADES & ATTENDANCE
// ============================================

function loadParentGrades() {
  if (!curUser || curUser.type !== 'parent') return;
  var lrn = curUser.childLrn;
  if (!lrn) return;
  
  var grades = null;
  var childName = curUser.childName || 'Your Child';
  
  var keys = Object.keys(_cache);
  keys.forEach(function(k) {
    if (k.startsWith('grades_')) {
      var data = _cache[k];
      if (data && data[lrn]) {
        grades = data[lrn];
        if (grades.name) childName = grades.name;
      }
    }
  });
  
  var el = document.getElementById('pdGradesContent');
  if (!el) return;
  
  if (!grades || !grades.grades) {
    el.innerHTML = '<h3>&#128202; Child\'s Grades &mdash; ' + childName + '</h3>' +
      '<div style="text-align:center;padding:32px;color:var(--g5)">' +
      '<div style="font-size:48px;margin-bottom:12px">&#128203;</div>' +
      '<p>No grades uploaded yet for your child (LRN: ' + lrn + ').</p>' +
      '<p style="font-size:13px;margin-top:8px">Grades will appear here once the teacher uploads them.</p></div>';
    return;
  }
  
  var g = grades.grades;
  var allSubjects = Object.keys(g);
  var html = '<h3>&#128202; Child\'s Grades &mdash; ' + childName + '</h3>';
  html += '<div style="overflow-x:auto"><table><thead><tr><th>Subject</th><th>Final Grade</th><th>Remarks</th></tr></thead><tbody>';
  
  var total = 0, count = 0;
  allSubjects.forEach(function(s) {
    var v = g[s];
    if (v === undefined) return;
    total += v; count++;
    var remarks = v >= 75 ? 'Passed' : 'Failed';
    var badge = v >= 75 ? 'b-g' : 'b-r';
    var isMAPEH = s === 'MAPEH';
    html += '<tr style="' + (isMAPEH ? 'background:#f0f7ff;font-weight:600' : '') + '">';
    html += '<td>' + (isMAPEH ? '&#128900; ' : '') + s + '</td>';
    html += '<td style="text-align:center"><strong>' + v + '</strong></td>';
    html += '<td><span class="badge ' + badge + '">' + remarks + '</span></td></tr>';
  });
  
  var avg = count > 0 ? Math.round((total / count) * 10) / 10 : '';
  html += '<tr style="background:#f9f9f9;border-top:2px solid #ddd"><td><strong>General Average</strong></td>';
  html += '<td style="text-align:center"><strong style="font-size:18px;color:' + (avg >= 75 ? '#22c55e' : '#ef4444') + '">' + avg + '</strong></td>';
  html += '<td><span class="badge ' + (avg >= 75 ? 'b-g' : 'b-r') + '">' + (avg >= 75 ? 'Passed' : 'Failed') + '</span></td></tr>';
  html += '</tbody></table></div>';
  
  el.innerHTML = html;
  
  // Update parent stat cards
  var statEls = document.querySelectorAll('#parentDash .dash-stat b');
  if (statEls.length >= 1 && avg) statEls[0].textContent = avg;
}

function loadParentAttendance() {
  if (!curUser || curUser.type !== 'parent') return;
  var lrn = curUser.childLrn;
  if (!lrn) return;
  
  var attendance = null;
  var keys = Object.keys(_cache);
  keys.forEach(function(k) {
    if (k.startsWith('attendance_')) {
      var data = _cache[k];
      if (data && data[lrn]) {
        attendance = data[lrn];
      }
    }
  });
  
  var el = document.getElementById('pdAttContent');
  if (!el) return;
  
  if (!attendance) {
    el.innerHTML = '<h3>&#128203; Child\'s Attendance</h3>' +
      '<div style="text-align:center;padding:32px;color:var(--g5)">' +
      '<div style="font-size:48px;margin-bottom:12px">&#128203;</div>' +
      '<p>No attendance records yet.</p>' +
      '<p style="font-size:13px;margin-top:8px">Attendance will appear here once the teacher uploads it.</p></div>';
    return;
  }
  
  var r = attendance;
  var rateColor = r.rate >= 90 ? '#22c55e' : (r.rate >= 80 ? '#f59e0b' : '#ef4444');
  var rateLabel = r.rate >= 90 ? 'Excellent' : (r.rate >= 80 ? 'Good' : 'Needs Improvement');
  
  var html = '<h3>&#128203; Child\'s Attendance Record</h3>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin:20px 0">';
  html += '<div style="background:#f0fdf4;border-radius:12px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#22c55e">' + r.present + '</div><div style="font-size:12px;color:#666;margin-top:4px">Days Present</div></div>';
  html += '<div style="background:#fef2f2;border-radius:12px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#ef4444">' + r.absent + '</div><div style="font-size:12px;color:#666;margin-top:4px">Days Absent</div></div>';
  html += '<div style="background:#fffbeb;border-radius:12px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#f59e0b">' + r.late + '</div><div style="font-size:12px;color:#666;margin-top:4px">Days Late</div></div>';
  html += '<div style="background:#f8fafc;border-radius:12px;padding:16px;text-align:center"><div style="font-size:28px;font-weight:800;color:#334155">' + r.totalDays + '</div><div style="font-size:12px;color:#666;margin-top:4px">Total School Days</div></div>';
  html += '</div>';
  
  html += '<div style="background:#f7f7f7;border-radius:20px;height:32px;overflow:hidden;margin:16px 0">';
  html += '<div style="height:100%;background:linear-gradient(90deg,' + rateColor + ',' + rateColor + '80);border-radius:20px;width:' + r.rate + '%;display:flex;align-items:center;justify-content:center;transition:width 1s ease">';
  html += '<span style="color:#fff;font-size:13px;font-weight:700">' + r.rate + '% Attendance Rate</span>';
  html += '</div></div>';
  html += '<div style="text-align:center;font-size:14px;color:' + rateColor + ';font-weight:600">' + rateLabel + '</div>';
  
  el.innerHTML = html;
  
  // Update parent stat card for attendance
  var statEls = document.querySelectorAll('#parentDash .dash-stat b');
  if (statEls.length >= 2) statEls[1].textContent = r.rate + '%';
}



// ============================================
// SCHEDULE UPLOAD SYSTEM
// ============================================

function downloadSchedTemplate() {
  var cls = document.getElementById('schedClass').value;
  
  var csv = 'Day,Time,Subject,Teacher,Room\n';
  var days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  days.forEach(function(d) {
    csv += d + ',,,,\n';
  });
  
  var blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'schedule_' + cls.replace(/\s/g,'_') + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  
  showSchedStatus('Template downloaded! Fill in the schedule, save as CSV, then upload.', 'success');
}

function handleSchedUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  
  var reader = new FileReader();
  reader.onload = function(e) {
    var text = e.target.result;
    var lines = text.trim().split('\n');
    
    if (lines.length < 2) {
      showSchedStatus('Error: CSV is empty.', 'error');
      return;
    }
    
    var records = [];
    for (var i = 1; i < lines.length; i++) {
      var row = lines[i].split(',');
      if (!row[0] || !row[0].trim()) continue;
      
      var day = row[0].trim();
      var time = row[1] ? row[1].trim() : '';
      var subject = row[2] ? row[2].trim() : '';
      var teacher = row[3] ? row[3].trim() : '';
      var room = row[4] ? row[4].trim() : '';
      
      if (!time && !subject) continue;
      
      records.push({day: day, time: time, subject: subject, teacher: teacher, room: room});
    }
    
    if (records.length === 0) {
      showSchedStatus('Error: No valid records found.', 'error');
      return;
    }
    
    var cls = document.getElementById('schedClass').value;
    
    var html = '<div style="margin-bottom:12px"><strong>' + records.length + ' entries</strong> parsed</div>';
    html += '<div style="overflow-x:auto"><table><thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Teacher</th><th>Room</th></tr></thead><tbody>';
    
    var dayColors = {Monday:'#e8733a',Tuesday:'#0891b2',Wednesday:'#7c3aed',Thursday:'#059669',Friday:'#dc2626'};
    records.forEach(function(r) {
      var color = dayColors[r.day] || '#666';
      html += '<tr><td style="font-weight:600;color:' + color + '">' + r.day + '</td>';
      html += '<td>' + r.time + '</td>';
      html += '<td style="font-weight:600">' + r.subject + '</td>';
      html += '<td>' + r.teacher + '</td>';
      html += '<td>' + r.room + '</td></tr>';
    });
    
    html += '</tbody></table></div>';
    html += '<div style="display:flex;gap:10px;margin-top:16px">';
    html += '<button class="btn btn-p btn-sm" onclick="saveSchedule()">&#128190; Save Schedule</button>';
    html += '<button class="btn btn-s btn-sm" onclick="cancelSched()">Cancel</button>';
    html += '</div>';
    
    document.getElementById('schedPreview').innerHTML = html;
    window._pendingSched = records;
    window._pendingSchedClass = cls;
    
    showSchedStatus('CSV parsed! Review and click Save.', 'success');
  };
  reader.readAsText(file, 'UTF-8');
  event.target.value = '';
}

function saveSchedule() {
  if (!window._pendingSched || !window._pendingSchedClass) {
    toast('No schedule to save.', 'er');
    return;
  }
  
  var cls = window._pendingSchedClass;
  var records = window._pendingSched;
  var key = 'schedule_' + cls.replace(/\s/g, '_');
  
  saveData(key, records);
  
  window._pendingSched = null;
  window._pendingSchedClass = null;
  document.getElementById('schedPreview').innerHTML = '';
  
  toast(records.length + ' schedule entries saved!', 'su');
  showSchedStatus(records.length + ' entries saved for ' + cls + '!', 'success');
  updateSchedView();
}

function cancelSched() {
  window._pendingSched = null;
  window._pendingSchedClass = null;
  document.getElementById('schedPreview').innerHTML = '';
  var el = document.getElementById('schedUploadStatus');
  if (el) el.style.display = 'none';
}

function updateSchedView() {
  var cls = document.getElementById('schedClass').value;
  var key = 'schedule_' + cls.replace(/\s/g, '_');
  var data = loadData(key, []);
  
  var el = document.getElementById('savedSchedule');
  if (!el) return;
  if (!data || data.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--g5);font-size:14px">No schedule uploaded yet.</div>';
    return;
  }
  
  var dayColors = {Monday:'#e8733a',Tuesday:'#0891b2',Wednesday:'#7c3aed',Thursday:'#059669',Friday:'#dc2626'};
  var html = '<h4 style="font-size:15px;margin-bottom:12px">&#128197; Saved Schedule &mdash; ' + cls + '</h4>';
  html += '<div style="overflow-x:auto"><table><thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Teacher</th><th>Room</th></tr></thead><tbody>';
  
  data.forEach(function(r) {
    var color = dayColors[r.day] || '#666';
    html += '<tr><td style="font-weight:600;color:' + color + '">' + r.day + '</td>';
    html += '<td>' + r.time + '</td>';
    html += '<td style="font-weight:600">' + r.subject + '</td>';
    html += '<td>' + r.teacher + '</td>';
    html += '<td>' + r.room + '</td></tr>';
  });
  
  html += '</tbody></table></div>';
  el.innerHTML = html;
}

function showSchedStatus(msg, type) {
  var el = document.getElementById('schedUploadStatus');
  if (!el) return;
  el.style.display = 'block';
  el.textContent = msg;
  if (type === 'success') {
    el.style.background = 'var(--sub)'; el.style.color = 'var(--su)'; el.style.border = '1px solid var(--su)';
  } else {
    el.style.background = 'var(--dab)'; el.style.color = 'var(--da)'; el.style.border = '1px solid var(--da)';
  }
}

// Load student schedule from Firebase
function loadStudentSchedule() {
  if (!curUser || curUser.type !== 'student') return;
  var grade = curUser.grade;
  if (!grade) return;
  
  var key = 'schedule_' + grade.replace(/\s/g, '_');
  var data = loadData(key, []);
  
  var el = document.getElementById('sdSchedContent');
  if (!el) return;
  
  if (!data || data.length === 0) {
    el.innerHTML = '<h3>&#128197; Class Schedule</h3><div style="text-align:center;padding:32px;color:var(--g5)"><div style="font-size:48px;margin-bottom:12px">&#128197;</div><p>No schedule uploaded yet.</p><p style="font-size:13px;margin-top:8px">Schedule will appear here once your adviser uploads it.</p></div>';
    return;
  }
  
  var days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  var dayColors = {Monday:'#e8733a',Tuesday:'#0891b2',Wednesday:'#7c3aed',Thursday:'#059669',Friday:'#dc2626'};
  
  var html = '<h3>&#128197; Class Schedule</h3>';
  
  days.forEach(function(day) {
    var entries = data.filter(function(r) { return r.day === day; });
    if (entries.length === 0) return;
    
    var color = dayColors[day] || '#666';
    html += '<div style="margin-bottom:16px">';
    html += '<h4 style="font-size:14px;color:' + color + ';margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid ' + color + '40">' + day + '</h4>';
    html += '<div style="display:flex;flex-direction:column;gap:6px">';
    
    entries.forEach(function(r) {
      html += '<div style="display:flex;gap:12px;padding:8px 12px;background:var(--g1);border-radius:8px;border-left:3px solid ' + color + ';align-items:center;flex-wrap:wrap">';
      html += '<span style="font-family:monospace;font-size:13px;color:var(--g5);min-width:90px">' + r.time + '</span>';
      html += '<span style="font-weight:600;flex:1;min-width:120px">' + r.subject + '</span>';
      html += '<span style="font-size:13px;color:var(--g5)">' + r.teacher + '</span>';
      if (r.room) html += '<span style="font-size:12px;padding:2px 8px;background:' + color + '15;color:' + color + ';border-radius:12px">' + r.room + '</span>';
      html += '</div>';
    });
    
    html += '</div></div>';
  });
  
  el.innerHTML = html;
}



// ============================================
// MY CLASSES - AUTO-GENERATED FROM DATA
// ============================================

function loadMyClasses() {
  var el = document.getElementById('tdClassesContent');
  if (!el) return;
  
  var keys = Object.keys(_cache);
  var classMap = {};
  
  // If this teacher has assigned advisory sections, only show data for those sections
  var allowedSections = (curUser && curUser.type === 'teacher' && curUser.sections && curUser.sections.length > 0) ? curUser.sections : null;
  function isAllowed(section) {
    return !allowedSections || allowedSections.indexOf(section) > -1;
  }
  
  // Scan grades data
  keys.forEach(function(k) {
    if (k.startsWith('grades_')) {
      var section = k.replace('grades_', '').replace(/_/g, ' ');
      if (!isAllowed(section)) return;
      if (!classMap[section]) classMap[section] = {students: 0, hasGrades: false, hasAttendance: false, hasSchedule: false};
      var data = _cache[k];
      if (data) {
        classMap[section].students = Object.keys(data).length;
        classMap[section].hasGrades = true;
      }
    }
  });
  
  // Scan attendance data
  keys.forEach(function(k) {
    if (k.startsWith('attendance_')) {
      var section = k.replace('attendance_', '').replace(/_/g, ' ');
      if (!isAllowed(section)) return;
      if (!classMap[section]) classMap[section] = {students: 0, hasGrades: false, hasAttendance: false, hasSchedule: false};
      classMap[section].hasAttendance = true;
      if (!classMap[section].students) {
        classMap[section].students = Object.keys(_cache[k]).length;
      }
    }
  });
  
  // Scan schedule data
  keys.forEach(function(k) {
    if (k.startsWith('schedule_')) {
      var section = k.replace('schedule_', '').replace(/_/g, ' ');
      if (!isAllowed(section)) return;
      if (!classMap[section]) classMap[section] = {students: 0, hasGrades: false, hasAttendance: false, hasSchedule: false};
      classMap[section].hasSchedule = true;
    }
  });
  
  var sections = Object.keys(classMap);
  
  // If teacher has assigned sections but none have data yet, still list them (with zero data)
  if (allowedSections) {
    allowedSections.forEach(function(s) {
      if (!classMap[s]) classMap[s] = {students: 0, hasGrades: false, hasAttendance: false, hasSchedule: false};
    });
    sections = Object.keys(classMap);
  }
  
  if (sections.length === 0) {
    el.innerHTML = '<h3>&#128218; My Classes</h3><div style="text-align:center;padding:32px;color:var(--g5)"><div style="font-size:48px;margin-bottom:12px">&#128218;</div><p>No class data yet.</p><p style="font-size:13px;margin-top:8px">Upload grades, attendance, or schedule in the other tabs to see your classes here.</p></div>';
    return;
  }
  
  var html = '<h3>&#128218; My Classes <span style="font-size:14px;color:var(--g5);font-weight:400">(' + sections.length + ' sections)</span></h3>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-top:16px">';
  
  sections.forEach(function(sec) {
    var c = classMap[sec];
    html += '<div style="background:var(--g1);border-radius:12px;padding:18px;border:1px solid var(--g2)">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">';
    html += '<div style="font-weight:700;font-size:15px;margin-bottom:10px">' + sec + '</div>';
    html += '<button class="abtn del" title="Delete Class Data" onclick="deleteClassData(\'' + sec.replace(/'/g, "\\'") + '\')" style="width:24px;height:24px;font-size:11px;flex-shrink:0">&#128465;</button>';
    html += '</div>';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">';
    html += '<span style="font-size:12px;padding:3px 10px;border-radius:12px;background:#e8733a20;color:#e8733a;font-weight:600">&#128100; ' + c.students + ' students</span>';
    html += '</div>';
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
    html += '<span style="font-size:11px;padding:2px 8px;border-radius:8px;background:' + (c.hasGrades ? '#05966920' : '#eee') + ';color:' + (c.hasGrades ? '#059669' : '#aaa') + '">' + (c.hasGrades ? '&#10003;' : '&#10007;') + ' Grades</span>';
    html += '<span style="font-size:11px;padding:2px 8px;border-radius:8px;background:' + (c.hasAttendance ? '#0891b220' : '#eee') + ';color:' + (c.hasAttendance ? '#0891b2' : '#aaa') + '">' + (c.hasAttendance ? '&#10003;' : '&#10007;') + ' Attendance</span>';
    html += '<span style="font-size:11px;padding:2px 8px;border-radius:8px;background:' + (c.hasSchedule ? '#7c3aed20' : '#eee') + ';color:' + (c.hasSchedule ? '#7c3aed' : '#aaa') + '">' + (c.hasSchedule ? '&#10003;' : '&#10007;') + ' Schedule</span>';
    html += '</div>';
    html += '</div>';
  });
  
  html += '</div>';
  el.innerHTML = html;
}

function deleteClassData(sec) {
  if (!confirm('Delete ALL data (grades, attendance, schedule) for "' + sec + '"?\n\nWarning: if other advisers also upload grades for this same section, their grades will be deleted too \u2014 this clears the WHOLE class record, not just your subject.\n\nThis cannot be undone.')) return;
  var key = sec.replace(/\s/g, '_');
  ['grades_', 'attendance_', 'schedule_'].forEach(function(prefix) {
    var docKey = prefix + key;
    delete _cache[docKey];
    db.collection('portal_data').doc(docKey).delete();
  });
  loadMyClasses();
  toast(sec + ' data deleted', 'su');
}

function clearSectionGrades() {
  var cls = document.getElementById('gradeClass').value;
  if (!cls) { toast('Please select a section first.', 'er'); return; }
  if (!confirm('Clear ALL grades for "' + cls + '"?\n\nThis will permanently delete all uploaded grades for this section. You will need to re-upload the CSV to restore them.\n\nThis cannot be undone.')) return;
  var key = 'grades_' + cls.replace(/\s/g, '_');
  delete _cache[key];
  db.collection('portal_data').doc(key).delete().then(function() {
    updateGradeView();
    toast('Grades for "' + cls + '" cleared successfully.', 'su');
  }).catch(function(err) {
    toast('Error clearing grades: ' + err.message, 'er');
  });
}

// ============================================
// PRINT FUNCTIONS
// ============================================

function openPrintWindow(html) {
  var win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(function() { win.print(); }, 500);
}

function getPrintHeader(title, cls) {
  var settings = loadData('settings', DEFAULT_SETTINGS);
  var schoolName = settings.schoolName || 'Dr. Bonifacio A. Masilungan Integrated National High School';
  var sy = settings.schoolYear || 'SY 2025-2026';
  var teacherName = curUser ? (curUser.fname + ' ' + curUser.lname).toUpperCase() : '';
  return '<div style="text-align:center;margin-bottom:16px">' +
    '<div style="font-size:13px">Republic of the Philippines — Department of Education</div>' +
    '<div style="font-size:16px;font-weight:700;margin:4px 0">' + schoolName + '</div>' +
    '<div style="font-size:13px">' + sy + '</div>' +
    '<div style="font-size:18px;font-weight:700;margin:12px 0 4px">' + title + '</div>' +
    '<div style="font-size:14px">Section: <strong>' + cls + '</strong></div>' +
    '<div style="font-size:13px">Class Adviser: <strong>' + teacherName + '</strong></div>' +
    '</div>';
}

function getPrintStyles() {
  return '<style>' +
    'body{font-family:"Times New Roman",serif;font-size:11px;margin:20px}' +
    'table{width:100%;border-collapse:collapse;margin-top:10px}' +
    'th,td{border:1px solid #000;padding:4px 6px;text-align:center}' +
    'th{background:#f0f0f0;font-weight:700;font-size:10px}' +
    'td:nth-child(2){text-align:left}' +
    '.passed{color:#166534;font-weight:700}' +
    '.failed{color:#991b1b;font-weight:700}' +
    '.section-label{background:#1B2A4A;color:#fff;font-weight:700;text-align:left!important}' +
    '.sig-block{margin-top:40px;display:flex;justify-content:space-between}' +
    '.sig-line{text-align:center;width:200px}' +
    '.sig-line hr{border-top:1px solid #000;margin-bottom:4px}' +
    '@media print{body{margin:10px}.no-print{display:none}}' +
    '</style>';
}

function printGradeSummary() {
  var cls = document.getElementById('gradeClass').value;
  if (!cls) { toast('Please select a section first.', 'er'); return; }
  var key = 'grades_' + cls.replace(/\s/g, '_');
  var data = loadData(key, {});
  var lrns = Object.keys(data);
  if (lrns.length === 0) { toast('No grades to print yet.', 'er'); return; }

  var settings = loadData('settings', DEFAULT_SETTINGS);
  var secs = (settings.sections && settings.sections.length > 0) ? settings.sections : DEFAULT_SECTIONS;
  var baseSubjects = getSubjectsForSection(cls, secs);
  var allSubjects = baseSubjects.slice();
  if (baseSubjects.indexOf('Music & Arts') > -1) allSubjects.push('MAPEH');

  // Sort by gender then last name
  var allStudents = lrns.map(function(lrn){ return { lrn: lrn, record: data[lrn] }; });
  var males = sortByLastName(allStudents.filter(function(s){ return (loadData('students', []).find(function(st){ return st.lrn === s.lrn; }) || {}).gender === 'Male'; }), function(s){ return s.record.name; });
  var females = sortByLastName(allStudents.filter(function(s){ return (loadData('students', []).find(function(st){ return st.lrn === s.lrn; }) || {}).gender === 'Female'; }), function(s){ return s.record.name; });
  var others = sortByLastName(allStudents.filter(function(s){
    var g = (loadData('students', []).find(function(st){ return st.lrn === s.lrn; }) || {}).gender;
    return !g || (g !== 'Male' && g !== 'Female');
  }), function(s){ return s.record.name; });
  var sorted = males.concat(females).concat(others);

  var shortLabels = allSubjects.map(function(s){
    return s === 'Mathematics' ? 'Math' : s === 'Music & Arts' ? 'M&A' : s === 'PE & Health' ? 'PE' : s === 'Araling Panlipunan' ? 'AP' : s === 'Edukasyon sa Pagpapakatao' ? 'EsP' : s;
  });

  var thead = '<tr><th>#</th><th>LRN</th><th style="text-align:left">Name</th>' + shortLabels.map(function(l){ return '<th>' + l + '</th>'; }).join('') + '<th>GEN AVG</th><th>Remarks</th></tr>';

  var rowNum = 0;
  function buildRows(students) {
    return students.map(function(item) {
      rowNum++;
      var r = item.record;
      var g = r.grades || {};
      var total = 0, count = 0;
      var cells = allSubjects.map(function(s) {
        var v = g[s];
        if (v !== undefined) { total += v; count++; }
        return '<td>' + (v !== undefined ? v : '—') + '</td>';
      }).join('');
      var avg = count > 0 ? Math.round((total / count) * 10) / 10 : '—';
      var passed = typeof avg === 'number' && avg >= 75;
      return '<tr><td>' + rowNum + '</td><td style="font-size:9px">' + item.lrn + '</td><td style="text-align:left">' + r.name.toUpperCase() + '</td>' + cells + '<td class="' + (passed ? 'passed' : 'failed') + '">' + avg + '</td><td class="' + (passed ? 'passed' : 'failed') + '">' + (typeof avg === 'number' ? (passed ? 'PASSED' : 'FAILED') : '—') + '</td></tr>';
    }).join('');
  }

  var tableRows = '';
  if (males.length > 0) {
    tableRows += '<tr><td colspan="' + (allSubjects.length + 5) + '" class="section-label">MALE</td></tr>' + buildRows(males);
  }
  if (females.length > 0) {
    tableRows += '<tr><td colspan="' + (allSubjects.length + 5) + '" class="section-label">FEMALE</td></tr>' + buildRows(females);
  }
  if (others.length > 0) {
    tableRows += '<tr><td colspan="' + (allSubjects.length + 5) + '" class="section-label">OTHER</td></tr>' + buildRows(others);
  }

  var teacherName = curUser ? (curUser.fname + ' ' + curUser.lname).toUpperCase() : '___________________';
  var html = '<!DOCTYPE html><html><head><title>Grade Summary - ' + cls + '</title>' + getPrintStyles() + '</head><body>' +
    getPrintHeader('CLASS GRADE SUMMARY', cls) +
    '<table><thead>' + thead + '</thead><tbody>' + tableRows + '</tbody></table>' +
    '<div class="sig-block">' +
    '<div class="sig-line"><hr>' + teacherName + '<br><small>Class Adviser</small></div>' +
    '<div class="sig-line"><hr>___________________<br><small>Principal</small></div>' +
    '</div></body></html>';

  openPrintWindow(html);
}

function printGradePerLearner() {
  var cls = document.getElementById('gradeClass').value;
  if (!cls) { toast('Please select a section first.', 'er'); return; }
  var key = 'grades_' + cls.replace(/\s/g, '_');
  var data = loadData(key, {});
  var lrns = Object.keys(data);
  if (lrns.length === 0) { toast('No grades to print yet.', 'er'); return; }

  var settings = loadData('settings', DEFAULT_SETTINGS);
  var secs = (settings.sections && settings.sections.length > 0) ? settings.sections : DEFAULT_SECTIONS;
  var baseSubjects = getSubjectsForSection(cls, secs);
  var allSubjects = baseSubjects.slice();
  if (baseSubjects.indexOf('Music & Arts') > -1) allSubjects.push('MAPEH');

  var sortedLrns = sortByLastName(lrns, function(lrn){ return data[lrn].name; });
  var schoolName = (loadData('settings', DEFAULT_SETTINGS).schoolName) || 'Dr. Bonifacio A. Masilungan Integrated National High School';
  var sy = (loadData('settings', DEFAULT_SETTINGS).schoolYear) || 'SY 2025-2026';
  var teacherName = curUser ? (curUser.fname + ' ' + curUser.lname).toUpperCase() : '___________________';

  var pages = sortedLrns.map(function(lrn) {
    var r = data[lrn];
    var g = r.grades || {};
    var total = 0, count = 0;
    var rows = allSubjects.map(function(s) {
      var v = g[s];
      if (v !== undefined) { total += v; count++; }
      return '<tr><td style="text-align:left;padding-left:8px">' + s + '</td><td>' + (v !== undefined ? v : '—') + '</td><td>' + (v !== undefined ? (v >= 75 ? 'Passed' : 'Failed') : '—') + '</td></tr>';
    }).join('');
    var avg = count > 0 ? Math.round((total / count) * 10) / 10 : '—';
    var passed = typeof avg === 'number' && avg >= 75;

    return '<div style="page-break-after:always;padding:10px">' +
      '<div style="text-align:center;margin-bottom:12px">' +
      '<div style="font-size:11px">Republic of the Philippines — Department of Education</div>' +
      '<div style="font-size:14px;font-weight:700">' + schoolName + '</div>' +
      '<div style="font-size:11px">' + sy + '</div>' +
      '<div style="font-size:16px;font-weight:700;margin:8px 0 2px">INDIVIDUAL GRADE REPORT</div>' +
      '</div>' +
      '<table style="margin-bottom:8px"><tr><td style="text-align:left;border:none;padding:2px"><strong>Name:</strong> ' + r.name.toUpperCase() + '</td><td style="text-align:left;border:none;padding:2px"><strong>LRN:</strong> ' + lrn + '</td></tr>' +
      '<tr><td style="text-align:left;border:none;padding:2px"><strong>Section:</strong> ' + cls + '</td><td style="text-align:left;border:none;padding:2px"><strong>Adviser:</strong> ' + teacherName + '</td></tr></table>' +
      '<table><thead><tr><th style="text-align:left">Subject</th><th>Grade</th><th>Remarks</th></tr></thead><tbody>' + rows +
      '<tr style="background:#f0f0f0"><td style="text-align:left;padding-left:8px;font-weight:700">GENERAL AVERAGE</td><td class="' + (passed ? 'passed' : 'failed') + '">' + avg + '</td><td class="' + (passed ? 'passed' : 'failed') + '">' + (typeof avg === 'number' ? (passed ? 'PASSED' : 'FAILED') : '—') + '</td></tr>' +
      '</tbody></table>' +
      '<div class="sig-block" style="margin-top:30px">' +
      '<div class="sig-line"><hr>' + teacherName + '<br><small>Class Adviser</small></div>' +
      '<div class="sig-line"><hr>___________________<br><small>Principal</small></div>' +
      '</div></div>';
  }).join('');

  var html = '<!DOCTYPE html><html><head><title>Grade Per Learner - ' + cls + '</title>' + getPrintStyles() + '</head><body>' + pages + '</body></html>';
  openPrintWindow(html);
}

function printAttendanceSummary() {
  var cls = document.getElementById('attClass').value;
  if (!cls) { toast('Please select a section first.', 'er'); return; }
  var key = 'attendance_' + cls.replace(/\s/g, '_');
  var data = loadData(key, {});
  var lrns = Object.keys(data);
  if (lrns.length === 0) { toast('No attendance records to print yet.', 'er'); return; }

  var sortedLrns = sortByLastName(lrns, function(lrn){ return data[lrn].name; });
  var teacherName = curUser ? (curUser.fname + ' ' + curUser.lname).toUpperCase() : '___________________';

  var rowNum = 0;
  var tableRows = sortedLrns.map(function(lrn) {
    rowNum++;
    var r = data[lrn];
    var rateClass = r.rate >= 90 ? 'passed' : 'failed';
    return '<tr><td>' + rowNum + '</td><td style="font-size:9px">' + lrn + '</td><td style="text-align:left">' + r.name.toUpperCase() + '</td>' +
      '<td>' + r.present + '</td><td>' + r.absent + '</td><td>' + r.late + '</td><td>' + r.totalDays + '</td>' +
      '<td class="' + rateClass + '">' + r.rate + '%</td></tr>';
  }).join('');

  var html = '<!DOCTYPE html><html><head><title>Attendance - ' + cls + '</title>' + getPrintStyles() + '</head><body>' +
    getPrintHeader('CLASS ATTENDANCE RECORD', cls) +
    '<table><thead><tr><th>#</th><th>LRN</th><th style="text-align:left">Name</th><th>Present</th><th>Absent</th><th>Late</th><th>Total Days</th><th>Rate</th></tr></thead>' +
    '<tbody>' + tableRows + '</tbody></table>' +
    '<div class="sig-block">' +
    '<div class="sig-line"><hr>' + teacherName + '<br><small>Class Adviser</small></div>' +
    '<div class="sig-line"><hr>___________________<br><small>Principal</small></div>' +
    '</div></body></html>';

  openPrintWindow(html);
}



// ============================================
// SCHOOL CALENDAR
// ============================================

function goToCalendar() {
  var el = document.getElementById('schoolCalendar');
  if (el) el.scrollIntoView({behavior:'smooth'});
}

var calMonth = new Date().getMonth();
var calYear = new Date().getFullYear();

function renderCalendar() {
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var el = document.getElementById('calMonthYear');
  var grid = document.getElementById('calGrid');
  if (!el || !grid) return;
  
  el.textContent = months[calMonth] + ' ' + calYear;
  
  var events = loadData('events', DEFAULT_EVENTS);
  
  // Get event dates for this month
  var eventDates = {};
  events.forEach(function(ev) {
    if (!ev.date) return;
    var d = new Date(ev.date + 'T00:00:00');
    if (d.getMonth() === calMonth && d.getFullYear() === calYear) {
      var day = d.getDate();
      if (!eventDates[day]) eventDates[day] = [];
      eventDates[day].push(ev);
    }
  });
  
  var firstDay = new Date(calYear, calMonth, 1).getDay();
  var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  var today = new Date();
  var isCurrentMonth = today.getMonth() === calMonth && today.getFullYear() === calYear;
  var todayDate = today.getDate();
  
  var html = '';
  
  // Empty cells before first day
  for (var i = 0; i < firstDay; i++) {
    html += '<div style="padding:8px;min-height:50px"></div>';
  }
  
  // Day cells
  for (var d = 1; d <= daysInMonth; d++) {
    var isToday = isCurrentMonth && d === todayDate;
    var hasEvent = eventDates[d];
    var isSunday = (firstDay + d - 1) % 7 === 0;
    
    var bg = isToday ? '#e8733a' : (hasEvent ? '#FFF3EB' : '#f8f8f8');
    var color = isToday ? '#fff' : (isSunday ? '#e8733a' : '#333');
    var border = hasEvent ? '2px solid #e8733a' : '1px solid #eee';
    var cursor = hasEvent ? 'pointer' : 'default';
    
    html += '<div onclick="' + (hasEvent ? 'showDayEvents(' + d + ')' : '') + '" style="padding:6px;min-height:50px;border-radius:8px;background:' + bg + ';border:' + border + ';cursor:' + cursor + ';position:relative;transition:all .2s">';
    html += '<div style="font-size:14px;font-weight:' + (isToday || hasEvent ? '700' : '400') + ';color:' + color + '">' + d + '</div>';
    
    if (hasEvent) {
      var count = eventDates[d].length;
      html += '<div style="position:absolute;bottom:4px;left:50%;transform:translateX(-50%);display:flex;gap:2px">';
      for (var j = 0; j < Math.min(count, 3); j++) {
        html += '<div style="width:5px;height:5px;border-radius:50%;background:#e8733a"></div>';
      }
      html += '</div>';
    }
    
    html += '</div>';
  }
  
  grid.innerHTML = html;
}

function showDayEvents(day) {
  var events = loadData('events', DEFAULT_EVENTS);
  var dayEvents = events.filter(function(ev) {
    if (!ev.date) return false;
    var d = new Date(ev.date + 'T00:00:00');
    return d.getDate() === day && d.getMonth() === calMonth && d.getFullYear() === calYear;
  });
  
  var el = document.getElementById('calEventDetails');
  if (!el || dayEvents.length === 0) return;
  
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var html = '<h4 style="font-size:15px;margin-bottom:12px;color:#e8733a">' + months[calMonth] + ' ' + day + ', ' + calYear + '</h4>';
  
  dayEvents.forEach(function(ev) {
    var statusColor = ev.status === 'Upcoming' ? '#059669' : (ev.status === 'Completed' ? '#666' : '#ef4444');
    html += '<div style="padding:12px;background:#fff;border-radius:10px;margin-bottom:8px;border-left:3px solid #e8733a">';
    html += '<div style="font-weight:700;font-size:15px">' + ev.name + '</div>';
    html += '<div style="display:flex;gap:12px;margin-top:6px;font-size:13px;color:#666;flex-wrap:wrap">';
    if (ev.time) html += '<span>&#128336; ' + ev.time + '</span>';
    if (ev.venue) html += '<span>&#128205; ' + ev.venue + '</span>';
    html += '<span style="color:' + statusColor + ';font-weight:600">' + ev.status + '</span>';
    html += '</div>';
    if (ev.desc) html += '<p style="margin-top:6px;font-size:13px;color:#555">' + ev.desc + '</p>';
    html += '</div>';
  });
  
  el.innerHTML = html;
  el.style.display = 'block';
}

function changeMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  document.getElementById('calEventDetails').style.display = 'none';
  renderCalendar();
}



// ============================================
// TEACHER RESOURCES (PASSWORD PROTECTED)
// ============================================

function openResourcesModal() {
  var modal = document.getElementById('resourcesModal');
  if (!modal) return;
  modal.style.display = 'flex';
  
  // Reset to password screen
  document.getElementById('resModalContent').innerHTML = 
    '<h2 style="margin-bottom:8px">&#128274; Teacher Resources</h2>' +
    '<p style="color:#666;margin-bottom:20px">Enter password to access resources</p>' +
    '<div style="display:flex;gap:8px;margin-bottom:16px">' +
    '<input id="resPassInput" type="password" placeholder="Enter password" style="flex:1;padding:12px 16px;border:1.5px solid #ddd;border-radius:10px;font-size:15px" onkeypress="if(event.key===\'Enter\')checkResPassword()">' +
    '<button onclick="checkResPassword()" style="padding:12px 24px;background:#e8733a;color:#fff;border:none;border-radius:10px;font-weight:600;cursor:pointer">Open</button>' +
    '</div>' +
    '<div id="resPassError" style="display:none;color:#ef4444;font-size:13px"></div>';
  
  setTimeout(function() {
    var inp = document.getElementById('resPassInput');
    if (inp) inp.focus();
  }, 100);
}

function closeResModal() {
  var modal = document.getElementById('resourcesModal');
  if (modal) modal.style.display = 'none';
}

function checkResPassword() {
  var input = document.getElementById('resPassInput');
  if (!input) return;
  var pw = input.value;
  
  var res = loadData('resources', {password:'', links:[]});
  
  if (!res.password) {
    document.getElementById('resPassError').style.display = 'block';
    document.getElementById('resPassError').textContent = 'No password set yet. Contact admin.';
    return;
  }
  
  if (pw !== res.password) {
    document.getElementById('resPassError').style.display = 'block';
    document.getElementById('resPassError').textContent = 'Incorrect password. Try again.';
    input.value = '';
    input.focus();
    return;
  }
  
  // Password correct - show resources
  showResources(res.links || []);
}

function showResources(links) {
  var el = document.getElementById('resModalContent');
  if (!el) return;
  
  var html = '<h2 style="margin-bottom:4px">&#128194; Teacher Resources</h2>';
  html += '<p style="color:#666;margin-bottom:20px;font-size:14px">' + links.length + ' resources available</p>';
  
  if (links.length === 0) {
    html += '<div style="text-align:center;padding:32px;color:#999"><div style="font-size:48px;margin-bottom:12px">&#128194;</div><p>No resources added yet.</p><p style="font-size:13px">Ask the admin to add resource links.</p></div>';
    el.innerHTML = html;
    return;
  }
  
  var catColors = {Modules:'#e8733a',Textbooks:'#1a365d',Handouts:'#059669',Worksheets:'#7c3aed',Training:'#0891b2',Forms:'#dc2626',General:'#666'};
  
  // Group by category
  var grouped = {};
  links.forEach(function(l) {
    var cat = l.category || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(l);
  });
  
  Object.keys(grouped).forEach(function(cat) {
    var color = catColors[cat] || '#666';
    html += '<div style="margin-bottom:18px">';
    html += '<h4 style="font-size:14px;color:' + color + ';margin-bottom:10px;padding-bottom:4px;border-bottom:2px solid ' + color + '30">' + cat + '</h4>';
    
    grouped[cat].forEach(function(l) {
      html += '<a href="' + l.url + '" target="_blank" style="display:block;text-decoration:none;color:inherit;padding:12px 14px;background:#f8f8f8;border-radius:10px;margin-bottom:8px;border:1px solid #eee;transition:all .2s">';
      html += '<div style="display:flex;align-items:center;gap:10px">';
      html += '<div style="width:36px;height:36px;border-radius:8px;background:' + color + '15;display:flex;align-items:center;justify-content:center;font-size:18px">&#128279;</div>';
      html += '<div style="flex:1"><div style="font-weight:600;font-size:14px;color:#333">' + l.title + '</div>';
      if (l.desc) html += '<div style="font-size:12px;color:#888;margin-top:2px">' + l.desc + '</div>';
      html += '</div>';
      html += '<span style="color:' + color + ';font-size:13px">Open &#8599;</span>';
      html += '</div></a>';
    });
    
    html += '</div>';
  });
  
  el.innerHTML = html;
}



// ============================================
// COMMUNITY SECTIONS RENDERING
// ============================================

function renderCommunity() {
  renderAchieveWall();
  renderGalleryWall();
  renderHistoryTimeline();
  renderAlumniWall();
}

function renderAchieveWall() {
  var data = loadData('achievements', []);
  var el = document.getElementById('achieveWall');
  if (!el) return;
  if (data.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:24px;color:#999;grid-column:1/-1">No achievements posted yet.</div>';
    return;
  }
  var catColors = {Academic:'#e8733a',Sports:'#1a365d',Arts:'#7c3aed',Community:'#059669',School:'#dc2626'};
  var catIcons = {Academic:'&#127942;',Sports:'&#9917;',Arts:'&#127912;',Community:'&#129309;',School:'&#127979;'};
  var html = '';
  data.forEach(function(a) {
    var color = catColors[a.cat] || '#666';
    var icon = catIcons[a.cat] || '&#127942;';
    html += '<div style="background:#fff;border-radius:14px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.06);border-left:4px solid ' + color + '">';
    html += '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">';
    html += '<span style="font-size:28px">' + icon + '</span>';
    html += '<span style="font-size:12px;padding:3px 10px;border-radius:12px;background:' + color + '15;color:' + color + ';font-weight:600">' + (a.cat||'') + ' ' + (a.year||'') + '</span>';
    html += '</div>';
    html += '<h4 style="font-size:15px;margin-bottom:6px;color:#1a202c">' + a.title + '</h4>';
    if (a.desc) html += '<p style="font-size:13px;color:#666;line-height:1.5">' + a.desc + '</p>';
    html += '</div>';
  });
  el.innerHTML = html;
}

function renderGalleryWall() {
  var data = loadData('gallery', []);
  var el = document.getElementById('galleryWall');
  if (!el) return;
  if (data.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:24px;color:#999;grid-column:1/-1">No photo albums yet.</div>';
    return;
  }
  var html = '';
  data.forEach(function(a) {
    var coverBg = a.cover ? 'url(' + a.cover + ')' : 'linear-gradient(135deg,#e8733a,#f09a5e)';
    html += '<a href="' + a.url + '" target="_blank" style="text-decoration:none;color:inherit">';
    html += '<div style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);transition:transform .2s;cursor:pointer" onmouseover="this.style.transform=\'translateY(-3px)\'" onmouseout="this.style.transform=\'none\'">';
    html += '<div style="height:140px;background:' + coverBg + ';background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center">';
    if (!a.cover) html += '<span style="font-size:40px;opacity:.8">&#128248;</span>';
    html += '</div>';
    html += '<div style="padding:14px">';
    html += '<h4 style="font-size:14px;margin-bottom:4px">' + a.title + '</h4>';
    html += '<div style="display:flex;justify-content:space-between;align-items:center">';
    html += '<span style="font-size:12px;color:#999">' + (a.cat||'') + '</span>';
    html += '<span style="font-size:11px;color:#e8733a;font-weight:600">View Album &#8599;</span>';
    html += '</div></div></div></a>';
  });
  el.innerHTML = html;
}

function renderHistoryTimeline() {
  var data = loadData('history', []);
  var el = document.getElementById('historyTimeline');
  if (!el) return;
  if (data.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:24px;color:#999">No milestones yet.</div>';
    return;
  }
  data.sort(function(a,b){return (a.year||0)-(b.year||0);});
  var html = '<div style="position:relative;padding-left:30px">';
  html += '<div style="position:absolute;left:10px;top:0;bottom:0;width:3px;background:linear-gradient(180deg,#e8733a,#1a365d);border-radius:3px"></div>';
  data.forEach(function(a, i) {
    var isLast = i === data.length - 1;
    html += '<div style="position:relative;margin-bottom:24px;padding-left:20px">';
    html += '<div style="position:absolute;left:-24px;top:4px;width:14px;height:14px;border-radius:50%;background:' + (isLast ? '#e8733a' : '#fff') + ';border:3px solid #e8733a;z-index:1"></div>';
    html += '<div style="background:#fff;border-radius:12px;padding:16px 18px;box-shadow:0 2px 8px rgba(0,0,0,0.05)">';
    html += '<span style="font-size:12px;padding:2px 10px;border-radius:12px;background:#e8733a15;color:#e8733a;font-weight:700">' + (a.year||'') + '</span>';
    html += '<h4 style="font-size:15px;margin:8px 0 4px;color:#1a202c">' + a.title + '</h4>';
    if (a.desc) html += '<p style="font-size:13px;color:#666;line-height:1.5">' + a.desc + '</p>';
    html += '</div></div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

function renderAlumniWall() {
  var data = loadData('alumni', []);
  var el = document.getElementById('alumniWall');
  if (!el) return;
  if (data.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:24px;color:#999;grid-column:1/-1">No alumni information yet.</div>';
    return;
  }
  data.sort(function(a,b){return (b.year||0)-(a.year||0);});
  var html = '';
  data.forEach(function(a) {
    html += '<div style="background:#fff;border-radius:14px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.06);text-align:center">';
    html += '<div style="font-size:36px;margin-bottom:8px">&#127891;</div>';
    html += '<h4 style="font-size:16px;color:#1a365d;margin-bottom:4px">Batch ' + (a.year||'') + '</h4>';
    if (a.title) html += '<p style="font-size:13px;color:#e8733a;font-weight:600;margin-bottom:6px">' + a.title + '</p>';
    if (a.desc) html += '<p style="font-size:12px;color:#666;margin-bottom:10px">' + a.desc + '</p>';
    if (a.url) html += '<a href="' + a.url + '" target="_blank" style="font-size:12px;color:#e8733a;text-decoration:none;font-weight:600">Connect with Batch &#8599;</a>';
    html += '</div>';
  });
  el.innerHTML = html;
}



// ============================================
// QUIZ & EXAM SYSTEM
// ============================================

var quizQuestions = [];
var currentQuiz = null;
var quizTimer = null;
var quizTimeLeft = 0;

// ---- TEACHER FUNCTIONS ----

function openCreateQuiz() {
  quizQuestions = [];
  var settings = loadData('settings', DEFAULT_SETTINGS);
  var secs = (settings.sections && settings.sections.length > 0) ? settings.sections : [];
  var secOpts = '';
  secs.forEach(function(s) {
    var name = typeof s === 'object' ? s.name : s;
    secOpts += '<option value="' + name + '">' + name + '</option>';
  });
  
  var html = '<div style="background:#fff;border-radius:12px;padding:20px;border:1px solid var(--g2)">';
  html += '<h4 style="margin-bottom:16px">&#128221; Create New Quiz</h4>';
  html += '<div class="fg"><label>Quiz Title</label><input id="qzTitle" placeholder="e.g. Math Quiz Chapter 5"></div>';
  html += '<div class="fg-row"><div class="fg"><label>Subject</label><input id="qzSubject" placeholder="e.g. Mathematics"></div>';
  html += '<div class="fg"><label>Time Limit (minutes)</label><input id="qzTime" type="number" value="30" min="1"></div></div>';
  html += '<div class="fg"><label>Section</label><select id="qzSection">' + secOpts + '</select></div>';
  html += '<hr style="border:none;border-top:1px solid var(--g2);margin:16px 0">';
  html += '<h4 style="margin-bottom:12px">Questions</h4>';
  html += '<div id="qzQuestionsList"></div>';
  html += '<div style="display:flex;gap:8px;margin:16px 0;flex-wrap:wrap">';
  html += '<button class="btn btn-s btn-sm" onclick="addQuizQuestion(\'mc\')">+ Multiple Choice</button>';
  html += '<button class="btn btn-s btn-sm" onclick="addQuizQuestion(\'tf\')">+ True or False</button>';
  html += '<button class="btn btn-s btn-sm" onclick="addQuizQuestion(\'id\')">+ Identification</button>';
  html += '</div>';
  html += '<hr style="border:none;border-top:1px solid var(--g2);margin:16px 0">';
  html += '<div style="display:flex;gap:10px">';
  html += '<button class="btn btn-p" onclick="saveQuiz()">&#128190; Save & Publish Quiz</button>';
  html += '<button class="btn btn-s" onclick="cancelCreateQuiz()">Cancel</button>';
  html += '</div></div>';
  
  document.getElementById('teacherQuizList').innerHTML = html;
}

function addQuizQuestion(type) {
  var num = quizQuestions.length + 1;
  quizQuestions.push({type: type, question: '', choices: ['','','',''], answer: ''});
  renderQuizQuestions();
}

function renderQuizQuestions() {
  var el = document.getElementById('qzQuestionsList');
  if (!el) return;
  if (quizQuestions.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--g5);font-size:13px">No questions yet. Add questions using the buttons below.</div>';
    return;
  }
  
  var html = '';
  quizQuestions.forEach(function(q, i) {
    var typeLabel = q.type === 'mc' ? 'Multiple Choice' : (q.type === 'tf' ? 'True or False' : 'Identification');
    var typeColor = q.type === 'mc' ? '#e8733a' : (q.type === 'tf' ? '#1a365d' : '#059669');
    
    html += '<div style="background:var(--g1);border-radius:10px;padding:14px;margin-bottom:10px;border-left:3px solid ' + typeColor + '">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
    html += '<span style="font-weight:700;font-size:13px">Q' + (i+1) + ' <span style="font-size:11px;padding:2px 8px;border-radius:8px;background:' + typeColor + '20;color:' + typeColor + '">' + typeLabel + '</span></span>';
    html += '<button class="abtn del" onclick="removeQuizQuestion(' + i + ')" style="width:24px;height:24px;font-size:11px">&#10005;</button>';
    html += '</div>';
    html += '<div class="fg" style="margin-bottom:8px"><input id="qq_' + i + '" value="' + (q.question||'') + '" placeholder="Enter question..." onchange="quizQuestions[' + i + '].question=this.value"></div>';
    
    if (q.type === 'mc') {
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">';
      for (var c = 0; c < 4; c++) {
        var letter = ['A','B','C','D'][c];
        html += '<div style="display:flex;gap:4px;align-items:center">';
        html += '<input type="radio" name="qa_' + i + '" value="' + letter + '" ' + (q.answer===letter?'checked':'') + ' onchange="quizQuestions[' + i + '].answer=\'' + letter + '\'">';
        html += '<input id="qc_' + i + '_' + c + '" value="' + (q.choices[c]||'') + '" placeholder="' + letter + '..." style="flex:1;padding:6px 10px;border:1px solid var(--g2);border-radius:6px;font-size:13px" onchange="quizQuestions[' + i + '].choices[' + c + ']=this.value">';
        html += '</div>';
      }
      html += '</div>';
      html += '<p style="font-size:11px;color:var(--g5)">&#9432; Select the radio button next to the correct answer</p>';
    } else if (q.type === 'tf') {
      html += '<div style="display:flex;gap:12px;margin-bottom:8px">';
      html += '<label style="display:flex;align-items:center;gap:4px;font-size:13px"><input type="radio" name="qa_' + i + '" value="True" ' + (q.answer==='True'?'checked':'') + ' onchange="quizQuestions[' + i + '].answer=\'True\'"> True</label>';
      html += '<label style="display:flex;align-items:center;gap:4px;font-size:13px"><input type="radio" name="qa_' + i + '" value="False" ' + (q.answer==='False'?'checked':'') + ' onchange="quizQuestions[' + i + '].answer=\'False\'"> False</label>';
      html += '</div>';
    } else {
      html += '<div class="fg" style="margin-bottom:0"><input id="qans_' + i + '" value="' + (q.answer||'') + '" placeholder="Correct answer..." onchange="quizQuestions[' + i + '].answer=this.value"></div>';
    }
    html += '</div>';
  });
  el.innerHTML = html;
}

function removeQuizQuestion(i) {
  quizQuestions.splice(i, 1);
  renderQuizQuestions();
}

function saveQuiz() {
  var title = document.getElementById('qzTitle').value;
  var subject = document.getElementById('qzSubject').value;
  var section = document.getElementById('qzSection').value;
  var timeLimit = parseInt(document.getElementById('qzTime').value) || 30;
  
  if (!title) { toast('Enter quiz title', 'er'); return; }
  if (quizQuestions.length === 0) { toast('Add at least one question', 'er'); return; }
  
  var valid = true;
  quizQuestions.forEach(function(q, i) {
    if (!q.question) { toast('Question ' + (i+1) + ' is empty', 'er'); valid = false; }
    if (!q.answer) { toast('Question ' + (i+1) + ' has no answer', 'er'); valid = false; }
    if (q.type === 'mc') {
      q.choices.forEach(function(c, j) {
        if (!c) { toast('Q' + (i+1) + ' Choice ' + ['A','B','C','D'][j] + ' is empty', 'er'); valid = false; }
      });
    }
  });
  if (!valid) return;
  
  // Shuffle questions for randomization seed
  var quiz = {
    id: Date.now(),
    title: title,
    subject: subject,
    section: section,
    timeLimit: timeLimit,
    questions: quizQuestions,
    totalItems: quizQuestions.length,
    createdBy: curUser ? curUser.name : 'Teacher',
    createdAt: new Date().toISOString(),
    status: 'Active'
  };
  
  var quizzes = loadData('quizzes', []);
  quizzes.unshift(quiz);
  saveData('quizzes', quizzes);
  
  quizQuestions = [];
  toast('Quiz published! ' + quiz.totalItems + ' questions.', 'su');
  loadTeacherQuizzes();
}

function cancelCreateQuiz() {
  quizQuestions = [];
  loadTeacherQuizzes();
}

function loadTeacherQuizzes() {
  var quizzes = loadData('quizzes', []);
  var el = document.getElementById('teacherQuizList');
  if (!el) return;
  
  if (quizzes.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--g5)"><div style="font-size:48px;margin-bottom:12px">&#128221;</div><p>No quizzes yet. Click "+ Create Quiz" to get started.</p></div>';
    return;
  }
  
  var html = '<div style="display:grid;gap:12px">';
  quizzes.forEach(function(q, i) {
    var results = loadData('quiz_results_' + q.id, {});
    var taken = Object.keys(results).length;
    
    html += '<div style="background:#fff;border-radius:12px;padding:18px;border:1px solid var(--g2)">';
    html += '<div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:8px">';
    html += '<div><h4 style="font-size:15px;margin-bottom:4px">' + q.title + '</h4>';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--g5)">';
    html += '<span>&#128218; ' + (q.subject||'') + '</span>';
    html += '<span>&#128100; ' + (q.section||'') + '</span>';
    html += '<span>&#9200; ' + q.timeLimit + ' min</span>';
    html += '<span>&#128221; ' + q.totalItems + ' items</span>';
    html += '<span>&#128100; ' + taken + ' taken</span>';
    html += '</div></div>';
    html += '<div style="display:flex;gap:4px">';
    html += '<button class="btn btn-s btn-sm" onclick="viewQuizResults(' + q.id + ')">&#128202; Results</button>';
    html += '<button class="abtn del" onclick="deleteQuiz(' + i + ')">&#128465;</button>';
    html += '</div></div></div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

function deleteQuiz(i) {
  var quizzes = loadData('quizzes', []);
  if (!confirm('Delete "' + quizzes[i].title + '"?')) return;
  var qid = quizzes[i].id;
  quizzes.splice(i, 1);
  saveData('quizzes', quizzes);
  db.collection('portal_data').doc('quiz_results_' + qid).delete();
  loadTeacherQuizzes();
  toast('Quiz deleted', 'su');
}

function viewQuizResults(qid) {
  var quizzes = loadData('quizzes', []);
  var quiz = quizzes.find(function(q) { return q.id === qid; });
  if (!quiz) return;
  
  var results = loadData('quiz_results_' + qid, {});
  var students = Object.keys(results);
  
  var el = document.getElementById('teacherQuizList');
  var html = '<div style="background:#fff;border-radius:12px;padding:20px;border:1px solid var(--g2)">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
  html += '<h4>&#128202; Results: ' + quiz.title + '</h4>';
  html += '<button class="btn btn-s btn-sm" onclick="loadTeacherQuizzes()">&#8592; Back</button>';
  html += '</div>';
  
  if (students.length === 0) {
    html += '<div style="text-align:center;padding:24px;color:var(--g5)">No students have taken this quiz yet.</div>';
  } else {
    var totalScore = 0;
    html += '<table><thead><tr><th>Student</th><th>LRN</th><th>Score</th><th>Percentage</th><th>Time</th><th>Status</th></tr></thead><tbody>';
    students.forEach(function(lrn) {
      var r = results[lrn];
      var pct = Math.round((r.score / r.total) * 100);
      totalScore += pct;
      var badge = pct >= 75 ? 'b-ac' : 'b-fe';
      html += '<tr><td><strong>' + (r.name||lrn) + '</strong></td>';
      html += '<td style="font-family:monospace;font-size:12px">' + lrn + '</td>';
      html += '<td style="text-align:center"><strong>' + r.score + ' / ' + r.total + '</strong></td>';
      html += '<td style="text-align:center;font-weight:700;color:' + (pct>=75?'var(--su)':'var(--da)') + '">' + pct + '%</td>';
      html += '<td style="font-size:12px">' + (r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '') + '</td>';
      html += '<td><span class="badge ' + badge + '">' + (pct>=75?'Passed':'Failed') + '</span></td></tr>';
    });
    html += '</tbody></table>';
    
    var avg = Math.round(totalScore / students.length);
    html += '<div style="margin-top:12px;padding:12px;background:var(--g1);border-radius:8px;display:flex;gap:24px;font-size:14px">';
    html += '<span><strong>' + students.length + '</strong> students took the quiz</span>';
    html += '<span>Class Average: <strong style="color:' + (avg>=75?'var(--su)':'var(--da)') + '">' + avg + '%</strong></span>';
    html += '</div>';
  }
  
  html += '</div>';
  el.innerHTML = html;
}

// ---- STUDENT FUNCTIONS ----

function loadStudentQuizzes() {
  if (!curUser || curUser.type !== 'student') return;
  var quizzes = loadData('quizzes', []);
  var el = document.getElementById('studentQuizList');
  if (!el) return;
  
  var mySection = curUser.grade || '';
  var myQuizzes = quizzes.filter(function(q) {
    return q.status === 'Active' && (q.section === mySection || q.section === 'All');
  });
  
  if (myQuizzes.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--g5)">No quizzes available for your section.</div>';
    return;
  }
  
  var html = '<div style="display:grid;gap:12px">';
  myQuizzes.forEach(function(q) {
    var results = loadData('quiz_results_' + q.id, {});
    var myResult = results[curUser.lrn];
    
    html += '<div style="background:var(--g1);border-radius:12px;padding:16px;border:1px solid var(--g2)">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">';
    html += '<div><h4 style="font-size:15px;margin-bottom:4px">' + q.title + '</h4>';
    html += '<div style="font-size:12px;color:var(--g5)">&#128218; ' + (q.subject||'') + ' &bull; &#9200; ' + q.timeLimit + ' min &bull; &#128221; ' + q.totalItems + ' items</div>';
    html += '</div>';
    
    if (myResult) {
      var pct = Math.round((myResult.score / myResult.total) * 100);
      html += '<div style="text-align:center"><div style="font-size:24px;font-weight:800;color:' + (pct>=75?'var(--su)':'var(--da)') + '">' + pct + '%</div>';
      html += '<div style="font-size:11px;color:var(--g5)">' + myResult.score + '/' + myResult.total + '</div></div>';
    } else {
      html += '<button class="btn btn-p btn-sm" onclick="startQuiz(' + q.id + ')">Take Quiz &#10148;</button>';
    }
    
    html += '</div></div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

function startQuiz(qid) {
  var quizzes = loadData('quizzes', []);
  currentQuiz = quizzes.find(function(q) { return q.id === qid; });
  if (!currentQuiz) return;
  
  // Randomize questions
  var shuffled = currentQuiz.questions.slice();
  for (var i = shuffled.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = temp;
  }
  currentQuiz._shuffled = shuffled;
  
  // Randomize MC choices
  shuffled.forEach(function(q) {
    if (q.type === 'mc') {
      var origAnswer = q.choices[['A','B','C','D'].indexOf(q.answer)];
      var newChoices = q.choices.slice();
      for (var i = newChoices.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = newChoices[i]; newChoices[i] = newChoices[j]; newChoices[j] = tmp;
      }
      q._shuffledChoices = newChoices;
      q._correctIndex = newChoices.indexOf(origAnswer);
    }
  });
  
  quizTimeLeft = currentQuiz.timeLimit * 60;
  
  var el = document.getElementById('studentQuizList');
  el.style.display = 'none';
  
  var area = document.getElementById('quizTakeArea');
  area.style.display = 'block';
  renderQuizUI();
  
  quizTimer = setInterval(function() {
    quizTimeLeft--;
    updateQuizTimer();
    if (quizTimeLeft <= 0) {
      clearInterval(quizTimer);
      submitQuiz();
    }
  }, 1000);
}

function renderQuizUI() {
  var area = document.getElementById('quizTakeArea');
  var q = currentQuiz;
  var questions = q._shuffled;
  
  var html = '<div style="background:#fff;border-radius:12px;padding:20px;border:1px solid var(--g2)">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">';
  html += '<h4>' + q.title + '</h4>';
  html += '<div id="quizTimerDisplay" style="font-size:18px;font-weight:700;color:var(--da);font-family:monospace;background:var(--dab);padding:6px 14px;border-radius:8px"></div>';
  html += '</div>';
  html += '<p style="font-size:13px;color:var(--g5);margin-bottom:16px">&#128218; ' + (q.subject||'') + ' &bull; ' + questions.length + ' items &bull; ' + q.timeLimit + ' minutes</p>';
  
  questions.forEach(function(item, i) {
    var typeColor = item.type === 'mc' ? '#e8733a' : (item.type === 'tf' ? '#1a365d' : '#059669');
    html += '<div style="background:var(--g1);border-radius:10px;padding:14px;margin-bottom:10px;border-left:3px solid ' + typeColor + '">';
    html += '<div style="font-weight:700;font-size:14px;margin-bottom:8px">' + (i+1) + '. ' + item.question + '</div>';
    
    if (item.type === 'mc') {
      var choices = item._shuffledChoices || item.choices;
      choices.forEach(function(c, j) {
        var letter = ['A','B','C','D'][j];
        html += '<label style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#fff;border-radius:8px;margin-bottom:4px;cursor:pointer;border:1px solid var(--g2)">';
        html += '<input type="radio" name="sq_' + i + '" value="' + j + '"> <span style="font-weight:600;color:' + typeColor + '">' + letter + '.</span> ' + c;
        html += '</label>';
      });
    } else if (item.type === 'tf') {
      html += '<label style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#fff;border-radius:8px;margin-bottom:4px;cursor:pointer;border:1px solid var(--g2)">';
      html += '<input type="radio" name="sq_' + i + '" value="True"> True</label>';
      html += '<label style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#fff;border-radius:8px;margin-bottom:4px;cursor:pointer;border:1px solid var(--g2)">';
      html += '<input type="radio" name="sq_' + i + '" value="False"> False</label>';
    } else {
      html += '<input id="sq_' + i + '" placeholder="Type your answer..." style="width:100%;padding:10px 14px;border:1.5px solid var(--g2);border-radius:8px;font-size:14px;font-family:var(--fb)">';
    }
    html += '</div>';
  });
  
  html += '<div style="display:flex;gap:10px;margin-top:16px">';
  html += '<button class="btn btn-p" onclick="submitQuiz()">&#128190; Submit Quiz</button>';
  html += '</div></div>';
  
  area.innerHTML = html;
  updateQuizTimer();
}

function updateQuizTimer() {
  var el = document.getElementById('quizTimerDisplay');
  if (!el) return;
  var m = Math.floor(quizTimeLeft / 60);
  var s = quizTimeLeft % 60;
  el.textContent = (m<10?'0':'') + m + ':' + (s<10?'0':'') + s;
  if (quizTimeLeft <= 60) el.style.color = 'var(--da)';
}

function submitQuiz() {
  if (quizTimer) clearInterval(quizTimer);
  
  var questions = currentQuiz._shuffled;
  var score = 0;
  var total = questions.length;
  var answers = [];
  
  questions.forEach(function(item, i) {
    var studentAnswer = '';
    if (item.type === 'mc') {
      var selected = document.querySelector('input[name="sq_' + i + '"]:checked');
      if (selected) {
        var idx = parseInt(selected.value);
        studentAnswer = (item._shuffledChoices || item.choices)[idx];
        var correctChoice = item.choices[['A','B','C','D'].indexOf(item.answer)];
        if (studentAnswer === correctChoice) score++;
      }
    } else if (item.type === 'tf') {
      var selected = document.querySelector('input[name="sq_' + i + '"]:checked');
      if (selected) {
        studentAnswer = selected.value;
        if (studentAnswer === item.answer) score++;
      }
    } else {
      var input = document.getElementById('sq_' + i);
      if (input) {
        studentAnswer = input.value.trim();
        if (studentAnswer.toLowerCase() === item.answer.toLowerCase()) score++;
      }
    }
    answers.push({question: item.question, studentAnswer: studentAnswer, correct: item.answer});
  });
  
  // Save result
  var results = loadData('quiz_results_' + currentQuiz.id, {});
  results[curUser.lrn] = {
    name: curUser.name,
    score: score,
    total: total,
    answers: answers,
    submittedAt: new Date().toISOString()
  };
  saveData('quiz_results_' + currentQuiz.id, results);
  
  var pct = Math.round((score / total) * 100);
  
  // Show results
  var area = document.getElementById('quizTakeArea');
  var html = '<div style="background:#fff;border-radius:12px;padding:24px;text-align:center;border:1px solid var(--g2)">';
  html += '<div style="font-size:48px;margin-bottom:12px">' + (pct >= 75 ? '&#127942;' : '&#128221;') + '</div>';
  html += '<h3 style="margin-bottom:8px">' + currentQuiz.title + '</h3>';
  html += '<div style="font-size:48px;font-weight:800;color:' + (pct>=75?'var(--su)':'var(--da)') + ';margin:16px 0">' + pct + '%</div>';
  html += '<p style="font-size:16px;margin-bottom:4px">Score: <strong>' + score + ' / ' + total + '</strong></p>';
  html += '<p style="font-size:14px;color:var(--g5);margin-bottom:20px">' + (pct>=75?'Congratulations! You passed!':'Keep studying. You can do better next time.') + '</p>';
  
  html += '<div style="text-align:left;margin-top:16px">';
  html += '<h4 style="margin-bottom:12px">Review Answers:</h4>';
  answers.forEach(function(a, i) {
    var isCorrect = false;
    if (questions[i].type === 'mc') {
      var correctChoice = questions[i].choices[['A','B','C','D'].indexOf(questions[i].answer)];
      isCorrect = a.studentAnswer === correctChoice;
    } else if (questions[i].type === 'tf') {
      isCorrect = a.studentAnswer === a.correct;
    } else {
      isCorrect = a.studentAnswer.toLowerCase() === a.correct.toLowerCase();
    }
    
    var bg = isCorrect ? '#f0fdf4' : '#fef2f2';
    var icon = isCorrect ? '&#10003;' : '&#10007;';
    var color = isCorrect ? '#22c55e' : '#ef4444';
    
    html += '<div style="background:' + bg + ';border-radius:8px;padding:12px;margin-bottom:6px;border-left:3px solid ' + color + '">';
    html += '<div style="font-weight:600;font-size:13px"><span style="color:' + color + '">' + icon + '</span> Q' + (i+1) + '. ' + a.question + '</div>';
    html += '<div style="font-size:12px;margin-top:4px;color:#666">Your answer: <strong>' + (a.studentAnswer || 'No answer') + '</strong>';
    if (!isCorrect) {
      var correctDisplay = a.correct;
      if (questions[i].type === 'mc') {
        correctDisplay = questions[i].choices[['A','B','C','D'].indexOf(questions[i].answer)];
      }
      html += ' | Correct: <strong style="color:var(--su)">' + correctDisplay + '</strong>';
    }
    html += '</div></div>';
  });
  html += '</div>';
  
  html += '<button class="btn btn-s" onclick="closeQuizResult()" style="margin-top:16px">&#8592; Back to Quizzes</button>';
  html += '</div>';
  
  area.innerHTML = html;
  currentQuiz = null;
}

function closeQuizResult() {
  document.getElementById('quizTakeArea').style.display = 'none';
  document.getElementById('studentQuizList').style.display = 'block';
  loadStudentQuizzes();
}



// ============================================
// TEACHER DASHBOARD DYNAMIC STATS
// ============================================

function updateTeacherStats() {
  var keys = Object.keys(_cache);
  var classCount = 0;
  var totalStudents = 0;
  var sectionsWithGrades = {};
  var sectionsWithAttendance = {};
  var allSections = {};
  
  // Count classes and students from grades data
  keys.forEach(function(k) {
    if (k.startsWith('grades_')) {
      var section = k.replace('grades_', '').replace(/_/g, ' ');
      var data = _cache[k];
      if (data) {
        var count = Object.keys(data).length;
        if (count > 0) {
          sectionsWithGrades[section] = true;
          allSections[section] = true;
          totalStudents += count;
        }
      }
    }
    if (k.startsWith('attendance_')) {
      var section = k.replace('attendance_', '').replace(/_/g, ' ');
      sectionsWithAttendance[section] = true;
      allSections[section] = true;
    }
    if (k.startsWith('schedule_')) {
      var section = k.replace('schedule_', '').replace(/_/g, ' ');
      allSections[section] = true;
    }
  });
  
  classCount = Object.keys(allSections).length;
  
  // Count sections without grades (pending)
  var settings = loadData('settings', {});
  var sections = (settings.sections && settings.sections.length > 0) ? settings.sections : [];
  var pendingCount = 0;
  sections.forEach(function(s) {
    var name = typeof s === 'object' ? s.name : s;
    if (!sectionsWithGrades[name]) pendingCount++;
  });
  
  // Calculate average attendance
  var totalRate = 0;
  var attCount = 0;
  keys.forEach(function(k) {
    if (k.startsWith('attendance_')) {
      var data = _cache[k];
      if (data) {
        Object.keys(data).forEach(function(lrn) {
          if (data[lrn].rate) {
            totalRate += parseFloat(data[lrn].rate);
            attCount++;
          }
        });
      }
    }
  });
  var avgAtt = attCount > 0 ? Math.round(totalRate / attCount) + '%' : '--';
  
  // Update UI
  var el1 = document.getElementById('tStatClasses');
  var el2 = document.getElementById('tStatStudents');
  var el3 = document.getElementById('tStatPending');
  var el4 = document.getElementById('tStatAttendance');
  if (el1) el1.textContent = classCount;
  if (el2) el2.textContent = totalStudents;
  if (el3) el3.textContent = pendingCount;
  if (el4) el4.textContent = avgAtt;
}

// Hook into login to load grades
var _origLogin = doLogin;
doLogin = function() {
  _origLogin();
  if (curUser) {
    setTimeout(function() { loadStudentGrades(); loadStudentAttendance(); loadStudentSchedule(); loadStudentQuizzes(); }, 100);
  }
};
