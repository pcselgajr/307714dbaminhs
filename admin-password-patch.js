// ============================================
// ADMIN ACCOUNTS v3 — hiwalay na account at role para sa bawat admin
//   super     : buong access
//   principal : lahat maliban sa Settings, Backup, Admin Accounts
//   viewer    : titingin lang (walang mababago)
// Ang password ay naka-hash (SHA-256 + salt); hindi na naka-save nang plain text.
// ============================================
var currentAdmin = null;
var ROLE_LABEL = {super: 'Super Admin', principal: 'Principal', viewer: 'Viewer'};
var ROLE_BLOCKED_PAGES = {
  super: [],
  principal: ['settings', 'backup', 'admins'],
  viewer: ['settings', 'backup', 'admins']
};
var _rawSaveData = window.saveData;

function aaEsc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function sha256Hex(text) {
  var buf = new TextEncoder().encode(text);
  return crypto.subtle.digest('SHA-256', buf).then(function(h) {
    return Array.prototype.map.call(new Uint8Array(h), function(b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  });
}
function randomSalt() {
  var a = new Uint8Array(16); crypto.getRandomValues(a);
  return Array.prototype.map.call(a, function(b) { return ('0' + b.toString(16)).slice(-2); }).join('');
}
function hashAdminPass(salt, user, pass) {
  return sha256Hex(salt + ':' + String(user).toLowerCase() + ':' + pass);
}

function readDoc(key) {
  return db.collection('portal_data').doc(key).get().then(function(doc) {
    if (!doc.exists) return null;
    try { return JSON.parse(doc.data().data); } catch (e) { return null; }
  });
}
function writeAccounts(list) {
  _rawSaveData('admin_accounts', list);
}

// ---------- LOGIN ----------
window.doLogin = function() {
  var user = document.getElementById('lu').value.trim();
  var pass = document.getElementById('lp').value;
  if (!user || !pass) { toast('Ilagay ang username at password', 'er'); return; }
  if (!window.crypto || !crypto.subtle) { toast('Kailangang naka-HTTPS ang admin page.', 'er'); return; }

  readDoc('admin_accounts').then(function(list) {
    if (list && list.length) {
      var acct = list.filter(function(a) { return String(a.user).toLowerCase() === user.toLowerCase() && !a.disabled; })[0];
      if (!acct) { toast('Mali ang username o password', 'er'); return; }
      return hashAdminPass(acct.salt, acct.user, pass).then(function(h) {
        if (h !== acct.hash) { toast('Mali ang username o password', 'er'); return; }
        startAdminSession(acct, list);
      });
    }
    // Unang beses: ilipat ang lumang iisang admin account (admin_auth) bilang Super Admin
    return readDoc('admin_auth').then(function(old) {
      var oldUser = (old && old.user) || 'admin';
      var oldPass = (old && old.pass) || 'admin123';
      if (user.toLowerCase() !== String(oldUser).toLowerCase() || pass !== oldPass) { toast('Mali ang username o password', 'er'); return; }
      var salt = randomSalt();
      return hashAdminPass(salt, oldUser, pass).then(function(h) {
        var acct = {user: oldUser, name: 'Administrator', role: 'super', salt: salt, hash: h,
                    mustChange: (pass === 'admin123' || pass.length < 8), created: new Date().toISOString()};
        writeAccounts([acct]);
        // Burahin ang lumang plain-text na password
        _rawSaveData('admin_auth', {migrated: true, at: new Date().toISOString()});
        startAdminSession(acct, [acct]);
      });
    });
  }).catch(function(err) {
    console.error('Admin login error:', err);
    toast('Hindi makakonekta sa server. Subukan ulit.', 'er');
  });
};

function startAdminSession(acct, list) {
  currentAdmin = {user: acct.user, name: acct.name || acct.user, role: acct.role || 'viewer'};
  window.currentAdmin = currentAdmin;
  document.getElementById('lp').value = '';
  // last login
  list.forEach(function(a) { if (a.user === acct.user) a.lastLogin = new Date().toISOString(); });
  writeAccounts(list);
  applyRoleUI();
  enterAdminApp();
  if (acct.mustChange) setTimeout(function() { openMyPassword(true); }, 600);
}

window.doLogout = function() {
  currentAdmin = null; window.currentAdmin = null;
  location.reload();
};

// ---------- ROLE ENFORCEMENT ----------
function pageAllowed(p) {
  if (!currentAdmin) return false;
  return (ROLE_BLOCKED_PAGES[currentAdmin.role] || ROLE_BLOCKED_PAGES.viewer).indexOf(p) === -1;
}

function applyRoleUI() {
  var role = currentAdmin ? currentAdmin.role : 'viewer';
  document.querySelectorAll('.sb-nav .sl').forEach(function(btn) {
    var m = (btn.getAttribute('onclick') || '').match(/go\('([^']+)'/);
    if (m) btn.style.display = pageAllowed(m[1]) ? '' : 'none';
  });
  var n = document.getElementById('sbUserName'), r = document.getElementById('sbUserRole'), av = document.getElementById('sbAv');
  if (n) n.textContent = currentAdmin ? currentAdmin.name : '';
  if (r) r.textContent = ROLE_LABEL[role] || role;
  if (av) av.textContent = currentAdmin ? (currentAdmin.name || 'A').charAt(0).toUpperCase() : 'A';
  document.body.classList.toggle('role-viewer', role === 'viewer');
  if (role === 'viewer' && !document.getElementById('viewerBanner')) {
    var b = document.createElement('div');
    b.id = 'viewerBanner';
    b.style.cssText = 'background:#FEF3C7;color:#92400E;padding:8px 16px;font-size:13px;font-weight:600;text-align:center';
    b.textContent = 'View-only access — makikita mo ang data pero hindi ito mababago.';
    var main = document.querySelector('.main');
    if (main) main.insertBefore(b, main.firstChild);
  }
}

// Harangan ang pag-save batay sa role
var _lastBlockToast = 0;
window.saveData = function(key, data) {
  var role = currentAdmin ? currentAdmin.role : null;
  var blocked = false;
  if (!role) blocked = false; // bago mag-login (hal. pag-check ng defaults) — walang ibang paraan para makarating dito
  else if (role === 'viewer') blocked = true;
  else if (role === 'principal' && ['settings', 'admin_accounts', 'admin_auth'].indexOf(key) > -1) blocked = true;
  if (blocked) {
    console.warn('Blocked save for role', role, key);
    if (Date.now() - _lastBlockToast > 3000) { _lastBlockToast = Date.now(); toast('Wala kang permiso na baguhin ito (' + (ROLE_LABEL[role] || role) + ').', 'er'); }
    return;
  }
  _rawSaveData(key, data);
};

var _origGoFn = window.go;
window.go = function(p, el) {
  if (!pageAllowed(p)) { toast('Wala kang access sa page na ito.', 'er'); return; }
  _origGoFn(p, el);
  if (p === 'admins') renderAdminAccounts();
};

// ---------- SARILING PASSWORD ----------
var _forcePw = false;
function openMyPassword(force) {
  if (!currentAdmin) return;
  _forcePw = !!force;
  document.getElementById('myPwNote').textContent = force
    ? 'Para sa seguridad, palitan muna ang pansamantala o default na password bago magpatuloy.'
    : 'Naka-login bilang ' + currentAdmin.name + ' (' + currentAdmin.user + ').';
  document.getElementById('mpCancel').style.display = force ? 'none' : '';
  ['mpCur', 'mpNew', 'mpNew2'].forEach(function(id) { document.getElementById(id).value = ''; });
  document.getElementById('myPwModal').style.display = 'flex';
}
function closeMyPassword() {
  if (_forcePw) return;
  document.getElementById('myPwModal').style.display = 'none';
}
function saveMyPassword() {
  var cur = document.getElementById('mpCur').value;
  var np = document.getElementById('mpNew').value;
  var np2 = document.getElementById('mpNew2').value;
  if (np.length < 8) { toast('Ang bagong password ay dapat hindi bababa sa 8 characters.', 'er'); return; }
  if (np !== np2) { toast('Hindi magkatugma ang bagong password.', 'er'); return; }
  if (np === cur) { toast('Iba dapat ang bagong password.', 'er'); return; }
  if (/^(admin123|password|12345678)$/i.test(np)) { toast('Masyadong madaling hulaan ang password na iyan.', 'er'); return; }
  readDoc('admin_accounts').then(function(list) {
    list = list || [];
    var acct = list.filter(function(a) { return a.user === currentAdmin.user; })[0];
    if (!acct) { toast('Hindi mahanap ang account.', 'er'); return; }
    return hashAdminPass(acct.salt, acct.user, cur).then(function(h) {
      if (h !== acct.hash) { toast('Mali ang kasalukuyang password.', 'er'); return; }
      var salt = randomSalt();
      return hashAdminPass(salt, acct.user, np).then(function(nh) {
        acct.salt = salt; acct.hash = nh; acct.mustChange = false; acct.pwChanged = new Date().toISOString();
        writeAccounts(list);
        _forcePw = false;
        document.getElementById('myPwModal').style.display = 'none';
        toast('Napalitan na ang password mo.', 'su');
      });
    });
  });
}

// ---------- ADMIN ACCOUNTS PAGE (Super Admin lang) ----------
function renderAdminAccounts() {
  var el = document.getElementById('adminAccountList');
  if (!el || !currentAdmin || currentAdmin.role !== 'super') return;
  readDoc('admin_accounts').then(function(list) {
    list = list || [];
    var th = 'text-align:left;padding:8px;border-bottom:1px solid var(--g2);font-size:12px;color:var(--g5)';
    var td = 'padding:8px;border-bottom:1px solid var(--g2);font-size:13px';
    var fmt = function(d) { return d ? new Date(d).toLocaleString('en-PH', {dateStyle: 'medium', timeStyle: 'short'}) : '—'; };
    var h = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="' + th + '">Pangalan</th><th style="' + th + '">Username</th><th style="' + th + '">Role</th><th style="' + th + '">Huling Login</th><th style="' + th + '"></th></tr></thead><tbody>';
    list.forEach(function(a, i) {
      var me = a.user === currentAdmin.user;
      var roleSel = '<select data-i="' + i + '" onchange="changeAdminRole(+this.getAttribute(\'data-i\'), this.value)"' + (me ? ' disabled' : '') + ' style="padding:4px 6px;border-radius:6px">' +
        ['super', 'principal', 'viewer'].map(function(r) { return '<option value="' + r + '"' + (a.role === r ? ' selected' : '') + '>' + ROLE_LABEL[r] + '</option>'; }).join('') + '</select>';
      h += '<tr' + (a.disabled ? ' style="opacity:.5"' : '') + '><td style="' + td + ';font-weight:600">' + aaEsc(a.name) + (me ? ' <span style="font-size:11px;color:var(--g5)">(ikaw)</span>' : '') +
        (a.mustChange ? '<div style="font-size:11px;color:#b45309">Kailangang magpalit ng password</div>' : '') + '</td>' +
        '<td style="' + td + '">' + aaEsc(a.user) + '</td><td style="' + td + '">' + roleSel + '</td><td style="' + td + ';font-size:12px">' + fmt(a.lastLogin) + '</td>' +
        '<td style="' + td + ';text-align:right;white-space:nowrap">' + (me ? '' :
          '<button class="btn btn-s btn-sm" onclick="resetAdminPassword(' + i + ')">Reset Password</button> ' +
          '<button class="btn btn-s btn-sm" onclick="toggleAdminDisabled(' + i + ')">' + (a.disabled ? 'Enable' : 'Disable') + '</button> ' +
          '<button class="btn btn-s btn-sm" style="color:#b91c1c" onclick="removeAdminAccount(' + i + ')">Remove</button>') + '</td></tr>';
    });
    el.innerHTML = h + '</tbody></table></div>';
  });
}

function addAdminAccount() {
  var name = document.getElementById('naName').value.trim();
  var user = document.getElementById('naUser').value.trim();
  var pass = document.getElementById('naPass').value;
  var role = document.getElementById('naRole').value;
  if (!name || !user) { toast('Ilagay ang pangalan at username.', 'er'); return; }
  if (!/^[A-Za-z0-9._-]{3,30}$/.test(user)) { toast('Username: 3–30 letra/numero (puwede ang . _ -)', 'er'); return; }
  if (pass.length < 8) { toast('Ang password ay dapat hindi bababa sa 8 characters.', 'er'); return; }
  readDoc('admin_accounts').then(function(list) {
    list = list || [];
    if (list.some(function(a) { return String(a.user).toLowerCase() === user.toLowerCase(); })) { toast('May gumagamit na ng username na iyan.', 'er'); return; }
    var salt = randomSalt();
    return hashAdminPass(salt, user, pass).then(function(h) {
      list.push({user: user, name: name, role: role, salt: salt, hash: h, mustChange: true, created: new Date().toISOString(), createdBy: currentAdmin.name});
      writeAccounts(list);
      ['naName', 'naUser', 'naPass'].forEach(function(id) { document.getElementById(id).value = ''; });
      toast('Account created: ' + user + ' (' + ROLE_LABEL[role] + ')', 'su');
      renderAdminAccounts();
    });
  });
}

function superCount(list) { return list.filter(function(a) { return a.role === 'super' && !a.disabled; }).length; }

function changeAdminRole(i, role) {
  readDoc('admin_accounts').then(function(list) {
    var a = list[i]; if (!a || a.user === currentAdmin.user) return;
    if (a.role === 'super' && role !== 'super' && superCount(list) <= 1) { toast('Kailangang may kahit isang Super Admin.', 'er'); renderAdminAccounts(); return; }
    a.role = role; writeAccounts(list); toast(a.name + ' ay ' + ROLE_LABEL[role] + ' na.', 'su'); renderAdminAccounts();
  });
}

function resetAdminPassword(i) {
  readDoc('admin_accounts').then(function(list) {
    var a = list[i]; if (!a) return;
    var temp = prompt('Bagong pansamantalang password para kay ' + a.name + ' (min. 8 characters):', '');
    if (temp === null) return;
    if (temp.length < 8) { toast('Min. 8 characters.', 'er'); return; }
    var salt = randomSalt();
    return hashAdminPass(salt, a.user, temp).then(function(h) {
      a.salt = salt; a.hash = h; a.mustChange = true; writeAccounts(list);
      toast('Na-reset. Ibigay kay ' + a.name + ' ang pansamantalang password.', 'su'); renderAdminAccounts();
    });
  });
}

function toggleAdminDisabled(i) {
  readDoc('admin_accounts').then(function(list) {
    var a = list[i]; if (!a || a.user === currentAdmin.user) return;
    if (!a.disabled && a.role === 'super' && superCount(list) <= 1) { toast('Kailangang may kahit isang Super Admin.', 'er'); return; }
    a.disabled = !a.disabled; writeAccounts(list); toast(a.disabled ? 'Disabled' : 'Enabled', 'su'); renderAdminAccounts();
  });
}

function removeAdminAccount(i) {
  readDoc('admin_accounts').then(function(list) {
    var a = list[i]; if (!a || a.user === currentAdmin.user) return;
    if (a.role === 'super' && superCount(list) <= 1) { toast('Kailangang may kahit isang Super Admin.', 'er'); return; }
    if (!confirm('Tanggalin ang admin account ni ' + a.name + ' (' + a.user + ')?')) return;
    list.splice(i, 1); writeAccounts(list); toast('Account removed', 'su'); renderAdminAccounts();
  });
}

console.log('Admin Accounts v3 loaded');
