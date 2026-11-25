/* UI building blocks: element helpers, icons, keyboard, hands, charts, sound, dialog, toast. */
(function (TT) {
  'use strict';
  const SVGNS = 'http://www.w3.org/2000/svg';

  function h(tag, props) {
    const el = document.createElement(tag);
    if (props) {
      for (const k of Object.keys(props)) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k === 'value') el.value = v;
        else if (k === 'checked') el.checked = !!v;
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (let i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(k => append(el, k)); return; }
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  function s(tag, attrs) {
    const el = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k of Object.keys(attrs)) if (attrs[k] != null) el.setAttribute(k, attrs[k]);
    for (let i = 2; i < arguments.length; i++) {
      const kid = arguments[i];
      if (kid == null) continue;
      (Array.isArray(kid) ? kid : [kid]).forEach(x => x != null && el.append(x.nodeType ? x : document.createTextNode(String(x))));
    }
    return el;
  }
  TT.h = h; TT.s = s;

  // ── Icons (stroke icons, 20px) ──
  const ICONS = {
    back: '<path d="M12.5 4.5 7 10l5.5 5.5"/>',
    play: '<path d="M7 4.8v10.4L15.5 10z" fill="currentColor" stroke="none"/>',
    speaker: '<path d="M4 8h3l4-3.2v10.4L7 12H4z"/><path d="M14 7.5a3.5 3.5 0 0 1 0 5M16.2 5.4a6.5 6.5 0 0 1 0 9.2"/>',
    stop: '<rect x="5.5" y="5.5" width="9" height="9" rx="1.5" fill="currentColor" stroke="none"/>',
    check: '<path d="m4.5 10.5 3.5 3.5 7.5-8"/>',
    metro: '<path d="M7.5 3.5h5l3 13h-11z"/><path d="M10 13 14 5.5"/>',
    retry: '<path d="M4.5 10a5.5 5.5 0 1 0 1.7-4"/><path d="M4.5 3.5v3h3"/>',
    clock: '<circle cx="10" cy="11" r="6.5"/><path d="M10 7.5V11l2.5 1.5"/><path d="M8 2.5h4"/>',
    plus: '<path d="M10 4.5v11M4.5 10h11"/>',
    edit: '<path d="M4 16h3l8.5-8.5-3-3L4 13z"/>',
    trash: '<path d="M5 6h10M8 6V4.5h4V6M6.5 6l.7 9.5h5.6l.7-9.5"/>',
    copy: '<rect x="7" y="7" width="9" height="9" rx="1.5"/><path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v6A1.5 1.5 0 0 0 5.5 13H7"/>',
    spark: '<path d="M10 3.5 11.6 8.4 16.5 10l-4.9 1.6L10 16.5l-1.6-4.9L3.5 10l4.9-1.6z"/>',
    arrow: '<path d="M4.5 10h11M11 5.5 15.5 10 11 14.5"/>',
    close: '<path d="m5.5 5.5 9 9m0-9-9 9"/>',
    keyboard: '<rect x="2.5" y="5.5" width="15" height="9" rx="1.5"/><path d="M5.5 8.5h1M8.5 8.5h1M11.5 8.5h1M14 8.5h.5M6.5 11.5h7"/>'
  };
  TT.icon = function (name, cls) {
    const span = h('span', { class: 'ico' + (cls ? ' ' + cls : ''), 'aria-hidden': 'true' });
    span.innerHTML = '<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
    return span;
  };

  TT.starRow = function (n, max, label) {
    max = max || 3;
    const wrap = h('span', { class: 'stars', role: 'img', 'aria-label': label || (n + ' of ' + max + ' stars') });
    for (let i = 0; i < max; i++) {
      const on = i < n;
      const sp = h('span', { class: 'star' + (on ? ' on' : '') });
      sp.innerHTML = '<svg viewBox="0 0 20 20" width="16" height="16"><path d="M10 2.6l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 7.9l5-.7z" stroke-linejoin="round"/></svg>';
      wrap.append(sp);
    }
    return wrap;
  };

  TT.keycap = function (label, extra) {
    return h('span', { class: 'kc' + (extra ? ' ' + extra : '') }, label);
  };

  // ── On-screen keyboard ──
  TT.Keyboard = function (opts) {
    opts = opts || {};
    const root = h('div', { class: 'kb', 'aria-hidden': 'true' });
    let layout = null;
    const byCode = {}; // code → [elements]
    let lit = [];

    function legendFor(code) {
      const m = layout.map[code];
      if (!m) return null;
      const show = (x) => !x ? '' : (x[0] === '~' && x.length > 1 ? x.slice(1) : x);
      const base = show(m[0]), shift = show(m[1]);
      const isLetter = base && base.length === 1 && base.toLowerCase() !== base.toUpperCase() && shift === base.toUpperCase();
      return { base, shift, isLetter };
    }

    function build(lay) {
      layout = lay;
      root.textContent = '';
      Object.keys(byCode).forEach(k => delete byCode[k]);
      root.dataset.iso = lay.iso ? '1' : '0';
      TT.PHYS.forEach((row, ri) => {
        const r = h('div', { class: 'kb-row' });
        row.forEach(k => {
          if (k.iso && !lay.iso) return;
          if (k.ansi && lay.iso) return;
          const f = TT.FINGERS[k.f];
          const el = h('div', { class: 'key', dataset: { code: k.c, zone: f.zone } });
          el.style.setProperty('--w', k.w || 1);
          if (k.sp != null) {
            el.classList.add('special');
            if (k.mod) el.classList.add('mod');
            if (k.sp) el.append(h('span', { class: 'k-sp' }, k.sp));
            if (k.c === 'Space') el.classList.add('space');
            if (k.enterTop) el.classList.add('enter-top');
            if (k.enterBottom) el.classList.add('enter-bottom');
          } else {
            const lg = legendFor(k.c);
            if (lg) {
              if (lg.isLetter) el.append(h('span', { class: 'k-main' }, lg.shift));
              else {
                el.append(h('span', { class: 'k-shift' }, lg.shift));
                el.append(h('span', { class: 'k-base' }, lg.base));
              }
            }
          }
          if (k.bump) el.append(h('span', { class: 'bump' }));
          if (opts.onKey && k.sp == null) { el.classList.add('pickable'); el.addEventListener('click', () => opts.onKey(k.c)); }
          (byCode[k.c] = byCode[k.c] || []).push(el);
          if (k.c === 'Enter' || k.c === 'EnterTop') (byCode.Enter = byCode.Enter || []).includes(el) || byCode.Enter.push(el);
          r.append(el);
        });
        root.append(r);
        void ri;
      });
    }

    function clear() { lit.forEach(el => el.classList.remove('next')); lit = []; }
    function light(code) { (byCode[code] || []).forEach(el => { el.classList.add('next'); lit.push(el); }); }

    const api = {
      el: root,
      setLayout(lay) { build(lay); },
      // mark keys whose base character is in the set
      setPicked(set) {
        Object.keys(byCode).forEach(code => {
          const m = layout.map[code];
          const base = m && m[0] && !(m[0][0] === '~' && m[0].length > 1) ? m[0] : null;
          byCode[code].forEach(el => el.classList.toggle('picked', !!base && set.has(base)));
        });
      },
      highlight(target) {
        clear();
        if (!target) return;
        light(target.code);
        if (target.shiftCode) light(target.shiftCode);
      },
      flash(code, ok) {
        const els = byCode[code];
        if (!els) return;
        els.forEach(el => {
          el.classList.remove('hit-ok', 'hit-bad');
          void el.offsetWidth;
          el.classList.add(ok ? 'hit-ok' : 'hit-bad');
        });
      },
      // mode 'lesson': mark new / known / dim keys
      markLesson(newSet, knownSet, shiftState) {
        Object.keys(byCode).forEach(code => {
          byCode[code].forEach(el => {
            el.classList.remove('is-new', 'is-dim');
            if (code === 'Space') return;
            if (code === 'ShiftLeft' || code === 'ShiftRight') {
              if (shiftState === 'new') el.classList.add('is-new');
              else if (shiftState !== 'known') el.classList.add('is-dim');
              return;
            }
            if (el.classList.contains('special')) { el.classList.add('is-dim'); return; }
            const m = layout.map[code];
            const chars = m ? m.filter(Boolean) : [];
            if (chars.some(c => newSet.has(c))) el.classList.add('is-new');
            else if (!chars.some(c => knownSet.has(c))) el.classList.add('is-dim');
          });
        });
      },
      // heat: code → 0..1 error share, or null
      setHeat(fn, title) {
        root.classList.add('heatmap');
        Object.keys(byCode).forEach(code => {
          byCode[code].forEach(el => {
            const v = fn(code);
            el.classList.toggle('heat', v != null);
            el.style.removeProperty('--heat');
            el.removeAttribute('title');
            if (v != null) {
              el.style.setProperty('--heat', String(Math.round(Math.min(1, v) * 100)) + '%');
              const t = title && title(code);
              if (t) el.setAttribute('title', t);
            }
          });
        });
      }
    };
    if (opts.layout) build(opts.layout);
    return api;
  };

  // ── Hands (palms down, fingers up). Each finger tinted by its zone; the active one is solid. ──
  TT.Hands = function () {
    const svg = s('svg', { viewBox: '0 0 520 150', class: 'hands', role: 'img', 'aria-label': 'Hands: the colored finger presses the next key' });
    const F = {};
    const fingers = [
      // [id, x, top, width, height]
      ['lp', 66, 50, 24, 62], ['lr', 95, 26, 26, 82], ['lm', 126, 14, 26, 92], ['li', 157, 26, 26, 82]
    ];
    function finger(id, x, y, w, hgt) {
      const zone = TT.FINGERS[id].zone;
      const el = s('rect', { x, y, width: w, height: hgt, rx: w / 2, class: 'fing', 'data-zone': zone, 'data-f': id });
      F[id] = F[id] || []; F[id].push(el);
      return el;
    }
    const g = s('g');
    fingers.forEach(([id, x, y, w, hh]) => g.append(finger(id, x, y, w, hh)));
    // right hand mirrored
    const mirror = { lp: 'rp', lr: 'rr', lm: 'rm', li: 'ri' };
    fingers.forEach(([id, x, y, w, hh]) => g.append(finger(mirror[id], 520 - x - w, y, w, hh)));
    // thumbs: they come out of the inner side of each palm and point up and inward; the palm covers their base
    const tl = s('rect', { x: 168, y: 72, width: 26, height: 64, rx: 13, class: 'fing thumb', 'data-zone': 'thumb', transform: 'rotate(38 181 130)' });
    const tr = s('rect', { x: 326, y: 72, width: 26, height: 64, rx: 13, class: 'fing thumb', 'data-zone': 'thumb', transform: 'rotate(-38 339 130)' });
    F.th = [tl, tr];
    g.append(tl, tr);
    // palms
    g.append(s('rect', { x: 62, y: 84, width: 125, height: 62, rx: 28, class: 'palm' }));
    g.append(s('rect', { x: 333, y: 84, width: 125, height: 62, rx: 28, class: 'palm' }));
    svg.append(g);
    let on = [];
    return {
      el: svg,
      set(ids) {
        on.forEach(el => el.classList.remove('on')); on = [];
        (ids || []).forEach(id => (F[id] || []).forEach(el => { el.classList.add('on'); on.push(el); }));
      }
    };
  };

  // ── Line chart with hover tooltip (single series, one axis) ──
  TT.lineChart = function (opts) {
    const values = opts.values;
    const W = 640, H = opts.height || 200, padL = 40, padR = 14, padT = 14, padB = 26;
    const wrap = h('div', { class: 'chart' });
    if (!values.length) return wrap;
    let max = Math.max.apply(null, values.concat([opts.minMax || 10]));
    let min = opts.min != null ? opts.min : 0;
    const step = opts.step || niceStep((max - min) / 4);
    max = Math.ceil(max / step) * step;
    min = Math.floor(min / step) * step;
    const x = (i) => padL + (values.length === 1 ? (W - padL - padR) / 2 : i * (W - padL - padR) / (values.length - 1));
    const y = (v) => padT + (1 - (v - min) / (max - min || 1)) * (H - padT - padB);
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img', 'aria-label': opts.label || 'chart' });
    for (let v = min; v <= max + 1e-9; v += step) {
      svg.append(s('line', { x1: padL, x2: W - padR, y1: y(v), y2: y(v), class: v === min ? 'axis' : 'grid' }));
      svg.append(s('text', { x: padL - 8, y: y(v) + 4, class: 'tick', 'text-anchor': 'end' }, opts.fmtTick ? opts.fmtTick(v) : String(v)));
    }
    const pts = values.map((v, i) => [x(i), y(v)]);
    if (pts.length > 1) {
      const area = 'M' + pts[0][0] + ',' + y(min) + ' L' + pts.map(p => p.join(',')).join(' L') + ' L' + pts[pts.length - 1][0] + ',' + y(min) + ' Z';
      svg.append(s('path', { d: area, class: 'area' }));
      svg.append(s('path', { d: 'M' + pts.map(p => p.join(',')).join(' L'), class: 'line' }));
    }
    pts.forEach((p, i) => svg.append(s('circle', { cx: p[0], cy: p[1], r: i === pts.length - 1 ? 5 : 3.5, class: 'dot' + (i === pts.length - 1 ? ' last' : '') })));
    if (opts.xLabels) {
      const lbls = opts.xLabels;
      [0, values.length - 1].forEach(i => {
        if (lbls[i] == null) return;
        svg.append(s('text', { x: x(i), y: H - 6, class: 'tick', 'text-anchor': i === 0 ? 'start' : 'end' }, lbls[i]));
      });
    }
    const cross = s('line', { y1: padT, y2: H - padB, class: 'cross', visibility: 'hidden' });
    svg.append(cross);
    const tip = h('div', { class: 'chart-tip', hidden: true });
    const hit = s('rect', { x: padL, y: 0, width: W - padL - padR, height: H, fill: 'transparent' });
    svg.append(hit);
    const showAt = (clientX) => {
      const r = svg.getBoundingClientRect();
      const vx = (clientX - r.left) / r.width * W;
      let best = 0, bd = Infinity;
      pts.forEach((p, i) => { const d = Math.abs(p[0] - vx); if (d < bd) { bd = d; best = i; } });
      cross.setAttribute('x1', pts[best][0]); cross.setAttribute('x2', pts[best][0]); cross.setAttribute('visibility', 'visible');
      tip.hidden = false;
      tip.textContent = '';
      tip.append(opts.tip ? opts.tip(best) : String(values[best]));
      const px = pts[best][0] / W * r.width;
      tip.style.left = Math.max(0, Math.min(r.width - 170, px - 85)) + 'px';
      tip.style.top = Math.max(0, pts[best][1] / H * r.height - 64) + 'px';
    };
    hit.addEventListener('pointermove', e => showAt(e.clientX));
    hit.addEventListener('pointerleave', () => { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); });
    wrap.append(svg, tip);
    return wrap;
  };

  TT.barChart = function (opts) {
    const values = opts.values;
    const W = opts.width || 640, H = opts.height || 170, padL = 40, padR = 14, padT = 14, padB = 26;
    const wrap = h('div', { class: 'chart' });
    let max = Math.max.apply(null, values.concat([opts.goal || 0, 5]));
    const step = niceStep(max / 3);
    max = Math.ceil(max / step) * step;
    const y = (v) => padT + (1 - v / max) * (H - padT - padB);
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img', 'aria-label': opts.label || 'chart' });
    for (let v = 0; v <= max + 1e-9; v += step) {
      svg.append(s('line', { x1: padL, x2: W - padR, y1: y(v), y2: y(v), class: v === 0 ? 'axis' : 'grid' }));
      svg.append(s('text', { x: padL - 8, y: y(v) + 4, class: 'tick', 'text-anchor': 'end' }, String(v)));
    }
    const n = values.length, slot = (W - padL - padR) / n, bw = Math.min(26, slot - 6);
    const tip = h('div', { class: 'chart-tip', hidden: true });
    values.forEach((v, i) => {
      const bx = padL + i * slot + (slot - bw) / 2;
      const top = y(v);
      const hgt = Math.max(0, y(0) - top);
      if (hgt > 0) {
        const r = Math.min(4, bw / 2, hgt);
        const d = `M${bx},${y(0)} V${top + r} Q${bx},${top} ${bx + r},${top} H${bx + bw - r} Q${bx + bw},${top} ${bx + bw},${top + r} V${y(0)} Z`;
        svg.append(s('path', { d, class: 'bar' + (opts.goal && v >= opts.goal ? ' met' : '') }));
      }
      const hitR = s('rect', { x: padL + i * slot, y: padT, width: slot, height: H - padT - padB, fill: 'transparent' });
      hitR.addEventListener('pointerenter', () => {
        tip.hidden = false; tip.textContent = '';
        tip.append(opts.tip ? opts.tip(i) : String(v));
        const rr = svg.getBoundingClientRect();
        tip.style.left = Math.max(0, Math.min(rr.width - 170, (bx + bw / 2) / W * rr.width - 85)) + 'px';
        tip.style.top = Math.max(0, top / H * rr.height - 60) + 'px';
      });
      hitR.addEventListener('pointerleave', () => { tip.hidden = true; });
      svg.append(hitR);
      if (opts.xLabels && (i === 0 || i === n - 1 || i === Math.floor(n / 2))) {
        svg.append(s('text', { x: bx + bw / 2, y: H - 6, class: 'tick', 'text-anchor': 'middle' }, opts.xLabels[i]));
      }
    });
    if (opts.goal) {
      svg.append(s('line', { x1: padL, x2: W - padR, y1: y(opts.goal), y2: y(opts.goal), class: 'goal' }));
      svg.append(s('text', { x: W - padR, y: y(opts.goal) - 6, class: 'tick goal-label', 'text-anchor': 'end' }, 'goal ' + opts.goal + ' min'));
    }
    wrap.append(svg, tip);
    return wrap;
  };

  function niceStep(raw) {
    if (raw <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  }

  // ── Sound (Web Audio; created on the first key press) ──
  TT.Sound = {
    ctx: null,
    ensure() {
      if (this.ctx) return this.ctx;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      } catch (e) { this.ctx = null; }
      return this.ctx;
    },
    tone(freq, dur, type, vol) {
      const ctx = this.ensure();
      if (!ctx) return;
      try {
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.value = freq;
        const t = ctx.currentTime;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + dur + 0.02);
      } catch (e) { /* audio refused */ }
    },
    click() { this.tone(1900, 0.025, 'triangle', 0.035); },
    // A metronome beat at an exact audio time (accent = first beat of a 5-key "word").
    beat(at, accent) {
      const ctx = this.ensure();
      if (!ctx) return;
      try {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'square'; o.frequency.value = accent ? 1560 : 1040;
        const vol = accent ? 0.09 : 0.05;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(vol, at + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
        o.connect(g); g.connect(ctx.destination);
        o.start(at); o.stop(at + 0.05);
      } catch (e) { /* audio refused */ }
    },
    error() { this.tone(170, 0.12, 'sine', 0.12); }
  };

  // ── Toast ──
  let toastTimer = null;
  TT.toast = function (msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  };

  // ── Dialog (in-page; the frame blocks confirm/alert) ──
  TT.dialog = function (opts) {
    return new Promise(resolve => {
      const root = document.getElementById('dialog-root');
      const prev = document.activeElement;
      const close = (val) => { root.textContent = ''; root.hidden = true; document.removeEventListener('keydown', onKey, true); if (prev && prev.focus) prev.focus(); resolve(val); };
      const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(false); } };
      const okBtn = h('button', { class: 'btn ' + (opts.danger ? 'danger' : 'primary'), type: 'button', onclick: () => close(opts.getValue ? opts.getValue() : true) }, opts.ok || 'OK');
      const box = h('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dlg-title' },
        h('h2', { id: 'dlg-title', class: 'dlg-title' }, opts.title),
        opts.body ? (opts.body.nodeType ? opts.body : h('p', { class: 'muted' }, opts.body)) : null,
        h('div', { class: 'dlg-actions' },
          h('button', { class: 'btn ghost', type: 'button', onclick: () => close(false) }, opts.cancel || 'Cancel'),
          okBtn));
      root.textContent = '';
      root.hidden = false;
      root.append(h('div', { class: 'scrim', onclick: () => close(false) }), box);
      document.addEventListener('keydown', onKey, true);
      setTimeout(() => (box.querySelector('textarea, input') || okBtn).focus(), 0);
    });
  };
})(globalThis.TT = globalThis.TT || {});
