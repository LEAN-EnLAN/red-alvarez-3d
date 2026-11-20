// Aplica las imágenes generadas con IA (asset-pack → public/assets/gen/) sobre el mundo ya construido.
// Si un slot no está, no se toca nada: queda la versión procedural/CC0.
import * as THREE from 'three';
import * as G from './genassets.js';
import { OUTLETS } from '../data/tp.js';

// cambia la imagen de una textura existente (conserva repeat/UV/colorSpace)
async function swapImage(tex, id, { dropMaps = null } = {}) {
  if (!tex || !G.has(id)) return false;
  const im = await G.image(id);
  if (!im) return false;
  tex.dispose(); // la textura ya estaba en la GPU con otro tamaño: se libera y se vuelve a subir
  tex.image = im;
  tex.needsUpdate = true;
  if (dropMaps) for (const [m, k] of dropMaps) { m[k] = null; m.needsUpdate = true; }
  return true;
}

export async function applyGenAssets({ building, world, scene }) {
  await G.loadGenManifest();
  if (!G.list().length) return 0;
  // precarga en paralelo de todo lo que usa el mundo 3D (la UI carga lo suyo aparte)
  await Promise.all(G.list().filter((id) => !/^(mission_|badge_|npc_|ui_onboard|ui_mission|ui_empty|ui_offline|ui_loader|ui_paper|pwa_|og_)/.test(id)).map((id) => G.image(id)));
  let n = 0;
  const M = building.materials;
  // Texturas de superficies (la textura propia reemplaza color; se quitan normal/rough de Poly Haven para que no choquen)
  if (await swapImage(M.tile.map, 'floor_porcelain_60x60', { dropMaps: [[M.tile, 'normalMap'], [M.tile, 'roughnessMap']] })) n++;
  if (await swapImage(M.wood.map, 'floor_oak_laminate', { dropMaps: [[M.wood, 'normalMap'], [M.wood, 'roughnessMap']] })) n++;
  if (G.has('wall_paint_plaster')) {
    const t = G.texture('wall_paint_plaster', { repeat: 1 });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    M.wall.map = t; M.wall.color.set(0xffffff); M.wall.needsUpdate = true; n++;
  }
  if (G.has('ceiling_tile_60x60')) {
    const t = G.texture('ceiling_tile_60x60', { repeat: [16 / 1.2, 12 / 1.2] });
    M.ceiling.map = t; M.ceiling.needsUpdate = true; n++;
  }
  if (await swapImage(world.woodTop?.map, 'desk_laminate_oak')) n++;
  // Vista por las ventanas
  const view = G.has('window_view_escritorios') ? 'window_view_escritorios' : G.has('window_view_gerencia') ? 'window_view_gerencia' : null;
  if (view) { const t = G.texture(view, { wrap: false }); building.city.material.map = t; building.city.material.needsUpdate = true; n++; }
  // Logo de recepción
  if (G.has('logo_wordmark_dark')) { const t = G.texture('logo_wordmark_dark', { wrap: false }); building.logo.material.map = t; building.logo.material.needsUpdate = true; n++; }
  // Pantallas de las PCs: imagen + barra con hostname e IP (dato del TP, no de la IA)
  for (const [pc, d] of world.deskBuilt) {
    const id = `screen_${pc.toLowerCase()}`;
    if (!G.has(id) || !d.mon?.screen) continue;
    const im = await G.image(id);
    if (!im) continue;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 576;
    const g = c.getContext('2d');
    g.drawImage(im, 0, 0, 1024, 576);
    g.fillStyle = 'rgba(12,16,22,0.82)'; g.fillRect(0, 0, 1024, 34);
    g.fillStyle = '#fff'; g.font = '600 20px Inter Variable, Inter, sans-serif'; g.textBaseline = 'middle';
    const ip = OUTLETS.find((o) => o.dev === pc)?.ip || '';
    g.fillText(`${pc} · ${ip}`, 14, 17);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const m = d.mon.screen.material;
    m.map = t; if ('emissiveMap' in m) m.emissiveMap = t; m.needsUpdate = true; n++;
  }
  // Pizarra con el boceto de la red (pared oeste de la sala de reunión)
  const wb = G.has('whiteboard_network_sketch') ? 'whiteboard_network_sketch' : null;
  if (wb) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.0, 1.6), [new THREE.MeshStandardMaterial({ color: 0xdadde0 }), null, null, null, null, null].map((m, i) => m || new THREE.MeshStandardMaterial(i === 0 ? {} : { color: 0xdadde0, metalness: 0.5, roughness: 0.4 })));
    // pared este de la sala de reunión, sobre la credenza (cara hacia -x)
    board.material[1] = new THREE.MeshStandardMaterial({ map: G.texture(wb, { wrap: false }), roughness: 0.25 });
    board.position.set(12 - 0.06 - 0.012, 1.55, 8.95);
    building.root.add(board); building.addCutMaterial(board.material[1]); n++;
  }
  n += await applyMore({ building, world });
  return n;
}

