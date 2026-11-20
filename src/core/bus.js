// Bus de eventos global (desacopla mundo 3D, simulador, laboratorio y UI).
// Eventos conocidos:
//  'inspect'        {id}                       el jugador abrió la ficha de un objeto
//  'room'           {id, name}                 el jugador entró a una sala
//  'packet'         {id, segments, ok, kind, label, color, vlan}   animar un paquete (lo emite el simulador)
//  'sim:change'     {state}                    cambió el estado del simulador (enlace caído, energía, etc.)
//  'route:show'     {dev}                      mostrar el recorrido del cable de un equipo
//  'lab:open'       {device?, mission?, tab?}  abrir el laboratorio
//  'lab:close'      {}
//  'mission:done'   {id}
//  'toast'          {text, kind}
//  'xray'           {on}
//  'camera:focus'   {target:[x,y,z], from:[x,y,z]}
const target = new EventTarget();
export const bus = {
  on(type, fn) {
    const h = (e) => fn(e.detail);
    target.addEventListener(type, h);
    return () => target.removeEventListener(type, h);
  },
  emit(type, detail = {}) {
    target.dispatchEvent(new CustomEvent(type, { detail }));
  },
};
