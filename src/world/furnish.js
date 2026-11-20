// Amuebla la oficina con los equipos del TP en sus posiciones del plano (p.2)
// y traza los 23 cables permanentes + fibra + enlaces internos del rack.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as D from './devices.js';
import { META, DESKS, DEVICES, OUTLETS, MEETING, UPS, VLANS, FIBER_COLOR, TRUNK_COLOR, FIBER_ROUTE } from '../data/tp.js';
import { v3, roundPolyline, sagCurve, dedupe, tubeFrom, pointsOfTube } from './paths.js';
import { pbrSet } from './textures.js';

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

  const woodTop = pbrSet('kitchen_wood', { repeat: 1 });
  const cabMat = new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.6 });
  const cabTop = new THREE.MeshStandardMaterial({ map: woodTop.map, roughness: 0.55 });
  // mueble bajo (cajonera) para impresoras
  const lowCabinet = (x, z, w, d, h) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.03, d), cabMat);
    body.position.y = (h - 0.03) / 2;
    const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.03, d + 0.02), cabTop);
    top.position.y = h - 0.015;
    g.add(body, top);
    for (let i = 0; i < 2; i++) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(w * 0.4, 0.012, 0.012), new THREE.MeshStandardMaterial({ color: 0x555b63, metalness: 0.7, roughness: 0.3 }));
      handle.position.set(0, h * (0.32 + i * 0.36), d / 2 + 0.006);
      g.add(handle);
    }
    g.position.set(x, 0, z);
    g.traverse((o) => { if (o.isMesh) { o.castShadow = quality.shadows; o.receiveShadow = true; } });
    root.add(g);
    colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    return h;
  };
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
  const deskBuilt = new Map();
  const outletPole = new Map(); // dev -> {top:[x,z], plate}
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f2, roughness: 0.55, transparent: true, opacity: 1 });

  // Bajada de canaleta desde el cielorraso hasta la caja de superficie (el tendido no cruza por el piso, p.2)
  const dropPole = (x, z, bottomY, labels, facing = 0) => {
    const len = H - bottomY;
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.06, len, 0.04), poleMat);
    pole.position.set(x, bottomY + len / 2, z);
    pole.rotation.y = facing;
    pole.castShadow = quality.shadows;
    root.add(pole);
    poles.push(pole);
    colliders.push({ minX: x - 0.06, maxX: x + 0.06, minZ: z - 0.06, maxZ: z + 0.06 });
    const plate = D.buildJackPlate(labels);
    plate.pickables.forEach((p) => { if (String(p.id).startsWith('plate:')) p.id = 'JACK:' + labels[0]; });
    const off = v3(0, 0, 0.02).applyAxisAngle(v3(0, 1, 0), facing);
    place(plate, x + off.x, bottomY + 0.12, z + off.z, facing);
    return plate;
  };

  for (const d of DESKS) {
    const [x, z] = d.pos;
    const big = d.room === 'gerencia' || d.room === 'recepcion';
    const w = big ? 1.6 : 1.4, dep = 0.7;
    const desk = place(D.buildDesk(w, dep, { woodMap: woodTop.map }), x, 0, z);
    colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - dep / 2, maxZ: z + dep / 2 });
    const top = 0.75;
    const side = d.pc === 'PC01' ? -1 : 1; // la bajada de canaleta no puede quedar en el paso de la entrada
    const name = d.pc, oPC = OUTLETS.find((o) => o.dev === d.pc);
    const mon = place(D.buildMonitor(name, oPC.ip), x - 0.05, top, z - 0.17);
    screens.push(mon.group);
    place(D.buildKeyboard(), x - 0.05, top, z + 0.12);
    place(D.buildMouse(), x + 0.28 * side, top, z + 0.14);
    const pc = place(D.buildPCTower(name), x + side * (w / 2 - 0.2), 0, z - 0.08, -side * Math.PI / 2);
    usePicks(pc, name); usePicks(mon, name);
    register(name, desk.group, 'pc', { group: [desk.group, pc.group, mon.group] });
    desk.group.traverse((o) => { if (o.isMesh && o.userData.pickId === undefined) o.userData.pickId = name; });
    pickables.push(desk.group);
    anchors.set(`dev:${name}`, worldPort(pc, 'nic'));
    // silla
    if (hasSF('office_chair')) await prop('sf_office_chair', x, z + 0.62, { rot: Math.PI });
    else place(D.buildOfficeChair(), x, 0, z + 0.62, Math.PI);

    // teléfono (si tiene)
    const labels = [oPC.label];
    let tel = null;
    if (d.tel) {
      const oT = OUTLETS.find((o) => o.dev === d.tel);
      labels.push(oT.label);
      tel = place(D.buildPhone(oT.dev.replace('TEL', '')), x - side * (w / 2 - 0.25), top, z - 0.05, 0.25 * side);
      usePicks(tel, d.tel);
      register(d.tel, tel.group, 'phone');
      anchors.set(`dev:${d.tel}`, worldPort(tel, 'lan'));
    }
    // canaleta + caja de superficie en la esquina trasera derecha del escritorio
    const plate = dropPole(x + side * (w / 2 + 0.06), z - dep / 2 + 0.05, 0.8, labels, side * Math.PI / 2);
    usePicks(plate, 'JACK:' + labels[0]);
    register('JACK:' + labels[0], plate.group, 'jack', { labels });
    anchors.set(`jack:${oPC.label}`, worldPort(plate, 'J0'));
    anchors.set(`jackback:${oPC.label}`, worldPort(plate, 'back'));
    if (d.tel) {
      const oT = OUTLETS.find((o) => o.dev === d.tel);
      anchors.set(`jack:${oT.label}`, worldPort(plate, 'J1'));
      anchors.set(`jackback:${oT.label}`, worldPort(plate, 'back'));
    }
    deskBuilt.set(name, { desk, pc, mon, tel, plate });
    // decoración liviana sobre el escritorio
    prop(DESKS.indexOf(d) % 2 ? 'office_notepads' : 'stationery_supplies', x + 0.35 * side, z - 0.2, { y: top, rot: DESKS.indexOf(d) * 1.3 });
  }

  // ════════════════════ SALA DE REUNIÓN ════════════════════
  {
    const [tx, tz] = MEETING.table;
    const t = place(D.buildMeetingTable(MEETING.size[0], MEETING.size[1], { woodMap: woodTop.map }), tx, 0, tz);
    colliders.push({ minX: tx - MEETING.size[0] / 2, maxX: tx + MEETING.size[0] / 2, minZ: tz - MEETING.size[1] / 2, maxZ: tz + MEETING.size[1] / 2 });
    for (const cx of [-0.85, 0, 0.85]) for (const s of [-1, 1]) {
      if (hasSF('office_chair')) prop('sf_office_chair', tx + cx, tz + s * 0.95, { rot: s > 0 ? Math.PI : 0 });
      else place(D.buildOfficeChair(), tx + cx, 0, tz + s * 0.95, s > 0 ? Math.PI : 0);
    }
    const oT = OUTLETS.find((o) => o.dev === MEETING.tel);
    const [px, pz] = MEETING.telPos;
    const tel = place(D.buildPhone('107'), px, 0.75, pz, -Math.PI / 2 + 0.3);
    usePicks(tel, 'TEL107'); register('TEL107', tel.group, 'phone');
    anchors.set('dev:TEL107', worldPort(tel, 'lan'));
    const plate = dropPole(tx + MEETING.size[0] / 2 + 0.16, tz, 0.8, [oT.label], Math.PI / 2);
    usePicks(plate, 'JACK:' + oT.label); register('JACK:' + oT.label, plate.group, 'jack', { labels: [oT.label] });
    anchors.set(`jack:${oT.label}`, worldPort(plate, 'J0'));
    anchors.set(`jackback:${oT.label}`, worldPort(plate, 'back'));
    // diagrama de red impreso sobre la mesa (interactivo, ref. de Tomi)
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.44), new THREE.MeshStandardMaterial({ map: diagramTexture(), roughness: 0.8 }));
    paper.rotation.x = -Math.PI / 2; paper.rotation.z = 0.08;
    paper.position.set(tx - 0.5, 0.762, tz + 0.05);
    paper.userData.pickId = 'DIAGRAMA';
    root.add(paper); pickables.push(paper);
    register('DIAGRAMA', paper, 'doc');
    prop('projector_screen', tx, 8.12, { rot: 0 }).then((o) => { if (o) { o.userData.pickId = 'PRESENTACION'; o.traverse((m) => (m.userData.pickId = 'PRESENTACION')); pickables.push(o); register('PRESENTACION', o, 'doc'); } });
    prop('potted_plant_02', 11.55, 11.55, { collide: true });
    prop('ceramic_vase_01', tx + 0.6, tz - 0.1, { y: 0.762, scale: 0.8 });
  }

  // ════════════════════ EQUIPOS SUELTOS ════════════════════
  const singleDevice = async (dev, built, x, y, z, rot, poleAt, poleRot = 0) => {
    place(built, x, y, z, rot);
    usePicks(built, dev);
    register(dev, built.group, DEVICES[dev]?.kind || 'device');
    anchors.set(`dev:${dev}`, worldPort(built, 'lan'));
    const o = OUTLETS.find((q) => q.dev === dev);
    if (poleAt) {
      const plate = dropPole(poleAt[0], poleAt[1], 0.8, [o.label], poleRot);
      usePicks(plate, 'JACK:' + o.label); register('JACK:' + o.label, plate.group, 'jack', { labels: [o.label] });
      anchors.set(`jack:${o.label}`, worldPort(plate, 'J0'));
      anchors.set(`jackback:${o.label}`, worldPort(plate, 'back'));
    }
  };
  // Impresoras sobre cajonera
  for (const id of ['IMP01', 'IMP02']) {
    const [x, z] = DEVICES[id].pos;
    const topY = lowCabinet(x, z, 0.62, 0.55, 0.66);
    await singleDevice(id, D.buildPrinter(id), x, topY, z, id === 'IMP01' ? Math.PI / 2 : 0, [x + 0.42, z - 0.25], Math.PI / 2);
  }
  // NAS2 en gerencia sobre mesa auxiliar + UPS
  {
    const [x, z] = DEVICES.NAS2.pos;
    const st = await prop('side_table_01', x, z, { collide: true });
    let topY = 0.55;
    if (st) topY = new THREE.Box3().setFromObject(st).max.y;
    await singleDevice('NAS2', D.buildNAS('NAS2'), x, topY, z, Math.PI / 2, [x + 0.4, z - 0.3], Math.PI / 2);
  }
  // APs en el cielorraso (cuelgan hacia abajo desde el punto de montaje)
  for (const id of ['AP1', 'AP2']) {
    const [x, z] = DEVICES[id].pos;
    const ap = place(D.buildAP(id), x, H, z);
    usePicks(ap, id); register(id, ap.group, 'ap');
    anchors.set(`dev:${id}`, worldPort(ap, 'lan') || { pos: v3(x, H + 0.02, z), dir: v3(0, 1, 0) });
  }
  // UPS
  for (const u of UPS) {
    const b = D.buildUPS(u.model.includes('APC') ? 'apc' : 'atomlux', u.id);
    const rot = u.protects === 'R1' ? Math.PI : u.protects === 'R2' ? -Math.PI / 2 : Math.PI / 2;
    place(b, u.pos[0], 0, u.pos[1], rot);
    usePicks(b, u.id); register(u.id, b.group, 'ups');
    addColliderFromObject(b.group, 0.02);
  }

  // ════════════════════ CABLEADO ════════════════════
  const color = (o) => (o.trunk ? TRUNK_COLOR : VLANS[o.vlan]?.color || '#ffffff');
  const xmats = new Map();
  const xmat = (c) => {
    if (!xmats.has(c)) xmats.set(c, new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, opacity: 0.95 }));
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
      const cord = sagCurve(devA.pos, devA.dir, jack.pos, jack.dir, { sag: 0.08 });
      visibleCord = tubeFrom(cord, 0.0028, cordMat(o.trunk ? TRUNK_COLOR : o.vlan === 40 ? '#d7dce3' : o.vlan === 60 ? '#8b5cf6' : o.vlan === 30 ? '#19b394' : '#2f7cf6'));
      visibleCord.castShadow = false;
      root.add(visibleCord);
      pts.push(...cord);
      // 2) por dentro de la canaleta hasta el cielorraso
      pts.push(back.pos.clone(), v3(back.pos.x, PLENUM + layer, back.pos.z));
      startCeil = [back.pos.x, back.pos.z];
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
  const deco = [
    ['sofa_03', 4.9, 11.45, { rot: Math.PI, collide: true }],
    ['coffee_table_round_01', 4.9, 10.65, { collide: true }],
    ['potted_plant_02', 0.45, 11.5, { collide: true }],
    ['potted_plant_02', 5.6, 8.45, { collide: true }],
    ['korean_fire_extinguisher_01', 3.2, 11.85, { rot: Math.PI }],
    ['wall_clock', 3.2, 8.07, { y: 2.05, rot: 0 }],
    ['modern_arm_chair_01', 1.0, 1.55, { rot: Math.PI * 0.15, collide: true }],
    ['modern_arm_chair_01', 2.1, 1.55, { rot: -Math.PI * 0.15, collide: true }],
    ['potted_plant_04', 3.6, 0.45, { collide: true }],
    ['steel_frame_shelves_03', 3.55, 4.4, { rot: -Math.PI / 2, collide: true }],
    ['hanging_picture_frame_02', 0.07, 2.8, { y: 1.55, rot: Math.PI / 2 }],
    ['potted_plant_04', 6.2, 0.35, { collide: true }],
    ['potted_plant_04', 9.7, 0.35, { collide: true }],
    ['potted_plant_04', 6.2, 5.65, { collide: true }],
    ['potted_plant_04', 9.7, 5.65, { collide: true }],
    ['potted_plant_02', 10.4, 0.45, { collide: true }],
    ['steel_frame_shelves_03', 15.6, 5.2, { rot: -Math.PI / 2, collide: true }],
    ['potted_plant_04', 15.6, 0.4, { collide: true }],
    ['potted_plant_02', 0.45, 6.4, { collide: true }],
    ['potted_plant_02', 15.55, 6.4, { collide: true }],
    ['fire_alarm', 7.0, 7.93, { y: 1.35, rot: Math.PI }],
    ['wall_clock', 9.0, 6.07, { y: 2.05 }],
    ['steel_frame_shelves_03', 12.4, 11.55, { rot: 0, collide: true }],
    ['korean_fire_extinguisher_01', 12.3, 8.4, {}],
    ['hanging_picture_frame_01', 6.07, 10.0, { y: 1.55, rot: Math.PI / 2 }],
    ['binder_notebook', 1.2, 2.66, { y: 0.762, rot: 0.4 }],
  ];
  await Promise.all(deco.map(([n, x, z, o]) => prop(n, x, z, o)));

  return { root, interact, pickables, anchors, segments, xray, poles, poleMat, leds, cableMeshes, racks, screens, deskBuilt };
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
