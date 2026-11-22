/* Library: fixed lessons. Their text never changes (not by time, mistakes or statistics).
 *
 * TO ADD A LESSON, copy this block into the list below and change it:
 *
 *   { id: 'my-lesson',            // unique, letters, digits and - only; never change it later (progress is saved under it)
 *     group: 'Everyday English',  // lessons with the same group are shown together
 *     title: 'My lesson',
 *     note: 'One short line shown above the text (optional).',
 *     text: 'The text to type. Aim for about 100 words (about 2 minutes). Longer texts are split into parts of about 700 characters.' },
 *
 * Use plain keyboard characters. Smart quotes and long dashes are changed to keyboard characters automatically.
 */
(function (TT) {
  'use strict';
  TT.LIBRARY = [
    // ── Warm-up ──
    { id: 'home-row-warmup', group: 'Warm-up', title: 'Home row warm-up',
      note: 'Start every session with this. Fingers on the home row, eyes on the screen.',
      text: 'asdf jkl asdf jkl fjdk slaf jfkd lsla fjfj dkdk slsl alal fdsa lkj ask a lad add salad all fall dad sad flask as alas glass hall shall gala half flash has had gas lag jag dash hash lash sash flag glad ask dad lads fall dash flask salads halls glass flags a sad lad has a flask a glad dad shall ask all lads add a salad a hall has a gala dash ash gash lass sass jak kaka haha alfalfa asks dads adds falls flashes glasses has had half a glass of salad a lad asks a dad all lads shall dash' },
    { id: 'rows-warmup', group: 'Warm-up', title: 'Top and bottom rows',
      note: 'Reach up and down from the home row, then come back.',
      text: 'qwert yuiop zxcvb nm we were quite power type writer route your trip zebra cab van box mix cave next move bench zone query tower pretty quote equip worry yet poetry rope wire tip pure your outer upper rite tour quiet pique zoom vex cozy brown maze even black crib numb vivid zinc mob bomb cub prize your top row we try to type quick work a zebra came next to my van we were in a quiet tower with power my brave cub can mix a box of zinc quit now try it again type every word with care' },
    { id: 'alphabet', group: 'Warm-up', title: 'Alphabet',
      note: 'Every letter from a to z, then backwards.',
      text: 'abcdefghijklmnopqrstuvwxyz zyxwvutsrqponmlkjihgfedcba abc def ghi jkl mno pqr stu vwx yz apple ball cat dog egg fish goat hat ink jam kite lamp moon nest owl pen queen rain sun tree umbrella van wind box yarn zoo zoo yarn box wind van umbrella tree sun rain queen pen owl nest moon lamp kite jam ink hat goat fish egg dog cat ball apple az by cx dw ev fu gt hs ir jq kp lo mn nm ol pk qj ri sh tg uf ve wd xc yb za ant bee cow duck elk fox gull hen ibis jay koala lion mole abcdefghijklmnopqrstuvwxyz' },

    // ── Every letter ──
    { id: 'pangrams', group: 'Every letter', title: 'Pangrams',
      note: 'Each sentence uses every letter of the alphabet.',
      text: 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump! Sphinx of black quartz, judge my vow. The five boxing wizards jump quickly. Jackdaws love my big sphinx of quartz. Waltz, bad nymph, for quick jigs vex. Bright vixens jump; dozy fowl quack. Quick zephyrs blow, vexing daft Jim. A wizard\'s job is to vex chumps quickly in fog. Amazingly few discotheques provide jukeboxes. My girl wove six dozen plaid jackets before she quit. Jinxed wizards pluck ivy from the big quilt. We promptly judged antique ivory buckles for the next prize.' },

    // ── Numbers and symbols ──
    { id: 'numbers-dates', group: 'Numbers and symbols', title: 'Numbers, dates and times',
      text: 'The meeting is on 12/05 at 9:30. Room 214, floor 3. Call me at 555 0192 before 17:45. We need 40 chairs, 12 tables and 250 cups. The report has 18 pages and 7 charts. Prices went up by 3.5% in 2026. The train leaves at 6:15 and arrives at 10:48, so the trip takes 4 hours and 33 minutes. My flight number is 7301, gate 29. The hotel costs 89 euros per night, or 623 for 7 nights. On 03/11 we sold 1,250 tickets, and on 04/11 we sold 980. Please order 6 boxes of 24 bottles. The new phone has 128 GB and costs 499. The bus stops at 7:05, 7:35 and 8:05 every day.' },
    { id: 'punctuation', group: 'Numbers and symbols', title: 'Punctuation',
      text: 'Wait! Are you sure? Yes, I am. It\'s fine: we can start now. "Ready?" she asked. Bring three things: a pen, a notebook and a well-known map. Don\'t forget it - it\'s important! Hmm, where are my keys? They\'re on the table (next to the lamp). "Thanks," he said, "I\'ll be back soon." We visited Rome, Paris and Prague; each city was different. Is it 50/50? Maybe. Send it to Anna by email, please. The plan has 3 steps: plan, do, check. Wow - that\'s fast! Let\'s meet at 10:00, shall we? I can\'t, sorry. How about 11:30 instead? Great; see you then!' },

    // ── Everyday English ──
    { id: 'morning', group: 'Everyday English', title: 'A normal morning',
      text: 'I wake up at seven o\'clock and open the window. First, I drink a glass of water. Then I make coffee and eat a small breakfast. I read the news for ten minutes, check my email and write a short list of tasks for the day. At half past eight, I leave the house and walk to the bus stop. The bus is often late, so I use the time to listen to a podcast in English. When I get to work, I say hello to my colleagues and start with the most difficult task. A calm morning makes the whole day better.' },
    { id: 'polite-email', group: 'Everyday English', title: 'A polite email',
      text: 'Dear Mr. Smith, thank you for your quick reply. I am writing to ask about the delivery of my order. It was planned for Monday, but it has not arrived yet. Could you please check the status and tell me the new date? I am at home every day after five o\'clock. If it is easier, the courier can also leave the package with my neighbour at number twelve. My order number is 4518, and I paid by card on the first of the month. I would be grateful for a short answer by Friday. Thank you for your help. Best regards, Anna' },
    { id: 'at-the-shop', group: 'Everyday English', title: 'At the shop',
      text: 'Excuse me, where can I find the milk? It is in the next aisle, on the left. Thank you. Do you also sell fresh bread? Yes, the bakery is near the entrance, and the bread comes every morning. Great. How much is this bag? It is twelve dollars. Do you have it in a bigger size? Let me check. Sorry, this is the last one. That is fine, I will take it. Can I pay by card? Of course. Would you like a bag for your shopping? No, thanks, I have my own. Do you need a receipt? Yes, please. Thank you, have a nice day!' }
  ];
})(globalThis.TT = globalThis.TT || {});
