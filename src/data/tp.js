// ─────────────────────────────────────────────────────────────────────────────
// FUENTE ÚNICA DE VERDAD — datos tomados textualmente del TP Final de Redes 2026
// (Volonté · Goiburú · Palombo). Nada de lo que está acá es inventado: cada valor
// tiene su página de origen en el comentario. Todo el mundo 3D, el simulador y
// la presentación leen de este archivo.
// Coordenadas: metros. Origen = esquina superior izquierda del plano (Gerencia).
// x → hacia la derecha (16 m), z → hacia abajo/frente (12 m), y = altura.
// Medidas del plano tomadas del dibujo de la pág. 2 (46,3 px = 1 m).
// ─────────────────────────────────────────────────────────────────────────────

export const META = {
  school: 'SAN JOSÉ / REDES 2026',
  client: 'Alvarez & Asoc.',
  clientSub: 'Estudio contable',
  title: 'Diseño de red para el estudio',
  authors: ['Tomás Volonté', 'Juan Manuel Goiburú', 'Leandro Palombo'],
  authorsShort: 'VOLONTÉ · GOIBURÚ · PALOMBO',
  tagline: 'Dos conexiones a internet. Archivos protegidos. Telefonía interna y externa.',
  sub: 'Una instalación pensada para 11 puestos, sin comprar tecnología de más.',
  assumption:
    'Supuesto de proyecto. Oficina ficticia de 16 × 12 m en el centro de Rosario. Las PCs e impresoras no se compran. Es una propuesta teórica: las configuraciones y pruebas se ejecutarían al instalar.',
  size: { w: 16, d: 12, h: 2.7 }, // h: altura de cielorraso (supuesto visual, no figura en el TP)
};

// p.1
export const SUMMARY = [
  ['Puestos y cobertura', '11 PCs del cliente + 2 impresoras'],
  ['Red y servicios', '1 router dual WAN + 2 switches administrables'],
  ['Telefonía y Wi-Fi', '7 teléfonos IP + Wi-Fi para visitas y empleados'],
  ['Cableado', '23 bocas Cat 6 + 1 troncal de fibra de 30 m'],
  ['Ambientes', 'Recepción, 4 boxes, 5 escritorios, gerencia y reunión'],
  ['Respaldo', '2 NAS, respaldo en nube y 3 UPS'],
];

// p.2 — salas (rectángulos en metros)
export const ROOMS = [
  { id: 'gerencia', name: 'Gerencia', x0: 0, z0: 0, x1: 4, z1: 6, floor: 'wood', color: '#dfeee3' },
  { id: 'box3', name: 'Box 3', x0: 4, z0: 0, x1: 6.5, z1: 3, floor: 'wood', color: '#f3e3d8' },
  { id: 'box1', name: 'Box 1', x0: 4, z0: 3, x1: 6.5, z1: 6, floor: 'wood', color: '#f3e3d8' },
  { id: 'pasillo', name: 'Pasillo de boxes', x0: 6.5, z0: 0, x1: 7.5, z1: 6, floor: 'tile', color: '#eef1f1' },
  { id: 'box4', name: 'Box 4', x0: 7.5, z0: 0, x1: 10, z1: 3, floor: 'wood', color: '#f3e3d8' },
  { id: 'box2', name: 'Box 2', x0: 7.5, z0: 3, x1: 10, z1: 6, floor: 'wood', color: '#f3e3d8' },
  { id: 'escritorios', name: 'Área de escritorios', x0: 10, z0: 0, x1: 16, z1: 6, floor: 'wood', color: '#deedf2' },
  { id: 'circulacion', name: 'Circulación', x0: 0, z0: 6, x1: 16, z1: 8, floor: 'tile', color: '#eef1f1' },
  { id: 'recepcion', name: 'Recepción', x0: 0, z0: 8, x1: 6, z1: 12, floor: 'tile', color: '#f6e6c4' },
  { id: 'reunion', name: 'Sala de reunión', x0: 6, z0: 8, x1: 12, z1: 12, floor: 'wood', color: '#e7e1f0' },
  { id: 'tecnica', name: 'Sala técnica', x0: 12, z0: 8, x1: 16, z1: 12, floor: 'tile', color: '#dbe5ec' },
];

