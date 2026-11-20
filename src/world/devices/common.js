// Utilidades compartidas por los modelos procedurales de equipos.
// Caches de materiales y geometrías, texturas de canvas (frentes de equipos),
// cables (TubeGeometry) y anclajes de puertos.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const UH = 0.04445; // 1U en metros
export const MM = 0.001;
export const FONT = "'Inter Variable', 'Inter', 'Helvetica Neue', Arial, sans-serif";

// ── caches ────────────────────────────────────────────────────────────────
const matCache = new Map();
export function mat(key, params = {}, Type = THREE.MeshStandardMaterial) {
  let m = matCache.get(key);
  if (!m) { m = new Type(params); m.name = key; matCache.set(key, m); }
  return m;
}
const geoCache = new Map();
export function geo(key, make) {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
}

// Paleta de materiales base
export const M = {
  rackSteel: () => mat('rackSteel', { color: 0x16181c, roughness: 0.55, metalness: 0.55 }),
  rackSteelDark: () => mat('rackSteelDark', { color: 0x0e0f12, roughness: 0.7, metalness: 0.4 }),
  rail: () => mat('rail', { color: 0x2a2d33, roughness: 0.45, metalness: 0.75 }),
  zinc: () => mat('zinc', { color: 0x9aa1aa, roughness: 0.35, metalness: 0.9 }),
  devBlack: () => mat('devBlack', { color: 0x1b1d21, roughness: 0.5, metalness: 0.35 }),
  devGrey: () => mat('devGrey', { color: 0x3a3e45, roughness: 0.45, metalness: 0.6 }),
  plasticBlack: () => mat('plasticBlack', { color: 0x141518, roughness: 0.6, metalness: 0.0 }),
  plasticWhite: () => mat('plasticWhite', { color: 0xf2f2ef, roughness: 0.45, metalness: 0.0 }),
  plasticOff: () => mat('plasticOff', { color: 0xe8e6e0, roughness: 0.55, metalness: 0.0 }),
  pvc: () => mat('pvc', { color: 0xf4f4f1, roughness: 0.5, metalness: 0.0 }),
  chrome: () => mat('chrome', { color: 0xd7dbe0, roughness: 0.18, metalness: 1.0 }),
  alu: () => mat('alu', { color: 0xb9bec5, roughness: 0.32, metalness: 0.85 }),
  rubber: () => mat('rubber', { color: 0x0b0c0e, roughness: 0.9, metalness: 0 }),
  glass: () => mat('rackGlass', { color: 0x9fb4c2, roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.4 }),
  screenOff: () => mat('screenOff', { color: 0x050607, roughness: 0.12, metalness: 0.2 }),
  mesh: () => mat('chairMesh', { color: 0x1a1c20, roughness: 0.85, metalness: 0, transparent: true, opacity: 0.88, side: THREE.DoubleSide }),
  fabric: () => mat('chairFabric', { color: 0x23262b, roughness: 0.95, metalness: 0 }),
  pick: () => mat('pickInvisible', { transparent: true, opacity: 0, depthWrite: false, colorWrite: false }, THREE.MeshBasicMaterial),
};

// ── primitivas ────────────────────────────────────────────────────────────
const r5 = (v) => Math.round(v * 1e5) / 1e5;
export function boxGeo(w, h, d) {
  return geo(`box:${r5(w)}:${r5(h)}:${r5(d)}`, () => new THREE.BoxGeometry(w, h, d));
}
export function rboxGeo(w, h, d, r, seg = 2) {
  return geo(`rbox:${r5(w)}:${r5(h)}:${r5(d)}:${r5(r)}:${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2) * 0.999));
}
export function box(w, h, d, material, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(boxGeo(w, h, d), material);
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}
export function rbox(w, h, d, r, material, x = 0, y = 0, z = 0, parent, seg = 2) {
  const m = new THREE.Mesh(rboxGeo(w, h, d, r, seg), material);
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}
export function cyl(rt, rb, h, seg, material, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo(`cyl:${r5(rt)}:${r5(rb)}:${r5(h)}:${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), material);
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}

