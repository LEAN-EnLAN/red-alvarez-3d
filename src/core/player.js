// Controlador en primera persona: cápsula (círculo 2D) contra cajas, sin clipping.
// Sensación de juego: aceleración/inercia, balanceo al caminar, inclinación al ir de costado,
// FOV que se abre al correr, agacharse (C / Ctrl) y eventos de pasos según el piso.
import * as THREE from 'three';
import { bus } from './bus.js';
import { roomAt, ROOMS } from '../data/tp.js';

const RADIUS = 0.27;
const EYE = 1.64, EYE_CROUCH = 1.05;

export class Player {
  constructor(camera, colliders) {
    this.camera = camera;
    this.colliders = colliders;
    this.pos = new THREE.Vector3(2.45, 0, 11.3); // entrada / frente (p.2)
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = -0.04;
    this.active = true;
    this.sens = 0.0022;
    this.invertY = false;
    this.baseFov = camera.fov;
    this.fovKick = 0;
    this.roll = 0;
    this.eye = EYE;
    this.crouch = false;
    this.stepPhase = 0;
    this.bobAmt = 0;
    this.smoothLook = { x: 0, y: 0 };
    bus.on('ui:sens', ({ v }) => (this.sens = 0.0022 * v));
    bus.on('ui:invertY', ({ on }) => (this.invertY = !!on));
    bus.on('ui:fov', ({ v }) => { this.baseFov = v; });
  }
  setPose(x, z, yaw = this.yaw, pitch = this.pitch) { this.pos.set(x, 0, z); this.yaw = yaw; this.pitch = pitch; this.vel.set(0, 0, 0); }

  update(dt, input) {
    const look = input.consumeLook();
    if (!this.active) return;
    // suavizado leve del mouse (menos "nervioso", sin lag perceptible)
    const s = 1 - Math.exp(-dt * 40);
    this.smoothLook.x += (look.dx - this.smoothLook.x) * s;
    this.smoothLook.y += (look.dy - this.smoothLook.y) * s;
    this.yaw -= look.dx * this.sens;
    this.pitch = THREE.MathUtils.clamp(this.pitch - look.dy * this.sens * (this.invertY ? -1 : 1), -1.4, 1.4);

    const a = input.axis();
    this.crouch = input.keys.has('KeyC') || input.keys.has('ControlLeft');
    const run = a.run && !this.crouch && a.y > 0.2;
    const speed = this.crouch ? 1.3 : run ? 4.4 : 2.6;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    const tx = (fx * a.y + rx * a.x) * speed, tz = (fz * a.y + rz * a.x) * speed;
    const moving = Math.abs(a.x) + Math.abs(a.y) > 0.01;
    const k = 1 - Math.exp(-dt * (moving ? 10 : 14));
    this.vel.x += (tx - this.vel.x) * k;
    this.vel.z += (tz - this.vel.z) * k;

    const steps = Math.ceil((Math.hypot(this.vel.x, this.vel.z) * dt) / 0.04) || 1;
    for (let i = 0; i < steps; i++) {
      this.pos.x += (this.vel.x * dt) / steps;
      this.pos.z += (this.vel.z * dt) / steps;
      this.resolve();
    }
    const sp = Math.hypot(this.vel.x, this.vel.z);
    // pasos: un evento por medio ciclo de balanceo
    const prev = this.stepPhase;
    this.stepPhase += dt * sp * (run ? 2.2 : 2.6);
    if (Math.floor(prev / Math.PI) !== Math.floor(this.stepPhase / Math.PI) && sp > 0.6) {
      const r = roomAt(this.pos.x, this.pos.z);
      bus.emit('step', { surface: r?.id === 'gerencia' ? 'carpet' : r?.floor || 'tile', run, x: this.pos.x, z: this.pos.z });
    }
    this.bobAmt += ((sp > 0.3 ? Math.min(1, sp / 2.6) : 0) - this.bobAmt) * (1 - Math.exp(-dt * 8));
    // inclinación (roll) al moverse de costado y al girar
    const lateral = this.vel.x * rx + this.vel.z * rz;
    const targetRoll = -lateral * 0.008 - look.dx * 0.00012;
    this.roll += (THREE.MathUtils.clamp(targetRoll, -0.04, 0.04) - this.roll) * (1 - Math.exp(-dt * 6));
    this.fovKick += ((run && sp > 3 ? 7 : 0) - this.fovKick) * (1 - Math.exp(-dt * 5));
    this.eye += ((this.crouch ? EYE_CROUCH : EYE) - this.eye) * (1 - Math.exp(-dt * 10));
    this.apply();
  }

  resolve() {
    for (let it = 0; it < 4; it++) {
      let moved = false;
      for (const c of this.colliders) {
        const cx = Math.max(c.minX, Math.min(this.pos.x, c.maxX));
        const cz = Math.max(c.minZ, Math.min(this.pos.z, c.maxZ));
        let dx = this.pos.x - cx, dz = this.pos.z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 < RADIUS * RADIUS) {
          if (d2 < 1e-10) {
            const px = Math.min(this.pos.x - c.minX, c.maxX - this.pos.x), pz = Math.min(this.pos.z - c.minZ, c.maxZ - this.pos.z);
            if (px < pz) this.pos.x = this.pos.x - c.minX < c.maxX - this.pos.x ? c.minX - RADIUS : c.maxX + RADIUS;
            else this.pos.z = this.pos.z - c.minZ < c.maxZ - this.pos.z ? c.minZ - RADIUS : c.maxZ + RADIUS;
          } else {
            const d = Math.sqrt(d2), push = RADIUS - d;
            dx /= d; dz /= d;
            this.pos.x += dx * push; this.pos.z += dz * push;
            const vn = this.vel.x * dx + this.vel.z * dz;
            if (vn < 0) { this.vel.x -= vn * dx; this.vel.z -= vn * dz; }
          }
          moved = true;
        }
      }
      if (!moved) break;
    }
    this.pos.x = THREE.MathUtils.clamp(this.pos.x, RADIUS, 16 - RADIUS);
    this.pos.z = THREE.MathUtils.clamp(this.pos.z, RADIUS, 12 - RADIUS);
  }

  // pose de cámara actual (para volver de animaciones)
  eyePose() {
    return { pos: new THREE.Vector3(this.pos.x, this.eye, this.pos.z), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ')) };
  }

  apply() {
    const b = this.bobAmt;
    const bobY = Math.abs(Math.sin(this.stepPhase)) * 0.035 * b - 0.017 * b;
    const bobX = Math.cos(this.stepPhase) * 0.012 * b;
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    this.camera.position.set(this.pos.x + rx * bobX, this.eye + bobY, this.pos.z + rz * bobX);
    this.camera.rotation.set(this.pitch + Math.sin(this.stepPhase * 2) * 0.004 * b, this.yaw, this.roll, 'YXZ');
    const fov = this.baseFov + this.fovKick;
    if (Math.abs(this.camera.fov - fov) > 0.01) { this.camera.fov = fov; this.camera.updateProjectionMatrix(); }
  }
}
