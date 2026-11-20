import { bus } from '../core/bus.js';
import { isTouch } from '../core/input.js';
import { ROOMS, WALLS, DOORS, META, DEVICES } from '../data/tp.js';
import { infoFor } from './info.js';

const ICON = {
  pin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  present: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 21l4-5 4 5"/></svg>',
  xray: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/></svg>',
  lab: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 6.5h4a3 3 0 0 1 3 3V14"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 1-1 1.7M12 17h.01"/></svg>',
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

export class HUD {
  constructor() {
    const el = (this.root = document.createElement('div'));
    el.className = 'hud';
    el.innerHTML = `
      <div class="brand glass"><div class="logo"><i style="height:9px"></i><i style="height:15px"></i><i style="height:22px"></i></div><b>${META.client}</b><span class="sep full"></span><span class="where full">${ICON.pin}<span data-room>Recepción</span></span></div>
      <div class="toolbar glass">
        <button class="btn" data-m="present" title="Presentación (P)">${ICON.present}<span class="t">Presentación</span><span class="kbd">P</span></button>
        <button class="btn" data-m="xray" title="Rayos X (X)">${ICON.xray}<span class="t">Rayos X</span><span class="kbd">X</span></button>
        <button class="btn" data-m="plan" title="Vista plano (M)">${ICON.plan}<span class="t">Plano</span><span class="kbd">M</span></button>
        <button class="btn" data-m="lab" title="Laboratorio (L)">${ICON.lab}<span class="t">Laboratorio</span><span class="kbd">L</span></button>
        <button class="btn" data-m="help" title="Ayuda (H)">${ICON.help}</button>
        ${document.fullscreenEnabled ? `<button class="btn" data-m="full" title="Pantalla completa">${ICON.full}</button>` : ''}
      </div>
      <div class="crosshair"></div>
      <div class="prompt glass"><span class="kbd">${isTouch ? '👆' : 'E'}</span><span data-p></span></div>
      <div class="hints glass"><span><span class="kbd">W</span><span class="kbd">A</span><span class="kbd">S</span><span class="kbd">D</span> Moverse</span><span><span class="kbd">Shift</span> Correr</span><span>Mouse · Mirar</span><span><span class="kbd">E</span> Inspeccionar</span></div>
      <div class="lockhint glass">Hacé clic para mirar con el mouse</div>
      <div class="minimap glass"><canvas width="224" height="168"></canvas></div>
      <div class="toasts"></div>`;
    document.body.appendChild(el);
    this.roomEl = el.querySelector('[data-room]');
    this.prompt = el.querySelector('.prompt');
    this.promptText = el.querySelector('[data-p]');
    this.cross = el.querySelector('.crosshair');
    this.lockhint = el.querySelector('.lockhint');
    this.toasts = el.querySelector('.toasts');
    this.mini = el.querySelector('.minimap canvas');
    this.toolbar = el.querySelector('.toolbar');
    this.toolbar.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (b) bus.emit('ui:mode', { mode: b.dataset.m }); });
    if (isTouch) {
      const pad = document.createElement('div');
      pad.className = 'touch-pad';
      pad.innerHTML = `<button class="btn glass round big disabled" data-t="use">E</button>`;
      el.appendChild(pad);
      this.useBtn = pad.querySelector('[data-t=use]');
      this.useBtn.addEventListener('click', () => bus.emit('ui:use'));
      const mh = document.createElement('div');
      mh.className = 'move-hint glass';
      mh.textContent = 'Deslizá a la izquierda para caminar · a la derecha para mirar';
      el.appendChild(mh);
      setTimeout(() => mh.remove(), 9000);
    }
    bus.on('toast', ({ text, kind }) => this.toast(text, kind));
    this.drawMiniBase();
  }
  setRoom(name) { if (this.roomEl.textContent !== name) this.roomEl.textContent = name; }
  setPrompt(text) {
    this.prompt.classList.toggle('show', !!text);
    this.cross.classList.toggle('hot', !!text);
    if (text) this.promptText.innerHTML = text;
    if (this.useBtn) this.useBtn.classList.toggle('disabled', !text);
  }
  setMode(mode, flags = {}) {
    this.toolbar.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('on', !!flags[b.dataset.m]));
    const explore = mode === 'explore';
    this.cross.style.display = explore && !isTouch ? '' : 'none';
    this.root.querySelector('.hints').style.display = explore && !isTouch ? '' : 'none';
    this.root.querySelector('.minimap').style.display = mode === 'present' ? 'none' : '';
    if (this.useBtn) this.useBtn.parentElement.style.display = explore ? '' : 'none';
    if (!explore) this.setPrompt(null);
  }
  setLocked(locked, explore) { this.lockhint.style.opacity = !locked && explore && !isTouch ? 1 : 0; }
  toast(text, kind = '') {
    const t = document.createElement('div');
    t.className = `toast glass ${kind}`;
    t.innerHTML = text;
    this.toasts.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = 0; setTimeout(() => t.remove(), 400); }, 3200);
  }

  // ── minimapa ──
  drawMiniBase() {
    const c = document.createElement('canvas');
    c.width = 224; c.height = 168;
    const g = c.getContext('2d');
    const s = 14, ox = 0, oz = 0;
    for (const r of ROOMS) { g.fillStyle = r.color + 'cc'; g.fillRect(ox + r.x0 * s, oz + r.z0 * s, (r.x1 - r.x0) * s, (r.z1 - r.z0) * s); }
    g.strokeStyle = '#243447'; g.lineWidth = 2;
    for (const w of WALLS) { g.beginPath(); g.moveTo(w.a[0] * s, w.a[1] * s); g.lineTo(w.b[0] * s, w.b[1] * s); g.stroke(); }
    g.strokeStyle = '#eef1f1'; g.lineWidth = 3;
    for (const d of DOORS) { g.beginPath(); if (d.wall === 'z') { g.moveTo(d.from * s, d.at * s); g.lineTo(d.to * s, d.at * s); } else { g.moveTo(d.at * s, d.from * s); g.lineTo(d.at * s, d.to * s); } g.stroke(); }
    g.fillStyle = '#1b2433';
    for (const id of ['R1', 'R2']) { const [x, z] = DEVICES[id].pos; g.fillRect(x * s - 4, z * s - 4, 8, 8); }
    g.font = '700 8px Inter Variable, sans-serif'; g.fillStyle = '#1b2433'; g.textAlign = 'center';
    for (const r of ROOMS) if (r.id !== 'pasillo') g.fillText(r.name.toUpperCase().replace('ÁREA DE ', ''), ((r.x0 + r.x1) / 2) * s, ((r.z0 + r.z1) / 2) * s + 3);
    this.miniBase = c;
  }
  drawMini(x, z, yaw) {
    const g = this.mini.getContext('2d');
    g.clearRect(0, 0, 224, 168);
    g.drawImage(this.miniBase, 0, 0);
    const s = 14;
    g.save(); g.translate(x * s, z * s); g.rotate(-yaw);
    g.fillStyle = 'rgba(59,130,246,.25)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 26, -Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6); g.fill();
    g.fillStyle = '#2563eb'; g.strokeStyle = 'white'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 5); g.lineTo(0, 2); g.lineTo(-5, 5); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
}

