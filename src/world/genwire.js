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
  tex.image = im;
  tex.needsUpdate = true;
  if (dropMaps) for (const [m, k] of dropMaps) { m[k] = null; m.needsUpdate = true; }
  return true;
}

export async function applyGenAssets({ building, world, scene }) {
  await G.loadGenManifest();
  if (!G.list().length) return 0;
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
  return n;
}
