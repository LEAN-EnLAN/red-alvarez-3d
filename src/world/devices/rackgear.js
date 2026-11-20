// Equipos montables en rack 19" (frente en z=0, origen en el centro de la cara frontal,
// cuerpo hacia -Z): patch panel, organizador, switches, PDU, paneles ciegos, carrete de fibra.
import * as THREE from 'three';
import {
  UH, M, mat, box, cyl, faceBox, canvasTex, faceMat, mmMapper, drawRJ45, drawSFP, drawVents, drawScrew,
  Ports, makeLed, pickInstances, geo, FONT,
} from './common.js';

const EAR_W = 0.4826; // ancho total con orejas (19")
const BODY_W = 0.44;

function brushed(g, W, H, base = '#24272c', hi = '#2d3036') {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, hi); gr.addColorStop(1, base);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.05;
  for (let i = 0; i < H; i += 2) { g.fillStyle = i % 4 ? '#fff' : '#000'; g.fillRect(0, i, W, 1); }
  g.globalAlpha = 1;
}

// Orejas de montaje con tornillos
function ears(group, bodyW = BODY_W, material = M.devBlack()) {
  const w = (EAR_W - bodyW) / 2;
  for (const s of [-1, 1]) {
    box(w, UH - 0.0012, 0.0018, material, s * (bodyW / 2 + w / 2), 0, -0.0009, group);
    // tornillos
    for (const dy of [-0.0127, 0.0127]) {
      const sc = cyl(0.0026, 0.0026, 0.0016, 10, mat('earScrew', { color: 0x5b6068, roughness: 0.45, metalness: 0.8 }), s * (EAR_W / 2 - 0.0085), dy * 0.6, 0.0006, group);
      sc.rotation.x = Math.PI / 2;
    }
  }
}

// ── Patch panel 24 bocas Cat6 ────────────────────────────────────────────
export function ppPortX(n) {
  const i = n - 1, g = Math.floor(i / 6), k = i % 6;
  return -201 + g * (6 * 16 + 6) + k * 16 + 8; // mm
}
export function buildPatchPanel(id, used = new Set(), n = 24) {
  const group = new THREE.Group(); group.name = id;
  const ports = new Ports();
  const PY = 4; // mm, centro de bocas
  const tex = canvasTex(1024, 94, (g, W, H) => {
    brushed(g, W, H, '#1c1e22', '#262a30');
    const f = mmMapper(g, W, H, EAR_W * 1000, UH * 1000);
    // orejas: agujeros de montaje ovalados
    for (const s of [-1, 1]) for (const dy of [-12.7, 12.7]) f.rrect(s * 232.6, dy * 0.6, 6.5, 4, 2, '#0a0a0b');
    f.text(id, -216, 0, 7, '#e8edf3', 800);
    for (let p = 1; p <= n; p++) {
      const x = ppPortX(p);
      const u = used.has(p);
      // marco keystone
      f.rrect(x, PY, 14, 14.5, 1, u ? '#2b2f36' : '#3a3f46');
      drawRJ45(f, x, PY, 11.6, 10.2, { used: u, frame: u ? '#43484f' : '#555b63' });
      f.text(String(p), x, -12.5, 4.4, u ? '#f2f5f9' : '#9aa3ad', 700);
    }
    // franja de etiquetas de grupo
    for (let gI = 0; gI < 4; gI++) {
      const x0 = ppPortX(gI * 6 + 1) - 7, x1 = ppPortX(gI * 6 + 6) + 7;
      f.rect((x0 + x1) / 2, 17.8, x1 - x0, 0.6, '#5d646d');
    }
    f.text('CAT 6', 214, 13, 3.6, '#9aa3ad', 700);
  });
  const fm = faceMat(tex, { roughness: 0.45, metalness: 0.55 });
  faceBox(EAR_W, UH - 0.0012, 0.0016, fm, M.devBlack(), 0, 0, -0.0008, group);
  // módulo trasero (bloques de inserción IDC)
  box(0.43, 0.034, 0.085, M.devBlack(), 0, 0, -0.045, group);
  const picks = [];
  for (let p = 1; p <= n; p++) {
    const key = `${id}-${String(p).padStart(2, '0')}`;
    const pos = new THREE.Vector3(ppPortX(p) / 1000, PY / 1000, 0.0006);
    ports.add(key, pos, new THREE.Vector3(0, 0, 1));
    ports.add(key + ':back', new THREE.Vector3(pos.x, pos.y, -0.088), new THREE.Vector3(0, 0, -1));
    picks.push({ pos, id: key });
  }
  const pi = pickInstances(picks, [0.014, 0.014, 0.01]);
  group.add(pi.mesh);
  return { group, ports: ports.map, pickables: [{ object: pi.mesh, id, instanceMap: pi.instanceMap }], leds: [] };
}

