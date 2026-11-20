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

  const gLinks = el('g', { class: 'links' }, svg);
  const gNodes = el('g', { class: 'nodes' }, svg);
  const gPk = el('g', { class: 'packets' }, svg);
  const paths = {}; // segId -> path element
  const linkKey = {}; // segId -> key de linkStatus

  const addPath = (seg, d, cls, key) => {
    const p = el('path', { d, class: `lnk ${cls || ''}`, fill: 'none' }, gLinks);
    paths[seg] = p;
    linkKey[seg] = key;
    return p;
  };
  const r = (n) => Math.round(n * 10) / 10;
  // Manhattan con esquinas redondeadas: dispositivo → bus → switch
  const manhattan = (from, busY, to) => {
    const [x1, y1] = from, [x2, y2] = to;
    const k = 8;
    const sx = Math.sign(x2 - x1) || 1;
    if (Math.abs(x2 - x1) < 2) return `M${x1} ${y1} V${y2}`;
    return `M${x1} ${y1} V${busY + k} Q${x1} ${busY} ${r(x1 + sx * k)} ${busY} H${r(x2 - sx * k)} Q${x2} ${busY} ${x2} ${busY - k} V${y2}`;
  };

  // enlaces de acceso
  for (const e of Object.values(ENDPOINTS)) {
    if (!e.sw || !POS[e.id]) continue;
    const swp = POS[e.sw];
    const from = [POS[e.id][0], POS[e.id][1] - 18];
    const to = [r(swp[0] + Math.max(-24, Math.min(24, (POS[e.id][0] - swp[0]) * 0.09)) + (rowOf(e.id) - 2) * 3), swp[1] + 10];
    const d = manhattan(from, BUS_Y[rowOf(e.id)] + (e.sw === 'SW2' ? 8 : 0), to);
    if (e.segDir === 1) addPath(e.seg, d, `v${e.vlan}`, e.seg.split(':')[1]);
    else {
      // rack:NAS1 / rack:PBX: sentido canónico switch → equipo
      const p = addPath(e.seg, d, `v${e.vlan}`, e.id);
      p.dataset.reverse = '1';
    }
  }
  addPath('rack:ER605', `M${POS.SW1[0]} ${POS.SW1[1] - 18} V255 Q${POS.SW1[0]} 240 ${POS.SW1[0] + 15} 240 H${POS.ER605[0] - 15} Q${POS.ER605[0]} 240 ${POS.ER605[0]} 225`, 'trunk', 'ER605');
  addPath('fiber', `M${POS.SW1[0] + 38} ${POS.SW1[1] - 4} H${POS.SW2[0] - 38}`, 'fiber', 'fiber');
  addPath('wan:claro', `M${POS.ER605[0] - 12} ${POS.ER605[1] - 14} V160 Q${POS.ER605[0] - 12} 150 ${POS.ER605[0] - 30} 150 H${POS.claro[0]} V${POS.claro[1] + 10} M${POS.claro[0]} ${POS.claro[1] - 20} V70 Q${POS.claro[0]} 46 ${POS.claro[0] + 25} 46 H${POS.INTERNET[0] - 50}`, 'wan', 'claro');
  addPath('wan:personal', `M${POS.ER605[0] + 12} ${POS.ER605[1] - 14} V160 Q${POS.ER605[0] + 12} 150 ${POS.ER605[0] + 30} 150 H${POS.personal[0]} V${POS.personal[1] + 10} M${POS.personal[0]} ${POS.personal[1] - 20} V70 Q${POS.personal[0]} 46 ${POS.personal[0] - 25} 46 H${POS.INTERNET[0] + 50}`, 'wan', 'personal');
  addPath('wifi:AP1', `M${POS.AP1[0] + 16} ${POS.AP1[1]} H${POS.WIFI1[0] - 22}`, 'wifi', 'wifi1');
  addPath('wifi:AP2', `M${POS.AP2[0] + 16} ${POS.AP2[1] + 10} Q${POS.WIFI2[0]} ${POS.AP2[1] + 10} ${POS.WIFI2[0]} ${POS.WIFI2[1] - 16}`, 'wifi', 'wifi2');

  const nodes = {};
  const addNode = (id, icon, label, sub, color) => {
    const [x, y] = POS[id];
    const g = el('g', { class: `node n-${icon}`, transform: `translate(${x} ${y})`, tabindex: 0, 'data-id': id, style: `color:${color || '#cfe0ff'}` }, gNodes);
    el('circle', { r: 26, class: 'hit', fill: 'transparent' }, g);
    if (icon === 'cloud') ICON.cloud(g, label, color);
    else ICON[icon](g);
    if (icon !== 'cloud') {
      const side = icon === 'switch' || icon === 'router';
      const left = id === 'SW1';
      const at = side ? { x: left ? -46 : 46, 'text-anchor': left ? 'end' : 'start' } : { x: 0, 'text-anchor': 'middle' };
      const t = el('text', { ...at, y: side ? -2 : 30, class: side ? 'lbl big' : 'lbl' }, g);
      t.textContent = label;
      if (sub) {
        const s = el('text', { ...at, y: side ? 12 : 42, class: 'sub' }, g);
        s.textContent = sub;
      }
    }
    el('circle', { r: 4, cx: icon === 'switch' ? 34 : 15, cy: icon === 'switch' ? -18 : -14, class: 'led' }, g);
    g.addEventListener('click', () => onNode?.(id));
    g.addEventListener('keydown', (ev) => ev.key === 'Enter' && onNode?.(id));
    nodes[id] = g;
    return g;
  };
  addNode('INTERNET', 'cloud', 'Internet', '', '#5b8bd6');
  addNode('claro', 'cloud', 'Claro', '', '#e11d48');
  addNode('personal', 'cloud', 'Personal', '', '#38bdf8');
  addNode('ER605', 'router', 'ER605 V2', '10.10.10.1');
  addNode('SW1', 'switch', 'SW1 · R1', '10.10.10.2');
  addNode('SW2', 'switch', 'SW2 · R2', '10.10.10.3');
  for (const e of Object.values(ENDPOINTS)) {
    if (!POS[e.id]) continue;
    addNode(e.id, KIND_ICON[e.kind], e.id, e.kind === 'ap' ? e.ip.replace('10.10.', '.') : e.ip.replace(/^10\.10\./, '.'), VLANS[e.vlan]?.color);
  }
  addNode('WIFI1', 'wifi', 'Clientes Wi-Fi', '', '#e0457b');
  addNode('WIFI2', 'wifi', 'Clientes Wi-Fi', '', '#e0457b');
  // etiquetas extra
  const lab = (x, y, t, cls = 'note') => (el('text', { x, y, class: cls, 'text-anchor': 'middle' }, svg).textContent = t);
  lab((POS.SW1[0] + POS.SW2[0]) / 2 + 40, POS.SW1[1] - 14, 'Fibra · 30 m · 1 Gb/s', 'note fiber-lbl');
  lab(POS.claro[0], POS.claro[1] + 34, 'WAN1 · 200 Mb/s');
  lab(POS.personal[0], POS.personal[1] + 34, 'WAN2 · 300 Mb/s');
  lab(POS.SW1[0] + 70, 232, 'SW1/17 ↔ LAN4');

  // ── estado en vivo ──
  function paint() {
    const L = sim.linkStatus();
    for (const [seg, p] of Object.entries(paths)) {
      const k = linkKey[seg];
      let st = L[k] || 'up';
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
  }
  paint();
  const offs = [bus.on('sim:change', paint)];

  // ── paquetes ──
  const active = new Set();
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
      const item = { dot, trail };
      active.add(item);
      const point = (d) => {
        let acc = 0;
        for (let i = 0; i < segs.length; i++) {
          if (d <= acc + lens[i] || i === segs.length - 1) {
            const s = segs[i];
            let local = Math.min(lens[i], Math.max(0, d - acc));
            const canonRev = s.p.dataset.reverse === '1';
            // el <path> de rack:NAS1/PBX está dibujado equipo→switch; su sentido canónico es switch→equipo
            const forward = canonRev ? s.dir === -1 : s.dir === 1;
            if (!forward) local = lens[i] - local;
            return s.p.getPointAtLength(local);
          }
          acc += lens[i];
        }
      };
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const pt = point(e * total);
        if (pt) {
          dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
          trail.setAttribute('cx', pt.x); trail.setAttribute('cy', pt.y);
        }
        if (k < 1) requestAnimationFrame(step);
        else {
          if (!pkt.ok && pt) {
            const x = el('g', { class: 'drop', transform: `translate(${pt.x} ${pt.y})` }, gPk);
            el('circle', { r: 12, class: 'drop-ring' }, x);
            el('path', { d: 'M-5 -5 L5 5 M5 -5 L-5 5', class: 'drop-x' }, x);
            setTimeout(() => x.remove(), 1600);
          }
          dot.remove(); trail.remove(); active.delete(item);
        }
      };
      requestAnimationFrame(step);
    })
  );

  return {
    el: wrap,
    paint,
    destroy: () => offs.forEach((f) => f()),
  };
}
