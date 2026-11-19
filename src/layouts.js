/* Physical keyboard, finger zones and layout presets. */
(function (TT) {
  'use strict';

  // Finger ids → names. Colors come from CSS tokens (--f-*).
  TT.FINGERS = {
    lp: { name: 'left little finger', zone: 'pinky', hand: 'L' },
    lr: { name: 'left ring finger', zone: 'ring', hand: 'L' },
    lm: { name: 'left middle finger', zone: 'middle', hand: 'L' },
    li: { name: 'left index finger', zone: 'lindex', hand: 'L' },
    ri: { name: 'right index finger', zone: 'rindex', hand: 'R' },
    rm: { name: 'right middle finger', zone: 'middle', hand: 'R' },
    rr: { name: 'right ring finger', zone: 'ring', hand: 'R' },
    rp: { name: 'right little finger', zone: 'pinky', hand: 'R' },
    th: { name: 'thumb', zone: 'thumb', hand: '' }
  };

  // Rows of physical keys. w = width in key units. iso/ansi = only on that form factor.
  // sp = special key label (no character).
  TT.PHYS = [
    [
      { c: 'Backquote', f: 'lp' }, { c: 'Digit1', f: 'lp' }, { c: 'Digit2', f: 'lr' }, { c: 'Digit3', f: 'lm' },
      { c: 'Digit4', f: 'li' }, { c: 'Digit5', f: 'li' }, { c: 'Digit6', f: 'ri' }, { c: 'Digit7', f: 'ri' },
      { c: 'Digit8', f: 'rm' }, { c: 'Digit9', f: 'rr' }, { c: 'Digit0', f: 'rp' }, { c: 'Minus', f: 'rp' },
      { c: 'Equal', f: 'rp' }, { c: 'Backspace', f: 'rp', w: 2, sp: 'Backspace' }
    ],
    [
      { c: 'Tab', f: 'lp', w: 1.5, sp: 'Tab' }, { c: 'KeyQ', f: 'lp' }, { c: 'KeyW', f: 'lr' }, { c: 'KeyE', f: 'lm' },
      { c: 'KeyR', f: 'li' }, { c: 'KeyT', f: 'li' }, { c: 'KeyY', f: 'ri' }, { c: 'KeyU', f: 'ri' },
      { c: 'KeyI', f: 'rm' }, { c: 'KeyO', f: 'rr' }, { c: 'KeyP', f: 'rp' }, { c: 'BracketLeft', f: 'rp' },
      { c: 'BracketRight', f: 'rp' },
      { c: 'Backslash', f: 'rp', w: 1.5, ansi: true },
      { c: 'EnterTop', f: 'rp', w: 1.5, iso: true, sp: 'Enter', enterTop: true }
    ],
    [
      { c: 'CapsLock', f: 'lp', w: 1.75, sp: 'Caps' }, { c: 'KeyA', f: 'lp' }, { c: 'KeyS', f: 'lr' }, { c: 'KeyD', f: 'lm' },
      { c: 'KeyF', f: 'li', bump: true }, { c: 'KeyG', f: 'li' }, { c: 'KeyH', f: 'ri' }, { c: 'KeyJ', f: 'ri', bump: true },
      { c: 'KeyK', f: 'rm' }, { c: 'KeyL', f: 'rr' }, { c: 'Semicolon', f: 'rp' }, { c: 'Quote', f: 'rp' },
      { c: 'Backslash', f: 'rp', iso: true },
      { c: 'Enter', f: 'rp', w: 2.25, ansi: true, sp: 'Enter' },
      { c: 'Enter', f: 'rp', w: 1.25, iso: true, sp: '', enterBottom: true }
    ],
    [
      { c: 'ShiftLeft', f: 'lp', w: 2.25, ansi: true, sp: 'Shift' },
      { c: 'ShiftLeft', f: 'lp', w: 1.25, iso: true, sp: 'Shift' },
      { c: 'IntlBackslash', f: 'lp', iso: true },
      { c: 'KeyZ', f: 'lp' }, { c: 'KeyX', f: 'lr' }, { c: 'KeyC', f: 'lm' }, { c: 'KeyV', f: 'li' },
      { c: 'KeyB', f: 'li' }, { c: 'KeyN', f: 'ri' }, { c: 'KeyM', f: 'ri' }, { c: 'Comma', f: 'rm' },
      { c: 'Period', f: 'rr' }, { c: 'Slash', f: 'rp' },
      { c: 'ShiftRight', f: 'rp', w: 2.75, sp: 'Shift' }
    ],
    [
      { c: 'ControlLeft', f: 'lp', w: 1.25, sp: 'Ctrl', mod: true }, { c: 'MetaLeft', f: 'th', w: 1.25, sp: '', mod: true },
      { c: 'AltLeft', f: 'th', w: 1.25, sp: 'Alt', mod: true }, { c: 'Space', f: 'th', w: 6.25, sp: '' },
      { c: 'AltRight', f: 'th', w: 1.25, sp: 'Alt', mod: true }, { c: 'MetaRight', f: 'th', w: 1.25, sp: '', mod: true },
      { c: 'ContextMenu', f: 'rp', w: 1.25, sp: '', mod: true }, { c: 'ControlRight', f: 'rp', w: 1.25, sp: 'Ctrl', mod: true }
    ]
  ];

  const LETTERS = 'qwertyuiopasdfghjklzxcvbnm'.split('');
  function letterMap(order) {
    // order: string of 26 letters in physical order Q..P, A..L, Z..M
    const codes = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP',
      'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL',
      'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM'];
    const m = {};
    codes.forEach((code, i) => { const ch = order[i]; m[code] = [ch, ch.toUpperCase()]; });
    return m;
  }
  const QWERTY = 'qwertyuiopasdfghjklzxcvbnm';
  const QWERTZ = 'qwertzuiopasdfghjklyxcvbnm';

  // '~x' marks a dead key: shown on the keycap but never used as a typing target.
  TT.PRESETS = {
    us: {
      name: 'English (US)', iso: false,
      map: Object.assign(letterMap(QWERTY), {
        Backquote: ['`', '~'], Digit1: ['1', '!'], Digit2: ['2', '@'], Digit3: ['3', '#'], Digit4: ['4', '$'],
        Digit5: ['5', '%'], Digit6: ['6', '^'], Digit7: ['7', '&'], Digit8: ['8', '*'], Digit9: ['9', '('],
        Digit0: ['0', ')'], Minus: ['-', '_'], Equal: ['=', '+'], BracketLeft: ['[', '{'], BracketRight: [']', '}'],
        Backslash: ['\\', '|'], Semicolon: [';', ':'], Quote: ['\'', '"'], Comma: [',', '<'], Period: ['.', '>'],
        Slash: ['/', '?']
      })
    },
    uk: {
      name: 'English (UK)', iso: true,
      map: Object.assign(letterMap(QWERTY), {
        Backquote: ['`', '¬'], Digit1: ['1', '!'], Digit2: ['2', '"'], Digit3: ['3', '£'], Digit4: ['4', '$'],
        Digit5: ['5', '%'], Digit6: ['6', '^'], Digit7: ['7', '&'], Digit8: ['8', '*'], Digit9: ['9', '('],
        Digit0: ['0', ')'], Minus: ['-', '_'], Equal: ['=', '+'], BracketLeft: ['[', '{'], BracketRight: [']', '}'],
        Semicolon: [';', ':'], Quote: ['\'', '@'], Backslash: ['#', '~'], IntlBackslash: ['\\', '|'],
        Comma: [',', '<'], Period: ['.', '>'], Slash: ['/', '?']
      })
    },
    cz: {
      name: 'Czech (QWERTZ)', iso: true,
      map: Object.assign(letterMap(QWERTZ), {
        Backquote: [';', '°'], Digit1: ['+', '1'], Digit2: ['ě', '2'], Digit3: ['š', '3'], Digit4: ['č', '4'],
        Digit5: ['ř', '5'], Digit6: ['ž', '6'], Digit7: ['ý', '7'], Digit8: ['á', '8'], Digit9: ['í', '9'],
        Digit0: ['é', '0'], Minus: ['=', '%'], Equal: ['~´', '~ˇ'], BracketLeft: ['ú', '/'], BracketRight: [')', '('],
        Semicolon: ['ů', '"'], Quote: ['§', '!'], Backslash: ['~¨', '\''], IntlBackslash: ['\\', '|'],
        Comma: [',', '?'], Period: ['.', ':'], Slash: ['-', '_']
      })
    },
    czq: {
      name: 'Czech (QWERTY)', iso: true,
      map: Object.assign(letterMap(QWERTY), {
        Backquote: [';', '°'], Digit1: ['+', '1'], Digit2: ['ě', '2'], Digit3: ['š', '3'], Digit4: ['č', '4'],
        Digit5: ['ř', '5'], Digit6: ['ž', '6'], Digit7: ['ý', '7'], Digit8: ['á', '8'], Digit9: ['í', '9'],
        Digit0: ['é', '0'], Minus: ['=', '%'], Equal: ['~´', '~ˇ'], BracketLeft: ['ú', '/'], BracketRight: [')', '('],
        Semicolon: ['ů', '"'], Quote: ['§', '!'], Backslash: ['~¨', '\''], IntlBackslash: ['\\', '|'],
        Comma: [',', '?'], Period: ['.', ':'], Slash: ['-', '_']
      })
    },
    de: {
      name: 'German (QWERTZ)', iso: true,
      map: Object.assign(letterMap(QWERTZ), {
        Backquote: ['~^', '°'], Digit1: ['1', '!'], Digit2: ['2', '"'], Digit3: ['3', '§'], Digit4: ['4', '$'],
        Digit5: ['5', '%'], Digit6: ['6', '&'], Digit7: ['7', '/'], Digit8: ['8', '('], Digit9: ['9', ')'],
        Digit0: ['0', '='], Minus: ['ß', '?'], Equal: ['~´', '~`'], BracketLeft: ['ü', 'Ü'], BracketRight: ['+', '*'],
        Semicolon: ['ö', 'Ö'], Quote: ['ä', 'Ä'], Backslash: ['#', '\''], IntlBackslash: ['<', '>'],
        Comma: [',', ';'], Period: ['.', ':'], Slash: ['-', '_']
      })
    }
  };
  TT.PRESET_ORDER = ['us', 'uk', 'cz', 'czq', 'de'];

  const fingerByCode = {};
  TT.PHYS.forEach(row => row.forEach(k => { if (!fingerByCode[k.c]) fingerByCode[k.c] = k.f; }));
  TT.fingerByCode = fingerByCode;

  // Build lookup tables for one preset.
  TT.buildLayout = function (id) {
    const p = TT.PRESETS[id] || TT.PRESETS.us;
    const charToKey = {};
    const add = (ch, code, shift) => {
      if (!ch || ch[0] === '~' && ch.length > 1) return; // dead key
      if (!(ch in charToKey)) charToKey[ch] = { code, shift };
    };
    // Unshifted first so they win over shifted duplicates.
    Object.keys(p.map).forEach(code => add(p.map[code][0], code, false));
    Object.keys(p.map).forEach(code => add(p.map[code][1], code, true));
    charToKey[' '] = { code: 'Space', shift: false };
    return { id: TT.PRESETS[id] ? id : 'us', name: p.name, iso: p.iso, map: p.map, charToKey };
  };

  // What the learner has to do for one character.
  TT.keyFor = function (layout, ch) {
    const k = layout.charToKey[ch];
    if (!k) return null;
    const f = fingerByCode[k.code] || 'th';
    let shiftCode = null;
    if (k.shift) shiftCode = TT.FINGERS[f].hand === 'L' ? 'ShiftRight' : 'ShiftLeft';
    return { code: k.code, shift: k.shift, shiftCode, finger: f, shiftFinger: shiftCode ? (shiftCode === 'ShiftLeft' ? 'lp' : 'rp') : null };
  };

  // Which presets agree with what the learner's keyboard really produced.
  // obs: { "KeyY|0": "z", "Digit2|1": "2", ... }
  TT.matchPresets = function (obs) {
    const res = {};
    TT.PRESET_ORDER.forEach(id => {
      const map = TT.PRESETS[id].map;
      let ok = 0, bad = 0;
      Object.keys(obs).forEach(k => {
        const [code, sh] = k.split('|');
        const entry = map[code];
        if (!entry) return;
        const want = entry[sh === '1' ? 1 : 0];
        if (!want || want[0] === '~' && want.length > 1) return;
        if (want === obs[k]) ok++; else bad++;
      });
      res[id] = { ok, bad };
    });
    return res;
  };

  // Strip characters that this layout can't type (keeps text practicable).
  TT.LETTERS = LETTERS;
})(globalThis.TT = globalThis.TT || {});
