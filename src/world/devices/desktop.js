// Equipos de escritorio / de sala. Origen = centro inferior (base), frente = +Z.
// Incluye los que van apoyados en bandejas del rack (ER605, ONT, NAS DS223j, PBX PN41).
import * as THREE from 'three';
import {
  M, mat, box, rbox, cyl, canvasTex, faceMat, mmMapper, drawRJ45, drawSFP, drawVents,
  Ports, makeLed, geo, facePlane, FONT, pickInstances,
} from './common.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const FRONT = V(0, 0, 1), BACK = V(0, 0, -1), UP = V(0, 1, 0);

// Pequeño conector RJ45 trasero (visual) + anclaje
function rearRJ45(group, ports, key, x, y, zBack) {
  box(0.016, 0.014, 0.003, M.zinc(), x, y, zBack - 0.0012, group);
  box(0.0118, 0.0105, 0.0035, mat('rjHole', { color: 0x050506, roughness: 0.9 }), x, y, zBack - 0.0016, group);
  ports.add(key, V(x, y, zBack - 0.003), BACK);
}

// ── Router TP-Link ER605 V2 (158 × 101 × 25 mm) ───────────────────────────
export const ER605_PORTS = [
  { key: 'SFP', x: -24, sfp: true, label: 'SFP' },
  { key: 'WAN1', x: -6, label: 'WAN1' },
  { key: 'WAN2', x: 9.5, label: 'WAN2' },
  { key: '3', x: 25, label: '3' },
  { key: 'LAN4', x: 40.5, label: 'LAN4' },
  { key: '5', x: 56, label: '5' },
];
export function buildER605(id = 'ER605', used = new Set(['WAN1', 'WAN2', 'LAN4'])) {
  const group = new THREE.Group(); group.name = id;
  const ports = new Ports();
  const W = 0.158, H = 0.025, D = 0.101;
  const tex = canvasTex(512, 82, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#34383f'); gr.addColorStop(1, '#25282d');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const f = mmMapper(g, w, h, 158, 25);
    f.text('tp-link', -75, 6.5, 4.2, '#4fd1d9', 800, 'left');
    f.text('ER605', -75, -1, 3.6, '#f1f4f8', 800, 'left');
    f.text('Omada VPN Router', -75, -7, 2.1, '#a9b2bc', 600, 'left');
    f.rect(-44, 7, 2.2, 1.6, '#0e2414'); f.text('PWR', -44, 3.6, 1.8, '#a9b2bc');
    f.rect(-37.5, 7, 2.2, 1.6, '#0e2414'); f.text('SYS', -37.5, 3.6, 1.8, '#a9b2bc');
    for (const p of ER605_PORTS) {
      if (p.sfp) { drawSFP(f, p.x, 3, 13, 9.2, false); }
      else drawRJ45(f, p.x, 3, 12.2, 10.2, { used: used.has(p.key), frame: '#6b727a' });
      f.text(p.label, p.x, -7.8, 2.6, used.has(p.key) ? '#ffffff' : '#a9b2bc', 700);
    }
  });
  const body = new THREE.Mesh(geo('er605body', () => new THREE.BoxGeometry(W, H, D)),
    [M.devGrey(), M.devGrey(), M.devGrey(), M.devGrey(), faceMat(tex, { metalness: 0.55, roughness: 0.4 }), M.devGrey()]);
  body.position.set(0, H / 2, -D / 2);
  group.add(body);
  // patas de goma
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(0.006, 0.006, 0.002, 8, M.rubber(), sx * 0.065, 0.001, -D / 2 + sz * 0.04, group);
  const leds = [];
  const l1 = makeLed('#35e06a', true, [0.0022, 0.0016], group, -0.044, H / 2 + 0.007, 0.0004);
  const l2 = makeLed('#35e06a', true, [0.0022, 0.0016], group, -0.0375, H / 2 + 0.007, 0.0004);
  leds.push({ mat: l1.mat, key: `${id}:PWR`, role: 'power' }, { mat: l2.mat, key: `${id}:SYS`, role: 'power' });
  for (const p of ER605_PORTS) ports.add(p.key, V(p.x / 1000, H / 2 + 0.003, 0.0006), FRONT);
  return { group, ports: ports.map, pickables: [{ object: body, id }], leds, size: [W, H, D] };
}

// ── Equipo del proveedor (ONT) ───────────────────────────────────────────
export function buildONT(id, label, accent = '#da291c') {
  const group = new THREE.Group(); group.name = id;
  const ports = new Ports();
  const W = 0.118, H = 0.036, D = 0.1;
  const body = rbox(W, H, D, 0.006, M.plasticWhite(), 0, H / 2, -D / 2, group);
  const tex = canvasTex(384, 118, (g, w, h) => {
    g.fillStyle = '#f4f4f1'; g.fillRect(0, 0, w, h);
    const f = mmMapper(g, w, h, W * 1000, H * 1000);
    f.circle(-50, 10, 2.2, accent);
    f.text(label, -46, 10, 6, '#2b2f36', 800, 'left');
    f.text('Fibra · ONT', -46, 3, 3, '#7a828c', 600, 'left');
    ['PWR', 'PON', 'LOS', 'LAN'].forEach((t, i) => { f.rect(-50 + i * 9, -6, 2.4, 1.6, '#c9cdd2'); f.text(t, -50 + i * 9, -10, 2.2, '#7a828c', 600); });
    drawRJ45(f, 42, -3, 11.6, 10, { used: true, frame: '#b8bdc4' });
    f.text('LAN', 42, 6.5, 2.6, '#5d646d', 700);
  });
  facePlane(W - 0.006, H - 0.004, faceMat(tex, { roughness: 0.5, metalness: 0 }), 0, H / 2, 0.0002, group);
  const leds = [];
  ['#35e06a', '#35e06a', null, '#35e06a'].forEach((c, i) => {
    if (!c) return;
    const l = makeLed(c, true, [0.0024, 0.0016], group, (-50 + i * 9) / 1000, H / 2 - 0.006, 0.0005);
    leds.push({ mat: l.mat, key: `${id}:${['PWR', 'PON', 'LOS', 'LAN'][i]}`, role: i === 0 ? 'power' : 'link' });
  });
  ports.add('LAN', V(0.042, H / 2 - 0.003, 0.0006), FRONT);
  return { group, ports: ports.map, pickables: [{ object: body, id }], leds, size: [W, H, D] };
}

