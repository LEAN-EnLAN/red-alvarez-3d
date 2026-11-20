// Pantalla de inicio: nombre, una línea, progreso (solo mientras carga) y dos acciones.
// A la derecha, la maqueta de la oficina: el ciclo del día animado si está, o la ilustración fija.
import { META } from '../data/tp.js';
import { ICON } from './hud.js';
import * as G from '../world/genassets.js';

export function createLoader() {
  const el = document.createElement('div');
  el.className = 'loader';
  el.innerHTML = `
    <main class="ld">
      <div class="ld-copy">
        <div class="ld-brand"><span class="ld-mark">${ICON.mark}</span>${META.client}</div>
        <h1>La red del estudio,<br>en 3D.</h1>
        <p>Recorré la oficina del TP de Redes 2026 y seguí cada cable desde su boca hasta el puerto del switch.</p>
        <div class="ld-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100"><i></i></div>
        <div class="ld-cta">
          <button class="btn primary" data-go="explore" disabled>Entrar</button>
          <button class="btn" data-go="present" disabled>Presentación</button>
        </div>
      </div>
      <figure class="ld-visual" hidden><img alt="Maqueta de la oficina de Alvarez &amp; Asoc. vista desde arriba" decoding="async" fetchpriority="low"></figure>
    </main>
    <footer class="ld-foot"><span>${META.authors.join(' · ')}</span><span>Colegio San José · 2026</span></footer>`;
  document.body.appendChild(el);
  const prog = el.querySelector('.ld-prog'), bar = prog.querySelector('i');

  // Visual: primero el ciclo del día (WebP animado); si no existe, la ilustración del catálogo; si no, nada.
  const fig = el.querySelector('.ld-visual'), img = fig.querySelector('img');
  const show = () => { fig.hidden = false; el.classList.add('has-visual'); requestAnimationFrame(() => fig.classList.add('in')); };
  const fallback = () => {
    G.loadGenManifest().then(() => {
      const u = G.url('ui_loader_keyart');
      if (!u) return;
      img.onerror = null;
      img.onload = show;
      img.src = u;
    });
  };
  img.onload = show;
  img.onerror = fallback;
  img.src = `${import.meta.env.BASE_URL}assets/gen/gif/office_daycycle.webp`;

  return {
    el,
    progress(k) { bar.style.transform = `scaleX(${Math.max(0.02, Math.min(1, k))})`; prog.setAttribute('aria-valuenow', Math.round(k * 100)); },
    ready(onGo) {
      bar.style.transform = 'scaleX(1)';
      setTimeout(() => prog.classList.add('done'), 250);
      el.querySelectorAll('[data-go]').forEach((b) => {
        b.disabled = false;
        b.onclick = () => { onGo(b.dataset.go); el.classList.add('gone'); setTimeout(() => el.remove(), 500); };
      });
      el.querySelector('[data-go=explore]').focus();
    },
  };
}
