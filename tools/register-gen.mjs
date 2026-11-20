// Escanea public/assets/gen/ y escribe public/assets/gen/manifest.json con los slots presentes.
// Los ids salen de asset-pack/manifest.json (por ruta). Acepta .png/.jpg/.jpeg/.webp aunque el
// catálogo pida otra extensión (ej. textures/x.png entregado como textures/x.jpg).
// Uso: node tools/register-gen.mjs
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GEN = join(ROOT, 'public/assets/gen');
const pack = JSON.parse(await readFile(join(ROOT, 'asset-pack/manifest.json'), 'utf8'));
const noExt = (p) => p.slice(0, p.length - extname(p).length).toLowerCase();
const byStem = new Map(pack.slots.map((s) => [noExt(s.path), s]));

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const files = (await walk(GEN)).map((f) => relative(GEN, f).split('\\').join('/'));
const slots = {};
const unknown = [];
const gifs = {};
for (const f of files) {
  if (f === 'manifest.json' || f.endsWith('README.md')) continue;
  const ext = extname(f).toLowerCase();
  // cuadros de GIF: gif/<nombre>/frame_XX.png → slot gif_frames_<nombre>
  const g = f.match(/^gif\/([^/]+)\/frame_\d+\.(png|jpe?g|webp)$/i);
  if (g) { (gifs[g[1]] ||= []).push(f); continue; }
  const s = byStem.get(noExt(f));
  if (!s || !['.png', '.jpg', '.jpeg', '.webp', '.gif', '.ogg', '.wav', '.mp3'].includes(ext)) { unknown.push(f); continue; }
  slots[s.id] = { path: f, tileable: s.tileable, transparent: s.transparent, w: s.w, h: s.h, size: (await stat(join(GEN, f))).size };
}
for (const [name, frames] of Object.entries(gifs)) slots[`gif_frames_${name}`] = { path: frames.sort()[0], frames: frames.sort(), tileable: false, transparent: false };
// GIF/WebP animados ya armados: gif/<nombre>.gif|.webp → slot gif_<nombre>
for (const f of files) { const m = f.match(/^gif\/([^/]+)\.(gif|webp)$/i); if (m) slots[`gif_${m[1]}`] = { path: f }; }

await writeFile(join(GEN, 'manifest.json'), JSON.stringify({ version: 1, generated: new Date().toISOString(), slots }, null, 1));
const total = pack.slots.length;
const p1 = pack.slots.filter((s) => s.priority === 'P1');
console.log(`Registrados ${Object.keys(slots).length} de ${total} slots.`);
console.log(`P1 faltantes: ${p1.filter((s) => !slots[s.id]).map((s) => s.id).join(', ') || 'ninguno'}`);
if (unknown.length) console.log('Sin slot (revisar nombre/carpeta):\n  ' + unknown.join('\n  '));
