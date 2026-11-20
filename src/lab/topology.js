// Topología en vivo (SVG) dispuesta como el diagrama de la p.3 del TP.
// Cada segmento del contrato 'packet' tiene su propio <path> con sentido canónico,
// así los paquetes del simulador se animan por el mismo recorrido que en el mundo 3D.
import { bus } from '../core/bus.js';
import { sim, ENDPOINTS } from '../sim/network.js';
import { VLANS, FIBER_COLOR } from '../data/tp.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
};

// Posiciones (viewBox 1000 × 660)
const POS = {
  INTERNET: [500, 46], claro: [300, 110], personal: [700, 110], ER605: [500, 205],
  SW1: [300, 315], SW2: [770, 315],
};
const ROW1 = ['PC01', 'PC02', 'PC03', 'PC04', 'PC05', 'PC06', 'NAS1', 'PBX'];
const ROW2 = ['TEL101', 'TEL102', 'TEL103', 'TEL104', 'TEL105', 'TEL106', 'TEL107'];
const ROW3 = ['IMP01', 'NAS2', 'AP1'];
// filas con un hueco bajo cada switch, por donde sube el mazo de cables
const XL = [36, 100, 164, 228, 372, 436, 500, 564];
ROW1.forEach((id, i) => (POS[id] = [XL[i], 430]));
ROW2.forEach((id, i) => (POS[id] = [XL[i], 535]));
POS.IMP01 = [36, 625];
POS.NAS2 = [164, 625];
POS.AP1 = [372, 625];
POS.WIFI1 = [470, 625];
['PC07', 'PC08', 'PC09', 'PC10', 'PC11'].forEach((id, i) => (POS[id] = [[650, 712, 830, 892, 954][i], 430]));
POS.IMP02 = [712, 535];
POS.AP2 = [830, 535];
POS.WIFI2 = [930, 625];

const BUS_Y = { 1: 382, 2: 494, 3: 585 };
const rowOf = (id) => (ROW1.includes(id) || id.startsWith('PC') ? 1 : ROW2.includes(id) || id === 'IMP02' || id === 'AP2' ? 2 : 3);

