var N, E, S, T, P, SETTINGS;

function initData() {
  N = loadData('news', DEFAULT_NEWS);
  E = loadData('events', DEFAULT_EVENTS);
  S = loadData('students', DEFAULT_STUDENTS);
  T = loadData('teachers', DEFAULT_TEACHERS);
  P = loadData('pending', DEFAULT_PENDING);
  SETTINGS = loadData('settings', DEFAULT_SETTINGS);
}

function initFromFirebase(callback) {
  loadAllFromFirebase(function() {
    initData();
    // Save defaults to Firebase if they don't exist yet
    if (!_cache['news']) saveData('news', N);
    if (!_cache['events']) saveData('events', E);
    if (!_cache['students']) saveData('students', S);
    if (!_cache['teachers']) saveData('teachers', T);
    if (!_cache['pending']) saveData('pending', P);
    if (!_cache['settings']) saveData('settings', SETTINGS);
    console.log('Admin data initialized!');
    if (callback) callback();
    // Listen for real-time changes (e.g. new signups from portal)
    listenForChanges(function() {
      N = loadData('news', DEFAULT_NEWS);
      E = loadData('events', DEFAULT_EVENTS);
      S = loadData('students', DEFAULT_STUDENTS);
      T = loadData('teachers', DEFAULT_TEACHERS);
      P = loadData('pending', DEFAULT_PENDING);
      SETTINGS = loadData('settings', DEFAULT_SETTINGS);
      renderAll();
      console.log('Admin auto-refreshed from Firebase!');
    });
  });
}

function doLogin(){
  if(document.getElementById('lu').value==='admin'&&document.getElementById('lp').value==='admin123'){
    document.getElementById('loginPage').style.display='none';
    document.getElementById('app').classList.add('act');
    initFromFirebase(function() {
      renderAll();
      toast('Welcome back, Admin! Connected to Firebase.','su');
    });
  }else{toast('Invalid credentials!','er')}
}
function doLogout(){document.getElementById('app').classList.remove('act');document.getElementById('loginPage').style.display='flex'}
document.getElementById('lp').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin()});

function go(p,el){
  document.querySelectorAll('.pg').forEach(function(x){x.classList.remove('act')});
  document.getElementById('pg-'+p).classList.add('act');
  document.querySelectorAll('.sl').forEach(function(x){x.classList.remove('act')});
  el.classList.add('act');
  var t={dash:'Dashboard',news:'News & Announcements',events:'Events & Calendar',students:'Student Management',teachers:'Teachers & Staff',pending:'Pending Signups',resources:'Teacher Resources',settings:'Portal Settings'};
  document.getElementById('pt').textContent=t[p]||p;
  document.getElementById('sidebar').classList.remove('open');
}

function renderAll(){rN();rE();rS();rT();rP();uS();loadSettings();loadResources();loadGallery();loadAchievements();loadHistory();loadAlumni();loadDTRDashboard();setTimeout(updateDashChart,100)}
function uS(){
  document.getElementById('sS').textContent=S.length.toLocaleString();
  document.getElementById('sT').textContent=T.length;
  document.getElementById('sN').textContent=N.filter(function(x){return x.status==='Published'}).length;
  document.getElementById('sP').textContent=P.length;
  document.getElementById('pendCount').textContent=P.length;
}

function rN(){document.getElementById('nB').innerHTML=N.map(function(n){return '<tr><td><strong>'+n.title+'</strong></td><td><span class="badge '+(n.cat==='Achievement'?'b-fe':'b-pu')+'">'+n.cat+'</span></td><td>'+formatDate(n.date)+'</td><td><span class="badge '+(n.status==='Published'?'b-ac':'b-dr')+'">'+n.status+'</span></td><td><div class="ab"><button class="abtn" title="Edit" onclick="edN('+n.id+')">&#9998;</button><button class="abtn del" title="Delete" onclick="del(\'n\','+n.id+')">&#128465;</button></div></td></tr>'}).join('')}

function rE(){document.getElementById('eB').innerHTML=E.map(function(e){return '<tr><td><strong>'+e.name+'</strong></td><td>'+formatDate(e.date)+'</td><td>'+e.time+'</td><td>'+(e.venue||'')+'</td><td><span class="badge b-ac">'+e.status+'</span></td><td><div class="ab"><button class="abtn" title="Edit" onclick="edE('+e.id+')">&#9998;</button><button class="abtn del" title="Delete" onclick="del(\'e\','+e.id+')">&#128465;</button></div></td></tr>'}).join('')}

function rS(){
  document.getElementById('sB').innerHTML=S.map(function(s){
    return '<tr><td><input type="checkbox" class="sCb" value="'+s.id+'" onchange="updateSelectedCount()"></td><td style="font-family:monospace;font-size:12px">'+s.lrn+'</td><td><strong>'+s.name+'</strong></td><td>'+s.grade+'</td><td>'+s.contact+'</td><td><span class="badge '+(s.status==='Active'?'b-ac':'b-in')+'">'+s.status+'</span></td><td><div class="ab"><button class="abtn" title="Edit" onclick="edS('+s.id+')">&#9998;</button><button class="abtn del" title="Delete" onclick="del(\'s\','+s.id+')">&#128465;</button></div></td></tr>';
  }).join('');
  populateSectionFilter();
  updateSelectedCount();
}

function rT(){document.getElementById('tB').innerHTML=T.map(function(t){return '<tr><td style="font-family:monospace;font-size:12px">'+t.eid+'</td><td><strong>'+t.name+'</strong></td><td>'+t.dept+'</td><td>'+t.pos+'</td><td>'+t.contact+'</td><td><div class="ab"><button class="abtn" title="Edit" onclick="edT('+t.id+')">&#9998;</button><button class="abtn del" title="Delete" onclick="del(\'t\','+t.id+')">&#128465;</button></div></td></tr>'}).join('')}

function rP(){document.getElementById('pB').innerHTML=P.map(function(p){return '<tr><td><strong>'+p.name+'</strong></td><td><span class="badge b-pe">'+p.type+'</span></td><td>'+p.email+'</td><td style="font-family:monospace;font-size:12px">'+p.idnum+'</td><td>'+formatDate(p.date)+'</td><td><div class="ab"><button class="abtn apv" title="Approve" onclick="apv('+p.id+')">&#10003;</button><button class="abtn del" title="Reject" onclick="rej('+p.id+')">&#10005;</button></div></td></tr>'}).join('')}

// === MODALS ===
function opM(t,b){document.getElementById('mT').textContent=t;document.getElementById('mB').innerHTML=b;document.getElementById('modal').classList.add('act')}
function clM(){document.getElementById('modal').classList.remove('act')}

function openNM(d){
  var x=d||{title:'',cat:'Announcement',date:new Date().toISOString().split('T')[0],status:'Draft',content:'',image:''};
  var e=!!d;
  var imgHtml='';
  if(x.image){imgHtml='<img src="'+x.image+'" style="max-width:200px;max-height:120px;border-radius:8px;border:1px solid var(--g2)">';}
  opM(e?'Edit News':'Add News',
    '<div class="fg"><label>Title</label><input id="mf1" value="'+x.title+'"></div>'+
    '<div class="fg-row"><div class="fg"><label>Category</label><select id="mf2">'+
    '<option'+(x.cat==='Announcement'?' selected':'')+'>Announcement</option>'+
    '<option'+(x.cat==='Achievement'?' selected':'')+'>Achievement</option>'+
    '<option'+(x.cat==='Academic'?' selected':'')+'>Academic</option>'+
    '<option'+(x.cat==='Community'?' selected':'')+'>Community</option>'+
    '</select></div><div class="fg"><label>Date</label><input type="date" id="mf3" value="'+x.date+'"></div></div>'+
    '<div class="fg"><label>Image (optional)</label>'+
    '<div style="display:flex;gap:10px;align-items:center">'+
    '<label class="btn btn-s btn-sm" style="cursor:pointer">&#128247; Choose Image '+
    '<input type="file" id="mfImg" accept="image/*" onchange="previewImg(event)" style="display:none">'+
    '</label><span id="imgName" style="font-size:12px;color:var(--g5)">'+(x.image?'Has image':'No image selected')+'</span></div>'+
    '<div id="imgPreview" style="margin-top:8px">'+imgHtml+'</div>'+
    '<input type="hidden" id="mfImgData" value="'+(x.image||'')+'">'+
    '</div>'+
    '<div class="fg"><label>Content</label><textarea id="mf4" placeholder="Write content...">'+(x.content||'')+'</textarea></div>'+
    '<div class="fg"><label>Status</label><select id="mf5">'+
    '<option'+(x.status==='Published'?' selected':'')+'>Published</option>'+
    '<option'+(x.status==='Draft'?' selected':'')+'>Draft</option>'+
    '</select></div>'+
    '<div style="display:flex;gap:10px;margin-top:18px">'+
    '<button class="btn btn-p" onclick="svN('+(e?x.id:'null')+')">'+(e?'Update':'Publish')+' &#10148;</button>'+
    '<button class="btn btn-s" onclick="clM()">Cancel</button></div>'
  );
}

function openEM(d){var x=d||{name:'',date:new Date().toISOString().split('T')[0],time:'8:00 AM',venue:'',status:'Upcoming',desc:''};var e=!!d;opM(e?'Edit Event':'Add Event','<div class="fg"><label>Event Name</label><input id="mf1" value="'+x.name+'"></div><div class="fg-row"><div class="fg"><label>Date</label><input type="date" id="mf2" value="'+x.date+'"></div><div class="fg"><label>Time</label><input id="mf3" value="'+x.time+'"></div></div><div class="fg"><label>Venue</label><input id="mf4" value="'+(x.venue||'')+'"></div><div class="fg"><label>Description</label><input id="mf6" value="'+(x.desc||'')+'"></div><div class="fg"><label>Status</label><select id="mf5"><option'+(x.status==='Upcoming'?' selected':'')+'>Upcoming</option><option'+(x.status==='Completed'?' selected':'')+'>Completed</option><option'+(x.status==='Cancelled'?' selected':'')+'>Cancelled</option></select></div><div style="display:flex;gap:10px;margin-top:18px"><button class="btn btn-p" onclick="svE('+(e?x.id:'null')+')">'+(e?'Update':'Add')+' &#10148;</button><button class="btn btn-s" onclick="clM()">Cancel</button></div>')}