// Paredes interiores/exteriores como segmentos; las puertas son huecos (p.2).
// glass:true = tabique vidriado (decisión estética; el TP no especifica material).
export const WALLS = [
  // perímetro
  { a: [0, 0], b: [16, 0], ext: true },
  { a: [16, 0], b: [16, 12], ext: true },
  { a: [0, 12], b: [16, 12], ext: true },
  { a: [0, 0], b: [0, 12], ext: true },
  // fila superior / circulación (z=6)
  { a: [0, 6], b: [16, 6] },
  // circulación / fila inferior (z=8)
  { a: [0, 8], b: [16, 8] },
  // verticales fila superior
  { a: [4, 0], b: [4, 6] },
  { a: [6.5, 0], b: [6.5, 6], glass: true },
  { a: [7.5, 0], b: [7.5, 6], glass: true },
  { a: [10, 0], b: [10, 6] },
  { a: [4, 3], b: [6.5, 3] },
  { a: [7.5, 3], b: [10, 3] },
  // verticales fila inferior
  { a: [6, 8], b: [6, 12] },
  { a: [12, 8], b: [12, 12] },
];

// Puertas (huecos de 0,8 m) medidas sobre el plano de la p.2.
export const DOORS = [
  { id: 'd-gerencia', wall: 'z', at: 6, from: 2.05, to: 2.85, room: 'gerencia' },
  { id: 'd-box3', wall: 'x', at: 6.5, from: 1.95, to: 2.75, room: 'box3' },
  { id: 'd-box1', wall: 'x', at: 6.5, from: 4.95, to: 5.75, room: 'box1' },
  { id: 'd-box4', wall: 'x', at: 7.5, from: 1.95, to: 2.75, room: 'box4' },
  { id: 'd-box2', wall: 'x', at: 7.5, from: 4.95, to: 5.75, room: 'box2' },
  { id: 'd-pasillo', wall: 'z', at: 6, from: 6.5, to: 7.5, room: 'pasillo', open: true },
  { id: 'd-escritorios', wall: 'z', at: 6, from: 12.05, to: 12.85, room: 'escritorios' },
  { id: 'd-recepcion', wall: 'z', at: 8, from: 2.05, to: 2.85, room: 'recepcion' },
  { id: 'd-entrada', wall: 'z', at: 12, from: 2.05, to: 2.85, room: 'recepcion', main: true },
  { id: 'd-reunion', wall: 'z', at: 8, from: 8.05, to: 8.85, room: 'reunion' },
  { id: 'd-tecnica', wall: 'z', at: 8, from: 13.05, to: 13.85, room: 'tecnica' },
];

// Ventanas (líneas celestes del plano, frente norte)
export const WINDOWS = [
  { wall: 'z', at: 0, from: 0.7, to: 3.0 },
  { wall: 'z', at: 0, from: 10.7, to: 14.6 },
];

// ─── VLANs (p.4) ───
export const VLANS = {
  10: { name: 'Gestión', net: '10.10.10.0/27', color: '#f2b705', devices: 'SW1 .2; SW2 .3; AP1 .11; AP2 .12' },
  20: { name: 'Personal', net: '10.10.20.0/24', color: '#2f7cf6', devices: 'PC01-PC11: .101 a .111' },
  30: { name: 'Archivos e impresión', net: '10.10.30.0/27', color: '#19b394', devices: 'NAS1 .10; impresoras .20 y .21' },
  40: { name: 'Telefonía', net: '10.10.40.0/24', color: '#b0b8c4', devices: 'Central .10; teléfonos .101 a .107' },
  50: { name: 'Visitas', net: '10.10.50.0/24', color: '#e0457b', devices: 'Asignación automática: .100 a .220' },
  60: { name: 'Respaldo', net: '10.10.60.0/28', color: '#8b5cf6', devices: 'NAS2 .10' },
  70: { name: 'Acceso remoto · VPN', net: '10.10.70.0/28', color: '#14b8d4', devices: 'Cuatro externos: .2 a .5', vpn: true },
};
export const FIBER_COLOR = '#ff7a1a';
export const TRUNK_COLOR = '#f2b705';

// ─── Internet (p.3/p.4) ───
export const WAN = [
  { id: 'claro', name: 'Claro', speed: '200 Mb/s', wanIp: '192.168.100.2', port: 'WAN1', role: 'Principal' },
  { id: 'personal', name: 'Personal', speed: '300 Mb/s', wanIp: '192.168.200.2', port: 'WAN2', role: 'Respaldo' },
];

