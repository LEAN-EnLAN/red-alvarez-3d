// Taller: armar un conector RJ45 con la norma T568B (TP p.5: "misma distribución de colores T568B en ambos extremos").
import { T568B } from '../data/tp.js';
import { bus } from '../core/bus.js';

export function createTaller() {
  const el = document.createElement('div');
  el.className = 'tl scroll';
  el.innerHTML = `
    <div class="tl-wrap">
      <h2>Armá el conector</h2>
      <p class="tl-lead">Cada cable del TP termina con la norma <b>T568B</b> en los dos extremos. Ordená los ocho hilos del pin 1 al 8: elegí un hilo y después tocá el pin.</p>
      <div class="tl-plug" aria-label="Conector RJ45, pines 1 a 8"></div>
      <div class="tl-wires" aria-label="Hilos sin ubicar"></div>
      <div class="tl-bar"><button class="btn primary" data-a="check">Comprobar</button><button class="btn" data-a="reset">Mezclar de nuevo</button><span class="tl-res" role="status"></span></div>
      <details class="tl-ref"><summary>Ver la norma</summary><ol>${T568B.map((w) => `<li><i class="tl-sw ${w.stripe ? 'st' : ''}" style="--c:${w.c}"></i>${w.name}</li>`).join('')}</ol></details>
    </div>`;
  const plug = el.querySelector('.tl-plug'), wires = el.querySelector('.tl-wires'), res = el.querySelector('.tl-res');
  let slots, pool, sel, tries;
  const sw = (w) => `<i class="tl-sw ${w.stripe ? 'st' : ''}" style="--c:${w.c}"></i>`;
  function paint() {
    plug.innerHTML = slots.map((n, i) => `<button class="tl-pin ${n ? 'full' : ''}" data-pin="${i}" aria-label="Pin ${i + 1}${n ? ': ' + T568B[n - 1].name : ''}">${n ? sw(T568B[n - 1]) : ''}<span>${i + 1}</span></button>`).join('');
    wires.innerHTML = pool.filter((n) => !slots.includes(n)).map((n) => `<button class="tl-wire ${sel === n ? 'sel' : ''}" data-w="${n}" title="${T568B[n - 1].name}">${sw(T568B[n - 1])}<span>${T568B[n - 1].name}</span></button>`).join('') || '<span class="tiny">Todos los hilos ubicados.</span>';
  }
  function reset() { slots = Array(8).fill(null); pool = T568B.map((w) => w.n).sort(() => Math.random() - 0.5); sel = null; tries = 0; res.textContent = ''; paint(); }
  el.addEventListener('click', (e) => {
    const w = e.target.closest('[data-w]'), p = e.target.closest('[data-pin]'), a = e.target.closest('[data-a]');
    if (w) { sel = sel === +w.dataset.w ? null : +w.dataset.w; paint(); }
    else if (p) {
      const i = +p.dataset.pin;
      if (sel) { const prev = slots.indexOf(sel); if (prev >= 0) slots[prev] = null; slots[i] = sel; sel = null; }
      else slots[i] = null;
      res.textContent = ''; paint();
    } else if (a?.dataset.a === 'reset') reset();
    else if (a?.dataset.a === 'check') {
      if (slots.includes(null)) { res.textContent = 'Faltan hilos por ubicar.'; return; }
      tries++;
      const bad = slots.filter((n, i) => n !== i + 1).length;
      plug.querySelectorAll('.tl-pin').forEach((b, i) => b.classList.add(slots[i] === i + 1 ? 'good' : 'bad'));
      res.textContent = bad ? `${bad} ${bad === 1 ? 'hilo está' : 'hilos están'} fuera de lugar. El pin 1 es blanco/naranja.` : `Correcto${tries === 1 ? ' al primer intento' : ''}. Así queda cada boca y cada panel.`;
      res.className = 'tl-res ' + (bad ? 'bad' : 'ok');
      if (!bad) bus.emit('toast', { text: 'Conector T568B armado', kind: 'ok' });
    }
  });
  reset();
  return { el };
}