function openSM(d){var x=d||{lrn:'',name:'',grade:'',contact:'',status:'Active'};var e=!!d;opM(e?'Edit Student':'Add Student','<div class="fg"><label>LRN</label><input id="mf1" value="'+x.lrn+'" placeholder="136789012345"></div><div class="fg"><label>Full Name</label><input id="mf2" value="'+x.name+'"></div><div class="fg-row"><div class="fg"><label>Grade &amp; Section</label><input id="mf3" value="'+x.grade+'" placeholder="Grade 7 - Rizal"></div><div class="fg"><label>Contact</label><input id="mf4" value="'+x.contact+'" placeholder="09XX XXX XXXX"></div></div><div class="fg"><label>Status</label><select id="mf5"><option'+(x.status==='Active'?' selected':'')+'>Active</option><option'+(x.status==='Inactive'?' selected':'')+'>Inactive</option></select></div><div style="display:flex;gap:10px;margin-top:18px"><button class="btn btn-p" onclick="svS('+(e?x.id:'null')+')">'+(e?'Update':'Add')+' &#10148;</button><button class="btn btn-s" onclick="clM()">Cancel</button></div>')}

function openTM(d){var x=d||{eid:'',name:'',dept:'Mathematics',pos:'',contact:''};var e=!!d;opM(e?'Edit Teacher':'Add Teacher','<div class="fg-row"><div class="fg"><label>Employee ID</label><input id="mf1" value="'+x.eid+'" placeholder="T-2024-006"></div><div class="fg"><label>Full Name</label><input id="mf2" value="'+x.name+'"></div></div><div class="fg-row"><div class="fg"><label>Department</label><select id="mf3"><option'+(x.dept==='Mathematics'?' selected':'')+'>Mathematics</option><option'+(x.dept==='Science'?' selected':'')+'>Science</option><option'+(x.dept==='English'?' selected':'')+'>English</option><option'+(x.dept==='Filipino'?' selected':'')+'>Filipino</option><option'+(x.dept==='TLE'?' selected':'')+'>TLE</option><option'+(x.dept==='MAPEH'?' selected':'')+'>MAPEH</option><option'+(x.dept==='Araling Panlipunan'?' selected':'')+'>Araling Panlipunan</option><option'+(x.dept==='Values Education'?' selected':'')+'>Values Education</option></select></div><div class="fg"><label>Position</label><input id="mf4" value="'+x.pos+'" placeholder="Teacher I"></div></div><div class="fg"><label>Contact</label><input id="mf5v" value="'+x.contact+'" placeholder="09XX XXX XXXX"></div><div style="display:flex;gap:10px;margin-top:18px"><button class="btn btn-p" onclick="svT('+(e?x.id:'null')+')">'+(e?'Update':'Add')+' &#10148;</button><button class="btn btn-s" onclick="clM()">Cancel</button></div>')}

// === SAVE (with localStorage sync) ===
function svN(eid){var o={title:document.getElementById('mf1').value,cat:document.getElementById('mf2').value,date:document.getElementById('mf3').value,content:document.getElementById('mf4').value,status:document.getElementById('mf5').value,image:(document.getElementById('mfImgData')?document.getElementById('mfImgData').value:'')||''};if(!o.title){toast('Enter title','er');return};if(eid){var i=N.findIndex(function(x){return x.id===eid});if(i>-1)N[i]=Object.assign(N[i],o)}else{o.id=getNextId(N);N.unshift(o)};saveData('news',N);clM();rN();uS();toast(eid?'News updated! Portal synced.':'News published! Portal synced.','su')}

function svE(eid){var o={name:document.getElementById('mf1').value,date:document.getElementById('mf2').value,time:document.getElementById('mf3').value,venue:document.getElementById('mf4').value,desc:document.getElementById('mf6')?document.getElementById('mf6').value:'',status:document.getElementById('mf5').value};if(!o.name){toast('Enter event name','er');return};if(eid){var i=E.findIndex(function(x){return x.id===eid});if(i>-1)E[i]=Object.assign(E[i],o)}else{o.id=getNextId(E);E.unshift(o)};saveData('events',E);clM();rE();toast(eid?'Event updated! Portal synced.':'Event added! Portal synced.','su')}

function svS(eid){var o={lrn:document.getElementById('mf1').value,name:document.getElementById('mf2').value,grade:document.getElementById('mf3').value,contact:document.getElementById('mf4').value,status:document.getElementById('mf5').value};if(!o.name){toast('Enter name','er');return};if(eid){var i=S.findIndex(function(x){return x.id===eid});if(i>-1)S[i]=Object.assign(S[i],o)}else{o.id=getNextId(S);S.unshift(o)};saveData('students',S);clM();rS();uS();toast(eid?'Student updated!':'Student added!','su')}

function svT(eid){var o={eid:document.getElementById('mf1').value,name:document.getElementById('mf2').value,dept:document.getElementById('mf3').value,pos:document.getElementById('mf4').value,contact:document.getElementById('mf5v')?document.getElementById('mf5v').value:''};if(!o.name){toast('Enter name','er');return};if(eid){var i=T.findIndex(function(x){return x.id===eid});if(i>-1)T[i]=Object.assign(T[i],o)}else{o.id=getNextId(T);T.unshift(o)};saveData('teachers',T);clM();rT();uS();toast(eid?'Teacher updated!':'Teacher added!','su')}

function edN(id){var d=N.find(function(x){return x.id===id});if(d)openNM(d)}
function edE(id){var d=E.find(function(x){return x.id===id});if(d)openEM(d)}
function edS(id){var d=S.find(function(x){return x.id===id});if(d)openSM(d)}
function edT(id){var d=T.find(function(x){return x.id===id});if(d)openTM(d)}

function del(type,id){if(!confirm('Delete this item?'))return;if(type==='n'){N=N.filter(function(x){return x.id!==id});saveData('news',N);rN()}if(type==='e'){E=E.filter(function(x){return x.id!==id});saveData('events',E);rE()}if(type==='s'){S=S.filter(function(x){return x.id!==id});saveData('students',S);rS()}if(type==='t'){T=T.filter(function(x){return x.id!==id});saveData('teachers',T);rT()}uS();toast('Deleted & synced','su')}

function apv(id){
  var p=P.find(function(x){return x.id===id});
  if(!p) return;
  
  if(p.type==='Student'){
    opM('Approve Student: '+p.name,
      '<p style="margin-bottom:16px;color:var(--g5)">Assign details for <strong>'+p.name+'</strong> before approving:</p>'+
      '<div class="fg"><label>LRN</label><input id="apvLrn" value="'+p.idnum+'"></div>'+
      '<div class="fg-row"><div class="fg"><label>Grade Level &amp; Section</label><select id="apvGrade">' +
      (function(){ var secs=getSections(); var opts=''; secs.forEach(function(s){ var name=typeof s==='object'?s.name:s; opts+='<option value="'+name+'">'+name+'</option>'; }); return opts; })() +
      '</select></div>'+
      '<div class="fg"><label>Status</label><select id="apvStatus"><option>Active</option><option>Inactive</option></select></div></div>'+
      '<div style="display:flex;gap:10px;margin-top:18px">'+
      '<button class="btn btn-p" onclick="confirmApvStudent('+id+')">&#10003; Approve &amp; Add to Students</button>'+
      '<button class="btn btn-s" onclick="clM()">Cancel</button></div>'
    );
  } else if(p.type==='Teacher'){
    opM('Approve Teacher: '+p.name,
      '<p style="margin-bottom:16px;color:var(--g5)">Assign details for <strong>'+p.name+'</strong> before approving:</p>'+
      '<div class="fg-row"><div class="fg"><label>Employee ID</label><input id="apvEid" value="'+p.idnum+'"></div>'+
      '<div class="fg"><label>Full Name</label><input id="apvName" value="'+p.name+'"></div></div>'+
      '<div class="fg-row"><div class="fg"><label>Department</label><select id="apvDept">'+
      '<option>Mathematics</option><option>Science</option><option>English</option><option>Filipino</option>'+
      '<option>TLE</option><option>MAPEH</option><option>Araling Panlipunan</option><option>Values Education</option>'+
      '<option>Senior High - ABM</option><option>Senior High - HUMSS</option><option>Senior High - STEM</option><option>Senior High - TVL</option>'+
      '</select></div>'+
      '<div class="fg"><label>Position</label><select id="apvPos">'+
      '<option>Teacher I</option><option>Teacher II</option><option>Teacher III</option>'+
      '<option>Head Teacher I</option><option>Head Teacher III</option>'+
      '<option>Master Teacher I</option><option>Master Teacher II</option>'+
      '</select></div></div>'+
      '<div style="display:flex;gap:10px;margin-top:18px">'+
      '<button class="btn btn-p" onclick="confirmApvTeacher('+id+')">&#10003; Approve &amp; Add to Teachers</button>'+
      '<button class="btn btn-s" onclick="clM()">Cancel</button></div>'
    );
  } else if(p.type==='Parent'){
    if(confirm('Approve '+p.name+' as Parent? They will be able to login and view their child\'s records.')){
      P=P.filter(function(x){return x.id!==id});
      saveData('pending',P);
      rP();uS();
      toast(p.name+' (Parent) approved! Can now login.','su');
    }
  }
}

function confirmApvStudent(id){
  var p=P.find(function(x){return x.id===id});
  if(!p) return;
  var lrn=document.getElementById('apvLrn').value;
  var grade=document.getElementById('apvGrade').value||'TBA';
  var status=document.getElementById('apvStatus').value;
  S.unshift({id:getNextId(S),lrn:lrn,name:p.name,grade:grade,contact:p.email,status:status});
  saveData('students',S);
  P=P.filter(function(x){return x.id!==id});
  saveData('pending',P);
  clM();rS();rP();uS();
  toast(p.name+' approved and added to Students!','su');
}

