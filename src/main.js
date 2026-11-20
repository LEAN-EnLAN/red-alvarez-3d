import './styles.css';
import './ui/ui.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { bus } from './core/bus.js';
import { Input, isTouch } from './core/input.js';
import { Player } from './core/player.js';
import { Interactor } from './core/interact.js';
import { buildBuilding } from './world/building.js';
import { furnish } from './world/furnish.js';
import { Packets } from './world/packets.js';
import { setMaxAniso } from './world/textures.js';
import { tubeFrom } from './world/paths.js';
import { HUD, InfoPanel, showHelp } from './ui/hud.js';
import { Presenter } from './ui/present.js';
import { createLoader } from './ui/loading.js';
import { roomAt, OUTLETS, ROOMS, DEVICES, DESKS, VLANS, TRUNK_COLOR, META } from './data/tp.js';

const loader = createLoader();

// ───────── renderer / calidad ─────────
const lowEnd = isTouch || (navigator.hardwareConcurrency || 4) <= 4;
const quality = { shadows: !lowEnd, dpr: Math.min(devicePixelRatio, lowEnd ? 1.5 : 2) };
const canvas = document.createElement('canvas');
canvas.id = 'scene';
document.body.prepend(canvas);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(quality.dpr);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = quality.shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
setMaxAniso(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1626);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const camera = new THREE.PerspectiveCamera(isTouch ? 72 : 68, innerWidth / innerHeight, 0.03, 120);
const hemi = new THREE.HemisphereLight(0xffffff, 0xcfc4b4, 1.25);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff6ea, 1.5);
sun.position.set(9.5, 16, 8.5);
sun.target.position.set(8, 0, 6);
sun.castShadow = quality.shadows;
Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 8, bottom: -8, near: 4, far: 30 });
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
sun.shadow.radius = 4;
scene.add(sun, sun.target);

// ───────── mundo ─────────
const colliders = [];
const building = buildBuilding(scene, colliders);
const manager = new THREE.LoadingManager();
manager.onProgress = (url, a, b) => loader.progress(0.15 + 0.8 * (a / b), `Cargando ${url.split('/').pop()} (${a}/${b})`);
loader.progress(0.1, 'Construyendo el plano 16 × 12 m…');

const hud = new HUD();
const info = new InfoPanel();
const input = new Input(canvas, hud.root);
const player = new Player(camera, colliders);
player.apply();

let world, interactor, packets;
let mode = 'loading';
let xray = false;
const orbit = new OrbitControls(camera, canvas);
orbit.enabled = false;
orbit.enableDamping = true;
orbit.maxPolarAngle = Math.PI * 0.47;
orbit.minDistance = 4;
orbit.maxDistance = 34;
orbit.target.set(8, 0, 6);

// ───────── transiciones de cámara ─────────
let fly = null;
function flyTo(pos, target, dur = 1.4, done) {
  const fromP = camera.position.clone(), fromQ = camera.quaternion.clone();
  const toP = new THREE.Vector3(...pos);
  const m = new THREE.Matrix4().lookAt(toP, new THREE.Vector3(...target), new THREE.Vector3(0, 1, 0));
  const toQ = new THREE.Quaternion().setFromRotationMatrix(m);
  fly = { fromP, fromQ, toP, toQ, t: 0, dur, done, target: new THREE.Vector3(...target) };
}
function updateFly(dt) {
  if (!fly) return;
  fly.t += dt;
  const k = Math.min(1, fly.t / fly.dur);
  const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  camera.position.lerpVectors(fly.fromP, fly.toP, e);
  camera.quaternion.slerpQuaternions(fly.fromQ, fly.toQ, e);
  if (k >= 1) { const d = fly.done; const tg = fly.target; fly = null; d?.(tg); }
}