// ── ficha lateral ──
export class InfoPanel {
  constructor() {
    const el = (this.el = document.createElement('div'));
    el.className = 'info glass';
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
    addEventListener('keydown', (e) => { if (e.code === 'Escape' && this.isOpen) this.close(); }, true);
  }
  get isOpen() { return this.el.classList.contains('open'); }
  open(id) {
    const d = infoFor(id);
    if (!d) return;
    this.id = id;
    const acts = [];
    if (d.route) acts.push(`<button class="btn primary" data-a="route" data-v="${d.route}">Ver recorrido hasta el rack</button>`);
    if (d.lab) acts.push(`<button class="btn" data-a="lab" data-v="${d.lab}">Abrir consola</button>`);
    if (d.slide) acts.push(`<button class="btn primary" data-a="slide" data-v="${d.slide}">${d.slide === 'portada' ? 'Iniciar presentación' : 'Abrir diagrama'}</button>`);
    this.el.innerHTML = `
      <header><div class="k">${d.kicker}</div><h2>${d.title}</h2><button class="btn ghost sm x" data-a="close" aria-label="Cerrar">${ICON.x}</button></header>
      <div class="body scroll selectable">
        ${d.rows.length ? `<div class="rows">${d.rows.map(([k, v]) => `<span>${k}</span><b>${v}</b>`).join('')}</div>` : ''}
        ${d.text ? `<p class="text">${d.text}</p>` : ''}
      </div>
      ${acts.length ? `<div class="actions">${acts.join('')}</div>` : ''}`;
    this.el.classList.add('open');
    document.body.classList.add('info-open');
    bus.emit('inspect', { id });
  }
  close() { if (!this.isOpen) return; this.el.classList.remove('open'); document.body.classList.remove('info-open'); this.id = null; bus.emit('info:close'); }
}

export function showHelp() {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal glass scroll">
    <h2>Cómo usar el recorrido</h2>
    <div class="grid">
      ${isTouch ? `<span class="chip">Izquierda</span><span>Arrastrá para caminar (joystick)</span><span class="chip">Derecha</span><span>Arrastrá para mirar · tocá un objeto para inspeccionarlo</span>` : `<span><span class="kbd">W</span><span class="kbd">A</span><span class="kbd">S</span><span class="kbd">D</span></span><span>Moverse (Shift para correr)</span><span class="kbd">Mouse</span><span>Mirar (clic para capturar el puntero, Esc para soltarlo)</span><span class="kbd">E</span><span>Inspeccionar el objeto que mirás</span>`}
      <span class="kbd">X</span><span>Rayos X: cables por cielorraso y canaletas, coloreados por VLAN</span>
      <span class="kbd">M</span><span>Vista plano: la oficina desde arriba, con órbita libre</span>
      <span class="kbd">P</span><span>Presentación: las 11 páginas del TP recorridas en 3D (← →)</span>
      <span class="kbd">L</span><span>Laboratorio: bloques, consola y topología en vivo (simulación)</span>
    </div>
    <div class="foot">Colores de VLAN: <span style="color:var(--v10)">■ 10 Gestión</span> · <span style="color:var(--v20)">■ 20 Personal</span> · <span style="color:var(--v30)">■ 30 Archivos</span> · <span style="color:var(--v40)">■ 40 Telefonía</span> · <span style="color:var(--v50)">■ 50 Visitas</span> · <span style="color:var(--v60)">■ 60 Respaldo</span> · <span style="color:var(--fiber)">■ Fibra</span><br>
    Proyecto escolar: TP final de Redes 2026 (Volonté · Goiburú · Palombo). El laboratorio simula el comportamiento previsto en el TP; no reemplaza las pruebas reales. Ambientación: modelos y texturas de Poly Haven (CC0). <a href="${import.meta.env.BASE_URL}TP-Redes-FINAL.pdf" target="_blank" rel="noopener">Abrir el PDF del TP</a>.</div>
    <div style="margin-top:16px;text-align:right"><button class="btn primary">Entendido</button></div></div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove();
  bg.addEventListener('click', (e) => { if (e.target === bg || e.target.closest('.btn')) close(); });
  addEventListener('keydown', function k(e) { if (e.code === 'Escape' || e.code === 'KeyH') { close(); removeEventListener('keydown', k, true); } }, true);
}
