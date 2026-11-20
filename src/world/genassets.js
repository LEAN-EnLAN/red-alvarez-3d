// Assets generados con IA (asset-pack/). Si un archivo está en public/assets/gen/ y figura en
// public/assets/gen/manifest.json (lo escribe tools/register-gen.mjs), se usa; si no, la app sigue
// con su versión procedural. Ningún slot requiere código propio: se piden por id.
import * as THREE from 'three';

const BASE = (import.meta.env?.BASE_URL ?? '/') + 'assets/gen/';
let slots = {}; // id -> { path, tileable, transparent, w, h }
let ready = null;
const texCache = new Map();
const imgCache = new Map();
const loader = new THREE.TextureLoader();
let maxAniso = 8;

export function setGenAnisotropy(n) { maxAniso = n; }

export function loadGenManifest() {
  if (!ready) {
    ready = fetch(BASE + 'manifest.json')
      .then((r) => (r.ok ? r.json() : { slots: {} }))
      .then((m) => { slots = m.slots || {}; return slots; })
      .catch(() => (slots = {}));
  }
  return ready;
}

export const has = (id) => !!slots[id];
export const url = (id) => (slots[id] ? BASE + slots[id].path : null);
export const info = (id) => slots[id] || null;
export const list = () => Object.keys(slots);

// THREE.Texture lista para usar (o null si el slot no está). repeat: número o [x, y].
export function texture(id, { repeat = 1, srgb = true, wrap } = {}) {
  const u = url(id);
  if (!u) return null;
  const key = `${id}|${repeat}|${srgb}`;
  if (texCache.has(key)) return texCache.get(key);
  const t = loader.load(u);
  t.anisotropy = maxAniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  const tile = wrap ?? slots[id].tileable;
  if (tile) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    const [rx, ry] = Array.isArray(repeat) ? repeat : [repeat, repeat];
    t.repeat.set(rx, ry);
  }
  texCache.set(key, t);
  return t;
}

// <img> ya cargada (para canvas/UI). Devuelve una promesa de HTMLImageElement o null.
export function image(id) {
  const u = url(id);
  if (!u) return Promise.resolve(null);
  if (!imgCache.has(id)) {
    imgCache.set(id, new Promise((res) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = u;
    }));
  }
  return imgCache.get(id);
}

// Atajo para la UI: background-image CSS o '' si no está.
export const cssUrl = (id) => (url(id) ? `url("${url(id)}")` : '');
