import './styles.css';
import './ui/ui.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { bus } from './core/bus.js';
import { GameAudio } from './core/audio.js';
import { Input, isTouch } from './core/input.js';
import { Player } from './core/player.js';
import { Interactor } from './core/interact.js';
import { buildBuilding } from './world/building.js';
import { furnish } from './world/furnish.js';
import { Packets } from './world/packets.js';
import { setMaxAniso } from './world/textures.js';
import { tubeFrom } from './world/paths.js';
import { applyGenAssets } from './world/genwire.js';
import { batchStatic } from './world/batch.js';
import { HUD, InfoPanel, showHelp } from './ui/hud.js';
import { Presenter } from './ui/present.js';
import { PauseMenu } from './ui/pause.js';
import { createLoader } from './ui/loading.js';
import { roomAt, OUTLETS, ROOMS, DEVICES, VLANS, TRUNK_COLOR } from './data/tp.js';

const loader = createLoader();

// ───────── audio (sintetizado) ─────────
const audio = new GameAudio();
const unlockAudio = () => audio.unlock();
addEventListener('pointerdown', unlockAudio, { once: true });
addEventListener('keydown', unlockAudio, { once: true });
bus.on('step', ({ surface, run }) => audio.footstep(surface, run ? 1 : 0.7));
bus.on('door', ({ open }) => audio.door(open));
bus.on('ui:confirm', () => audio.confirm());
bus.on('packet', ({ vlan, ok }) => audio.packet(vlan ?? 20, ok !== false));
bus.on('mission:done', () => audio.success?.());
bus.on('ui:volume', ({ v }) => audio.setVolume(v));
bus.on('frame', ({ camera: cam }) => audio.setListener(cam));

// ───────── calidad ─────────
const QUALITY = {
  high: { post: true, ao: true, shadows: true, dpr: Math.min(devicePixelRatio, 2), shadowMap: 2048 },
  medium: { post: true, ao: false, shadows: true, dpr: Math.min(devicePixelRatio, 1.5), shadowMap: 1024 },
  low: { post: false, ao: false, shadows: false, dpr: Math.min(devicePixelRatio, 1.25), shadowMap: 512 },
};
const savedQ = (() => { try { return localStorage.getItem('alvarez.quality'); } catch { return null; } })();
const autoQ = isTouch ? 'low' : (navigator.hardwareConcurrency || 4) <= 4 ? 'medium' : 'high';
let qName = QUALITY[savedQ] ? savedQ : autoQ;
let Q = QUALITY[qName];
const quality = { shadows: true }; // los objetos siempre se marcan para sombra; el renderer decide

const canvas = document.createElement('canvas');
canvas.id = 'scene';
document.body.prepend(canvas);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !Q.post, powerPreference: 'high-performance' });
renderer.setPixelRatio(Q.dpr);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = Q.ao ? 0.88 : 1.05; // con AO/bloom (alta) la escena ya se ve más luminosa
renderer.shadowMap.enabled = Q.shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
setMaxAniso(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

const scene = new THREE.Scene();
const STUDIO = new THREE.Color(0xe2e5e9);
scene.background = STUDIO.clone();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.4;

const camera = new THREE.PerspectiveCamera(isTouch ? 72 : 70, innerWidth / innerHeight, 0.03, 160);
// Luz: cielo/suelo cálido + una luz cenital suave con sombras (efecto de oclusión bajo muebles)
const hemi = new THREE.HemisphereLight(0xffffff, 0xcfcac2, 0.75);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff6ec, 1.35);
sun.position.set(10.5, 18, 9.5);
sun.target.position.set(8, 0, 6);
sun.castShadow = Q.shadows;
Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 9, bottom: -9, near: 4, far: 34 });
sun.shadow.mapSize.set(Q.shadowMap, Q.shadowMap);
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.025;
sun.shadow.radius = 5;
scene.add(sun, sun.target);
// luz de relleno de ventanas (norte)
const fill = new THREE.DirectionalLight(0xdfeaff, 0.3);
fill.position.set(8, 6, -10);
scene.add(fill);