// ───────── visibilidad: cielorraso / rayos X ─────────
function setCeiling(show, slab = false) {
  // modo maqueta (sin cielorraso y sin losa): se oculta la ciudad y queda el piso técnico oscuro
  const doll = !show && !slab;
  building.city.visible = !doll;
  scene.background.set(doll ? 0x0b1220 : 0x0e1626);
  building.ceiling.visible = show;
  building.panels.visible = show;
  building.roof.visible = slab;
}
function setXray(on) {
  xray = on;
  if (world) {
    world.xray.visible = on;
    world.poleMat.opacity = on ? 0.22 : 1;
    world.poleMat.depthWrite = !on;
  }
  if (mode === 'explore') setCeiling(!on, on);
  syncToolbar();
  bus.emit('xray', { on });
}
function syncToolbar() {
  hud.setMode(mode, { xray, plan: mode === 'orbit', present: mode === 'present' });
  document.body.classList.toggle('presenting', mode === 'present');
  hud.setLocked(input.locked, mode === 'explore');
}

// ───────── modos ─────────
function enterExplore() {
  const resume = () => {
    mode = 'explore';
    orbit.enabled = false;
    player.active = true;
    setCeiling(!xray, xray);
    input.wantsLock = !isTouch;
    syncToolbar();
    clearPlanLabels();
  };
  player.active = false;
  const eye = [player.pos.x, 1.62, player.pos.z];
  const fwd = [player.pos.x - Math.sin(player.yaw) * Math.cos(player.pitch), 1.62 + Math.sin(player.pitch), player.pos.z - Math.cos(player.yaw) * Math.cos(player.pitch)];
  if (mode === 'loading') { player.apply(); resume(); return; }
  flyTo(eye, fwd, 1.2, () => { player.apply(); resume(); });
}
function enterOrbit() {
  if (mode === 'present') presenter.exit();
  mode = 'orbit';
  player.active = false;
  input.wantsLock = false;
  document.exitPointerLock?.();
  setCeiling(false);
  info.close();
  syncToolbar();
  flyTo([8, 17, 19.5], [8, 0, 6], 1.4, (tg) => { orbit.target.copy(tg); orbit.enabled = true; });
}
const presenter = new Presenter({
  onSlide: (s) => {
    mode = 'present';
    player.active = false;
    orbit.enabled = false;
    input.wantsLock = false;
    document.exitPointerLock?.();
    info.close();
    const doll = s.view === 'dollhouse';
    setCeiling(!doll && !s.xray);
    if (world) { world.xray.visible = !!s.xray || xray; world.poleMat.opacity = s.xray ? 0.22 : 1; }
    syncToolbar();
    flyTo(s.cam.pos, s.cam.target, 1.6, () => {
      if (s.route) showRoute(s.route, true);
      if (doll) { orbit.target.set(...s.cam.target); orbit.enabled = true; }
    });
    if (s.labels) showPlanLabels(); else clearPlanLabels();
  },
  onExit: () => { if (world) { world.xray.visible = xray; world.poleMat.opacity = xray ? 0.22 : 1; } enterExplore(); },
});

bus.on('ui:mode', ({ mode: m }) => {
  if (mode === 'loading') return;
  if (m === 'xray') setXray(!xray);
  if (m === 'plan') mode === 'orbit' ? enterExplore() : enterOrbit();
  if (m === 'present') presenter.active ? presenter.exit() : presenter.start(0);
  if (m === 'lab') bus.emit('lab:open', {});
  if (m === 'help') showHelp();
  if (m === 'full') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {});
});

