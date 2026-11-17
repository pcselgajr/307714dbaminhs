// ============================================
// ADMIN SECURITY: sign-up approval, password reset, inboxes, Grade Lock sa server,
// at paglipat ng mga lumang account sa Firebase Authentication.
// ============================================

function secIsAdmin() { return !!(window.currentAdmin && (currentAdmin.role === 'super' || currentAdmin.role === 'principal')); }
function secIsSuper() { return !!(window.currentAdmin && currentAdmin.role === 'super'); }
function secEsc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function secSleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// ---------- Inboxes: mga bagong sign-up, reset request at enrollment ----------
// Ang public ay puwedeng MAGPADALA lang (create) sa inbox; ang admin ang naglilipat nito sa listahan.
function syncInboxes() {
  if (!secIsAdmin()) return Promise.resolve();
  return Promise.all([syncSignupInbox(), syncResetInbox(), syncEnrollInbox()]).catch(function(e) { console.warn('syncInboxes:', e); });
}

function syncSignupInbox() {
  return db.collection('signup_inbox').get().then(function(snap) {
    if (snap.empty) return;
    var docs = [];
    snap.forEach(function(d) { docs.push({uid: d.id, data: d.data()}); });
    return atomicUpdate('pending', [], function(pending) {
      var maxId = 0;
      pending.forEach(function(p) { if (p.id > maxId) maxId = p.id; });
      docs.forEach(function(d) {
        if (pending.some(function(p) { return p.uid === d.uid; })) return;
        var x = d.data || {};
        pending.unshift({id: ++maxId, name: x.name || '', type: x.type || '', email: x.email || '', idnum: x.idnum || '',
          grade: x.grade || '', gender: x.gender || '', date: x.date || new Date().toISOString().split('T')[0],
          uid: d.uid, authEmail: x.authEmail || '', account: x.account || null});
      });
      return pending;
    }).then(function(n) {
      P = n; try { rP(); uS(); } catch (e) {}
      return Promise.all(docs.map(function(d) { return db.collection('signup_inbox').doc(d.uid).delete(); }));
    });
  });
}

function syncResetInbox() {
  return db.collection('reset_inbox').get().then(function(snap) {
    if (snap.empty) return;
    var docs = [];
    snap.forEach(function(d) { docs.push({id: d.id, data: d.data()}); });
    var accts = loadData('accounts', []) || [];
    return atomicUpdate('passwordResetRequests', [], function(reqs) {
      docs.forEach(function(d, i) {
        var x = d.data || {};
        if (reqs.some(function(r) { return r.inboxId === d.id; })) return;
        var acct = findAccountByLogin(accts, x.loginId);
        reqs.unshift({id: Date.now() + i, inboxId: d.id, accountId: acct ? acct.id : '', accountType: acct ? acct.type : '?',
          name: (x.name || '') + (x.note ? ' — ' + x.note : ''), lookupId: x.loginId || '', status: 'pending',
          requestedAt: new Date().toISOString().split('T')[0]});
      });
      return reqs;
    }).then(function(n) {
      PWRESET = n; try { rPwReset(); } catch (e) {}
      return Promise.all(docs.map(function(d) { return db.collection('reset_inbox').doc(d.id).delete(); }));
    });
  });
}

function syncEnrollInbox() {
  return db.collection('enroll_inbox').get().then(function(snap) {
    if (snap.empty) return;
    var docs = [];
    snap.forEach(function(d) { docs.push({id: d.id, data: d.data()}); });
    return atomicUpdate('enrollments', [], function(list) {
      if (!Array.isArray(list)) list = Object.values(list || {});
      docs.forEach(function(d) {
        if (list.some(function(e) { return e.inboxId === d.id; })) return;
        var e = d.data || {}; e.inboxId = d.id; delete e.at;
        list.unshift(e);
      });
      return list;
    }).then(function() {
      try { if (typeof rEnrollments === 'function') rEnrollments(); } catch (e) {}
      return Promise.all(docs.map(function(d) { return db.collection('enroll_inbox').doc(d.id).delete(); }));
    });
  });
}

