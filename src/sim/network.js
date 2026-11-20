// ─────────────────────────────────────────────────────────────────────────────
// Simulador de red del estudio (modelo del TP, no es GNS3 real).
// Modela L2 (VLAN por puerto, troncales, fibra entre switches, puertos apagados),
// L3 (gateway .1 por VLAN en el ER605, reglas de acceso de la p.4), dual WAN con
// respaldo, PoE, UPS, telefonía Issabel, Wi-Fi, VPN WireGuard y copias del NAS.
// Todo se arma a partir de src/data/tp.js.
//
// Contrato de animación (lo consume el mundo 3D y la topología del laboratorio):
//   bus.emit('packet', { id, segments:[{id, dir}], ok, color, label, kind, vlan, duration })
//   ids de segmento: 'cable:<DEV>' (equipo→switch), 'rack:NAS1' | 'rack:PBX' (switch→equipo),
//   'rack:ER605' (SW1/17→ER605 LAN4), 'fiber' (SW1→SW2), 'wan:claro' | 'wan:personal'
//   (ER605→proveedor→internet), 'wifi:AP1' | 'wifi:AP2' (AP→cliente inalámbrico).
//   dir 1 = sentido canónico, -1 = inverso. ok:false = el paquete muere al final del
//   último segmento.
// ─────────────────────────────────────────────────────────────────────────────
import { bus } from '../core/bus.js';
import { OUTLETS, VLANS, WAN, DEVICES, PHONES } from '../data/tp.js';

const ALL_VLANS = [10, 20, 30, 40, 50, 60];
const SUBNET = { 10: 27, 20: 24, 30: 27, 40: 24, 50: 24, 60: 28, 70: 28 };
const MASK = { 24: '255.255.255.0', 27: '255.255.255.224', 28: '255.255.255.240' };
export const SSIDS = { Empleados: { vlan: 20, name: 'Alvarez-Empleados' }, Visitas: { vlan: 50, name: 'Alvarez-Visitas' } };
export const SAMPLE_FILES = [
  'balance_2026.xlsx',
  'clientes_activos.xlsx',
  'liquidacion_iva_oct.pdf',
  'sueldos_noviembre.pdf',
  'contratos/',
  'escaneos/',
];

// ── MACs determinísticas con OUI real del fabricante (el resto es ilustrativo) ──
const OUI = { tplink: '50:C7:BF', grandstream: '00:0B:82', synology: '00:11:32', asus: '04:42:1A', pc: '3C:52:82', printer: '30:05:5C', phone: 'A4:C3:F0', laptop: '8C:16:45' };
function mac(id, vendor) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const b = [h & 255, (h >> 8) & 255, (h >> 16) & 255].map((x) => x.toString(16).padStart(2, '0').toUpperCase());
  return `${OUI[vendor]}:${b.join(':')}`;
}
const vlanOfIp = (ip) => {
  const m = /^10\.10\.(\d+)\.\d+$/.exec(ip || '');
  return m ? +m[1] : null;
};

// ── Inventario de equipos finales (de la tabla de bocas p.6 + conexiones del rack) ──
function buildEndpoints() {
  const ep = {};
  for (const o of OUTLETS) {
    const kind = o.dev.startsWith('PC') ? 'pc' : o.dev.startsWith('TEL') ? 'phone' : o.dev.startsWith('IMP') ? 'printer' : o.dev.startsWith('AP') ? 'ap' : 'nas';
    ep[o.dev] = {
      id: o.dev, kind, ip: o.ip, vlan: kind === 'ap' ? 10 : o.vlan, sw: o.sw, port: o.port, outlet: o.label, place: o.place,
      seg: `cable:${o.dev}`, segDir: 1, // equipo → switch
      power: kind === 'phone' || kind === 'ap' ? 'poe' : o.dev === 'NAS2' ? 'ups:NAS2' : 'mains',
      os: kind === 'pc' ? 'win' : kind === 'nas' ? 'linux' : kind,
      mac: mac(o.dev, kind === 'phone' ? 'grandstream' : kind === 'ap' ? 'tplink' : kind === 'nas' ? 'synology' : kind === 'printer' ? 'printer' : 'pc'),
      name: kind === 'pc' ? `${o.dev} · ${o.place}` : (DEVICES[o.dev]?.name || `${o.dev} · ${o.place}`),
      ext: PHONES.ext[o.dev],
    };
  }
  ep.NAS1 = { id: 'NAS1', kind: 'nas', ip: '10.10.30.10', vlan: 30, sw: 'SW1', port: 18, seg: 'rack:NAS1', segDir: -1, power: 'ups:R1', os: 'linux', mac: mac('NAS1', 'synology'), name: DEVICES.NAS1.name, place: 'R1' };
  ep.PBX = { id: 'PBX', kind: 'pbx', ip: '10.10.40.10', vlan: 40, sw: 'SW1', port: 19, seg: 'rack:PBX', segDir: -1, power: 'ups:R1', os: 'linux', mac: mac('PBX', 'asus'), name: DEVICES.PBX.name, place: 'R1' };
  // Clientes inalámbricos (ejemplos para la simulación)
  ep.VISITA = { id: 'VISITA', kind: 'wifi', ip: null, vlan: null, power: 'battery', os: 'phone', mac: mac('VISITA', 'phone'), name: 'Celular de una visita', wireless: true };
  ep.LAPTOP = { id: 'LAPTOP', kind: 'wifi', ip: null, vlan: null, power: 'battery', os: 'win', mac: mac('LAPTOP', 'laptop'), name: 'Notebook de un empleado', wireless: true };
  // Externos por VPN WireGuard (p.4: 10.10.70.0/28, .2 a .5)
  for (let i = 1; i <= 4; i++) ep[`EXT${i}`] = { id: `EXT${i}`, kind: 'vpn', ip: `10.10.70.${i + 1}`, vlan: 70, power: 'battery', os: 'win', mac: '—', name: `Empleado externo ${i}`, remote: true };
  return ep;
}
export const ENDPOINTS = buildEndpoints();
const PORT_DESC = {};
for (const e of Object.values(ENDPOINTS)) if (e.sw) PORT_DESC[`${e.sw}/${e.port}`] = e.id;
PORT_DESC['SW1/17'] = 'ER605 LAN4';
PORT_DESC['SW1/25'] = 'Fibra a SW2';
PORT_DESC['SW2/9'] = 'Fibra a SW1';
export const portDesc = (sw, p) => PORT_DESC[`${sw}/${p}`] || '';

