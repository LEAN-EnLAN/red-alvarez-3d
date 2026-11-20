// Construye la arquitectura EXACTA del plano de la p.2 (salas, paredes, puertas, ventanas).
// - Sin caras coplanares (evita el parpadeo/z-fighting en marcos y dinteles).
// - Sombreado de esquinas horneado en vértices + franjas de AO en piso y cielorraso
//   (se ve bien incluso en celulares sin postproceso).
// - Puertas con hoja real que se abren al acercarse.
// - Corte de paredes a 1,3 m para la vista maqueta, con "tapa" oscura en el corte.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { META, ROOMS, WALLS, DOORS, WINDOWS } from '../data/tp.js';
import { pbrSet, textCanvas, ceilingTexture, cityTexture } from './textures.js';

const H = META.size.h; // altura de cielorraso
const T = 0.12; // espesor de pared
const DOOR_H = 2.1;
const JAMB = 0.045; // ancho de marco
export const CUT_Y = 1.3;

export function buildBuilding(scene, colliders) {
  const root = new THREE.Group();
  root.name = 'building';
  scene.add(root);
  const cutPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), CUT_Y);
  const cutMaterials = new Set();

  // ── materiales ──
  const tile = pbrSet('marble_01', { repeat: 1, gen: true });
  const wood = pbrSet('laminate_floor_02', { repeat: 1, gen: true });
  const plaster = pbrSet('plastered_wall_04', { repeat: 1, color: false });
  const M = {
    tile: new THREE.MeshStandardMaterial({ ...tile, roughness: 0.8, color: 0xf7f4ef }),
    wood: new THREE.MeshStandardMaterial({ ...wood, roughness: 0.9, color: 0xf0e6da }),
    wall: new THREE.MeshStandardMaterial({ color: 0xf6f6f4, roughness: 0.94, vertexColors: true, normalMap: plaster.normalMap, normalScale: new THREE.Vector2(0.18, 0.18), side: THREE.DoubleSide }),
    base: new THREE.MeshStandardMaterial({ color: 0xe6e3dc, roughness: 0.55 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x2f3338, metalness: 0.55, roughness: 0.38 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xe4eef2, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.4 }),
    frost: new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, roughness: 0.9, depthWrite: false, side: THREE.DoubleSide }),
    ceiling: new THREE.MeshStandardMaterial({ map: ceilingTexture(), roughness: 0.95 }),
    panel: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8ee, emissiveIntensity: 1.15, roughness: 0.4 }),
    doorWood: new THREE.MeshStandardMaterial({ color: 0xc9a77f, roughness: 0.55 }),
    handle: new THREE.MeshStandardMaterial({ color: 0xbfc3c8, metalness: 0.9, roughness: 0.25 }),
  };
  M.ceiling.map.repeat.set(16 / 0.6, 12 / 0.6);
  // Tapa oscura donde se corta la pared (vista maqueta): las caras internas se pintan de gris grafito
  M.wall.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n if (!gl_FrontFacing) gl_FragColor = vec4(0.17, 0.18, 0.2, 1.0);');
  };
  for (const k of ['wall', 'base', 'frame', 'glass', 'frost', 'doorWood', 'handle']) cutMaterials.add(M[k]);

  // ── pisos por sala (UV en metros) ──
  // gerencia con alfombra y sala técnica con vinílico (texturas generadas; sin ellas, colores neutros)
  M.carpet = new THREE.MeshStandardMaterial({ color: 0x5d6675, roughness: 1 });
  M.vinyl = new THREE.MeshStandardMaterial({ color: 0xc9ced4, roughness: 0.7 });
  const floorKind = (r) => (r.id === 'gerencia' ? 'carpet' : r.id === 'tecnica' ? 'vinyl' : r.floor);
  const floors = { tile: [], wood: [], carpet: [], vinyl: [] };
  for (const r of ROOMS) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    const g = new THREE.PlaneGeometry(w, d);
    g.rotateX(-Math.PI / 2);
    g.translate(r.x0 + w / 2, 0, r.z0 + d / 2);
    const uv = g.attributes.uv, pos = g.attributes.position;
    const kind = floorKind(r);
    const scale = kind === 'tile' || kind === 'vinyl' ? 1.2 : 2.0;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / scale, pos.getZ(i) / scale);
    floors[kind].push(g);
  }
  for (const k of ['tile', 'wood', 'carpet', 'vinyl']) {
    if (!floors[k].length) continue;
    const m = new THREE.Mesh(mergeGeometries(floors[k]), M[k]);
    m.receiveShadow = true;
    m.name = 'floor-' + k;
    root.add(m);
  }

  // ── paredes ──
  const solid = [], base = [], frames = [], glass = [], frost = [], aoFloor = [], aoCeil = [];
  const aoColor = (y) => {
    // oscurece cerca del piso y del cielorraso (oclusión ambiental aproximada)
    const k = 1 - 0.2 * Math.exp(-y / 0.22) - 0.1 * Math.exp(-(H - y) / 0.18);
    return k;
  };
  const box = (arr, x0, x1, y0, y1, z0, z1, ao = false) => {
    const hs = ao ? Math.max(1, Math.ceil((y1 - y0) / 0.15)) : 1;
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0, 1, hs, 1);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    if (ao) {
      const p = g.attributes.position, c = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) { const k = aoColor(p.getY(i)); c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = k; }
      g.setAttribute('color', new THREE.BufferAttribute(c, 3));
      // UV en metros para el normal map
      const uv = g.attributes.uv, n = g.attributes.normal;
      for (let i = 0; i < p.count; i++) {
        const along = Math.abs(n.getX(i)) > 0.5 ? p.getZ(i) : p.getX(i);
        uv.setXY(i, along / 1.5, p.getY(i) / 1.5);
      }
    }
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
  const piece = (arr, info, s0, s1, y0, y1, thick = T, ao = false) => {
    if (s1 - s0 < 1e-3 || y1 - y0 < 1e-3) return;
    if (info.horiz) box(arr, s0, s1, y0, y1, info.at - thick / 2, info.at + thick / 2, ao);
    else box(arr, info.at - thick / 2, info.at + thick / 2, y0, y1, s0, s1, ao);
  };
  const collide = (info, s0, s1, thick = T) => {
    if (s1 - s0 < 1e-3) return;
    if (info.horiz) colliders.push({ minX: s0, maxX: s1, minZ: info.at - thick / 2, maxZ: info.at + thick / 2 });
    else colliders.push({ minX: info.at - thick / 2, maxX: info.at + thick / 2, minZ: s0, maxZ: s1 });
  };
  // franja de sombra de contacto a ambos lados de un tramo de pared
  const aoStrip = (info, s0, s1, ceiling = false) => {
    const L = s1 - s0, Wd = ceiling ? 0.3 : 0.42;
    if (L < 0.05) return;
    for (const side of [-1, 1]) {
      const g = new THREE.PlaneGeometry(L, Wd);
      g.rotateX(ceiling ? Math.PI / 2 : -Math.PI / 2);
      // v=1 junto a la pared
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setY(i, side < 0 ? 1 - uv.getY(i) : uv.getY(i));
      if (ceiling) for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
      const off = side * (T / 2 + Wd / 2);
      const y = ceiling ? H - 0.003 : 0.003;
      if (info.horiz) g.translate((s0 + s1) / 2, y, info.at + off);
      else { g.rotateY(Math.PI / 2); g.translate(info.at + off, y, (s0 + s1) / 2); }
      (ceiling ? aoCeil : aoFloor).push(g);
    }
  };

  const doorSpecs = [];
  for (const w of WALLS) {
    const info = gapsFor(w);
    const cuts = [...info.doors.map((d) => ({ ...d, kind: 'door' })), ...info.wins.map((d) => ({ ...d, kind: 'win' }))].sort((a, b) => a.from - b.from);
    let s = info.lo;
    const segs = [];
    // los tramos sólidos terminan donde empieza el marco (sin solapes)
    for (const c of cuts) { const j = c.kind === 'door' ? JAMB : 0; segs.push([s, c.from - j]); s = c.to + j; }
    segs.push([s, info.hi]);

    if (w.glass) {
      for (const [a, b] of segs) {
        if (b - a < 1e-3) continue;
        piece(frames, info, a, b, 0, 0.06, 0.07);
        piece(frames, info, a, b, H - 0.05, H, 0.07);
        piece(glass, info, a, b, 0.06, H - 0.05, 0.012);
        piece(frost, info, a, b, 1.0, 1.45, 0.016);
        const n = Math.max(1, Math.round((b - a) / 1.2));
        for (let i = 0; i <= n; i++) {
          const p = a + ((b - a) * i) / n;
          piece(frames, info, Math.max(a, p - 0.025), Math.min(b, p + 0.025), 0.06, H - 0.05, 0.068);
        }
        collide(info, a, b, 0.08);
      }
    } else {
      for (const [a, b] of segs) {
        piece(solid, info, a, b, 0, H, T, true);
        piece(base, info, a, b, 0, 0.07, T + 0.016);
        collide(info, a, b);
        aoStrip(info, a, b);
        aoStrip(info, a, b, true);
      }
    }
    for (const c of cuts) {
      if (c.kind === 'door') {
        if (w.glass) {
          piece(frames, info, c.from - JAMB, c.to + JAMB, DOOR_H, DOOR_H + JAMB, 0.07);
          piece(glass, info, c.from - JAMB, c.to + JAMB, DOOR_H + JAMB, H - 0.05, 0.012);
          piece(frames, info, c.from - JAMB, c.to + JAMB, H - 0.05, H, 0.07);
        } else {
          piece(solid, info, c.from - JAMB, c.to + JAMB, DOOR_H + JAMB, H, T, true);
          aoStrip(info, c.from - JAMB, c.to + JAMB, true);
        }
        // marco: dos parantes + cabezal (más anchos que la pared, sin caras compartidas)
        piece(frames, info, c.from - JAMB, c.from, 0, DOOR_H + JAMB, T + 0.024);
        piece(frames, info, c.to, c.to + JAMB, 0, DOOR_H + JAMB, T + 0.024);
        piece(frames, info, c.from, c.to, DOOR_H, DOOR_H + JAMB, T + 0.024);
        if (!c.open) doorSpecs.push({ ...c, glassWall: !!w.glass, horiz: info.horiz });
      } else {
        piece(solid, info, c.from, c.to, 0, 0.9, T, true);
        piece(solid, info, c.from, c.to, 2.25, H, T, true);
        piece(base, info, c.from, c.to, 0, 0.07, T + 0.016);
        aoStrip(info, c.from, c.to);
        piece(frames, info, c.from, c.to, 0.9, 0.93, T + 0.05);
        piece(frames, info, c.from, c.to, 2.22, 2.25, T + 0.01);
        const n = Math.max(1, Math.round((c.to - c.from) / 1.1));
        for (let i = 0; i <= n; i++) {
          const p = c.from + ((c.to - c.from) * i) / n;
          piece(frames, info, Math.max(c.from, p - 0.025), Math.min(c.to, p + 0.025), 0.93, 2.22, T - 0.01);
        }
        piece(glass, info, c.from, c.to, 0.93, 2.22, 0.01);
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

  // franjas de AO
  const aoTex = (() => {
    const c = document.createElement('canvas'); c.width = 4; c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = gr; g.fillRect(0, 0, 4, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const aoMat = (op) => new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, opacity: op, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: false });
  const aoF = new THREE.Mesh(mergeGeometries(aoFloor), aoMat(0.55)); aoF.renderOrder = 1; aoF.name = 'ao-floor'; root.add(aoF);
  const aoC = new THREE.Mesh(mergeGeometries(aoCeil), aoMat(0.3)); aoC.renderOrder = 1; aoC.name = 'ao-ceiling'; root.add(aoC);

  // ── puertas con hoja ──
  const doors = [];
  const glassLeafMat = M.glass.clone(); glassLeafMat.opacity = 0.22; cutMaterials.add(glassLeafMat);
  for (const d of doorSpecs) {
    const room = ROOMS.find((r) => r.id === d.room);
    const cx = (room.x0 + room.x1) / 2, cz = (room.z0 + room.z1) / 2;
    const roomSide = d.horiz ? Math.sign(cz - d.at) : Math.sign(cx - d.at);
    // bisagra lejos de los escritorios de los boxes 2 y 4 (puertas sobre x = 7,5)
    const hingeAtTo = !d.horiz && d.at === 7.5;
    const w = d.to - d.from - 0.01;
    const pivot = new THREE.Group();
    const hingeS = hingeAtTo ? d.to - 0.005 : d.from + 0.005;
    if (d.horiz) pivot.position.set(hingeS, 0, d.at); else pivot.position.set(d.at, 0, hingeS);
    const leaf = new THREE.Group();
    const glassy = d.glassWall || d.main;
    const leafW = w, leafH = DOOR_H - 0.01, th = 0.04;
    if (glassy) {
      const fr = (x0, x1, y0, y1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, th), M.frame); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); leaf.add(m); };
      fr(0, 0.05, 0, leafH); fr(leafW - 0.05, leafW, 0, leafH); fr(0, leafW, 0, 0.08); fr(0, leafW, leafH - 0.05, leafH);
      const gl = new THREE.Mesh(new THREE.BoxGeometry(leafW - 0.1, leafH - 0.13, 0.01), glassLeafMat); gl.position.set(leafW / 2, 0.08 + (leafH - 0.13) / 2, 0); gl.renderOrder = 2; leaf.add(gl);
      const fb = new THREE.Mesh(new THREE.BoxGeometry(leafW - 0.1, 0.4, 0.014), M.frost); fb.position.set(leafW / 2, 1.2, 0); leaf.add(fb);
    } else {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(leafW, leafH, th), M.doorWood);
      slab.position.set(leafW / 2, leafH / 2, 0);
      slab.castShadow = true; slab.receiveShadow = true;
      leaf.add(slab);
    }
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.018, 0.018), M.handle);
      h.position.set(leafW - 0.11, 1.0, s * (th / 2 + 0.03));
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 8), M.handle);
      st.rotation.x = Math.PI / 2; st.position.set(leafW - 0.06, 1.0, s * (th / 2 + 0.015));
      leaf.add(h, st);
    }
    if (hingeAtTo) leaf.scale.x = -1; // la hoja se extiende hacia "from"
    pivot.add(leaf);
    // orientación base: la hoja a lo largo de la pared
    pivot.rotation.y = d.horiz ? 0 : -Math.PI / 2;
    const base = pivot.rotation.y;
    // ángulo de apertura hacia el lado de la sala
    let open = -roomSide * (Math.PI / 2) * 0.94;
    if (!d.horiz) open = roomSide * (Math.PI / 2) * 0.94 * (hingeAtTo ? -1 : 1) * -1;
    if (d.horiz && hingeAtTo) open = -open;
    root.add(pivot);
    const center = d.horiz ? new THREE.Vector3((d.from + d.to) / 2, 1, d.at) : new THREE.Vector3(d.at, 1, (d.from + d.to) / 2);
    doors.push({ id: d.id, pivot, base, open, t: 0, target: 0, center, glassy });
  }
  // Corrige el sentido de apertura verificando que la hoja abierta quede del lado de la sala
  for (const dr of doors) {
    const spec = doorSpecs.find((s) => s.id === dr.id);
    const room = ROOMS.find((r) => r.id === spec.room);
    const rc = new THREE.Vector3((room.x0 + room.x1) / 2, 1, (room.z0 + room.z1) / 2);
    const test = (ang) => {
      dr.pivot.rotation.y = dr.base + ang;
      dr.pivot.updateMatrixWorld(true);
      const tip = new THREE.Vector3(0.4, 1, 0).applyMatrix4(dr.pivot.children[0].matrixWorld);
      return tip.distanceTo(rc);
    };
    if (test(-dr.open) < test(dr.open)) dr.open = -dr.open;
    dr.pivot.rotation.y = dr.base;
  }
  const updateDoors = (dt, playerPos, forceOpen = false) => {
    const events = [];
    for (const dr of doors) {
      const near = playerPos && Math.hypot(playerPos.x - dr.center.x, playerPos.z - dr.center.z) < 2.1;
      const tgt = forceOpen || near ? 1 : 0;
      if (tgt !== dr.target) { dr.target = tgt; events.push({ id: dr.id, open: !!tgt, pos: dr.center, glassy: dr.glassy }); }
      const k = 1 - Math.exp(-dt * (dr.target ? 7 : 4));
      dr.t += (dr.target - dr.t) * k;
      const e = dr.t * dr.t * (3 - 2 * dr.t);
      dr.pivot.rotation.y = dr.base + dr.open * e;
    }
    return events;
  };

  // ── cielorraso + paneles LED 60×60 ──
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), M.ceiling);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(8, H, 6);
  ceil.name = 'ceiling';
  root.add(ceil);
  const panelSpots = [];
  for (const r of ROOMS) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    const nx = Math.max(1, Math.round(w / 2.4)), nz = Math.max(1, Math.round(d / 2.4));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = r.x0 + (w * (i + 0.5)) / nx, z = r.z0 + (d * (j + 0.5)) / nz;
      panelSpots.push([Math.round(x / 0.6) * 0.6, Math.round(z / 0.6) * 0.6]);
    }
  }
  const pg = new THREE.BoxGeometry(0.58, 0.016, 0.58);
  const panels = new THREE.InstancedMesh(pg, M.panel, panelSpots.length);
  const mtx = new THREE.Matrix4();
  panelSpots.forEach(([x, z], i) => panels.setMatrixAt(i, mtx.makeTranslation(x, H - 0.009, z)));
  panels.name = 'ceiling-panels';
  root.add(panels);

  // ── exterior ──
  // Exterior: foto de la ciudad sobre un domo de cielo con bruma. Los bordes de la foto se funden en la
  // bruma (perspectiva atmosférica), así nunca se ve dónde termina la imagen al mirar por la ventana.
  const HAZE = new THREE.Color(0xdfe7ee);
  const cityMat = new THREE.MeshBasicMaterial({ map: cityTexture(), toneMapped: false, fog: false });
  cityMat.onBeforeCompile = (sh) => {
    sh.uniforms.uHaze = { value: HAZE };
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', 'uniform vec3 uHaze;\nvoid main() {')
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec2 q = vMapUv;
        float edge = smoothstep(0.0, 0.12, q.x) * smoothstep(1.0, 0.88, q.x) * smoothstep(0.0, 0.18, q.y) * smoothstep(1.0, 0.9, q.y);
        diffuseColor.rgb = mix(uHaze, mix(diffuseColor.rgb, uHaze, 0.16), edge);`);
  };
  const city = new THREE.Group();
  const cityPhoto = new THREE.Mesh(new THREE.PlaneGeometry(46, 16), cityMat);
  cityPhoto.position.set(8, 2.4, -12);
  city.add(cityPhoto);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(70, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: new THREE.Color(0xa9c8e6) }, uHaze: { value: HAZE }, uLow: { value: new THREE.Color(0xc5ccd3) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 uTop; uniform vec3 uHaze; uniform vec3 uLow; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(uHaze, uTop, smoothstep(0.05, 0.6, h)) : mix(uHaze, uLow, smoothstep(0.0, 0.25, -h)); gl_FragColor = vec4(c, 1.0); }',
  }));
  sky.position.set(8, 0, 6);
  sky.renderOrder = -10;
  city.add(sky);
  city.material = cityMat; // compatibilidad: genwire reemplaza city.material.map
  root.add(city);
  // piso de estudio blanco (vista maqueta) — recibe sombras
  const slab = new THREE.Mesh(new THREE.CircleGeometry(120, 64), new THREE.MeshStandardMaterial({ color: 0xf1f2f4, roughness: 1 }));
  slab.rotation.x = -Math.PI / 2; slab.position.set(8, -0.012, 6);
  slab.receiveShadow = true;
  root.add(slab);
  // zócalo exterior del edificio (base de la maqueta)
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(16.24, 0.12, 12.24), new THREE.MeshStandardMaterial({ color: 0xd9dbde, roughness: 0.9 }));
  plinth.position.set(8, -0.07, 6);
  root.add(plinth);
  // losa sobre el plenum (rayos X)
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(16.3, 12.3), new THREE.MeshStandardMaterial({ color: 0x5b6270, roughness: 0.95, side: THREE.DoubleSide }));
  roof.rotation.x = -Math.PI / 2; roof.position.set(8, H + 0.35, 6);
  roof.name = 'roof';
  root.add(roof);

  // ── carteles de salas ──
  const signs = [];
  for (const d of DOORS) {
    const room = ROOMS.find((r) => r.id === d.room);
    if (!room || d.open || d.main) continue;
    const mat = new THREE.MeshStandardMaterial({ map: textCanvas(room.name, { w: 512, h: 112, bg: '#ffffff', fg: '#1d232b', size: 38, font: 600, radius: 10 }), roughness: 0.5 });
    cutMaterials.add(mat);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.11), mat);
    if (d.wall === 'z') {
      const side = d.at === 6 ? 1 : -1;
      g.position.set(d.to + JAMB + 0.32, 1.62, d.at + side * (T / 2 + 0.004));
      if (side < 0) g.rotation.y = Math.PI;
    } else {
      const side = d.at === 6.5 ? 1 : -1;
      const s = d.at === 7.5 ? d.from - JAMB - 0.32 : d.to + JAMB + 0.32;
      g.position.set(d.at + side * (0.07 / 2 + 0.004), 1.62, s);
      g.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
    g.userData.room = room.id;
    root.add(g);
    signs.push(g);
  }

  // Logo del cliente en recepción (pared norte, cara sur)
  const logoTex = (() => {
    const c = document.createElement('canvas');
    c.width = 2048; c.height = 600;
    const g = c.getContext('2d');
    g.fillStyle = '#1f3a64';
    [[80, 300, 92, 220], [200, 220, 92, 300], [320, 120, 92, 400]].forEach(([x, y, w, h]) => { g.beginPath(); g.roundRect(x, y, w, h, 12); g.fill(); });
    g.fillStyle = '#1f2937';
    g.fillRect(480, 100, 10, 420);
    // el texto se ajusta al ancho disponible (antes se cortaba en "Asoc")
    const fit = (txt, weight, size, maxW) => { let sz = size; do { g.font = `${weight} ${sz}px Inter Variable, Inter, sans-serif`; sz -= 4; } while (g.measureText(txt).width > maxW && sz > 20); };
    g.textBaseline = 'alphabetic';
    fit('Alvarez & Asoc.', 700, 208, 2048 - 560 - 60);
    g.fillText('Alvarez & Asoc.', 560, 340);
    fit('Estudio contable', 500, 84, 2048 - 560 - 60);
    g.fillStyle = '#4b5563';
    g.fillText('Estudio contable', 568, 480);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  })();
  const logoMat = new THREE.MeshStandardMaterial({ map: logoTex, transparent: true, roughness: 0.6 });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.7), logoMat);
  logo.position.set(4.35, 1.75, 8 + T / 2 + 0.008);
  root.add(logo);
  cutMaterials.add(logoMat);

  const setCut = (on) => {
    for (const m of cutMaterials) { m.clippingPlanes = on ? [cutPlane] : null; m.needsUpdate = true; }
  };
  const addCutMaterial = (m) => cutMaterials.add(m);

  return { root, logo, wallsMesh, city, slab, plinth, ceiling: ceil, roof, panels, glassMesh, materials: M, signs, doors, updateDoors, setCut, addCutMaterial, panelSpots };
}
