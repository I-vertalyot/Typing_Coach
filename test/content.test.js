// Checks: drills only use learned keys; every lesson character is typeable on every layout;
// core helpers behave.
const path = require('path');
['content.js', 'library.js', 'layouts.js', 'core.js'].forEach(f => require(path.join(__dirname, '..', 'src', f)));
const TT = globalThis.TT;
let fail = 0;
const bad = (msg) => { fail++; console.log('FAIL', msg); };

// 1. Drills use only learned characters
TT.COURSE.forEach((l, idx) => {
  if (l.part !== 1) return;
  const allowed = TT.allowedChars(TT.COURSE, idx);
  l.ex.forEach((e, i) => {
    const extra = [...new Set(e.t.split('').filter(c => !allowed.has(c)))];
    if (extra.length) bad(`${l.id} ex${i + 1} uses not-yet-learned: ${JSON.stringify(extra.join(''))}`);
  });
});

// 1b. Number-row lessons: built for every layout, typeable there, only learned characters
TT.PRESET_ORDER.forEach(id => {
  const lay = TT.buildLayout(id);
  TT.resolveCourse(TT.COURSE, lay);
  TT.COURSE.forEach((l, idx) => {
    if (!l.numRow) return;
    if (l.ex.length < 3) bad(`${id} ${l.id}: only ${l.ex.length} exercises`);
    if (l.show.length !== l.numRow[1] - l.numRow[0] + 1) bad(`${id} ${l.id}: shows ${l.show.join('')}`);
    const allowed = TT.allowedChars(TT.COURSE, idx);
    l.ex.forEach((e, i) => {
      const extra = [...new Set(e.t.split('').filter(c => !allowed.has(c)))];
      if (extra.length) bad(`${id} ${l.id} ex${i + 1} uses not-yet-learned: ${JSON.stringify(extra.join(''))}`);
      const miss = [...new Set(e.t.split('').filter(c => !lay.charToKey[c]))];
      if (miss.length) bad(`${id} ${l.id} ex${i + 1} cannot be typed: ${JSON.stringify(miss.join(''))}`);
    });
  });
});

// 2. Every character typeable on every layout
const all = new Set();
TT.COURSE.forEach(l => { if (!l.numRow) l.ex.forEach(e => e.t.split('').forEach(c => all.add(c))); });
TT.STARTERS.forEach(s => s.body.split('').forEach(c => all.add(c)));
TT.LIBRARY.forEach(l => TT.cleanText(l.text).split('').forEach(c => all.add(c)));
const libIds = TT.LIBRARY.map(l => l.id); if (new Set(libIds).size !== libIds.length || libIds.some(id => !/^[a-z0-9-]+$/.test(id))) bad('library ids must be unique and use a-z 0-9 -');
TT.PRESET_ORDER.forEach(id => {
  const lay = TT.buildLayout(id);
  const miss = [...all].filter(c => !lay.charToKey[c]);
  if (miss.length) bad(`layout ${id} cannot type: ${JSON.stringify(miss.join(''))}`);
  // each lesson's new chars mapped to a finger
  const k = TT.keyFor(lay, 'F');
  if (!k || !k.shift || k.shiftCode !== 'ShiftRight') bad(`layout ${id}: capital F should use right Shift`);
});

// 3. Smart quotes are cleaned
const us = TT.buildLayout('us');
const cleaned = TT.cleanText('It’s “great” — café… naïve', us);
if (cleaned !== 'It\'s "great" - cafe... naive') bad('cleanText: ' + cleaned);
const cz = TT.buildLayout('cz');
if (TT.cleanText('Dobrý den, příteli', cz) !== 'Dobrý den, příteli') bad('cleanText cz keeps Czech letters');
if (TT.cleanText('Dobrý den', us) !== 'Dobry den') bad('cleanText us strips accents');

// 4. chunking
const long = Array.from({ length: 30 }, (_, i) => `This is sentence number ${i + 1}, and it has some words.`).join(' ');
const parts = TT.chunkText(long, 260);
if (parts.join(' ') !== long) bad('chunkText must keep all text');
if (parts.some(p => p.length > 420)) bad('chunk too long');
console.log('chunks:', parts.length, parts.map(p => p.length).join(','));