// ── Organizador horizontal 1U ────────────────────────────────────────────
export function buildOrganizer() {
  const group = new THREE.Group(); group.name = 'organizer';
  const tex = canvasTex(1024, 94, (g, W, H) => {
    brushed(g, W, H, '#17191c', '#202328');
    const f = mmMapper(g, W, H, EAR_W * 1000, UH * 1000);
    for (const s of [-1, 1]) for (const dy of [-12.7, 12.7]) f.rrect(s * 232.6, dy * 0.6, 6.5, 4, 2, '#0a0a0b');
    // ventanas rectangulares (finger duct)
    for (let i = 0; i < 10; i++) f.rrect(-189 + i * 42, 0, 30, 26, 2, '#08090a', '#2b2e33', 1);
  });
  faceBox(EAR_W, UH - 0.0012, 0.0016, faceMat(tex, { metalness: 0.5 }), M.devBlack(), 0, 0, -0.0008, group);
  // anillos D (5)
  const ringGeo = geo('dring', () => new THREE.TorusGeometry(0.016, 0.0026, 6, 12, Math.PI));
  for (let i = 0; i < 5; i++) {
    const r = new THREE.Mesh(ringGeo, M.devBlack());
    r.rotation.set(Math.PI / 2, 0, 0); // arco saliendo hacia +Z
    r.position.set(-0.18 + i * 0.09, 0, 0.0005);
    r.scale.set(1, 2.1, 1);
    group.add(r);
  }
  return { group, ports: new Map(), pickables: [], leds: [] };
}
export const ORGANIZER_RING_X = [-0.18, -0.09, 0, 0.09, 0.18];

// ── Switches ─────────────────────────────────────────────────────────────
const LED_GREEN = '#35e06a';
const LED_AMBER = '#ffb020';

// Layout TL-SG2428P (mm sobre el frente de 440 mm, centrado)
export function sg2428Port(p) {
  if (p <= 24) {
    const i = p - 1, col = Math.floor(i / 2), top = i % 2 === 0;
    const b = Math.floor(col / 4), c = col % 4;
    return { x: -70 + b * 66 + c * 14.5 + 7.25, y: top ? 7 : -7, top, sfp: false };
  }
  const j = Math.floor((p - 25) / 2), top = (p - 25) % 2 === 0;
  return { x: 140 + j * 17, y: top ? 6.6 : -6.6, top, sfp: true };
}
// Layout TL-SG2210P (frente 294 mm): 8 RJ45 en fila + SFP 9-10
export function sg2210Port(p) {
  if (p <= 8) return { x: -38 + (p - 1) * 16, y: 3, top: true, sfp: false };
  return { x: 100 + (p - 9) * 19, y: 3, top: true, sfp: true };
}