// Caja con textura sólo en la cara frontal (+Z). Para frentes de equipos.
export function faceBox(w, h, d, faceMat, bodyMat, x = 0, y = 0, z = 0, parent) {
  const mats = [bodyMat, bodyMat, bodyMat, bodyMat, faceMat, bodyMat];
  const m = new THREE.Mesh(boxGeo(w, h, d), mats);
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}
// Plano (cara) con canvas, mirando +Z
export function facePlane(w, h, material, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo(`plane:${r5(w)}:${r5(h)}`, () => new THREE.PlaneGeometry(w, h)), material);
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}

// ── canvas ────────────────────────────────────────────────────────────────
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
export function faceMat(tex, { roughness = 0.5, metalness = 0.3, emissiveMap = null, emissive = 0x000000 } = {}) {
  return new THREE.MeshStandardMaterial({ map: tex, roughness, metalness, emissiveMap, emissive, emissiveIntensity: emissiveMap ? 1 : 0 });
}

// Mapeador mm → px para dibujar frentes. face: ancho/alto en mm, centrado en 0.
export function mmMapper(g, W, H, faceW, faceH) {
  const sx = W / faceW, sy = H / faceH;
  return {
    sx, sy,
    X: (mm) => (mm + faceW / 2) * sx,
    Y: (mm) => (faceH / 2 - mm) * sy, // y positivo hacia arriba
    rect(xc, yc, w, h, fill, stroke, lw = 1) {
      const x = (xc - w / 2 + faceW / 2) * sx, y = (faceH / 2 - yc - h / 2) * sy;
      if (fill) { g.fillStyle = fill; g.fillRect(x, y, w * sx, h * sy); }
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.strokeRect(x, y, w * sx, h * sy); }
    },
    rrect(xc, yc, w, h, r, fill, stroke, lw = 1) {
      const x = (xc - w / 2 + faceW / 2) * sx, y = (faceH / 2 - yc - h / 2) * sy;
      g.beginPath();
      g.roundRect(x, y, w * sx, h * sy, r * sx);
      if (fill) { g.fillStyle = fill; g.fill(); }
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
    },
    circle(xc, yc, r, fill, stroke, lw = 1) {
      g.beginPath();
      g.arc((xc + faceW / 2) * sx, (faceH / 2 - yc) * sy, r * sx, 0, Math.PI * 2);
      if (fill) { g.fillStyle = fill; g.fill(); }
      if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
    },
    text(str, xc, yc, sizeMm, color = '#fff', weight = 600, align = 'center', font = FONT) {
      g.fillStyle = color;
      g.font = `${weight} ${Math.max(6, sizeMm * sy)}px ${font}`;
      g.textAlign = align; g.textBaseline = 'middle';
      g.fillText(str, (xc + faceW / 2) * sx, (faceH / 2 - yc) * sy);
    },
  };
}

// Abertura RJ45 vista de frente (para canvas). used=false → puerto de reserva (más gris).
export function drawRJ45(f, xc, yc, w = 11.8, h = 10.4, { used = true, flip = false, frame = '#5a5f66' } = {}) {
  f.rect(xc, yc, w + 1.6, h + 1.6, frame);
  f.rect(xc, yc, w, h, used ? '#050506' : '#24282e');
  // lengüeta (clip) arriba o abajo
  const ty = flip ? yc - h / 2 + 1.6 : yc + h / 2 - 1.6;
  f.rect(xc, ty, w * 0.45, 2.4, used ? '#000' : '#1a1d22');
  // 8 contactos dorados
  const cy = flip ? yc + h / 2 - 1.2 : yc - h / 2 + 1.2;
  for (let i = 0; i < 8; i++) f.rect(xc - w * 0.36 + i * (w * 0.72) / 7, cy, 0.55, 1.6, used ? '#c8a64a' : '#6f6a55');
}
export function drawSFP(f, xc, yc, w = 14, h = 9.5, used = false) {
  f.rect(xc, yc, w + 1.4, h + 1.4, '#9aa1aa');
  f.rect(xc, yc, w, h, used ? '#050506' : '#1d2026');
  f.rect(xc, yc - h / 2 + 1, w - 3, 0.8, '#3a3f46');
}
export function drawVents(f, x0, x1, y0, y1, pitch = 3, r = 0.8, color = '#000') {
  for (let x = x0; x <= x1; x += pitch) for (let y = y0; y <= y1; y += pitch) f.circle(x, y, r, color);
}
export function drawScrew(f, xc, yc, r = 2.2) {
  f.circle(xc, yc, r, '#8d939b');
  f.circle(xc, yc, r * 0.82, '#b8bdc4');
  f.rect(xc, yc, r * 1.2, r * 0.28, '#4d5157');
  f.rect(xc, yc, r * 0.28, r * 1.2, '#4d5157');
}

