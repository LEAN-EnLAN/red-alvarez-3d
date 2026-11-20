// Consolas de bajo nivel: Windows (PCs), TP-Link JetStream CLI (SW1/SW2),
// Issabel/Asterisk (PBX) y DSM por SSH (NAS). El ER605 se administra por GUI/Omada:
// se muestra su configuración equivalente, sin inventar una CLI.
import { sim, ENDPOINTS, SW_PORTS, SFP, portDesc, macOf, MASK, SUBNET, SSIDS, PHONE_IDS, PC_IDS } from '../sim/network.js';
import { VLANS, OUTLETS } from '../data/tp.js';

const pad = (s, n) => String(s).padEnd(n);
const lpad = (s, n) => String(s).padStart(n);
const listVlans = (arr) => compress(arr.filter((v) => v !== 1)) || '';
function compress(nums) {
  const a = [...new Set(nums)].sort((x, y) => x - y);
  const out = [];
  for (let i = 0; i < a.length; i++) {
    let j = i;
    while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++;
    out.push(j > i ? `${a[i]}-${a[j]}` : `${a[i]}`);
    i = j;
  }
  return out.join(',');
}
function parseList(s) {
  const out = [];
  for (const part of String(s).split(',')) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part.trim());
    if (!m) return null;
    const a = +m[1], b = m[2] ? +m[2] : a;
    for (let i = a; i <= b; i++) out.push(i);
  }
  return out;
}
const VLAN_NAMES = { 1: 'System-VLAN', 10: 'Gestion', 20: 'Personal', 30: 'Archivos', 40: 'Telefonia', 50: 'Visitas', 60: 'Respaldo' };

// Destinos sugeridos para ping/tracert
const HOST_SUGGEST = ['10.10.30.10', '10.10.20.1', '10.10.60.10', '10.10.40.10', '8.8.8.8', 'google.com', ...PC_IDS.map((p) => ENDPOINTS[p].ip)];

export const CONSOLE_DEVICES = [
  { group: 'Puestos', ids: [...PC_IDS] },
  { group: 'Red', ids: ['SW1', 'SW2', 'ER605'] },
  { group: 'Servidores', ids: ['NAS1', 'NAS2', 'PBX'] },
  { group: 'Wi-Fi y remotos', ids: ['LAPTOP', 'EXT1', 'EXT2', 'EXT3', 'EXT4'] },
];

// ───────────────────────── completado genérico por árbol ─────────────────────────
// Un árbol: { palabra: subárbol }. Claves especiales: '$host', '$num:a-b', '$list', '$any'
function expand(key) {
  if (key === '$host') return HOST_SUGGEST;
  if (key.startsWith('$num:')) {
    const [a, b] = key.slice(5).split('-').map(Number);
    const out = [];
    for (let i = a; i <= b; i++) out.push(String(i));
    return out;
  }
  if (key.startsWith('$opts:')) return key.slice(6).split('|');
  return [key];
}
function walk(tree, tokens) {
  let node = tree;
  for (const t of tokens) {
    if (!node) return null;
    let next = null;
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) {
        if (k === '$any' || k === '$host' || expand(k).includes(t) || (k === '$list' && parseList(t))) { next = v; break; }
      } else if (k === t) { next = v; break; }
    }
    if (!next) {
      // abreviaturas: "sh vl" → show vlan (como en la CLI real)
      const cands = Object.keys(node).filter((k) => !k.startsWith('$') && k.startsWith(t));
      if (cands.length === 1) next = node[cands[0]];
    }
    node = next;
  }
  return node;
}
function options(tree, line) {
  const ends = /\s$/.test(line) || line === '';
  const toks = line.trim().split(/\s+/).filter(Boolean);
  const last = ends ? '' : toks.pop() || '';
  const node = walk(tree, toks);
  if (!node) return { last, opts: [] };
  const opts = [];
  for (const k of Object.keys(node)) {
    if (k === '$any') continue;
    if (k === '$list') { opts.push('<lista de VLAN>'); continue; }
    for (const o of expand(k)) if (o.toLowerCase().startsWith(last.toLowerCase())) opts.push(o);
  }
  return { last, opts: [...new Set(opts)] };
}
function complete(tree, line) {
  const { last, opts } = options(tree, line);
  const real = opts.filter((o) => !o.startsWith('<'));
  if (real.length === 1) return { line: line.slice(0, line.length - last.length) + real[0] + ' ', opts: [] };
  if (real.length > 1) {
    let pre = real[0];
    for (const o of real) while (!o.startsWith(pre)) pre = pre.slice(0, -1);
    if (pre.length > last.length) return { line: line.slice(0, line.length - last.length) + pre, opts: real };
  }
  return { line, opts };
}
function canon(tree, line) {
  // expande abreviaturas: "sh int st" → "show interface status"
  const toks = line.trim().split(/\s+/).filter(Boolean);
  let node = tree;
  const out = [];
  for (const t of toks) {
    if (!node) { out.push(t); continue; }
    if (node[t]) { out.push(t); node = node[t]; continue; }
    const vk = Object.keys(node).find((k) => k.startsWith('$') && (k === '$any' || k === '$host' || expand(k).includes(t) || (k === '$list' && parseList(t))));
    if (vk) { out.push(t); node = node[vk]; continue; }
    const cands = Object.keys(node).filter((k) => !k.startsWith('$') && k.startsWith(t));
    if (cands.length === 1) { out.push(cands[0]); node = node[cands[0]]; }
    else { out.push(t); node = null; }
  }
  return out;
}