function buildSwitch({ id, model, faceW, depth, nPorts, layout, used, ledGrid, extra }) {
  const group = new THREE.Group(); group.name = id;
  const ports = new Ports();
  const leds = [];
  const W = Math.round(faceW * 2.33 / 2) * 2, H = Math.round(44 * 2.33);
  const tex = canvasTex(W, H, (g, w, h) => {
    brushed(g, w, h, '#202328', '#2c3036');
    const f = mmMapper(g, w, h, faceW, 44);
    // marco perimetral
    g.strokeStyle = '#3c4148'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
    f.text('tp-link', -faceW / 2 + 6, 13, 6.2, '#4fd1d9', 800, 'left');
    f.text('JetStream', -faceW / 2 + 6, 5.5, 3.4, '#cfd6de', 600, 'left');
    f.text(model, -faceW / 2 + 6, -12.5, 3.8, '#e9edf2', 700, 'left');
    // LEDs de sistema
    ledGrid.sys.forEach((s, i) => {
      f.rect(s.x, s.y, 2.6, 1.8, '#0e2414');
      f.text(s.label, s.x, s.y - 3.6, 2.3, '#9aa3ad', 600);
    });
    // LEDs por puerto
    for (let p = 1; p <= nPorts; p++) {
      const L = ledGrid.port(p);
      f.rect(L.x, L.y, 2.4, 1.6, used.has(p) ? '#123a1f' : '#0c1a11');
    }
    f.text(ledGrid.caption, ledGrid.captionX, ledGrid.captionY, 2.3, '#9aa3ad', 600);
    // puertos
    for (let p = 1; p <= nPorts; p++) {
      const P = layout(p);
      const u = used.has(p);
      if (P.sfp) {
        drawSFP(f, P.x, P.y, 14, 9.6, u);
        f.text(String(p), P.x, P.top ? P.y + 7.8 : P.y - 7.8, 3, '#dfe5ec', 700);
      } else {
        drawRJ45(f, P.x, P.y, 11.8, 10.2, { used: u, flip: !P.top, frame: '#6b727a' });
        f.text(String(p), P.x, P.top ? P.y + 8.6 : P.y - 8.6, 3, u ? '#ffffff' : '#9aa3ad', 700);
      }
    }
    if (extra) extra(f);
  });
  const fm = faceMat(tex, { roughness: 0.42, metalness: 0.55 });
  faceBox(faceW / 1000, 0.0432, depth, fm, M.devBlack(), 0, 0, -depth / 2, group);
  ears(group, faceW / 1000);
  // LEDs emisivos (puertos usados + PWR/SYS)
  for (const s of ledGrid.sys.filter((s) => s.on)) {
    const l = makeLed(LED_GREEN, true, [0.0026, 0.0018], group, s.x / 1000, s.y / 1000, 0.0004);
    leds.push({ mat: l.mat, key: `${id}:${s.label}`, role: 'power' });
  }
  const picks = [];
  for (let p = 1; p <= nPorts; p++) {
    const P = layout(p);
    const key = P.sfp ? `${id}/SFP${p}` : `${id}/${p}`;
    const pos = new THREE.Vector3(P.x / 1000, P.y / 1000, 0.0006);
    ports.add(key, pos, new THREE.Vector3(0, 0, 1));
    picks.push({ pos, id: key });
    if (used.has(p)) {
      const L = ledGrid.port(p);
      const l = makeLed(LED_GREEN, true, [0.0024, 0.0016], group, L.x / 1000, L.y / 1000, 0.0004);
      leds.push({ mat: l.mat, key, role: 'link' });
    }
  }
  const pi = pickInstances(picks, [0.0135, 0.0115, 0.01]);
  group.add(pi.mesh);
  return { group, ports: ports.map, pickables: [{ object: pi.mesh, id, instanceMap: pi.instanceMap }], leds };
}

