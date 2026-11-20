import { bus } from '../core/bus.js';
import { isTouch } from '../core/input.js';
import { ROOMS, WALLS, DOORS, META, DEVICES, DESKS, OUTLETS, RACKS, VLANS } from '../data/tp.js';
import { infoFor } from './info.js';

// Iconos de línea propios (24×24, trazo 1.75, extremos redondeados)
export const ICON = {
  mark: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="11" width="4" height="7" rx="1"/><rect x="8" y="7" width="4" height="11" rx="1"/><rect x="14" y="2" width="4" height="16" rx="1"/></svg>',
  room: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V5.5L13 4v16M13 6h6v14M2.5 20h19"/><path d="M10 12.5v1"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  hand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3.6 14.6a1.6 1.6 0 0 1 2.6-1.9L9 15"/></svg>',
};

const roomName = (id) => ROOMS.find((r) => r.id === id)?.name || '';

// Línea de contexto por sala, derivada de tp.js
export function roomContext(id) {
  const parts = [];
  const desks = DESKS.filter((d) => d.room === id);
  const pcs = desks.map((d) => d.pc);
  if (pcs.length > 2) parts.push(`${pcs[0]}–${pcs[pcs.length - 1]}`);
  else parts.push(...desks.flatMap((d) => [d.pc, d.tel].filter(Boolean)));
  if (id === 'reunion') parts.push('TEL107');
  for (const [k, d] of Object.entries(DEVICES)) {
    if (d.room !== id) continue;
    if (d.kind === 'rack') {
      parts.unshift(k);
      const ids = RACKS[k].items.map((it) => it.id).filter((x) => x && !x.startsWith('PP'));
      const holds = RACKS[k].items.flatMap((it) => it.holds || []).filter((x) => !x.startsWith('ONT'));
      parts.push(...ids, ...holds);
    } else parts.push(k);
  }
  if (id === 'pasillo') return 'Acceso a los cuatro boxes';
  if (id === 'circulacion') return 'AP1 · bandeja principal de cables por el cielorraso';
  const bocas = OUTLETS.filter((o) => o.room === id).length;
  if (bocas) parts.push(`${bocas} ${bocas === 1 ? 'boca' : 'bocas'}`);
  return [...new Set(parts)].join(' · ');
}

const ONB_KEY = 'alvarez.onboarding.v2';

export class HUD {
  constructor() {
    const el = (this.root = document.createElement('div'));
    el.className = 'hud';
    el.innerHTML = `
      <div class="badge" aria-live="polite">
        <span class="badge-mark">${ICON.mark}</span>
        <span class="badge-body"><span class="badge-name">${META.client}</span><span class="badge-room"><b data-room></b><span data-ctx></span></span></span>
      </div>
      <div class="crosshair" aria-hidden="true"></div>
      <div class="prompt" role="status"><span class="kbd">E</span><span data-p></span></div>
      <div class="lockhint">Hacé clic para mirar</div>
      <div class="menuhint"><span class="kbd">Esc</span> Menú</div>
      <div class="minimap"><canvas width="224" height="168" aria-label="Minimapa"></canvas></div>
      <div class="toasts" aria-live="polite"></div>`;
    document.body.appendChild(el);
    this.badge = el.querySelector('.badge');
    this.roomEl = el.querySelector('[data-room]');
    this.ctxEl = el.querySelector('[data-ctx]');
    this.prompt = el.querySelector('.prompt');
    this.promptText = el.querySelector('[data-p]');
    this.cross = el.querySelector('.crosshair');
    this.lockhint = el.querySelector('.lockhint');
    this.menuhint = el.querySelector('.menuhint');
    this.toasts = el.querySelector('.toasts');
    this.mini = el.querySelector('.minimap canvas');
    this.badge.addEventListener('click', () => this.flashBadge());
    if (isTouch) {
      el.querySelector('.prompt .kbd').innerHTML = ICON.hand;
      const pad = document.createElement('div');
      pad.className = 'touch-pad';
      pad.innerHTML = `<button class="use-btn disabled" data-t="use" aria-label="Inspeccionar">E</button>`;
      el.appendChild(pad);
      this.useBtn = pad.querySelector('[data-t=use]');
      this.useBtn.addEventListener('click', () => bus.emit('ui:use'));
      const mb = document.createElement('button');
      mb.className = 'menu-btn';
      mb.setAttribute('aria-label', 'Menú');
      mb.innerHTML = ICON.menu;
      mb.addEventListener('click', () => bus.emit('ui:menu'));
      el.appendChild(mb);
      this.menuBtn = mb;
    }
    bus.on('toast', ({ text, kind }) => this.toast(text, kind));
    this.drawMiniBase();
    this.room = null;
    this.explored = false;
  }

