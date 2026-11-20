// Taller: "El taller de Juan Manuel". Armar una boca de pared real del TP en 4 estaciones,
// cada una con una herramienta del presupuesto (p.11). Todo sale de tp.js.
// Guiños al TP: D5–D6 del Gantt ("Conectar y rotular las tomas"), la regla de no crimpear
// fichas sobre cable rígido (p.5) y que el tester de luces no certifica (p.7).
import { T568B, OUTLETS, BUDGET, GANTT, TEXT, ars } from '../data/tp.js';
import { bus } from '../core/bus.js';

const TOOL = {
  kit: BUDGET.herramientas[0], // Kit: crimpeadora, pelacables y tester
  impacto: BUDGET.herramientas[1], // Herramienta de impacto Proskit CP-3151
  rotuladora: BUDGET.herramientas[3], // Rotuladora Brother PT-H110
};
const STEPS = [
  { k: 'pelar', t: 'Pelar', tool: TOOL.kit, toolNote: 'pelacables' },
  { k: 'terminar', t: 'Terminar', tool: TOOL.impacto },
  { k: 'rotular', t: 'Rotular', tool: TOOL.rotuladora },
  { k: 'probar', t: 'Probar', tool: TOOL.kit, toolNote: 'tester' },
];
const GANTT_TASK = GANTT.tasks.find((t) => t.t.startsWith('Conectar y rotular'));
const BEST_KEY = 'alvarez.taller.best';
const cert = TEXT.certificar.split('. '); // [0] certificador, [1] informe, [2] tester de luces
const STRIP = { min: 20, max: 30, top: 60 }; // mm de cubierta a retirar (zona correcta)

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const wireSw = (w, cls = '') => `<i class="tw-sw ${w.stripe ? 'st' : ''} ${cls}" style="--c:${w.c}"></i>`;
const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const readBest = () => { try { return JSON.parse(localStorage.getItem(BEST_KEY) || 'null'); } catch { return null; } };
const writeBest = (v) => { try { localStorage.setItem(BEST_KEY, JSON.stringify(v)); } catch {} };
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// distractores plausibles para la etiqueta de una boca
function labelOptions(o) {
  const opts = [{ v: o.label, ok: true, why: `Correcto: ${o.label} = gabinete ${o.pp === 'PP1' ? 'R1' : 'R2'}, panel ${o.pp}, boca ${String(o.n).padStart(2, '0')}. Va igual en la pared y en el panel.` }];
  const sibling = OUTLETS.find((q) => q.room === o.room && q.dev !== o.dev && q.pp === o.pp);
  if (sibling) opts.push({ v: sibling.label, why: `${sibling.label} es la boca de ${sibling.dev} (${sibling.place}). Misma sala, otro cable.` });
  const otherPP = o.pp === 'PP1' ? 'PP2' : 'PP1';
  const twin = OUTLETS.find((q) => q.pp === otherPP && q.n === o.n);
  const twinLabel = `${otherPP === 'PP1' ? 'R1' : 'R2'}-${otherPP}-${String(o.n).padStart(2, '0')}`;
  opts.push({ v: twinLabel, why: twin ? `${twinLabel} existe, pero es la boca de ${twin.dev} en el gabinete ${otherPP === 'PP1' ? 'R1' : 'R2'}.` : `${otherPP} no tiene esa boca cableada: es una reserva.` });
  opts.push({ v: `${o.dev}-${o.sw}-${o.port}`, why: 'El código identifica el cableado (gabinete-panel-boca), no el equipo ni el puerto del switch: el equipo puede cambiar, la boca no.' });
  return shuffle(opts.slice(0, 4));
}

