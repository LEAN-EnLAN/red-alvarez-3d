import { bus } from '../core/bus.js';
import { SLIDES } from './slides.js';

export class Presenter {
  constructor({ onSlide, onExit }) {
    this.i = 0;
    this.active = false;
    this.onSlide = onSlide;
    this.onExit = onExit;
    const el = (this.el = document.createElement('div'));
    el.className = 'slide glass hide';
    document.body.appendChild(el);
    const nav = (this.nav = document.createElement('div'));
    nav.className = 'slidenav glass hidden';
    nav.innerHTML = `<button class="btn sm" data-n="prev" aria-label="Anterior">←</button><div class="dots">${SLIDES.map((s, i) => `<i data-i="${i}" title="${s.title}"></i>`).join('')}</div><span class="count"></span><button class="btn sm primary" data-n="next" aria-label="Siguiente">→</button><button class="btn sm ghost" data-n="exit">Salir</button>`;
    document.body.appendChild(nav);
    nav.addEventListener('click', (e) => {
      const b = e.target.closest('[data-n]');
      const d = e.target.closest('[data-i]');
      if (d) this.go(+d.dataset.i);
      if (!b) return;
      if (b.dataset.n === 'prev') this.go(this.i - 1);
      if (b.dataset.n === 'next') this.go(this.i + 1);
      if (b.dataset.n === 'exit') this.exit();
    });
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]');
      const r = e.target.closest('[data-route]');
      if (r) bus.emit('route:show', { dev: r.dataset.route, keepCamera: true });
      if (!a) return;
      if (a.dataset.act === 'lab') bus.emit('lab:open', { tab: a.dataset.tab });
      if (a.dataset.act === 'explore') this.exit();
    });
    addEventListener('keydown', (e) => {
      if (!this.active || e.target.closest?.('input,textarea,.lab-root')) return;
      if (e.code === 'ArrowRight' || e.code === 'PageDown' || e.code === 'Space') { this.go(this.i + 1); e.preventDefault(); }
      if (e.code === 'ArrowLeft' || e.code === 'PageUp') { this.go(this.i - 1); e.preventDefault(); }
      if (e.code === 'Escape') this.exit();
    });
    bus.on('present:goto', ({ id }) => { const i = SLIDES.findIndex((s) => s.id === id); this.start(Math.max(0, i)); });
  }
  start(i = 0) {
    this.active = true;
    this.nav.classList.remove('hidden');
    this.go(i, true);
  }
  go(i, force) {
    i = Math.max(0, Math.min(SLIDES.length - 1, i));
    if (i === this.i && !force && this.active && this.el.innerHTML) return;
    this.i = i;
    const s = SLIDES[i];
    this.el.classList.add('hide');
    setTimeout(() => {
      this.el.classList.toggle('wide', !!s.wide);
      this.el.innerHTML = `<header><div class="k"><span class="num">${s.n}</span>${s.kicker}</div><h1>${s.title}</h1></header><div class="content scroll selectable">${s.html()}</div>`;
      this.el.classList.remove('hide');
    }, force ? 0 : 220);
    this.nav.querySelectorAll('.dots i').forEach((d, j) => d.classList.toggle('on', j === i));
    this.nav.querySelector('.count').textContent = `${i + 1} / ${SLIDES.length}`;
    this.onSlide(s);
  }
  exit() {
    if (!this.active) return;
    this.active = false;
    this.el.classList.add('hide');
    this.nav.classList.add('hidden');
    this.onExit();
  }
}