// ── NAS Synology DS223j (165 × 100 × 225,5 mm, blanco, 2 bahías) ──────────
export function buildNAS(name = 'NAS') {
  const group = new THREE.Group(); group.name = name;
  const ports = new Ports();
  const W = 0.1, H = 0.165, D = 0.2255;
  const body = rbox(W, H, D, 0.008, M.plasticWhite(), 0, H / 2, -D / 2 + 0.002, group, 3);
  const tex = canvasTex(256, 422, (g, w, h) => {
    g.fillStyle = '#f5f5f2'; g.fillRect(0, 0, w, h);
    const f = mmMapper(g, w, h, 100, 165);
    // panel frontal levemente marcado
    f.rrect(-8, 0, 76, 152, 3, '#f0f0ec', '#dcdcd6', 1.2);
    // franja de indicadores
    f.rrect(38, 18, 12, 112, 3, '#e9e9e4', '#d8d8d2', 1);
    ['STATUS', 'LAN', 'DISK 1', 'DISK 2'].forEach((t, i) => {
      f.circle(38, 60 - i * 13, 1.4, '#c8ccd0');
      f.text(t, 38, 55 - i * 13, 2.4, '#8a9097', 600);
    });
    f.rrect(38, -12, 7, 4, 1, '#22252a'); f.text('USB', 38, -17, 2.4, '#8a9097', 600);
    f.circle(38, -50, 4.5, '#e2e2dd', '#bfc3c7', 1.5); f.circle(38, -50, 1.6, null, '#5d646d', 1.5);
    f.text('DS223j', -8, -66, 4.6, '#9aa0a6', 700);
    f.text(name, -8, 60, 6, '#5d646d', 800);
  });
  facePlane(W - 0.004, H - 0.004, faceMat(tex, { roughness: 0.5, metalness: 0 }), 0, H / 2, 0.0024, group);
  // ventilador trasero
  const fan = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#e9e9e4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#7d838a'; g.lineWidth = 3;
    for (let r = 10; r < 60; r += 9) { g.beginPath(); g.arc(64, 64, r, 0, Math.PI * 2); g.stroke(); }
  });
  const fp = facePlane(0.07, 0.07, faceMat(fan, { roughness: 0.6, metalness: 0 }), 0, 0.105, -D + 0.0015, group);
  fp.rotation.y = Math.PI;
  rearRJ45(group, ports, 'lan', 0.025, 0.035, -D + 0.002);
  const leds = [];
  [['STATUS', '#35e06a'], ['LAN', '#35e06a'], ['DISK1', '#35e06a'], ['DISK2', '#35e06a']].forEach(([k, c], i) => {
    const l = makeLed(c, true, [0.0034, 0.0034], group, 0.038, H / 2 + (60 - i * 13) / 1000, 0.0028);
    leds.push({ mat: l.mat, key: `${name}:${k}`, role: i === 0 ? 'power' : i === 1 ? 'link' : 'act' });
  });
  return { group, ports: ports.map, pickables: [{ object: body, id: name }], leds, size: [W, H, D] };
}

// ── Mini PC ASUS PN41 (115 × 115 × 49 mm) con Issabel ─────────────────────
export function buildPBX(id = 'PBX', ip = '10.10.40.10') {
  const group = new THREE.Group(); group.name = id;
  const ports = new Ports();
  const W = 0.115, H = 0.049, D = 0.115;
  const body = rbox(W, H, D, 0.009, mat('pn41', { color: 0x1c1e22, roughness: 0.42, metalness: 0.5 }), 0, H / 2, -D / 2, group, 3);
  const tex = canvasTex(384, 164, (g, w, h) => {
    g.fillStyle = '#1d1f23'; g.fillRect(0, 0, w, h);
    const f = mmMapper(g, w, h, 115, 49);
    f.circle(-44, 0, 4, '#15171a', '#3b82f6', 2);
    f.rrect(-28, 2, 8.5, 3.2, 1, '#050506', '#555', 1); f.text('USB-C', -28, -4, 2.3, '#8a9097', 600);
    f.rrect(-12, 2, 12.5, 5, 1, '#050506', '#666', 1);
    f.rrect(4, 2, 12.5, 5, 1, '#050506', '#666', 1);
    f.circle(20, 2, 1.8, '#050506', '#666', 1);
    f.text('PN41', 42, 0, 4, '#c3c9d0', 700);
  });
  facePlane(W - 0.012, H - 0.012, faceMat(tex, { roughness: 0.4, metalness: 0.3 }), 0, H / 2, 0.0003, group);
  // etiqueta superior
  const lab = canvasTex(256, 96, (g, w, h) => {
    g.fillStyle = '#f7f7f4'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1b1d21'; g.font = `800 30px ${FONT}`; g.textAlign = 'center'; g.fillText('PBX · Issabel 5', w / 2, 40);
    g.font = `600 24px ${FONT}`; g.fillStyle = '#3b4048'; g.fillText(ip, w / 2, 76);
  });
  const lp = facePlane(0.06, 0.0225, faceMat(lab, { roughness: 0.7, metalness: 0 }), 0, H + 0.0003, -D / 2, group);
  lp.rotation.x = -Math.PI / 2;
  rearRJ45(group, ports, 'lan', -0.02, 0.02, -D);
  const l = makeLed('#3b82f6', true, [0.004, 0.004], group, -0.044, H / 2, 0.0006);
  return { group, ports: ports.map, pickables: [{ object: body, id }], leds: [{ mat: l.mat, key: `${id}:PWR`, role: 'power' }], size: [W, H, D] };
}

