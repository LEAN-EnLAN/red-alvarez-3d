// Amuebla la oficina con los equipos del TP en sus posiciones del plano (p.2)
// y traza los 23 cables permanentes + fibra + enlaces internos del rack.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as D from './devices.js';
import { META, DESKS, DEVICES, OUTLETS, MEETING, UPS, VLANS, FIBER_COLOR, TRUNK_COLOR, FIBER_ROUTE, WINDOWS } from '../data/tp.js';
import { v3, roundPolyline, sagCurve, dedupe, tubeFrom, pointsOfTube } from './paths.js';
import { pbrSet, textCanvas } from './textures.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const H = META.size.h;
const PLENUM = H + 0.14;
const MODELS = import.meta.env.BASE_URL + 'assets/models/';
const EXT = import.meta.env.VITE_MODEL_EXT || '.glb'; // la vista previa en Artifact usa glTF JSON

export async function furnish(scene, colliders, { manager, quality }) {
  const root = new THREE.Group();
  root.name = 'furnishing';
  scene.add(root);
  const interact = new Map(); // id -> {id, object, kind}
  const pickables = []; // meshes con userData.pickId
  const anchors = new Map(); // clave -> {pos, dir} en mundo
  const segments = new Map(); // id segmento -> Vector3[] (dirección canónica)
  const xray = new THREE.Group(); xray.name = 'xray-cables'; xray.visible = false; root.add(xray);
  const poles = [];
  const leds = [];
  const rackCords = new Map();
  const screens = [];

  // ── carga de props GLB (Poly Haven CC0 / Sketchfab opcional) ──
  const gltf = new GLTFLoader(manager);
  gltf.setMeshoptDecoder(MeshoptDecoder);
  let manifest = {};
  try { manifest = await (await fetch(MODELS + 'manifest.json')).json(); } catch {}
  const cache = new Map();
  const loadGLB = (name) => {
    if (!cache.has(name)) cache.set(name, (EXT === '.json' ? loadEmbedded(gltf, MODELS + name + EXT) : gltf.loadAsync(MODELS + name + EXT)).then((g) => { g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = quality.shadows; o.receiveShadow = true; } }); return g.scene; }).catch(() => null));
    return cache.get(name);
  };
  const prop = async (name, x, z, { y = 0, rot = 0, scale = 1, collide = false, pad = 0 } = {}) => {
    const s = await loadGLB(name);
    if (!s) return null;
    const o = s.clone();
    o.position.set(x, y, z); o.rotation.y = rot; o.scale.setScalar(scale);
    root.add(o);
    if (collide) addColliderFromObject(o, pad);
    return o;
  };
  const addColliderFromObject = (o, pad = 0) => {
    o.updateWorldMatrix(true, true);
    const b = new THREE.Box3().setFromObject(o);
    colliders.push({ minX: b.min.x - pad, maxX: b.max.x + pad, minZ: b.min.z - pad, maxZ: b.max.z + pad });
  };

  // ── helpers de registro ──
  const register = (id, object, kind, extra = {}) => {
    interact.set(id, { id, object, kind, ...extra });
  };
  const usePicks = (built, fallbackId) => {
    for (const p of built.pickables || []) {
      p.object.traverse((o) => { if (o.userData.pickId === undefined) o.userData.pickId = p.id; });
      p.object.userData.pickId = p.id;
      if (p.instanceMap) p.object.userData.instanceMap = p.instanceMap;
      pickables.push(p.object);
      if (!interact.has(p.id) && !p.instanceMap) register(p.id, p.object, 'device');
    }
    if (fallbackId && !(built.pickables || []).length) {
      built.group.traverse((o) => { if (o.isMesh) o.userData.pickId = fallbackId; });
      pickables.push(built.group);
    }
    if (built.leds) leds.push(...built.leds);
  };
  const place = (built, x, y, z, rot = 0, parent = root) => {
    built.group.position.set(x, y, z);
    built.group.rotation.y = rot;
    parent.add(built.group);
    built.group.updateWorldMatrix(true, true);
    built.group.traverse((o) => { if (o.isMesh) { o.castShadow = quality.shadows; o.receiveShadow = true; } });
    return built;
  };
  const worldPort = (built, key) => {
    const p = built.ports?.get(key);
    if (!p) return null;
    const m = built.group.matrixWorld;
    const pos = p.pos.clone().applyMatrix4(m);
    const dir = p.dir.clone().transformDirection(m);
    return { pos, dir };
  };

  const woodTop = pbrSet('kitchen_wood', { repeat: 1, gen: true });
  const cabMat = new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.6 });
  const cabTop = new THREE.MeshStandardMaterial({ map: woodTop.map, roughness: 0.55 });
  const hasSF = (n) => manifest[`sf_${n}`];

  // ════════════════════ RACKS ════════════════════
  const racks = {};
  const rackRot = { R1: Math.PI, R2: -Math.PI / 2 }; // R1 mira a la puerta de sala técnica; R2 al área de escritorios
  for (const id of ['R1', 'R2']) {
    const [x, z] = DEVICES[id].pos;
    const r = place(D.buildRack(id), x, 0, z, rackRot[id]);
    racks[id] = r;
    usePicks(r);
    register(id, r.group, 'rack');
    for (const [k] of r.ports) anchors.set(k, worldPort(r, k));
    if (r.cords) for (const [k, m] of r.cords) rackCords.set(k, m);
    addColliderFromObject(r.group, 0.02);
  }

  // ════════════════════ PUESTOS ════════════════════
  // Cada escritorio se apoya contra la pared más cercana de su sala (posición del plano p.2 como
  // referencia). La caja de bocas va en la pared y la canaleta sube pegada a la pared al cielorraso.
  const deskBuilt = new Map();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xf6f6f4, roughness: 0.5, transparent: true, opacity: 1 });
  const WT = 0.06; // media pared
  const DESK_LAYOUT = {
    PC01: { wall: 'x', at: 0, dir: 1, along: 10.2 },
    PC02: { wall: 'z', at: 3, dir: 1, along: 4.95 },
    PC03: { wall: 'z', at: 3, dir: 1, along: 8.42 },
    PC04: { wall: 'z', at: 0, dir: 1, along: 4.95 },
    PC05: { wall: 'z', at: 0, dir: 1, along: 8.42 },
    PC06: { wall: 'x', at: 0, dir: 1, along: 2.76 },
    PC07: { wall: 'z', at: 6, dir: -1, along: 10.8 },
    PC08: { wall: 'z', at: 6, dir: -1, along: 13.65 },
    PC09: { wall: 'z', at: 6, dir: -1, along: 15.15 },
    PC10: { wall: 'z', at: 0, dir: 1, along: 11.84 },
    PC11: { wall: 'z', at: 0, dir: 1, along: 13.89 },
  };
  // ángulo para que el "frente local -z" mire hacia la pared
  const faceAngle = (L) => (L.wall === 'z' ? (L.dir > 0 ? 0 : Math.PI) : L.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
  // local (lx, lz) → mundo, rotando por θ alrededor de (cx, cz)
  const Lw = (cx, cz, th, lx, lz) => [cx + lx * Math.cos(th) + lz * Math.sin(th), cz - lx * Math.sin(th) + lz * Math.cos(th)];
  const solids = []; // para la auditoría de superposiciones
  const addSolid = (name, obj) => { obj.updateWorldMatrix(true, true); solids.push({ name, box: new THREE.Box3().setFromObject(obj) }); };
  const colliderFromBox = (b, pad = 0) => colliders.push({ minX: b.min.x - pad, maxX: b.max.x + pad, minZ: b.min.z - pad, maxZ: b.max.z + pad });

  // apoya un objeto sobre una superficie (base exacta, sin flotar ni intersectar)
  const settle = (o, topY) => { o.updateWorldMatrix(true, true); const b = new THREE.Box3().setFromObject(o); o.position.y += topY - b.min.y + 0.0008; };
  const propOn = async (name, x, z, topY, rot = 0, scale = 1) => { const o = await prop(name, x, z, { y: topY, rot, scale }); if (o) settle(o, topY); return o; };
  // pega un objeto contra una pared usando su caja envolvente real
  const snapToWall = (o, axis, wallAt, dir, gap = 0.01) => {
    o.updateWorldMatrix(true, true);
    const b = new THREE.Box3().setFromObject(o);
    const face = wallAt + dir * WT + dir * gap;
    if (axis === 'z') o.position.z += dir > 0 ? face - b.min.z : face - b.max.z;
    else o.position.x += dir > 0 ? face - b.min.x : face - b.max.x;
    o.updateWorldMatrix(true, true);
  };

  // caja de bocas en pared + canaleta vertical hasta el cielorraso
  // Si la vertical caería sobre una ventana, la canaleta corre horizontal bajo el antepecho hasta el
  // borde de la ventana y recién ahí sube (nunca cruza un vidrio).
  const duct = (cx, cy, cz, w, h, th) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), poleMat);
    m.position.set(cx, cy, cz); m.rotation.y = th;
    m.castShadow = quality.shadows; m.receiveShadow = true;
    root.add(m); poles.push(m);
    return m;
  };
  const wallPlate = (x, z, th, labels, y = 0.95) => {
    const plate = D.buildJackPlate(labels);
    plate.pickables.forEach((p) => { if (String(p.id).startsWith('plate:')) p.id = 'JACK:' + labels[0]; });
    place(plate, x, y, z, th);
    const horiz = Math.abs(Math.sin(th)) < 0.5; // pared paralela a x
    const along = horiz ? x : z;
    const wallAt = horiz ? Math.round(z) : Math.round(x);
    const win = WINDOWS.find((w) => (w.wall === 'z') === horiz && Math.abs(w.at - wallAt) < 0.2 && along > w.from - 0.1 && along < w.to + 0.1);
    let riser = null;
    if (win) {
      // borde de ventana más cercano, del lado de afuera
      const edge = along - win.from < win.to - along ? win.from - 0.12 : win.to + 0.12;
      const runY = y + 0.02;
      const [hx, hz] = Lw(x, z, th, 0, 0.02);
      const len = Math.abs(edge - along);
      const mid = (edge + along) / 2;
      duct(horiz ? mid : hx, runY, horiz ? hz : mid, len + 0.06, 0.04, th);
      riser = horiz ? v3(edge, runY, hz) : v3(hx, runY, edge);
      duct(riser.x, runY + (H - runY) / 2, riser.z, 0.06, H - runY, th);
    } else {
      const len = H - (y + 0.065);
      const [dx, dz] = Lw(x, z, th, 0, 0.02);
      duct(dx, y + 0.065 + len / 2, dz, 0.06, len, th);
    }
    plate.riser = riser;
    return plate;
  };
  const registerPlate = (plate, labels) => {
    for (const lb of labels) {
      if (plate.riser) anchors.set(`jackriser:${lb}`, { pos: plate.riser.clone(), dir: v3(0, 1, 0) });
    }
  };

  for (const d of DESKS) {
    const L = DESK_LAYOUT[d.pc];
    const big = d.room === 'gerencia' || d.room === 'recepcion';
    const w = big ? 1.6 : 1.4, dep = 0.7;
    const th = faceAngle(L);
    const off = WT + dep / 2 + 0.055; // 5 cm detrás del escritorio para la canaleta vertical
    const x = L.wall === 'z' ? L.along : L.at + L.dir * off;
    const z = L.wall === 'z' ? L.at + L.dir * off : L.along;
    const deskB = D.buildDesk(w, dep, { woodMap: woodTop.map });
    const desk = place(deskB, x, 0, z, th);
    const top = deskB.top || 0.75;
    const db = new THREE.Box3().setFromObject(desk.group);
    colliderFromBox(db);
    solids.push({ name: `desk ${d.pc}`, box: db });
    const side = 1;
    const at = (lx, lz) => Lw(x, z, th, lx, lz);
    const name = d.pc, oPC = OUTLETS.find((o) => o.dev === d.pc);
    let p;
    p = at(-0.05, -0.17); const mon = place(D.buildMonitor(name, oPC.ip), p[0], top, p[1], th);
    screens.push(mon.group);
    p = at(-0.05, 0.12); place(D.buildKeyboard(), p[0], top, p[1], th);
    p = at(0.3, 0.14); place(D.buildMouse(), p[0], top, p[1], th);
    // la torre queda entre la pata y el centro, sin tocar la columna ni el pie del escritorio
    p = at(side * (w / 2 - 0.33), -0.08); const pc = place(D.buildPCTower(name), p[0], 0, p[1], th - side * Math.PI / 2);
    usePicks(pc, name); usePicks(mon, name);
    register(name, desk.group, 'pc', { group: [desk.group, pc.group, mon.group] });
    desk.group.traverse((o) => { if (o.isMesh && o.userData.pickId === undefined) o.userData.pickId = name; });
    pickables.push(desk.group);
    anchors.set(`dev:${name}`, worldPort(pc, 'nic'));
    p = at(-0.1, 0.66);
    if (hasSF('office_chair')) await prop('sf_office_chair', p[0], p[1], { rot: th + Math.PI });
    else place(D.buildOfficeChair(), p[0], 0, p[1], th + Math.PI + (DESKS.indexOf(d) % 3 - 1) * 0.18);

    const labels = [oPC.label];
    let tel = null;
    if (d.tel) {
      const oT = OUTLETS.find((o) => o.dev === d.tel);
      labels.push(oT.label);
      // el teléfono va del lado del pasacables de la mesa (por ahí sube su cable)
      p = at(side * (w / 2 - 0.36), -0.13);
      tel = place(D.buildPhone(oT.dev.replace('TEL', '')), p[0], top, p[1], th - 0.2);
      usePicks(tel, d.tel);
      register(d.tel, tel.group, 'phone');
      anchors.set(`dev:${d.tel}`, worldPort(tel, 'lan'));
    }
    // caja de bocas en la pared, debajo del escritorio, detrás de la torre (a 30 cm del piso)
    p = at(side * (w / 2 - 0.3), -(dep / 2 + 0.055));
    const plate = wallPlate(p[0], p[1], th, labels, 0.3);
    registerPlate(plate, labels);
    if (d.tel) {
      const g = worldPort(deskB, 'grommet');
      if (g) anchors.set(`via:${d.tel}`, g);
    }
    usePicks(plate, 'JACK:' + labels[0]);
    register('JACK:' + labels[0], plate.group, 'jack', { labels });
    anchors.set(`jack:${oPC.label}`, worldPort(plate, 'J0'));
    anchors.set(`jackback:${oPC.label}`, worldPort(plate, 'back'));
    if (d.tel) {
      const oT = OUTLETS.find((o) => o.dev === d.tel);
      anchors.set(`jack:${oT.label}`, worldPort(plate, 'J1'));
      anchors.set(`jackback:${oT.label}`, worldPort(plate, 'back'));
    }
    deskBuilt.set(name, { desk, pc, mon, tel, plate, pos: [x, z], th });

  }

  // mueble bajo genérico orientado (cajonera / credenza)
  const cabinetAt = (x, z, th, w, d, h, label) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.03, d), cabMat);
    body.position.y = (h - 0.03) / 2;
    const topM = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.03, d + 0.02), cabTop);
    topM.position.y = h - 0.015;
    const kick = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.05, d - 0.04), new THREE.MeshStandardMaterial({ color: 0x3b3f45, roughness: 0.8 }));
    kick.position.y = 0.025;
    g.add(body, topM, kick);
    const hm = new THREE.MeshStandardMaterial({ color: 0x555b63, metalness: 0.7, roughness: 0.3 });
    for (let i = 0; i < 2; i++) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(w * 0.35, 0.012, 0.014), hm);
      handle.position.set(0, h * (0.36 + i * 0.34), d / 2 + 0.007);
      g.add(handle);
    }
    g.position.set(x, 0, z); g.rotation.y = th;
    g.traverse((o) => { if (o.isMesh) { o.castShadow = quality.shadows; o.receiveShadow = true; } });
    root.add(g);
    const b = new THREE.Box3().setFromObject(g);
    colliderFromBox(b); solids.push({ name: label, box: b });
    return h;
  };

  // ════════════════════ SALA DE REUNIÓN ════════════════════
  {
    const [tx, tz] = MEETING.table;
    const tb = D.buildMeetingTable(MEETING.size[0], MEETING.size[1], { woodMap: woodTop.map });
    const t = place(tb, tx, 0, tz);
    const tTop = tb.top || 0.75;
    const b = new THREE.Box3().setFromObject(t.group); colliderFromBox(b); solids.push({ name: 'mesa reunión', box: b });
    for (const cx of [-0.85, 0, 0.85]) for (const s of [-1, 1]) {
      if (hasSF('office_chair')) prop('sf_office_chair', tx + cx, tz + s * 0.98, { rot: s > 0 ? Math.PI : 0 });
      else place(D.buildOfficeChair(), tx + cx, 0, tz + s * 0.98, s > 0 ? Math.PI : 0);
    }
    // TEL107 sobre una credenza contra la pared este, con su boca en la pared
    const oT = OUTLETS.find((o) => o.dev === MEETING.tel);
    const cTh = -Math.PI / 2; // frente hacia -x (hacia la sala)
    const cx = 12 - WT - 0.225 - 0.01, cz = tz;
    const ch = cabinetAt(cx, cz, cTh, 1.2, 0.45, 0.72, 'credenza reunión');
    const tel = place(D.buildPhone('107'), cx + 0.02, ch, cz + 0.32, cTh + 0.35);
    usePicks(tel, 'TEL107'); register('TEL107', tel.group, 'phone');
    anchors.set('dev:TEL107', worldPort(tel, 'lan'));
    const plate = wallPlate(12 - WT, cz + 0.42, cTh, [oT.label], 0.92);
    registerPlate(plate, [oT.label]);
    usePicks(plate, 'JACK:' + oT.label); register('JACK:' + oT.label, plate.group, 'jack', { labels: [oT.label] });
    anchors.set(`jack:${oT.label}`, worldPort(plate, 'J0'));
    anchors.set(`jackback:${oT.label}`, worldPort(plate, 'back'));
    // lámina "Diagrama de red" apoyada sobre la mesa (sin z-fighting)
    const paperMat = new THREE.MeshStandardMaterial({ map: diagramTexture(), roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.0012, 0.44), [null, null, paperMat, null, null, null].map((m) => m || new THREE.MeshStandardMaterial({ color: 0xf4f4f0 })));
    paper.rotation.y = 0.08;
    paper.position.set(tx - 0.5, tTop + 0.0006, tz + 0.05);
    paper.userData.pickId = 'DIAGRAMA';
    root.add(paper); pickables.push(paper);
    register('DIAGRAMA', paper, 'doc');
    // TV de pared (pared oeste, frente a la mesa): abre la presentación del TP
    {
      const tv = new THREE.Group(); tv.name = 'tv-reunion';
      const bez = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.84, 0.045), new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.4, metalness: 0.3 }));
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.8), new THREE.MeshStandardMaterial({ map: textCanvas(['Alvarez & Asoc.', 'Presentación del TP'], { w: 1024, h: 576, bg: '#1f3a64', fg: '#ffffff', size: 64, font: 700 }), emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.2 }));
      scr.name = 'tv-screen'; scr.position.z = 0.0235;
      tv.add(bez, scr);
      tv.position.set(6 + WT + 0.03, 1.45, tz); tv.rotation.y = Math.PI / 2;
      root.add(tv);
      tv.traverse((m) => (m.userData.pickId = 'PRESENTACION')); pickables.push(tv); register('PRESENTACION', tv, 'doc');
    }
    propOn('ceramic_vase_01', tx + 0.7, tz - 0.15, tTop, 0, 0.8);
  }

  // ════════════════════ EQUIPOS SUELTOS ════════════════════
  const looseDevice = (dev, built, x, y, z, th, plateAt, plateTh, plateY = 0.95) => {
    place(built, x, y, z, th);
    usePicks(built, dev);
    register(dev, built.group, DEVICES[dev]?.kind || 'device');
    anchors.set(`dev:${dev}`, worldPort(built, 'lan'));
    const o = OUTLETS.find((q) => q.dev === dev);
    const plate = wallPlate(plateAt[0], plateAt[1], plateTh, [o.label], plateY);
    registerPlate(plate, [o.label]);
    usePicks(plate, 'JACK:' + o.label); register('JACK:' + o.label, plate.group, 'jack', { labels: [o.label] });
    anchors.set(`jack:${o.label}`, worldPort(plate, 'J0'));
    anchors.set(`jackback:${o.label}`, worldPort(plate, 'back'));
  };
  // Impresoras sobre cajonera contra la pared oeste de su sala (frente hacia +x)
  for (const [id, wallX] of [['IMP01', 0], ['IMP02', 10]]) {
    const z = DEVICES[id].pos[1];
    const th = Math.PI / 2;
    const cx = wallX + WT + 0.275 + 0.01;
    const h = cabinetAt(cx, z, th, 0.62, 0.55, 0.66, 'cajonera ' + id);
    looseDevice(id, D.buildPrinter(id), cx, h, z, th, [wallX + WT, z - 0.42], th, 0.92);
  }
  // NAS2 en gerencia: mueble bajo contra la pared oeste + UPS al lado
  {
    const z = DEVICES.NAS2.pos[1];
    const th = Math.PI / 2;
    const cx = WT + 0.225 + 0.01;
    const h = cabinetAt(cx, z, th, 0.6, 0.45, 0.6, 'mueble NAS2');
    looseDevice('NAS2', D.buildNAS('NAS2'), cx, h, z + 0.1, th, [WT, z - 0.2], th, 0.88);
  }
  // APs en el cielorraso
  for (const id of ['AP1', 'AP2']) {
    const [x, z] = DEVICES[id].pos;
    const ap = place(D.buildAP(id), x, H, z);
    usePicks(ap, id); register(id, ap.group, 'ap');
    anchors.set(`dev:${id}`, worldPort(ap, 'lan') || { pos: v3(x, H + 0.02, z), dir: v3(0, 1, 0) });
  }
  // UPS (la de NAS2 al lado del mueble, contra la pared)
  const upsPos = { 'UPS-R1': [14.75, 10.55, Math.PI], 'UPS-R2': [15.6, 2.0, -Math.PI / 2], 'UPS-NAS2': [WT + 0.2, DEVICES.NAS2.pos[1] + 0.55, Math.PI / 2] };
  for (const u of UPS) {
    const b = D.buildUPS(u.model.includes('APC') ? 'apc' : 'atomlux', u.id);
    const [x, z, rot] = upsPos[u.id];
    place(b, x, 0, z, rot);
    usePicks(b, u.id); register(u.id, b.group, 'ups');
    const bb = new THREE.Box3().setFromObject(b.group); colliderFromBox(bb, 0.02); solids.push({ name: u.id, box: bb });
  }
  for (const id of ['R1', 'R2']) solids.push({ name: 'rack ' + id, box: new THREE.Box3().setFromObject(racks[id].group) });

  // Matafuegos ABC (modelo propio, rotulado en castellano) con cartel
  const extinguisher = (x, z, th) => {
    const g = new THREE.Group();
    const red = new THREE.MeshStandardMaterial({ color: 0xc8161d, roughness: 0.35, metalness: 0.2 });
    const blk = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.42, 24), red); body.position.y = 0.45; g.add(body);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), red); dome.position.y = 0.66; g.add(dome);
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.07, 12), new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.9, roughness: 0.3 })); valve.position.y = 0.75; g.add(valve);
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.012, 0.025), blk); lever.position.set(0.03, 0.79, 0); lever.rotation.z = -0.25; g.add(lever);
    const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([v3(0.02, 0.76, 0), v3(0.1, 0.7, 0.02), v3(0.1, 0.4, 0.03), v3(0.085, 0.3, 0.02)]), 16, 0.008, 6), blk); g.add(hose);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.16), new THREE.MeshStandardMaterial({ map: textCanvas(['MATAFUEGO', 'ABC 5 kg'], { w: 160, h: 256, bg: '#ffffff', fg: '#1b1b1b', size: 26, font: 800 }), roughness: 0.6 }));
    lab.position.set(0, 0.45, 0.0755); g.add(lab);
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.03), blk); bracket.position.set(0, 0.62, -0.09); g.add(bracket);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.28), new THREE.MeshStandardMaterial({ map: textCanvas(['MATA', 'FUEGO'], { w: 200, h: 280, bg: '#d0021b', fg: '#ffffff', size: 46, font: 800 }), roughness: 0.5 }));
    sign.position.set(0, 1.75, -0.104); sign.name = 'extSign'; g.add(sign);
    // soporte de piso (el matafuegos apoya en su base, no queda colgando)
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.03, 24), blk); stand.position.y = 0.215; g.add(stand);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.008, 6, 24), blk); ring.rotation.x = Math.PI / 2; ring.position.y = 0.36; g.add(ring);
    g.position.set(x, -0.2, z); g.rotation.y = th;
    g.traverse((o) => { if (o.isMesh) { o.castShadow = quality.shadows; o.receiveShadow = true; } });
    root.add(g);
    return g;
  };
  // recepción, junto a la entrada (pared sur) y sala técnica (pared norte, junto a la puerta)
  extinguisher(3.2, 12 - WT - 0.105, Math.PI);
  extinguisher(14.3, 8 + WT + 0.105, 0);

  // ════════════════════ CABLEADO ════════════════════
  const color = (o) => (o.trunk ? TRUNK_COLOR : VLANS[o.vlan]?.color || '#ffffff');
  const xmats = new Map();
  const xmat = (c) => {
    if (!xmats.has(c)) xmats.set(c, new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, opacity: 0.95, depthTest: false }));
    return xmats.get(c);
  };
  const cordMats = new Map();
  const cordMat = (c) => {
    if (!cordMats.has(c)) cordMats.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.45 }));
    return cordMats.get(c);
  };
  const rackTopRoute = { R1: DEVICES.R1.pos, R2: DEVICES.R2.pos };
  const cableMeshes = new Map(); // 'cable:DEV' -> [mesh...] para resaltar

  OUTLETS.forEach((o, idx) => {
    const devA = anchors.get(`dev:${o.dev}`);
    const rackId = o.pp === 'PP1' ? 'R1' : 'R2';
    const ppKey = `${o.pp}-${String(o.n).padStart(2, '0')}`;
    const ppBack = anchors.get(`${ppKey}:back`);
    const entry = anchors.get(`${rackId}:entry`);
    const pts = [];
    const lane = (idx % 6) * 0.016, layer = Math.floor(idx / 6) * 0.016;
    const [rx, rz] = rackTopRoute[rackId];
    let visibleCord = null;
    // 1) equipo → boca (patch cord prefabricado, visible)
    let startCeil;
    if (o.dev.startsWith('AP')) {
      pts.push(devA.pos.clone(), v3(devA.pos.x, PLENUM + layer, devA.pos.z));
      startCeil = [devA.pos.x, devA.pos.z];
    } else {
      const jack = anchors.get(`jack:${o.label}`), back = anchors.get(`jackback:${o.label}`);
      const via = anchors.get(`via:${o.dev}`);
      let cord;
      if (via) {
        // teléfono: baja por el pasacables de la mesa y sigue por debajo del escritorio hasta la boca
        const g = via.pos;
        const under = v3(g.x, g.y - 0.12, g.z), floorish = v3((g.x + jack.pos.x) / 2, Math.min(jack.pos.y, g.y - 0.3), (g.z + jack.pos.z) / 2);
        cord = new THREE.CatmullRomCurve3([devA.pos.clone(), devA.pos.clone().addScaledVector(devA.dir, 0.05), v3(g.x, g.y + 0.04, g.z), g.clone(), under, floorish, jack.pos.clone().addScaledVector(jack.dir, 0.06), jack.pos.clone()], false, 'centripetal').getPoints(40);
      } else cord = sagCurve(devA.pos, devA.dir, jack.pos, jack.dir, { sag: 0.08 });
      visibleCord = tubeFrom(cord, 0.0028, cordMat(o.trunk ? TRUNK_COLOR : o.vlan === 40 ? '#d7dce3' : o.vlan === 60 ? '#8b5cf6' : o.vlan === 30 ? '#19b394' : '#2f7cf6'));
      visibleCord.castShadow = false;
      root.add(visibleCord);
      pts.push(...cord);
      // 2) por dentro de la canaleta hasta el cielorraso
      const riser = anchors.get(`jackriser:${o.label}`)?.pos;
      if (riser) { pts.push(back.pos.clone(), v3(back.pos.x, riser.y, back.pos.z), riser.clone(), v3(riser.x, PLENUM + layer, riser.z)); startCeil = [riser.x, riser.z]; }
      else { pts.push(back.pos.clone(), v3(back.pos.x, PLENUM + layer, back.pos.z)); startCeil = [back.pos.x, back.pos.z]; }
    }
    // 3) por el cielorraso hasta el gabinete (ruteo ortogonal por bandejas)
    const ceil = [];
    const [sx, sz] = startCeil;
    const Y = PLENUM + layer;
    if (rackId === 'R2') {
      ceil.push([sx, 1.0 + lane], [rx, 1.0 + lane]);
    } else {
      const inBox = ['box1', 'box2', 'box3', 'box4'].includes(o.room);
      if (inBox) ceil.push([6.98 + lane, sz], [6.98 + lane, 7.0 + lane]);
      else ceil.push([sx, 7.0 + lane]);
      ceil.push([rx + lane, 7.0 + lane], [rx + lane, rz]);
    }
    for (const [cx, cz] of ceil) pts.push(v3(cx, Y, cz));
    // 4) baja al gabinete y termina en la parte trasera del patch panel
    pts.push(v3(entry.pos.x, Y, entry.pos.z), entry.pos.clone(), ppBack.pos.clone());
    // 5) patch cord PP → SW dentro del rack
    const rc = pointsOfTube(rackCords.get(ppKey), 20);
    const swPort = anchors.get(`${o.sw}/${o.port}`);
    if (rc) {
      const ppFront = anchors.get(ppKey)?.pos || rc[0];
      if (rc[0].distanceTo(ppFront) > rc[rc.length - 1].distanceTo(ppFront)) rc.reverse();
      pts.push(...rc);
    } else if (swPort) pts.push(anchors.get(ppKey).pos.clone(), swPort.pos.clone());
    const full = dedupe(pts);
    const smooth = roundPolyline(full, 0.08, 3);
    segments.set(`cable:${o.dev}`, smooth);
    // tubo de rayos X solo para el tramo oculto (canaleta + cielorraso + rack)
    const hiddenStart = o.dev.startsWith('AP') ? 0 : full.findIndex((p) => p.equals(anchors.get(`jackback:${o.label}`).pos));
    const hidden = roundPolyline(full.slice(Math.max(0, hiddenStart)), 0.1, 3);
    const tube = tubeFrom(hidden, 0.007, xmat(color(o)), 5);
    tube.userData.cable = o.dev;
    tube.renderOrder = 15;
    xray.add(tube);
    cableMeshes.set(`cable:${o.dev}`, [tube, visibleCord].filter(Boolean));
  });

  // Fibra SW1/SFP25 → SW2/SFP9 por el recorrido del plano (p.2)
  {
    const pts = [];
    const c1 = pointsOfTube(rackCords.get('FIBER-R1'), 24);
    const c2 = pointsOfTube(rackCords.get('FIBER-R2'), 24);
    const sfp1 = anchors.get('SW1/SFP25')?.pos, sfp2 = anchors.get('SW2/SFP9')?.pos;
    if (c1) { if (sfp1 && c1[0].distanceTo(sfp1) > c1[c1.length - 1].distanceTo(sfp1)) c1.reverse(); pts.push(...c1); } else if (sfp1) pts.push(sfp1.clone());
    const f1 = anchors.get('R1:fiber')?.pos || v3(14, 1.6, 10);
    const f2 = anchors.get('R2:fiber')?.pos || v3(15, 1.4, 2);
    pts.push(f1.clone(), v3(f1.x, PLENUM + 0.12, f1.z));
    const route = [...FIBER_ROUTE].reverse(); // de R1 a R2
    for (const [x, z] of route.slice(1, -1)) pts.push(v3(x, PLENUM + 0.12, z));
    pts.push(v3(f2.x, PLENUM + 0.12, f2.z), f2.clone());
    if (c2) { if (sfp2 && c2[0].distanceTo(sfp2) < c2[c2.length - 1].distanceTo(sfp2)) c2.reverse(); pts.push(...c2); } else if (sfp2) pts.push(sfp2.clone());
    const smooth = roundPolyline(dedupe(pts), 0.15, 4);
    segments.set('fiber', smooth);
    const tube = tubeFrom(roundPolyline(dedupe(pts.slice(c1 ? c1.length : 1, pts.length - (c2 ? c2.length : 1))), 0.15, 4), 0.012, xmat(FIBER_COLOR), 6);
    tube.renderOrder = 15;
    xray.add(tube);
    cableMeshes.set('fiber', [tube]);
  }

  // Enlaces dentro del rack R1
  const rackSeg = (id, cordKey, fromKey) => {
    const p = pointsOfTube(rackCords.get(cordKey), 20);
    const from = anchors.get(fromKey)?.pos;
    if (!p) return;
    if (from && p[0].distanceTo(from) > p[p.length - 1].distanceTo(from)) p.reverse();
    segments.set(id, p);
    cableMeshes.set(id, [rackCords.get(cordKey)]);
  };
  rackSeg('rack:ER605', 'SW1/17', 'SW1/17');
  rackSeg('rack:NAS1', 'SW1/18', 'SW1/18');
  rackSeg('rack:PBX', 'SW1/19', 'SW1/19');
  for (const [seg, key, port] of [['wan:claro', 'WAN1', 'ER605/WAN1'], ['wan:personal', 'WAN2', 'ER605/WAN2']]) {
    const p = pointsOfTube(rackCords.get(key), 20);
    const from = anchors.get(port)?.pos;
    if (!p) continue;
    if (from && p[0].distanceTo(from) > p[p.length - 1].distanceTo(from)) p.reverse();
    const end = p[p.length - 1];
    // del equipo del proveedor sale la acometida hacia el exterior (por el cielorraso)
    p.push(v3(end.x, end.y + 0.25, end.z), v3(end.x, PLENUM + 0.2, end.z), v3(16.4, PLENUM + 0.2, end.z + (key === 'WAN1' ? -0.3 : 0.3)), v3(17.5, 4.2, end.z));
    segments.set(seg, roundPolyline(dedupe(p), 0.15, 3));
    cableMeshes.set(seg, [rackCords.get(key)]);
  }
  // Wi-Fi: del AP a un cliente inalámbrico (visita en recepción / laptop en escritorios)
  const wifiClients = { AP1: v3(4.9, 1.0, 11.0), AP2: v3(12.3, 1.05, 4.75) };
  for (const ap of ['AP1', 'AP2']) {
    const a = anchors.get(`dev:${ap}`).pos.clone(); a.y -= 0.08;
    const b = wifiClients[ap];
    const mid = a.clone().lerp(b, 0.5); mid.y += 0.35;
    segments.set(`wifi:${ap}`, new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(24));
  }

  // ════════════════════ DECORACIÓN (CC0) ════════════════════
  // Cada pieza se apoya contra su pared/esquina usando su caja envolvente real (nada atraviesa paredes).
  const deco = async (name, x, z, { rot = 0, y = 0, snap = [], collide = true, scale = 1 } = {}) => {
    const o = await prop(name, x, z, { rot, y, scale });
    if (!o) return null;
    o.name = name;
    for (const [axis, at, dir, gap] of snap) snapToWall(o, axis, at, dir, gap ?? 0.015);
    o.updateWorldMatrix(true, true);
    const b = new THREE.Box3().setFromObject(o);
    if (collide) colliderFromBox(b, 0.02);
    if (collide) solids.push({ name, box: b });
    return o;
  };
  const jobs = [];
  // sofá moderno de 2–3 cuerpos (tela gris, patas metálicas)
  function modernSofa(x, z, th, w) {
    const g = new THREE.Group();
    const fab = new THREE.MeshStandardMaterial({ color: 0x8d9298, roughness: 0.97 });
    const fab2 = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.97 });
    const leg = new THREE.MeshStandardMaterial({ color: 0x2b2d30, metalness: 0.6, roughness: 0.4 });
    const rb = (W, Hh, Dd, r, m, px, py, pz) => { const o = new THREE.Mesh(new RoundedBoxGeometry(W, Hh, Dd, 3, r), m); o.position.set(px, py, pz); g.add(o); return o; };
    const D = 0.86;
    rb(w, 0.2, D, 0.03, fab, 0, 0.25, 0);
    rb(0.16, 0.42, D, 0.05, fab, -w / 2 + 0.08, 0.36, 0); rb(0.16, 0.42, D, 0.05, fab, w / 2 - 0.08, 0.36, 0);
    rb(w - 0.04, 0.46, 0.18, 0.06, fab, 0, 0.55, -D / 2 + 0.09);
    const n = w > 1.8 ? 3 : 2, cw = (w - 0.32) / n;
    for (let i = 0; i < n; i++) {
      rb(cw - 0.015, 0.13, D - 0.22, 0.05, fab2, -w / 2 + 0.16 + cw * (i + 0.5), 0.41, 0.06);
      rb(cw - 0.03, 0.4, 0.16, 0.07, fab2, -w / 2 + 0.16 + cw * (i + 0.5), 0.67, -D / 2 + 0.24).rotation.x = -0.12;
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.15, 10), leg); l.position.set(sx * (w / 2 - 0.08), 0.075, sz * (D / 2 - 0.08)); g.add(l); }
    g.position.set(x, 0, z); g.rotation.y = th; g.name = 'sofa';
    g.traverse((o) => { if (o.isMesh) { o.castShadow = quality.shadows; o.receiveShadow = true; } });
    root.add(g);
    return g;
  }
  // Recepción: zona de espera contra la pared sur, mesa ratona delante con paso libre
  jobs.push((async () => {
    // sofá de 3 cuerpos escalado a la pared libre de recepción (x 3,2–5,9), mesa ratona con 40 cm de paso
    const sofa = modernSofa(4.75, 11.45, Math.PI, 2.1);
    snapToWall(sofa, 'z', 12, -1, 0.02); snapToWall(sofa, 'x', 6, -1, 0.05);
    { const b = new THREE.Box3().setFromObject(sofa); colliderFromBox(b, 0.02); solids.push({ name: 'sofá', box: b }); }
    const sb = sofa ? new THREE.Box3().setFromObject(sofa) : new THREE.Box3(new THREE.Vector3(3.5, 0, 11.1), new THREE.Vector3(5.9, 0.9, 11.9));
    const t = await deco('coffee_table_round_01', (sb.min.x + sb.max.x) / 2, sb.min.z - 0.8, { scale: 0.72, collide: false });
    if (t) {
      let tb = new THREE.Box3().setFromObject(t);
      t.position.z += sb.min.z - 0.4 - tb.max.z;
      t.updateWorldMatrix(true, true);
      tb = new THREE.Box3().setFromObject(t);
      colliderFromBox(tb, 0.02); solids.push({ name: 'mesa ratona', box: tb });
    }
  })());
  jobs.push(deco('potted_plant_02', 0.4, 11.6, { snap: [['x', 0, 1], ['z', 12, -1]] }));
  jobs.push(deco('potted_plant_02', 5.6, 8.4, { snap: [['x', 6, -1], ['z', 8, 1]] }));
  jobs.push(deco('wall_clock', 1.6, 8.2, { y: 2.0, snap: [['z', 8, 1, 0.002]], collide: false }));
  // Gerencia
  jobs.push(deco('modern_arm_chair_01', 3.2, 1.0, { rot: -Math.PI / 2 - 0.25 }));
  jobs.push(deco('modern_arm_chair_01', 3.2, 2.15, { rot: -Math.PI / 2 + 0.25 }));
  jobs.push(deco('potted_plant_04', 3.6, 0.4, { snap: [['x', 4, -1], ['z', 0, 1]] }));
  cabinetAt(4 - WT - 0.225 - 0.01, 4.4, -Math.PI / 2, 1.2, 0.45, 0.72, 'credenza gerencia');
  jobs.push(deco('hanging_picture_frame_02', 0.2, 2.76, { y: 1.45, rot: Math.PI / 2, snap: [['x', 0, 1, 0.002]], collide: false }));
  // Boxes: una planta en la esquina libre de cada uno
  jobs.push(deco('potted_plant_04', 6.15, 0.4, { snap: [['x', 6.5, -1], ['z', 0, 1]] }));
  jobs.push(deco('potted_plant_04', 6.15, 3.4, { snap: [['x', 6.5, -1], ['z', 3, 1]] }));
  jobs.push(deco('potted_plant_04', 9.65, 0.4, { snap: [['x', 10, -1], ['z', 0, 1]] }));
  jobs.push(deco('potted_plant_04', 9.65, 3.4, { snap: [['x', 10, -1], ['z', 3, 1]] }));
  // Área de escritorios
  jobs.push(deco('potted_plant_02', 10.4, 0.45, { snap: [['x', 10, 1], ['z', 0, 1]] }));
  jobs.push(deco('potted_plant_04', 15.6, 0.4, { snap: [['x', 16, -1], ['z', 0, 1]] }));
  // Circulación
  jobs.push(deco('potted_plant_02', 0.4, 6.45, { snap: [['x', 0, 1], ['z', 6, 1]] }));
  jobs.push(deco('potted_plant_02', 15.6, 6.45, { snap: [['x', 16, -1], ['z', 6, 1]] }));
  jobs.push(deco('fire_alarm', 7.0, 7.9, { y: 1.35, rot: Math.PI, snap: [['z', 8, -1, 0.002]], collide: false }));
  jobs.push(deco('wall_clock', 14.6, 6.1, { y: 2.0, snap: [['z', 6, 1, 0.002]], collide: false }));
  // Sala técnica y reunión
  jobs.push(deco('steel_frame_shelves_03', 12.5, 11.5, { snap: [['x', 12, 1], ['z', 12, -1]] }));
  jobs.push(deco('potted_plant_02', 11.55, 11.55, { snap: [['x', 12, -1], ['z', 12, -1]] }));
  // carpeta sobre el escritorio de gerencia
  await Promise.all(jobs);

  // Auditoría de superposiciones (cajas envolventes): objetos sólidos entre sí y contra paredes
  const audit = (wallBoxes) => {
    const out = [];
    const shrink = (b) => b.clone().expandByScalar(-0.012);
    for (let i = 0; i < solids.length; i++) {
      const a = shrink(solids[i].box);
      for (let j = i + 1; j < solids.length; j++) if (a.intersectsBox(shrink(solids[j].box))) out.push(`${solids[i].name} ↔ ${solids[j].name}`);
      for (const w of wallBoxes) {
        if (a.max.x > w.minX + 0.012 && a.min.x < w.maxX - 0.012 && a.max.z > w.minZ + 0.012 && a.min.z < w.maxZ - 0.012) { out.push(`${solids[i].name} ↔ pared`); break; }
      }
    }
    return out;
  };

  return { root, interact, pickables, anchors, segments, xray, poles, poleMat, leds, cableMeshes, racks, screens, deskBuilt, audit, solids, woodTop };

}

