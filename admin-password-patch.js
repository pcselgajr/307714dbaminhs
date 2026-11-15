// ============================================
// ADMIN ACCOUNTS v3 — hiwalay na account at role para sa bawat admin
//   super     : buong access
//   principal : lahat maliban sa Settings, Backup, Admin Accounts
//   viewer    : titingin lang (walang mababago)
// Login: Firebase Authentication (roles/{uid}). Ang lumang hash ay ginagamit lang sa unang paglipat.
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

// ---------- LOGIN (Firebase Authentication) ----------
var ADMIN_ROLES = ['super', 'principal', 'viewer'];
function adminLoginKey(user) { return 'admin:' + String(user).trim().toLowerCase(); }

window.doLogin = function() {
  var user = document.getElementById('lu').value.trim();
  var pass = document.getElementById('lp').value;
  if (!user || !pass) { toast('Ilagay ang username at password', 'er'); return; }
  if (!auth) { toast('Hindi pa handa ang login. I-refresh ang page.', 'er'); return; }
  lookupLogin(adminLoginKey(user)).then(function(map) {
    if (map && map.email) {
      return auth.signInWithEmailAndPassword(map.email, pass).then(function() { return afterAdminSignIn(); });
    }
    return legacyAdminLogin(user, pass);
  }).catch(function(err) {
    console.warn('Admin login error:', err && err.code);
    toast(friendlyAuthError(err), 'er');
    if (auth.currentUser) auth.signOut();
  });
};

// Admin account na hindi pa nailipat sa Firebase Auth (naka-hash pa ang password sa admin_accounts)
function legacyAdminLogin(user, pass) {
  if (!window.crypto || !crypto.subtle) { toast('Kailangang naka-HTTPS ang admin page.', 'er'); return Promise.resolve(); }
  return readDoc('admin_accounts').then(function(list) {
    if (list && list.length) {
      var acct = list.filter(function(a) { return String(a.user).toLowerCase() === user.toLowerCase() && !a.disabled && a.hash; })[0];
      if (!acct) { toast('Mali ang username o password', 'er'); return; }
      return hashAdminPass(acct.salt, acct.user, pass).then(function(h) {
        if (h !== acct.hash) { toast('Mali ang username o password', 'er'); return; }
        return migrateAdminSelf(acct, list, pass);
      });
    }
    // Pinakaunang setup: lumang iisang admin account (admin_auth)
    return readDoc('admin_auth').then(function(old) {
      if (old && old.migrated) { toast('Mali ang username o password', 'er'); return; }
      var oldUser = (old && old.user) || 'admin';
      var oldPass = (old && old.pass) || 'admin123';
      if (user.toLowerCase() !== String(oldUser).toLowerCase() || pass !== oldPass) { toast('Mali ang username o password', 'er'); return; }
      var acct = {user: oldUser, name: 'Administrator', role: 'super', mustChange: true, created: new Date().toISOString()};
      _rawSaveData('admin_auth', {migrated: true, at: new Date().toISOString()});
      return migrateAdminSelf(acct, [acct], pass);
    });
  }).catch(function(err) {
    if (err && err.code === 'permission-denied') { toast('Mali ang username o password', 'er'); return; }
    throw err;
  });
}
function migrateAdminSelf(acct, list, pass) {
  if (String(pass).length < 6) { toast('Masyadong maikli ang password. Ipa-reset sa Super Admin.', 'er'); return; }
  var email = makeAuthEmail('admin.' + acct.user);
  return auth.createUserWithEmailAndPassword(email, pass).then(function(cred) {
    var uid = cred.user.uid;
    var mustChange = !!acct.mustChange || pass.length < 8;
    return activateIdentity({uid: uid, email: email, role: acct.role || 'viewer', name: acct.name || acct.user,
                             loginIds: [adminLoginKey(acct.user)], mustChange: mustChange}).then(function() {
      list.forEach(function(a) {
        if (a.user === acct.user) { delete a.salt; delete a.hash; a.uid = uid; a.authEmail = email; a.migratedAt = new Date().toISOString(); }
      });
      if (list.indexOf(acct) === -1) list.push(acct);
      writeAccounts(list);
      return afterAdminSignIn();
    });
  });
}