// ── PC torre ─────────────────────────────────────────────────────────────
export function buildPCTower(name = 'PC') {
  const group = new THREE.Group(); group.name = name;
  const ports = new Ports();
  const W = 0.19, H = 0.42, D = 0.4;
  const front = canvasTex(256, 566, (g, w, h) => {
    g.fillStyle = '#18191c'; g.fillRect(0, 0, w, h);
    const f = mmMapper(g, w, h, 190, 420);
    f.rrect(0, -20, 150, 330, 6, '#101114');
    drawVents(f, -66, 66, -175, 135, 6, 1.6, '#050506');
    f.circle(0, 180, 9, '#222429', '#4b5058', 2);
    f.circle(0, 180, 3, '#3b82f6');
    f.rrect(-30, 160, 12, 5, 1, '#050506', '#555', 1); f.rrect(-12, 160, 12, 5, 1, '#050506', '#555', 1);
    f.circle(12, 160, 2, '#050506', '#555', 1); f.circle(22, 160, 2, '#050506', '#555', 1);
    f.rrect(0, -190, 70, 16, 3, '#f2f2ef'); f.text(name, 0, -190, 10, '#15171a', 800);
  });
  const back = canvasTex(256, 566, (g, w, h) => {
    g.fillStyle = '#2a2c30'; g.fillRect(0, 0, w, h);
    const f = mmMapper(g, w, h, 190, 420);
    // panel I/O (lado izquierdo visto desde atrás)
    f.rect(-40, 120, 46, 160, '#3b3f46', '#9aa1aa', 1.5);
    for (let i = 0; i < 4; i++) f.rrect(-40, 175 - i * 12, 13, 5, 1, '#0f1012', '#777', 1);
    drawRJ45(f, -40, 120, 13, 11, { used: true, frame: '#9aa1aa' });
    f.text('LAN', -40, 109, 5, '#d5dae0', 700);
    for (let i = 0; i < 3; i++) f.circle(-48 + i * 8, 75, 2.6, ['#4ade80', '#60a5fa', '#f472b6'][i], '#111', 1);
    // ventilador
    f.circle(40, 140, 42, '#1d1f22', '#555', 2); drawVents(f, 10, 70, 110, 170, 7, 2, '#090a0b');
    // ranuras de expansión
    for (let i = 0; i < 7; i++) f.rect(-10, 20 - i * 18, 120, 10, '#43474e', '#202226', 1);
    // fuente
    f.rect(0, -170, 170, 70, '#1f2124', '#4b5058', 1.5); drawVents(f, 20, 75, -195, -145, 6, 2, '#060607');
    f.rrect(-55, -170, 26, 18, 2, '#0a0b0c', '#666', 1.5);
  });
  const fm = faceMat(front, { roughness: 0.5, metalness: 0.2 });
  const bm = faceMat(back, { roughness: 0.5, metalness: 0.5 });
  const side = mat('pcSide', { color: 0x202226, roughness: 0.45, metalness: 0.45 });
  const body = new THREE.Mesh(geo('pcTower', () => new THREE.BoxGeometry(W, H, D)), [side, side, side, side, fm, bm]);
  body.position.set(0, H / 2 + 0.01, 0);
  group.add(body);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.03, 0.01, 0.03, M.rubber(), sx * 0.07, 0.005, sz * 0.16, group);
  // back face texture: u crece hacia -X → canvas x=-40mm ⇒ x local = +0.040
  ports.add('nic', V(0.040, 0.01 + H / 2 + 0.12, -D / 2 - 0.0005), BACK);
  const l = makeLed('#3b82f6', true, [0.006, 0.006], group, 0, 0.01 + H / 2 + 0.18, D / 2 + 0.0005);
  return { group, ports: ports.map, pickables: [{ object: body, id: name }], leds: [{ mat: l.mat, key: `${name}:PWR`, role: 'power' }], size: [W, H + 0.01, D] };
}

