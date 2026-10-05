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
    if (typeof updateSYLabels === 'function') updateSYLabels();
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
  if (typeof updateGradeLockPanel === 'function') updateGradeLockPanel();
  if (typeof renderGradeRequestList === 'function') renderGradeRequestList();
  if (curUser && curUser.type === 'student' && typeof loadStudentSchedule === 'function') loadStudentSchedule();
  if (typeof updateSYLabels === 'function') updateSYLabels();
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

// School Year label sa Student Dashboard - kinukuha sa Admin > Portal Settings > School Year
function updateSYLabels(){
  try{
    var st=loadData('settings', DEFAULT_SETTINGS)||{};
    var sy=String(st.schoolYear||'').trim().replace(/^S\.?Y\.?\s*/i,'');
    var el=document.getElementById('sdSY');
    if(el&&sy) el.textContent='SY '+sy;
  }catch(e){console.warn('updateSYLabels:',e);}
}

function completeLogin(user){
curUser=user;closeM();
document.getElementById('publicSite').style.display='none';
if(user.type==='student'){
document.getElementById('studentDash').classList.add('act');
document.getElementById('sdAv').textContent=user.fname[0];
document.getElementById('sdName').textContent=user.fname+' '+user.lname;
document.getElementById('sdWelcome').textContent=user.fname;
updateSYLabels();
}else if(user.type==='teacher'){
document.getElementById('teacherDash').classList.add('act');
// Look up advisory sections from the Teachers Directory (matched by Employee ID)
var teacherRecords = loadData('teachers', DEFAULT_TEACHERS);
var teacherRecord = teacherRecords.find(function(t){return t.eid===user.eid});
curUser.sections = (teacherRecord && teacherRecord.sections && teacherRecord.sections.length > 0) ? teacherRecord.sections : null;
setTimeout(function() {
  try { populateSectionDropdowns(); } catch(e) { console.error('populateSectionDropdowns error:', e); }
  try { updateReleaseToggle(); } catch(e) { console.error('updateReleaseToggle error:', e); }
  try { loadMyClasses(); } catch(e) { console.error('loadMyClasses error:', e); }
  try { loadTeacherQuizzes(); } catch(e) { console.error('loadTeacherQuizzes error:', e); }
  try { updateTeacherStats(); } catch(e) { console.error('updateTeacherStats error:', e); }
  try { populateAnnounceClass(); loadAnnouncements(); } catch(e) { console.error('announcements error:', e); }
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
// Try to get child's actual name from Students Directory
var studs = loadData('students', []);
var childRec = studs.find(function(s){ return s.lrn===newAcc.childLrn; });
if(childRec) newAcc.childName = childRec.name;
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
    gender: newAcc.gender || '',
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

function sdTab(el,id){el.parentElement.querySelectorAll('button').forEach(function(b){b.className=''});el.className='act';['sdGrades','sdSched','sdTasks','sdAtt','sdAnn'].forEach(function(x){var e=document.getElementById(x);if(e)e.style.display=x===id?'block':'none'})}
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

// Returns the currently selected term from the Grade Input dropdown
function getSelectedTerm() {
  var el = document.getElementById('gradeTerm');
  return el ? el.value : 'Term_1';
}

// Builds the Firestore document key for a given section and term
// e.g. "GRADE 12 ABM APOLLO" + "Term_1" → "grades_GRADE_12_ABM_APOLLO_Term_1"
function getGradeKey(cls, term) {
  return 'grades_' + cls.replace(/\s/g, '_') + '_' + (term || getSelectedTerm());
}

// Builds the release status key for a section+term combo
// e.g. "GRADE 12 ABM APOLLO_Term_1"
function getReleaseKey(cls, term) {
  return cls.replace(/\s/g, '_') + '_' + (term || getSelectedTerm());
}

// ============================================
// GRADE LOCK: kapag na-submit ng adviser, admin lang ang makakapag-unlock
// ============================================
function getGradeLock(cls, term) {
  if (!cls) return null;
  var locks = loadData('gradeLock', {}) || {};
  var l = locks[getReleaseKey(cls, term)];
  return (l && l.locked) ? l : null;
}

// Ibinabalik ang true (at nagpapakita ng mensahe) kapag naka-lock
function blockIfGradesLocked(cls, term) {
  var t = term || getSelectedTerm();
  if (!getGradeLock(cls, t)) return false;
  toast('Naka-lock na ang grades ng ' + cls + ' (' + t.replace('_',' ') + '). Makipag-ugnayan sa admin para ma-unlock.', 'er');
  return true;
}

function updateGradeLockPanel() {
  var cls = document.getElementById('gradeClass') ? document.getElementById('gradeClass').value : '';
  var term = getSelectedTerm();
  var label = document.getElementById('gradeLockLabel');
  var text = document.getElementById('gradeLockText');
  var btn = document.getElementById('gradeLockBtn');
  var panel = document.getElementById('gradeLockPanel');
  var up = document.getElementById('csvUploadLabel');
  var clr = document.getElementById('clearGradesBtn');
  if (!panel || !cls) return;
  var l = getGradeLock(cls, term);
  if (label) label.textContent = 'Grade Submission — ' + cls + ' (' + term.replace('_',' ') + ')';
  if (l) {
    var when = l.at ? new Date(l.at).toLocaleString('en-PH', {dateStyle:'medium', timeStyle:'short'}) : '';
    if (text) text.innerHTML = '&#128274; <strong>Naka-lock</strong>' + (l.by ? ' &middot; isinumite ni ' + String(l.by).replace(/[<>&]/g,'') : '') + (when ? ' &middot; ' + when : '') + '. Kung may mali, i-click ang <strong>Request</strong> sa tabi ng learner.';
    panel.style.background = '#FEF3C7'; panel.style.borderColor = '#F59E0B';
    if (btn) btn.style.display = 'none';
    if (up) { up.style.opacity = '0.45'; up.style.pointerEvents = 'none'; }
    if (clr) { clr.style.opacity = '0.45'; clr.style.pointerEvents = 'none'; }
  } else {
    if (text) text.textContent = 'Puwede pang i-edit. Kapag tapos na, i-click ang "I-submit at I-lock" — hindi na ito mababago pagkatapos.';
    panel.style.background = 'var(--g1)'; panel.style.borderColor = 'var(--g2)';
    if (btn) btn.style.display = '';
    if (up) { up.style.opacity = ''; up.style.pointerEvents = ''; }
    if (clr) { clr.style.opacity = ''; clr.style.pointerEvents = ''; }
  }
}

// ============================================
// GRADE CORRECTION REQUESTS (kapag naka-lock na)
// Bawat request ay hiwalay na document: gradeReq_<id>
// ============================================
function reqEsc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function getGradeRequests(sheetKey) {
  var out = [];
  Object.keys(_cache).forEach(function(k) {
    if (k.indexOf('gradeReq_') !== 0) return;
    var r = _cache[k];
    if (r && (!sheetKey || r.sheetKey === sheetKey)) out.push(r);
  });
  out.sort(function(a, b) { return String(b.at).localeCompare(String(a.at)); });
  return out;
}

function openGradeRequestModal(lrn) {
  var cls = document.getElementById('gradeClass').value;
  var term = getSelectedTerm();
  var data = loadData(getGradeKey(cls, term), {});
  var record = data[lrn] || {};
  var g = record.grades || {};
  var students = loadData('students', DEFAULT_STUDENTS);
  var student = students.find(function(x){ return x.lrn === lrn; });
  var name = record.name || (student ? student.name : lrn);

  var settings = loadData('settings', DEFAULT_SETTINGS);
  var secs = (settings.sections && settings.sections.length > 0) ? settings.sections : DEFAULT_SECTIONS;
  var allSubjects = getSubjectsForSection(cls, secs).slice();
  if (allSubjects.indexOf('Music & Arts') > -1) allSubjects.push('MAPEH');

  var modal = document.getElementById('gradeEditModal');
  modal.dataset.lrn = lrn;
  window._reqGrades = g;
  var opts = allSubjects.map(function(x) {
    return '<option value="' + reqEsc(x) + '">' + reqEsc(x) + (g[x] !== undefined ? ' (' + g[x] + ')' : ' (wala)') + '</option>';
  }).join('');
  var inp = 'width:100%;padding:8px 10px;border:1.5px solid #E0E4EF;border-radius:7px;font-size:14px;background:#F8F9FC;box-sizing:border-box';
  document.getElementById('gradeEditModalContent').innerHTML =
    '<div style="margin-bottom:14px"><div style="font-size:15px;font-weight:700;color:#1B2A4A">&#9998; Request ng Pagtatama</div>' +
    '<div style="font-size:13px;color:#555;margin-top:2px">' + reqEsc(name.toUpperCase()) + '</div>' +
    '<div style="font-size:12px;color:#888">' + reqEsc(cls) + ' &mdash; ' + term.replace('_',' ') + ' &middot; Naka-lock</div></div>' +
    '<div style="margin-bottom:12px"><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:4px">Subject</label>' +
    '<select id="reqSubject" onchange="updateReqCurrent()" style="' + inp + '">' + opts + '</select></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">' +
    '<div><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:4px">Kasalukuyang grade</label><input id="reqOld" disabled style="' + inp + ';color:#888"></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:4px">Tamang grade</label><input id="reqNew" type="number" min="60" max="100" step="0.1" placeholder="60–100" style="' + inp + '"></div></div>' +
    '<div style="margin-bottom:14px"><label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:4px">Dahilan</label>' +
    '<textarea id="reqReason" rows="3" placeholder="Hal.: Mali ang na-encode, 88 ang nasa class record." style="' + inp + ';resize:vertical;font-family:inherit"></textarea></div>' +
    '<div style="display:flex;gap:10px">' +
    '<button onclick="submitGradeRequest()" style="flex:1;padding:11px;background:#E85D1A;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">&#128228; Ipadala sa Admin</button>' +
    '<button onclick="closeGradeEditModal()" style="flex:1;padding:11px;background:#F0F2F8;color:#1B2A4A;border:1px solid #D0D4E8;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">Cancel</button></div>';
  modal.style.display = 'flex';
  updateReqCurrent();
}

function updateReqCurrent() {
  var subj = document.getElementById('reqSubject').value;
  var v = (window._reqGrades || {})[subj];
  document.getElementById('reqOld').value = (v !== undefined ? v : 'wala');
}

function submitGradeRequest() {
  var cls = document.getElementById('gradeClass').value;
  var term = getSelectedTerm();
  var lrn = document.getElementById('gradeEditModal').dataset.lrn;
  var subj = document.getElementById('reqSubject').value;
  var nv = parseFloat(document.getElementById('reqNew').value);
  var reason = document.getElementById('reqReason').value.trim();
  var oldV = (window._reqGrades || {})[subj];
  if (isNaN(nv) || nv < 60 || nv > 100) { toast('Ang tamang grade ay dapat 60–100.', 'er'); return; }
  nv = Math.round(nv * 10) / 10;
  if (oldV !== undefined && Number(oldV) === nv) { toast('Pareho lang sa kasalukuyang grade.', 'er'); return; }
  if (reason.length < 5) { toast('Ilagay ang dahilan ng pagtatama.', 'er'); return; }
  var sheetKey = getReleaseKey(cls, term);
  var dup = getGradeRequests(sheetKey).filter(function(r) { return r.status === 'pending' && r.lrn === lrn && r.subject === subj; });
  if (dup.length) { toast('May pending request na para sa subject na ito.', 'er'); return; }
  var data = loadData(getGradeKey(cls, term), {});
  var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  saveData('gradeReq_' + id, {
    id: id, sheetKey: sheetKey, section: cls, term: term,
    lrn: lrn, name: (data[lrn] && data[lrn].name) || lrn,
    subject: subj, oldGrade: (oldV !== undefined ? oldV : null), newGrade: nv,
    reason: reason, by: curUser ? (curUser.fname + ' ' + curUser.lname) : '',
    at: new Date().toISOString(), status: 'pending'
  });
  closeGradeEditModal();
  renderGradeRequestList();
  toast('Naipadala ang request sa admin.', 'su');
}

function renderGradeRequestList() {
  var el = document.getElementById('gradeReqList');
  if (!el) return;
  var cls = document.getElementById('gradeClass') ? document.getElementById('gradeClass').value : '';
  if (!cls) { el.innerHTML = ''; return; }
  var list = getGradeRequests(getReleaseKey(cls, getSelectedTerm()));
  if (!list.length) { el.innerHTML = ''; return; }
  var badge = {pending: ['#FEF3C7', '#92400E', 'Pending'], approved: ['#DCFCE7', '#166534', 'Approved'], rejected: ['#FEE2E2', '#991B1B', 'Rejected']};
  var h = '<div style="background:#fff;border:1px solid var(--g2);border-radius:10px;padding:10px 14px"><div style="font-size:13px;font-weight:700;margin-bottom:6px">Mga request ng pagtatama</div>';
  list.slice(0, 15).forEach(function(r) {
    var b = badge[r.status] || badge.pending;
    h += '<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-top:1px solid var(--g1);font-size:12px">' +
      '<div><strong>' + reqEsc(r.name) + '</strong> &middot; ' + reqEsc(r.subject) + ': ' + (r.oldGrade !== null ? r.oldGrade : 'wala') + ' &rarr; <strong>' + r.newGrade + '</strong>' +
      (r.status === 'rejected' && r.adminNote ? '<div style="color:#991B1B">Admin: ' + reqEsc(r.adminNote) + '</div>' : '') + '</div>' +
      '<span style="background:' + b[0] + ';color:' + b[1] + ';padding:2px 8px;border-radius:10px;font-weight:700;white-space:nowrap;height:fit-content">' + b[2] + '</span></div>';
  });
  el.innerHTML = h + '</div>';
}

function submitAndLockGrades() {
  var cls = document.getElementById('gradeClass') ? document.getElementById('gradeClass').value : '';
  var term = getSelectedTerm();
  if (!cls) { toast('Please select a section first.', 'er'); return; }
  if (getGradeLock(cls, term)) { updateGradeLockPanel(); return; }
  var data = loadData(getGradeKey(cls, term), {});
  var n = Object.keys(data).length;
  if (n === 0) { toast('Wala pang grades na naka-save para sa ' + term.replace('_',' ') + '.', 'er'); return; }
  if (!confirm('I-submit at i-lock ang grades ng ' + cls + ' (' + term.replace('_',' ') + ')?\n\n' + n + ' learner(s) ang may grades.\n\nPagkatapos nito, HINDI MO NA ITO MABABAGO. Admin lang ang makakapag-unlock kung may kailangang itama.')) return;
  var locks = loadData('gradeLock', {}) || {};
  locks[getReleaseKey(cls, term)] = {
    locked: true,
    by: curUser ? (curUser.fname + ' ' + curUser.lname) : '',
    at: new Date().toISOString(),
    count: n
  };
  saveData('gradeLock', locks);
  updateGradeLockPanel();
  updateGradeView();
  toast('Grades submitted at naka-lock na.', 'su');
}

// ============================================
// GRADE RELEASE TOGGLE
// ============================================

function updateReleaseToggle() {
  var cls = document.getElementById('gradeClass') ? document.getElementById('gradeClass').value : '';
  var term = getSelectedTerm();
  var panel = document.getElementById('gradeReleasePanel');
  var label = document.getElementById('releasePanelLabel');
  var statusText = document.getElementById('releaseStatusText');
  var toggleWrap = document.getElementById('releaseToggleWrap');
  var knob = document.getElementById('releaseToggleKnob');
  if (!panel || !cls) return;

  var releaseData = loadData('gradeRelease', {});
  var key = getReleaseKey(cls, term);
  var isReleased = releaseData[key] === true;

  if (label) label.textContent = 'Grade Visibility — ' + cls + ' (' + term.replace('_',' ') + ')';
  if (statusText) statusText.textContent = isReleased
    ? '✅ Visible to students and parents'
    : '🔒 Hidden from students and parents';

  if (toggleWrap) toggleWrap.style.background = isReleased ? 'var(--su)' : 'var(--g3)';
  if (knob) knob.style.left = isReleased ? '25px' : '3px';
  updateGradeLockPanel();
  renderGradeRequestList();
}

function toggleGradeRelease() {
  var cls = document.getElementById('gradeClass') ? document.getElementById('gradeClass').value : '';
  var term = getSelectedTerm();
  if (!cls) { toast('Please select a section first.', 'er'); return; }

  var releaseData = loadData('gradeRelease', {});
  var key = getReleaseKey(cls, term);
  var current = releaseData[key] === true;
  var newVal = !current;

  var msg = newVal
    ? 'Make grades for "' + cls + ' ' + term.replace('_',' ') + '" VISIBLE to students and parents?'
    : 'HIDE grades for "' + cls + ' ' + term.replace('_',' ') + '" from students and parents?';
  if (!confirm(msg)) return;

  releaseData[key] = newVal;
  saveData('gradeRelease', releaseData);
  updateReleaseToggle();
  toast(newVal
    ? '✅ Grades are now visible to students and parents.'
    : '🔒 Grades are now hidden from students and parents.', 'su');
}

function downloadTemplate() {
  var cls = document.getElementById('gradeClass').value;
  var settings = loadData('settings', DEFAULT_SETTINGS);
  var secs = (settings.sections && settings.sections.length > 0) ? settings.sections : DEFAULT_SECTIONS;
  var subjects = getSubjectsForSection(cls, secs);

  var students = loadData('students', DEFAULT_STUDENTS);
  var classStudents = students.filter(function(s){ return s.grade === cls && s.status === 'Active'; });

  var males = sortByLastName(classStudents.filter(function(s){ return s.gender === 'Male'; }));
  var females = sortByLastName(classStudents.filter(function(s){ return s.gender === 'Female'; }));
  var others = sortByLastName(classStudents.filter(function(s){ return !s.gender || (s.gender !== 'Male' && s.gender !== 'Female'); }));

  var csv = 'LRN,"Name (Last Name, First Name)",' + subjects.join(',') + '\n';

  if (males.length > 0) {
    csv += '"--- MALE ---","",'; subjects.forEach(function(){ csv += ','; }); csv = csv.slice(0,-1) + '\n';
    males.forEach(function(s){
      csv += '"=""' + s.lrn + '"""' + ',"' + toLastFirst(s.name) + '"';
      subjects.forEach(function(){ csv += ','; });
      csv += '\n';
    });
  }
  if (females.length > 0) {
    csv += '"--- FEMALE ---","",'; subjects.forEach(function(){ csv += ','; }); csv = csv.slice(0,-1) + '\n';
    females.forEach(function(s){
      csv += '"=""' + s.lrn + '"""' + ',"' + toLastFirst(s.name) + '"';
      subjects.forEach(function(){ csv += ','; });
      csv += '\n';
    });
  }
  if (others.length > 0) {
    csv += '"--- OTHER/UNSET ---","",'; subjects.forEach(function(){ csv += ','; }); csv = csv.slice(0,-1) + '\n';
    others.forEach(function(s){
      csv += '"=""' + s.lrn + '"""' + ',"' + toLastFirst(s.name) + '"';
      subjects.forEach(function(){ csv += ','; });
      csv += '\n';
    });
  }

  var blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'grades_' + cls.replace(/\s/g,'_') + '_' + getSelectedTerm() + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  showUploadStatus('Template downloaded! Fill in grades in Excel, save as CSV, then upload.', 'success');
}
function handleCSVUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  var _gc = document.getElementById('gradeClass') ? document.getElementById('gradeClass').value : '';
  if (_gc && blockIfGradesLocked(_gc)) { event.target.value = ''; return; }
  
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
      
      var lrn = row[0].trim().replace(/^="?|"?=?"$/g, '').replace(/^"+|"+$/g, '').trim();
      if (/\d+\.?\d*[Ee][+\-]\d+/.test(lrn)) { lrn = Math.round(parseFloat(lrn)).toString(); }
      if (lrn.indexOf('---') === 0) continue; // skip gender separator rows
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
  if (blockIfGradesLocked(cls)) return;
  var key = getGradeKey(cls);
  
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
  var term = getSelectedTerm();
  var key = getGradeKey(cls, term);
  var data = loadData(key, {});
  var lrns = Object.keys(data);

  var el = document.getElementById('savedGrades');
  if (!el) return;

  var settings = loadData('settings', DEFAULT_SETTINGS);
  var secs = (settings.sections && settings.sections.length > 0) ? settings.sections : DEFAULT_SECTIONS;
  var baseSubjects = getSubjectsForSection(cls, secs);
  var allSubjects = baseSubjects.slice();
  if (baseSubjects.indexOf('Music & Arts') > -1) allSubjects.push('MAPEH');

  // Also show students in section who have no grades yet
  var students = loadData('students', DEFAULT_STUDENTS);
  var sectionStudents = students.filter(function(s){ return s.grade === cls && s.status === 'Active'; });

  // Merge: students with grades + students without grades
  var allLrns = {};
  sectionStudents.forEach(function(s){ allLrns[s.lrn] = { name: s.name, grades: {} }; });
  lrns.forEach(function(lrn){ allLrns[lrn] = data[lrn]; });

  var mergedLrns = Object.keys(allLrns);
  if (mergedLrns.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--g5);font-size:14px">No grades uploaded yet. Download template, fill in grades, then upload.</div>';
    return;
  }

  var html = '<h4 style="font-size:15px;margin-bottom:12px">&#128202; Grades &mdash; ' + cls + ' &nbsp;<span style="font-size:13px;color:var(--o);font-weight:600">[' + term.replace('_',' ') + ']</span></h4>';

  // Load per-student release status
  var studentRelease = loadData('gradeStudentRelease', {});
  var releasePrefix = cls.replace(/\s/g,'_') + '_' + term + '_';

  var thBase = 'position:sticky;top:0;background:#1B2A4A;color:#fff;padding:8px 10px;font-size:12px;white-space:nowrap;z-index:2';
  html += '<div style="overflow-x:auto;max-height:520px;overflow-y:auto"><table style="border-collapse:collapse;min-width:100%"><thead><tr>' +
    '<th style="' + thBase + ';left:0;z-index:3;min-width:110px">LRN</th>' +
    '<th style="' + thBase + ';left:110px;z-index:3;min-width:160px">Name</th>';
  allSubjects.forEach(function(s) {
    var label = s === 'Mathematics' ? 'Math' : s === 'Music & Arts' ? 'M&A' : s === 'PE & Health' ? 'PE' : s.length > 8 ? s.substring(0,8)+'.' : s;
    html += '<th style="' + thBase + ';min-width:70px">' + label + '</th>';
  });
  html += '<th style="' + thBase + '">Avg</th><th style="' + thBase + '">Remarks</th><th style="' + thBase + '">Visible</th><th style="' + thBase + '">Action</th></tr></thead><tbody>';

  var sortedLrns = sortByLastName(mergedLrns, function(lrn){ return allLrns[lrn].name; });

  sortedLrns.forEach(function(lrn) {
    var r = allLrns[lrn];
    var g = r.grades || {};
    var hasAnyGrade = Object.keys(g).length > 0;
    var isVisible = studentRelease[releasePrefix + lrn] !== false; // visible by default
    var rowStyle = isVisible ? '' : 'background:#fff8f0';
    var tdSticky = 'position:sticky;background:' + (isVisible ? '#fff' : '#fff8f0') + ';z-index:1;border-bottom:1px solid #f0f0f0';
    html += '<tr style="' + rowStyle + '">' +
      '<td style="' + tdSticky + ';left:0;font-family:monospace;font-size:11px;padding:7px 10px;min-width:110px">' + lrn + '</td>' +
      '<td style="' + tdSticky + ';left:110px;font-size:12px;padding:7px 10px;min-width:160px;border-right:2px solid #e0e0e0">' + (r.name || lrn).toUpperCase() + '</td>';
    var total = 0, count = 0;
    allSubjects.forEach(function(s) {
      var v = g[s];
      if (v !== undefined) { total += v; count++; }
      html += '<td style="text-align:center;font-size:12px">' + (v !== undefined ? v : '<span style="color:var(--g5)">—</span>') + '</td>';
    });
    var avg = count > 0 ? Math.round((total / count) * 10) / 10 : null;
    var remarks = avg !== null ? (avg >= 75 ? 'Passed' : 'Failed') : '';
    var badge = avg !== null ? (avg >= 75 ? 'b-g' : 'b-r') : '';
    html += '<td style="text-align:center"><strong>' + (avg !== null ? avg : '<span style="color:var(--g5)">—</span>') + '</strong></td>';
    html += '<td>' + (remarks ? '<span class="badge ' + badge + '">' + remarks + '</span>' : '') + '</td>';
    // Per-student visibility toggle
    html += '<td style="text-align:center"><button data-vis-lrn="' + lrn + '" onclick="toggleStudentGradeVisibility(\'' + lrn + '\')" title="' + (isVisible ? 'Hide from student/parent' : 'Show to student/parent') + '" style="padding:3px 8px;border-radius:6px;border:1px solid ' + (isVisible ? '#a5d6b7' : '#ffcdd2') + ';background:' + (isVisible ? '#e8f5ec' : '#fdecea') + ';color:' + (isVisible ? 'var(--su)' : 'var(--da)') + ';font-size:13px;cursor:pointer">' + (isVisible ? '&#128065;' : '&#128274;') + '</button></td>';
    if (getGradeLock(document.getElementById('gradeClass').value, getSelectedTerm())) html += '<td><button onclick="openGradeRequestModal(\'' + lrn + '\')" style="padding:4px 10px;border-radius:6px;border:1px solid #F59E0B;background:#FEF3C7;color:#92400E;font-size:12px;font-weight:600;cursor:pointer">&#9998; Request</button></td>'; else
    html += '<td><button onclick="openGradeEditModal(\'' + lrn + '\')" style="padding:4px 10px;border-radius:6px;border:1px solid ' + (hasAnyGrade ? 'var(--g3)' : 'var(--o)') + ';background:' + (hasAnyGrade ? 'var(--g1)' : '#fff3ee') + ';color:' + (hasAnyGrade ? 'var(--g7)' : 'var(--o)') + ';font-size:12px;font-weight:600;cursor:pointer">' + (hasAnyGrade ? '&#9998; Edit' : '+ Add') + '</button></td>';
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  el.innerHTML = html;
}

function toggleStudentGradeVisibility(lrn) {
  var cls = document.getElementById('gradeClass').value;
  var term = getSelectedTerm();
  if (!cls) { toast('Please select a section first.', 'er'); return; }

  var studentRelease = loadData('gradeStudentRelease', {});
  var key = cls.replace(/\s/g,'_') + '_' + term + '_' + lrn;
  var current = studentRelease[key] !== false;

  if (current) {
    studentRelease[key] = false;
  } else {
    delete studentRelease[key];
  }
  saveData('gradeStudentRelease', studentRelease);

  var newVisible = studentRelease[key] !== false;

  // Update only the toggle button and row color — no full re-render
  var btn = document.querySelector('button[data-vis-lrn="' + lrn + '"]');
  if (btn) {
    btn.innerHTML = newVisible ? '&#128065;' : '&#128274;';
    btn.style.borderColor = newVisible ? '#a5d6b7' : '#ffcdd2';
    btn.style.background = newVisible ? '#e8f5ec' : '#fdecea';
    btn.style.color = newVisible ? 'var(--su)' : 'var(--da)';
    btn.title = newVisible ? 'Hide from student/parent' : 'Show to student/parent';
    // Update row background
    var row = btn.closest('tr');
    if (row) row.style.background = newVisible ? '' : '#fff8f0';
    // Update sticky cells background
    var stickyCells = row ? row.querySelectorAll('td[style*="sticky"]') : [];
    stickyCells.forEach(function(td) {
      td.style.background = newVisible ? '#fff' : '#fff8f0';
    });
  }

  toast(!current ? '🔒 Grade hidden from student/parent.' : '👁️ Grade now visible to student/parent.', 'su');
}

function closeGradeEditModal() {
  document.getElementById('gradeEditModal').style.display = 'none';
}

function openGradeEditModal(lrn) {
  var cls = document.getElementById('gradeClass').value;
  var term = getSelectedTerm();
  if (blockIfGradesLocked(cls, term)) return;
  var key = getGradeKey(cls, term);
  var data = loadData(key, {});
  var record = data[lrn] || {};
  var g = record.grades || {};

  var students = loadData('students', DEFAULT_STUDENTS);
  var student = students.find(function(s){ return s.lrn === lrn; });
  var name = record.name || (student ? student.name : lrn);

  var settings = loadData('settings', DEFAULT_SETTINGS);
  var secs = (settings.sections && settings.sections.length > 0) ? settings.sections : DEFAULT_SECTIONS;
  var baseSubjects = getSubjectsForSection(cls, secs);
  var allSubjects = baseSubjects.slice();
  if (baseSubjects.indexOf('Music & Arts') > -1) allSubjects.push('MAPEH');

  // Store lrn and subjects on modal for saveGradeEdit to pick up
  var modal = document.getElementById('gradeEditModal');
  modal.dataset.lrn = lrn;
  modal.dataset.subjects = JSON.stringify(allSubjects);

  var fieldsHtml = allSubjects.map(function(s) {
    var val = g[s] !== undefined ? g[s] : '';
    var safeId = 'gedit_' + s.replace(/[^a-zA-Z0-9]/g, '_');
    return '<div style="margin-bottom:12px">' +
      '<label style="display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:4px">' + s + '</label>' +
      '<input type="number" id="' + safeId + '" value="' + val + '" min="60" max="100" placeholder="60–100" ' +
      'style="width:100%;padding:8px 10px;border:1.5px solid #E0E4EF;border-radius:7px;font-size:14px;background:#F8F9FC">' +
      '</div>';
  }).join('');

  var content = '<div style="margin-bottom:16px">' +
    '<div style="font-size:15px;font-weight:700;color:#1B2A4A;margin-bottom:2px">&#9998; ' + name.toUpperCase() + '</div>' +
    '<div style="font-size:12px;color:#888">' + cls + ' &mdash; ' + term.replace('_',' ') + '</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">' + fieldsHtml + '</div>' +
    '<div style="margin-top:6px;font-size:12px;color:#888;margin-bottom:16px">Leave blank to clear a grade. Grades must be 60–100.</div>' +
    '<div style="display:flex;gap:10px">' +
    '<button onclick="saveGradeEdit()" style="flex:1;padding:11px;background:#E85D1A;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">&#128190; Save Grades</button>' +
    '<button onclick="closeGradeEditModal()" style="flex:1;padding:11px;background:#F0F2F8;color:#1B2A4A;border:1px solid #D0D4E8;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">Cancel</button>' +
    '</div>';

  document.getElementById('gradeEditModalContent').innerHTML = content;
  modal.style.display = 'flex';
}

function saveGradeEdit() {
  var modal = document.getElementById('gradeEditModal');
  var lrn = modal.dataset.lrn;
  var allSubjects = JSON.parse(modal.dataset.subjects || '[]');

  var cls = document.getElementById('gradeClass').value;
  var term = getSelectedTerm();
  if (blockIfGradesLocked(cls, term)) return;
  var key = getGradeKey(cls, term);
  var data = loadData(key, {});

  var students = loadData('students', DEFAULT_STUDENTS);
  var student = students.find(function(s){ return s.lrn === lrn; });
  var name = (data[lrn] && data[lrn].name) || (student ? student.name : lrn);

  var errors = [];

  allSubjects.forEach(function(s) {
    var safeId = 'gedit_' + s.replace(/[^a-zA-Z0-9]/g, '_');
    var input = document.getElementById(safeId);
    if (!input) return;
    var val = input.value.trim();
    if (val === '') return;
    var num = parseFloat(val);
    if (isNaN(num) || num < 60 || num > 100) {
      errors.push(s + ': must be 60–100');
    }
  });

  if (errors.length > 0) {
    toast('Invalid grades: ' + errors.join(', '), 'er');
    return;
  }

  if (!data[lrn]) data[lrn] = {};
  data[lrn].name = name;
  data[lrn].lrn = lrn;
  if (!data[lrn].grades) data[lrn].grades = {};

  allSubjects.forEach(function(s) {
    var safeId = 'gedit_' + s.replace(/[^a-zA-Z0-9]/g, '_');
    var input = document.getElementById(safeId);
    if (!input) return;
    var val = input.value.trim();
    if (val === '') {
      delete data[lrn].grades[s];
    } else {
      data[lrn].grades[s] = Math.round(parseFloat(val) * 10) / 10;
    }
  });

  saveData(key, data);
  closeGradeEditModal();
  updateGradeView();
  toast('Grades saved for ' + name.split(' ')[0] + '!', 'su');
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
  var grade = curUser.grade; // student's section
  if (!lrn) return;

  var el = document.getElementById('sdGrades');
  if (!el) return;

  var releaseData = loadData('gradeRelease', {});
  var studentRelease = loadData('gradeStudentRelease', {});
  var terms = ['Term_1', 'Term_2', 'Term_3'];
  var releasedTerms = terms.filter(function(t) {
    var key = (grade || '').replace(/\s/g, '_') + '_' + t;
    return releaseData[key] === true;
  });

  if (releasedTerms.length === 0) {
    el.innerHTML = '<h3>&#128202; My Grades</h3><div style="padding:24px;text-align:center;color:var(--g5);font-size:14px">&#128274; Grades have not been released yet by your adviser. Please check back later.</div>';
    return;
  }

  var html = '<h3>&#128202; My Grades</h3>';

  releasedTerms.forEach(function(term) {
    var key = 'grades_' + (grade || '').replace(/\s/g, '_') + '_' + term;
    var data = loadData(key, {});
    var record = data[lrn];
    if (!record || !record.grades) return;

    // Check per-student visibility
    var studentReleaseKey = (grade || '').replace(/\s/g,'_') + '_' + term + '_' + lrn;
    if (studentRelease[studentReleaseKey] === false) return; // hidden only if explicitly set to false

    var g = record.grades;
    var allSubjects = Object.keys(g);
    var total = 0, count = 0;

    html += '<div style="margin-bottom:20px"><div style="font-size:15px;font-weight:700;color:var(--n);margin-bottom:10px;padding:8px 12px;background:var(--g1);border-radius:8px;border-left:4px solid var(--o)">' + term.replace('_', ' ') + '</div>';
    html += '<div style="overflow-x:auto"><table><thead><tr><th>Subject</th><th>Grade</th><th>Remarks</th></tr></thead><tbody>';

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
    html += '<td style="text-align:center"><strong style="font-size:16px;color:' + (avg >= 75 ? '#22c55e' : '#ef4444') + '">' + avg + '</strong></td>';
    html += '<td><span class="badge ' + (avg >= 75 ? 'b-g' : 'b-r') + '">' + (avg >= 75 ? 'Passed' : 'Failed') + '</span></td></tr>';
    html += '</tbody></table></div></div>';
  });

  el.innerHTML = html || '<div style="padding:24px;text-align:center;color:var(--g5);font-size:14px">&#128274; No released grades found.</div>';

  // Update student stats
  updateStudentStats(lrn, grade, releasedTerms, studentRelease);
}

function updateStudentStats(lrn, grade, releasedTerms, studentRelease) {
  var allAvgs = [];
  var allSubjectCount = 0;
  var visibleTerms = 0;

  releasedTerms.forEach(function(term) {
    var studentReleaseKey = (grade || '').replace(/\s/g,'_') + '_' + term + '_' + lrn;
    if (studentRelease[studentReleaseKey] === false) return;

    var key = 'grades_' + (grade || '').replace(/\s/g, '_') + '_' + term;
    var data = loadData(key, {});
    var record = data[lrn];
    if (!record || !record.grades) return;

    visibleTerms++;
    var g = record.grades;
    var subjects = Object.keys(g);
    allSubjectCount = Math.max(allSubjectCount, subjects.length);
    var total = 0, count = 0;
    subjects.forEach(function(s) {
      if (g[s] !== undefined) { total += g[s]; count++; }
    });
    if (count > 0) allAvgs.push(Math.round((total / count) * 10) / 10);
  });

  // General Average: ipapakita lang kapag na-release na ang Term 3
  var hasTerm3 = false;
  releasedTerms.forEach(function(term) {
    if (term !== 'Term_3') return;
    var k = (grade || '').replace(/\s/g,'_') + '_' + term + '_' + lrn;
    if (studentRelease[k] === false) return;
    var d = loadData('grades_' + (grade || '').replace(/\s/g, '_') + '_' + term, {});
    if (d[lrn] && d[lrn].grades) hasTerm3 = true;
  });
  if (!hasTerm3) allAvgs = [];
  var overallAvg = allAvgs.length > 0 ? Math.round(allAvgs.reduce(function(a,b){return a+b;},0) / allAvgs.length * 10) / 10 : '--';

  // Get attendance
  var attKey = 'attendance_' + (grade || '').replace(/\s/g,'_');
  var attData = loadData(attKey, {});
  var att = attData[lrn];
  var attRate = '--';
  if (att && att.present !== undefined && att.totalDays) {
    attRate = Math.round((att.present / att.totalDays) * 100) + '%';
  } else if (att && att.rate) {
    attRate = att.rate;
  }

  // Update Student Dashboard stats
  var e1 = document.getElementById('sdStatAvg');
  var e2 = document.getElementById('sdStatAtt');
  var e3 = document.getElementById('sdStatSubjects');
  var e4 = document.getElementById('sdStatTerms');
  if (e1) e1.textContent = overallAvg;
  if (e2) e2.textContent = attRate;
  if (e3) e3.textContent = allSubjectCount;
  if (e4) e4.textContent = visibleTerms;

  // Update Parent Dashboard stats too
  var p1 = document.getElementById('pdStatAvg');
  var p2 = document.getElementById('pdStatAtt');
  var p3 = document.getElementById('pdStatSubjects');
  var p4 = document.getElementById('pdStatTerms');
  if (p1) p1.textContent = overallAvg;
  if (p2) p2.textContent = attRate;
  if (p3) p3.textContent = allSubjectCount;
  if (p4) p4.textContent = visibleTerms;
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
    males.forEach(function(s){ csv += '"=""' + s.lrn + '"""' + ',"' + toLastFirst(s.name) + '",,,,\n'; });
  }
  if (females.length > 0) {
    csv += '"--- FEMALE ---","",,,, \n';
    females.forEach(function(s){ csv += '"=""' + s.lrn + '"""' + ',"' + toLastFirst(s.name) + '",,,,\n'; });
  }
  if (others.length > 0) {
    if (males.length > 0 || females.length > 0) csv += '"--- OTHER/UNSET ---","",,,, \n';
    others.forEach(function(s){ csv += '"=""' + s.lrn + '"""' + ',"' + toLastFirst(s.name) + '",,,,\n'; });
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
      
      var lrn = row[0].trim().replace(/^="?|"?=?"$/g, '').replace(/^"+|"+$/g, '').trim();
      if (/\d+\.?\d*[Ee][+\-]\d+/.test(lrn)) { lrn = Math.round(parseFloat(lrn)).toString(); }
      if (lrn.indexOf('---') === 0) continue; // skip gender separator rows
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

  var el = document.getElementById('pdGradesContent');
  if (!el) return;

  var childName = curUser.childName || 'Your Child';
  var releaseData = loadData('gradeRelease', {});
  var studentRelease = loadData('gradeStudentRelease', {});
  var terms = ['Term_1', 'Term_2', 'Term_3'];

  // Find which section the child belongs to
  var students = loadData('students', DEFAULT_STUDENTS);
  var childRecord = students.find(function(s){ return s.lrn === lrn; });
  var childGrade = childRecord ? childRecord.grade : '';

  var releasedTerms = terms.filter(function(t) {
    var key = (childGrade || '').replace(/\s/g, '_') + '_' + t;
    return releaseData[key] === true;
  });

  if (releasedTerms.length === 0) {
    el.innerHTML = '<h3>&#128202; Child\'s Grades &mdash; ' + childName + '</h3>' +
      '<div style="text-align:center;padding:32px;color:var(--g5)">' +
      '<div style="font-size:48px;margin-bottom:12px">&#128274;</div>' +
      '<p>Grades have not been released yet by the class adviser.</p>' +
      '<p style="font-size:13px;margin-top:8px">Please check back later.</p></div>';
    return;
  }

  var html = '<h3>&#128202; Child\'s Grades &mdash; ' + childName + '</h3>';
  var overallTotal = 0, overallCount = 0;

  releasedTerms.forEach(function(term) {
    var gradeKey = 'grades_' + (childGrade || '').replace(/\s/g, '_') + '_' + term;
    var data = loadData(gradeKey, {});
    var record = data[lrn];
    if (!record || !record.grades) return;
    // Check per-student visibility
    var studentReleaseKey = (childGrade || '').replace(/\s/g,'_') + '_' + term + '_' + lrn;
    if (studentRelease[studentReleaseKey] === false) return; // hidden only if explicitly set to false

    if (record.name) childName = record.name;
    var g = record.grades;
    var allSubjects = Object.keys(g);
    var total = 0, count = 0;

    html += '<div style="margin-bottom:20px"><div style="font-size:15px;font-weight:700;color:var(--n);margin-bottom:10px;padding:8px 12px;background:var(--g1);border-radius:8px;border-left:4px solid var(--o)">' + term.replace('_', ' ') + '</div>';
    html += '<div style="overflow-x:auto"><table><thead><tr><th>Subject</th><th>Grade</th><th>Remarks</th></tr></thead><tbody>';

    allSubjects.forEach(function(s) {
      var v = g[s];
      if (v === undefined) return;
      total += v; count++;
      overallTotal += v; overallCount++;
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
    html += '<td style="text-align:center"><strong style="font-size:16px;color:' + (avg >= 75 ? '#22c55e' : '#ef4444') + '">' + avg + '</strong></td>';
    html += '<td><span class="badge ' + (avg >= 75 ? 'b-g' : 'b-r') + '">' + (avg >= 75 ? 'Passed' : 'Failed') + '</span></td></tr>';
    html += '</tbody></table></div></div>';
  });

  el.innerHTML = html;

  // Update parent stat card with overall average
  var overallAvg = overallCount > 0 ? Math.round((overallTotal / overallCount) * 10) / 10 : '';
  var statEls = document.querySelectorAll('#parentDash .dash-stat b');
  if (statEls.length >= 1 && overallAvg) statEls[0].textContent = overallAvg;
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

// ============================================
// SCHEDULE CSV — dalawang format ang tinatanggap:
// (A) Grid:  Time,MON,TUE,WED,THU,FRI   (bawat row = oras, bawat column = araw)
//            cell = "Subject / Teacher / Room" (puwedeng Subject lang)
// (B) List:  Day,Time,Subject,Teacher,Room
// ============================================
var SCHED_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function normalizeSchedDay(v) {
  var x = String(v || '').trim().toLowerCase().replace(/\./g, '');
  if (!x) return '';
  var map = {
    monday:'Monday', mon:'Monday', m:'Monday', lunes:'Monday',
    tuesday:'Tuesday', tue:'Tuesday', tues:'Tuesday', t:'Tuesday', martes:'Tuesday',
    wednesday:'Wednesday', wed:'Wednesday', w:'Wednesday', miyerkules:'Wednesday', miyerkoles:'Wednesday',
    thursday:'Thursday', thu:'Thursday', thur:'Thursday', thurs:'Thursday', th:'Thursday', huwebes:'Thursday',
    friday:'Friday', fri:'Friday', f:'Friday', biyernes:'Friday', byernes:'Friday',
    saturday:'Saturday', sat:'Saturday', sabado:'Saturday'
  };
  return map[x] || '';
}

// Buong CSV parser: kaya ang quotes, comma sa loob ng quotes, at Enter sa loob ng cell
function parseCSVText(text) {
  text = String(text || '').replace(/^\uFEFF/, '');
  var rows = [], row = [], cur = '', q = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); rows.push(row); row = []; cur = '';
    } else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

function schedEsc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function downloadSchedTemplate() {
  var cls = document.getElementById('schedClass').value;
  var csv = 'Time,MON,TUE,WED,THU,FRI\n';
  for (var i = 0; i < 9; i++) csv += ',,,,,\n';
  var blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'schedule_' + cls.replace(/\s/g,'_') + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  showSchedStatus('Template downloaded! Ilagay ang oras sa unang column, at ang subject sa ilalim ng bawat araw. Puwedeng "Subject / Teacher / Room".', 'success');
}

function parseScheduleRows(rows) {
  rows = rows.filter(function(r) { return r.some(function(c) { return String(c).trim() !== ''; }); });
  if (rows.length < 2) return {error: 'CSV is empty.'};
  var header = rows[0];
  var dayCols = [];
  for (var c = 1; c < header.length; c++) {
    var d = normalizeSchedDay(header[c]);
    if (d) dayCols.push({col: c, day: d});
  }
  var records = [], skipped = 0;

  if (dayCols.length >= 2) {
    // (A) GRID format
    dayCols.forEach(function(dc) {
      for (var i = 1; i < rows.length; i++) {
        var r = rows[i];
        var time = String(r[0] || '').trim().replace(/\s+/g, ' ');
        var cell = String(r[dc.col] || '').trim();
        if (!cell) continue;
        // Laktawan ang natirang row na pangalan ng araw ang nasa Time column (galing sa lumang template)
        if (normalizeSchedDay(time) && time.length > 2) { skipped++; continue; }
        var parts = cell.split(/\s*(?:\/|\||\n)\s*/).filter(function(x) { return x !== ''; });
        records.push({day: dc.day, time: time, subject: parts[0] || '', teacher: parts[1] || '', room: parts.slice(2).join(' '), row: i});
      }
    });
    return {records: records, format: 'grid'};
  }

  // (B) LIST format
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var day = normalizeSchedDay(row[0]) || String(row[0] || '').trim();
    var time = String(row[1] || '').trim();
    var subject = String(row[2] || '').trim();
    if (!day || (!time && !subject)) continue;
    records.push({day: day, time: time, subject: subject, teacher: String(row[3] || '').trim(), room: String(row[4] || '').trim()});
  }
  return {records: records, format: 'list'};
}

function handleSchedUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var res = parseScheduleRows(parseCSVText(e.target.result));
    if (res.error) { showSchedStatus('Error: ' + res.error, 'error'); return; }
    var records = res.records;
    if (records.length === 0) {
      showSchedStatus('Error: Walang nakitang subject. Grid format: unang row = Time,MON,TUE,WED,THU,FRI; unang column = oras; ilagay ang subject sa ilalim ng bawat araw.', 'error');
      return;
    }
    var cls = document.getElementById('schedClass').value;
    var html = '<div style="margin-bottom:12px"><strong>' + records.length + ' entries</strong> parsed (' + (res.format === 'grid' ? 'grid format' : 'list format') + ')</div>';
    html += renderSchedGrid(records);
    html += '<div style="display:flex;gap:10px;margin-top:16px">';
    html += '<button class="btn btn-p btn-sm" onclick="saveSchedule()">&#128190; Save Schedule</button>';
    html += '<button class="btn btn-s btn-sm" onclick="cancelSched()">Cancel</button>';
    html += '</div>';
    document.getElementById('schedPreview').innerHTML = html;
    window._pendingSched = records;
    window._pendingSchedClass = cls;
    showSchedStatus('CSV parsed! I-check ang preview at i-click ang Save.', 'success');
  };
  reader.readAsText(file, 'UTF-8');
  event.target.value = '';
}

// Pagkakasunod ng oras ayon sa row sa CSV (o ayon sa oras kung lumang data)
function getSchedTimesInOrder(records) {
  var first = {};
  records.forEach(function(r, idx) {
    var o = (typeof r.row === 'number') ? r.row : schedTimeMinutes(r.time) + idx / 1000;
    if (!(r.time in first) || o < first[r.time]) first[r.time] = o;
  });
  return Object.keys(first).sort(function(a, b) { return first[a] - first[b]; });
}

function schedTimeMinutes(t) {
  var m = String(t || '').match(/(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 9999;
  var h = parseInt(m[1], 10), mi = parseInt(m[2] || '0', 10);
  if (/pm/i.test(t) && h < 12) h += 12;
  else if (!/am/i.test(t) && h >= 1 && h <= 5) h += 12; // 1:00-5:00 ay hapon
  return h * 60 + mi;
}

// Ipinapakita ang schedule bilang grid (oras x araw)
function renderSchedGrid(records) {
  var days = SCHED_DAYS.filter(function(d) { return records.some(function(r) { return r.day === d; }); });
  var times = getSchedTimesInOrder(records);
  var dayColors = {Monday:'#e8733a',Tuesday:'#0891b2',Wednesday:'#7c3aed',Thursday:'#059669',Friday:'#dc2626',Saturday:'#6b7280'};
  var h = '<div style="overflow-x:auto"><table style="min-width:560px"><thead><tr><th>Time</th>';
  days.forEach(function(d) { h += '<th style="color:' + dayColors[d] + '">' + d + '</th>'; });
  h += '</tr></thead><tbody>';
  times.forEach(function(t) {
    h += '<tr><td style="font-family:monospace;font-size:12px;white-space:nowrap">' + schedEsc(t) + '</td>';
    days.forEach(function(d) {
      var e = records.filter(function(r) { return r.day === d && r.time === t; });
      h += '<td>' + e.map(function(r) {
        return '<div style="font-weight:600">' + schedEsc(r.subject) + '</div>' +
          (r.teacher ? '<div style="font-size:12px;color:var(--g5)">' + schedEsc(r.teacher) + '</div>' : '') +
          (r.room ? '<div style="font-size:11px;color:var(--g5)">' + schedEsc(r.room) + '</div>' : '');
      }).join('') + '</td>';
    });
    h += '</tr>';
  });
  return h + '</tbody></table></div>';
}

function schedCsvCell(v) {
  v = String(v == null ? '' : v);
  return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

// I-download ang naka-save na schedule bilang grid CSV (puwedeng i-edit at i-upload ulit)
function downloadCurrentSchedule() {
  var cls = document.getElementById('schedClass').value;
  if (!cls) { toast('Pumili muna ng section.', 'er'); return; }
  var data = loadData('schedule_' + cls.replace(/\s/g, '_'), []);
  if (!data || !data.length) { toast('Wala pang naka-save na schedule para sa ' + cls + '.', 'er'); return; }
  var abbr = {Monday:'MON',Tuesday:'TUE',Wednesday:'WED',Thursday:'THU',Friday:'FRI',Saturday:'SAT'};
  var days = SCHED_DAYS.filter(function(d) { return d !== 'Saturday' || data.some(function(r) { return r.day === d; }); });
  var times = getSchedTimesInOrder(data);
  var csv = 'Time,' + days.map(function(d) { return abbr[d]; }).join(',') + '\n';
  times.forEach(function(t) {
    var row = [schedCsvCell(t)];
    days.forEach(function(d) {
      var e = data.filter(function(r) { return r.day === d && r.time === t; })[0];
      row.push(e ? schedCsvCell([e.subject, e.teacher, e.room].filter(function(x) { return x; }).join(' / ')) : '');
    });
    csv += row.join(',') + '\n';
  });
  var blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'schedule_' + cls.replace(/\s/g, '_') + '_current.csv';
  a.click();
  URL.revokeObjectURL(url);
  showSchedStatus('Na-download ang kasalukuyang schedule. I-edit ito, tapos i-upload ulit para palitan.', 'success');
}

function formatSchedUpdated(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('en-PH', {dateStyle: 'medium', timeStyle: 'short'}); } catch (e) { return ''; }
}

function saveSchedule() {
  if (!window._pendingSched || !window._pendingSchedClass) {
    toast('No schedule to save.', 'er');
    return;
  }
  
  var cls = window._pendingSchedClass;
  var records = window._pendingSched;
  var key = 'schedule_' + cls.replace(/\s/g, '_');
  var existing = loadData(key, []);
  if (existing && existing.length && !confirm('May naka-save nang schedule ang ' + cls + ' (' + existing.length + ' entries).\n\nPapalitan ito ng bagong schedule (' + records.length + ' entries)?')) return;
  
  saveData(key, records);
  var meta = loadData('scheduleMeta', {}) || {};
  meta[cls.replace(/\s/g, '_')] = {updatedAt: new Date().toISOString(), by: curUser ? (curUser.fname + ' ' + curUser.lname) : ''};
  saveData('scheduleMeta', meta);
  
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
  var m = (loadData('scheduleMeta', {}) || {})[cls.replace(/\s/g, '_')];
  el.innerHTML = '<h4 style="font-size:15px;margin-bottom:4px">&#128197; Saved Schedule &mdash; ' + schedEsc(cls) + '</h4>' +
    (m && m.updatedAt ? '<div style="font-size:12px;color:var(--g5);margin-bottom:12px">Huling na-update: ' + formatSchedUpdated(m.updatedAt) + (m.by ? ' ni ' + schedEsc(m.by) : '') + '</div>' : '<div style="margin-bottom:8px"></div>') +
    renderSchedGrid(data);
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
  
  var days = SCHED_DAYS;
  var dayColors = {Monday:'#e8733a',Tuesday:'#0891b2',Wednesday:'#7c3aed',Thursday:'#059669',Friday:'#dc2626',Saturday:'#6b7280'};
  
  var html = '<h3>&#128197; Class Schedule</h3>';
  var sm = (loadData('scheduleMeta', {}) || {})[grade.replace(/\s/g, '_')];
  if (sm && sm.updatedAt) {
    var isNew = (Date.now() - new Date(sm.updatedAt).getTime()) < 7 * 24 * 3600 * 1000;
    html += '<div style="font-size:12px;color:var(--g5);margin:-4px 0 14px">' +
      (isNew ? '<span style="background:#FEF3C7;color:#92400E;font-weight:700;padding:2px 8px;border-radius:10px;margin-right:6px">&#127381; Bagong update</span>' : '') +
      'Huling na-update: ' + formatSchedUpdated(sm.updatedAt) + '</div>';
  }
  
  days.forEach(function(day) {
    var entries = data.filter(function(r) { return r.day === day; });
    if (entries.length === 0) return;
    
    var color = dayColors[day] || '#666';
    html += '<div style="margin-bottom:16px">';
    html += '<h4 style="font-size:14px;color:' + color + ';margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid ' + color + '40">' + day + '</h4>';
    html += '<div style="display:flex;flex-direction:column;gap:6px">';
    
    entries.forEach(function(r) {
      html += '<div style="display:flex;gap:12px;padding:8px 12px;background:var(--g1);border-radius:8px;border-left:3px solid ' + color + ';align-items:center;flex-wrap:wrap">';
      html += '<span style="font-family:monospace;font-size:13px;color:var(--g5);min-width:90px">' + schedEsc(r.time) + '</span>';
      html += '<span style="font-weight:600;flex:1;min-width:120px">' + schedEsc(r.subject) + '</span>';
      html += '<span style="font-size:13px;color:var(--g5)">' + schedEsc(r.teacher) + '</span>';
      if (r.room) html += '<span style="font-size:12px;padding:2px 8px;background:' + color + '15;color:' + color + ';border-radius:12px">' + schedEsc(r.room) + '</span>';
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
  if (blockIfGradesLocked(cls)) return;
  if (!confirm('Clear ALL grades for "' + cls + '"?\n\nThis will permanently delete all uploaded grades for this section. You will need to re-upload the CSV to restore them.\n\nThis cannot be undone.')) return;
  var key = getGradeKey(cls);
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

function printGradeSummary(term) {
  var cls = document.getElementById('gradeClass').value;
  if (!cls) { toast('Please select a section first.', 'er'); return; }
  var selectedTerm = term || getSelectedTerm();
  var key = getGradeKey(cls, selectedTerm);
  var data = loadData(key, {});
  var lrns = Object.keys(data);
  if (lrns.length === 0) { toast('No grades for ' + selectedTerm.replace('_',' ') + ' yet.', 'er'); return; }

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
    getPrintHeader('CLASS GRADE SUMMARY — ' + selectedTerm.replace('_',' '), cls) +
    '<table><thead>' + thead + '</thead><tbody>' + tableRows + '</tbody></table>' +
    '<div class="sig-block">' +
    '<div class="sig-line"><hr>' + teacherName + '<br><small>Class Adviser</small></div>' +
    '<div class="sig-line"><hr>___________________<br><small>Principal</small></div>' +
    '</div></body></html>';

  openPrintWindow(html);
}

function printGradePerLearner(term) {
  var cls = document.getElementById('gradeClass').value;
  if (!cls) { toast('Please select a section first.', 'er'); return; }
  var selectedTerm = term || getSelectedTerm();
  var key = getGradeKey(cls, selectedTerm);
  var data = loadData(key, {});
  var lrns = Object.keys(data);
  if (lrns.length === 0) { toast('No grades for ' + selectedTerm.replace('_',' ') + ' yet.', 'er'); return; }

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
      '<div style="font-size:16px;font-weight:700;margin:8px 0 2px">INDIVIDUAL GRADE REPORT — ' + selectedTerm.replace('_',' ') + '</div>' +
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

function printConsolidatedSummary() {
  var cls = document.getElementById('gradeClass').value;
  if (!cls) { toast('Please select a section first.', 'er'); return; }

  var terms = ['Term_1', 'Term_2', 'Term_3'];
  var termData = {};
  var allLrns = {};
  terms.forEach(function(t) {
    var d = loadData(getGradeKey(cls, t), {});
    termData[t] = d;
    Object.keys(d).forEach(function(lrn) { allLrns[lrn] = d[lrn]; });
  });

  if (Object.keys(allLrns).length === 0) { toast('No grades to print yet.', 'er'); return; }

  var settings = loadData('settings', DEFAULT_SETTINGS);
  var secs = (settings.sections && settings.sections.length > 0) ? settings.sections : DEFAULT_SECTIONS;
  var baseSubjects = getSubjectsForSection(cls, secs);
  var allSubjects = baseSubjects.slice();
  if (baseSubjects.indexOf('Music & Arts') > -1) allSubjects.push('MAPEH');

  var students = loadData('students', DEFAULT_STUDENTS);
  var lrns = Object.keys(allLrns);
  var males = sortByLastName(lrns.filter(function(l){ return (students.find(function(s){ return s.lrn===l; })||{}).gender==='Male'; }), function(l){ return allLrns[l].name; });
  var females = sortByLastName(lrns.filter(function(l){ return (students.find(function(s){ return s.lrn===l; })||{}).gender==='Female'; }), function(l){ return allLrns[l].name; });
  var others = sortByLastName(lrns.filter(function(l){ var g=(students.find(function(s){ return s.lrn===l; })||{}).gender; return !g||(g!=='Male'&&g!=='Female'); }), function(l){ return allLrns[l].name; });

  var termColors = { Term_1: '#1B6FA0', Term_2: '#2D8B46', Term_3: '#B45309' };
  var termLabels = terms.map(function(t){ return '<th colspan="' + allSubjects.length + '" style="padding:5px;text-align:center;background:' + termColors[t] + ';color:#fff">' + t.replace('_',' ') + '</th>'; }).join('');
  var subHeaders = terms.map(function(t){ return allSubjects.map(function(s){ return '<th style="padding:4px 5px;font-size:9px;background:#f5f5f5;border:1px solid #ccc">' + s.substring(0,6) + '</th>'; }).join(''); }).join('');

  function buildRow(lrn, num) {
    var name = allLrns[lrn] ? allLrns[lrn].name.toUpperCase() : lrn;
    var cells = terms.map(function(t) {
      var g = (termData[t][lrn] || {}).grades || {};
      return allSubjects.map(function(s){ var v=g[s]; return '<td style="padding:3px 5px;text-align:center;border:1px solid #ccc;font-size:10px">' + (v!==undefined?v:'—') + '</td>'; }).join('');
    }).join('');
    // Final grade: avg of all available grades across all terms
    var total=0, count=0;
    terms.forEach(function(t){ var g=(termData[t][lrn]||{}).grades||{}; allSubjects.forEach(function(s){ if(g[s]!==undefined){total+=g[s];count++;} }); });
    var term3Done = !!((termData['Term_3'][lrn] || {}).grades && Object.keys(termData['Term_3'][lrn].grades).length);
    var avg = (term3Done && count>0) ? Math.round((total/count)*10)/10 : null;
    var passed = avg!==null && avg>=75;
    return '<tr><td style="padding:3px 6px;border:1px solid #ccc;font-size:10px;text-align:center">' + num + '</td>' +
      '<td style="padding:3px 6px;border:1px solid #ccc;font-size:10px">' + name + '</td>' + cells +
      '<td style="padding:3px 6px;border:1px solid #ccc;text-align:center;font-weight:700;font-size:11px;color:' + (passed?'#166534':'#991b1b') + '">' + (avg!==null?avg:'—') + '</td>' +
      '<td style="padding:3px 6px;border:1px solid #ccc;text-align:center;font-size:10px;color:' + (passed?'#166534':'#991b1b') + '">' + (avg!==null?(passed?'PASSED':'FAILED'):'—') + '</td></tr>';
  }

  var rowNum = 0;
  var rows = '';
  if (males.length>0) rows += '<tr><td colspan="' + (allSubjects.length*3+4) + '" style="background:#1B2A4A;color:#fff;font-weight:700;padding:4px 8px;font-size:11px;border:1px solid #ccc">MALE</td></tr>' + males.map(function(l){ return buildRow(l, ++rowNum); }).join('');
  if (females.length>0) rows += '<tr><td colspan="' + (allSubjects.length*3+4) + '" style="background:#1B2A4A;color:#fff;font-weight:700;padding:4px 8px;font-size:11px;border:1px solid #ccc">FEMALE</td></tr>' + females.map(function(l){ return buildRow(l, ++rowNum); }).join('');
  if (others.length>0) rows += '<tr><td colspan="' + (allSubjects.length*3+4) + '" style="background:#555;color:#fff;font-weight:700;padding:4px 8px;font-size:11px;border:1px solid #ccc">OTHER</td></tr>' + others.map(function(l){ return buildRow(l, ++rowNum); }).join('');

  var teacherName = curUser ? (curUser.fname+' '+curUser.lname).toUpperCase() : '___________________';
  var html = '<!DOCTYPE html><html><head><title>Consolidated Grades - ' + cls + '</title>' + getPrintStyles() +
    '<style>table{font-size:10px}th,td{border:1px solid #ccc;padding:3px 5px}</style>' +
    '</head><body>' + getPrintHeader('CONSOLIDATED GRADE REPORT', cls) +
    '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">' +
    '<thead><tr><th rowspan="2" style="padding:5px;border:1px solid #ccc">No.</th>' +
    '<th rowspan="2" style="padding:5px;text-align:left;border:1px solid #ccc">Name</th>' +
    termLabels +
    '<th rowspan="2" style="padding:5px;border:1px solid #ccc">Final Grade</th>' +
    '<th rowspan="2" style="padding:5px;border:1px solid #ccc">Remarks</th></tr>' +
    '<tr>' + subHeaders + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p style="font-size:10px;color:#888;margin-top:8px">— = not yet uploaded | Final Grade = average of all terms, ilalabas pagkatapos ng Term 3 | Passing: 75</p>' +
    '<div style="display:flex;justify-content:space-between;margin-top:30px">' +
    '<div style="text-align:center;width:200px"><hr style="border-top:1px solid #000">' + teacherName + '<br><small>Class Adviser</small></div>' +
    '<div style="text-align:center;width:200px"><hr style="border-top:1px solid #000">___________________<br><small>Principal</small></div>' +
    '</div></body></html>';
  openPrintWindow(html);
}

function printConsolidatedPerLearner() {
  var cls = document.getElementById('gradeClass').value;
  if (!cls) { toast('Please select a section first.', 'er'); return; }

  var terms = ['Term_1', 'Term_2', 'Term_3'];
  var termData = {};
  var allLrns = {};
  terms.forEach(function(t) {
    var d = loadData(getGradeKey(cls, t), {});
    termData[t] = d;
    Object.keys(d).forEach(function(lrn) { allLrns[lrn] = d[lrn]; });
  });

  if (Object.keys(allLrns).length === 0) { toast('No grades to print yet.', 'er'); return; }

  var settings = loadData('settings', DEFAULT_SETTINGS);
  var secs = (settings.sections && settings.sections.length > 0) ? settings.sections : DEFAULT_SECTIONS;
  var baseSubjects = getSubjectsForSection(cls, secs);
  var allSubjects = baseSubjects.slice();
  if (baseSubjects.indexOf('Music & Arts') > -1) allSubjects.push('MAPEH');

  var sortedLrns = sortByLastName(Object.keys(allLrns), function(lrn){ return allLrns[lrn].name; });
  var schoolName = (settings.schoolName) || 'Dr. Bonifacio A. Masilungan Integrated National High School';
  var sy = (settings.schoolYear) || 'SY 2025-2026';
  var teacherName = curUser ? (curUser.fname+' '+curUser.lname).toUpperCase() : '___________________';
  var termColors = { Term_1: '#1B6FA0', Term_2: '#2D8B46', Term_3: '#B45309' };

  var pages = sortedLrns.map(function(lrn) {
    var name = (allLrns[lrn]||{}).name||lrn;
    // Final Grade at General Average: lalabas lang kapag may Term 3 grades na ang learner
    var term3Done = !!((termData['Term_3'][lrn] || {}).grades && Object.keys(termData['Term_3'][lrn].grades).length);
    var rows = allSubjects.map(function(s) {
      var cells = terms.map(function(t){ var v=((termData[t][lrn]||{}).grades||{})[s]; return '<td style="text-align:center;padding:4px 8px;border:1px solid #ccc">' + (v!==undefined?v:'—') + '</td>'; }).join('');
      var allVals = []; terms.forEach(function(t){ var v=((termData[t][lrn]||{}).grades||{})[s]; if(v!==undefined)allVals.push(v); });
      var avg = (term3Done && allVals.length>0) ? Math.round(allVals.reduce(function(a,b){return a+b;},0)/allVals.length*10)/10 : null;
      return '<tr><td style="text-align:left;padding:4px 8px;border:1px solid #ccc">' + s + '</td>' + cells +
        '<td style="text-align:center;padding:4px 8px;font-weight:700;border:1px solid #ccc;color:' + (avg!==null?(avg>=75?'#166534':'#991b1b'):'#666') + '">' + (avg!==null?avg:'—') + '</td></tr>';
    }).join('');
    // Overall final grade
    var total=0,count=0; terms.forEach(function(t){ var g=(termData[t][lrn]||{}).grades||{}; allSubjects.forEach(function(s){ if(g[s]!==undefined){total+=g[s];count++;} }); });
    var finalAvg = (term3Done && count>0)?Math.round((total/count)*10)/10:null;
    var passed = finalAvg!==null&&finalAvg>=75;
    var termHeaders = terms.map(function(t){ return '<th style="text-align:center;padding:5px;background:'+termColors[t]+';color:#fff;border:1px solid #ccc">' + t.replace('_',' ') + '</th>'; }).join('');

    return '<div style="page-break-after:always;padding:10px">' +
      '<div style="text-align:center;margin-bottom:10px">' +
      '<div style="font-size:11px">Republic of the Philippines — Department of Education</div>' +
      '<div style="font-size:14px;font-weight:700">' + schoolName + '</div>' +
      '<div style="font-size:11px">' + sy + '</div>' +
      '<div style="font-size:15px;font-weight:700;margin:6px 0 2px">CONSOLIDATED INDIVIDUAL GRADE REPORT</div>' +
      '</div>' +
      '<table style="margin-bottom:8px;width:100%;border-collapse:collapse">' +
      '<tr><td style="border:none;padding:2px;font-size:12px"><strong>Name:</strong> ' + name.toUpperCase() + '</td>' +
      '<td style="border:none;padding:2px;font-size:12px"><strong>LRN:</strong> ' + lrn + '</td></tr>' +
      '<tr><td style="border:none;padding:2px;font-size:12px"><strong>Section:</strong> ' + cls + '</td>' +
      '<td style="border:none;padding:2px;font-size:12px"><strong>Adviser:</strong> ' + teacherName + '</td></tr></table>' +
      '<table style="width:100%;border-collapse:collapse">' +
      '<thead><tr><th style="text-align:left;padding:5px;border:1px solid #ccc;background:#f5f5f5">Subject</th>' + termHeaders +
      '<th style="text-align:center;padding:5px;border:1px solid #ccc;background:#1B2A4A;color:#fff">Final Grade</th></tr></thead>' +
      '<tbody>' + rows +
      '<tr style="background:#f5f5f5"><td style="padding:5px 8px;font-weight:700;border:1px solid #ccc">GENERAL AVERAGE</td>' +
      terms.map(function(){ return '<td style="text-align:center;border:1px solid #ccc;color:#999">&nbsp;</td>'; }).join('') +
      '<td style="text-align:center;font-weight:700;border:1px solid #ccc;color:' + (passed?'#166534':'#991b1b') + '">' + (finalAvg!==null?finalAvg:'—') + '</td></tr>' +
      '<tr><td colspan="' + (terms.length+2) + '" style="text-align:center;padding:5px;border:1px solid #ccc;font-weight:700;color:' + (passed?'#166534':'#991b1b') + '">' + (finalAvg!==null?(passed?'PASSED':'FAILED'):'<span style="font-weight:400;font-size:11px;color:#666">Ang Final Grade at General Average ay ilalabas pagkatapos ng Term 3.</span>') + '</td></tr>' +
      '</tbody></table>' +
      '<div style="display:flex;justify-content:space-between;margin-top:30px">' +
      '<div style="text-align:center;width:200px"><hr style="border-top:1px solid #000">' + teacherName + '<br><small>Class Adviser</small></div>' +
      '<div style="text-align:center;width:200px"><hr style="border-top:1px solid #000">___________________<br><small>Principal</small></div>' +
      '</div></div>';
  }).join('');

  var html = '<!DOCTYPE html><html><head><title>Consolidated Per Learner - ' + cls + '</title>' + getPrintStyles() + '</head><body>' + pages + '</body></html>';
  openPrintWindow(html);
}

function exportSF9CSV() {
  var cls = document.getElementById('gradeClass').value;
  if (!cls) { toast('Please select a section first.', 'er'); return; }

  var settings = loadData('settings', DEFAULT_SETTINGS);
  var secs = (settings.sections && settings.sections.length > 0) ? settings.sections : DEFAULT_SECTIONS;
  var baseSubjects = getSubjectsForSection(cls, secs);

  var terms = ['Term_1', 'Term_2', 'Term_3'];
  var termData = {};
  terms.forEach(function(t) { termData[t] = loadData(getGradeKey(cls, t), {}); });

  var students = loadData('students', DEFAULT_STUDENTS);
  var sectionStudents = students.filter(function(s){ return s.grade === cls && s.status === 'Active'; });

  if (sectionStudents.length === 0) { toast('No students found in this section.', 'er'); return; }

  // Core subjects mapping
  function findKey(keywords) {
    return baseSubjects.find(function(s){
      return keywords.some(function(k){ return s.toLowerCase().indexOf(k.toLowerCase()) >= 0; });
    }) || '';
  }
  var ecKey = findKey(['Effective Communication','Mabisang Komunikasyon']);
  var ec2Key = findKey(['Effective Communication']);
  var mkKey = findKey(['Mabisang Komunikasyon']);
  var gmKey = findKey(['General Mathematics']);
  var gsKey = findKey(['General Science']);
  var lcKey = findKey(['Life and Career','Life & Career']);
  var pkKey = findKey(['Pag-Aaral','Kasaysayan','Lipunan','Philippine']);

  // Elective subjects
  var coreKeysList = [ecKey, ec2Key, mkKey, gmKey, gsKey, lcKey, pkKey, 'MAPEH'].filter(Boolean);
  var electiveSubjects = baseSubjects.filter(function(s){
    return !coreKeysList.some(function(k){ return k === s; });
  });

  function getGrade(term, subj, lrn) {
    var r = termData[term][lrn];
    if (!r || !r.grades || !subj) return '';
    var v = r.grades[subj];
    return v !== undefined ? v : '';
  }

  var selectedTerm = getSelectedTerm(); // current term
  var termKey = selectedTerm; // e.g. Term_1

  // Sort students: Male A-Z, Female A-Z
  var males = sectionStudents.filter(function(s){ return (s.gender||'').toLowerCase() === 'male'; })
    .sort(function(a,b){ return a.name.localeCompare(b.name); });
  var females = sectionStudents.filter(function(s){ return (s.gender||'').toLowerCase() !== 'male'; })
    .sort(function(a,b){ return a.name.localeCompare(b.name); });
  var sorted = males.concat(females);

  // Build CSV header matching Excel T1/T2/T3 column structure
  var electiveHeaders = electiveSubjects.map(function(s){ return '"' + s + '"'; });
  var header = ['No.', 'Name', '', '', 'LRN', '', 'Date of Birth', 'Age', 'Sex',
    'Term Grade (EC/MK)', 'Effective Communication', 'Mabisang Komunikasyon',
    'General Mathematics', 'General Science', 'Life and Career Skills',
    'Pag-Aaral ng Kasaysayan at Lipunang Pilipino'
  ].concat(electiveSubjects);

  var rows = [header.map(function(h){ return '"' + h + '"'; }).join(',')];

  // Male separator
  rows.push('"--- MALE ---"');
  males.forEach(function(s, i) {
    var ec = getGrade(termKey, ec2Key || ecKey, s.lrn);
    var mk = getGrade(termKey, mkKey || ecKey, s.lrn);
    var ecmkAvg = (ec !== '' && mk !== '') ? Math.round((Number(ec)+Number(mk))/2) : (ec || mk || '');
    var row = [
      i + 1,
      '"' + toLastFirst(s.name) + '"',
      '', '', s.lrn, '',
      s.birthdate || '',
      s.age || '',
      s.gender === 'Male' ? 'M' : 'F',
      ecmkAvg,
      ec, mk,
      getGrade(termKey, gmKey, s.lrn),
      getGrade(termKey, gsKey, s.lrn),
      getGrade(termKey, lcKey, s.lrn),
      getGrade(termKey, pkKey, s.lrn)
    ];
    electiveSubjects.forEach(function(subj){
      row.push(getGrade(termKey, subj, s.lrn));
    });
    rows.push(row.join(','));
  });

  // Female separator
  rows.push('"--- FEMALE ---"');
  females.forEach(function(s, i) {
    var ec = getGrade(termKey, ec2Key || ecKey, s.lrn);
    var mk = getGrade(termKey, mkKey || ecKey, s.lrn);
    var ecmkAvg = (ec !== '' && mk !== '') ? Math.round((Number(ec)+Number(mk))/2) : (ec || mk || '');
    var row = [
      males.length + i + 1,
      '"' + toLastFirst(s.name) + '"',
      '', '', s.lrn, '',
      s.birthdate || '',
      s.age || '',
      'F',
      ecmkAvg,
      ec, mk,
      getGrade(termKey, gmKey, s.lrn),
      getGrade(termKey, gsKey, s.lrn),
      getGrade(termKey, lcKey, s.lrn),
      getGrade(termKey, pkKey, s.lrn)
    ];
    electiveSubjects.forEach(function(subj){
      row.push(getGrade(termKey, subj, s.lrn));
    });
    rows.push(row.join(','));
  });

  var csv = '\uFEFF' + rows.join('\n'); // UTF-8 BOM for Excel
  var blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'SF9_' + cls.replace(/\s/g,'_') + '_' + selectedTerm + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast('SF9 CSV exported! I-import na sa Excel SF9 file.', 'su');
}

function printAllSF9() {
  var cls = document.getElementById('gradeClass').value;
  if (!cls) { toast('Please select a section first.', 'er'); return; }
  var students = loadData('students', DEFAULT_STUDENTS);
  var sectionStudents = students.filter(function(s){ return s.grade === cls && s.status === 'Active'; });
  if (sectionStudents.length === 0) { toast('No students found in this section.', 'er'); return; }
  if (!confirm('Print SF9 for all ' + sectionStudents.length + ' students in ' + cls + '?')) return;
  // Print one by one — each in separate window
  sectionStudents.forEach(function(s, i) {
    setTimeout(function(){ printSF9(s.lrn); }, i * 800);
  });
}

function selectStudentForSF9() {
  var cls = document.getElementById('gradeClass').value;
  if (!cls) { toast('Please select a section first.', 'er'); return; }
  var students = loadData('students', DEFAULT_STUDENTS);
  var sectionStudents = students.filter(function(s){ return s.grade === cls && s.status === 'Active'; });
  if (sectionStudents.length === 0) { toast('No students found.', 'er'); return; }

  var opts = sectionStudents.map(function(s){
    return '<option value="' + s.lrn + '">' + s.name.toUpperCase() + ' (' + s.lrn + ')</option>';
  }).join('');

  var modal = document.getElementById('gradeEditModal');
  modal.dataset.lrn = '';
  document.getElementById('gradeEditModalContent').innerHTML =
    '<div style="font-size:15px;font-weight:700;color:#1B2A4A;margin-bottom:14px">&#128438; Print SF9 — Select Student</div>' +
    '<div style="margin-bottom:14px"><label style="font-size:12px;font-weight:600;color:#555;display:block;margin-bottom:5px">Student</label>' +
    '<select id="sf9StudentSelect" style="width:100%;padding:9px 12px;border:1.5px solid #E0E4EF;border-radius:8px;font-size:14px">' +
    '<option value="">— Select a student —</option>' + opts + '</select></div>' +
    '<div style="display:flex;gap:10px">' +
    '<button onclick="var l=document.getElementById(\'sf9StudentSelect\').value;if(l){closeGradeEditModal();printSF9(l);}else{alert(\'Please select a student.\');}" style="flex:1;padding:11px;background:#6B21A8;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">&#128438; Print SF9</button>' +
    '<button onclick="closeGradeEditModal()" style="flex:1;padding:11px;background:#F0F2F8;color:#1B2A4A;border:1px solid #D0D4E8;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">Cancel</button>' +
    '</div>';
  modal.style.display = 'flex';
}

var DEPED_B64 = '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';
var SCHOOL_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAMAAAAJixmgAAABgFBMVEX0paT4Z2f1LiSpVAUcHh/yzqf6rlrkZgn7nh7v4tjg3977+/peXVyurq38xWplZGSmoZ1QLxgLDA5fWlUcFxM3PUIzLiOGfHM7Qkaqn5ael5F0QQ+MgXfn3NRZJhZlRCR7fYCZCgp4al6xY2P3foHasKvHu7H7v8CEe3OTh33JwbpDNy5PQjhVqqp/gYOTXTWLfG+Ggn/1PED//6r8/PwAAAD6eQIDAgH1AwL+ggTQZgUvFgKxVwT+/v5PJgKRRwRwNgPs5+YVFhe1tbQmJyfY19apqKf8lgTJx8aYl5ZHSEjkbQNoZ2dWV1f1FRM1Njh3d3aJiIf+/v7DXQP7+/v22NdCHQEjDQD9/f37+/v9/f2CPQL6l5diLQH2Rkf8yMgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACjh5VUAAAAYHRSTlP+///+9v7////4Ha3wCf8F8fygo17/Gvv/Zpr+/VsTF///ZAP/F1j/vW+lU2MD/xNSvP8D/gD+/v/+/v7+BP7+/v7+/v7+/v/+/v7+/v7//v7+0P41/v7+kU5s/v/+//8nFMxbAAAtYklEQVR42tV9B3fjWHIuGCS2Wurp7pmdsBPsjU7v2X4BAgTgEoFJjGKSSGX9/3/hqroRJECCQd41zulWoih8qBxulXX5nle9Xv+r/PT24eHx/vz8y5fe9NfJZMivi4v/+/PPv//t4bYuf+WHT5/f9Zas9wQrPt4C0LPmdDLqt6puxtWotsb9i+9+/v1H8SuXf/78PwywAvvwCFB7wz4HGoTxU8SY7/sDhy74jLHK00sYLPHn1dbFd//6T/xXf/hz/X8KYIG2/nA/63YmY0SyDJ+Y7zgeXo7npC76HoJn0UuA9AbUv+dgP9f//gFztPXb+1m7M2whVWOAKkFtvOg1PosRdbX63af6u2C2jgyXk9Y+mSJlFxEbOEWwpmA7zvxpgZT+7k8c898rYIH23LYmVaKskwmVHoDHuTuH9PhNonT1u/+Db/pD/e8QMMG9BdoOEW3kr6KlL314CE4cOyyky/fjCJWYfAwrr/cjwNz67tNRyWwdT3Lrj7P2tIWMnALLP/VYCDhdN/J81/Ujbo8Y//gVXh7FsS8fi/GrPtC5Uf3Tx+NJs3VE4lp9pG1Nq2FkWB+A4qeRGzhzQDcYAGA/il0XIMZuEARu7PkB4YdfXGENpPMLyPN3fz0WZOsocH94OE96QNzYT5GIxcwDqtLnANYB4rovDiJDOgOaEMDibwBeFFl8LCT8K7wNrN0gU3UEyNYR4H56nN1NGm5Q0cShj4DVRTBzEl8groN0nAdIyjl+6YRuCG6IV8Fn4CO/x8TjsRYF8W4sdBsXCPlT/W8LmMNNhi7cuXGL/tMCJRKIFgIVI/wBcjIBDkMNmDjZBdwBPCsW+V7gfq0E+EpgiTSh/RCEnSD/DQEDeT8LuCleRkKF4FLBPbpRhJ8S+grgITUVEWD6HshwMAjcFy9CBwWeyPwatZqHDygwtRhIQQxURsez/jcCjNz8MEsmBlwyrfARYVU8+uDGQohRXoGbY86yksIVj3A/EfF9+G7MQkKKD8uHx1AzIb+41YvfLg+CvD9gYK3bc3tKcJWWChoB6VoX+LLmzSFcICD4ghjICNzsSMDLAVKRceLHTgSvdIS5ivgjc5HiKVkBne+2/uX2ELNs7S+8H+/tTtWEK+43QnUVx8jJpKJcLsTI2i/wKViZUFDYpxAqGLygDIOJQmEO6Q0c5AwgNLoeLjxDTWW2dPs/H8DX1t7c/Gi3++6SaV5GSoWVMGCoksMB4gzdSs11uRCDzgZQYHOXSGE/CBwOGJDPETY+B2D5azJV8B9zF+ivkFSw2NH6Hx7r8Lf6vvra2pO8tzN7grTwFHHJsPjXnjfw8TPk5UHkxteRy4XYD0JwLUExDQzdO4B4mJH5RVykrhBwRF5YSKIc+jEwchAZkEN3/OV2TyJbe5H3073dbMCtiDsg9bMgwKhLA0+QLvSRLcMgkneaHU3g04iYHzKGLw+4nLvE+T55KUxYZwUZ+PrivL6XH2LtSd4L7gkK6sYE1kGSk4+IIugzdJ+CFR9iU1ToDIDaztKtcFFGzsenR6KCwuwwqS8gAtmXyNbueD+DsmoYz3vucv8C/wVeDI5F6JDjGIUVPyu/4ek8h7ceH86fgKHn3mDhPnmkCJDA7Np5wseonREg8uS+vrsbYu3Mzh+RvMuKJx0gRv5FyDAmoPsLSTf7XkYYDCJbieJwAd7Gcgn/LcI4BmaurcbF3E2LUJYd8l+CpwH3Y0KtAWL369ntzrrL2pWdH+1uIMnroVIREgtqFs0K2iO4rThaYdcaewoDkaMc/9Qf4dXvfz+uNmR6j2eCtFiDhkcDTU4ZvgLVfCg0vpBkt/HlcVe2tnbDC9pqqqTXY6SPYyIBl136EEfzFFgWLxDoeDTpNbt3iZ26krNuszcZjRH4Iq4YmYA5QvUR+QtQMwI3LeQk125IQGxdfy/AxM59N6x50mMOyaLMUZciv4HhBDUVmWhZvASs30863RWgq1fS7Uy+byDzGhExA5eF0QP2nQrZAB5YGGw9ArauvwtgEN8Hu9twf1HGgaI6DAAIekghvGfqZHwKjf50G1YT9fSnBvcmPfHEMBDBjBFn74hccC7kIq/Q6j5c1uvHBwzv+Wh/kezMVSy5+UCBCgX1YEKYGbUDH48nm8DePVsZP02amAM0PGhyL/2IQoqAZBgIHWpBdpuPOyC2iqure3voBlz5enMmgnqylUuHHF91jxSwu+NpeyM5n2+urm6szB91J0b6BDMeATcAsXjgVfpKaPTA/bKDIFuFxfccxVc/VsFQeAPc0/A13GjpViftLexrXdFVvsv+cXdYpRyKElY3iEORDHki6VHPI3Sn54URW4XVVdLiUQ/q0bkrsAfcGYw8pqQKfEt31MwT0rc3Sd8rceUQGa7OT9pbHzzp5A+ZQfj/qxSg0P1xVhSxVRRvu+EKZ8MPKQsVcWGiOMfXMXroNnKJe1cCLi7Rp29X+spFbHfBg40HgpAx2GoRlHHXzjWU9WRWUFlbhfDe2ifad0aqYlSL1smTKRshTwu32ks2CS1cz0jpGwPw1Vs+47eHMmqQzhgqRzDLzPQz4XsXdjHEViH62k2RtsA/y8jdIWZ2IsfnGXRi5oXb6uWbnFcBD0lcMvFevW6S9bNUGEquO6jEKODsLRE/FUVsFcD7YHdAPQvTygbw5ryAENUwYpDpLOCraj5c++3G4GArhffqZrN6a4+07+4MECl6diE9YnlfROOHAoitIni/EDVl/oGiBeY9yXyOSu9Mt+tkVMurDL2FwiTL36NTJ24h4FoLOK7iuuLOCPGwCGKrAD9LvJQ6Fd4VpSakWXYwbzNMCuG9+ssqQ2+UYXn1UGeSKDNGigP0xgtlCVTAAZqrAFdb2/F2JF4P83ADH/y6Af6hgZQiCse7djG8gO5shcClQl7nhXDi4d8C/zyDp/5EqVzJ7i/ur9sRW8XxEmBQUhANVBgWiQbaDZluvNk7A2F5ncBnxRztTkP6tU9wS1iFokxoRduP0O3ZH7cgtrbZX0vhdWSqSru2wgj+tMWrKl+ZgFcluFw4tBhJCxVFlO+m1AjYBuUHBG5ztgWxtTFeAH/DXfqiVOtxq7t8Yhi4RL6S3umWG01T1FolcMkufPWE1iAbEfI8H92URtyefdwYSVgb46PzpCHfKyRj6GNS1Yt13iFyxwWd5txrB8B2uyX41/dJaTFhOeRd+m4jOd8YO20CDPFRS/obmLjB3LA3WESRlhq0BdsY8eaIgG17hGEx112xKGGEtSAUnV9A+rF9f7kXYIx/vypkjCxSwHgFV/xNcAJ6W++wtAXvdiucvqYyZvNFVZksdKAtyYX9uAGxtcnhuNBeMvBPiIYgZE9hGMmnWe1uvb877U/lAC7vBhjcXGH+X8gFCUU84SsdOt3kgFgbDNJUUJLnN+B5kri8yNooc78vkLtRBLZyZfluR8TtqhA0LEoteA7ASAuH7skG42TlKaxPs6bgHYhwHaGhqSLgS94ZFTElN4pxTd5+M9E/7wjYTsY8UqJOGR6j+p6ucCwbyexTnuKychXWmbK03J3ED4EjI31y5ApclnawSimxLe8txHj1JWKfZBl4OwxkSm2z4rJyBVgpaCYqWXOq6qsU7bTQnZU0KCulmJNS+dUq78fTpKyZoCnWWoVtcueS+X7MFWMrL+IfigQHT5Qi01zDx5rSDL1iN1bOjAlljuN1H8OUQszVFvqZzA+kzgEx7uZ51VamAH+eddQvUzoWyyTMWUpVWBjvnQExWdfL4hncJAcgDkKHp9g8bKoQtwz+x+zPmWJsZQtwIiNgeD/mYffNC5ZQmPRCCuLVqas7U2E/r/54HxIjYs7USBDU2Uv3SWer+zlibGUz9C/ao0RuwdIgc7XXVRSvZuPEgPe6xvF7kRg0l7hJ3ue0wKpEZNxjpm2yMi1ST3ocMj7CDNZcCHVUUF/hdXJlIuLwXw10z1sTl5usU8uVeQnmMPI9QsO0nM3+msHUVrZFCh1txt2Qay0VLvxY/J7eTApjnrb8+pxlpsv7ALbbjcAT94ip2zn1qDJJqmymtrIYemyU6NDhiGss0Gmt4Q63dLfNmyodQmK7y1XrgBokBkw0hsj7/pKlqa01hv53zdAqoQGODJOB6GinWypvAXR3iNqy7Y7IImLneUx09h3ZjYtMve5wWWv9dY+JTmaI3J2s6aB+GO92R6Vt7uPrITxt2xOXqeI4Jqsj4O+ldLj6GXGTtdbaDup+rT/jSXJK0NhRnz5vo6B1tbe3JVS11K4B5p1Qd0Uqjdm019Ifq4Avz08Ml0OXtuVbdHe8n7ttMaBUW9aegJMGz76EC5FFDjS5li37/HIjYNRYLTerc0wo6N7ON/S6jYKlwwBDePykDQqXPU9pnx/XjPEqYENjyQw3i1X6ZLj7/VjZQnxnlV5LicH0pX0BgxhzfSrqenQaRjBp6N7NNgHGIEmYNi8K+Skr2WaAAtzah+XKWTxd0sXwk0MB2+OlTLsFA9DXoausMdqUlbDJWvGxJiJI4i4WnaPzw/meApwisZXB5yUt5QcAbgsbEvxCrRbu0pWlVLznFdNkpdN2iaAm8kc1FKClQPT20yo3ax50yQz9TcDJm2VZz9bbjn9iKggququfdCcZ5gLSpslK592H0iQh4kikdYQF7u9yD28lvKy7LCl+S2Vo39RPrZLKB93tZZtCbEfAJsiK7J4Cg2qlSWxlElg4WDF2K4sSQ7iTBVZRUtlK1kKiUip9Z8kU0Ov+qdu2cDEjLoqgdj1f6F63lSaxtUpgw/ZSt7r6orMLG5vVbpWuLK2Wmp71Vze6y2Ufx2sqclzUgYqaWjY4AZN2UiS2cggsCjjKydyNoe/S9f3XtN4qm6iUVUplcXe2yuNA1eUjOsrmBiyTxJapoofpRkb0TwOp7do7/f1UuSF5S9NN4r85M3W4WZLZ3QvpquNgEVWOlfMPJG6aJLYMG6wI7KmeVtHR7u8Q86dBcU5OB4HqaZRLZUNmywfgxYQPz7bF5HCFBuVAURu22AA8m8qEfhyGsZAJXivdw+V4NQH/c0oX3WUWH6ztnWob1YYIASLqVvdSkU93tg4YvejGgvscS25/IyMibu5+B2VTAZVTHvVafe3Z6PK5edvP/ZiQPHJzmo4FQP/oTIAGfN8Tei3GA4OhqhHurLFWfErqWVlxt17TeM2kdXnfOFHSK93AxQGd3a8Crl/W7VYgMwURPzoneyuj/XzKxBDQtxXno5SyW4Yvsj9eu8cl0uj5kP22EPSooEkBfuxKfDzL64mPSOCLPUNVI79TXvG2LKWqS3fGKw/Aa9tVTuKFBOJEwiteuNoyScCfZkLN8RwWo67ccC+TlIlYiOhdKkAE35O3iJeOgRdIPJfdEKKJWQSO4DXNPqcAg8rSTgd50AEWV/iT2icKXulXAkWEnbRla7MjenMQXkVi0VRuWCewTFJtScD3HRFRPYFO93mcxJVW7B5wG2+GnCZ320uqh11T1QFbIbhzrbaSexMwqqyxq4rBQTRwWBT5h0lwOol39ZpD3TOrvHdhPC+/VeEnpHzsOhJqayLVFgdcf2hLI0TTQtxYnqXZV0WL65sPNR0QfPhwff1BXtfiv7Lx89NDEXNb7CwRAASKtVj2KwQN+6FuAL48n8pOBu+apw0C0Qa97B9yBwBRu8jXGZenrRM8jUMBc7J5Ueh717xGztuLkWznmsKGEfaw39vziMwVfsy5eRjgDwMFydsIuHYEwDITgJm8OHW2XJliDhg4OvJkewOWHpnD+DCNReugGzj55ptvJNPenH6zfp1eGT89ORhwU6hen5d58awYZ9RFQ0QQVoqjsX8gcniPm4gmewffRGlT3/vZ1dXBSby0ZXKEFId4eHspbI3maUvo6KU4XBc4wq3kXtaTmxz0989OT0+V2notlU7TV0nFh1e1b05Pzw4HPHE5ACAsz9cKVTQAPf0JERPg2zv1HFRSm8v0jrXCdZYGuR2YfrMnBRk/mr15DnzrcJa22zJW4hlMPfgJItxbBVh5HT6NVMDD3XxMyvwwlcUB167SuOT1wTF/MLj2jgFY5HrocDUQF6cseCnfgwDPhq45iYPcSqrRxI0D//wZ6iWTkOUPGnCqbxwY/JtjCHFPhMVA3ArvXOCx09z9MuOAUYSVE+r5ceDqQvoBbrTpABk94TeGRdIPovRmH+tSPM1ra9QK4QnpRMOEgB/u9KlCuGoVxngDKTuUo7W7rMANJIm1gb6x7CNe48BTzSlMzAAiJueGyeIizFUZII34Fc+PwtFZmflreqqgtMpXVwdWSnMiCBnkRl7F97xIRLmR274XgJUIG+NTSYktR8e7D8XVN/I6sgXWCdsKPxQZ0KEuJqNc3+2hEFvcr1QTzsI4wjEhkXjJ8e4j9yTATXJcwHZVjv7Bfjr4KPt6uBBblI/mkdIAbReGGUwGSu1DNUiz0+v1Os22GSherWXw2s3eBK5pp3sM8BeuPGJNRwUrMsfOvUuLsllMHdynV9VEcusgP7o57beUhLRGnbtsEt9YNORUDiIeTw7Wk0IjMV7qhTCiwkR++uyRAJ/3hM7yfZEaESnpA4xSc9haG6r8x0zAf1ybvtyadA81TGR4cTaEH4WBqJBhdh3caetSp+8oWga1FvCiob9TwdBUG5MU2ob4+FXqaX6Jr77y1+Clf2XcO4S3WzzvwfjxNcD7ItzIX2efUUvLWHhOR0ax64fSm/uKcKdvMHKv2W23293OtA9wBEbng+FXluFVw163ncDVbk5H8lE1ht1DhTgQ8+Z8owLxEQDf2qKvGhW5Y5znf6nuwU5TRdz+NHXLSa/1RxXpXysP+48/pdkoaQ7llPH+ngymvMtFTHraE6dCvUUV4gcLq8KRSE8Glch1VVvW7smd5kjxZNYMDznIggCXc52ORPFIa9rezxLrwXW8bBSLGpL9CIDv5c8XYk5ZLLoz3f/YU3Lz2DGRIeK1Dg2zZbWt3qvf2x1z0lAJyVhgEjHv3T0APpeOJfxYTIAKeE24uIFIOlorb1A4WoiVCOe+Y29syMaOKmy88LQQ4+SqgVbT1uXsV9ccZoaj2iOvuM5Kup3hWCnYzbpGuJflWq1W3u5WdofqbVv9aXMHSl8shdaq4qQrNbCKnEvro6ide34QvuD4MvECL96ss5K2noMl0Y46SbGsfMFDaUmvb9rn/hB8sXYBak9Fh21tZf4cpi6tW5nPYvKNA+pH9RZ5ndHTUb8/bjVW/YptaO2sk8Rb4+B2b7Tylxqtcb/fH0035i79zEmDoIZvrQe7JaJ/BjLMhZin73NKLKOMzRT9SbOImJ3tFTgkzUm/sf5Hh5t8LaNCbIz4WrTsBwDckK0sYlK9zx+P+4ccFZj2A/vgNhTWKeV9T9Im3d5wvPKXN7zaffJE/gaYVQ9xe3EB8KMtq4QgwnEMwT8/3ZAXG3LAwFYjkKjmjjbj9aDD4Um7A1pDilNrw2Ouvsh4V47pk4m8R+te+h2BenYbrRIB3tcHKq2Hhnv6UhsprO1SWGM04pqCAzLE1rnMerFKJeIZvIDrsG4+4H3j5OcjAW5uATxaioFuNKkQjxKSHgZM59a5dLS86xpPXsf+ptDhIMDWgWfDdci7GTDPWdGUdpzZHYueUfQ8rFlTNhvzImlFTa1Kjg/4bacpS/tT+A8yXgpopK1sZvDdLzNrJjzLAW8Gr0S89J/rd+wGOOmmX1oql1UDWjnd8pH04Gq2k2MAnophkHyaty+1tO9OZ5bMiOixM7yoHB4MOOE+ZzObrW9WKmdJS9r0AiHSNsACk+fQnBVVXxq4v9qWLRM8UfREGekX6lTMTWhtApy0FYHaHekhTbMV180G+z5qHgcwBkS4E0bOdMMSogaME/wYY6K5I9ezzAXcGaF9bIAnMgRbqfzAkebRsxO8TkWKh744M8NLuKRvviXHsw1wU0wDiOUjlO3xQxNwJMIp3nG5+H4HwO3OetJufW7pKa85iFoL/yJDEDhrAGt3mnC19wPMRGkwRK5V85hSgKknIghE1cELigHuITlb2q9Xn65keAiwKqPpInF2+F9NOa/rOYBtgLmpxXHz9Fxl+yjm4hVgHLuK+Wh/wZVWMcC9VHY14bn3TqeZ6V6fIlCi8AeO2ssGTFmelOM8Hk57QO/O7oDl6Q22Bhi3Enh82m9YHHBHULZfJH+ekuHaqgyvxUjTIc7cbmVFSMUAUy4+4s2jqtqiAIMd/urDJbqGiyqtJlCzvVMGxtoxUIKIWGdCiwPmxSLkZbDDsZMGrM8qqlr47lq6wHVyemqdnNbwKtdO4auCPQ4QHE5A94+G7d2UFp4cr5nnRglwR42goaqESFnuZYe3sbQZdvO/+U6uJQdM66rEZWjpppHFHeCGic1p+EMo/MHccoCffjgEcLLNDnuxln4D8IkEzMKQtrYF3JduvEPwcKroS8j3biYt6GlxnRQwXI/CAYOnNeuqM2tiRIlo0HTPjg/4JA345L0AT2XLJfaYhteSrQYYPMzOVMYjxJEdDt+A5VXeIx7+7wI8cUVakrHYrSKhVWLaOpc5rcCdX+M6BSYzHs13B3z2XoCHqfqhK/YBYQH4HADLMQlu5IduGIduw9lQHd4VcLdzlwfYezfA/UAcZwgD7i3Lkrh1bt3LvHSoHwfZrpzjhrsAhphinFKnZybgvY3Sdi0tSuIeHSXExPNAdS5Zj/Z46alRnbQSubKp4SEfcLfTm2JjCgTFWIfRxW0DcIqjP6Sdi67RAXMghWX5EJOSQRjpU4jJo/Ugz2X6DJ+D9gmCn3YAbPp/2MBgtqmYopFrldotMz6adg8C3F7JPMvtFJSIf5Aqzdg9t8nzyADcTdW8NpZgPjg5gHsrv7q5/L8FMPel6Nyl77NInYKmUgsOCE/P3hmwTXnaFOAEKwEqBB6PhsMhFgbgyinB5AJORljMGOHvC/ZoDVO/D1LS6xWUYdHzgOu4EPhARodUTPuoXS11qine0FmaAjwyomFNyyTJvZcU4DwzrDgGnhrmfTBM5OUVMzysJtusUkWeE1+6kS6Xfp4l6WlDEFOxDcWlFOC+7CYr2nJz6hTzO7qTRpaM9ItR2GiodUOqiPq6IH4JnkdoLpXFXN6GI2lplp5Oezv1CxYFTLmt1mpZeJIUAqx6PGSaTrAwVlqwqUUdHKYT8LRrhUQgHB/d00pHD2fb7XhvOsVnuppk2AxYFY8cp1ZhUcQGxglE6/JR2iWsn7rBk4qXosxiy2GADVfL8ZKDHI/8QSpT0XoVifheFsfDBrUt3cpDmTJ8lGuisk94HBGw/U6Aee3QeVKVFHMWgHWp1XTgxjWuygf5PQDHA/zhMMBBssXPCvD4sI81QllKm1Dr4aeZjJcWLrv2gcByH2Vm4vJ4gE8PA5xrlixOP2F9aQ2XbNPC5tI6qGmutTBBKxtQ58L1PDbgM+9ogHNZeqJOQuMiaDpmOhA665w3iAtDjTsxKGv5C5Pxcuf4gJ13BywONPARJhGTM0i9oGrzBvEH6VzSUUvm4ykeJzdgOgywbQA+eR/A8qCsw2fyaDPMx8VZOP1eRhfzgefwNo8XrserRwf84d0Bi4OyHi6+YnEIEe9cnBT+Qoc88BiPPIQqj+KJAQ+ZjS07AE66velwOOpkAnZWAWMMDVe3fSBg4Vf6rjDCnhrynszkQS3pelD7YeTzJZ0irbkv4O5ENZK1s1wtJ5XRSkaql5EKVcnegMX8FamQgq8VcdY/aNnyoJYSYhwqJ/p7Gnk8nQc46UwgMmyNJuAHNntmuXicZAL27A3hcGMEwWWyD2ChozHmqwmbw3jf2UQdxavbd8oSx3Ar81gsOshKXWYDbo4yohvaR9tJ95xqwCm/o9tCyvZTXauNoNWCd+i0dwJclfN0aJEq+R0in3UiDluSEHNVjiGzbzRrZenpVcCJmb3a3l2bAxgkONGSv/J+rdGQouJxq7MVsDwJ7YRyyP2AM2/QsGf6wDRY4prcji3OTAvGWHvbFOB2XxNkPOl0290ONkOO86VQuVqbzXB3CjF/q7HKNuOtgPvu6kBd/tkAgl19YPoW3DGV9tLhBXF+r1DGo3AKoCBgmTlpI7l1Y/xWCrdFH+3aPOEIRy8rwB/V9K0oSq+u94LxJsCdBsTlo2mnuF3eBbAhNdRG0d4uw8Oc1nCcMKUA41gLmQZaW+peWTXFaRlOdo1pVSr+EL8jF7AcxrOGF6fynpuDSxRPr12rcx4O9LTOvPcEPF0bfq44upsaXFI3Z1Gp3Fbm+LADAStn2rl7B8CNwBiNbULHsY11BZh4eqIWz1ByJAjUxI/hewB2vLPjA1Y9dgxdaCP5jHM5z83xUrgO3eBpM9e32kd8KOAPzsEJnjzAidC8MlcVG9t17uQwTzVATOcudR0xK0g8AmBitw/HBywlWPUjMdVF25ccrUfEaYHXjcRRRqv4oYBPhZI4PmBQ0SuzG0JPG+H7lZl4t7Y5PNzs2FqR4sKAz7qd6RDPdI37/eFEpetPBYWlGW5jxx28qMVf12vuHR5KGzxPnVYR6w9WhgBe1uszaYrXAKcVdRHASZZ73eBNoqdCe57a6TOaZrV0r/CwKytGbKXRwcFh77P62iBP+0Qeb3FXuoxTtngr4O6033Bzrn7HPuE70MEMZ0ZYG5pxtwBWXrS/QjBaP7I2yBPVljH40HxAXAaKAe6aIxuyrtaP4j1/3fLCjcMPMgB3tJUJU0qL1ltIlZUaxouhlWc+Ipay29sBt6dbQWhFEroFrjzM64CTht6oMwhSErkApXufMX34Vlsm/yVwA3Mm9Vx3uORmPPLaAA4BTIcBCiUA0lFDqM0w3z+yPm6Z0gBTSdRVh9R70RXSLMBJZ4M8pq/AcVZ7qLZd6y3xa4CbKxt1fDZXR0rB6ZhlThB/SPGFszaUOg8w6NpG8bsXpsBxd7rGaR22CjipBjkLdfgGsMyR6WiZfsyJNjBM7GQC3hGtK6ZIGNu5i16toQ67VwEP8+4bAnr3DG1SPXPtQW48ScXVRANOtlug3MvfE7BII7W5zU0B7mStiJIEntjZaw84iaeGas4OjAlwD4evZKXuCgNm7r5XazSZDlOAN0gi2eDUVvH06hL8XW9FFsJY7mztKMCHXCx94GDvSwPu66Nm3lrg37PzVpcoEqdyWiyQQQcYkvbxAMcHA1aKZCpdDhysu8KgbtVOSfDa+iEzShSntwJlSXiWtH/QXY6/nFI+4vTiULw6ZRvqPefphX7wWDt2/vohTmLDRSPy4maMJ/mGE9LLvYyrk301O3SeTl1dkbcEV7rdKXY1sy8ZfWkBHsDNxjUxIl5tt1wh8PoKMeVRi6OK0TVzgwyfeu9LAj7SpQWYAamv8cjwV53oaNubVojxKFGFWTQgDxDHik+EGB92UY7HOT0S3oneaVdxAxYZw+25SZrV61vWANoXqospkKvmHOmoLseH3qEoLh0Jcc+wwDxmiGtqRJYb2Pba+tL1RY9aKnBFdYXGAsRyv7Z/6Dji4yTxtMcVGL5kLQwCBlztyrGHoLG2LHqkVZ62WH2I3tAChdgJtPZjOy8iygH84Qh4u0ph0UwWssI4l1N0AyNt6ltWeXLTNDYaAkLswg3UPnJcyfX3wtJJS7nQyM64+5ufgtZrVrcua+WmqSvzeX7k0/5EzAnIdXkvrnUgYpnSOhzv3FMBO8XaFceJ4kib4Fl96zperrcm6jwiXyKOQQfTGZTDVPXJ6YfTI1ilZCwUixDY4CnQI8M9ztAFFi7zZI9dFcZ4sARfkNYJqv14yCxt+29+AV5mtnkDRXyzeoAMXWilNmdqlUGIA/+aTFPFG6ioOqgWLww9v5bLr38RbhEt4BE/wFWQz4n8/LWsvtgVrydzrYH7EgWR6M5pZjJ0FmDO1ENjBhe1pSKdY73Yt+DNqVWtNBqtZMyUKq19f5fB2u2WjmPx1AozNheQZp1kM3QmYM7Uag2xL/bNG4leDxAXo3GJRrPif4keLoWIn42NQ880qGaXYUSAt6IdLAyyfbUJjHzor3Y2Q+cATmlqRhNc0c30Dc21rBa5uTu9BdCiw/+lN/z8n2na9Ovb8w39GLCWEpqqXpDEzYaR0qEdaT6IIFOWJEC1msnQ2YA5U6sw8wlPnGLXkxebJdVqAc1l8RE0CWEpcdq+4odnPg8PP9BP7zg3FJug1tFrs2k9sk8JoxCoMhdmpJPH0DmAedjU148Rh51GEdomuQMVJLuxvXHnufxaEoCfkZAWfwhlCQ5/8GYL0r4WBDxRsoq7zT3k5BeXWJAZAvyQjTcHMImxkSqCp4hjev0QoCtlsSjscyEbv0lC3oltpnJT6zP++OaZViMU2H6QjIw1fxEQAg/heMwLdGWlnyvAGwCbYkzN5Q4FT45ZgHkpOEOehJeAJpyqN0lNyGuJPu6gpbsts/sGB97BzTUqyNRzobDQAucIcD5gKca/ePJQGx0MwOPjGOmo46kFZownJa6k3wzAd2UTcFIccM813CufNCrD1TuBquEE1Gd1m0fgXMBcjEd6AgQ/zRS6Ue0XZY+RfbYZZMR29ZrYaQobgEm4b0rPpe1DAZOhu9BloBh9ZyZtZugYCushF28+YJHSk5vFfHrHAd8F4s51w9cW1UX7Dvl+cC3DZQ6Uy7D1RoaKwG9eLN2smuzs8wWrJMK+OLQAAo3R62M+3g2ASXG1leJinIfxeEAqFbrYGCATXr1nWWjp/2dq6btnMZjH2jKgZ6KtEc19Y+ncPif6cJPC2ga4Xj+3T4zEp0cDuVZKi/BQN7B12dg2W1Jrhv9CBjoRdhodrbOtgJstNzZKZLgmPOIzOl0jyYgh0nmuwtoCmKvqnvvVcOJib61Ah+3zeclMchpfaZyURTMeS7Sz9I5gly2uvvH7r293wu3KNUZL3wwGUcJoHxaOp4yURrE3KeitgLERYgacJFE+pfAylS4ETXGRTeTX1JBSc8+0ZYzjpe/fbFrl2XNN8vJqejD3UMR8sRQa8Y4J7yaG3gJYBk4Smim8ECnreLTiNjrZHH1zw7fRkI4qGfNZ+UKiV3NXa/ktl5tDLb24NZvxkzdUsdFpaQrhbjfj3QKYI+5r2+fJtXp4HiRVcnN/6ma2eMuL26jn0rOkYvJcsqQZgu/rL1Zdjb67ZEbLOk30g38RLb6L5dqVgni3AeaIjeRCsLJOTlfdlu7wCFvt1gLBC6KkUs44ImuOQhwz3nej+JkC1q14twLmrRAa8TwW9tetrOgubHGcHHmVUHtoCq881S+TdrHiMsR7t9nhKAyYI26trKmWaVtvbvSs4hHl4RHTXd2hmMSojS94GtQC6vHDc1GavgXwFgBMXH1WTdWN5aMl4x8bE09AiYyOVCdr9tPU9XzcjOxwzQz/B+rpA58X5OdigHnractQylGqcYF5RtMMLrI+bJeO6HFrAQkHXqpbQ/zVAOME31iNHvHDb4XwFgKM515mJmJUkA537uKl6+h5xnzi78JtjA6pq9KyloClXTreBsO4Ex2hSyuVZsz9jWJ4iwGWiCuesVe9goRmGFSos5lqqC88huqwuSfai4baOGoEgtgGHRJZOYMxMVAI8I4K+Bs7AkbE5/ZXXYsFa4irfVyGaS7fXW+Twmkg1dGum2W6076bPiqGkHBDNkPFwThiYmqdfRqS/1wQb1HA+HZ46jY2PEsRKvpiuOvKxCZceQw/r/anhXZe2El3Oqq67lIt81Z/iDcpDjCF6HOVMZfeDwgTBWv3hfEWBgyRBMTHF5p3Pcwn0fn6gU6PBizF2iDPL3i71f5kwwAb3KR1QX24YbS6XYVEN2D+krItq02++K0Oj3+L4i0OGN/zwZ6KBcVcsNBGhFqCsZjl+Snpo80gEaF2q+PRZNprWrhUDPeK4YS0PwzFcc0gVmtxVqIxWg+FudgB1fcNlxbNUZeb38J4dwDMVZflpgxyAM9bpgtfyCbz3LWXBs23Gi2WGd1Hy9BYAWSi9SOeSkJTQMPtqbQAdk+FLyFF4kXV8x6A4Y0/3RtVDsp3OLHaVxU8wR0hzT223sAozsH7vtqPytjcF49j9aVyCYPqrA7hPz82w1MP2Hyym/juDhjf+jGVGHaYz4f3oDgBdoa7Uck+Z3Rdi2DWM8fxZlw+E6UEFQchCwVoFlLZlwYX393w7ggYheV2NjWTSzTjJ/QR9xwlDe6KkYPPx3fn48p4GJ6OD1Byr8VMoIDGi2IdwDec269tzs674d0VMGVB7psNI33oDTAKFw3uA+4QIVdTTS+II78o3AHDARMRWCbasxowKSyMXA7Tt4Hv7MPOewHGP3F7NiLfUokT3NtyTtMFqdU9FC3+A25JOGGymNgzakQ+PzgE7sU1i/hiEUP9u1GqA7TVJPLujncPwMhE9fsplgA8M5JxPD7Gl+fXQHdhQcqP1XDnSC+YIB2L0lpR6RMsDgVcM+F4HOJs+XJ4YzNXCk9xmHDy7o53H8CCyH03rKVHYaLciVm+PnF5DbNdsVNR/cIB7zAK6a599F1kSyM4UQFatlC4F3Ne1JFjkAwBCg8g776AiciPPzbILhqnjlGyue0IgY8RsPNC4zToCTCfavQRnXtAuYSnIVZ9PWHGBgQfn5Mf84Wy2OUZqByxkVZB3/lxP/LuDZiebv3f+hgzOSk2HWAdRva7+7zQKhqpKtcMXYmQ/G/SaUwfFww5Z4Dxufb4aqhQH3DVYVjgji3i5v3IewDgy8tPwNf/YiZQhUJBRdNw4xfCVVPn+QJhWAfgRXIzg726oTzBG9CYL0xCsuCJADNqNDPDplpMq27Ob/eHewhg+qO/Xaxk2Rw+FFawJ+CqOkaHW0wxxxyEeI6ZZbnfm5biYgMJ6uiIGyFvEKXTopg+ukjs2cPlvtx8KGDO1/9add3VehNtEhwIteTJ78wpmg0pwQo0DOGxcNephou+fHBNKwwFQmYmvVXh7bft2ePHg+AeCJj4uv6ndchCaWP3D5NpThDOBbxOKGHgbNmki5+Gcl9fyH3LVXMNcMddgntZP+yODwR8Wf8M//53lbg1w4mMpOkKOf1YhQcCMaCkpLpYbUYhdRyIUvtK4ISyC7pq9vjp8kDyHgGwgPy/vkUdlOFKeUZ7G/eRIywfoNUZOLwzUuV6vYx4A8JEeD79rn3+8MMR4B4DsLg+A+Rq5OTGCgPwtCJhprhbMvCiIFRnQXOiCRx2Nbyz728vjwL3iIAvL//xd1VyB3Mwm/Tz54NUZiTrV9DPAuK2emdcdI8C94iA/wH/++Fbmj1WKCb0tkSK6IY3htYRiXtsCgsyfyunDTp7Xjz5h8vxOsn5Q/2ocI8PGGmNmMHM+jtF/2bSL6ApgHf3R0f7PoCRzj98W6UNC5XsODgHK1AWN9i5reGXs/tbjrZ+5Ft7H8Akz79D0MDeFN7mp7Fkdo9F4ZL2wfVOOGnfAe27AubczVHjbvqIVXxzo5bYCOTPcZX3Ugz9//Jvjxzs+6B9d8B4/f9/AFp/W1Ub2YNgges1wwVfGyMH3l/8/PNvtwLkp3cC+98DWFz/+Y+/A3ID8mqj0ajC1cJxQxcX33338+//6bdbifBz/R3B4vVfI2qjfwLxjTwAAAAASUVORK5CYII=';
function printSF9(lrn) {
  var cls = document.getElementById('gradeClass').value;
  if (!cls) { toast('Please select a section first.', 'er'); return; }

  var settings = loadData('settings', DEFAULT_SETTINGS);
  var secs = (settings.sections && settings.sections.length > 0) ? settings.sections : DEFAULT_SECTIONS;
  var baseSubjects = getSubjectsForSection(cls, secs);

  var terms = ['Term_1', 'Term_2', 'Term_3'];
  var termData = {};
  terms.forEach(function(t) { termData[t] = loadData(getGradeKey(cls, t), {}); });

  var students = loadData('students', DEFAULT_STUDENTS);
  var student = students.find(function(s){ return s.lrn === lrn; });
  if (!student) { toast('Student not found.', 'er'); return; }

  var attKey = 'attendance_' + cls.replace(/\s/g,'_');
  var attData = loadData(attKey, {});
  var att = attData[lrn] || {};

  var settings2 = loadData('settings', DEFAULT_SETTINGS);
  var schoolName = (settings2.schoolName || 'DR. BONIFACIO A. MASILUNGAN INTEGRATED NATIONAL HIGH SCHOOL').toUpperCase();
  var schoolYear = settings2.schoolYear || '2026-2027';
  var teacherName = curUser ? (curUser.fname + ' ' + curUser.lname).toUpperCase() : '___________________';
  var schoolHead = (settings2.schoolHead || settings2.principal || 'MELITA P. OPINA').toUpperCase();
  var gradeLevel = cls.match(/GRADE\s+(\d+)/i) ? cls.match(/GRADE\s+(\d+)/i)[1] : '';
  var section = cls.replace(/GRADE\s+\d+\s*[-\u2013]?\s*/i, '').trim();

  function getGrade(t, subj) {
    var r = termData[t][lrn];
    if (!r || !r.grades) return '';
    var v = r.grades[subj];
    return v !== undefined ? v : '';
  }
  function getFinalGrade(subj) {
    var vals = [];
    terms.forEach(function(t) { var v = getGrade(t, subj); if (v !== '') vals.push(v); });
    if (vals.length < 3) return '';
    return Math.round(vals.reduce(function(a,b){return a+b;},0)/vals.length * 10)/10;
  }
  function getRemarks(g) { return (g === '' || g === null || g === undefined) ? '' : (g >= 75 ? 'Passed' : 'Failed'); }

  // Determine if JHS or SHS based on grade level
  var isJHS = parseInt(gradeLevel) <= 10;

  // JHS Core Subjects (Grade 7-10)
  var jhsCoreKeywords = ['Filipino','English','Mathematics','Science','Araling Panlipunan','AP','Edukasyon sa Pagpapakatao','EsP','Technology and Livelihood','TLE','MAPEH','Music','Arts','Physical Education','Health'];

  // SHS Core Subjects (Grade 11-12)
  var shsCoreKeywords = ['Effective Communication','Mabisang Komunikasyon','General Mathematics','General Science','Life and Career Skills','Life & Career','Pag-Aaral','Kasaysayan','Lipunan','MAPEH','Music','Arts','PE & Health','Physical Education'];

  var coreKeywords = isJHS ? jhsCoreKeywords : shsCoreKeywords;

  // For JHS — all subjects are "core", no elective section
  // For SHS — subjects matching coreKeywords are core, rest are elective
  var electiveSubjects = [];
  if (!isJHS) {
    electiveSubjects = baseSubjects.filter(function(s) {
      var isCore = coreKeywords.some(function(k){
        return s.toLowerCase().indexOf(k.toLowerCase()) >= 0;
      });
      if (isCore) return false;
      var hasGrade = terms.some(function(t){ return getGrade(t, s) !== ''; });
      return hasGrade;
    });
  }

  // For JHS — treat all subjects as one flat list (no Core/Elective grouping)
  var jhsSubjects = isJHS ? baseSubjects : [];

  // SHS Core subjects definition
  var coreSubjects = isJHS ? [] : [
    {name:'Effective Communication / Mabisang Komunikasyon', key:'EffComm', units:2},
    {name:'General Mathematics', key:'General Mathematics', units:2},
    {name:'General Science', key:'General Science', units:2},
    {name:'Life and Career Skills', key:'Life and Career Skills', units:2},
    {name:'Pag-Aaral ng Kasaysayan at Lipunang Pilipino', key:'Pag-Aaral', units:2}
  ];

  function findSubjectKey(keywords) {
    return baseSubjects.find(function(s) {
      return keywords.some(function(k){ return s.toLowerCase().indexOf(k.toLowerCase()) >= 0; });
    }) || '';
  }

  if (!isJHS) {
    coreSubjects[0].portalKey = findSubjectKey(['Effective Communication','Mabisang Komunikasyon']);
    coreSubjects[1].portalKey = findSubjectKey(['General Mathematics']);
    coreSubjects[2].portalKey = findSubjectKey(['General Science']);
    coreSubjects[3].portalKey = findSubjectKey(['Life and Career Skills','Life & Career']);
    coreSubjects[4].portalKey = findSubjectKey(['Pag-Aaral','Kasaysayan','Lipunan','Philippine']);
  }

  function subjRow(name, t1, t2, t3, units, finalGrade, remarks, isItalic) {
    var st = isItalic ? 'font-style:italic;' : '';
    return '<tr>' +
      '<td style="' + st + 'padding:2px 4px;border:0.5px solid #000;font-size:8px">' + name + '</td>' +
      '<td style="text-align:center;padding:2px;border:0.5px solid #000;font-size:8px">' + t1 + '</td>' +
      '<td style="text-align:center;padding:2px;border:0.5px solid #000;font-size:8px">' + t2 + '</td>' +
      '<td style="text-align:center;padding:2px;border:0.5px solid #000;font-size:8px">' + t3 + '</td>' +
      '<td style="text-align:center;padding:2px;border:0.5px solid #000;font-size:8px">' + (units||'') + '</td>' +
      '<td style="text-align:center;padding:2px;border:0.5px solid #000;font-size:8px;font-weight:bold">' + (finalGrade||'') + '</td>' +
      '<td style="text-align:center;padding:2px;border:0.5px solid #000;font-size:8px">' + remarks + '</td>' +
      '</tr>';
  }

  var coreRows = '';
  var totalUnits = 0;

  if (isJHS) {
    // JHS — flat list of all subjects, no Core/Elective grouping
    jhsSubjects.forEach(function(s) {
      var t1 = getGrade('Term_1', s);
      var t2 = getGrade('Term_2', s);
      var t3 = getGrade('Term_3', s);
      var fg = getFinalGrade(s);
      var u = 2;
      totalUnits += u;
      coreRows += subjRow(s, t1, t2, t3, u, fg, getRemarks(fg), false);
    });
  } else {
    // SHS — Core subjects
    coreSubjects.forEach(function(s) {
      var pk = s.portalKey;
      var t1 = pk ? getGrade('Term_1', pk) : '';
      var t2 = pk ? getGrade('Term_2', pk) : '';
      var t3 = pk ? getGrade('Term_3', pk) : '';
      var fg = pk ? getFinalGrade(pk) : '';
      totalUnits += s.units;
      coreRows += subjRow(s.name, t1, t2, t3, s.units, fg, getRemarks(fg), false);
      if (s.key === 'EffComm') {
        var ecKey = findSubjectKey(['Effective Communication']);
        var mkKey = findSubjectKey(['Mabisang Komunikasyon']);
        if (ecKey) coreRows += subjRow('\u00a0\u00a0\u00a0Effective Communication', getGrade('Term_1',ecKey), getGrade('Term_2',ecKey), getGrade('Term_3',ecKey), '', '', '', true);
        if (mkKey) coreRows += subjRow('\u00a0\u00a0\u00a0Mabisang Komunikasyon', getGrade('Term_1',mkKey), getGrade('Term_2',mkKey), getGrade('Term_3',mkKey), '', '', '', true);
      }
    });
  }

  var electiveRows = '';
  var electiveUnits = 0;
  if (electiveSubjects.length > 0) {
    electiveSubjects.forEach(function(s) {
      var t1 = getGrade('Term_1', s);
      var t2 = getGrade('Term_2', s);
      var t3 = getGrade('Term_3', s);
      var fg = getFinalGrade(s);
      var u = 3;
      electiveUnits += u;
      electiveRows += subjRow(s, t1, t2, t3, u, fg, getRemarks(fg), false);
    });
  } else {
    electiveRows += subjRow('', '', '', '', '', '', '', false);
    electiveRows += subjRow('', '', '', '', '', '', '', false);
  }

  totalUnits += electiveUnits;

  var allFinals = isJHS
    ? jhsSubjects.map(function(s){ return getFinalGrade(s); })
    : coreSubjects.map(function(s){ return getFinalGrade(s.portalKey); });
  var elecFinals = isJHS ? [] : electiveSubjects.map(function(s){ return getFinalGrade(s); });
  var allF = allFinals.concat(elecFinals).filter(function(v){ return v !== ''; });
  var totalSubjects = isJHS ? jhsSubjects.length : (coreSubjects.length + electiveSubjects.length);
  var hasAll = (allF.length === totalSubjects) && allF.length > 0;
  var genAvg = hasAll ? Math.round(allF.reduce(function(a,b){return a+b;},0)/allF.length*10)/10 : '';

  var present = att.present || 0;
  var absent = att.absent || 0;

  var DEPED = 'data:image/png;base64,' + DEPED_B64;
  var SCHOOL = 'data:image/png;base64,' + SCHOOL_B64;

  var html = '<!DOCTYPE html><html><head><title>SF9 - ' + (student.name||lrn) + '</title>' +
  '<style>' +
  '@page{size:A4 landscape;margin:6mm}' +
  'body{font-family:Arial,sans-serif;font-size:8px;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
  'table{border-collapse:collapse}' +
  '.page{width:277mm;display:flex;gap:3mm}' +
  '.left{width:140mm}.right{width:134mm}' +
  '.shdr{font-weight:bold;font-size:8px;padding:2px 4px;background:#d0d0d0;border:0.5px solid #000;margin-top:3px}' +
  '@media print{.noprint{display:none}}' +
  '</style></head><body>' +
  '<div class="noprint" style="text-align:center;padding:8px;background:#1B2A4A;color:#fff;font-size:13px;font-weight:bold">' +
  'SF9 Preview — <button onclick="window.print()" style="padding:6px 18px;background:#E85D1A;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:bold;cursor:pointer">\uD83D\uDDA8\uFE0F Print SF9</button></div>' +
  '<div class="page">' +
  // LEFT SIDE
  '<div class="left">' +
  '<table style="width:100%;margin-bottom:2px"><tr>' +
  '<td style="width:13%;text-align:center"><img src="' + DEPED + '" style="width:38px;height:38px"></td>' +
  '<td style="text-align:center;font-size:7px">' +
  '<div>Republic of the Philippines</div><div>Department of Education</div>' +
  '<div style="font-weight:bold">REGION IV-A</div>' +
  '<div style="font-weight:bold">SCHOOLS DIVISION OF BATANGAS PROVINCE</div>' +
  '<div>San Jose Sub-Office</div><div>Lalayat, San Jose, Batangas</div>' +
  '</td>' +
  '<td style="width:13%;text-align:center"><img src="' + SCHOOL + '" style="width:38px;height:38px"></td>' +
  '</tr></table>' +
  '<div style="text-align:center;font-weight:bold;font-size:8px;border-top:1px solid #000;padding-top:1px">' + schoolName + '</div>' +
  '<div style="text-align:center;font-weight:bold;font-size:10px;border:1px solid #000;padding:2px;margin:2px 0">LEARNER\'S PERFORMANCE REPORT</div>' +
  '<div style="text-align:center;font-size:8px;margin-bottom:2px">School Year ' + schoolYear + '</div>' +
  '<table style="width:100%;font-size:8px;margin-bottom:2px"><tr>' +
  '<td style="width:55%">Name: <strong>' + (student.name||lrn).toUpperCase() + '</strong></td>' +
  '<td style="width:20%">Age: <strong>' + (student.age||'') + '</strong></td>' +
  '<td>Sex: <strong>' + (student.gender||'') + '</strong></td>' +
  '</tr><tr>' +
  '<td>LRN: <strong>' + lrn + '</strong></td>' +
  '<td>Grade: <strong>' + gradeLevel + '</strong></td>' +
  '<td>Section: <strong>' + section + '</strong></td>' +
  '</tr><tr><td colspan="3">Track (SHS only): <strong>Academic</strong></td></tr></table>' +
  '<div style="font-size:7px;border:0.5px solid #ccc;padding:3px;margin-bottom:3px">' +
  '<strong>Dear Parents,</strong><br>' +
  '&nbsp;&nbsp;&nbsp;This Performance Report presents your child\'s learning progress and achievement in the different learning areas.<br>' +
  '&nbsp;&nbsp;&nbsp;The school welcomes you to reach out should you wish to know more about your child\'s learning and performance.' +
  '</div>' +
  '<table style="width:100%;font-size:8px;margin-bottom:3px"><tr>' +
  '<td style="width:46%;text-align:center"><div style="border-top:0.5px solid #000;margin-top:16px;padding-top:1px"><strong>' + schoolHead + '</strong></div><div>School Head</div></td>' +
  '<td style="width:8%"></td>' +
  '<td style="width:46%;text-align:center"><div style="border-top:0.5px solid #000;margin-top:16px;padding-top:1px"><strong>' + teacherName + '</strong></div><div>Adviser</div></td>' +
  '</tr></table>' +
  '<div class="shdr">LEARNING PROGRESS AND ACHIEVEMENT</div>' +
  '<table style="width:100%">' +
  '<thead><tr style="background:#e8e8e8;text-align:center;font-size:7.5px">' +
  '<th style="border:0.5px solid #000;padding:2px;width:42%;text-align:left">Learning Areas</th>' +
  '<th colspan="3" style="border:0.5px solid #000;padding:2px">TERM</th>' +
  '<th style="border:0.5px solid #000;padding:2px">Units</th>' +
  '<th style="border:0.5px solid #000;padding:2px">Final Grade</th>' +
  '<th style="border:0.5px solid #000;padding:2px">Remarks</th>' +
  '</tr><tr style="background:#e8e8e8;text-align:center;font-size:7.5px">' +
  '<th style="border:0.5px solid #000;padding:2px;text-align:left"></th>' +
  '<th style="border:0.5px solid #000;padding:2px;width:7%">T1</th>' +
  '<th style="border:0.5px solid #000;padding:2px;width:7%">T2</th>' +
  '<th style="border:0.5px solid #000;padding:2px;width:7%">T3</th>' +
  '<th style="border:0.5px solid #000;padding:2px;width:8%"></th>' +
  '<th style="border:0.5px solid #000;padding:2px;width:10%"></th>' +
  '<th style="border:0.5px solid #000;padding:2px;width:10%"></th>' +
  '</tr></thead><tbody>' +
  (isJHS ? '' : '<tr><td colspan="7" style="font-weight:bold;font-size:7.5px;padding:1px 4px;background:#f0f0f0;border:0.5px solid #000">Core Subjects</td></tr>') +
  coreRows +
  (isJHS ? '' : '<tr><td colspan="7" style="font-weight:bold;font-size:7.5px;padding:1px 4px;background:#f0f0f0;border:0.5px solid #000">Elective Subjects</td></tr>') +
  (isJHS ? '' : electiveRows) +
  '<tr style="background:#e8e8e8;font-weight:bold">' +
  '<td colspan="4" style="text-align:center;border:0.5px solid #000;padding:2px;font-size:8px">General Average</td>' +
  '<td style="text-align:center;border:0.5px solid #000;padding:2px;font-size:8px">' + totalUnits + '</td>' +
  '<td style="text-align:center;border:0.5px solid #000;padding:2px;font-size:9px;color:' + (genAvg>=75?'#166534':'#991b1b') + '">' + genAvg + '</td>' +
  '<td style="text-align:center;border:0.5px solid #000;padding:2px;font-size:8px;color:' + (genAvg>=75?'#166534':'#991b1b') + '">' + getRemarks(genAvg) + '</td>' +
  '</tr></tbody></table>' +
  '<div class="shdr">PERFORMANCE DESCRIPTOR</div>' +
  '<table style="width:100%;font-size:7.5px"><thead>' +
  '<tr style="background:#e8e8e8;text-align:center">' +
  '<th style="border:0.5px solid #000;padding:2px;width:25%">Grading Scale</th>' +
  '<th style="border:0.5px solid #000;padding:2px;width:40%">Descriptors</th>' +
  '<th style="border:0.5px solid #000;padding:2px">Remarks</th>' +
  '</tr></thead><tbody>' +
  '<tr><td style="text-align:center;border:0.5px solid #000;padding:1px 2px">90-100</td><td style="border:0.5px solid #000;padding:1px 4px">Advancing</td><td style="text-align:center;border:0.5px solid #000;padding:1px">Passed</td></tr>' +
  '<tr><td style="text-align:center;border:0.5px solid #000;padding:1px 2px">80-89</td><td style="border:0.5px solid #000;padding:1px 4px">Benchmarking</td><td style="text-align:center;border:0.5px solid #000;padding:1px">Passed</td></tr>' +
  '<tr><td style="text-align:center;border:0.5px solid #000;padding:1px 2px">75-79</td><td style="border:0.5px solid #000;padding:1px 4px">Connecting</td><td style="text-align:center;border:0.5px solid #000;padding:1px">Passed</td></tr>' +
  '<tr><td style="text-align:center;border:0.5px solid #000;padding:1px 2px">65-74</td><td style="border:0.5px solid #000;padding:1px 4px">Developing</td><td style="text-align:center;border:0.5px solid #000;padding:1px">Failed</td></tr>' +
  '<tr><td style="text-align:center;border:0.5px solid #000;padding:1px 2px">0-64</td><td style="border:0.5px solid #000;padding:1px 4px">Emerging</td><td style="text-align:center;border:0.5px solid #000;padding:1px">Failed</td></tr>' +
  '</tbody></table>' +
  '</div>' +
  // RIGHT SIDE
  '<div class="right">' +
  '<div class="shdr">ATTENDANCE</div>' +
  '<table style="width:100%;font-size:7px;margin-bottom:3px"><thead>' +
  '<tr style="background:#e8e8e8;text-align:center">' +
  '<th style="border:0.5px solid #000;padding:2px;text-align:left">Month</th>' +
  '<th style="border:0.5px solid #000;padding:2px">Jun</th><th style="border:0.5px solid #000;padding:2px">Jul</th>' +
  '<th style="border:0.5px solid #000;padding:2px">Aug</th><th style="border:0.5px solid #000;padding:2px">Sep</th>' +
  '<th style="border:0.5px solid #000;padding:2px">Oct</th><th style="border:0.5px solid #000;padding:2px">Nov</th>' +
  '<th style="border:0.5px solid #000;padding:2px">Dec</th><th style="border:0.5px solid #000;padding:2px">Jan</th>' +
  '<th style="border:0.5px solid #000;padding:2px">Feb</th><th style="border:0.5px solid #000;padding:2px">Mar</th>' +
  '<th style="border:0.5px solid #000;padding:2px">Apr</th><th style="border:0.5px solid #000;padding:2px;font-weight:bold">Total</th>' +
  '</tr></thead><tbody>' +
  '<tr><td style="border:0.5px solid #000;padding:2px">No. of Class Days</td><td colspan="12" style="border:0.5px solid #000"></td></tr>' +
  '<tr><td style="border:0.5px solid #000;padding:2px">No. of Days Present</td><td colspan="11" style="border:0.5px solid #000"></td><td style="text-align:center;border:0.5px solid #000;padding:1px"><strong>' + present + '</strong></td></tr>' +
  '<tr><td style="border:0.5px solid #000;padding:2px">No. of Days Absent</td><td colspan="11" style="border:0.5px solid #000"></td><td style="text-align:center;border:0.5px solid #000;padding:1px"><strong>' + absent + '</strong></td></tr>' +
  '</tbody></table>' +
  '<div class="shdr">TEACHER\'S COMMENTS / REMARKS</div>' +
  '<table style="width:100%;font-size:7.5px;margin-bottom:3px"><tbody>' +
  '<tr><td style="border:0.5px solid #000;padding:2px;width:15%;font-weight:bold;vertical-align:top">Term 1</td><td style="border:0.5px solid #000;padding:2px;height:28px"></td></tr>' +
  '<tr><td style="border:0.5px solid #000;padding:2px;font-weight:bold;vertical-align:top">Term 2</td><td style="border:0.5px solid #000;padding:2px;height:28px"></td></tr>' +
  '<tr><td style="border:0.5px solid #000;padding:2px;font-weight:bold;vertical-align:top">Term 3</td><td style="border:0.5px solid #000;padding:2px;height:28px"></td></tr>' +
  '</tbody></table>' +
  '<div class="shdr">PARENT/S GUARDIAN\'S SIGNATURE</div>' +
  '<table style="width:100%;font-size:7.5px;margin-bottom:3px"><tbody>' +
  '<tr><td style="width:18%;border:0.5px solid #000;padding:2px;font-weight:bold">Term 1</td><td style="border:0.5px solid #000;padding:2px;height:16px"></td></tr>' +
  '<tr><td style="border:0.5px solid #000;padding:2px;font-weight:bold">Term 2</td><td style="border:0.5px solid #000;padding:2px;height:16px"></td></tr>' +
  '<tr><td style="border:0.5px solid #000;padding:2px;font-weight:bold">Term 3</td><td style="border:0.5px solid #000;padding:2px;height:16px"></td></tr>' +
  '</tbody></table>' +
  '<div class="shdr">CERTIFICATE OF TRANSFER</div>' +
  '<div style="font-size:7.5px;border:0.5px solid #000;padding:4px;margin-bottom:2px">' +
  'This is to certify that the above-named learner has satisfactorily completed the requirements for the grade level indicated.<br><br>' +
  'Admitted to Grade: _______________________<br><br>' +
  'Eligible for Admission to Grade: ___________<br><br>' +
  '<table style="width:100%"><tr>' +
  '<td style="width:50%">Approved: ___________________</td>' +
  '<td>Adviser: ___________________</td>' +
  '</tr></table>' +
  '<div style="text-align:center;margin-top:14px">___________________________<br>School Head</div>' +
  '</div>' +
  '<div class="shdr">CANCELLATION OF ELIGIBILITY TO TRANSFER</div>' +
  '<div style="font-size:7.5px;border:0.5px solid #000;padding:4px">' +
  'Admitted in: _______________________&nbsp;&nbsp;&nbsp;Date: ___________<br><br>' +
  '<div style="text-align:center;margin-top:14px">___________________________<br>School Head</div>' +
  '</div>' +
  '</div></div></body></html>';

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

// ============================================
// ANNOUNCEMENTS
// ============================================

function postAnnouncement() {
  var title = document.getElementById('annTitle').value.trim();
  var message = document.getElementById('annMessage').value.trim();
  var cls = document.getElementById('annClass').value;
  if (!title || !message) { toast('Please enter title and message.', 'er'); return; }

  var announcements = loadData('announcements', []);
  var teacherName = curUser ? (curUser.fname + ' ' + curUser.lname) : 'Teacher';

  announcements.unshift({
    id: Date.now(),
    title: title,
    message: message,
    section: cls,
    author: teacherName,
    date: new Date().toISOString()
  });

  saveData('announcements', announcements);
  document.getElementById('annTitle').value = '';
  document.getElementById('annMessage').value = '';
  loadAnnouncements();
  toast('Announcement posted!', 'su');
}

function loadAnnouncements() {
  var announcements = loadData('announcements', []);
  var el = document.getElementById('annList');
  if (!el) return;

  if (announcements.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--g5);font-size:13px">No announcements yet.</div>';
    return;
  }

  el.innerHTML = announcements.slice(0, 20).map(function(a) {
    var date = a.date ? new Date(a.date).toLocaleDateString('en-PH', {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
    return '<div style="background:#fff;border:1px solid #e0e4ef;border-radius:10px;padding:14px;margin-bottom:10px">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
      '<div><div style="font-size:14px;font-weight:700;color:#1B2A4A">' + a.title + '</div>' +
      '<div style="font-size:11px;color:#888;margin-top:2px">' + (a.author || 'Teacher') + ' &bull; ' + date + ' &bull; ' +
      '<span style="background:#e8f0fe;color:#1B2A4A;padding:1px 8px;border-radius:10px;font-size:10px;font-weight:600">' + (a.section || 'All') + '</span></div></div>' +
      '<button onclick="deleteAnnouncement(' + a.id + ')" title="Delete" style="background:none;border:none;color:#ccc;font-size:16px;cursor:pointer;padding:0 4px">&times;</button>' +
      '</div>' +
      '<div style="font-size:13px;color:#555;margin-top:8px;line-height:1.6;white-space:pre-wrap">' + a.message + '</div>' +
      '</div>';
  }).join('');
}

function deleteAnnouncement(id) {
  if (!confirm('Delete this announcement?')) return;
  var announcements = loadData('announcements', []);
  announcements = announcements.filter(function(a) { return a.id !== id; });
  saveData('announcements', announcements);
  loadAnnouncements();
  toast('Announcement deleted.', 'su');
}

function loadStudentAnnouncements() {
  var announcements = loadData('announcements', []);
  var el = document.getElementById('sdAnnContent');
  if (!el) return;
  var grade = curUser ? curUser.grade : '';

  // Filter: show announcements for student's section or "All Sections"
  var filtered = announcements.filter(function(a) {
    return a.section === 'All Sections' || a.section === grade;
  });

  if (filtered.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--g5);font-size:13px">No announcements yet.</div>';
    return;
  }

  el.innerHTML = filtered.slice(0, 15).map(function(a) {
    var date = a.date ? new Date(a.date).toLocaleDateString('en-PH', {year:'numeric',month:'short',day:'numeric'}) : '';
    return '<div style="background:#f8f9fc;border:1px solid #e0e4ef;border-radius:10px;padding:14px;margin-bottom:10px">' +
      '<div style="font-size:14px;font-weight:700;color:#1B2A4A">' + a.title + '</div>' +
      '<div style="font-size:11px;color:#888;margin-top:2px">' + (a.author || 'Teacher') + ' &bull; ' + date + '</div>' +
      '<div style="font-size:13px;color:#555;margin-top:8px;line-height:1.6;white-space:pre-wrap">' + a.message + '</div>' +
      '</div>';
  }).join('');
}

function populateAnnounceClass() {
  var sel = document.getElementById('annClass');
  if (!sel) return;
  var settings = loadData('settings', DEFAULT_SETTINGS);
  var secs = (settings.sections && settings.sections.length > 0) ? settings.sections : DEFAULT_SECTIONS;
  sel.innerHTML = '<option value="All Sections">All Sections</option>';
  secs.forEach(function(s) {
    var name = typeof s === 'object' ? s.name : s;
    sel.innerHTML += '<option value="' + name + '">' + name + '</option>';
  });
}

function updateTeacherStats() {
  var teachers = loadData('teachers', []);
  var teacher = curUser ? teachers.find(function(t){ return t.eid === curUser.eid; }) : null;
  var advisorySections = (teacher && teacher.sections && teacher.sections.length > 0) ? teacher.sections : [];
  var isAdviser = advisorySections.length > 0;

  // If no advisory sections, use all sections from settings
  var allSettings = loadData('settings', DEFAULT_SETTINGS);
  var allSections = (allSettings.sections && allSettings.sections.length > 0) ? allSettings.sections.map(function(s){ return typeof s === 'object' ? s.name : s; }) : [];
  var targetSections = isAdviser ? advisorySections : allSections;

  var term = getSelectedTerm ? getSelectedTerm() : 'Term_1';
  var totalStudents = 0;
  var sectionsWithGrades = 0;
  var totalRate = 0;
  var attCount = 0;

  targetSections.forEach(function(sec) {
    var secKey = sec.replace(/\s/g, '_');
    var gradeKey = 'grades_' + secKey + '_' + term;
    var gradeData = _cache[gradeKey] || {};
    var studentCount = Object.keys(gradeData).length;

    if (studentCount > 0) {
      totalStudents += studentCount;
      sectionsWithGrades++;
    } else {
      var students = loadData('students', []);
      var secStudents = students.filter(function(s){ return s.grade === sec && s.status === 'Active'; });
      totalStudents += secStudents.length;
    }

    var attKey = 'attendance_' + secKey;
    var attData = _cache[attKey] || {};
    Object.keys(attData).forEach(function(lrn) {
      if (attData[lrn] && attData[lrn].rate) {
        totalRate += parseFloat(attData[lrn].rate);
        attCount++;
      }
    });
  });

  var pendingCount = targetSections.length - sectionsWithGrades;
  var avgAtt = attCount > 0 ? Math.round(totalRate / attCount) + '%' : '--';

  // Update labels based on role
  var lbl1 = document.getElementById('tStatClassesLabel');
  var lbl3 = document.getElementById('tStatPendingLabel');
  if (lbl1) lbl1.textContent = isAdviser ? 'CLASSES' : 'SECTIONS';
  if (lbl3) lbl3.textContent = isAdviser ? 'PENDING GRADES' : 'SECTIONS W/ GRADES';

  var el1 = document.getElementById('tStatClasses');
  var el2 = document.getElementById('tStatStudents');
  var el3 = document.getElementById('tStatPending');
  var el4 = document.getElementById('tStatAttendance');
  if (el1) el1.textContent = targetSections.length;
  if (el2) el2.textContent = totalStudents;
  if (el3) el3.textContent = isAdviser ? (pendingCount > 0 ? pendingCount : 0) : sectionsWithGrades;
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