// ───────── postproceso ─────────
let composer = null, aoPass = null, bloomPass = null, outlinePass = null;
function buildComposer() {
  composer?.dispose?.();
  composer = null; aoPass = bloomPass = outlinePass = null;
  if (!Q.post) return;
  const rt = new THREE.WebGLRenderTarget(innerWidth * Q.dpr, innerHeight * Q.dpr, { type: THREE.HalfFloatType, samples: 4 });
  composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(Q.dpr);
  composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  if (Q.ao) {
    aoPass = new GTAOPass(scene, camera, innerWidth, innerHeight);
    aoPass.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.5, thickness: 1.5, scale: 1.1, samples: 12 });
    aoPass.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, rings: 2, samples: 12 });
    aoPass.blendIntensity = 0.85;
    composer.addPass(aoPass);
  }
  outlinePass = new OutlinePass(new THREE.Vector2(innerWidth, innerHeight), scene, camera);
  Object.assign(outlinePass, { edgeStrength: 3.2, edgeGlow: 0, edgeThickness: 1.2, pulsePeriod: 0 });
  outlinePass.visibleEdgeColor.set(0x2f6bff);
  outlinePass.hiddenEdgeColor.set(0x2f6bff);
  composer.addPass(outlinePass);
  bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.08, 0.35, 0.97);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
}
buildComposer();
bus.on('ui:quality', ({ level }) => {
  if (!QUALITY[level] || level === qName) return;
  qName = level; Q = QUALITY[level];
  try { localStorage.setItem('alvarez.quality', level); } catch {}
  renderer.setPixelRatio(Q.dpr);
  renderer.toneMappingExposure = Q.ao ? 0.88 : 1.05;
  renderer.shadowMap.enabled = Q.shadows;
  sun.castShadow = Q.shadows;
  sun.shadow.mapSize.set(Q.shadowMap, Q.shadowMap);
  sun.shadow.map?.dispose(); sun.shadow.map = null;
  scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => (m.needsUpdate = true)); });
  buildComposer();
});

// ───────── mundo ─────────
const colliders = [];
const building = buildBuilding(scene, colliders);
const wallColliders = colliders.slice();
const manager = new THREE.LoadingManager();
manager.onProgress = (url, a, b) => loader.progress(0.15 + 0.8 * (a / b), `Cargando ${url.split('/').pop()} (${a}/${b})`);
loader.progress(0.1, 'Construyendo el plano 16 × 12 m…');

const hud = new HUD();
const info = new InfoPanel();
const input = new Input(canvas, hud.root);
const player = new Player(camera, colliders);
player.apply();
// el menú reemite los ajustes guardados al construirse: va después del jugador y del audio
const pause = new PauseMenu({ onResume: () => { if (mode === 'explore') input.lock(); } });
bus.on('ui:menu', () => { if (mode !== 'loading' && !pause.isOpen) pause.open(); });

let world, interactor, packets;
let mode = 'loading'; // loading | explore | inspect | orbit | present | cinematic
let xray = false;
const orbit = new OrbitControls(camera, canvas);
orbit.enabled = false;
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.maxPolarAngle = Math.PI * 0.46;
orbit.minDistance = 5;
orbit.maxDistance = 32;
orbit.target.set(8, 0, 6);

// ───────── transiciones de cámara ─────────
let fly = null;
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
function flyToPose(toP, toQ, dur, done) {
  fly = { fromP: camera.position.clone(), fromQ: camera.quaternion.clone(), toP: toP.clone(), toQ: toQ.clone(), t: 0, dur, done };
}
function flyTo(pos, target, dur = 1.4, done) {
  const toP = new THREE.Vector3(...pos);
  const m = new THREE.Matrix4().lookAt(toP, new THREE.Vector3(...target), new THREE.Vector3(0, 1, 0));
  flyToPose(toP, new THREE.Quaternion().setFromRotationMatrix(m), dur, () => done?.(new THREE.Vector3(...target)));
}
function updateFly(dt) {
  if (!fly) return;
  fly.t += dt;
  const k = Math.min(1, fly.t / fly.dur);
  const e = ease(k);
  // arco suave: la cámara se eleva un poco a mitad de camino en vuelos largos
  camera.position.lerpVectors(fly.fromP, fly.toP, e);
  const lift = Math.sin(Math.PI * e) * Math.min(1.2, fly.fromP.distanceTo(fly.toP) * 0.08);
  camera.position.y += lift;
  camera.quaternion.slerpQuaternions(fly.fromQ, fly.toQ, e);
  if (k >= 1) { const d = fly.done; fly = null; d?.(); }
}

