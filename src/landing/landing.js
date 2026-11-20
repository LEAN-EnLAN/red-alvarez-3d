// Landing · Red Alvarez 3D. Vanilla, sin dependencias: todo el contenido sale de src/data/tp.js.
import './landing.css';
import { ROOMS, VLANS, OUTLETS, BUDGET, GANTT, PHONES, WAN, DEVICES, FIBER_ROUTE, META, DESKS, MEETING, ars } from '../data/tp.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const money0 = (n) => '$' + Math.round(n).toLocaleString('es-AR');
const IO = 'IntersectionObserver' in window;

// fn una sola vez cuando el elemento entra en pantalla
const once = (el, fn, margin = '0px 0px -12% 0px') => {
  if (!el) return;
  if (!IO) return fn(el);
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(el); } }, { rootMargin: margin });
  io.observe(el);
};

/* ── título tipeado: el texto completo ocupa su lugar desde el principio (sin saltos de layout) ── */
function typeIn(el, speed) {
  const full = el.textContent;
  const done = document.createTextNode(''), rest = document.createElement('span'), caret = document.createElement('span');
  rest.className = 'ty-rest'; caret.className = 'ty-caret'; caret.setAttribute('aria-hidden', 'true');
  el.setAttribute('aria-label', full);
  el.replaceChildren(done, caret, rest);
  const t0 = performance.now();
  const tick = (now) => {
    const k = Math.min(full.length, Math.floor((now - t0) / speed));
    done.nodeValue = full.slice(0, k); rest.textContent = full.slice(k);
    if (k < full.length) requestAnimationFrame(tick);
    else setTimeout(() => { el.textContent = full; el.removeAttribute('aria-label'); }, 1600);
  };
  requestAnimationFrame(tick);
}
if (!RM) $$('[data-type]').forEach((el) => typeIn(el, 34));