// ─── Bocas: tabla completa de la p.6 ───
// jack: ubicación de la boca de pared [x,z] y la pared/orientación donde está la placa.
export const OUTLETS = [
  { pp: 'PP1', n: 1, sw: 'SW1', port: 1, dev: 'PC01', place: 'Recepción', room: 'recepcion', vlan: 20, ip: '10.10.20.101', m: 18 },
  { pp: 'PP1', n: 2, sw: 'SW1', port: 2, dev: 'PC02', place: 'Box 1', room: 'box1', vlan: 20, ip: '10.10.20.102', m: 24 },
  { pp: 'PP1', n: 3, sw: 'SW1', port: 3, dev: 'PC03', place: 'Box 2', room: 'box2', vlan: 20, ip: '10.10.20.103', m: 21 },
  { pp: 'PP1', n: 4, sw: 'SW1', port: 4, dev: 'PC04', place: 'Box 3', room: 'box3', vlan: 20, ip: '10.10.20.104', m: 28 },
  { pp: 'PP1', n: 5, sw: 'SW1', port: 5, dev: 'PC05', place: 'Box 4', room: 'box4', vlan: 20, ip: '10.10.20.105', m: 25 },
  { pp: 'PP1', n: 6, sw: 'SW1', port: 6, dev: 'PC06', place: 'Gerencia', room: 'gerencia', vlan: 20, ip: '10.10.20.106', m: 35 },
  { pp: 'PP1', n: 7, sw: 'SW1', port: 7, dev: 'TEL101', place: 'Recepción', room: 'recepcion', vlan: 40, ip: '10.10.40.101', m: 18 },
  { pp: 'PP1', n: 8, sw: 'SW1', port: 8, dev: 'TEL102', place: 'Box 1', room: 'box1', vlan: 40, ip: '10.10.40.102', m: 24 },
  { pp: 'PP1', n: 9, sw: 'SW1', port: 9, dev: 'TEL103', place: 'Box 2', room: 'box2', vlan: 40, ip: '10.10.40.103', m: 21 },
  { pp: 'PP1', n: 10, sw: 'SW1', port: 10, dev: 'TEL104', place: 'Box 3', room: 'box3', vlan: 40, ip: '10.10.40.104', m: 28 },
  { pp: 'PP1', n: 11, sw: 'SW1', port: 11, dev: 'TEL105', place: 'Box 4', room: 'box4', vlan: 40, ip: '10.10.40.105', m: 25 },
  { pp: 'PP1', n: 12, sw: 'SW1', port: 12, dev: 'TEL106', place: 'Gerencia', room: 'gerencia', vlan: 40, ip: '10.10.40.106', m: 35 },
  { pp: 'PP1', n: 13, sw: 'SW1', port: 13, dev: 'TEL107', place: 'Reunión', room: 'reunion', vlan: 40, ip: '10.10.40.107', m: 13 },
  { pp: 'PP1', n: 14, sw: 'SW1', port: 14, dev: 'IMP01', place: 'Recepción', room: 'recepcion', vlan: 30, ip: '10.10.30.20', m: 20 },
  { pp: 'PP1', n: 15, sw: 'SW1', port: 15, dev: 'AP1', place: 'Circulación', room: 'circulacion', vlan: '10/20/50', ip: '10.10.10.11', m: 20, trunk: [10, 20, 50] },
  { pp: 'PP1', n: 16, sw: 'SW1', port: 16, dev: 'NAS2', place: 'Gerencia', room: 'gerencia', vlan: 60, ip: '10.10.60.10', m: 35 },
  { pp: 'PP2', n: 1, sw: 'SW2', port: 1, dev: 'PC07', place: 'Escritorio 1', room: 'escritorios', vlan: 20, ip: '10.10.20.107', m: 8 },
  { pp: 'PP2', n: 2, sw: 'SW2', port: 2, dev: 'PC08', place: 'Escritorio 2', room: 'escritorios', vlan: 20, ip: '10.10.20.108', m: 10 },
  { pp: 'PP2', n: 3, sw: 'SW2', port: 3, dev: 'PC09', place: 'Escritorio 3', room: 'escritorios', vlan: 20, ip: '10.10.20.109', m: 12 },
  { pp: 'PP2', n: 4, sw: 'SW2', port: 4, dev: 'PC10', place: 'Escritorio 4', room: 'escritorios', vlan: 20, ip: '10.10.20.110', m: 14 },
  { pp: 'PP2', n: 5, sw: 'SW2', port: 5, dev: 'PC11', place: 'Escritorio 5', room: 'escritorios', vlan: 20, ip: '10.10.20.111', m: 16 },
  { pp: 'PP2', n: 6, sw: 'SW2', port: 6, dev: 'IMP02', place: 'Escritorios', room: 'escritorios', vlan: 30, ip: '10.10.30.21', m: 10 },
  { pp: 'PP2', n: 7, sw: 'SW2', port: 7, dev: 'AP2', place: 'Escritorios', room: 'escritorios', vlan: '10/20/50', ip: '10.10.10.12', m: 12, trunk: [10, 20, 50] },
].map((o) => ({ ...o, label: `${o.pp === 'PP1' ? 'R1' : 'R2'}-${o.pp}-${String(o.n).padStart(2, '0')}` }));