function findAccountByLogin(accts, id) {
  var s = String(id || '').trim(), l = s.toLowerCase();
  return (accts || []).find(function(a) {
    return a.id === l || a.id === s || a.lrn === s || a.eid === s || (a.email && a.email.toLowerCase() === l);
  }) || null;
}

// ---------- Pag-approve ng sign-up: ginagawang aktibo ang account ----------
function activatePending(p, overrides) {
  if (!p || !p.uid) return Promise.resolve(); // lumang pending (may account na bago ang update)
  var acc = JSON.parse(JSON.stringify(p.account || {}));
  overrides = overrides || {};
  acc.type = acc.type || String(p.type || '').toLowerCase();
  acc.fname = acc.fname || String(p.name || '').split(' ')[0];
  acc.lname = acc.lname || String(p.name || '').split(' ').slice(1).join(' ');
  acc.email = acc.email || p.email || '';
  if (acc.type === 'student') { acc.lrn = overrides.lrn || acc.lrn || p.idnum; acc.id = acc.lrn; if (overrides.grade) acc.grade = overrides.grade; }
  else if (acc.type === 'teacher') { acc.eid = overrides.eid || acc.eid || p.idnum; acc.id = acc.eid; }
  else if (acc.type === 'parent') {
    acc.childLrn = acc.childLrn || p.idnum; acc.id = (acc.id || acc.email || '').toLowerCase();
    var child = (loadData('students', []) || []).find(function(s) { return s.lrn === acc.childLrn; });
    if (child) acc.childName = child.name;
  }
  delete acc.pw;
  acc.uid = p.uid; acc.authEmail = p.authEmail; acc.approvedAt = new Date().toISOString(); acc.approvedBy = adminName();
  return activateIdentity({uid: p.uid, email: p.authEmail, role: acc.type, name: (acc.fname + ' ' + acc.lname).trim(),
                           accountId: acc.id, loginIds: [acc.id, acc.lrn, acc.eid, acc.email]}).then(function() {
    return atomicUpdate('accounts', [], function(cur) {
      var i = cur.findIndex(function(a) { return a.id === acc.id; });
      if (i > -1) { var old = cur[i]; delete old.pw; Object.keys(acc).forEach(function(k) { old[k] = acc[k]; }); }
      else cur.push(acc);
      return cur;
    });
  }).catch(function(err) {
    console.error('activatePending error:', err);
    toast('Hindi na-activate ang account ni ' + p.name + ': ' + friendlyAuthError(err), 'er');
  });
}

// ---------- Password reset ng user (students, teachers, parents) ----------
function resetUserAccount(acct, temp) {
  var oldUid = acct.uid;
  return createAuthIdentity(acct.id, temp).then(function(idn) {
    return activateIdentity({uid: idn.uid, email: idn.email, role: acct.type, name: ((acct.fname || '') + ' ' + (acct.lname || '')).trim(),
                             accountId: acct.id, loginIds: [acct.id, acct.lrn, acct.eid, acct.email], mustChange: true}).then(function() {
      if (oldUid && oldUid !== idn.uid) return db.collection('roles').doc(oldUid).delete().catch(function() {});
    }).then(function() {
      return atomicUpdate('accounts', [], function(cur) {
        cur.forEach(function(a) { if (a.id === acct.id) { delete a.pw; a.uid = idn.uid; a.authEmail = idn.email; a.resetAt = new Date().toISOString(); } });
        return cur;
      });
    });
  });
}

window.approvePwReset = function(id) {
  var req = PWRESET.find(function(r) { return r.id === id; });
  if (!req) return;
  var accts = loadData('accounts', []) || [];
  var acct = (req.accountId && accts.find(function(a) { return a.id === req.accountId; })) || findAccountByLogin(accts, req.lookupId);
  if (!acct) { toast('Walang account na tugma sa "' + req.lookupId + '". I-reject ito o ipa-sign up ulit ang user.', 'er'); return; }
  var temp = prompt('I-verify muna kung si ' + acct.fname + ' ' + acct.lname + ' (' + acct.id + ') nga ang humiling.\n\nIlagay ang PANSAMANTALANG password na ibibigay mo sa kanya (min. 8 characters). Papalitan niya ito pagka-login:', '');
  if (temp === null) return;
  if (temp.length < 8) { toast('Min. 8 characters.', 'er'); return; }
  resetUserAccount(acct, temp).then(function() {
    return atomicUpdate('passwordResetRequests', [], function(reqs) {
      reqs.forEach(function(r) { if (r.id === req.id) { r.status = 'approved'; delete r.newPassword; r.decidedBy = adminName(); r.decidedAt = new Date().toISOString(); } });
      return reqs;
    });
  }).then(function(n) {
    PWRESET = n; rPwReset();
    toast('Na-reset ang password ni ' + acct.fname + '. Ibigay sa kanya nang personal ang pansamantalang password.', 'su');
  }).catch(function(err) { toast(friendlyAuthError(err), 'er'); });
};

