// Laboratorio de red: bloques (alto nivel), consola (bajo nivel), topología en vivo y
// misiones. Se abre con bus.emit('lab:open', {device, mission, tab}).
import './lab.css';
import { bus } from '../core/bus.js';
import { sim, ENDPOINTS } from '../sim/network.js';
import { VLANS, FIBER_COLOR } from '../data/tp.js';
import { createBlocks, escapeHtml } from './blocks.js';
import { createSession, suggest, tabComplete, CONSOLE_DEVICES } from './console.js';
import { createTopology } from './topology.js';
import { missions, MISSIONS, mountMissionTracker, missionArt, missionBadge, missionNpc } from './missions.js';
import * as G from '../world/genassets.js';
import { createTaller } from './taller.js';

export { mountMissionTracker, missions, sim };

const TABS = [
  { id: 'blocks', name: 'Bloques', icon: '<svg viewBox="0 0 24 24"><path d="M4 5h7l1 1.5h8v4H12l-1 1.5H4z M4 14h10l1 1.5h5v3.5H4z" fill="currentColor"/></svg>' },
  { id: 'console', name: 'Consola', icon: '<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z" fill="none" stroke="currentColor" stroke-width="1.8" rx="2"/><path d="M7 9l3 3-3 3M12 15h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' },
  { id: 'topo', name: 'Topología', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2.4" fill="currentColor"/><circle cx="5" cy="18" r="2.4" fill="currentColor"/><circle cx="19" cy="18" r="2.4" fill="currentColor"/><path d="M12 7.5v4M12 11.5L5 15.5M12 11.5l7 4" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>' },
  { id: 'taller', name: 'Taller', icon: '<svg viewBox="0 0 24 24"><path d="M7 3h10v7l-2 2v3H9v-3l-2-2z M10 15v6M14 15v6M10 6v2M12 6v2M14 6v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>' },
  { id: 'missions', name: 'Misiones', icon: '<svg viewBox="0 0 24 24"><path d="M5 4v17M5 5h11l-2 3.5 2 3.5H5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>' },
];

let api = null;

export function initLab() {
  if (api) return api;
  missions.init();
  const root = document.createElement('div');
  root.className = 'lab';
  // ilustración para los estados vacíos (resultado sin ejecutar)
  G.loadGenManifest().then(() => { if (G.has('ui_empty_lab')) { root.style.setProperty('--empty-lab', G.cssUrl('ui_empty_lab')); root.classList.add('has-empty-img'); } });
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Laboratorio de red');
  root.innerHTML = `
    <div class="lab-panel glass">
      <header class="lab-head">
        <div class="lab-brand">
          <div class="lab-logo"><svg viewBox="0 0 24 24"><rect x="3" y="13" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg></div>
          <div><div class="lab-title">Laboratorio</div><div class="lab-sub">Simulación basada en el TP</div></div>
        </div>
        <div class="lab-status"></div>
        <button class="lab-close btn" aria-label="Volver a la oficina" title="Volver a la oficina (Esc)">Volver a la oficina</button>
      </header>
      <nav class="lab-tabs" role="tablist">${TABS.map((t) => `<button role="tab" data-tab="${t.id}">${t.icon}<span>${t.name}</span></button>`).join('')}</nav>
      <div class="lab-views">
        <div class="lab-view" data-view="blocks"></div>
        <div class="lab-view" data-view="console"></div>
        <div class="lab-view" data-view="topo"></div>
        <div class="lab-view" data-view="taller"></div>
        <div class="lab-view" data-view="missions"></div>
      </div>
    </div>`;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);

  // aislar el teclado del juego
  for (const ev of ['keydown', 'keyup', 'keypress']) root.addEventListener(ev, (e) => {
    if (ev === 'keydown' && e.key === 'Escape') { e.preventDefault(); close(); }
    e.stopPropagation();
  });
  for (const ev of ['pointerdown', 'wheel', 'touchstart']) root.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });

  // ── estado global ──
  const status = $('.lab-status');
  const paintStatus = () => {
    const w = sim.activeWan();
    const minB = Math.min(sim.battery.R1, sim.battery.R2);
    status.innerHTML = `
      <span class="chip ${w ? (w === 'claro' ? 'ok' : 'warn') : 'bad'}" title="Internet"><i class="dot"></i>${w ? (w === 'claro' ? 'Claro · principal' : 'Personal · respaldo') : 'Sin internet'}</span>
      <span class="chip ${sim.mains ? 'ok' : minB > 0 ? 'warn' : 'bad'}" title="Energía"><i class="dot"></i>${sim.mains ? 'Energía OK' : minB > 0 ? `UPS ${Math.round(minB)}% · ~${sim.batteryMinutes('R1')} min` : 'UPS agotadas'}</span>
      ${sim.faults.size ? '<span class="chip bad"><i class="dot"></i>Falla activa</span>' : ''}`;
  };
  paintStatus();
  bus.on('sim:change', paintStatus);

  // ── vistas ──
  const blocks = createBlocks();
  $('[data-view="blocks"]').appendChild(blocks.el);
  const con = buildConsole();
  $('[data-view="console"]').appendChild(con.el);
  const topoView = buildTopoView((id) => {
    if (createSession(id)) { con.select(id); show('console'); }
  });
  $('[data-view="topo"]').appendChild(topoView);
  const mis = buildMissions(blocks, (tab) => show(tab));
  $('[data-view="missions"]').appendChild(mis.el);
  $('[data-view="taller"]').appendChild(createTaller().el);
  // con una misión activa, la paleta muestra primero solo los bloques que hacen falta
  const syncFocus = () => blocks.setFocus?.(missions.current?.preset?.map((p) => p.type) || null);
  for (const ev of ['mission:start', 'mission:update', 'mission:done']) bus.on(ev, syncFocus);
  syncFocus();

  let current = 'blocks';
  function show(tab) {
    current = tab;
    root.querySelectorAll('.lab-tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === tab));
    root.querySelectorAll('.lab-view').forEach((v) => v.classList.toggle('on', v.dataset.view === tab));
    try { localStorage.setItem('alvarez.lab.tab', tab); } catch {}
    if (tab === 'console') setTimeout(() => con.focus(), 50);
    if (tab === 'missions') mis.render();
    if (tab === 'topo') requestAnimationFrame(() => { const st = topoView.querySelector('.tp-stage'); if (st.scrollWidth > st.clientWidth) st.scrollLeft = (st.scrollWidth - st.clientWidth) * 0.3; });
  }
  root.querySelectorAll('.lab-tabs button').forEach((b) => (b.onclick = () => show(b.dataset.tab)));
  try { show(localStorage.getItem('alvarez.lab.tab') || 'missions'); } catch { show('missions'); }

  function open({ device, mission, tab } = {}) {
    document.exitPointerLock?.();
    root.classList.add('open');
    document.body.classList.add('lab-open');
    if (device && createSession(device)) { con.select(device); show('console'); }
    else if (mission) { mis.select(mission); show('missions'); }
    else if (tab) show(tab);
    else show(current);
  }
  function close() {
    if (!root.classList.contains('open')) return;
    root.classList.remove('open');
    document.body.classList.remove('lab-open');
    bus.emit('lab:close', {});
  }
  $('.lab-close').onclick = close;
  bus.on('lab:open', (d) => open(d || {}));
  bus.on('lab:hide', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('open') && !root.contains(document.activeElement)) close();
  });

  api = { open, close, isOpen: () => root.classList.contains('open'), el: root };
  return api;
}