export function buildSG2428P(id = 'SW1', used = new Set()) {
  return buildSwitch({
    id, model: 'TL-SG2428P', faceW: 440, depth: 0.22, nPorts: 28, layout: sg2428Port, used,
    ledGrid: {
      sys: [
        { x: -150, y: 13, label: 'PWR', on: true }, { x: -140, y: 13, label: 'SYS', on: true },
        { x: -130, y: 13, label: 'FAN', on: false }, { x: -120, y: 13, label: 'PoE', on: false },
      ],
      port: (p) => { const i = p - 1; return { x: -150 + Math.floor(i / 2) * 4.6, y: i % 2 === 0 ? 1.5 : -3.5 }; },
      caption: 'Link/Act · 1–28', captionX: -119, captionY: -10,
    },
    extra: (f) => {
      // consola RJ45 + micro USB (sin uso)
      drawRJ45(f, 190, 6, 11.4, 9.8, { used: false });
      f.text('CONSOLE', 190, -3.8, 2.4, '#9aa3ad', 600);
      f.rrect(190, -10, 7, 2.6, 0.8, '#0b0c0e', '#777', 1);
      f.text('SFP', 148.5, 16.5, 2.6, '#9aa3ad', 700);
      f.text('PoE+ 1–24', -40, -19.6, 2.6, '#4fd1d9', 700, 'left');
    },
  });
}
export function buildSG2210P(id = 'SW2', used = new Set()) {
  const res = buildSwitch({
    id, model: 'TL-SG2210P', faceW: 294, depth: 0.18, nPorts: 10, layout: sg2210Port, used,
    ledGrid: {
      sys: [{ x: -96, y: 13, label: 'PWR', on: true }, { x: -87, y: 13, label: 'SYS', on: true }, { x: -78, y: 13, label: 'PoE', on: false }],
      port: (p) => { const i = p - 1; return { x: -96 + Math.floor(i / 2) * 4.8, y: i % 2 === 0 ? 1.5 : -3.5 }; },
      caption: 'Link/Act', captionX: -86, captionY: -10,
    },
    extra: (f) => {
      f.text('PoE+ 1–8', 18, 15, 2.8, '#4fd1d9', 700);
      f.text('SFP', 109.5, 15, 2.8, '#9aa3ad', 700);
    },
  });
  return res;
}

// ── PDU 6 tomas IRAM 2073 ─────────────────────────────────────────────────
export function buildPDU(id) {
  const group = new THREE.Group(); group.name = id;
  const tex = canvasTex(1024, 94, (g, W, H) => {
    brushed(g, W, H, '#16181b', '#1f2226');
    const f = mmMapper(g, W, H, EAR_W * 1000, UH * 1000);
    for (const s of [-1, 1]) for (const dy of [-12.7, 12.7]) f.rrect(s * 232.6, dy * 0.6, 6.5, 4, 2, '#0a0a0b');
    f.text('PDU', -205, 4, 6, '#e8edf3', 800);
    f.text('Reguvolt', -205, -6, 3.2, '#9aa3ad', 600);
    for (let i = 0; i < 6; i++) {
      const x = -150 + i * 52;
      f.rrect(x, 0, 36, 36, 3, '#0d0e10', '#33373d', 1.5);
      f.circle(x, 0, 14, '#1a1c20', '#3d4249', 1.2);
      // IRAM 2073: dos patas planas en V + tierra
      g.save();
      const cx = f.X(x), cy = f.Y(0), s = f.sx;
      g.fillStyle = '#000';
      g.translate(cx, cy);
      for (const sg of [-1, 1]) {
        g.save(); g.translate(sg * 5.2 * s, 2.5 * s); g.rotate(sg * 0.52); g.fillRect(-0.9 * s, -3.3 * s, 1.8 * s, 6.6 * s); g.restore();
      }
      g.fillRect(-0.9 * s, -9 * s, 1.8 * s, 6 * s);
      g.restore();
    }
    // interruptor iluminado
    f.rrect(196, 0, 16, 22, 2, '#3a0b0b', '#5b1414', 1.5);
    f.rect(196, 4, 12, 9, '#c81e1e');
  });
  faceBox(EAR_W, UH - 0.0012, 0.05, faceMat(tex, { metalness: 0.45 }), M.devBlack(), 0, 0, -0.025, group);
  const l = makeLed('#ff3030', true, [0.011, 0.008], group, 0.196, 0.004, 0.0007);
  return { group, ports: new Map(), pickables: [{ object: group.children[0], id }], leds: [{ mat: l.mat, key: id, role: 'power' }] };
}