// ---------- Grade Lock sa server: locks/{section_term} ----------
function writeLockDoc(key, locked) {
  return db.collection('locks').doc(key).set({locked: !!locked, by: adminName(), at: new Date().toISOString()})
    .catch(function(e) { console.warn('lock write failed', key, e && e.code); });
}
function syncLocks() {
  if (!secIsAdmin()) return Promise.resolve();
  var locks = loadData('gradeLock', {}) || {};
  return db.collection('locks').get().then(function(snap) {
    var cur = {};
    snap.forEach(function(d) { cur[d.id] = !!d.data().locked; });
    var jobs = [];
    Object.keys(locks).forEach(function(k) {
      var want = !!(locks[k] && locks[k].locked);
      if (cur[k] !== want && k.indexOf('/') === -1) jobs.push(writeLockDoc(k, want));
    });
    return Promise.all(jobs);
  }).catch(function(e) { console.warn('syncLocks:', e); });
}

// ---------- DTR roster: pangalan at Employee ID lang (public), para hindi mailantad ang buong Teachers list ----------
function syncDtrRoster() {
  if (!secIsAdmin()) return;
  var roster = {};
  (loadData('teachers', []) || []).forEach(function(t) { if (t && t.eid) roster[String(t.eid).trim()] = {name: t.name || '', type: 'teacher'}; });
  (loadData('dtr_staff', []) || []).forEach(function(s) { if (s && s.eid) roster[String(s.eid).trim()] = {name: s.name || '', type: 'staff'}; });
  if (JSON.stringify(roster) !== JSON.stringify(loadData('dtr_roster', null))) _rawSaveData('dtr_roster', roster);
}
(function() {
  var inner = window.saveData;
  window.saveData = function(key, data) {
    inner(key, data);
    if (key === 'teachers' || key === 'dtr_staff') setTimeout(syncDtrRoster, 300);
  };
})();

// Grade Lock ng admin: isinusulat din sa locks/{key}
(function() {
  var origToggle = window.toggleGradeLockAdmin, origAll = window.lockAllGradesForTerm;
  if (origToggle) window.toggleGradeLockAdmin = function(key) { origToggle(key); setTimeout(syncLocks, 300); };
  if (origAll) window.lockAllGradesForTerm = function() { origAll(); setTimeout(syncLocks, 300); };
})();

// Pagkatapos mag-load ng admin app
(function() {
  var origEnter = window.enterAdminApp;
  window.enterAdminApp = function() {
    origEnter();
    var tries = 0;
    var wait = setInterval(function() {
      tries++;
      if (typeof P !== 'undefined' && P && window.currentAdmin) {
        clearInterval(wait);
        syncInboxes().then(function() { syncLocks(); syncDtrRoster(); startInboxListeners(); try { uS(); } catch (e) {} });
      } else if (tries > 40) clearInterval(wait);
    }, 500);
  };
})();