// p.6 — conexiones dentro del gabinete
export const RACK_LINKS = [
  { from: 'SW1/17', to: 'ER605 · LAN4', note: 'Router ER605, puerto LAN4', vlan: 'trunk' },
  { from: 'SW1/18', to: 'NAS1', note: 'NAS1 (10.10.30.10)', vlan: 30 },
  { from: 'SW1/19', to: 'PBX', note: 'Central PBX (10.10.40.10)', vlan: 40 },
  { from: 'SW1/SFP25', to: 'SW2/SFP9', note: 'Fibra monomodo LC · 30 m · 1 Gb/s', vlan: 'fiber' },
  { from: 'ER605 · WAN1', to: 'ONT Claro', note: 'Claro 200 Mb/s', vlan: 'wan' },
  { from: 'ER605 · WAN2', to: 'ONT Personal', note: 'Personal 300 Mb/s', vlan: 'wan' },
];
export const RESERVED = 'Reservas sin cableado: PP1-17 a PP1-24 y PP2-08 a PP2-24. Puertos libres: SW1/20-24 y SW2/8, apagados.';

// ─── Equipos (p.2 ubicación · p.3 IP · p.4/p.9 modelo) ───
// pos: [x,z] en metros según plano p.2.  rot: orientación (rad) del frente del puesto.
export const DEVICES = {
  ER605: { kind: 'router', name: 'Router ER605 V2', model: 'TP-Link ER605 V2', ip: '10.10.10.1', role: 'Gestión · Gateway .1 en cada VLAN · Dual WAN · VPN WireGuard', rack: 'R1', u: [7, 8], price: 112482.56 },
  SW1: { kind: 'switch', name: 'SW1 · R1', model: 'TP-Link TL-SG2428P', ip: '10.10.10.2', vlan: 10, role: '24 puertos Gigabit PoE+ y 4 SFP. Conecta recepción, boxes, gerencia y sala técnica.', rack: 'R1', u: [10], price: 524999 },
  SW2: { kind: 'switch', name: 'SW2 · R2', model: 'TP-Link TL-SG2210P', ip: '10.10.10.3', vlan: 10, role: '8 puertos Gigabit PoE+ y 2 SFP. Conecta los cinco escritorios.', rack: 'R2', u: [4], price: 198999 },
  NAS1: { kind: 'nas', name: 'NAS1 · archivos', model: 'Synology DS223j · 2 × WD40EFPX 4 TB (espejo)', ip: '10.10.30.10', vlan: 30, role: 'Comparte las carpetas del estudio. Espejo de 2 discos de 4 TB: 4 TB nominales.', rack: 'R1', u: [3, 6], port: 'SW1/18' },
  PBX: { kind: 'pbx', name: 'Central PBX', model: 'Mini PC ASUS PN41-S1 (N4505 · 8 GB / 240 GB) · Issabel 5', ip: '10.10.40.10', vlan: 40, role: 'Atiende los 7 internos. Los internos siguen funcionando si se corta internet.', rack: 'R1', u: [3, 6], port: 'SW1/19' },
  ONT_CLARO: { kind: 'ont', name: 'Equipo Claro', model: 'Equipo del proveedor', ip: '192.168.100.2 (WAN1)', role: 'Claro 200 Mb/s · conexión principal', rack: 'R1', u: [7, 8] },
  ONT_PERSONAL: { kind: 'ont', name: 'Equipo Personal', model: 'Equipo del proveedor', ip: '192.168.200.2 (WAN2)', role: 'Personal 300 Mb/s · respaldo', rack: 'R1', u: [7, 8] },
  NAS2: { kind: 'nas', name: 'NAS2 · respaldo', model: 'Synology DS223j · WD40EFPX 4 TB', ip: '10.10.60.10', vlan: 60, role: 'Copia nocturna de NAS1. Ubicado en gerencia, protegido por UPS.', pos: [1.06, 4.84], room: 'gerencia' },
  AP1: { kind: 'ap', name: 'AP1 · Wi-Fi', model: 'TP-Link EAP650 Wi-Fi 6 PoE+', ip: '10.10.10.11', vlan: '10/20/50', role: 'Wi-Fi empleados (VLAN20) y visitas (VLAN50) con claves separadas.', pos: [3.8, 7.02], room: 'circulacion' },
  AP2: { kind: 'ap', name: 'AP2 · Wi-Fi', model: 'TP-Link EAP650 Wi-Fi 6 PoE+', ip: '10.10.10.12', vlan: '10/20/50', role: 'Wi-Fi empleados (VLAN20) y visitas (VLAN50) con claves separadas.', pos: [14.8, 3.2], room: 'escritorios' },
  IMP01: { kind: 'printer', name: 'IMP01 · recepción', model: 'Impresora del cliente (no se compra)', ip: '10.10.30.20', vlan: 30, pos: [0.99, 8.83], room: 'recepcion' },
  IMP02: { kind: 'printer', name: 'IMP02 · escritorios', model: 'Impresora del cliente (no se compra)', ip: '10.10.30.21', vlan: 30, pos: [11.01, 3.15], room: 'escritorios' },
  R1: { kind: 'rack', name: 'R1 · Principal', model: 'Rack Actassi 12U · 600 mm', role: 'Gabinete principal en sala técnica.', pos: [14.0, 10.0], room: 'tecnica' },
  R2: { kind: 'rack', name: 'R2 · Escritorios', model: 'Rack 6U · 500 mm', role: 'Gabinete del área de escritorios.', pos: [15.0, 2.0], room: 'escritorios' },
};

