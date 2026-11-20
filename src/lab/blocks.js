// Editor de bloques estilo Scratch (alto nivel) con arrastrar y soltar por pointer
// events (mouse y touch), bloques C (repetir / si), ejecución paso a paso contra el
// simulador y vista "Así se ve por dentro" con el pseudocódigo y los comandos reales.
import { sim, SAMPLE_FILES, PC_IDS, ENDPOINTS, SSIDS } from '../sim/network.js';
import { VLANS } from '../data/tp.js';
import { bus } from '../core/bus.js';

const CATS = {
  evento: { name: 'Eventos', c: '#f5b301' },
  pruebas: { name: 'Pruebas', c: '#4c8dff' },
  red: { name: 'Red', c: '#9a6bff' },
  servicios: { name: 'Servicios', c: '#10b981' },
  fallas: { name: 'Fallas', c: '#f4577a' },
  control: { name: 'Control', c: '#ff9f1a' },
};
const o = (arr) => arr.map((x) => (Array.isArray(x) ? x : [x, x]));
const SRC = o([...PC_IDS, ['LAPTOP', 'notebook'], ['VISITA', 'visita'], 'EXT1', 'EXT2', 'NAS1', 'NAS2', 'PBX']);
const DST = o(['NAS1', 'NAS2', ['INTERNET', 'internet'], 'IMP01', 'IMP02', 'PBX', ...PC_IDS, 'ER605', 'SW1', 'SW2', 'TEL101', 'TEL106']);
const EXTS = o(['101', '102', '103', '104', '105', '106', '107']);
const IP = (id) => sim.resolve(id)?.ip || id;
const FILES = o(SAMPLE_FILES.filter((f) => !f.endsWith('/')));
const WIN = (id) => (ENDPOINTS[id]?.os === 'win' ? `C:\\Users\\${id.startsWith('EXT') ? 'externo' : 'estudio'}>` : null);

