// Utilidades de recorridos: polilíneas con esquinas redondeadas y catenarias para patch cords.
import * as THREE from 'three';

export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

// Redondea esquinas de una polilínea (radio r) con Bézier cuadráticas
export function roundPolyline(pts, r = 0.1, seg = 5) {
  if (pts.length < 3) return pts.map((p) => p.clone());
  const out = [pts[0].clone()];
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
    const a = p0.clone().sub(p1), b = p2.clone().sub(p1);
    const la = a.length(), lb = b.length();
    if (la < 1e-4 || lb < 1e-4) continue;
    const rr = Math.min(r, la / 2, lb / 2);
    const s = p1.clone().add(a.normalize().multiplyScalar(rr));
    const e = p1.clone().add(b.normalize().multiplyScalar(rr));
    const q = new THREE.QuadraticBezierCurve3(s, p1.clone(), e);
    for (let k = 0; k <= seg; k++) out.push(q.getPoint(k / seg));
  }
  out.push(pts[pts.length - 1].clone());
  return dedupe(out);
}

// Cable colgante entre dos puntos (catenaria aproximada) saliendo en las direcciones de los puertos
export function sagCurve(a, adir, b, bdir, { sag = 0.12, lead = 0.05, n = 18 } = {}) {
  const p1 = a.clone().add((adir || v3(0, 0, 0)).clone().multiplyScalar(lead));
  const p2 = b.clone().add((bdir || v3(0, 0, 0)).clone().multiplyScalar(lead));
  const mid = p1.clone().lerp(p2, 0.5);
  const d = p1.distanceTo(p2);
  mid.y -= Math.min(sag + d * 0.12, 0.6);
  const lowest = Math.min(p1.y, p2.y) - 0.02;
  if (mid.y < 0.02) mid.y = 0.02;
  if (mid.y > lowest) mid.y = lowest;
  const c = new THREE.CatmullRomCurve3([a.clone(), p1, mid, p2, b.clone()], false, 'centripetal');
  return c.getPoints(n);
}

export function dedupe(pts) {
  const out = [];
  for (const p of pts) if (!out.length || out[out.length - 1].distanceToSquared(p) > 1e-8) out.push(p);
  return out;
}

export function polyLength(pts) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += pts[i].distanceTo(pts[i - 1]);
  return l;
}

// Muestra un punto a distancia s a lo largo de la polilínea (cum = longitudes acumuladas)
export function cumulative(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  return cum;
}
export function sampleAt(pts, cum, s, out = new THREE.Vector3()) {
  if (s <= 0) return out.copy(pts[0]);
  const L = cum[cum.length - 1];
  if (s >= L) return out.copy(pts[pts.length - 1]);
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < s) lo = m; else hi = m; }
  const t = (s - cum[lo]) / (cum[hi] - cum[lo] || 1);
  return out.copy(pts[lo]).lerp(pts[hi], t);
}

export function tubeFrom(pts, radius, mat, radial = 6) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0);
  const g = new THREE.TubeGeometry(curve, Math.max(8, Math.round(pts.length * 1.5)), radius, radial, false);
  return new THREE.Mesh(g, mat);
}

// Extrae la polilínea (en coordenadas de mundo) de un tubo existente
export function pointsOfTube(mesh, n = 24) {
  const path = mesh?.geometry?.parameters?.path;
  if (!path) return null;
  mesh.updateWorldMatrix(true, false);
  return path.getPoints(n).map((p) => p.clone().applyMatrix4(mesh.matrixWorld));
}