// Puestos (PC + teléfono si corresponde) — posición del escritorio según p.2
// face: dirección hacia donde mira la persona sentada (rad, 0 = -z/norte)
export const DESKS = [
  { pc: 'PC01', tel: 'TEL101', pos: [1.6, 10.0], face: 0, room: 'recepcion' },
  { pc: 'PC02', tel: 'TEL102', pos: [4.95, 4.34], face: 0, room: 'box1' },
  { pc: 'PC03', tel: 'TEL103', pos: [8.42, 4.34], face: 0, room: 'box2' },
  { pc: 'PC04', tel: 'TEL104', pos: [4.95, 1.53], face: 0, room: 'box3' },
  { pc: 'PC05', tel: 'TEL105', pos: [8.42, 1.53], face: 0, room: 'box4' },
  { pc: 'PC06', tel: 'TEL106', pos: [1.51, 2.76], face: 0, room: 'gerencia' },
  { pc: 'PC07', pos: [10.99, 4.23], face: 0, room: 'escritorios' },
  { pc: 'PC08', pos: [12.81, 4.23], face: 0, room: 'escritorios' },
  { pc: 'PC09', pos: [14.58, 4.23], face: 0, room: 'escritorios' },
  { pc: 'PC10', pos: [11.84, 1.9], face: 0, room: 'escritorios' },
  { pc: 'PC11', pos: [13.89, 1.9], face: 0, room: 'escritorios' },
];
// Sala de reunión: mesa + TEL107 (p.2)
export const MEETING = { table: [9.03, 10.13], size: [2.74, 1.23], tel: 'TEL107', telPos: [9.96, 10.06] };

// Telefonía (p.7)
export const PHONES = {
  model: 'Grandstream GRP2602P (PoE)',
  ext: { TEL101: 101, TEL102: 102, TEL103: 103, TEL104: 104, TEL105: 105, TEL106: 106, TEL107: 107 },
  trunk: 'Troncal SIP de Iptel: un número de Rosario y dos llamadas simultáneas (precio a cotizar).',
  flow: 'Las entrantes pasan por recepción; si no atiende, suenan los boxes y gerencia y luego el buzón. Se bloquean llamadas internacionales y de alto costo.',
};

// Fibra R1↔R2 (p.2): 25 m de recorrido + 5 m de reserva. Recorrido trazado sobre el plano.
export const FIBER_ROUTE = [[15.0, 2.0], [15.0, 1.0], [6.98, 1.0], [6.98, 7.0], [14.0, 7.0], [14.0, 10.0]];

// ─── Racks (p.5) ───  u: unidad inferior, h: alto en U
export const RACKS = {
  R1: {
    units: 12, depth: 600,
    items: [
      { u: 12, h: 1, type: 'patchpanel', id: 'PP1', label: 'PP1' },
      { u: 11, h: 1, type: 'organizer', label: 'Organizador horizontal 1U' },
      { u: 10, h: 1, type: 'switch', id: 'SW1', label: 'SW1 · TL-SG2428P' },
      { u: 9, h: 1, type: 'fiber', label: 'Fibra · reserva protegida' },
      { u: 7, h: 2, type: 'shelf', label: 'Bandeja 1U: ER605, Claro, Personal', holds: ['ER605', 'ONT_CLARO', 'ONT_PERSONAL'] },
      { u: 3, h: 4, type: 'shelf', label: 'Bandeja 1U: NAS1 (165 mm, U3-U6) y PBX', holds: ['NAS1', 'PBX'] },
      { u: 2, h: 1, type: 'vent', label: 'Reserva de ventilación' },
      { u: 1, h: 1, type: 'pdu', label: 'PDU Reguvolt 6 tomas' },
    ],
  },
  R2: {
    units: 6, depth: 500,
    items: [
      { u: 6, h: 1, type: 'patchpanel', id: 'PP2', label: 'PP2' },
      { u: 5, h: 1, type: 'organizer', label: 'Organizador horizontal 1U' },
      { u: 4, h: 1, type: 'switch', id: 'SW2', label: 'SW2 · TL-SG2210P' },
      { u: 3, h: 1, type: 'shelf', label: 'Bandeja: fuente y cables', holds: [] },
      { u: 2, h: 1, type: 'fiber', label: 'Fibra · reserva protegida' },
      { u: 1, h: 1, type: 'pdu', label: 'PDU Reguvolt 6 tomas' },
    ],
  },
};
export const UPS = [
  { id: 'UPS-R1', model: 'APC BX1200MI-AR 1200VA/650W', protects: 'R1', pos: [14.75, 10.55] },
  { id: 'UPS-NAS2', model: 'APC BX1200MI-AR 1200VA/650W', protects: 'NAS2 (gerencia)', pos: [0.55, 4.84] },
  { id: 'UPS-R2', model: 'UPS Atomlux 1000 VA', protects: 'R2', pos: [15.6, 2.0] },
];