// ───────────────────────── Windows (PCs, notebook, externos) ─────────────────────────
const WIN_TREE = {
  ping: { $host: {}, '-n': { '$num:1-10': { $host: {} } } },
  tracert: { $host: {} },
  ipconfig: { '/all': {} },
  arp: { '-a': {} },
  hostname: {},
  cls: {},
  help: {},
};
function winSession(id) {
  const e = ENDPOINTS[id];
  const user = id.startsWith('EXT') ? 'externo' : 'estudio';
  return {
    kind: 'win',
    title: id === 'LAPTOP' ? 'Notebook (Wi-Fi) · Símbolo del sistema' : id.startsWith('EXT') ? `${id} · fuera de la oficina (VPN)` : `${id} · Símbolo del sistema`,
    banner: ['Microsoft Windows [Versión 10.0.22631]', '(c) Microsoft Corporation. Todos los derechos reservados.', ''],
    prompt: () => `C:\\Users\\${user}>`,
    tree: () => WIN_TREE,
    quick: () => ['ipconfig', 'ping 10.10.30.10', 'ping 8.8.8.8', 'tracert google.com', 'arp -a'],
    async exec(line, out) {
      const t = line.trim().split(/\s+/);
      const c = (t[0] || '').toLowerCase();
      const down = sim.downReason(id);
      if (down && c !== 'cls' && c !== 'help') return out(`El equipo está apagado: ${down}.`);
      if (!c) return;
      if (c === 'cls') return out(null, { clear: true });
      if (c === 'help') return out('Comandos disponibles en esta simulación:\n  ping [-n N] <destino>   tracert <destino>   ipconfig [/all]\n  arp -a                  hostname            cls');
      if (c === 'hostname') return out(id);
      if (c === 'ipconfig') return out(ipconfig(id, t[1] === '/all'));
      if (c === 'arp') {
        if (t[1] !== '-a') return out('Muestra y modifica las tablas de traducción de direcciones IP a físicas.\n\nARP -a');
        return out(arp(id));
      }
      if (c === 'ping') {
        let n = 4, host = t[1];
        if (t[1] === '-n') { n = Math.max(1, Math.min(10, +t[2] || 4)); host = t[3]; }
        if (!host) return out('Uso: ping [-n count] nombre_destino');
        if (!sim.resolve(host)) return out(`La solicitud de ping no pudo encontrar el host ${host}. Compruebe el nombre y vuelva a intentarlo.`);
        const r = await sim.ping(id, host, { count: n });
        return out(r.lines.join('\n') + (r.ok ? '' : `\n\n  ↳ Motivo en la simulación: ${r.reason}`), { ok: r.ok });
      }
      if (c === 'tracert') {
        if (!t[1]) return out('Uso: tracert nombre_destino');
        if (!sim.resolve(t[1])) return out(`No se puede resolver el nombre del sistema de destino ${t[1]}.`);
        const r = await sim.traceroute(id, t[1]);
        return out(r.lines.join('\n'), { ok: r.ok });
      }
      return out(`"${t[0]}" no se reconoce como un comando interno o externo,\nprograma o archivo por lotes ejecutable.`, { ok: false });
    },
  };
}
function ipconfig(id, all) {
  const e = ENDPOINTS[id];
  const ip = sim.ipOf(id);
  const vlan = sim.vlanOf(id);
  const name = e.wireless ? 'Adaptador de LAN inalámbrica Wi-Fi' : e.remote ? 'Adaptador desconocido WireGuard' : 'Adaptador de Ethernet Ethernet';
  const L = ['', 'Configuración IP de Windows', ''];
  if (all) L.push(`   Nombre de host. . . . . . . . . . . . . . : ${id}`, '   Tipo de nodo. . . . . . . . . . . . . . . : híbrido', '');
  L.push(`${name}:`, '');
  const connected = e.remote ? sim.vpn[id] : e.wireless ? !!sim.wifi[id] : true;
  if (!connected) {
    L.push('   Estado de los medios. . . . . . . . . . . : medios desconectados');
    if (e.remote) L.push('', '   (Activá el túnel: bloque "conectar externo por VPN")');
    return L.join('\n');
  }
  if (all) {
    L.push(`   Descripción . . . . . . . . . . . . . . . : ${e.wireless ? 'Intel(R) Wi-Fi 6 AX201' : e.remote ? 'WireGuard Tunnel' : 'Realtek PCIe GbE Family Controller'}`);
    if (!e.remote) L.push(`   Dirección física. . . . . . . . . . . . . : ${e.mac.replace(/:/g, '-')}`);
    L.push(`   DHCP habilitado . . . . . . . . . . . . . : ${e.remote ? 'no' : 'sí'}`);
  }
  L.push(`   Dirección IPv4. . . . . . . . . . . . . . : ${ip}${all ? (e.remote ? '' : e.wireless ? '(Preferido)' : '(Preferido) (reserva DHCP)') : ''}`);
  L.push(`   Máscara de subred . . . . . . . . . . . . : ${MASK[SUBNET[vlan]]}`);
  L.push(`   Puerta de enlace predeterminada . . . . . : ${e.remote ? '' : `10.10.${vlan}.1`}`);
  if (all && !e.remote) L.push(`   Servidor DHCP . . . . . . . . . . . . . . : 10.10.${vlan}.1`, `   Servidores DNS. . . . . . . . . . . . . . : 10.10.${vlan}.1`);
  if (e.wireless) L.push(`   SSID. . . . . . . . . . . . . . . . . . . : ${SSIDS[sim.wifi[id].ssid].name} (${sim.wifi[id].ap})`);
  if (!e.wireless && !e.remote) {
    const c = sim.ports[e.sw][e.port];
    if (c.pvid !== vlan) L.push('', `   ⚠ El puerto ${e.sw}/${e.port} está en la VLAN ${c.pvid}. Esta IP es de la VLAN ${vlan}.`);
  }
  return L.join('\n');
}
function arp(id) {
  const ip = sim.ipOf(id);
  if (!ip) return 'No se encontraron entradas ARP.';
  const vlan = sim.vlanOf(id);
  const L = [`Interfaz: ${ip} --- 0x7`, '  Dirección de Internet          Dirección física      Tipo'];
  const learned = [...(sim.arp[id] || [])];
  const rows = [];
  for (const o of learned) {
    if (o === 'ER605') rows.push([`10.10.${vlan}.1`, macOf('ER605', 'tplink')]);
    else if (ENDPOINTS[o] && sim.vlanOf(o) === vlan) rows.push([sim.ipOf(o), ENDPOINTS[o].mac]);
  }
  if (!rows.length) return L.concat('  (vacía: todavía no se comunicó con nadie — probá un ping)').join('\n');
  for (const [i, m] of rows) L.push(`  ${pad(i, 31)}${pad(m.replace(/:/g, '-').toLowerCase(), 22)}dinámico`);
  return L.join('\n');
}