// ───────── escena: interior / maqueta / rayos X ─────────
// view: 'interior' (cielorraso, ciudad por la ventana), 'xray' (losa visible, cables), 'studio' (maqueta blanca, paredes cortadas)
let wantedView = 'interior', appliedView = null, xrayCables = false;
function setView(view) { wantedView = view; applyView(); }
// La vista efectiva depende de dónde está la cámara: por encima del cielorraso siempre se ve la maqueta
// (sin paneles de luz flotando, sin la foto de la ciudad y con las paredes cortadas).
function applyView() {
  const above = camera.position.y > 2.72;
  const view = above && wantedView !== 'studio' ? 'studio' : wantedView;
  if (view !== appliedView) {
    appliedView = view;
    const studio = view === 'studio';
    building.ceiling.visible = view === 'interior';
    building.panels.visible = view === 'interior';
    building.roof.visible = view === 'xray';
    building.city.visible = !studio;
    building.slab.visible = studio;
    building.setCut(studio);
    scene.background.copy(studio ? STUDIO : new THREE.Color(0xdfe7ee));
    scene.fog = studio ? new THREE.Fog(STUDIO, 26, 62) : null;
    if (world) {
      world.poleMat.opacity = view === 'xray' ? 0.25 : 1;
      world.poleMat.depthWrite = view !== 'xray';
    }
  }
  if (world) {
    const show = xray || wantedView === 'xray' || xrayCables;
    world.xray.visible = show;
  }
}
function setXray(on) {
  xray = on;
  if (mode === 'explore' || mode === 'inspect') setView(on ? 'xray' : 'interior');
  else applyView();
  syncHud();
  bus.emit('xray', { on });
}
function syncHud() {
  hud.setMode(mode === 'inspect' ? 'explore' : mode, { xray, plan: mode === 'orbit', present: mode === 'present' });
  document.body.classList.toggle('presenting', mode === 'present');
  hud.setLocked(input.locked, mode === 'explore');
}

// ───────── modos ─────────
function enterExplore() {
  const resume = () => {
    mode = 'explore';
    orbit.enabled = false;
    player.active = true;
    setView(xray ? 'xray' : 'interior');
    input.wantsLock = !isTouch;
    syncHud();
    clearPlanLabels();
  };
  player.active = false;
  orbit.enabled = false;
  if (mode === 'loading') { player.apply(); resume(); return; }
  const pose = player.eyePose();
  setView(xray ? 'xray' : 'interior');
  flyToPose(pose.pos, pose.quat, 1.2, () => { player.apply(); resume(); });
}
function enterOrbit() {
  if (presenter.active) presenter.exit(true);
  mode = 'orbit';
  player.active = false;
  input.wantsLock = false;
  document.exitPointerLock?.();
  setView('studio');
  info.close();
  syncHud();
  flyTo([1.5, 12.5, 17.5], [8, 0, 6], 1.5, (tg) => { orbit.target.copy(tg); orbit.enabled = true; });
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
    setView(doll ? 'studio' : s.xray ? 'xray' : 'interior');
    xrayCables = !!s.xray; applyView();
    syncHud();
    flyTo(s.cam.pos, s.cam.target, 1.6, () => {
      if (s.route) highlightRoute(s.route);
      if (doll) { orbit.target.set(...s.cam.target); orbit.enabled = true; }
    });
    if (s.labels) showPlanLabels(); else clearPlanLabels();
  },
  onExit: () => { xrayCables = false; enterExplore(); },
});