// ───────────────────────── Consola ─────────────────────────
function buildConsole() {
  const el = document.createElement('div');
  el.className = 'cn';
  el.innerHTML = `
    <div class="cn-devs scroll">${CONSOLE_DEVICES.map((g) => `<div class="cn-g"><div class="cn-gh">${g.group}</div><div class="cn-gl">${g.ids.map((id) => `<button class="cn-dev" data-id="${id}"><i class="dot"></i>${id}</button>`).join('')}</div></div>`).join('')}</div>
    <div class="cn-term">
      <div class="cn-titlebar"><span class="cn-lights"><i></i><i></i><i></i></span><span class="cn-title"></span><button class="btn sm ghost cn-clear" title="Limpiar">Limpiar</button></div>
      <div class="cn-out scroll selectable" tabindex="0"></div>
      <form class="cn-in" autocomplete="off"><span class="cn-prompt"></span><input class="cn-input" spellcheck="false" autocapitalize="off" autocorrect="off" enterkeyhint="send" aria-label="Comando"/><button class="cn-tab btn sm" type="button" title="Autocompletar (Tab)">Tab ⇥</button></form>
      <div class="cn-sugg"></div>
      <div class="cn-quick"><span class="tiny">Probá:</span></div>
    </div>`;
  const $ = (s) => el.querySelector(s);
  const outEl = $('.cn-out'), input = $('.cn-input'), promptEl = $('.cn-prompt'), sugg = $('.cn-sugg'), quick = $('.cn-quick');
  const sessions = {};
  let cur = null;
  let busy = false;

  function state(id) {
    if (!sessions[id]) {
      const s = createSession(id);
      sessions[id] = { s, lines: [], hist: [], hi: 0 };
      const st = sessions[id];
      for (const b of s.banner) st.lines.push({ t: b, c: 'dim' });
      if (s.initial) st.lines.push({ t: s.initial(), c: '' });
    }
    return sessions[id];
  }
  function paintDevs() {
    el.querySelectorAll('.cn-dev').forEach((b) => {
      const id = b.dataset.id;
      const up = ['SW1', 'SW2', 'ER605', 'NAS1', 'PBX'].includes(id) || ENDPOINTS[id] ? sim.isUp(id) : true;
      b.classList.toggle('down', !up);
      b.classList.toggle('on', id === cur);
    });
  }
  function paint() {
    const st = state(cur);
    $('.cn-title').textContent = st.s.title;
    el.dataset.kind = st.s.kind;
    outEl.innerHTML = st.lines.map((l) => `<div class="cl ${l.c}">${escapeHtml(l.t)}</div>`).join('');
    outEl.scrollTop = outEl.scrollHeight;
    promptEl.textContent = st.s.prompt();
    quick.innerHTML = '<span class="tiny">Probá:</span>' + st.s.quick().map((q) => `<button class="qk" type="button">${escapeHtml(q)}</button>`).join('');
    paintSugg();
    paintDevs();
  }
  function paintSugg() {
    const st = state(cur);
    const opts = suggest(st.s, input.value);
    sugg.innerHTML = opts.map((o) => `<button type="button" class="sg${o.startsWith('<') ? ' ph' : ''}">${escapeHtml(o)}</button>`).join('');
  }
  function select(id) {
    cur = id;
    paint();
  }
  async function exec(line) {
    if (busy) return;
    const st = state(cur);
    st.lines.push({ t: `${st.s.prompt()} ${line}`, c: 'cmd' });
    if (line.trim()) { st.hist.push(line); st.hi = st.hist.length; }
    input.value = '';
    paint();
    busy = true;
    el.classList.add('busy');
    const id = cur;
    await st.s.exec(line, (text, opt = {}) => {
      if (opt.clear) { st.lines = []; return; }
      if (text != null && text !== '') st.lines.push({ t: text, c: opt.ok === false ? 'err' : opt.ok === true ? 'good' : '' });
    });
    if ((id === 'SW2') && /show (vlan|run|interface)/.test(line)) missions.markManual('cli-look');
    busy = false;
    el.classList.remove('busy');
    if (cur === id) paint();
    input.focus({ preventScroll: true });
  }
  $('.cn-in').addEventListener('submit', (e) => { e.preventDefault(); exec(input.value); });
  input.addEventListener('keydown', (e) => {
    const st = state(cur);
    if (e.key === 'Tab') {
      e.preventDefault();
      doTab();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (st.hi > 0) { st.hi--; input.value = st.hist[st.hi] || ''; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (st.hi < st.hist.length) { st.hi++; input.value = st.hist[st.hi] || ''; }
    } else if (e.key === '?' ) {
      e.preventDefault();
      const opts = suggest(st.s, input.value.endsWith(' ') || !input.value ? input.value : input.value + ' ');
      st.lines.push({ t: `${st.s.prompt()} ${input.value}?`, c: 'cmd' }, { t: opts.length ? opts.join('   ') : '<cr>', c: 'dim' });
      const v = input.value;
      paint();
      input.value = v;
    }
  });
  function doTab() {
    const st = state(cur);
    const r = tabComplete(st.s, input.value);
    input.value = r.line;
    if (r.opts.length > 1) {
      st.lines.push({ t: r.opts.join('   '), c: 'dim' });
      const v = input.value;
      paint();
      input.value = v;
    }
    paintSugg();
    input.focus();
  }
  $('.cn-tab').onclick = doTab;
  input.addEventListener('input', paintSugg);
  sugg.addEventListener('click', (e) => {
    const b = e.target.closest('.sg');
    if (!b || b.classList.contains('ph')) return;
    const v = input.value;
    const i = /\s$/.test(v) || !v ? v.length : v.lastIndexOf(' ') + 1;
    input.value = v.slice(0, i) + b.textContent + ' ';
    paintSugg();
    input.focus();
  });
  quick.addEventListener('click', (e) => {
    const b = e.target.closest('.qk');
    if (b) exec(b.textContent);
  });
  el.querySelectorAll('.cn-dev').forEach((b) => (b.onclick = () => select(b.dataset.id)));
  $('.cn-clear').onclick = () => { state(cur).lines = []; paint(); };
  bus.on('sim:change', () => { if (el.isConnected) paintDevs(); });
  select('PC03');
  return { el, select, focus: () => input.focus({ preventScroll: true }) };
}

// ───────────────────────── Topología ─────────────────────────
function buildTopoView(onNode) {
  const el = document.createElement('div');
  el.className = 'tp';
  el.innerHTML = `
    <div class="tp-bar">
      <button class="btn sm" data-a="ping">Ping PC03 → NAS1</button>
      <button class="btn sm" data-a="visit">Visita → NAS1</button>
      <button class="btn sm" data-a="claro"></button>
      <button class="btn sm" data-a="power"></button>
      <span class="bk-grow"></span>
      <button class="btn sm ghost" data-a="reset">Restablecer red</button>
    </div>
    <div class="tp-stage"></div>
    <div class="tp-legend">
      ${[20, 30, 40, 60, 50, 10].map((v) => `<span><i style="background:${VLANS[v].color}"></i>VLAN${v} ${VLANS[v].name}</span>`).join('')}
      <span><i style="background:${FIBER_COLOR}"></i>Fibra</span>
      <span><i class="dash"></i>Apagado / caído</span>
      <span class="tiny">Tocá un equipo para ver y configurarlo</span>
    </div>`;
  const topo = createTopology({ onNode });
  el.querySelector('.tp-stage').appendChild(topo.el);
  const btn = (a) => el.querySelector(`[data-a="${a}"]`);
  const paint = () => {
    btn('claro').textContent = sim.wan.claro ? 'Cortar Claro' : 'Restaurar Claro';
    btn('power').textContent = sim.mains ? 'Cortar energía' : 'Restaurar energía';
  };
  paint();
  bus.on('sim:change', paint);
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'ping') { b.disabled = true; await sim.ping('PC03', 'NAS1', { count: 1 }); b.disabled = false; }
    if (a === 'visit') {
      b.disabled = true;
      if (!sim.wifi.VISITA) await sim.wifiJoin('VISITA', 'AP1', 'Visitas');
      const r = await sim.ping('VISITA', 'NAS1', { count: 1 });
      bus.emit('toast', { text: r.ok ? 'La visita llegó al NAS' : 'Bloqueado: la red de Visitas solo sale a internet', kind: r.ok ? 'bad' : 'ok' });
      b.disabled = false;
    }
    if (a === 'claro') {
      const r = sim.setWan('claro', !sim.wan.claro);
      if (r.note) bus.emit('toast', { text: r.note, kind: 'info' });
    }
    if (a === 'power') sim.setPower(!sim.mains);
    if (a === 'reset') sim.reset();
  });
  return el;
}

