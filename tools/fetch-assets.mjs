// Descarga y optimiza los assets 3D de terceros.
//  - Poly Haven (CC0): props y texturas. No requiere cuenta.
//  - Sketchfab (CC-BY / Free Standard): requiere SKETCHFAB_TOKEN (https://sketchfab.com/settings/password → API token).
//    Si no hay token, se omiten y la app usa los modelos propios de respaldo.
// Uso: node tools/fetch-assets.mjs            (SKETCHFAB_TOKEN=xxxx node tools/fetch-assets.mjs)
import { mkdir, writeFile, rm, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_M = join(ROOT, 'public/assets/models');
const OUT_T = join(ROOT, 'public/assets/textures');
const TMP = join(ROOT, '.asset-cache');
const GT = join(ROOT, 'node_modules/.bin/gltf-transform');

// id Poly Haven -> opciones de optimización
const PH_MODELS = {
  potted_plant_04: {},
  potted_plant_02: { simplify: 0.2 },
  modern_arm_chair_01: {},
  sofa_03: {},
  wall_clock: {},
  fire_alarm: {},
  korean_fire_extinguisher_01: {},
  hanging_picture_frame_01: {},
  hanging_picture_frame_02: {},
  office_notepads: {},
  stationery_supplies: {},
  binder_notebook: { simplify: 0.4 },
  drawer_cabinet: { simplify: 0.5 },
  steel_frame_shelves_03: {},
  side_table_01: {},
  coffee_table_round_01: {},
  projector_screen: {},
  ceramic_vase_01: {},
};
const PH_TEXTURES = {
  marble_01: { size: 1024 },
  laminate_floor_02: { size: 1024 },
  kitchen_wood: { size: 512 },
  plastered_wall_04: { size: 512 },
  fabric_pattern_07: { size: 512 },
};
// Sketchfab (descarga con token). Licencias verificadas vía API.
const SKETCHFAB = {
  // uid: nombre local
  '675f34f7304e4d92812a41e9750539aa': 'office_chair', // Office Chair Modern · thethieme · CC-BY
  'd55f6fca7c3d45c883bbff770672970d': 'mfp_printer', // MFP Office Printer · nokillnando · CC-BY
};

const j = async (u, h = {}) => {
  const r = await fetch(u, { headers: h });
  if (!r.ok) throw new Error(`${r.status} ${u}`);
  return r.json();
};
const dl = async (u, p) => {
  const r = await fetch(u);
  if (!r.ok) throw new Error(`${r.status} ${u}`);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, Buffer.from(await r.arrayBuffer()));
};
const exists = async (p) => stat(p).then(() => true, () => false);
const gt = (...a) => execFileSync(GT, a, { stdio: 'pipe' });

async function optimize(src, dst, { simplify, texSize = 512 } = {}) {
  const tmp1 = dst.replace(/\.glb$/, '.tmp1.glb');
  gt('copy', src, tmp1);
  if (simplify) { gt('weld', tmp1, tmp1); gt('simplify', tmp1, tmp1, '--ratio', String(simplify), '--error', '0.002'); }
  gt('resize', tmp1, tmp1, '--width', String(texSize), '--height', String(texSize));
  gt('webp', tmp1, tmp1, '--quality', '82');
  gt('dedup', tmp1, tmp1);
  gt('prune', tmp1, tmp1);
  gt('meshopt', tmp1, dst, '--level', 'medium');
  await rm(tmp1, { force: true });
}

async function polyhavenModels() {
  for (const [id, opt] of Object.entries(PH_MODELS)) {
    const dst = join(OUT_M, `${id}.glb`);
    if (await exists(dst)) { console.log('ok  ', id); continue; }
    const f = await j(`https://api.polyhaven.com/files/${id}`);
    const g = f.gltf['1k'].gltf;
    const dir = join(TMP, id);
    await dl(g.url, join(dir, `${id}.gltf`));
    for (const [rel, inc] of Object.entries(g.include)) await dl(inc.url, join(dir, rel));
    await optimize(join(dir, `${id}.gltf`), dst, opt);
    console.log('new ', id, ((await stat(dst)).size / 1024).toFixed(0) + 'KB');
  }
}

async function polyhavenTextures() {
  const sharpless = async (src, dst, size) => {
    // usa gltf-transform? no: convertimos con ImageMagick si existe, si no copiamos jpg
    try { execFileSync('convert', [src, '-resize', `${size}x${size}`, '-quality', '80', dst]); }
    catch { execFileSync('cp', [src, dst.replace(/\.webp$/, '.jpg')]); }
  };
  for (const [id, { size }] of Object.entries(PH_TEXTURES)) {
    const f = await j(`https://api.polyhaven.com/files/${id}`);
    const maps = { diff: f.Diffuse, nor: f.nor_gl, rough: f.Rough };
    for (const [k, m] of Object.entries(maps)) {
      if (!m) continue;
      const dst = join(OUT_T, `${id}_${k}.jpg`);
      if (await exists(dst)) continue;
      const src = join(TMP, 'tex', `${id}_${k}_1k.jpg`);
      await dl(m['1k'].jpg.url, src);
      await mkdir(OUT_T, { recursive: true });
      execFileSync('python3', ['-I', '-c',
        `from PIL import Image;im=Image.open(${JSON.stringify(src)}).convert('RGB');im=im.resize((${size},${size}),Image.LANCZOS);im.save(${JSON.stringify(dst)},quality=82,optimize=True,progressive=True)`]);
      console.log('tex ', id, k);
    }
  }
}

async function sketchfab() {
  const token = process.env.SKETCHFAB_TOKEN;
  if (!token) { console.log('Sketchfab: sin SKETCHFAB_TOKEN, se omite (la app usa modelos de respaldo).'); return; }
  for (const [uid, name] of Object.entries(SKETCHFAB)) {
    const dst = join(OUT_M, `sf_${name}.glb`);
    if (await exists(dst)) { console.log('ok  ', name); continue; }
    const info = await j(`https://api.sketchfab.com/v3/models/${uid}`);
    const d = await j(`https://api.sketchfab.com/v3/models/${uid}/download`, { Authorization: `Token ${token}` });
    const src = d.glb?.url;
    if (!src) { console.log('sin GLB', name); continue; }
    const raw = join(TMP, `sf_${name}.glb`);
    await dl(src, raw);
    await optimize(raw, dst, { texSize: 1024 });
    console.log('sf  ', name, '·', info.license?.label, '·', info.user?.username);
  }
}

await mkdir(OUT_M, { recursive: true });
await polyhavenModels();
await polyhavenTextures();
await sketchfab();
const manifest = {};
for (const f of await readdir(OUT_M)) if (f.endsWith('.glb')) manifest[f.replace(/\.glb$/, '')] = true;
await writeFile(join(OUT_M, 'manifest.json'), JSON.stringify(manifest, null, 1));
let total = 0;
for (const d of [OUT_M, OUT_T]) for (const f of await readdir(d)) total += (await stat(join(d, f))).size;
console.log('Total assets:', (total / 1048576).toFixed(2), 'MB');