// ─── Textos de cada sección (p.4, p.5, p.7) ───
export const TEXT = {
  equipos: [
    'ER605 V2: administra la salida a internet y el acceso remoto. Claro 200 Mb/s será la conexión principal y Personal 300 Mb/s el respaldo. Si falla la principal, el router cambia a la segunda; las llamadas o la VPN pueden tener que reconectarse.',
    'Dos switches administrables: SW1 conecta recepción, boxes, gerencia y sala técnica; SW2 conecta los cinco escritorios. Alimentan los teléfonos y los puntos Wi-Fi por el mismo cable de red (PoE). Dos EAP650 dan Wi-Fi a empleados y visitas con claves separadas.',
    'UTP Cat6 rígido de cobre: para las tomas de pared. Los cables cortos de conexión vienen armados de fábrica.',
    'La fibra de 30 m une los gabinetes mediante dos módulos SFP; la conexión entre switches trabaja a 1 Gb/s y se comparte entre los equipos de R2.',
  ],
  vlanIntro: 'Una VLAN es una red virtual que permite separar equipos aunque usen los mismos switches. El router usa la dirección .1 como puerta de salida de cada red.',
  config: [
    'Reservar las IP de PCs y teléfonos; configurar las VLAN y las mismas redes en ambos extremos de la fibra. Los puntos Wi-Fi usan VLAN20 para empleados y VLAN50 para visitas. Deshabilitar puertos libres y la administración desde internet.',
    'Permitir al personal y a la VPN el acceso a sus carpetas e impresoras. Los visitantes solo salen a internet; no pueden entrar a los archivos ni a los equipos de administración. Usar contraseñas distintas y guardar una copia de la configuración.',
  ],
  antesDeContratar: 'Antes de contratar: confirmar cobertura de los dos proveedores, IP pública para la VPN y condiciones de uso de oficina. La dirección del proyecto es ficticia; no se da cobertura por confirmada.',
  gabinetes: 'R1: gabinete principal de 12U y 600 mm de fondo, en sala técnica. R2: gabinete de 6U y 500 mm, junto a los escritorios. Una U es una unidad de altura del rack: 44,45 mm.',
  bandejas: 'Se compran tres bandejas: dos para R1 y una para R2. El NAS mide 165 mm de alto y ocupa el espacio U3-U6. El gabinete principal debe dejar al menos 430 mm útiles para el switch y sus cables; las UPS quedan afuera, ventiladas.',
  tendido: [
    'Instalamos 23 cables permanentes, con un total calculado de 472 m. Con 10% de margen hacen falta 519,2 m: se compran dos bobinas de 305 m. La tirada más larga es de 35 m; el sobrante de 138 m queda para el cliente.',
    'Cada cable rígido termina en el panel del rack y en un jack RJ45 Cat6 de pared, usando la misma distribución de colores T568B en ambos extremos. Los equipos se conectan con cables cortos prefabricados. No se colocan fichas macho comunes directamente sobre el cable rígido.',
    'Rotular ambos extremos con el mismo código: por ejemplo, R1-PP1-01. Separar el recorrido de datos del eléctrico, respetar las curvas de los cables y conectar los gabinetes a tierra. Las tres UPS protegen R1, R2 y el NAS de gerencia; objetivo de respaldo: 10 minutos, a comprobar.',
  ],
  plano: 'Teléfonos: recepción, cuatro boxes, gerencia y reunión. Cada teléfono usa su propia toma de red. El tendido va por canaletas y cielorraso; no cruza suelto por el piso.',
  fibra: 'Fibra entre R1 y R2: 25 m de recorrido + 5 m de reserva.',
  telefonia: 'La central es una mini PC ASUS PN41-S1 con Issabel 5, conectada a SW1. Atiende siete teléfonos Grandstream GRP2602P: recepción 101, boxes 102-105, gerencia 106 y reunión 107. Los internos siguen funcionando si se corta internet.',
  archivos: [
    'NAS1 comparte carpetas del estudio y usa dos discos de 4 TB en espejo: queda una capacidad nominal de 4 TB. Un disco averiado no debe hacer perder el otro. Cada noche se copia a NAS2, ubicado en gerencia, y a Backblaze B2, fuera del edificio. Un espejo de discos no reemplaza una copia de seguridad.',
    'Definir permisos por usuario y conservar versiones para recuperar archivos borrados. Probar el NAS con la carga de los 11 puestos y cuatro externos antes de cerrar la compra: esa capacidad de trabajo no está validada para este proyecto.',
  ],
  vpn: 'Acceden por una VPN WireGuard del ER605, con clave individual. Solo ven las carpetas y recursos autorizados. Si el programa contable requiere una PC de oficina, usan escritorio remoto dentro de la VPN; no se expone ese servicio directamente a internet. Confirmar IP pública con el proveedor y probar desde otra conexión.',
  pruebas: 'Comprobar las 23 tomas y sus etiquetas; copiar archivos e imprimir; probar Wi-Fi y bloqueo de visitas; llamar entre internos y realizar dos llamadas externas; entrar por VPN y verificar permisos. Simular caída de cada proveedor y un corte eléctrico, y restaurar archivos desde las copias. Registrar lo esperado, lo obtenido y la corrección. Son pruebas previstas, no realizadas.',
  certificar: 'Un certificador de cableado Cat6 y, para la fibra, un medidor de pérdidas, con accesorios adecuados y operador capacitado. El informe debe identificar cada enlace y su resultado. Un tester de luces solo revisa continuidad: no certifica la categoría del cable. No se incluye la contratación de este servicio en el presupuesto.',
};