// ── Configuración de puertos por defecto según el TP ──
export const SW_PORTS = { SW1: 28, SW2: 10 };
export const SFP = { SW1: [25, 26, 27, 28], SW2: [9, 10] };
function defaultPorts() {
  const P = { SW1: {}, SW2: {} };
  for (const sw of ['SW1', 'SW2'])
    for (let p = 1; p <= SW_PORTS[sw]; p++) P[sw][p] = { pvid: 1, untagged: [1], tagged: [], shutdown: false, poe: !SFP[sw].includes(p) };
  for (const e of Object.values(ENDPOINTS)) {
    if (!e.sw) continue;
    const c = P[e.sw][e.port];
    if (e.kind === 'ap') Object.assign(c, { pvid: 10, untagged: [10], tagged: [20, 50] });
    else Object.assign(c, { pvid: e.vlan, untagged: [e.vlan], tagged: [] });
  }
  Object.assign(P.SW1[17], { pvid: 1, untagged: [1], tagged: [...ALL_VLANS] });
  Object.assign(P.SW1[25], { pvid: 1, untagged: [1], tagged: [...ALL_VLANS] });
  Object.assign(P.SW2[9], { pvid: 1, untagged: [1], tagged: [...ALL_VLANS] });
  for (const p of [20, 21, 22, 23, 24]) P.SW1[p].shutdown = true;
  P.SW2[8].shutdown = true;
  return P;
}
const carries = (c, v) => !!c && !c.shutdown && (c.untagged.includes(v) || c.tagged.includes(v));