const ICON = {
  router: (g) => {
    el('ellipse', { cx: 0, cy: 6, rx: 30, ry: 10, fill: '#0b1426' }, g);
    el('rect', { x: -30, y: -6, width: 60, height: 12, fill: '#0b1426' }, g);
    el('ellipse', { cx: 0, cy: -6, rx: 30, ry: 10, fill: '#1e3a5f', stroke: '#5b8bd6', 'stroke-width': 1.2 }, g);
    el('path', { d: 'M-14 -9 l10 3 M14 -3 l-10 -3 M-4 -14 l3 10 M4 2 l-3 -10', stroke: '#cfe0ff', 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
  },
  switch: (g) => {
    el('path', { d: 'M-36 -8 L-26 -18 L38 -18 L28 -8 Z', fill: '#1e3a5f', stroke: '#5b8bd6', 'stroke-width': 1.2 }, g);
    el('rect', { x: -36, y: -8, width: 64, height: 16, fill: '#0b1426', stroke: '#5b8bd6', 'stroke-width': 1.2 }, g);
    el('path', { d: 'M38 -18 L38 -2 L28 8 L28 -8 Z', fill: '#132842', stroke: '#5b8bd6', 'stroke-width': 1.2 }, g);
    el('path', { d: 'M-18 -13 h20 m-4 -3 l4 3 l-4 3 M16 -13 h-20', stroke: '#cfe0ff', 'stroke-width': 1.6, fill: 'none' }, g);
  },
  pc: (g) => {
    el('rect', { x: -13, y: -13, width: 26, height: 18, rx: 2.5, fill: '#0b1426', stroke: 'currentColor', 'stroke-width': 1.6 }, g);
    el('rect', { x: -9, y: -9.5, width: 18, height: 11, rx: 1, fill: 'currentColor', opacity: 0.25 }, g);
    el('path', { d: 'M-5 9 h10 M0 5 v4', stroke: 'currentColor', 'stroke-width': 1.6 }, g);
  },
  phone: (g) => {
    el('rect', { x: -13, y: -8, width: 26, height: 16, rx: 3, fill: '#0b1426', stroke: 'currentColor', 'stroke-width': 1.6 }, g);
    el('path', { d: 'M-13 -6 q0 -8 6 -8 h14 q6 0 6 8', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6 }, g);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) el('circle', { cx: -5 + i * 5, cy: -2 + j * 5, r: 1.2, fill: 'currentColor' }, g);
  },
  nas: (g) => {
    el('rect', { x: -10, y: -14, width: 20, height: 28, rx: 2.5, fill: '#0b1426', stroke: 'currentColor', 'stroke-width': 1.6 }, g);
    el('path', { d: 'M-6 -8 h12 M-6 -3 h12', stroke: 'currentColor', 'stroke-width': 1.4 }, g);
    el('circle', { cx: 0, cy: 8, r: 1.8, fill: 'currentColor' }, g);
  },
  pbx: (g) => {
    el('rect', { x: -13, y: -9, width: 26, height: 18, rx: 3, fill: '#0b1426', stroke: 'currentColor', 'stroke-width': 1.6 }, g);
    el('text', { x: 0, y: 4, 'text-anchor': 'middle', 'font-size': 9, 'font-weight': 700, fill: 'currentColor' }, g).textContent = 'PBX';
  },
  printer: (g) => {
    el('rect', { x: -13, y: -4, width: 26, height: 12, rx: 2, fill: '#0b1426', stroke: 'currentColor', 'stroke-width': 1.6 }, g);
    el('path', { d: 'M-8 -4 v-8 h16 v8 M-8 8 v4 h16 v-4', fill: '#0b1426', stroke: 'currentColor', 'stroke-width': 1.6 }, g);
  },
  ap: (g) => {
    el('ellipse', { cx: 0, cy: 4, rx: 14, ry: 6, fill: '#0b1426', stroke: 'currentColor', 'stroke-width': 1.6 }, g);
    el('path', { d: 'M-8 -4 q8 -8 16 0 M-12 -9 q12 -12 24 0', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, g);
  },
  wifi: (g) => {
    el('rect', { x: -7, y: -12, width: 14, height: 24, rx: 3, fill: '#0b1426', stroke: 'currentColor', 'stroke-width': 1.4 }, g);
    el('rect', { x: 9, y: -6, width: 18, height: 13, rx: 2, fill: '#0b1426', stroke: 'currentColor', 'stroke-width': 1.4 }, g);
  },
  cloud: (g, label, color) => {
    el('path', { d: 'M-38 10 a14 14 0 0 1 4 -26 a20 20 0 0 1 36 -6 a16 16 0 0 1 32 10 a12 12 0 0 1 -2 22 Z', fill: '#0b1426', stroke: color, 'stroke-width': 1.6 }, g);
    el('text', { x: 0, y: 4, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: '#eef3fb' }, g).textContent = label;
  },
};
const KIND_ICON = { pc: 'pc', phone: 'phone', nas: 'nas', pbx: 'pbx', printer: 'printer', ap: 'ap' };

// ─────────────────────────────────────────────────────────────────────────────
// Lienzo tipo GNS3: equipos arrastrables, zoom/desplazamiento y panel de propiedades
// para ver y configurar cada equipo sin pasar por la consola.
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_POS = JSON.parse(JSON.stringify(POS));
const LS_KEY = 'alvarez.topo.layout.v2';
try { const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); if (saved) for (const [k, v] of Object.entries(saved)) if (POS[k]) POS[k] = v; } catch {}
const savePos = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(POS)); } catch {} };
const ACCESS_VLANS = [10, 20, 30, 40, 50, 60];
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createTopology({ onNode } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'topo';
  const svg = el('svg', { viewBox: '0 0 1000 660', class: 'topo-svg', role: 'img', 'aria-label': 'Topología de la red del estudio' });
  wrap.appendChild(svg);
  const defs = el('defs', {}, svg);
  const glow = el('filter', { id: 'pglow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
  el('feGaussianBlur', { stdDeviation: 3, result: 'b' }, glow);
  const fm = el('feMerge', {}, glow);
  el('feMergeNode', { in: 'b' }, fm);
  el('feMergeNode', { in: 'SourceGraphic' }, fm);
  const pat = el('pattern', { id: 'tgrid', width: 20, height: 20, patternUnits: 'userSpaceOnUse' }, defs);
  el('path', { d: 'M20 0 H0 V20', fill: 'none', class: 'grid-line' }, pat);

  const view = el('g', { class: 'view' }, svg);
  el('rect', { x: -4000, y: -4000, width: 9000, height: 9000, fill: 'url(#tgrid)', class: 'topo-bg' }, view);
  const gLinks = el('g', { class: 'links' }, view);
  const gNotes = el('g', { class: 'notes' }, view);
  const gNodes = el('g', { class: 'nodes' }, view);
  const gPk = el('g', { class: 'packets' }, view);
  let vx = 0, vy = 0, vs = 1;
  const applyView = () => view.setAttribute('transform', `translate(${vx} ${vy}) scale(${vs})`);

  // ── enlaces (se recalculan al mover un equipo) ──
  const paths = {}, linkKey = {}, links = [];
  const r = (n) => Math.round(n * 10) / 10;
  const elbow = ([x1, y1], [x2, y2], midY) => {
    if (Math.abs(x2 - x1) < 2) return `M${r(x1)} ${r(y1)} V${r(y2)}`;
    const k = Math.max(0, Math.min(8, Math.abs(y2 - midY), Math.abs(midY - y1), Math.abs(x2 - x1) / 2));
    const sx = Math.sign(x2 - x1), s1 = Math.sign(midY - y1) || 1, s2 = Math.sign(y2 - midY) || 1;
    return `M${r(x1)} ${r(y1)} V${r(midY - s1 * k)} Q${r(x1)} ${r(midY)} ${r(x1 + sx * k)} ${r(midY)} H${r(x2 - sx * k)} Q${r(x2)} ${r(midY)} ${r(x2)} ${r(midY + s2 * k)} V${r(y2)}`;
  };
  const addLink = (seg, cls, key, route, reverse = false) => {
    const p = el('path', { class: `lnk ${cls || ''}`, fill: 'none' }, gLinks);
    if (reverse) p.dataset.reverse = '1';
    paths[seg] = p; linkKey[seg] = key;
    links.push({ p, route });
  };
  for (const e of Object.values(ENDPOINTS)) {
    if (!e.sw || !POS[e.id]) continue;
    const route = () => {
      const d = POS[e.id], sw = POS[e.sw];
      const from = [d[0], d[1] - 18];
      const to = [sw[0] + Math.max(-24, Math.min(24, (d[0] - sw[0]) * 0.09)), sw[1] + 10];
      const mid = from[1] > to[1] ? to[1] + Math.max(22, (from[1] - to[1]) * (0.3 + rowOf(e.id) * 0.07)) : (from[1] + to[1]) / 2;
      return elbow(from, to, mid);
    };
    if (e.segDir === 1) addLink(e.seg, `v${e.vlan}`, e.seg.split(':')[1], route);
    else addLink(e.seg, `v${e.vlan}`, e.id, route, true);
  }
  addLink('rack:ER605', 'trunk', 'ER605', () => elbow([POS.SW1[0], POS.SW1[1] - 18], [POS.ER605[0], POS.ER605[1] + 18], (POS.SW1[1] + POS.ER605[1]) / 2 + 10));
  addLink('fiber', 'fiber', 'fiber', () => { const a = POS.SW1, b = POS.SW2, d = Math.sign(b[0] - a[0]) || 1; return `M${a[0] + d * 38} ${a[1] - 4} L${b[0] - d * 38} ${b[1] - 4}`; });
  const wanRoute = (isp, dx) => () => {
    const er = POS.ER605, c = POS[isp], net = POS.INTERNET;
    const a = elbow([er[0] + dx, er[1] - 14], [c[0], c[1] + 10], (er[1] + c[1]) / 2 + 10);
    const b = elbow([c[0], c[1] - 20], [net[0] + (Math.sign(c[0] - net[0]) || 1) * 50, net[1] + 6], (c[1] + net[1]) / 2);
    return `${a} ${b}`;
  };
  addLink('wan:claro', 'wan', 'claro', wanRoute('claro', -12));
  addLink('wan:personal', 'wan', 'personal', wanRoute('personal', 12));
  addLink('wifi:AP1', 'wifi', 'wifi1', () => `M${POS.AP1[0] + 16} ${POS.AP1[1]} L${POS.WIFI1[0] - 22} ${POS.WIFI1[1]}`);
  addLink('wifi:AP2', 'wifi', 'wifi2', () => `M${POS.AP2[0] + 16} ${POS.AP2[1] + 6} L${POS.WIFI2[0] - 12} ${POS.WIFI2[1] - 12}`);

  const notes = [];
  const note = (t, fn, cls = 'note') => { const n = el('text', { class: cls, 'text-anchor': 'middle' }, gNotes); n.textContent = t; notes.push({ n, fn }); };
  note('Fibra · 30 m · 1 Gb/s', () => [(POS.SW1[0] + POS.SW2[0]) / 2, (POS.SW1[1] + POS.SW2[1]) / 2 - 14], 'note fiber-lbl');
  note('WAN1 · 200 Mb/s', () => [POS.claro[0], POS.claro[1] + 34]);
  note('WAN2 · 300 Mb/s', () => [POS.personal[0], POS.personal[1] + 34]);
  note('SW1/17 ↔ LAN4', () => [(POS.SW1[0] + POS.ER605[0]) / 2 + 40, (POS.SW1[1] + POS.ER605[1]) / 2 + 2]);

  const nodes = {};
  function layout() {
    for (const l of links) l.p.setAttribute('d', l.route());
    for (const { n, fn } of notes) { const [x, y] = fn(); n.setAttribute('x', x); n.setAttribute('y', y); }
    for (const [id, g] of Object.entries(nodes)) g.setAttribute('transform', `translate(${POS[id][0]} ${POS[id][1]})`);
  }

  // ── nodos ──
  let selected = null;
  const addNode = (id, icon, label, sub, color) => {
    const g = el('g', { class: `node n-${icon}`, tabindex: 0, 'data-id': id, style: `color:${color || '#cfe0ff'}` }, gNodes);
    el('circle', { r: 28, class: 'hit', fill: 'transparent' }, g);
    if (icon === 'cloud') ICON.cloud(g, label, color);
    else ICON[icon](g);
    if (icon !== 'cloud') {
      const side = icon === 'switch' || icon === 'router';
      const left = id === 'SW1';
      const at = side ? { x: left ? -46 : 46, 'text-anchor': left ? 'end' : 'start' } : { x: 0, 'text-anchor': 'middle' };
      el('text', { ...at, y: side ? -2 : 30, class: side ? 'lbl big' : 'lbl' }, g).textContent = label;
      if (sub) el('text', { ...at, y: side ? 12 : 42, class: 'sub' }, g).textContent = sub;
    }
    el('circle', { r: 4, cx: icon === 'switch' ? 34 : 15, cy: icon === 'switch' ? -18 : -14, class: 'led' }, g);
    g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') select(id); });
    nodes[id] = g;
  };
  addNode('INTERNET', 'cloud', 'Internet', '', '#5b8bd6');
  addNode('claro', 'cloud', 'Claro', '', '#e11d48');
  addNode('personal', 'cloud', 'Personal', '', '#38bdf8');
  addNode('ER605', 'router', 'ER605 V2', '10.10.10.1');
  addNode('SW1', 'switch', 'SW1 · R1', '10.10.10.2');
  addNode('SW2', 'switch', 'SW2 · R2', '10.10.10.3');
  for (const e of Object.values(ENDPOINTS)) if (POS[e.id]) addNode(e.id, KIND_ICON[e.kind], e.id, e.ip.replace(/^10\.10\./, '.'), VLANS[e.vlan]?.color);
  addNode('WIFI1', 'wifi', 'Clientes Wi-Fi', '', '#e0457b');
  addNode('WIFI2', 'wifi', 'Clientes Wi-Fi', '', '#e0457b');
  layout();

  // ── arrastrar equipos, mover y hacer zoom en el lienzo ──
  const toSvg = (cx, cy) => { const pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
  const pointers = new Map();
  let drag = null, pan = null, pinch = null;
  svg.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), vs }; drag = pan = null; return; }
    const g = e.target.closest('.node');
    const p = toSvg(e.clientX, e.clientY);
    if (g) {
      const id = g.dataset.id;
      drag = { id, ox: (p.x - vx) / vs - POS[id][0], oy: (p.y - vy) / vs - POS[id][1], moved: 0, sx: e.clientX, sy: e.clientY };
      g.classList.add('dragging');
    } else pan = { x: p.x, y: p.y, moved: 0, sx: e.clientX, sy: e.clientY };
    try { svg.setPointerCapture(e.pointerId); } catch {}
  });
  svg.addEventListener('pointermove', (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, (pinch.vs * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d / vs);
      return;
    }
    const p = toSvg(e.clientX, e.clientY);
    if (drag) {
      drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy));
      if (drag.moved < 4) return;
      POS[drag.id] = [Math.round(((p.x - vx) / vs - drag.ox) / 10) * 10, Math.round(((p.y - vy) / vs - drag.oy) / 10) * 10];
      layout();
    } else if (pan) {
      pan.moved = Math.max(pan.moved, Math.hypot(e.clientX - pan.sx, e.clientY - pan.sy));
      vx += p.x - pan.x; vy += p.y - pan.y;
      pan.x = p.x; pan.y = p.y;
      applyView();
    }
  });
  const end = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (drag) {
      nodes[drag.id].classList.remove('dragging');
      if (drag.moved < 4) select(drag.id); else savePos();
      drag = null;
    } else if (pan) { if (pan.moved < 4) select(null); pan = null; }
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  const zoomAt = (cx, cy, f) => {
    const ns = Math.min(2.6, Math.max(0.45, vs * f));
    const p = toSvg(cx, cy);
    vx = p.x - ((p.x - vx) * ns) / vs; vy = p.y - ((p.y - vy) * ns) / vs; vs = ns;
    applyView();
  };
  svg.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });

  const tools = document.createElement('div');
  tools.className = 'topo-tools';
  tools.innerHTML = `<button class="btn sm" data-t="in" aria-label="Acercar">+</button><button class="btn sm" data-t="out" aria-label="Alejar">−</button><button class="btn sm" data-t="fit">Encuadrar</button><button class="btn sm ghost" data-t="tp">Ordenar como el TP</button><span class="hint">Arrastrá los equipos · rueda o pellizco para zoom · clic para configurar</span>`;
  wrap.appendChild(tools);
  tools.addEventListener('click', (e) => {
    const t = e.target.closest('[data-t]')?.dataset.t;
    const rc = svg.getBoundingClientRect();
    if (t === 'in') zoomAt(rc.left + rc.width / 2, rc.top + rc.height / 2, 1.25);
    if (t === 'out') zoomAt(rc.left + rc.width / 2, rc.top + rc.height / 2, 0.8);
    if (t === 'fit') { vx = vy = 0; vs = 1; applyView(); }
    if (t === 'tp') { for (const k of Object.keys(DEFAULT_POS)) POS[k] = [...DEFAULT_POS[k]]; savePos(); vx = vy = 0; vs = 1; applyView(); layout(); }
  });

  // ── panel de propiedades: ver y configurar ──
  const props = document.createElement('aside');
  props.className = 'topo-props';
  props.hidden = true;
  wrap.appendChild(props);
  const pingTargets = ['NAS1', 'NAS2', 'PBX', 'IMP01', 'PC03', 'PC07', 'TEL106', '8.8.8.8'];
  const state = (id) => (sim.isUp(id) ? '<span class="st ok">Encendido</span>' : `<span class="st bad">${esc(sim.downReason(id) || 'Apagado')}</span>`);
  const toggle = (attrs, on, label) => `<label class="sw" title="${esc(label)}"><input type="checkbox" ${attrs} ${on ? 'checked' : ''} aria-label="${esc(label)}"><span></span></label>`;
  const portRow = (sw, p, label) => {
    const c = sim.ports[sw][p];
    const vl = [...new Set([...(c.untagged || []), ...(c.tagged || [])])];
    const trunk = (c.tagged || []).length > 0 || vl.length > 1;
    const vlan = trunk ? `<span class="mono">Troncal ${vl.join('/')}</span>` : `<select data-k="vlan" data-sw="${sw}" data-p="${p}" aria-label="VLAN del puerto ${sw}/${p}">${ACCESS_VLANS.map((v) => `<option value="${v}" ${c.pvid === v ? 'selected' : ''}>VLAN${v}</option>`).join('')}</select>`;
    return `<tr><td class="mono">${sw}/${p}</td><td>${esc(label)}</td><td>${vlan}</td><td>${toggle(`data-k="port" data-sw="${sw}" data-p="${p}"`, !c.shutdown, `Puerto ${sw}/${p} encendido`)}</td></tr>`;
  };
  const head = (t, s) => `<header><div><b>${esc(t)}</b><span>${esc(s || '')}</span></div><button class="btn sm ghost" data-k="close" aria-label="Cerrar">✕</button></header>`;
  function render(id) {
    if (!id) { props.hidden = true; return; }
    const e = ENDPOINTS[id];
    let h = '';
    if (e) {
      h += head(e.id, e.name);
      h += `<dl><dt>IP</dt><dd class="mono">${esc(e.ip)}</dd><dt>VLAN</dt><dd><i class="sq" style="background:${VLANS[e.vlan]?.color}"></i>VLAN${e.vlan} · ${esc(VLANS[e.vlan]?.name)}</dd><dt>Conexión</dt><dd class="mono">${e.sw}/${e.port}${e.outlet ? ' · ' + e.outlet : ''}</dd><dt>Estado</dt><dd>${state(e.id)}</dd></dl>`;
      h += `<h4>Puerto del switch</h4><table class="ports"><tbody>${portRow(e.sw, e.port, e.id)}</tbody></table>`;
      h += `<h4>Probar</h4><div class="row"><select data-k="dst" aria-label="Destino">${pingTargets.filter((t) => t !== e.id).map((t) => `<option>${t}</option>`).join('')}</select><button class="btn sm primary" data-k="ping">Ping</button><button class="btn sm" data-k="trace">Traza</button></div><div class="res" aria-live="polite"></div>`;
      if (['pc', 'phone', 'pbx', 'nas'].includes(e.kind)) h += '<div class="foot"><button class="btn sm" data-k="console">Abrir consola</button></div>';
    } else if (id === 'SW1' || id === 'SW2') {
      h += head(id, id === 'SW1' ? 'TP-Link TL-SG2428P · R1' : 'TP-Link TL-SG2210P · R2');
      h += `<dl><dt>IP</dt><dd class="mono">${id === 'SW1' ? '10.10.10.2' : '10.10.10.3'}</dd><dt>Estado</dt><dd>${state(id)}</dd></dl>`;
      const used = Object.values(ENDPOINTS).filter((x) => x.sw === id).sort((a, b) => a.port - b.port);
      const extra = id === 'SW1' ? [[17, 'ER605 LAN4'], [25, 'Fibra a SW2']] : [[9, 'Fibra a SW1']];
      h += `<h4>Puertos en uso</h4><div class="tbl"><table class="ports"><thead><tr><th>Puerto</th><th>Equipo</th><th>VLAN</th><th>On</th></tr></thead><tbody>${used.map((x) => portRow(id, x.port, x.id)).join('')}${extra.map(([p, l]) => portRow(id, p, l)).join('')}</tbody></table></div>`;
      h += '<div class="foot"><button class="btn sm" data-k="console">Abrir consola JetStream</button></div>';
    } else if (['ER605', 'INTERNET', 'claro', 'personal'].includes(id)) {
      const act = sim.activeWan();
      h += head('ER605 V2', 'Router dual WAN · gateway .1 de cada VLAN · VPN WireGuard');
      h += `<dl><dt>Salida activa</dt><dd>${act ? (act === 'claro' ? 'Claro (principal)' : 'Personal (respaldo)') : '<span class="st bad">Sin internet</span>'}</dd><dt>Energía</dt><dd>${sim.mains ? 'Red eléctrica' : 'UPS (corte de luz)'}</dd></dl>`;
      h += `<h4>Enlaces WAN</h4><table class="ports"><tbody>
        <tr><td class="mono">WAN1</td><td>Claro · 200 Mb/s</td><td></td><td>${toggle('data-k="wan" data-isp="claro"', sim.wan.claro, 'Claro')}</td></tr>
        <tr><td class="mono">WAN2</td><td>Personal · 300 Mb/s</td><td></td><td>${toggle('data-k="wan" data-isp="personal"', sim.wan.personal, 'Personal')}</td></tr></tbody></table>`;
      h += `<h4>Energía del edificio</h4><div class="row">${toggle('data-k="power"', sim.mains, 'Red eléctrica')}<span class="muted">Si se corta, R1, R2 y NAS2 siguen con UPS</span></div>`;
      h += '<h4>Probar salida</h4><div class="row"><button class="btn sm primary" data-k="inet">Ping PC03 → 8.8.8.8</button></div><div class="res" aria-live="polite"></div>';
    } else if (id === 'WIFI1' || id === 'WIFI2') {
      h += head(`Clientes Wi-Fi · ${id === 'WIFI1' ? 'AP1' : 'AP2'}`, 'Empleados (VLAN20) y Visitas (VLAN50) con claves separadas');
      h += '<div class="row col"><button class="btn sm" data-k="join" data-c="VISITA" data-s="Visitas">Conectar celular de visita</button><button class="btn sm" data-k="join" data-c="LAPTOP" data-s="Empleados">Conectar notebook de empleado</button></div>';
      h += '<h4>Probar aislamiento</h4><div class="row"><button class="btn sm primary" data-k="visit">Visita → NAS1</button><button class="btn sm" data-k="visitnet">Visita → internet</button></div><div class="res" aria-live="polite"></div>';
    }
    props.innerHTML = h;
    props.hidden = false;
    props.dataset.id = id;
  }
  function select(id) {
    if (selected) nodes[selected]?.classList.remove('sel');
    selected = id;
    if (id) nodes[id]?.classList.add('sel');
    render(id);
  }
  const res = (txt, ok) => { const r2 = props.querySelector('.res'); if (r2) { r2.className = `res ${ok ? 'ok' : 'bad'}`; r2.textContent = txt; } };
  props.addEventListener('change', (e) => {
    const t = e.target, k = t.dataset.k;
    try {
      if (k === 'vlan') sim.setPortConfig(t.dataset.sw, +t.dataset.p, { mode: 'access', pvid: +t.value });
      if (k === 'port') sim.setPortConfig(t.dataset.sw, +t.dataset.p, { shutdown: !t.checked });
      if (k === 'wan') { const w = sim.setWan(t.dataset.isp, t.checked); if (w?.note) bus.emit('toast', { text: w.note, kind: 'info' }); }
      if (k === 'power') sim.setPower(t.checked);
    } catch (err) { res(err.message, false); }
  });
  props.addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-k]');
    if (!b) return;
    const k = b.dataset.k, id = props.dataset.id;
    if (k === 'close') return select(null);
    if (k === 'console') return onNode?.(id);
    b.disabled = true;
    try {
      if (k === 'ping' || k === 'trace') {
        const dst = props.querySelector('[data-k=dst]').value;
        const out = k === 'ping' ? await sim.ping(id, dst, { count: 1 }) : await sim.traceroute(id, dst);
        res(out.ok ? `${id} llegó a ${dst}${out.via ? ' · ' + out.via : ''}` : `${id} no llegó a ${dst}${out.reason ? ': ' + out.reason : ''}`, out.ok);
      }
      if (k === 'inet') { const out = await sim.ping('PC03', '8.8.8.8', { count: 1 }); res(out.ok ? `Hay internet por ${sim.activeWan() === 'claro' ? 'Claro' : 'Personal'}` : `Sin salida a internet${out.reason ? ': ' + out.reason : ''}`, out.ok); }
      if (k === 'join') { await sim.wifiJoin(b.dataset.c, id === 'WIFI1' ? 'AP1' : 'AP2', b.dataset.s); res(`${b.dataset.c === 'VISITA' ? 'Celular de visita' : 'Notebook'} conectado a ${b.dataset.s}`, true); }
      if (k === 'visit' || k === 'visitnet') {
        if (!sim.wifi.VISITA) await sim.wifiJoin('VISITA', id === 'WIFI1' ? 'AP1' : 'AP2', 'Visitas');
        const out = await sim.ping('VISITA', k === 'visit' ? 'NAS1' : '8.8.8.8', { count: 1 });
        if (k === 'visit') res(out.ok ? 'La visita llegó al NAS (no debería)' : 'Bloqueado: Visitas solo sale a internet', !out.ok);
        else res(out.ok ? 'La visita sale a internet' : 'La visita no sale a internet', out.ok);
      }
    } catch (err) { res(err.message, false); }
    b.disabled = false;
  });

  // ── estado en vivo ──
  function paint() {
    const L = sim.linkStatus();
    for (const [seg, p] of Object.entries(paths)) {
      let st = L[linkKey[seg]] || 'up';
      if (seg.startsWith('wifi:')) {
        const ap = seg.split(':')[1];
        st = Object.values(sim.wifi).some((w) => w && w.ap === ap) ? (sim.isUp(ap) ? 'up' : 'down') : 'idle';
      }
      p.dataset.st = st;
    }
    for (const [id, g] of Object.entries(nodes)) {
      let up = true;
      if (ENDPOINTS[id] || ['SW1', 'SW2', 'ER605'].includes(id)) up = sim.isUp(id);
      if (id === 'claro' || id === 'personal') up = sim.wan[id];
      if (id === 'INTERNET') up = !!sim.activeWan();
      if (id === 'WIFI1' || id === 'WIFI2') up = Object.values(sim.wifi).some((w) => w && w.ap === (id === 'WIFI1' ? 'AP1' : 'AP2'));
      g.classList.toggle('down', !up);
      g.classList.toggle('ups', up && !sim.mains && !!sim.upsOf(id));
    }
    if (selected && !props.contains(document.activeElement)) render(selected);
  }
  paint();
  const offs = [bus.on('sim:change', paint)];

  // ── paquetes (mismo contrato que el mundo 3D) ──
  offs.push(
    bus.on('packet', (pkt) => {
      if (!wrap.isConnected) return;
      const segs = pkt.segments.map((s) => ({ ...s, p: paths[s.id] })).filter((s) => s.p);
      if (!segs.length) return;
      const lens = segs.map((s) => s.p.getTotalLength());
      const total = lens.reduce((a, b) => a + b, 0);
      const dot = el('circle', { r: 6, fill: pkt.color || '#fff', filter: 'url(#pglow)', class: 'pkt' }, gPk);
      const trail = el('circle', { r: 11, fill: pkt.color || '#fff', opacity: 0.18 }, gPk);
      const dur = pkt.duration || 1400;
      const t0 = performance.now();
      const point = (d) => {
        let acc = 0;
        for (let i = 0; i < segs.length; i++) {
          if (d <= acc + lens[i] || i === segs.length - 1) {
            const s = segs[i];
            let local = Math.min(lens[i], Math.max(0, d - acc));
            const forward = s.p.dataset.reverse === '1' ? s.dir === -1 : s.dir === 1;
            if (!forward) local = lens[i] - local;
            return s.p.getPointAtLength(local);
          }
          acc += lens[i];
        }
      };
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        const ek = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const pt = point(ek * total);
        if (pt) { dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); trail.setAttribute('cx', pt.x); trail.setAttribute('cy', pt.y); }
        if (k < 1) requestAnimationFrame(step);
        else {
          if (!pkt.ok && pt) {
            const x = el('g', { class: 'drop', transform: `translate(${pt.x} ${pt.y})` }, gPk);
            el('circle', { r: 12, class: 'drop-ring' }, x);
            el('path', { d: 'M-5 -5 L5 5 M5 -5 L-5 5', class: 'drop-x' }, x);
            setTimeout(() => x.remove(), 1600);
          }
          dot.remove(); trail.remove();
        }
      };
      requestAnimationFrame(step);
    })
  );

  return { el: wrap, paint, select, destroy: () => offs.forEach((f) => f()) };
}