function confirmApvTeacher(id){
  var p=P.find(function(x){return x.id===id});
  if(!p) return;
  var eid=document.getElementById('apvEid').value;
  var name=document.getElementById('apvName').value||p.name;
  var dept=document.getElementById('apvDept').value;
  var pos=document.getElementById('apvPos').value;
  T.unshift({id:getNextId(T),eid:eid,name:name,dept:dept,pos:pos,contact:p.email});
  saveData('teachers',T);
  P=P.filter(function(x){return x.id!==id});
  saveData('pending',P);
  clM();rT();rP();uS();
  toast(p.name+' approved and added to Teachers!','su');
}
function rej(id){if(!confirm('Reject this signup?'))return;P=P.filter(function(x){return x.id!==id});saveData('pending',P);rP();uS();toast('Signup rejected','su')}
function approveAll(){
  if(!confirm('Approve all '+P.length+' pending signups?'))return;
  P.forEach(function(p){
    if(p.type==='Student'){
      S.unshift({id:getNextId(S),lrn:p.idnum,name:p.name,grade:'TBA',contact:p.email,status:'Active'});
    } else if(p.type==='Teacher'){
      T.unshift({id:getNextId(T),eid:p.idnum,name:p.name,dept:'TBA',pos:'Teacher I',contact:p.email});
    }
  });
  saveData('students',S);
  saveData('teachers',T);
  P=[];
  saveData('pending',P);
  rP();rS();rT();uS();
  toast('All signups approved!','su');
}

function ft(tid,q){var rows=document.getElementById(tid).querySelectorAll('tbody tr');var ql=q.toLowerCase();rows.forEach(function(r){r.style.display=r.textContent.toLowerCase().indexOf(ql)>-1?'':'none'})}

function loadSettings(){
  document.getElementById('setName').value=SETTINGS.schoolName||'';
  document.getElementById('setId').value=SETTINGS.schoolId||'';
  document.getElementById('setSY').value=SETTINGS.schoolYear||'';
  document.getElementById('setAddr').value=SETTINGS.address||'';
  document.getElementById('setPhone').value=SETTINGS.phone||'';
  document.getElementById('setEmail').value=SETTINGS.email||'';
  document.getElementById('setMotto').value=SETTINGS.motto||'';
  document.getElementById('setPrincipal').value=SETTINGS.principal||'';
  document.getElementById('setDiv').value=SETTINGS.division||'';
  document.getElementById('setStat1').value=SETTINGS.stat1||'1,200+';
  document.getElementById('setStat2').value=SETTINGS.stat2||'65+';
  document.getElementById('setStat3').value=SETTINGS.stat3||'17';
  document.getElementById('setStat4').value=SETTINGS.stat4||'98%';
  if(document.getElementById('setG7'))document.getElementById('setG7').value=SETTINGS.g7||'210';
  renderSections();
  if(document.getElementById('setG8'))document.getElementById('setG8').value=SETTINGS.g8||'198';
  if(document.getElementById('setG9'))document.getElementById('setG9').value=SETTINGS.g9||'185';
  if(document.getElementById('setG10'))document.getElementById('setG10').value=SETTINGS.g10||'172';
  if(document.getElementById('setG11'))document.getElementById('setG11').value=SETTINGS.g11||'250';
  if(document.getElementById('setG12'))document.getElementById('setG12').value=SETTINGS.g12||'232';
}
function saveSettings(){
  SETTINGS={schoolName:document.getElementById('setName').value,schoolId:document.getElementById('setId').value,schoolYear:document.getElementById('setSY').value,address:document.getElementById('setAddr').value,phone:document.getElementById('setPhone').value,email:document.getElementById('setEmail').value,motto:document.getElementById('setMotto').value,principal:document.getElementById('setPrincipal').value,division:document.getElementById('setDiv').value,stat1:document.getElementById('setStat1').value,stat2:document.getElementById('setStat2').value,stat3:document.getElementById('setStat3').value,stat4:document.getElementById('setStat4').value,
  sections:SETTINGS.sections||[],g7:document.getElementById('setG7')?document.getElementById('setG7').value:'210',
  g8:document.getElementById('setG8')?document.getElementById('setG8').value:'198',
  g9:document.getElementById('setG9')?document.getElementById('setG9').value:'185',
  g10:document.getElementById('setG10')?document.getElementById('setG10').value:'172',
  g11:document.getElementById('setG11')?document.getElementById('setG11').value:'250',
  g12:document.getElementById('setG12')?document.getElementById('setG12').value:'232'};
  saveData('settings',SETTINGS);toast('Settings saved & synced!','su');
}
function resetData(){if(!confirm('Reset ALL data to defaults? This cannot be undone.'))return;resetAllData();initData();renderAll();toast('All data reset to defaults!','su')}

var tt;function toast(m,c){var t=document.getElementById('toast');t.textContent=m;t.className='toast '+c+' show';clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('show')},3000)}


