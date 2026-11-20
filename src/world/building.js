// Construye la arquitectura EXACTA del plano de la p.2 (salas, paredes, puertas, ventanas).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { META, ROOMS, WALLS, DOORS, WINDOWS } from '../data/tp.js';
import { pbrSet, textCanvas, ceilingTexture, cityTexture } from './textures.js';

const H = META.size.h; // altura de cielorraso
const T = 0.12; // espesor de pared
const DOOR_H = 2.1;

export function buildBuilding(scene, colliders) {
  const root = new THREE.Group();
  root.name = 'building';
  scene.add(root);

  // ── materiales ──
  const tile = pbrSet('marble_01', { repeat: 1 });
  const wood = pbrSet('laminate_floor_02', { repeat: 1 });
  const plaster = pbrSet('plastered_wall_04', { repeat: 1, color: false });
  const M = {
    tile: new THREE.MeshStandardMaterial({ ...tile, roughness: 1, color: 0xf2ece2 }),
    wood: new THREE.MeshStandardMaterial({ ...wood, roughness: 1, color: 0xe8ddd0 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xf1efea, roughness: 0.92, normalMap: plaster.normalMap, normalScale: new THREE.Vector2(0.25, 0.25) }),
    accent: new THREE.MeshStandardMaterial({ color: 0x2b3a4f, roughness: 0.7 }),
    base: new THREE.MeshStandardMaterial({ color: 0x4a4f57, roughness: 0.6 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x3a3f46, metalness: 0.6, roughness: 0.35 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xdbe7ee, metalness: 0, roughness: 0.05, transmission: 0, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }),
    frost: new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.9, depthWrite: false, side: THREE.DoubleSide }),
    ceiling: new THREE.MeshStandardMaterial({ map: ceilingTexture(), roughness: 0.95 }),
    panel: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfffaf0, emissiveIntensity: 1.6, roughness: 0.4 }),
  };
  M.ceiling.map.repeat.set(16 / 0.6, 12 / 0.6);

  // ── pisos por sala (UV en metros) ──
  const floors = { tile: [], wood: [] };
  for (const r of ROOMS) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    const g = new THREE.PlaneGeometry(w, d);
    g.rotateX(-Math.PI / 2);
    g.translate(r.x0 + w / 2, 0, r.z0 + d / 2);
    const uv = g.attributes.uv, pos = g.attributes.position;
    const scale = r.floor === 'tile' ? 1.2 : 2.0; // metros por repetición
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / scale, pos.getZ(i) / scale);
    floors[r.floor].push(g);
  }
  for (const k of ['tile', 'wood']) {
    const m = new THREE.Mesh(mergeGeometries(floors[k]), M[k]);
    m.receiveShadow = true;
    m.name = 'floor-' + k;
    root.add(m);
  }

  // ── paredes con huecos de puertas/ventanas ──
  const solid = [], acc = [], base = [], frames = [], glass = [], frost = [];
  const box = (arr, x0, x1, y0, y1, z0, z1) => {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    // UV en metros para que el normal map no se estire
    arr.push(g);
    return g;
  };
  const gapsFor = (w) => {
    const horiz = w.a[1] === w.b[1];
    const at = horiz ? w.a[1] : w.a[0];
    const lo = Math.min(horiz ? w.a[0] : w.a[1], horiz ? w.b[0] : w.b[1]);
    const hi = Math.max(horiz ? w.a[0] : w.a[1], horiz ? w.b[0] : w.b[1]);
    const doors = DOORS.filter((d) => (d.wall === 'z') === horiz && Math.abs(d.at - at) < 1e-6 && d.from >= lo - 1e-6 && d.to <= hi + 1e-6);
    const wins = WINDOWS.filter((d) => (d.wall === 'z') === horiz && Math.abs(d.at - at) < 1e-6);
    return { horiz, at, lo, hi, doors, wins };
  };
  // pieza de pared a lo largo del eje (s0..s1) entre alturas y0..y1
  const piece = (arr, info, s0, s1, y0, y1, thick = T) => {
    if (s1 - s0 < 1e-3) return;
    if (info.horiz) box(arr, s0, s1, y0, y1, info.at - thick / 2, info.at + thick / 2);
    else box(arr, info.at - thick / 2, info.at + thick / 2, y0, y1, s0, s1);
  };
  const collide = (info, s0, s1, thick = T) => {
    if (s1 - s0 < 1e-3) return;
    if (info.horiz) colliders.push({ minX: s0, maxX: s1, minZ: info.at - thick / 2, maxZ: info.at + thick / 2 });
    else colliders.push({ minX: info.at - thick / 2, maxX: info.at + thick / 2, minZ: s0, maxZ: s1 });
  };

  for (const w of WALLS) {
    const info = gapsFor(w);
    const cuts = [...info.doors.map((d) => ({ ...d, kind: 'door' })), ...info.wins.map((d) => ({ ...d, kind: 'win' }))].sort((a, b) => a.from - b.from);
    let s = info.lo;
    const segs = [];
    for (const c of cuts) { segs.push([s, c.from]); s = c.to; }
    segs.push([s, info.hi]);

    if (w.glass) {
      // Tabique vidriado con perfilería de aluminio y banda esmerilada
      for (const [a, b] of segs) {
        piece(frames, info, a, b, 0, 0.06, 0.07);
        piece(frames, info, a, b, H - 0.05, H, 0.07);
        piece(glass, info, a, b, 0.06, H - 0.05, 0.012);
        piece(frost, info, a, b, 1.0, 1.45, 0.016);
        const n = Math.max(1, Math.round((b - a) / 1.2));
        for (let i = 0; i <= n; i++) {
          const p = a + ((b - a) * i) / n;
          piece(frames, info, Math.max(a, p - 0.025), Math.min(b, p + 0.025), 0, H, 0.07);
        }
        collide(info, a, b, 0.08);
      }
    } else {
      for (const [a, b] of segs) {
        piece(solid, info, a, b, 0, H);
        piece(base, info, a, b, 0, 0.08, T + 0.02);
        collide(info, a, b);
      }
    }
    for (const c of cuts) {
      if (c.kind === 'door') {
        // dintel sobre la puerta + marco
        if (w.glass) {
          piece(frames, info, c.from, c.to, DOOR_H, DOOR_H + 0.05, 0.07);
          piece(glass, info, c.from, c.to, DOOR_H + 0.05, H - 0.05, 0.012);
          piece(frames, info, c.from, c.to, H - 0.05, H, 0.07);
        } else piece(solid, info, c.from, c.to, DOOR_H, H);
        piece(frames, info, c.from - 0.04, c.from, 0, DOOR_H + 0.04, T + 0.03);
        piece(frames, info, c.to, c.to + 0.04, 0, DOOR_H + 0.04, T + 0.03);
        piece(frames, info, c.from - 0.04, c.to + 0.04, DOOR_H, DOOR_H + 0.04, T + 0.03);
      } else {
        // ventana: antepecho + dintel + vidrio
        piece(solid, info, c.from, c.to, 0, 0.9);
        piece(solid, info, c.from, c.to, 2.25, H);
        piece(frames, info, c.from, c.to, 0.9, 0.94, T + 0.04);
        piece(frames, info, c.from, c.to, 2.21, 2.25, T + 0.02);
        const n = Math.max(1, Math.round((c.to - c.from) / 1.1));
        for (let i = 0; i <= n; i++) {
          const p = c.from + ((c.to - c.from) * i) / n;
          piece(frames, info, Math.max(c.from, p - 0.025), Math.min(c.to, p + 0.025), 0.9, 2.25, T);
        }
        piece(glass, info, c.from, c.to, 0.94, 2.21, 0.01);
        collide(info, c.from, c.to);
      }
    }
  }
  const add = (arr, mat, name, shadow = true) => {
    if (!arr.length) return null;
    const m = new THREE.Mesh(mergeGeometries(arr), mat);
    m.name = name;
    m.castShadow = shadow;
    m.receiveShadow = true;
    root.add(m);
    return m;
  };
  const wallsMesh = add(solid, M.wall, 'walls');
  add(base, M.base, 'baseboards', false);
  add(frames, M.frame, 'frames');
  const glassMesh = add(glass, M.glass, 'glass', false);
  add(frost, M.frost, 'frost', false);
  if (glassMesh) glassMesh.renderOrder = 2;

  // ── cielorraso + paneles LED 60×60 ──
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), M.ceiling);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(8, H, 6);
  ceil.name = 'ceiling';
  ceil.receiveShadow = false;
  root.add(ceil);

  const panelSpots = [];
  for (const r of ROOMS) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    const nx = Math.max(1, Math.round(w / 2.4)), nz = Math.max(1, Math.round(d / 2.4));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = r.x0 + (w * (i + 0.5)) / nx, z = r.z0 + (d * (j + 0.5)) / nz;
      panelSpots.push([Math.round(x / 0.6) * 0.6 - 0.3 + 0.3, Math.round(z / 0.6) * 0.6]);
    }
  }
  const pg = new THREE.BoxGeometry(0.58, 0.02, 0.58);
  const panels = new THREE.InstancedMesh(pg, M.panel, panelSpots.length);
  const mtx = new THREE.Matrix4();
  panelSpots.forEach(([x, z], i) => panels.setMatrixAt(i, mtx.makeTranslation(x, H - 0.01, z)));
  panels.name = 'ceiling-panels';
  root.add(panels);

  // ── exterior visible por las ventanas ──
  const city = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), new THREE.MeshBasicMaterial({ map: cityTexture(), toneMapped: false }));
  city.position.set(8, 3, -9);
  root.add(city);
  // losa exterior para que no se vea vacío debajo
  const slabTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); g.fillStyle = '#121b2b'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(96,165,250,0.16)'; g.lineWidth = 2; g.strokeRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 40); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  })();
  const slab = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshStandardMaterial({ map: slabTex, roughness: 1 }));
  slab.rotation.x = -Math.PI / 2; slab.position.set(8, -0.01, 6);
  root.add(slab);
  // techo exterior (vista plano) — tapa negra por encima del cielorraso
  // losa de hormigón sobre el plenum (se ve en rayos X desde adentro)
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(16.3, 12.3), new THREE.MeshStandardMaterial({ color: 0x3a4250, roughness: 0.95, side: THREE.DoubleSide }));
  roof.rotation.x = -Math.PI / 2; roof.position.set(8, H + 0.35, 6);
  roof.name = 'roof';
  root.add(roof);

  // ── carteles de salas (lado circulación) ──
  const signMat = (txt) => new THREE.MeshStandardMaterial({ map: textCanvas(txt.toUpperCase(), { w: 512, h: 112, bg: '#243447', fg: '#ffffff', size: 40, radius: 18 }), roughness: 0.5 });
  const signs = [];
  for (const d of DOORS) {
    const room = ROOMS.find((r) => r.id === d.room);
    if (!room || d.open || d.main) continue;
    const g = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.135), signMat(room.name));
    const mid = d.to + 0.42;
    if (d.wall === 'z') {
      // de qué lado está la circulación
      const side = d.at === 6 ? 1 : d.at === 8 ? -1 : 1;
      g.position.set(mid, 1.62, d.at + side * (T / 2 + 0.006));
      if (side < 0) g.rotation.y = Math.PI;
    } else {
      // puertas de boxes sobre el pasillo de boxes
      const side = d.at === 6.5 ? 1 : -1;
      g.position.set(d.at + side * (T / 2 + 0.006), 1.62, d.to + 0.42);
      g.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
    root.add(g);
    signs.push(g);
  }

  // Logo del cliente en recepción (pared norte, cara sur)
  const logoTex = (() => {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 300;
    const g = c.getContext('2d');
    g.fillStyle = '#1f3a64';
    [[40, 150, 46, 110], [100, 110, 46, 150], [160, 60, 46, 200]].forEach(([x, y, w, h]) => { g.beginPath(); g.roundRect(x, y, w, h, 6); g.fill(); });
    g.fillStyle = '#1f2937';
    g.fillRect(240, 50, 6, 210);
    g.font = '700 104px Inter Variable, Inter, sans-serif';
    g.textBaseline = 'alphabetic';
    g.fillText('Alvarez & Asoc.', 280, 170);
    g.font = '500 46px Inter Variable, Inter, sans-serif';
    g.fillStyle = '#4b5563';
    g.fillText('E s t u d i o   c o n t a b l e', 284, 240);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.7), new THREE.MeshStandardMaterial({ map: logoTex, transparent: true, roughness: 0.6 }));
  logo.position.set(4.35, 1.75, 8 + T / 2 + 0.006);
  root.add(logo);
  // acento de color detrás del logo
  const accentWall = new THREE.Mesh(new THREE.PlaneGeometry(2.9, H - 0.08), new THREE.MeshStandardMaterial({ color: 0xe9eef5, roughness: 0.9 }));
  accentWall.position.set(4.35, H / 2 + 0.04, 8 + T / 2 + 0.003);
  root.add(accentWall);

  return { root, wallsMesh, city, slab, ceiling: ceil, roof, panels, glassMesh, materials: M, signs };
}
