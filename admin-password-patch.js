// ============================================
// ADMIN PASSWORD PATCH
// Add this script to admin.html before </body>
// Default password: admin123
// ============================================

// Override login function
var _origDoLogin = window.doLogin;
window.doLogin = function() {
  var user = document.getElementById('lu').value;
  var pass = document.getElementById('lp').value;
  
  // Check Firebase for saved password
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
      document.getElementById('loginPage').style.display = 'none';
      document.getElementById('app').classList.add('act');
      loadAllFromFirebase(function() { renderAll(); });
    } else {
      toast('Invalid username or password', 'er');
    }
  }).catch(function() {
    // Fallback to default if Firebase fails
    if (user === 'admin' && pass === 'admin123') {
      document.getElementById('loginPage').style.display = 'none';
      document.getElementById('app').classList.add('act');
      loadAllFromFirebase(function() { renderAll(); });
    } else {
      toast('Invalid username or password', 'er');
    }
  });
};

// Add Change Password section to settings
function addPasswordSection() {
  var settingsDiv = document.querySelector('#pg-settings .panel div[style*="padding:22px"]');
  if (!settingsDiv) return;
  
  // Check if already added
  if (document.getElementById('changePasswordSection')) return;
  
  var section = document.createElement('div');
  section.id = 'changePasswordSection';
  section.innerHTML = '<hr style="border:none;border-top:1px solid var(--g2);margin:18px 0">' +
    '<h4 style="font-size:14px;margin-bottom:12px">&#128274; Change Admin Password</h4>' +
    '<div class="fg"><label>Current Password</label><input id="cpCurrent" type="password" placeholder="Enter current password"></div>' +
    '<div class="fg"><label>New Password</label><input id="cpNew" type="password" placeholder="Enter new password"></div>' +
    '<div class="fg"><label>Confirm New Password</label><input id="cpConfirm" type="password" placeholder="Confirm new password"></div>' +
    '<button class="btn btn-p" onclick="changeAdminPassword()">&#128274; Change Password</button>';
  
  // Insert before the Save Settings button area
  var saveBtn = settingsDiv.querySelector('.btn-p');
  if (saveBtn && saveBtn.parentElement) {
    settingsDiv.insertBefore(section, saveBtn.parentElement);
  } else {
    settingsDiv.appendChild(section);
  }
}

function changeAdminPassword() {
  var current = document.getElementById('cpCurrent').value;
  var newPass = document.getElementById('cpNew').value;
  var confirm = document.getElementById('cpConfirm').value;
  
  if (!current || !newPass || !confirm) {
    toast('Fill in all password fields', 'er');
    return;
  }
  
  if (newPass !== confirm) {
    toast('New passwords do not match', 'er');
    return;
  }
  
  if (newPass.length < 6) {
    toast('Password must be at least 6 characters', 'er');
    return;
  }
  
  // Verify current password
  db.collection('portal_data').doc('admin_auth').get().then(function(doc) {
    var savedPass = 'admin123';
    if (doc.exists) {
      try {
        var data = JSON.parse(doc.data().data);
        savedPass = data.pass || 'admin123';
      } catch(e) {}
    }
    
    if (current !== savedPass) {
      toast('Current password is incorrect', 'er');
      return;
    }
    
    // Save new password
    saveData('admin_auth', {user: 'admin', pass: newPass});
    
    document.getElementById('cpCurrent').value = '';
    document.getElementById('cpNew').value = '';
    document.getElementById('cpConfirm').value = '';
    
    toast('Password changed successfully!', 'su');
  });
}

// Auto-add password section when settings page loads
var _origGo = window.go;
window.go = function(p, el) {
  _origGo(p, el);
  if (p === 'settings') {
    setTimeout(addPasswordSection, 100);
  }
};

// Also add on initial load if settings is visible
setTimeout(addPasswordSection, 2000);

console.log('Admin Password Patch loaded!');
