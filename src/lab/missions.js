// Misiones educativas (estilo "ticket de soporte"): cada una tiene historia, pasos
// verificados por eventos del mundo y del simulador, pistas y "Qué aprendiste"
// ligado al texto del TP.
import { bus } from '../core/bus.js';
import { sim } from '../sim/network.js';
import { TEXT, OUTLETS } from '../data/tp.js';
import * as G from '../world/genassets.js';
G.loadGenManifest();

const KEY = 'alvarez.missions.v1';
const o3 = OUTLETS.find((o) => o.dev === 'PC03');

// preset: bloques sugeridos que se cargan en el editor (ver blocks.js para los tipos)
export const MISSIONS = [
  {
    id: 'recorrido',
    tag: 'Exploración',
    title: 'Primer día en el estudio',
    time: '2 min',
    story: 'Arrancás como técnico de soporte en Alvarez & Asoc. Lo primero: saber dónde está el corazón de la red.',
    steps: [
      { text: 'Entrá a la sala técnica', hint: 'Está abajo a la derecha del plano, al lado de la sala de reunión. Abrí el plano con M.', on: 'room', test: (d) => d.id === 'tecnica' },
      { text: 'Inspeccioná el switch SW1 en el rack R1 (tecla E)', hint: 'Acercate al rack R1 y apuntá al switch: es la unidad 10, debajo del panel PP1.', on: 'inspect', test: (d) => /^SW1\b|^SW1\//.test(d.id || '') || d.id === 'SW1' },
    ],
    learned: `${TEXT.gabinetes} SW1 (TL-SG2428P) conecta recepción, boxes, gerencia y sala técnica.`,
  },
  {
    id: 'cable-pc03',
    tag: 'Cableado',
    title: 'Seguí el cable de PC03',
    time: '2 min',
    story: 'Juan Manuel rotuló todas las bocas. Verificá que el código de la boca de PC03 coincide en la pared y en el rack.',
    steps: [
      { text: 'Inspeccioná PC03 en el Box 2', hint: 'Box 2 está en la fila de arriba, a la derecha del pasillo de boxes.', on: 'inspect', test: (d) => d.id === 'PC03' },
      { text: 'Mostrá el recorrido del cable hasta el rack', hint: 'En la ficha del equipo tocá "Ver recorrido hasta el rack".', on: 'route:show', test: (d) => d.dev === 'PC03' },
    ],
    learned: `La boca ${o3.label} va al puerto SW1/${o3.port} (VLAN ${o3.vlan}, ${o3.ip}) con ${o3.m} m de cable. ${TEXT.tendido[2].split('.')[0]}.`,
  },
  {
    id: 'ping-nas',
    tag: 'Pruebas',
    title: '¿Llega PC03 al NAS?',
    time: '2 min',
    story: 'Una contadora del Box 2 dice que no sabe si llega a las carpetas compartidas. Probalo.',
    steps: [{ text: 'Hacé ping desde PC03 a NAS1 y que responda', hint: 'Usá el bloque "hacer ping desde PC03 a NAS1" o en la Consola de PC03: ping 10.10.30.10', on: 'sim:result', test: (d) => d.op === 'ping' && d.src === 'PC03' && (d.dst === 'NAS1' || d.dstIp === '10.10.30.10') && d.ok }],
    preset: [{ type: 'ping', f: { src: 'PC03', dst: 'NAS1' } }],
    learned: 'PC03 está en la VLAN 20 (Personal) y NAS1 en la VLAN 30 (Archivos). Están en redes distintas: el paquete sube por SW1/17 al ER605, que es la puerta de enlace .1 de cada VLAN, y vuelve a bajar hacia el NAS.',
  },
  {
    id: 'visitas',
    tag: 'Seguridad',
    title: 'Visitas aisladas',
    time: '3 min',
    story: 'Llega un cliente y pide el Wi-Fi. El estudio maneja datos contables: comprobá que desde la red de visitas no se ve nada interno.',
    steps: [
      { text: 'Conectá el celular de la visita al Wi-Fi "Visitas"', hint: 'Bloque "conectar visita al Wi-Fi AP1 red Visitas".', on: 'sim:result', test: (d) => d.op === 'wifi' && d.id === 'VISITA' && d.ok },
      { text: 'Comprobá que la visita NO llega a NAS1', hint: 'Ping desde VISITA a NAS1: tiene que fallar.', on: 'sim:result', test: (d) => d.op === 'ping' && d.src === 'VISITA' && d.dst === 'NAS1' && !d.ok },
      { text: 'Comprobá que la visita SÍ sale a internet', hint: 'Ping desde VISITA a INTERNET.', on: 'sim:result', test: (d) => d.op === 'ping' && d.src === 'VISITA' && (d.dst === 'INTERNET') && d.ok },
    ],
    preset: [
      { type: 'wifi', f: { who: 'VISITA', ap: 'AP1', ssid: 'Visitas' } },
      { type: 'ping', f: { src: 'VISITA', dst: 'NAS1' } },
      { type: 'ping', f: { src: 'VISITA', dst: 'INTERNET' } },
    ],
    learned: TEXT.config[1],
  },
  {
    id: 'claro',
    tag: 'Incidente',
    title: 'Se cayó Claro',
    time: '2 min',
    story: 'Claro tiene un corte en la zona. El estudio no puede quedarse sin internet en pleno vencimiento.',
    steps: [
      { text: 'Cortá el internet de Claro', hint: 'Bloque "cortar internet de Claro".', on: 'sim:change', test: (d) => d.state && d.state.wan.claro === false },
      { text: 'Comprobá que hay internet por Personal', hint: 'Ping desde cualquier PC a INTERNET con Claro caído.', on: 'sim:result', test: (d) => d.op === 'ping' && d.dst === 'INTERNET' && d.ok && d.via === 'personal' },
      { text: 'Restaurá Claro', hint: 'Bloque "restaurar internet de Claro".', on: 'sim:change', test: (d) => d.state && d.state.wan.claro === true && d.state.wan.active === 'claro' },
    ],
    preset: [
      { type: 'wan', f: { act: 'cortar', isp: 'claro' } },
      { type: 'ping', f: { src: 'PC01', dst: 'INTERNET' } },
      { type: 'wan', f: { act: 'restaurar', isp: 'claro' } },
    ],
    learned: TEXT.equipos[0],
  },
  {
    id: 'ticket-pc09',
    tag: 'Ticket #0451',
    title: '"PC09 no tiene red"',
    time: '5 min',
    story: 'Ticket de Escritorio 3: "desde ayer no abro las carpetas ni internet". Alguien tocó la configuración de SW2. Diagnosticá y arreglalo sin cambiar el diseño del TP.',
    setup: () => sim.injectFault('pc09-wrong-pvid'),
    teardown: () => sim.clearFaults(),
    steps: [
      { text: 'Reproducí el problema: ping desde PC09 a NAS1', hint: 'Va a fallar. Mirá el motivo en el resultado.', on: 'sim:result', test: (d) => d.op === 'ping' && d.src === 'PC09' && !d.ok },
      { text: 'Revisá el puerto de PC09 en SW2 (tabla de bocas: PP2-03 → SW2/3)', hint: 'Consola de SW2: enable → show vlan, o show running-config interface gigabitEthernet 1/0/3.', on: 'sim:change', test: () => false, manual: 'cli-look' },
      { text: 'Corregí SW2/3 a la VLAN 20 (Personal)', hint: 'Bloque "configurar puerto SW2/3 VLAN 20", o en la CLI: interface gigabitEthernet 1/0/3 → switchport general allowed vlan 20 untagged → switchport pvid 20.', on: 'sim:change', test: (d) => d.state && d.state.ports.SW2[3].pvid === 20 && d.state.ports.SW2[3].untagged.includes(20) },
      { text: 'Verificá: ping desde PC09 a NAS1 funciona', hint: 'Repetí el ping.', on: 'sim:result', test: (d) => d.op === 'ping' && d.src === 'PC09' && d.ok },
    ],
    preset: [
      { type: 'ping', f: { src: 'PC09', dst: 'NAS1' } },
      { type: 'port', f: { sw: 'SW2', port: '3', vlan: '20' } },
      { type: 'ping', f: { src: 'PC09', dst: 'NAS1' } },
    ],
    learned: 'Según la tabla de la p.6, PP2-03 va a SW2/3 con PC09 en la VLAN 20 (10.10.20.109). Si el puerto queda en otra VLAN, la PC ni siquiera encuentra su puerta de enlace 10.10.20.1: por eso el TP pide guardar una copia de la configuración.',
  },
  {
    id: 'corte-luz',
    tag: 'Incidente',
    title: 'Corte de luz',
    time: '3 min',
    story: 'Se corta la luz en todo el edificio. ¿Qué sigue funcionando gracias a las tres UPS?',
    steps: [
      { text: 'Cortá la energía', hint: 'Bloque "cortar energía".', on: 'sim:change', test: (d) => d.state && d.state.mains === false },
      { text: 'Llamá del interno 101 al 106 durante el corte', hint: 'Los teléfonos se alimentan por PoE desde SW1, que está en el rack R1 con UPS.', on: 'sim:result', test: (d) => d.op === 'call' && d.ok && !sim.mains },
      { text: 'Comprobá que PC01 se apagó (no tiene UPS)', hint: 'Ping desde PC01 a NAS1: no sale.', on: 'sim:result', test: (d) => d.op === 'ping' && d.src === 'PC01' && !d.ok && !sim.mains },
      { text: 'Restaurá la energía', hint: 'Bloque "restaurar energía".', on: 'sim:change', test: (d) => d.state && d.state.mains === true },
    ],
    preset: [
      { type: 'power', f: { act: 'cortar' } },
      { type: 'call', f: { a: '101', b: '106' } },
      { type: 'ping', f: { src: 'PC01', dst: 'NAS1' } },
      { type: 'power', f: { act: 'restaurar' } },
    ],
    learned: `${TEXT.tendido[2].split('. ').slice(-1)[0]} En la simulación, R1 (SW1, ER605, NAS1, central), R2 (SW2) y NAS2 siguen con batería; los teléfonos y Wi-Fi viven del PoE de los switches. Las PCs e impresoras se apagan.`,
  },
  {
    id: 'backup',
    tag: 'Datos',
    title: 'Copia y restauración',
    time: '3 min',
    story: 'Gerencia borró sin querer el balance 2026. Tranquilos: para eso está el plan de copias.',
    steps: [
      { text: 'Hacé la copia de seguridad (NAS1 → NAS2 y Backblaze B2)', hint: 'Bloque "hacer copia de seguridad".', on: 'sim:result', test: (d) => d.op === 'backup' && d.ok },
      { text: 'Borrá balance_2026.xlsx de NAS1', hint: 'Bloque "borrar archivo balance_2026.xlsx".', on: 'sim:result', test: (d) => d.op === 'delete' && d.file === 'balance_2026.xlsx' },
      { text: 'Restauralo desde las copias', hint: 'Bloque "restaurar archivo balance_2026.xlsx".', on: 'sim:result', test: (d) => d.op === 'restore' && d.ok },
    ],
    preset: [
      { type: 'backup', f: {} },
      { type: 'file', f: { act: 'borrar', file: 'balance_2026.xlsx' } },
      { type: 'file', f: { act: 'restaurar', file: 'balance_2026.xlsx' } },
    ],
    learned: TEXT.archivos[0],
  },
];

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}
function save(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

class MissionEngine {
  constructor() {
    const s = load();
    this.done = new Set(s.done || []);
    this.current = null;
    this.steps = [];
    this._wired = false;
  }
  init() {
    if (this._wired) return;
    this._wired = true;
    for (const ev of ['inspect', 'room', 'route:show', 'sim:result', 'sim:change']) bus.on(ev, (d) => this._event(ev, d));
    const s = load();
    if (s.current && MISSIONS.find((m) => m.id === s.current)) {
      // retomar sin re-inyectar fallas que ya se resolvieron
      this.current = MISSIONS.find((m) => m.id === s.current);
      this.steps = s.steps || this.current.steps.map(() => false);
      if (this.current.setup && !this.steps.every(Boolean)) {
        const idx = this.current.steps.findIndex((st) => st.on === 'sim:change' && st.text.startsWith('Corregí'));
        if (idx < 0 || !this.steps[idx]) this.current.setup();
      }
    }
  }
  get(id) {
    return MISSIONS.find((m) => m.id === id);
  }
  status(id) {
    if (this.current?.id === id) return 'active';
    return this.done.has(id) ? 'done' : 'todo';
  }
  start(id) {
    if (this.current?.teardown) this.current.teardown();
    const m = this.get(id);
    sim.hangupAll?.();
    sim.reset();
    this.current = m;
    this.steps = m.steps.map(() => false);
    m.setup?.();
    this._persist();
    bus.emit('mission:start', { id });
    this._notify();
  }
  abandon() {
    if (this.current?.teardown) this.current.teardown();
    this.current = null;
    this.steps = [];
    this._persist();
    this._notify();
  }
  next() {
    return MISSIONS.find((m) => !this.done.has(m.id) && m.id !== this.current?.id);
  }
  markManual(tag) {
    if (!this.current) return;
    this.current.steps.forEach((st, i) => {
      if (st.manual === tag && !this.steps[i] && this.steps.slice(0, i).every(Boolean)) this.steps[i] = true;
    });
    this._check();
  }
  _event(ev, d) {
    if (!this.current) return;
    const m = this.current;
    let changed = false;
    m.steps.forEach((st, i) => {
      if (this.steps[i] || st.on !== ev) return;
      // los pasos se cumplen en orden (salvo el primero de exploración)
      if (!this.steps.slice(0, i).every(Boolean)) return;
      try {
        if (st.test(d)) {
          this.steps[i] = true;
          changed = true;
        }
      } catch {}
    });
    // pasos "manuales" (mirar la CLI) se dan por hechos si el siguiente se cumplió
    m.steps.forEach((st, i) => {
      if (st.manual && !this.steps[i] && i + 1 < m.steps.length) {
        try {
          if (m.steps[i + 1].on === ev && m.steps[i + 1].test(d) && this.steps.slice(0, i).every(Boolean)) {
            this.steps[i] = true;
            this.steps[i + 1] = true;
            changed = true;
          }
        } catch {}
      }
    });
    if (changed) this._check();
  }
  _check() {
    const m = this.current;
    if (m && this.steps.every(Boolean)) {
      this.done.add(m.id);
      const id = m.id;
      this.current = null;
      this.lastDone = id;
      this._persist();
      bus.emit('mission:done', { id });
      if (!G.has(`badge_${id}`)) bus.emit('toast', { text: `Misión cumplida: ${m.title}`, kind: 'ok' });
    } else this._persist();
    this._notify();
  }
  resetProgress() {
    this.done.clear();
    this.abandon();
  }
  _persist() {
    save({ done: [...this.done], current: this.current?.id || null, steps: this.steps });
  }
  _notify() {
    bus.emit('mission:update', { current: this.current?.id || null, steps: [...this.steps], done: [...this.done] });
  }
}
export const missions = new MissionEngine();

// Quién pide cada misión (retratos del catálogo de imágenes; si falta alguno, no se muestra)
export const MISSION_NPC = {
  recorrido: ['npc_tecnico_jugador', 'Vos', 'Técnico de soporte'],
  'cable-pc03': ['npc_tecnico_jugador', 'Vos', 'Técnico de soporte'],
  'ping-nas': ['npc_lucia_box2', 'Lucía', 'Contadora · Box 2'],
  visitas: ['npc_cliente_visita', 'Cliente', 'Visita en recepción'],
  claro: ['npc_sofia_sueldos', 'Sofía', 'Sueldos · en pleno vencimiento'],
  'ticket-pc09': ['npc_diego_escritorio3', 'Diego', 'Escritorio 3 · PC09'],
  'corte-luz': ['npc_marta_recepcion', 'Marta', 'Recepción'],
  backup: ['npc_ricardo_gerente', 'Ricardo', 'Gerencia'],
};
export const missionArt = (id) => G.url(`mission_${id}`);
export const missionBadge = (id) => G.url(`badge_${id}`);
export const missionNpc = (id) => { const n = MISSION_NPC[id]; return n && G.has(n[0]) ? { img: G.url(n[0]), name: n[1], role: n[2] } : null; };

// Tarjeta breve de "misión cumplida" con la insignia
function celebrate(m) {
  const badge = missionBadge(m.id);
  const bg = G.url('ui_mission_complete');
  const el = document.createElement('div');
  el.className = 'mdone';
  el.setAttribute('role', 'status');
  el.innerHTML = `${bg ? `<img class="mdone-bg" src="${bg}" alt="">` : ''}${badge ? `<img class="mdone-badge" src="${badge}" alt="">` : ''}<div class="mdone-t"><span>Misión cumplida</span><b>${m.title}</b></div>`;
  document.body.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 3600);
}
bus.on('mission:done', ({ id }) => { const m = MISSIONS.find((x) => x.id === id); if (m) celebrate(m); });


