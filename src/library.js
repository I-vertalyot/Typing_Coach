/* Library: fixed lessons. Their text never changes (not by time, mistakes or statistics).
 *
 * TO ADD A LESSON, copy this block into the list below and change it:
 *
 *   { id: 'my-lesson',            // unique, letters, digits and - only; never change it later (progress is saved under it)
 *     group: 'Everyday English',  // lessons with the same group are shown together
 *     title: 'My lesson',
 *     note: 'One short line shown above the text (optional).',
 *     text: 'The text to type. Long texts are split into parts of about 260 characters.' },
 *
 * Use plain keyboard characters. Smart quotes and long dashes are changed to keyboard characters automatically.
 */
(function (TT) {
  'use strict';
  TT.LIBRARY = [
    // ── Warm-up ──
    { id: 'home-row-warmup', group: 'Warm-up', title: 'Home row warm-up',
      note: 'Start every session with this. Fingers on the home row, eyes on the screen.',
      text: 'asdf jkl asdf jkl fjdk slaf jfkd lsla fjfj dkdk slsl alal fdsa lkj ask a lad add salad all fall dad sad flask as alas' },
    { id: 'rows-warmup', group: 'Warm-up', title: 'Top and bottom rows',
      note: 'Reach up and down from the home row, then come back.',
      text: 'qwert yuiop zxcvb nm we were quite power type writer route your trip zebra cab van box mix cave next move bench zone' },
    { id: 'alphabet', group: 'Warm-up', title: 'Alphabet',
      note: 'Every letter from a to z, then backwards.',
      text: 'abcdefghijklmnopqrstuvwxyz zyxwvutsrqponmlkjihgfedcba abc def ghi jkl mno pqr stu vwx yz' },

    // ── Every letter ──
    { id: 'pangrams', group: 'Every letter', title: 'Pangrams',
      note: 'Each sentence uses every letter of the alphabet.',
      text: 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump! Sphinx of black quartz, judge my vow. The five boxing wizards jump quickly. Jackdaws love my big sphinx of quartz.' },

    // ── Numbers and symbols ──
    { id: 'numbers-dates', group: 'Numbers and symbols', title: 'Numbers, dates and times',
      text: 'The meeting is on 12/05 at 9:30. Room 214, floor 3. Call me at 555 0192 before 17:45. We need 40 chairs, 12 tables and 250 cups. The report has 18 pages and 7 charts. Prices went up by 3.5% in 2026.' },
    { id: 'punctuation', group: 'Numbers and symbols', title: 'Punctuation',
      text: 'Wait! Are you sure? Yes, I am. It\'s fine: we can start now. "Ready?" she asked. Bring three things: a pen, a notebook and a well-known map. Don\'t forget it - it\'s important!' },

    // ── Everyday English ──
    { id: 'morning', group: 'Everyday English', title: 'A normal morning',
      text: 'I wake up at seven o\'clock and open the window. First, I drink a glass of water. Then I make coffee and eat a small breakfast. I read the news for ten minutes, check my email and write a short list of tasks for the day. At half past eight, I leave the house and walk to the bus stop. The bus is often late, so I use the time to listen to a podcast in English.' },
    { id: 'polite-email', group: 'Everyday English', title: 'A polite email',
      text: 'Dear Mr. Smith, thank you for your quick reply. I am writing to ask about the delivery of my order. It was planned for Monday, but it has not arrived yet. Could you please check the status and tell me the new date? I am at home every day after five o\'clock. Thank you for your help. Best regards, Anna' },
    { id: 'at-the-shop', group: 'Everyday English', title: 'At the shop',
      text: 'Excuse me, where can I find the milk? It is in the next aisle, on the left. How much is this bag? It is twelve dollars. Can I pay by card? Of course. Do you need a receipt? Yes, please. Thank you, have a nice day!' }
  ];
})(globalThis.TT = globalThis.TT || {});