// ── Monitor 24" ──────────────────────────────────────────────────────────
export function buildMonitor(name = 'PC', ip = '', vlan = 20) {
  const group = new THREE.Group(); group.name = name + ':monitor';
  const SW = 0.5313, SH = 0.2989, BZ = 0.004, CHIN = 0.016;
  const PW = SW + 2 * BZ, PH = SH + BZ + CHIN;
  const y0 = 0.105; // borde inferior del panel
  const tex = canvasTex(768, 432, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#0b2a5b'); gr.addColorStop(0.55, '#1a4f9c'); gr.addColorStop(1, '#3a7bd5');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // ondas suaves
    g.globalAlpha = 0.18;
    for (let i = 0; i < 5; i++) {
      g.beginPath(); g.moveTo(0, h * (0.55 + i * 0.07));
      g.bezierCurveTo(w * 0.3, h * (0.35 + i * 0.08), w * 0.6, h * (0.85 - i * 0.05), w, h * (0.5 + i * 0.06));
      g.strokeStyle = '#bfe0ff'; g.lineWidth = 2; g.stroke();
    }
    g.globalAlpha = 1;
    // marca del estudio
    g.fillStyle = 'rgba(255,255,255,.9)';
    [[0, 22], [12, 34], [24, 46]].forEach(([dx, hh], i) => g.fillRect(w / 2 - 120 + dx, h / 2 - hh + 10, 9, hh));
    g.font = `700 34px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('Alvarez & Asoc.', w / 2 - 80, h / 2 - 6);
    g.font = `500 16px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText('Estudio contable', w / 2 - 78, h / 2 + 20);
    // barra superior con host e IP
    g.fillStyle = 'rgba(5,12,26,.72)'; g.fillRect(0, 0, w, 30);
    g.fillStyle = '#e8f0ff'; g.font = `700 16px ${FONT}`; g.textAlign = 'left'; g.fillText(name, 12, 15);
    g.font = `600 15px ${FONT}`; g.fillStyle = '#9cc2ff';
    g.fillText(ip ? `${ip} · VLAN ${vlan}` : '', 70, 15);
    g.textAlign = 'right'; g.fillStyle = '#e8f0ff'; g.fillText('● Red: Conectado', w - 12, 15);
    // barra de tareas
    g.fillStyle = 'rgba(5,12,26,.78)'; g.fillRect(0, h - 34, w, 34);
    for (let i = 0; i < 6; i++) { g.fillStyle = ['#60a5fa', '#f59e0b', '#22c55e', '#e5e7eb', '#a78bfa', '#f472b6'][i]; g.fillRect(w / 2 - 105 + i * 36, h - 25, 18, 18); }
  });
  const scr = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.22, metalness: 0 });
  const bez = mat('monBezel', { color: 0x111214, roughness: 0.5, metalness: 0.2 });
  const panel = box(PW, PH, 0.012, bez, 0, y0 + PH / 2, 0, group);
  const screen = facePlane(SW, SH, scr, 0, y0 + CHIN + SH / 2, 0.0062, group);
  box(0.3, 0.17, 0.03, bez, 0, y0 + PH / 2, -0.02, group); // carcasa trasera
  box(0.035, 0.23, 0.018, M.alu(), 0, 0.1 + 0.115 - 0.06, -0.045, group); // cuello
  rbox(0.22, 0.012, 0.17, 0.005, M.alu(), 0, 0.006, -0.03, group);
  // logo inferior
  const l = makeLed('#ffffff', true, [0.0018, 0.0018], group, 0.24, y0 + 0.006, 0.0063);
  return { group, ports: new Map(), pickables: [{ object: screen, id: name }, { object: panel, id: name }], leds: [{ mat: l.mat, key: `${name}:mon`, role: 'power' }], screen, size: [PW, y0 + PH, 0.17] };
}

// ── Teclado y mouse ──────────────────────────────────────────────────────
let kbTex;
export function buildKeyboard() {
  const group = new THREE.Group(); group.name = 'keyboard';
  const W = 0.44, D = 0.135;
  kbTex ??= canvasTex(1024, 314, (g, w, h) => {
    g.fillStyle = '#16171a'; g.fillRect(0, 0, w, h);
    const k = w / 440;
    const key = (x, y, kw, kh = 15) => {
      g.fillStyle = '#2a2c31'; g.beginPath(); g.roundRect(x * k, y * k, kw * k, kh * k, 2 * k); g.fill();
      g.fillStyle = '#34373d'; g.beginPath(); g.roundRect((x + 1) * k, (y + 1) * k, (kw - 2) * k, (kh - 4) * k, 2 * k); g.fill();
    };
    // fila F
    for (let i = 0; i < 13; i++) key(6 + i * 19 + (i > 0 ? 8 : 0) + (i > 4 ? 6 : 0) + (i > 8 ? 6 : 0), 6, 17, 12);
    const rows = [[13, 0], [13, 1], [12, 2], [11, 3]];
    for (let r = 0; r < 4; r++) {
      const off = [0, 27, 31, 40][r];
      for (let i = 0; i < 13 - (r > 1 ? r - 1 : 0); i++) key(6 + off + i * 19, 24 + r * 19, 17);
    }
    key(6, 24 + 19, 25); key(6, 24 + 38, 29); key(6, 24 + 57, 38); key(256, 24, 32); key(266, 43, 22);
    key(6, 100, 24); key(32, 100, 22); key(56, 100, 22); key(80, 100, 120); key(202, 100, 22); key(226, 100, 22); key(250, 100, 22); key(274, 100, 22);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) key(305 + i * 19, 24 + r * 19, 17);
    key(324, 81, 17); key(305, 100, 17); key(324, 100, 17); key(343, 100, 17);
    for (let r = 0; r < 5; r++) for (let i = 0; i < 4; i++) key(368 + i * 17.5, 24 + r * 19, 16);
  });
  rbox(W, 0.018, D, 0.006, mat('kbBody', { color: 0x15161a, roughness: 0.55 }), 0, 0.009, 0, group);
  const top = facePlane(W - 0.006, D - 0.006, faceMat(kbTex, { roughness: 0.6, metalness: 0 }), 0, 0.0186, 0, group);
  top.rotation.x = -Math.PI / 2;
  group.rotation.x = 0.04;
  return { group, ports: new Map(), pickables: [], leds: [], size: [W, 0.02, D] };
}
export function buildMouse() {
  const group = new THREE.Group(); group.name = 'mouse';
  const m = new THREE.Mesh(geo('mouseGeo', () => { const s = new THREE.SphereGeometry(0.03, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2); s.scale(1, 0.55, 1.75); return s; }), mat('mouseMat', { color: 0x1a1b1f, roughness: 0.45 }));
  m.scale.set(0.95, 1, 0.68);
  group.add(m);
  return { group, ports: new Map(), pickables: [], leds: [], size: [0.06, 0.017, 0.11] };
}