// ───────────────────────── Misiones ─────────────────────────
function buildMissions(blocks, showTab) {
  const el = document.createElement('div');
  el.className = 'ms';
  let sel = missions.current?.id || MISSIONS.find((m) => !missions.done.has(m.id))?.id || MISSIONS[0].id;
  function render() {
    const doneN = missions.done.size;
    const m = MISSIONS.find((x) => x.id === sel);
    const st = missions.status(m.id);
    const steps = st === 'active' ? missions.steps : m.steps.map(() => st === 'done');
    const curI = steps.findIndex((s) => !s);
    el.innerHTML = `
      <div class="ms-list scroll">
        <div class="ms-prog"><div class="ms-prog-t"><b>${doneN}</b> de ${MISSIONS.length} misiones</div><div class="ms-bar"><i style="width:${(doneN / MISSIONS.length) * 100}%"></i></div></div>
        ${MISSIONS.map((x, i) => {
          const s = missions.status(x.id);
          return `<button class="ms-item ${x.id === sel ? 'sel' : ''} ${s}" data-id="${x.id}">
            ${missionBadge(x.id) ? `<img class="ms-bdg ${s === 'done' ? 'got' : ''}" src="${missionBadge(x.id)}" alt="${s === 'done' ? 'Insignia obtenida' : 'Insignia pendiente'}">` : `<span class="ms-num">${s === 'done' ? '✓' : i + 1}</span>`}
            <span class="ms-txt"><span class="ms-tag">${x.tag} · ${x.time}</span><span class="ms-name">${x.title}</span></span>
            ${s === 'active' ? '<span class="ms-live">en curso</span>' : ''}
          </button>`;
        }).join('')}
        <button class="btn sm ghost ms-resetall">Reiniciar progreso</button>
      </div>
      <div class="ms-detail scroll">
        ${missionArt(m.id) ? `<figure class="ms-art"><img src="${missionArt(m.id)}" alt="" decoding="async">${st === 'done' && missionBadge(m.id) ? `<img class="ms-art-badge" src="${missionBadge(m.id)}" alt="Insignia obtenida">` : ''}</figure>` : ''}
        <div class="ms-d-tag">${m.tag} · ${m.time}</div>
        <h2>${m.title}</h2>
        ${(() => { const n = missionNpc(m.id); return n ? `<div class="ms-ticket"><img src="${n.img}" alt=""><div><div class="ms-who"><b>${n.name}</b> · ${n.role}</div><p class="ms-story">${m.story}</p></div></div>` : `<p class="ms-story">${m.story}</p>`; })()}
        <ol class="ms-steps">
          ${m.steps.map((s, i) => `<li class="${steps[i] ? 'ok' : st === 'active' && i === curI ? 'cur' : ''}">
            <span class="ms-ck">${steps[i] ? '✓' : i + 1}</span>
            <div><div>${s.text}</div>${st === 'active' && i === curI ? `<div class="ms-hint">Pista: ${s.hint}</div>` : ''}</div></li>`).join('')}
        </ol>
        <div class="ms-actions">
          ${st === 'active'
            ? `${m.preset ? '<button class="btn primary" data-a="preset">Cargar bloques sugeridos</button>' : ''}<button class="btn" data-a="close">Volver a la oficina</button><button class="btn ghost" data-a="abandon">Abandonar</button>`
            : `<button class="btn primary" data-a="start">${st === 'done' ? 'Repetir misión' : 'Empezar misión'}</button>`}
        </div>
        ${st === 'done' ? `<div class="ms-learn"><div class="ms-learn-h">Qué aprendiste · según el TP</div><p>${m.learned}</p></div>` : `<div class="ms-learn dim"><div class="ms-learn-h">Al terminar</div><p>Vas a ver qué dice el TP sobre esto.</p></div>`}
      </div>`;
  }
  el.addEventListener('click', (e) => {
    const it = e.target.closest('.ms-item');
    if (it) { sel = it.dataset.id; render(); return; }
    const b = e.target.closest('[data-a], .ms-resetall');
    if (!b) return;
    const m = MISSIONS.find((x) => x.id === sel);
    if (b.classList.contains('ms-resetall')) { missions.resetProgress(); render(); return; }
    const a = b.dataset.a;
    if (a === 'start') {
      missions.start(m.id);
      if (m.preset) { blocks.load(m.preset); }
      render();
      if (['recorrido', 'cable-pc03'].includes(m.id)) bus.emit('toast', { text: 'Cerrá el laboratorio y recorré la oficina (WASD)', kind: 'info' });
    } else if (a === 'preset') { blocks.load(m.preset); showTab('blocks'); }
    else if (a === 'abandon') { missions.abandon(); render(); }
    else if (a === 'close') bus.emit('lab:hide', {});
  });
  bus.on('mission:update', () => { if (el.isConnected) render(); });
  bus.on('mission:done', ({ id }) => { sel = id; });
  render();
  G.loadGenManifest().then(render);
  return { el, render, select: (id) => { sel = id; render(); } };
}
