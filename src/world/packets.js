// Anima los paquetes que emite el simulador recorriendo los cables reales del mundo 3D.
import * as THREE from 'three';
import { bus } from '../core/bus.js';
import { cumulative, sampleAt, tubeFrom } from './paths.js';

const glowTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,0.85)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();

export class Packets {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.live = [];
    this.flash = new THREE.Group();
    scene.add(this.flash);
    bus.on('packet', (p) => this.spawn(p));
  }

  pathFor(segs) {
    const pts = [];
    for (const s of segs) {
      const seg = this.world.segments.get(s.id);
      if (!seg) continue;
      const arr = s.dir === -1 ? [...seg].reverse() : seg;
      for (const p of arr) if (!pts.length || pts[pts.length - 1].distanceToSquared(p) > 1e-8) pts.push(p);
    }
    return pts;
  }

  spawn({ segments = [], ok = true, color = '#60a5fa', duration }) {
    const pts = this.pathFor(segments);
    if (pts.length < 2) return;
    const cum = cumulative(pts);
    const L = cum[cum.length - 1];
    const dur = duration ? (duration > 20 ? duration / 1000 : duration) : THREE.MathUtils.clamp(L / 14, 0.9, 2.6);
    const col = new THREE.Color(color);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true, toneMapped: false }));
    spr.scale.setScalar(0.16);
    spr.renderOrder = 10;
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
    spr.add(core);
    core.scale.setScalar(1 / 0.16);
    this.scene.add(spr);
    // estela
    const N = 18;
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.8, depthTest: false, toneMapped: false }));
    trail.renderOrder = 9;
    trail.frustumCulled = false;
    this.scene.add(trail);
    // resaltar el cable por donde viaja
    const glowTube = tubeFrom(pts, 0.012, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35, depthTest: false, toneMapped: false, blending: THREE.AdditiveBlending }), 5);
    glowTube.renderOrder = 8;
    this.flash.add(glowTube);
    this.live.push({ pts, cum, L, dur, t: 0, spr, trail, hist: [], ok, glowTube, col });
  }

  burst(pos, col) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, blending: THREE.AdditiveBlending, depthTest: false, transparent: true, toneMapped: false }));
    s.position.copy(pos);
    s.renderOrder = 11;
    this.scene.add(s);
    this.live.push({ burst: true, spr: s, t: 0, dur: 0.7 });
  }

  update(dt) {
    const tmp = new THREE.Vector3();
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      p.t += dt;
      if (p.burst) {
        const k = p.t / p.dur;
        p.spr.scale.setScalar(0.1 + k * 0.9);
        p.spr.material.opacity = 1 - k;
        if (k >= 1) { this.scene.remove(p.spr); p.spr.material.dispose(); this.live.splice(i, 1); }
        continue;
      }
      const k = Math.min(1, p.t / p.dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // ease in-out
      const s = e * p.L;
      sampleAt(p.pts, p.cum, s, tmp);
      p.spr.position.copy(tmp);
      p.hist.unshift(tmp.clone());
      if (p.hist.length > 18) p.hist.pop();
      const arr = p.trail.geometry.attributes.position.array;
      for (let j = 0; j < 18; j++) { const h = p.hist[Math.min(j, p.hist.length - 1)]; arr[j * 3] = h.x; arr[j * 3 + 1] = h.y; arr[j * 3 + 2] = h.z; }
      p.trail.geometry.attributes.position.needsUpdate = true;
      p.glowTube.material.opacity = 0.35 * (1 - Math.max(0, (k - 0.85) / 0.15));
      if (k >= 1) {
        if (!p.ok) this.burst(tmp.clone(), new THREE.Color('#ef4444'));
        else this.burst(tmp.clone(), p.col);
        this.scene.remove(p.spr, p.trail);
        this.flash.remove(p.glowTube);
        p.glowTube.geometry.dispose();
        p.trail.geometry.dispose();
        this.live.splice(i, 1);
      }
    }
  }
}
