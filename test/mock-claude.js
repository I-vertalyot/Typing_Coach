// Injected into test pages: a fake `window.claude` with user, db (backed by the Node test store), sample and tts.
(() => {
  const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };
  const snap = (path, v) => {
    const data = v ? deepFreeze(JSON.parse(v)) : undefined;
    return { id: path.split('/').pop(), exists: !!v, data: () => data, metadata: { fromCache: false, hasPendingWrites: false } };
  };
  const checkDoc = (p) => { if (p.split('/').length % 2) throw new TypeError('doc path needs even segments: ' + p); };
  const checkCol = (p) => { if (!(p.split('/').length % 2)) throw new TypeError('collection path needs odd segments: ' + p); };
  function docRef(path) {
    checkDoc(path);
    return {
      id: path.split('/').pop(), path,
      async get() { return snap(path, await window.__dbGet(path)); },
      async set(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw { code: 'invalid_argument', message: 'body must be object' };
        const json = JSON.stringify(data);
        if (json.length > 256 * 1024) throw { code: 'invalid_argument', message: 'too big' };
        window.__writes = (window.__writes || 0) + 1;
        await window.__dbSet(path, json);
      },
      async update(data) { const cur = await window.__dbGet(path); if (!cur) throw { code: 'invalid_argument' }; await window.__dbSet(path, JSON.stringify(Object.assign(JSON.parse(cur), data))); },
      async delete() { await window.__dbDel(path); },
      onSnapshot(next, err) {
        let last;
        const tick = async () => { try { const v = await window.__dbGet(path); if (v !== last) { last = v; next(snap(path, v)); } } catch (e) { err && err({ code: 'unavailable' }); } };
        setTimeout(tick, 30);
        const iv = setInterval(tick, 200);
        return () => clearInterval(iv);
      },
      collection(sub) { return colRef(path + '/' + sub); }
    };
  }
  function colRef(path) {
    checkCol(path);
    return {
      path,
      doc(id) { return docRef(path + '/' + (id || Math.random().toString(36).slice(2))); },
      onSnapshot(next, err) {
        let last;
        const tick = async () => {
          const v = await window.__dbList(path);
          if (v !== last) {
            last = v;
            const arr = JSON.parse(v);
            next({ docs: arr.map(([p, d]) => snap(p, JSON.stringify(d))), size: arr.length, empty: !arr.length, metadata: { fromCache: false, hasPendingWrites: false }, docChanges: () => [] });
          }
        };
        setTimeout(tick, 30);
        const iv = setInterval(tick, 200);
        return () => clearInterval(iv);
      }
    };
  }
  const db = { doc: docRef, collection: colRef };
  const user = {
    id: async () => 'u_test1',
    me: async () => ({ id: 'u_test1', name: 'Petr Novák', avatarUrl: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 10 10%22%3E%3Crect width=%2210%22 height=%2210%22 fill=%22%236250d6%22/%3E%3C/svg%3E', color: '#6250d6', email: null, isOwner: true, canEdit: true }),
    isOwner: async () => true, canEdit: async () => true, can: async () => true, profiles: async () => ({})
  };
  const sample = async () => ({ text: 'ok', truncated: false });
  sample.json = async (prompt, opts) => {
    window.__lastPrompt = prompt;
    await new Promise(r => setTimeout(r, 400));
    if (opts && opts.signal && opts.signal.aborted) throw { code: 'cancelled' };
    if (/typing practice/.test(prompt)) {
      return { title: 'Booking a hotel', text: 'I want to book a room for two nights. I wrote to Claude: "Write a short email to a hotel and ask for a quiet room." The answer was clear and polite.', tip: 'Say who the email is for and what you want.' };
    }
    return {
      corrected: 'Help me write an email to my landlord. The heating has not been working since Monday.',
      mistakes: [
        { wrong: 'write email', right: 'write an email', why: 'Use "an" before a singular noun that starts with a vowel sound.' },
        { wrong: 'heating not working', right: 'The heating has not been working', why: 'A sentence needs a verb: has not been working.' },
        { wrong: 'monday', right: 'Monday', why: 'Days of the week start with a capital letter.' }
      ],
      clarity: 3,
      tips: ['Say the tone you want, for example polite but firm.', 'Say what you want the landlord to do.'],
      improved: 'Please write a short, polite email to my landlord. The heating in my flat has not worked since Monday. Ask him to send someone to fix it this week.',
      praise: 'You started with a clear verb: help.'
    };
  };
  sample.limits = async () => ({ maxPromptBytes: 262144 });
  const caps = { user, db, sample, tts: null };
  window.claude = { use: (name) => new Promise(r => setTimeout(() => r(caps[name] || null), 80)) };
})();
