/* Typing Coach — app: state, sync, typing engine, views, router. */
(function (TT) {
  'use strict';
  const { h, icon } = TT;
  const COURSE = TT.COURSE;

  // ───────────────────────── Local storage (one viewer's browser) ─────────────────────────
  const K = { state: 'tt.state.v1', texts: 'tt.texts.v1', journal: 'tt.journal.v1', dev: 'tt.dev', synced: 'tt.syncedTexts', tomb: 'tt.deletedTexts' };
  const LS = {
    get(k) { try { const v = window.localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } },
    del(k) { try { window.localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  const App = {
    state: Object.assign(TT.defaultState(), LS.get(K.state) || {}),
    texts: LS.get(K.texts) || {},
    journal: LS.get(K.journal) || [],
    dev: LS.get(K.dev) || null,
    layout: null,
    obs: {},
    view: '',
    keyHandler: null,
    needsRender: false
  };
  if (!App.dev) { App.dev = TT.uid('d'); LS.set(K.dev, App.dev); }
  App.state.settings = Object.assign(TT.defaultState().settings, App.state.settings || {});
  TT.App = App;

  // Append children, skipping null/false (native append would print "null").
  const add = (el, ...kids) => { kids.flat().forEach(k => { if (k != null && k !== false) el.append(k); }); return el; };

  const P = { user: null, db: null, sample: null, tts: null, uid: null, me: null, sampleOff: false, hasClaude: false };
  TT.P = P;

  // ───────────────────────── Derived data ─────────────────────────
  const exCount = (l) => l.coach ? 1 : l.ex.length;
  function lessonInfo(l) {
    const rec = App.state.lessons[l.id];
    const ex = (rec && rec.ex) || {};
    let done = 0, minStars = 3;
    for (let i = 0; i < exCount(l); i++) {
      const e = ex[i];
      if (e && e.s >= 1) { done++; minStars = Math.min(minStars, e.s); }
    }
    const total = exCount(l);
    return { done, total, complete: done === total, stars: done === total ? minStars : 0, started: done > 0 };
  }
  function nextLessonIndex() {
    for (let i = 0; i < COURSE.length; i++) if (!lessonInfo(COURSE[i]).complete) return i;
    return -1;
  }
  function learnedIndex() {
    let idx = 0;
    COURSE.forEach((l, i) => { if (lessonInfo(l).started) idx = Math.max(idx, l.part === 1 ? i : 12); });
    return idx;
  }
  // Per-key counters are stored under safe field names: "k" + character code ("k32" = space).
  const keyField = (c) => 'k' + c.codePointAt(0);
  const keyTotals = () => {
    const raw = TT.sumByDevice(App.state.keysByDev), out = {};
    Object.keys(raw).forEach(k => { out[/^k\d+$/.test(k) ? String.fromCodePoint(+k.slice(1)) : k] = raw[k]; });
    return out;
  };
  const dailyTotals = () => TT.sumByDevice(App.state.dailyByDev);
  const todaySeconds = () => dailyTotals()[TT.dayKey(Date.now())] || 0;
  function weakKeys(n) {
    const tot = keyTotals();
    return Object.keys(tot)
      .filter(c => c !== ' ' && (tot[c][0] + tot[c][1]) >= 6)
      .map(c => { const [hit, miss] = tot[c]; return { c, acc: hit / (hit + miss), n: hit + miss, score: (miss + 0.5) / (hit + miss + 2) }; })
      .filter(k => k.acc < 0.995)
      .sort((a, b) => b.score - a.score)
      .slice(0, n || 6);
  }
  let dictCache = null;
  function dictionary() {
    if (dictCache) return dictCache;
    const set = new Set(TT.WORDS);
    // Real words only: skip the pure key drills (first exercises of part 1) and letter runs like "sss".
    COURSE.forEach((l, li) => l.ex.forEach((e, ei) => {
      if (l.part === 1 && (ei === 0 || (li === 0 && ei < 3))) return;
      e.t.toLowerCase().split(/[^a-z]+/).forEach(w => { if (w.length > 1 && /[aeiouy]/.test(w) && !/^(.)\1+$/.test(w)) set.add(w); });
    }));
    dictCache = Array.from(set);
    return dictCache;
  }
  const speedFactor = () => Number(App.state.settings.speed) || 1;
  const targetFor = (wpm) => Math.max(6, Math.round(wpm * speedFactor()));

  // ───────────────────────── Saving & sync ─────────────────────────
  const Sync = {
    status: 'local', note: '', channels: {}, readOnly: false,
    set(status, note) { this.status = status; this.note = note || ''; renderSyncChip(); },
    recompute() {
      const ch = Object.values(this.channels);
      if (!ch.length) return;
      if (ch.some(c => c.failed)) return this.set('paused', ch.find(c => c.failed).failNote || '');
      if (ch.some(c => c.saving)) return this.set('saving');
      if (ch.every(c => c.ready)) return this.set('synced');
      this.set('connecting');
    }
  };

  function hasContent(st) {
    return (st.history && st.history.length) || st.settingsAt || Object.keys(st.lessons || {}).length;
  }

  function saveState() {
    LS.set(K.state, App.state);
    if (Sync.channels.progress) Sync.channels.progress.schedule();
  }
  function saveTextsLocal() { LS.set(K.texts, App.texts); }
  function saveJournal() {
    LS.set(K.journal, App.journal);
    if (Sync.channels.journal) Sync.channels.journal.schedule();
  }

  function failNoteFor(code) {
    if (code === 'invalid_argument' || code === 'revoked' || code === 'not_granted' || code === 'capability_disabled' || code === 'capability_removed') {
      Sync.readOnly = true;
      return 'This copy of the app can’t save to your account. Your progress stays on this device.';
    }
    if (code === 'quota_exceeded') return 'Your saved data is full. Delete some of your texts to keep syncing.';
    return 'Can’t reach your saved progress right now. Your work is kept on this device.';
  }

  // One synced document (progress or journal) with a one-write-at-a-time queue.
  function DocChannel(name, ref, hooks) {
    const ch = { ready: false, saving: false, failed: false, failNote: '', dead: false };
    let writing = false, pending = false, timer = null, lastRev = null, retried = false, firstTimer = null;
    ch.schedule = function (delay) {
      if (ch.dead) return;
      pending = true;
      clearTimeout(timer);
      timer = setTimeout(flush, delay == null ? 1200 : delay);
    };
    async function flush() {
      if (ch.dead || !ch.ready || !pending) return;
      if (writing) return;
      pending = false;
      writing = true; ch.saving = true; Sync.recompute();
      const body = JSON.parse(JSON.stringify(hooks.serialize()));
      body.rev = lastRev = TT.uid('r');
      body.dev = App.dev;
      body.savedAt = Date.now();
      try {
        await ref.set(body);
        ch.failed = false; retried = false;
      } catch (e) {
        const code = e && e.code;
        if (code === 'unavailable' && !retried) { retried = true; pending = true; setTimeout(flush, 1000 + Math.random() * 2000); }
        else {
          ch.failed = true; ch.failNote = failNoteFor(code);
          if (code === 'invalid_argument' || code === 'revoked' || code === 'not_granted') ch.dead = true;
        }
      } finally {
        writing = false; ch.saving = false; Sync.recompute();
        if (pending && !ch.dead) { clearTimeout(timer); timer = setTimeout(flush, 400); }
      }
    }
    firstTimer = setTimeout(() => {
      if (!ch.ready) { ch.failed = true; ch.failNote = 'Can’t reach your saved progress yet. Your work is kept on this device.'; Sync.recompute(); }
    }, 10000);
    ch.unsub = ref.onSnapshot(snap => {
      if (snap.metadata && snap.metadata.hasPendingWrites) return;
      const fromCache = !!(snap.metadata && snap.metadata.fromCache);
      const data = snap.exists ? JSON.parse(JSON.stringify(snap.data() || {})) : null;
      if (!fromCache) {
        clearTimeout(firstTimer);
        if (!ch.ready) { ch.ready = true; if (ch.failed && !ch.dead) ch.failed = false; }
      }
      if (data && data.rev && data.rev === lastRev) { Sync.recompute(); return; }
      const res = hooks.merge(data);
      if (res.changedVsLocal) hooks.changed();
      if (res.changedVsRemote) pending = true;
      Sync.recompute();
      if (ch.ready && pending) ch.schedule(300);
    }, err => {
      clearTimeout(firstTimer);
      ch.failed = true; ch.failNote = failNoteFor(err && err.code);
      Sync.recompute();
    });
    return ch;
  }

  // Custom texts: one document per text in a sub-collection.
  function TextsChannel(col) {
    const ch = { ready: false, saving: false, failed: false, failNote: '' };
    const synced = new Set(LS.get(K.synced) || []);
    const tomb = new Set(LS.get(K.tomb) || []);
    const persist = () => { LS.set(K.synced, Array.from(synced)); LS.set(K.tomb, Array.from(tomb)); };
    const bodyOf = (t) => ({ title: t.title || '', body: t.body || '', createdAt: t.createdAt || Date.now(), updatedAt: t.updatedAt || Date.now(), src: t.src || 'user' });
    let inflight = 0;
    const track = async (p) => {
      inflight++; ch.saving = true; Sync.recompute();
      try { await p; return true; } catch (e) { ch.failed = true; ch.failNote = failNoteFor(e && e.code); return false; }
      finally { inflight--; ch.saving = inflight > 0; Sync.recompute(); }
    };
    ch.put = async (t) => {
      if (!ch.ready) return;
      if (await track(col.doc(t.id).set(bodyOf(t)))) { synced.add(t.id); persist(); }
    };
    ch.remove = async (id) => {
      tomb.add(id); persist();
      if (!ch.ready) return;
      if (await track(col.doc(id).delete())) { synced.delete(id); tomb.delete(id); persist(); }
    };
    const firstTimer = setTimeout(() => { if (!ch.ready) { ch.failed = true; ch.failNote = failNoteFor('unavailable'); Sync.recompute(); } }, 10000);
    ch.unsub = col.onSnapshot(qs => {
      const fromCache = !!(qs.metadata && qs.metadata.fromCache);
      const remote = {};
      qs.docs.forEach(d => { remote[d.id] = JSON.parse(JSON.stringify(d.data() || {})); });
      let changed = false;
      Object.keys(remote).forEach(id => {
        if (tomb.has(id)) { if (!fromCache) ch.remove(id); return; }
        const r = remote[id], l = App.texts[id];
        if (!l || (r.updatedAt || 0) > (l.updatedAt || 0)) { App.texts[id] = Object.assign({ id }, r); changed = true; }
        synced.add(id);
      });
      if (!fromCache) {
        clearTimeout(firstTimer);
        ch.ready = true; ch.failed = false;
        Object.keys(App.texts).forEach(id => {
          if (remote[id]) return;
          if (synced.has(id)) { delete App.texts[id]; synced.delete(id); changed = true; }
          else ch.put(App.texts[id]);
        });
        tomb.forEach(id => { if (!remote[id]) tomb.delete(id); });
      }
      persist();
      if (changed) { saveTextsLocal(); dataChanged(); }
      Sync.recompute();
    }, err => {
      clearTimeout(firstTimer);
      ch.failed = true; ch.failNote = failNoteFor(err && err.code); Sync.recompute();
    });
    return ch;
  }

  function startSync() {
    const base = 'data/users/' + P.uid;
    let progressRef, journalRef, textsCol;
    try {
      progressRef = P.db.doc(base + '/progress');
      journalRef = P.db.doc(base + '/journal');
      textsCol = progressRef.collection('texts');
    } catch (e) { Sync.set('paused', failNoteFor('invalid_argument')); return; }
    Sync.set('connecting');
    Sync.channels.progress = DocChannel('progress', progressRef, {
      serialize: () => App.state,
      merge(remote) {
        if (!remote) return { changedVsRemote: !!hasContent(App.state), changedVsLocal: false };
        delete remote.rev; delete remote.dev; delete remote.savedAt;
        const r = TT.mergeState(App.state, remote, App.dev);
        App.state = r.state;
        LS.set(K.state, App.state);
        return r;
      },
      changed() { applySettings(); dataChanged(); }
    });
    Sync.channels.journal = DocChannel('journal', journalRef, {
      serialize: () => ({ entries: App.journal.slice(0, 40) }),
      merge(remote) {
        const rem = (remote && remote.entries) || [];
        const byId = new Map();
        rem.forEach(e => e && e.id && byId.set(e.id, e));
        const remoteIds = new Set(byId.keys());
        let vsRemote = false, vsLocal = false;
        App.journal.forEach(e => { if (!remoteIds.has(e.id)) vsRemote = true; byId.set(e.id, e); });
        const localIds = new Set(App.journal.map(e => e.id));
        remoteIds.forEach(id => { if (!localIds.has(id)) vsLocal = true; });
        App.journal = Array.from(byId.values()).sort((a, b) => b.t - a.t).slice(0, 40);
        LS.set(K.journal, App.journal);
        return { changedVsRemote: vsRemote, changedVsLocal: vsLocal };
      },
      changed() { dataChanged(); }
    });
    Sync.channels.texts = TextsChannel(textsCol);
  }

  function useCap(name) {
    try {
      const c = window.claude;
      if (!c || typeof c.use !== 'function') return Promise.resolve(null);
      return Promise.resolve(c.use(name)).catch(() => null);
    } catch (e) { return Promise.resolve(null); }
  }

  function connectPlatform() {
    P.hasClaude = !!(window.claude && typeof window.claude.use === 'function');
    Sync.set(P.hasClaude ? 'connecting' : 'local');
    useCap('sample').then(smp => { P.sample = smp; if (['coach', 'practice'].includes(App.view)) render(); });
    useCap('tts').then(t => {
      P.tts = t;
      if (t && typeof t.onState === 'function') t.onState(({ state }) => { document.body.classList.toggle('tts-on', state === 'speaking'); });
      document.querySelectorAll('[data-listen]').forEach(b => { b.hidden = !t; });
    });
    Promise.all([useCap('user'), useCap('db')]).then(async ([user, db]) => {
      P.user = user; P.db = db;
      if (user) { try { P.me = await user.me(); } catch (e) { P.me = null; } }
      if (!user || !db) { Sync.set('local'); refreshGreeting(); return; }
      let uid = null;
      try { uid = await user.id(); } catch (e) { uid = null; }
      if (!uid) { Sync.set('local'); refreshGreeting(); return; }
      P.uid = uid;
      refreshGreeting();
      startSync();
    });
  }

  function dataChanged() {
    if (App.view === 'typing') { App.needsRender = true; return; }
    if (document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { App.needsRender = true; return; }
    render();
  }

  // ───────────────────────── Layout ─────────────────────────
  function guessLayout() {
    const lang = (navigator.language || 'en').toLowerCase();
    if (lang.startsWith('cs')) return 'cz';
    if (lang.startsWith('de')) return 'de';
    if (lang === 'en-gb' || lang === 'en-ie') return 'uk';
    return 'us';
  }
  async function detectLayoutFromSystem() {
    try {
      if (!navigator.keyboard || !navigator.keyboard.getLayoutMap) return null;
      const m = await navigator.keyboard.getLayoutMap();
      const g = (c) => m.get(c);
      if (g('Digit2') === 'ě') return g('KeyY') === 'z' ? 'cz' : 'czq';
      if (g('KeyY') === 'z' && g('Minus') === 'ß') return 'de';
      if (g('Backslash') === '#' || g('IntlBackslash') === '\\') return 'uk';
      if (g('KeyA') === 'a') return 'us';
    } catch (e) { /* not allowed in this frame */ }
    return null;
  }
  function applyLayout() {
    const id = App.state.settings.layout || guessLayout();
    App.layout = TT.buildLayout(id);
  }
  function setLayout(id) {
    App.state.settings.layout = id;
    App.state.settingsAt = Date.now();
    applyLayout();
    saveState();
  }
  function applySettings() {
    applyLayout();
    document.documentElement.dataset.size = App.state.settings.size || 'm';
  }

  // ───────────────────────── Shell ─────────────────────────
  const NAV = [['learn', 'Learn'], ['practice', 'Practice'], ['progress', 'Progress'], ['options', 'Options']];
  function renderShell() {
    const app = document.getElementById('app');
    app.textContent = '';
    const nav = h('nav', { class: 'nav', 'aria-label': 'Main' },
      NAV.map(([id, label]) => h('a', { href: '#' + id, class: 'nav-link', dataset: { nav: id } }, label)));
    const header = h('header', { class: 'top' },
      h('div', { class: 'top-in' },
        h('a', { class: 'brand', href: '#learn', 'aria-label': 'Typing Coach, home' },
          h('span', { class: 'kc brand-kc', 'aria-hidden': 'true' }, 'T'), h('span', { class: 'brand-w', 'aria-hidden': 'true' }, 'yping Coach')),
        nav,
        h('div', { class: 'sync-wrap' },
          h('button', { class: 'sync', id: 'sync-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'sync-pop', onclick: toggleSyncPop }),
          h('div', { class: 'sync-pop', id: 'sync-pop', hidden: true }))));
    app.append(header, h('main', { id: 'view', class: 'view', tabindex: '-1' }));
    renderSyncChip();
  }
  function setActiveNav(id) {
    document.querySelectorAll('.nav-link').forEach(a => {
      const on = a.dataset.nav === id;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function renderSyncChip() {
    const b = document.getElementById('sync-btn');
    if (!b) return;
    const labels = { local: 'Saved on this device', connecting: 'Connecting…', synced: 'Synced', saving: 'Saving…', paused: 'Sync paused' };
    b.textContent = '';
    b.dataset.state = Sync.status;
    if (P.me && P.me.avatarUrl && P.uid) b.append(h('img', { class: 'avatar', src: P.me.avatarUrl, alt: '' }));
    else b.append(h('span', { class: 'dot' }));
    b.append(h('span', { class: 'sync-label' }, labels[Sync.status] || ''));
    const pop = document.getElementById('sync-pop');
    if (pop && !pop.hidden) fillSyncPop(pop);
  }
  function fillSyncPop(pop) {
    pop.textContent = '';
    const name = (P.me && P.me.name) || '';
    let title, body;
    if (Sync.status === 'local') {
      title = 'Not signed in';
      body = P.hasClaude
        ? 'Your progress is saved in this browser only. To sync it, open this app on claude.ai while you are signed in to Claude.'
        : 'Your progress is saved in this browser only. Open this app from your Claude account to sign in and sync between devices.';
    } else if (Sync.status === 'paused') {
      title = 'Sync paused';
      body = Sync.note || 'Your work is kept on this device. Sync starts again when the connection comes back.';
    } else if (Sync.status === 'connecting') {
      title = 'Connecting';
      body = 'Loading your saved progress…';
    } else {
      title = name ? 'Signed in as ' + name : 'Signed in to Claude';
      body = 'Your lessons, texts and coach feedback sync to every device where you open this app.';
    }
    pop.append(h('strong', null, title), h('p', null, body));
  }
  function toggleSyncPop() {
    const pop = document.getElementById('sync-pop');
    const b = document.getElementById('sync-btn');
    pop.hidden = !pop.hidden;
    b.setAttribute('aria-expanded', String(!pop.hidden));
    if (!pop.hidden) fillSyncPop(pop);
  }
  document.addEventListener('click', e => {
    const pop = document.getElementById('sync-pop');
    if (pop && !pop.hidden && !e.target.closest('.sync-wrap')) { pop.hidden = true; document.getElementById('sync-btn').setAttribute('aria-expanded', 'false'); }
  });
  function refreshGreeting() {
    renderSyncChip();
    if (App.view === 'learn') render();
  }

  // ───────────────────────── Router ─────────────────────────
  function route() {
    const hash = (location.hash || '').replace('#', '');
    const m = hash.match(/^lesson-(\d+)$/);
    if (m) return { view: 'lesson', idx: Math.min(COURSE.length, Math.max(1, +m[1])) - 1 };
    if (['practice', 'coach', 'progress', 'options', 'steno', 'keys'].includes(hash)) return { view: hash };
    return { view: 'learn' };
  }
  function render() {
    App.needsRender = false;
    if (Typing.active) Typing.stop();
    const r = route();
    App.view = r.view;
    App.keyHandler = null;
    setActiveNav(r.view === 'lesson' || r.view === 'coach' ? 'learn' : r.view === 'steno' || r.view === 'keys' ? 'practice' : r.view);
    App.keyUpHandler = null;
    const view = document.getElementById('view');
    view.textContent = '';
    view.className = 'view view-' + r.view;
    if (r.view === 'learn') renderLearn(view);
    else if (r.view === 'lesson') renderLesson(view, r.idx);
    else if (r.view === 'practice') renderPractice(view);
    else if (r.view === 'coach') renderCoach(view);
    else if (r.view === 'progress') renderProgress(view);
    else if (r.view === 'options') renderOptions(view);
    else if (r.view === 'steno') renderSteno(view);
    else if (r.view === 'keys') renderPickKeys(view);
  }
  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
  // A link to the page we are already on (for example from the typing screen) still re-renders it.
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    const href = a.getAttribute('href');
    if (href === location.hash || (href === '#learn' && !location.hash)) {
      e.preventDefault();
      render();
      window.scrollTo(0, 0);
    }
  });

  // ───────────────────────── Small view helpers ─────────────────────────
  const fmtWpm = (w) => String(Math.round(w || 0));
  const fmtAcc = (a) => (a >= 99.95 ? '100' : (Math.round((a || 0) * 10) / 10).toFixed(1)) + '%';
  const fmtClock = (ms) => { const s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const firstName = () => { const n = (P.me && P.me.name) || ''; return n.split(' ')[0]; };
  function fingerChip(fid) {
    const f = TT.FINGERS[fid];
    return h('span', { class: 'finger', dataset: { zone: f.zone } }, h('span', { class: 'fdot' }), f.name);
  }
  function sectionHead(title, sub) {
    return h('div', { class: 'sec-head' }, h('h2', null, title), sub ? h('p', { class: 'muted' }, sub) : null);
  }
  function lessonKeys(l) {
    if (l.part !== 1) return null;
    return h('span', { class: 'kcs' }, l.show.map(k => TT.keycap(k, k.length > 1 ? 'wide' : '')));
  }

  // ───────────────────────── Learn ─────────────────────────
  function renderLearn(view) {
    const ni = nextLessonIndex();
    const name = firstName();
    const today = Math.round(todaySeconds() / 60);
    const goal = App.state.settings.goal || 10;
    const streak = TT.streak(dailyTotals(), Date.now());

    const intro = h('div', { class: 'learn-intro' },
      h('h1', { class: 'display' }, name ? 'Hi, ' + name + '. Ready to type?' : 'Ten fingers, clear English.'),
      h('p', { class: 'lede' }, 'Learn to type without looking. Every lesson also teaches one English point and one tip for writing better requests to Claude.'));

    let cont;
    if (ni === -1) {
      cont = h('div', { class: 'panel continue' },
        h('div', null, h('p', { class: 'eyebrow-free muted' }, 'Course finished'),
          h('h2', null, 'You finished all 26 lessons.'),
          h('p', null, 'Keep your speed up with your own texts and the quick drills in Practice.')),
        h('div', { class: 'cta-row' },
          h('a', { class: 'btn primary', href: '#practice' }, 'Practice my texts')));
    } else {
      const l = COURSE[ni], info = lessonInfo(l);
      cont = h('div', { class: 'panel continue' },
        h('div', { class: 'cont-main' },
          h('p', { class: 'muted small' }, (info.started ? 'Continue' : 'Next up') + ' · Lesson ' + (ni + 1) + ' of ' + COURSE.length),
          h('h2', { class: 'cont-title' }, l.title),
          l.part === 1 ? lessonKeys(l) : null,
          h('ul', { class: 'pair' },
            h('li', null, h('span', { class: 'tag en' }, 'English'), l.en.h),
            h('li', null, h('span', { class: 'tag ai' }, 'Claude'), l.ai.h))),
        h('div', { class: 'cta-row' },
          h('button', { class: 'btn primary big', type: 'button', onclick: () => startLesson(ni) },
            icon('play'), info.started ? 'Continue lesson ' + (ni + 1) : 'Start lesson ' + (ni + 1)),
          h('a', { class: 'btn ghost', href: '#lesson-' + (ni + 1) }, 'Read the lesson first')));
    }

    const pct = Math.min(100, Math.round(today / goal * 100));
    const todayBox = h('div', { class: 'panel today' },
      h('p', { class: 'muted small' }, 'Today'),
      h('p', { class: 'today-num' }, h('strong', null, String(today)), ' of ' + goal + ' min'),
      h('div', { class: 'meter', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(goal), 'aria-valuenow': String(today), 'aria-label': 'Minutes practiced today' },
        h('span', { style: { width: pct + '%' } })),
      h('p', { class: 'small muted' }, streak ? (streak === 1 ? '1 day in a row' : streak + ' days in a row') : 'Practice today to start a streak.'));

    view.append(h('div', { class: 'wrap' }, intro, h('div', { class: 'learn-top' }, cont, todayBox), courseList()));
  }

  function courseList() {
    const parts = [
      [1, 'Part 1 · Keyboard basics', 'New keys in every lesson. Short English and Claude tips.'],
      [2, 'Part 2 · Writing with Claude', 'Whole sentences. Each lesson is one writing skill and one prompting skill.']
    ];
    return h('div', { class: 'course' }, parts.map(([p, title, sub]) => h('section', { class: 'part' },
      sectionHead(title, sub),
      h('ol', { class: 'lessons', start: p === 1 ? '1' : '14' },
        COURSE.map((l, i) => {
          if (l.part !== p) return null;
          const info = lessonInfo(l);
          const status = info.complete ? TT.starRow(info.stars, 3) :
            info.started ? h('span', { class: 'prog-pill' }, info.done + ' / ' + info.total) :
              h('span', { class: 'prog-pill empty' }, info.total + (info.total === 1 ? ' task' : ' exercises'));
          return h('li', { class: 'lesson-row' + (i === nextLessonIndex() ? ' is-next' : '') + (info.complete ? ' is-done' : '') },
            h('a', { href: '#lesson-' + (i + 1), class: 'lr-link' },
              h('span', { class: 'lr-num' }, String(i + 1)),
              h('span', { class: 'lr-main' },
                h('span', { class: 'lr-title' }, l.title),
                h('span', { class: 'lr-sub' }, h('span', { class: 'tag en' }, 'English'), l.en.h, h('span', { class: 'tag ai' }, 'Claude'), l.ai.h)),
              h('span', { class: 'lr-keys' }, lessonKeys(l)),
              h('span', { class: 'lr-status' }, status)));
        })))));
  }

  // ───────────────────────── Lesson page ─────────────────────────
  function renderLesson(view, idx) {
    const l = COURSE[idx];
    const info = lessonInfo(l);
    const rec = (App.state.lessons[l.id] && App.state.lessons[l.id].ex) || {};
    const wrap = h('div', { class: 'wrap lesson' });
    wrap.append(h('a', { class: 'back', href: '#learn' }, icon('back'), 'All lessons'));
    wrap.append(h('header', { class: 'lesson-head' },
      h('p', { class: 'muted small' }, 'Lesson ' + (idx + 1) + ' of ' + COURSE.length + ' · ' + (l.part === 1 ? 'Keyboard basics' : 'Writing with Claude')),
      h('h1', { class: 'display' }, l.title),
      info.complete ? TT.starRow(info.stars, 3) : null));

    const left = h('div', { class: 'lesson-main' });
    if (l.part === 1) {
      const newSet = new Set(l.show.filter(k => k !== 'Shift'));
      const known = TT.allowedChars(COURSE, idx - 1);
      const kb = TT.Keyboard({ layout: App.layout });
      const shiftState = idx === 10 ? 'new' : idx > 10 ? 'known' : 'dim';
      kb.markLesson(newSet, known, shiftState);
      const fingers = h('ul', { class: 'fingers' });
      l.show.forEach(k => {
        if (k === 'Shift') { fingers.append(h('li', null, TT.keycap('Shift', 'wide'), h('span', null, 'little finger of the other hand'))); return; }
        const t = TT.keyFor(App.layout, k.length === 1 && /[A-Z]/.test(k) ? k.toLowerCase() : k);
        fingers.append(h('li', null, TT.keycap(k), t ? fingerChip(t.finger) : h('span', null, '—'),
          t && t.shift ? h('span', { class: 'muted small' }, '+ Shift') : null));
      });
      left.append(h('section', { class: 'panel keys-panel' },
        h('p', { class: 'lesson-intro' }, l.intro),
        h('div', { class: 'kb-wrap' }, kb.el),
        h('p', { class: 'kb-legend small muted' }, h('span', { class: 'lg new' }), 'new keys', h('span', { class: 'lg known' }), 'keys you know', h('span', { class: 'lg dim' }), 'later'),
        fingers));
    }
    left.append(h('div', { class: 'tips' }, tipCard('en', 'English', l.en), tipCard('ai', 'Talking to Claude', l.ai)));
    if (l.ba && l.ba.length) {
      left.append(h('section', { class: 'panel ba' },
        h('h3', null, l.id === 'real-request' ? 'Before and after' : 'Before and after'),
        l.ba.map(p => h('div', { class: 'ba-pair' },
          h('div', { class: 'ba-b' }, h('span', { class: 'ba-tag' }, 'Before'), h('p', null, p.b)),
          h('div', { class: 'ba-a' }, h('span', { class: 'ba-tag' }, 'After'), h('p', null, p.a)),
          p.why ? h('p', { class: 'ba-why small' }, p.why) : null))));
    }

    const side = h('aside', { class: 'lesson-side panel' });
    if (l.coach) {
      const e = rec[0];
      add(side, h('h3', null, 'Your task'),
        h('p', null, 'Write a request, get feedback, then type the better version.'),
        e ? h('p', { class: 'done-line' }, icon('check'), 'Done · ' + fmtWpm(e.w) + ' WPM') : null,
        h('a', { class: 'btn primary big', href: '#coach' }, icon('edit'), 'Open the writing coach'));
    } else {
      side.append(h('h3', null, 'Exercises'));
      const ol = h('ol', { class: 'ex-list' });
      l.ex.forEach((e, i) => {
        const r = rec[i];
        ol.append(h('li', { class: 'ex-item' + (r && r.s >= 1 ? ' done' : '') },
          h('button', { type: 'button', class: 'ex-btn', onclick: () => startLessonExercise(idx, i) },
            h('span', { class: 'ex-num' }, String(i + 1)),
            h('span', { class: 'ex-text' }, e.t.length > 70 ? e.t.slice(0, 68) + '…' : e.t),
            h('span', { class: 'ex-stat' }, r ? TT.starRow(r.s, 3) : h('span', { class: 'muted small' }, 'Start')))));
      });
      side.append(ol,
        h('p', { class: 'small muted' }, '3 stars: 97% accuracy and ' + targetFor(l.wpm) + ' words per minute.'),
        h('button', { class: 'btn primary big', type: 'button', onclick: () => startLesson(idx) }, icon('play'),
          info.complete ? 'Practice again' : info.started ? 'Continue' : 'Start lesson'));
    }
    const nav = h('div', { class: 'lesson-nav' },
      idx > 0 ? h('a', { class: 'btn ghost', href: '#lesson-' + idx }, icon('back'), 'Lesson ' + idx) : h('span'),
      idx < COURSE.length - 1 ? h('a', { class: 'btn ghost', href: '#lesson-' + (idx + 2) }, 'Lesson ' + (idx + 2), icon('arrow')) : h('span'));
    wrap.append(h('div', { class: 'lesson-grid' }, left, side), nav);
    view.append(wrap);
  }

  function tipCard(kind, label, t) {
    return h('section', { class: 'tip panel tip-' + kind },
      h('p', { class: 'tip-label' }, label),
      h('h3', null, t.h),
      t.p ? h('p', null, t.p) : null,
      t.list && t.list.length ? h('ul', { class: 'tip-list' }, t.list.map(x => h('li', null, x))) : null);
  }

  function startLesson(idx) {
    const l = COURSE[idx];
    if (l.coach) { location.hash = '#coach'; return; }
    const rec = (App.state.lessons[l.id] && App.state.lessons[l.id].ex) || {};
    let ei = l.ex.findIndex((e, i) => !(rec[i] && rec[i].s >= 1));
    if (ei < 0) ei = 0;
    startLessonExercise(idx, ei);
  }

  function startLessonExercise(li, ei) {
    const l = COURSE[li];
    const e = l.ex[ei];
    Typing.start({
      kind: 'lesson', title: l.title, sub: 'Exercise ' + (ei + 1) + ' of ' + l.ex.length,
      dots: l.ex.map((_, i) => { const r = (App.state.lessons[l.id] && App.state.lessons[l.id].ex[i]); return r ? r.s : -1; }), dot: ei,
      text: e.t, note: e.n, lang: 'en', target: targetFor(l.wpm),
      back: { label: 'Lesson ' + (li + 1), href: '#lesson-' + (li + 1) },
      ref: l.id + ':' + ei,
      complete(st, stars) {
        const before = lessonInfo(l).complete;
        const L = App.state.lessons[l.id] = App.state.lessons[l.id] || { ex: {} };
        const prev = L.ex[ei] || { s: 0, w: 0, a: 0 };
        L.ex[ei] = { s: Math.max(prev.s, stars), w: Math.max(prev.w, round1(st.wpm)), a: Math.max(prev.a, round1(st.acc)) };
        recordSession('lesson', l.id + ':' + ei, 'Lesson ' + (li + 1) + ': ' + l.title, st);
        const nowDone = lessonInfo(l).complete;
        const last = ei === l.ex.length - 1;
        const res = { lessonDone: !before && nowDone ? l : null };
        if (stars === 0) res.primary = { label: 'Try again', act: () => startLessonExercise(li, ei) };
        else if (!last) res.primary = { label: 'Next exercise', act: () => startLessonExercise(li, ei + 1) };
        else if (nowDone && li < COURSE.length - 1) res.primary = { label: 'Next lesson', act: () => { location.hash = '#lesson-' + (li + 2); } };
        else res.primary = { label: 'Back to the lesson', act: () => { location.hash = '#lesson-' + (li + 1); render(); } };
        if (stars > 0) res.secondary = { label: 'Try again', act: () => startLessonExercise(li, ei) };
        else res.secondary = last ? { label: 'Back to the lesson', act: () => { location.hash = '#lesson-' + (li + 1); render(); } } : { label: 'Skip to next', act: () => startLessonExercise(li, ei + 1) };
        return res;
      }
    });
  }

  const round1 = (x) => Math.round((x || 0) * 10) / 10;

  function recordSession(kind, ref, title, st) {
    const S = App.state;
    const now = Date.now();
    const secs = Math.max(1, Math.round(st.ms / 1000));
    S.history.push({ id: TT.uid('s'), t: now, k: kind, r: ref, title, w: round1(st.wpm), a: round1(st.acc), c: st.chars, d: secs });
    if (S.history.length > 400) S.history = S.history.slice(-400);
    const day = TT.dayKey(now);
    const D = S.dailyByDev[App.dev] = S.dailyByDev[App.dev] || {};
    D[day] = (D[day] || 0) + secs;
    const days = Object.keys(D).sort();
    if (days.length > 400) days.slice(0, days.length - 400).forEach(d => delete D[d]);
    const KB = S.keysByDev[App.dev] = S.keysByDev[App.dev] || {};
    Object.keys(st.hits).forEach(c => { const f = keyField(c); KB[f] = KB[f] || [0, 0]; KB[f][0] += st.hits[c]; });
    Object.keys(st.misses).forEach(c => { const f = keyField(c); KB[f] = KB[f] || [0, 0]; KB[f][1] += st.misses[c]; });
    saveState();
  }

  // ───────────────────────── Typing engine + view ─────────────────────────
  const Typing = {
    active: false, sess: null, timer: null,
    start(sess) {
      if (this.active) this.stop();
      this.active = true;
      this.sess = sess;
      App.view = 'typing';
      const view = document.getElementById('view');
      view.textContent = '';
      view.className = 'view view-typing';
      buildTyping(view, sess);
      window.scrollTo(0, 0);
    },
    stop() {
      this.active = false;
      clearInterval(this.timer);
      clearTimeout(this.endTimer);
      App.keyHandler = null;
      if (P.tts && P.tts.stop) { try { P.tts.stop(); } catch (e) { /* ignore */ } }
    }
  };
  TT.Typing = Typing;

  function buildTyping(view, sess) {
    const S = App.state.settings;
    const layout = App.layout;
    const chars = Array.from(TT.cleanText(sess.text, layout));
    if (!chars.length) chars.push('.');
    const text = chars.join('');
    let pos = 0, strokes = 0, errors = 0, start = 0, last = 0, active = 0, done = false;
    const typed = [];
    const slips = new Set();
    const hits = {}, misses = {};
    const missAt = new Set();

    // header
    const dots = sess.dots ? h('span', { class: 'ex-dots', 'aria-hidden': 'true' },
      sess.dots.map((s, i) => h('span', { class: 'xd' + (i === sess.dot ? ' cur' : '') + (s >= 1 ? ' ok' : '') }))) : null;
    const head = h('div', { class: 'ty-head' },
      h('a', { class: 'back', href: sess.back.href, onclick: (e) => { if (sess.back.act) { e.preventDefault(); sess.back.act(); } } }, icon('back'), sess.back.label),
      h('div', { class: 'ty-title' }, h('strong', null, sess.title), sess.sub ? h('span', { class: 'muted' }, sess.sub) : null, dots));

    const listen = h('button', { class: 'btn ghost small', type: 'button', 'data-listen': '1', hidden: !P.tts, onclick: () => speak(text, sess.lang) }, icon('speaker'), 'Listen');
    const noteRow = h('div', { class: 'ty-note' }, sess.note ? h('p', null, sess.note) : h('p', { class: 'muted' }, 'Type the text below. Keep your eyes on the screen.'), listen);

    const inner = h('div', { class: 'tt-inner' });
    const spans = chars.map((c, i) => {
      const sp = h('span', { class: 'ch' + (c === ' ' ? ' sp' : '') }, c);
      inner.append(sp);
      void i;
      return sp;
    });
    const oneLine = (S.textView || 'line') === 'line';
    const textEl = h('div', { class: 'tt-text' + (oneLine ? ' one-line' : ''), role: 'textbox', 'aria-readonly': 'true', 'aria-label': 'Text to type: ' + text, tabindex: '0' }, inner);
    const statW = h('strong', null, '–'), statA = h('strong', null, '100%'), statT = h('strong', null, sess.timeLimit ? fmtClock(sess.timeLimit * 1000) : '0:00');
    const bar = h('span');
    const stats = h('div', { class: 'tt-stats' },
      h('span', { class: 'stat' }, statW, h('span', null, 'words per minute')),
      h('span', { class: 'stat' }, statA, h('span', null, 'accuracy')),
      h('span', { class: 'stat' }, statT, h('span', null, sess.timeLimit ? 'left' : 'time')),
      h('span', { class: 'tt-prog', 'aria-hidden': 'true' }, bar));
    const box = h('div', { class: 'tt-box' }, textEl, stats);

    const hint = h('p', { class: 'ty-hint', 'aria-live': 'off' });
    const caps = h('span', { class: 'caps-chip', hidden: true }, 'Caps Lock is on');
    const banner = h('div', { class: 'layout-banner', hidden: true });
    const touch = h('button', { class: 'btn ghost small touch-btn', type: 'button', onclick: () => sink.focus() }, icon('keyboard'), 'Tap to type');
    const sink = h('textarea', { class: 'sink', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'Typing input' });
    const kb = S.showKb ? TT.Keyboard({ layout }) : null;
    const hands = S.showHands ? TT.Hands() : null;
    const layoutNote = h('p', { class: 'small muted layout-note' }, 'Keyboard: ' + layout.name + ' · ', h('a', { href: '#options' }, 'change'));
    const result = h('div', { class: 'result', hidden: true, 'aria-live': 'polite' });

    const tw = h('div', { class: 'wrap typing' }, head, noteRow, banner, box,
      h('div', { class: 'hint-row' }, hint, caps, touch), result,
      h('div', { class: 'kb-area' + (kb ? '' : ' no-kb') }, kb ? kb.el : null, hands ? hands.el : null, layoutNote),
      sink);
    view.append(tw);

    let lineH = 0, lastTop = -1;
    function measure() {
      lineH = parseFloat(getComputedStyle(textEl).lineHeight) || (spans[0] ? spans[0].offsetHeight : 40);
    }
    function scrollLine() {
      const sp = spans[Math.min(pos, spans.length - 1)];
      if (!sp) return;
      if (oneLine) {
        // The cursor stays in the middle of the line; the text slides left under it.
        const anchor = textEl.clientWidth * 0.5;
        const x = sp.offsetLeft + (pos >= spans.length ? sp.offsetWidth : 0);
        inner.style.transform = 'translate3d(' + Math.round(anchor - x) + 'px, 0, 0)';
        return;
      }
      const top = sp.offsetTop;
      if (top === lastTop) return;
      lastTop = top;
      const shift = Math.max(0, top - lineH * (top > lineH * 1.5 ? 1 : 0));
      inner.style.transform = 'translateY(' + (-shift) + 'px)';
    }
    function paintCursor() {
      spans.forEach(sp => sp.classList.remove('cur'));
      if (pos < spans.length) spans[pos].classList.add('cur');
      const ch = chars[pos];
      const target = ch != null ? TT.keyFor(layout, ch) : null;
      if (kb) kb.highlight(target);
      if (hands) hands.set(target ? [target.finger, target.shiftFinger].filter(Boolean) : []);
      hint.textContent = '';
      if (ch == null) return;
      if (ch === ' ') hint.append('Next: ', TT.keycap('Space', 'wide'), ' ', fingerChip('th'));
      else if (target) {
        hint.append('Next: ', TT.keycap(ch), ' ', fingerChip(target.finger));
        if (target.shift) hint.append(' + ', TT.keycap(target.shiftCode === 'ShiftLeft' ? 'left Shift' : 'right Shift', 'wide'), ' ', fingerChip(target.shiftFinger));
      } else hint.append('Next: ', TT.keycap(ch));
      scrollLine();
    }
    // Timed drills (sess.timeLimit, seconds) use the real clock from the first key.
    const limit = sess.timeLimit ? sess.timeLimit * 1000 : 0;
    let finalMs = 0;
    function curMs() {
      if (!start) return 0;
      if (limit) return done ? finalMs : Math.min(limit, performance.now() - start);
      return active + (done ? 0 : Math.min(performance.now() - last, 3000));
    }
    function correctCount() {
      if (S.onError === 'stop') return pos;
      let n = 0; for (let i = 0; i < pos; i++) if (typed[i] === chars[i]) n++;
      return n;
    }
    function updateStats(final) {
      const ms = curMs();
      const w = TT.wpm(correctCount(), ms);
      const acc = strokes ? (strokes - errors) / strokes * 100 : 100;
      // Speed is noise for the first few keys, so wait for a fair sample.
      statW.textContent = start && (final || ms >= 4000 || (pos >= 6 && ms >= 1500)) ? fmtWpm(w) : '–';
      statA.textContent = fmtAcc(acc);
      statT.textContent = limit ? fmtClock(Math.max(0, limit - ms)) : fmtClock(ms);
      bar.style.width = (limit ? Math.round(ms / limit * 100) : Math.round(pos / chars.length * 100)) + '%';
    }

    function input(ch, code) {
      if (done) return;
      const now = performance.now();
      if (!start) {
        start = now; last = now;
        if (limit) { clearTimeout(Typing.endTimer); Typing.endTimer = setTimeout(() => { if (!done) finish(true); }, limit); }
      }
      else { active += Math.min(now - last, 3000); last = now; }
      const expected = chars[pos];
      strokes++;
      const ok = ch === expected;
      if (!ok) {
        errors++;
        if (!missAt.has(pos)) { missAt.add(pos); misses[expected] = (misses[expected] || 0) + 1; }
      } else if (!missAt.has(pos) || S.onError === 'stop') {
        hits[expected] = (hits[expected] || 0) + 1;
      }
      if (kb && code) kb.flash(code, ok);
      if (S.sound === 'all' && ok) TT.Sound.click();
      if (S.sound !== 'off' && !ok) TT.Sound.error();
      if (S.onError === 'stop') {
        if (ok) { spans[pos].classList.add('done'); pos++; textEl.classList.remove('flash-err'); }
        else {
          slips.add(pos); spans[pos].classList.add('slip');
          // No shaking: the cursor turns red for a moment instead.
          textEl.classList.add('flash-err');
          clearTimeout(textEl._errT); textEl._errT = setTimeout(() => textEl.classList.remove('flash-err'), 600);
        }
      } else {
        typed[pos] = ch;
        spans[pos].classList.add(ok ? 'done' : 'bad');
        pos++;
      }
      if (pos >= chars.length) { finish(); return; }
      paintCursor();
      updateStats();
    }
    function backspace() {
      if (done || S.onError === 'stop' || pos === 0) return;
      pos--;
      typed.length = pos;
      spans[pos].classList.remove('done', 'bad');
      paintCursor(); updateStats();
    }
    function restart() {
      Typing.start(sess);
    }
    function finish(timeUp) {
      const ms0 = limit ? (timeUp ? limit : Math.min(limit, performance.now() - start)) : 0;
      done = true;
      finalMs = ms0;
      clearInterval(Typing.timer);
      clearTimeout(Typing.endTimer);
      spans.forEach(sp => sp.classList.remove('cur'));
      if (kb) kb.highlight(null);
      if (hands) hands.set([]);
      hint.textContent = '';
      const ms = limit ? Math.max(ms0, 1000) : Math.max(active, 1000);
      const st = { wpm: TT.wpm(correctCount(), ms), acc: strokes ? (strokes - errors) / strokes * 100 : 100, ms, chars: limit ? pos : chars.length, hits, misses, errors, strokes, timeUp: !!timeUp };
      const stars = TT.stars(st.acc, st.wpm, sess.target || 20);
      const out = sess.complete(st, stars) || {};
      tw.classList.add('is-done');
      showResult(st, stars, out);
      updateStats(true);
    }
    function showResult(st, stars, out) {
      result.textContent = '';
      const titles = ['Almost! You need 90% accuracy for a star.', 'Good. Now aim for more accuracy.', 'Well done!', 'Excellent!'];
      if (st.timeUp) out.message = 'Time is up! You typed ' + Math.round(correctCount() / 5) + ' words in ' + fmtClock(st.ms) + '.';
      const missList = Object.keys(misses).sort((a, b) => misses[b] - misses[a]).slice(0, 6);
      const primary = out.primary || { label: 'Again', act: restart };
      const secondary = out.secondary || null;
      add(result,
        h('div', { class: 'res-top' },
          h('div', null, h('h2', null, titles[stars]), TT.starRow(stars, 3)),
          h('div', { class: 'res-nums' },
            h('span', { class: 'rn' }, h('strong', null, fmtWpm(st.wpm)), h('span', null, 'words per minute')),
            h('span', { class: 'rn' }, h('strong', null, fmtAcc(st.acc)), h('span', null, 'accuracy')),
            h('span', { class: 'rn' }, h('strong', null, fmtClock(st.ms)), h('span', null, 'time')))),
        missList.length ? h('p', { class: 'res-miss' }, 'Practice these keys: ', missList.map(c => h('span', { class: 'miss' }, TT.keycap(c === ' ' ? 'Space' : c, c === ' ' ? 'wide' : ''), '×' + misses[c]))) :
          h('p', { class: 'res-miss' }, 'No mistakes. Great control!'),
        sess.target ? h('p', { class: 'small muted' }, '3 stars: 97% accuracy and ' + sess.target + ' words per minute.') : null,
        out.lessonDone ? h('div', { class: 'res-lesson' },
          h('strong', null, 'Lesson complete!'), ' You learned: ',
          h('span', { class: 'tag en' }, 'English'), out.lessonDone.en.h, ' ',
          h('span', { class: 'tag ai' }, 'Claude'), out.lessonDone.ai.h) : null,
        out.message ? h('p', null, out.message) : null,
        h('div', { class: 'res-actions' },
          secondary ? h('button', { class: 'btn ghost', type: 'button', onclick: secondary.act }, icon('retry'), secondary.label, h('span', { class: 'kbd-hint' }, 'Esc')) : null,
          h('button', { class: 'btn primary', type: 'button', onclick: primary.act }, primary.label, h('span', { class: 'kbd-hint' }, 'Enter'))));
      result.hidden = false;
      box.classList.add('finished');
      App.resultKeys = { enter: primary.act, esc: secondary ? secondary.act : restart };
      if (App.needsRender) App.needsRender = false;
    }

    function observe(e) {
      if (!e.code || e.key.length !== 1) return;
      if (e.getModifierState && (e.getModifierState('CapsLock') || e.getModifierState('AltGraph'))) return;
      App.obs[e.code + '|' + (e.shiftKey ? 1 : 0)] = e.key;
      const res = TT.matchPresets(App.obs);
      const cur = res[layout.id];
      if (!cur || cur.bad < 2 || !banner.hidden || App.state.dismissed['layout-' + layout.id]) return;
      const cands = TT.PRESET_ORDER.filter(id => id !== layout.id && res[id].bad === 0 && res[id].ok >= 3).sort((a, b) => res[b].ok - res[a].ok);
      if (!cands.length) return;
      const id = cands[0];
      banner.textContent = '';
      banner.append(h('p', null, 'Your keyboard types like ', h('strong', null, TT.PRESETS[id].name), '. Switch the on-screen keyboard to match?'),
        h('div', { class: 'cta-row' },
          h('button', { class: 'btn primary small', type: 'button', onclick: () => { setLayout(id); restart(); } }, 'Switch'),
          h('button', { class: 'btn ghost small', type: 'button', onclick: () => { banner.hidden = true; App.state.dismissed['layout-' + layout.id] = 1; } }, 'Keep ' + layout.name)));
      banner.hidden = false;
    }

    App.keyHandler = function (e) {
      if (e.getModifierState) caps.hidden = !e.getModifierState('CapsLock');
      if (done) {
        if (e.key === 'Enter') { e.preventDefault(); App.resultKeys.enter(); }
        else if (e.key === 'Escape') { e.preventDefault(); App.resultKeys.esc(); }
        return;
      }
      if (e.ctrlKey || e.metaKey) return;
      if (e.altKey && !(e.getModifierState && e.getModifierState('AltGraph'))) return;
      const k = e.key;
      if (k === 'Escape') { e.preventDefault(); restart(); return; }
      if (k === 'Backspace') { e.preventDefault(); backspace(); return; }
      if (k === 'Tab') return;
      if (k === 'Enter') { e.preventDefault(); return; }
      if (k === 'Dead') { hint.textContent = 'That key only adds an accent. Type the character shown.'; return; }
      if (k === 'Unidentified' || e.isComposing || k.length !== 1) return;
      e.preventDefault();
      if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
      observe(e);
      input(k, e.code);
    };
    sink.addEventListener('input', () => {
      const v = sink.value;
      sink.value = '';
      for (const ch of v) { if (ch === '\n') continue; input(ch, null); }
    });

    touch.hidden = !matchMedia('(hover: none) and (pointer: coarse)').matches;
    requestAnimationFrame(() => { measure(); paintCursor(); updateStats(); try { textEl.focus({ preventScroll: true }); } catch (e) { /* ignore */ } });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); lastTop = -1; scrollLine(); });
    Typing.timer = setInterval(() => { if (start && !done) updateStats(); }, 250);
  }

  function speak(text, lang) {
    if (!P.tts) return;
    try {
      const p = P.tts.speak(text, lang ? { language: lang } : undefined);
      if (p && p.catch) p.catch(err => { if (err && err.code === 'not_granted') { P.tts = null; document.querySelectorAll('[data-listen]').forEach(b => { b.hidden = true; }); } });
    } catch (e) { /* ignore */ }
  }

  // Global keys go to the active view.
  window.addEventListener('keyup', e => {
    const dlg = document.getElementById('dialog-root');
    if (dlg && !dlg.hidden) return;
    if (e.target && e.target.closest && e.target.closest('input, textarea:not(.sink), select')) return;
    if (App.keyUpHandler) App.keyUpHandler(e);
  });
  window.addEventListener('keydown', e => {
    const dlg = document.getElementById('dialog-root');
    if (dlg && !dlg.hidden) return;
    const t = e.target;
    if (t && t.closest && t.closest('input, textarea:not(.sink), select, [contenteditable="true"]')) return;
    if (App.keyHandler) App.keyHandler(e);
  });

  // ───────────────────────── Steno basics (court reporters' machine shorthand) ─────────────────────────
  // Plover's keyboard mapping: physical keys (event.code) → steno keys. Works on any layout.
  const STENO_MAP = {
    KeyQ: 'S-', KeyA: 'S-', KeyW: 'T-', KeyS: 'K-', KeyE: 'P-', KeyD: 'W-', KeyR: 'H-', KeyF: 'R-',
    KeyT: '*', KeyY: '*', KeyG: '*', KeyH: '*', KeyC: 'A-', KeyV: 'O-', KeyN: '-E', KeyM: '-U',
    KeyU: '-F', KeyJ: '-R', KeyI: '-P', KeyK: '-B', KeyO: '-L', KeyL: '-G', KeyP: '-T', Semicolon: '-S',
    BracketLeft: '-D', Quote: '-Z',
    Digit1: '#', Digit2: '#', Digit3: '#', Digit4: '#', Digit5: '#', Digit6: '#', Digit7: '#', Digit8: '#', Digit9: '#', Digit0: '#'
  };
  const STENO_ORDER = ['#', 'S-', 'T-', 'K-', 'P-', 'W-', 'H-', 'R-', 'A-', 'O-', '*', '-E', '-U', '-F', '-R', '-P', '-B', '-L', '-G', '-T', '-S', '-D', '-Z'];
  const stenoLetter = (k) => k.replace('-', '');
  // Set of steno keys → written stroke, e.g. {K-, A-, -T} → "KAT", {-T} → "-T".
  function strokeString(keys) {
    let left = '', mid = '', right = '';
    STENO_ORDER.forEach(k => {
      if (!keys.has(k)) return;
      if (['A-', 'O-', '*', '-E', '-U'].includes(k)) mid += stenoLetter(k);
      else if (k === '#' || k.endsWith('-')) left += stenoLetter(k);
      else right += stenoLetter(k);
    });
    return left + mid + (right && !mid ? '-' : '') + right;
  }
  // Written stroke → set of steno keys.
  function parseStroke(str) {
    const set = new Set();
    let i = 0;
    for (const ch of str) {
      if (ch === '-') { i = Math.max(i, STENO_ORDER.indexOf('-F')); continue; }
      let j = i;
      while (j < STENO_ORDER.length && stenoLetter(STENO_ORDER[j]) !== ch) j++;
      if (j >= STENO_ORDER.length) return null;
      set.add(STENO_ORDER[j]); i = j + 1;
    }
    return set;
  }
  TT.strokeString = strokeString; TT.parseStroke = parseStroke;

  const STENO_LESSONS = [
    { id: 'steno-1', title: 'The steno keys', info: 'One key per stroke. Press it, then let go. Read the key name: S, T, K... The dash shows the right hand: -F, -T.',
      items: ['S', 'T', 'K', 'P', 'W', 'H', 'R', 'A', 'O', 'E', 'U', '*', '-F', '-R', '-P', '-B', '-L', '-G', '-T', '-S', '-D', '-Z'].map(s => [s, s]) },
    { id: 'steno-2', title: 'One key, one word', info: 'The most common words need just one key. This is why court reporters are so fast.',
      items: [['is', 'S'], ['it', 'T'], ['can', 'K'], ['with', 'W'], ['are', 'R'], ['the', '-T'], ['of', '-F'], ['be', '-B'], ['he', 'E'], ['you', 'U'], ['I', 'EU']] },
    { id: 'steno-3', title: 'Whole words in one chord', info: 'Press all keys of a word at the same time: the start with the left hand, the vowel with a thumb, the end with the right hand.',
      items: [['cat', 'KAT'], ['sat', 'SAT'], ['hat', 'HAT'], ['rat', 'RAT'], ['tap', 'TAP'], ['top', 'TOP'], ['set', 'SET'], ['red', 'RED'], ['stop', 'STOP'], ['sit', 'SEUT']] },
    { id: 'steno-4', title: 'Letters from chords', info: 'The left hand has only 7 keys, so some letters are chords: D = TK, B = PW, L = HR, M = PH, F = TP, N = TPH, G = TKPW.',
      items: [['dog', 'TKOG'], ['bed', 'PWED'], ['mat', 'PHAT'], ['lot', 'HROT'], ['fat', 'TPAT'], ['net', 'TPHET'], ['bat', 'PWAT'], ['got', 'TKPWOT']] },
    { id: 'steno-5', title: 'Common short forms', info: 'Court reporters learn "briefs": short chords for very common words. These are from the Plover dictionary.',
      items: [['and', 'SKP'], ['to', 'TO'], ['a', 'AEU'], ['in', 'TPH'], ['for', 'TP'], ['on', 'OPB'], ['that', 'THA'], ['was', 'WAS'], ['not', 'TPHOT'], ['but', 'PWU'], ['what', 'WHA'], ['have', 'SR'], ['this', 'TH'], ['we', 'WE'], ['they', 'THE']] }
  ];
  TT.STENO_LESSONS = STENO_LESSONS;

  function stenoKeyboard() {
    // Physical rows as on a steno machine: two rows of consonants, a thumb row, a number bar.
    const rows = [
      ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft'],
      ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'],
      ['KeyC', 'KeyV', null, 'KeyN', 'KeyM']
    ];
    const byKey = {};
    const root = h('div', { class: 'steno-kb', 'aria-hidden': 'true' });
    const keyEl = (code) => {
      const sk = STENO_MAP[code];
      const m = App.layout.map[code];
      const el = h('div', { class: 'sk' + (sk === '*' ? ' star' : '') + (['A-', 'O-', '-E', '-U'].includes(sk) ? ' vowel' : '') + (sk.startsWith('-') && sk.length > 1 && !['-E', '-U'].includes(sk) ? ' right' : '') },
        h('span', { class: 'sk-name' }, stenoLetter(sk)), h('span', { class: 'sk-qw' }, m ? (m[1] && m[0].length === 1 && m[0].toUpperCase() === m[1] ? m[1] : m[0]) : ''));
      (byKey[sk] = byKey[sk] || []).push(el);
      return el;
    };
    root.append(h('div', { class: 'sk-row num' }, h('div', { class: 'sk num-bar' }, h('span', { class: 'sk-name' }, '#'), h('span', { class: 'sk-qw' }, 'number row'))));
    (byKey['#'] = []).push(root.lastChild.firstChild);
    rows.forEach((r, i) => root.append(h('div', { class: 'sk-row' + (i === 2 ? ' thumbs' : '') }, r.map(c => c ? keyEl(c) : h('div', { class: 'sk-gap' })))));
    return {
      el: root,
      set(cls, keys) {
        Object.values(byKey).flat().forEach(el => el.classList.remove(cls));
        if (keys) keys.forEach(k => (byKey[k] || []).forEach(el => el.classList.add(cls)));
      }
    };
  }

  const Steno = { hints: true };
  function renderSteno(view) {
    const wrap = h('div', { class: 'wrap steno' });
    wrap.append(h('a', { class: 'back', href: '#practice' }, icon('back'), 'Practice'));
    wrap.append(h('header', { class: 'page-head' },
      h('h1', { class: 'display' }, 'Steno basics'),
      h('p', { class: 'lede' }, 'American court reporters write with a stenotype machine. They press several keys at the same time, like a chord on a piano, and one chord writes a whole word. Here your normal keyboard works like a steno machine, with the free Plover layout.')));
    const kb = stenoKeyboard();
    wrap.append(h('section', { class: 'panel steno-how' },
      h('h3', null, 'How it works'),
      h('ul', { class: 'tip-list' },
        h('li', null, 'Press all keys of a chord together, then lift all fingers. The chord is written when every key is up.'),
        h('li', null, 'Left fingers rest on the S T P H row and S K W R row, right fingers on F P L T D and R B G S Z. Thumbs: A O and E U.'),
        h('li', null, 'Some keyboards can’t send many keys at the same time. If a chord loses keys, try another keyboard: you need one with "n-key rollover" (NKRO).')),
      h('div', { class: 'kb-wrap' }, kb.el),
      h('p', { class: 'small muted' }, 'Big letter: the steno key. Small letter: the key on your keyboard.')));
    const list = h('ol', { class: 'ex-list steno-list' });
    STENO_LESSONS.forEach((l, i) => {
      const r = App.state.lessons[l.id] && App.state.lessons[l.id].ex[0];
      list.append(h('li', { class: 'ex-item' + (r && r.s >= 1 ? ' done' : '') },
        h('button', { type: 'button', class: 'ex-btn', onclick: () => startSteno(i) },
          h('span', { class: 'ex-num' }, String(i + 1)),
          h('span', { class: 'ex-text st-title' }, l.title),
          h('span', { class: 'ex-stat' }, r ? TT.starRow(r.s, 3) : h('span', { class: 'muted small' }, 'Start')))));
    });
    wrap.append(h('section', { class: 'panel steno-lessons' }, h('h3', null, 'Lessons'), list));
    wrap.append(h('section', { class: 'panel' }, h('h3', null, 'Learn more (free)'),
      h('ul', { class: 'tip-list' },
        h('li', null, h('a', { href: 'https://www.openstenoproject.org/plover/' }, 'Plover'), ': free software that makes your keyboard a steno machine everywhere on your computer.'),
        h('li', null, h('a', { href: 'https://www.artofchording.com/' }, 'Art of Chording'), ' and Learn Plover!: free books that teach the whole steno theory.'),
        h('li', null, h('a', { href: 'https://didoesdigital.com/typey-type/' }, 'Typey Type'), ': free steno practice with many lessons.'))));
    view.append(wrap);
  }

  function startSteno(li, rounds) {
    const L = STENO_LESSONS[li];
    const view = document.getElementById('view');
    if (Typing.active) Typing.stop();
    App.view = 'steno-drill';
    view.textContent = '';
    view.className = 'view view-steno';
    // 16 prompts: every item once, then random repeats.
    const order = L.items.slice().sort(() => Math.random() - 0.5);
    while (order.length < 16) order.push(L.items[Math.floor(Math.random() * L.items.length)]);
    const prompts = order.slice(0, Math.max(16, L.items.length));
    let idx = 0, strokes = 0, errors = 0, start = 0, last = 0, active = 0, done = false;
    const down = new Set(), chord = new Set();
    const kb = stenoKeyboard();
    const word = h('p', { class: 'st-word' }), target = h('p', { class: 'st-target' }), feedback = h('p', { class: 'st-feedback', 'aria-live': 'polite' });
    const count = h('span', { class: 'muted' });
    const hintBox = h('input', { type: 'checkbox', id: 'st-hints', checked: Steno.hints });
    hintBox.addEventListener('change', () => { Steno.hints = hintBox.checked; show(); });
    const result = h('div', { class: 'result', hidden: true });
    const tw = h('div', { class: 'wrap typing steno-drill' },
      h('div', { class: 'ty-head' },
        h('a', { class: 'back', href: '#steno' }, icon('back'), 'Steno basics'),
        h('div', { class: 'ty-title' }, h('strong', null, L.title), count)),
      h('p', { class: 'ty-note muted' }, L.info),
      h('div', { class: 'tt-box st-box' }, word, target, feedback),
      result,
      h('div', { class: 'kb-area' }, kb.el,
        h('label', { class: 'radio', for: 'st-hints' }, hintBox, h('span', null, 'Show the keys to press'))));
    view.append(tw);
    function show() {
      const [w, st] = prompts[idx];
      word.textContent = w;
      target.textContent = Steno.hints ? st : '?';
      kb.set('want', Steno.hints ? parseStroke(st) : null);
      count.textContent = 'Word ' + (idx + 1) + ' of ' + prompts.length;
    }
    function stroke() {
      if (done) return;
      const now = performance.now();
      if (!start) { start = now; last = now; } else { active += Math.min(now - last, 4000); last = now; }
      const got = strokeString(chord);
      const [w, st] = prompts[idx];
      strokes++;
      chord.clear();
      if (got === strokeString(parseStroke(st))) {
        feedback.textContent = '✓ ' + got + ' = ' + w;
        feedback.className = 'st-feedback ok';
        idx++;
        if (idx >= prompts.length) return finish();
        show();
      } else {
        errors++;
        feedback.textContent = 'You pressed ' + (got || '?') + '. For “' + w + '” press ' + st + '.';
        feedback.className = 'st-feedback bad';
        if (S().sound !== 'off') TT.Sound.error();
        kb.set('want', parseStroke(st));
      }
    }
    const S = () => App.state.settings;
    function finish() {
      done = true;
      kb.set('want', null); kb.set('down', null);
      const ms = Math.max(active, 1000);
      const wpm = prompts.length / (ms / 60000);
      const acc = (strokes - errors) / strokes * 100;
      const stars = TT.stars(acc, wpm, 15);
      const rec = App.state.lessons[L.id] = App.state.lessons[L.id] || { ex: {} };
      const prev = rec.ex[0] || { s: 0, w: 0, a: 0 };
      rec.ex[0] = { s: Math.max(prev.s, stars), w: Math.max(prev.w, round1(wpm)), a: Math.max(prev.a, round1(acc)) };
      recordSession('steno', L.id, 'Steno: ' + L.title, { wpm, acc, ms, chars: prompts.length, hits: {}, misses: {} });
      result.textContent = '';
      const next = li < STENO_LESSONS.length - 1 && stars >= 1;
      add(result,
        h('div', { class: 'res-top' },
          h('div', null, h('h2', null, ['Almost! You need 90% correct chords.', 'Good. Now aim for fewer mistakes.', 'Well done!', 'Excellent!'][stars]), TT.starRow(stars, 3)),
          h('div', { class: 'res-nums' },
            h('span', { class: 'rn' }, h('strong', null, String(Math.round(wpm))), h('span', null, 'words per minute')),
            h('span', { class: 'rn' }, h('strong', null, fmtAcc(acc)), h('span', null, 'correct chords')),
            h('span', { class: 'rn' }, h('strong', null, fmtClock(ms)), h('span', null, 'time')))),
        h('p', { class: 'small muted' }, '3 stars: 97% correct chords and 15 words per minute.'),
        h('div', { class: 'res-actions' },
          h('button', { class: 'btn ghost', type: 'button', onclick: () => startSteno(li) }, icon('retry'), 'Try again', h('span', { class: 'kbd-hint' }, 'Esc')),
          h('button', { class: 'btn primary', type: 'button', onclick: () => next ? startSteno(li + 1) : (location.hash = '#steno', render()) }, next ? 'Next lesson' : 'Back to Steno basics', h('span', { class: 'kbd-hint' }, 'Enter'))));
      result.hidden = false;
      App.resultKeys = { enter: () => next ? startSteno(li + 1) : (location.hash = '#steno', render()), esc: () => startSteno(li) };
    }
    App.keyHandler = (e) => {
      if (done) {
        if (e.key === 'Enter') { e.preventDefault(); App.resultKeys.enter(); }
        else if (e.key === 'Escape') { e.preventDefault(); App.resultKeys.esc(); }
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const sk = STENO_MAP[e.code];
      if (!sk) return;
      e.preventDefault();
      if (e.repeat) return;
      down.add(e.code); chord.add(sk);
      kb.set('down', chord);
    };
    App.keyUpHandler = (e) => {
      if (done || !STENO_MAP[e.code]) return;
      e.preventDefault();
      down.delete(e.code);
      if (!down.size && chord.size) { stroke(); kb.set('down', null); }
    };
    window.addEventListener('blur', () => { down.clear(); chord.clear(); kb.set('down', null); }, { once: true });
    show();
  }

  // ───────────────────────── Choose keys ─────────────────────────
  // Drill text from the picked keys. "only": every character is a picked key. "focus": real words that contain them.
  function pickDrill(count) {
    count = count || 18;
    const S = App.state.settings;
    const picked = new Set(Array.from(S.pickKeys || ''));
    if (!picked.size) return '';
    const letters = [...picked].filter(c => /[a-z]/.test(c));
    const other = [...picked].filter(c => !/[a-z]/.test(c));
    const words = Array.from(new Set(dictionary().concat(TT.HAND_WORDS))).filter(w => w.length > 1);
    if (S.pickMode === 'focus') {
      const pool = words.filter(w => [...w].some(c => picked.has(c)));
      let t = TT.makeDrill(pool.length >= 5 ? pool : words, TT.allowedChars(COURSE, 12), letters, count);
      if (other.length) t = t.split(' ').map((w, i) => i % 3 === 2 ? w + other[i % other.length] : w).join(' ');
      return t;
    }
    const allowed = new Set([' ', ...picked]);
    const pool = words.filter(w => [...w].every(c => allowed.has(c)));
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    const keys = [...picked];
    const group = () => { let g = ''; const n = 2 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) g += rnd(keys); return g; };
    const out = [];
    // Real words when there are enough; otherwise key groups like "fjf jfk".
    for (let i = 0; i < count; i++) out.push(pool.length >= 6 && Math.random() < 0.75 ? rnd(pool) : group());
    return out.join(' ');
  }

  function renderPickKeys(view) {
    const S = App.state.settings;
    const save = () => { App.state.settingsAt = Date.now(); saveState(); };
    const picked = new Set(Array.from(S.pickKeys || ''));
    const wrap = h('div', { class: 'wrap pick' });
    wrap.append(h('a', { class: 'back', href: '#practice' }, icon('back'), 'Practice'));
    wrap.append(h('header', { class: 'page-head' }, h('h1', { class: 'display' }, 'Choose keys'),
      h('p', { class: 'lede' }, 'Click the keys you want to practice, or type them in the box. Then start.')));
    const input = h('input', { id: 'pick-input', class: 'input', type: 'text', maxlength: '40', autocomplete: 'off', spellcheck: 'false', value: [...picked].join(''), placeholder: 'For example: qzxp' });
    const startBtn = h('button', { class: 'btn primary big', type: 'button' }, icon('play'), 'Start');
    const info = h('p', { class: 'small muted' });
    let kb;
    const update = () => {
      S.pickKeys = [...picked].join('');
      input.value = S.pickKeys;
      kb.setPicked(picked);
      startBtn.disabled = !picked.size;
      const words = Array.from(new Set(dictionary().concat(TT.HAND_WORDS))).filter(w => w.length > 1 && [...w].every(c => picked.has(c)));
      info.textContent = !picked.size ? 'No keys chosen yet.' : S.pickMode === 'only'
        ? (words.length >= 6 ? words.length + ' real words use only these keys, for example: ' + words.slice(0, 5).join(', ') + '.' : 'Few real words use only these keys, so you will mostly type key groups like “' + [...picked].slice(0, 3).join('') + '”.')
        : 'You will type real words that contain these keys.';
    };
    kb = TT.Keyboard({ layout: App.layout, onKey: (code) => {
      const m = App.layout.map[code];
      const ch = m && m[0];
      if (!ch || (ch[0] === '~' && ch.length > 1)) return;
      if (picked.has(ch)) picked.delete(ch); else picked.add(ch);
      update(); save();
    } });
    input.addEventListener('input', () => {
      picked.clear();
      for (const c of input.value.toLowerCase()) if (c !== ' ' && App.layout.charToKey[c]) picked.add(c);
      update(); save();
    });
    const radio = (v, label) => {
      const r = h('input', { type: 'radio', name: 'pickmode', id: 'pick-' + v, checked: S.pickMode === v });
      r.addEventListener('change', () => { if (r.checked) { S.pickMode = v; update(); save(); } });
      return h('label', { class: 'radio', for: 'pick-' + v }, r, h('span', null, label));
    };
    const quick = (label, chars) => h('button', { class: 'chip', type: 'button', onclick: () => { picked.clear(); [...chars].forEach(c => picked.add(c)); update(); save(); } }, label);
    const weak = weakKeys(6).map(k => k.c.toLowerCase()).filter(c => c !== ' ');
    startBtn.addEventListener('click', () => startDrill('pick'));
    wrap.append(h('section', { class: 'panel pick-panel' },
      h('div', { class: 'ideas' }, h('span', { class: 'small muted' }, 'Quick choice:'),
        quick('Home row', 'asdfghjkl'), quick('Top row', 'qwertyuiop'.replace(App.layout.id === 'cz' || App.layout.id === 'de' ? 'y' : '@', 'z')), quick('Bottom row', App.layout.id === 'cz' || App.layout.id === 'de' ? 'yxcvbnm' : 'zxcvbnm'),
        quick('Left hand', [...'abcdefghijklmnopqrstuvwxyz'].filter(c => { const t = TT.keyFor(App.layout, c); return t && TT.FINGERS[t.finger].hand === 'L'; }).join('')),
        quick('Right hand', [...'abcdefghijklmnopqrstuvwxyz'].filter(c => { const t = TT.keyFor(App.layout, c); return t && TT.FINGERS[t.finger].hand === 'R'; }).join('')),
        weak.length ? quick('My weak keys', weak.join('')) : null,
        h('button', { class: 'chip', type: 'button', onclick: () => { picked.clear(); update(); save(); } }, 'Clear')),
      h('div', { class: 'kb-wrap' }, kb.el),
      h('div', { class: 'field' }, h('label', { for: 'pick-input' }, 'Your keys'), input),
      h('div', { class: 'row-inline' }, radio('only', 'Only these keys'), radio('focus', 'Real words with these keys')),
      lengthPicker(), info, startBtn));
    view.append(wrap);
    update();
  }

  // ───────────────────────── Practice ─────────────────────────
  const Gen = { topic: '', level: 'B1', len: 'medium', busy: false, result: null, error: '', ctl: null };
  let editing = null; // { id?, title, body }

  function renderPractice(view) {
    const wrap = h('div', { class: 'wrap practice' });
    wrap.append(h('header', { class: 'page-head' },
      h('h1', { class: 'display' }, 'Practice'),
      h('p', { class: 'lede' }, 'Type your own texts, train your weak keys, or ask Claude for a new practice text.')));

    // drills
    const weak = weakKeys(5);
    const learned = TT.allowedChars(COURSE, learnedIndex());
    const drills = h('section', { class: 'drills' },
      drillCard('Your weak keys', weak.length ? h('span', { class: 'kcs' }, weak.map(k => TT.keycap(k.c === ' ' ? 'Space' : k.c))) : h('span', { class: 'muted small' }, 'Type a few lessons first. Then your weakest keys appear here.'),
        weak.length ? () => startDrill('weak') : null),
      drillCard('Words with keys you know', h('span', { class: 'muted small' }, learned.size > 40 ? 'All letters' : Array.from(learned).filter(c => c !== ' ').join(' ').toUpperCase()), () => startDrill('known')),
      drillCard('Common English words', h('span', { class: 'muted small' }, 'The 200 most useful words'), () => startDrill('common')),
      handCard(),
      drillCard('Choose keys', h('span', { class: 'muted small' }, App.state.settings.pickKeys ? h('span', { class: 'kcs' }, Array.from(App.state.settings.pickKeys).slice(0, 12).map(c => TT.keycap(c.toUpperCase()))) : 'Pick the keys you want to practice.'), () => { location.hash = '#keys'; }),
      drillCard('Steno basics', h('span', { class: 'muted small' }, 'The court reporters’ technique: press several keys at once to write a whole word.'), () => { location.hash = '#steno'; }));
    wrap.append(h('div', { class: 'sec-head row drills-head' }, h('h2', null, 'Quick drills'), lengthPicker()), drills);

    // my texts
    const list = Object.values(App.texts).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const mine = h('section', { class: 'my-texts' });
    mine.append(h('div', { class: 'sec-head row' }, h('h2', null, 'My texts'),
      editing ? null : h('button', { class: 'btn primary', type: 'button', onclick: () => { editing = { title: '', body: '' }; render(); } }, icon('plus'), 'Add a text')));
    if (editing) mine.append(textEditor());
    if (!list.length && !editing) {
      mine.append(h('div', { class: 'panel empty' },
        h('p', null, 'Add any English text you want to practice: an email you need to write, a song you like, notes from work, or a request to Claude.'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { editing = { title: '', body: '' }; render(); } }, icon('plus'), 'Add your first text')));
    }
    if (list.length) {
      mine.append(h('ul', { class: 'text-list' }, list.map(t => textRow(t, true))));
    }
    wrap.append(mine);

    // generator
    wrap.append(genSection());

    // starters
    wrap.append(h('section', null, sectionHead('Starter texts', 'Useful phrases for emails and for working with Claude.'),
      h('ul', { class: 'text-list' }, TT.STARTERS.map(t => textRow(t, false)))));
    view.append(wrap);
  }

  // Accuracy of each hand, from the per-key counters.
  function handStats() {
    const tot = keyTotals(), out = { L: [0, 0], R: [0, 0] };
    Object.keys(tot).forEach(c => {
      const t = TT.keyFor(App.layout, c);
      if (!t || t.finger === 'th') return;
      const hand = TT.FINGERS[t.finger].hand;
      out[hand][0] += tot[c][0]; out[hand][1] += tot[c][1];
    });
    const acc = (x) => x[0] + x[1] >= 20 ? x[0] / (x[0] + x[1]) : null;
    return { L: acc(out.L), R: acc(out.R) };
  }
  function handCard() {
    const hs = handStats();
    const weaker = hs.L != null && hs.R != null ? (hs.L < hs.R ? 'L' : 'R') : null;
    const pct = (a) => a == null ? '–' : Math.round(a * 1000) / 10 + '%';
    const btn = (hand, label) => h('button', { class: 'btn small ' + (weaker === hand ? 'primary' : 'ghost'), type: 'button', onclick: () => startDrill(hand === 'L' ? 'left' : 'right') }, icon('play'), label);
    return h('div', { class: 'panel drill hand-card' },
      h('h3', null, 'Train one hand'),
      h('div', { class: 'drill-body' },
        hs.L == null && hs.R == null ? h('span', { class: 'muted small' }, 'Words you type with only one hand.') :
          h('span', { class: 'small muted' }, 'Correct keys: left ' + pct(hs.L) + ' · right ' + pct(hs.R) + (weaker ? '. Your ' + (weaker === 'L' ? 'left' : 'right') + ' hand needs more practice.' : ''))),
      h('div', { class: 'cta-row' }, btn('L', 'Left hand'), btn('R', 'Right hand')));
  }

  function drillCard(title, body, act) {
    return h('div', { class: 'panel drill' },
      h('h3', null, title), h('div', { class: 'drill-body' }, body),
      h('button', { class: 'btn ghost small', type: 'button', disabled: !act, onclick: act || null }, icon('play'), 'Start'));
  }

  function textRow(t, own) {
    const chunks = TT.chunkText(TT.cleanText(t.body, App.layout), 260);
    const prog = App.state.textProg[t.id] || { next: 0, best: 0, laps: 0 };
    const next = Math.min(prog.next || 0, Math.max(0, chunks.length - 1));
    const words = (t.body.match(/\S+/g) || []).length;
    return h('li', { class: 'text-row' },
      h('div', { class: 'tr-main' },
        h('strong', null, t.title || 'Untitled text'),
        h('span', { class: 'muted small' }, words + ' words · ' + (chunks.length === 1 ? '1 part' : chunks.length + ' parts') +
          (prog.best ? ' · best ' + fmtWpm(prog.best) + ' WPM' : '') + (prog.laps ? ' · finished ' + prog.laps + '×' : ''))),
      h('div', { class: 'tr-actions' },
        h('button', { class: 'btn primary small', type: 'button', onclick: () => startText(t, next) }, icon('play'), chunks.length > 1 && next > 0 ? 'Continue part ' + (next + 1) : 'Practice'),
        own ? h('button', { class: 'btn ghost small icon-only', type: 'button', 'aria-label': 'Edit ' + (t.title || 'text'), onclick: () => { editing = { id: t.id, title: t.title, body: t.body }; render(); } }, icon('edit')) : null,
        own ? h('button', { class: 'btn ghost small icon-only', type: 'button', 'aria-label': 'Delete ' + (t.title || 'text'), onclick: () => deleteText(t) }, icon('trash')) : null));
  }

  function textEditor() {
    const title = h('input', { id: 'te-title', class: 'input', type: 'text', maxlength: '80', value: editing.title || '', placeholder: 'For example: Email to my landlord' });
    const body = h('textarea', { id: 'te-body', class: 'input area', rows: '8', maxlength: '50000', placeholder: 'Paste or write your text here.' });
    body.value = editing.body || '';
    const count = h('span', { class: 'small muted' });
    const warn = h('p', { class: 'small warn', hidden: true });
    const upd = () => {
      const words = (body.value.match(/\S+/g) || []).length;
      count.textContent = words + ' words';
      const cleaned = TT.cleanText(body.value, App.layout);
      const lost = new Set();
      for (const ch of body.value.replace(/\s+/g, ' ')) if (!App.layout.charToKey[ch] && !/[‘’“”–—…]/.test(ch)) lost.add(ch);
      warn.hidden = !lost.size;
      warn.textContent = lost.size ? 'Your ' + App.layout.name + ' keyboard has no key for: ' + Array.from(lost).slice(0, 12).join(' ') + '. These characters are changed or skipped when you practice.' : '';
      editing.title = title.value; editing.body = body.value;
      void cleaned;
    };
    body.addEventListener('input', upd); title.addEventListener('input', upd);
    const file = h('input', { id: 'te-file', type: 'file', accept: '.txt,.md,text/plain', class: 'visually-hidden', onchange: async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      if (f.size > 400000) { TT.toast('This file is too big. Use a text under 50,000 characters.'); return; }
      body.value = (await f.text()).slice(0, 50000);
      if (!title.value) title.value = f.name.replace(/\.(txt|md)$/i, '');
      upd();
    } });
    const save = () => {
      const b = body.value.trim();
      if (!b) { TT.toast('Write or paste some text first.'); body.focus(); return; }
      const now = Date.now();
      const id = editing.id || TT.uid('t');
      const t = Object.assign({}, App.texts[id] || { createdAt: now, src: 'user' }, { id, title: title.value.trim() || b.split(/\s+/).slice(0, 5).join(' '), body: b, updatedAt: now });
      App.texts[id] = t;
      saveTextsLocal();
      if (Sync.channels.texts) Sync.channels.texts.put(t);
      editing = null;
      TT.toast('Saved to My texts.');
      render();
    };
    setTimeout(upd, 0);
    return h('div', { class: 'panel editor' },
      h('label', { for: 'te-title' }, 'Title'), title,
      h('label', { for: 'te-body' }, 'Text'), body,
      h('div', { class: 'editor-foot' }, count,
        h('label', { class: 'btn ghost small', for: 'te-file' }, 'Open a .txt file'), file),
      warn,
      h('div', { class: 'cta-row' },
        h('button', { class: 'btn primary', type: 'button', onclick: save }, editing.id ? 'Save changes' : 'Save text'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { editing = null; render(); } }, 'Cancel')));
  }

  async function deleteText(t) {
    const ok = await TT.dialog({ title: 'Delete “' + (t.title || 'this text') + '”?', body: 'This removes the text from all your devices.', ok: 'Delete', danger: true });
    if (!ok) return;
    delete App.texts[t.id];
    delete App.state.textProg[t.id];
    saveTextsLocal(); saveState();
    if (Sync.channels.texts) Sync.channels.texts.remove(t.id);
    else { const tomb = new Set(LS.get(K.tomb) || []); tomb.add(t.id); LS.set(K.tomb, Array.from(tomb)); }
    TT.toast('Text deleted.');
    render();
  }

  function startText(t, chunkIdx) {
    const chunks = TT.chunkText(TT.cleanText(t.body, App.layout), 260);
    if (!chunks.length) { TT.toast('This text has no characters your keyboard can type.'); return; }
    const ci = Math.min(chunkIdx || 0, chunks.length - 1);
    const builtIn = !App.texts[t.id];
    Typing.start({
      kind: 'text', title: t.title || 'My text', sub: chunks.length > 1 ? 'Part ' + (ci + 1) + ' of ' + chunks.length : '',
      dots: chunks.length > 1 && chunks.length <= 12 ? chunks.map((_, i) => i < ci ? 1 : -1) : null, dot: ci,
      text: chunks[ci], lang: builtIn ? 'en' : null, target: targetFor(25),
      back: { label: 'Practice', href: '#practice' },
      complete(st, stars) {
        const prog = App.state.textProg[t.id] = App.state.textProg[t.id] || { next: 0, best: 0, laps: 0 };
        prog.best = Math.max(prog.best || 0, round1(st.wpm));
        const last = ci === chunks.length - 1;
        if (stars >= 1) {
          if (last) { prog.next = 0; prog.laps = (prog.laps || 0) + 1; } else prog.next = Math.max(prog.next || 0, ci + 1);
        }
        recordSession('text', t.id, t.title || 'My text', st);
        const res = {};
        if (stars >= 1 && !last) res.primary = { label: 'Next part', act: () => startText(t, ci + 1) };
        else if (stars >= 1) res.primary = { label: 'Back to Practice', act: () => { location.hash = '#practice'; render(); } };
        else res.primary = { label: 'Try again', act: () => startText(t, ci) };
        res.secondary = stars >= 1 ? { label: 'Try again', act: () => startText(t, ci) } : { label: 'Back to Practice', act: () => { location.hash = '#practice'; render(); } };
        if (last && stars >= 1) res.message = 'You finished the whole text.';
        return res;
      }
    });
  }

  // Practice length: 0 = 18 words, otherwise seconds. Timed drills get enough words for 90 WPM.
  const DRILL_TIMES = [[0, '18 words'], [60, '1 min'], [120, '2 min'], [180, '3 min'], [300, '5 min'], [600, '10 min']];
  function lengthPicker() {
    const S = App.state.settings;
    const cur = Number(S.drillTime) || 0;
    return h('div', { class: 'length-pick', role: 'group', 'aria-label': 'Practice length' },
      h('span', { class: 'small muted' }, 'Length:'),
      DRILL_TIMES.map(([v, label]) => h('button', { type: 'button', class: 'chip' + (cur === v ? ' on' : ''), 'aria-pressed': cur === v ? 'true' : 'false',
        onclick: () => { S.drillTime = v; App.state.settingsAt = Date.now(); saveState(); render(); } }, label)));
  }

  function startDrill(kind) {
    const secs = Number(App.state.settings.drillTime) || 0;
    const N = secs ? Math.ceil(secs / 60 * 90) + 10 : 18;
    const learned = TT.allowedChars(COURSE, learnedIndex());
    let text, title;
    if (kind === 'weak') {
      const weak = weakKeys(5).map(k => k.c.toLowerCase());
      text = TT.makeDrill(dictionary(), learned, weak, secs ? N : 16);
      title = 'Weak keys: ' + weak.join(' ').toUpperCase();
    } else if (kind === 'known') {
      text = TT.makeDrill(dictionary(), learned, [], N);
      title = 'Words with keys you know';
    } else if (kind === 'pick') {
      text = pickDrill(N);
      title = 'Your keys: ' + Array.from(App.state.settings.pickKeys).join(' ').toUpperCase();
    } else if (kind === 'left' || kind === 'right') {
      // Letters that this hand types on the current layout.
      const hand = kind === 'left' ? 'L' : 'R';
      const handSet = new Set([' ']);
      'abcdefghijklmnopqrstuvwxyz'.split('').forEach(c => { const t = TT.keyFor(App.layout, c); if (t && TT.FINGERS[t.finger].hand === hand) handSet.add(c); });
      const pool = Array.from(new Set(dictionary().concat(TT.HAND_WORDS))).filter(w => w.length > 1 && w.split('').every(c => handSet.has(c)));
      const known = new Set([...handSet].filter(c => learned.has(c)));
      const usable = pool.filter(w => w.split('').every(c => known.has(c)));
      const focus = weakKeys(8).map(k => k.c.toLowerCase()).filter(c => handSet.has(c));
      text = TT.makeDrill(usable.length >= 10 ? usable : pool, handSet, focus, N);
      title = (kind === 'left' ? 'Left' : 'Right') + ' hand only';
    } else {
      text = TT.makeDrill(TT.WORDS.slice(0, 200), TT.allowedChars(COURSE, 12), [], N);
      title = 'Common English words';
    }
    if (!text) { TT.toast('Not enough words yet. Do a few lessons first.'); return; }
    Typing.start({
      kind: 'drill', title, sub: secs ? DRILL_TIMES.find(d => d[0] === secs)[1] + ' practice' : kind === 'left' || kind === 'right' ? 'Only ' + (kind === 'left' ? 'left' : 'right') + '-hand words' : 'Random words', text, lang: 'en', target: targetFor(20), timeLimit: secs,
      back: { label: 'Practice', href: '#practice' },
      complete(st, stars) {
        recordSession('drill', kind, title, st);
        return { primary: { label: 'New words', act: () => startDrill(kind) }, secondary: { label: 'Back to Practice', act: () => { location.hash = '#practice'; render(); } } };
      }
    });
    void 0;
  }

  // Claude makes a practice text
  function genSection() {
    const sec = h('section', { class: 'gen' }, sectionHead('Make a practice text with Claude', 'Choose a topic. Claude writes a short text with useful English and one example request.'));
    if (!P.sample || P.sampleOff) {
      sec.append(h('p', { class: 'panel muted' }, P.sampleOff
        ? 'Claude is turned off for this app. You can still add your own texts above.'
        : 'This works when you open the app on claude.ai. You can still add your own texts above.'));
      return sec;
    }
    const topic = h('input', { id: 'gen-topic', class: 'input', type: 'text', maxlength: '120', value: Gen.topic, placeholder: 'For example: a job interview, my garden, booking a hotel' });
    topic.addEventListener('input', () => { Gen.topic = topic.value; });
    const level = h('select', { id: 'gen-level', class: 'input' }, ['A2', 'B1', 'B2', 'C1'].map(v => h('option', { value: v, selected: Gen.level === v }, v)));
    level.addEventListener('change', () => { Gen.level = level.value; });
    const len = h('select', { id: 'gen-len', class: 'input' }, [['short', 'Short (40 words)'], ['medium', 'Medium (80 words)'], ['long', 'Long (150 words)']].map(([v, l]) => h('option', { value: v, selected: Gen.len === v }, l)));
    len.addEventListener('change', () => { Gen.len = len.value; });
    const out = h('div', { class: 'gen-out', 'aria-live': 'polite' });
    if (Gen.busy) out.append(h('p', { class: 'thinking' }, 'Claude is writing…'), h('button', { class: 'btn ghost small', type: 'button', onclick: () => Gen.ctl && Gen.ctl.abort() }, 'Stop'));
    else if (Gen.error) out.append(h('p', { class: 'warn' }, Gen.error));
    else if (Gen.result) {
      const r = Gen.result;
      out.append(h('div', { class: 'panel gen-result' },
        h('h3', null, r.title), h('p', null, r.text), r.tip ? h('p', { class: 'small muted' }, h('strong', null, 'Lesson: '), r.tip) : null,
        h('div', { class: 'cta-row' },
          h('button', { class: 'btn primary', type: 'button', onclick: () => startText({ id: 'gen-' + r.id, title: r.title, body: r.text }, 0) }, icon('play'), 'Type it'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => saveGenerated(r) }, 'Save to My texts'))));
    }
    sec.append(h('div', { class: 'panel gen-form' },
      h('div', { class: 'gen-fields' },
        h('div', { class: 'field grow' }, h('label', { for: 'gen-topic' }, 'Topic'), topic),
        h('div', { class: 'field' }, h('label', { for: 'gen-level' }, 'English level'), level),
        h('div', { class: 'field' }, h('label', { for: 'gen-len' }, 'Length'), len)),
      h('button', { class: 'btn primary', type: 'button', disabled: Gen.busy, onclick: generateText }, icon('spark'), 'Write a practice text')), out);
    return sec;
  }

  async function generateText() {
    const topic = (Gen.topic || '').trim() || 'everyday life';
    const words = { short: 40, medium: 80, long: 150 }[Gen.len] || 80;
    Gen.busy = true; Gen.error = ''; Gen.result = null; Gen.ctl = new AbortController();
    render();
    const prompt = [
      'Write a short text for typing practice.',
      'The reader is learning English (CEFR level ' + Gen.level + ') and also wants to learn to write clear requests to Claude, an AI assistant.',
      'Topic: ' + topic,
      'Length: about ' + words + ' words, as one paragraph.',
      'Use natural, useful English for this topic. Include one example request to Claude in double quotes.',
      'Use only plain keyboard characters: letters, numbers, spaces and . , ? ! \' " : -. No emoji, no lists, no line breaks.',
      'Reply with only JSON: {"title": "max 5 words", "text": "the paragraph", "tip": "one sentence that names the English or prompting lesson in the text"}'
    ].join('\n');
    try {
      const r = await P.sample.json(prompt, { modelTier: 'quick', cache: false, signal: Gen.ctl.signal });
      if (!r || typeof r.text !== 'string' || !r.text.trim()) throw { code: 'invalid_json' };
      Gen.result = { id: TT.uid('g'), title: String(r.title || topic).slice(0, 60), text: String(r.text).trim(), tip: r.tip ? String(r.tip) : '' };
    } catch (e) {
      Gen.error = sampleError(e);
    } finally {
      Gen.busy = false;
      if (App.view === 'practice') render();
    }
  }
  function saveGenerated(r) {
    const now = Date.now();
    const id = TT.uid('t');
    const t = { id, title: r.title, body: r.text, createdAt: now, updatedAt: now, src: 'claude' };
    App.texts[id] = t; saveTextsLocal();
    if (Sync.channels.texts) Sync.channels.texts.put(t);
    TT.toast('Saved to My texts.');
    render();
  }

  function sampleError(e) {
    const code = e && e.code;
    switch (code) {
      case 'not_granted': case 'sampling_disabled': case 'not_declared': case 'capability_disabled': case 'capability_removed':
        P.sampleOff = true; return 'Claude is turned off for this app. You can use the checklist instead.';
      case 'rate_limited': return 'Too many requests right now. Wait a minute, then try again.';
      case 'session_expired': return 'Your Claude session ended. Sign in again, then try again.';
      case 'refused': return 'Claude can’t help with this text. Try a different text.';
      case 'invalid_json': case 'empty_completion': return 'The answer came back in the wrong format. Please try again.';
      case 'prompt_too_large': return 'The text is too long. Try a shorter text.';
      case 'cancelled': return 'Stopped.';
      default: return 'Could not reach Claude. Check your connection and try again.';
    }
  }

  // ───────────────────────── Coach ─────────────────────────
  const Coach = { text: '', scenario: '', busy: false, result: null, error: '', ctl: null, self: false, checks: {} };
  const SCENARIOS = [
    ['Email to a landlord', 'Your heating is broken since Monday. Ask Claude to help you write a polite email to your landlord.'],
    ['Plan a weekend trip', 'You want to visit a city for two days. Ask Claude for a plan. Give your budget and interests.'],
    ['Explain a grammar rule', 'Ask Claude to explain one grammar rule that you find hard, with examples.'],
    ['A problem with my laptop', 'Your laptop is very slow. Describe the problem and ask Claude what to try.'],
    ['Learn a new skill', 'You want to learn a new skill in one month. Ask Claude for a simple plan.']
  ];
  const CHECKS = [
    ['verb', 'It starts with a clear verb (Write, Explain, Help...)'],
    ['context', 'It gives context: who it is for, why, what I know'],
    ['format', 'It says the format or length I want'],
    ['example', 'It has an example, if that helps'],
    ['english', 'I checked articles (a, an, the), capitals and punctuation']
  ];

  function renderCoach(view) {
    const wrap = h('div', { class: 'wrap coach' });
    const ci = COURSE.findIndex(l => l.coach);
    wrap.append(h('a', { class: 'back', href: '#lesson-' + (ci + 1) }, icon('back'), 'Lesson ' + (ci + 1)));
    wrap.append(h('header', { class: 'page-head' },
      h('h1', { class: 'display' }, 'Writing coach'),
      h('p', { class: 'lede' }, 'Write a request to Claude in your own words. Get corrections for your English and tips for a clearer request. Then type the better version.')));

    const ideas = h('div', { class: 'ideas', role: 'group', 'aria-label': 'Ideas' },
      h('span', { class: 'small muted' }, 'Need an idea?'),
      SCENARIOS.map(([label, sc]) => h('button', { type: 'button', class: 'chip' + (Coach.scenario === sc ? ' on' : ''), 'aria-pressed': Coach.scenario === sc ? 'true' : 'false', onclick: () => { Coach.scenario = Coach.scenario === sc ? '' : sc; render(); } }, label)));
    const ta = h('textarea', { id: 'coach-text', class: 'input area big-area', rows: '6', maxlength: '4000', placeholder: 'For example: help me write email to my landlord, heating not working since monday' });
    ta.value = Coach.text;
    const count = h('span', { class: 'small muted' });
    const upd = () => { Coach.text = ta.value; count.textContent = (ta.value.match(/\S+/g) || []).length + ' words'; };
    ta.addEventListener('input', upd); upd();
    const aiOk = P.sample && !P.sampleOff;
    const actions = h('div', { class: 'cta-row' },
      aiOk ? h('button', { class: 'btn primary', type: 'button', disabled: Coach.busy, onclick: askCoach }, icon('spark'), 'Get feedback from Claude') : null,
      h('button', { class: 'btn ' + (aiOk ? 'ghost' : 'primary'), type: 'button', onclick: () => { Coach.self = true; Coach.result = null; render(); } }, 'Check it myself'),
      count);
    const form = h('section', { class: 'panel coach-form' },
      ideas,
      Coach.scenario ? h('p', { class: 'scenario' }, h('strong', null, 'Your situation: '), Coach.scenario) : null,
      h('label', { for: 'coach-text' }, 'Your request to Claude'), ta, actions,
      !aiOk ? h('p', { class: 'small muted' }, P.sampleOff ? 'Claude feedback is turned off for this app.' : 'Claude feedback works when you open this app on claude.ai. The checklist works everywhere.') : null);
    wrap.append(form);

    const out = h('section', { class: 'coach-out', 'aria-live': 'polite' });
    if (Coach.busy) {
      out.append(h('div', { class: 'panel' }, h('p', { class: 'thinking' }, 'Claude is reading your text…'),
        h('button', { class: 'btn ghost small', type: 'button', onclick: () => Coach.ctl && Coach.ctl.abort() }, 'Stop')));
    } else if (Coach.error) {
      out.append(h('p', { class: 'panel warn' }, Coach.error));
    } else if (Coach.result) {
      out.append(feedbackView(Coach.result));
    } else if (Coach.self) {
      out.append(selfCheckView());
    }
    wrap.append(out);

    if (App.journal.length) {
      wrap.append(h('section', { class: 'journal' }, sectionHead('Your feedback history', 'Read your old corrections again. Repeated mistakes are the best things to practice.'),
        h('ul', { class: 'text-list' }, App.journal.slice(0, 15).map(e => h('li', { class: 'text-row' },
          h('div', { class: 'tr-main' },
            h('strong', null, e.original.length > 70 ? e.original.slice(0, 68) + '…' : e.original),
            h('span', { class: 'muted small' }, new Date(e.t).toLocaleDateString() + ' · ' + ((e.mistakes || []).length === 1 ? '1 mistake' : (e.mistakes || []).length + ' mistakes') + (e.clarity ? ' · clarity ' + e.clarity + '/5' : ''))),
          h('div', { class: 'tr-actions' },
            h('button', { class: 'btn ghost small', type: 'button', onclick: () => { Coach.result = e; Coach.text = e.original; Coach.self = false; Coach.error = ''; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }, 'Open')))))));
    }
    view.append(wrap);
  }

  function feedbackView(r) {
    const diff = TT.diffWords(r.original, r.corrected);
    const marks = h('p', { class: 'marks' }, diff.map(d => d.op === 'eq' ? d.text : h(d.op === 'del' ? 'del' : 'ins', null, d.text)));
    const same = diff.every(d => d.op === 'eq');
    const clar = Math.max(0, Math.min(5, Math.round(r.clarity || 0)));
    const clarWords = ['', 'unclear', 'hard to follow', 'OK', 'clear', 'very clear'];
    return h('div', { class: 'feedback' },
      r.praise ? h('p', { class: 'praise' }, r.praise) : null,
      h('div', { class: 'panel fb-block' },
        h('h3', null, 'Your text, corrected'),
        same ? h('p', null, 'No mistakes found. Your English is correct!') : marks,
        same ? null : h('p', { class: 'small muted' }, h('del', null, 'crossed out'), ' = remove · ', h('ins', null, 'blue'), ' = add')),
      r.mistakes && r.mistakes.length ? h('div', { class: 'panel fb-block' },
        h('h3', null, r.mistakes.length === 1 ? 'One thing to learn' : r.mistakes.length + ' things to learn'),
        h('ul', { class: 'mistakes' }, r.mistakes.map(m => h('li', null,
          h('span', { class: 'mk-pair' }, h('del', null, m.wrong), ' → ', h('ins', null, m.right)),
          h('span', { class: 'mk-why' }, m.why))))) : null,
      clar ? h('div', { class: 'panel fb-block' },
        h('h3', null, 'How clear is your request?'),
        h('div', { class: 'clarity', role: 'img', 'aria-label': 'Clarity ' + clar + ' of 5' },
          [1, 2, 3, 4, 5].map(i => h('span', { class: 'cl' + (i <= clar ? ' on' : '') })),
          h('span', { class: 'cl-word' }, clar + '/5 · ' + clarWords[clar])),
        r.tips && r.tips.length ? h('ul', { class: 'tip-list' }, r.tips.map(t => h('li', null, t))) : null) : null,
      r.improved ? h('div', { class: 'panel fb-block improved' },
        h('h3', null, 'A clearer request'),
        h('blockquote', null, r.improved)) : null,
      h('div', { class: 'cta-row' },
        h('button', { class: 'btn primary', type: 'button', onclick: () => typeCoach(r.corrected || r.original, 'Your corrected text') }, icon('play'), 'Type the corrected text'),
        r.improved ? h('button', { class: 'btn primary', type: 'button', onclick: () => typeCoach(r.improved, 'A clearer request') }, icon('play'), 'Type the clearer request') : null,
        h('button', { class: 'btn ghost', type: 'button', onclick: () => saveCoachText(r) }, 'Save to My texts')));
  }

  function selfCheckView() {
    const box = h('div', { class: 'panel fb-block' }, h('h3', null, 'Check your request'));
    const ul = h('ul', { class: 'checks' });
    CHECKS.forEach(([id, label]) => {
      const cb = h('input', { type: 'checkbox', id: 'chk-' + id, checked: !!Coach.checks[id] });
      cb.addEventListener('change', () => { Coach.checks[id] = cb.checked; });
      ul.append(h('li', null, cb, h('label', { for: 'chk-' + id }, label)));
    });
    box.append(ul,
      h('p', { class: 'small muted' }, 'Fix your text above if you want. Then type it to practice.'),
      h('div', { class: 'cta-row' },
        h('button', { class: 'btn primary', type: 'button', onclick: () => {
          const t = (document.getElementById('coach-text') || {}).value || Coach.text;
          if (!t.trim()) { TT.toast('Write your request first.'); return; }
          typeCoach(t, 'Your request');
        } }, icon('play'), 'Type my request')));
    return box;
  }

  async function askCoach() {
    const text = (Coach.text || '').trim();
    if (!text) { TT.toast('Write your request first.'); const ta = document.getElementById('coach-text'); if (ta) ta.focus(); return; }
    if (text.length < 8) { TT.toast('Write a little more, then ask for feedback.'); return; }
    Coach.busy = true; Coach.error = ''; Coach.result = null; Coach.self = false;
    Coach.ctl = new AbortController();
    render();
    const prompt = [
      'You are a kind English writing coach. You also teach people to write clear requests (prompts) to Claude, an AI assistant.',
      'The learner is not a native speaker of English. They wrote the text below as a request to Claude.',
      Coach.scenario ? 'Their situation: ' + Coach.scenario : '',
      '',
      'Learner text:',
      '<<<',
      text,
      '>>>',
      '',
      'Reply with only a JSON object with these keys:',
      '{"corrected": string, "mistakes": [{"wrong": string, "right": string, "why": string}], "clarity": number, "tips": [string], "improved": string, "praise": string}',
      '',
      'Rules:',
      '- corrected: the same text with grammar, spelling, capital letters and punctuation fixed. Keep the learner\'s meaning, words and style when they are correct. Do not add new ideas.',
      '- mistakes: up to 8, the most useful first. "wrong" is the exact short part of the learner text, "right" is the fixed part, "why" is one simple sentence (max 15 words) with the rule.',
      '- clarity: a whole number from 1 to 5: how clear and useful this is as a request to Claude.',
      '- tips: up to 3 short tips (max 18 words each) to make the request clearer for Claude, for example: say the goal, give context, choose a format or a length, give an example.',
      '- improved: a clearer version of the request in natural, simple English, 2 to 5 sentences. Keep the learner\'s goal. Only use details the learner gave.',
      '- praise: one short, honest sentence about something good in the text.',
      '- Use simple English (CEFR B1). Use only plain keyboard characters: straight quotes, no emoji, no special dashes.'
    ].join('\n');
    try {
      const r = await P.sample.json(prompt, { signal: Coach.ctl.signal });
      if (!r || typeof r !== 'object' || typeof r.corrected !== 'string') throw { code: 'invalid_json' };
      const entry = {
        id: TT.uid('j'), t: Date.now(), original: text,
        corrected: String(r.corrected || text).trim(),
        mistakes: (Array.isArray(r.mistakes) ? r.mistakes : []).slice(0, 8).filter(m => m && m.wrong && m.right).map(m => ({ wrong: String(m.wrong), right: String(m.right), why: String(m.why || '') })),
        clarity: Math.max(1, Math.min(5, Math.round(Number(r.clarity) || 3))),
        tips: (Array.isArray(r.tips) ? r.tips : []).slice(0, 3).map(String),
        improved: r.improved ? String(r.improved).trim() : '',
        praise: r.praise ? String(r.praise) : ''
      };
      Coach.result = entry;
      App.journal.unshift(entry);
      App.journal = App.journal.slice(0, 40);
      saveJournal();
    } catch (e) {
      Coach.error = (e && e.code === 'cancelled') ? '' : sampleError(e);
    } finally {
      Coach.busy = false;
      if (App.view === 'coach') render();
    }
  }

  function typeCoach(text, title) {
    const lesson = COURSE.find(l => l.coach);
    Typing.start({
      kind: 'coach', title, sub: 'Writing coach', text, lang: 'en', target: targetFor(lesson ? lesson.wpm : 22),
      back: { label: 'Writing coach', href: '#coach' },
      complete(st, stars) {
        recordSession('coach', 'coach', title, st);
        let lessonDone = null;
        if (lesson && stars >= 1) {
          const before = lessonInfo(lesson).complete;
          const L = App.state.lessons[lesson.id] = App.state.lessons[lesson.id] || { ex: {} };
          const prev = L.ex[0] || { s: 0, w: 0, a: 0 };
          L.ex[0] = { s: Math.max(prev.s, stars), w: Math.max(prev.w, round1(st.wpm)), a: Math.max(prev.a, round1(st.acc)) };
          saveState();
          if (!before) lessonDone = lesson;
        }
        return {
          lessonDone,
          primary: { label: 'Back to the coach', act: () => { location.hash = '#coach'; render(); } },
          secondary: { label: 'Try again', act: () => typeCoach(text, title) }
        };
      }
    });
  }

  function saveCoachText(r) {
    const now = Date.now();
    const id = TT.uid('t');
    const body = r.improved || r.corrected || r.original;
    const t = { id, title: (r.original || '').split(/\s+/).slice(0, 5).join(' ') || 'Coach text', body, createdAt: now, updatedAt: now, src: 'coach' };
    App.texts[id] = t; saveTextsLocal();
    if (Sync.channels.texts) Sync.channels.texts.put(t);
    TT.toast('Saved to My texts.');
  }

  // ───────────────────────── Progress ─────────────────────────
  function renderProgress(view) {
    const S = App.state;
    const hist = S.history;
    const wrap = h('div', { class: 'wrap progress' });
    wrap.append(h('header', { class: 'page-head' }, h('h1', { class: 'display' }, 'Progress')));
    if (!hist.length) {
      wrap.append(h('div', { class: 'panel empty' },
        h('p', null, 'No practice yet. Your speed, accuracy and weak keys appear here after your first exercise.'),
        h('button', { class: 'btn primary', type: 'button', onclick: () => startLesson(Math.max(0, nextLessonIndex())) }, icon('play'), 'Start lesson ' + (Math.max(0, nextLessonIndex()) + 1))));
      view.append(wrap);
      return;
    }
    const lastN = hist.slice(-10);
    const avg = (arr, f) => arr.reduce((a, x) => a + f(x), 0) / arr.length;
    const done = COURSE.filter(l => lessonInfo(l).complete).length;
    const totalSec = Object.values(dailyTotals()).reduce((a, b) => a + b, 0);
    const best = Math.max.apply(null, hist.map(x => x.w || 0));
    const streak = TT.streak(dailyTotals(), Date.now());
    const tile = (num, label, sub) => h('div', { class: 'tile' }, h('strong', null, num), h('span', null, label), sub ? h('span', { class: 'small muted' }, sub) : null);
    wrap.append(h('div', { class: 'tiles' },
      tile(done + ' / ' + COURSE.length, 'lessons finished'),
      tile(fmtWpm(avg(lastN, x => x.w)), 'words per minute', 'average, last ' + lastN.length),
      tile(fmtAcc(avg(lastN, x => x.a)), 'accuracy', 'average, last ' + lastN.length),
      tile(fmtWpm(best), 'best speed', 'words per minute'),
      tile(TT.fmtTime(totalSec), 'practice time'),
      tile(String(streak), streak === 1 ? 'day in a row' : 'days in a row')));

    const recent = hist.slice(-30);
    const dateLbl = (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const tipFor = (x) => h('span', null, h('strong', null, fmtWpm(x.w) + ' WPM · ' + fmtAcc(x.a)), h('br'), x.title || '', h('br'), new Date(x.t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    wrap.append(h('div', { class: 'charts' },
      h('section', { class: 'panel' }, h('h3', null, 'Speed (words per minute)'), h('p', { class: 'small muted' }, 'Last ' + recent.length + ' exercises'),
        TT.lineChart({ values: recent.map(x => x.w || 0), label: 'Speed per exercise', xLabels: recent.map(x => dateLbl(x.t)), tip: (i) => tipFor(recent[i]) })),
      h('section', { class: 'panel' }, h('h3', null, 'Accuracy (%)'), h('p', { class: 'small muted' }, 'Last ' + recent.length + ' exercises'),
        TT.lineChart({ values: recent.map(x => x.a || 0), min: Math.min(80, Math.floor(Math.min.apply(null, recent.map(x => x.a || 0)) / 5) * 5), minMax: 100, step: 5, label: 'Accuracy per exercise', xLabels: recent.map(x => dateLbl(x.t)), tip: (i) => tipFor(recent[i]) }))));

    // minutes per day, last 14 days
    const tot = dailyTotals();
    const days = [];
    for (let i = 13; i >= 0; i--) { const t = Date.now() - i * 86400000; days.push({ t, m: Math.round((tot[TT.dayKey(t)] || 0) / 6) / 10 }); }
    wrap.append(h('section', { class: 'panel' }, h('h3', null, 'Minutes per day'), h('p', { class: 'small muted' }, 'Last 14 days'),
      TT.barChart({ width: 1040, values: days.map(d => d.m), goal: S.settings.goal, label: 'Minutes practiced per day', xLabels: days.map((d, i) => i === days.length - 1 ? 'Today' : new Date(d.t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })), tip: (i) => h('span', null, h('strong', null, days[i].m + ' min'), h('br'), new Date(days[i].t).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })) })));

    // heatmap
    const totals = keyTotals();
    const byCode = {};
    Object.keys(totals).forEach(c => {
      const k = App.layout.charToKey[c];
      if (!k) return;
      const b = byCode[k.code] = byCode[k.code] || [0, 0];
      b[0] += totals[c][0]; b[1] += totals[c][1];
    });
    const kb = TT.Keyboard({ layout: App.layout });
    kb.setHeat(code => { const b = byCode[code]; if (!b || b[0] + b[1] < 3) return null; return Math.min(1, (b[1] / (b[0] + b[1])) / 0.15); },
      code => { const b = byCode[code]; return b ? Math.round(b[0] / (b[0] + b[1]) * 100) + '% correct (' + (b[0] + b[1]) + ' presses)' : ''; });
    const weak = weakKeys(6);
    wrap.append(h('section', { class: 'panel heat-panel' },
      h('h3', null, 'Mistakes by key'),
      h('p', { class: 'small muted' }, 'Darker red = more mistakes. Gray keys need more practice before they show.'),
      h('div', { class: 'kb-wrap' }, kb.el),
      h('div', { class: 'heat-legend small muted' }, 'fewer mistakes', h('span', { class: 'heat-ramp' }), 'more mistakes'),
      weak.length ? h('div', { class: 'weak' },
        h('table', { class: 'tbl' }, h('thead', null, h('tr', null, h('th', null, 'Key'), h('th', null, 'Correct'), h('th', null, 'Presses'))),
          h('tbody', null, weak.map(k => h('tr', null, h('td', null, TT.keycap(k.c === ' ' ? 'Space' : k.c)), h('td', null, Math.round(k.acc * 100) + '%'), h('td', null, String(k.n)))))),
        h('button', { class: 'btn primary', type: 'button', onclick: () => startDrill('weak') }, icon('play'), 'Practice these keys')) : null));

    // recent sessions
    wrap.append(h('section', { class: 'panel' }, h('h3', null, 'Recent exercises'),
      h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' },
        h('thead', null, h('tr', null, h('th', null, 'When'), h('th', null, 'What'), h('th', { class: 'num' }, 'WPM'), h('th', { class: 'num' }, 'Accuracy'), h('th', { class: 'num' }, 'Time'))),
        h('tbody', null, hist.slice(-12).reverse().map(x => h('tr', null,
          h('td', null, new Date(x.t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })),
          h('td', null, x.title || ''),
          h('td', { class: 'num' }, fmtWpm(x.w)), h('td', { class: 'num' }, fmtAcc(x.a)), h('td', { class: 'num' }, TT.fmtTime(x.d)))))))));
    view.append(wrap);
  }

  // ───────────────────────── Options ─────────────────────────
  function renderOptions(view) {
    const S = App.state.settings;
    const set = (k, v) => { S[k] = v; App.state.settingsAt = Date.now(); applySettings(); saveState(); };
    const wrap = h('div', { class: 'wrap options' });
    wrap.append(h('header', { class: 'page-head' }, h('h1', { class: 'display' }, 'Options')));

    const layoutSel = h('select', { id: 'opt-layout', class: 'input' }, TT.PRESET_ORDER.map(id => h('option', { value: id, selected: App.layout.id === id }, TT.PRESETS[id].name)));
    layoutSel.addEventListener('change', () => { setLayout(layoutSel.value); render(); TT.toast('Keyboard: ' + App.layout.name); });
    const detectBtn = h('button', { class: 'btn ghost small', type: 'button', onclick: async () => {
      const id = await detectLayoutFromSystem();
      if (id) { setLayout(id); render(); TT.toast('Found: ' + TT.PRESETS[id].name); }
      else TT.toast('Can’t detect it here. Choose your layout from the list.');
    } }, 'Detect my keyboard');
    const kbPrev = TT.Keyboard({ layout: App.layout });

    const radio = (name, value, label, cur, onPick) => {
      const id = 'opt-' + name + '-' + value;
      const r = h('input', { type: 'radio', name, id, value, checked: cur === value });
      r.addEventListener('change', () => r.checked && onPick(value));
      return h('label', { class: 'radio', for: id }, r, h('span', null, label));
    };
    const check = (key, label) => {
      const id = 'opt-' + key;
      const c = h('input', { type: 'checkbox', id, checked: !!S[key] });
      c.addEventListener('change', () => set(key, c.checked));
      return h('label', { class: 'radio', for: id }, c, h('span', null, label));
    };
    const group = (title, ...kids) => h('fieldset', { class: 'panel opt' }, h('legend', null, title), kids);

    wrap.append(
      group('Keyboard',
        h('div', { class: 'field' }, h('label', { for: 'opt-layout' }, 'Keyboard layout'), h('div', { class: 'row-inline' }, layoutSel, detectBtn)),
        h('p', { class: 'small muted' }, 'Choose the layout your computer uses. The on-screen keyboard and the finger hints follow it.'),
        h('div', { class: 'kb-wrap small-kb' }, kbPrev.el)),
      group('Typing',
        h('p', { class: 'opt-q' }, 'When I press a wrong key'),
        radio('onerr', 'stop', 'Stop until I press the right key (best for learning)', S.onError, v => set('onError', v)),
        radio('onerr', 'continue', 'Continue, and I fix mistakes with Backspace', S.onError, v => set('onError', v)),
        h('p', { class: 'opt-q' }, 'Show'),
        check('showKb', 'On-screen keyboard'),
        check('showHands', 'Hands with the finger to use'),
        h('p', { class: 'opt-q' }, 'Text view'),
        h('div', { class: 'row-inline' }, [['line', 'One moving line'], ['box', 'Whole text in a box']].map(([v, l]) => radio('view', v, l, S.textView || 'line', x => set('textView', x)))),
        h('p', { class: 'opt-q' }, 'Text size'),
        h('div', { class: 'row-inline' }, [['s', 'Small'], ['m', 'Medium'], ['l', 'Large']].map(([v, l]) => radio('size', v, l, S.size, x => set('size', x)))),
        h('p', { class: 'opt-q' }, 'Sounds'),
        h('div', { class: 'row-inline' }, [['off', 'Off'], ['errors', 'Mistakes only'], ['all', 'Every key']].map(([v, l]) => radio('sound', v, l, S.sound, x => set('sound', x))))),
      group('Goals',
        h('p', { class: 'opt-q' }, 'Daily practice goal'),
        h('div', { class: 'row-inline' }, [5, 10, 15, 20, 30].map(v => radio('goal', String(v), v + ' min', String(S.goal), x => set('goal', Number(x))))),
        h('p', { class: 'opt-q' }, 'Speed for 3 stars'),
        h('div', { class: 'row-inline' }, [['0.75', 'Relaxed'], ['1', 'Normal'], ['1.25', 'Fast']].map(([v, l]) => radio('speed', v, l, String(S.speed), x => set('speed', Number(x)))))),
      group('Sign-in and sync',
        h('p', null, syncSentence()),
        h('p', { class: 'small muted' }, 'You sign in with your Claude account. There is no extra password. Open this app on any device where you use Claude, and your lessons, texts and coach feedback are there.')),
      group('Your data',
        h('p', { class: 'small muted' }, 'Make a backup copy, or move your progress by hand.'),
        h('div', { class: 'cta-row' },
          h('button', { class: 'btn ghost', type: 'button', onclick: copyBackup }, icon('copy'), 'Copy a backup'),
          h('button', { class: 'btn ghost', type: 'button', onclick: restoreBackup }, 'Restore a backup'),
          h('button', { class: 'btn danger-ghost', type: 'button', onclick: resetAll }, icon('trash'), 'Reset progress'))));
    view.append(wrap);
  }
  function syncSentence() {
    const name = (P.me && P.me.name) || '';
    if (Sync.status === 'synced' || Sync.status === 'saving') return name ? 'You are signed in as ' + name + '. Your progress syncs between your devices.' : 'You are signed in to Claude. Your progress syncs between your devices.';
    if (Sync.status === 'connecting') return 'Connecting to your saved progress…';
    if (Sync.status === 'paused') return Sync.note || 'Sync is paused. Your progress is saved on this device.';
    return 'You are not signed in, so your progress is saved in this browser only. Open this app on claude.ai while you are signed in to Claude to sync it.';
  }
  async function copyBackup() {
    const data = JSON.stringify({ app: 'type-and-talk', v: 1, state: App.state, texts: App.texts, journal: App.journal });
    try { await navigator.clipboard.writeText(data); TT.toast('Backup copied. Paste it into a note or an email to keep it.'); }
    catch (e) {
      const ta = h('textarea', { class: 'input area', rows: '6', readonly: true });
      ta.value = data;
      await TT.dialog({ title: 'Copy your backup', body: h('div', null, h('p', { class: 'muted' }, 'Select all the text below and copy it.'), ta), ok: 'Done', cancel: 'Close' });
    }
  }
  async function restoreBackup() {
    const ta = h('textarea', { class: 'input area', rows: '6', placeholder: 'Paste your backup here' });
    const val = await TT.dialog({ title: 'Restore a backup', body: h('div', null, h('p', { class: 'muted' }, 'Paste a backup from “Copy a backup”. It is combined with your current progress.'), ta), ok: 'Restore', getValue: () => ta.value });
    if (!val) return;
    try {
      const d = JSON.parse(val);
      if (!d || d.app !== 'type-and-talk' || !d.state) throw new Error('bad');
      App.state = TT.mergeState(App.state, d.state, App.dev).state;
      Object.keys(d.texts || {}).forEach(id => { if (!App.texts[id]) { App.texts[id] = d.texts[id]; if (Sync.channels.texts) Sync.channels.texts.put(d.texts[id]); } });
      const ids = new Set(App.journal.map(e => e.id));
      (d.journal || []).forEach(e => { if (!ids.has(e.id)) App.journal.push(e); });
      App.journal.sort((a, b) => b.t - a.t);
      saveState(); saveTextsLocal(); saveJournal(); applySettings();
      TT.toast('Backup restored.');
      render();
    } catch (e) { TT.toast('This is not a Typing Coach backup. Copy it again and paste all of it.'); }
  }
  async function resetAll() {
    const ok = await TT.dialog({ title: 'Reset all progress?', body: 'Lessons, stars, history and key statistics are deleted on all your devices. Your texts and settings stay.', ok: 'Reset progress', danger: true });
    if (!ok) return;
    const keep = App.state.settings, keepAt = App.state.settingsAt;
    App.state = TT.defaultState();
    App.state.settings = keep; App.state.settingsAt = keepAt;
    App.state.resetAt = Date.now();
    saveState();
    TT.toast('Progress reset.');
    render();
  }

  // ───────────────────────── Boot ─────────────────────────
  function boot() {
    applySettings();
    renderShell();
    render();
    connectPlatform();
    if (!App.state.settings.layout) {
      detectLayoutFromSystem().then(id => {
        if (id && !App.state.settings.layout) {
          App.state.settings.layout = id;
          applyLayout();
          LS.set(K.state, App.state);
          if (App.view !== 'typing') render();
        }
      });
    }
  }
  TT.boot = boot;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(globalThis.TT = globalThis.TT || {});
