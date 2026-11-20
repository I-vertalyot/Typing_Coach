/* Pure logic: text prep, scoring, drills, merging synced progress, word diff. No DOM here. */
(function (TT) {
  'use strict';

  TT.uid = function (prefix) {
    const r = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
    return (prefix || '') + r;
  };

  TT.dayKey = function (ts) {
    const d = new Date(ts);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  };

  // Make any pasted text typeable on the chosen layout.
  TT.cleanText = function (text, layout) {
    if (!text) return '';
    let s = String(text)
      .replace(/[‘’‚‛′´]/g, '\'')
      .replace(/[“”„‟″«»]/g, '"')
      .replace(/[‐-―−]/g, '-')
      .replace(/…/g, '...')
      .replace(/[  -​  　]/g, ' ')
      .replace(/\r\n?/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
    if (!layout) return s;
    let out = '';
    for (const ch of s) {
      if (layout.charToKey[ch]) { out += ch; continue; }
      const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
      let ok = '';
      for (const b of base) if (layout.charToKey[b]) ok += b;
      out += ok;
    }
    return out.replace(/ {2,}/g, ' ').trim();
  };

  // Split long text into parts of about `target` characters, at sentence ends when possible.
  TT.chunkText = function (text, target) {
    target = target || 260;
    const t = String(text || '').trim();
    if (!t) return [];
    if (t.length <= target * 1.4) return [t];
    const sentences = t.match(/[^.!?]+(?:[.!?]+["')\]]*)+\s*|[^.!?]+$/g) || [t];
    const parts = [];
    let cur = '';
    const pushWords = (s) => {
      // a very long sentence: split by words
      const words = s.trim().split(' ');
      let piece = '';
      words.forEach(w => {
        if ((piece + ' ' + w).trim().length > target && piece) { parts.push(piece.trim()); piece = w; }
        else piece = (piece + ' ' + w).trim();
      });
      return piece;
    };
    sentences.forEach(sRaw => {
      const s = sRaw.trim();
      if (!s) return;
      if (s.length > target * 1.5) {
        if (cur) { parts.push(cur.trim()); cur = ''; }
        cur = pushWords(s);
        return;
      }
      if ((cur + ' ' + s).trim().length > target && cur.length >= target * 0.5) {
        parts.push(cur.trim());
        cur = s;
      } else {
        cur = (cur + ' ' + s).trim();
      }
    });
    if (cur.trim()) {
      if (cur.trim().length < target * 0.35 && parts.length) parts[parts.length - 1] += ' ' + cur.trim();
      else parts.push(cur.trim());
    }
    return parts;
  };

  TT.wpm = function (chars, ms) {
    if (!ms || ms < 1) return 0;
    return Math.max(0, (chars / 5) / (ms / 60000));
  };

  TT.stars = function (acc, wpm, target) {
    if (acc < 90) return 0;
    if (acc < 95) return 1;
    if (acc >= 97 && wpm >= target) return 3;
    return 2;
  };

  // Characters a learner knows after finishing part-1 lessons up to index `upTo` (inclusive).
  TT.allowedChars = function (course, upTo) {
    const set = new Set([' ']);
    for (let i = 0; i <= upTo && i < course.length; i++) {
      const l = course[i];
      if (l.part !== 1) { // part 2: everything
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?!\'":-'.split('').forEach(c => set.add(c));
        continue;
      }
      (l.newChars || '').split('').forEach(c => set.add(c));
    }
    return set;
  };

  // Random drill from a word list, using only allowed characters, favouring focus characters.
  TT.makeDrill = function (words, allowed, focus, count, rand) {
    rand = rand || Math.random;
    count = count || 18;
    const ok = Array.from(new Set(words)).filter(w => w && w.split('').every(c => allowed.has(c)));
    if (!ok.length) return '';
    const focusSet = new Set((focus || []).filter(c => allowed.has(c)));
    const weighted = [];
    ok.forEach(w => {
      let wt = 1;
      if (focusSet.size) {
        let hits = 0;
        for (const c of w) if (focusSet.has(c)) hits++;
        wt = hits ? 1 + hits * 3 : 0.35;
      }
      weighted.push([w, wt]);
    });
    const total = weighted.reduce((a, b) => a + b[1], 0);
    const out = [];
    let prev = '';
    for (let i = 0; i < count; i++) {
      let r = rand() * total, pick = weighted[0][0];
      for (const [w, wt] of weighted) { r -= wt; if (r <= 0) { pick = w; break; } }
      if (pick === prev && ok.length > 1) { i--; continue; }
      out.push(pick); prev = pick;
    }
    return out.join(' ');
  };

  // Sum per-device counters: { dev: { key: value } } → { key: total }
  TT.sumByDevice = function (byDev) {
    const out = {};
    Object.keys(byDev || {}).forEach(dev => {
      const m = byDev[dev] || {};
      Object.keys(m).forEach(k => {
        const v = m[k];
        if (Array.isArray(v)) {
          out[k] = out[k] || v.map(() => 0);
          v.forEach((n, i) => { out[k][i] = (out[k][i] || 0) + (n || 0); });
        } else {
          out[k] = (out[k] || 0) + (v || 0);
        }
      });
    });
    return out;
  };

  TT.defaultState = function () {
    return {
      v: 1,
      settings: { layout: '', onError: 'stop', showKb: true, showHands: true, sound: 'errors', size: 'm', goal: 10, speed: 1, pickKeys: '', pickMode: 'only', textView: 'line' },
      settingsAt: 0,
      lessons: {},       // lessonId → { ex: { i: {s, w, a} } }
      history: [],       // { id, t, k, r, title, w, a, c, d }
      keysByDev: {},     // dev → { char: [hits, misses] }
      dailyByDev: {},    // dev → { 'YYYY-MM-DD': seconds }
      textProg: {},      // textId → { next, best, laps }
      dismissed: {},
      resetAt: 0         // progress before this time was reset on some device
    };
  };

  const HISTORY_CAP = 400;

  // Merge two progress documents. Returns { state, changedVsRemote, changedVsLocal }.
  TT.mergeState = function (local, remote, myDev) {
    let L = Object.assign(TT.defaultState(), local || {});
    let R = Object.assign(TT.defaultState(), remote || {});
    const S = TT.defaultState();
    let vsRemote = false; // merged has something remote lacks → push
    let vsLocal = false;  // merged has something local lacks → re-render

    // A reset on any device wins over older progress everywhere.
    const rs = Math.max(L.resetAt || 0, R.resetAt || 0);
    const wipe = (X) => Object.assign({}, X, { lessons: {}, history: (X.history || []).filter(x => x && x.t >= rs), keysByDev: {}, dailyByDev: {}, textProg: {}, resetAt: rs });
    if ((L.resetAt || 0) < rs) { L = wipe(L); vsLocal = true; }
    if ((R.resetAt || 0) < rs) { R = wipe(R); vsRemote = true; }
    S.resetAt = rs;

    // settings: newest wins
    if ((L.settingsAt || 0) >= (R.settingsAt || 0)) {
      S.settings = Object.assign({}, TT.defaultState().settings, L.settings); S.settingsAt = L.settingsAt || 0;
      if ((L.settingsAt || 0) > (R.settingsAt || 0)) vsRemote = true;
    } else {
      S.settings = Object.assign({}, TT.defaultState().settings, R.settings); S.settingsAt = R.settingsAt; vsLocal = true;
    }

    // lessons: best of each exercise
    const ids = new Set(Object.keys(L.lessons || {}).concat(Object.keys(R.lessons || {})));
    ids.forEach(id => {
      const le = (L.lessons[id] && L.lessons[id].ex) || {};
      const re = (R.lessons[id] && R.lessons[id].ex) || {};
      const ex = {};
      new Set(Object.keys(le).concat(Object.keys(re))).forEach(i => {
        const a = le[i], b = re[i];
        if (a && !b) { ex[i] = a; vsRemote = true; return; }
        if (b && !a) { ex[i] = b; vsLocal = true; return; }
        const m = { s: Math.max(a.s || 0, b.s || 0), w: Math.max(a.w || 0, b.w || 0), a: Math.max(a.a || 0, b.a || 0) };
        if (m.s !== (b.s || 0) || m.w !== (b.w || 0) || m.a !== (b.a || 0)) vsRemote = true;
        if (m.s !== (a.s || 0) || m.w !== (a.w || 0) || m.a !== (a.a || 0)) vsLocal = true;
        ex[i] = m;
      });
      S.lessons[id] = { ex };
    });

    // history: union by id
    const seen = new Map();
    (R.history || []).forEach(h => { if (h && h.id) seen.set(h.id, h); });
    const remoteIds = new Set(seen.keys());
    (L.history || []).forEach(h => {
      if (!h || !h.id) return;
      if (!remoteIds.has(h.id)) vsRemote = true;
      seen.set(h.id, h);
    });
    const localIds = new Set((L.history || []).map(h => h && h.id));
    remoteIds.forEach(id => { if (!localIds.has(id)) vsLocal = true; });
    S.history = Array.from(seen.values()).sort((a, b) => a.t - b.t).slice(-HISTORY_CAP);

    // per-device counters: my device from local, other devices from remote (local copy if remote lacks it)
    ['keysByDev', 'dailyByDev'].forEach(field => {
      const out = {};
      const devs = new Set(Object.keys(L[field] || {}).concat(Object.keys(R[field] || {})));
      devs.forEach(dev => {
        const lv = (L[field] || {})[dev], rv = (R[field] || {})[dev];
        let pick;
        if (dev === myDev) pick = lv || rv;
        else pick = rv || lv;
        out[dev] = pick;
        if (JSON.stringify(pick) !== JSON.stringify(rv)) vsRemote = true;
        if (JSON.stringify(pick) !== JSON.stringify(lv)) vsLocal = true;
      });
      S[field] = out;
    });

    // text progress: furthest point, best speed
    const tids = new Set(Object.keys(L.textProg || {}).concat(Object.keys(R.textProg || {})));
    tids.forEach(id => {
      const a = (L.textProg || {})[id], b = (R.textProg || {})[id];
      if (a && !b) { S.textProg[id] = a; vsRemote = true; return; }
      if (b && !a) { S.textProg[id] = b; vsLocal = true; return; }
      const m = { next: Math.max(a.next || 0, b.next || 0), best: Math.max(a.best || 0, b.best || 0), done: Math.max(a.done || 0, b.done || 0) };
      if (JSON.stringify(m) !== JSON.stringify({ next: b.next || 0, best: b.best || 0, done: b.done || 0 })) vsRemote = true;
      if (JSON.stringify(m) !== JSON.stringify({ next: a.next || 0, best: a.best || 0, done: a.done || 0 })) vsLocal = true;
      S.textProg[id] = m;
    });

    S.dismissed = Object.assign({}, R.dismissed, L.dismissed);
    return { state: S, changedVsRemote: vsRemote, changedVsLocal: vsLocal };
  };

  // Current streak of days with practice (today or yesterday must count).
  TT.streak = function (dailyTotals, now) {
    const has = (ts) => (dailyTotals[TT.dayKey(ts)] || 0) >= 30;
    let day = now;
    if (!has(day)) day -= 86400000;
    let n = 0;
    while (has(day) && n < 3650) { n++; day -= 86400000; }
    return n;
  };

  // Word-level diff (LCS); punctuation is its own token.
  // Returns [{op:'eq'|'del'|'ins', text}] where text keeps its leading space.
  TT.tokens = function (s) {
    const out = [];
    const re = /(\s*)([\p{L}\p{N}'’-]+|[^\s\p{L}\p{N}])/gu;
    let m;
    while ((m = re.exec(String(s || '')))) out.push({ w: m[2], sp: m[1].length > 0 });
    return out;
  };
  TT.diffWords = function (a, b) {
    const A = TT.tokens(a), B = TT.tokens(b);
    const piece = (t, first) => (t.sp && !first ? ' ' : '') + t.w;
    if (A.length * B.length > 250000) {
      return [{ op: 'del', text: String(a) }, { op: 'ins', text: ' ' + String(b) }];
    }
    const n = A.length, m = B.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = A[i].w === B[j].w ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const out = [];
    const push = (op, t) => {
      const last = out[out.length - 1];
      const txt = piece(t, out.length === 0);
      if (last && last.op === op) last.text += txt; else out.push({ op, text: txt });
    };
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (A[i].w === B[j].w) { push('eq', B[j]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { push('del', A[i]); i++; }
      else { push('ins', B[j]); j++; }
    }
    while (i < n) push('del', A[i++]);
    while (j < m) push('ins', B[j++]);
    return out;
  };

  TT.fmtTime = function (sec) {
    sec = Math.round(sec || 0);
    if (sec < 60) return sec + ' s';
    const m = Math.floor(sec / 60);
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60);
    return h + ' h ' + (m % 60) + ' min';
  };
})(globalThis.TT = globalThis.TT || {});
