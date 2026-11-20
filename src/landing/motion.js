// Movimiento de la landing. Todo con transform/opacity (o clases que solo cambian eso), disparado al
// entrar en pantalla y detenido fuera de vista. Con "reducir movimiento" no se anima nada.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function initMotion({ RM, IO, once, FIBER_ROUTE, DEVICES, BUDGET }) {
  ticker(DEVICES, BUDGET);
  if (RM) { document.documentElement.classList.add('rm'); return; }
  const inView = (el, fn, margin) => once(el, fn, margin);

  /* ── barra de progreso de lectura bajo la barra superior ── */
  const prog = document.createElement('i');
  prog.className = 'readbar';
  $('.bar').append(prog);
  const hero = $('.hero-fig img'), cover = $('.cover');
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      prog.style.transform = `scaleX(${(scrollY / Math.max(1, max)).toFixed(4)})`;
      // portada: la figura se acomoda (zoom suave) mientras sube
      if (scrollY < innerHeight * 1.6 && hero) {
        const r = hero.parentElement.getBoundingClientRect();
        const k = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height * 0.4)));
        hero.style.transform = `scale(${(1.1 - 0.1 * k).toFixed(4)})`;
      }
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── etiquetas mono: se "decodifican" carácter por carácter ── */
  const GLY = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/[]·#';
  function scramble(el, dur = 700) {
    const nodes = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) if (n.nodeValue.trim()) nodes.push({ n, t: n.nodeValue });
    const total = nodes.reduce((s, x) => s + x.t.length, 0);
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      let o = 0;
      for (const x of nodes) {
        let out = '';
        for (let i = 0; i < x.t.length; i++) {
          const ch = x.t[i], pos = (o + i) / total;
          out += ch === ' ' || pos < k ? ch : pos < k + 0.25 ? GLY[(Math.random() * GLY.length) | 0] : ' ';
        }
        x.n.nodeValue = out;
        o += x.t.length;
      }
      if (k < 1) requestAnimationFrame(tick); else nodes.forEach((x) => (x.n.nodeValue = x.t));
    };
    requestAnimationFrame(tick);
  }
  $$('.tag, .card-h > span:first-child, .panel-k, .mk').forEach((el) => {
    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    inView(el, () => scramble(el), '0px 0px -6% 0px');
  });

  /* ── títulos de sección: palabra por palabra, desde abajo ── */
  $$('.head h2, .how-h').forEach((h) => {
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--d:${i * 55}ms">${w}</span></span>`).join(' ');
    h.classList.add('split');
    inView(h, () => h.classList.add('in'), '0px 0px -10% 0px');
  });
  // subtítulos, marcas de corte y bloques de la portada
  $$('.head').forEach((el) => inView(el, () => el.classList.add('in'), '0px 0px -10% 0px'));

  /* ── tarjetas: barra de título que se recorre y la imagen que se descubre ── */
  $$('.card, .panel, .titleblock, .facts, .chain, .exts').forEach((el) => {
    el.classList.add('mv');
    inView(el, () => el.classList.add('in'), '0px 0px -8% 0px');
  });

  /* ── mosaico de la portada: rastro del puntero y paquetes que cruzan una fila ── */
  const mosaic = $('#mosaic');
  if (mosaic) {
    const cells = [...mosaic.children];
    const cols = Math.max(1, Math.round(mosaic.clientWidth / 36));
    const rows = Math.ceil(cells.length / cols);
    let heroOn = true;
    if (IO) new IntersectionObserver((es) => (heroOn = es[0].isIntersecting)).observe(cover);
    const hot = (el, ms = 900) => { if (!el) return; el.classList.add('hot'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('hot'), ms); };
    cover.addEventListener('pointermove', (e) => {
      const r = mosaic.getBoundingClientRect();
      const x = Math.floor((e.clientX - r.left) / 36), y = Math.floor((e.clientY - r.top) / 36);
      if (y < 0 || y >= rows || x < 0 || x >= cols) return;
      hot(cells[y * cols + x]);
    });
    const sweep = () => {
      if (heroOn && !document.hidden) {
        const row = (Math.random() * Math.min(rows, 6)) | 0, dir = Math.random() < 0.5;
        for (let i = 0; i < cols; i++) setTimeout(() => hot(cells[row * cols + (dir ? i : cols - 1 - i)], 420), i * 32);
      }
      setTimeout(sweep, 2400 + Math.random() * 1600);
    };
    setTimeout(sweep, 1400);
  }

  /* ── plano: las salas se dibujan, las bocas aparecen y un paquete recorre la fibra ── */
  const plan = $('#plan');
  if (plan) {
    $$('.rm', plan).forEach((r, i) => { r.setAttribute('pathLength', '1'); r.style.setProperty('--d', `${i * 60}ms`); });
    $$('.jk', plan).forEach((c, i) => c.style.setProperty('--d', `${500 + i * 35}ms`));
    const d = 'M' + FIBER_ROUTE.map(([x, z]) => `${x * 10} ${z * 10}`).join(' L');
    plan.insertAdjacentHTML('beforeend', `<path id="fbpath" d="${d}" fill="none" stroke="none"/><rect class="pkt" x="-1.6" y="-1.6" width="3.2" height="3.2"><animateMotion dur="3.2s" repeatCount="indefinite" rotate="0" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"><mpath href="#fbpath"/></animateMotion></rect>`);
    inView(plan, () => plan.classList.add('in'));
  }

  /* ── VLANs: filas en cascada ── */
  $$('#vlans tbody tr').forEach((tr, i) => tr.style.setProperty('--i', i));
  inView($('#vlans'), () => $('#vlans').classList.add('in'));

  /* ── internos: una llamada a la vez pasa por la central ── */
  const exts = [...$$('#exts .ext:not(.pbx)')], pbx = $('#exts .pbx');
  if (exts.length) {
    let on = false, a = 0;
    if (IO) new IntersectionObserver((es) => (on = es[0].isIntersecting)).observe($('#exts'));
    setInterval(() => {
      if (!on || document.hidden) return;
      exts.forEach((e) => e.classList.remove('ring', 'talk'));
      const from = exts[a % exts.length], to = exts[(a * 3 + 2) % exts.length];
      a++;
      if (from === to) return;
      from.classList.add('ring'); pbx.classList.add('flash');
      setTimeout(() => { to.classList.add('talk'); pbx.classList.remove('flash'); }, 600);
    }, 1900);
  }

  /* ── preguntas: abren con altura animada ── */
  $$('.qa details').forEach((d) => {
    const s = $('summary', d), p = $('p', d);
    s.addEventListener('click', (e) => {
      e.preventDefault();
      if (d.open) {
        const a = p.animate([{ height: p.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)' });
        a.onfinish = () => (d.open = false);
      } else {
        d.open = true;
        p.animate([{ height: '0px', opacity: 0 }, { height: p.offsetHeight + 'px', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    });
  });
}

/* ── cinta con los equipos reales del presupuesto ── */
function ticker(DEVICES, BUDGET) {
  const el = $('#ticker');
  if (!el) return;
  const items = [
    `${DEVICES.ER605.model} · dual WAN · VPN`,
    `SW1 ${DEVICES.SW1.model} · 24 PoE+ · 4 SFP`,
    `SW2 ${DEVICES.SW2.model} · 8 PoE+ · 2 SFP`,
    'Fibra monomodo LC · 30 m',
    '2 × EAP650 · Wi-Fi 6 PoE+',
    '2 × NAS DS223j · discos 4 TB CMR',
    '7 × Grandstream GRP2602P',
    'Issabel 5 · mini PC N4505',
    '3 UPS',
    '23 bocas Cat6 · T568B',
    'R1 12U · R2 6U',
    `Total ${'$' + Math.round(BUDGET.grandTotal).toLocaleString('es-AR')}`,
  ];
  const run = items.map((t) => `<span>${t}</span><i></i>`).join('');
  el.innerHTML = run + run; // dos copias: el bucle no tiene salto
}