// ── Teléfono IP Grandstream GRP2602P ─────────────────────────────────────
export function buildPhone(ext = 101) {
  const group = new THREE.Group(); group.name = `TEL${ext}`;
  const ports = new Ports();
  const W = 0.205, Df = 0.09, Db = -0.085, Hf = 0.024, Hb = 0.068;
  const g0 = geo('phoneBody', () => {
    const s = new THREE.Shape();
    s.moveTo(Df, 0); s.lineTo(Df, Hf - 0.006); s.quadraticCurveTo(Df, Hf, Df - 0.008, Hf + 0.002);
    s.lineTo(Db + 0.01, Hb); s.quadraticCurveTo(Db, Hb + 0.002, Db, Hb - 0.01); s.lineTo(Db, 0); s.lineTo(Df, 0);
    const e = new THREE.ExtrudeGeometry(s, { depth: W, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 4 });
    e.rotateY(-Math.PI / 2); e.translate(W / 2, 0, 0);
    return e;
  });
  const bodyMat = mat('phoneBody', { color: 0x1c1d20, roughness: 0.55, metalness: 0 });
  const body = new THREE.Mesh(g0, bodyMat);
  group.add(body);
  // placa superior inclinada con teclas
  const slopeLen = Math.hypot(Df - Db, Hb - Hf) - 0.012;
  const alpha = Math.atan2(Hb - Hf, Df - Db);
  const tex = canvasTex(512, Math.round(512 * slopeLen / (W - 0.012)), (g, w, h) => {
    g.fillStyle = '#1e1f23'; g.fillRect(0, 0, w, h);
    const f = mmMapper(g, w, h, (W - 0.012) * 1000, slopeLen * 1000);
    // zona del tubo (izquierda)
    f.rrect(-62, 0, 58, slopeLen * 1000 - 8, 8, '#141518');
    // LCD
    f.rrect(30, 50, 92, 40, 3, '#0a0b0c', '#3a3d43', 1.5);
    // teclas de línea y navegación
    for (let i = 0; i < 2; i++) f.rrect(-16, 58 - i * 14, 9, 7, 2, '#4a4e57');
    f.circle(30, 12, 11, '#3d4148', '#5b6068', 1.5); f.circle(30, 12, 4.5, '#565a62');
    [0, 1, 2].forEach((i) => f.rrect(5 + i * 25, 30, 18, 5, 2, '#4a4e57'));
    // teclado numérico 3×4
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
    keys.forEach((k, i) => {
      const x = 8 + (i % 3) * 22, y = -10 - Math.floor(i / 3) * 12;
      f.rrect(x, y, 18, 9, 2.5, '#4a4e57'); f.text(k, x, y, 5.5, '#ffffff', 800);
    });
    ['MUTE', 'HOLD', 'XFER'].forEach((t, i) => { f.rrect(78, -10 - i * 12, 14, 9, 2.5, '#3a3d44'); f.text(t, 78, -10 - i * 12, 2.8, '#e6e9ee', 700); });
    f.rrect(78, -46, 14, 9, 2.5, '#2a2c31'); f.circle(78, -46, 2, '#d33');
    f.text('GRANDSTREAM', 30, 77, 3, '#8a9097', 700);
  });
  const top = facePlane(W - 0.012, slopeLen, faceMat(tex, { roughness: 0.5, metalness: 0 }), 0, (Hf + Hb) / 2 + 0.0072, (Df + Db) / 2 + 0.0019, group);
  top.rotation.x = -(Math.PI / 2 - alpha);
  // LCD emisivo con el interno
  const lcdTex = canvasTex(256, 112, (g, w, h) => {
    g.fillStyle = '#c8dcea'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#10243a'; g.font = `800 40px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(String(ext), 14, 46);
    g.font = `600 18px ${FONT}`; g.fillText('Interno · VLAN 40', 14, 88);
    g.textAlign = 'right'; g.fillText('12:00', w - 10, 22);
  });
  const lcd = new THREE.Mesh(geo('phoneLcd', () => new THREE.PlaneGeometry(0.088, 0.038)),
    new THREE.MeshStandardMaterial({ map: lcdTex, emissiveMap: lcdTex, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.2 }));
  // ubicar LCD sobre la placa: coordenadas de la placa (x=30mm, v=50mm hacia atrás)
  lcd.rotation.copy(top.rotation);
  const v = 0.05, cosA = Math.cos(alpha), sinA = Math.sin(alpha);
  lcd.position.set(0.03, top.position.y + v * sinA + 0.0007 * cosA, top.position.z - v * cosA + 0.0007 * sinA);
  group.add(lcd);
  // tubo
  const hs = new THREE.Group();
  rbox(0.05, 0.028, 0.2, 0.012, bodyMat, 0, 0, 0, hs, 3);
  rbox(0.054, 0.034, 0.05, 0.014, bodyMat, 0, -0.004, 0.075, hs, 2);
  rbox(0.054, 0.034, 0.05, 0.014, bodyMat, 0, -0.004, -0.075, hs, 2);
  hs.position.set(-0.062, (Hf + Hb) / 2 + 0.026, (Df + Db) / 2);
  hs.rotation.x = alpha;
  group.add(hs);
  // cable rulo del tubo
  const pts = [];
  for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push(V(-0.09 - 0.01 * Math.sin(t * 40), 0.03 + 0.008 * Math.cos(t * 40) - t * 0.02, 0.07 - t * 0.12)); }
  const coil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.0015, 4), bodyMat);
  group.add(coil);
  rearRJ45(group, ports, 'lan', 0.04, 0.022, Db - 0.003);
  ports.add('pc', V(0.06, 0.022, Db - 0.006), BACK);
  return { group, ports: ports.map, pickables: [{ object: body, id: `TEL${ext}` }, { object: top, id: `TEL${ext}` }], leds: [], size: [W, Hb, Df - Db] };
}

