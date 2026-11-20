// Pantalla de inicio: nombre, una línea, progreso (solo mientras carga) y dos acciones.
import { META } from '../data/tp.js';
import { ICON } from './hud.js';

export function createLoader() {
  const el = document.createElement('div');
  el.className = 'loader';
  el.innerHTML = `
    <main class="ld">
      <div class="ld-brand"><span class="ld-mark">${ICON.mark}</span>${META.client}</div>
      <h1>La red del estudio,<br>en 3D.</h1>
      <p>Recorré la oficina del TP de Redes 2026 y seguí cada cable desde su boca hasta el puerto del switch.</p>
      <div class="ld-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100"><i></i></div>
      <div class="ld-cta">
        <button class="btn primary" data-go="explore" disabled>Entrar</button>
        <button class="btn" data-go="present" disabled>Presentación</button>
      </div>
    </main>
    <footer class="ld-foot"><span>${META.authors.join(' · ')}</span><span>Colegio San José · 2026</span></footer>`;
  document.body.appendChild(el);
  const prog = el.querySelector('.ld-prog'), bar = prog.querySelector('i');
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