export function createTaller() {
  const el = document.createElement('div');
  el.className = 'tw scroll';
  let o, step, errors, t0, timer, stripMM, slots, pool, sel, mapping, finished;

  function newRound(outlet) {
    o = outlet || OUTLETS.find((q) => q.dev === 'PC03');
    step = 0; errors = 0; t0 = 0; finished = false; stripMM = 0;
    slots = Array(8).fill(null); pool = shuffle(T568B.map((w) => w.n)); sel = null; mapping = null;
    render();
  }
  const elapsed = () => (t0 ? (performance.now() - t0) / 1000 : 0);
  function startClock() {
    if (t0) return;
    t0 = performance.now();
    clearInterval(timer);
    timer = setInterval(() => { if (!el.isConnected || finished) return; const c = el.querySelector('[data-clock]'); if (c) c.textContent = fmtTime(elapsed()); }, 500);
  }
  const fail = () => { errors++; const e = el.querySelector('[data-err]'); if (e) e.textContent = errors; };

  function shell(body) {
    const S = STEPS[step] || STEPS[3];
    el.innerHTML = `
      <div class="tw-wrap">
        <header class="tw-head">
          <div>
            <div class="tw-eyebrow">El taller de Juan Manuel · Gantt ${GANTT_TASK ? `D${GANTT_TASK.days[0]}–D${GANTT_TASK.days[1]}` : ''} · ${esc(GANTT_TASK?.t || '')}</div>
            <h2>Armá la boca <span class="mono">${o.label}</span> de ${o.dev}</h2>
            <p class="tw-lead">${esc(o.place)} · ${o.sw}/${o.port} · ${o.m} m de UTP Cat6 rígido. Mediciones, canaletas, cableado y tomas eran tarea de Juan Manuel en el TP: hoy te toca a vos.</p>
          </div>
          <dl class="tw-stats"><div><dt>Tiempo</dt><dd class="mono" data-clock>${fmtTime(elapsed())}</dd></div><div><dt>Errores</dt><dd class="mono" data-err>${errors}</dd></div></dl>
        </header>
        <ol class="tw-steps">${STEPS.map((s, i) => `<li class="${i < step ? 'done' : i === step && !finished ? 'cur' : ''}"><span class="mono">${i + 1}</span>${s.t}</li>`).join('')}</ol>
        <section class="tw-card">
          ${finished ? '' : `<div class="tw-tool"><span>Herramienta</span><b>${esc(S.tool[0])}</b><span class="mono">${ars(S.tool[2])}</span></div>`}
          ${body}
        </section>
      </div>`;
  }

  // ── 1. Pelar ──
  function renderPelar() {
    const W = 560, x0 = 40, mmPx = 6;
    const cut = Math.min(STRIP.top, stripMM) * mmPx;
    const pairs = [[1, 2], [3, 6], [4, 5], [7, 8]];
    const stripSvg = pairs.map((p, i) => {
      const y = 52 + i * 7;
      return p.map((n, k) => { const w = T568B[n - 1]; const yy = y + k * 2.4; const base = `x1="${W - x0 - cut}" y1="${yy}" x2="${W - x0 + 6}" y2="${yy}"`; return (w.stripe ? `<line ${base} stroke="#fff" stroke-width="2.2"/>` : '') + `<line ${base} stroke="${w.c}" stroke-width="2.2" ${w.stripe ? 'stroke-dasharray="4 3"' : ''}/>`; }).join('');
    }).join('');
    shell(`
      <h3>Pelá la cubierta</h3>
      <p class="tw-text">Mantené apretado para retirar la cubierta y soltá en la zona verde: lo justo para que los pares lleguen a la herramienta de impacto sin destrenzar de más.</p>
      <svg class="tw-cable" viewBox="0 0 ${W} 120" role="img" aria-label="Cable UTP Cat6 rígido">
        <rect x="${W - x0 - STRIP.max * mmPx}" y="36" width="${(STRIP.max - STRIP.min) * mmPx}" height="48" class="tw-zone"/>
        <rect x="0" y="44" width="${W - x0 - cut}" height="32" rx="3" class="tw-jacket"/>
        ${stripSvg}
        <line x1="${W - x0 - cut}" y1="30" x2="${W - x0 - cut}" y2="90" class="tw-cutline"/>
        <text x="${W - x0 - cut}" y="24" text-anchor="middle" class="tw-mm">${stripMM.toFixed(0)} mm</text>
      </svg>
      <div class="tw-actions">
        <button class="btn primary tw-hold" data-hold>Mantener para pelar</button>
        <span class="tw-msg" role="status" data-msg></span>
      </div>`);
    const btn = el.querySelector('[data-hold]');
    let raf = 0, last = 0;
    const tick = (now) => { stripMM = Math.min(STRIP.top, stripMM + ((now - last) / 1000) * 16); last = now; renderPelarLive(); raf = requestAnimationFrame(tick); };
    const down = (e) => { e.preventDefault(); startClock(); stripMM = 0; last = performance.now(); btn.setPointerCapture?.(e.pointerId); raf = requestAnimationFrame(tick); };
    const up = () => {
      if (!raf) return;
      cancelAnimationFrame(raf); raf = 0;
      const msg = el.querySelector('[data-msg]');
      if (stripMM < STRIP.min) { fail(); msg.className = 'tw-msg bad'; msg.textContent = `Muy corto (${stripMM.toFixed(0)} mm): los pares no llegan a la herramienta. Probá de nuevo.`; }
      else if (stripMM > STRIP.max) { fail(); msg.className = 'tw-msg bad'; msg.textContent = `Te pasaste (${stripMM.toFixed(0)} mm): demasiado par destrenzado degrada el enlace Cat6. Cortá y probá de nuevo.`; }
      else { msg.className = 'tw-msg ok'; msg.textContent = `${stripMM.toFixed(0)} mm, justo.`; setTimeout(() => { step = 1; render(); }, 650); }
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !raf && !e.repeat) down(e); });
    btn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') up(); });
    function renderPelarLive() {
      const svg = el.querySelector('.tw-cable');
      if (!svg) return;
      const c = Math.min(STRIP.top, stripMM) * mmPx;
      svg.querySelector('.tw-jacket').setAttribute('width', W - x0 - c);
      svg.querySelectorAll('line:not(.tw-cutline)').forEach((l) => l.setAttribute('x1', W - x0 - c));
      const cl = svg.querySelector('.tw-cutline'); cl.setAttribute('x1', W - x0 - c); cl.setAttribute('x2', W - x0 - c);
      const t = svg.querySelector('.tw-mm'); t.setAttribute('x', W - x0 - c); t.textContent = `${stripMM.toFixed(0)} mm`;
    }
  }

  // ── 2. Terminar ──
  let method = null;
  function renderTerminar() {
    if (method !== 'impacto') {
      shell(`
        <h3>¿Cómo terminás el cable rígido en la pared?</h3>
        <p class="tw-text">El cable permanente va de la boca de pared al panel ${o.pp}. Elegí cómo lo terminás.</p>
        <div class="tw-choices">
          <button class="tw-choice" data-m="impacto"><b>Jack RJ45 Cat6 de pared</b><span>Con la herramienta de impacto, en el keystone de la caja de superficie.</span></button>
          <button class="tw-choice" data-m="ficha"><b>Ficha RJ45 macho</b><span>Con la crimpeadora del kit, directo sobre el cable rígido.</span></button>
        </div>
        <span class="tw-msg" role="status" data-msg></span>`);
      return;
    }
    const slotHtml = (i) => {
      const n = slots[i], pin = T568B[i];
      return `<button class="tw-idc ${n ? 'full' : ''} ${sel && !n ? 'target' : ''}" data-slot="${i}" aria-label="Contacto ${i + 1}, código ${esc(pin.name)}${n ? ', con ' + esc(T568B[n - 1].name) : ''}">
        <span class="tw-tab">${wireSw(pin, 'tab')}</span>
        <span class="tw-slotwire">${n ? wireSw(T568B[n - 1]) : ''}</span>
        <span class="mono">${i + 1}</span></button>`;
    };
    const left = pool.filter((n) => !slots.includes(n));
    shell(`
      <h3>Terminá en el jack (norma T568B)</h3>
      <p class="tw-text">Cada contacto del keystone trae la pestaña de color de la norma B. Llevá cada hilo a su contacto: tocá un hilo y después el contacto, o arrastralo. El otro extremo ya está en ${o.pp}-${String(o.n).padStart(2, '0')} con la misma norma.</p>
      <div class="tw-bench">
        <div class="tw-keystone" aria-label="Jack keystone visto de atrás">
          <div class="tw-ks-body"><span class="tw-ks-port"></span><span class="tw-ks-lbl mono">CAT6 · T568B</span></div>
          <div class="tw-ks-row">${[0, 1, 2, 3].map(slotHtml).join('')}</div>
          <div class="tw-ks-row">${[4, 5, 6, 7].map(slotHtml).join('')}</div>
        </div>
        <div class="tw-pool" aria-label="Hilos sin terminar">
          ${left.length ? left.map((n) => `<button class="tw-wire ${sel === n ? 'sel' : ''}" data-w="${n}">${wireSw(T568B[n - 1])}<span>${esc(T568B[n - 1].name)}</span></button>`).join('') : '<span class="tw-text">Todos los hilos en su contacto.</span>'}
        </div>
      </div>
      <div class="tw-actions">
        <button class="btn primary" data-a="punch" ${left.length ? 'disabled' : ''}>Golpear con la herramienta</button>
        <button class="btn" data-a="clear">Sacar todos</button>
        <span class="tw-msg" role="status" data-msg></span>
      </div>`);
  }
  function place(n, i) {
    const prev = slots.indexOf(n); if (prev >= 0) slots[prev] = null;
    if (slots[i] && prev >= 0) slots[prev] = slots[i]; // intercambio
    slots[i] = n; sel = null; renderTerminar();
  }

  // ── 3. Rotular ──
  let labels = null;
  function renderRotular() {
    labels ||= labelOptions(o);
    shell(`
      <h3>Rotulá los dos extremos</h3>
      <p class="tw-text">${esc(TEXT.tendido[2].split('. ')[0])}. ¿Qué etiqueta imprimís para este cable?</p>
      <div class="tw-labels">${labels.map((l, i) => `<button class="tw-tape" data-l="${i}"><span class="mono">${esc(l.v)}</span></button>`).join('')}</div>
      <span class="tw-msg" role="status" data-msg></span>`);
  }

  // ── 4. Probar ──
  function renderProbar(run = false) {
    // pin del lado del panel (w) → pin del jack donde quedó ese hilo
    mapping = T568B.map((w) => slots.indexOf(w.n) + 1);
    const leds = (side) => T568B.map((_, i) => `<span class="tw-led" data-${side}="${i}"><i></i><b class="mono">${i + 1}</b></span>`).join('');
    shell(`
      <h3>Probá con el tester de luces</h3>
      <p class="tw-text">La unidad principal va en ${o.pp}-${String(o.n).padStart(2, '0')} y la remota en la boca de pared. Las luces tienen que prender en orden, del 1 al 8, en las dos unidades.</p>
      <div class="tw-tester">
        <div class="tw-unit"><span class="tw-unit-t">Principal · ${o.pp}</span><div class="tw-leds">${leds('m')}</div></div>
        <div class="tw-unit"><span class="tw-unit-t">Remota · pared</span><div class="tw-leds">${leds('r')}</div></div>
      </div>
      <div class="tw-actions">
        <button class="btn primary" data-a="test">Probar</button>
        <span class="tw-msg" role="status" data-msg></span>
      </div>`);
    if (run) runTest();
  }
  function runTest() {
    const btn = el.querySelector('[data-a="test"]');
    btn.disabled = true;
    const bad = [];
    T568B.forEach((_, i) => {
      setTimeout(() => {
        if (!el.isConnected) return;
        el.querySelectorAll('.tw-led.on').forEach((l) => l.classList.remove('on'));
        const r = mapping[i] - 1, ok = r === i;
        el.querySelector(`[data-m="${i}"]`)?.classList.add('on', ok ? 'g' : 'x');
        el.querySelector(`[data-r="${r}"]`)?.classList.add('on', ok ? 'g' : 'x');
        if (!ok) bad.push([i + 1, r + 1]);
        if (i === 7) setTimeout(() => finishTest(bad), 420);
      }, 380 * i + 200);
    });
  }
  function finishTest(bad) {
    if (!el.isConnected) return;
    el.querySelectorAll('.tw-led').forEach((l) => l.classList.remove('on', 'g', 'x'));
    const msg = el.querySelector('[data-msg]');
    if (bad.length) {
      // dejar marcados los pares cruzados en ambas unidades
      for (const [m, r] of bad) { el.querySelector(`[data-m="${m - 1}"]`)?.classList.add('on', 'x'); el.querySelector(`[data-r="${r - 1}"]`)?.classList.add('on', 'x'); }
      fail();
      msg.className = 'tw-msg bad';
      msg.innerHTML = `Pares cruzados: ${bad.map(([a, b]) => `<span class="mono">${a}→${b}</span>`).join(' · ')}. Volvé a la herramienta de impacto y corregí el jack.`;
      const act = el.querySelector('.tw-actions');
      act.insertAdjacentHTML('beforeend', '<button class="btn" data-a="back">Volver a terminar el jack</button>');
      el.querySelector('[data-a="test"]').disabled = false;
      return;
    }
    finished = true;
    const secs = elapsed();
    clearInterval(timer);
    const score = Math.max(0, Math.round(1000 - secs * 4 - errors * 120));
    const best = readBest();
    const isBest = !best || score > best.score;
    if (isBest) writeBest({ score, secs: Math.round(secs), label: o.label });
    bus.emit('toast', { text: `Boca ${o.label} armada y probada`, kind: 'ok' });
    shell(`
      <div class="tw-done">
        <h3>Boca ${o.label} lista</h3>
        <dl class="tw-score">
          <div><dt>Tiempo</dt><dd class="mono">${fmtTime(secs)}</dd></div>
          <div><dt>Errores</dt><dd class="mono">${errors}</dd></div>
          <div><dt>Puntaje</dt><dd class="mono">${score}</dd></div>
          <div><dt>Mejor</dt><dd class="mono">${isBest ? `${score} · nuevo` : `${best.score}`}</dd></div>
        </dl>
        <div class="tw-lesson">
          <b>Lo que dice el TP</b>
          <p>${esc(cert[2])}.</p>
          <p class="tw-text">Para certificar hace falta ${esc(cert[0].charAt(0).toLowerCase() + cert[0].slice(1))}. ${esc(cert[1])}.</p>
        </div>
        <div class="tw-actions">
          <button class="btn primary" data-a="next">Siguiente boca</button>
          <button class="btn" data-a="again">Repetir ${o.label}</button>
        </div>
      </div>`);
  }

  function render() {
    labels = step === 2 ? labels : null;
    if (finished) return;
    if (step === 0) renderPelar();
    else if (step === 1) renderTerminar();
    else if (step === 2) renderRotular();
    else renderProbar();
  }

  // ── eventos ──
  el.addEventListener('click', (e) => {
    const t = e.target;
    const m = t.closest('[data-m]'), w = t.closest('[data-w]'), s = t.closest('[data-slot]'), l = t.closest('[data-l]'), a = t.closest('[data-a]');
    if (m && step === 1) {
      const msg = el.querySelector('[data-msg]');
      if (m.dataset.m === 'ficha') { fail(); msg.className = 'tw-msg bad'; msg.textContent = 'No. El TP es claro: "No se colocan fichas macho comunes directamente sobre el cable rígido". La crimpeadora es para preparar o reparar cables de conexión; el rígido termina en un jack con la herramienta de impacto.'; m.classList.add('wrong'); }
      else { method = 'impacto'; renderTerminar(); }
      return;
    }
    if (w && !dragMoved) { sel = sel === +w.dataset.w ? null : +w.dataset.w; renderTerminar(); return; }
    if (s && !dragMoved) {
      const i = +s.dataset.slot;
      if (sel) place(sel, i);
      else if (slots[i]) { slots[i] = null; renderTerminar(); }
      return;
    }
    if (l) {
      const opt = labels[+l.dataset.l];
      const msg = el.querySelector('[data-msg]');
      el.querySelectorAll('.tw-tape').forEach((b) => b.classList.remove('wrong', 'right'));
      l.classList.add(opt.ok ? 'right' : 'wrong');
      msg.className = 'tw-msg ' + (opt.ok ? 'ok' : 'bad');
      msg.textContent = opt.why;
      if (opt.ok) setTimeout(() => { step = 3; labels = null; render(); }, 1300); else fail();
      return;
    }
    if (!a) return;
    const act = a.dataset.a;
    if (act === 'punch') { step = 2; render(); }
    else if (act === 'clear') { slots = Array(8).fill(null); sel = null; renderTerminar(); }
    else if (act === 'test') runTest();
    else if (act === 'back') { step = 1; method = 'impacto'; renderTerminar(); }
    else if (act === 'next') { const others = OUTLETS.filter((q) => q.dev !== o.dev); method = null; newRound(others[Math.floor(Math.random() * others.length)]); }
    else if (act === 'again') { method = null; newRound(o); }
  });

  // arrastrar hilos (mouse y touch) a los contactos
  let drag = null, dragMoved = false;
  el.addEventListener('pointerdown', (e) => {
    const w = e.target.closest('[data-w]');
    if (!w || step !== 1) return;
    dragMoved = false;
    drag = { n: +w.dataset.w, x: e.clientX, y: e.clientY, ghost: null };
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!dragMoved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    if (!dragMoved) {
      dragMoved = true;
      drag.ghost = document.createElement('div');
      drag.ghost.className = 'tw-ghost';
      drag.ghost.innerHTML = `${wireSw(T568B[drag.n - 1])}<span>${esc(T568B[drag.n - 1].name)}</span>`;
      document.body.appendChild(drag.ghost);
    }
    drag.ghost.style.transform = `translate(${e.clientX + 8}px, ${e.clientY + 8}px)`;
    const s = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-slot]');
    el.querySelectorAll('.tw-idc.hover').forEach((x) => x.classList.remove('hover'));
    s?.classList.add('hover');
  });
  addEventListener('pointerup', (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.ghost) {
      d.ghost.remove();
      const s = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-slot]');
      if (s && el.contains(s)) place(d.n, +s.dataset.slot);
      setTimeout(() => (dragMoved = false), 0);
    }
  });

  newRound();
  return { el };
}