// ── Impresora multifunción láser ─────────────────────────────────────────
export function buildPrinter(name = 'IMP') {
  const group = new THREE.Group(); group.name = name;
  const ports = new Ports();
  const W = 0.42, D = 0.4;
  const shell = mat('printerShell', { color: 0xe7e7e3, roughness: 0.5 });
  const dark = mat('printerDark', { color: 0x2b2d31, roughness: 0.55 });
  const front = canvasTex(512, 380, (g, w, h) => {
    g.fillStyle = '#e9e9e5'; g.fillRect(0, 0, w, h);
    const f = mmMapper(g, w, h, 420, 310);
    f.rect(0, -90, 400, 1.2, '#b9bcc0'); // separación bandeja
    f.rrect(0, -120, 120, 10, 4, '#cfd1d4', '#a9acb0', 1);
    f.rect(0, 40, 400, 1.2, '#c7c9cc');
    f.rrect(-150, 120, 70, 18, 3, '#f7f7f4', '#c2c5c9', 1); f.text(name, -150, 120, 10, '#1b1d21', 800);
    f.rect(-150, 98, 70, 6, '#2b2d31'); // ranura salida
  });
  const fm = faceMat(front, { roughness: 0.5, metalness: 0 });
  const body = new THREE.Mesh(geo('printerBody', () => new THREE.BoxGeometry(W, 0.31, D)), [shell, shell, shell, shell, fm, shell]);
  body.position.set(0, 0.155, 0); group.add(body);
  // salida de papel (hueco oscuro superior)
  box(0.3, 0.012, 0.26, dark, -0.02, 0.304, 0.03, group);
  // escáner + ADF
  box(W, 0.065, D - 0.02, shell, 0, 0.31 + 0.0325 + 0.02, -0.01, group);
  for (const sx of [-1, 1]) box(0.03, 0.02, D - 0.04, shell, sx * 0.195, 0.32, -0.01, group);
  box(0.3, 0.035, 0.24, dark, 0, 0.395 + 0.0175 + 0.0005, -0.06, group);
  box(0.24, 0.006, 0.14, mat('adfTray', { color: 0x3a3d42, roughness: 0.5 }), 0, 0.432, 0.02, group);
  // panel de control táctil
  const pan = canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#0d1b2e'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1e3a8a'; g.fillRect(0, 0, w, 24);
    g.fillStyle = '#fff'; g.font = `700 15px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(`${name} · Lista`, 8, 12);
    ['Copiar', 'Escanear', 'Imprimir'].forEach((t, i) => { g.fillStyle = '#25406b'; g.fillRect(10 + i * 82, 44, 72, 60); g.fillStyle = '#dbeafe'; g.textAlign = 'center'; g.font = `600 13px ${FONT}`; g.fillText(t, 46 + i * 82, 90); });
  });
  const pm = new THREE.MeshStandardMaterial({ map: pan, emissiveMap: pan, emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.2 });
  box(0.17, 0.02, 0.09, dark, 0.11, 0.38, 0.19, group).rotation.x = 0.5;
  const p = facePlane(0.13, 0.065, pm, 0.11, 0.384, 0.199, group);
  p.rotation.x = 0.5 - Math.PI / 2;
  p.position.set(0.11, 0.3905, 0.19);
  rearRJ45(group, ports, 'lan', 0.15, 0.08, -D / 2);
  return { group, ports: ports.map, pickables: [{ object: body, id: name }], leds: [], size: [W, 0.44, D] };
}

// ── Access point TP-Link EAP650 (techo) ──────────────────────────────────
export function buildAP(id = 'AP') {
  const group = new THREE.Group(); group.name = id;
  const ports = new Ports();
  const R = 0.1215;
  const g0 = geo('eapLathe', () => {
    const pts = [V(0, -0.006, 0), V(R * 0.86, -0.006, 0), V(R * 0.97, -0.01, 0), V(R, -0.018, 0), V(R * 0.98, -0.028, 0), V(R * 0.9, -0.036, 0), V(R * 0.5, -0.0405, 0), V(0, -0.041, 0)]
      .map((p) => new THREE.Vector2(p.x, p.y));
    return new THREE.LatheGeometry(pts, 48);
  });
  const body = new THREE.Mesh(g0, mat('eapWhite', { color: 0xf7f7f5, roughness: 0.38, metalness: 0, side: THREE.DoubleSide }));
  group.add(body);
  cyl(0.06, 0.06, 0.006, 32, M.plasticOff(), 0, -0.003, 0, group); // soporte de techo
  // logo / LED
  const logo = canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#9aa3ad'; g.font = `800 34px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('tp-link', w / 2, h / 2 + 50);
  });
  const lp = new THREE.Mesh(geo('eapLogoPlane', () => new THREE.PlaneGeometry(0.12, 0.12)), new THREE.MeshStandardMaterial({ map: logo, transparent: true, roughness: 0.5 }));
  lp.rotation.x = Math.PI / 2; lp.position.y = -0.0413; group.add(lp);
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x0f5132, emissive: 0x2ee86f, emissiveIntensity: 2.2, roughness: 0.3 });
  const led = new THREE.Mesh(geo('eapLed', () => new THREE.CircleGeometry(0.0045, 20)), ledMat);
  led.rotation.x = Math.PI / 2; led.position.y = -0.0414; group.add(led);
  ports.add('lan', V(0, 0, 0), UP);
  return { group, ports: ports.map, pickables: [{ object: body, id }], leds: [{ mat: ledMat, key: `${id}:LED`, role: 'power' }], size: [2 * R, 0.041, 2 * R] };
}