// ───────── recorrido de un cable ─────────
let routeFx = null;
function showRoute(dev, quiet) {
  if (!world) return;
  const pts = world.segments.get(`cable:${dev}`);
  if (!pts) return;
  if (routeFx) { scene.remove(routeFx.mesh); routeFx.mesh.geometry.dispose(); }
  const o = OUTLETS.find((q) => q.dev === dev);
  const col = o.trunk ? TRUNK_COLOR : VLANS[o.vlan].color;
  const mesh = tubeFrom(pts, 0.016, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, depthTest: false, toneMapped: false }), 6);
  mesh.renderOrder = 15;
  scene.add(mesh);
  routeFx = { mesh, t: 0 };
  const loop = () => bus.emit('packet', { id: 'route-' + dev, segments: [{ id: `cable:${dev}`, dir: 1 }], ok: true, color: col, duration: 2.4 });
  loop(); setTimeout(loop, 1300);
  if (!quiet) hud.toast(`${dev} → boca ${o.label} → ${o.pp}-${String(o.n).padStart(2, '0')} → ${o.sw}/${o.port} · ${o.m} m`, 'ok');
}
bus.on('route:show', ({ dev, keepCamera }) => showRoute(dev, keepCamera));
bus.on('goto:rack', ({ id }) => {
  info.close();
  if (presenter.active) presenter.exit();
  if (id === 'R1') player.setPose(14.0, 8.95, Math.PI, -0.12); else player.setPose(13.95, 2.0, -Math.PI / 2, -0.12);
  if (mode !== 'explore') enterExplore(); else player.apply();
});

// ───────── etiquetas del plano ─────────
let planLabels = [];
function showPlanLabels() {
  clearPlanLabels();
  const add = (text, x, y, z, cls = '') => {
    const d = document.createElement('div');
    d.className = 'plan-label ' + cls;
    d.textContent = text;
    document.body.appendChild(d);
    planLabels.push({ d, p: new THREE.Vector3(x, y, z) });
  };
  ROOMS.filter((r) => r.id !== 'pasillo').forEach((r) => add(r.name, (r.x0 + r.x1) / 2, 0.3, r.id === 'circulacion' ? 6.6 : (r.z0 + r.z1) / 2 + 0.9));
  DESKS.forEach((d) => add(d.pc, d.pos[0], 1.3, d.pos[1]));
  ['R1', 'R2', 'NAS2', 'AP1', 'AP2', 'IMP01', 'IMP02'].forEach((id) => add(id, DEVICES[id].pos[0], 1.6, DEVICES[id].pos[1], 'dev'));
}
function clearPlanLabels() { planLabels.forEach((l) => l.d.remove()); planLabels = []; }
function updatePlanLabels() {
  for (const l of planLabels) {
    const v = l.p.clone().project(camera);
    l.d.style.display = v.z < 1 ? '' : 'none';
    l.d.style.left = ((v.x + 1) / 2) * innerWidth + 'px';
    l.d.style.top = ((1 - v.y) / 2) * innerHeight + 'px';
  }
}

// ───────── interacción ─────────
const NAMES = (id) => {
  if (id.startsWith('JACK:')) return `Boca ${id.slice(5)}`;
  if (/^(PP|SW)/.test(id) && /[-/]/.test(id)) return `Puerto ${id}`;
  return DEVICES[id]?.name || (id === 'DIAGRAMA' ? 'Diagrama de red' : id === 'PRESENTACION' ? 'Presentación del TP' : id);
};
function useTarget(id) {
  if (!id) return;
  document.exitPointerLock?.();
  if (id === 'PRESENTACION') { presenter.start(0); return; }
  info.open(id);
}
bus.on('ui:use', () => useTarget(interactor?.current?.id));
input.on('key', (e) => {
  if (mode === 'loading') return;
  if (document.querySelector('.modal-bg')) return;
  switch (e.code) {
    case 'KeyE': if (mode === 'explore') useTarget(interactor?.current?.id); break;
    case 'KeyX': setXray(!xray); break;
    case 'KeyM': bus.emit('ui:mode', { mode: 'plan' }); break;
    case 'KeyP': bus.emit('ui:mode', { mode: 'present' }); break;
    case 'KeyL': bus.emit('lab:open', {}); break;
    case 'KeyH': showHelp(); break;
  }
});
input.on('lock', (locked) => hud.setLocked(locked, mode === 'explore'));
input.on('lockfail', () => { hud.lockhint.textContent = 'Arrastrá con el mouse para mirar'; });
const ndc = new THREE.Vector2();
const pickAt = (x, y, far) => { ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); return interactor?.pick(ndc, far); };
input.on('tap', ({ x, y }) => {
  if (!interactor) return;
  const r = pickAt(x, y, mode === 'explore' ? 4.5 : 60);
  if (r) { interactor.current = r; interactor.highlight(r); useTarget(r.id); }
  else info.close();
});
canvas.addEventListener('click', (e) => {
  if (isTouch || !interactor) return;
  if (mode === 'explore') { if (input.dragLook && interactor.current) useTarget(interactor.current.id); return; }
  const r = pickAt(e.clientX, e.clientY, 60);
  if (r) { interactor.highlight(r); info.open(r.id); }
});

