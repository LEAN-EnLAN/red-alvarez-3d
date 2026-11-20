// Controlador en primera persona con colisión cápsula (círculo 2D) vs cajas: sin clipping.
import * as THREE from 'three';

const RADIUS = 0.26;
const EYE = 1.62;

export class Player {
  constructor(camera, colliders) {
    this.camera = camera;
    this.colliders = colliders;
    this.pos = new THREE.Vector3(2.45, 0, 11.3); // entrada / frente (p.2)
    this.vel = new THREE.Vector3();
    this.yaw = 0; // 0 = mirando hacia el norte (-z)
    this.pitch = -0.04;
    this.bob = 0;
    this.active = true;
    this.sens = 0.0022;
  }
  setPose(x, z, yaw = this.yaw, pitch = this.pitch) { this.pos.set(x, 0, z); this.yaw = yaw; this.pitch = pitch; this.vel.set(0, 0, 0); }

  update(dt, input) {
    const look = input.consumeLook();
    if (!this.active) return;
    this.yaw -= look.dx * this.sens;
    this.pitch = THREE.MathUtils.clamp(this.pitch - look.dy * this.sens, -1.35, 1.35);

    const a = input.axis();
    const speed = a.run ? 4.2 : 2.5;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    const tx = (fx * a.y + rx * a.x) * speed, tz = (fz * a.y + rz * a.x) * speed;
    const k = 1 - Math.exp(-dt * 12); // aceleración suave
    this.vel.x += (tx - this.vel.x) * k;
    this.vel.z += (tz - this.vel.z) * k;

    // sub-pasos para no atravesar paredes delgadas a alta velocidad
    const steps = Math.ceil((Math.hypot(this.vel.x, this.vel.z) * dt) / 0.05) || 1;
    for (let s = 0; s < steps; s++) {
      this.pos.x += (this.vel.x * dt) / steps;
      this.pos.z += (this.vel.z * dt) / steps;
      this.resolve();
    }
    const sp = Math.hypot(this.vel.x, this.vel.z);
    this.bob += dt * sp * 3.2;
    this.apply(sp);
  }

  resolve() {
    for (let it = 0; it < 3; it++) {
      let moved = false;
      for (const c of this.colliders) {
        const cx = Math.max(c.minX, Math.min(this.pos.x, c.maxX));
        const cz = Math.max(c.minZ, Math.min(this.pos.z, c.maxZ));
        let dx = this.pos.x - cx, dz = this.pos.z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 < RADIUS * RADIUS) {
          if (d2 < 1e-10) {
            // centro dentro de la caja: empujar por el eje de menor penetración
            const px = Math.min(this.pos.x - c.minX, c.maxX - this.pos.x), pz = Math.min(this.pos.z - c.minZ, c.maxZ - this.pos.z);
            if (px < pz) this.pos.x = this.pos.x - c.minX < c.maxX - this.pos.x ? c.minX - RADIUS : c.maxX + RADIUS;
            else this.pos.z = this.pos.z - c.minZ < c.maxZ - this.pos.z ? c.minZ - RADIUS : c.maxZ + RADIUS;
          } else {
            const d = Math.sqrt(d2), push = RADIUS - d;
            dx /= d; dz /= d;
            this.pos.x += dx * push; this.pos.z += dz * push;
            // anular velocidad contra la pared
            const vn = this.vel.x * dx + this.vel.z * dz;
            if (vn < 0) { this.vel.x -= vn * dx; this.vel.z -= vn * dz; }
          }
          moved = true;
        }
      }
      if (!moved) break;
    }
    this.pos.x = THREE.MathUtils.clamp(this.pos.x, RADIUS, 16 - RADIUS);
    this.pos.z = THREE.MathUtils.clamp(this.pos.z, RADIUS, 12 - RADIUS + 0.0);
  }

  apply(sp = 0) {
    const bobY = Math.sin(this.bob) * 0.018 * Math.min(1, sp / 2.5);
    this.camera.position.set(this.pos.x, EYE + bobY, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