// ───────────────────────── definición de bloques ─────────────────────────
export const DEFS = {
  ping: {
    cat: 'pruebas',
    parts: ['hacer ping desde', { k: 'src', opts: SRC, def: 'PC03' }, 'a', { k: 'dst', opts: DST, def: 'NAS1' }],
    pseudo: (f) => `hacerPing(desde: ${f.src}, hacia: ${f.dst})`,
    low: (f) => {
      const w = WIN(f.src);
      if (w) return [{ dev: f.src, lines: [`${w} ping ${IP(f.dst)}`] }];
      if (f.src === 'VISITA') return [{ dev: 'Celular de la visita', lines: [`App de red › ping ${IP(f.dst)}`] }];
      return [{ dev: f.src, lines: [`${f.src === 'PBX' ? '[root@issabel ~]#' : `admin@${f.src}:~$`} ping -c 4 ${IP(f.dst)}`] }];
    },
    async run(f, ctx) {
      const r = await sim.ping(f.src, f.dst);
      ctx.last = r.ok;
      ctx.log(r.ok, `ping ${f.src} → ${f.dst}`, r.ok ? `${r.received}/${r.sent} respuestas${r.via ? ` · salió por ${r.via === 'claro' ? 'Claro' : 'Personal'}` : ''}` : r.reason, r.lines.join('\n'));
    },
  },
  trace: {
    cat: 'pruebas',
    parts: ['trazar ruta desde', { k: 'src', opts: SRC, def: 'PC07' }, 'a', { k: 'dst', opts: DST, def: 'INTERNET' }],
    pseudo: (f) => `trazarRuta(desde: ${f.src}, hacia: ${f.dst})`,
    low: (f) => {
      const w = WIN(f.src);
      return [{ dev: f.src, lines: [w ? `${w} tracert ${IP(f.dst) === '8.8.8.8' ? 'google.com' : IP(f.dst)}` : `traceroute ${IP(f.dst)}`] }];
    },
    async run(f, ctx) {
      const r = await sim.traceroute(f.src, f.dst);
      ctx.last = r.ok;
      ctx.log(r.ok, `ruta ${f.src} → ${f.dst}`, r.ok ? `${r.hops.filter((h) => h !== '*').length} saltos: ${r.hops.join(' → ')}` : r.reason, r.lines.join('\n'));
    },
  },
  call: {
    cat: 'servicios',
    parts: ['llamar del interno', { k: 'a', opts: EXTS, def: '101' }, 'al', { k: 'b', opts: [...EXTS, ['externo', 'número externo']], def: '106' }],
    pseudo: (f) => `llamar(desde: ${f.a}, a: ${f.b})`,
    low: (f) => [
      { dev: 'PBX', lines: ['[root@issabel ~]# asterisk -rx "sip show peers"'] },
      { dev: `Teléfono ${f.a}`, lines: [f.b === 'externo' ? 'Marcar número externo → troncal SIP Iptel' : `Marcar ${f.b}`] },
    ],
    async run(f, ctx) {
      const r = await sim.call(f.a, f.b);
      ctx.last = r.ok;
      ctx.log(r.ok, `llamada ${f.a} → ${f.b}`, r.ok ? 'Atendida' : r.reason, r.lines.join('\n'));
    },
  },
  wifi: {
    cat: 'red',
    parts: ['conectar', { k: 'who', opts: [['VISITA', 'visita'], ['LAPTOP', 'notebook']], def: 'VISITA' }, 'al Wi-Fi', { k: 'ap', opts: o(['AP1', 'AP2']), def: 'AP1' }, 'red', { k: 'ssid', opts: o(['Visitas', 'Empleados']), def: 'Visitas' }],
    pseudo: (f) => `conectarWifi(${f.who}, ap: ${f.ap}, ssid: "${SSIDS[f.ssid].name}")`,
    low: (f) => [
      { dev: f.who === 'VISITA' ? 'Celular de la visita' : 'Notebook', lines: [`Ajustes › Wi-Fi › ${SSIDS[f.ssid].name}`] },
      { dev: 'ER605 (interfaz web)', lines: [`Red › LAN › VLAN${SSIDS[f.ssid].vlan} · DHCP${SSIDS[f.ssid].vlan === 50 ? ' .100 a .220' : ''}`] },
    ],
    async run(f, ctx) {
      const r = await sim.wifiJoin(f.who, f.ap, f.ssid);
      ctx.last = r.ok;
      ctx.log(r.ok, `${f.who === 'VISITA' ? 'Visita' : 'Notebook'} → ${SSIDS[f.ssid].name}`, r.ok ? `IP ${r.ip} · VLAN ${r.vlan}` : r.reason);
    },
  },
  vpn: {
    cat: 'red',
    parts: ['conectar externo', { k: 'ext', opts: o(['EXT1', 'EXT2', 'EXT3', 'EXT4']), def: 'EXT1' }, 'por VPN'],
    pseudo: (f) => `conectarVPN(${f.ext}) // WireGuard`,
    low: (f) => [
      { dev: f.ext, lines: ['WireGuard › Activar túnel "Alvarez"'] },
      { dev: 'ER605 (interfaz web)', lines: [`VPN › WireGuard › peer ${f.ext} (10.10.70.${+f.ext.slice(3) + 1})`] },
    ],
    async run(f, ctx) {
      const r = await sim.vpnConnect(f.ext);
      ctx.last = r.ok;
      ctx.log(r.ok, `VPN ${f.ext}`, r.ok ? `túnel arriba · IP ${r.ip} · entra por ${r.via === 'claro' ? 'Claro' : 'Personal'}` : r.reason);
    },
  },
  port: {
    cat: 'red',
    parts: ['configurar puerto', { k: 'sw', opts: o(['SW1', 'SW2']), def: 'SW2' }, '/', { k: 'port', opts: o(Array.from({ length: 24 }, (_, i) => String(i + 1))), def: '3' }, 'VLAN', { k: 'vlan', opts: o(['10', '20', '30', '40', '50', '60']), def: '20' }],
    pseudo: (f) => `configurarPuerto(${f.sw}/${f.port}, vlan: ${f.vlan}) // ${VLANS[f.vlan]?.name}`,
    low: (f) => [
      { dev: f.sw, lines: [`${f.sw}> enable`, `${f.sw}# configure`, `${f.sw}(config)# interface gigabitEthernet 1/0/${f.port}`, `${f.sw}(config-if)# switchport general allowed vlan ${f.vlan} untagged`, `${f.sw}(config-if)# switchport pvid ${f.vlan}`, `${f.sw}(config-if)# end`] },
    ],
    async run(f, ctx) {
      const max = f.sw === 'SW1' ? 24 : 8;
      if (+f.port > max) {
        ctx.last = false;
        return ctx.log(false, `${f.sw}/${f.port}`, `${f.sw} tiene ${max} puertos de cobre`);
      }
      const prev = sim.ports[f.sw][+f.port];
      const was = prev.pvid;
      sim.setPortConfig(f.sw, +f.port, { mode: 'access', pvid: +f.vlan });
      ctx.last = true;
      ctx.log(true, `${f.sw}/${f.port} → VLAN ${f.vlan}`, was === +f.vlan ? 'ya estaba en esa VLAN' : `antes: VLAN ${was}`);
      await ctx.wait(350);
    },
  },
  portState: {
    cat: 'red',
    parts: [{ k: 'act', opts: [['apagar', 'apagar'], ['encender', 'encender']], def: 'apagar' }, 'puerto', { k: 'sw', opts: o(['SW1', 'SW2']), def: 'SW1' }, '/', { k: 'port', opts: o(Array.from({ length: 24 }, (_, i) => String(i + 1))), def: '20' }],
    pseudo: (f) => `${f.act}Puerto(${f.sw}/${f.port})`,
    low: (f) => [{ dev: f.sw, lines: [`${f.sw}(config)# interface gigabitEthernet 1/0/${f.port}`, `${f.sw}(config-if)# ${f.act === 'apagar' ? 'shutdown' : 'no shutdown'}`] }],
    async run(f, ctx) {
      const max = f.sw === 'SW1' ? 24 : 8;
      if (+f.port > max) return ctx.log(false, `${f.sw}/${f.port}`, `${f.sw} tiene ${max} puertos de cobre`);
      sim.setPortConfig(f.sw, +f.port, { shutdown: f.act === 'apagar' });
      ctx.log(true, `${f.sw}/${f.port} ${f.act === 'apagar' ? 'apagado' : 'encendido'}`, '');
      await ctx.wait(300);
    },
  },
  backup: {
    cat: 'servicios',
    parts: ['hacer copia de seguridad'],
    pseudo: () => 'copiaDeSeguridad(NAS1 → NAS2, NAS1 → Backblaze B2)',
    low: () => [{ dev: 'NAS1 (DSM)', lines: ['Tarea nocturna de copia › destino NAS2 (10.10.60.10)', 'Tarea nocturna de copia › destino Backblaze B2'] }],
    async run(f, ctx) {
      const r = await sim.runBackup();
      ctx.last = r.ok;
      ctx.log(r.ok, 'copia de seguridad', r.lines.join(' · '));
    },
  },
  file: {
    cat: 'servicios',
    parts: [{ k: 'act', opts: [['borrar', 'borrar'], ['restaurar', 'restaurar']], def: 'borrar' }, 'archivo', { k: 'file', opts: FILES, def: 'balance_2026.xlsx' }],
    pseudo: (f) => `${f.act}Archivo("${f.file}")`,
    low: (f) => [{ dev: 'NAS1', lines: [f.act === 'borrar' ? `admin@NAS1:~$ rm /volume1/estudio/${f.file}` : `DSM › Restaurar ${f.file} desde la copia`] }],
    async run(f, ctx) {
      if (f.act === 'borrar') {
        const r = sim.deleteFile(f.file);
        ctx.last = r.ok;
        ctx.log(r.ok, `borrado ${f.file}`, r.ok ? 'ya no está en NAS1' : r.reason);
        await ctx.wait(300);
      } else {
        const r = await sim.restoreFile(f.file);
        ctx.last = r.ok;
        ctx.log(r.ok, `restaurar ${f.file}`, r.ok ? (r.from ? `recuperado desde ${r.from === 'B2' ? 'Backblaze B2' : r.from}` : r.note) : r.reason);
      }
    },
  },
  wan: {
    cat: 'fallas',
    parts: [{ k: 'act', opts: [['cortar', 'cortar'], ['restaurar', 'restaurar']], def: 'cortar' }, 'internet de', { k: 'isp', opts: [['claro', 'Claro'], ['personal', 'Personal']], def: 'claro' }],
    pseudo: (f) => `${f.act}Internet(${f.isp === 'claro' ? 'Claro · WAN1' : 'Personal · WAN2'})`,
    low: (f) => [
      { dev: 'Rack R1', lines: [`${f.act === 'cortar' ? 'Desconectar' : 'Reconectar'} el equipo de ${f.isp === 'claro' ? 'Claro (WAN1)' : 'Personal (WAN2)'}`] },
      { dev: 'ER605 (interfaz web)', lines: ['Transmisión › Balanceo › Respaldo de enlace: WAN1 principal, WAN2 respaldo'] },
    ],
    async run(f, ctx) {
      const r = sim.setWan(f.isp, f.act !== 'cortar');
      ctx.log(f.act !== 'cortar' || !!r.active, `${f.act === 'cortar' ? 'corte' : 'vuelve'} ${f.isp === 'claro' ? 'Claro' : 'Personal'}`, r.note || `internet por ${r.active ? (r.active === 'claro' ? 'Claro' : 'Personal') : 'ninguno'}`);
      await ctx.wait(400);
    },
  },
  power: {
    cat: 'fallas',
    parts: [{ k: 'act', opts: [['cortar', 'cortar'], ['restaurar', 'restaurar']], def: 'cortar' }, 'energía'],
    pseudo: (f) => `${f.act}Energia() // UPS: R1, R2 y NAS2`,
    low: (f) => [{ dev: 'Tablero eléctrico', lines: [f.act === 'cortar' ? 'Bajar la térmica (simulación de corte)' : 'Subir la térmica'] }],
    async run(f, ctx) {
      sim.setPower(f.act !== 'cortar');
      ctx.log(true, f.act === 'cortar' ? 'corte de energía' : 'vuelve la energía', f.act === 'cortar' ? 'R1, R2 y NAS2 pasan a UPS · PCs e impresoras se apagan' : 'todo vuelve a la red eléctrica');
      await ctx.wait(500);
    },
  },
  wait: {
    cat: 'control',
    parts: ['esperar', { k: 's', num: [1, 10], def: '1' }, 's'],
    pseudo: (f) => `esperar(${f.s} s)`,
    low: () => [],
    async run(f, ctx) {
      await ctx.wait(+f.s * 1000);
    },
  },
  repeat: {
    cat: 'control',
    c: true,
    parts: ['repetir', { k: 'n', num: [1, 10], def: '3' }, 'veces'],
    pseudo: (f) => `repetir ${f.n} veces {`,
    low: () => [],
    async run(f, ctx, b) {
      for (let i = 0; i < +f.n && !ctx.stopped; i++) await ctx.runList(b.body);
    },
  },
  ifok: {
    cat: 'control',
    c: true,
    parts: ['si', { k: 'cond', opts: [['ok', 'la última prueba funcionó'], ['fail', 'la última prueba falló'], ['inet', 'hay internet'], ['power', 'hay energía']], def: 'fail' }, 'entonces'],
    pseudo: (f) => `si (${{ ok: 'ultimaPruebaOk', fail: '!ultimaPruebaOk', inet: 'hayInternet', power: 'hayEnergia' }[f.cond]}) {`,
    low: () => [],
    async run(f, ctx, b) {
      const v = f.cond === 'ok' ? ctx.last === true : f.cond === 'fail' ? ctx.last === false : f.cond === 'inet' ? !!sim.activeWan() : sim.mains;
      if (v) await ctx.runList(b.body);
    },
  },
};
const PALETTE = ['ping', 'trace', 'wifi', 'vpn', 'port', 'portState', 'call', 'backup', 'file', 'wan', 'power', 'wait', 'repeat', 'ifok'];

