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
    console.log('Portal content rendered from Firebase!');
  } catch(e) {
    console.error('renderPortalContent ERROR:', e);
  }
});
// Listen for real-time changes from admin
listenForChanges(function() {
  renderPortalContent();
  console.log('Real-time update received!');
});

// Real-time updates handled by Firebase listener above

// === AUTH FUNCTIONS ===
function openM(m){document.getElementById('authModal').classList.add('act');switchMode(m||'login')}
function closeM(){document.getElementById('authModal').classList.remove('act')}
function switchMode(m){var l=m==='login';document.getElementById('loginForm').style.display=l?'block':'none';document.getElementById('signupForm').style.display=l?'none':'block';document.getElementById('mtL').className='tab'+(l?' act':'');document.getElementById('mtS').className='tab'+(l?'':' act')}
function stab(el){el.parentElement.querySelectorAll('.tab').forEach(function(t){t.className='tab'});el.className='tab act'}
function stype(el,t){stab(el);signupType=t;document.getElementById('fLrn').style.display=t==='s'?'block':'none';document.getElementById('fEmp').style.display=t==='t'?'block':'none';document.getElementById('fChild').style.display=t==='p'?'block':'none';document.getElementById('fGrade').style.display=t==='s'?'grid':'none'}

function doLogin(){
loadSavedAccounts();
var id=document.getElementById('liId').value.trim().toLowerCase();
var pw=document.getElementById('liPw').value;
var user=accounts.find(function(a){return (a.id===id||a.lrn===id||a.eid===id||(a.email&&a.email.toLowerCase()===id))&&a.pw===pw});
if(!user){toast('Invalid credentials. Please check your ID and password.','er');return}
curUser=user;closeM();
document.getElementById('publicSite').style.display='none';
if(user.type==='student'){
document.getElementById('studentDash').classList.add('act');
document.getElementById('sdAv').textContent=user.fname[0];
document.getElementById('sdName').textContent=user.fname+' '+user.lname;
document.getElementById('sdWelcome').textContent=user.fname;
}else if(user.type==='teacher'){
document.getElementById('teacherDash').classList.add('act');
document.getElementById('tdAv').textContent=user.fname[0];
document.getElementById('tdName').textContent=user.fname+' '+user.lname;
document.getElementById('tdWelcome').textContent=user.fname;
}else if(user.type==='parent'){
document.getElementById('parentDash').classList.add('act');
document.getElementById('pdAv').textContent=user.fname[0];
document.getElementById('pdName').textContent=user.fname+' '+user.lname;
document.getElementById('pdWelcome').textContent=user.fname;
document.getElementById('pdChild').textContent=user.childName||'Your Child';
}
toast('Welcome, '+user.fname+'!');
}

function doLogout(){
curUser=null;
document.querySelectorAll('.dash-page').forEach(function(p){p.classList.remove('act')});
document.getElementById('publicSite').style.display='block';
window.scrollTo({top:0});
toast('Logged out successfully');
}

function doSignup(){
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
newAcc.lrn=document.getElementById('sLrn').value;
newAcc.grade=(document.getElementById('sGrade').value||'TBA')+' - '+(document.getElementById('sSec').value||'TBA');
if(!newAcc.lrn){toast('Please enter LRN.','er');return}
newAcc.id=newAcc.lrn;
}else if(signupType==='t'){
newAcc.eid=document.getElementById('sEmp').value;
newAcc.dept='TBA';
if(!newAcc.eid){toast('Please enter Employee ID.','er');return}
newAcc.id=newAcc.eid;
}else{
newAcc.childLrn=document.getElementById('sChild').value;
newAcc.childName='Your Child';
if(!newAcc.childLrn){toast('Please enter child LRN.','er');return}
}
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
function tdTab(el,id){el.parentElement.querySelectorAll('button').forEach(function(b){b.className=''});el.className='act';['tdClasses','tdGrade','tdAnnounce'].forEach(function(x){document.getElementById(x).style.display=x===id?'block':'none'})}
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