// ───────── más materiales, cuadros, carteles y calcos ─────────
const ROOM_SIGN = { recepcion: 'recepcion', gerencia: 'gerencia', box1: 'box_1', box2: 'box_2', box3: 'box_3', box4: 'box_4', reunion: 'sala_de_reunion', tecnica: 'sala_tecnica', escritorios: 'area_de_escritorios' };
// facing: hacia dónde mira la imagen (normal de la pared hacia la sala)
const FACE = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 };
const T2 = 0.06; // media pared
const ART = [
  // id, x, y, z, normal, alto
  ['art_puente_rosario_victoria', 4.75, 1.72, 12 - T2, '-z', 0.62],
  ['poster_floor_plan', 6 - T2, 1.55, 9.2, '-x', 0.6],
  ['art_rio_parana', 4.85, 1.6, 6 + T2, '+z', 0.6],
  ['art_parque_independencia', 8.9, 1.6, 6 + T2, '+z', 0.6],
  ['art_abstract_blue_1', 4.6, 1.6, 8 - T2, '-z', 0.6],
  ['art_monumento_bandera', 11.0, 1.6, 8 - T2, '-z', 0.6],
  ['art_diploma', T2, 1.62, 2.76, '+x', 0.5],
  ['art_team_photo', 4 - T2, 1.62, 1.6, '-x', 0.52],
  ['art_abstract_warm', 6 + T2, 1.6, 10.1, '+x', 0.7],
  ['art_numbers_print', 10 + T2, 1.6, 4.55, '+x', 0.55],
  ['art_abstract_blue_2', 16 - T2, 1.6, 4.2, '-x', 0.6],
  ['corkboard_tech_notes', 12 + T2, 1.45, 9.4, '+x', 0.7, 'cork'],
];
const SIGNS = [
  ['sign_salida', 2.45, 2.28, 12 - T2, '-z', 0.16],
  ['sign_riesgo_electrico', 14.95, 1.6, 8 - T2, '-z', 0.3],
  ['sign_acceso_restringido', 15.45, 1.6, 8 - T2, '-z', 0.3],
  ['sign_wifi_visitas', 6 - T2, 1.45, 10.6, '-x', 0.26],
  ['sign_prohibido_fumar', T2, 1.6, 7.0, '+x', 0.26],
  ['decal_wall_calendar', 4 + T2, 1.5, 4.5, '+x', 0.42],
];
const DESK_DECALS = ['decal_paper_stack', 'decal_invoice_factura_b', 'decal_balance_report', 'decal_spreadsheet_printout', 'decal_desk_calendar', 'decal_sticky_notes'];

async function plane(id, h, { frame = null, depth = 0.003 } = {}) {
  const im = await G.image(id);
  if (!im) return null;
  const w = (h * im.naturalWidth) / im.naturalHeight;
  const tex = G.texture(id, { wrap: false });
  const g = new THREE.Group();
  const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, transparent: G.info(id)?.transparent ?? false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const img = new THREE.Mesh(new THREE.PlaneGeometry(w, h), front);
  if (frame) {
    const fm = new THREE.MeshStandardMaterial({ color: frame === 'cork' ? 0x8a6a45 : 0x1f2328, roughness: 0.5, metalness: frame === 'cork' ? 0 : 0.2 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, h + 0.05, 0.025), fm);
    box.position.z = 0.0125; box.castShadow = true;
    g.add(box);
    img.position.z = 0.026;
  } else img.position.z = depth;
  g.add(img);
  return g;
}

