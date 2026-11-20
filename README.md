# Red Alvarez 3D · TP Final Redes 2026

Recorrido 3D interactivo de la red de la oficina del TP final de Redes (Colegio San José, 2026). Autores: Tomás Volonté, Juan Manuel Goiburú y Leandro Palombo.

El sitio tiene dos partes: **la landing** (`/`), que presenta el proyecto, sus decisiones y el presupuesto, y **la demo** (`/demo/`), una PWA en three.js que corre entera en el navegador.

La demo funciona en desktop (WASD + mouse) y en celular (joystick táctil). Después de la primera visita queda disponible sin conexión, así que sirve para presentar con un proyector sin wifi.

## Qué incluye

- **La oficina del plano (p.2)**: 16 × 12 m, con salas, puertas y ventanas en sus medidas.
- **Los 23 cables permanentes** de la tabla de la p.6. Cada uno recorre equipo → patch cord → boca rotulada → canaleta → cielorraso → rack → PP → puerto del switch. A eso se suman la fibra R1↔R2 (recorrido de la p.2) y los enlaces internos del rack (SW1/17-19, WAN1/WAN2).
- **Los racks R1 (12U) y R2 (6U)**, con la distribución de U de la p.5 y equipos modelados según datasheet (puertos en su posición real). Los puertos de reserva y los libres quedan vacíos.
- **Rayos X (X)**: muestra los cables del cielorraso y de las canaletas, coloreados por VLAN.
- **Fichas (E)**: cada PC, teléfono, boca, puerto, rack y UPS tiene su ficha con IP, VLAN, boca, puerto y metros. El botón "Ver recorrido" ilumina el cable hasta el rack.
- **Presentación (P)**: las 11 páginas del TP, con la cámara volando a cada lugar (plano, diagrama, VLANs, racks, bocas, servicios, Gantt y presupuestos).
- **Laboratorio (L)**: bloques estilo Scratch, una consola de bajo nivel (CLI JetStream de los switches, cmd en las PCs, Asterisk en la PBX), la topología en vivo y 8 misiones. Los paquetes del simulador viajan por los cables reales del mundo 3D.

`src/data/tp.js` es la fuente única de verdad: todos los datos del TP están ahí y todo lo demás lee de ese archivo.

> El laboratorio es una **simulación educativa** del comportamiento previsto en el TP. No es GNS3 ni reemplaza las pruebas reales. GNS3 necesita un servidor con emuladores (QEMU/Dynamips) y no puede correr en un navegador; esta versión modela la lógica (VLAN, inter-VLAN, ACL de visitas, failover dual WAN, PoE, UPS, PBX y backups) del lado del cliente.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/ (estático, listo para cualquier hosting)
npm run preview
```

## Assets

```bash
npm run assets                          # baja y optimiza los props CC0 de Poly Haven
SKETCHFAB_TOKEN=xxxx npm run assets     # además baja los modelos de Sketchfab (silla, impresora)
```

El token de Sketchfab sale de https://sketchfab.com/settings/password (API Token). Si los GLB `sf_*` existen, la app los usa en lugar de los modelos de respaldo.

Licencias y origen:

- **Poly Haven** (CC0): plantas, sofá, sillones, reloj, matafuegos, estanterías, cuadros, pantalla de proyección, texturas de piso, madera y yeso.
- **Equipos de red, escritorios, sillas, placas y canaletas**: modelados en código (`src/world/devices/`) con medidas de datasheet. Sketchfab no tiene modelos específicos del TL-SG2428P, TL-SG2210P, ER605, DS223j, EAP650 ni GRP2602P.
- **Links de Sketchfab revisados**:
  - "3D Props - Office Interiors" y "Office Empty" son pagos (licencia Standard, no descargables).
  - "Office floor", "Loft 18" y "3D View Office Floor Plan" son gratuitos, pero no coinciden con el plano de 16 × 12 m del TP, así que no se usan como mapa.

## Deploy

El build es 100 % estático (`dist/`) y usa rutas relativas.

- **Vercel**: importar el repo. Ya incluye `vercel.json`.
- **Netlify**: importar el repo. Ya incluye `netlify.toml`.
- **GitHub Pages**: hacer push a `main`. El workflow `.github/workflows/pages.yml` publica solo; antes hay que activar Pages → "GitHub Actions" en la configuración del repo.

## Controles

| Desktop | Celular | Acción |
|---|---|---|
| WASD / flechas, Shift | joystick izquierdo | moverse / correr |
| mouse (clic para capturar) | arrastrar a la derecha | mirar |
| E | tocar el objeto / botón E | inspeccionar |
| X · M · P · L · H | barra inferior | rayos X · plano · presentación · laboratorio · ayuda |