// ─── Gantt (p.8) ───
export const GANTT = {
  intro: 'Ocho jornadas de 6 horas, con tres integrantes: 144 horas-persona. El día 1 empieza cuando están los materiales y los dos servicios de internet. Las compras y esperas previas quedan fuera de estas jornadas.',
  tasks: [
    { t: 'Relevar y planificar', d: 'Medir, ubicar puestos y definir conexiones', days: [1, 2], h: 18 },
    { t: 'Preparar los equipos', d: 'Revisar, identificar y dejar listos los equipos', days: [1, 2], h: 18 },
    { t: 'Montar canaletas y gabinetes', d: 'Fijar recorridos, R1 y R2', days: [3, 3], h: 18 },
    { t: 'Tender los cables', d: 'Pasar cable de red y fibra por sus recorridos', days: [4, 4], h: 18 },
    { t: 'Conectar y rotular las tomas', d: 'Terminar cables en paneles y tomas de pared', days: [5, 6], h: 18 },
    { t: 'Configurar la red y los servicios', d: 'Internet, IP, Wi-Fi, archivos, VPN y teléfonos', days: [5, 6], h: 18 },
    { t: 'Probar y corregir', d: 'Verificar conexiones, llamadas y fallas', days: [7, 7], h: 18 },
    { t: 'Entregar y explicar el uso', d: 'Entregar planos, configuraciones y guía de uso', days: [8, 8], h: 18 },
    { t: 'Documentar durante todo el trabajo', d: 'Anotar cambios, etiquetas, fotos y planos', days: [1, 8], h: 0, note: 'D1-D8 · incluido en las tareas' },
  ],
  note: 'Cada barra representa 18 horas-persona. Diseño y preparación se reparten entre D1-D2; conexión de tomas y configuración, entre D5-D6. La documentación se hace en cada etapa y no agrega horas aparte.',
  team: 'Tomás: router, IP, Wi-Fi y VPN. Juan Manuel: mediciones, canaletas, cableado y tomas. Leandro: archivos, copias y telefonía. Los tres participan en pruebas, correcciones y entrega.',
  labor: 'Mano de obra propuesta: 144 h-persona × $15.000 = $2.160.000. Es una estimación del grupo para el trabajo escolar.',
};

