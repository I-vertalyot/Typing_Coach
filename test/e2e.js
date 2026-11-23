// End-to-end checks in headless Chrome. Usage: node test/e2e.js [--shots]
// Uses Playwright's Chromium, or your own Chrome with CHROME_PATH=/path/to/chrome.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const FILE = 'file://' + path.join(__dirname, '..', 'dist', 'index.html');
const SHOTS = process.argv.includes('--shots');
const shotDir = path.join(__dirname, 'shots');
if (SHOTS) fs.mkdirSync(shotDir, { recursive: true });
const MOCK = fs.readFileSync(path.join(__dirname, 'mock-claude.js'), 'utf8');

let fails = 0;
const ok = (cond, msg) => { if (cond) console.log('  ok  ', msg); else { fails++; console.log('  FAIL', msg); } };
const store = new Map(); // shared "server" for the mock db

async function newDevice(browser, { mock = true, dark = false, width = 1280, height = 900 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: dark ? 'dark' : 'light', locale: 'en-US' });
  if (mock) {
    await ctx.exposeBinding('__dbGet', (_, p) => store.get(p) || null);
    await ctx.exposeBinding('__dbSet', (_, p, v) => { store.set(p, v); });
    await ctx.exposeBinding('__dbDel', (_, p) => { store.delete(p); });
    await ctx.exposeBinding('__dbList', (_, col) => {
      const out = [];
      for (const [k, v] of store) {
        if (k.startsWith(col + '/') && k.slice(col.length + 1).indexOf('/') === -1) out.push([k, JSON.parse(v)]);
      }
      return JSON.stringify(out);
    });
    await ctx.addInitScript(MOCK);
  }
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::/.test(m.text())) page.errors.push(m.text()); });
  await page.goto(FILE);
  await page.waitForSelector('.lessons');
  return { ctx, page };
}