// ── Panel ciego ventilado ────────────────────────────────────────────────
export function buildVentBlank() {
  const group = new THREE.Group(); group.name = 'vent';
  const tex = canvasTex(1024, 94, (g, W, H) => {
    brushed(g, W, H, '#17191c', '#1f2226');
    const f = mmMapper(g, W, H, EAR_W * 1000, UH * 1000);
    for (const s of [-1, 1]) for (const dy of [-12.7, 12.7]) f.rrect(s * 232.6, dy * 0.6, 6.5, 4, 2, '#0a0a0b');
    drawVents(f, -200, 200, -16, 16, 4.2, 1.3, '#050506');
  });
  faceBox(EAR_W, UH - 0.0012, 0.0016, faceMat(tex, { metalness: 0.5 }), M.devBlack(), 0, 0, -0.0008, group);
  return { group, ports: new Map(), pickables: [], leds: [] };
}

// ── Reserva de fibra (bandeja 1U + carrete) ──────────────────────────────
export function buildFiberReserve(coilX = -0.15, color = '#ff7a1a') {
  const group = new THREE.Group(); group.name = 'fiberReserve';
  const tex = canvasTex(1024, 94, (g, W, H) => {
    brushed(g, W, H, '#17191c', '#1f2226');
    const f = mmMapper(g, W, H, EAR_W * 1000, UH * 1000);
    for (const s of [-1, 1]) for (const dy of [-12.7, 12.7]) f.rrect(s * 232.6, dy * 0.6, 6.5, 4, 2, '#0a0a0b');
    f.text('FIBRA · RESERVA PROTEGIDA', -80, 3, 4.6, '#ff9a4d', 700, 'left');
    f.text('Monomodo LC/UPC · 30 m (25 m recorrido + 5 m reserva)', -80, -6, 3.2, '#9aa3ad', 600, 'left');
  });
  faceBox(EAR_W, UH - 0.0012, 0.0016, faceMat(tex, { metalness: 0.5 }), M.devBlack(), 0, 0, -0.0008, group);
  // carrete protector (disco negro con borde) + espiras naranja
  const spool = cyl(0.0205, 0.0205, 0.004, 24, M.plasticBlack(), coilX, 0, 0.003, group);
  spool.rotation.x = Math.PI / 2;
  const hub = cyl(0.009, 0.009, 0.016, 16, M.plasticBlack(), coilX, 0, 0.011, group);
  hub.rotation.x = Math.PI / 2;
  const front = cyl(0.0205, 0.0205, 0.002, 24, mat('spoolFront', { color: 0x202227, roughness: 0.4, transparent: true, opacity: 0.55 }), coilX, 0, 0.0205, group);
  front.rotation.x = Math.PI / 2;
  const fmat = mat('fiberCoil', { color, roughness: 0.4 });
  const tg = geo('fiberTorus', () => new THREE.TorusGeometry(0.0148, 0.0011, 5, 32));
  for (let i = 0; i < 4; i++) {
    const t = new THREE.Mesh(tg, fmat);
    t.position.set(coilX, 0, 0.0075 + i * 0.0026);
    t.scale.setScalar(1 - i * 0.03);
    group.add(t);
  }
  return { group, ports: new Map(), pickables: [], leds: [], coil: new THREE.Vector3(coilX, 0, 0.012) };
}

// ── Bandeja cantilever 1U (GLC 300 mm) ───────────────────────────────────
export function buildShelf(depth = 0.3) {
  const group = new THREE.Group(); group.name = 'shelf';
  const tex = canvasTex(512, 64, (g, W, H) => {
    g.fillStyle = '#1b1d21'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#0a0b0c';
    for (let x = 12; x < W - 12; x += 16) for (let y = 10; y < H - 6; y += 14) g.fillRect(x, y, 10, 4);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const plateMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.45 });
  box(0.448, 0.0025, depth, plateMat, 0, 0.00125, -depth / 2, group);
  box(0.448, 0.004, 0.002, M.devBlack(), 0, 0.002, -0.001, group);
  for (const s of [-1, 1]) box((EAR_W - 0.448) / 2, UH - 0.002, 0.002, M.devBlack(), s * (0.224 + (EAR_W - 0.448) / 4), UH / 2, -0.001, group); // orejas
  for (const s of [-1, 1]) box(0.002, 0.03, depth * 0.9, M.devBlack(), s * 0.223, 0.015, -depth * 0.45, group);
  return { group, ports: new Map(), pickables: [], leds: [] };
}