async function applyMore({ building, world }) {
  let n = 0;
  const M = building.materials;
  const tex = (id, rep) => { const t = G.texture(id, { repeat: rep }); if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } return t; };
  const setMap = (mat, id, rep = 1, white = true) => { if (!mat || !G.has(id)) return false; mat.map = tex(id, rep); if (white) mat.color.set(0xffffff); mat.needsUpdate = true; n++; return true; };
  setMap(M.carpet, 'floor_carpet_gerencia');
  setMap(M.vinyl, 'floor_vinyl_tech_room');
  setMap(M.doorWood, 'door_wood_veneer');
  if (setMap(building.roof.material, 'concrete_slab', 4)) building.roof.material.map.repeat.set(6, 4.5);
  if (G.has('ui_studio_floor')) { const t = tex('ui_studio_floor', 1); t.repeat.set(30, 30); building.slab.material.map = t; building.slab.material.color.set(0xffffff); building.slab.material.needsUpdate = true; n++; }
  if (world.poleMat && G.has('pvc_duct_white')) { world.poleMat.map = tex('pvc_duct_white', 1); world.poleMat.needsUpdate = true; n++; }
  // sofá
  const sofa = world.root.getObjectByName('sofa');
  if (sofa && G.has('fabric_sofa_grey')) {
    const t = tex('fabric_sofa_grey', 1); t.repeat.set(2, 2);
    sofa.traverse((o) => { if (o.isMesh && o.material.roughness > 0.9) { o.material = o.material.clone(); o.material.map = t; o.material.color.set(0xf2f2f2); } });
    n++;
  }
  // matafuegos: cartel generado
  if (G.has('sign_matafuego')) world.root.traverse((o) => { if (o.name === 'extSign') { o.material = new THREE.MeshStandardMaterial({ map: G.texture('sign_matafuego', { wrap: false }), roughness: 0.5 }); n++; } });
  // listones de madera detrás del logo de recepción
  if (G.has('wall_accent_wood_slats')) {
    const t = tex('wall_accent_wood_slats', 1); t.repeat.set(2.6, 1);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.62, 0.03), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }));
    panel.position.set(4.35, 1.31 + 0.04, 8 + T2 + 0.015);
    panel.receiveShadow = true;
    building.root.add(panel); building.addCutMaterial(panel.material);
    building.logo.position.z = 8 + T2 + 0.032;
    n++;
  }
  // carteles de las salas
  for (const sg of building.signs) {
    const id = `sign_room_${ROOM_SIGN[sg.userData.room]}`;
    if (!G.has(id)) continue;
    const im = await G.image(id); if (!im) continue;
    const h = 0.13, w = (h * im.naturalWidth) / im.naturalHeight;
    sg.geometry.dispose(); sg.geometry = new THREE.PlaneGeometry(w, h);
    sg.material.map = G.texture(id, { wrap: false }); sg.material.transparent = !!G.info(id)?.transparent; sg.material.needsUpdate = true;
    n++;
  }
  // cuadros y carteles en pared
  const hideIfArt = { art_diploma: 'hanging_picture_frame_02', art_abstract_warm: 'hanging_picture_frame_01' };
  for (const [id, x, y, z, face, h, kind] of ART) {
    if (!G.has(id)) continue;
    const g = await plane(id, h, { frame: kind || 'dark' });
    if (!g) continue;
    g.position.set(x, y, z); g.rotation.y = FACE[face];
    building.root.add(g); g.traverse((o) => o.material && building.addCutMaterial(o.material));
    if (hideIfArt[id]) { const old = world.root.getObjectByName(hideIfArt[id]); if (old) old.visible = false; }
    n++;
  }
  for (const [id, x, y, z, face, h] of SIGNS) {
    if (!G.has(id)) continue;
    const g = await plane(id, h, { depth: 0.004 });
    if (!g) continue;
    g.position.set(x, y, z); g.rotation.y = FACE[face];
    building.root.add(g); g.traverse((o) => o.material && building.addCutMaterial(o.material));
    n++;
  }
  // calcos de papeles sobre los escritorios (a la izquierda del teclado)
  let k = 0;
  for (const [, d] of world.deskBuilt) {
    const id = DESK_DECALS[k++ % DESK_DECALS.length];
    if (!G.has(id)) continue;
    const im = await G.image(id); if (!im) continue;
    const w = 0.22, h = (w * im.naturalHeight) / im.naturalWidth;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, Math.min(h, 0.3)), new THREE.MeshStandardMaterial({ map: G.texture(id, { wrap: false }), roughness: 0.8, transparent: !!G.info(id)?.transparent, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = d.th + 0.12 * ((k % 3) - 1);
    const [cx, cz] = d.pos, th = d.th;
    const lx = -0.6, lz = 0.13;
    m.position.set(cx + lx * Math.cos(th) + lz * Math.sin(th), 0.7512, cz - lx * Math.sin(th) + lz * Math.cos(th));
    m.receiveShadow = true;
    world.root.add(m);
    n++;
  }
  return n;
}