// ───────────────────────── TP-Link JetStream CLI ─────────────────────────
function swTree(sw, mode) {
  const nports = SW_PORTS[sw];
  const giga = { gigabitEthernet: { [`$opts:${Array.from({ length: nports }, (_, i) => `1/0/${i + 1}`).join('|')}`]: {} } };
  const show = {
    vlan: { brief: {} },
    interface: { status: { gigabitEthernet: giga.gigabitEthernet }, configuration: {} },
    'mac': { 'address-table': {} },
    'running-config': { interface: giga },
    power: { inline: { information: { interface: {} } } },
    'system-info': {},
  };
  if (mode === 'user') return { enable: {}, show, exit: {}, help: {} };
  if (mode === 'priv') return { configure: {}, show, exit: {}, disable: {}, clear: {}, help: {} };
  if (mode === 'config') return { interface: giga, show, exit: {}, end: {}, help: {} };
  return {
    switchport: { general: { allowed: { vlan: { $list: { '$opts:untagged|tagged': {} } } } }, pvid: { '$num:1-60': {} } },
    no: { shutdown: {}, switchport: { general: { allowed: { vlan: { $list: {} } } } }, 'power': { inline: { supply: {} } } },
    shutdown: {},
    power: { inline: { supply: { '$opts:enable|disable': {} } } },
    show,
    exit: {},
    end: {},
    help: {},
  };
}
function swSession(sw) {
  let mode = 'user';
  let iface = null;
  const model = sw === 'SW1' ? 'TL-SG2428P' : 'TL-SG2210P';
  const pn = (p) => `Gi1/0/${p}`;
  const prompt = () => `${sw}${mode === 'user' ? '>' : mode === 'priv' ? '#' : mode === 'config' ? '(config)#' : '(config-if)#'}`;
  const showOut = (args) => {
    const a = args.join(' ');
    if (/^vlan/.test(a)) {
      const L = ['', 'VLAN  Name                 Status    Ports', '----- -------------------- --------- ----------------------------------------'];
      for (const v of [1, 10, 20, 30, 40, 50, 60]) {
        const ports = [];
        for (let p = 1; p <= SW_PORTS[sw]; p++) {
          const c = sim.ports[sw][p];
          if (c.untagged.includes(v) || c.tagged.includes(v)) ports.push(p);
        }
        L.push(`${pad(v, 6)}${pad(VLAN_NAMES[v], 21)}${pad('active', 10)}${ports.length ? 'Gi1/0/' + compress(ports) : ''}`);
      }
      return L.join('\n');
    }
    if (/^interface status/.test(a) || /^interface$/.test(a)) {
      const only = /1\/0\/(\d+)/.exec(a)?.[1];
      const L = ['', 'Port      Status    Speed  Duplex  FlowCtrl  Active-Medium  Description', '--------  --------  -----  ------  --------  -------------  ----------------'];
      for (let p = 1; p <= SW_PORTS[sw]; p++) {
        if (only && +only !== p) continue;
        const c = sim.ports[sw][p];
        const d = portDesc(sw, p);
        const devUp = d ? (ENDPOINTS[d] ? sim.isUp(d) : d.startsWith('ER605') ? sim.isUp('ER605') : d.includes('Fibra') ? sim.isUp(sw === 'SW1' ? 'SW2' : 'SW1') : false) : false;
        const st = c.shutdown ? 'Disabled' : devUp ? 'LinkUp' : 'LinkDown';
        const sfp = SFP[sw].includes(p);
        L.push(`${pad(pn(p), 10)}${pad(st, 10)}${pad(st === 'LinkUp' ? '1000M' : '--', 7)}${pad(st === 'LinkUp' ? 'Full' : '--', 8)}${pad('Disable', 10)}${pad(sfp ? 'Fiber' : 'Copper', 15)}${d}`);
      }
      return L.join('\n');
    }
    if (/^interface configuration/.test(a)) return showOut(['interface', 'status']);
    if (/^mac/.test(a)) {
      const L = ['', 'MAC Address        VLAN    Port       Type      Aging', '-----------------  ------  ---------  --------  -----'];
      const rows = [];
      for (const e of Object.values(ENDPOINTS)) {
        if (!e.sw || !sim.isUp(e.id)) continue;
        const c = sim.ports[e.sw][e.port];
        if (c.shutdown) continue;
        const v = e.kind === 'ap' ? 10 : c.pvid;
        const port = e.sw === sw ? e.port : sw === 'SW1' ? 25 : 9;
        if (e.sw !== sw && (!sim.isUp(e.sw) || sim.ports.SW1[25].shutdown || sim.ports.SW2[9].shutdown)) continue;
        rows.push([e.mac, v, port]);
      }
      for (const w of ['VISITA', 'LAPTOP']) if (sim.wifi[w]) { const ap = ENDPOINTS[sim.wifi[w].ap]; rows.push([ENDPOINTS[w].mac, sim.vlanOf(w), ap.sw === sw ? ap.port : sw === 'SW1' ? 25 : 9]); }
      if (sim.isUp('ER605')) for (const v of [10, 20, 30, 40, 50, 60]) rows.push([macOf('ER605', 'tplink'), v, sw === 'SW1' ? 17 : 9]);
      rows.sort((x, y) => x[1] - y[1] || x[2] - y[2]);
      for (const [m, v, p] of rows) L.push(`${pad(m.toLowerCase(), 19)}${pad(v, 8)}${pad(pn(p), 11)}${pad('dynamic', 10)}Aging`);
      L.push('', `Total MAC Addresses for this criterion: ${rows.length}`);
      return L.join('\n');
    }
    if (/^running-config/.test(a)) {
      const only = /1\/0\/(\d+)/.exec(a)?.[1];
      const L = [];
      if (!only) L.push('!', `hostname "${sw}"`, '!', ...[10, 20, 30, 40, 50, 60].map((v) => `vlan ${v}\n name "${VLAN_NAMES[v]}"`), '!', `interface vlan 10\n ip address 10.10.10.${sw === 'SW1' ? 2 : 3} 255.255.255.224`, '!');
      for (let p = 1; p <= SW_PORTS[sw]; p++) {
        if (only && +only !== p) continue;
        L.push(...ifaceCfg(p));
      }
      if (!only) L.push('end');
      return L.join('\n');
    }
    if (/^power/.test(a)) {
      const L = ['', 'Interface   PoE-Status  Power-Status  Class  Device', '----------  ----------  ------------  -----  -------------------'];
      for (let p = 1; p <= SW_PORTS[sw]; p++) {
        if (SFP[sw].includes(p)) continue;
        const c = sim.ports[sw][p];
        const d = portDesc(sw, p);
        const pd = ENDPOINTS[d] && ENDPOINTS[d].power === 'poe';
        const on = pd && c.poe && !c.shutdown && sim.isUp(sw);
        L.push(`${pad(pn(p), 12)}${pad(c.poe ? 'Enable' : 'Disable', 12)}${pad(on ? 'ON' : 'OFF', 14)}${pad(pd ? (on ? 'Class ' + (d.startsWith('AP') ? 4 : 2) : '-') : '-', 7)}${pd ? d : ''}`);
      }
      L.push('', 'Clase indicada a modo ilustrativo.');
      return L.join('\n');
    }
    if (/^system-info/.test(a)) {
      return [
        '', ` System Description  - JetStream ${model}`, ` System Name         - ${sw}`, ` System Location     - ${sw === 'SW1' ? 'Rack R1 · sala técnica' : 'Rack R2 · área de escritorios'}`,
        ` IP Address          - 10.10.10.${sw === 'SW1' ? 2 : 3} (VLAN 10 · Gestión)`, ` MAC Address         - ${macOf(sw, 'tplink')}`, ` Power               - ${sim.mains ? 'Red eléctrica' : `UPS ${sw === 'SW1' ? 'R1' : 'R2'} · ${sim.battery[sw === 'SW1' ? 'R1' : 'R2'].toFixed(0)}%`}`,
      ].join('\n');
    }
    return null;
  };
  function ifaceCfg(p) {
    const c = sim.ports[sw][p];
    const L = [`interface gigabitEthernet 1/0/${p}`];
    const d = portDesc(sw, p);
    if (d) L.push(`  description "${d}"`);
    const unt = c.untagged.filter((v) => v !== 1);
    if (c.tagged.length) L.push(`  switchport general allowed vlan ${compress(c.tagged)} tagged`);
    if (unt.length) L.push(`  switchport general allowed vlan ${compress(unt)} untagged`);
    if (c.pvid !== 1) L.push(`  switchport pvid ${c.pvid}`);
    if (!c.poe && !SFP[sw].includes(p)) L.push('  power inline supply disable');
    if (c.shutdown) L.push('  shutdown');
    L.push('!');
    return L;
  }
  return {
    kind: 'switch',
    title: `${sw} · ${model} · CLI JetStream`,
    banner: [`${sw} — TP-Link JetStream ${model}`, `Gestión: 10.10.10.${sw === 'SW1' ? 2 : 3} (VLAN 10). Escribí "enable" y luego "?" o TAB.`, ''],
    prompt,
    tree: () => swTree(sw, mode),
    quick: () =>
      mode === 'user' ? ['enable', 'show vlan', 'show interface status']
      : mode === 'priv' ? ['show vlan', 'show interface status', 'show mac address-table', 'show power inline', 'configure']
      : mode === 'config' ? [`interface gigabitEthernet 1/0/${sw === 'SW2' ? 3 : 1}`, 'show vlan', 'end']
      : ['switchport general allowed vlan 20 untagged', 'switchport pvid 20', 'no shutdown', `show running-config interface gigabitEthernet 1/0/${iface}`, 'end'],
    async exec(line, out) {
      if (!sim.isUp(sw)) return out(`${sw} no responde: ${sim.downReason(sw)}.`, { ok: false });
      const raw = line.trim();
      if (!raw) return;
      if (raw === '?' || raw === 'help') {
        const o = Object.keys(swTree(sw, mode)).join('  ');
        return out(`Comandos disponibles en este modo:\n  ${o}`);
      }
      const t = canon(swTree(sw, mode), raw);
      const [c, ...args] = t;
      if (c === 'show') {
        const r = showOut(args);
        return out(r ?? '% Invalid input detected at \'^\' marker.', { ok: r != null });
      }
      if (mode === 'user') {
        if (c === 'enable') { mode = 'priv'; return out(''); }
        if (c === 'exit') return out('Conexión cerrada. (Elegí otro equipo o seguí escribiendo.)');
      } else if (mode === 'priv') {
        if (c === 'configure') { mode = 'config'; return out(''); }
        if (c === 'disable' || c === 'exit') { mode = 'user'; return out(''); }
      } else if (mode === 'config') {
        if (c === 'interface' && args[0] === 'gigabitEthernet') {
          const p = /^1\/0\/(\d+)$/.exec(args[1] || '')?.[1];
          if (!p || +p < 1 || +p > SW_PORTS[sw]) return out('% Invalid input detected at \'^\' marker.', { ok: false });
          iface = +p;
          mode = 'if';
          return out('');
        }
        if (c === 'exit' || c === 'end') { mode = 'priv'; return out(''); }
      } else if (mode === 'if') {
        const cfg = sim.ports[sw][iface];
        if (c === 'exit') { mode = 'config'; return out(''); }
        if (c === 'end') { mode = 'priv'; return out(''); }
        if (c === 'shutdown') { sim.setPortConfig(sw, iface, { shutdown: true }); return out(''); }
        if (c === 'no' && args[0] === 'shutdown') { sim.setPortConfig(sw, iface, { shutdown: false }); return out(''); }
        if (c === 'power' && args[1] === 'supply') { sim.setPortConfig(sw, iface, { poe: args[2] !== 'disable' }); return out(''); }
        if (c === 'no' && args[0] === 'power') { sim.setPortConfig(sw, iface, { poe: false }); return out(''); }
        if (c === 'switchport' && args[0] === 'pvid') {
          const v = +args[1];
          if (!v) return out('% Incomplete command.', { ok: false });
          sim.setPortConfig(sw, iface, { pvid: v });
          return out('');
        }
        if (c === 'switchport' && args[0] === 'general' && args[2] === 'vlan') {
          const l = parseList(args[3]);
          const how = args[4];
          if (!l || !['untagged', 'tagged'].includes(how)) return out('% Incomplete command.', { ok: false });
          const bad = l.filter((v) => !VLAN_NAMES[v]);
          if (bad.length) return out(`Error: VLAN ${bad.join(',')} no existe.`, { ok: false });
          const unt = new Set(cfg.untagged), tag = new Set(cfg.tagged);
          for (const v of l) { if (how === 'untagged') { unt.add(v); tag.delete(v); } else { tag.add(v); unt.delete(v); } }
          sim.setPortConfig(sw, iface, { untagged: [...unt], tagged: [...tag] });
          return out('');
        }
        if (c === 'no' && args[0] === 'switchport' && args[3] === 'vlan') {
          const l = parseList(args[4]);
          if (!l) return out('% Incomplete command.', { ok: false });
          sim.setPortConfig(sw, iface, { untagged: cfg.untagged.filter((v) => !l.includes(v)), tagged: cfg.tagged.filter((v) => !l.includes(v)) });
          return out('');
        }
      }
      return out('% Invalid input detected at \'^\' marker.', { ok: false });
    },
  };
}

