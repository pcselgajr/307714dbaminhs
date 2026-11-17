// ============================================
// DBAMINHS FIREBASE DATA LAYER
// Replaces localStorage with Cloud Firestore
// ============================================

var firebaseConfig = {
  apiKey: "AIzaSyBV3UhpZNgn19cvgAHqckNniGTu8fX8gXw",
  authDomain: "dbaminhs-bd727.firebaseapp.com",
  projectId: "dbaminhs-bd727",
  storageBucket: "dbaminhs-bd727.firebasestorage.app",
  messagingSenderId: "459830769786",
  appId: "1:459830769786:web:8f537cc381e242222a63c3"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
console.log("Firebase connected!");

// Cache for fast access
var _cache = {};

// Load data from Firestore (returns from cache first, then updates)
function loadData(key, defaults) {
  if (_cache[key]) return _cache[key];
  return JSON.parse(JSON.stringify(defaults));
}

// Save data to Firestore AND cache
function saveData(key, data) {
  _cache[key] = data;
  db.collection('portal_data').doc(key).set({
    data: JSON.stringify(data),
    updated: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function() {
    console.log('Saved to Firebase:', key);
  }).catch(function(err) {
    console.error('Firebase save error:', key, err);
    if (err && err.code === 'permission-denied' && typeof toast === 'function') {
      toast('Hindi na-save: wala kang permiso o naka-lock na ito.', 'er');
    }
  });
}

// Ligtas na pag-update ng isang listahan kahit may sabay-sabay na nagse-save.
// Kinukuha ang pinakabagong laman mula sa Firebase, binabago ito ng `mutate`, at isinusulat
// nang sabay (Firestore transaction). Kapag may ibang nagsulat sa pagitan, inuulit ito ng Firebase.
// Puwedeng mag-throw ang mutate ng Error na may .userMessage para kanselahin ang pagbabago.
function atomicUpdate(key, defaults, mutate) {
  var ref = db.collection('portal_data').doc(key);
  return db.runTransaction(function(t) {
    return t.get(ref).then(function(doc) {
      var cur = defaults;
      if (doc.exists) { try { cur = JSON.parse(doc.data().data); } catch (e) { cur = defaults; } }
      cur = JSON.parse(JSON.stringify(cur === undefined ? defaults : cur));
      var next = mutate(cur);
      if (next === undefined) next = cur;
      t.set(ref, { data: JSON.stringify(next), updated: firebase.firestore.FieldValue.serverTimestamp() });
      return next;
    });
  }).then(function(next) {
    _cache[key] = next;
    return next;
  });
}

// Kinukuha ang pinakabagong laman ng isang document (hal. sa pag-login)
function fetchFresh(key, defaults) {
  return db.collection('portal_data').doc(key).get().then(function(doc) {
    if (doc.exists) { try { _cache[key] = JSON.parse(doc.data().data); } catch (e) {} }
    return loadData(key, defaults);
  });
}

// ============================================
// AUTH + SEGURIDAD
// Firebase Authentication ang nagbe-verify ng login. Ang role ng bawat user ay nasa
// collection na `roles/{uid}`, at ang LRN / Employee ID / email ay naka-map sa
// panloob na Auth email sa `login_map/{id}`. Walang password na naka-save sa database.
// ============================================
var auth = (firebase.auth ? firebase.auth() : null);
var AUTH_EMAIL_DOMAIN = 'u.dbaminhs.org';
window.portalRole = null;   // {role, loginId, name, ...} kapag naka-login at may role

// Mga document na puwedeng basahin kahit hindi naka-login (homepage at DTR)
var PUBLIC_KEYS = ['settings', 'news', 'events', 'achievements', 'alumni', 'gallery', 'history',
                   'dtr_settings', 'dtr_roster', 'dtr_daily_code', 'dtr_employees'];
function isPublicKey(k) {
  return PUBLIC_KEYS.indexOf(k) > -1 || /^dtr_code_/.test(k) || /^dtr_\d{4}-\d{2}-\d{2}$/.test(k);
}
// Puwedeng magdagdag ang isang pahina (hal. DTR) ng iba pang public key na kailangan nito
window.EXTRA_PUBLIC_KEYS = window.EXTRA_PUBLIC_KEYS || null;
function hasDataAccess() { return !!(auth && auth.currentUser && window.portalRole); }

function normLoginId(id) { return String(id || '').trim().toLowerCase(); }
function makeAuthEmail(loginId) {
  var local = normLoginId(loginId).replace(/@/g, '.at.').replace(/[^a-z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.').replace(/^[._-]+|[._-]+$/g, '').slice(0, 40) || 'user';
  var r = Math.random().toString(36).slice(2, 8);
  return local + '.' + r + '@' + AUTH_EMAIL_DOMAIN;
}

// Pangalawang Firebase app: para makagawa ang admin ng Auth account ng iba
// nang hindi siya nala-logout sa sarili niyang session.
var _secondaryApp = null;
function secondaryApp() {
  if (!_secondaryApp) {
    _secondaryApp = firebase.initializeApp(firebaseConfig, 'secondary');
    try { _secondaryApp.auth().setPersistence(firebase.auth.Auth.Persistence.NONE); } catch (e) {}
  }
  return _secondaryApp;
}
// Gumagawa ng bagong Auth identity (email + password). Ibinabalik ang {uid, email}.
function createAuthIdentity(loginId, password) {
  var a = secondaryApp().auth();
  var email = makeAuthEmail(loginId);
  return a.createUserWithEmailAndPassword(email, password).then(function(cred) {
    var uid = cred.user.uid;
    return a.signOut().then(function() { return {uid: uid, email: email}; });
  });
}

function lookupLogin(id) {
  var key = normLoginId(id);
  if (!key || key.indexOf('/') > -1) return Promise.resolve(null);
  return db.collection('login_map').doc(key).get().then(function(d) { return d.exists ? d.data() : null; });
}
function getRoleDoc(uid) {
  return db.collection('roles').doc(uid).get().then(function(d) { return d.exists ? d.data() : null; });
}
// I-activate ang isang identity: isulat ang role at ang mga login ID na tumuturo rito.
// `loginIds` ay listahan; ang unang ID ay laging isinusulat, ang iba ay kung wala pang may-ari.
function activateIdentity(opts) {
  var ids = (opts.loginIds || []).map(normLoginId).filter(function(x, i, a) { return x && x.indexOf('/') === -1 && a.indexOf(x) === i; });
  var roleData = {role: opts.role, loginId: ids[0] || '', name: opts.name || '', email: opts.email,
                  mustChange: !!opts.mustChange, updated: firebase.firestore.FieldValue.serverTimestamp()};
  if (opts.accountId) roleData.accountId = opts.accountId;
  return db.collection('roles').doc(opts.uid).set(roleData).then(function() {
    return Promise.all(ids.map(function(id, i) {
      var ref = db.collection('login_map').doc(id);
      var write = function() { return ref.set({email: opts.email, uid: opts.uid, loginId: ids[0]}); };
      if (i === 0 || opts.forceAll) return write();
      return ref.get().then(function(d) {
        if (!d.exists || d.data().loginId === ids[0]) return write();
      }).catch(function() {});
    }));
  });
}
function friendlyAuthError(err) {
  var c = (err && err.code) || '';
  if (c === 'auth/wrong-password' || c === 'auth/invalid-credential' || c === 'auth/invalid-login-credentials' || c === 'auth/user-not-found') return 'Mali ang ID o password.';
  if (c === 'auth/too-many-requests') return 'Masyadong maraming maling subok. Maghintay ng ilang minuto bago subukan ulit.';
  if (c === 'auth/network-request-failed') return 'Walang internet o mahina ang koneksyon. Subukan ulit.';
  if (c === 'auth/weak-password') return 'Masyadong mahina ang password (hindi bababa sa 8 characters).';
  if (c === 'auth/user-disabled') return 'Naka-disable ang account na ito. Makipag-ugnayan sa admin.';
  if (c === 'auth/requires-recent-login') return 'Mag-login ulit bago palitan ang password.';
  if (c === 'permission-denied') return 'Wala kang permiso para dito.';
  return 'May problema: ' + ((err && err.message) || err);
}

// Load data mula sa Firestore papunta sa cache.
// Kapag naka-login (may role): buong collection. Kung hindi: ang mga public document lang.
function loadAllFromFirebase(callback) {
  var p;
  if (hasDataAccess()) {
    p = db.collection('portal_data').get().then(function(snapshot) {
      snapshot.forEach(function(doc) {
        try { _cache[doc.id] = JSON.parse(doc.data().data); } catch (e) {}
      });
    });
  } else {
    var keys = PUBLIC_KEYS.slice();
    try { if (typeof window.EXTRA_PUBLIC_KEYS === 'function') keys = keys.concat(window.EXTRA_PUBLIC_KEYS() || []); } catch (e) {}
    p = Promise.all(keys.map(function(k) {
      return db.collection('portal_data').doc(k).get().then(function(doc) {
        if (doc.exists) { try { _cache[k] = JSON.parse(doc.data().data); } catch (e) {} }
      }).catch(function(err) { console.warn('Hindi mabasa:', k, err && err.code); });
    }));
  }
  p.then(function() {
    console.log('Data loaded from Firebase! Keys:', Object.keys(_cache).join(', '));
    if (callback) callback();
  }).catch(function(err) {
    console.error('Firebase load error:', err);
    if (callback) callback();
  });
}

// Real-time na pag-update. Kapag naka-login: buong collection; kung hindi: mga public document lang.
var _listenCallbacks = [], _unsubs = [], _listenMode = null;
function _applyListeners() {
  var mode = hasDataAccess() ? 'all' : 'public';
  if (mode === _listenMode || !_listenCallbacks.length) return;
  _unsubs.forEach(function(u) { try { u(); } catch (e) {} });
  _unsubs = [];
  _listenMode = mode;
  var fire = function() { _listenCallbacks.forEach(function(cb) { try { cb(); } catch (e) { console.error(e); } }); };
  var onErr = function(err) { console.warn('Listener stopped:', err && err.code); };
  if (mode === 'all') {
    _unsubs.push(db.collection('portal_data').onSnapshot(function(snapshot) {
      snapshot.docChanges().forEach(function(change) {
        if (change.type === 'modified' || change.type === 'added') {
          try { _cache[change.doc.id] = JSON.parse(change.doc.data().data); } catch (e) {}
        }
      });
      fire();
    }, onErr));
  } else {
    var keys = PUBLIC_KEYS.slice();
    try { if (typeof window.EXTRA_PUBLIC_KEYS === 'function') keys = keys.concat(window.EXTRA_PUBLIC_KEYS() || []); } catch (e) {}
    keys.forEach(function(k) {
      var first = true;
      _unsubs.push(db.collection('portal_data').doc(k).onSnapshot(function(doc) {
        if (doc.exists) { try { _cache[k] = JSON.parse(doc.data().data); } catch (e) {} }
        if (first) { first = false; return; }
        fire();
      }, onErr));
    });
  }
}
function listenForChanges(callback) {
  if (callback) _listenCallbacks.push(callback);
  _listenMode = null;
  _applyListeners();
}
// Tawagin pagkatapos mag-login o mag-logout para lumipat ang listener
function refreshDataAccess() { _applyListeners(); }

function getNextId(arr) {
  var max = 0;
  arr.forEach(function(item) { if (item.id > max) max = item.id; });
  return max + 1;
}

function formatDate(d) {
  if (!d) return '';
  var dt = new Date(d + 'T00:00:00');
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
}

function formatDateShort(d) {
  var dt = new Date(d + 'T00:00:00');
  var months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return { month: months[dt.getMonth()], day: dt.getDate() };
}

function resetAllData() {
  ['news','events','students','teachers','pending','settings','accounts'].forEach(function(key) {
    db.collection('portal_data').doc(key).delete();
  });
  _cache = {};
}

// ============================================
// DEFAULT DATA (used as fallback)
// ============================================
var DEFAULT_NEWS = [
  {id:1,title:'DBAMINHS Students Excel at Regional Science Fair',cat:'Achievement',date:'2026-04-02',status:'Published',content:'Our Grade 10 students brought home gold and silver medals at the Regional Science and Technology Fair held in Batangas City.'},
  {id:2,title:'Enrollment for SY 2026-2027 Now Open',cat:'Announcement',date:'2026-03-28',status:'Published',content:'Online and walk-in enrollment is now open for all grade levels.'},
  {id:3,title:'Brigada Eskwela Volunteer Registration',cat:'Community',date:'2026-03-20',status:'Published',content:'Join us in preparing our school for the new academic year!'},
  {id:4,title:'National Reading Month Celebration',cat:'Academic',date:'2026-03-15',status:'Draft',content:'Celebrating the joy of reading across all grade levels.'},
  {id:5,title:'Division Athletics Meet Champions',cat:'Achievement',date:'2026-03-10',status:'Published',content:'DBAMINHS athletes won multiple medals at the Division Athletics Meet.'}
];
var DEFAULT_EVENTS = [
  {id:1,name:'Recognition Day',date:'2026-04-10',time:'8:00 AM',venue:'School Gymnasium',status:'Upcoming',desc:'Awards ceremony for outstanding students'},
  {id:2,name:'Moving Up Ceremony - Grade 10',date:'2026-04-15',time:'9:00 AM',venue:'School Covered Court',status:'Upcoming',desc:'Students advancing to Senior High'},
  {id:3,name:'Graduation - Grade 12',date:'2026-04-18',time:'2:00 PM',venue:'School Gymnasium',status:'Upcoming',desc:'Commencement exercises'},
  {id:4,name:'Brigada Eskwela 2026',date:'2026-05-20',time:'7:00 AM',venue:'School Campus',status:'Upcoming',desc:'School clean-up and preparation'},
  {id:5,name:'First Day of Classes SY 2026-2027',date:'2026-06-02',time:'7:30 AM',venue:'All Classrooms',status:'Upcoming',desc:'New school year begins'}
];
var DEFAULT_STUDENTS = [];  // walang demo data: totoong datos lang mula sa Firebase
var DEFAULT_TEACHERS = [];  // walang demo data: totoong datos lang mula sa Firebase
var DEFAULT_PENDING = [];  // walang demo data: totoong datos lang mula sa Firebase
var DEFAULT_SETTINGS = {
  schoolName:'Dr. Bonifacio A. Masilungan Integrated National High School',
  schoolId:'307714',schoolYear:'2025-2026',address:'Brgy. Lalayat, San Jose, Batangas',
  phone:'(043) 332 8939',email:'307714@deped.gov.ph',
  motto:'Nurturing Minds, Building Futures, Serving the Community',principal:'',division:'Division of Batangas',sections:['Grade 7 - Bonifacio','Grade 8 - Luna','Grade 9 - Mabini','Grade 10 - Rizal','Grade 11 - ABM','Grade 11 - HUMSS','Grade 12 - ABM','Grade 12 - HUMSS']
};


// ============================================
// SUBJECT DEFINITIONS PER CLUSTER
// ============================================
var CLUSTER_SUBJECTS = {
  'JHS': ['Filipino','English','Mathematics','Science','AP','EsP','TLE','Music & Arts','PE & Health'],
  'SHS-Core': ['Mabisang Komunikasyon','Effective Communication','General Mathematics','General Science','Life and Career Skills','Pag-aaral ng Kasaysayan at Lipunang Pilipino'],
  'ASSH': ['Arts 1','Arts 2','Citizenship and Civic Engagement','Contemporary Literature 1','Contemporary Literature 2','Creative Composition 1','Creative Composition 2','Filipino 1','Filipino 2','Filipino Identity Through the Arts','Introduction to Philosophy','Leadership and Management in the Arts','Malikhaing Pagsulat','Philippine Governance','Social Sciences Theory and Practice'],
  'Business': ['Business 1 - Basic Accounting','Business 2 - Business Finance','Business 3 - Business Economics','Contemporary Marketing','Entrepreneurship','Intro to Organization and Management'],
  'STEM': ['Biology 1','Biology 2','Chemistry 1','Chemistry 2','Earth and Space Science 1','Earth and Space Science 2','Finite Mathematics 1','Finite Mathematics 2','Physics 1','Physics 2'],
  'Sports': ['Human Movement 1','Human Movement 2','Physical Education 1','Physical Education 2','Sports Activity Management','Sports Coaching','Sports Officiating'],
  'ICT': ['Broadband Installation','Computer Programming (.NET Technology)','Computer Programming (Java)','Computer Programming (Oracle Database)','Computer Systems Servicing','Contact Center Services']
};

// Lahat ng subject ng section sa Term 1 hanggang 3 (para sa consolidated report at SF9).
// Sa SHS, magkakaiba ang subject bawat term; pinagsasama ang mga ito ayon sa pagkakasunod.
function getSectionSubjectsAllTerms(sectionName, sections) {
  var out = [];
  ['Term_1', 'Term_2', 'Term_3'].forEach(function(t) {
    getSubjectsForSection(sectionName, sections, t).forEach(function(s) { if (out.indexOf(s) === -1) out.push(s); });
  });
  return out;
}

function getSubjectsForSection(sectionName, sections, term) {
  var sec = null;
  var name = sectionName.toLowerCase();
  if (sections) {
    for (var i = 0; i < sections.length; i++) {
      if (typeof sections[i] === 'object' && sections[i].name === sectionName) {
        sec = sections[i]; break;
      }
    }
  }
  
  var cluster = sec ? sec.cluster : null;

  // SUBJECTS BAWAT TERM (SHS): kapag may listahan para sa term na ito, iyon ang buong listahan
  if (term && sec && sec.subjectsByTerm && sec.subjectsByTerm[term] && sec.subjectsByTerm[term].length > 0) {
    return sec.subjectsByTerm[term].slice();
  }
  
  // CUSTOM SUBJECTS: if this section has its own manually-edited subject list, use it directly.
  // This takes priority over the fixed cluster lists below, so editing subjects in
  // Admin > Class Sections Management always reflects immediately in the Teacher Dashboard.
  if (sec && sec.subjects && sec.subjects.length > 0) {
    if (cluster === 'JHS') return sec.subjects;
    return CLUSTER_SUBJECTS['SHS-Core'].concat(sec.subjects);
  }
  
  // Auto-detect cluster from section name if not assigned
  if (!cluster) {
    if (name.indexOf('grade 7') > -1 || name.indexOf('grade 8') > -1 || name.indexOf('grade 9') > -1 || name.indexOf('grade 10') > -1) {
      cluster = 'JHS';
    } else if (name.indexOf('abm') > -1 || name.indexOf('business') > -1) {
      cluster = 'Business';
    } else if (name.indexOf('humss') > -1 || name.indexOf('assh') > -1 || name.indexOf('arts') > -1) {
      cluster = 'ASSH';
    } else if (name.indexOf('ict') > -1 || name.indexOf('computer') > -1 || name.indexOf('programming') > -1) {
      cluster = 'ICT';
    } else if (name.indexOf('stem') > -1 || name.indexOf('tech') > -1) {
      cluster = 'STEM';
    } else if (name.indexOf('sports') > -1 || name.indexOf('pe') > -1) {
      cluster = 'Sports';
    } else if (name.indexOf('grade 11') > -1 || name.indexOf('grade 12') > -1) {
      cluster = 'ASSH';
    } else {
      cluster = 'JHS';
    }
  }
  
  if (cluster === 'JHS') return CLUSTER_SUBJECTS['JHS'];
  var subjects = CLUSTER_SUBJECTS['SHS-Core'].slice();
  if (CLUSTER_SUBJECTS[cluster]) {
    subjects = subjects.concat(CLUSTER_SUBJECTS[cluster]);
  }
  return subjects;
}

// ============================================
// SHARED NAME HELPERS (used by both admin.html and index.html / portal-app.js)
// ============================================

// Splits a full name string into {lastName, firstName} for display purposes.
// Recognizes common multi-word Filipino surname prefixes (Dela Cruz, Del Rosario, De Leon, etc.)
// and trailing suffixes (Jr, Sr, II, III...) so they attach to the surname instead of being
// misread as the surname itself. Falls back to "last word = surname" otherwise.
var SURNAME_PREFIXES = ['dela', 'de la', 'del', 'de los', 'de las', 'de', 'san', 'santa', 'sto', 'santo'];
var NAME_SUFFIXES = ['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v'];
function splitName(fullName) {
  var parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return {lastName: fullName, firstName: ''};
  
  var suffix = '';
  var lastWordRaw = parts[parts.length - 1];
  if (NAME_SUFFIXES.indexOf(lastWordRaw.toLowerCase().replace(/\.$/, '')) > -1 && parts.length > 2) {
    suffix = ' ' + lastWordRaw;
    parts = parts.slice(0, parts.length - 1);
  }
  
  var secondLastWord = parts.length > 2 ? parts[parts.length - 2].toLowerCase() : '';
  
  if (secondLastWord && SURNAME_PREFIXES.indexOf(secondLastWord) > -1) {
    return {
      lastName: parts.slice(parts.length - 2).join(' ') + suffix,
      firstName: parts.slice(0, parts.length - 2).join(' ')
    };
  }
  
  return {
    lastName: parts[parts.length - 1] + suffix,
    firstName: parts.slice(0, parts.length - 1).join(' ')
  };
}
function toLastFirst(fullName) {
  var n = splitName(fullName);
  return n.firstName ? (n.lastName + ', ' + n.firstName) : n.lastName;
}
function fromLastFirst(lastFirstStr) {
  var parts = lastFirstStr.split(',');
  if (parts.length < 2) return lastFirstStr.trim();
  return parts[1].trim() + ' ' + parts[0].trim();
}

// Sorts an array of objects (each having a `name` property, or via a custom accessor)
// alphabetically by last name. Used to keep grade/attendance/student tables in A-Z order.
function sortByLastName(arr, nameAccessor) {
  var getName = nameAccessor || function(item) { return item.name; };
  return arr.slice().sort(function(a, b) {
    var lastA = splitName(getName(a)).lastName.toUpperCase();
    var lastB = splitName(getName(b)).lastName.toUpperCase();
    if (lastA < lastB) return -1;
    if (lastA > lastB) return 1;
    return 0;
  });
}
