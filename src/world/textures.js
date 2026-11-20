import * as THREE from 'three';

const loader = new THREE.TextureLoader();
const BASE = import.meta.env.BASE_URL + 'assets/textures/';
let maxAniso = 4;
export const setMaxAniso = (n) => (maxAniso = n);

export function pbrSet(name, { repeat = 1, color = true } = {}) {
  const load = (suffix, srgb) => {
    const t = loader.load(`${BASE}${name}_${suffix}.jpg`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = maxAniso;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.repeat.set(repeat, repeat);
    return t;
  };
  return { map: color ? load('diff', true) : null, normalMap: load('nor', false), roughnessMap: load('rough', false) };
}

// Texto nítido sobre canvas (carteles, etiquetas, pantallas)
export function textCanvas(lines, { w = 512, h = 128, bg = '#ffffff', fg = '#1b2433', font = 600, size = 54, align = 'center', pad = 24, radius = 0, sub, subSize, subFg } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (bg) {
    g.fillStyle = bg;
    if (radius) { g.beginPath(); g.roundRect(0, 0, w, h, radius); g.fill(); } else g.fillRect(0, 0, w, h);
  }
  g.fillStyle = fg;
  g.textBaseline = 'middle';
  g.textAlign = align;
  const x = align === 'center' ? w / 2 : align === 'left' ? pad : w - pad;
  const arr = Array.isArray(lines) ? lines : [lines];
  g.font = `${font} ${size}px Inter Variable, Inter, system-ui, sans-serif`;
  if (sub) {
    g.fillText(arr[0], x, h * 0.4);
    g.font = `500 ${subSize || size * 0.45}px Inter Variable, Inter, system-ui, sans-serif`;
    g.fillStyle = subFg || fg;
    g.fillText(sub, x, h * 0.74);
  } else {
    const lh = size * 1.15;
    const y0 = h / 2 - ((arr.length - 1) * lh) / 2;
    arr.forEach((l, i) => g.fillText(l, x, y0 + i * lh));
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  return t;
}

export function labelPlane(text, { width = 0.6, height = 0.15, ...opts } = {}) {
  const ratio = width / height;
  const h = 128, w = Math.round(h * ratio / 64) * 64 || 512;
  const tex = textCanvas(text, { w, h, ...opts });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, transparent: !opts.bg }));
  return m;
}

// Cielorraso: placas de 60×60 con perfilería
export function ceilingTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f4f1'; g.fillRect(0, 0, 256, 256);
  // micro-perforación
  g.fillStyle = 'rgba(0,0,0,0.035)';
  for (let i = 0; i < 1400; i++) g.fillRect(Math.random() * 256, Math.random() * 256, 1.2, 1.2);
  g.fillStyle = '#d9dad6';
  g.fillRect(0, 0, 256, 5); g.fillRect(0, 0, 5, 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  return t;
}

// Vista exterior para las ventanas: cielo + skyline de ciudad desenfocado
export function cityTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#9cc7ef'); sky.addColorStop(0.55, '#d8e9f7'); sky.addColorStop(1, '#eef3f6');
  g.fillStyle = sky; g.fillRect(0, 0, 1024, 512);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let layer = 0; layer < 2; layer++) {
    let x = 0;
    while (x < 1024) {
      const bw = 40 + rnd() * 90, bh = (layer ? 120 : 200) + rnd() * (layer ? 120 : 200);
      g.fillStyle = layer ? '#8e9caa' : '#b9c4cf';
      g.fillRect(x, 512 - bh, bw, bh);
      g.fillStyle = layer ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.35)';
      for (let wy = 512 - bh + 10; wy < 500; wy += 16) for (let wx = x + 6; wx < x + bw - 8; wx += 12) if (rnd() > 0.35) g.fillRect(wx, wy, 6, 8);
      x += bw + 4;
    }
  }
  g.filter = 'blur(2px)';
  g.drawImage(c, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