// ============================================
// DASHBOARD: totoong bilang (walang demo data), real-time na inbox, at gumaganang Refresh
// ============================================
function dashGradeLevel(sec) {
  var m = String(sec || '').match(/(?:^|[^0-9])(7|8|9|10|11|12)(?![0-9])/);
  return m ? +m[1] : null;
}
function dashPendingItems() {
  var items = [];
  var pend = (typeof P !== 'undefined' && P) ? P.length : 0;
  if (pend) items.push({n: pend, label: 'sign-up na naghihintay ng approval', page: 'pending', color: 'var(--o)'});
  var pw = (typeof PWRESET !== 'undefined' && PWRESET) ? PWRESET.filter(function(r) { return r.status === 'pending'; }).length : 0;
  if (pw) items.push({n: pw, label: 'password reset request', page: 'pwreset', color: 'var(--wa)'});
  var en = loadData('enrollments', []) || [];
  if (!Array.isArray(en)) en = Object.values(en);
  var enP = en.filter(function(e) { return !e.status || e.status === 'Pending'; }).length;
  if (enP) items.push({n: enP, label: 'online enrollment na hindi pa napoproseso', page: 'enrollments', color: 'var(--inf)'});
  var gr = 0;
  Object.keys(_cache).forEach(function(k) { if (k.indexOf('gradeReq_') === 0 && _cache[k] && _cache[k].status === 'pending') gr++; });
  if (gr) items.push({n: gr, label: 'request ng pagtatama ng grade', page: 'gradelock', color: 'var(--su)'});
  return items;
}
function renderDashboard() {
  var list = (typeof S !== 'undefined' && S) ? S : [];
  var counts = {7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0}, other = 0;
  // Opisyal na enrollment mula sa Settings (g7–g12); kung wala, bilang ng students sa portal
  var st = (typeof SETTINGS !== 'undefined' && SETTINGS) ? SETTINGS : {};
  var fromSettings = [7, 8, 9, 10, 11, 12].some(function(g) { return parseInt(st['g' + g], 10) > 0; });
  if (fromSettings) [7, 8, 9, 10, 11, 12].forEach(function(g) { counts[g] = parseInt(st['g' + g], 10) || 0; });
  else list.forEach(function(s) { var g = dashGradeLevel(s.grade); if (g) counts[g]++; else other++; });
  var max = Math.max.apply(null, Object.values(counts).concat([1]));
  var bars = document.getElementById('dashBars');
  if (bars) {
    bars.innerHTML = [7, 8, 9, 10, 11, 12].map(function(g) {
      var h = Math.round(counts[g] / max * 90);
      return '<div class="bcol"><div class="bv">' + counts[g] + '</div><div class="bar" style="height:' + Math.max(h, 2) + '%;background:var(--' + (g >= 11 ? 'n' : 'o') + ')"></div><div class="bl">G' + g + '</div></div>';
    }).join('');
  }
  var jhs = counts[7] + counts[8] + counts[9] + counts[10], shs = counts[11] + counts[12], tot = jhs + shs;
  var pj = tot ? Math.round(jhs / tot * 100) : 0, ps = tot ? 100 - pj : 0;
  var donut = document.getElementById('dashDonut');
  if (donut) {
    donut.innerHTML = '<svg width="110" height="110" viewBox="0 0 42 42"><circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--g2)" stroke-width="4"/>' +
      (tot ? '<circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--o)" stroke-width="4" stroke-dasharray="' + pj + ' ' + (100 - pj) + '" stroke-dashoffset="25"/>' +
             '<circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--n)" stroke-width="4" stroke-dasharray="' + ps + ' ' + (100 - ps) + '" stroke-dashoffset="' + (25 - pj) + '"/>' : '') +
      '<text x="21" y="22" text-anchor="middle" font-size="6" font-weight="700" fill="var(--g9)" font-family="var(--fb)">' + (fromSettings ? tot : list.length).toLocaleString() + '</text></svg>' +
      '<div class="dleg"><div class="dli"><div class="dld" style="background:var(--o)"></div>JHS &mdash; ' + jhs + ' (' + pj + '%)</div>' +
      '<div class="dli"><div class="dld" style="background:var(--n)"></div>SHS &mdash; ' + shs + ' (' + ps + '%)</div>' +
      (other ? '<div class="dli" style="color:var(--g5)">Walang grade level: ' + other + '</div>' : '') +
      '<div class="dli" style="color:var(--g5);font-size:11px">' + (fromSettings ? 'Mula sa opisyal na enrollment (Settings)' : 'Mula sa mga student sa portal') + '</div></div>';
  }
  var items = dashPendingItems();
  var act = document.getElementById('dashActivity');
  if (act) {
    act.innerHTML = items.length ? items.map(function(it) {
      return '<div class="act-item" style="cursor:pointer" onclick="dashGo(\'' + it.page + '\')"><div class="act-dot" style="background:' + it.color + '"></div><div><p><strong>' + it.n + '</strong> ' + it.label + '</p><div class="time">I-click para buksan</div></div></div>';
    }).join('') : '<div class="act-item"><div class="act-dot" style="background:var(--su)"></div><div><p>Walang naghihintay na asikasuhin. &#10003;</p></div></div>';
  }
  var dot = document.getElementById('notifDot');
  if (dot) dot.style.display = items.length ? '' : 'none';
}
function dashGo(page) {
  var btn = Array.prototype.find.call(document.querySelectorAll('.sl'), function(b) { return (b.getAttribute('onclick') || '').indexOf("go('" + page + "'") > -1; });
  go(page, btn || document.createElement('div'));
}
function showAdminNotifs() {
  var items = dashPendingItems();
  if (!items.length) { toast('Walang naghihintay na asikasuhin.', 'su'); return; }
  dashGo('dash');
  toast(items.map(function(it) { return it.n + ' ' + it.label; }).join(' · '), 'su');
}
window.updateDashChart = function() { try { renderDashboard(); } catch (e) {} };
(function() {
  var inner = window.uS;
  if (inner) window.uS = function() { inner(); try { renderDashboard(); } catch (e) { console.warn('dashboard:', e); } };
})();

