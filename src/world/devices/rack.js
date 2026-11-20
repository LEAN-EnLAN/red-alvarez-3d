// Gabinetes R1 (12U · 600 mm) y R2 (6U · 500 mm) con todo su contenido y los
// cables cortos de conexión, según la p.5 (vista frontal) y p.6 (bocas) del TP.
// Origen = punto del piso bajo el centro de la planta del gabinete. Frente = +Z.
import * as THREE from 'three';
import { RACKS, OUTLETS, VLANS, FIBER_COLOR, TRUNK_COLOR } from '../../data/tp.js';
import { UH, M, mat, box, cyl, canvasTex, faceMat, Ports, makeCord, plugInstances, geo, FONT } from './common.js';
import {
  buildPatchPanel, buildOrganizer, buildSG2428P, buildSG2210P, buildPDU, buildVentBlank, buildFiberReserve, buildShelf, ORGANIZER_RING_X,
} from './rackgear.js';
import { buildER605, buildONT, buildNAS, buildPBX } from './desktop.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const WAN_CORD_COLOR = '#e5484d';

export function outletColor(o) {
  return o.trunk ? TRUNK_COLOR : VLANS[o.vlan].color;
}

// Textura de riel con agujeros cuadrados (3 por U) y numeración de U
function railTex(units, numbered) {
  const PXU = 96;
  return canvasTex(numbered ? 48 : 32, units * PXU, (g, w, h) => {
    g.fillStyle = '#2b2e34'; g.fillRect(0, 0, w, h);
    for (let u = 0; u < units; u++) {
      for (let k = 0; k < 3; k++) {
        const y = h - (u * PXU + (k === 0 ? 14 : k === 1 ? 48 : 82));
        g.fillStyle = '#060607';
        g.fillRect(numbered ? 24 : 9, y - 7, 14, 14);
      }
      if (numbered) {
        g.fillStyle = '#e8edf3'; g.font = `700 20px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(String(u + 1).padStart(2, '0'), 11, h - (u * PXU + 48));
      }
      g.fillStyle = '#3b3f46'; g.fillRect(0, h - u * PXU - 1, w, 1);
    }
  });
}

export function buildRack(id = 'R1') {
  const spec = RACKS[id];
  const isR1 = id === 'R1';
  const group = new THREE.Group(); group.name = id;
  const ports = new Ports();
  const pickables = [];
  const leds = [];
  const cords = new Map();

  const units = spec.units;
  const W = 0.6, D = spec.depth / 1000;
  const PL = 0.04; // zócalo/techo del gabinete
  const H = units * UH + 2 * PL;
  const yb = isR1 ? 0.8 : 0.85; // altura del fondo del gabinete
  const y0 = yb + PL; // base de U1
  const yTop = yb + H;
  const zr = D / 2 - 0.075; // plano de rieles frontales
  const zrr = -D / 2 + 0.07; // rieles traseros
  const yU = (u) => y0 + (u - 1) * UH; // base de la unidad u
  const yC = (u, h = 1) => yU(u) + (h * UH) / 2;

  // ── Pedestal ──
  const ped = mat('pedestal', { color: 0x15171a, roughness: 0.6, metalness: 0.5 });
  box(0.5, 0.02, D * 0.85, ped, 0, 0.01, 0, group);
  box(0.12, yb - 0.04, 0.12, ped, 0, (yb - 0.04) / 2 + 0.02, -0.02, group);
  box(0.06, yb - 0.1, 0.02, ped, 0, (yb - 0.1) / 2 + 0.03, 0.05, group);
  box(0.56, 0.02, D * 0.9, ped, 0, yb - 0.01, 0, group);
  // ── Gabinete ──
  const shell = new THREE.Group(); shell.name = id + ':shell';
  group.add(shell);
  const steel = M.rackSteel();
  const t = 0.012;
  const sideTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#15171a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#060607';
    for (let y = 30; y < 90; y += 12) for (let x = 40; x < 216; x += 34) g.fillRect(x, y, 26, 5);
  });
  const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.55, metalness: 0.55 });
  for (const s of [-1, 1]) box(t, H, D, sideMat, s * (W / 2 - t / 2), yb + H / 2, 0, shell);
  const topTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#15171a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#060607';
    for (let x = 30; x < 226; x += 14) g.fillRect(x, 80, 6, 90);
    // pasacables con cepillo (atrás izq/der)
    g.fillStyle = '#050505'; g.fillRect(28, 205, 70, 28); g.fillRect(158, 205, 70, 28);
  });
  box(W, t, D, new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.55, metalness: 0.55 }), 0, yTop - t / 2, 0, shell);
  box(W, t, D, steel, 0, yb + t / 2, 0, shell);
  box(W, H, t, steel, 0, yb + H / 2, -D / 2 + t / 2, shell);
  // marco frontal
  box(W, PL, 0.02, steel, 0, yTop - PL / 2, D / 2 - 0.01, shell);
  box(W, PL, 0.02, steel, 0, yb + PL / 2, D / 2 - 0.01, shell);
  for (const s of [-1, 1]) box(0.03, H, 0.02, steel, s * (W / 2 - 0.015), yb + H / 2, D / 2 - 0.01, shell);
  // placa de identificación sobre el marco
  const idTex = canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = '#f4f4f1'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#111'; g.font = `900 40px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(id, w / 2, h / 2 + 2);
  });
  const idp = new THREE.Mesh(geo('rackIdPlane', () => new THREE.PlaneGeometry(0.08, 0.02)), faceMat(idTex, { roughness: 0.6, metalness: 0 }));
  idp.position.set(0, yTop - PL / 2, D / 2 + 0.0005); shell.add(idp);
  // cepillos de entrada
  for (const sx of [-1, 1]) box(0.07, 0.006, 0.026, mat('brush', { color: 0x050505, roughness: 1 }), sx * 0.17, yTop + 0.002, -D / 2 + 0.09, shell);
  // tierra (puente verde/amarillo)
  box(0.004, 0.08, 0.004, mat('ground', { color: 0x3fae49, roughness: 0.5 }), W / 2 - 0.02, yb + 0.06, -D / 2 + 0.03, shell);

  // ── Rieles ──
  const railFront = new THREE.MeshStandardMaterial({ map: railTex(units, false), roughness: 0.45, metalness: 0.7 });
  const railNum = new THREE.MeshStandardMaterial({ map: railTex(units, true), roughness: 0.45, metalness: 0.6 });
  const rh = units * UH;
  for (const s of [-1, 1]) {
    box(0.016, rh, 0.002, railFront, s * 0.233, y0 + rh / 2, zr - 0.001, shell);
    box(0.002, rh, 0.03, M.rail(), s * 0.2415, y0 + rh / 2, zr - 0.016, shell);
    box(0.016, rh, 0.002, M.rail(), s * 0.233, y0 + rh / 2, zrr, shell);
    // tira de numeración de U por fuera del riel
    box(0.024, rh, 0.002, railNum, s * 0.2535, y0 + rh / 2, zr - 0.001, shell);
  }

  // ── Puerta de vidrio abierta (bisagra izquierda, ~100°) ──
  const door = new THREE.Group(); door.name = id + ':door';
  const dh = H - 0.01, dw = W - 0.004;
  const dframe = mat('doorFrame', { color: 0x111214, roughness: 0.5, metalness: 0.5 });
  box(dw, 0.03, 0.018, dframe, dw / 2, dh - 0.015, 0, door);
  box(dw, 0.03, 0.018, dframe, dw / 2, 0.015, 0, door);
  box(0.03, dh, 0.018, dframe, 0.015, dh / 2, 0, door);
  box(0.03, dh, 0.018, dframe, dw - 0.015, dh / 2, 0, door);
  const glass = box(dw - 0.06, dh - 0.06, 0.004, M.glass(), dw / 2, dh / 2, 0, door);
  glass.renderOrder = 2;
  box(0.014, 0.09, 0.02, M.chrome(), dw - 0.03, dh / 2, 0.016, door); // manija
  cyl(0.006, 0.006, 0.006, 12, M.chrome(), dw - 0.03, dh / 2 + 0.06, 0.012, door).rotation.x = Math.PI / 2; // cerradura
  for (const yy of [0.05, dh - 0.05]) cyl(0.006, 0.006, 0.04, 8, M.chrome(), 0, yy, 0, door);
  door.position.set(-W / 2, yb + 0.005, D / 2 + 0.01);
  door.rotation.y = -THREE.MathUtils.degToRad(100);
  group.add(door);
  pickables.push({ object: shell, id }, { object: glass, id });

  // ── Contenido ──
  const ppId = isR1 ? 'PP1' : 'PP2';
  const swId = isR1 ? 'SW1' : 'SW2';
  const myOutlets = OUTLETS.filter((o) => o.pp === ppId);
  const usedPP = new Set(myOutlets.map((o) => o.n));
  const usedSW = new Set(myOutlets.map((o) => o.port));
  if (isR1) { usedSW.add(17); usedSW.add(18); usedSW.add(19); usedSW.add(25); } else usedSW.add(9);

  const place = (res, x, y, z, prefix = '') => {
    res.group.position.set(x, y, z);
    group.add(res.group);
    ports.mergeFrom(res.group, res.ports, prefix);
    pickables.push(...res.pickables);
    if (res.leds) leds.push(...res.leds);
    return res;
  };

  let pp, sw, er, ontC, ontP, nas, pbx, fiber;
  const ringZ = zr + 0.045;
  for (const it of spec.items) {
    const yc = yC(it.u, it.h);
    switch (it.type) {
      case 'patchpanel': pp = place(buildPatchPanel(it.id, usedPP), 0, yC(it.u), zr + 0.001); pickables.push({ object: pp.group.children[0], id: it.id }); break;
      case 'organizer': place(buildOrganizer(), 0, yC(it.u), zr + 0.001); break;
      case 'switch': {
        sw = place(isR1 ? buildSG2428P(it.id, usedSW) : buildSG2210P(it.id, usedSW), 0, yC(it.u), zr + 0.002);
        pickables.push({ object: sw.group.children[0], id: it.id });
        break;
      }
      case 'fiber': fiber = place(buildFiberReserve(-0.15, FIBER_COLOR), 0, yC(it.u), zr + 0.001); break;
      case 'vent': place(buildVentBlank(), 0, yC(it.u), zr + 0.001); break;
      case 'pdu': place(buildPDU(`PDU-${id}`), 0, yC(it.u), zr + 0.001); break;
      case 'shelf': {
        place(buildShelf(0.3), 0, yU(it.u), zr + 0.001);
        const ys = yU(it.u) + 0.0025;
        const zf = zr - 0.012;
        if (it.holds.includes('ER605')) {
          er = place(buildER605('ER605'), -0.13, ys, zf, 'ER605/');
          ontC = place(buildONT('ONT_CLARO', 'CLARO', '#da291c'), 0.022, ys, zf, 'ONT_CLARO/');
          ontP = place(buildONT('ONT_PERSONAL', 'PERSONAL', '#00a9e0'), 0.155, ys, zf, 'ONT_PERSONAL/');
        }
        if (it.holds.includes('NAS1')) {
          nas = place(buildNAS('NAS1'), -0.12, ys, zf, 'NAS1/');
          pbx = place(buildPBX('PBX'), 0.06, ys, zf, 'PBX/');
        }
        if (!it.holds.length) {
          // R2: fuente del switch y cables de reserva
          const brick = box(0.11, 0.032, 0.065, M.plasticBlack(), 0.12, ys + 0.016, zf - 0.06, group);
          const lt = canvasTex(256, 64, (g, w, h) => { g.fillStyle = '#16171a'; g.fillRect(0, 0, w, h); g.fillStyle = '#c3c9d0'; g.font = `700 22px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FUENTE · SW2', w / 2, h / 2); });
          const pl = new THREE.Mesh(geo('brickLabel', () => new THREE.PlaneGeometry(0.08, 0.02)), faceMat(lt, { roughness: 0.6, metalness: 0 }));
          pl.position.set(0.12, ys + 0.016, zf - 0.027); group.add(pl);
          pickables.push({ object: brick, id: 'PSU-SW2' });
          const coil = new THREE.Mesh(geo('spareCoil', () => new THREE.TorusGeometry(0.035, 0.004, 6, 24)), mat('cordBlack', { color: 0x1a1b1e, roughness: 0.7 }));
          coil.rotation.x = Math.PI / 2; coil.position.set(-0.1, ys + 0.006, zf - 0.08); group.add(coil);
        }
        break;
      }
    }
  }
  const P = ports.map;

  // ── Cables cortos ──
  const plugs = [];
  const tip = (key, len = 0.021) => { const p = P.get(key); return p.pos.clone().addScaledVector(p.dir, len); };
  const plugAt = (key, color) => { const p = P.get(key); plugs.push({ pos: p.pos, dir: p.dir, color }); };
  const ppY = P.get(`${ppId}-01`).pos.y;
  const swY = sw.group.position.y;
  const orgY = (ppY + swY) / 2;

  for (const o of myOutlets) {
    const color = outletColor(o);
    const ppKey = `${ppId}-${String(o.n).padStart(2, '0')}`;
    const swKey = `${swId}/${o.port}`;
    plugAt(ppKey, color); plugAt(swKey, color);
    const a = tip(ppKey), b = tip(swKey);
    const avgX = (a.x + b.x) / 2;
    const ring = ORGANIZER_RING_X.reduce((m, r) => (Math.abs(r - avgX) < Math.abs(m - avgX) ? r : m), 0);
    const mx = avgX * 0.55 + ring * 0.45;
    const bottomRow = b.y < swY;
    const pts = [
      a.clone().add(V(0, 0, -0.012)), a,
      a.clone().add(V(0, -0.006, 0.014)),
      V(mx, orgY + 0.004, ringZ + 0.008 + (o.n % 3) * 0.003),
      b.clone().add(V(0, bottomRow ? -0.002 : 0.012, 0.022)),
      b, b.clone().add(V(0, 0, -0.012)),
    ];
    const c = makeCord(pts.slice(1, -1), color, 0.0025);
    c.name = `cord:${ppKey}`; c.userData.link = { from: ppKey, to: swKey, outlet: o.label, dev: o.dev };
    group.add(c); cords.set(ppKey, c);
  }

  if (isR1) {
    // SW1/17 → ER605 LAN4 (troncal), SW1/18 → NAS1, SW1/19 → PBX, WAN1/2 → ONTs
    const lanCord = (fromKey, toKey, color, name, mids) => {
      plugAt(fromKey, color); plugAt(toKey, color);
      const a = tip(fromKey), b = tip(toKey);
      const pts = [a, ...mids(a, b), b];
      const c = makeCord(pts, color, 0.0025);
      c.name = `cord:${name}`; c.userData.link = { from: fromKey, to: toKey };
      group.add(c); cords.set(name, c);
    };
    const yFib = yC(9);
    lanCord('SW1/17', 'ER605/LAN4', TRUNK_COLOR, 'SW1/17', (a, b) => [
      a.clone().add(V(0, 0.002, 0.03)), V(a.x - 0.02, yFib, zr + 0.06), V(b.x + 0.02, b.y + 0.035, zr + 0.05), b.clone().add(V(0, 0.006, 0.02)),
    ]);
    const sideX = 0.205, behindZ = zr - 0.27;
    const nasLan = P.get('NAS1/lan').pos, pbxLan = P.get('PBX/lan').pos;
    lanCord('SW1/18', 'NAS1/lan', VLANS[30].color, 'SW1/18', (a, b) => [
      a.clone().add(V(0.004, -0.004, 0.03)), V(sideX - 0.01, yFib, zr + 0.05), V(sideX, yC(7), zr + 0.035), V(sideX + 0.006, yC(5), zr - 0.04),
      V(sideX + 0.006, nasLan.y + 0.03, behindZ), V(b.x + 0.03, b.y + 0.02, b.z - 0.04), b.clone().add(V(0, 0, -0.015)),
    ]);
    lanCord('SW1/19', 'PBX/lan', VLANS[40].color, 'SW1/19', (a, b) => [
      a.clone().add(V(0.004, 0.004, 0.034)), V(sideX - 0.016, yFib + 0.004, zr + 0.055), V(sideX - 0.004, yC(7) + 0.004, zr + 0.04), V(sideX, yC(5) + 0.006, zr - 0.04),
      V(sideX, pbxLan.y + 0.04, behindZ + 0.02), V(b.x + 0.03, b.y + 0.02, b.z - 0.04), b.clone().add(V(0, 0, -0.015)),
    ]);
    lanCord('ER605/WAN1', 'ONT_CLARO/LAN', WAN_CORD_COLOR, 'WAN1', (a, b) => [
      a.clone().add(V(0, -0.004, 0.02)), V((a.x + b.x) / 2, a.y - 0.016, a.z + 0.045), b.clone().add(V(0, -0.006, 0.02)),
    ]);
    lanCord('ER605/WAN2', 'ONT_PERSONAL/LAN', WAN_CORD_COLOR, 'WAN2', (a, b) => [
      a.clone().add(V(0, -0.006, 0.026)), V((a.x + b.x) / 2, a.y - 0.022, a.z + 0.06), b.clone().add(V(0, -0.008, 0.024)),
    ]);
  }

  // ── Fibra: módulo SFP + jumper LC naranja → carrete → salida superior trasera ──
  const sfpKey = isR1 ? 'SW1/SFP25' : 'SW2/SFP9';
  const sp = P.get(sfpKey);
  const modMat = M.alu();
  box(0.0135, 0.0085, 0.018, modMat, sp.pos.x, sp.pos.y, sp.pos.z + 0.004, group); // módulo SFP (sobresale)
  box(0.012, 0.0075, 0.012, mat('lcOrange', { color: 0xf2f2ef, roughness: 0.4 }), sp.pos.x, sp.pos.y, sp.pos.z + 0.018, group); // conector LC dúplex
  box(0.008, 0.006, 0.01, mat('lcBoot', { color: 0xff8a3d, roughness: 0.4 }), sp.pos.x, sp.pos.y, sp.pos.z + 0.028, group);
  const coilC = fiber.group.position.clone().add(fiber.coil);
  const exit = V(-0.17, yTop + 0.005, -D / 2 + 0.09);
  const s0 = sp.pos.clone().add(V(0, 0, 0.033));
  const R = 0.0175;
  const yLow = coilC.y - 0.02; // borde inferior de la bandeja de fibra
  const fpts = [
    s0, s0.clone().add(V(0, -0.006, 0.016)),
    V(s0.x - 0.004, yLow + 0.004, zr + 0.032),
    V((s0.x + coilC.x) / 2, yLow + 0.002, zr + 0.03),
    V(coilC.x + R + 0.014, yLow + 0.002, coilC.z + 0.016),
    V(coilC.x, coilC.y - R, coilC.z + 0.008),
    V(coilC.x - R, coilC.y, coilC.z + 0.006),
    V(coilC.x, coilC.y + R, coilC.z + 0.004),
    V(coilC.x + R * 0.7, coilC.y + R * 0.7, coilC.z + 0.002),
    V(coilC.x - 0.03, coilC.y + 0.03, zr - 0.012),
    V(-0.214, coilC.y + 0.06, zr - 0.06),
    V(-0.214, (coilC.y + yTop) / 2 + 0.05, -D / 2 + 0.16),
    V(-0.19, yTop - 0.03, -D / 2 + 0.1),
    exit,
  ];
  const fc = makeCord(fpts, FIBER_COLOR, 0.0016, 140, 5);
  fc.name = `cord:FIBER-${id}`; fc.userData.link = { from: sfpKey, to: isR1 ? 'SW2/SFP9' : 'SW1/SFP25', fiber: true };
  group.add(fc); cords.set(`FIBER-${id}`, fc);

  const plugMesh = plugInstances(plugs);
  if (plugMesh) { plugMesh.name = id + ':plugs'; group.add(plugMesh); }

  // ── Anclajes de entrada ──
  ports.add(`${id}:entry`, V(0.17, yTop + 0.005, -D / 2 + 0.09), V(0, 1, 0));
  ports.add(`${id}:fiber`, exit, V(0, 1, 0));

  group.userData = { id, size: [W, yTop, D], yTop, yb, zr, units };
  return { group, ports: P, pickables, leds, cords, door, size: [W, yTop, D] };
}