// ── puertos / anclajes ───────────────────────────────────────────────────
export class Ports {
  constructor() { this.map = new Map(); }
  add(key, pos, dir = new THREE.Vector3(0, 0, 1)) {
    this.map.set(key, { pos: pos.clone(), dir: dir.clone().normalize() });
    return this;
  }
  // incorpora puertos de un hijo (en espacio local del hijo) transformados al espacio del padre
  mergeFrom(child, childPorts, prefix = '') {
    child.updateMatrix();
    for (const [k, v] of childPorts) {
      this.map.set(prefix + k, {
        pos: v.pos.clone().applyMatrix4(child.matrix),
        dir: v.dir.clone().transformDirection(child.matrix),
      });
    }
  }
}

// Cable (patch cord / fibra) a lo largo de puntos.
export function makeCord(points, color, radius = 0.0025, segPerM = 90, radial = 6) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
  const len = curve.getLength();
  const segs = Math.max(12, Math.min(160, Math.round(len * segPerM)));
  const g = new THREE.TubeGeometry(curve, segs, radius, radial, false);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.0 }));
  m.userData.curve = curve;
  m.userData.length = len;
  return m;
}

// LED emisivo pequeño (cada uno con su material para poder animarlo).
export function makeLed(color, on = true, size = [0.0022, 0.0018], parent, x = 0, y = 0, z = 0) {
  const c = new THREE.Color(color);
  const m = new THREE.MeshStandardMaterial({ color: c.clone().multiplyScalar(0.3), emissive: c, emissiveIntensity: on ? 2.2 : 0, roughness: 0.3 });
  const mesh = new THREE.Mesh(geo(`led:${size[0]}:${size[1]}`, () => new THREE.PlaneGeometry(size[0], size[1])), m);
  mesh.position.set(x, y, z);
  if (parent) parent.add(mesh);
  return { mesh, mat: m };
}

// Malla instanciada invisible para "pickear" puertos individuales.
export function pickInstances(entries, size = [0.013, 0.012, 0.012]) {
  const g = boxGeo(size[0], size[1], size[2]);
  const im = new THREE.InstancedMesh(g, M.pick(), entries.length);
  const m4 = new THREE.Matrix4();
  entries.forEach((e, i) => { m4.makeTranslation(e.pos.x, e.pos.y, e.pos.z); im.setMatrixAt(i, m4); });
  im.instanceMatrix.needsUpdate = true;
  im.computeBoundingSphere();
  return { mesh: im, instanceMap: entries.map((e) => e.id) };
}

// Fichas RJ45 enchufadas (instanciadas, color por instancia).
export function plugInstances(list) {
  if (!list.length) return null;
  const g = geo('plugGeo', () => {
    const body = new THREE.BoxGeometry(0.0118, 0.0084, 0.024);
    body.translate(0, 0, 0.009);
    return body;
  });
  const material = mat('plugMat', { color: 0xffffff, roughness: 0.35, metalness: 0.0 });
  const im = new THREE.InstancedMesh(g, material, list.length);
  const q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), m4 = new THREE.Matrix4();
  const Z = new THREE.Vector3(0, 0, 1), col = new THREE.Color();
  list.forEach((p, i) => {
    q.setFromUnitVectors(Z, p.dir.clone().normalize());
    m4.compose(p.pos, q, s);
    im.setMatrixAt(i, m4);
    im.setColorAt(i, col.set(p.color));
  });
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.computeBoundingSphere();
  return im;
}

export function countTriangles(obj) {
  let t = 0;
  obj.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry;
    const n = g.index ? g.index.count / 3 : g.attributes.position.count / 3;
    t += n * (o.isInstancedMesh ? o.count : 1);
  });
  return Math.round(t);
}