  // Insignia: plegada por defecto; al entrar a una sala se despliega ~3 s con el nombre y el contexto
  setRoom(name, roomId) {
    const id = roomId || ROOMS.find((r) => r.name === name)?.id;
    if (this.room === (id || name)) return;
    this.room = id || name;
    this.roomEl.textContent = name;
    this.ctxEl.textContent = id ? roomContext(id) : '';
    if (this.explored) this.flashBadge();
  }
  flashBadge(ms = 3200) {
    if (!this.roomEl.textContent) return;
    this.badge.classList.add('open');
    clearTimeout(this._bt);
    this._bt = setTimeout(() => this.badge.classList.remove('open'), ms);
  }
  setPrompt(text) {
    this.prompt.classList.toggle('show', !!text);
    this.cross.classList.toggle('hot', !!text);
    if (text) this.promptText.innerHTML = text;
    if (this.useBtn) this.useBtn.classList.toggle('disabled', !text);
  }
  setMode(mode, flags = {}) {
    const explore = mode === 'explore';
    this.root.dataset.mode = mode;
    this.root.classList.toggle('xray', !!flags.xray);
    if (!explore) this.setPrompt(null);
    if (explore && !this.explored) {
      this.explored = true;
      if (!showOnboarding()) this.showMenuHint();
      if (this.room) this.flashBadge(3600);
    }
  }
  showMenuHint() {
    if (isTouch) return;
    this.menuhint.classList.add('show');
    clearTimeout(this._mh);
    this._mh = setTimeout(() => this.menuhint.classList.remove('show'), 6000);
  }
  setLocked(locked, explore) { this.lockhint.classList.toggle('show', !locked && explore && !isTouch); }
  toast(text, kind = '') {
    const t = document.createElement('div');
    t.className = `toast ${kind}`;
    t.innerHTML = text;
    this.toasts.appendChild(t);
    while (this.toasts.children.length > 2) this.toasts.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3400);
  }

  // ── minimapa ──
  drawMiniBase() {
    const c = document.createElement('canvas');
    c.width = 224; c.height = 168;
    const g = c.getContext('2d');
    const s = 14;
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 224, 168);
    for (const r of ROOMS) { g.fillStyle = r.floor === 'tile' ? '#f1f1ee' : '#e9e6e0'; g.fillRect(r.x0 * s, r.z0 * s, (r.x1 - r.x0) * s, (r.z1 - r.z0) * s); }
    g.strokeStyle = '#2b2b2b'; g.lineWidth = 2; g.lineCap = 'square';
    for (const w of WALLS) { g.beginPath(); g.moveTo(w.a[0] * s, w.a[1] * s); g.lineTo(w.b[0] * s, w.b[1] * s); g.stroke(); }
    g.strokeStyle = '#f1f1ee'; g.lineWidth = 3; g.lineCap = 'butt';
    for (const d of DOORS) { g.beginPath(); if (d.wall === 'z') { g.moveTo(d.from * s, d.at * s); g.lineTo(d.to * s, d.at * s); } else { g.moveTo(d.at * s, d.from * s); g.lineTo(d.at * s, d.to * s); } g.stroke(); }
    g.fillStyle = '#141414';
    for (const id of ['R1', 'R2']) { const [x, z] = DEVICES[id].pos; g.fillRect(x * s - 3.5, z * s - 3.5, 7, 7); }
    g.font = '600 7.5px Inter Variable, sans-serif'; g.fillStyle = '#6b6b67'; g.textAlign = 'center';
    for (const r of ROOMS) if (r.id !== 'pasillo') g.fillText(r.name.replace('Área de ', '').replace('Sala de ', ''), ((r.x0 + r.x1) / 2) * s, ((r.z0 + r.z1) / 2) * s + 3);
    this.miniBase = c;
  }
  drawMini(x, z, yaw) {
    const g = this.mini.getContext('2d');
    g.clearRect(0, 0, 224, 168);
    g.drawImage(this.miniBase, 0, 0);
    const s = 14;
    g.save(); g.translate(x * s, z * s); g.rotate(-yaw);
    g.fillStyle = 'rgba(31,94,255,.16)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 24, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55); g.fill();
    g.fillStyle = '#1f5eff'; g.strokeStyle = '#fff'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(0, -6.5); g.lineTo(4.5, 4.5); g.lineTo(0, 2); g.lineTo(-4.5, 4.5); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
}