let uid = 0;
export const mk = (type, f = {}) => {
  const d = DEFS[type];
  const fields = {};
  for (const p of d.parts) if (typeof p === 'object') fields[p.k] = f[p.k] ?? p.def;
  return { id: `b${++uid}`, type, f: fields, ...(d.c ? { body: [] } : {}) };
};

// ───────────────────────── editor ─────────────────────────
export function createBlocks() {
  const root = document.createElement('div');
  root.className = 'bk';
  root.innerHTML = `
    <aside class="bk-pal" aria-label="Bloques disponibles">
      <div class="bk-cats"></div>
      <div class="bk-list scroll"></div>
      <div class="bk-trash">Soltá acá para borrar</div>
    </aside>
    <section class="bk-main">
      <div class="bk-bar">
        <button class="btn primary sm bk-run"><span>▶</span> Ejecutar</button>
        <button class="btn sm bk-stop" disabled>■ Detener</button>
        <span class="bk-grow"></span>
        <button class="btn sm ghost bk-reset" title="Volver la red al diseño del TP">↺ Red del TP</button>
        <button class="btn sm ghost bk-clear">Vaciar</button>
      </div>
      <div class="bk-script scroll"><div class="bk-canvas"><div class="blk hat" style="--c:${CATS.evento.c}"><div class="blk-row">cuando se hace clic en <b class="flag">▶</b></div></div><div class="bk-root" data-list=""></div><div class="bk-ind hidden"></div><div class="bk-empty">Arrastrá bloques acá<span class="bk-empty-m"> · o tocá uno para agregarlo</span></div></div></div>
    </section>
    <aside class="bk-side">
      <div class="bk-tabs"><button class="on" data-v="out">Resultado</button><button data-v="code">Por dentro</button></div>
      <div class="bk-out scroll"><div class="bk-out-empty">Armá un programa y tocá <b>▶ Ejecutar</b>. Vas a ver los paquetes viajar por la oficina y la topología.</div></div>
      <div class="bk-code scroll hidden"></div>
    </aside>`;
  const $ = (s) => root.querySelector(s);
  const listEl = $('.bk-list'), catsEl = $('.bk-cats'), rootList = $('.bk-root'), canvas = $('.bk-canvas'), ind = $('.bk-ind');
  const out = $('.bk-out'), code = $('.bk-code');
  let script = [];
  let running = false;
  const ctx = { stopped: false, last: null };

  // ── paleta ──
  for (const [k, c] of Object.entries(CATS)) {
    if (k === 'evento') continue;
    const b = document.createElement('button');
    b.className = 'bk-cat';
    b.innerHTML = `<i style="background:${c.c}"></i>${c.name}`;
    b.onclick = () => listEl.querySelector(`[data-cat="${k}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
    catsEl.appendChild(b);
  }
  let lastCat = null;
  for (const t of PALETTE) {
    const d = DEFS[t];
    if (d.cat !== lastCat) {
      const h = document.createElement('div');
      h.className = 'bk-h';
      h.dataset.cat = d.cat;
      h.textContent = CATS[d.cat].name;
      listEl.appendChild(h);
      lastCat = d.cat;
    }
    const b = renderBlock(mk(t), true);
    b.dataset.new = t;
    listEl.appendChild(b);
  }

  function renderBlock(b, inPalette = false) {
    const d = DEFS[b.type];
    const el = document.createElement('div');
    el.className = `blk${d.c ? ' c' : ''}`;
    el.style.setProperty('--c', CATS[d.cat].c);
    el.dataset.id = b.id;
    const row = document.createElement('div');
    row.className = 'blk-row';
    for (const p of d.parts) {
      if (typeof p === 'string') {
        const s = document.createElement('span');
        s.textContent = p;
        row.appendChild(s);
      } else if (p.num) {
        const i = document.createElement('input');
        i.type = 'number';
        i.min = p.num[0];
        i.max = p.num[1];
        i.value = b.f[p.k];
        i.className = 'blk-num';
        i.oninput = () => { b.f[p.k] = String(Math.max(p.num[0], Math.min(p.num[1], +i.value || p.num[0]))); renderCode(); };
        if (inPalette) i.tabIndex = -1;
        row.appendChild(i);
      } else {
        const s = document.createElement('select');
        s.className = 'blk-sel';
        for (const [v, l] of p.opts) {
          const op = document.createElement('option');
          op.value = v;
          op.textContent = l;
          s.appendChild(op);
        }
        s.value = b.f[p.k];
        s.onchange = () => { b.f[p.k] = s.value; renderCode(); };
        if (inPalette) s.tabIndex = -1;
        row.appendChild(s);
      }
    }
    if (!inPalette) {
      const x = document.createElement('button');
      x.className = 'blk-x';
      x.title = 'Quitar bloque';
      x.setAttribute('aria-label', 'Quitar bloque');
      x.textContent = '×';
      x.onclick = (e) => { e.stopPropagation(); removeById(b.id); render(); };
      row.appendChild(x);
    }
    el.appendChild(row);
    if (d.c) {
      const body = document.createElement('div');
      body.className = 'blk-body';
      body.dataset.list = b.id;
      if (!inPalette) for (const ch of b.body) body.appendChild(renderBlock(ch));
      el.appendChild(body);
      const foot = document.createElement('div');
      foot.className = 'blk-foot';
      el.appendChild(foot);
    }
    return el;
  }

  function findBlock(id, list = script) {
    for (const b of list) {
      if (b.id === id) return b;
      if (b.body) {
        const r = findBlock(id, b.body);
        if (r) return r;
      }
    }
    return null;
  }
  function listById(id) {
    return id ? findBlock(id)?.body : script;
  }
  function removeById(id, list = script) {
    const i = list.findIndex((b) => b.id === id);
    if (i >= 0) return list.splice(i, 1)[0];
    for (const b of list) if (b.body) { const r = removeById(id, b.body); if (r) return r; }
    return null;
  }
  function render() {
    rootList.innerHTML = '';
    for (const b of script) rootList.appendChild(renderBlock(b));
    $('.bk-empty').classList.toggle('hidden', script.length > 0);
    renderCode();
  }

  // ── por dentro ──
  function renderCode() {
    const P = ['<span class="k">cuando</span> se hace clic en ▶ {'];
    const LOW = [];
    const walkC = (list, depth) => {
      for (const b of list) {
        const d = DEFS[b.type];
        P.push(`${'  '.repeat(depth)}${escapeHtml(d.pseudo(b.f))}`);
        for (const l of d.low(b.f)) LOW.push(l);
        if (b.body) {
          walkC(b.body, depth + 1);
          P.push(`${'  '.repeat(depth)}}`);
        }
      }
    };
    walkC(script, 1);
    P.push('}');
    code.innerHTML = `
      <div class="cd-h">Pseudocódigo</div>
      <pre class="cd-pre">${P.join('\n')}</pre>
      <div class="cd-h">Comandos reales equivalentes</div>
      ${LOW.length ? LOW.map((l) => `<div class="cd-card"><div class="cd-dev">${escapeHtml(l.dev)}</div><pre>${l.lines.map(escapeHtml).join('\n')}</pre></div>`).join('') : '<div class="tiny">Agregá bloques para ver qué se escribiría en cada equipo.</div>'}
      <p class="tiny cd-note">Switches: CLI de TP-Link JetStream. PCs: símbolo del sistema de Windows. Central: Asterisk (Issabel). El ER605 se configura por interfaz web / Omada.</p>`;
  }

  // ── arrastrar y soltar ──
  let drag = null;
  const slots = () => {
    const S = [];
    const lists = [rootList, ...canvas.querySelectorAll('.bk-root .blk-body')];
    const cr = canvas.getBoundingClientRect();
    for (const L of lists) {
      if (drag?.srcEl && drag.srcEl.contains(L)) continue; // no meter un bloque dentro de sí mismo
      const lr = L.getBoundingClientRect();
      const kids = [...L.children].filter((c) => c.classList.contains('blk'));
      const id = L.dataset.list || '';
      kids.forEach((k, i) => {
        S.push({ list: id, index: i, y: k.getBoundingClientRect().top, x: lr.left, left: lr.left - cr.left, top: k.getBoundingClientRect().top - cr.top });
      });
      const end = kids.length ? kids[kids.length - 1].getBoundingClientRect().bottom : lr.top + (L === rootList ? 0 : 6);
      S.push({ list: id, index: kids.length, y: end, x: lr.left, left: lr.left - cr.left, top: end - cr.top });
    }
    return S;
  };
  const pick = (px, py) => {
    let best = null, bd = Infinity;
    for (const s of slots()) {
      if (px < s.x - 30) continue;
      const d = Math.abs(py - s.y) - (s.x - canvas.getBoundingClientRect().left) * 0.02;
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  };
  const overScript = (x, y) => {
    const r = $('.bk-script').getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };
  const overPalette = (x, y) => {
    const r = $('.bk-pal').getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };
  function begin(e, src) {
    if (running && !src.isNew) return;
    const el = src.el;
    const r = el.getBoundingClientRect();
    const ghost = el.cloneNode(true);
    ghost.classList.add('ghost');
    ghost.style.width = `${Math.min(r.width, 420)}px`;
    document.body.appendChild(ghost);
    drag = { ...src, ghost, dx: Math.min(e.clientX - r.left, 60), dy: e.clientY - r.top, srcEl: src.isNew ? null : el };
    if (!src.isNew) el.classList.add('dragging');
    root.classList.add('is-dragging');
    move(e);
  }
  function move(e) {
    if (!drag) return;
    drag.ghost.style.transform = `translate(${e.clientX - drag.dx}px, ${e.clientY - drag.dy}px)`;
    const inS = overScript(e.clientX, e.clientY);
    root.classList.toggle('trash-hot', !drag.isNew && overPalette(e.clientX, e.clientY));
    if (inS) {
      const s = pick(e.clientX, e.clientY);
      drag.slot = s;
      if (s) {
        ind.classList.remove('hidden');
        ind.style.transform = `translate(${s.left}px, ${s.top - 3}px)`;
      }
      // autoscroll
      const sc = $('.bk-script'), r = sc.getBoundingClientRect();
      if (e.clientY > r.bottom - 40) sc.scrollTop += 10;
      else if (e.clientY < r.top + 40) sc.scrollTop -= 10;
    } else {
      drag.slot = null;
      ind.classList.add('hidden');
    }
  }
  function end(e) {
    if (!drag) return;
    const d = drag;
    drag = null;
    d.ghost.remove();
    ind.classList.add('hidden');
    root.classList.remove('is-dragging', 'trash-hot');
    d.srcEl?.classList.remove('dragging');
    const inS = e && overScript(e.clientX, e.clientY);
    if (inS && d.slot) {
      let block;
      if (d.isNew) block = mk(d.type);
      else {
        // ajustar el índice si se mueve dentro de la misma lista hacia abajo
        const fromList = findParentList(d.id);
        const idx = fromList ? fromList.findIndex((b) => b.id === d.id) : -1;
        block = removeById(d.id);
        if (fromList === listById(d.slot.list) && idx >= 0 && idx < d.slot.index) d.slot.index--;
      }
      const L = listById(d.slot.list) || script;
      L.splice(d.slot.index, 0, block);
      render();
      flash(block.id);
    } else if (!d.isNew && e && !inS) {
      removeById(d.id);
      render();
    }
  }
  function findParentList(id, list = script) {
    if (list.some((b) => b.id === id)) return list;
    for (const b of list) if (b.body) { const r = findParentList(id, b.body); if (r) return r; }
    return null;
  }
  const flash = (id) => {
    const el = canvas.querySelector(`[data-id="${id}"]`);
    if (el) { el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 400); }
  };

  root.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    if (e.target.closest('select, input, button')) return;
    const blk = e.target.closest('.blk');
    if (!blk || blk.classList.contains('hat')) return;
    const isNew = !!blk.dataset.new;
    const src = isNew ? { isNew: true, type: blk.dataset.new, el: blk } : { isNew: false, id: blk.dataset.id, el: blk };
    const sx = e.clientX, sy = e.clientY;
    const touch = e.pointerType === 'touch';
    let started = false, timer = null;
    const startDrag = (ev) => {
      if (started) return;
      started = true;
      try { blk.setPointerCapture?.(e.pointerId); } catch {}
      begin(ev, src);
    };
    if (touch) timer = setTimeout(() => { startDrag({ clientX: sx, clientY: sy }); navigator.vibrate?.(10); }, 260);
    const onMove = (ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!started) {
        if (touch) { if (Math.hypot(dx, dy) > 10) { clearTimeout(timer); cleanup(); } return; }
        if (Math.hypot(dx, dy) > 5) startDrag(ev);
        return;
      }
      ev.preventDefault();
      move(ev);
    };
    const onUp = (ev) => {
      clearTimeout(timer);
      if (started) end(ev);
      else if (isNew) {
        // toque/clic simple en la paleta: agregar al final
        const b = mk(src.type);
        script.push(b);
        render();
        flash(b.id);
        $('.bk-script').scrollTop = 1e6;
      }
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  });
  // evitar scroll mientras se arrastra en touch
  root.addEventListener('touchmove', (e) => { if (drag) e.preventDefault(); }, { passive: false });

  // ── ejecución ──
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  ctx.wait = async (ms) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms && !ctx.stopped) await sleep(50);
  };
  ctx.log = (ok, title, detail = '', pre = '') => {
    const e = document.createElement('div');
    e.className = `lg ${ok ? 'ok' : 'bad'}`;
    e.innerHTML = `<span class="lg-i">${ok ? '✓' : '✕'}</span><div class="lg-b"><div class="lg-t">${escapeHtml(title)}</div>${detail ? `<div class="lg-d">${escapeHtml(detail)}</div>` : ''}${pre ? `<details><summary>ver salida</summary><pre>${escapeHtml(pre)}</pre></details>` : ''}</div>`;
    out.appendChild(e);
    out.scrollTop = out.scrollHeight;
  };
  ctx.runList = async (list) => {
    for (const b of list) {
      if (ctx.stopped) return;
      const el = canvas.querySelector(`[data-id="${b.id}"]`);
      el?.classList.add('run');
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      try {
        await DEFS[b.type].run(b.f, ctx, b);
      } catch (err) {
        ctx.log(false, 'error', String(err.message || err));
      }
      el?.classList.remove('run');
    }
  };
  async function run() {
    if (running) return;
    if (!script.length) {
      out.innerHTML = '<div class="bk-out-empty">Primero agregá algún bloque debajo de “cuando se hace clic en ▶”.</div>';
      showTab('out');
      return;
    }
    running = true;
    ctx.stopped = false;
    ctx.last = null;
    root.classList.add('running');
    $('.bk-run').disabled = true;
    $('.bk-stop').disabled = false;
    out.innerHTML = '';
    showTab('out');
    const h = document.createElement('div');
    h.className = 'lg-head';
    h.textContent = `Ejecución · ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    out.appendChild(h);
    await ctx.runList(script);
    const f = document.createElement('div');
    f.className = 'lg-end';
    f.textContent = ctx.stopped ? 'Detenido' : 'Fin del programa';
    out.appendChild(f);
    running = false;
    root.classList.remove('running');
    $('.bk-run').disabled = false;
    $('.bk-stop').disabled = true;
  }
  $('.bk-run').onclick = run;
  $('.bk-stop').onclick = () => (ctx.stopped = true);
  $('.bk-clear').onclick = () => { if (!running) { script = []; render(); } };
  $('.bk-reset').onclick = () => {
    sim.reset();
    bus.emit('toast', { text: 'La red volvió a la configuración del TP', kind: 'info' });
  };
  function showTab(v) {
    root.querySelectorAll('.bk-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.v === v));
    out.classList.toggle('hidden', v !== 'out');
    code.classList.toggle('hidden', v !== 'code');
  }
  root.querySelectorAll('.bk-tabs button').forEach((b) => (b.onclick = () => showTab(b.dataset.v)));

  render();
  return {
    el: root,
    load(preset) {
      if (running) return;
      script = preset.map((p) => mk(p.type, p.f));
      render();
      showTab('code');
    },
    run,
    get script() { return script; },
  };
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