// glTF JSON con el binario en base64 → GLB en memoria (sin fetch de data: URIs)
async function loadEmbedded(loader, url) {
  const json = await (await fetch(url)).json();
  const uri = json.buffers?.[0]?.uri || '';
  const b64 = uri.slice(uri.indexOf(',') + 1);
  const raw = atob(b64);
  const bin = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bin[i] = raw.charCodeAt(i);
  delete json.buffers[0].uri;
  const enc = new TextEncoder().encode(JSON.stringify(json));
  const jl = (enc.length + 3) & ~3, bl = (bin.length + 3) & ~3;
  const out = new Uint8Array(12 + 8 + jl + 8 + bl);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546c67, true); dv.setUint32(4, 2, true); dv.setUint32(8, out.length, true);
  dv.setUint32(12, jl, true); dv.setUint32(16, 0x4e4f534a, true);
  out.fill(0x20, 20, 20 + jl); out.set(enc, 20);
  dv.setUint32(20 + jl, bl, true); dv.setUint32(24 + jl, 0x004e4942, true);
  out.set(bin, 28 + jl);
  return loader.parseAsync(out.buffer, url.slice(0, url.lastIndexOf('/') + 1));
}

// Lámina "Diagrama de red" sobre la mesa de reunión (contenido de la p.3)
function diagramTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 726;
  const g = c.getContext('2d');
  g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, 1024, 726);
  g.fillStyle = '#1f2937'; g.font = '700 46px Inter Variable, sans-serif'; g.textAlign = 'center';
  g.fillText('Red e IP de los equipos', 512, 70);
  g.strokeStyle = '#2f4f8f'; g.lineWidth = 3; g.beginPath(); g.moveTo(320, 88); g.lineTo(704, 88); g.stroke();
  const box = (x, y, w, h, t, s, col = '#1f2937') => {
    g.fillStyle = '#fff'; g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, 10); g.fill(); g.stroke();
    g.fillStyle = col; g.font = '700 24px Inter Variable, sans-serif'; g.fillText(t, x, y - (s ? 4 : -8));
    if (s) { g.font = '500 18px Inter Variable, sans-serif'; g.fillStyle = '#4b5563'; g.fillText(s, x, y + 20); }
  };
  const line = (pts, col = '#1f2937', w = 3) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
  line([[220, 170], [220, 230], [512, 230], [512, 260]]); line([[804, 170], [804, 230], [512, 230]]);
  line([[512, 320], [512, 360], [260, 360], [260, 400]]); line([[260, 430], [764, 430]], '#ff7a1a', 6);
  line([[260, 460], [260, 520]]); line([[764, 460], [764, 520]]);
  box(220, 140, 260, 64, 'CLARO · 200 Mb/s', 'WAN1 192.168.100.2', '#c2410c');
  box(804, 140, 280, 64, 'PERSONAL · 300 Mb/s', 'WAN2 192.168.200.2', '#1d4ed8');
  box(512, 290, 250, 64, 'ER605 V2', '10.10.10.1 · gateway .1');
  box(260, 430, 190, 60, 'SW1 · R1', '10.10.10.2');
  box(764, 430, 190, 60, 'SW2 · R2', '10.10.10.3');
  g.fillStyle = '#c2410c'; g.font = '700 20px Inter Variable, sans-serif'; g.fillText('Fibra · 30 m · 1 Gb/s', 512, 418);
  g.font = '500 19px Inter Variable, sans-serif'; g.fillStyle = '#374151'; g.textAlign = 'left';
  ['6 PCs · PC01-PC06 · 10.10.20.101-106', '7 teléfonos · 101-107 · 10.10.40.101-107', 'NAS1 · 10.10.30.10 · PBX · 10.10.40.10', 'NAS2 · 10.10.60.10 · IMP01 · 10.10.30.20', 'AP1 · 10.10.10.11'].forEach((t, i) => g.fillText(t, 70, 550 + i * 30));
  ['5 PCs · PC07-PC11 · 10.10.20.107-111', 'IMP02 · 10.10.30.21', 'AP2 · 10.10.10.12'].forEach((t, i) => g.fillText(t, 600, 550 + i * 30));
  g.textAlign = 'center'; g.font = '600 18px Inter Variable, sans-serif'; g.fillStyle = '#6b7280';
  g.fillText('Negro: cable de red · Naranja: fibra · TP Redes 2026 · p.3', 512, 708);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