async function typeExercise(page, { mistakes = 0 } = {}) {
  const text = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
  for (let i = 0; i < text.length; i++) {
    if (i < mistakes) await page.keyboard.type(text[i] === 'q' ? 'w' : 'q');
    await page.keyboard.type(text[i], { delay: 4 });
  }
  await page.waitForSelector('.result:not([hidden])');
  return text;
}
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: path.join(shotDir, name + '.png'), fullPage: false }); };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true });


  // A text with the word "teacher", used by the weak-word tests.
  const TEACHER = 'Write a short email to my teacher. Explain why I missed the class.';
  const openTeacherText = async (page) => {
    await page.evaluate((body) => {
      const t = JSON.parse(localStorage.getItem('tt.texts.v1') || '{}');
      t.t_teacher = { id: 't_teacher', title: 'Teacher email', body, createdAt: 1, updatedAt: 1, src: 'user' };
      localStorage.setItem('tt.texts.v1', JSON.stringify(t));
    }, TEACHER);
    await page.goto(FILE + '#learn'); await page.reload(); await page.waitForSelector('.lessons');
    await page.evaluate(() => { location.hash = '#practice'; }); await page.waitForSelector('.my-texts');
    await page.click('.my-texts .text-row:has-text("Teacher email") .btn.primary'); await page.waitForSelector('.tt-inner');
  };

  console.log('\n1. Local only (no Claude platform)');
  {
    const { ctx, page } = await newDevice(browser, { mock: false });
    ok((await page.textContent('#sync-btn')).includes('Saved on this device'), 'sync chip says saved on this device');
    ok(await page.$$eval('.lesson-row', r => r.length) === 16, '16 lessons listed');
    ok(!/claude/i.test(await page.textContent('#app')), 'no Claude mentions on the Learn page');
    await shot(page, '01-learn');
    await page.click('text=Read the lesson first');
    await page.waitForSelector('.lesson-grid');
    ok(await page.$$eval('.key.is-new', e => e.length) === 7, 'lesson 1 marks 7 new keys');
    await shot(page, '02-lesson1');
    await page.click('.lesson-side .btn.primary');
    await page.waitForSelector('.tt-inner');
    ok(await page.$eval('.key.next', e => e.dataset.code) === 'KeyF', 'first key highlighted is F');
    ok((await page.textContent('.ty-hint')).includes('left index finger'), 'hint names the left index finger');
    // a mistake in stop mode
    await page.keyboard.type('j');
    ok(await page.$$eval('.ch.slip', e => e.length) === 1, 'wrong key marks a slip and does not advance');
    await page.keyboard.type('ff');
    await shot(page, '03-typing');
    await page.keyboard.press('Escape');
    await page.waitForSelector('.lesson-grid');
    ok(!(await page.$('.tt-inner')), 'Esc leaves the exercise and goes back to the lesson page');
    await page.click('.lesson-side .btn.primary'); await page.waitForSelector('.tt-inner');
    await typeExercise(page);
    ok(await page.$eval('.result .stars', e => e.getAttribute('aria-label')).then ? true : true, 'result shown');
    const label = await page.$eval('.result .stars', e => e.getAttribute('aria-label'));
    ok(/[123] of 3 stars/.test(label), 'clean run earns stars: ' + label);
    await shot(page, '04-result');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);
    ok((await page.textContent('.ty-title')).includes('Exercise 2 of 5'), 'Enter goes to exercise 2');
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('tt.state.v1')));
    ok(st.history.length === 1 && st.lessons['home-row'].ex[0].s >= 1, 'progress saved locally');
    // continue mode + backspace
    await page.goto(FILE + '#options'); await page.waitForSelector('.options');
    await page.check('#opt-onerr-continue');
    await page.goto(FILE + '#lesson-1'); await page.waitForSelector('.lesson-grid');
    await page.click('.ex-btn >> nth=1');
    await page.waitForSelector('.tt-inner');
    await page.keyboard.type('dx');
    ok(await page.$$eval('.ch.bad', e => e.length) === 1, 'continue mode marks a wrong char');
    await page.keyboard.press('Backspace');
    ok(await page.$$eval('.ch.bad', e => e.length) === 0, 'backspace removes the mistake');
    ok(page.errors.length === 0, 'no page errors: ' + page.errors.join(' | '));
    await ctx.close();
  }

  console.log('\n2. Layouts');
  {
    const { ctx, page } = await newDevice(browser, { mock: false });
    await page.goto(FILE + '#options'); await page.waitForSelector('.options');
    await page.selectOption('#opt-layout', 'cz');
    await page.goto(FILE + '#lesson-8'); await page.waitForSelector('.lesson-grid');
    const yFinger = await page.$$eval('.fingers li', lis => lis.map(l => l.textContent));
    ok(yFinger.some(t => t.startsWith('Y') && t.includes('left little finger')), 'Czech QWERTZ: Y is the left little finger');
    await page.click('.ex-btn >> nth=1'); await page.waitForSelector('.tt-inner');
    // second exercise starts with "you": y on QWERTZ is KeyZ
    ok(await page.$eval('.key.next', e => e.dataset.code) === 'KeyZ', 'Czech QWERTZ highlights KeyZ for "y"');
    await shot(page, '05-typing-cz');
    // layout detection banner: US selected, keyboard sends QWERTZ keys
    await page.goto(FILE + '#options'); await page.waitForSelector('.options');
    await page.selectOption('#opt-layout', 'us');
    await page.goto(FILE + '#lesson-1'); await page.waitForSelector('.lesson-grid');
    await page.click('.lesson-side .btn.primary'); await page.waitForSelector('.tt-inner');
    await page.evaluate(() => {
      const send = (key, code, shiftKey) => window.dispatchEvent(new KeyboardEvent('keydown', { key, code, shiftKey, bubbles: true }));
      send('z', 'KeyY'); send('y', 'KeyZ'); send('ě', 'Digit2'); send('š', 'Digit3'); send('2', 'Digit2', true);
    });
    ok(await page.isVisible('.layout-banner'), 'mismatch banner appears');
    ok((await page.textContent('.layout-banner')).includes('Czech (QWERTZ)'), 'banner suggests Czech (QWERTZ)');
    await page.click('.layout-banner .btn.primary');
    ok((await page.textContent('.layout-note')).includes('Czech (QWERTZ)'), 'switch applies the layout');
    // capital letters show a Shift hint on the other hand
    await page.goto(FILE + '#lesson-11'); await page.waitForSelector('.lesson-grid');
    await page.click('.ex-btn >> nth=1'); await page.waitForSelector('.tt-inner');
    await page.waitForFunction(() => (document.querySelector('.ty-hint') || {}).textContent, null, { timeout: 3000 }).catch(() => {});
    const hint = await page.textContent('.ty-hint');
    ok(/right index finger.*left Shift/.test(hint) || /I.*right middle finger.*left Shift/.test(hint), 'capital I uses left Shift: ' + hint);
    ok(page.errors.length === 0, 'no page errors: ' + page.errors.join(' | '));
    await ctx.close();
  }

  console.log('\n3. Sync between two devices (mock Claude account)');
  {
    const A = await newDevice(browser, { mock: true });
    await A.page.waitForFunction(() => document.querySelector('#sync-btn').dataset.state === 'synced', null, { timeout: 8000 });
    ok(true, 'device A synced');
    ok((await A.page.textContent('h1')).includes('Hi, Petr'), 'greets the signed-in user');
    await A.page.click('.continue .btn.primary'); await A.page.waitForSelector('.tt-inner');
    await typeExercise(A.page);
    // add a custom text
    await A.page.goto(FILE + '#practice'); await A.page.waitForSelector('.practice');
    await A.page.click('text=Add a text');
    await A.page.fill('#te-title', 'Email to my landlord');
    await A.page.fill('#te-body', 'Dear Mr. Smith, the heating in my flat doesn’t work since Monday. Could you send someone to fix it this week? Thank you — Anna');
    await A.page.click('text=Save text');
    await A.page.waitForTimeout(2200);
    const prog = JSON.parse(store.get('data/users/u_test1/progress') || '{}');
    ok(prog.history && prog.history.length === 1, 'progress written to the account (history 1)');
    const textKeys = [...store.keys()].filter(k => k.startsWith('data/users/u_test1/progress/texts/'));
    ok(textKeys.length === 1, 'custom text written as its own document');
    await shot(A.page, '06-practice');

    const B = await newDevice(browser, { mock: true });
    await B.page.waitForFunction(() => document.querySelector('#sync-btn').dataset.state === 'synced', null, { timeout: 8000 });
    await B.page.waitForTimeout(400);
    await B.page.goto(FILE + '#learn'); await B.page.waitForSelector('.lessons');
    ok((await B.page.textContent('.lesson-row >> nth=0')).includes('1 / 5'), 'device B sees lesson 1 progress (1 / 5)');
    await B.page.goto(FILE + '#practice'); await B.page.waitForSelector('.practice');
    ok((await B.page.textContent('.my-texts')).includes('Email to my landlord'), 'device B sees the custom text');
    // B practices the text: smart quotes and the dash are cleaned
    await B.page.click('.my-texts .text-row .btn.primary >> nth=0');
    await B.page.waitForSelector('.tt-inner');
    const t = await B.page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    ok(t.includes("doesn't") && t.includes('week? Thank you - Anna'), 'custom text cleaned for the keyboard: ' + t.slice(0, 60));
    await typeExercise(B.page);
    await B.page.waitForTimeout(2200);
    const prog2 = JSON.parse(store.get('data/users/u_test1/progress'));
    ok(prog2.history.length === 2, 'history merged from both devices (2)');
    await A.page.waitForTimeout(800);
    await A.page.goto(FILE + '#progress'); await A.page.waitForSelector('.progress');
    ok((await A.page.textContent('.tbl-wrap')).includes('Email to my landlord'), 'device A sees B\'s session');
    await shot(A.page, '07-progress');

    // Coach with Claude feedback
    await A.page.goto(FILE + '#coach'); await A.page.waitForSelector('.coach');
    await A.page.fill('#coach-text', 'help me write email to my landlord, heating not working since monday');
    await A.page.click('text=Get feedback from Claude');
    await A.page.waitForSelector('.feedback', { timeout: 5000 });
    ok(await A.page.$$eval('.marks del', e => e.length) > 0 && await A.page.$$eval('.marks ins', e => e.length) > 0, 'corrections shown as marks');
    ok(await A.page.$$eval('.mistakes li', e => e.length) === 3, 'three mistakes listed');
    await shot(A.page, '08-coach');
    await A.page.click('text=Type the clearer request');
    await A.page.waitForSelector('.tt-inner');
    await typeExercise(A.page);
    ok(await A.page.isVisible('.result'), 'typing the improved request shows the result');
    await A.page.waitForTimeout(2200);
    ok(JSON.parse(store.get('data/users/u_test1/journal') || '{}').entries.length === 1, 'coach feedback saved to the journal');

    await A.page.goto(FILE + '#practice'); await A.page.waitForSelector('.practice');
    ok(!(await A.page.textContent('.practice')).includes('Make a practice text with Claude') && !(await A.page.textContent('.practice')).includes('Starter texts'), 'Claude text generator and starter texts are gone from Practice');

    // reset on A propagates to B
    await A.page.goto(FILE + '#options'); await A.page.waitForSelector('.options');
    await A.page.click('text=Reset progress');
    await A.page.click('.dialog .btn.danger');
    await A.page.waitForTimeout(2500);
    await B.page.goto(FILE + '#progress'); await B.page.waitForSelector('.progress');
    await B.page.waitForTimeout(600);
    await B.page.goto(FILE + '#learn'); await B.page.waitForSelector('.lessons');
    ok(!(await B.page.textContent('.lesson-row >> nth=0')).includes('/ 5'), 'reset reaches device B');
    ok((JSON.parse(store.get('data/users/u_test1/progress')).history || []).length === 0, 'synced history is empty after reset');
    ok(A.page.errors.length === 0 && B.page.errors.length === 0, 'no page errors: ' + A.page.errors.concat(B.page.errors).join(' | '));
    const writes = await A.page.evaluate(() => window.__writes || 0);
    ok(writes < 30, 'device A wrote a sensible number of times: ' + writes);
    await A.ctx.close(); await B.ctx.close();
  }

  console.log('\n4. Dark theme and small screen');
  {
    const D = await newDevice(browser, { mock: false, dark: true });
    await shot(D.page, '09-learn-dark');
    await D.page.goto(FILE + '#lesson-13'); await D.page.waitForSelector('.lesson-grid');
    await shot(D.page, '10-lesson13-dark');
    await D.page.click('.lesson-side .btn.primary'); await D.page.waitForSelector('.tt-inner');
    await D.page.keyboard.type('1 2 3');
    await shot(D.page, '11-typing-dark');
    ok(D.page.errors.length === 0, 'no page errors (dark)');
    await D.ctx.close();
    const M = await newDevice(browser, { mock: false, width: 390, height: 844 });
    await shot(M.page, '12-mobile-learn');
    const overflow = await M.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    ok(!overflow, 'no sideways scrolling on a phone');
    await M.page.goto(FILE + '#lesson-3'); await M.page.waitForSelector('.lesson-grid');
    ok(!(await M.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)), 'lesson page fits a phone');
    await M.ctx.close();
  }

  console.log('\n5. Weak keys, drill and heatmap');
  {
    const { ctx, page } = await newDevice(browser, { mock: false });
    await page.goto(FILE + '#lesson-1'); await page.waitForSelector('.lesson-grid');
    for (const ex of [2, 3]) {
      await page.click('.ex-btn >> nth=' + ex); await page.waitForSelector('.tt-inner');
      const text = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
      for (const ch of text) { if (ch === 's' || ch === 'l') await page.keyboard.type('k'); await page.keyboard.type(ch, { delay: 4 }); }
      await page.waitForSelector('.result:not([hidden])');
      await page.click('.ty-head .back'); await page.waitForSelector('.lesson-grid');
    }
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('tt.state.v1')));
    const fields = Object.keys(Object.values(st.keysByDev)[0]);
    ok(fields.every(f => /^k\d+$/.test(f)), 'key counters use safe field names: ' + fields.join(' '));
    await page.goto(FILE + '#practice'); await page.waitForSelector('.drills');
    const card = (await page.textContent('.drill >> nth=0')).replace(/\s+/g, '');
    ok(card.includes('l') && card.includes('s'), 'weak keys card lists L and S');
    await page.click('.drill >> nth=0 >> button'); await page.waitForSelector('.tt-inner');
    const drill = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    ok(!/\b(\w)\1+\b/.test(drill), 'weak-key drill uses real words: ' + drill);
    await page.goto(FILE + '#progress'); await page.waitForSelector('.heat-panel');
    ok(await page.$$eval('.heat-panel .key.heat', e => e.length) > 0, 'heatmap colors practiced keys');
    ok(await page.$$eval('.weak tbody tr', e => e.length) === 2, 'weakest keys table has L and S');
    // one-hand training: S was missed more (left hand), so left is suggested
    await page.goto(FILE + '#practice'); await page.waitForSelector('.hand-card');
    const handTxt = await page.textContent('.hand-card');
    const weakHand = (handTxt.match(/Your (left|right) hand needs more practice/) || [])[1];
    ok(weakHand === 'right', 'hand card names the weaker hand (more misses on L than S): ' + handTxt.replace(/\s+/g, ' '));
    await page.click('.hand-card .btn.primary'); await page.waitForSelector('.tt-inner');
    const rightText = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    ok(/^[yuiophjklnm ]+$/.test(rightText) && rightText.length > 20, 'right-hand drill uses only right-hand letters: ' + rightText);
    await page.click('.ty-head .back'); await page.waitForSelector('.hand-card');
    await page.click('.hand-card .btn >> text=Left hand'); await page.waitForSelector('.tt-inner');
    const leftText = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    ok(/^[qwertasdfgzxcvb ]+$/.test(leftText) && leftText.length > 20, 'left-hand drill uses only left-hand letters: ' + leftText);
    await shot(page, '14-left-hand');
    // reset the weak keys
    await page.click('.ty-head .back'); await page.waitForSelector('.drills');
    await page.click('.drill >> nth=0 >> text=Reset');
    await page.click('.dialog .btn.danger');
    await page.waitForSelector('.drills');
    ok((await page.textContent('.drill >> nth=0')).includes('Type a few lessons first'), 'reset clears the weak keys');
    const st2 = await page.evaluate(() => JSON.parse(localStorage.getItem('tt.state.v1')));
    ok(Object.keys(st2.keysByDev).length === 0 && st2.keysResetAt > 0 && st2.history.length > 0, 'key statistics cleared, history kept');
    ok(page.errors.length === 0, 'no page errors: ' + page.errors.join(' | '));
    await ctx.close();
  }

  console.log('\n6. Steno basics (chords)');
  {
    const { ctx, page } = await newDevice(browser, { mock: false });
    await page.goto(FILE + '#practice'); await page.waitForSelector('.drills');
    await page.click('.drill:has-text("Steno basics") button');
    await page.waitForSelector('.steno-kb');
    ok((await page.textContent('h1')).includes('Steno basics'), 'steno page opens from Practice');
    await page.click('.steno-list .ex-btn >> nth=2'); // "Whole words in one chord"
    await page.waitForSelector('.st-word');
    // Plover keyboard mapping: steno key → QWERTY key
    const MAP = { 'S': 'a', 'T': 'w', 'K': 's', 'P': 'e', 'W': 'd', 'H': 'r', 'R': 'f', 'A': 'c', 'O': 'v', '*': 't', 'E': 'n', 'U': 'm',
      '-F': 'u', '-R': 'j', '-P': 'i', '-B': 'k', '-L': 'o', '-G': 'l', '-T': 'p', '-S': ';', '-D': '[', '-Z': "'" };
    const keysFor = (stroke) => {
      const keys = []; let right = false;
      for (const ch of stroke) {
        if (ch === '-') { right = true; continue; }
        if ('AO*EU'.includes(ch)) { keys.push(MAP[ch]); right = 'EU*'.includes(ch) || ch === 'O' || ch === 'A' ? true : right; continue; }
        keys.push(right ? MAP['-' + ch] : MAP[ch]);
      }
      return keys;
    };
    const chord = async (stroke) => { const ks = keysFor(stroke); for (const k of ks) await page.keyboard.down(k); await page.waitForTimeout(20); for (const k of ks) await page.keyboard.up(k); };
    const first = await page.textContent('.st-target');
    await chord('KAT' === first ? 'SAT' : 'KAT');
    ok((await page.textContent('.st-feedback')).startsWith('You pressed'), 'a wrong chord is explained: ' + await page.textContent('.st-feedback'));
    await shot(page, '15-steno');
    for (let i = 0; i < 40; i++) {
      if (await page.isVisible('.result:not([hidden])')) break;
      await chord(await page.textContent('.st-target'));
    }
    ok(await page.isVisible('.result:not([hidden])'), 'all chords accepted, lesson finished');
    ok(/[123] of 3 stars/.test(await page.$eval('.result .stars', e => e.getAttribute('aria-label'))), 'steno lesson earns stars');
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('tt.state.v1')));
    ok(st.lessons['steno-3'] && st.lessons['steno-3'].ex[0].s >= 1, 'steno progress saved');
    ok(page.errors.length === 0, 'no page errors: ' + page.errors.join(' | '));
    await ctx.close();
  }

  console.log('\n7. Choose keys');
  {
    const { ctx, page } = await newDevice(browser, { mock: false });
    await page.goto(FILE + '#practice'); await page.waitForSelector('.drills');
    await page.click('.drill:has-text("Choose keys") button'); await page.waitForSelector('.pick-panel');
    for (const code of ['KeyQ', 'KeyU', 'KeyI', 'KeyT']) await page.click(`.pick-panel .key[data-code="${code}"]`);
    ok(await page.inputValue('#pick-input') === 'quit', 'clicked keys appear in the box: ' + await page.inputValue('#pick-input'));
    ok(await page.$$eval('.pick-panel .key.picked', e => e.length) === 4, 'clicked keys are marked');
    await page.click('.pick-panel .key[data-code="KeyT"]');
    ok(await page.inputValue('#pick-input') === 'qui', 'clicking again removes a key');
    await page.fill('#pick-input', 'asdfjkl');
    ok((await page.textContent('.pick-panel')).includes('real words use only these keys'), 'shows how many real words fit');
    await shot(page, '16-choose-keys');
    await page.click('.pick-panel .btn.primary'); await page.waitForSelector('.tt-inner');
    const t1 = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    ok(/^[asdfjkl ]+$/.test(t1), '"Only these keys" uses only the chosen keys: ' + t1);
    await typeExercise(page);
    ok(await page.isVisible('.result:not([hidden])'), 'drill can be finished');
    await page.click('.ty-head .back'); await page.waitForSelector('.drills');
    await page.click('.drill:has-text("Choose keys") button'); await page.waitForSelector('.pick-panel');
    ok(await page.inputValue('#pick-input') === 'asdfjkl', 'choice is remembered');
    await page.fill('#pick-input', 'zx');
    await page.check('#pick-focus');
    await page.click('.pick-panel .btn.primary'); await page.waitForSelector('.tt-inner');
    const t2 = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    const words = t2.split(' ');
    ok(words.length > 10 && words.every(w => /[zx]/.test(w)), '"Real words" mode: every word has Z or X: ' + t2);
    ok(page.errors.length === 0, 'no page errors: ' + page.errors.join(' | '));
    await ctx.close();
  }

  console.log('\n8. Timed practice');
  {
    const { ctx, page } = await newDevice(browser, { mock: false });
    await page.clock.install();
    await page.goto(FILE + '#practice'); await page.waitForSelector('.drills-head .len-btn');
    ok(await page.isHidden('#menu-pop-length-right'), 'length menu starts closed');
    await page.click('.drills-head .len-btn');
    ok(await page.isVisible('#menu-pop-length-right'), 'length button opens the menu');
    await page.click('#menu-pop-length-right .len-opt >> text=1 min');
    ok((await page.textContent('.drills-head .len-btn')).includes('1 min') && await page.isHidden('#menu-pop-length-right'), 'choosing 1 min updates the button and closes the menu');
    await page.click('.drill:has-text("Common English words") > button'); await page.waitForSelector('.tt-inner');
    ok((await page.textContent('.stat >> nth=2')).startsWith('1:00'), 'countdown starts at 1:00');
    const t = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    ok(t.length > 300, 'enough text for one minute: ' + t.length + ' chars');
    await page.keyboard.type(t.slice(0, 20));
    await page.clock.runFor(30000);
    ok((await page.textContent('.stat >> nth=2')).startsWith('0:30'), 'countdown shows 0:30 after 30 s');
    await page.clock.runFor(31000);
    await page.waitForSelector('.result:not([hidden])', { timeout: 3000 });
    ok((await page.textContent('.result')).includes('Time is up!'), 'drill ends when time is up');
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('tt.state.v1')));
    ok(st.settings.drillTime === 60 && st.history[st.history.length - 1].d === 60, 'length saved in settings, session lasts 60 s');
    ok(page.errors.length === 0, 'no page errors: ' + page.errors.join(' | '));
    await ctx.close();
  }

  console.log('\n10. Weak keys: variety from all practiced keys');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.addInitScript(() => {
      if (localStorage.getItem('seeded')) return;
      localStorage.setItem('seeded', '1');
      const K = {};
      'abcdefghijklmnopqrstuvwxyz'.split('').forEach(c => { K['k' + c.charCodeAt(0)] = [60, 0]; });
      K.k113 = [10, 6]; K.k122 = [12, 5]; K.k84 = [6, 3]; K.k63 = [6, 3]; // q, z, T, ?
      localStorage.setItem('tt.state.v1', JSON.stringify({ v: 1, settings: { layout: 'us' }, settingsAt: 1, lessons: {}, history: [], keysByDev: { dev1: K }, dailyByDev: {}, textProg: {}, dismissed: {}, resetAt: 0 }));
    });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto(FILE + '#practice'); await page.waitForSelector('.drills');
    await page.click('.drill >> nth=0 >> button'); await page.waitForSelector('.tt-inner');
    const t = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    const words = t.split(' ');
    ok(words.every(w => /[qzT?]/.test(w)), 'every word practices a weak key: ' + t);
    ok(new Set(words).size >= 14, 'many different words: ' + new Set(words).size + ' of ' + words.length);
    ok(/[bcemnoprtuvwxy]/.test(t), 'words use practiced keys beyond the lessons');
    ok(errs.length === 0, 'no page errors: ' + errs.join(' | '));
    await ctx.close();
  }

  console.log('\n11. Weak words');
  {
    const { ctx, page } = await newDevice(browser, { mock: false });
    const typeWithSlip = async (word) => {
      const text = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
      for (let i = 0; i < text.length; i++) { if (word && i === text.indexOf(word) + 2) await page.keyboard.type('q'); await page.keyboard.type(text[i]); }
      await page.waitForSelector('.result:not([hidden])');
    };
    const card = async () => (await page.textContent('.drill:has-text("Your weak words")')).replace(/\s+/g, ' ');
    await openTeacherText(page);
    await typeWithSlip('teacher');
    await page.click('.ty-head .back'); await page.goto(FILE + '#practice'); await page.waitForSelector('.drills');
    ok((await card()).includes('A word becomes weak when'), 'one mistake does not make a weak word: ' + await card());
    // earlier practice: teacher 3 right / 1 wrong (+ the slip above), missed 2 right / 3 wrong, short 6 right / 1 wrong
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('tt.state.v1')); s.wordsByDev.seed = { w_teacher: [3, 0], w_missed: [1, 3], w_short: [5, 1] }; localStorage.setItem('tt.state.v1', JSON.stringify(s)); });
    await page.reload(); await page.waitForSelector('.drills');
    await openTeacherText(page);
    await typeWithSlip('teacher');
    await page.click('.ty-head .back'); await page.goto(FILE + '#practice'); await page.waitForSelector('.drills');
    const c = await card();
    ok(c.includes('teacher') && c.includes('missed') && !c.includes('short'), 'repeated mistakes make weak words (teacher 2 of 5, missed 3 of 5), one slip does not (short): ' + c);
    await page.click('.drill:has-text("Your weak words") >> text=Start'); await page.waitForSelector('.tt-inner');
    const d = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    ok(d.split(' ').every(w => w === 'teacher' || w === 'missed') && d.split(' ').filter(w => w === 'teacher').length === 7, 'drill practices only those words, 7 times each: ' + d);
    ok(await page.isVisible('.ty-note >> text=Reset weak words'), 'weak words drill has its own reset button');
    await typeExercise(page);
    await page.click('.ty-head .back'); await page.waitForSelector('.drills');
    ok((await card()).includes('teacher 1/5'), 'a perfect drill counts as day 1 of 5, the word stays weak');
    await page.click('.drill:has-text("Your weak words") >> text=Start'); await page.waitForSelector('.tt-inner');
    await page.click('.ty-note >> text=Reset weak words');
    await page.click('.dialog .btn.danger'); await page.waitForSelector('.drills');
    ok((await card()).includes('A word becomes weak when'), 'reset clears the weak words');
    ok(page.errors.length === 0, 'no page errors: ' + page.errors.join(' | '));
    await ctx.close();
  }

  console.log('\n12. Weak word becomes a strong word after 5 good days');
  {
    const { ctx, page } = await newDevice(browser, { mock: false });
    await page.clock.install({ time: new Date('2026-11-16T10:00:00') });
    const toPractice = async () => { await page.evaluate(() => { location.hash = '#learn'; }); await page.evaluate(() => { location.hash = '#practice'; }); await page.waitForSelector('.drills'); };
    await page.goto(FILE + '#learn'); await page.waitForSelector('.lessons');
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('tt.state.v1') || '{}'); s.wordsByDev = { seed: { w_teacher: [3, 1] } }; localStorage.setItem('tt.state.v1', JSON.stringify(s)); });
    await page.reload(); await page.waitForSelector('.lessons');
    await openTeacherText(page);
    const text = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    for (let i = 0; i < text.length; i++) { if (i === text.indexOf('teacher') + 2) await page.keyboard.type('q'); await page.keyboard.type(text[i]); }
    await page.waitForSelector('.result:not([hidden])');
    for (let day = 1; day <= 5; day++) {
      await toPractice();
      await page.click('.drill:has-text("Your weak words") >> text=Start'); await page.waitForSelector('.tt-inner');
      const d = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
      if (day === 1) ok(d.split(' ').filter(w => w === 'teacher').length === 7, 'untimed weak words drill has the word 7 times: ' + d);
      await typeExercise(page);
      if (day === 5) ok((await page.textContent('.result')).includes('New strong words: teacher'), 'result announces the new strong word');
      if (day < 5) {
        await toPractice();
        if (day === 2) ok((await page.textContent('.drill:has-text("Your weak words")')).includes('teacher 2/5'), 'card shows 2 of 5 days');
      }
      await page.clock.fastForward('24:00:00');
    }
    await toPractice();
    ok(!(await page.textContent('.drill:has-text("Your weak words")')).includes('teacher'), 'the word left the weak words');
    ok((await page.textContent('.drill:has-text("Strong learned words")')).includes('teacher'), 'the word is in Strong learned words');
    // add words by hand; a strong word added again becomes weak again
    await page.click('.drill:has-text("Your weak words") .ww-add');
    await page.fill('#ww-input', 'Because, through  teacher 123');
    await page.click('.dialog .btn.primary');
    const c2 = await page.textContent('.drill:has-text("Your weak words")');
    ok(c2.includes('because') && c2.includes('through') && c2.includes('teacher'), 'added words are in Your weak words: ' + c2);
    ok(!(await page.$('.drill:has-text("Strong learned words")')) || !(await page.textContent('.drill:has-text("Strong learned words")')).includes('teacher'), 'teacher left Strong learned words');
    ok((await page.textContent('#toast')).includes('Skipped: 123'), 'a word without letters is skipped');
    await page.click('.drill:has-text("Your weak words") >> text=Start'); await page.waitForSelector('.tt-inner');
    const d2 = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    ok(d2.split(' ').filter(w => w === 'because').length === 7, 'the drill uses added words: ' + d2);
    ok(page.errors.length === 0, 'no page errors: ' + page.errors.join(' | '));
    await ctx.close();
  }

  console.log('\n14. Theme switch');
  {
    const { ctx, page } = await newDevice(browser, { mock: false, dark: true });
    const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const darkBg = await bg();
    await page.goto(FILE + '#options'); await page.waitForSelector('.options');
    await page.check('#opt-theme-light');
    ok((await bg()) === 'rgb(246, 217, 198)', 'Light makes the page peach in a dark system: ' + await bg());
    await page.check('#opt-theme-dark');
    ok((await bg()) === darkBg, 'Dark makes it green again');
    await page.check('#opt-theme-auto');
    ok((await bg()) === darkBg, 'Match system follows the system');
    await ctx.close();
  }

  console.log('\n13. Library (fixed lessons)');
  {
    const { ctx, page } = await newDevice(browser, { mock: false });
    await page.goto(FILE + '#practice'); await page.waitForSelector('.library');
    const n = await page.evaluate(() => TT.LIBRARY.length);
    ok(await page.$$eval('.library .text-row', e => e.length) === n, 'Library lists all ' + n + ' fixed lessons');
    ok(!(await page.$('.nav-link[data-nav="library"]')), 'there is no Library tab');
    ok((await page.textContent('#static-lessons h2')) === 'Static lessons', 'Practice has a Static lessons block');
    ok(await page.$('.drills ~ #static-lessons'), 'the block comes after Quick drills');
    const startRow = '.library .text-row:has-text("Pangrams")';
    await page.click(startRow + ' .btn.primary'); await page.waitForSelector('.tt-inner');
    const t1 = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    ok(t1.startsWith('The quick brown fox jumps over the lazy dog.'), 'the lesson shows its fixed text');
    await typeExercise(page, { mistakes: 3 });
    await page.click('.ty-head .back'); await page.waitForSelector('.library');
    await page.click(startRow + ' .btn.primary'); await page.waitForSelector('.tt-inner');
    const t2 = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    ok(t1 === t2, 'the text is the same the next time, also after mistakes');
    await typeExercise(page);
    await page.click('.ty-head .back'); await page.waitForSelector('.library');
    ok(await page.isVisible('.drills'), 'back goes to the Practice page');
    ok(await page.isVisible(startRow + ' .stars'), 'best stars are shown');
    ok((await page.textContent(startRow)).includes('Finished 2 times'), 'the lesson shows it was finished 2 times');
    ok((await page.textContent('.library .text-row:has-text("Alphabet")')).includes('Not finished yet'), 'other lessons show not finished yet');
    ok(page.errors.length === 0, 'no page errors: ' + page.errors.join(' | '));
    await ctx.close();
  }

  console.log('\n9. Common words: how many');
  {
    const { ctx, page } = await newDevice(browser, { mock: false });
    await page.goto(FILE + '#practice'); await page.waitForSelector('.drills');
    const card = '.drill:has-text("Common English words")';
    ok((await page.textContent(card)).includes('The 200 most common words'), 'default is the top 200');
    await page.click(card + ' .len-btn');
    await page.click('#menu-pop-common .len-opt >> text=Top 50');
    ok((await page.textContent(card)).includes('The 50 most common words'), 'top 50 chosen');
    await page.click(card + ' > button'); await page.waitForSelector('.tt-inner');
    ok((await page.textContent('.ty-title')).includes('top 50'), 'drill title names the top 50');
    const text = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    const top50 = await page.evaluate(() => TT.COMMON.slice(0, 50));
    ok(text.split(' ').every(w => top50.includes(w)), 'every word is from the top 50: ' + text);
    await page.click('.ty-head .back'); await page.waitForSelector('.drills');
    await page.click(card + ' .len-btn');
    await page.click('#menu-pop-common .len-opt >> text=Top 1000');
    await page.click(card + ' > button'); await page.waitForSelector('.tt-inner');
    const t2 = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    const top1000 = await page.evaluate(() => TT.COMMON);
    ok(t2.split(' ').every(w => top1000.includes(w)), 'top 1000 drill uses the 1000-word list');
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('tt.state.v1')));
    ok(st.settings.commonCount === 1000, 'choice is saved');
    ok(page.errors.length === 0, 'no page errors: ' + page.errors.join(' | '));
    await ctx.close();
  }

  console.log('\n15. Library: my own lessons');
  {
    const { ctx, page } = await newDevice(browser, { mock: false });
    await page.goto(FILE + '#practice'); await page.waitForSelector('.library');
    await page.click('.lib-add');
    await page.fill('#le-title', 'Studio notes');
    await page.fill('#le-body', 'Set the gain first, then check the levels. Keep the mix clean and simple.');
    ok((await page.textContent('.lib-editor .editor-foot')).includes('14 words'), 'editor counts the words');
    await page.click('.lib-editor .btn.primary');
    const row = '.library .text-row:has-text("Studio notes")';
    ok(await page.isVisible(row), 'the new lesson is in the Library');
    ok((await page.textContent('.library')).includes('My lessons'), 'it is in the group My lessons');
    const n = await page.evaluate(() => TT.LIBRARY.length);
    ok(await page.$$eval('.library .text-row', e => e.length) === n + 1, 'built-in lessons stay');
    await page.click(row + ' .btn.primary'); await page.waitForSelector('.tt-inner');
    const t = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    ok(t.startsWith('Set the gain first'), 'the lesson shows its text');
    await typeExercise(page);
    await page.click('.ty-head .back'); await page.waitForSelector('.library');
    ok((await page.textContent(row)).includes('Finished 1 time'), 'finished count works for my lessons');
    await page.click(row + ' [aria-label^="Edit"]');
    await page.fill('#le-group', 'Sound');
    await page.click('.lib-editor .btn.primary');
    ok((await page.textContent('.library')).includes('Sound'), 'lesson moved to its new group');
    ok((await page.textContent('.library .text-row:has-text("Studio notes")')).includes('Finished 1 time'), 'results stay after editing');
    await page.goto(FILE + '#practice'); await page.waitForSelector('.drills');
    ok(!(await page.textContent('.my-texts')).includes('Studio notes'), 'Library lessons are not listed in My texts');
    await page.goto(FILE + '#practice'); await page.waitForSelector('.library');
    await page.click('.library .text-row:has-text("Studio notes") [aria-label^="Delete"]');
    await page.click('.dialog .btn.danger');
    await page.waitForTimeout(100);
    ok(!(await page.textContent('.library')).includes('Studio notes'), 'lesson deleted');
    ok(page.errors.length === 0, 'no page errors: ' + page.errors.join(' | '));
    await ctx.close();
  }

  console.log('\n16. My texts: one lesson with a counter');
  {
    const { ctx, page } = await newDevice(browser, { mock: false });
    await page.goto(FILE + '#practice'); await page.waitForSelector('.drills');
    await page.click('text=Add a text');
    const long = Array.from({ length: 12 }, (_, i) => 'This is sentence number ' + (i + 1) + ' of my long practice text.').join(' ');
    await page.fill('#te-title', 'Long text'); await page.fill('#te-body', long);
    await page.click('.editor .btn.primary');
    const row = '.my-texts .text-row:has-text("Long text")';
    ok(!(await page.textContent(row)).includes('part'), 'no parts are shown');
    ok((await page.textContent(row)).includes('Not finished yet'), 'counter starts at not finished');
    await page.click(row + ' .btn.primary'); await page.waitForSelector('.tt-inner');
    const t = await page.$$eval('.tt-inner .ch', els => els.map(e => e.textContent).join(''));
    ok(t === long, 'the whole text is one lesson (' + t.length + ' characters)');
    await typeExercise(page);
    await page.click('.ty-head .back'); await page.waitForSelector('.drills');
    ok((await page.textContent(row)).includes('Finished 1 time'), 'counter shows 1 time');
    await page.click(row + ' .btn.primary'); await page.waitForSelector('.tt-inner');
    await typeExercise(page);
    await page.click('.ty-head .back'); await page.waitForSelector('.drills');
    ok((await page.textContent(row)).includes('Finished 2 times'), 'counter shows 2 times');
    ok(page.errors.length === 0, 'no page errors: ' + page.errors.join(' | '));
    await ctx.close();
  }

  console.log('\n17. Esc leaves every exercise');
  {
    const { ctx, page } = await newDevice(browser, { mock: false });
    await page.goto(FILE + '#lesson-2'); await page.waitForSelector('.lesson-grid');
    await page.click('.lesson-side .btn.primary'); await page.waitForSelector('.tt-inner');
    await typeExercise(page);
    await page.keyboard.press('Escape'); await page.waitForSelector('.lesson-grid');
    ok(true, 'Esc on the result screen goes back to the lesson page');
    await page.keyboard.press('Escape'); await page.waitForSelector('.lessons');
    ok(true, 'Esc on a lesson page goes back to all lessons');
    await page.goto(FILE + '#practice'); await page.waitForSelector('.drills');
    await page.click('.drill:has-text("Common English words") >> text=Start'); await page.waitForSelector('.tt-inner');
    await page.keyboard.type('xx');
    await page.keyboard.press('Escape'); await page.waitForSelector('.drills');
    ok(!(await page.$('.tt-inner')), 'Esc leaves a practice drill');
    await page.goto(FILE + '#steno'); await page.waitForSelector('.steno');
    await page.click('.steno-list .ex-btn >> nth=0'); await page.waitForSelector('.steno-drill');
    await page.keyboard.press('Escape'); await page.waitForSelector('.steno:not(.steno-drill)');
    ok(!(await page.$('.steno-drill')), 'Esc leaves a steno drill');
    ok(page.errors.length === 0, 'no page errors: ' + page.errors.join(' | '));
    await ctx.close();
  }

  await browser.close();
  console.log(fails ? `\n${fails} FAILED` : '\nALL E2E CHECKS PASSED');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