function afterAdminSignIn() {
  var u = auth.currentUser; if (!u) return Promise.resolve();
  return getRoleDoc(u.uid).then(function(r) {
    if (!r || r.disabled || ADMIN_ROLES.indexOf(r.role) === -1) {
      window.portalRole = null;
      return auth.signOut().then(function() {
        toast(r && r.disabled ? 'Naka-disable ang admin account na ito.' : 'Hindi admin account ito.', 'er');
      });
    }
    window.portalRole = r;
    return readDoc('admin_accounts').then(function(list) {
      list = list || [];
      var acct = list.filter(function(a) { return a.uid === u.uid; })[0] ||
                 {user: String(r.loginId || '').replace(/^admin:/, ''), name: r.name, role: r.role};
      acct.role = r.role;
      startAdminSession(acct, list, r);
    });
  });
}

function startAdminSession(acct, list, roleDoc) {
  currentAdmin = {user: acct.user, name: acct.name || acct.user, role: acct.role || 'viewer', uid: auth.currentUser ? auth.currentUser.uid : null};
  window.currentAdmin = currentAdmin;
  document.getElementById('lp').value = '';
  if (currentAdmin.role === 'super') {
    list.forEach(function(a) { if (a.uid && a.uid === currentAdmin.uid) a.lastLogin = new Date().toISOString(); });
    writeAccounts(list);
  }
  applyRoleUI();
  enterAdminApp();
  refreshDataAccess();
  if (roleDoc && roleDoc.mustChange) setTimeout(function() { openMyPassword(true); }, 600);
}

window.doLogout = function() {
  currentAdmin = null; window.currentAdmin = null; window.portalRole = null;
  var go = function() { location.reload(); };
  if (auth && auth.currentUser) auth.signOut().then(go, go); else go();
};