// ─────────── tracker siempre visible ───────────
export function mountMissionTracker() {
  missions.init();
  if (document.querySelector('.mtrack')) return document.querySelector('.mtrack');
  const el = document.createElement('div');
  el.className = 'mtrack glass';
  let collapsed = false;
  collapsed = matchMedia('(max-width: 820px)').matches; // en celular arranca plegado
  try { const v = localStorage.getItem('alvarez.tracker.collapsed'); if (v !== null) collapsed = v === '1'; } catch {}
  const render = () => {
    const m = missions.current;
    el.classList.toggle('collapsed', collapsed);
    const total = MISSIONS.length;
    const doneN = missions.done.size;
    if (!m) {
      const just = missions.lastDone && missions.get(missions.lastDone);
      const nx = missions.next();
      el.innerHTML = `
        <button class="mt-head" data-act="toggle" aria-expanded="${!collapsed}">
          ${just && missionBadge(just.id) ? `<img class="mt-img" src="${missionBadge(just.id)}" alt="">` : `<span class="mt-badge">${just ? '✓' : '◎'}</span>`}
          <span class="mt-title">${just ? 'Misión cumplida' : 'Misiones'}</span>
          <span class="mt-count">${doneN}/${total}</span>
          <span class="mt-chev">${collapsed ? '▾' : '▴'}</span>
        </button>
        <div class="mt-body">
          ${just ? `<div class="mt-done">${just.title}</div>` : `<div class="mt-text">Resolvé tickets reales del estudio con bloques o con la consola.</div>`}
          ${nx ? `<div class="mt-next">Siguiente: <b>${nx.title}</b></div>` : '<div class="mt-next">¡Completaste todas las misiones!</div>'}
          <div class="mt-actions">
            ${nx ? `<button class="btn sm primary" data-act="start" data-id="${nx.id}">Empezar</button>` : ''}
            <button class="btn sm" data-act="lab">Laboratorio</button>
          </div>
        </div>`;
    } else {
      const i = missions.steps.findIndex((s) => !s);
      const st = m.steps[i];
      el.innerHTML = `
        <button class="mt-head" data-act="toggle" aria-expanded="${!collapsed}">
          ${missionNpc(m.id) ? `<img class="mt-img round" src="${missionNpc(m.id).img}" alt="${missionNpc(m.id).name}">` : '<span class="mt-badge live">●</span>'}
          <span class="mt-title">${m.title}</span>
          <span class="mt-count">${missions.steps.filter(Boolean).length}/${m.steps.length}</span>
          <span class="mt-chev">${collapsed ? '▾' : '▴'}</span>
        </button>
        <div class="mt-body">
          <div class="mt-tag">${m.tag}${missionNpc(m.id) && m.id !== 'recorrido' && m.id !== 'cable-pc03' ? ` · pedido de ${missionNpc(m.id).name}` : ''}</div>
          <div class="mt-step"><span class="mt-n">${i + 1}</span>${st ? st.text : ''}</div>
          <div class="mt-dots">${m.steps.map((_, k) => `<i class="${missions.steps[k] ? 'on' : k === i ? 'cur' : ''}"></i>`).join('')}</div>
          <div class="mt-actions">
            <button class="btn sm primary" data-act="lab-m">Abrir laboratorio</button>
            <button class="btn sm ghost" data-act="hint">Pista</button>
          </div>
          <div class="mt-hint hidden">${st?.hint || ''}</div>
        </div>`;
    }
  };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    if (a === 'toggle') {
      collapsed = !collapsed;
      try { localStorage.setItem('alvarez.tracker.collapsed', collapsed ? '1' : '0'); } catch {}
      render();
    } else if (a === 'start') {
      missions.start(b.dataset.id);
      bus.emit('lab:open', { tab: 'missions', mission: b.dataset.id });
    } else if (a === 'lab') bus.emit('lab:open', { tab: 'missions' });
    else if (a === 'lab-m') bus.emit('lab:open', { tab: 'missions', mission: missions.current?.id });
    else if (a === 'hint') el.querySelector('.mt-hint')?.classList.toggle('hidden');
  });
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  bus.on('mission:update', render);
  render();
  G.loadGenManifest().then(render);
  document.body.appendChild(el);
  return el;
}