// ── UPS ──────────────────────────────────────────────────────────────────
export function buildUPS(kind = 'apc', id = 'UPS') {
  const group = new THREE.Group(); group.name = id;
  const apc = kind === 'apc';
  const W = apc ? 0.115 : 0.1, H = apc ? 0.24 : 0.17, D = apc ? 0.335 : 0.285;
  const body = rbox(W, H, D, 0.01, mat('upsBody', { color: 0x141518, roughness: 0.55 }), 0, H / 2, 0, group, 2);
  const tex = canvasTex(256, Math.round(256 * H / W), (g, w, h) => {
    g.fillStyle = '#17181b'; g.fillRect(0, 0, w, h);
    const f = mmMapper(g, w, h, W * 1000, H * 1000);
    if (apc) {
      f.rrect(0, 40, 80, 120, 10, '#1d1f23', '#2c2f35', 2);
      f.circle(0, 75, 9, '#222429', '#555b63', 2);
      f.text('APC', 0, -60, 16, '#e6e9ee', 900);
      f.text('Back-UPS', 0, -78, 7, '#9aa3ad', 600);
      f.text('BX1200MI-AR', 0, -95, 6, '#9aa3ad', 600);
    } else {
      f.rect(0, 30, W * 1000, 4, '#2563eb');
      f.circle(0, 0, 8, '#222429', '#555b63', 2);
      f.text('ATOMLUX', 0, -40, 9, '#e6e9ee', 900);
      f.text('1000 VA', 0, -55, 7, '#9aa3ad', 600);
    }
  });
  facePlane(W - 0.008, H - 0.01, faceMat(tex, { roughness: 0.5, metalness: 0 }), 0, H / 2, D / 2 + 0.0003, group);
  const l = makeLed('#35e06a', true, [0.005, 0.005], group, apc ? 0 : 0.02, H / 2 + (apc ? 0.075 : 0.0), D / 2 + 0.0006);
  return { group, ports: new Map(), pickables: [{ object: body, id }], leds: [{ mat: l.mat, key: id, role: 'power' }], size: [W, H, D] };
}