bus.on('ui:mode', ({ mode: m }) => {
  if (mode === 'loading') return;
  if (['present', 'lab', 'plan', 'full'].includes(m) && pause.isOpen) pause.close();
  if (m === 'xray') setXray(!xray);
  if (m === 'plan') mode === 'orbit' ? enterExplore() : enterOrbit();
  if (m === 'present') presenter.active ? presenter.exit() : presenter.start(0);
  if (m === 'lab') bus.emit('lab:open', {});
  if (m === 'help') showHelp();
  if (m === 'full') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {});
  if (m === 'resume' && mode === 'explore') input.lock();
});

// ───────── inspección: la cámara encuadra el objeto ─────────
let inspectReturn = null;
const tmpBox = new THREE.Box3();
function frameObject(id) {
  const it = world?.interact.get(id);
  let box;
  if (it) { box = new THREE.Box3(); for (const o of it.group || [it.object]) box.union(tmpBox.setFromObject(o)); }
  else if (interactor?.current?.hit) { const p = interactor.current.hit.point; box = new THREE.Box3().setFromCenterAndSize(p, new THREE.Vector3(0.15, 0.15, 0.15)); }
  if (!box || box.isEmpty()) return null;
  const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const radius = Math.max(0.12, size.length() / 2);
  // desde el lado donde está el jugador, un poco elevado
  const from = new THREE.Vector3(player.pos.x - c.x, 0, player.pos.z - c.z);
  // si el objeto está en una caja, preferimos su lado "abierto" (hacia donde mira el jugador al entrar)
  if (from.lengthSq() < 1e-4) from.set(0, 0, 1);
  from.normalize();
  const dist = THREE.MathUtils.clamp(radius * 1.9 + 0.2, 0.5, 2.6);
  const pos = c.clone().addScaledVector(from, dist);
  pos.y = THREE.MathUtils.clamp(c.y + radius * 0.6 + 0.1, 0.5, 2.4);
  // no atravesar paredes: si hay una pared entre el objeto y la cámara, acercarse
  const ray = new THREE.Raycaster(c, pos.clone().sub(c).normalize(), 0, pos.distanceTo(c));
  const blockers = building.root.children.filter((o) => ['walls', 'glass', 'frames'].includes(o.name));
  const hit = ray.intersectObjects(blockers, false)[0];
  if (hit) pos.copy(c).addScaledVector(ray.ray.direction, Math.max(0.35, hit.distance - 0.2));
  // en escritorio desplazamos el encuadre para que el objeto no quede tapado por la ficha lateral
  const target = c.clone();
  if (!isTouch && innerWidth > 820) {
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), pos.clone().sub(c)).normalize();
    target.addScaledVector(right, -dist * 0.22);
  } else target.y -= dist * 0.25;
  return { pos, target };
}
function useTarget(id) {
  if (!id || mode === 'cinematic') return;
  document.exitPointerLock?.();
  if (id === 'PRESENTACION') { presenter.start(0); return; }
  bus.emit('ui:confirm');
  if (mode === 'explore') {
    const f = frameObject(id);
    if (f) {
      inspectReturn = player.eyePose();
      mode = 'inspect';
      player.active = false;
      flyTo(f.pos.toArray(), f.target.toArray(), 0.9);
      if (outlinePass) outlinePass.selectedObjects = [];
      interactor.box.visible = false;
    }
  }
  info.open(id);
}
bus.on('info:close', () => {
  if (mode !== 'inspect') return;
  const r = inspectReturn;
  flyToPose(r.pos, r.quat, 0.8, () => { player.apply(); mode = 'explore'; player.active = true; input.wantsLock = !isTouch; syncHud(); });
});
bus.on('ui:use', () => useTarget(interactor?.current?.id));