// ───────── laboratorio (carga diferida) ─────────
let labOpen = false;
bus.on('lab:open', () => { labOpen = true; input.enabled = false; document.exitPointerLock?.(); });
bus.on('lab:close', () => { labOpen = false; input.enabled = true; });
import('./lab/lab.js').then((m) => { m.initLab?.(); m.mountMissionTracker?.(); window.__app.sim = m.sim; }).catch((e) => console.warn('Laboratorio no disponible', e));
import('./sim/network.js').catch(() => {});

// ───────── carga ─────────
(async () => {
  try {
    world = await furnish(scene, colliders, { manager, quality });
  } catch (e) {
    console.error(e);
    loader.progress(1, 'Error al construir la escena: ' + e.message);
    return;
  }
  interactor = new Interactor(camera, world, scene);
  packets = new Packets(scene, world);
  renderer.compile(scene, camera);
  loader.ready((go) => {
    enterExplore();
    if (go === 'present') presenter.start(0);
    else hud.toast(isTouch ? 'Bienvenido. Caminá hasta un equipo y tocalo para ver su ficha.' : 'Bienvenido. Hacé clic para mirar · E para inspeccionar · X rayos X', 'ok');
  });
})();

// ───────── loop ─────────
const clock = new THREE.Timer();
let frame = 0, lastRoom = null;
renderer.setAnimationLoop(() => {
  clock.update();
  const raw = clock.getDelta();
  const dt = Math.min(0.05, raw);
  frame++;
  if (mode === 'explore' && !labOpen) player.update(dt, input);
  else input.consumeLook();
  updateFly(Math.min(raw, 0.25));
  if (orbit.enabled) orbit.update();
  if (mode === 'explore' && interactor && !info.isOpen && frame % 3 === 0) {
    const r = interactor.update(ndc.set(0, 0), 3.4);
    hud.setPrompt(r ? `${isTouch ? '' : 'Inspeccionar '}<b>${NAMES(r.id)}</b>` : null);
  }
  if (mode === 'explore') {
    const r = roomAt(player.pos.x, player.pos.z);
    if (r && r.id !== lastRoom) { lastRoom = r.id; hud.setRoom(r.name); bus.emit('room', { id: r.id, name: r.name }); }
  }
  if (frame % 2 === 0) {
    const yaw = mode === 'explore' ? player.yaw : Math.atan2(-(camera.getWorldDirection(new THREE.Vector3()).x), -(camera.getWorldDirection(new THREE.Vector3()).z));
    const p = mode === 'explore' ? player.pos : camera.position;
    hud.drawMini(p.x, p.z, yaw);
  }
  if (routeFx) { routeFx.t += dt; routeFx.mesh.material.opacity = 0.55 + 0.35 * Math.sin(routeFx.t * 5); if (routeFx.t > 9) { scene.remove(routeFx.mesh); routeFx = null; } }
  packets?.update(dt);
  if (world && frame % 6 === 0) blinkLeds(clock.getElapsed());
  if (planLabels.length) updatePlanLabels();
  if (frame % 10 === 0) hud.setLocked(input.locked || info.isOpen || labOpen, mode === 'explore');
  renderer.render(scene, camera);
});

function blinkLeds(t) {
  for (const l of world.leds) {
    if (l.role === 'act' && l.mat.emissiveIntensity !== undefined) l.mat.emissiveIntensity = Math.random() < 0.5 ? 2.2 : 0.4;
  }
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
// debug/automatización
window.__app = { camera, player, flyTo, presenter, setXray, enterOrbit, enterExplore, bus, get world() { return world; }, get mode() { return mode; }, renderer, scene, info };