var ALL_SUBJECTS = ['Filipino','English','Mathematics','Science','AP','EsP','TLE','Music & Arts','PE & Health'];
function downloadTemplate() {
  var cls = document.getElementById('gradeClass').value;
  
  var students = loadData('students', DEFAULT_STUDENTS);
  var classStudents = students.filter(function(s) { return s.grade === cls && s.status === 'Active'; });
  if (classStudents.length === 0) {
    classStudents = students.filter(function(s) { return s.status === 'Active'; });
  }
  
  var csv = 'LRN,Name,' + ALL_SUBJECTS.join(',') + '\n';
  classStudents.forEach(function(s) {
    csv += s.lrn + ',' + s.name;
    ALL_SUBJECTS.forEach(function() { csv += ','; });
    csv += '\n';
  });
  
  var blob = new Blob([csv], {type: 'text/csv'});
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
    
    var header = lines[0].split(',').map(function(h) { return h.trim(); });
    if (header.length < 4) {
      showUploadStatus('Error: CSV must have LRN, Name, and at least one subject column.', 'error');
      return;
    }
    
    var records = [];
    var errors = [];
    for (var i = 1; i < lines.length; i++) {
      var row = lines[i].split(',');
      if (!row[0] || !row[0].trim()) continue;
      
      var lrn = row[0].trim();
      var name = row[1] ? row[1].trim() : '';
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
      
      // Auto-compute MAPEH
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
    var allSubjects = ALL_SUBJECTS.concat(['MAPEH']);
    
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
  reader.readAsText(file);
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
  
  var allSubjects = ALL_SUBJECTS.concat(['MAPEH']);
  var html = '<h4 style="font-size:15px;margin-bottom:12px">&#128202; Grades &mdash; ' + cls + '</h4>';
  html += '<div style="overflow-x:auto"><table><thead><tr><th>LRN</th><th>Name</th>';
  allSubjects.forEach(function(s) {
    var label = s === 'Mathematics' ? 'Math' : s === 'Music & Arts' ? 'M&A' : s === 'PE & Health' ? 'PE' : s;
    html += '<th style="font-size:11px">' + label + '</th>';
  });
  html += '<th>Avg</th><th>Remarks</th></tr></thead><tbody>';
  
  lrns.forEach(function(lrn) {
    var r = data[lrn];
    var g = r.grades || {};
    html += '<tr><td style="font-family:monospace;font-size:11px">' + lrn + '</td><td style="font-size:12px">' + r.name + '</td>';
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
  
  var allSubjects = ['Filipino','English','Mathematics','Science','AP','EsP','TLE','Music & Arts','PE & Health','MAPEH'];
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
  if (classStudents.length === 0) {
    classStudents = students.filter(function(s) { return s.status === 'Active'; });
  }
  
  var csv = 'LRN,Name,Days Present,Days Absent,Days Late,Total School Days\n';
  classStudents.forEach(function(s) {
    csv += s.lrn + ',' + s.name + ',,,,\n';
  });
  
  var blob = new Blob([csv], {type: 'text/csv'});
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
      var row = lines[i].split(',');
      if (!row[0] || !row[0].trim()) continue;
      
      var lrn = row[0].trim();
      var name = row[1] ? row[1].trim() : '';
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
  reader.readAsText(file);
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
  
  lrns.forEach(function(lrn) {
    var r = data[lrn];
    var rateColor = r.rate >= 90 ? '#22c55e' : (r.rate >= 80 ? '#f59e0b' : '#ef4444');
    html += '<tr><td style="font-family:monospace;font-size:11px">' + lrn + '</td>';
    html += '<td style="font-size:12px">' + r.name + '</td>';
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

// Hook into login to load grades
var _origLogin = doLogin;
doLogin = function() {
  _origLogin();
  if (curUser) {
    setTimeout(function() { loadStudentGrades(); loadStudentAttendance(); }, 100);
  }
};