// 5. merge
const A = TT.defaultState(), B = TT.defaultState();
A.history = [{ id: 'a1', t: 1 }, { id: 'x', t: 3 }]; B.history = [{ id: 'b1', t: 2 }, { id: 'x', t: 3 }];
A.lessons = { 'home-row': { ex: { 0: { s: 2, w: 10, a: 96 } } } };
B.lessons = { 'home-row': { ex: { 0: { s: 3, w: 9, a: 98 }, 1: { s: 1, w: 8, a: 91 } } } };
A.keysByDev = { devA: { a: [10, 1] } }; B.keysByDev = { devB: { a: [5, 2] }, devA: { a: [3, 0] } };
const m = TT.mergeState(A, B, 'devA');
if (m.state.history.map(h => h.id).join() !== 'a1,b1,x') bad('merge history ' + m.state.history.map(h => h.id));
const ex0 = m.state.lessons['home-row'].ex[0];
if (ex0.s !== 3 || ex0.w !== 10 || ex0.a !== 98) bad('merge lessons ' + JSON.stringify(ex0));
if (!m.state.lessons['home-row'].ex[1]) bad('merge lesson ex1 missing');
if (m.state.keysByDev.devA.a[0] !== 10 || m.state.keysByDev.devB.a[0] !== 5) bad('merge keys by dev');
if (!m.changedVsRemote || !m.changedVsLocal) bad('merge change flags');
const again = TT.mergeState(m.state, m.state, 'devA');
if (again.changedVsRemote || again.changedVsLocal) bad('merge of identical states should be a no-op');
const sum = TT.sumByDevice(m.state.keysByDev);
if (sum.a[0] !== 15 || sum.a[1] !== 3) bad('sumByDevice ' + JSON.stringify(sum));

// 5b. key statistics reset wins over older stats on other devices, keeps progress
const X = TT.defaultState(), Y = TT.defaultState();
X.keysByDev = {}; X.keysResetAt = 1000; X.history = [{ id: 'h1', t: 5 }];
Y.keysByDev = { devB: { k97: [9, 3] } }; Y.keysResetAt = 0; Y.history = [{ id: 'h2', t: 6 }];
const mk = TT.mergeState(X, Y, 'devA');
if (Object.keys(mk.state.keysByDev).length !== 0) bad('key reset should clear older key stats: ' + JSON.stringify(mk.state.keysByDev));
if (mk.state.keysResetAt !== 1000 || !mk.changedVsRemote) bad('key reset should be pushed');
if (mk.state.history.length !== 2) bad('key reset must keep history');
const mk2 = TT.mergeState(Y, X, 'devB');
if (Object.keys(mk2.state.keysByDev).length !== 0 || !mk2.changedVsLocal) bad('device B should accept the key reset');

// 5c. word days and learned words merge as unions
const P1 = TT.defaultState(), P2 = TT.defaultState();
P1.wordDays = { w_teacher: ['2026-11-16', '2026-11-17'] }; P1.learnedWords = { w_missed: 5 };
P2.wordDays = { w_teacher: ['2026-11-18'] }; P2.learnedWords = { w_class: 7 };
const mw = TT.mergeState(P1, P2, 'devA');
if (mw.state.wordDays.w_teacher.join() !== '2026-11-16,2026-11-17,2026-11-18') bad('word days union: ' + mw.state.wordDays.w_teacher);
if (!mw.state.learnedWords.w_missed || !mw.state.learnedWords.w_class) bad('learned words union');
if (!mw.changedVsRemote || !mw.changedVsLocal) bad('word merge flags');
if (TT.mergeState(mw.state, mw.state, 'devA').changedVsRemote) bad('word merge of identical states must be a no-op');

// 6. diff
const d = TT.diffWords('I am agree with you', 'I agree with you.');
console.log('diff:', JSON.stringify(d));
if (!d.some(x => x.op === 'del' && x.text.includes('am'))) bad('diff should delete "am"');

// 7. drills
const allowed = TT.allowedChars(TT.COURSE, 2);
const drill = TT.makeDrill(TT.WORDS.concat(['ask', 'sure', 'rule']), allowed, ['r'], 12);
if (!drill || drill.split('').some(c => !allowed.has(c))) bad('drill uses bad chars: ' + drill);
console.log('drill:', drill);

// 8. streak
const now = new Date(2026, 10, 19, 12).getTime();
const daily = {}; [0, 1, 2].forEach(i => { daily[TT.dayKey(now - i * 86400000)] = 120; });
if (TT.streak(daily, now) !== 3) bad('streak ' + TT.streak(daily, now));

// lesson ids unique
const ids = TT.COURSE.map(l => l.id);
if (new Set(ids).size !== ids.length) bad('duplicate lesson ids');
console.log('lessons:', TT.COURSE.length, 'exercises:', TT.COURSE.reduce((a, l) => a + l.ex.length, 0));
console.log(fail ? `\n${fail} FAILED` : '\nALL OK');
process.exit(fail ? 1 : 0);
