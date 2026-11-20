# Catálogo de assets para generar con IA

Total: **140 slots** · P1: 27 · P2: 69 · P3: 44

P1 = imprescindible · P2 = suma mucho · P3 = extra. Los prompts están en inglés (funcionan mejor). Guardá cada archivo con **la ruta exacta** de la columna "Archivo".

## Texturas

| ID | Archivo | Tamaño | Tile | Alfa | Prio | Dónde se usa |
|---|---|---|---|---|---|---|
| `floor_porcelain_60x60` | `textures/floor_porcelain_60x60.png` | 2048×2048 | sí |  | P1 | Piso de Circulación, Recepción y Sala técnica. 1 repetición = 1,2 × 1,2 m. |
| `floor_oak_laminate` | `textures/floor_oak_laminate.png` | 2048×2048 | sí |  | P1 | Piso de Boxes 1-4, Área de escritorios, Sala de reunión. 1 repetición = 2 × 2 m. |
| `floor_carpet_gerencia` | `textures/floor_carpet_gerencia.png` | 1024×1024 | sí |  | P2 | Alfombra de Gerencia (debajo del escritorio y sillones). 1 repetición = 1 × 1 m. |
| `floor_vinyl_tech_room` | `textures/floor_vinyl_tech_room.png` | 1024×1024 | sí |  | P3 | Piso vinílico antiestático de Sala técnica (alternativa al porcelanato). 1 repetición = 1 × 1 m. |
| `wall_paint_plaster` | `textures/wall_paint_plaster.png` | 1024×1024 | sí |  | P1 | Todas las paredes interiores. 1 repetición = 2 × 2 m. |
| `wall_accent_wood_slats` | `textures/wall_accent_wood_slats.png` | 1024×1024 | sí |  | P2 | Pared de acento detrás del logo en Recepción (2,9 m de ancho). |
| `wall_accent_blue_fabric` | `textures/wall_accent_blue_fabric.png` | 1024×1024 | sí |  | P3 | Panel acústico de tela azul en Sala de reunión (pared sur). |
| `ceiling_tile_60x60` | `textures/ceiling_tile_60x60.png` | 1024×1024 | sí |  | P1 | Cielorraso suspendido. 1 repetición = 1,2 × 1,2 m (2 × 2 placas). |
| `desk_laminate_oak` | `textures/desk_laminate_oak.png` | 1024×1024 | sí |  | P1 | Tapas de los 11 escritorios y mesa de reunión. |
| `desk_laminate_white` | `textures/desk_laminate_white.png` | 1024×1024 | sí |  | P2 | Laterales y cajoneras de escritorios / mueble bajo de impresoras. |
| `fabric_chair_mesh` | `textures/fabric_chair_mesh.png` | 512×512 | sí |  | P2 | Respaldo de las sillas de oficina (malla). |
| `fabric_sofa_grey` | `textures/fabric_sofa_grey.png` | 1024×1024 | sí |  | P2 | Tapizado del sofá y sillones de Recepción y Gerencia. |
| `leather_black` | `textures/leather_black.png` | 1024×1024 | sí |  | P3 | Asientos de sillas de reunión. |
| `metal_brushed_aluminium` | `textures/metal_brushed_aluminium.png` | 1024×1024 | sí |  | P2 | Perfiles de tabiques vidriados, marcos de puertas, patas de escritorio. |
| `metal_powdercoat_black` | `textures/metal_powdercoat_black.png` | 512×512 | sí |  | P2 | Gabinetes de rack R1/R2 y pedestales (solo la chapa, no los equipos). |
| `concrete_slab` | `textures/concrete_slab.png` | 1024×1024 | sí |  | P2 | Losa de hormigón vista en modo Rayos X (sobre el cielorraso). |
| `pvc_duct_white` | `textures/pvc_duct_white.png` | 512×512 | sí |  | P3 | Canaletas Kalop 60×40 y cajas de superficie. |
| `door_wood_veneer` | `textures/door_wood_veneer.png` | 1024×2048 | sí |  | P2 | Hojas de puerta (0,8 × 2,05 m), tileable vertical. |
| `cork_board` | `textures/cork_board.png` | 512×512 | sí |  | P3 | Pizarra de corcho en Sala técnica. |
| `whiteboard_surface` | `textures/whiteboard_surface.png` | 1024×1024 | sí |  | P3 | Superficie de pizarra blanca (sala de reunión) si no se usa la versión dibujada. |

### `floor_porcelain_60x60`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Large-format matte beige porcelain floor tiles, 2 × 2 tiles of 60 × 60 cm filling the frame exactly, very thin light grey grout lines (2 mm) on the tile edges, subtle travertine-like stone variation, warm beige #d9cbb3, like a modern Argentine office corridor.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:** Igual a la referencia 1 de Tomi (pasillo beige). Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `floor_oak_laminate`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Light natural oak laminate flooring, planks 20 cm wide running vertically, staggered joints, fine straight grain, matte finish, color #c8a982, realistic subtle plank-to-plank tone variation.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `floor_carpet_gerencia`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Low-pile commercial carpet tile, charcoal blue-grey #4a5361 with very fine heathered texture, modern corporate office.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `floor_vinyl_tech_room`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Light grey antistatic vinyl floor with tiny darker conductive fleck pattern, technical server room floor, clean, #b9bec4.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `wall_paint_plaster`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Smooth interior wall painted in warm off-white latex paint #f1efea, extremely subtle roller texture, almost flat, eggshell finish.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `wall_accent_wood_slats`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Vertical light oak wood slat acoustic wall panel, slats 3 cm wide with 1 cm dark felt gaps, front orthographic view, even lighting.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `wall_accent_blue_fabric`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Acoustic fabric wall panel, muted navy blue #2b3a55 woven felt texture, fine weave.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `ceiling_tile_60x60`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Suspended acoustic ceiling, 2 × 2 white mineral fiber tiles 60 × 60 cm with fine fissured texture, thin white metal T-grid between tiles, seen from directly below, flat even light.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `desk_laminate_oak`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Light oak melamine desk top surface, straight fine grain, satin finish, #cdb08a, no knots.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `desk_laminate_white`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Matte white melamine furniture surface with very subtle paper-like micro texture, #f3f2ee.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `fabric_chair_mesh`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Black ergonomic office chair mesh fabric, fine hexagonal weave, slightly see-through look, #1d1f23.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `fabric_sofa_grey`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Upholstery fabric, mid grey melange woven textile #8a8f96, soft natural fibers, tight weave.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `leather_black`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Black synthetic leather with fine natural grain, matte, #202226.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `metal_brushed_aluminium`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Brushed aluminium metal, fine horizontal brushing, anodized satin silver #b8bcc2.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `metal_powdercoat_black`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Black textured powder-coated steel, fine orange-peel texture, #1b1d21.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `concrete_slab`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Raw concrete ceiling slab underside, cast-in-place with faint formwork board marks, grey #6b7078, clean.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `pvc_duct_white`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Glossy white rigid PVC plastic surface, very subtle injection-molded texture, #f6f6f3.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `door_wood_veneer`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Light walnut wood veneer door surface, vertical straight grain, satin varnish, #a77b55.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `cork_board`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Natural cork board surface, fine granules, warm tan #b88a5a.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

### `whiteboard_surface`
**Prompt:** Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. Glossy white whiteboard surface with faint ghosting of erased marker smudges, light grey hints.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:**  Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.

## Vistas

| ID | Archivo | Tamaño | Tile | Alfa | Prio | Dónde se usa |
|---|---|---|---|---|---|---|
| `window_view_gerencia` | `views/window_view_gerencia.jpg` | 3072×1700 |  |  | P1 | Ventana norte de Gerencia (2,3 m × 1,27 m; x 0,7–3,0). Se ve desde adentro, a ~2 m. |
| `window_view_escritorios` | `views/window_view_escritorios.jpg` | 4096×1340 |  |  | P1 | Ventana norte del Área de escritorios (3,9 m × 1,27 m; x 10,7–14,6). |
| `window_view_panorama_dusk` | `views/window_view_panorama_dusk.jpg` | 4096×1024 |  |  | P3 | Variante atardecer para el modo presentación (opcional). |

