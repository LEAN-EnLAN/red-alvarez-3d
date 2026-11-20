// Modelos procedurales de equipos (medidas de datasheet, puertos exactos según el TP).
// Todas las funciones devuelven { group, ports: Map<key,{pos,dir}>, pickables, leds? }.
// pos/dir de puertos están en el espacio LOCAL de `group`.
export { buildRack, outletColor, WAN_CORD_COLOR } from './devices/rack.js';
export {
  buildPatchPanel, buildOrganizer, buildSG2428P, buildSG2210P, buildPDU, buildVentBlank, buildFiberReserve, buildShelf,
  sg2428Port, sg2210Port, ppPortX,
} from './devices/rackgear.js';
export {
  buildER605, buildONT, buildNAS, buildPBX, buildPCTower, buildMonitor, buildKeyboard, buildMouse, buildPhone, buildPrinter,
  buildAP, buildUPS, buildJackPlate, buildDesk, buildOfficeChair, buildMeetingTable, buildCanaletaSegment, ER605_PORTS,
} from './devices/desktop.js';
export { countTriangles, UH, makeCord } from './devices/common.js';