// Real-time: kusang lalabas ang bagong sign-up, reset request at enrollment habang bukas ang dashboard
var _inboxUnsubs = [];
function startInboxListeners() {
  if (!secIsAdmin() || _inboxUnsubs.length) return;
  var timers = {};
  var run = function(name, fn) {
    clearTimeout(timers[name]);
    timers[name] = setTimeout(function() { fn().then(function() { try { uS(); } catch (e) {} }).catch(function(e) { console.warn(name, e); }); }, 400);
  };
  [['signup_inbox', syncSignupInbox], ['reset_inbox', syncResetInbox], ['enroll_inbox', syncEnrollInbox]].forEach(function(x) {
    _inboxUnsubs.push(db.collection(x[0]).onSnapshot(function(snap) {
      if (!snap.empty) run(x[0], x[1]);
    }, function(err) { console.warn('inbox listener ' + x[0] + ':', err && err.code); }));
  });
}

// Refresh button: kunin ulit ang lahat ng datos at ang mga bagong padala
function adminRefresh() {
  toast('Kinukuha ang pinakabagong datos...', 'su');
  syncInboxes().then(function() {
    loadAllFromFirebase(function() {
      initData();
      try { renderAll(); } catch (e) { console.warn(e); }
      try { uS(); } catch (e) {}
      toast('Na-refresh ang datos.', 'su');
    });
  });
}

// ---------- Paglipat ng mga lumang account sa Firebase Authentication ----------
function secLog(msg, color) {
  var el = document.getElementById('secLog'); if (!el) return;
  if (!el.style.padding || el.style.padding === '0px') el.style.padding = '10px';
  el.innerHTML += '<div' + (color ? ' style="color:' + color + '"' : '') + '>' + secEsc(msg) + '</div>';
  el.scrollTop = el.scrollHeight;
}