// ───────── foco en los cables: todo lo demás se oscurece y los cables brillan ─────────
const dimMat = new THREE.ShaderMaterial({
  transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
  uniforms: { uA: { value: 0 } },
  vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: 'uniform float uA; void main(){ gl_FragColor = vec4(0.02, 0.035, 0.07, uA); }',
});
const dim = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), dimMat);
dim.frustumCulled = false; dim.renderOrder = 14; dim.visible = false;
scene.add(dim);
function updateDim(dt) {
  const want = routeFx ? 0.62 : (xray && (mode === 'explore' || mode === 'inspect')) || xrayCables ? 0.38 : 0;
  dimMat.uniforms.uA.value += (want - dimMat.uniforms.uA.value) * (1 - Math.exp(-dt * 6));
  dim.visible = dimMat.uniforms.uA.value > 0.004;
}

// ───────── salas cerradas: su contenido solo se dibuja si estás adentro o la puerta está abierta ─────────
const CLOSED_ROOMS = ['gerencia', 'escritorios', 'recepcion', 'reunion', 'tecnica'];
function cullRooms() {
  if (!world.cullables) return;
  const exploring = mode === 'explore' || mode === 'inspect';
  const here = roomAt(player.pos.x, player.pos.z)?.id;
  const open = new Set();
  for (const dr of building.doors) if (dr.t > 0.04) open.add(dr.id.replace('d-', '').replace('entrada', 'recepcion'));
  for (const c of world.cullables) c.obj.visible = !exploring || !CLOSED_ROOMS.includes(c.room) || c.room === here || open.has(c.room);
}

// ───────── resolución dinámica: si caen los FPS baja la resolución, si sobra margen la recupera ─────────
let perfAcc = 0, perfN = 0, dprScale = 1;
function applyDpr() {
  const r = Q.dpr * dprScale;
  renderer.setPixelRatio(r);
  composer?.setPixelRatio(r);
  composer?.setSize(innerWidth, innerHeight);
}
function adaptResolution(raw) {
  if (document.hidden || raw > 0.5) return;
  perfAcc += raw; perfN++;
  if (perfN < 60) return;
  const avg = perfAcc / perfN; perfAcc = perfN = 0;
  if (avg > 1 / 45 && dprScale > 0.55) { dprScale = Math.max(0.55, dprScale - 0.1); applyDpr(); }
  else if (avg < 1 / 58 && dprScale < 1) { dprScale = Math.min(1, dprScale + 0.05); applyDpr(); }
}

// ───────── recorrido del cable: cinemática (alejar → dibujar → volver) ─────────
let routeFx = null, cine = null;
function makeRouteTube(dev) {
  const pts = world.segments.get(`cable:${dev}`);
  const o = OUTLETS.find((q) => q.dev === dev);
  const col = o.trunk ? TRUNK_COLOR : VLANS[o.vlan].color;
  const mesh = tubeFrom(pts, 0.02, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95, depthTest: false, toneMapped: false }), 8);
  mesh.renderOrder = 16;
  // halo para que el cable "brille" sobre la escena oscurecida
  const halo = tubeFrom(pts, 0.07, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), 8);
  halo.renderOrder = 15;
  mesh.add(halo);
  mesh.userData.halo = halo;
  return { mesh, pts, col, o };
}
function clearRoute() { if (routeFx) { scene.remove(routeFx.mesh); routeFx.mesh.geometry.dispose(); routeFx = null; } }
function highlightRoute(dev) {
  clearRoute();
  const r = makeRouteTube(dev);
  scene.add(r.mesh);
  routeFx = { mesh: r.mesh, t: 0, grow: 2.2, total: r.mesh.geometry.index.count };
  r.mesh.geometry.setDrawRange(0, 0);
  bus.emit('packet', { id: 'route-' + dev, segments: [{ id: `cable:${dev}`, dir: 1 }], ok: true, color: r.col, duration: 2.4 });
}
function routeCinematic(dev) {
  if (!world || !world.segments.get(`cable:${dev}`)) return;
  const { pts, o } = makeRouteTube(dev);
  const box = new THREE.Box3().setFromPoints(pts);
  const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const span = Math.max(size.x, size.z, 3);
  // toma elevada desde el lado del jugador, con la maqueta cortada para ver todo el recorrido
  const side = new THREE.Vector3(camera.position.x - c.x, 0, camera.position.z - c.z);
  if (side.lengthSq() < 0.01) side.set(0, 0, 1);
  side.normalize();
  const dist = span * 0.95 + 3;
  const pos = c.clone().addScaledVector(side, dist * 0.55); pos.y = dist * 0.85;
  const back = { pos: camera.position.clone(), quat: camera.quaternion.clone(), mode, xray };
  cine = { back, dev };
  mode = 'cinematic';
  player.active = false;
  orbit.enabled = false;
  info.el.style.visibility = 'hidden';
  syncHud();
  setView('studio');
  flyTo(pos.toArray(), c.toArray(), 1.4, () => {
    if (!cine) return;
    highlightRoute(dev);
    hud.toast(`${dev} → boca ${o.label} → ${o.pp}-${String(o.n).padStart(2, '0')} → ${o.sw}/${o.port} · ${o.m} m`);
    cine.timer = setTimeout(endCinematic, 3600);
  });
}
function endCinematic() {
  if (!cine) return;
  clearTimeout(cine.timer);
  const { back } = cine;
  cine = null;
  setView(back.xray ? 'xray' : 'interior');
  flyToPose(back.pos, back.quat, 1.3, () => {
    mode = back.mode === 'cinematic' ? 'explore' : back.mode;
    info.el.style.visibility = '';
    if (mode === 'explore') { player.active = true; player.apply(); }
    syncHud();
  });
}
bus.on('route:show', ({ dev, keepCamera }) => {
  if (keepCamera || mode === 'present') highlightRoute(dev);
  else routeCinematic(dev);
});
addEventListener('keydown', (e) => { if (cine && (e.code === 'Escape' || e.code === 'Space')) { e.stopPropagation(); endCinematic(); } }, true);
canvas.addEventListener('pointerdown', () => { if (cine && cine.timer) endCinematic(); });