### `window_view_gerencia`
**Prompt:** View out of a second-floor office window in downtown Rosario, Argentina, midday, looking across a tree-lined street (jacarandá and plátano trees) to 1950s-1980s residential buildings with balconies and some modern glass towers, soft blue sky with light clouds, slightly overexposed bright exterior, no window frame visible, photorealistic, natural daylight, modern Argentine office in Rosario, clean and bright, neutral warm whites, light oak wood, subtle blue accents (#2f6bff), 35mm lens, eye level.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion

**Notas:** Sin marco de ventana: el marco lo dibuja la escena. Exterior un poco sobreexpuesto (look real de interior).

### `window_view_escritorios`
**Prompt:** Wide panoramic view from a second-floor office window in Rosario, Argentina, midday, city block with mixed old and modern buildings, street trees, distant view of the Paraná river and the cable-stayed Rosario-Victoria bridge on the horizon, bright daylight, slightly overexposed, no window frame, 28mm lens.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion

### `window_view_panorama_dusk`
**Prompt:** Same Rosario downtown panorama from a second-floor window at golden hour, warm sunset light, buildings lit warmly, Paraná river glowing, no frame.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion

## Pantallas

| ID | Archivo | Tamaño | Tile | Alfa | Prio | Dónde se usa |
|---|---|---|---|---|---|---|
| `screen_pc01` | `screens/screen_pc01.png` | 1920×1080 |  |  | P1 | Monitor de PC01 · Recepción (24", se ve de cerca al inspeccionar). |
| `screen_pc02` | `screens/screen_pc02.png` | 1920×1080 |  |  | P2 | Monitor de PC02 · Box 1 (24", se ve de cerca al inspeccionar). |
| `screen_pc03` | `screens/screen_pc03.png` | 1920×1080 |  |  | P1 | Monitor de PC03 · Box 2 (24", se ve de cerca al inspeccionar). |
| `screen_pc04` | `screens/screen_pc04.png` | 1920×1080 |  |  | P2 | Monitor de PC04 · Box 3 (24", se ve de cerca al inspeccionar). |
| `screen_pc05` | `screens/screen_pc05.png` | 1920×1080 |  |  | P2 | Monitor de PC05 · Box 4 (24", se ve de cerca al inspeccionar). |
| `screen_pc06` | `screens/screen_pc06.png` | 1920×1080 |  |  | P1 | Monitor de PC06 · Gerencia (24", se ve de cerca al inspeccionar). |
| `screen_pc07` | `screens/screen_pc07.png` | 1920×1080 |  |  | P2 | Monitor de PC07 · Escritorio 1 (24", se ve de cerca al inspeccionar). |
| `screen_pc08` | `screens/screen_pc08.png` | 1920×1080 |  |  | P2 | Monitor de PC08 · Escritorio 2 (24", se ve de cerca al inspeccionar). |
| `screen_pc09` | `screens/screen_pc09.png` | 1920×1080 |  |  | P2 | Monitor de PC09 · Escritorio 3 (24", se ve de cerca al inspeccionar). |
| `screen_pc10` | `screens/screen_pc10.png` | 1920×1080 |  |  | P2 | Monitor de PC10 · Escritorio 4 (24", se ve de cerca al inspeccionar). |
| `screen_pc11` | `screens/screen_pc11.png` | 1920×1080 |  |  | P2 | Monitor de PC11 · Escritorio 5 (24", se ve de cerca al inspeccionar). |
| `screen_wallpaper_default` | `screens/screen_wallpaper_default.png` | 1920×1080 |  |  | P2 | Fondo de escritorio por defecto (PCs sin app abierta / modo bloqueo). |
| `screen_lockscreen` | `screens/screen_lockscreen.png` | 1920×1080 |  |  | P3 | Pantalla de bloqueo (corte de luz / PC apagada al volver). |
| `screen_phone_lcd_idle` | `screens/screen_phone_lcd_idle.png` | 528×192 |  |  | P2 | LCD de los teléfonos IP (fondo; el texto del interno lo dibuja la app). |
| `screen_printer_panel` | `screens/screen_printer_panel.png` | 800×480 |  |  | P3 | Panel táctil de las impresoras IMP01/IMP02 (son del cliente, modelo genérico). |
| `screen_tv_reunion` | `screens/screen_tv_reunion.png` | 1920×1080 |  |  | P2 | Pantalla/proyección en Sala de reunión en reposo. |

### `screen_pc01`
**Prompt:** Flat 2D UI screenshot of a fictional modern accounting desktop application in Spanish (Argentina), showing a reception desk agenda app: today's client appointments list with times and names (fictional Spanish names), a small calendar of November 2026, and an incoming calls panel. Clean light UI, white background, blue accent #2f6bff, Inter-like sans-serif font, crisp text, realistic data density. Keep the top 64 px as an empty light grey bar (the app overlays hostname and IP there). No real brand names or logos, no Windows/macOS chrome.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry, photo of a monitor, perspective, bezel, real brand logos

**Notas:** Pantalla plana (no foto de un monitor). Datos ficticios. Revisar ortografía.

### `screen_pc02`
**Prompt:** Flat 2D UI screenshot of a fictional modern accounting desktop application in Spanish (Argentina), showing payroll software "Liquidación de sueldos": employee table with columns Legajo, Apellido y nombre, Básico, Antigüedad, Neto (ARS amounts like $1.250.000,00). Clean light UI, white background, blue accent #2f6bff, Inter-like sans-serif font, crisp text, realistic data density. Keep the top 64 px as an empty light grey bar (the app overlays hostname and IP there). No real brand names or logos, no Windows/macOS chrome.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry, photo of a monitor, perspective, bezel, real brand logos

**Notas:** Pantalla plana (no foto de un monitor). Datos ficticios. Revisar ortografía.

### `screen_pc03`
**Prompt:** Flat 2D UI screenshot of a fictional modern accounting desktop application in Spanish (Argentina), showing VAT tax filing screen "Declaración jurada IVA - Noviembre 2026": débito fiscal / crédito fiscal summary cards and a table of invoices. Clean light UI, white background, blue accent #2f6bff, Inter-like sans-serif font, crisp text, realistic data density. Keep the top 64 px as an empty light grey bar (the app overlays hostname and IP there). No real brand names or logos, no Windows/macOS chrome.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry, photo of a monitor, perspective, bezel, real brand logos

**Notas:** Pantalla plana (no foto de un monitor). Datos ficticios. Revisar ortografía.

### `screen_pc04`
**Prompt:** Flat 2D UI screenshot of a fictional modern accounting desktop application in Spanish (Argentina), showing balance sheet editor "Balance general 2026": Activo / Pasivo / Patrimonio neto tree with ARS amounts. Clean light UI, white background, blue accent #2f6bff, Inter-like sans-serif font, crisp text, realistic data density. Keep the top 64 px as an empty light grey bar (the app overlays hostname and IP there). No real brand names or logos, no Windows/macOS chrome.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry, photo of a monitor, perspective, bezel, real brand logos

**Notas:** Pantalla plana (no foto de un monitor). Datos ficticios. Revisar ortografía.

### `screen_pc05`
**Prompt:** Flat 2D UI screenshot of a fictional modern accounting desktop application in Spanish (Argentina), showing electronic invoicing screen "Facturación": a draft "Factura B" with items, subtotal, IVA 21%, total in ARS. Clean light UI, white background, blue accent #2f6bff, Inter-like sans-serif font, crisp text, realistic data density. Keep the top 64 px as an empty light grey bar (the app overlays hostname and IP there). No real brand names or logos, no Windows/macOS chrome.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry, photo of a monitor, perspective, bezel, real brand logos

**Notas:** Pantalla plana (no foto de un monitor). Datos ficticios. Revisar ortografía.

### `screen_pc06`
**Prompt:** Flat 2D UI screenshot of a fictional modern accounting desktop application in Spanish (Argentina), showing management dashboard: KPI cards (clientes activos, vencimientos de la semana, honorarios cobrados), a bar chart of monthly fees and a due-dates timeline. Clean light UI, white background, blue accent #2f6bff, Inter-like sans-serif font, crisp text, realistic data density. Keep the top 64 px as an empty light grey bar (the app overlays hostname and IP there). No real brand names or logos, no Windows/macOS chrome.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry, photo of a monitor, perspective, bezel, real brand logos

**Notas:** Pantalla plana (no foto de un monitor). Datos ficticios. Revisar ortografía.

### `screen_pc07`
**Prompt:** Flat 2D UI screenshot of a fictional modern accounting desktop application in Spanish (Argentina), showing spreadsheet app with a bank reconciliation "Conciliación bancaria" table, green/red highlighted cells. Clean light UI, white background, blue accent #2f6bff, Inter-like sans-serif font, crisp text, realistic data density. Keep the top 64 px as an empty light grey bar (the app overlays hostname and IP there). No real brand names or logos, no Windows/macOS chrome.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry, photo of a monitor, perspective, bezel, real brand logos

**Notas:** Pantalla plana (no foto de un monitor). Datos ficticios. Revisar ortografía.

### `screen_pc08`
**Prompt:** Flat 2D UI screenshot of a fictional modern accounting desktop application in Spanish (Argentina), showing client files manager "Legajos de clientes": list of company clients with CUIT-like fictional numbers and status chips. Clean light UI, white background, blue accent #2f6bff, Inter-like sans-serif font, crisp text, realistic data density. Keep the top 64 px as an empty light grey bar (the app overlays hostname and IP there). No real brand names or logos, no Windows/macOS chrome.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry, photo of a monitor, perspective, bezel, real brand logos

**Notas:** Pantalla plana (no foto de un monitor). Datos ficticios. Revisar ortografía.

### `screen_pc09`
**Prompt:** Flat 2D UI screenshot of a fictional modern accounting desktop application in Spanish (Argentina), showing income tax worksheet "Ganancias 2026" with deductions table and a pie chart. Clean light UI, white background, blue accent #2f6bff, Inter-like sans-serif font, crisp text, realistic data density. Keep the top 64 px as an empty light grey bar (the app overlays hostname and IP there). No real brand names or logos, no Windows/macOS chrome.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry, photo of a monitor, perspective, bezel, real brand logos

**Notas:** Pantalla plana (no foto de un monitor). Datos ficticios. Revisar ortografía.

### `screen_pc10`
**Prompt:** Flat 2D UI screenshot of a fictional modern accounting desktop application in Spanish (Argentina), showing accounts payable "Proveedores y pagos" table with due dates and an aging bar. Clean light UI, white background, blue accent #2f6bff, Inter-like sans-serif font, crisp text, realistic data density. Keep the top 64 px as an empty light grey bar (the app overlays hostname and IP there). No real brand names or logos, no Windows/macOS chrome.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry, photo of a monitor, perspective, bezel, real brand logos

**Notas:** Pantalla plana (no foto de un monitor). Datos ficticios. Revisar ortografía.

### `screen_pc11`
**Prompt:** Flat 2D UI screenshot of a fictional modern accounting desktop application in Spanish (Argentina), showing email client with a list of messages from clients about due dates ("Vencimiento monotributo", "Envío de balance"), reading pane open. Clean light UI, white background, blue accent #2f6bff, Inter-like sans-serif font, crisp text, realistic data density. Keep the top 64 px as an empty light grey bar (the app overlays hostname and IP there). No real brand names or logos, no Windows/macOS chrome.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry, photo of a monitor, perspective, bezel, real brand logos

**Notas:** Pantalla plana (no foto de un monitor). Datos ficticios. Revisar ortografía.

### `screen_wallpaper_default`
**Prompt:** Minimal desktop wallpaper, soft abstract flowing blue and white waves, very light, elegant, corporate, lots of empty space in the center.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `screen_lockscreen`
**Prompt:** Lock screen with a blurred photo of the Paraná river at morning in Rosario, large clock "10:42" and date "viernes 20 de noviembre" in Spanish, minimal.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

### `screen_phone_lcd_idle`
**Prompt:** Monochrome backlit LCD screen texture, pale blue-green backlight, very subtle pixel grid, empty, evenly lit.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

**Notas:** Solo fondo del LCD: NO dibujar la carcasa del teléfono (regla de Tomi).

### `screen_printer_panel`
**Prompt:** Small touchscreen UI of a generic office multifunction printer, Spanish labels "Copiar", "Escanear", "Imprimir", "Estado: Lista", simple icons, light theme.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

### `screen_tv_reunion`
**Prompt:** Presentation title slide, white background, big headline "Alvarez & Asoc." and subtitle "Estudio contable · Reunión de equipo", small blue bar-chart isotype (three ascending rounded bars), minimal.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

## TP

| ID | Archivo | Tamaño | Tile | Alfa | Prio | Dónde se usa |
|---|---|---|---|---|---|---|
| `whiteboard_network_sketch` | `art/whiteboard_network_sketch.png` | 2400×1200 |  |  | P1 | Pizarra blanca en Sala de reunión, pared norte interior (2,0 × 1,0 m). |
| `whiteboard_blank` | `art/whiteboard_blank.png` | 2400×1200 |  |  | P1 | Respaldo de la pizarra (texto superpuesto por código). |
| `poster_floor_plan` | `art/poster_floor_plan.png` | 1400×1050 |  |  | P3 | Cuadro "Plano de la oficina" en Recepción (opcional, podemos usar la p.2 del PDF). |
| `corkboard_tech_notes` | `art/corkboard_tech_notes.png` | 1600×1100 |  |  | P2 | Pizarra de corcho en Sala técnica junto a R1. |

### `whiteboard_network_sketch`
**Prompt:** Front orthographic photo of a clean office whiteboard filling the frame, hand-drawn with blue, black and orange dry-erase markers, neat engineer handwriting. Drawing: Title "Red del estudio" at top. Left: two cloud shapes labeled "CLARO 200 Mb/s" and "PERSONAL 300 Mb/s", arrows into a box "ER605". From ER605 an arrow down to box "SW1 · R1". A thick ORANGE line labeled "fibra 30 m · 1 Gb/s" from SW1 to box "SW2 · R2". Under SW1, small handwritten list: "PC01–PC06", "TEL 101–107", "NAS1 · PBX", "NAS2 · IMP01 · AP1". Under SW2: "PC07–PC11", "IMP02 · AP2". Bottom right corner: "VLAN 10/20/30/40/50/60".

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry, extra devices, additional arrows, perspective

**Notas:** EXACTO al TP p.3: no agregar equipos ni flechas extra. Si la IA erra texto, generar whiteboard_blank y el texto lo dibujamos por código.

### `whiteboard_blank`
**Prompt:** Front orthographic photo of an empty office whiteboard with aluminium frame and marker tray, faint erased marker ghosting, even light.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion, perspective

### `poster_floor_plan`
**Prompt:** Elegant architectural blueprint style print of an office floor plan, navy lines on off-white paper, NO text, matching this layout: 16x12 m rectangle; top row from left: big room 4 m wide, two stacked small rooms, 1 m corridor, two stacked small rooms, big open room 6 m; middle 2 m corridor across; bottom row: room 6 m, room 6 m, room 4 m.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Mejor usar la página real del TP: queda como alternativa decorativa.

### `corkboard_tech_notes`
**Prompt:** Cork board with pinned papers: a printed label sheet titled "Rotulado de bocas" with rows "R1-PP1-01 … R1-PP1-16", a sticky note "UPS: probar 10 min", a sticky note "Claro principal / Personal respaldo", a small paper "Contraseñas: en caja fuerte", pushpins, front orthographic.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Texto exacto. No mostrar contraseñas reales.

## Arte

| ID | Archivo | Tamaño | Tile | Alfa | Prio | Dónde se usa |
|---|---|---|---|---|---|---|
| `art_monumento_bandera` | `art/art_monumento_bandera.jpg` | 1600×1100 |  |  | P1 | Cuadro enmarcado · Gerencia, pared oeste (1,0 × 0,7 m). |
| `art_puente_rosario_victoria` | `art/art_puente_rosario_victoria.jpg` | 1600×1100 |  |  | P1 | Cuadro enmarcado · Recepción, pared oeste (1,2 × 0,6 m). |
| `art_rio_parana` | `art/art_rio_parana.jpg` | 1600×1100 |  |  | P2 | Cuadro enmarcado · Sala de reunión, pared este (1,2 × 0,8 m). |
| `art_parque_independencia` | `art/art_parque_independencia.jpg` | 1600×1100 |  |  | P3 | Cuadro enmarcado · Circulación, pared sur (0,8 × 0,6 m). |
| `art_abstract_blue_1` | `art/art_abstract_blue_1.jpg` | 1600×1100 |  |  | P2 | Cuadro enmarcado · Box 1-4 (cuadro chico, uno por box). |
| `art_abstract_blue_2` | `art/art_abstract_blue_2.jpg` | 1600×1100 |  |  | P2 | Cuadro enmarcado · Área de escritorios, pared este. |
| `art_abstract_warm` | `art/art_abstract_warm.jpg` | 1600×1100 |  |  | P3 | Cuadro enmarcado · Gerencia, pared este. |
| `art_numbers_print` | `art/art_numbers_print.jpg` | 1600×1100 |  |  | P3 | Cuadro enmarcado · Box de contadores (humor de oficina). |
| `art_diploma` | `art/art_diploma.png` | 1100×1400 |  |  | P3 | Diploma enmarcado en Gerencia (detrás del escritorio). |
| `art_team_photo` | `art/art_team_photo.jpg` | 1600×1100 |  |  | P3 | Foto del equipo en Recepción (opcional). |

### `art_monumento_bandera`
**Prompt:** Fine art photograph of the Monumento Nacional a la Bandera in Rosario, Argentina at blue hour, symmetrical composition, long exposure, calm Paraná sky, no frame (the frame is 3D), no text.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion

### `art_puente_rosario_victoria`
**Prompt:** Fine art panoramic photograph of the Rosario-Victoria cable-stayed bridge over the Paraná river at sunrise, mist over wetlands, minimal, no frame (the frame is 3D), no text.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion

### `art_rio_parana`
**Prompt:** Fine art aerial photograph of the Paraná river islands and delta near Rosario, abstract meandering water patterns, muted greens and browns, no frame (the frame is 3D), no text.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion

### `art_parque_independencia`
**Prompt:** Photograph of Parque de la Independencia in Rosario, tree-lined path in autumn, warm light, calm, no frame (the frame is 3D), no text.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion

### `art_abstract_blue_1`
**Prompt:** Minimal abstract painting, soft blue and sand color fields, textured canvas, Scandinavian corporate art, no frame (the frame is 3D), no text.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion

### `art_abstract_blue_2`
**Prompt:** Minimal abstract line art, single continuous navy line forming gentle waves on cream paper, no frame (the frame is 3D), no text.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion

### `art_abstract_warm`
**Prompt:** Minimal abstract painting with terracotta, beige and white overlapping arches, textured paper, no frame (the frame is 3D), no text.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion

### `art_numbers_print`
**Prompt:** Typographic art print "Debe = Haber" in elegant serif letters, black on cream paper, minimal, centered, no frame (the frame is 3D), no text.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

### `art_diploma`
**Prompt:** Formal diploma certificate on ivory paper with an ornamental border and a gold seal, Spanish text "Contador Público" and a fictional name "Ricardo Alvarez", NO real university name, NO real logos.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

### `art_team_photo`
**Prompt:** Friendly group photo of a small Argentine accounting firm team of six adults of diverse ages in smart casual clothes, standing in a bright office, natural smiles, shallow depth of field.

**Negativo:** text, watermark, distorted faces, extra fingers, blurry

## Marca

| ID | Archivo | Tamaño | Tile | Alfa | Prio | Dónde se usa |
|---|---|---|---|---|---|---|
| `logo_isotype` | `branding/logo_isotype.png` | 1024×1024 |  | sí | P1 | Isotipo: HUD, favicon, taza, felpudo, carga. |
| `logo_wordmark_dark` | `branding/logo_wordmark_dark.png` | 2400×700 |  | sí | P1 | Logo sobre fondos claros (pared de Recepción, papelería). |
| `logo_wordmark_light` | `branding/logo_wordmark_light.png` | 2400×700 |  | sí | P1 | Logo sobre fondos oscuros (pantalla de carga, UI). |
| `logo_wall_3d_letters` | `branding/logo_wall_3d_letters.png` | 2400×800 |  |  | P3 | Referencia/alternativa: letras corpóreas del logo en la pared de Recepción. |
| `mug_logo` | `branding/mug_logo.png` | 1024×512 |  |  | P3 | Textura envolvente de las tazas sobre escritorios. |
| `doormat_logo` | `branding/doormat_logo.png` | 1600×1000 |  |  | P3 | Felpudo en la entrada (frente, 1,2 × 0,75 m). |
| `business_cards` | `branding/business_cards.png` | 1200×800 |  |  | P3 | Tarjetero sobre el escritorio de Recepción. |

### `logo_isotype`
**Prompt:** Logo isotype of three ascending rounded vertical bars in royal blue #2f6bff (like a growing chart), simple flat vector, centered, transparent background, no text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `logo_wordmark_dark`
**Prompt:** Horizontal company logo: isotype of three ascending rounded vertical bars in royal blue #2f6bff (like a growing chart), simple flat vector on the left, a thin vertical divider, then the wordmark "Alvarez & Asoc." in a modern geometric sans-serif, dark navy #1f2937, and below it smaller letter-spaced "ESTUDIO CONTABLE" in grey. Transparent background.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Texto exacto: "Alvarez & Asoc." (sin tilde en Alvarez) y "ESTUDIO CONTABLE".

### `logo_wordmark_light`
**Prompt:** Same horizontal logo as the dark version but wordmark in white #ffffff and subtitle in light grey, isotype in light blue #60a5fa. Transparent background.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

### `logo_wall_3d_letters`
**Prompt:** Photo of brushed metal 3D corporate letters "Alvarez & Asoc." mounted on a light oak slat wall with soft shadow, front view, photoreal.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

### `mug_logo`
**Prompt:** Flat print design for a coffee mug wrap: white background, small blue three-bar isotype and "Alvarez & Asoc." on the right half, plenty of white space.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

### `doormat_logo`
**Prompt:** Top-down orthographic photo of a dark grey coir entrance doormat with a subtle embossed blue three-bar logo and the word "Bienvenidos", even light.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

### `business_cards`
**Prompt:** Top-down photo of a small stack of white business cards with a blue three-bar isotype and "Alvarez & Asoc. · Estudio contable · Rosario", minimal.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

## Cartelería

| ID | Archivo | Tamaño | Tile | Alfa | Prio | Dónde se usa |
|---|---|---|---|---|---|---|
| `sign_room_gerencia` | `signs/sign_room_gerencia.png` | 1024×256 |  | sí | P2 | Placa de puerta de "Gerencia" (0,62 × 0,15 m, al costado de la puerta, a 1,6 m). |
| `sign_room_box_1` | `signs/sign_room_box_1.png` | 1024×256 |  | sí | P2 | Placa de puerta de "Box 1" (0,62 × 0,15 m, al costado de la puerta, a 1,6 m). |
| `sign_room_box_2` | `signs/sign_room_box_2.png` | 1024×256 |  | sí | P2 | Placa de puerta de "Box 2" (0,62 × 0,15 m, al costado de la puerta, a 1,6 m). |
| `sign_room_box_3` | `signs/sign_room_box_3.png` | 1024×256 |  | sí | P2 | Placa de puerta de "Box 3" (0,62 × 0,15 m, al costado de la puerta, a 1,6 m). |
| `sign_room_box_4` | `signs/sign_room_box_4.png` | 1024×256 |  | sí | P2 | Placa de puerta de "Box 4" (0,62 × 0,15 m, al costado de la puerta, a 1,6 m). |
| `sign_room_area_de_escritorios` | `signs/sign_room_area_de_escritorios.png` | 1024×256 |  | sí | P2 | Placa de puerta de "Área de escritorios" (0,62 × 0,15 m, al costado de la puerta, a 1,6 m). |
| `sign_room_recepcion` | `signs/sign_room_recepcion.png` | 1024×256 |  | sí | P2 | Placa de puerta de "Recepción" (0,62 × 0,15 m, al costado de la puerta, a 1,6 m). |
| `sign_room_sala_de_reunion` | `signs/sign_room_sala_de_reunion.png` | 1024×256 |  | sí | P2 | Placa de puerta de "Sala de reunión" (0,62 × 0,15 m, al costado de la puerta, a 1,6 m). |
| `sign_room_sala_tecnica` | `signs/sign_room_sala_tecnica.png` | 1024×256 |  | sí | P2 | Placa de puerta de "Sala técnica" (0,62 × 0,15 m, al costado de la puerta, a 1,6 m). |
| `sign_matafuego` | `signs/sign_matafuego.png` | 1024×1024 |  | sí | P1 | Señal · Junto a cada matafuego (Recepción, Sala técnica). |
| `sign_salida` | `signs/sign_salida.png` | 1024×1024 |  | sí | P1 | Señal · Sobre la puerta de entrada (cara interior). |
| `sign_riesgo_electrico` | `signs/sign_riesgo_electrico.png` | 1024×1024 |  | sí | P1 | Señal · Puerta de Sala técnica y frente de R1. |
| `sign_acceso_restringido` | `signs/sign_acceso_restringido.png` | 1024×1024 |  | sí | P2 | Señal · Puerta de Sala técnica. |
| `sign_prohibido_fumar` | `signs/sign_prohibido_fumar.png` | 1024×1024 |  | sí | P3 | Señal · Circulación. |
| `sign_wifi_visitas` | `signs/sign_wifi_visitas.png` | 1024×1024 |  | sí | P2 | Señal · Mostrador de Recepción (atril A5). |
| `sign_baños` | `signs/sign_baños.png` | 1024×1024 |  | sí | P3 | Señal · Circulación (flecha hacia fuera del plano). |
| `sign_rack_r1` | `signs/sign_rack_r1.png` | 1024×1024 |  | sí | P3 | Señal · Puerta de vidrio de R1. |
| `sign_rack_r2` | `signs/sign_rack_r2.png` | 1024×1024 |  | sí | P3 | Señal · Puerta de vidrio de R2. |
| `sign_ups` | `signs/sign_ups.png` | 1024×1024 |  | sí | P3 | Señal · Junto a cada UPS. |

### `sign_room_gerencia`
**Prompt:** Flat front view of a minimal office door sign plate, brushed aluminium with a dark navy #243447 face, white text "GERENCIA" in a clean geometric sans-serif, small blue three-bar icon at left, rounded corners, transparent background around the plate.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Texto exacto "GERENCIA" (con tilde si corresponde).

### `sign_room_box_1`
**Prompt:** Flat front view of a minimal office door sign plate, brushed aluminium with a dark navy #243447 face, white text "BOX 1" in a clean geometric sans-serif, small blue three-bar icon at left, rounded corners, transparent background around the plate.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Texto exacto "BOX 1" (con tilde si corresponde).

### `sign_room_box_2`
**Prompt:** Flat front view of a minimal office door sign plate, brushed aluminium with a dark navy #243447 face, white text "BOX 2" in a clean geometric sans-serif, small blue three-bar icon at left, rounded corners, transparent background around the plate.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Texto exacto "BOX 2" (con tilde si corresponde).

### `sign_room_box_3`
**Prompt:** Flat front view of a minimal office door sign plate, brushed aluminium with a dark navy #243447 face, white text "BOX 3" in a clean geometric sans-serif, small blue three-bar icon at left, rounded corners, transparent background around the plate.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Texto exacto "BOX 3" (con tilde si corresponde).

### `sign_room_box_4`
**Prompt:** Flat front view of a minimal office door sign plate, brushed aluminium with a dark navy #243447 face, white text "BOX 4" in a clean geometric sans-serif, small blue three-bar icon at left, rounded corners, transparent background around the plate.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Texto exacto "BOX 4" (con tilde si corresponde).

### `sign_room_area_de_escritorios`
**Prompt:** Flat front view of a minimal office door sign plate, brushed aluminium with a dark navy #243447 face, white text "ÁREA DE ESCRITORIOS" in a clean geometric sans-serif, small blue three-bar icon at left, rounded corners, transparent background around the plate.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Texto exacto "ÁREA DE ESCRITORIOS" (con tilde si corresponde).

### `sign_room_recepcion`
**Prompt:** Flat front view of a minimal office door sign plate, brushed aluminium with a dark navy #243447 face, white text "RECEPCIÓN" in a clean geometric sans-serif, small blue three-bar icon at left, rounded corners, transparent background around the plate.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Texto exacto "RECEPCIÓN" (con tilde si corresponde).

### `sign_room_sala_de_reunion`
**Prompt:** Flat front view of a minimal office door sign plate, brushed aluminium with a dark navy #243447 face, white text "SALA DE REUNIÓN" in a clean geometric sans-serif, small blue three-bar icon at left, rounded corners, transparent background around the plate.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Texto exacto "SALA DE REUNIÓN" (con tilde si corresponde).

### `sign_room_sala_tecnica`
**Prompt:** Flat front view of a minimal office door sign plate, brushed aluminium with a dark navy #243447 face, white text "SALA TÉCNICA" in a clean geometric sans-serif, small blue three-bar icon at left, rounded corners, transparent background around the plate.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Texto exacto "SALA TÉCNICA" (con tilde si corresponde).

### `sign_matafuego`
**Prompt:** Flat vector safety/wayfinding sign, front orthographic: Argentine IRAM style fire safety sign: red square with white fire extinguisher pictogram and white text "MATAFUEGO" underneath. Transparent background around the sign.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Respetar mayúsculas y tildes del texto.

### `sign_salida`
**Prompt:** Flat vector safety/wayfinding sign, front orthographic: Green emergency exit sign, white running man pictogram, arrow, white text "SALIDA", photoluminescent style. Transparent background around the sign.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Respetar mayúsculas y tildes del texto.

### `sign_riesgo_electrico`
**Prompt:** Flat vector safety/wayfinding sign, front orthographic: Yellow warning triangle with black lightning bolt, black text "RIESGO ELÉCTRICO" below, Argentine IRAM 10005 style. Transparent background around the sign.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Respetar mayúsculas y tildes del texto.

### `sign_acceso_restringido`
**Prompt:** Flat vector safety/wayfinding sign, front orthographic: Blue mandatory-style sign "SALA TÉCNICA · ACCESO RESTRINGIDO" with a small key pictogram, white text. Transparent background around the sign.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Respetar mayúsculas y tildes del texto.

### `sign_prohibido_fumar`
**Prompt:** Flat vector safety/wayfinding sign, front orthographic: Prohibition sign: red circle with diagonal bar over a cigarette, text "PROHIBIDO FUMAR". Transparent background around the sign.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Respetar mayúsculas y tildes del texto.

### `sign_wifi_visitas`
**Prompt:** Flat vector safety/wayfinding sign, front orthographic: Small elegant table sign "Wi-Fi para visitas" with a wifi icon and the line "Red separada · pedí la clave en recepción", blue accent, no QR code, no password. Transparent background around the sign.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Respetar mayúsculas y tildes del texto.

### `sign_baños`
**Prompt:** Flat vector safety/wayfinding sign, front orthographic: Minimal wayfinding sign with restroom pictograms and an arrow, text "Baños", navy and white. Transparent background around the sign.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Respetar mayúsculas y tildes del texto.

### `sign_rack_r1`
**Prompt:** Flat vector safety/wayfinding sign, front orthographic: Small engraved label plate "R1 · GABINETE PRINCIPAL" white text on black. Transparent background around the sign.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Respetar mayúsculas y tildes del texto.

### `sign_rack_r2`
**Prompt:** Flat vector safety/wayfinding sign, front orthographic: Small engraved label plate "R2 · ESCRITORIOS" white text on black. Transparent background around the sign.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Respetar mayúsculas y tildes del texto.

### `sign_ups`
**Prompt:** Flat vector safety/wayfinding sign, front orthographic: Small yellow label "UPS · NO DESCONECTAR" black text. Transparent background around the sign.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Respetar mayúsculas y tildes del texto.

## Objetos

| ID | Archivo | Tamaño | Tile | Alfa | Prio | Dónde se usa |
|---|---|---|---|---|---|---|
| `decal_invoice_factura_b` | `props/decal_invoice_factura_b.png` | 1240×1754 |  |  | P2 | Objeto · Hoja sobre escritorios de Boxes (A4, vista superior). |
| `decal_spreadsheet_printout` | `props/decal_spreadsheet_printout.png` | 1240×1754 |  |  | P2 | Objeto · Hojas sobre escritorios del Área de escritorios. |
| `decal_balance_report` | `props/decal_balance_report.png` | 1240×1754 |  |  | P3 | Objeto · Escritorio de Gerencia. |
| `decal_sticky_notes` | `props/decal_sticky_notes.png` | 1240×1240 |  | sí | P2 | Objeto · Monitores y escritorios (varios). |
| `decal_desk_calendar` | `props/decal_desk_calendar.png` | 1240×1240 |  |  | P2 | Objeto · Calendario de escritorio (Recepción, Gerencia). |
| `decal_wall_calendar` | `props/decal_wall_calendar.png` | 1240×1240 |  |  | P3 | Objeto · Calendario de pared en Circulación. |
| `decal_binder_spines` | `props/decal_binder_spines.png` | 1600×1100 |  |  | P1 | Objeto · Lomos de biblioratos en estanterías (Gerencia, Escritorios). |
| `decal_coffee_top` | `props/decal_coffee_top.png` | 512×512 |  | sí | P3 | Café visto desde arriba dentro de las tazas. |
| `decal_paper_stack` | `props/decal_paper_stack.png` | 1240×1754 |  |  | P3 | Pila de papeles (lado superior). |

### `decal_invoice_factura_b`
**Prompt:** Top-down flat scan of an A4 fictional Argentine invoice "FACTURA B" with a header box, item table, IVA line and total in ARS, slightly crumpled paper texture.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Contenido ficticio, sin datos reales.

### `decal_spreadsheet_printout`
**Prompt:** Top-down flat scan of an A4 spreadsheet printout with numeric columns and a few yellow highlighter marks, Spanish headers.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Contenido ficticio, sin datos reales.

### `decal_balance_report`
**Prompt:** Top-down flat scan of an A4 report cover "Balance 2026 · Borrador" with a simple bar chart, blue accents.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Contenido ficticio, sin datos reales.

### `decal_sticky_notes`
**Prompt:** Set of 6 square sticky notes (yellow, pink, blue, green) laid out in a grid, each with short Spanish handwritten notes: "llamar al cliente", "vence IVA 18/11", "backup ✓", "reunión 15hs", "pedir tóner", "IP 10.10.20.103", transparent background between notes.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Contenido ficticio, sin datos reales.

### `decal_desk_calendar`
**Prompt:** Front view of a desk calendar page "NOVIEMBRE 2026" in Spanish with weekdays L M M J V S D, correct dates (November 1, 2026 is a Sunday), a few dates circled in red.

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Contenido ficticio, sin datos reales.

### `decal_wall_calendar`
**Prompt:** Wall calendar "Noviembre 2026" in Spanish, photo of Rosario river at top, grid below with correct dates (1 Nov 2026 = Sunday).

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Contenido ficticio, sin datos reales.

### `decal_binder_spines`
**Prompt:** Front orthographic view of 10 office binder spines side by side, alternating navy, grey and white, white labels with handwritten Spanish titles: "IVA 2026", "Sueldos", "Ganancias", "Balances", "Clientes A-M", "Clientes N-Z", "Proveedores", "Bancos", "Monotributo", "Varios".

**Negativo:** misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry

**Notas:** Contenido ficticio, sin datos reales.

### `decal_coffee_top`
**Prompt:** Top-down macro of black coffee surface in a white mug with light crema, circular, transparent outside the mug rim.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion

### `decal_paper_stack`
**Prompt:** Top-down photo of a neat stack of white A4 papers with a black binder clip, plain, no readable text.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion

## UI

| ID | Archivo | Tamaño | Tile | Alfa | Prio | Dónde se usa |
|---|---|---|---|---|---|---|
| `ui_loader_keyart` | `ui/ui_loader_keyart.jpg` | 2560×1440 |  |  | P1 | Fondo de la pantalla de carga/inicio (detrás del título y del minijuego). |
| `ui_studio_backdrop` | `ui/ui_studio_backdrop.jpg` | 4096×2048 |  |  | P1 | Fondo del modo maqueta/plano (equirectangular 2:1, alrededor del edificio). |
| `ui_studio_floor` | `ui/ui_studio_floor.jpg` | 2048×2048 |  |  | P2 | Piso del estudio alrededor de la maqueta (fade radial). |
| `ui_onboard_keyboard` | `ui/ui_onboard_keyboard.png` | 800×600 |  | sí | P2 | Ayuda/onboarding desktop: teclas WASD + Shift + E. |
| `ui_onboard_mouse` | `ui/ui_onboard_mouse.png` | 800×600 |  | sí | P2 | Ayuda desktop: mover el mouse para mirar. |
| `ui_onboard_touch` | `ui/ui_onboard_touch.png` | 800×600 |  | sí | P2 | Ayuda celular: joystick izquierdo + arrastrar a la derecha. |
| `ui_onboard_inspect` | `ui/ui_onboard_inspect.png` | 800×600 |  | sí | P2 | Ayuda: inspeccionar con E / tocar. |
| `ui_onboard_xray` | `ui/ui_onboard_xray.png` | 800×600 |  | sí | P2 | Ayuda: modo Rayos X. |
| `ui_onboard_plan` | `ui/ui_onboard_plan.png` | 800×600 |  | sí | P2 | Ayuda: vista plano. |
| `ui_onboard_lab` | `ui/ui_onboard_lab.png` | 800×600 |  | sí | P2 | Ayuda: laboratorio. |
| `ui_empty_lab` | `ui/ui_empty_lab.png` | 800×600 |  | sí | P3 | Estado vacío del editor de bloques. |
| `ui_offline` | `ui/ui_offline.png` | 800×600 |  | sí | P3 | Aviso "sin conexión" (la app sigue funcionando offline). |
| `ui_mission_complete` | `ui/ui_mission_complete.png` | 1200×800 |  | sí | P2 | Fondo del cartel "Misión completada". |
| `ui_paper_texture` | `ui/ui_paper_texture.png` | 1024×1024 | sí |  | P3 | Textura sutil de papel para paneles de la UI clara (presentación). |

### `ui_loader_keyart`
**Prompt:** Bright architectural cutaway render of a small modern office floor seen from above at 35 degrees, roof removed, white walls, light oak floors, desks with monitors, glowing colored network cables (blue, green, orange fiber) running across the ceiling to a small server rack, soft white studio background, lots of negative space on the left third for a title, high-end architectural visualization.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion, dark background, neon, cyberpunk

**Notas:** Dejar el tercio izquierdo limpio para el título. Fondo claro (pedido del usuario: entorno blanco).

### `ui_studio_backdrop`
**Prompt:** Equirectangular 360 panorama of an infinite seamless white photo studio cyclorama, very soft even light, faint warm-grey gradient toward the floor, no objects, no seams.

**Negativo:** objects, seams, lamps, people, text, dark

**Notas:** Debe cerrar en los bordes izq/der (360°). Se usa como skybox claro + reflejos.

### `ui_studio_floor`
**Prompt:** Top-down seamless very light grey matte studio floor, subtle micro texture, soft radial vignette fading to white at the edges.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion

### `ui_onboard_keyboard`
**Prompt:** Clean minimal flat vector illustration, thin navy outlines with blue #2f6bff accents, white fills, soft shadow, transparent background: keyboard keys W A S D grouped, a wider Shift key and an E key highlighted in blue, with small motion arrows. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `ui_onboard_mouse`
**Prompt:** Clean minimal flat vector illustration, thin navy outlines with blue #2f6bff accents, white fills, soft shadow, transparent background: a computer mouse with curved arrows around it indicating looking around. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `ui_onboard_touch`
**Prompt:** Clean minimal flat vector illustration, thin navy outlines with blue #2f6bff accents, white fills, soft shadow, transparent background: a smartphone held horizontally, left thumb on a virtual joystick circle, right thumb swiping, with motion arrows. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `ui_onboard_inspect`
**Prompt:** Clean minimal flat vector illustration, thin navy outlines with blue #2f6bff accents, white fills, soft shadow, transparent background: a hand cursor pointing at a computer tower with a small info card popping out. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `ui_onboard_xray`
**Prompt:** Clean minimal flat vector illustration, thin navy outlines with blue #2f6bff accents, white fills, soft shadow, transparent background: a ceiling cut-away showing colorful cables (blue, green, yellow, orange) running above, with an eye icon. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `ui_onboard_plan`
**Prompt:** Clean minimal flat vector illustration, thin navy outlines with blue #2f6bff accents, white fills, soft shadow, transparent background: an isometric office floor plan model seen from above with a rotate arrow. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `ui_onboard_lab`
**Prompt:** Clean minimal flat vector illustration, thin navy outlines with blue #2f6bff accents, white fills, soft shadow, transparent background: stacked puzzle-like code blocks connected to a small network topology diagram. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `ui_empty_lab`
**Prompt:** Flat vector illustration of empty puzzle blocks waiting to be stacked, dashed outline, navy and blue, transparent background, no text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `ui_offline`
**Prompt:** Flat vector illustration of a laptop with a small unplugged cable and a check mark showing it still works offline, navy/blue, transparent background, no text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `ui_mission_complete`
**Prompt:** Celebratory flat vector burst of confetti and soft rays in blue, sand and orange, centered empty area, transparent background, no text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `ui_paper_texture`
**Prompt:** Seamless very subtle off-white paper texture, fine fibers, almost flat, #fbfaf7.

**Negativo:** perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, text, watermark, logo, people, depth of field, blur, 3d render look

## Misiones

| ID | Archivo | Tamaño | Tile | Alfa | Prio | Dónde se usa |
|---|---|---|---|---|---|---|
| `mission_recorrido` | `missions/mission_recorrido.png` | 1200×675 |  |  | P1 | Ilustración de la misión "Primer día en el estudio" (tarjeta en Laboratorio › Misiones y tracker). Historia: Arrancás como técnico de soporte en Alvarez & Asoc. Lo primero: saber dónde está el corazón de la red. |
| `badge_recorrido` | `missions/badge_recorrido.png` | 512×512 |  | sí | P2 | Insignia al completar "Primer día en el estudio". |
| `mission_cable-pc03` | `missions/mission_cable-pc03.png` | 1200×675 |  |  | P2 | Ilustración de la misión "Seguí el cable de PC03" (tarjeta en Laboratorio › Misiones y tracker). Historia: Juan Manuel rotuló todas las bocas. Verificá que el código de la boca de PC03 coincide en la pared y en el rack. |
| `badge_cable-pc03` | `missions/badge_cable-pc03.png` | 512×512 |  | sí | P2 | Insignia al completar "Seguí el cable de PC03". |
| `mission_ping-nas` | `missions/mission_ping-nas.png` | 1200×675 |  |  | P2 | Ilustración de la misión "¿Llega PC03 al NAS?" (tarjeta en Laboratorio › Misiones y tracker). Historia: Una contadora del Box 2 dice que no sabe si llega a las carpetas compartidas. Probalo. |
| `badge_ping-nas` | `missions/badge_ping-nas.png` | 512×512 |  | sí | P2 | Insignia al completar "¿Llega PC03 al NAS?". |
| `mission_visitas` | `missions/mission_visitas.png` | 1200×675 |  |  | P2 | Ilustración de la misión "Visitas aisladas" (tarjeta en Laboratorio › Misiones y tracker). Historia: Llega un cliente y pide el Wi-Fi. El estudio maneja datos contables: comprobá que desde la red de visitas no se ve nada interno. |
| `badge_visitas` | `missions/badge_visitas.png` | 512×512 |  | sí | P2 | Insignia al completar "Visitas aisladas". |
| `mission_claro` | `missions/mission_claro.png` | 1200×675 |  |  | P2 | Ilustración de la misión "Se cayó Claro" (tarjeta en Laboratorio › Misiones y tracker). Historia: Claro tiene un corte en la zona. El estudio no puede quedarse sin internet en pleno vencimiento. |
| `badge_claro` | `missions/badge_claro.png` | 512×512 |  | sí | P2 | Insignia al completar "Se cayó Claro". |
| `mission_ticket-pc09` | `missions/mission_ticket-pc09.png` | 1200×675 |  |  | P1 | Ilustración de la misión ""PC09 no tiene red"" (tarjeta en Laboratorio › Misiones y tracker). Historia: Ticket de Escritorio 3: "desde ayer no abro las carpetas ni internet". Alguien tocó la configuración de SW2. |
| `badge_ticket-pc09` | `missions/badge_ticket-pc09.png` | 512×512 |  | sí | P2 | Insignia al completar ""PC09 no tiene red"". |
| `mission_corte-luz` | `missions/mission_corte-luz.png` | 1200×675 |  |  | P2 | Ilustración de la misión "Corte de luz" (tarjeta en Laboratorio › Misiones y tracker). Historia: Se corta la luz en todo el edificio. ¿Qué sigue funcionando gracias a las tres UPS? |
| `badge_corte-luz` | `missions/badge_corte-luz.png` | 512×512 |  | sí | P2 | Insignia al completar "Corte de luz". |
| `mission_backup` | `missions/mission_backup.png` | 1200×675 |  |  | P2 | Ilustración de la misión "Copia y restauración" (tarjeta en Laboratorio › Misiones y tracker). Historia: Gerencia borró sin querer el balance 2026. Tranquilos: para eso está el plan de copias. |
| `badge_backup` | `missions/badge_backup.png` | 512×512 |  | sí | P2 | Insignia al completar "Copia y restauración". |

### `mission_recorrido`
**Prompt:** Editorial flat illustration, modern and friendly, limited palette (navy #1b2a44, blue #2f6bff, sand #e8dcc8, white), soft grain, consistent series style: a new IT technician with a lanyard entering a bright office, looking toward an open server cabinet in a small technical room. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

**Notas:** Las 8 deben verse como una serie (mismo estilo, mismo personaje técnico).

### `badge_recorrido`
**Prompt:** Circular achievement badge, flat vector, navy ring with blue inner disc, a simple white glyph representing: a new IT technician with a lanyard entering a bright office, subtle shine, transparent background. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `mission_cable-pc03`
**Prompt:** Editorial flat illustration, modern and friendly, limited palette (navy #1b2a44, blue #2f6bff, sand #e8dcc8, white), soft grain, consistent series style: a blue network cable traced with a glowing line from a wall jack, up through the ceiling, to a patch panel. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

**Notas:** Las 8 deben verse como una serie (mismo estilo, mismo personaje técnico).

### `badge_cable-pc03`
**Prompt:** Circular achievement badge, flat vector, navy ring with blue inner disc, a simple white glyph representing: a blue network cable traced with a glowing line from a wall jack, subtle shine, transparent background. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `mission_ping-nas`
**Prompt:** Editorial flat illustration, modern and friendly, limited palette (navy #1b2a44, blue #2f6bff, sand #e8dcc8, white), soft grain, consistent series style: an accountant at a desk looking at shared folders on screen while small light packets travel to a file server. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

**Notas:** Las 8 deben verse como una serie (mismo estilo, mismo personaje técnico).

### `badge_ping-nas`
**Prompt:** Circular achievement badge, flat vector, navy ring with blue inner disc, a simple white glyph representing: an accountant at a desk looking at shared folders on screen while small light packets travel to a file server, subtle shine, transparent background. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `mission_visitas`
**Prompt:** Editorial flat illustration, modern and friendly, limited palette (navy #1b2a44, blue #2f6bff, sand #e8dcc8, white), soft grain, consistent series style: a visitor on a sofa with a phone connected to wifi, a translucent shield separating them from office folders. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

**Notas:** Las 8 deben verse como una serie (mismo estilo, mismo personaje técnico).

### `badge_visitas`
**Prompt:** Circular achievement badge, flat vector, navy ring with blue inner disc, a simple white glyph representing: a visitor on a sofa with a phone connected to wifi, subtle shine, transparent background. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `mission_claro`
**Prompt:** Editorial flat illustration, modern and friendly, limited palette (navy #1b2a44, blue #2f6bff, sand #e8dcc8, white), soft grain, consistent series style: two internet lines entering a router, one red and cut, the other green carrying traffic, calm office behind. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

**Notas:** Las 8 deben verse como una serie (mismo estilo, mismo personaje técnico).

### `badge_claro`
**Prompt:** Circular achievement badge, flat vector, navy ring with blue inner disc, a simple white glyph representing: two internet lines entering a router, subtle shine, transparent background. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `mission_ticket-pc09`
**Prompt:** Editorial flat illustration, modern and friendly, limited palette (navy #1b2a44, blue #2f6bff, sand #e8dcc8, white), soft grain, consistent series style: a support ticket card pinned next to a frustrated employee at a desk with a disconnected network icon. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

**Notas:** Las 8 deben verse como una serie (mismo estilo, mismo personaje técnico).

### `badge_ticket-pc09`
**Prompt:** Circular achievement badge, flat vector, navy ring with blue inner disc, a simple white glyph representing: a support ticket card pinned next to a frustrated employee at a desk with a disconnected network icon, subtle shine, transparent background. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `mission_corte-luz`
**Prompt:** Editorial flat illustration, modern and friendly, limited palette (navy #1b2a44, blue #2f6bff, sand #e8dcc8, white), soft grain, consistent series style: a dimmed office during a power outage, only a server cabinet and a desk phone still lit, a battery icon glowing. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

**Notas:** Las 8 deben verse como una serie (mismo estilo, mismo personaje técnico).

### `badge_corte-luz`
**Prompt:** Circular achievement badge, flat vector, navy ring with blue inner disc, a simple white glyph representing: a dimmed office during a power outage, subtle shine, transparent background. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `mission_backup`
**Prompt:** Editorial flat illustration, modern and friendly, limited palette (navy #1b2a44, blue #2f6bff, sand #e8dcc8, white), soft grain, consistent series style: a document being restored from a backup drive with a circular arrow, a relieved manager in the background. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

**Notas:** Las 8 deben verse como una serie (mismo estilo, mismo personaje técnico).

### `badge_backup`
**Prompt:** Circular achievement badge, flat vector, navy ring with blue inner disc, a simple white glyph representing: a document being restored from a backup drive with a circular arrow, subtle shine, transparent background. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

## Personajes

| ID | Archivo | Tamaño | Tile | Alfa | Prio | Dónde se usa |
|---|---|---|---|---|---|---|
| `npc_marta_recepcion` | `npcs/npc_marta_recepcion.png` | 512×512 |  |  | P2 | Avatar en tickets de misiones/toasts: Marta, recepcionista (PC01, TEL101). |
| `npc_ricardo_gerente` | `npcs/npc_ricardo_gerente.png` | 512×512 |  |  | P2 | Avatar en tickets de misiones/toasts: Ricardo Alvarez, gerente (PC06, TEL106). |
| `npc_lucia_box2` | `npcs/npc_lucia_box2.png` | 512×512 |  |  | P2 | Avatar en tickets de misiones/toasts: Lucía, contadora del Box 2 (PC03). |
| `npc_diego_escritorio3` | `npcs/npc_diego_escritorio3.png` | 512×512 |  |  | P2 | Avatar en tickets de misiones/toasts: Diego, administrativo del Escritorio 3 (PC09) — ticket. |
| `npc_sofia_sueldos` | `npcs/npc_sofia_sueldos.png` | 512×512 |  |  | P2 | Avatar en tickets de misiones/toasts: Sofía, liquidación de sueldos (Box 1). |
| `npc_tecnico_jugador` | `npcs/npc_tecnico_jugador.png` | 512×512 |  |  | P2 | Avatar en tickets de misiones/toasts: Vos: técnico de soporte (avatar del jugador). |
| `npc_cliente_visita` | `npcs/npc_cliente_visita.png` | 512×512 |  |  | P2 | Avatar en tickets de misiones/toasts: Cliente de visita (misión Visitas). |

### `npc_marta_recepcion`
**Prompt:** Portrait avatar, head and shoulders, consistent illustrated style for a set (semi-flat digital painting, soft lighting, light blue-grey circular background), Argentine office worker: a friendly woman in her 40s, short dark hair, warm smile, navy cardigan.

**Negativo:** text, watermark, distorted face, extra fingers, photo

**Notas:** Set coherente: mismo estilo y encuadre en todos.

### `npc_ricardo_gerente`
**Prompt:** Portrait avatar, head and shoulders, consistent illustrated style for a set (semi-flat digital painting, soft lighting, light blue-grey circular background), Argentine office worker: a man in his late 50s, grey hair and beard, light blue shirt, glasses, calm confident expression.

**Negativo:** text, watermark, distorted face, extra fingers, photo

**Notas:** Set coherente: mismo estilo y encuadre en todos.

### `npc_lucia_box2`
**Prompt:** Portrait avatar, head and shoulders, consistent illustrated style for a set (semi-flat digital painting, soft lighting, light blue-grey circular background), Argentine office worker: a woman in her 30s, long curly hair, white blouse, focused but kind.

**Negativo:** text, watermark, distorted face, extra fingers, photo

**Notas:** Set coherente: mismo estilo y encuadre en todos.

### `npc_diego_escritorio3`
**Prompt:** Portrait avatar, head and shoulders, consistent illustrated style for a set (semi-flat digital painting, soft lighting, light blue-grey circular background), Argentine office worker: a young man in his 20s, slightly frustrated expression, grey sweater, headphones around neck.

**Negativo:** text, watermark, distorted face, extra fingers, photo

**Notas:** Set coherente: mismo estilo y encuadre en todos.

### `npc_sofia_sueldos`
**Prompt:** Portrait avatar, head and shoulders, consistent illustrated style for a set (semi-flat digital painting, soft lighting, light blue-grey circular background), Argentine office worker: a woman in her 50s, straight grey bob haircut, patterned scarf, cheerful.

**Negativo:** text, watermark, distorted face, extra fingers, photo

**Notas:** Set coherente: mismo estilo y encuadre en todos.

### `npc_tecnico_jugador`
**Prompt:** Portrait avatar, head and shoulders, consistent illustrated style for a set (semi-flat digital painting, soft lighting, light blue-grey circular background), Argentine office worker: a gender-neutral young IT technician, short hair, dark polo shirt with a small blue logo, lanyard badge, holding a network cable tester.

**Negativo:** text, watermark, distorted face, extra fingers, photo

**Notas:** Set coherente: mismo estilo y encuadre en todos.

### `npc_cliente_visita`
**Prompt:** Portrait avatar, head and shoulders, consistent illustrated style for a set (semi-flat digital painting, soft lighting, light blue-grey circular background), Argentine office worker: a middle-aged client in a suit jacket holding a smartphone, polite smile.

**Negativo:** text, watermark, distorted face, extra fingers, photo

**Notas:** Set coherente: mismo estilo y encuadre en todos.

## Íconos

| ID | Archivo | Tamaño | Tile | Alfa | Prio | Dónde se usa |
|---|---|---|---|---|---|---|
| `pwa_icon_master` | `icons/pwa_icon_master.png` | 1024×1024 |  |  | P1 | Ícono de la PWA (se reduce a 512/192 y maskable). |
| `og_image` | `icons/og_image.jpg` | 1200×630 |  |  | P1 | Imagen al compartir el link en LinkedIn/WhatsApp. |

### `pwa_icon_master`
**Prompt:** App icon: rounded square, deep navy background #10203a, centered three ascending rounded blue bars (#60a5fa) with a thin orange fiber line underneath, flat, minimal, keep all elements inside the central 70% safe zone. No text.

**Negativo:** photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background

### `og_image`
**Prompt:** Bright architectural cutaway render of a modern small office floor seen from above at 40 degrees on a pure white studio background, glowing colored network cables across the ceiling, a server rack in a corner, empty space on the right third for a title.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion

**Notas:** Encima ponemos por código el título "Red de oficina en 3D · TP Redes 2026".

## GIF

| ID | Archivo | Tamaño | Tile | Alfa | Prio | Dónde se usa |
|---|---|---|---|---|---|---|
| `gif_frames_rj45_crimp` | `gif/rj45_crimp/frame_01..08.png` | 800×600 |  |  | P3 | GIF del minijuego T568B (cómo se crimpa un conector), 8 cuadros. |
| `gif_frames_office_daycycle` | `gif/office_daycycle/frame_01..06.png` | 1200×675 |  |  | P3 | GIF/fondo animado del modo presentación (mañana → tarde). |

### `gif_frames_rj45_crimp`
**Prompt:** Consistent sequence of 8 frames (same camera, same hands, same background) showing step by step: 1 stripping the Cat6 jacket, 2 untwisting pairs, 3 ordering wires in T568B order (white-orange, orange, white-green, blue, white-blue, green, white-brown, brown), 4 trimming, 5 inserting into RJ45 plug, 6 placing in crimper, 7 crimping, 8 finished cable. Clean macro product photo style on white.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion

**Notas:** Generar los 8 con la misma semilla/referencia. Lo convertimos a GIF/WebP con tools/make_gif.py. El orden de colores debe ser exacto.

### `gif_frames_office_daycycle`
**Prompt:** Six frames of the same office cutaway illustration with light changing from morning to sunset, identical composition.

**Negativo:** text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion

## Sonidos

| ID | Archivo | Tamaño | Tile | Alfa | Prio | Dónde se usa |
|---|---|---|---|---|---|---|
| `snd_ambient_office` | `sounds/snd_ambient_office.ogg` | — | sí |  | P3 | Opcional: reemplaza el sonido sintetizado. |
| `snd_rack_fan` | `sounds/snd_rack_fan.ogg` | — | sí |  | P3 | Opcional: reemplaza el sonido sintetizado. |
| `snd_footstep_tile` | `sounds/snd_footstep_tile.ogg` | — |  |  | P3 | Opcional: reemplaza el sonido sintetizado. |
| `snd_footstep_wood` | `sounds/snd_footstep_wood.ogg` | — |  |  | P3 | Opcional: reemplaza el sonido sintetizado. |
| `snd_door` | `sounds/snd_door.ogg` | — |  |  | P3 | Opcional: reemplaza el sonido sintetizado. |
| `snd_phone_ring` | `sounds/snd_phone_ring.ogg` | — |  |  | P3 | Opcional: reemplaza el sonido sintetizado. |
| `snd_printer` | `sounds/snd_printer.ogg` | — |  |  | P3 | Opcional: reemplaza el sonido sintetizado. |
| `snd_keyboard` | `sounds/snd_keyboard.ogg` | — | sí |  | P3 | Opcional: reemplaza el sonido sintetizado. |
| `snd_ui_click` | `sounds/snd_ui_click.ogg` | — |  |  | P3 | Opcional: reemplaza el sonido sintetizado. |
| `snd_mission_complete` | `sounds/snd_mission_complete.ogg` | — |  |  | P3 | Opcional: reemplaza el sonido sintetizado. |
| `snd_error` | `sounds/snd_error.ogg` | — |  |  | P3 | Opcional: reemplaza el sonido sintetizado. |

### `snd_ambient_office`
**Prompt:** Ambiente de oficina en loop (60 s): aire acondicionado suave, murmullo lejano, teclado esporádico, sin voces inteligibles.

**Negativo:** voces, música de fondo, clipping

**Notas:** Normalizar a -16 LUFS. Loops sin clic al cerrar.

### `snd_rack_fan`
**Prompt:** Zumbido de ventiladores de switch y rack en loop (20 s), constante, grave.

**Negativo:** voces, música de fondo, clipping

**Notas:** Normalizar a -16 LUFS. Loops sin clic al cerrar.

### `snd_footstep_tile`
**Prompt:** 6 pasos individuales con zapato sobre porcelanato (variaciones), secos, sin reverb.

**Negativo:** voces, música de fondo, clipping

**Notas:** Normalizar a -16 LUFS. Loops sin clic al cerrar.

### `snd_footstep_wood`
**Prompt:** 6 pasos sobre piso flotante de madera.

**Negativo:** voces, música de fondo, clipping

**Notas:** Normalizar a -16 LUFS. Loops sin clic al cerrar.

### `snd_door`
**Prompt:** Puerta de oficina: abrir y cerrar con picaporte.

**Negativo:** voces, música de fondo, clipping

**Notas:** Normalizar a -16 LUFS. Loops sin clic al cerrar.

### `snd_phone_ring`
**Prompt:** Timbre de teléfono IP de escritorio, doble tono moderno, 4 s.

**Negativo:** voces, música de fondo, clipping

**Notas:** Normalizar a -16 LUFS. Loops sin clic al cerrar.

### `snd_printer`
**Prompt:** Impresora láser imprimiendo una hoja, 6 s.

**Negativo:** voces, música de fondo, clipping

**Notas:** Normalizar a -16 LUFS. Loops sin clic al cerrar.

### `snd_keyboard`
**Prompt:** Tipeo en teclado de oficina, loop de 10 s.

**Negativo:** voces, música de fondo, clipping

**Notas:** Normalizar a -16 LUFS. Loops sin clic al cerrar.

### `snd_ui_click`
**Prompt:** Click de interfaz suave y corto.

**Negativo:** voces, música de fondo, clipping

**Notas:** Normalizar a -16 LUFS. Loops sin clic al cerrar.

### `snd_mission_complete`
**Prompt:** Jingle corto positivo (1,5 s), marimba y sintetizador suave.

**Negativo:** voces, música de fondo, clipping

**Notas:** Normalizar a -16 LUFS. Loops sin clic al cerrar.

### `snd_error`
**Prompt:** Aviso de error suave, dos notas descendentes.

**Negativo:** voces, música de fondo, clipping

**Notas:** Normalizar a -16 LUFS. Loops sin clic al cerrar.