// ── onboarding: una sola vez, ~5 s ──
export function showOnboarding(force = false) {
  try { if (!force && localStorage.getItem(ONB_KEY)) return false; localStorage.setItem(ONB_KEY, '1'); } catch {}
  const steps = isTouch
    ? [['Joystick', 'Arrastrá a la izquierda para caminar'], ['Mirar', 'Arrastrá a la derecha'], ['Tocar', 'Tocá un equipo para ver su ficha'], ['Menú', 'Botón de arriba a la derecha']]
    : [['<span class="kbd">W</span><span class="kbd">A</span><span class="kbd">S</span><span class="kbd">D</span>', 'Caminar · Shift corre'], ['<span class="kbd">Mouse</span>', 'Mirar'], ['<span class="kbd">E</span>', 'Inspeccionar lo que mirás'], ['<span class="kbd">Esc</span>', 'Menú']];
  const el = document.createElement('div');
  el.className = 'onboard';
  el.innerHTML = `<ol>${steps.map(([k, t], i) => `<li style="--i:${i}"><span class="ob-k">${k}</span><span>${t}</span></li>`).join('')}</ol><i class="ob-bar"></i>`;
  document.body.appendChild(el);
  const done = () => { el.classList.add('out'); setTimeout(() => el.remove(), 400); };
  el.addEventListener('click', done);
  setTimeout(done, 5200);
  return true;
}

