// Banco de pruebas visual de los equipos procedurales (sólo desarrollo).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as D from './devices.js';
import { OUTLETS } from '../data/tp.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd9dde2);
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 0.6));
const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(2, 4, 3); scene.add(dl);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0xb8b2a8, roughness: 0.8 }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.01, 100);
camera.position.set(0, 1.4, 3);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);

const info = [];
const items = {};
const add = (name, res, x, y, z, ry = 0) => {
  res.group.position.set(x, y, z); res.group.rotation.y = ry; scene.add(res.group);
  items[name] = res;
  info.push(`${name.padEnd(14)} tris=${D.countTriangles(res.group)} ports=${res.ports.size}`);
  return res;
};

const r1 = add('R1', D.buildRack('R1'), 0, 0, 0);
const r2 = add('R2', D.buildRack('R2'), 1.2, 0, 0);
// juego de escritorio
const desk = add('desk', D.buildDesk(1.4, 0.7), 3, 0, 0);
add('tower', D.buildPCTower('PC03'), 3.5, 0, 0.05);
add('monitor', D.buildMonitor('PC03', '10.10.20.103'), 2.9, 0.75, -0.12);
add('keyboard', D.buildKeyboard(), 2.9, 0.75, 0.15);
add('mouse', D.buildMouse(), 3.25, 0.75, 0.17);
add('phone', D.buildPhone(103), 2.4, 0.75, 0.0);
add('chair', D.buildOfficeChair(), 2.95, 0, 0.75, Math.PI);
// toma de pared sobre una pared ficticia
const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 0.1), new THREE.MeshStandardMaterial({ color: 0xeeeeea }));
wall.position.set(5, 0.5, -0.05); scene.add(wall);
add('plate2', D.buildJackPlate(['R1-PP1-03', 'R1-PP1-09']), 4.7, 0.3, 0);
add('plate1', D.buildJackPlate(['R2-PP2-01']), 5.0, 0.3, 0);
add('canaleta', D.buildCanaletaSegment(0.6), 5.2, 0.3, 0);
add('printer', D.buildPrinter('IMP01'), 6.2, 0, 0);
add('nas', D.buildNAS('NAS2'), 6.9, 0, 0);
add('ups', D.buildUPS('apc', 'UPS-R1'), 7.2, 0, 0);
add('ups2', D.buildUPS('atomlux', 'UPS-R2'), 7.45, 0, 0);
add('ap', D.buildAP('AP1'), 8.0, 1.0, 0);
add('table', D.buildMeetingTable(2.74, 1.23), 9.6, 0, 0);
add('er605', D.buildER605(), 7.8, 0, 0.6);
add('pbx', D.buildPBX(), 8.1, 0, 0.6);

// ── aserciones de conexiones ──
const errs = [];
for (const o of OUTLETS) {
  const rack = o.pp === 'PP1' ? r1 : r2;
  const ppKey = `${o.pp}-${String(o.n).padStart(2, '0')}`;
  if (!rack.ports.has(ppKey)) errs.push('falta puerto ' + ppKey);
  if (!rack.ports.has(ppKey + ':back')) errs.push('falta ' + ppKey + ':back');
  if (!rack.ports.has(`${o.sw}/${o.port}`)) errs.push('falta ' + o.sw + '/' + o.port);
  const c = rack.cords.get(ppKey);
  if (!c) errs.push('falta cable ' + ppKey);
  else if (c.userData.link.to !== `${o.sw}/${o.port}`) errs.push(`cable ${ppKey} va a ${c.userData.link.to}`);
}
for (let n = 17; n <= 24; n++) if (r1.cords.has(`PP1-${n}`)) errs.push('cable en reserva PP1-' + n);
for (let n = 8; n <= 24; n++) if (r2.cords.has(`PP2-${String(n).padStart(2, '0')}`)) errs.push('cable en reserva PP2-' + n);
for (const k of ['SW1/17', 'SW1/18', 'SW1/19', 'WAN1', 'WAN2', 'FIBER-R1']) if (!r1.cords.has(k)) errs.push('falta cable ' + k);
if (!r2.cords.has('FIBER-R2')) errs.push('falta FIBER-R2');
const linkTargets = [...r1.cords.values(), ...r2.cords.values()].map((c) => c.userData.link.to);
for (const p of ['SW1/20', 'SW1/21', 'SW1/22', 'SW1/23', 'SW1/24', 'SW2/8', 'SW1/SFP26', 'SW1/SFP27', 'SW1/SFP28', 'SW2/SFP10'])
  if (linkTargets.includes(p)) errs.push('cable en puerto libre ' + p);
for (const k of ['ER605/WAN1', 'ER605/WAN2', 'ER605/LAN4', 'R1:entry', 'R1:fiber', 'R2:entry', 'R2:fiber', 'SW1/SFP25', 'SW2/SFP9']) {
  if (!(r1.ports.has(k) || r2.ports.has(k))) errs.push('falta anclaje ' + k);
}
info.push('', 'CONEXIONES: ' + (errs.length ? 'ERRORES\n' + errs.join('\n') : 'OK (23 bocas, sin cables en reservas)'));
info.push('R1 cords: ' + [...r1.cords.keys()].join(','));
info.push('R2 cords: ' + [...r2.cords.keys()].join(','));
info.push('R1 ports: ' + r1.ports.size + ' R2 ports: ' + r2.ports.size);
let total = 0; scene.traverse((o) => { if (o.isMesh) total++; });
info.push('meshes: ' + total);
document.getElementById('info').textContent = info.join('\n');
window.__report = { info, errs };

// presets de cámara
const presets = {
  r1: [[0, 1.12, 0.95], [0, 1.1, 0.2]],
  r1close: [[0.02, 1.28, 0.62], [0.0, 1.27, 0.2]],
  r1low: [[0, 1.0, 0.75], [0, 0.98, 0.2]],
  r1side: [[0.9, 1.3, 1.0], [0, 1.1, 0.1]],
  r2: [[1.2, 1.06, 0.8], [1.2, 1.03, 0.15]],
  desk: [[2.9, 1.25, 1.35], [2.95, 0.8, 0]],
  deskback: [[3.6, 1.1, -1.1], [3.2, 0.6, 0]],
  plates: [[4.85, 0.36, 0.5], [4.85, 0.3, 0]],
  phone: [[2.4, 1.05, 0.3], [2.4, 0.79, 0]],
  er: [[-0.06, 1.17, 0.47], [-0.05, 1.125, 0.2]],
  tower: [[3.5, 0.6, -0.9], [3.5, 0.3, 0]],
  misc: [[7.2, 0.8, 2.0], [7.3, 0.25, 0.2]],
  ap: [[8.0, 0.75, 0.5], [8.0, 0.97, 0]],
  table: [[9.6, 1.8, 2.5], [9.6, 0.7, 0]],
  all: [[4.5, 3, 7], [4.5, 0.6, 0]],
};
window.__cam = (k) => { const [p, t] = presets[k]; camera.position.set(...p); controls.target.set(...t); controls.update(); };
const hashCam = location.hash.slice(1); if (presets[hashCam]) window.__cam(hashCam);
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