function previewImg(event){
  var file=event.target.files[0];
  if(!file)return;
  if(file.size>5000000){toast('Image too large! Max 5MB.','er');return}
  document.getElementById('imgName').textContent=file.name;
  
  var reader=new FileReader();
  reader.onload=function(e){
    var img=new Image();
    img.onload=function(){
      var canvas=document.createElement('canvas');
      var maxW=800,maxH=600;
      var w=img.width,h=img.height;
      if(w>maxW){h=h*(maxW/w);w=maxW}
      if(h>maxH){w=w*(maxH/h);h=maxH}
      canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      var dataUrl=canvas.toDataURL('image/jpeg',0.7);
      document.getElementById('mfImgData').value=dataUrl;
      document.getElementById('imgPreview').innerHTML='<img src="'+dataUrl+'" style="max-width:200px;max-height:120px;border-radius:8px;border:1px solid var(--g2)">';
      console.log('Image compressed:',Math.round(dataUrl.length/1024)+'KB');
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}


function updateDashChart(){
  var bars=document.querySelectorAll('.bcol');
  if(!bars||bars.length<6)return;
  var vals=[SETTINGS.g7||'210',SETTINGS.g8||'198',SETTINGS.g9||'185',SETTINGS.g10||'172',SETTINGS.g11||'250',SETTINGS.g12||'232'];
  var max=0;
  vals.forEach(function(v){var n=parseInt(v)||0;if(n>max)max=n;});
  if(max===0)max=1;
  for(var i=0;i<6&&i<bars.length;i++){
    var bv=bars[i].querySelector('.bv');
    var bar=bars[i].querySelector('.bar');
    if(bv)bv.textContent=vals[i];
    if(bar)bar.style.height=Math.round((parseInt(vals[i])||0)/max*100)+'%';
  }
}


// ============================================
// SECTIONS MANAGEMENT
// ============================================
var DEFAULT_SECTIONS = [
  {name:'Grade 7 - Bonifacio',cluster:'JHS'},{name:'Grade 8 - Luna',cluster:'JHS'},
  {name:'Grade 9 - Mabini',cluster:'JHS'},{name:'Grade 10 - Rizal',cluster:'JHS'},
  {name:'Grade 11 - ABM',cluster:'Business'},{name:'Grade 11 - HUMSS',cluster:'ASSH'},
  {name:'Grade 12 - ABM',cluster:'Business'},{name:'Grade 12 - HUMSS',cluster:'ASSH'}
];

function getSections() {
  var secs = (SETTINGS && SETTINGS.sections && SETTINGS.sections.length > 0) ? SETTINGS.sections : DEFAULT_SECTIONS;
  // Convert old string format to new object format
  return secs.map(function(s) {
    if (typeof s === 'string') return {name: s, cluster: (s.indexOf('Grade 7')>-1||s.indexOf('Grade 8')>-1||s.indexOf('Grade 9')>-1||s.indexOf('Grade 10')>-1) ? 'JHS' : 'ASSH'};
    return s;
  });
}

function renderSections() {
  var el = document.getElementById('sectionsList');
  if (!el) return;
  var secs = getSections();
  var clusterColors = {JHS:'#e8733a',ASSH:'#7c3aed',Business:'#0891b2',STEM:'#059669',Sports:'#dc2626'};
  var html = '';
  secs.forEach(function(s, i) {
    var color = clusterColors[s.cluster] || '#666';
    html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--g1);border-radius:8px;margin-bottom:6px;border:1px solid var(--g2)">';
    html += '<span style="flex:1;font-size:14px">' + s.name + '</span>';
    html += '<span style="font-size:11px;padding:3px 8px;border-radius:12px;background:' + color + '20;color:' + color + ';font-weight:600">' + s.cluster + '</span>';
    html += '<button class="abtn del" title="Remove" onclick="removeSection(' + i + ')" style="width:28px;height:28px;font-size:12px">&#10005;</button>';
    html += '</div>';
  });
  if (secs.length === 0) {
    html = '<div style="text-align:center;padding:16px;color:var(--g5);font-size:13px">No sections added yet.</div>';
  }
  el.innerHTML = html;
}

function addSection() {
  var input = document.getElementById('newSection');
  var cluster = document.getElementById('newCluster').value;
  var name = input.value.trim();
  if (!name) { toast('Enter section name','er'); return; }
  
  if (!SETTINGS.sections) SETTINGS.sections = getSections().slice();
  
  // Check duplicate
  var dup = SETTINGS.sections.find(function(s) { return (typeof s === 'object' ? s.name : s) === name; });
  if (dup) { toast('Section already exists!','er'); return; }
  
  SETTINGS.sections.push({name: name, cluster: cluster});
  saveData('settings', SETTINGS);
  input.value = '';
  renderSections();
  toast(name + ' (' + cluster + ') added!', 'su');
}

function removeSection(index) {
  if (!SETTINGS.sections) SETTINGS.sections = getSections().slice();
  var sec = SETTINGS.sections[index];
  var name = typeof sec === 'object' ? sec.name : sec;
  if (!confirm('Remove "' + name + '"?')) return;
  SETTINGS.sections.splice(index, 1);
  saveData('settings', SETTINGS);
  renderSections();
  toast(name + ' removed', 'su');
}


// ============================================
// TEACHER RESOURCES MANAGEMENT
// ============================================

function loadResources() {
  var res = loadData('resources', {password:'', links:[]});
  var pwEl = document.getElementById('resPassword');
  if (pwEl) pwEl.value = res.password || '';
  renderResources();
}

function saveResPassword() {
  var res = loadData('resources', {password:'', links:[]});
  res.password = document.getElementById('resPassword').value;
  saveData('resources', res);
  toast('Password saved!', 'su');
}

function renderResources() {
  var res = loadData('resources', {password:'', links:[]});
  var links = res.links || [];
  var el = document.getElementById('resourcesList');
  if (!el) return;
  
  if (links.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--g5)"><div style="font-size:48px;margin-bottom:12px">&#128194;</div><p>No resources added yet. Click "+ Add Link" to add your first resource.</p></div>';
    return;
  }
  
  var html = '<table><thead><tr><th>Title</th><th>Category</th><th>Link</th><th>Actions</th></tr></thead><tbody>';
  links.forEach(function(l, i) {
    html += '<tr><td><strong>' + l.title + '</strong>';
    if (l.desc) html += '<br><span style="font-size:12px;color:var(--g5)">' + l.desc + '</span>';
    html += '</td>';
    html += '<td><span class="badge b-b">' + (l.category || 'General') + '</span></td>';
    html += '<td><a href="' + l.url + '" target="_blank" style="color:var(--p);font-size:13px">Open &#8599;</a></td>';
    html += '<td><div style="display:flex;gap:4px"><button class="abtn edt" onclick="editResource(' + i + ')">&#9998;</button><button class="abtn del" onclick="deleteResource(' + i + ')">&#128465;</button></div></td></tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function openAddResource(data) {
  var x = data || {title:'', url:'', category:'Modules', desc:''};
  var isEdit = !!data;
  var idx = isEdit ? (data._index || 0) : -1;
  opM(isEdit ? 'Edit Resource' : 'Add Resource Link',
    '<div class="fg"><label>Title</label><input id="resTitle" value="' + x.title + '" placeholder="e.g. Grade 7 Math Modules"></div>' +
    '<div class="fg"><label>Link / URL</label><input id="resUrl" value="' + x.url + '" placeholder="https://drive.google.com/..."></div>' +
    '<div class="fg-row"><div class="fg"><label>Category</label><select id="resCat">' +
    '<option' + (x.category === 'Modules' ? ' selected' : '') + '>Modules</option>' +
    '<option' + (x.category === 'Textbooks' ? ' selected' : '') + '>Textbooks</option>' +
    '<option' + (x.category === 'Handouts' ? ' selected' : '') + '>Handouts</option>' +
    '<option' + (x.category === 'Worksheets' ? ' selected' : '') + '>Worksheets</option>' +
    '<option' + (x.category === 'Training' ? ' selected' : '') + '>Training</option>' +
    '<option' + (x.category === 'Forms' ? ' selected' : '') + '>Forms</option>' +
    '<option' + (x.category === 'General' ? ' selected' : '') + '>General</option>' +
    '</select></div></div>' +
    '<div class="fg"><label>Description (optional)</label><input id="resDesc" value="' + (x.desc || '') + '" placeholder="Brief description"></div>' +
    '<div style="display:flex;gap:10px;margin-top:18px">' +
    '<button class="btn btn-p" onclick="saveResource(' + idx + ')">Save &#10148;</button>' +
    '<button class="btn btn-s" onclick="clM()">Cancel</button></div>'
  );
}

function saveResource(idx) {
  var title = document.getElementById('resTitle').value;
  var url = document.getElementById('resUrl').value;
  var cat = document.getElementById('resCat').value;
  var desc = document.getElementById('resDesc').value;
  if (!title || !url) { toast('Enter title and URL', 'er'); return; }
  
  var res = loadData('resources', {password:'', links:[]});
  if (!res.links) res.links = [];
  
  var link = {title: title, url: url, category: cat, desc: desc};
  
  if (idx >= 0) {
    res.links[idx] = link;
  } else {
    res.links.unshift(link);
  }
  
  saveData('resources', res);
  clM();
  renderResources();
  toast(idx >= 0 ? 'Resource updated!' : 'Resource added!', 'su');
}

function editResource(idx) {
  var res = loadData('resources', {password:'', links:[]});
  var link = res.links[idx];
  if (!link) return;
  link._index = idx;
  openAddResource(link);
}

function deleteResource(idx) {
  var res = loadData('resources', {password:'', links:[]});
  var link = res.links[idx];
  if (!confirm('Delete "' + link.title + '"?')) return;
  res.links.splice(idx, 1);
  saveData('resources', res);
  renderResources();
  toast('Resource deleted', 'su');
}

// ============================================
// PHOTO GALLERY MANAGEMENT
// ============================================
function loadGallery() {
  var data = loadData('gallery', []);
  var el = document.getElementById('galleryList');
  if (!el) return;
  if (data.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--g5)"><div style="font-size:48px;margin-bottom:12px">&#128248;</div><p>No albums yet. Click "+ Add Album" to add a photo album.</p></div>';
    return;
  }
  var html = '<table><thead><tr><th>Album Title</th><th>Category</th><th>Date</th><th>Actions</th></tr></thead><tbody>';
  data.forEach(function(a, i) {
    html += '<tr><td><strong>' + a.title + '</strong>';
    if (a.desc) html += '<br><span style="font-size:12px;color:var(--g5)">' + a.desc + '</span>';
    html += '</td><td><span class="badge b-pu">' + (a.cat || 'General') + '</span></td>';
    html += '<td>' + (a.date || '') + '</td>';
    html += '<td><div style="display:flex;gap:4px"><button class="abtn edt" onclick="editGallery(' + i + ')">&#9998;</button><button class="abtn del" onclick="deleteGallery(' + i + ')">&#128465;</button></div></td></tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function openGalleryM(data) {
  var x = data || {title:'',url:'',cover:'',cat:'Events',desc:'',date:new Date().toISOString().split('T')[0]};
  var idx = data ? (data._index || 0) : -1;
  opM(data ? 'Edit Album' : 'Add Photo Album',
    '<div class="fg"><label>Album Title</label><input id="gTitle" value="' + x.title + '" placeholder="e.g. Graduation 2026"></div>' +
    '<div class="fg"><label>Album Link (Google Drive / Facebook)</label><input id="gUrl" value="' + x.url + '" placeholder="https://drive.google.com/... or Facebook album link"></div>' +
    '<div class="fg"><label>Cover Image URL (optional)</label><input id="gCover" value="' + (x.cover||'') + '" placeholder="https://... direct image link"></div>' +
    '<div class="fg-row"><div class="fg"><label>Category</label><select id="gCat">' +
    '<option' + (x.cat==='Events'?' selected':'') + '>Events</option>' +
    '<option' + (x.cat==='Graduation'?' selected':'') + '>Graduation</option>' +
    '<option' + (x.cat==='Activities'?' selected':'') + '>Activities</option>' +
    '<option' + (x.cat==='Sports'?' selected':'') + '>Sports</option>' +
    '<option' + (x.cat==='General'?' selected':'') + '>General</option>' +
    '</select></div><div class="fg"><label>Date</label><input type="date" id="gDate" value="' + x.date + '"></div></div>' +
    '<div class="fg"><label>Description (optional)</label><input id="gDesc" value="' + (x.desc||'') + '"></div>' +
    '<div style="display:flex;gap:10px;margin-top:18px">' +
    '<button class="btn btn-p" onclick="saveGallery(' + idx + ')">Save &#10148;</button>' +
    '<button class="btn btn-s" onclick="clM()">Cancel</button></div>'
  );
}

function saveGallery(idx) {
  var o = {title:document.getElementById('gTitle').value,url:document.getElementById('gUrl').value,cover:document.getElementById('gCover').value,cat:document.getElementById('gCat').value,date:document.getElementById('gDate').value,desc:document.getElementById('gDesc').value};
  if (!o.title || !o.url) { toast('Enter title and link','er'); return; }
  var data = loadData('gallery', []);
  if (idx >= 0) data[idx] = o; else data.unshift(o);
  saveData('gallery', data);
  clM(); loadGallery();
  toast(idx >= 0 ? 'Album updated!' : 'Album added!', 'su');
}

function editGallery(i) { var d = loadData('gallery',[]); d[i]._index = i; openGalleryM(d[i]); }
function deleteGallery(i) { var d = loadData('gallery',[]); if(!confirm('Delete "'+d[i].title+'"?'))return; d.splice(i,1); saveData('gallery',d); loadGallery(); toast('Deleted','su'); }

// ============================================
// ACHIEVEMENTS MANAGEMENT
// ============================================
function loadAchievements() {
  var data = loadData('achievements', []);
  var el = document.getElementById('achieveList');
  if (!el) return;
  if (data.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--g5)"><div style="font-size:48px;margin-bottom:12px">&#127942;</div><p>No achievements yet. Click "+ Add Achievement" to showcase school awards.</p></div>';
    return;
  }
  var html = '<table><thead><tr><th>Achievement</th><th>Category</th><th>Year</th><th>Actions</th></tr></thead><tbody>';
  data.forEach(function(a, i) {
    html += '<tr><td><strong>' + a.title + '</strong>';
    if (a.desc) html += '<br><span style="font-size:12px;color:var(--g5)">' + a.desc + '</span>';
    html += '</td><td><span class="badge b-fe">' + (a.cat || 'General') + '</span></td>';
    html += '<td>' + (a.year || '') + '</td>';
    html += '<td><div style="display:flex;gap:4px"><button class="abtn edt" onclick="editAchieve(' + i + ')">&#9998;</button><button class="abtn del" onclick="deleteAchieve(' + i + ')">&#128465;</button></div></td></tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function openAchieveM(data) {
  var x = data || {title:'',desc:'',cat:'Academic',year:new Date().getFullYear(),icon:'🏆'};
  var idx = data ? (data._index || 0) : -1;
  opM(data ? 'Edit Achievement' : 'Add Achievement',
    '<div class="fg"><label>Achievement Title</label><input id="aTitle" value="' + x.title + '" placeholder="e.g. Regional Science Fair Champion"></div>' +
    '<div class="fg-row"><div class="fg"><label>Category</label><select id="aCat">' +
    '<option' + (x.cat==='Academic'?' selected':'') + '>Academic</option>' +
    '<option' + (x.cat==='Sports'?' selected':'') + '>Sports</option>' +
    '<option' + (x.cat==='Arts'?' selected':'') + '>Arts</option>' +
    '<option' + (x.cat==='Community'?' selected':'') + '>Community</option>' +
    '<option' + (x.cat==='School'?' selected':'') + '>School</option>' +
    '</select></div><div class="fg"><label>Year</label><input id="aYear" value="' + x.year + '" type="number"></div></div>' +
    '<div class="fg"><label>Description</label><textarea id="aDesc" placeholder="Details about the achievement...">' + (x.desc||'') + '</textarea></div>' +
    '<div style="display:flex;gap:10px;margin-top:18px">' +
    '<button class="btn btn-p" onclick="saveAchieve(' + idx + ')">Save &#10148;</button>' +
    '<button class="btn btn-s" onclick="clM()">Cancel</button></div>'
  );
}

function saveAchieve(idx) {
  var o = {title:document.getElementById('aTitle').value,cat:document.getElementById('aCat').value,year:document.getElementById('aYear').value,desc:document.getElementById('aDesc').value};
  if (!o.title) { toast('Enter title','er'); return; }
  var data = loadData('achievements', []);
  if (idx >= 0) data[idx] = o; else data.unshift(o);
  saveData('achievements', data);
  clM(); loadAchievements();
  toast(idx >= 0 ? 'Updated!' : 'Achievement added!', 'su');
}

function editAchieve(i) { var d = loadData('achievements',[]); d[i]._index = i; openAchieveM(d[i]); }
function deleteAchieve(i) { var d = loadData('achievements',[]); if(!confirm('Delete?'))return; d.splice(i,1); saveData('achievements',d); loadAchievements(); toast('Deleted','su'); }

// ============================================
// SCHOOL HISTORY MANAGEMENT
// ============================================
function loadHistory() {
  var data = loadData('history', []);
  var el = document.getElementById('historyList');
  if (!el) return;
  if (data.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--g5)"><div style="font-size:48px;margin-bottom:12px">&#128220;</div><p>No milestones yet. Click "+ Add Milestone" to build the school timeline.</p></div>';
    return;
  }
  var html = '<table><thead><tr><th>Year</th><th>Milestone</th><th>Actions</th></tr></thead><tbody>';
  data.sort(function(a,b){return (a.year||0)-(b.year||0);});
  data.forEach(function(a, i) {
    html += '<tr><td><strong>' + (a.year||'') + '</strong></td><td><strong>' + a.title + '</strong>';
    if (a.desc) html += '<br><span style="font-size:12px;color:var(--g5)">' + a.desc + '</span>';
    html += '</td><td><div style="display:flex;gap:4px"><button class="abtn edt" onclick="editHistory(' + i + ')">&#9998;</button><button class="abtn del" onclick="deleteHistory(' + i + ')">&#128465;</button></div></td></tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function openHistoryM(data) {
  var x = data || {year:'',title:'',desc:''};
  var idx = data ? (data._index || 0) : -1;
  opM(data ? 'Edit Milestone' : 'Add Milestone',
    '<div class="fg-row"><div class="fg"><label>Year</label><input id="hYear" value="' + (x.year||'') + '" type="number" placeholder="e.g. 2008"></div><div class="fg"><label>Title</label><input id="hTitle" value="' + x.title + '" placeholder="e.g. School Founded"></div></div>' +
    '<div class="fg"><label>Description</label><textarea id="hDesc" placeholder="Details about this milestone...">' + (x.desc||'') + '</textarea></div>' +
    '<div style="display:flex;gap:10px;margin-top:18px">' +
    '<button class="btn btn-p" onclick="saveHistory(' + idx + ')">Save &#10148;</button>' +
    '<button class="btn btn-s" onclick="clM()">Cancel</button></div>'
  );
}

function saveHistory(idx) {
  var o = {year:document.getElementById('hYear').value,title:document.getElementById('hTitle').value,desc:document.getElementById('hDesc').value};
  if (!o.title) { toast('Enter title','er'); return; }
  var data = loadData('history', []);
  if (idx >= 0) data[idx] = o; else data.push(o);
  saveData('history', data);
  clM(); loadHistory();
  toast(idx >= 0 ? 'Updated!' : 'Milestone added!', 'su');
}

function editHistory(i) { var d = loadData('history',[]); d[i]._index = i; openHistoryM(d[i]); }
function deleteHistory(i) { var d = loadData('history',[]); if(!confirm('Delete?'))return; d.splice(i,1); saveData('history',d); loadHistory(); toast('Deleted','su'); }

// ============================================
// ALUMNI MANAGEMENT
// ============================================
function loadAlumni() {
  var data = loadData('alumni', []);
  var el = document.getElementById('alumniList');
  if (!el) return;
  if (data.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--g5)"><div style="font-size:48px;margin-bottom:12px">&#127891;</div><p>No alumni batches yet. Click "+ Add Batch" to add alumni information.</p></div>';
    return;
  }
  var html = '<table><thead><tr><th>Batch</th><th>Title</th><th>Link</th><th>Actions</th></tr></thead><tbody>';
  data.sort(function(a,b){return (b.year||0)-(a.year||0);});
  data.forEach(function(a, i) {
    html += '<tr><td><strong>Batch ' + (a.year||'') + '</strong></td><td>' + (a.title||'') + '';
    if (a.desc) html += '<br><span style="font-size:12px;color:var(--g5)">' + a.desc + '</span>';
    html += '</td><td>' + (a.url ? '<a href="'+a.url+'" target="_blank" style="color:var(--p)">Open &#8599;</a>' : '-') + '</td>';
    html += '<td><div style="display:flex;gap:4px"><button class="abtn edt" onclick="editAlumni(' + i + ')">&#9998;</button><button class="abtn del" onclick="deleteAlumni(' + i + ')">&#128465;</button></div></td></tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function openAlumniM(data) {
  var x = data || {year:'',title:'',url:'',desc:''};
  var idx = data ? (data._index || 0) : -1;
  opM(data ? 'Edit Batch' : 'Add Alumni Batch',
    '<div class="fg-row"><div class="fg"><label>Batch Year</label><input id="alYear" value="' + (x.year||'') + '" type="number" placeholder="e.g. 2024"></div><div class="fg"><label>Batch Name / Title</label><input id="alTitle" value="' + (x.title||'') + '" placeholder="e.g. Batch 2024 - Resilient"></div></div>' +
    '<div class="fg"><label>Link (Facebook Group / Google Form)</label><input id="alUrl" value="' + (x.url||'') + '" placeholder="https://facebook.com/groups/..."></div>' +
    '<div class="fg"><label>Description / Notable Alumni</label><textarea id="alDesc" placeholder="e.g. 120 graduates, top performer: Juan Dela Cruz">' + (x.desc||'') + '</textarea></div>' +
    '<div style="display:flex;gap:10px;margin-top:18px">' +
    '<button class="btn btn-p" onclick="saveAlumni(' + idx + ')">Save &#10148;</button>' +
    '<button class="btn btn-s" onclick="clM()">Cancel</button></div>'
  );
}

function saveAlumni(idx) {
  var o = {year:document.getElementById('alYear').value,title:document.getElementById('alTitle').value,url:document.getElementById('alUrl').value,desc:document.getElementById('alDesc').value};
  if (!o.year) { toast('Enter batch year','er'); return; }
  var data = loadData('alumni', []);
  if (idx >= 0) data[idx] = o; else data.unshift(o);
  saveData('alumni', data);
  clM(); loadAlumni();
  toast(idx >= 0 ? 'Updated!' : 'Batch added!', 'su');
}

function editAlumni(i) { var d = loadData('alumni',[]); d[i]._index = i; openAlumniM(d[i]); }
function deleteAlumni(i) { var d = loadData('alumni',[]); if(!confirm('Delete?'))return; d.splice(i,1); saveData('alumni',d); loadAlumni(); toast('Deleted','su'); }

// ============================================
// STUDENT BULK ACTIONS
// ============================================

function populateSectionFilter() {
  var el = document.getElementById('filterSection');
  if (!el) return;
  var sections = {};
  S.forEach(function(s) { if (s.grade) sections[s.grade] = true; });
  var current = el.value;
  el.innerHTML = '<option value="">All Sections (' + S.length + ')</option>';
  Object.keys(sections).sort().forEach(function(sec) {
    var count = S.filter(function(s) { return s.grade === sec; }).length;
    el.innerHTML += '<option value="' + sec + '">' + sec + ' (' + count + ')</option>';
  });
  if (current) el.value = current;
}

function filterStudents() {
  var sec = document.getElementById('filterSection').value;
  var rows = document.querySelectorAll('#sB tr');
  rows.forEach(function(row) {
    if (!sec) { row.style.display = ''; return; }
    var gradeCell = row.cells[3];
    if (gradeCell && gradeCell.textContent.trim() === sec) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

function toggleAllStudents(cb) {
  var checkboxes = document.querySelectorAll('.sCb');
  checkboxes.forEach(function(c) {
    if (c.closest('tr').style.display !== 'none') {
      c.checked = cb.checked;
    }
  });
  updateSelectedCount();
}

function updateSelectedCount() {
  var checked = document.querySelectorAll('.sCb:checked').length;
  var el = document.getElementById('selectedCount');
  if (el) el.textContent = checked > 0 ? checked + ' selected' : '';
}

function getSelectedIds() {
  var ids = [];
  document.querySelectorAll('.sCb:checked').forEach(function(c) {
    ids.push(parseInt(c.value));
  });
  return ids;
}

function deleteSelected() {
  var ids = getSelectedIds();
  if (ids.length === 0) { toast('No students selected. Check the boxes first.', 'er'); return; }
  if (!confirm('Delete ' + ids.length + ' selected student(s)? This cannot be undone.')) return;
  S = S.filter(function(s) { return ids.indexOf(s.id) === -1; });
  saveData('students', S);
  rS(); uS();
  document.getElementById('selectAllStudents').checked = false;
  toast(ids.length + ' student(s) deleted!', 'su');
}

function deleteBySection() {
  var sec = document.getElementById('filterSection').value;
  if (!sec) { toast('Select a section first from the dropdown.', 'er'); return; }
  var count = S.filter(function(s) { return s.grade === sec; }).length;
  if (count === 0) { toast('No students in this section.', 'er'); return; }
  if (!confirm('Delete ALL ' + count + ' students in "' + sec + '"? This cannot be undone.')) return;
  S = S.filter(function(s) { return s.grade !== sec; });
  saveData('students', S);
  document.getElementById('filterSection').value = '';
  rS(); uS();
  toast(count + ' students in ' + sec + ' deleted!', 'su');
}

function clearAllStudents() {
  if (S.length === 0) { toast('No students to delete.', 'er'); return; }
  if (!confirm('DELETE ALL ' + S.length + ' STUDENTS? This cannot be undone!')) return;
  if (!confirm('Are you REALLY sure? This will remove ALL student records.')) return;
  S = [];
  saveData('students', S);
  rS(); uS();
  toast('All students cleared!', 'su');
}

// ============================================
// DTR SYSTEM MANAGEMENT
// ============================================

function generateDailyCode() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code = '';
  for (var i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  
  var today = new Date();
  var key = today.getFullYear() + '-' + (today.getMonth()+1<10?'0':'') + (today.getMonth()+1) + '-' + (today.getDate()<10?'0':'') + today.getDate();
  
  saveData('dtr_daily_code', {code: code, date: key});
  
  document.getElementById('todayQRCode').textContent = code;
  document.getElementById('todayQRDate').textContent = 'Generated: ' + key;
  renderQRImage(code);
  toast('Daily code generated: ' + code, 'su');
}

function loadDTRDashboard() {
  var todayCode = loadData('dtr_daily_code', {});
  var today = new Date();
  var key = today.getFullYear() + '-' + (today.getMonth()+1<10?'0':'') + (today.getMonth()+1) + '-' + (today.getDate()<10?'0':'') + today.getDate();
  
  var codeEl = document.getElementById('todayQRCode');
  var dateEl = document.getElementById('todayQRDate');
  if (codeEl) {
    if (todayCode.code && todayCode.date === key) {
      codeEl.textContent = todayCode.code;
      dateEl.textContent = 'Date: ' + key;
      renderQRImage(todayCode.code);
    } else {
      codeEl.textContent = '------';
      dateEl.textContent = 'No code generated today. Click Generate.';
    }
  }
  
  // Set date picker to today
  var datePicker = document.getElementById('dtrViewDate');
  if (datePicker) datePicker.value = key;
  
  // Load today's count
  var records = loadData('dtr_' + key, {});
  var countEl = document.getElementById('todayDTRCount');
  if (countEl) countEl.textContent = Object.keys(records).length;
  
  loadDTRRecords();
  loadDTRMode();
  loadDTRSchedule();
}

function loadDTRRecords() {
  var date = document.getElementById('dtrViewDate');
  if (!date) return;
  var key = 'dtr_' + date.value;
  var records = loadData(key, {});
  var ids = Object.keys(records);
  var el = document.getElementById('dtrRecordsTable');
  if (!el) return;
  
  if (ids.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--g5)">No records for this date.</div>';
    return;
  }
  
  var html = '<table><thead><tr><th>Employee ID</th><th>Name</th><th>Time In</th><th>Time Out</th><th>Hours</th><th>Status</th></tr></thead><tbody>';
  
  ids.forEach(function(id) {
    var r = records[id];
    var hours = '--';
    var status = 'b-pe';
    var statusText = 'Incomplete';
    
    if (r.timeIn && r.timeOut) {
      var inP = r.timeIn.match(/(\d+):(\d+)/);
      var outP = r.timeOut.match(/(\d+):(\d+)/);
      if (inP && outP) {
        var diff = (parseInt(outP[1])*60+parseInt(outP[2])) - (parseInt(inP[1])*60+parseInt(inP[2]));
        hours = Math.floor(diff/60) + 'h ' + (diff%60) + 'm';
      }
      status = 'b-ac';
      statusText = 'Complete';
    } else if (r.timeIn) {
      statusText = 'Timed In';
      status = 'b-pu';
    }
    
    // Check if late based on settings
    var dtrSched = loadData('dtr_settings', {startTime:'07:00', endTime:'16:00'});
    var schedStart = (dtrSched.startTime || '07:00').split(':');
    var schedEnd = (dtrSched.endTime || '16:00').split(':');
    var startH = parseInt(schedStart[0]), startM = parseInt(schedStart[1]);
    var endH = parseInt(schedEnd[0]), endM = parseInt(schedEnd[1]);
    
    if (r.timeIn) {
      var tParts = r.timeIn.match(/(\d+):(\d+)/);
      if (tParts && (parseInt(tParts[1]) > startH || (parseInt(tParts[1]) === startH && parseInt(tParts[2]) > startM))) {
        statusText += ' (Late)';
        status = 'b-fe';
      }
    }
    if (r.timeOut) {
      var oParts = r.timeOut.match(/(\d+):(\d+)/);
      if (oParts && (parseInt(oParts[1]) < endH || (parseInt(oParts[1]) === endH && parseInt(oParts[2]) < endM))) {
        statusText += ' (Undertime)';
        if (status !== 'b-fe') status = 'b-pe';
      }
    }
    
    html += '<tr>';
    html += '<td style="font-family:monospace;font-size:12px">' + id + '</td>';
    html += '<td><strong>' + (r.name || id) + '</strong></td>';
    html += '<td style="color:var(--su);font-weight:600">' + (r.timeIn || '--') + '</td>';
    html += '<td style="color:var(--da);font-weight:600">' + (r.timeOut || '--') + '</td>';
    html += '<td>' + hours + '</td>';
    html += '<td><span class="badge ' + status + '">' + statusText + '</span></td>';
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  el.innerHTML = html;
}


function renderQRImage(code) {
  var el = document.getElementById('todayQRImage');
  if (!el) return;
  el.innerHTML = '';
  new QRCode(el, {
    text: 'DBAMINHS-DTR:' + code,
    width: 180,
    height: 180,
    colorDark: '#1B2A4A',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
}

function printQR() {
  var code = document.getElementById('todayQRCode').textContent;
  if (code === '------') { toast('Generate a code first!','er'); return; }
  var qrImg = document.querySelector('#todayQRImage img');
  var imgSrc = qrImg ? qrImg.src : '';
  var date = document.getElementById('todayQRDate').textContent;
  var w = window.open('','_blank');
  w.document.write('<html><head><title>DTR QR Code</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:40px}h1{font-size:24px;color:#1B2A4A}h2{font-size:48px;color:#E85D1A;letter-spacing:6px;margin:16px 0}.info{color:#888;font-size:14px}img{margin:20px}</style></head><body>');
  w.document.write('<h1>DBAMINHS Daily Time Record</h1>');
  w.document.write('<p class="info">' + date + '</p>');
  if (imgSrc) w.document.write('<img src="' + imgSrc + '" width="250" height="250">');
  w.document.write('<h2>' + code + '</h2>');
  w.document.write('<p class="info">Scan this QR code or enter the code above to Time In/Out</p>');
  w.document.write('<p class="info" style="margin-top:40px">Dr. Bonifacio A. Masilungan Integrated National High School</p>');
  w.document.write('</body></html>');
  w.document.close();
  setTimeout(function() { w.print(); }, 500);
}


function saveDTRMode() {
  var mode = document.getElementById('dtrMode').value;
  var dtrSettings = loadData('dtr_settings', {mode:'qr+gps', radius:200});
  dtrSettings.mode = mode;
  saveData('dtr_settings', dtrSettings);
  toast('DTR mode updated: ' + mode, 'su');
}

function loadDTRMode() {
  var dtrSettings = loadData('dtr_settings', {mode:'qr+gps', radius:200});
  var el = document.getElementById('dtrMode');
  if (el) el.value = dtrSettings.mode || 'qr+gps';
}

// ============================================
// DTR ADVANCED CONTROLS
// ============================================

function toggleDTRView() {
  var mode = document.getElementById('dtrViewMode').value;
  document.getElementById('dtrDailyPicker').style.display = mode === 'daily' ? 'block' : 'none';
  document.getElementById('dtrMonthPicker').style.display = mode === 'monthly' ? 'block' : 'none';
  if (mode === 'daily') {
    loadDTRRecords();
  } else {
    var now = new Date();
    var monthInput = document.getElementById('dtrViewMonth');
    if (!monthInput.value) monthInput.value = now.getFullYear() + '-' + (now.getMonth()+1<10?'0':'') + (now.getMonth()+1);
    loadMonthlyDTR();
  }
}

function populateDTREmployeeFilter() {
  var el = document.getElementById('dtrFilterEmp');
  if (!el) return;
  var employees = loadData('dtr_employees', {});
  var current = el.value;
  el.innerHTML = '<option value="">All Employees</option>';
  Object.keys(employees).forEach(function(eid) {
    var name = employees[eid].name || eid;
    el.innerHTML += '<option value="' + eid + '">' + name + ' (' + eid + ')</option>';
  });
  if (current) el.value = current;
}

function filterDTRByEmployee() {
  var mode = document.getElementById('dtrViewMode').value;
  if (mode === 'daily') loadDTRRecords();
  else loadMonthlyDTR();
}

function loadMonthlyDTR() {
  var month = document.getElementById('dtrViewMonth').value;
  if (!month) return;
  var filterEmp = document.getElementById('dtrFilterEmp').value;
  var year = parseInt(month.split('-')[0]);
  var mon = parseInt(month.split('-')[1]);
  var daysInMonth = new Date(year, mon, 0).getDate();
  var months = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
  
  // Collect all employees from the month
  var allEmployees = {};
  for (var d = 1; d <= daysInMonth; d++) {
    var dateKey = 'dtr_' + year + '-' + (mon<10?'0':'') + mon + '-' + (d<10?'0':'') + d;
    var records = loadData(dateKey, {});
    Object.keys(records).forEach(function(eid) {
      if (filterEmp && eid !== filterEmp) return;
      if (!allEmployees[eid]) allEmployees[eid] = {name: records[eid].name || eid, days: {}, totalMinutes: 0, daysPresent: 0, daysLate: 0};
      allEmployees[eid].days[d] = records[eid];
      if (records[eid].timeIn) {
        allEmployees[eid].daysPresent++;
        var schedS = loadData('dtr_settings', {startTime:'07:00'});
        var sH = parseInt((schedS.startTime||'07:00').split(':')[0]);
        var sM = parseInt((schedS.startTime||'07:00').split(':')[1]);
        var tParts = records[eid].timeIn.match(/(\d+):(\d+)/);
        if (tParts && (parseInt(tParts[1]) > sH || (parseInt(tParts[1]) === sH && parseInt(tParts[2]) > sM))) {
          allEmployees[eid].daysLate++;
        }
      }
      if (records[eid].timeIn && records[eid].timeOut) {
        var inP = records[eid].timeIn.match(/(\d+):(\d+)/);
        var outP = records[eid].timeOut.match(/(\d+):(\d+)/);
        if (inP && outP) {
          allEmployees[eid].totalMinutes += (parseInt(outP[1])*60+parseInt(outP[2])) - (parseInt(inP[1])*60+parseInt(inP[2]));
        }
      }
    });
  }
  
  populateDTREmployeeFilter();
  
  var eids = Object.keys(allEmployees);
  var el = document.getElementById('dtrRecordsTable');
  if (!el) return;
  
  if (eids.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--g5)">No records for ' + months[mon] + ' ' + year + '.</div>';
    return;
  }
  
  var html = '<h4 style="margin-bottom:12px">&#128203; Monthly Summary &mdash; ' + months[mon] + ' ' + year + '</h4>';
  html += '<table><thead><tr><th>Employee ID</th><th>Name</th><th>Days Present</th><th>Days Late</th><th>Total Hours</th><th>Avg Hours/Day</th></tr></thead><tbody>';
  
  eids.forEach(function(eid) {
    var e = allEmployees[eid];
    var totalH = Math.floor(e.totalMinutes/60);
    var totalM = e.totalMinutes % 60;
    var avgH = e.daysPresent > 0 ? Math.round(e.totalMinutes / e.daysPresent) : 0;
    var avgHours = Math.floor(avgH/60);
    var avgMins = avgH % 60;
    
    html += '<tr>';
    html += '<td style="font-family:monospace;font-size:12px">' + eid + '</td>';
    html += '<td><strong>' + e.name + '</strong></td>';
    html += '<td style="text-align:center"><strong style="color:var(--su)">' + e.daysPresent + '</strong> / ' + daysInMonth + '</td>';
    html += '<td style="text-align:center;color:' + (e.daysLate > 0 ? 'var(--da)' : 'var(--su)') + ';font-weight:600">' + e.daysLate + '</td>';
    html += '<td style="text-align:center"><strong>' + totalH + 'h ' + totalM + 'm</strong></td>';
    html += '<td style="text-align:center">' + avgHours + 'h ' + avgMins + 'm</td>';
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  
  // Daily breakdown per employee
  if (filterEmp && allEmployees[filterEmp]) {
    var e = allEmployees[filterEmp];
    html += '<h4 style="margin:20px 0 12px">&#128197; Daily Breakdown &mdash; ' + e.name + '</h4>';
    html += '<table><thead><tr><th>Date</th><th>Time In</th><th>Time Out</th><th>Hours</th><th>Status</th></tr></thead><tbody>';
    
    for (var d = 1; d <= daysInMonth; d++) {
      var rec = e.days[d];
      if (!rec) continue;
      var dateStr = year + '-' + (mon<10?'0':'') + mon + '-' + (d<10?'0':'') + d;
      var hours = '--';
      if (rec.timeIn && rec.timeOut) {
        var inP = rec.timeIn.match(/(\d+):(\d+)/);
        var outP = rec.timeOut.match(/(\d+):(\d+)/);
        if (inP && outP) {
          var diff = (parseInt(outP[1])*60+parseInt(outP[2])) - (parseInt(inP[1])*60+parseInt(inP[2]));
          hours = Math.floor(diff/60) + 'h ' + (diff%60) + 'm';
        }
      }
      var late = false;
      var schedChk = loadData('dtr_settings', {startTime:'07:00'});
      var chkH = parseInt((schedChk.startTime||'07:00').split(':')[0]);
      var chkM = parseInt((schedChk.startTime||'07:00').split(':')[1]);
      if (rec.timeIn) {
        var tP = rec.timeIn.match(/(\d+):(\d+)/);
        if (tP && (parseInt(tP[1]) > chkH || (parseInt(tP[1]) === chkH && parseInt(tP[2]) > chkM))) late = true;
      }
      html += '<tr><td>' + dateStr + '</td>';
      html += '<td style="color:var(--su)">' + (rec.timeIn || '--') + '</td>';
      html += '<td style="color:var(--da)">' + (rec.timeOut || '--') + '</td>';
      html += '<td>' + hours + '</td>';
      html += '<td><span class="badge ' + (late ? 'b-fe' : 'b-ac') + '">' + (late ? 'Late' : 'On Time') + '</span></td></tr>';
    }
    html += '</tbody></table>';
  }
  
  el.innerHTML = html;
}

function clearDayRecords() {
  var date = document.getElementById('dtrViewDate').value;
  if (!date) { toast('Select a date first', 'er'); return; }
  if (!confirm('Delete all DTR records for ' + date + '?')) return;
  var key = 'dtr_' + date;
  saveData(key, {});
  loadDTRRecords();
  loadDTRDashboard();
  toast('Records for ' + date + ' cleared!', 'su');
}

function clearAllDTR() {
  if (!confirm('DELETE ALL DTR RECORDS? This cannot be undone!')) return;
  if (!confirm('Are you REALLY sure?')) return;
  var keys = Object.keys(_cache).filter(function(k) { return k.startsWith('dtr_2'); });
  keys.forEach(function(k) {
    db.collection('portal_data').doc(k).delete();
    delete _cache[k];
  });
  loadDTRRecords();
  loadDTRDashboard();
  toast('All DTR records cleared!', 'su');
}

function clearDTREmployees() {
  if (!confirm('Reset all employee registrations? They will need to re-login with default PIN 1234.')) return;
  saveData('dtr_employees', {});
  toast('All employee registrations cleared!', 'su');
}

function exportDTR() {
  var mode = document.getElementById('dtrViewMode').value;
  var csv = '';
  
  if (mode === 'daily') {
    var date = document.getElementById('dtrViewDate').value;
    var key = 'dtr_' + date;
    var records = loadData(key, {});
    csv = 'Employee ID,Name,Time In,Time Out,Hours\n';
    Object.keys(records).forEach(function(eid) {
      var r = records[eid];
      var hours = '';
      if (r.timeIn && r.timeOut) {
        var inP = r.timeIn.match(/(\d+):(\d+)/);
        var outP = r.timeOut.match(/(\d+):(\d+)/);
        if (inP && outP) {
          var diff = (parseInt(outP[1])*60+parseInt(outP[2])) - (parseInt(inP[1])*60+parseInt(inP[2]));
          hours = Math.floor(diff/60) + 'h ' + (diff%60) + 'm';
        }
      }
      csv += eid + ',' + (r.name||eid) + ',' + (r.timeIn||'') + ',' + (r.timeOut||'') + ',' + hours + '\n';
    });
  } else {
    var month = document.getElementById('dtrViewMonth').value;
    var year = parseInt(month.split('-')[0]);
    var mon = parseInt(month.split('-')[1]);
    var daysInMonth = new Date(year, mon, 0).getDate();
    csv = 'Employee ID,Name,Days Present,Days Late,Total Hours\n';
    
    var allEmp = {};
    for (var d = 1; d <= daysInMonth; d++) {
      var dateKey = 'dtr_' + year + '-' + (mon<10?'0':'') + mon + '-' + (d<10?'0':'') + d;
      var recs = loadData(dateKey, {});
      Object.keys(recs).forEach(function(eid) {
        if (!allEmp[eid]) allEmp[eid] = {name:recs[eid].name||eid,present:0,late:0,mins:0};
        if (recs[eid].timeIn) {
          allEmp[eid].present++;
          var tP = recs[eid].timeIn.match(/(\d+):(\d+)/);
          if (tP && (parseInt(tP[1])>8||(parseInt(tP[1])===8&&parseInt(tP[2])>0))) allEmp[eid].late++;
        }
        if (recs[eid].timeIn && recs[eid].timeOut) {
          var iP = recs[eid].timeIn.match(/(\d+):(\d+)/);
          var oP = recs[eid].timeOut.match(/(\d+):(\d+)/);
          if (iP && oP) allEmp[eid].mins += (parseInt(oP[1])*60+parseInt(oP[2]))-(parseInt(iP[1])*60+parseInt(iP[2]));
        }
      });
    }
    Object.keys(allEmp).forEach(function(eid) {
      var e = allEmp[eid];
      csv += eid + ',' + e.name + ',' + e.present + ',' + e.late + ',' + Math.floor(e.mins/60) + 'h ' + (e.mins%60) + 'm\n';
    });
  }
  
  var blob = new Blob([csv], {type:'text/csv'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'DTR_' + (mode === 'daily' ? document.getElementById('dtrViewDate').value : document.getElementById('dtrViewMonth').value) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV exported!', 'su');
}


function saveDTRSchedule() {
  var dtrSettings = loadData('dtr_settings', {mode:'qr+gps', radius:200, startTime:'07:00', endTime:'16:00'});
  dtrSettings.startTime = document.getElementById('dtrStartTime').value;
  dtrSettings.endTime = document.getElementById('dtrEndTime').value;
  saveData('dtr_settings', dtrSettings);
  toast('Work schedule saved: ' + dtrSettings.startTime + ' - ' + dtrSettings.endTime, 'su');
}

function loadDTRSchedule() {
  var dtrSettings = loadData('dtr_settings', {mode:'qr+gps', radius:200, startTime:'07:00', endTime:'16:00'});
  var startEl = document.getElementById('dtrStartTime');
  var endEl = document.getElementById('dtrEndTime');
  if (startEl) startEl.value = dtrSettings.startTime || '07:00';
  if (endEl) endEl.value = dtrSettings.endTime || '16:00';
}


function generateWeeklyCodes() {
  var today = new Date();
  var day = today.getDay();
  // Find Monday of this week
  var monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  var codes = [];
  
  for (var i = 0; i < 5; i++) {
    var d = new Date(monday);
    d.setDate(monday.getDate() + i);
    var dateKey = d.getFullYear() + '-' + (d.getMonth()+1<10?'0':'') + (d.getMonth()+1) + '-' + (d.getDate()<10?'0':'') + d.getDate();
    
    var code = '';
    for (var j = 0; j < 6; j++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    
    // Save each day's code
    saveData('dtr_code_' + dateKey, {code: code, date: dateKey});
    
    // Also set today's code if this is today
    var todayKey = today.getFullYear() + '-' + (today.getMonth()+1<10?'0':'') + (today.getMonth()+1) + '-' + (today.getDate()<10?'0':'') + today.getDate();
    if (dateKey === todayKey) {
      saveData('dtr_daily_code', {code: code, date: dateKey});
      document.getElementById('todayQRCode').textContent = code;
      document.getElementById('todayQRDate').textContent = 'Date: ' + dateKey;
      renderQRImage(code);
    }
    
    codes.push({day: days[i], date: dateKey, code: code});
  }
  
  // Show print preview with all codes
  var w = window.open('','_blank');
  w.document.write('<html><head><title>Weekly QR Codes</title>');
  w.document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>');
  w.document.write('<style>');
  w.document.write('body{font-family:Arial,sans-serif;text-align:center;padding:20px}');
  w.document.write('.card{display:inline-block;border:2px solid #ddd;border-radius:16px;padding:24px;margin:10px;width:280px;vertical-align:top;page-break-inside:avoid}');
  w.document.write('.day{font-size:18px;font-weight:700;color:#1B2A4A;margin-bottom:4px}');
  w.document.write('.date{font-size:13px;color:#888;margin-bottom:16px}');
  w.document.write('.code{font-size:32px;font-weight:800;color:#E85D1A;letter-spacing:4px;margin-top:12px}');
  w.document.write('.qr{margin:10px auto}');
  w.document.write('h1{color:#1B2A4A;margin-bottom:4px}');
  w.document.write('.sub{color:#888;font-size:14px;margin-bottom:20px}');
  w.document.write('@media print{body{padding:10px}.card{margin:8px;padding:16px}}');
  w.document.write('</style></head><body>');
  w.document.write('<h1>DBAMINHS Weekly DTR Codes</h1>');
  w.document.write('<p class="sub">Week of ' + codes[0].date + ' to ' + codes[4].date + '</p>');
  
  codes.forEach(function(c, i) {
    w.document.write('<div class="card">');
    w.document.write('<div class="day">' + c.day + '</div>');
    w.document.write('<div class="date">' + c.date + '</div>');
    w.document.write('<div class="qr" id="qr' + i + '"></div>');
    w.document.write('<div class="code">' + c.code + '</div>');
    w.document.write('</div>');
  });
  
  w.document.write('<p style="margin-top:20px;color:#888;font-size:12px">Dr. Bonifacio A. Masilungan Integrated National High School<br>Cut along the borders. Post one QR code per day at the school entrance.</p>');
  
  w.document.write('<script>');
  w.document.write('window.onload=function(){');
  codes.forEach(function(c, i) {
    w.document.write('new QRCode(document.getElementById("qr' + i + '"),{text:"DBAMINHS-DTR:' + c.code + '",width:150,height:150,colorDark:"#1B2A4A",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.H});');
  });
  w.document.write('setTimeout(function(){window.print();},1000);');
  w.document.write('};');
  w.document.write('<\/script>');
  w.document.write('</body></html>');
  w.document.close();
  
  toast('Weekly codes generated! Print window opening...', 'su');
}


function printEmployeeDTR() {
  var filterEmp = document.getElementById('dtrFilterEmp').value;
  var month = document.getElementById('dtrViewMonth').value;
  
  if (!filterEmp) { toast('Select an employee first from the dropdown.', 'er'); return; }
  if (!month) { toast('Select a month first.', 'er'); return; }
  
  var year = parseInt(month.split('-')[0]);
  var mon = parseInt(month.split('-')[1]);
  var daysInMonth = new Date(year, mon, 0).getDate();
  var months = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
  
  var dtrSched = loadData('dtr_settings', {startTime:'07:00', endTime:'16:00'});
  var schedStart = dtrSched.startTime || '07:00';
  var schedEnd = dtrSched.endTime || '16:00';
  var startH = parseInt(schedStart.split(':')[0]);
  var startM = parseInt(schedStart.split(':')[1]);
  
  var empName = '';
  var empDept = '';
  var employees = loadData('dtr_employees', {});
  var teachers = loadData('teachers', []);
  teachers.forEach(function(t) {
    if (String(t.eid) === String(filterEmp)) {
      empName = t.name;
      empDept = t.dept || '';
    }
  });
  if (!empName && employees[filterEmp]) empName = employees[filterEmp].name;
  if (!empName) empName = filterEmp;
  
  var settings = loadData('settings', {});
  var schoolName = settings.schoolName || 'Dr. Bonifacio A. Masilungan Integrated National High School';
  
  var totalMins = 0, daysPresent = 0, daysLate = 0, daysAbsent = 0;
  var rows = '';
  
  for (var d = 1; d <= daysInMonth; d++) {
    var dateKey = 'dtr_' + year + '-' + (mon<10?'0':'') + mon + '-' + (d<10?'0':'') + d;
    var records = loadData(dateKey, {});
    var rec = records[filterEmp];
    var dayOfWeek = new Date(year, mon-1, d).getDay();
    var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    var timeIn = '', timeOut = '', hours = '', remarks = '';
    
    if (rec) {
      timeIn = rec.timeIn || '';
      timeOut = rec.timeOut || '';
      
      if (timeIn && timeOut) {
        var inP = timeIn.match(/(\d+):(\d+)/);
        var outP = timeOut.match(/(\d+):(\d+)/);
        if (inP && outP) {
          var diff = (parseInt(outP[1])*60+parseInt(outP[2])) - (parseInt(inP[1])*60+parseInt(inP[2]));
          totalMins += diff;
          hours = Math.floor(diff/60) + ':' + (diff%60<10?'0':'') + (diff%60);
        }
      }
      
      if (timeIn) {
        daysPresent++;
        var tP = timeIn.match(/(\d+):(\d+)/);
        if (tP && (parseInt(tP[1]) > startH || (parseInt(tP[1]) === startH && parseInt(tP[2]) > startM))) {
          daysLate++;
          remarks = 'Late';
        }
      }
    } else if (!isWeekend) {
      daysAbsent++;
      remarks = isWeekend ? '' : '';
    }
    
    var bg = isWeekend ? '#f5f5f5' : '#fff';
    rows += '<tr style="background:' + bg + '">';
    rows += '<td style="text-align:center">' + d + '</td>';
    rows += '<td style="text-align:center;font-size:11px;color:#888">' + dayNames[dayOfWeek] + '</td>';
    rows += '<td style="text-align:center">' + (isWeekend ? '-' : (timeIn || '')) + '</td>';
    rows += '<td style="text-align:center">' + (isWeekend ? '-' : (timeOut || '')) + '</td>';
    rows += '<td style="text-align:center">' + (isWeekend ? '-' : (hours || '')) + '</td>';
    rows += '<td style="text-align:center;font-size:11px;color:' + (remarks==='Late'?'#D32F2F':'#666') + '">' + (isWeekend ? 'Weekend' : remarks) + '</td>';
    rows += '</tr>';
  }
  
  var totalH = Math.floor(totalMins/60);
  var totalM = totalMins % 60;
  
  var w = window.open('','_blank');
  w.document.write('<html><head><title>DTR - ' + empName + '</title>');
  w.document.write('<style>');
  w.document.write('*{margin:0;padding:0;box-sizing:border-box}');
  w.document.write('body{font-family:Arial,sans-serif;padding:30px;font-size:12px;color:#333}');
  w.document.write('.header{text-align:center;margin-bottom:20px;border-bottom:2px solid #1B2A4A;padding-bottom:16px}');
  w.document.write('.header h1{font-size:14px;color:#1B2A4A;margin-bottom:2px}');
  w.document.write('.header h2{font-size:18px;color:#1B2A4A;margin-bottom:2px}');
  w.document.write('.header p{font-size:11px;color:#888}');
  w.document.write('.info{display:flex;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap}');
  w.document.write('.info div{margin-bottom:6px}');
  w.document.write('.info label{font-weight:700;color:#555;font-size:11px}');
  w.document.write('.info span{font-size:13px;border-bottom:1px solid #333;padding:0 20px}');
  w.document.write('table{width:100%;border-collapse:collapse;margin-bottom:16px}');
  w.document.write('th{background:#1B2A4A;color:#fff;padding:8px 6px;font-size:11px;text-transform:uppercase}');
  w.document.write('td{padding:6px;border:1px solid #ddd;font-size:12px}');
  w.document.write('.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}');
  w.document.write('.summary div{background:#f8f8f8;border-radius:8px;padding:12px;text-align:center;border:1px solid #eee}');
  w.document.write('.summary .num{font-size:24px;font-weight:800;color:#1B2A4A}');
  w.document.write('.summary .lbl{font-size:10px;color:#888;margin-top:2px}');
  w.document.write('.sig{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px}');
  w.document.write('.sig div{text-align:center}');
  w.document.write('.sig .line{border-top:1px solid #333;margin-top:40px;padding-top:4px;font-size:11px}');
  w.document.write('@media print{body{padding:15px}}');
  w.document.write('</style></head><body>');
  
  w.document.write('<div class="header">');
  w.document.write('<p>Republic of the Philippines &bull; Department of Education</p>');
  w.document.write('<h1>' + schoolName + '</h1>');
  w.document.write('<h2>DAILY TIME RECORD</h2>');
  w.document.write('<p>' + months[mon] + ' ' + year + '</p>');
  w.document.write('</div>');
  
  w.document.write('<div class="info">');
  w.document.write('<div><label>Name: </label><span>' + empName + '</span></div>');
  w.document.write('<div><label>Employee ID: </label><span>' + filterEmp + '</span></div>');
  w.document.write('<div><label>Department: </label><span>' + empDept + '</span></div>');
  w.document.write('<div><label>Schedule: </label><span>' + schedStart + ' - ' + schedEnd + '</span></div>');
  w.document.write('</div>');
  
  w.document.write('<div class="summary">');
  w.document.write('<div><div class="num" style="color:#2D8B46">' + daysPresent + '</div><div class="lbl">Days Present</div></div>');
  w.document.write('<div><div class="num" style="color:#D32F2F">' + daysAbsent + '</div><div class="lbl">Days Absent</div></div>');
  w.document.write('<div><div class="num" style="color:#E6A817">' + daysLate + '</div><div class="lbl">Days Late</div></div>');
  w.document.write('<div><div class="num">' + totalH + 'h ' + totalM + 'm</div><div class="lbl">Total Hours</div></div>');
  w.document.write('</div>');
  
  w.document.write('<table><thead><tr><th>Day</th><th>Day</th><th>Time In</th><th>Time Out</th><th>Hours</th><th>Remarks</th></tr></thead><tbody>');
  w.document.write(rows);
  w.document.write('</tbody></table>');
  
  w.document.write('<p style="font-size:11px;color:#888;margin-bottom:8px">I certify on my honor that the above is a true and correct report of the hours of work performed.</p>');
  
  w.document.write('<div class="sig">');
  w.document.write('<div><div class="line">' + empName + '<br><span style="font-size:10px;color:#888">Employee Signature</span></div></div>');
  w.document.write('<div><div class="line">___________________<br><span style="font-size:10px;color:#888">Verified by / School Head</span></div></div>');
  w.document.write('</div>');
  
  w.document.write('</body></html>');
  w.document.close();
  setTimeout(function() { w.print(); }, 500);
}
