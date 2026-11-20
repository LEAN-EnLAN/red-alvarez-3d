// Menú de pausa estilo juego: lista vertical, navegable con ↑/↓/Enter, Esc cierra.
import { bus } from '../core/bus.js';
import { isTouch } from '../core/input.js';
import { META } from '../data/tp.js';
import { helpHTML, ICON } from './hud.js';

const KEY = 'alvarez.settings.v1';
const DEFAULTS = { quality: isTouch ? 'medium' : 'high', sens: 1, volume: 0.6, invertY: false, fov: isTouch ? 72 : 70 };

export class PauseMenu {
  constructor({ onResume } = {}) {
    this.onResume = onResume;
    this.xray = false;
    this.view = 'main';
    try { this.s = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { this.s = { ...DEFAULTS }; }
    const el = (this.el = document.createElement('div'));
    el.className = 'pause';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Menú');
    document.body.appendChild(el);
    el.addEventListener('click', (e) => this.onClick(e));
    el.addEventListener('input', (e) => this.onInput(e));
    addEventListener('keydown', (e) => this.onKey(e), true);
    bus.on('xray', ({ on }) => { this.xray = on; if (this.isOpen && this.view === 'main') this.render(); });
    window.__pauseMenu = this;
    // re-emitir la configuración guardada para que el motor la aplique
    setTimeout(() => this.emitAll(), 0);
  }
  get isOpen() { return this.el.classList.contains('open'); }
  emitAll() {
    bus.emit('ui:quality', { level: this.s.quality });
    bus.emit('ui:sens', { v: this.s.sens });
    bus.emit('ui:volume', { v: this.s.volume });
    bus.emit('ui:invertY', { on: this.s.invertY });
    bus.emit('ui:fov', { v: this.s.fov });
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.s)); } catch {} }

  open(view = 'main') {
    this.view = view;
    this.render();
    this.el.classList.add('open');
    document.body.classList.add('paused');
    document.exitPointerLock?.();
    requestAnimationFrame(() => this.el.querySelector('[data-i]')?.focus({ focusVisible: false }));
  }
  close(resume = true) {
    if (!this.isOpen) return;
    this.el.classList.remove('open');
    document.body.classList.remove('paused');
    if (resume) this.onResume?.();
  }

  render() {
    const items = [
      ['resume', 'Reanudar'],
      ['present', 'Presentación'],
      ['lab', 'Laboratorio'],
      ['plan', 'Vista plano'],
      ['xray', 'Rayos X', this.xray ? 'Activado' : 'Desactivado'],
      ['settings', 'Ajustes'],
      ['help', 'Controles y ayuda'],
      ...(document.fullscreenEnabled ? [['full', 'Pantalla completa', document.fullscreenElement ? 'Activada' : '']] : []),
    ];
    let body;
    if (this.view === 'settings') {
      const seg = (k, opts) => `<div class="seg" role="radiogroup">${opts.map(([v, t]) => `<button data-i data-set="${k}" data-v="${v}" role="radio" aria-checked="${this.s[k] === v}" class="${this.s[k] === v ? 'on' : ''}">${t}</button>`).join('')}</div>`;
      const range = (k, min, max, step, fmt) => `<div class="rng"><input data-i type="range" id="set-${k}" data-set="${k}" min="${min}" max="${max}" step="${step}" value="${this.s[k]}"><output>${fmt(this.s[k])}</output></div>`;
      body = `<div class="p-sub"><button class="p-back" data-i data-go="main">← Volver</button><h2>Ajustes</h2>
        <div class="set"><label>Calidad gráfica</label>${seg('quality', [['high', 'Alta'], ['medium', 'Media'], ['low', 'Baja']])}</div>
        <div class="set"><label for="set-sens">Sensibilidad</label>${range('sens', 0.5, 2, 0.05, (v) => (+v).toFixed(2) + '×')}</div>
        <div class="set"><label for="set-fov">Campo de visión</label>${range('fov', 60, 90, 1, (v) => v + '°')}</div>
        <div class="set"><label for="set-volume">Volumen</label>${range('volume', 0, 1, 0.05, (v) => Math.round(v * 100) + '%')}</div>
        <div class="set"><label>Invertir eje Y</label>${seg('invertY', [[false, 'No'], [true, 'Sí']])}</div></div>`;
    } else if (this.view === 'help') {
      body = `<div class="p-sub"><button class="p-back" data-i data-go="main">← Volver</button><h2>Controles y ayuda</h2>${helpHTML()}</div>`;
    } else {
      body = `<nav class="p-list">${items.map(([id, t, st]) => `<button data-i data-act="${id}"><span>${t}</span>${st !== undefined && st !== '' ? `<em>${st}</em>` : ''}</button>`).join('')}</nav>`;
    }
    this.el.innerHTML = `<div class="p-col">
      <div class="p-head"><span class="p-mark">${ICON.mark}</span><div><b>${META.client}</b><span>Red del estudio · en pausa</span></div></div>
      ${body}
      <footer>TP Redes 2026 · Volonté · Goiburú · Palombo</footer></div>`;
  }

  onClick(e) {
    if (e.target === this.el) { this.close(); return; }
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.go) { this.view = b.dataset.go; this.render(); this.el.querySelector('[data-i]')?.focus({ focusVisible: false }); return; }
    if (b.dataset.set) {
      const k = b.dataset.set;
      this.s[k] = k === 'invertY' ? b.dataset.v === 'true' : b.dataset.v;
      this.save(); this.emitAll(); this.render();
      this.el.querySelector(`[data-set="${k}"][data-v="${b.dataset.v}"]`)?.focus();
      return;
    }
    const a = b.dataset.act;
    if (!a) return;
    if (a === 'resume') return this.close();
    if (a === 'settings' || a === 'help') { this.view = a; this.render(); this.el.querySelector('[data-i]')?.focus({ focusVisible: false }); return; }
    if (a === 'xray' || a === 'full') { bus.emit('ui:mode', { mode: a }); setTimeout(() => this.render(), 120); return; }
    this.close(false);
    bus.emit('ui:mode', { mode: a });
  }
  onInput(e) {
    const t = e.target;
    if (!t.dataset.set) return;
    this.s[t.dataset.set] = +t.value;
    const o = t.parentElement.querySelector('output');
    const k = t.dataset.set;
    o.textContent = k === 'sens' ? (+t.value).toFixed(2) + '×' : k === 'fov' ? t.value + '°' : Math.round(t.value * 100) + '%';
    this.save(); this.emitAll();
  }
  onKey(e) {
    if (!this.isOpen) return;
    if (e.target.closest?.('.lab')) return;
    const list = [...this.el.querySelectorAll('[data-i]')];
    const i = list.indexOf(document.activeElement);
    if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); if (this.view !== 'main') { this.view = 'main'; this.render(); this.el.querySelector('[data-i]')?.focus({ focusVisible: false }); } else this.close(); return; }
    if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
      if (document.activeElement?.type === 'range') return;
      e.preventDefault(); e.stopPropagation();
      const n = list[(i + (e.code === 'ArrowDown' ? 1 : -1) + list.length) % list.length];
      n?.focus();
      return;
    }
    // que las teclas del juego no se disparen con el menú abierto
    if (!['Enter', 'Space', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.stopPropagation();
  }
}