// Kapag ni-refresh ang admin page habang naka-login sa parehong tab
if (auth) {
  try { auth.setPersistence(firebase.auth.Auth.Persistence.SESSION); } catch (e) {}
  var _admRestore = false;
  auth.onAuthStateChanged(function(u) {
    if (_admRestore) return; _admRestore = true;
    if (u && !currentAdmin) afterAdminSignIn().catch(function(e) { console.error(e); });
  });
}

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
  var u = auth && auth.currentUser;
  if (!u) { toast('Mag-login muna.', 'er'); return; }
  var cred = firebase.auth.EmailAuthProvider.credential(u.email, cur);
  u.reauthenticateWithCredential(cred).then(function() { return u.updatePassword(np); }).then(function() {
    return db.collection('roles').doc(u.uid).update({mustChange: false}).catch(function() {});
  }).then(function() {
    _forcePw = false;
    document.getElementById('myPwModal').style.display = 'none';
    toast('Napalitan na ang password mo.', 'su');
  }).catch(function(err) {
    toast(err && (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') ? 'Mali ang kasalukuyang password.' : friendlyAuthError(err), 'er');
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
        (!a.uid ? '<div style="font-size:11px;color:#b45309">Hindi pa nailipat sa bagong login: kailangang mag-login muna siya, o i-Reset Password</div>' : '') + '</td>' +
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
    return createAuthIdentity('admin.' + user, pass).then(function(idn) {
      return activateIdentity({uid: idn.uid, email: idn.email, role: role, name: name, loginIds: [adminLoginKey(user)], mustChange: true}).then(function() {
        list.push({user: user, name: name, role: role, uid: idn.uid, authEmail: idn.email, created: new Date().toISOString(), createdBy: currentAdmin.name});
        writeAccounts(list);
        ['naName', 'naUser', 'naPass'].forEach(function(id) { document.getElementById(id).value = ''; });
        toast('Account created: ' + user + ' (' + ROLE_LABEL[role] + ')', 'su');
        renderAdminAccounts();
      });
    });
  }).catch(function(err) { toast(friendlyAuthError(err), 'er'); });
}

function superCount(list) { return list.filter(function(a) { return a.role === 'super' && !a.disabled; }).length; }

function changeAdminRole(i, role) {
  readDoc('admin_accounts').then(function(list) {
    var a = list[i]; if (!a || a.user === currentAdmin.user) return;
    if (a.role === 'super' && role !== 'super' && superCount(list) <= 1) { toast('Kailangang may kahit isang Super Admin.', 'er'); renderAdminAccounts(); return; }
    var p = a.uid ? db.collection('roles').doc(a.uid).update({role: role}) : Promise.resolve();
    return p.then(function() {
      a.role = role; writeAccounts(list); toast(a.name + ' ay ' + ROLE_LABEL[role] + ' na.', 'su'); renderAdminAccounts();
    });
  }).catch(function(err) { toast(friendlyAuthError(err), 'er'); });
}

// Pag-reset: gumagawa ng bagong Auth identity na may pansamantalang password, at inililipat dito ang role
function resetAdminPassword(i) {
  readDoc('admin_accounts').then(function(list) {
    var a = list[i]; if (!a) return;
    var temp = prompt('Bagong pansamantalang password para kay ' + a.name + ' (min. 8 characters):', '');
    if (temp === null) return;
    if (temp.length < 8) { toast('Min. 8 characters.', 'er'); return; }
    var oldUid = a.uid;
    return createAuthIdentity('admin.' + a.user, temp).then(function(idn) {
      return activateIdentity({uid: idn.uid, email: idn.email, role: a.role, name: a.name, loginIds: [adminLoginKey(a.user)], mustChange: true}).then(function() {
        if (oldUid && oldUid !== idn.uid) return db.collection('roles').doc(oldUid).delete().catch(function() {});
      }).then(function() {
        delete a.salt; delete a.hash; a.uid = idn.uid; a.authEmail = idn.email; a.resetAt = new Date().toISOString();
        writeAccounts(list);
        toast('Na-reset. Ibigay kay ' + a.name + ' ang pansamantalang password.', 'su'); renderAdminAccounts();
      });
    });
  }).catch(function(err) { toast(friendlyAuthError(err), 'er'); });
}

function toggleAdminDisabled(i) {
  readDoc('admin_accounts').then(function(list) {
    var a = list[i]; if (!a || a.user === currentAdmin.user) return;
    if (!a.disabled && a.role === 'super' && superCount(list) <= 1) { toast('Kailangang may kahit isang Super Admin.', 'er'); return; }
    var next = !a.disabled;
    var p = a.uid ? db.collection('roles').doc(a.uid).update({disabled: next}) : Promise.resolve();
    return p.then(function() { a.disabled = next; writeAccounts(list); toast(a.disabled ? 'Disabled' : 'Enabled', 'su'); renderAdminAccounts(); });
  }).catch(function(err) { toast(friendlyAuthError(err), 'er'); });
}

function removeAdminAccount(i) {
  readDoc('admin_accounts').then(function(list) {
    var a = list[i]; if (!a || a.user === currentAdmin.user) return;
    if (a.role === 'super' && superCount(list) <= 1) { toast('Kailangang may kahit isang Super Admin.', 'er'); return; }
    if (!confirm('Tanggalin ang admin account ni ' + a.name + ' (' + a.user + ')?')) return;
    var p = Promise.all([
      a.uid ? db.collection('roles').doc(a.uid).delete() : Promise.resolve(),
      db.collection('login_map').doc(adminLoginKey(a.user)).delete()
    ]);
    return p.then(function() { list.splice(i, 1); writeAccounts(list); toast('Account removed', 'su'); renderAdminAccounts(); });
  }).catch(function(err) { toast(friendlyAuthError(err), 'er'); });
}

console.log('Admin Accounts v3 loaded');