function securityCheck() {
  if (!secIsSuper()) { toast('Super Admin lang ang may access dito.', 'er'); return Promise.resolve(); }
  return Promise.all([fetchFresh('accounts', []), readDoc('admin_accounts'), fetchFresh('passwordResetRequests', [])]).then(function(r) {
    var accts = r[0] || [], admins = r[1] || [], reqs = r[2] || [];
    var migrated = accts.filter(function(a) { return a.uid; }).length;
    var withPw = accts.filter(function(a) { return a.pw; });
    var shortPw = withPw.filter(function(a) { return !a.uid && String(a.pw).length < 6; });
    var noAuth = accts.filter(function(a) { return !a.uid && !a.pw; });
    var adminsLeft = admins.filter(function(a) { return !a.uid && !a.disabled; });
    var reqPw = reqs.filter(function(x) { return x.newPassword; }).length;
    var ok = function(b) { return b ? '&#9989;' : '&#9888;&#65039;'; };
    var h = '<div style="line-height:1.9">' +
      ok(withPw.length === 0) + ' Accounts: <strong>' + migrated + '</strong> sa ' + accts.length + ' ang nailipat na; <strong>' + withPw.length + '</strong> ang may plain-text na password pa.<br>' +
      (shortPw.length ? '&#9888;&#65039; ' + shortPw.length + ' account ang masyadong maikli ang password (kulang sa 6) kaya hindi mailipat. Bigyan sila ng pansamantalang password: ' + secResetButtons(shortPw) + '<br>' : '') +
      (noAuth.length ? '&#9888;&#65039; ' + noAuth.length + ' account ang walang password at walang login: ' + secResetButtons(noAuth) + '<br>' : '') +
      ok(adminsLeft.length === 0) + ' Admin accounts: ' + (adminsLeft.length ? '<strong>' + adminsLeft.length + '</strong> ang hindi pa nailipat (' + secEsc(adminsLeft.map(function(a) { return a.user; }).join(', ')) + '): kailangan nilang mag-login nang isang beses, o i-Reset Password.' : 'lahat ay nailipat na.') + '<br>' +
      ok(reqPw === 0) + ' Password reset requests na may naka-save na password: <strong>' + reqPw + '</strong><br>' +
      (withPw.length === 0 && adminsLeft.length === 0 && reqPw === 0 ? '<strong style="color:#166534">Handa na para i-lock ang Firestore Rules.</strong>' : '<strong style="color:#92400E">Hindi pa handa para i-lock ang Rules.</strong>') +
      '</div>';
    document.getElementById('secStatus').innerHTML = h;
    return {accts: accts, withPw: withPw, adminsLeft: adminsLeft, reqPw: reqPw};
  }).catch(function(err) { toast(friendlyAuthError(err), 'er'); });
}

function secResetButtons(list) {
  return list.map(function(a) {
    return '<button class="btn btn-s btn-sm" style="margin:2px" onclick="resetAccountById(\'' + secEsc(a.id).replace(/\\/g, '') + '\')">' +
      secEsc((a.fname || '') + ' ' + (a.lname || '') + ' (' + a.id + ')') + '</button>';
  }).join(' ');
}
// Direktang pag-reset ng password ng isang user account (Super Admin / Principal)
function resetAccountById(id) {
  if (!secIsAdmin()) { toast('Wala kang permiso dito.', 'er'); return; }
  fetchFresh('accounts', []).then(function(accts) {
    var acct = accts.find(function(a) { return a.id === id; });
    if (!acct) { toast('Hindi mahanap ang account.', 'er'); return; }
    var temp = prompt('Pansamantalang password para kay ' + acct.fname + ' ' + acct.lname + ' (' + acct.id + '), min. 8 characters.\nPapalitan niya ito pagka-login:', '');
    if (temp === null) return;
    if (temp.length < 8) { toast('Min. 8 characters.', 'er'); return; }
    return resetUserAccount(acct, temp).then(function() {
      toast('Na-reset. Ibigay nang personal ang pansamantalang password kay ' + acct.fname + '.', 'su');
      if (secIsSuper()) securityCheck();
    });
  }).catch(function(err) { toast(friendlyAuthError(err), 'er'); });
}