// ── Toma de pared: caja de superficie + placa keystone simple/doble ───────
let keystoneTex;
export function buildJackPlate(labels = ['R1-PP1-01']) {
  const n = Math.min(2, labels.length);
  const group = new THREE.Group(); group.name = 'plate:' + labels.join('|');
  const ports = new Ports();
  const BW = 0.075, BH = 0.12, BD = 0.038;
  box(BW, BH, BD, M.pvc(), 0, 0, BD / 2, group); // caja de superficie
  const plate = rbox(BW + 0.004, BH + 0.004, 0.006, 0.003, mat('plateWhite', { color: 0xfbfbf9, roughness: 0.35 }), 0, 0, BD + 0.003, group);
  keystoneTex ??= canvasTex(128, 160, (g, w, h) => {
    g.fillStyle = '#f7f7f5'; g.fillRect(0, 0, w, h);
    const f = mmMapper(g, w, h, 16, 20);
    drawRJ45(f, 0, -1, 11.8, 10.4, { used: true, frame: '#e2e2de' });
    f.text('CAT6', 0, 7.5, 2.2, '#8a9097', 800);
  });
  const ksMat = faceMat(keystoneTex, { roughness: 0.4, metalness: 0 });
  const xs = n === 1 ? [0] : [-0.018, 0.018];
  const picks = [];
  labels.slice(0, n).forEach((lab, i) => {
    const x = xs[i];
    box(0.0165, 0.021, 0.004, M.plasticWhite(), x, -0.008, BD + 0.0062, group);
    facePlane(0.016, 0.02, ksMat, x, -0.008, BD + 0.0083, group);
    // etiqueta de rotuladora (fondo blanco, texto negro)
    const lt = canvasTex(256, 64, (g, w, h) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#d0d0cc'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
      g.fillStyle = '#111'; g.font = `800 34px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(lab, w / 2, h / 2 + 2);
    });
    facePlane(n === 1 ? 0.044 : 0.032, n === 1 ? 0.011 : 0.008, faceMat(lt, { roughness: 0.6, metalness: 0 }), x, 0.024, BD + 0.0062, group);
    const pos = V(x, -0.009, BD + 0.0085);
    ports.add('J' + i, pos, FRONT);
    picks.push({ pos, id: lab });
  });
  ports.add('back', V(0, BH / 2, BD / 2), UP);
  const pi = pickInstances(picks, [0.018, 0.024, 0.01]);
  group.add(pi.mesh);
  return { group, ports: ports.map, pickables: [{ object: pi.mesh, id: group.name, instanceMap: pi.instanceMap }, { object: plate, id: group.name }], leds: [], size: [BW, BH, BD] };
}

// ── Mobiliario de respaldo ───────────────────────────────────────────────
export function buildDesk(w = 1.4, d = 0.7, opts = {}) {
  const group = new THREE.Group(); group.name = 'desk';
  const H = 0.75, T = 0.025;
  const wood = opts.woodMap
    ? new THREE.MeshStandardMaterial({ map: opts.woodMap, normalMap: opts.woodNormal || null, roughnessMap: opts.woodRough || null, roughness: 0.55, metalness: 0 })
    : mat('deskWood', { color: 0xc49a6c, roughness: 0.55 });
  const metal = mat('deskMetal', { color: 0x2b2e33, roughness: 0.4, metalness: 0.7 });
  const top = rbox(w, T, d, 0.004, wood, 0, H - T / 2, 0, group, 1);
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - 0.06);
    box(0.05, 0.03, d - 0.06, metal, x, 0.015, 0, group); // pie
    box(0.05, 0.03, d - 0.1, metal, x, H - T - 0.015, 0, group); // travesaño superior
    box(0.06, H - T - 0.06, 0.06, metal, x, (H - T) / 2 + 0.015, 0, group); // columna
  }
  box(w - 0.16, 0.04, 0.03, metal, 0, H - T - 0.02, -d / 2 + 0.08, group);
  box(w - 0.2, 0.32, 0.012, opts.panelMat || metal, 0, H - T - 0.2, -d / 2 + 0.09, group); // faldón
  const grom = cyl(0.03, 0.03, 0.004, 20, M.plasticBlack(), w / 2 - 0.18, H + 0.0005, -d / 2 + 0.08, group);
  return { group, ports: new Map([['grommet', { pos: V(w / 2 - 0.18, H, -d / 2 + 0.08), dir: UP }]]), pickables: [{ object: top, id: 'desk' }], leds: [], size: [w, H, d], top: H };
}

export function buildOfficeChair() {
  const group = new THREE.Group(); group.name = 'chair';
  const metal = mat('chairMetal', { color: 0x2a2c30, roughness: 0.35, metalness: 0.8 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leg = box(0.03, 0.022, 0.3, metal, Math.sin(a) * 0.15, 0.06, Math.cos(a) * 0.15, group);
    leg.rotation.y = a;
    const w = cyl(0.025, 0.025, 0.022, 10, M.plasticBlack(), Math.sin(a) * 0.3, 0.026, Math.cos(a) * 0.3, group);
    w.rotation.z = Math.PI / 2; w.rotation.y = a;
  }
  cyl(0.04, 0.04, 0.03, 12, M.plasticBlack(), 0, 0.07, 0, group);
  cyl(0.016, 0.016, 0.3, 12, M.chrome(), 0, 0.22, 0, group);
  box(0.2, 0.03, 0.2, M.plasticBlack(), 0, 0.38, 0, group);
  const seat = rbox(0.48, 0.075, 0.47, 0.03, M.fabric(), 0, 0.44, 0.01, group, 3);
  // respaldo: marco + malla
  const back = new THREE.Group();
  rbox(0.46, 0.56, 0.03, 0.03, M.plasticBlack(), 0, 0, 0, back, 2);
  const meshP = new THREE.Mesh(geo('chairMeshPlane', () => new THREE.PlaneGeometry(0.4, 0.5)), M.mesh());
  meshP.position.z = 0.016; back.add(meshP);
  rbox(0.38, 0.06, 0.03, 0.02, M.plasticBlack(), 0, -0.12, 0.02, back);
  back.position.set(0, 0.8, -0.24); back.rotation.x = -0.12;
  group.add(back);
  box(0.05, 0.3, 0.03, M.plasticBlack(), 0, 0.55, -0.24, group);
  for (const sx of [-1, 1]) {
    box(0.025, 0.2, 0.025, M.plasticBlack(), sx * 0.25, 0.55, -0.02, group);
    rbox(0.06, 0.025, 0.25, 0.01, M.plasticBlack(), sx * 0.25, 0.66, 0.0, group);
  }
  return { group, ports: new Map(), pickables: [{ object: seat, id: 'chair' }], leds: [], size: [0.65, 1.08, 0.65] };
}

export function buildMeetingTable(w = 2.74, d = 1.23, opts = {}) {
  const group = new THREE.Group(); group.name = 'meetingTable';
  const H = 0.75, T = 0.035, r = d / 2;
  const wood = opts.woodMap
    ? new THREE.MeshStandardMaterial({ map: opts.woodMap, normalMap: opts.woodNormal || null, roughnessMap: opts.woodRough || null, roughness: 0.5 })
    : mat('tableWood', { color: 0xb88a5d, roughness: 0.5 });
  const s = new THREE.Shape();
  const L = w / 2 - r;
  s.moveTo(-L, -r); s.lineTo(L, -r); s.absarc(L, 0, r, -Math.PI / 2, Math.PI / 2, false); s.lineTo(-L, r); s.absarc(-L, 0, r, Math.PI / 2, Math.PI * 1.5, false);
  const eg = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 24 });
  eg.rotateX(-Math.PI / 2);
  // UV planar para la madera
  const pos = eg.attributes.position, uv = eg.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 1.2, pos.getZ(i) / 1.2);
  const top = new THREE.Mesh(eg, wood);
  top.position.y = H - T;
  group.add(top);
  const metal = mat('deskMetal', { color: 0x2b2e33, roughness: 0.4, metalness: 0.7 });
  for (const sx of [-1, 1]) {
    cyl(0.04, 0.04, H - T - 0.02, 16, metal, sx * L * 0.7, (H - T) / 2 + 0.01, 0, group);
    box(0.08, 0.02, d * 0.75, metal, sx * L * 0.7, 0.01, 0, group);
  }
  return { group, ports: new Map(), pickables: [{ object: top, id: 'meetingTable' }], leds: [], size: [w, H, d], top: H };
}

export function buildCanaletaSegment(len = 1) {
  const group = new THREE.Group(); group.name = 'canaleta';
  const body = new THREE.Mesh(geo('canaletaUnit', () => { const b = new THREE.BoxGeometry(1, 0.06, 0.04); b.translate(0.5, 0, 0.02); return b; }), M.pvc());
  body.scale.x = len; group.add(body);
  const groove = mat('canaletaGroove', { color: 0xd9d9d4, roughness: 0.6 });
  for (const y of [-0.026, 0.026]) {
    const gr = new THREE.Mesh(geo('canaletaGroove', () => { const b = new THREE.BoxGeometry(1, 0.0015, 0.0015); b.translate(0.5, 0, 0); return b; }), groove);
    gr.scale.x = len; gr.position.set(0, y, 0.0402); group.add(gr);
  }
  return { group, ports: new Map([['start', { pos: V(0, 0, 0.02), dir: V(-1, 0, 0) }], ['end', { pos: V(len, 0, 0.02), dir: V(1, 0, 0) }]]), pickables: [], leds: [], size: [len, 0.06, 0.04] };
}
