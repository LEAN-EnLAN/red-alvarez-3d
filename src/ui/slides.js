// Contenido del modo presentación: todas las secciones del PDF del TP, en orden.
// cam: posición de cámara y objetivo (metros). view: 'dollhouse' oculta el cielorraso.
import { META, SUMMARY, VLANS, OUTLETS, RACK_LINKS, RESERVED, TEXT, GANTT, BUDGET, WAN, PHONES, ars } from '../data/tp.js';

const p = (t) => `<p>${t}</p>`;
const table = (head, rows, cls = '') => `<div class="tbl scroll"><table class="data ${cls}"><thead><tr>${head.map((h) => `<th class="${h.num ? 'num' : ''}">${h.t ?? h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
const vdot = (v) => (VLANS[v] ? `<i class="dot" style="background:${VLANS[v].color}"></i>` : '<i class="dot" style="background:#f2b705"></i>');

const budgetTable = (rows, total) => table(['Equipo / compra', { t: 'Un.', num: true }, { t: 'Unitario', num: true }, { t: 'Subtotal', num: true }],
  [...rows.map(([n, s, u, pr]) => `<tr><td>${n}<div class="tiny">${s}</div></td><td class="num">${u}</td><td class="num">${ars(pr)}</td><td class="num">${ars(u * pr)}</td></tr>`),
    `<tr class="total"><td colspan="3">Total</td><td class="num">${ars(total)}</td></tr>`]);

export const SLIDES = [
  {
    id: 'portada', n: '00', kicker: META.school, title: 'Diseño de red para el estudio',
    view: 'dollhouse', cam: { pos: [-1.5, 12.5, 19], target: [5.6, 0, 6.5] },
    html: () => `${p(`<b>${META.tagline}</b> ${META.sub}`)}
      <div class="sum-grid">${SUMMARY.map(([k, v]) => `<div><span class="tiny">${k}</span><b>${v}</b></div>`).join('')}</div>
      <p class="tiny">${META.authors.join(' · ')} · Trabajo práctico final · Colegio San José · 2026</p>
      <p class="tiny">${META.assumption}</p>`,
  },
  {
    id: 'plano', n: '01', kicker: 'Distribución de los puestos', title: 'Plano de la oficina',
    view: 'dollhouse', cam: { pos: [5.4, 20.5, 6.9], target: [5.4, 0, 6.0] }, labels: true,
    html: () => `${p('Oficina propuesta de <b>16 × 12 m (192 m²)</b>. Los números PC01-PC11 coinciden con las direcciones IP y las bocas documentadas.')}
      ${p('<b>PC</b>: puesto de trabajo. <b>IMP</b>: impresora. <b>AP</b>: punto de acceso Wi-Fi. <b>R1</b>: gabinete principal; <b>R2</b>: gabinete del área de escritorios. <b>NAS2</b>: copia de los archivos, ubicada en gerencia.')}
      ${p(`<span class="legend-line" style="background:var(--fiber)"></span>${TEXT.fibra}`)}
      ${p(TEXT.plano)}
      <p class="tiny">Baños y servicios comunes fuera de la superficie representada. Distribución y medidas de proyecto; no corresponden a una obra ya realizada.</p>`,
  },
  {
    id: 'diagrama', n: '02', kicker: 'Diagrama de red', title: 'Red e IP de los equipos',
    cam: { pos: [8.0, 1.75, 11.15], target: [8.5, 0.76, 10.15] },
    html: () => `${p('Dos proveedores de internet, un router central y dos switches unidos por fibra. Las PCs y los teléfonos agrupados en el dibujo tienen conexiones individuales.')}
      <div class="wan-row">${WAN.map((w) => `<div class="wan"><b>${w.name.toUpperCase()} · ${w.speed}</b><span class="mono tiny">${w.port}: ${w.wanIp}</span><span class="tiny">${w.role}</span></div>`).join('')}</div>
      <div class="kv"><span>ER605 V2</span><b class="mono">10.10.10.1 · gestión · Gateway .1 en cada VLAN</b><span>SW1 · R1</span><b class="mono">10.10.10.2</b><span>SW2 · R2</span><b class="mono">10.10.10.3</b><span>Enlace</span><b style="color:var(--fiber)">Fibra · 30 m · 1 Gb/s</b></div>
      <p class="tiny">Negro: cable de red. Naranja: fibra. WAN privadas de ejemplo. Símbolos Cisco.</p>
      <button class="btn sm" data-act="lab" data-tab="topo">Abrir topología en vivo</button>`,
  },
  {
    id: 'equipos', n: '03', kicker: 'Qué elegimos y cómo funciona', title: 'Equipos y configuración',
    cam: { pos: [13.85, 1.55, 8.75], target: [14.0, 1.35, 9.75] },
    html: () => TEXT.equipos.map(p).join(''),
  },
  {
    id: 'vlans', n: '03', kicker: 'Separamos las redes por función', title: 'VLANs y direcciones',
    view: 'dollhouse', xray: true, cam: { pos: [4, 12.5, 18], target: [6.6, 0, 6] },
    html: () => `${p(TEXT.vlanIntro)}
      ${table(['Red', 'Subred', 'Equipos'], Object.entries(VLANS).map(([k, v]) => `<tr><td>${vdot(k)} ${v.name} · ${v.vpn ? 'VPN' : 'VLAN' + k}</td><td class="mono">${v.net}</td><td>${v.devices}</td></tr>`))}
      <h4>Configuración básica</h4>${TEXT.config.map(p).join('')}<p class="tiny">${TEXT.antesDeContratar}</p>
      <p class="tiny">En el mundo 3D, el modo rayos X colorea cada cable según su VLAN.</p>`,
  },
  {
    id: 'r1', n: '04', kicker: 'Dónde se monta cada equipo', title: 'Gabinete R1 · principal',
    cam: { pos: [14.0, 1.25, 8.85], target: [14.0, 1.15, 9.8] },
    html: () => `${p(TEXT.gabinetes)}${p(TEXT.bandejas)}
      <div class="u-list">${[['U12', 'PP1 · panel 24 bocas'], ['U11', 'Organizador horizontal'], ['U10', 'SW1 · TL-SG2428P · PoE+ · SFP'], ['U9', 'Fibra · reserva protegida'], ['U7-U8', 'ER605 · Claro · Personal'], ['U3-U6', 'NAS1 DS223j · PBX mini PC Issabel'], ['U2', 'Reserva de ventilación'], ['U1', 'PDU']].map(([u, t]) => `<div><span class="mono">${u}</span>${t}</div>`).join('')}</div>`,
  },
  {
    id: 'r2', n: '04', kicker: 'Dónde se monta cada equipo', title: 'Gabinete R2 · escritorios',
    cam: { pos: [13.95, 1.3, 2.05], target: [15.0, 1.15, 2.0] },
    html: () => `<div class="u-list">${[['U6', 'PP2 · panel 24 bocas'], ['U5', 'Organizador horizontal'], ['U4', 'SW2 · TL-SG2210P'], ['U3', 'Fuente y cables'], ['U2', 'Fibra · reserva protegida'], ['U1', 'PDU']].map(([u, t]) => `<div><span class="mono">${u}</span>${t}</div>`).join('')}</div>
      ${p('R2: gabinete de 6U y 500 mm, junto a los escritorios. La fibra de 30 m une los gabinetes mediante dos módulos SFP; la conexión entre switches trabaja a 1 Gb/s y se comparte entre los equipos de R2.')}`,
  },
  {
    id: 'tendido', n: '04', kicker: 'Tendido y tomas', title: '23 cables permanentes · 472 m',
    cam: { pos: [9.7, 1.6, 5.45], target: [8.45, 1.0, 3.3] }, route: 'PC03',
    html: () => TEXT.tendido.map(p).join('') + '<p class="tiny">Se muestra el recorrido de PC03 → R1-PP1-03 → SW1/3 (21 m).</p>',
  },
  {
    id: 'bocas', n: '05', kicker: 'Panel, switch, equipo e IP', title: 'Conexión de cada boca',
    cam: { pos: [14.0, 1.42, 9.25], target: [14.0, 1.42, 9.85] }, wide: true,
    html: () => `${p('PP1 y PP2 son los paneles de conexiones de R1 y R2. En los cables permanentes, el número de boca coincide con el puerto del switch. Se indica la longitud prevista de cada cable.')}
      ${table(['Boca', 'Puerto', 'Equipo y ubicación', 'VLAN', 'Dirección IP', { t: 'm', num: true }], OUTLETS.map((o) => `<tr data-route="${o.dev}" class="clickable"><td class="mono">${o.pp}-${String(o.n).padStart(2, '0')}</td><td class="mono">${o.sw}/${o.port}</td><td>${o.dev} · ${o.place}</td><td>${typeof o.vlan === 'number' ? vdot(o.vlan) : vdot(10)} ${o.vlan}</td><td class="mono">${o.ip}</td><td class="num">${o.m}</td></tr>`))}
      <h4>Conexiones dentro del gabinete</h4><ul>${RACK_LINKS.map((l) => `<li><b class="mono">${l.from}</b> → ${l.to} <span class="tiny">${l.note}</span></li>`).join('')}</ul><p class="tiny">${RESERVED} Los puntos Wi-Fi y los enlaces entre equipos transportan las VLAN indicadas en la configuración.</p>
      <p class="tiny">Tocá una fila para ver su recorrido en 3D.</p>`,
  },
  {
    id: 'servicios', n: '06', kicker: 'Telefonía, archivos y trabajo remoto', title: 'Servicios y pruebas',
    cam: { pos: [13.75, 1.05, 9.05], target: [14.05, 0.98, 9.8] },
    html: () => `<h4>Central telefónica física</h4>${p(TEXT.telefonia)}${p(PHONES.trunk + ' ' + PHONES.flow)}
      <h4>Archivos y copias de seguridad</h4>${TEXT.archivos.map(p).join('')}
      <h4>Cuatro empleados externos</h4>${p(TEXT.vpn)}`,
  },
  {
    id: 'pruebas', n: '06', kicker: 'Antes de entregar', title: 'Pruebas y certificación',
    cam: { pos: [1.2, 1.7, 7.0], target: [8, 1.3, 7.0] },
    html: () => `<h4>Qué probamos antes de entregar</h4>${p(TEXT.pruebas)}<h4>Qué hace falta para certificar</h4>${p(TEXT.certificar)}
      <button class="btn sm" data-act="lab" data-tab="missions">Probarlo en el laboratorio</button>`,
  },
  {
    id: 'gantt', n: '07', kicker: 'Cronograma de Gantt', title: 'Etapas del trabajo',
    view: 'dollhouse', cam: { pos: [20, 13, 17], target: [4.5, 0, 6.5] }, wide: true,
    html: () => `${p(GANTT.intro)}
      <div class="gantt"><div class="g-head"><span></span>${[1, 2, 3, 4, 5, 6, 7, 8].map((d) => `<span>D${d}</span>`).join('')}</div>
      ${GANTT.tasks.map((t, i) => `<div class="g-row"><span><b>${t.t}</b><i>${t.d}</i></span><div class="g-track"><div class="g-bar ${t.h ? (i >= 6 ? 'alt' : '') : 'doc'}" style="grid-column:${t.days[0]} / ${t.days[1] + 1}">${t.h ? t.h + ' h' : t.note}</div></div></div>`).join('')}</div>
      ${p(GANTT.note)}<h4>Reparto del equipo</h4>${p(GANTT.team)}<p class="tiny">${GANTT.labor}</p>`,
  },
  {
    id: 'presu-equipos', n: '08', kicker: 'Equipos que quedan en el estudio', title: 'Presupuesto de equipos',
    view: 'dollhouse', cam: { pos: [22, 10, 13], target: [6, 0, 6] }, wide: true,
    html: () => `<p class="tiny">${BUDGET.date} Enlaces de los equipos elegidos; sin envíos ni cupones personales. Las PCs e impresoras son del cliente y no se compran.</p>${budgetTable(BUDGET.equipos, BUDGET.equiposTotal)}<p class="tiny">${BUDGET.equiposNote}</p>`,
  },
  {
    id: 'presu-materiales', n: '09', kicker: 'Cableado y montaje', title: 'Presupuesto de materiales',
    view: 'dollhouse', xray: true, cam: { pos: [-2, 12, 16], target: [4.5, 0, 6.5] }, wide: true,
    html: () => `<p class="tiny">Los materiales menores tienen precios estimados, sin publicación individual. Los paneles de conexión, gabinetes y cables de conexión principales conservan sus enlaces.</p>${budgetTable(BUDGET.materiales, BUDGET.materialesTotal)}<p class="tiny">${BUDGET.materialesNote}</p>`,
  },
  {
    id: 'total', n: '10', kicker: 'Presupuesto final', title: 'Herramientas y costo total',
    view: 'dollhouse', cam: { pos: [10, 15, 21], target: [4.5, 0, 6.5] }, wide: true,
    html: () => `<h4>Herramientas del grupo</h4>${table(['Herramienta elegida / compra', { t: 'Precio', num: true }], [...BUDGET.herramientas.map(([n, s, pr]) => `<tr><td>${n}<div class="tiny">${s}</div></td><td class="num">${ars(pr)}</td></tr>`), `<tr class="total"><td>Subtotal de estas herramientas</td><td class="num">${ars(BUDGET.herramientasTotal)}</td></tr>`])}
      <p class="tiny">${BUDGET.herramientasNote}</p>
      <h4>Inversión del cliente</h4>${table(['Concepto', { t: 'Importe', num: true }], [...BUDGET.total.map(([n, v]) => `<tr><td>${n}</td><td class="num">${ars(v)}</td></tr>`), `<tr class="total grand"><td>TOTAL ESTIMADO</td><td class="num">${ars(BUDGET.grandTotal)}</td></tr>`])}
      <p class="tiny">${BUDGET.totalNote}</p>`,
  },
  {
    id: 'cierre', n: '✓', kicker: META.authorsShort, title: 'Gracias',
    view: 'dollhouse', xray: true, cam: { pos: [24, 14, -6], target: [8, 0, 6] },
    html: () => `${p('Este recorrido 3D respeta el plano, las conexiones y las direcciones del TP: cada cable termina en su boca, su panel y su puerto.')}
      ${p('Explorá la oficina con <span class="kbd">W</span><span class="kbd">A</span><span class="kbd">S</span><span class="kbd">D</span>, inspeccioná con <span class="kbd">E</span> y probá la red en el laboratorio.')}
      <div class="row-btns"><button class="btn primary" data-act="explore">Explorar la oficina</button><button class="btn" data-act="lab" data-tab="missions">Misiones</button><a class="btn" href="${import.meta.env.BASE_URL}TP-Redes-FINAL.pdf" target="_blank" rel="noopener">PDF del TP</a></div>`,
  },
];