var _migrating = false;
function runAccountMigration() {
  if (!secIsSuper()) { toast('Super Admin lang ang may access dito.', 'er'); return; }
  if (_migrating) return;
  if (!confirm('Ililipat ang lahat ng account sa Firebase Authentication at buburahin ang mga password na naka-save sa database.\n\nPareho pa rin ang ID at password ng mga user. Siguraduhing may BACKUP ka na. Ituloy?')) return;
  _migrating = true;
  var btn = document.getElementById('secMigrateBtn'); if (btn) { btn.disabled = true; btn.style.opacity = '.6'; }
  document.getElementById('secLog').innerHTML = '';
  var done = {}, failed = [], skipped = [];
  var commit = function() {
    var ids = Object.keys(done).filter(function(k) { return !done[k].saved; });
    if (!ids.length) return Promise.resolve();
    return atomicUpdate('accounts', [], function(cur) {
      cur.forEach(function(a) {
        var d = done[a.id];
        if (d && !d.saved) { delete a.pw; a.uid = d.uid; a.authEmail = d.email; a.migratedAt = new Date().toISOString(); }
      });
      return cur;
    }).then(function() { ids.forEach(function(k) { done[k].saved = true; }); });
  };
  fetchFresh('accounts', []).then(function(accts) {
    // Mga may uid na pero may password pa (hal. galing sa restore): burahin lang ang password
    var stale = accts.filter(function(a) { return a.uid && a.pw; }).length;
    var todo = accts.filter(function(a) { return a.pw && !a.uid; });
    secLog('Kabuuang account: ' + accts.length + '. Ililipat: ' + todo.length + '.');
    var chain = Promise.resolve();
    if (stale) chain = atomicUpdate('accounts', [], function(cur) { cur.forEach(function(a) { if (a.uid) delete a.pw; }); return cur; })
      .then(function() { secLog('Binura ang lumang password ng ' + stale + ' account na nailipat na.'); });
    todo.forEach(function(a, i) {
      chain = chain.then(function() {
        if (String(a.pw).length < 6) { skipped.push(a.id); secLog('LAKTAW: ' + a.id + ' (password ay kulang sa 6 characters)', '#92400E'); return; }
        var attempt = function(n) {
          return createAuthIdentity(a.id, a.pw).then(function(idn) {
            return activateIdentity({uid: idn.uid, email: idn.email, role: a.type, name: ((a.fname || '') + ' ' + (a.lname || '')).trim(),
                                     accountId: a.id, loginIds: [a.id, a.lrn, a.eid, a.email]}).then(function() {
              done[a.id] = {uid: idn.uid, email: idn.email};
              secLog('OK ' + (i + 1) + '/' + todo.length + ': ' + a.id + ' (' + a.type + ')', '#166534');
            });
          }).catch(function(err) {
            if (err && err.code === 'auth/too-many-requests' && n < 24) {
              secLog('Naabot ang limit ng Firebase sa paggawa ng account. Maghihintay ng 5 minuto bago ituloy (huwag isara ang page)...', '#92400E');
              return commit().then(function() { return secSleep(300000); }).then(function() { return attempt(n + 1); });
            }
            failed.push(a.id); secLog('MALI: ' + a.id + ': ' + friendlyAuthError(err), '#b91c1c');
          });
        };
        return attempt(0).then(function() { return secSleep(250); }).then(function() { if (Object.keys(done).length % 10 === 0) return commit(); });
      });
    });
    return chain.then(commit);
  }).then(function() {
    // Burahin ang mga password na naka-save sa lumang reset requests
    return atomicUpdate('passwordResetRequests', [], function(reqs) { reqs.forEach(function(r) { delete r.newPassword; }); return reqs; })
      .then(function(n) { PWRESET = n; try { rPwReset(); } catch (e) {} });
  }).then(function() { return syncLocks(); }).then(function() {
    syncDtrRoster();
    secLog('TAPOS. Nailipat: ' + Object.keys(done).length + ', nilaktawan: ' + skipped.length + ', may mali: ' + failed.length + '.', '#1B2A4A');
    toast('Tapos ang paglipat ng mga account.', 'su');
    return securityCheck();
  }).catch(function(err) {
    secLog('Huminto dahil sa error: ' + friendlyAuthError(err), '#b91c1c');
    return commit();
  }).then(function() {
    _migrating = false; if (btn) { btn.disabled = false; btn.style.opacity = ''; }
  });
}

// ---------- Restore ng backup: huwag ibalik ang mga plain-text password ----------
(function() {
  var inner = window.saveData;
  window.saveData = function(key, data) {
    if (key === 'accounts' && Array.isArray(data)) {
      var cur = loadData('accounts', []) || [];
      data = data.map(function(a) {
        var c = cur.find(function(x) { return x.id === a.id && x.uid; });
        if (c) { a = JSON.parse(JSON.stringify(a)); a.uid = c.uid; a.authEmail = c.authEmail; delete a.pw; }
        else if (a && a.uid && a.pw) { a = JSON.parse(JSON.stringify(a)); delete a.pw; }
        return a;
      });
    }
    if (key === 'passwordResetRequests' && Array.isArray(data)) {
      data = data.map(function(r) { if (r && r.newPassword) { r = JSON.parse(JSON.stringify(r)); delete r.newPassword; } return r; });
    }
    inner(key, data);
  };
})();

console.log('Admin Security loaded');