const rev = (segs) => segs.slice().reverse().map((s) => ({ id: s.id, dir: -s.dir }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pktSeq = 0;

export function vlanColor(v) {
  return VLANS[v]?.color || '#9fb3c8';
}

class NetworkSim {
  constructor() {
    this.fast = false; // en tests: sin esperas
    this.speed = 1;
    this._timer = null;
    this.reset(true);
  }

  // ─────────── estado ───────────
  reset(silent = false) {
    this.ports = defaultPorts();
    this.wan = { claro: true, personal: true };
    this.mains = true;
    this.battery = { R1: 100, R2: 100, NAS2: 100 };
    this.wifi = { VISITA: null, LAPTOP: null };
    this.vpn = { EXT1: false, EXT2: false, EXT3: false, EXT4: false };
    this.calls = [];
    this.files = { NAS1: [...SAMPLE_FILES], NAS2: [], B2: [] };
    this.lastBackup = null;
    this.faults = new Set();
    this.arp = {};
    this.log = [];
    this._stopDrain();
    if (!silent) this._changed('reset');
  }
  getState() {
    const devices = {};
    for (const id of Object.keys(ENDPOINTS)) devices[id] = { up: this.isUp(id), reason: this.downReason(id) };
    for (const id of ['SW1', 'SW2', 'ER605', 'NAS1', 'PBX', 'ONT_CLARO', 'ONT_PERSONAL']) devices[id] = { up: this.isUp(id), reason: this.downReason(id) };
    return {
      mains: this.mains,
      battery: { ...this.battery },
      wan: { ...this.wan, active: this.activeWan() },
      ports: JSON.parse(JSON.stringify(this.ports)),
      wifi: JSON.parse(JSON.stringify(this.wifi)),
      vpn: { ...this.vpn },
      calls: this.calls.map((c) => ({ ...c })),
      files: { NAS1: [...this.files.NAS1], NAS2: [...this.files.NAS2], B2: [...this.files.B2] },
      lastBackup: this.lastBackup,
      faults: [...this.faults],
      devices,
      links: this.linkStatus(),
    };
  }
  _changed(what) {
    bus.emit('sim:change', { what, state: this.getState() });
  }

  // ─────────── energía ───────────
  upsOf(id) {
    if (['SW1', 'ER605', 'NAS1', 'PBX', 'ONT_CLARO', 'ONT_PERSONAL'].includes(id)) return 'R1';
    if (id === 'SW2') return 'R2';
    if (id === 'NAS2') return 'NAS2';
    return null;
  }
  isUp(id) {
    return !this.downReason(id);
  }
  downReason(id) {
    const u = this.upsOf(id);
    if (u) return this.mains || this.battery[u] > 0 ? null : `sin energía (UPS de ${u} agotada)`;
    const e = ENDPOINTS[id];
    if (!e) return null;
    if (e.power === 'battery') return null;
    if (e.power === 'mains') return this.mains ? null : 'sin energía (no tiene UPS)';
    if (e.power === 'poe') {
      if (!this.isUp(e.sw)) return `sin PoE: ${e.sw} apagado`;
      const c = this.ports[e.sw][e.port];
      if (c.shutdown) return `sin PoE: ${e.sw}/${e.port} apagado (shutdown)`;
      if (!c.poe) return `sin PoE en ${e.sw}/${e.port}`;
      return null;
    }
    return null;
  }
  setPower(on) {
    this.mains = !!on;
    if (on) {
      this._stopDrain();
      this.battery = { R1: 100, R2: 100, NAS2: 100 };
    } else this._startDrain();
    this.calls = this.calls.filter((c) => this.isUp(c.a) && (c.b === 'externo' || this.isUp(c.b)));
    this._changed('power');
    return { mains: this.mains };
  }
  // Autonomía objetivo del TP: 10 minutos (a comprobar). Reloj acelerado ×6: 100 s reales.
  _startDrain() {
    this._stopDrain();
    const perSec = 100 / 100; // % por segundo real
    this._timer = setInterval(() => {
      let changed = false;
      for (const k of Object.keys(this.battery)) {
        if (this.battery[k] > 0) {
          this.battery[k] = Math.max(0, +(this.battery[k] - perSec).toFixed(2));
          changed = true;
        }
      }
      if (changed) this._changed('battery');
      else this._stopDrain();
    }, 1000);
    this._timer.unref?.();
  }
  _stopDrain() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
  }
  batteryMinutes(k) {
    return +((this.battery[k] / 100) * 10).toFixed(1);
  }

  // ─────────── internet ───────────
  activeWan() {
    if (!this.isUp('ER605')) return null;
    if (this.wan.claro && this.isUp('ONT_CLARO')) return 'claro';
    if (this.wan.personal && this.isUp('ONT_PERSONAL')) return 'personal';
    return null;
  }
  setWan(isp, up) {
    const before = this.activeWan();
    this.wan[isp] = !!up;
    const after = this.activeWan();
    let note = '';
    if (before !== after) {
      // p.4: "las llamadas o la VPN pueden tener que reconectarse"
      const hadVpn = Object.values(this.vpn).some(Boolean);
      for (const k of Object.keys(this.vpn)) this.vpn[k] = false;
      const ext = this.calls.filter((c) => c.b === 'externo').length;
      this.calls = this.calls.filter((c) => c.b !== 'externo');
      note = after
        ? `El ER605 pasó a ${after === 'claro' ? 'Claro (principal)' : 'Personal (respaldo)'}.` + (hadVpn || ext ? ' Las sesiones VPN y llamadas externas se cortaron y tienen que reconectarse.' : '')
        : 'Sin internet: los dos proveedores están caídos. La red interna y los internos siguen funcionando.';
    }
    this._changed('wan');
    return { active: after, note };
  }

  // ─────────── puertos ───────────
  setPortConfig(sw, port, cfg = {}) {
    const c = this.ports[sw]?.[port];
    if (!c) throw new Error(`Puerto inexistente ${sw}/${port}`);
    if (cfg.mode === 'access' && cfg.pvid != null) Object.assign(c, { pvid: +cfg.pvid, untagged: [+cfg.pvid], tagged: [] });
    else if (cfg.mode === 'trunk') {
      if (cfg.allowed) c.tagged = cfg.allowed.map(Number);
      if (cfg.pvid != null) c.pvid = +cfg.pvid;
    } else {
      if (cfg.untagged) c.untagged = cfg.untagged.map(Number);
      if (cfg.tagged) c.tagged = cfg.tagged.map(Number);
      if (cfg.pvid != null) c.pvid = +cfg.pvid;
      if (cfg.vlan != null) Object.assign(c, { pvid: +cfg.vlan, untagged: [+cfg.vlan], tagged: [] });
    }
    if (cfg.shutdown != null) c.shutdown = !!cfg.shutdown;
    if (cfg.poe != null) c.poe = !!cfg.poe;
    // si se arregló lo que rompía una falla, la falla deja de estar activa
    if (sw === 'SW2' && port === 3 && c.pvid === 20 && c.untagged.includes(20)) this.faults.delete('pc09-wrong-pvid');
    if (sw === 'SW2' && port === 3 && !c.shutdown) this.faults.delete('sw2-port3-shutdown');
    this._changed('port');
    return { ...c };
  }

  // ─────────── fallas para misiones ───────────
  injectFault(id) {
    this.faults.add(id);
    if (id === 'pc09-wrong-pvid') Object.assign(this.ports.SW2[3], { pvid: 30, untagged: [30], tagged: [] });
    else if (id === 'sw2-port3-shutdown') this.ports.SW2[3].shutdown = true;
    else if (id === 'claro-down') this.wan.claro = false;
    else if (id === 'fiber-cut') this.ports.SW1[25].shutdown = true;
    this._changed('fault');
  }
  clearFaults() {
    if (this.faults.has('pc09-wrong-pvid') || this.faults.has('sw2-port3-shutdown')) Object.assign(this.ports.SW2[3], { pvid: 20, untagged: [20], tagged: [], shutdown: false });
    if (this.faults.has('claro-down')) this.wan.claro = true;
    if (this.faults.has('fiber-cut')) this.ports.SW1[25].shutdown = false;
    this.faults.clear();
    this._changed('fault');
  }

  // ─────────── enlaces (para la topología) ───────────
  linkStatus() {
    const L = {};
    for (const e of Object.values(ENDPOINTS)) {
      if (!e.sw) continue;
      const c = this.ports[e.sw][e.port];
      const key = e.seg.replace(/^cable:|^rack:/, '');
      L[key] = c.shutdown ? 'shutdown' : this.isUp(e.sw) && this.isUp(e.id) ? (c.untagged.includes(e.vlan) || e.kind === 'ap' ? 'up' : 'vlan') : 'down';
    }
    L.ER605 = this.isUp('SW1') && this.isUp('ER605') && !this.ports.SW1[17].shutdown ? 'up' : 'down';
    L.fiber = this.ports.SW1[25].shutdown || this.ports.SW2[9].shutdown ? 'shutdown' : this.isUp('SW1') && this.isUp('SW2') ? 'up' : 'down';
    L.claro = this.wan.claro && this.isUp('ER605') ? (this.activeWan() === 'claro' ? 'up' : 'standby') : 'down';
    L.personal = this.wan.personal && this.isUp('ER605') ? (this.activeWan() === 'personal' ? 'up' : 'standby') : 'down';
    return L;
  }

  // ─────────── resolución ───────────
  resolve(x) {
    if (x == null) return null;
    const s = String(x).trim();
    const up = s.toUpperCase();
    if (ENDPOINTS[up]) return { type: 'host', id: up, ep: ENDPOINTS[up], ip: this.ipOf(up) };
    const tel = /^(?:TEL|INT(?:ERNO)?)?\s*(10[1-7])$/.exec(up);
    if (tel) return this.resolve(`TEL${tel[1]}`);
    if (up === 'ER605' || up === 'ROUTER') return { type: 'router', id: 'ER605', ip: '10.10.10.1' };
    if (up === 'SW1' || up === 'SW2') return { type: 'switch', id: up, ip: up === 'SW1' ? '10.10.10.2' : '10.10.10.3' };
    if (['INTERNET', 'GOOGLE', 'GOOGLE.COM', 'WWW.GOOGLE.COM'].includes(up)) return { type: 'internet', id: 'INTERNET', ip: '8.8.8.8', name: up.includes('GOOGLE') ? 'google.com' : '8.8.8.8' };
    if (up === 'B2' || up === 'BACKBLAZE') return { type: 'internet', id: 'B2', ip: 'Backblaze B2', name: 'Backblaze B2' };
    if (/^\d+\.\d+\.\d+\.\d+$/.test(s)) {
      for (const e of Object.values(ENDPOINTS)) if (this.ipOf(e.id) === s) return { type: 'host', id: e.id, ep: e, ip: s };
      if (/^10\.10\.(10|20|30|40|50|60|70)\.1$/.test(s)) return { type: 'router', id: 'ER605', ip: s };
      if (s === '10.10.10.2') return { type: 'switch', id: 'SW1', ip: s };
      if (s === '10.10.10.3') return { type: 'switch', id: 'SW2', ip: s };
      if (s === '192.168.100.1' || s === '192.168.200.1') return { type: 'isp', id: s.includes('100') ? 'claro' : 'personal', ip: s };
      if (s.startsWith('10.10.')) return { type: 'nohost', id: s, ip: s, vlan: vlanOfIp(s) };
      if (s.startsWith('192.168.')) return { type: 'nohost', id: s, ip: s };
      return { type: 'internet', id: 'INTERNET', ip: s, name: s };
    }
    return null;
  }
  ipOf(id) {
    const e = ENDPOINTS[id];
    if (!e) return null;
    if (e.wireless) return this.wifi[id]?.ip || null;
    return e.ip;
  }
  vlanOf(id) {
    const e = ENDPOINTS[id];
    if (!e) return null;
    if (e.wireless) return this.wifi[id] ? SSIDS[this.wifi[id].ssid].vlan : null;
    return e.vlan;
  }
  deviceInfo(id) {
    const r = this.resolve(id);
    if (!r) return null;
    if (r.type === 'host') {
      const e = r.ep;
      const vlan = this.vlanOf(e.id);
      const pre = SUBNET[vlan];
      return {
        id: e.id, name: e.name, kind: e.kind, ip: this.ipOf(e.id), vlan, mask: MASK[pre], prefix: pre,
        gateway: vlan ? `10.10.${vlan}.1` : null, mac: e.mac, sw: e.sw, port: e.port, outlet: e.outlet,
        ap: this.wifi[e.id]?.ap, ssid: this.wifi[e.id]?.ssid, up: this.isUp(e.id), reason: this.downReason(e.id), ext: e.ext,
      };
    }
    if (r.type === 'router') return { id: 'ER605', name: DEVICES.ER605.name, kind: 'router', ip: '10.10.10.1', up: this.isUp('ER605') };
    if (r.type === 'switch') return { id: r.id, name: DEVICES[r.id].name, kind: 'switch', ip: r.ip, up: this.isUp(r.id) };
    return { id: r.id, kind: r.type, ip: r.ip };
  }

  // ─────────── motor L2 ───────────
  // Adjunto de un equipo: desde dónde entra a la red y con qué segmentos.
  attach(id) {
    const e = ENDPOINTS[id];
    if (id === 'ER605') return { sw: 'SW1', port: 17, segs: [{ id: 'rack:ER605', dir: -1 }], tagged: true };
    if (!e) return null;
    if (e.wireless) {
      const w = this.wifi[id];
      if (!w) return { err: `${id} no está conectado a ningún Wi-Fi` };
      const ap = ENDPOINTS[w.ap];
      return { sw: ap.sw, port: ap.port, segs: [{ id: `wifi:${w.ap}`, dir: -1 }, { id: ap.seg, dir: 1 }], tagged: true, ap: w.ap };
    }
    if (e.remote) return null;
    return { sw: e.sw, port: e.port, segs: [{ id: e.seg, dir: e.segDir }], tagged: false };
  }
  // Recorre switches dentro de una VLAN. Devuelve {ok, segs, reason, failSegs}
  l2(from, to, vlan) {
    const segs = [];
    const pName = (a) => `${a.sw}/${a.port}`;
    if (!this.isUp(from.sw)) return { ok: false, segs: [...from.segs], reason: `${from.sw} está sin energía` };
    const cf = this.ports[from.sw][from.port];
    if (cf.shutdown) return { ok: false, segs: [...from.segs], reason: `el puerto ${pName(from)} está apagado (shutdown)` };
    if (!carries(cf, vlan)) return { ok: false, segs: [...from.segs], reason: `el puerto ${pName(from)} no lleva la VLAN ${vlan}` };
    segs.push(...from.segs);
    if (from.sw !== to.sw) {
      const a = this.ports.SW1[25], b = this.ports.SW2[9];
      if (a.shutdown || b.shutdown) return { ok: false, segs, reason: 'la fibra SW1/25 ↔ SW2/9 está apagada' };
      if (!carries(a, vlan) || !carries(b, vlan)) return { ok: false, segs, reason: `la fibra no transporta la VLAN ${vlan}` };
      segs.push({ id: 'fiber', dir: from.sw === 'SW1' ? 1 : -1 });
      if (!this.isUp(to.sw)) return { ok: false, segs, reason: `${to.sw} está sin energía` };
    }
    const ct = this.ports[to.sw][to.port];
    const back = rev(to.segs);
    if (ct.shutdown) return { ok: false, segs, reason: `el puerto ${pName(to)} está apagado (shutdown)` };
    if (to.tagged ? !carries(ct, vlan) : !(ct.untagged.includes(vlan) && ct.pvid === vlan))
      return { ok: false, segs, reason: `el puerto ${pName(to)} está en la VLAN ${ct.pvid}, no en la ${vlan}` };
    segs.push(...back);
    return { ok: true, segs };
  }
  // VLAN en la que efectivamente queda un equipo (según el PVID de su puerto o el SSID)
  effVlan(id) {
    const e = ENDPOINTS[id];
    if (e.wireless) return this.vlanOf(id);
    if (e.remote) return 70;
    return this.ports[e.sw][e.port].pvid;
  }
  // Reglas de acceso (p.4): visitas solo internet; VPN solo a sus carpetas e impresoras
  // (VLAN30) y a las PCs por escritorio remoto (VLAN20); sin administración desde internet.
  acl(srcVlan, dst) {
    const dv = dst.type === 'internet' ? 'inet' : dst.type === 'router' ? 'router' : dst.type === 'switch' ? 10 : this.vlanOf(dst.id) ?? vlanOfIp(dst.ip);
    if (srcVlan === 50) {
      if (dv === 'inet') return null;
      if (dv === 'router' && dst.ip === '10.10.50.1') return null;
      return 'regla de firewall: la red de Visitas solo sale a internet (p.4)';
    }
    if (srcVlan === 70) {
      if (dv === 20 || dv === 30) return null;
      if (dv === 'inet') return 'la VPN solo da acceso a los recursos del estudio';
      return 'regla de firewall: la VPN solo ve las carpetas y recursos autorizados (p.7)';
    }
    return null;
  }

  // Calcula el camino completo de src a dst. No anima.
  route(srcId, dstX) {
    const sR = this.resolve(srcId);
    const d = this.resolve(dstX);
    const res = { ok: false, fwd: [], back: [], hops: [], reason: '', src: sR?.id, dst: d, via: null, vlan: null, ttl: 128, kind: 'icmp' };
    if (!sR || sR.type !== 'host') return { ...res, reason: `origen desconocido: ${srcId}` };
    if (!d) return { ...res, reason: `no se pudo resolver "${dstX}"` };
    const s = sR.ep;
    const why = this.downReason(s.id);
    if (why) return { ...res, reason: `${s.id} está apagado: ${why}`, noSend: true };
    const sVlan = this.vlanOf(s.id);
    res.vlan = sVlan;
    if (s.wireless && !this.wifi[s.id]) return { ...res, reason: `${s.id} no está conectado al Wi-Fi`, noSend: true };
    if (s.remote && !this.vpn[s.id]) return { ...res, reason: `${s.id} no tiene la VPN conectada`, noSend: true };
    if (d.type === 'host' && d.id === s.id) return { ...res, ok: true, hops: [d.ip], loopback: true };
    if (d.type === 'host' && this.downReason(d.id)) {
      // el camino puede existir pero el destino no responde
    }
    const gw = `10.10.${sVlan}.1`;
    const segs = [];
    const fail = (reason, extra = {}) => ({ ...res, ...extra, fwd: segs.slice(), reason });

    // ── tramo 1: del origen al ER605 (o directo dentro de la VLAN) ──
    let atRouter = false;
    if (s.remote) {
      const w = this.activeWan();
      if (!w) return fail('sin internet: la VPN no puede llegar al ER605');
      segs.push({ id: `wan:${w}`, dir: -1 });
      res.via = w;
      atRouter = true;
      res.hops.push('10.10.70.1');
    } else {
      const att = this.attach(s.id);
      if (att.err) return fail(att.err);
      const eff = this.effVlan(s.id);
      // la red de destino está en la misma VLAN que la IP del origen → entrega directa (ARP)
      const dVlanIp = d.type === 'host' ? this.vlanOf(d.id) : null;
      if (d.type === 'host' && dVlanIp === sVlan && !d.ep.remote) {
        if (eff !== sVlan) return fail(`ARP sin respuesta: ${att.sw}/${att.port} tiene PVID ${eff} y ${s.id} usa una IP de la VLAN ${sVlan}`, { failSegs: att.segs, arpFail: true, fwd: att.segs });
        const dAtt = this.attach(d.id);
        if (dAtt?.err) return fail(dAtt.err);
        const r = this.l2(att, dAtt, sVlan);
        if (!r.ok) return { ...res, fwd: r.segs, reason: r.reason };
        if (this.downReason(d.id)) return { ...res, fwd: r.segs, reason: `${d.id} no responde: ${this.downReason(d.id)}` };
        res.fwd = r.segs;
        res.back = rev(r.segs);
        res.hops.push(d.ip);
        res.ok = true;
        res.ttl = d.ep.os === 'win' ? 128 : 64;
        this._learn(s.id, d.id);
        return res;
      }
      if (eff !== sVlan) {
        return { ...res, fwd: att.segs, reason: `ARP sin respuesta para la puerta de enlace ${gw}: ${att.sw}/${att.port} tiene PVID ${eff} y ${s.id} está configurado en la VLAN ${sVlan}`, arpFail: true };
      }
      const r = this.l2(att, this.attach('ER605'), sVlan);
      if (!r.ok) return { ...res, fwd: r.segs, reason: r.reason };
      if (!this.isUp('ER605')) return { ...res, fwd: r.segs, reason: 'el ER605 está sin energía' };
      segs.push(...r.segs);
      atRouter = true;
      res.hops.push(gw);
      this._learn(s.id, 'ER605');
    }
    if (!atRouter) return fail('sin camino');

    // ── tramo 2: el ER605 decide ──
    if (d.type === 'router') {
      const deny = this.acl(sVlan, d);
      if (deny) return fail(deny);
      res.ok = true; res.fwd = segs.slice(); res.back = rev(segs); res.ttl = 64;
      if (res.hops[res.hops.length - 1] !== d.ip) res.hops.push(d.ip);
      return res;
    }
    if (d.type === 'nohost') return fail(`ningún equipo responde en ${d.ip}`);
    if (d.type === 'isp') {
      res.ok = this.wan[d.id] && this.isUp('ER605');
      segs.push({ id: `wan:${d.id}`, dir: 1 });
      res.fwd = segs.slice(); res.back = rev(segs); res.ttl = 64; res.hops.push(d.ip);
      if (!res.ok) res.reason = `el enlace de ${d.id === 'claro' ? 'Claro' : 'Personal'} está caído`;
      return res;
    }
    const deny = this.acl(sVlan, d);
    if (deny) return fail(deny, { blocked: true });
    if (d.type === 'internet') {
      const w = this.activeWan();
      if (!w) return fail('sin internet: Claro y Personal están caídos');
      segs.push({ id: `wan:${w}`, dir: 1 });
      res.via = w;
      res.hops.push(w === 'claro' ? '192.168.100.1' : '192.168.200.1', '*', d.ip);
      res.ok = true; res.fwd = segs.slice(); res.back = rev(segs); res.ttl = 116;
      return res;
    }
    if (d.type === 'switch') {
      const r = this.l2(this.attach('ER605'), { sw: d.id, port: d.id === 'SW1' ? 17 : 9, segs: [], tagged: true }, 10);
      if (!r.ok) return fail(r.reason);
      if (!this.isUp(d.id)) return fail(`${d.id} está sin energía`);
      segs.push(...r.segs);
      res.ok = true; res.fwd = segs.slice(); res.back = rev(segs); res.ttl = 63; res.hops.push(d.ip);
      return res;
    }
    // host en otra VLAN
    const de = d.ep;
    if (de.remote) {
      if (!this.vpn[de.id]) return fail(`${de.id} no está conectado por VPN`);
      const w = this.activeWan();
      if (!w) return fail('sin internet: no hay túnel VPN');
      segs.push({ id: `wan:${w}`, dir: 1 });
      res.ok = true; res.fwd = segs.slice(); res.back = rev(segs); res.ttl = 127; res.hops.push(this.ipOf(de.id));
      return res;
    }
    const dAtt = this.attach(de.id);
    if (!dAtt || dAtt.err) return fail(dAtt?.err || 'destino sin conexión');
    const dVlan = this.vlanOf(de.id);
    const r = this.l2(this.attach('ER605'), dAtt, dVlan);
    if (!r.ok) return { ...res, fwd: [...segs, ...r.segs], reason: r.reason };
    if (!de.wireless && this.effVlan(de.id) !== dVlan) return fail(`${de.id} quedó en otra VLAN (PVID ${this.effVlan(de.id)})`);
    segs.push(...r.segs);
    if (this.downReason(de.id)) return { ...res, fwd: segs.slice(), reason: `${de.id} no responde: ${this.downReason(de.id)}` };
    res.ok = true;
    res.fwd = segs.slice();
    res.back = rev(segs);
    res.ttl = (de.os === 'win' ? 128 : 64) - 1;
    res.hops.push(this.ipOf(de.id));
    return res;
  }
  _learn(a, b) {
    (this.arp[a] ||= new Set()).add(b);
    (this.arp[b] ||= new Set()).add(a);
  }

  // ─────────── animación ───────────
  _dur(segs) {
    if (this.fast) return 0;
    const n = segs.length;
    return Math.round(Math.min(2500, Math.max(1200, 380 * n + 500)) / this.speed);
  }
  async emitPacket(segments, { ok = true, color, label = '', kind = 'icmp', vlan = null } = {}) {
    if (!segments.length) return;
    const duration = this._dur(segments);
    const p = { id: `p${++pktSeq}`, segments, ok, color: color || vlanColor(vlan), label, kind, vlan, duration };
    bus.emit('packet', p);
    if (duration) await sleep(duration + 80);
    return p;
  }

  // ─────────── operaciones visibles ───────────
  async ping(src, dst, { count = 4, animate = true } = {}) {
    const r = this.route(src, dst);
    const dIp = r.dst?.ip || dst;
    const lines = [];
    const name = r.dst?.name && r.dst.name !== dIp ? `${r.dst.name} [${dIp}]` : dIp;
    lines.push(`Haciendo ping a ${name} con 32 bytes de datos:`);
    let received = 0;
    const lat = () => {
      if (r.dst?.type === 'internet') return `tiempo=${(r.via === 'claro' ? 14 : 19) + Math.floor(Math.random() * 6)}ms`;
      if (r.fwd.some((s) => s.id === 'wan:claro' || s.id === 'wan:personal')) return `tiempo=${22 + Math.floor(Math.random() * 8)}ms`;
      return r.hops.length > 1 || r.fwd.some((s) => s.id === 'rack:ER605') ? `tiempo=1ms` : 'tiempo<1m';
    };
    for (let i = 0; i < count; i++) {
      const anim = animate && i === 0;
      if (r.noSend) {
        lines.push(i === 0 ? `Error: ${r.reason}.` : '');
        break;
      }
      if (r.loopback) {
        lines.push(`Respuesta desde ${dIp}: bytes=32 tiempo<1m TTL=128`);
        received++;
        continue;
      }
      if (anim) await this.emitPacket(r.ok ? r.fwd : r.fwd, { ok: r.ok, vlan: r.vlan, label: `ping ${dIp}`, kind: 'icmp' });
      if (r.ok) {
        if (anim) await this.emitPacket(r.back, { ok: true, vlan: r.vlan, label: `respuesta ${dIp}`, kind: 'icmp-reply' });
        else if (!this.fast && animate) await sleep(250 / this.speed);
        lines.push(`Respuesta desde ${dIp}: bytes=32 ${lat()} TTL=${r.ttl}`);
        received++;
      } else {
        if (!this.fast && animate && !anim) await sleep(250 / this.speed);
        lines.push(r.fwd.length <= 1 && /apagado \(shutdown\)|sin energía/.test(r.reason) ? 'Error general.' : r.arpFail || /no responde|ningún equipo/.test(r.reason) ? 'Tiempo de espera agotado para esta solicitud.' : r.blocked ? 'Tiempo de espera agotado para esta solicitud.' : `Respuesta desde ${r.hops[r.hops.length - 1] || this.ipOf(r.src) || '0.0.0.0'}: Host de destino inaccesible.`);
      }
    }
    if (!r.noSend) {
      lines.push('', `Estadísticas de ping para ${dIp}:`, `    Paquetes: enviados = ${count}, recibidos = ${received}, perdidos = ${count - received}`, `    (${Math.round(((count - received) / count) * 100)}% perdidos),`);
    }
    const out = { ok: r.ok, sent: count, received, lines, reason: r.reason, via: r.via, path: r.fwd, src: r.src, dst: dIp, vlan: r.vlan, blocked: !!r.blocked };
    this.log.push({ t: Date.now(), op: 'ping', src, dst, ok: r.ok, reason: r.reason });
    bus.emit('sim:result', { op: 'ping', src: r.src, dst: r.dst?.id || dst, dstIp: dIp, ok: r.ok, via: r.via, blocked: !!r.blocked, reason: r.reason });
    return out;
  }

  async traceroute(src, dst, { animate = true } = {}) {
    const r = this.route(src, dst);
    const dIp = r.dst?.ip || dst;
    const lines = [`Traza a la dirección ${r.dst?.name && r.dst.name !== dIp ? `${r.dst.name} [${dIp}]` : dIp}`, 'sobre un máximo de 30 saltos:', ''];
    if (r.noSend) return { ok: false, lines: [...lines, `Error: ${r.reason}.`], reason: r.reason, hops: [] };
    // animar el camino completo (o hasta donde llega)
    if (animate) await this.emitPacket(r.fwd, { ok: r.ok, vlan: r.vlan, label: `tracert ${dIp}`, kind: 'trace' });
    let n = 1;
    for (const h of r.hops) {
      if (h === '*') lines.push(`  ${String(n++).padStart(2)}     *        *        *     Tiempo de espera agotado para esta solicitud.`);
      else {
        const ms = h.startsWith('10.10.') ? '<1 ms' : `${10 + n * 3} ms`;
        lines.push(`  ${String(n++).padStart(2)}  ${ms.padStart(6)}  ${ms.padStart(6)}  ${ms.padStart(6)}  ${h}`);
      }
    }
    if (!r.ok) {
      for (let i = 0; i < 2; i++) lines.push(`  ${String(n++).padStart(2)}     *        *        *     Tiempo de espera agotado para esta solicitud.`);
      lines.push('', `(${r.reason})`);
    } else lines.push('', 'Traza completa.');
    bus.emit('sim:result', { op: 'traceroute', src: r.src, dst: r.dst?.id || dst, ok: r.ok, hops: r.hops, reason: r.reason });
    return { ok: r.ok, lines, hops: r.hops, reason: r.reason, path: r.fwd };
  }

  async call(extA, extB) {
    const a = this.resolve(extA)?.id;
    const ext = String(extB).toLowerCase() === 'externo' ? 'externo' : this.resolve(extB)?.id;
    const lines = [];
    const done = (ok, reason) => {
      const res = { ok, reason, lines, a, b: ext };
      bus.emit('sim:result', { op: 'call', a, b: ext, ok, reason });
      return res;
    };
    if (!a || !ENDPOINTS[a] || ENDPOINTS[a].kind !== 'phone') return done(false, `"${extA}" no es un interno`);
    if (!ext || (ext !== 'externo' && ENDPOINTS[ext]?.kind !== 'phone')) return done(false, `"${extB}" no es un interno`);
    if (!this.isUp(a)) return done(false, `el teléfono ${a} está apagado: ${this.downReason(a)}`);
    // señalización SIP: teléfono → central
    const leg1 = this.route(a, 'PBX');
    await this.emitPacket(leg1.fwd, { ok: leg1.ok, vlan: 40, label: 'SIP INVITE', kind: 'sip' });
    if (!leg1.ok) return done(false, `el teléfono no llega a la central: ${leg1.reason}`);
    lines.push(`${ENDPOINTS[a].ext} → central Issabel (10.10.40.10): INVITE`);
    if (ext === 'externo') {
      const w = this.activeWan();
      if (!w) {
        lines.push('Troncal SIP Iptel: sin internet → la llamada externa no sale.');
        return done(false, 'sin internet: la troncal SIP de Iptel no está disponible (los internos sí funcionan)');
      }
      const active = this.calls.filter((c) => c.b === 'externo').length;
      if (active >= 2) return done(false, 'la troncal de Iptel admite dos llamadas simultáneas y ya hay dos en curso');
      const pbxOut = this.route('PBX', 'INTERNET');
      await this.emitPacket(pbxOut.fwd, { ok: pbxOut.ok, vlan: 40, label: 'SIP → Iptel', kind: 'sip' });
      if (!pbxOut.ok) return done(false, pbxOut.reason);
      lines.push(`Central → troncal SIP Iptel por ${w === 'claro' ? 'Claro' : 'Personal'}: llamada saliente establecida.`);
      this.calls.push({ a, b: 'externo', via: w, t: Date.now() });
      this._changed('call');
      return done(true);
    }
    if (!this.isUp(ext)) return done(false, `el teléfono ${ext} está apagado: ${this.downReason(ext)}`);
    const leg2 = this.route('PBX', ext);
    await this.emitPacket(leg2.fwd, { ok: leg2.ok, vlan: 40, label: 'SIP INVITE', kind: 'sip' });
    if (!leg2.ok) return done(false, `la central no llega a ${ext}: ${leg2.reason}`);
    lines.push(`Central → ${ENDPOINTS[ext].ext}: suena. Atendió.`);
    const rtp = this.route(a, ext);
    await this.emitPacket(rtp.fwd, { ok: rtp.ok, vlan: 40, label: 'voz (RTP)', kind: 'rtp' });
    if (rtp.ok) await this.emitPacket(rtp.back, { ok: true, vlan: 40, label: 'voz (RTP)', kind: 'rtp' });
    lines.push(`Audio ${ENDPOINTS[a].ext} ⇄ ${ENDPOINTS[ext].ext} dentro de la VLAN 40${this.activeWan() ? '' : ' (sin internet: los internos siguen funcionando)'}.`);
    this.calls.push({ a, b: ext, t: Date.now() });
    this._changed('call');
    return done(rtp.ok, rtp.reason);
  }
  hangupAll() {
    this.calls = [];
    this._changed('call');
  }

  async wifiJoin(clientId, ap, ssid) {
    const id = String(clientId).toUpperCase();
    const e = ENDPOINTS[id];
    if (!e?.wireless) return { ok: false, reason: `${clientId} no es un cliente Wi-Fi` };
    const net = SSIDS[ssid];
    if (!net) return { ok: false, reason: `SSID desconocido: ${ssid}` };
    if (id === 'VISITA' && ssid === 'Empleados') {
      bus.emit('sim:result', { op: 'wifi', id, ok: false });
      return { ok: false, reason: 'clave incorrecta: la red de empleados tiene otra clave (p.4: claves separadas)' };
    }
    if (!this.isUp(ap)) return { ok: false, reason: `${ap} está apagado: ${this.downReason(ap)}` };
    const apE = ENDPOINTS[ap];
    const c = this.ports[apE.sw][apE.port];
    this.wifi[id] = { ap, ssid, ip: null };
    // DHCP del ER605 (visitas: .100 a .220 según p.4)
    const r = this.l2(this.attach(id), this.attach('ER605'), net.vlan);
    await this.emitPacket(r.segs, { ok: r.ok && carries(c, net.vlan), vlan: net.vlan, label: 'DHCP', kind: 'dhcp' });
    if (!r.ok) {
      this.wifi[id] = null;
      this._changed('wifi');
      return { ok: false, reason: `DHCP sin respuesta: ${r.reason}` };
    }
    await this.emitPacket(rev(r.segs), { ok: true, vlan: net.vlan, label: 'DHCP OFFER', kind: 'dhcp' });
    this.wifi[id].ip = net.vlan === 50 ? '10.10.50.100' : '10.10.20.50';
    this._changed('wifi');
    bus.emit('sim:result', { op: 'wifi', id, ap, ssid, ok: true, ip: this.wifi[id].ip });
    return { ok: true, ip: this.wifi[id].ip, vlan: net.vlan, ssid: net.name, note: net.vlan === 20 ? 'IP de ejemplo asignada por DHCP' : 'Asignación automática del rango .100 a .220' };
  }
  wifiLeave(clientId) {
    this.wifi[String(clientId).toUpperCase()] = null;
    this._changed('wifi');
  }

  async vpnConnect(extId) {
    const id = String(extId).toUpperCase();
    if (!(id in this.vpn)) return { ok: false, reason: `${extId} no es un externo (EXT1 a EXT4)` };
    const w = this.activeWan();
    if (!w) return { ok: false, reason: 'sin internet en la oficina: el ER605 no recibe el túnel' };
    await this.emitPacket([{ id: `wan:${w}`, dir: -1 }], { ok: true, vlan: 70, label: 'WireGuard handshake', kind: 'vpn' });
    await this.emitPacket([{ id: `wan:${w}`, dir: 1 }], { ok: true, vlan: 70, label: 'WireGuard', kind: 'vpn' });
    this.vpn[id] = true;
    this._changed('vpn');
    bus.emit('sim:result', { op: 'vpn', id, ok: true, via: w });
    return { ok: true, ip: ENDPOINTS[id].ip, via: w };
  }
  vpnDisconnect(extId) {
    this.vpn[String(extId).toUpperCase()] = false;
    this._changed('vpn');
  }

  async runBackup() {
    const out = { ok: false, nas2: false, b2: false, lines: [] };
    const r1 = this.route('NAS1', 'NAS2');
    await this.emitPacket(r1.fwd, { ok: r1.ok, vlan: 60, label: 'copia → NAS2', kind: 'backup', color: vlanColor(60) });
    if (r1.ok) {
      this.files.NAS2 = [...this.files.NAS1];
      out.nas2 = true;
      out.lines.push(`NAS1 → NAS2 (gerencia, VLAN 60): ${this.files.NAS1.length} elementos copiados.`);
    } else out.lines.push(`NAS1 → NAS2 falló: ${r1.reason}`);
    const r2 = this.route('NAS1', 'B2');
    await this.emitPacket(r2.fwd, { ok: r2.ok, vlan: 30, label: 'copia → Backblaze B2', kind: 'backup' });
    if (r2.ok) {
      this.files.B2 = [...this.files.NAS1];
      out.b2 = true;
      out.lines.push(`NAS1 → Backblaze B2 (fuera del edificio) por ${r2.via === 'claro' ? 'Claro' : 'Personal'}: completo.`);
    } else out.lines.push(`NAS1 → Backblaze B2 falló: ${r2.reason}`);
    out.ok = out.nas2 || out.b2;
    if (out.ok) this.lastBackup = new Date().toISOString();
    this._changed('backup');
    bus.emit('sim:result', { op: 'backup', ok: out.ok, nas2: out.nas2, b2: out.b2 });
    return out;
  }
  deleteFile(name) {
    const i = this.files.NAS1.indexOf(name);
    if (i < 0) return { ok: false, reason: `no existe ${name} en NAS1` };
    this.files.NAS1.splice(i, 1);
    this._changed('files');
    bus.emit('sim:result', { op: 'delete', file: name, ok: true });
    return { ok: true };
  }
  async restoreFile(name) {
    if (this.files.NAS1.includes(name)) return { ok: true, from: null, note: `${name} ya está en NAS1` };
    let from = null;
    if (this.files.NAS2.includes(name) && this.route('NAS2', 'NAS1').ok) from = 'NAS2';
    else if (this.files.B2.includes(name) && this.activeWan()) from = 'B2';
    if (!from) {
      bus.emit('sim:result', { op: 'restore', file: name, ok: false });
      return { ok: false, reason: this.files.NAS2.includes(name) || this.files.B2.includes(name) ? 'la copia existe pero no se llega al equipo' : `no hay copia de ${name}: hacé una copia de seguridad antes de borrar` };
    }
    const r = from === 'NAS2' ? this.route('NAS2', 'NAS1') : this.route('NAS1', 'B2');
    await this.emitPacket(from === 'NAS2' ? r.fwd : r.back, { ok: true, vlan: from === 'NAS2' ? 60 : 30, label: `restaurar ${name}`, kind: 'backup' });
    this.files.NAS1.push(name);
    this._changed('files');
    bus.emit('sim:result', { op: 'restore', file: name, ok: true, from });
    return { ok: true, from };
  }
}

export const sim = new NetworkSim();
export const resolve = (x) => sim.resolve(x);
export const deviceInfo = (id) => sim.deviceInfo(id);
export const PHONE_IDS = Object.keys(PHONES.ext);
export const PC_IDS = OUTLETS.filter((o) => o.dev.startsWith('PC')).map((o) => o.dev);
export { WAN, mac as macOf, MASK, SUBNET, ALL_VLANS };
