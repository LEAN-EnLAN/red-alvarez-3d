// Batching estático: une toda la geometría que no se mueve en una malla por (material, sala).
// Pasa de ~1400–4500 draw calls a unos pocos cientos. Los objetos originales quedan ocultos pero
// siguen sirviendo para el raycast (inspección) y los cuadros envolventes (cámara de inspección).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { roomAt } from '../data/tp.js';

const visibleChain = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };

// atributos a Float32 no intercalados (las GLB con meshopt traen UV/normales cuantizadas)
function plainGeometry(src) {
  const g = new THREE.BufferGeometry();
  for (const [name, attr] of Object.entries(src.attributes)) {
    const n = attr.count, s = attr.itemSize, arr = new Float32Array(n * s);
    for (let i = 0; i < n; i++) for (let k = 0; k < s; k++) arr[i * s + k] = attr.getComponent(i, k);
    g.setAttribute(name, new THREE.BufferAttribute(arr, s));
  }
  if (src.index) g.setIndex(Array.from(src.index.array));
  else g.setIndex([...Array(src.attributes.position.count).keys()]);
  return g;
}

// materiales equivalentes → una sola instancia (más mallas pueden unirse)
const SIG_KEYS = ['type', 'transparent', 'opacity', 'side', 'depthTest', 'depthWrite', 'alphaTest', 'vertexColors', 'toneMapped', 'roughness', 'metalness', 'emissiveIntensity', 'envMapIntensity', 'polygonOffset', 'colorWrite', 'flatShading', 'wireframe'];
const TEX_KEYS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'alphaMap', 'aoMap'];
function materialSig(m) {
  const parts = SIG_KEYS.map((k) => m[k]);
  for (const k of ['color', 'emissive']) parts.push(m[k]?.getHexString?.());
  for (const k of TEX_KEYS) parts.push(m[k]?.uuid);
  parts.push(m.clippingPlanes ? 'clip' : '', m.onBeforeCompile && m.onBeforeCompile.toString() !== THREE.Material.prototype.onBeforeCompile.toString() ? m.uuid : '');
  return parts.join('|');
}

export function batchStatic(roots, { exclude = [], scene, protectedMaterials = new Set() }) {
  const canon = new Map();
  const canonical = (m) => {
    if (protectedMaterials.has(m) || m.isShaderMaterial) return m;
    const sig = materialSig(m);
    if (!canon.has(sig)) canon.set(sig, m);
    return canon.get(sig);
  };
  const skip = new Set(exclude);
  const isSkipped = (o) => { for (let p = o; p; p = p.parent) if (skip.has(p) || p.userData.noBatch) return true; return false; };
  const groups = new Map();
  const leftovers = [];
  const box = new THREE.Box3(), c = new THREE.Vector3();
  const roomOfMesh = (m) => {
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    box.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld).getCenter(c);
    return roomAt(c.x, c.z)?.id || 'out';
  };
  for (const root of roots) {
    root.updateMatrixWorld(true);
    root.traverse((m) => {
      if (!m.isMesh || !visibleChain(m) || isSkipped(m)) return;
      if (m.isInstancedMesh) {
        // las mallas instanciadas invisibles de "picking" no necesitan dibujarse: el raycast no mira visibilidad
        if (m.material && m.material.colorWrite === false) { m.visible = false; return; }
        leftovers.push({ obj: m, room: roomOfMesh(m) });
        return;
      }
      if (Array.isArray(m.material) || m.isSkinnedMesh || m.morphTargetInfluences) { leftovers.push({ obj: m, room: roomOfMesh(m) }); return; }
      const g = m.geometry;
      m.material = canonical(m.material);
      const attrs = Object.keys(g.attributes).sort().join(',');
      const room = roomOfMesh(m);
      const key = [m.material.uuid, room, attrs, m.castShadow, m.receiveShadow, m.renderOrder].join('|');
      let grp = groups.get(key);
      if (!grp) groups.set(key, (grp = { material: m.material, room, cast: m.castShadow, receive: m.receiveShadow, renderOrder: m.renderOrder, items: [] }));
      grp.items.push(m);
    });
  }
  const parent = new THREE.Group();
  parent.name = 'batched';
  const cullables = [];
  let saved = 0;
  for (const grp of groups.values()) {
    if (grp.items.length < 2) { for (const m of grp.items) leftovers.push({ obj: m, room: grp.room }); continue; }
    const geos = grp.items.map((m) => {
      const g = plainGeometry(m.geometry);
      g.applyMatrix4(m.matrixWorld);
      return g;
    });
    const merged = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!merged) { for (const m of grp.items) leftovers.push({ obj: m, room: grp.room }); continue; }
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, grp.material);
    mesh.castShadow = grp.cast; mesh.receiveShadow = grp.receive; mesh.renderOrder = grp.renderOrder;
    mesh.matrixAutoUpdate = false;
    mesh.userData.room = grp.room;
    parent.add(mesh);
    cullables.push({ obj: mesh, room: grp.room });
    for (const m of grp.items) m.visible = false;
    saved += grp.items.length - 1;
  }
  scene.add(parent);
  parent.updateMatrixWorld(true);
  for (const l of leftovers) cullables.push(l);
  return { group: parent, cullables, saved };
}