bus.on('goto:rack', ({ id }) => {
  info.close();
  if (presenter.active) presenter.exit(true);
  if (id === 'R1') player.setPose(14.0, 8.95, Math.PI, -0.12); else player.setPose(13.95, 2.0, -Math.PI / 2, -0.12);
  mode = 'goto'; enterExplore();
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
  if (world) for (const [pc, d] of world.deskBuilt) add(pc, d.pos[0], 1.3, d.pos[1], 'dev');
  ['R1', 'R2', 'AP1', 'AP2'].forEach((id) => add(id, DEVICES[id].pos[0], 1.6, DEVICES[id].pos[1], 'dev'));
}
function clearPlanLabels() { planLabels.forEach((l) => l.d.remove()); planLabels = []; }
const _v = new THREE.Vector3();
function updatePlanLabels() {
  for (const l of planLabels) {
    _v.copy(l.p).project(camera);
    l.d.style.display = _v.z < 1 ? '' : 'none';
    l.d.style.transform = `translate(${((_v.x + 1) / 2) * innerWidth}px, ${((1 - _v.y) / 2) * innerHeight}px) translate(-50%, -50%)`;
  }
}

// ───────── entrada ─────────
const NAMES = (id) => {
  if (id.startsWith('JACK:')) return `Boca ${id.slice(5)}`;
  if (/^(PP|SW)/.test(id) && /[-/]/.test(id)) return `Puerto ${id}`;
  return DEVICES[id]?.name || (id === 'DIAGRAMA' ? 'Diagrama de red' : id === 'PRESENTACION' ? 'Presentación del TP' : /^(TEL)/.test(id) ? `Teléfono ${id.slice(3)}` : /^PC/.test(id) ? `Puesto ${id}` : id);
};
input.on('key', (e) => {
  if (mode === 'loading' || mode === 'cinematic') return;
  if (pause.isOpen || document.querySelector('.modal-bg')) return;
  switch (e.code) {
    case 'KeyE': if (mode === 'explore') useTarget(interactor?.current?.id); else if (mode === 'inspect') info.close(); break;
    case 'KeyX': setXray(!xray); break;
    case 'KeyM': bus.emit('ui:mode', { mode: 'plan' }); break;
    case 'KeyP': bus.emit('ui:mode', { mode: 'present' }); break;
    case 'KeyL': bus.emit('lab:open', {}); break;
    case 'KeyH': showHelp(); break;
  }
});
// Esc en primera persona libera el puntero → menú de pausa
input.on('lock', (locked) => {
  hud.setLocked(locked, mode === 'explore');
  if (!locked && mode === 'explore' && !info.isOpen && !labOpen && !pause.isOpen) pause.open();
});
input.on('lockfail', () => { if (hud.lockhint) hud.lockhint.textContent = 'Arrastrá con el mouse para mirar'; });
const ndc = new THREE.Vector2();
const pickAt = (x, y, far) => { ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); return interactor?.pick(ndc, far); };
input.on('tap', ({ x, y }) => {
  if (!interactor || mode === 'cinematic') return;
  const r = pickAt(x, y, mode === 'explore' ? 4.5 : 80);
  if (r) { interactor.current = r; mode === 'explore' ? useTarget(r.id) : info.open(r.id); }
  else if (mode !== 'inspect') info.close();
});
canvas.addEventListener('click', (e) => {
  if (isTouch || !interactor || mode === 'cinematic') return;
  if (mode === 'explore') { if (input.locked && interactor.current) useTarget(interactor.current.id); return; }
  if (mode === 'inspect') return;
  const r = pickAt(e.clientX, e.clientY, 80);
  if (r) info.open(r.id);
});