/* ── contadores ── */
const countUp = (el, to, fmt = (v) => Math.round(v).toLocaleString('es-AR'), dur = 1000, from = 0) => {
  if (RM) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const step = (now) => { const t = clamp((now - t0) / dur); el.textContent = fmt(from + (to - from) * ease(t)); if (t < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
};
$$('[data-count]').forEach((el) => once(el, () => countUp(el, +el.dataset.count)));

/* ── aparición de figuras ── */
if (!RM && IO) {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.shots .plate, .dec-f, .figures, .chain').forEach((el) => { el.classList.add('rv'); io.observe(el); });
}

/* ── índice: marca la sección visible ── */
if (IO) {
  const links = new Map($$('.bar nav a').map((a) => [a.hash.slice(1), a]));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a, id) => a.classList.toggle('on', id === e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

/* ── 02 · la red, desarmada: el scroll mueve el video ── */
const VL = Object.entries(VLANS);
const pp1 = OUTLETS.filter((o) => o.pp === 'PP1').length;
const LAYERS = [
  { k: 'Internet', h: 'Dos proveedores, una salida.', p: `${WAN[0].name} ${WAN[0].speed} es la principal; ${WAN[1].name} ${WAN[1].speed} queda de respaldo. Ambos entran al rack R1, en la sala técnica.`, c: [[`WAN1 · ${WAN[0].name}`, '#141413'], [`WAN2 · ${WAN[1].name}`, '#7c7a73']] },
  { k: 'ER605', h: 'Un router que separa todo.', p: 'Es la puerta .1 de cada VLAN, reparte las dos conexiones y recibe la VPN WireGuard de los cuatro externos.', c: [['7 VLANs', '#141413'], ['Dual WAN', '#141413'], ['VPN', VLANS[70].color]] },
  { k: 'SW1 · SW2', h: 'Dos switches y 30 m de fibra.', p: 'SW1 (24 puertos PoE+) en la sala técnica y SW2 (8 puertos PoE+) en escritorios, unidos por fibra monomodo: 25 m de recorrido y 5 de reserva.', c: [['R1 · 12U', '#141413'], ['R2 · 6U', '#141413'], ['Fibra LC', '#ff6a13']] },
  { k: `${OUTLETS.length} bocas`, h: 'Cada cable, a su puerto.', p: `${OUTLETS.length} bocas Cat6 T568B y ${OUTLETS.reduce((s, o) => s + o.m, 0)} m de cable por canaletas y cielorraso, rotuladas del panel a la placa.`, c: [[`PP1 · ${pp1}`, VLANS[20].color], [`PP2 · ${OUTLETS.length - pp1}`, VLANS[20].color], ['Cat6', VLANS[30].color]] },
  { k: 'Puestos', h: 'Personas, teléfonos y Wi-Fi.', p: '11 PCs, 7 teléfonos IP alimentados por PoE, 2 impresoras y 2 puntos Wi-Fi 6 con redes separadas para empleados y visitas.', c: [['11 PCs', VLANS[20].color], ['7 internos', VLANS[40].color], ['Wi-Fi visitas', VLANS[50].color]] },
];
const layersEl = $('#layers');
layersEl.innerHTML = LAYERS.map((l, i) => `<li class="layer"><div class="ln"><span>${String(i + 1).padStart(2, '0')} / ${String(LAYERS.length).padStart(2, '0')}</span><span>${esc(l.k)}</span></div><h3>${esc(l.h)}</h3><p>${esc(l.p)}</p><div class="keys">${l.c.map(([t, c]) => `<span><i style="background:${c}"></i>${esc(t)}</span>`).join('')}</div></li>`).join('');
const layerEls = $$('.layer', layersEl);
const ex = $('#red'), bar = $('#ex-bar'), video = $('.ex-video');
let exP = -1, vReady = false, exActive = -2, exVisible = !IO, exRaf = 0, seekWant = -1;
// un seek por vez: mientras el video busca, se guarda el último pedido y se aplica al terminar
const seek = (t) => { if (video.seeking) seekWant = t; else if (Math.abs(video.currentTime - t) > 0.004) video.currentTime = t; };
video.addEventListener('seeked', () => { if (seekWant >= 0) { const t = seekWant; seekWant = -1; seek(t); } });
// primera mitad del scroll: la oficina se parte. Segunda: con el hueco abierto, las cinco capas.
const SPLIT = 0.42;
function exRender() {
  const r = ex.getBoundingClientRect();
  const p = clamp(-r.top / Math.max(1, r.height - innerHeight));
  if (Math.abs(p - exP) < 0.0004) return;
  exP = p;
  bar.style.width = (p * 100).toFixed(1) + '%';
  const k = clamp((p - SPLIT + 0.06) / (1 - SPLIT + 0.04));
  const active = p < SPLIT - 0.06 ? -1 : Math.min(LAYERS.length - 1, Math.floor(k * LAYERS.length));
  if (active !== exActive) { exActive = active; layerEls.forEach((el, i) => el.classList.toggle('on', i === active)); ex.classList.toggle('open', active >= 0); }
  if (vReady && video.duration) seek(clamp(p / SPLIT) * (video.duration - 0.02));
}
const exReq = () => { if (exVisible && !exRaf) exRaf = requestAnimationFrame(() => { exRaf = 0; exRender(); }); };
exRender();
addEventListener('scroll', exReq, { passive: true });
addEventListener('resize', () => { exP = -1; exReq(); }, { passive: true });
if (IO) new IntersectionObserver((es) => { exVisible = es[0].isIntersecting; exReq(); }).observe(ex);
// el video se pide recién cuando la sección está cerca; mientras tanto, el póster (primer cuadro)
once(ex, () => {
  video.addEventListener('loadeddata', () => { vReady = true; video.classList.add('ready'); exP = -1; exReq(); }, { once: true });
  video.src = video.dataset.src;
  video.preload = 'auto';
  video.load();
}, '80% 0px');

/* ── 3.1 · plano ── */
const plan = $('#plan'), planCap = $('#plan-cap');
const planDefault = planCap.innerHTML;
const S = 10;
const short = { escritorios: 'Escritorios', reunion: 'Reunión', tecnica: 'Técnica', circulacion: 'Circulación', pasillo: '' };
// una marca por equipo conectado, en su puesto real; color = VLAN de la boca
const posOf = (dev) => {
  const d = DESKS.find((x) => x.pc === dev || x.tel === dev);
  if (d) return d.tel === dev ? [d.pos[0] + 0.45, d.pos[1] + 0.05] : d.pos;
  if (dev === MEETING.tel) return MEETING.telPos;
  return DEVICES[dev]?.pos;
};
const jacks = OUTLETS.map((o) => {
  const p = posOf(o.dev);
  if (!p) return '';
  const c = typeof o.vlan === 'number' ? VLANS[o.vlan].color : VLANS[10].color;
  return `<circle class="jk" cx="${(p[0] * S).toFixed(1)}" cy="${(p[1] * S).toFixed(1)}" r="1.5" fill="${c}"/>`;
}).join('');
plan.innerHTML = ROOMS.map((r) => {
  const w = (r.x1 - r.x0) * S, h = (r.z1 - r.z0) * S;
  const lab = short[r.id] ?? r.name;
  return `<rect class="rm" x="${r.x0 * S}" y="${r.z0 * S}" width="${w}" height="${h}" data-room="${r.id}" tabindex="0" aria-label="${esc(r.name)}"/>${lab && w > 14 ? `<text class="rl" x="${r.x0 * S + 2.2}" y="${r.z0 * S + 5}">${esc(lab)}</text>` : ''}`;
}).join('') +
  `<polyline class="fb" points="${FIBER_ROUTE.map(([x, z]) => `${x * S},${z * S}`).join(' ')}"/>` + jacks +
  ['R1', 'R2'].map((k) => { const [x, z] = DEVICES[k].pos; return `<rect class="rk" x="${x * S - 2.6}" y="${z * S - 2.6}" width="5.2" height="5.2"/><text class="rkt" x="${x * S - 2.6}" y="${z * S + (z > 6 ? -4.2 : 8)}">${k}</text>`; }).join('');
const showRoom = (id) => {
  const r = ROOMS.find((x) => x.id === id);
  const os = OUTLETS.filter((o) => o.room === id);
  $$('.rm', plan).forEach((el) => el.classList.toggle('on', el.dataset.room === id));
  planCap.innerHTML = `<b>${esc(r.name)}</b> · ${((r.x1 - r.x0) * (r.z1 - r.z0)).toFixed(0)} m² · ${os.length ? `${os.length} boca${os.length > 1 ? 's' : ''}: <code>${os.map((o) => o.dev).join(' ')}</code>` : 'sin bocas'}`;
};
plan.addEventListener('pointerover', (e) => { const id = e.target.dataset?.room; if (id) showRoom(id); });
plan.addEventListener('focusin', (e) => { const id = e.target.dataset?.room; if (id) showRoom(id); });
plan.addEventListener('pointerleave', () => { planCap.innerHTML = planDefault; $$('.rm', plan).forEach((el) => el.classList.remove('on')); });

/* ── 3.2 · VLANs ── */
$('#vlans tbody').innerHTML = VL.map(([id, v]) => `<tr><td><i style="background:${v.color}"></i>${id}</td><td>${esc(v.name.replace('Acceso remoto · ', ''))}</td><td>${v.net}</td><td>${esc(v.devices)}</td></tr>`).join('');

/* ── 3.3 · doble internet ── */
const wan = $('#wan'), cut = $('#cut-claro'), wanNote = $('#wan-note');
const node = (cls, x, y, w, t, sub) => `<g class="nd ${cls}"><rect x="${x - w / 2}" y="${y - 18}" width="${w}" height="36"/><text x="${x}" y="${y - 2}" text-anchor="middle" font-weight="600" font-size="12.5">${t}</text><text x="${x}" y="${y + 11}" text-anchor="middle" font-size="9.5" opacity=".7">${sub}</text></g>`;
wan.innerHTML = `<path id="w1" d="M96 36 C 130 36, 120 75, 160 75" class="wl"/><path id="w2" d="M96 114 C 130 114, 120 75, 160 75" class="wl"/><path id="w3" d="M200 75 L 240 75" class="wl live"/>
<circle r="3.2" fill="#ff6a13" class="pk"><animateMotion dur="1.4s" repeatCount="indefinite"><mpath href="#w1"/></animateMotion></circle>
${node('n1', 50, 36, 92, WAN[0].name, `${WAN[0].speed} · WAN1`)}${node('n2', 50, 114, 92, WAN[1].name, `${WAN[1].speed} · WAN2`)}
${node('dark', 180, 75, 52, 'ER605', 'dual WAN')}${node('', 280, 75, 76, 'Oficina', '7 VLANs')}`;
const setWan = () => {
  const off = cut.checked;
  $('#w1', wan).setAttribute('class', off ? 'wl dead' : 'wl live');
  $('#w2', wan).setAttribute('class', off ? 'wl live' : 'wl');
  $('.n1', wan).classList.toggle('off', off);
  $('mpath', wan).setAttribute('href', off ? '#w2' : '#w1');
  wanNote.textContent = off ? `Todo sale por ${WAN[1].name} ${WAN[1].speed}, sin tocar nada.` : `${WAN[0].name} principal · ${WAN[1].name} en espera`;
};
cut.addEventListener('change', setWan);
setWan();
if (RM) $$('animateMotion', wan).forEach((a) => a.remove());

/* ── 3.5 · internos ── */
const roomName = (id) => (ROOMS.find((r) => r.id === id) || {}).name || id;
$('#exts').innerHTML = Object.entries(PHONES.ext).map(([tel, n]) => {
  const o = OUTLETS.find((x) => x.dev === tel);
  return `<div class="ext"><b>${n}</b><small>${esc(roomName(o ? o.room : '').replace('Sala de ', ''))}</small></div>`;
}).join('') + `<div class="ext pbx"><b>PBX</b><small>${DEVICES.PBX.ip}</small></div>`;

/* ── 04 · presupuesto ── */
const SEGS = [
  { k: 'Equipos', v: BUDGET.total[0][1], c: '#141413' },
  { k: 'Materiales', v: BUDGET.total[1][1], c: '#7c7a73' },
  { k: 'Mano de obra', v: BUDGET.total[2][1], c: '#ff6a13', labor: true },
];
const stack = $('#stack'), legend = $('#legend'), totalEl = $('#total'), laborEl = $('#labor');
stack.innerHTML = SEGS.map((s) => `<i style="background:${s.c};flex-grow:0"></i>`).join('');
const bars = $$('i', stack);
let shown = BUDGET.grandTotal;
function drawBudget(animate) {
  const withLabor = laborEl.checked;
  const sum = SEGS.reduce((a, s) => a + (s.labor && !withLabor ? 0 : s.v), 0);
  SEGS.forEach((s, i) => { bars[i].style.flexGrow = s.labor && !withLabor ? 0 : s.v; });
  legend.innerHTML = SEGS.map((s) => {
    const on = !(s.labor && !withLabor);
    return `<li class="${on ? '' : 'off'}"><i style="background:${s.c}"></i>${s.k} <b>${money0(s.v)}</b>${on ? `<span>${Math.round((s.v / sum) * 100)}%</span>` : ''}</li>`;
  }).join('');
  if (animate) countUp(totalEl, sum, money0, 800, shown); else totalEl.textContent = money0(sum);
  shown = sum;
  totalEl.title = ars(sum);
}
laborEl.addEventListener('change', () => drawBudget(true));
drawBudget(false);
once(stack, () => { bars.forEach((b) => (b.style.flexGrow = 0)); requestAnimationFrame(() => requestAnimationFrame(() => drawBudget(false))); });
$('#budget-note').textContent = `${BUDGET.date} ${BUDGET.totalNote}`;

const rowsEl = $('#rows'), listNote = $('#list-note'), sumEl = $('#ledger-sum');
const TABS = {
  equipos: { rows: BUDGET.equipos.map(([n, s, q, p]) => ({ n, s, q, p })), total: BUDGET.equiposTotal, note: BUDGET.equiposNote },
  materiales: { rows: BUDGET.materiales.map(([n, s, q, p]) => ({ n, s, q, p })), total: BUDGET.materialesTotal, note: BUDGET.materialesNote },
  herramientas: { rows: BUDGET.herramientas.map(([n, s, p]) => ({ n, s, q: 1, p })), total: BUDGET.herramientasTotal, note: BUDGET.herramientasNote + ' No suma al total del cliente.' },
};
function drawRows(tab) {
  const T = TABS[tab];
  const rows = [...T.rows].sort((a, b) => b.q * b.p - a.q * a.p);
  const max = rows[0].q * rows[0].p;
  rowsEl.innerHTML = rows.map((r) => `<tr><td>${esc(r.n)}<small>${r.s === 'Precio estimado' ? 'precio estimado' : esc(r.s)}</small></td><td>${r.q}</td><td>${ars(r.p)}</td><td>${ars(r.q * r.p)}<span class="barcell"><i data-w="${((r.q * r.p) / max * 100).toFixed(1)}"></i></span></td></tr>`).join('');
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.barcell i', rowsEl).forEach((i) => { i.style.width = i.dataset.w + '%'; })));
  sumEl.textContent = `Subtotal ${ars(T.total)}`;
  listNote.textContent = T.note;
}
$$('.tabs button').forEach((b) => b.addEventListener('click', () => {
  $$('.tabs button').forEach((x) => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
  drawRows(b.dataset.tab);
}));
once($('.ledger'), () => drawRows('equipos'), '0px 0px 20% 0px');

/* ── cronograma ── */
const gantt = $('#gantt');
let gh = '<span></span>' + Array.from({ length: 8 }, (_, i) => `<span class="gh">D${i + 1}</span>`).join('');
GANTT.tasks.forEach((t, i) => {
  const row = i + 2;
  gh += `<span class="gt" style="grid-row:${row};grid-column:1">${esc(t.t)}<small>${esc(t.d)}</small></span>`;
  for (let d = 1; d <= 8; d++) gh += `<span class="gc" style="grid-row:${row};grid-column:${d + 1}"></span>`;
  gh += `<span class="gb${t.h ? '' : ' doc'}" style="grid-row:${row};grid-column:${t.days[0] + 1} / ${t.days[1] + 2};transition-delay:${i * 60}ms">${t.h ? t.h + ' h' : 'en cada etapa'}</span>`;
});
gantt.innerHTML = gh;
once(gantt, () => gantt.classList.add('in'));
const ROLES = Object.fromEntries(GANTT.team.split('. ').filter((s) => s.includes(':')).map((s) => s.split(': ')));
$('#team').innerHTML = Object.entries(ROLES).map(([n, d]) => `<li><b>${esc(n)}</b>${esc(d)}</li>`).join('');
$('#crew').innerHTML = META.authors.map((a) => `<li><b>${esc(a)}</b><span>${esc(ROLES[a.split(' ').slice(0, a.startsWith('Juan') ? 2 : 1).join(' ')] || '')}</span></li>`).join('');

/* ── 05 · cómo se hizo: pasos + terminal ── */
const STEPS = [
  ['El TP en PDF', 'La única fuente: plano, tabla de bocas, VLANs y presupuesto.', [['$ open TP-Redes-FINAL.pdf'], ['  plano 16 × 12 m · 23 bocas · 7 VLANs · 2 WAN', 'c']]],
  ['Un archivo de datos', 'Cada número del PDF vive en un solo lugar: tp.js.', [['$ node -p "OUTLETS.length"'], ['23', 'g'], ['$ node -p "BUDGET.grandTotal"'], ['12010536.57', 'g']]],
  ['Escena 3D', 'three.js: equipos según su hoja de datos, cables con su recorrido real.', [['$ build scene'], ['  SW1 TL-SG2428P · 24 PoE+ · 4 SFP', 'c'], ['  23 cables: placa → canaleta → panel → puerto', 'c'], ['  objetos superpuestos: 0', 'g']]],
  ['Simulador', 'VLANs, ruteo y reglas del ER605, en el navegador.', [['> ping 10.10.30.10 desde PC03'], ['  VLAN20 → ER605 → VLAN30 · responde', 'g'], ['> ping PC01 desde Wi-Fi visitas'], ['  bloqueado: VLAN50 no ve la red interna', 'b']]],
  ['Laboratorio', 'Bloques para empezar, consola para seguir.', [['lab> show vlan brief'], ['  10 20 30 40 50 60 70', 'c'], ['lab> connect PC03 SW1/3'], ['  enlace arriba', 'g']]],
  ['Publicación', 'Una PWA: se abre con un link y anda sin internet.', [['$ vite build'], ['  service worker · todo en caché', 'c'], ['$ open red-alvarez-3d.vercel.app/demo/'], ['  listo', 'g']]],
];
const stepsEl = $('#steps'), term = $('#term'), termN = $('#term-n');
stepsEl.innerHTML = STEPS.map(([t, d], i) => `<li><button type="button" aria-controls="term"><span class="n">${String(i + 1).padStart(2, '0')}</span><span><b>${esc(t)}</b><span class="d">${esc(d)}</span></span></button></li>`).join('');
const stepEls = $$('li', stepsEl);
let stepI = 0, timer = 0, run = 0, howOn = false;
function playStep(i, auto = true) {
  stepI = i;
  stepEls.forEach((el, j) => { el.classList.toggle('on', j === i); el.classList.toggle('done', j < i); $('button', el).setAttribute('aria-current', j === i ? 'step' : 'false'); });
  const me = ++run, lines = STEPS[i][2];
  termN.textContent = `${i + 1}/${STEPS.length}`;
  term.textContent = '';
  clearTimeout(timer);
  let li = 0;
  const next = () => {
    if (me !== run) return;
    if (li >= lines.length) { if (auto && howOn) timer = setTimeout(() => playStep((stepI + 1) % STEPS.length), 2800); return; }
    const [txt, cls] = lines[li++];
    const span = document.createElement('span');
    if (cls) span.className = cls;
    term.append(span, '\n');
    if (cls || RM) { span.textContent = txt; timer = setTimeout(next, 240); return; }
    let k = 0;
    const type = () => { if (me !== run) return; span.textContent = txt.slice(0, ++k); timer = setTimeout(k < txt.length ? type : next, k < txt.length ? 24 : 300); };
    type();
  };
  next();
}
stepEls.forEach((el, i) => $('button', el).addEventListener('click', () => playStep(i, false)));
if (IO) new IntersectionObserver((es) => {
  const v = es[0].isIntersecting;
  if (v && !howOn) { howOn = true; playStep(stepI); } else if (!v) { howOn = false; clearTimeout(timer); }
}, { rootMargin: '0px 0px -15% 0px' }).observe($('.how'));
else playStep(0);