// ── ficha lateral ──
export class InfoPanel {
  constructor() {
    const el = (this.el = document.createElement('aside'));
    el.className = 'info';
    el.setAttribute('aria-label', 'Ficha del objeto');
    document.body.appendChild(el);
    this.id = null;
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'close') this.close();
      if (a === 'route') bus.emit('route:show', { dev: b.dataset.v });
      if (a === 'lab') { bus.emit('lab:open', { device: b.dataset.v, tab: 'console' }); this.close(); }
      if (a === 'ping') { bus.emit('lab:open', { device: b.dataset.v, tab: 'blocks' }); this.close(); }
      if (a === 'slide') { bus.emit('present:goto', { id: b.dataset.v }); this.close(); }
      if (a === 'rack') bus.emit('goto:rack', { id: b.dataset.v });
    });
    addEventListener('keydown', (e) => { if (e.code === 'Escape' && this.isOpen) { this.close(); e.stopPropagation(); } }, true);
  }
  get isOpen() { return this.el.classList.contains('open'); }
  open(id) {
    const d = infoFor(id);
    if (!d) return;
    this.id = id;
    const acts = [];
    if (d.route) acts.push(`<button class="btn primary" data-a="route" data-v="${d.route}">Ver recorrido hasta el rack</button>`);
    if (d.slide) acts.push(`<button class="btn primary" data-a="slide" data-v="${d.slide}">${d.slide === 'portada' ? 'Iniciar presentación' : 'Abrir diagrama'}</button>`);
    if (d.lab) acts.push(`<button class="btn" data-a="lab" data-v="${d.lab}">Abrir consola</button>`);
    this.el.innerHTML = `
      <header><div><div class="k">${d.kicker}</div><h2>${d.title}</h2></div><button class="x" data-a="close" aria-label="Cerrar">${ICON.x}</button></header>
      <div class="body scroll selectable">
        ${d.rows.length ? `<dl class="rows">${d.rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>` : ''}
        ${d.text ? `<p class="text">${d.text}</p>` : ''}
      </div>
      ${acts.length ? `<div class="actions">${acts.slice(0, 2).join('')}</div>` : ''}`;
    this.el.classList.add('open');
    document.body.classList.add('info-open');
    bus.emit('inspect', { id });
  }
  close() { if (!this.isOpen) return; this.el.classList.remove('open'); document.body.classList.remove('info-open'); this.id = null; bus.emit('info:close'); }
}

// ── ayuda (también se usa dentro del menú de pausa) ──
export function helpHTML() {
  const sw = (v, t) => `<span class="sw"><i style="background:${v}"></i>${t}</span>`;
  const rows = isTouch
    ? [['Joystick izquierdo', 'Caminar'], ['Arrastrar a la derecha', 'Mirar'], ['Tocar un objeto', 'Ver su ficha'], ['Botón ≡', 'Menú']]
    : [['W A S D', 'Caminar (Shift corre)'], ['Mouse', 'Mirar · clic para capturar el puntero'], ['E', 'Inspeccionar lo que mirás'], ['Esc', 'Menú']];
  rows.push(['X', 'Rayos X: cables por cielorraso y canaletas, por VLAN'], ['M', 'Vista plano: la oficina desde arriba'], ['P', 'Presentación de las 11 páginas del TP (← →)'], ['L', 'Laboratorio: bloques, consola, topología y misiones']);
  return `
    <dl class="help-keys">${rows.map(([k, t]) => `<dt>${isTouch && k.length > 1 && !/^[A-Z]$/.test(k) ? k : k.split(' ').map((x) => `<span class="kbd">${x}</span>`).join('')}</dt><dd>${t}</dd>`).join('')}</dl>
    <div class="help-legend">${Object.entries(VLANS).filter(([k]) => k !== '70').map(([k, v]) => sw(v.color, `${k} ${v.name}`)).join('')}${sw('var(--fiber)', 'Fibra')}</div>
    <p class="help-note">El laboratorio es una simulación educativa del comportamiento previsto en el TP: no reemplaza las pruebas reales ni es GNS3. Ambientación: Poly Haven (CC0). Equipos de red modelados según datasheet. <a href="${import.meta.env.BASE_URL}TP-Redes-FINAL.pdf" target="_blank" rel="noopener">PDF del TP</a></p>`;
}

export function showHelp() {
  if (window.__pauseMenu) { window.__pauseMenu.open('help'); return; }
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal scroll" role="dialog" aria-label="Ayuda"><header><h2>Controles</h2><button class="x" aria-label="Cerrar">${ICON.x}</button></header>${helpHTML()}</div>`;
  document.body.appendChild(bg);
  const close = () => { bg.remove(); removeEventListener('keydown', k, true); };
  bg.addEventListener('click', (e) => { if (e.target === bg || e.target.closest('.x')) close(); });
  function k(e) { if (e.code === 'Escape' || e.code === 'KeyH') { close(); e.stopPropagation(); } }
  addEventListener('keydown', k, true);
}