// ───────── laboratorio (carga diferida) ─────────
let labOpen = false;
bus.on('lab:open', () => { if (pause.isOpen) pause.close(); labOpen = true; input.enabled = false; document.exitPointerLock?.(); });
bus.on('lab:close', () => { labOpen = false; input.enabled = true; });
import('./lab/lab.js').then((m) => { m.initLab?.(); m.mountMissionTracker?.(); window.__app.sim = m.sim; }).catch((e) => console.warn('Laboratorio no disponible', e));

// ───────── reflejos reales: cubemap capturado dentro de la oficina ─────────
function captureInteriorEnv() {
  const crt = new THREE.WebGLCubeRenderTarget(128, { type: THREE.HalfFloatType });
  const cube = new THREE.CubeCamera(0.05, 40, crt);
  cube.position.set(7.5, 1.5, 7);
  const prevEnv = scene.environment;
  setView('interior');
  cube.update(renderer, scene);
  const env = pmrem.fromCubemap(crt.texture).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.45;
  prevEnv?.dispose?.();
  crt.dispose();
}

// ───────── carga ─────────
(async () => {
  try {
    world = await furnish(scene, colliders, { manager, quality });
  } catch (e) {
    console.error(e);
    loader.progress(1, 'Error al construir la escena: ' + e.message);
    return;
  }
  // los materiales de canaletas se cortan también en la maqueta
  building.addCutMaterial(world.poleMat);
  for (const id of ['R1', 'R2']) audio.addHum(new THREE.Vector3(DEVICES[id].pos[0], 1.2, DEVICES[id].pos[1]), { level: id === 'R1' ? 1 : 0.7 });
  interactor = new Interactor(camera, world, scene);
  packets = new Packets(scene, world);
  try { const n = await applyGenAssets({ building, world, scene }); if (n) console.info(`Assets generados aplicados: ${n}`); } catch (e) { console.warn('genassets', e); }
  setView('interior');
  captureInteriorEnv();
  // geometría estática unida por material y sala (draw calls: miles → cientos)
  {
    const doorPivots = new Set(building.doors.map((d) => d.pivot));
    const extras = building.root.children.filter((o) => o.isGroup && !doorPivots.has(o) && o !== building.city);
    const b = batchStatic([world.root, ...extras], { exclude: [world.xray], scene, protectedMaterials: new Set(world.leds.map((l) => l.mat)) });
    world.cullables = b.cullables;
    window.__app.batched = b.saved;
  }
  renderer.compile(scene, camera);
  const problems = world.audit(wallColliders);
  if (problems.length) console.warn('Superposiciones detectadas:', problems);
  window.__app.audit = problems;
  loader.ready((go) => {
    enterExplore();
    if (go !== 'present') input.lock(); // el clic en "Entrar" es el gesto que permite capturar el mouse
    if (go === 'present') presenter.start(0);
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
  if (mode === 'explore' && !labOpen && !pause.isOpen) player.update(dt, input);
  else input.consumeLook();
  updateFly(Math.min(raw, 0.25));
  applyView();
  updateDim(dt);
  if (world) cullRooms(); // cada cuadro: después de un salto de cámara la sala nunca queda vacía
  if (orbit.enabled) orbit.update();
  // puertas: se abren al acercarse; en vistas generales quedan abiertas
  const evs = building.updateDoors(dt, mode === 'explore' || mode === 'inspect' ? player.pos : camera.position, mode === 'orbit' || mode === 'present' || mode === 'cinematic');
  for (const ev of evs) bus.emit('door', ev);
  if (mode === 'explore' && interactor && !info.isOpen && frame % 2 === 0) {
    const r = interactor.update(ndc.set(0, 0), 3.4);
    const it = r && world.interact.get(r.id);
    if (outlinePass) outlinePass.selectedObjects = r && !r.instance ? (it ? it.group || [it.object] : [r.hit.object]) : [];
    interactor.box.visible = false; // sin cajas de selección: alcanza con el aviso junto a la mira
    hud.setPrompt(r ? `${isTouch ? '' : 'Inspeccionar '}<b>${NAMES(r.id)}</b>` : null);
  } else if (mode !== 'explore' && outlinePass && frame % 10 === 0) outlinePass.selectedObjects = [];
  if (mode === 'explore') {
    const r = roomAt(player.pos.x, player.pos.z);
    if (r && r.id !== lastRoom) { lastRoom = r.id; hud.setRoom(r.name, r.id); bus.emit('room', { id: r.id, name: r.name }); }
  }
  if (frame % 2 === 0) {
    const dir = camera.getWorldDirection(_v);
    const yaw = mode === 'explore' ? player.yaw : Math.atan2(-dir.x, -dir.z);
    const p = mode === 'explore' ? player.pos : camera.position;
    hud.drawMini(p.x, p.z, yaw);
  }
  if (routeFx) {
    routeFx.t += dt;
    const k = Math.min(1, routeFx.t / routeFx.grow);
    const dr = Math.floor(ease(k) * routeFx.total / 3) * 3;
    routeFx.mesh.geometry.setDrawRange(0, dr);
    routeFx.mesh.userData.halo?.geometry.setDrawRange(0, Math.floor(ease(k) * routeFx.mesh.userData.halo.geometry.index.count / 3) * 3);
    routeFx.mesh.material.opacity = k < 1 ? 0.95 : 0.6 + 0.3 * Math.cos((routeFx.t - routeFx.grow) * 4);
    if (routeFx.t > 9 && mode !== 'cinematic') clearRoute();
  }
  packets?.update(dt);
  if (world && frame % 6 === 0) blinkLeds();
  if (planLabels.length) updatePlanLabels();
  if (frame % 10 === 0) hud.setLocked(input.locked || info.isOpen || labOpen, mode === 'explore');
  adaptResolution(raw);
  bus.emit('frame', { camera, dt });
  if (composer) composer.render(dt); else renderer.render(scene, camera);
});

function blinkLeds() {
  for (const l of world.leds) if (l.role === 'link' && l.mat.emissiveIntensity !== undefined && Math.random() < 0.15) l.mat.emissiveIntensity = Math.random() < 0.5 ? 2.4 : 0.6;
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer?.setSize(innerWidth, innerHeight);
  aoPass?.setSize?.(innerWidth, innerHeight);
});
// debug/automatización
window.__app = { wallColliders, camera, player, flyTo, presenter, setXray, enterOrbit, enterExplore, bus, get world() { return world; }, get mode() { return mode; }, renderer, scene, info, building, useTarget, setView, get composer() { return composer; } };

// PWA: offline después de la primera visita a la demo (la landing no registra nada)
if (__PWA__ && import.meta.env.PROD && 'serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js', { scope: import.meta.env.BASE_URL }).catch(() => {}));