// ─── Presupuestos (p.9, p.10, p.11) ───
export const BUDGET = {
  date: 'Precios en ARS consultados el 19/11/2026.',
  equipos: [
    ['ER605 V2', 'Mercado Libre', 1, 112482.56],
    ['SW1 TL-SG2428P', 'Mercado Libre', 1, 524999.0],
    ['SW2 TL-SG2210P PoE+', 'Mercado Libre', 1, 198999.0],
    ['AP EAP650 Wi-Fi 6 PoE+', 'Mercado Libre', 2, 249999.0],
    ['SFP TL-SM311LS', 'Mercado Libre', 2, 57924.47],
    ['Fibra monomodo LC/UPC · 30 m', 'Mercado Libre', 1, 27990.0],
    ['Teléfono GRP2602P PoE', 'Mercado Libre', 7, 81384.0],
    ['Mini PC ASUS N4505 · 8 GB / 240 GB', 'Mercado Libre', 1, 467626.0],
    ['NAS DS223j sin discos', 'Mercado Libre', 2, 843357.0],
    ['Disco WD40EFPX 4 TB CMR', 'Mercado Libre', 3, 624156.49],
    ['UPS APC BX1200MI-AR 1200VA/650W', 'Mercado Libre', 2, 474706.3],
    ['UPS Atomlux 1000 VA (R2)', 'Mercado Libre', 1, 150000.0],
  ],
  equiposTotal: 7176227.57,
  equiposNote: 'Confirmar antes de comprar: revisión PoE+ del switch secundario; tipo OS2 de la fibra; rendimiento del NAS con los usuarios previstos y compatibilidad de Issabel con la mini PC. NAS: 13 días de preparación publicados; discos: entrega a acordar.',
  materiales: [
    ['UTP Cat 6 rígido, bobina 305 m', 'Mercado Libre', 2, 293000.0],
    ['Panel de 24 conexiones Cat6, completo', 'Mercado Libre', 2, 35000.0],
    ['Jack RJ45 Cat6 de pared', 'Precio estimado', 30, 2500.0],
    ['Cable de conexión Cat6 · 1 m', 'Mercado Libre', 30, 12190.0],
    ['Caja de 15 cables de conexión Cat6 · 2 m', 'Mercado Libre', 2, 105000.0],
    ['Rack R1 Actassi 12U / 600 mm', 'Mercado Libre', 1, 445280.0],
    ['Rack R2 6U / 500 mm', 'Mercado Libre', 1, 120000.0],
    ['Bandeja GLC 300 mm / 1U', 'Mercado Libre', 3, 39617.0],
    ['Organizador horizontal 1U', 'Mercado Libre', 2, 16990.0],
    ['PDU Reguvolt 6 tomas', 'Mercado Libre', 2, 79999.0],
    ['Canaleta Kalop 60x40, 2 m', 'Precio estimado', 30, 11000.0],
    ['Placa doble keystone', 'Precio estimado', 6, 3000.0],
    ['Placa simple keystone', 'Precio estimado', 11, 2500.0],
    ['Caja de superficie compatible', 'Precio estimado', 17, 2000.0],
    ['Accesorios: curvas, uniones y fijaciones', 'Precio estimado', 1, 40000.0],
    ['Velcro, etiquetas y protección de fibra', 'Precio estimado', 1, 25000.0],
    ['USB y puentes de tierra', 'Precio estimado', 1, 15000.0],
  ],
  materialesTotal: 2674309.0,
  materialesNote: 'Se compran 30 cables de 1 m y 30 de 2 m: 51 instalados y 9 repuestos. Jacks: 23 instalados y 7 repuestos. Los paneles ya traen sus conectores. Las tres bandejas se compran aparte.',
  herramientas: [
    ['Kit: crimpeadora, pelacables y tester', 'Mercado Libre', 23500.0],
    ['Herramienta de impacto Proskit CP-3151', 'Mercado Libre', 77640.52],
    ['Limpiador de conectores de fibra LC', 'Mercado Libre', 35000.0],
    ['Rotuladora Brother PT-H110', 'Mercado Libre', 122799.0],
  ],
  herramientasTotal: 258939.52,
  herramientasNote: 'La crimpeadora sirve para preparar o reparar cables de conexión; para las tomas de pared se usa la herramienta de impacto. La rotuladora identifica bocas y equipos. Taladro, escalera, herramientas de mano y notebook se consideran recursos del grupo.',
  total: [
    ['Equipos', 7176227.57],
    ['Materiales y accesorios', 2674309.0],
    ['Trabajo: 144 horas-persona × $15.000', 2160000.0],
  ],
  grandTotal: 12010536.57,
  totalNote: 'El total incluye la instalación propuesta. No suma herramientas del grupo, PCs, impresoras, envíos, abonos de servicios ni contratación de certificaciones. Los materiales menores y la mano de obra son estimaciones, no cotizaciones de terceros.',
};

// T568B (p.5: "misma distribución de colores T568B en ambos extremos")
export const T568B = [
  { n: 1, name: 'Blanco/Naranja', c: '#ff8a1f', stripe: true },
  { n: 2, name: 'Naranja', c: '#ff8a1f' },
  { n: 3, name: 'Blanco/Verde', c: '#22a559', stripe: true },
  { n: 4, name: 'Azul', c: '#2563eb' },
  { n: 5, name: 'Blanco/Azul', c: '#2563eb', stripe: true },
  { n: 6, name: 'Verde', c: '#22a559' },
  { n: 7, name: 'Blanco/Marrón', c: '#8b5a2b', stripe: true },
  { n: 8, name: 'Marrón', c: '#8b5a2b' },
];

export const ars = (n) => '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const outletByDev = (dev) => OUTLETS.find((o) => o.dev === dev);
export const roomAt = (x, z) => ROOMS.find((r) => x >= r.x0 && x < r.x1 && z >= r.z0 && z < r.z1);
