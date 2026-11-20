// Fichas de información de cada objeto. Todo el contenido proviene de tp.js (TP p.1–p.11).
import { OUTLETS, DEVICES, VLANS, RACK_LINKS, RACKS, UPS, PHONES, TEXT, DESKS, RESERVED } from '../data/tp.js';

const vlanChip = (v) => {
  if (typeof v === 'string' && v.includes('/')) return v.split('/').map((n) => `<span class="chip"><i class="dot" style="background:${VLANS[n].color}"></i>VLAN${n}</span>`).join(' ');
  const d = VLANS[v];
  return d ? `<span class="chip"><i class="dot" style="background:${d.color}"></i>VLAN${v} · ${d.name}</span>` : v;
};
const roomName = { recepcion: 'Recepción', box1: 'Box 1', box2: 'Box 2', box3: 'Box 3', box4: 'Box 4', gerencia: 'Gerencia', reunion: 'Sala de reunión', escritorios: 'Área de escritorios', circulacion: 'Circulación', tecnica: 'Sala técnica' };

export function infoFor(id) {
  if (!id) return null;
  // ── puesto / equipo final con boca ──
  const o = OUTLETS.find((q) => q.dev === id);
  if (o) {
    const kind = id.startsWith('PC') ? 'Puesto de trabajo' : id.startsWith('TEL') ? 'Teléfono IP' : id.startsWith('IMP') ? 'Impresora' : id.startsWith('AP') ? 'Punto de acceso Wi-Fi' : 'Equipo';
    const dev = DEVICES[id];
    const rows = [
      ['Ubicación', o.place],
      ['IP', `<span class="mono">${o.ip}</span>`],
      ['VLAN', vlanChip(o.vlan)],
      ['Boca', `<span class="mono">${o.label}</span>`],
      ['Switch', `${o.sw} · puerto ${o.port}`],
      ['Cable', `${o.m} m (UTP Cat6, T568B)`],
    ];
    if (id.startsWith('TEL')) rows.splice(1, 0, ['Interno', String(PHONES.ext[id])], ['Modelo', PHONES.model]);
    if (dev?.model) rows.splice(1, 0, ['Modelo', dev.model]);
    if (id.startsWith('PC')) rows.push(['Equipo', 'PC del cliente (no se compra)']);
    const text = id.startsWith('TEL') ? 'Cada teléfono usa su propia toma de red y se alimenta por PoE desde el switch. ' + PHONES.flow
      : id.startsWith('AP') ? dev.role + ' Transporta las VLAN 10/20/50 (enlace troncal).'
      : id === 'NAS2' ? dev.role + ' ' + TEXT.archivos[0]
      : id.startsWith('IMP') ? 'Impresora en la red de archivos e impresión (VLAN30). El personal y la VPN pueden imprimir; las visitas no.'
      : 'Las PCs del personal están en la VLAN20. La puerta de salida es 10.10.20.1 (ER605).';
    return { kicker: kind, title: id === 'NAS2' ? 'NAS2 · respaldo' : id.startsWith('TEL') ? `Teléfono ${PHONES.ext[id]}` : `${kind === 'Puesto de trabajo' ? 'Puesto ' : ''}${id}`, rows, text, route: id, lab: id.startsWith('PC') || id.startsWith('TEL') ? id : null };
  }
  // ── boca de pared ──
  if (id.startsWith('JACK:')) {
    const label = id.slice(5);
    const first = OUTLETS.find((q) => q.label === label);
    const all = OUTLETS.filter((q) => q.room === first.room && Math.abs(OUTLETS.indexOf(q) - OUTLETS.indexOf(first)) < 8 && (q.dev === first.dev || DESKS.some((d) => d.pc === first.dev && d.tel === q.dev)));
    return {
      kicker: 'Caja de superficie · jack RJ45 Cat6',
      title: all.length > 1 ? 'Placa doble keystone' : 'Placa simple keystone',
      rows: all.flatMap((q) => [[`Boca ${q.label}`, `${q.dev} · ${q.sw}/${q.port} · ${vlanChip(q.vlan)}`]]),
      text: 'Cada cable rígido termina en el panel del rack y en un jack RJ45 Cat6 de pared, usando la misma distribución de colores T568B en ambos extremos. Rotular ambos extremos con el mismo código. El tendido va por canaletas y cielorraso; no cruza suelto por el piso.',
      route: first.dev,
    };
  }
  // ── puertos del rack ──
  let m = id.match(/^(PP[12])-(\d{2})$/);
  if (m) {
    const n = +m[2], pp = m[1];
    const q = OUTLETS.find((x) => x.pp === pp && x.n === n);
    if (!q) return { kicker: `Patch panel ${pp}`, title: `Boca ${pp}-${m[2]}`, rows: [['Estado', 'Reserva sin cableado'], ['Gabinete', pp === 'PP1' ? 'R1' : 'R2']], text: RESERVED };
    return { kicker: `Patch panel ${pp}`, title: `Boca ${q.label}`, rows: [['Equipo', `${q.dev} · ${q.place}`], ['Puerto switch', `${q.sw}/${q.port}`], ['VLAN', vlanChip(q.vlan)], ['IP', `<span class="mono">${q.ip}</span>`], ['Longitud', `${q.m} m`]], text: 'En los cables permanentes, el número de boca coincide con el puerto del switch.', route: q.dev };
  }
  m = id.match(/^(SW[12])\/(SFP)?(\d+)$/);
  if (m) {
    const sw = m[1], n = +m[3];
    const q = OUTLETS.find((x) => x.sw === sw && x.port === n && !m[2]);
    const link = RACK_LINKS.find((l) => l.from === `${sw}/${m[2] ? 'SFP' : ''}${n}` || l.to === `${sw}/${m[2] ? 'SFP' : ''}${n}`);
    if (q) return { kicker: `${sw} · ${DEVICES[sw].model}`, title: `Puerto ${n} · ${q.dev}`, rows: [['Destino', q.place], ['Boca', q.label], ['VLAN', vlanChip(q.vlan)], ['IP', `<span class="mono">${q.ip}</span>`], ['PoE', /^(TEL|AP)/.test(q.dev) ? 'Sí (PoE+)' : 'No requiere']], route: q.dev, lab: sw };
    if (link) return { kicker: `${sw} · ${DEVICES[sw].model}`, title: `Puerto ${m[2] ? 'SFP' : ''}${n}`, rows: [['Conexión', `${link.from} → ${link.to}`], ['Detalle', link.note]], lab: sw };
    return { kicker: `${sw} · ${DEVICES[sw].model}`, title: `Puerto ${m[2] ? 'SFP' : ''}${n}`, rows: [['Estado', m[2] ? 'Libre' : 'Libre · apagado']], text: RESERVED, lab: sw };
  }
  if (/^ER605\//.test(id)) id = 'ER605';
  // ── equipos de rack y otros ──
  const dev = DEVICES[id];
  if (dev) {
    const rows = [['Modelo', dev.model]];
    if (dev.ip) rows.push(['IP', `<span class="mono">${dev.ip}</span>`]);
    if (dev.vlan) rows.push(['VLAN', vlanChip(dev.vlan)]);
    if (dev.port) rows.push(['Conexión', dev.port]);
    if (dev.rack) rows.push(['Gabinete', `${dev.rack} · U${dev.u.join('-U')}`]);
    if (dev.price) rows.push(['Precio', '$' + dev.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })]);
    let text = dev.role || '';
    if (id === 'ER605') text = TEXT.equipos[0] + ' ' + TEXT.vpn;
    if (id === 'SW1' || id === 'SW2') text = TEXT.equipos[1] + ' ' + TEXT.equipos[3];
    if (id === 'PBX') text = TEXT.telefonia + ' ' + PHONES.trunk;
    if (id === 'NAS1') text = TEXT.archivos.join(' ');
    if (id === 'R1' || id === 'R2') {
      const r = RACKS[id];
      rows.length = 0;
      rows.push(['Modelo', dev.model], ['Ubicación', roomName[dev.room]]);
      r.items.forEach((it) => rows.push([`U${it.u}${it.h > 1 ? '-U' + (it.u + it.h - 1) : ''}`, it.label]));
      text = TEXT.gabinetes + ' ' + (id === 'R1' ? TEXT.bandejas : '');
    }
    return { kicker: dev.kind === 'rack' ? 'Gabinete' : 'Equipo de red', title: dev.name, rows, text, lab: ['SW1', 'SW2', 'PBX', 'NAS1', 'ER605'].includes(id) ? id : null, rack: dev.rack };
  }
  if (id === 'PP1' || id === 'PP2') {
    const used = OUTLETS.filter((o) => o.pp === id).length;
    return { kicker: 'Patch panel 24 bocas Cat6', title: id, rows: [['Gabinete', id === 'PP1' ? 'R1 · U12' : 'R2 · U6'], ['Bocas en uso', `${used} de 24`], ['Reservas', id === 'PP1' ? 'PP1-17 a PP1-24' : 'PP2-08 a PP2-24']], text: 'PP1 y PP2 son los paneles de conexiones de R1 y R2. En los cables permanentes, el número de boca coincide con el puerto del switch.' };
  }
  if (id === 'PSU-SW2') return { kicker: 'Gabinete R2 · U3', title: 'Fuente y cables', rows: [['Ubicación', 'R2 · bandeja U3']], text: 'Espacio del gabinete R2 reservado para la fuente y los cables (p.5).' };
  if (id.startsWith('PDU')) return { kicker: 'Energía', title: 'PDU Reguvolt 6 tomas', rows: [['Gabinete', id.endsWith('R1') ? 'R1 · U1' : 'R2 · U1']], text: 'Separar el recorrido de datos del eléctrico y conectar los gabinetes a tierra.' };
  const u = UPS.find((x) => x.id === id);
  if (u) return { kicker: 'UPS', title: u.id, rows: [['Modelo', u.model], ['Protege', u.protects], ['Objetivo', '10 minutos de respaldo, a comprobar']], text: TEXT.tendido[2] };
  if (id === 'DIAGRAMA') return { kicker: 'Sala de reunión', title: 'Diagrama de red', rows: [], text: 'Dos proveedores de internet, un router central y dos switches unidos por fibra. Las PCs y los teléfonos agrupados en el dibujo tienen conexiones individuales.', slide: 'diagrama' };
  if (id === 'PRESENTACION') return { kicker: 'Sala de reunión', title: 'Presentación del TP', rows: [], text: 'Recorré el trabajo práctico completo desde la oficina: plano, red, gabinetes, bocas, servicios, cronograma y presupuesto.', slide: 'portada' };
  return { kicker: 'Objeto', title: id, rows: [] };
}

export { roomName };
