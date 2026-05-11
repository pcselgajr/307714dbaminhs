// ============================================
// ADMIN PASSWORD PATCH v2
// Default password: admin123
// ============================================

// Override login - check Firebase for saved password
var _origDoLogin = window.doLogin;
window.doLogin = function() {
  var user = document.getElementById('lu').value;
  var pass = document.getElementById('lp').value;
  
  db.collection('portal_data').doc('admin_auth').get().then(function(doc) {
    var savedUser = 'admin';
    var savedPass = 'admin123';
    
    if (doc.exists) {
      try {
        var data = JSON.parse(doc.data().data);
        savedUser = data.user || 'admin';
        savedPass = data.pass || 'admin123';
      } catch(e) {}
    }
    
    if (user === savedUser && pass === savedPass) {
      // Use original login flow
      document.getElementById('lu').value = 'admin';
      document.getElementById('lp').value = 'admin123';
      _origDoLogin();
    } else {
      toast('Invalid username or password', 'er');
    }
  }).catch(function() {
    _origDoLogin();
  });
};

// Add Change Password section to settings
function addPasswordSection() {
  if (document.getElementById('changePasswordSection')) return;
  var panels = document.querySelectorAll('#pg-settings .panel');
  if (!panels.length) return;
  
  var section = document.createElement('div');
  section.className = 'panel';
  section.id = 'changePasswordSection';
  section.style.maxWidth = '680px';
  section.innerHTML = '<div style="padding:22px">' +
    '<h4 style="font-size:14px;margin-bottom:12px">&#128274; Change Admin Password</h4>' +
    '<div class="fg"><label>Current Password</label><input id="cpCurrent" type="password" placeholder="Enter current password"></div>' +
    '<div class="fg"><label>New Password</label><input id="cpNew" type="password" placeholder="Enter new password (min 6 characters)"></div>' +
    '<div class="fg"><label>Confirm New Password</label><input id="cpConfirm" type="password" placeholder="Confirm new password"></div>' +
    '<button class="btn btn-p" onclick="changeAdminPassword()">&#128274; Change Password</button>' +
    '</div>';
  
  panels[0].parentElement.appendChild(section);
}

function changeAdminPassword() {
  var current = document.getElementById('cpCurrent').value;
  var newPass = document.getElementById('cpNew').value;
  var confirm = document.getElementById('cpConfirm').value;
  
  if (!current || !newPass || !confirm) { toast('Fill in all fields', 'er'); return; }
  if (newPass !== confirm) { toast('Passwords do not match', 'er'); return; }
  if (newPass.length < 6) { toast('Min 6 characters', 'er'); return; }
  
  db.collection('portal_data').doc('admin_auth').get().then(function(doc) {
    var savedPass = 'admin123';
    if (doc.exists) {
      try { savedPass = JSON.parse(doc.data().data).pass || 'admin123'; } catch(e) {}
    }
    
    if (current !== savedPass) { toast('Current password is incorrect', 'er'); return; }
    
    saveData('admin_auth', {user: 'admin', pass: newPass});
    document.getElementById('cpCurrent').value = '';
    document.getElementById('cpNew').value = '';
    document.getElementById('cpConfirm').value = '';
    toast('Password changed successfully!', 'su');
  });
}

// Add password section when settings is opened
var _origGo = window.go;
window.go = function(p, el) {
  _origGo(p, el);
  if (p === 'settings') setTimeout(addPasswordSection, 200);
};

setTimeout(addPasswordSection, 3000);
console.log('Admin Password Patch v2 loaded!');
