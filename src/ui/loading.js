// Pantalla de inicio + carga + minijuego "Armá el conector T568B" (p.5 del TP)
import { META, T568B } from '../data/tp.js';
import { isTouch } from '../core/input.js';

export function createLoader() {
  const el = document.createElement('div');
  el.className = 'loader';
  el.innerHTML = `
  <div class="wrap">
    <div>
      <div class="eyebrow">${META.school} · TP final</div>
      <h1>Recorré la red de <em>${META.client}</em> en 3D</h1>
      <p class="lead">${META.tagline} Una oficina de 16 × 12 m con 23 bocas, dos racks y fibra entre gabinetes: cada cable va a su boca, su panel y su puerto, tal como está en el trabajo práctico.</p>
      <div class="bar"><i></i></div>
      <div class="status">Preparando la oficina…</div>
      <div class="cta">
        <button class="btn primary" data-go="explore" disabled>Entrar a la oficina</button>
        <button class="btn" data-go="present" disabled>Ver presentación</button>
      </div>
      <div class="authors">${META.authors.join(' · ')} · ${isTouch ? 'Joystick para moverte, arrastrá para mirar, tocá para inspeccionar.' : 'WASD para moverte · mouse para mirar · E para inspeccionar.'}</div>
    </div>
    <div class="glass game">
      <h3>Mientras carga: armá el conector</h3>
      <p class="sub">El TP usa la norma <b>T568B</b> en ambos extremos de cada cable. Ordená los 8 hilos del pin 1 al 8. ${isTouch ? 'Tocá un hilo y después un pin.' : 'Arrastrá cada hilo a su pin (o hacé clic en hilo y luego en pin).'}</p>
      <div class="rj45"></div>
      <div class="wires"></div>
      <div class="res"></div>
      <div class="acts"><button class="btn sm" data-g="check">Comprobar</button><button class="btn sm ghost" data-g="reset">Mezclar</button></div>
    </div>
  </div>
  <div class="credits">Modelos y texturas de ambientación: Poly Haven (CC0). Equipos de red modelados a medida según datasheets. Simulación educativa basada en el TP.</div>`;
  document.body.appendChild(el);

  // ── minijuego ──
  const rj = el.querySelector('.rj45'), wires = el.querySelector('.wires'), res = el.querySelector('.res');
  let slots = Array(8).fill(null), sel = null, tries = 0;
  const wireEl = (w) => {
    const d = document.createElement('div');
    d.className = 'wire' + (w.stripe ? ' stripe' : '');
    d.style.background = w.c;
    d.title = w.name;
    d.dataset.n = w.n;
    d.draggable = !isTouch;
    d.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', w.n));
    d.addEventListener('click', () => { sel = sel === w.n ? null : w.n; render(); });
    return d;
  };
  const render = () => {
    rj.innerHTML = '';
    slots.forEach((n, i) => {
      const s = document.createElement('div');
      s.className = 'slot' + (sel && !n ? ' target' : '');
      s.innerHTML = `${n ? `<div class="w ${T568B[n - 1].stripe ? 'stripe' : ''}" style="background:${T568B[n - 1].c}"></div>` : ''}${i + 1}`;
      s.addEventListener('click', () => {
        if (sel) { const prev = slots.indexOf(sel); if (prev >= 0) slots[prev] = null; slots[i] = sel; sel = null; }
        else if (n) slots[i] = null;
        render();
      });
      s.addEventListener('dragover', (e) => e.preventDefault());
      s.addEventListener('drop', (e) => { e.preventDefault(); const w = +e.dataTransfer.getData('text/plain'); const prev = slots.indexOf(w); if (prev >= 0) slots[prev] = null; slots[i] = w; render(); });
      rj.appendChild(s);
    });
    wires.innerHTML = '';
    shuffled.filter((w) => !slots.includes(w.n)).forEach((w) => { const d = wireEl(w); if (sel === w.n) d.classList.add('sel'); wires.appendChild(d); });
  };
  let shuffled;
  const reset = () => { shuffled = [...T568B].sort(() => Math.random() - 0.5); slots = Array(8).fill(null); sel = null; res.innerHTML = ''; render(); };
  el.querySelector('[data-g=reset]').onclick = reset;
  el.querySelector('[data-g=check]').onclick = () => {
    tries++;
    if (slots.includes(null)) { res.textContent = 'Faltan hilos por ubicar.'; return; }
    const ok = slots.every((n, i) => n === i + 1);
    [...rj.children].forEach((s, i) => s.classList.add(slots[i] === i + 1 ? 'good' : 'bad'));
    res.innerHTML = ok
      ? `<b class="ok">¡Perfecto!</b> Blanco/naranja, naranja, blanco/verde, azul, blanco/azul, verde, blanco/marrón, marrón. ${tries > 1 ? `(${tries} intentos)` : '¡Al primer intento!'}`
      : `Hay ${slots.filter((n, i) => n !== i + 1).length} hilos fuera de lugar. Tip: arranca con <b>blanco/naranja</b>.`;
  };
  reset();

  const bar = el.querySelector('.bar i'), status = el.querySelector('.status');
  return {
    el,
    progress(k, text) { bar.style.width = Math.round(k * 100) + '%'; if (text) status.textContent = text; },
    ready(onGo) {
      bar.style.width = '100%';
      status.textContent = 'Listo. Todo corre en tu dispositivo.';
      el.querySelectorAll('[data-go]').forEach((b) => { b.disabled = false; b.onclick = () => { onGo(b.dataset.go); el.classList.add('gone'); setTimeout(() => el.remove(), 700); }; });
    },
  };
}
