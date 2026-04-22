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
  var t={dash:'Dashboard',news:'News & Announcements',events:'Events & Calendar',students:'Student Management',teachers:'Teachers & Staff',pending:'Pending Signups',settings:'Portal Settings'};
  document.getElementById('pt').textContent=t[p]||p;
  document.getElementById('sidebar').classList.remove('open');
}

function renderAll(){rN();rE();rS();rT();rP();uS();loadSettings();setTimeout(updateDashChart,100)}
function uS(){
  document.getElementById('sS').textContent=S.length.toLocaleString();
  document.getElementById('sT').textContent=T.length;
  document.getElementById('sN').textContent=N.filter(function(x){return x.status==='Published'}).length;
  document.getElementById('sP').textContent=P.length;
  document.getElementById('pendCount').textContent=P.length;
}

function rN(){document.getElementById('nB').innerHTML=N.map(function(n){return '<tr><td><strong>'+n.title+'</strong></td><td><span class="badge '+(n.cat==='Achievement'?'b-fe':'b-pu')+'">'+n.cat+'</span></td><td>'+formatDate(n.date)+'</td><td><span class="badge '+(n.status==='Published'?'b-ac':'b-dr')+'">'+n.status+'</span></td><td><div class="ab"><button class="abtn" title="Edit" onclick="edN('+n.id+')">&#9998;</button><button class="abtn del" title="Delete" onclick="del(\'n\','+n.id+')">&#128465;</button></div></td></tr>'}).join('')}

function rE(){document.getElementById('eB').innerHTML=E.map(function(e){return '<tr><td><strong>'+e.name+'</strong></td><td>'+formatDate(e.date)+'</td><td>'+e.time+'</td><td>'+(e.venue||'')+'</td><td><span class="badge b-ac">'+e.status+'</span></td><td><div class="ab"><button class="abtn" title="Edit" onclick="edE('+e.id+')">&#9998;</button><button class="abtn del" title="Delete" onclick="del(\'e\','+e.id+')">&#128465;</button></div></td></tr>'}).join('')}

function rS(){document.getElementById('sB').innerHTML=S.map(function(s){return '<tr><td style="font-family:monospace;font-size:12px">'+s.lrn+'</td><td><strong>'+s.name+'</strong></td><td>'+s.grade+'</td><td>'+s.contact+'</td><td><span class="badge '+(s.status==='Active'?'b-ac':'b-in')+'">'+s.status+'</span></td><td><div class="ab"><button class="abtn" title="Edit" onclick="edS('+s.id+')">&#9998;</button><button class="abtn del" title="Delete" onclick="del(\'s\','+s.id+')">&#128465;</button></div></td></tr>'}).join('')}

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
      '<div class="fg-row"><div class="fg"><label>Grade Level &amp; Section</label><input id="apvGrade" placeholder="e.g. Grade 7 - Rizal"></div>'+
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
  if(document.getElementById('setG8'))document.getElementById('setG8').value=SETTINGS.g8||'198';
  if(document.getElementById('setG9'))document.getElementById('setG9').value=SETTINGS.g9||'185';
  if(document.getElementById('setG10'))document.getElementById('setG10').value=SETTINGS.g10||'172';
  if(document.getElementById('setG11'))document.getElementById('setG11').value=SETTINGS.g11||'250';
  if(document.getElementById('setG12'))document.getElementById('setG12').value=SETTINGS.g12||'232';
}
function saveSettings(){
  SETTINGS={schoolName:document.getElementById('setName').value,schoolId:document.getElementById('setId').value,schoolYear:document.getElementById('setSY').value,address:document.getElementById('setAddr').value,phone:document.getElementById('setPhone').value,email:document.getElementById('setEmail').value,motto:document.getElementById('setMotto').value,principal:document.getElementById('setPrincipal').value,division:document.getElementById('setDiv').value,stat1:document.getElementById('setStat1').value,stat2:document.getElementById('setStat2').value,stat3:document.getElementById('setStat3').value,stat4:document.getElementById('setStat4').value,
  g7:document.getElementById('setG7')?document.getElementById('setG7').value:'210',
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