// ───────────────────────── Linux (NAS / Issabel) ─────────────────────────
function linuxPing(r, host) {
  const ip = sim.resolve(host)?.ip || host;
  const L = [`PING ${ip} (${ip}) 56(84) bytes of data.`];
  r.lines.filter((l) => l.startsWith('Respuesta desde') && !l.includes('inaccesible')).forEach((l, i) => {
    const ttl = /TTL=(\d+)/.exec(l)?.[1] || 64;
    const ms = /tiempo[=<](\d+)/.exec(l)?.[1] || '0';
    L.push(`64 bytes from ${ip}: icmp_seq=${i + 1} ttl=${ttl} time=${ms === '1' ? '0.9' : ms === '0' ? '0.4' : ms + '.2'} ms`);
  });
  L.push('', `--- ${ip} ping statistics ---`, `${r.sent} packets transmitted, ${r.received} received, ${Math.round(((r.sent - r.received) / r.sent) * 100)}% packet loss`);
  if (!r.ok) L.push(`  ↳ Motivo en la simulación: ${r.reason}`);
  return L.join('\n');
}
function nasSession(id) {
  const is1 = id === 'NAS1';
  const dir = is1 ? '/volume1/estudio' : '/volume1/respaldo/estudio';
  const tree = { ls: { [dir]: {} }, cat: { '/proc/mdstat': {} }, df: { '-h': {} }, ping: { '-c': { '$num:1-5': { $host: {} } }, $host: {} }, 'ip': { addr: {} }, clear: {}, help: {} };
  return {
    kind: 'linux',
    title: `${id} · Synology DS223j · SSH`,
    banner: [`Synology DSM — ${ENDPOINTS[id].name}`, `${is1 ? 'Volumen en espejo: 2 × WD40EFPX 4 TB (4 TB nominales).' : 'Destino de la copia nocturna de NAS1.'}`, ''],
    prompt: () => `admin@${id}:~$`,
    tree: () => tree,
    quick: () => ['cat /proc/mdstat', `ls ${dir}`, 'df -h', is1 ? 'ping -c 2 10.10.60.10' : 'ping -c 2 10.10.30.10'],
    async exec(line, out) {
      const down = sim.downReason(id);
      if (down) return out(`ssh: connect to host ${ENDPOINTS[id].ip} port 22: Host is down (${down})`, { ok: false });
      const t = line.trim().split(/\s+/);
      const c = t[0];
      if (!c) return;
      if (c === 'clear') return out(null, { clear: true });
      if (c === 'help') return out('Comandos en esta simulación: ls, cat /proc/mdstat, df -h, ping [-c N] <destino>, ip addr, clear');
      if (c === 'ls') {
        const files = sim.files[id];
        if (!files.length) return out(is1 ? '' : '(vacío: todavía no se hizo ninguna copia)');
        return out(files.join('  '));
      }
      if (c === 'cat' && t[1] === '/proc/mdstat') {
        return out(is1
          ? 'Personalities : [raid1]\nmd2 : active raid1 sata1p5[0] sata2p5[1]\n      3902196544 blocks super 1.2 [2/2] [UU]\n\nmd1 : active raid1 sata1p2[0] sata2p2[1]\n      2097088 blocks [2/2] [UU]\n\nunused devices: <none>\n\n# [UU] = los dos discos del espejo están sanos.'
          : 'Personalities : [raid1]\nmd2 : active raid1 sata1p5[0]\n      3902196544 blocks super 1.2 [1/1] [U]\n\nunused devices: <none>\n\n# Un solo disco WD40EFPX: es la copia, no un espejo.');
      }
      if (c === 'df') return out(`Filesystem      Size  Used Avail Use% Mounted on\n/dev/md2        3.6T  ${is1 ? '412G' : sim.files.NAS2.length ? '405G' : '1.1G'}  ${is1 ? '3.2T  12%' : sim.files.NAS2.length ? '3.2T  12%' : '3.6T   1%'} /volume1`);
      if (c === 'ip') return out(`2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    link/ether ${ENDPOINTS[id].mac.toLowerCase()}\n    inet ${ENDPOINTS[id].ip}/${SUBNET[ENDPOINTS[id].vlan]} brd ${ENDPOINTS[id].ip.replace(/\d+$/, '')}… scope global eth0`);
      if (c === 'ping') {
        let n = 4, host = t[1];
        if (t[1] === '-c') { n = Math.max(1, Math.min(5, +t[2] || 4)); host = t[3]; }
        if (!host) return out('ping: usage error: Destination address required');
        if (!sim.resolve(host)) return out(`ping: ${host}: Name or service not known`, { ok: false });
        const r = await sim.ping(id, host, { count: n });
        return out(linuxPing(r, host), { ok: r.ok });
      }
      return out(`-sh: ${c}: command not found`, { ok: false });
    },
  };
}
function pbxSession() {
  const tree = {
    asterisk: { '-rx': { '"sip show peers"': {}, '"core show channels"': {}, '"sip show registry"': {} } },
    ping: { '-c': { '$num:1-5': { $host: {} } }, $host: {} },
    clear: {},
    help: {},
  };
  return {
    kind: 'linux',
    title: 'Central PBX · Issabel 5 · SSH',
    banner: ['Issabel 5 sobre mini PC ASUS PN41-S1 · 10.10.40.10', 'Internos 101 a 107 · troncal SIP Iptel (a cotizar)', ''],
    prompt: () => '[root@issabel ~]#',
    tree: () => tree,
    quick: () => ['asterisk -rx "sip show peers"', 'asterisk -rx "core show channels"', 'asterisk -rx "sip show registry"', 'ping -c 2 10.10.40.101'],
    async exec(line, out) {
      const down = sim.downReason('PBX');
      if (down) return out(`ssh: connect to host 10.10.40.10 port 22: Host is down (${down})`, { ok: false });
      const s = line.trim();
      if (!s) return;
      if (s === 'clear') return out(null, { clear: true });
      if (s === 'help') return out('Comandos: asterisk -rx "sip show peers" | "core show channels" | "sip show registry", ping, clear');
      const m = /^asterisk\s+-rx\s+["']?(.+?)["']?$/.exec(s);
      if (m) {
        const cmd = m[1].trim();
        if (cmd === 'sip show peers') {
          const L = ['Name/username             Host                                    Dyn Forcerport Comedia    ACL Port     Status      Description'];
          let on = 0;
          for (const id of PHONE_IDS) {
            const e = ENDPOINTS[id];
            const reach = sim.route('PBX', id).ok;
            if (reach) on++;
            L.push(`${pad(`${e.ext}/${e.ext}`, 26)}${pad(reach ? e.ip : '(Unspecified)', 40)}${pad('D', 4)}${pad('Auto (No)', 11)}${pad('No', 11)}${pad('', 4)}${pad(reach ? '5060' : '0', 9)}${pad(reach ? `OK (${2 + (e.ext % 5)} ms)` : 'UNREACHABLE', 12)}${e.place}`);
          }
          const w = sim.activeWan();
          L.push(`${pad('iptel/troncal', 26)}${pad(w ? 'proveedor SIP Iptel' : '(Unspecified)', 40)}${pad('', 4)}${pad('No', 11)}${pad('No', 11)}${pad('', 4)}${pad('5060', 9)}${pad(w ? 'OK' : 'UNREACHABLE', 12)}Troncal externa`);
          L.push(`8 sip peers [Monitored: ${on + (w ? 1 : 0)} online, ${8 - on - (w ? 1 : 0)} offline Unmonitored: 0 online, 0 offline]`);
          return out(L.join('\n'));
        }
        if (cmd === 'core show channels') {
          const L = ['Channel              Location             State   Application(Data)'];
          for (const c of sim.calls) {
            const a = ENDPOINTS[c.a].ext;
            L.push(`${pad(`SIP/${a}-0000000${a % 10}`, 21)}${pad(c.b === 'externo' ? 's@from-internal' : `${ENDPOINTS[c.b].ext}@from-internal`, 21)}${pad('Up', 8)}Dial(${c.b === 'externo' ? 'SIP/iptel/...' : `SIP/${ENDPOINTS[c.b].ext}`})`);
          }
          L.push(`${sim.calls.length} active channel${sim.calls.length === 1 ? '' : 's'}`, `${sim.calls.length} active call${sim.calls.length === 1 ? '' : 's'}`);
          return out(L.join('\n'));
        }
        if (cmd === 'sip show registry') {
          const w = sim.activeWan();
          return out(`Host                                    dnsmgr Username       Refresh State                Reg.Time\nproveedor SIP Iptel:5060                N      (número Rosario)   105 ${w ? 'Registered           ' : 'Request Sent         '}${w ? 'hoy' : ''}\n1 SIP registrations.${w ? '' : '\n# Sin internet: la troncal no registra. Los internos 101-107 siguen funcionando.'}`);
        }
        return out(`No such command '${cmd}' (type 'core show help ${cmd.split(' ')[0]}' for other possible commands)`, { ok: false });
      }
      if (s.startsWith('ping')) {
        const t = s.split(/\s+/);
        let n = 4, host = t[1];
        if (t[1] === '-c') { n = Math.max(1, Math.min(5, +t[2] || 4)); host = t[3]; }
        if (!host || !sim.resolve(host)) return out(`ping: ${host || ''}: Name or service not known`, { ok: false });
        const r = await sim.ping('PBX', host, { count: n });
        return out(linuxPing(r, host), { ok: r.ok });
      }
      return out(`-bash: ${s.split(' ')[0]}: command not found`, { ok: false });
    },
  };
}
// ───────────────────────── ER605 (GUI / Omada) ─────────────────────────
function routerSession() {
  const view = () => {
    const w = sim.activeWan();
    const vpnOn = Object.entries(sim.vpn).filter(([, v]) => v).map(([k]) => k);
    return [
      'El ER605 V2 se configura desde su interfaz web / controlador Omada.',
      'No tiene una consola de comandos para el usuario: esto es lo equivalente en la interfaz.',
      '',
      '▸ Red › WAN › Modo WAN ............ 2 WAN (WAN1 + WAN2)',
      `    WAN1 · Claro 200 Mb/s ......... 192.168.100.2   ${sim.wan.claro ? (w === 'claro' ? 'CONECTADO · en uso' : 'CONECTADO') : 'CAÍDO'}`,
      `    WAN2 · Personal 300 Mb/s ...... 192.168.200.2   ${sim.wan.personal ? (w === 'personal' ? 'CONECTADO · en uso' : 'CONECTADO · respaldo') : 'CAÍDO'}`,
      '▸ Transmisión › Balanceo › Respaldo de enlace ... WAN1 principal, WAN2 respaldo',
      '▸ Red › LAN › VLAN (gateway .1 en cada red):',
      ...Object.entries(VLANS).map(([v, d]) => `    VLAN${pad(v, 3)} ${pad(d.name, 22)} ${pad(d.net, 16)} gw 10.10.${v}.1`),
      '    LAN4 → SW1/17 (troncal con todas las VLAN)',
      '▸ Firewall › Control de acceso:',
      '    Visitas (VLAN50) → solo internet. Bloqueado a archivos y administración.',
      '    VPN → carpetas, impresoras y escritorio remoto autorizado.',
      '    Administración desde internet: deshabilitada.',
      `▸ VPN › WireGuard ................. 10.10.70.0/28 · peers EXT1-EXT4 (.2 a .5) · conectados: ${vpnOn.length ? vpnOn.join(', ') : 'ninguno'}`,
      `▸ Estado ........................... ${sim.isUp('ER605') ? (sim.mains ? 'Encendido' : `Encendido por UPS R1 (${sim.battery.R1.toFixed(0)}%)`) : 'APAGADO'}`,
      '',
      'Probá: "estado", "wan", "vpn" o usá los bloques para cortar un proveedor.',
    ].join('\n');
  };
  return {
    kind: 'gui',
    title: 'ER605 V2 · administración por interfaz web / Omada',
    banner: [],
    prompt: () => 'ER605 ›',
    tree: () => ({ estado: {}, wan: {}, vpn: {}, help: {} }),
    quick: () => ['estado', 'wan', 'vpn'],
    initial: view,
    async exec(line, out) {
      const c = line.trim().toLowerCase();
      if (!c) return;
      if (c === 'estado' || c === 'help') return out(view());
      if (c === 'wan') return out(view().split('\n').slice(3, 7).join('\n'));
      if (c === 'vpn') return out(view().split('\n').filter((l) => l.includes('WireGuard') || l.includes('VPN')).join('\n'));
      return out('Este equipo no tiene CLI: usá "estado", "wan" o "vpn" para ver su configuración.', { ok: false });
    },
  };
}

export function createSession(id) {
  if (id === 'SW1' || id === 'SW2') return swSession(id);
  if (id === 'NAS1' || id === 'NAS2') return nasSession(id);
  if (id === 'PBX') return pbxSession();
  if (id === 'ER605') return routerSession();
  if (ENDPOINTS[id]) return winSession(id);
  return null;
}
export function suggest(session, line) {
  return options(session.tree(), line).opts.slice(0, 14);
}
export function tabComplete(session, line) {
  return complete(session.tree(), line);
}
export { compress, parseList, VLAN_NAMES };
