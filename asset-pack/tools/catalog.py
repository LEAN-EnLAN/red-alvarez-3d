# Fuente del catálogo de assets para generar con IA.
# Ejecutar: python3 asset-pack/tools/catalog.py  → escribe asset-pack/manifest.json y asset-pack/CATALOGO.md
# Regla de Tomi: NO se piden imágenes IA de los equipos de red (switches, router, patch panels,
# NAS, AP, teléfonos, racks, puertos). Esos quedan modelados a medida con medidas de datasheet.
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

STYLE_PHOTO = ("photorealistic, natural daylight, modern Argentine office in Rosario, clean and bright, "
               "neutral warm whites, light oak wood, subtle blue accents (#2f6bff)")
NEG_PHOTO = "text, letters, watermark, logo, signature, people, faces, blurry, low resolution, oversaturated, cartoon, CGI artifacts, fisheye distortion"
NEG_TEX = ("perspective, vanishing point, shadows, vignette, lighting gradient, hotspots, visible seams, objects, furniture, "
           "text, watermark, logo, people, depth of field, blur, 3d render look")
NEG_VECTOR = "photo, photorealistic, 3d, gradients mesh noise, text, watermark, signature, clutter, dark background"
NEG_TEXTY = "misspelled words, extra letters, gibberish text, watermark, signature, distorted letters, blurry"

S = []  # slots


def slot(id, path, w, h, use, prompt, pri='P2', fmt='png', tile=False, alpha=False, neg=None, notes='', cat=''):
    S.append(dict(id=id, cat=cat, path=path, w=w, h=h, format=fmt, tileable=tile, transparent=alpha,
                  use=use, priority=pri, prompt=prompt, negative=neg or (NEG_TEX if tile else NEG_PHOTO), notes=notes))


def tex(id, w, use, prompt, pri='P1', notes='', h=None):
    slot(id, f'textures/{id}.png', w, h or w, use,
         f"Seamless tileable texture, perfectly flat orthographic top-down scan, even diffuse lighting, no shadows, albedo only. {prompt}",
         pri, 'png', True, False, NEG_TEX, notes + ' Debe repetir sin costuras (probar 2×2). Solo color (albedo); normal/rugosidad se derivan por código.', 'Texturas')


# ════════════════════════ TEXTURAS (tileables) ════════════════════════
tex('floor_porcelain_60x60', 2048, 'Piso de Circulación, Recepción y Sala técnica. 1 repetición = 1,2 × 1,2 m.',
    'Large-format matte beige porcelain floor tiles, 2 × 2 tiles of 60 × 60 cm filling the frame exactly, very thin light grey grout lines (2 mm) on the tile edges, subtle travertine-like stone variation, warm beige #d9cbb3, like a modern Argentine office corridor.',
    notes='Igual a la referencia 1 de Tomi (pasillo beige).')
tex('floor_oak_laminate', 2048, 'Piso de Boxes 1-4, Área de escritorios, Sala de reunión. 1 repetición = 2 × 2 m.',
    'Light natural oak laminate flooring, planks 20 cm wide running vertically, staggered joints, fine straight grain, matte finish, color #c8a982, realistic subtle plank-to-plank tone variation.')
tex('floor_carpet_gerencia', 1024, 'Alfombra de Gerencia (debajo del escritorio y sillones). 1 repetición = 1 × 1 m.',
    'Low-pile commercial carpet tile, charcoal blue-grey #4a5361 with very fine heathered texture, modern corporate office.', 'P2')
tex('floor_vinyl_tech_room', 1024, 'Piso vinílico antiestático de Sala técnica (alternativa al porcelanato). 1 repetición = 1 × 1 m.',
    'Light grey antistatic vinyl floor with tiny darker conductive fleck pattern, technical server room floor, clean, #b9bec4.', 'P3')
tex('wall_paint_plaster', 1024, 'Todas las paredes interiores. 1 repetición = 2 × 2 m.',
    'Smooth interior wall painted in warm off-white latex paint #f1efea, extremely subtle roller texture, almost flat, eggshell finish.')
tex('wall_accent_wood_slats', 1024, 'Pared de acento detrás del logo en Recepción (2,9 m de ancho).',
    'Vertical light oak wood slat acoustic wall panel, slats 3 cm wide with 1 cm dark felt gaps, front orthographic view, even lighting.', 'P2')
tex('wall_accent_blue_fabric', 1024, 'Panel acústico de tela azul en Sala de reunión (pared sur).',
    'Acoustic fabric wall panel, muted navy blue #2b3a55 woven felt texture, fine weave.', 'P3')
tex('ceiling_tile_60x60', 1024, 'Cielorraso suspendido. 1 repetición = 1,2 × 1,2 m (2 × 2 placas).',
    'Suspended acoustic ceiling, 2 × 2 white mineral fiber tiles 60 × 60 cm with fine fissured texture, thin white metal T-grid between tiles, seen from directly below, flat even light.')
tex('desk_laminate_oak', 1024, 'Tapas de los 11 escritorios y mesa de reunión.',
    'Light oak melamine desk top surface, straight fine grain, satin finish, #cdb08a, no knots.')
tex('desk_laminate_white', 1024, 'Laterales y cajoneras de escritorios / mueble bajo de impresoras.',
    'Matte white melamine furniture surface with very subtle paper-like micro texture, #f3f2ee.', 'P2')
tex('fabric_chair_mesh', 512, 'Respaldo de las sillas de oficina (malla).',
    'Black ergonomic office chair mesh fabric, fine hexagonal weave, slightly see-through look, #1d1f23.', 'P2')
tex('fabric_sofa_grey', 1024, 'Tapizado del sofá y sillones de Recepción y Gerencia.',
    'Upholstery fabric, mid grey melange woven textile #8a8f96, soft natural fibers, tight weave.', 'P2')
tex('leather_black', 1024, 'Asientos de sillas de reunión.',
    'Black synthetic leather with fine natural grain, matte, #202226.', 'P3')
tex('metal_brushed_aluminium', 1024, 'Perfiles de tabiques vidriados, marcos de puertas, patas de escritorio.',
    'Brushed aluminium metal, fine horizontal brushing, anodized satin silver #b8bcc2.', 'P2')
tex('metal_powdercoat_black', 512, 'Gabinetes de rack R1/R2 y pedestales (solo la chapa, no los equipos).',
    'Black textured powder-coated steel, fine orange-peel texture, #1b1d21.', 'P2')
tex('concrete_slab', 1024, 'Losa de hormigón vista en modo Rayos X (sobre el cielorraso).',
    'Raw concrete ceiling slab underside, cast-in-place with faint formwork board marks, grey #6b7078, clean.', 'P2')
tex('pvc_duct_white', 512, 'Canaletas Kalop 60×40 y cajas de superficie.',
    'Glossy white rigid PVC plastic surface, very subtle injection-molded texture, #f6f6f3.', 'P3')
tex('door_wood_veneer', 1024, 'Hojas de puerta (0,8 × 2,05 m), tileable vertical.',
    'Light walnut wood veneer door surface, vertical straight grain, satin varnish, #a77b55.', 'P2', h=2048)
tex('cork_board', 512, 'Pizarra de corcho en Sala técnica.',
    'Natural cork board surface, fine granules, warm tan #b88a5a.', 'P3')
tex('whiteboard_surface', 1024, 'Superficie de pizarra blanca (sala de reunión) si no se usa la versión dibujada.',
    'Glossy white whiteboard surface with faint ghosting of erased marker smudges, light grey hints.', 'P3')

# ════════════════════════ VISTAS POR LAS VENTANAS ════════════════════════
slot('window_view_gerencia', 'views/window_view_gerencia.jpg', 3072, 1700,
     'Ventana norte de Gerencia (2,3 m × 1,27 m; x 0,7–3,0). Se ve desde adentro, a ~2 m.',
     f'View out of a second-floor office window in downtown Rosario, Argentina, midday, looking across a tree-lined street (jacarandá and plátano trees) to 1950s-1980s residential buildings with balconies and some modern glass towers, soft blue sky with light clouds, slightly overexposed bright exterior, no window frame visible, {STYLE_PHOTO}, 35mm lens, eye level.',
     'P1', 'jpg', notes='Sin marco de ventana: el marco lo dibuja la escena. Exterior un poco sobreexpuesto (look real de interior).', cat='Vistas')
slot('window_view_escritorios', 'views/window_view_escritorios.jpg', 4096, 1340,
     'Ventana norte del Área de escritorios (3,9 m × 1,27 m; x 10,7–14,6).',
     'Wide panoramic view from a second-floor office window in Rosario, Argentina, midday, city block with mixed old and modern buildings, street trees, distant view of the Paraná river and the cable-stayed Rosario-Victoria bridge on the horizon, bright daylight, slightly overexposed, no window frame, 28mm lens.',
     'P1', 'jpg', cat='Vistas')
slot('window_view_panorama_dusk', 'views/window_view_panorama_dusk.jpg', 4096, 1024,
     'Variante atardecer para el modo presentación (opcional).',
     'Same Rosario downtown panorama from a second-floor window at golden hour, warm sunset light, buildings lit warmly, Paraná river glowing, no frame.',
     'P3', 'jpg', cat='Vistas')

# ════════════════════════ PANTALLAS ════════════════════════
PCS = [
    ('pc01', 'PC01 · Recepción', 'a reception desk agenda app: today\'s client appointments list with times and names (fictional Spanish names), a small calendar of November 2026, and an incoming calls panel'),
    ('pc02', 'PC02 · Box 1', 'payroll software "Liquidación de sueldos": employee table with columns Legajo, Apellido y nombre, Básico, Antigüedad, Neto (ARS amounts like $1.250.000,00)'),
    ('pc03', 'PC03 · Box 2', 'VAT tax filing screen "Declaración jurada IVA - Noviembre 2026": débito fiscal / crédito fiscal summary cards and a table of invoices'),
    ('pc04', 'PC04 · Box 3', 'balance sheet editor "Balance general 2026": Activo / Pasivo / Patrimonio neto tree with ARS amounts'),
    ('pc05', 'PC05 · Box 4', 'electronic invoicing screen "Facturación": a draft "Factura B" with items, subtotal, IVA 21%, total in ARS'),
    ('pc06', 'PC06 · Gerencia', 'management dashboard: KPI cards (clientes activos, vencimientos de la semana, honorarios cobrados), a bar chart of monthly fees and a due-dates timeline'),
    ('pc07', 'PC07 · Escritorio 1', 'spreadsheet app with a bank reconciliation "Conciliación bancaria" table, green/red highlighted cells'),
    ('pc08', 'PC08 · Escritorio 2', 'client files manager "Legajos de clientes": list of company clients with CUIT-like fictional numbers and status chips'),
    ('pc09', 'PC09 · Escritorio 3', 'income tax worksheet "Ganancias 2026" with deductions table and a pie chart'),
    ('pc10', 'PC10 · Escritorio 4', 'accounts payable "Proveedores y pagos" table with due dates and an aging bar'),
    ('pc11', 'PC11 · Escritorio 5', 'email client with a list of messages from clients about due dates ("Vencimiento monotributo", "Envío de balance"), reading pane open'),
]
for pid, where, content in PCS:
    slot(f'screen_{pid}', f'screens/screen_{pid}.png', 1920, 1080, f'Monitor de {where} (24", se ve de cerca al inspeccionar).',
         f'Flat 2D UI screenshot of a fictional modern accounting desktop application in Spanish (Argentina), showing {content}. Clean light UI, white background, blue accent #2f6bff, Inter-like sans-serif font, crisp text, realistic data density. Keep the top 64 px as an empty light grey bar (the app overlays hostname and IP there). No real brand names or logos, no Windows/macOS chrome.',
         'P1' if pid in ('pc03', 'pc01', 'pc06') else 'P2', neg=NEG_TEXTY + ', photo of a monitor, perspective, bezel, real brand logos',
         notes='Pantalla plana (no foto de un monitor). Datos ficticios. Revisar ortografía.', cat='Pantallas')
slot('screen_wallpaper_default', 'screens/screen_wallpaper_default.png', 1920, 1080, 'Fondo de escritorio por defecto (PCs sin app abierta / modo bloqueo).',
     'Minimal desktop wallpaper, soft abstract flowing blue and white waves, very light, elegant, corporate, lots of empty space in the center.', 'P2', neg=NEG_VECTOR, cat='Pantallas')
slot('screen_lockscreen', 'screens/screen_lockscreen.png', 1920, 1080, 'Pantalla de bloqueo (corte de luz / PC apagada al volver).',
     'Lock screen with a blurred photo of the Paraná river at morning in Rosario, large clock "10:42" and date "viernes 20 de noviembre" in Spanish, minimal.', 'P3', neg=NEG_TEXTY, cat='Pantallas')
slot('screen_phone_lcd_idle', 'screens/screen_phone_lcd_idle.png', 528, 192, 'LCD de los teléfonos IP (fondo; el texto del interno lo dibuja la app).',
     'Monochrome backlit LCD screen texture, pale blue-green backlight, very subtle pixel grid, empty, evenly lit.', 'P2', neg=NEG_TEX, notes='Solo fondo del LCD: NO dibujar la carcasa del teléfono (regla de Tomi).', cat='Pantallas')
slot('screen_printer_panel', 'screens/screen_printer_panel.png', 800, 480, 'Panel táctil de las impresoras IMP01/IMP02 (son del cliente, modelo genérico).',
     'Small touchscreen UI of a generic office multifunction printer, Spanish labels "Copiar", "Escanear", "Imprimir", "Estado: Lista", simple icons, light theme.', 'P3', neg=NEG_TEXTY, cat='Pantallas')
slot('screen_tv_reunion', 'screens/screen_tv_reunion.png', 1920, 1080, 'Pantalla/proyección en Sala de reunión en reposo.',
     'Presentation title slide, white background, big headline "Alvarez & Asoc." and subtitle "Estudio contable · Reunión de equipo", small blue bar-chart isotype (three ascending rounded bars), minimal.', 'P2', neg=NEG_TEXTY, cat='Pantallas')

# ════════════════════════ PIZARRA / DOCUMENTOS DEL TP ════════════════════════
WB_TEXT = ('Title "Red del estudio" at top. Left: two cloud shapes labeled "CLARO 200 Mb/s" and "PERSONAL 300 Mb/s", arrows into a box "ER605". '
           'From ER605 an arrow down to box "SW1 · R1". A thick ORANGE line labeled "fibra 30 m · 1 Gb/s" from SW1 to box "SW2 · R2". '
           'Under SW1, small handwritten list: "PC01–PC06", "TEL 101–107", "NAS1 · PBX", "NAS2 · IMP01 · AP1". Under SW2: "PC07–PC11", "IMP02 · AP2". '
           'Bottom right corner: "VLAN 10/20/30/40/50/60".')
slot('whiteboard_network_sketch', 'art/whiteboard_network_sketch.png', 2400, 1200, 'Pizarra blanca en Sala de reunión, pared norte interior (2,0 × 1,0 m).',
     'Front orthographic photo of a clean office whiteboard filling the frame, hand-drawn with blue, black and orange dry-erase markers, neat engineer handwriting. Drawing: ' + WB_TEXT,
     'P1', neg=NEG_TEXTY + ', extra devices, additional arrows, perspective',
     notes='EXACTO al TP p.3: no agregar equipos ni flechas extra. Si la IA erra texto, generar whiteboard_blank y el texto lo dibujamos por código.', cat='TP')
slot('whiteboard_blank', 'art/whiteboard_blank.png', 2400, 1200, 'Respaldo de la pizarra (texto superpuesto por código).',
     'Front orthographic photo of an empty office whiteboard with aluminium frame and marker tray, faint erased marker ghosting, even light.', 'P1', neg=NEG_PHOTO + ', perspective', cat='TP')
slot('poster_floor_plan', 'art/poster_floor_plan.png', 1400, 1050, 'Cuadro "Plano de la oficina" en Recepción (opcional, podemos usar la p.2 del PDF).',
     'Elegant architectural blueprint style print of an office floor plan, navy lines on off-white paper, NO text, matching this layout: 16x12 m rectangle; top row from left: big room 4 m wide, two stacked small rooms, 1 m corridor, two stacked small rooms, big open room 6 m; middle 2 m corridor across; bottom row: room 6 m, room 6 m, room 4 m.',
     'P3', neg=NEG_TEXTY, notes='Mejor usar la página real del TP: queda como alternativa decorativa.', cat='TP')
slot('corkboard_tech_notes', 'art/corkboard_tech_notes.png', 1600, 1100, 'Pizarra de corcho en Sala técnica junto a R1.',
     'Cork board with pinned papers: a printed label sheet titled "Rotulado de bocas" with rows "R1-PP1-01 … R1-PP1-16", a sticky note "UPS: probar 10 min", a sticky note "Claro principal / Personal respaldo", a small paper "Contraseñas: en caja fuerte", pushpins, front orthographic.',
     'P2', neg=NEG_TEXTY, notes='Texto exacto. No mostrar contraseñas reales.', cat='TP')

# ════════════════════════ ARTE / CUADROS ════════════════════════
ART = [
    ('art_monumento_bandera', 'Gerencia, pared oeste (1,0 × 0,7 m).', 'Fine art photograph of the Monumento Nacional a la Bandera in Rosario, Argentina at blue hour, symmetrical composition, long exposure, calm Paraná sky', 'P1'),
    ('art_puente_rosario_victoria', 'Recepción, pared oeste (1,2 × 0,6 m).', 'Fine art panoramic photograph of the Rosario-Victoria cable-stayed bridge over the Paraná river at sunrise, mist over wetlands, minimal', 'P1'),
    ('art_rio_parana', 'Sala de reunión, pared este (1,2 × 0,8 m).', 'Fine art aerial photograph of the Paraná river islands and delta near Rosario, abstract meandering water patterns, muted greens and browns', 'P2'),
    ('art_parque_independencia', 'Circulación, pared sur (0,8 × 0,6 m).', 'Photograph of Parque de la Independencia in Rosario, tree-lined path in autumn, warm light, calm', 'P3'),
    ('art_abstract_blue_1', 'Box 1-4 (cuadro chico, uno por box).', 'Minimal abstract painting, soft blue and sand color fields, textured canvas, Scandinavian corporate art', 'P2'),
    ('art_abstract_blue_2', 'Área de escritorios, pared este.', 'Minimal abstract line art, single continuous navy line forming gentle waves on cream paper', 'P2'),
    ('art_abstract_warm', 'Gerencia, pared este.', 'Minimal abstract painting with terracotta, beige and white overlapping arches, textured paper', 'P3'),
    ('art_numbers_print', 'Box de contadores (humor de oficina).', 'Typographic art print "Debe = Haber" in elegant serif letters, black on cream paper, minimal, centered', 'P3'),
]
for id, where, p, pri in ART:
    slot(id, f'art/{id}.jpg', 1600, 1100, f'Cuadro enmarcado · {where}', p + ', no frame (the frame is 3D), no text.', pri, 'jpg',
         neg=NEG_PHOTO if id != 'art_numbers_print' else NEG_TEXTY, cat='Arte')
slot('art_diploma', 'art/art_diploma.png', 1100, 1400, 'Diploma enmarcado en Gerencia (detrás del escritorio).',
     'Formal diploma certificate on ivory paper with an ornamental border and a gold seal, Spanish text "Contador Público" and a fictional name "Ricardo Alvarez", NO real university name, NO real logos.', 'P3', neg=NEG_TEXTY, cat='Arte')
slot('art_team_photo', 'art/art_team_photo.jpg', 1600, 1100, 'Foto del equipo en Recepción (opcional).',
     'Friendly group photo of a small Argentine accounting firm team of six adults of diverse ages in smart casual clothes, standing in a bright office, natural smiles, shallow depth of field.', 'P3', 'jpg',
     neg='text, watermark, distorted faces, extra fingers, blurry', cat='Arte')

# ════════════════════════ MARCA ════════════════════════
LOGO = 'isotype of three ascending rounded vertical bars in royal blue #2f6bff (like a growing chart), simple flat vector'
slot('logo_isotype', 'branding/logo_isotype.png', 1024, 1024, 'Isotipo: HUD, favicon, taza, felpudo, carga.',
     f'Logo {LOGO}, centered, transparent background, no text.', 'P1', alpha=True, neg=NEG_VECTOR, cat='Marca')
slot('logo_wordmark_dark', 'branding/logo_wordmark_dark.png', 2400, 700, 'Logo sobre fondos claros (pared de Recepción, papelería).',
     f'Horizontal company logo: {LOGO} on the left, a thin vertical divider, then the wordmark "Alvarez & Asoc." in a modern geometric sans-serif, dark navy #1f2937, and below it smaller letter-spaced "ESTUDIO CONTABLE" in grey. Transparent background.',
     'P1', alpha=True, neg=NEG_TEXTY, notes='Texto exacto: "Alvarez & Asoc." (sin tilde en Alvarez) y "ESTUDIO CONTABLE".', cat='Marca')
slot('logo_wordmark_light', 'branding/logo_wordmark_light.png', 2400, 700, 'Logo sobre fondos oscuros (pantalla de carga, UI).',
     f'Same horizontal logo as the dark version but wordmark in white #ffffff and subtitle in light grey, isotype in light blue #60a5fa. Transparent background.',
     'P1', alpha=True, neg=NEG_TEXTY, cat='Marca')
slot('logo_wall_3d_letters', 'branding/logo_wall_3d_letters.png', 2400, 800, 'Referencia/alternativa: letras corpóreas del logo en la pared de Recepción.',
     'Photo of brushed metal 3D corporate letters "Alvarez & Asoc." mounted on a light oak slat wall with soft shadow, front view, photoreal.', 'P3', neg=NEG_TEXTY, cat='Marca')
slot('mug_logo', 'branding/mug_logo.png', 1024, 512, 'Textura envolvente de las tazas sobre escritorios.',
     'Flat print design for a coffee mug wrap: white background, small blue three-bar isotype and "Alvarez & Asoc." on the right half, plenty of white space.', 'P3', neg=NEG_TEXTY, cat='Marca')
slot('doormat_logo', 'branding/doormat_logo.png', 1600, 1000, 'Felpudo en la entrada (frente, 1,2 × 0,75 m).',
     'Top-down orthographic photo of a dark grey coir entrance doormat with a subtle embossed blue three-bar logo and the word "Bienvenidos", even light.', 'P3', neg=NEG_TEXTY, cat='Marca')
slot('business_cards', 'branding/business_cards.png', 1200, 800, 'Tarjetero sobre el escritorio de Recepción.',
     'Top-down photo of a small stack of white business cards with a blue three-bar isotype and "Alvarez & Asoc. · Estudio contable · Rosario", minimal.', 'P3', neg=NEG_TEXTY, cat='Marca')

# ════════════════════════ CARTELERÍA ════════════════════════
ROOMS = ['Gerencia', 'Box 1', 'Box 2', 'Box 3', 'Box 4', 'Área de escritorios', 'Recepción', 'Sala de reunión', 'Sala técnica']
for r in ROOMS:
    rid = r.lower().replace(' ', '_').replace('á', 'a').replace('é', 'e').replace('ó', 'o').replace('í', 'i').replace('ú', 'u')
    slot(f'sign_room_{rid}', f'signs/sign_room_{rid}.png', 1024, 256, f'Placa de puerta de "{r}" (0,62 × 0,15 m, al costado de la puerta, a 1,6 m).',
         f'Flat front view of a minimal office door sign plate, brushed aluminium with a dark navy #243447 face, white text "{r.upper()}" in a clean geometric sans-serif, small blue three-bar icon at left, rounded corners, transparent background around the plate.',
         'P2', alpha=True, neg=NEG_TEXTY, notes=f'Texto exacto "{r.upper()}" (con tilde si corresponde).', cat='Cartelería')
SIGNS = [
    ('sign_matafuego', 'Junto a cada matafuego (Recepción, Sala técnica).', 'Argentine IRAM style fire safety sign: red square with white fire extinguisher pictogram and white text "MATAFUEGO" underneath', 'P1'),
    ('sign_salida', 'Sobre la puerta de entrada (cara interior).', 'Green emergency exit sign, white running man pictogram, arrow, white text "SALIDA", photoluminescent style', 'P1'),
    ('sign_riesgo_electrico', 'Puerta de Sala técnica y frente de R1.', 'Yellow warning triangle with black lightning bolt, black text "RIESGO ELÉCTRICO" below, Argentine IRAM 10005 style', 'P1'),
    ('sign_acceso_restringido', 'Puerta de Sala técnica.', 'Blue mandatory-style sign "SALA TÉCNICA · ACCESO RESTRINGIDO" with a small key pictogram, white text', 'P2'),
    ('sign_prohibido_fumar', 'Circulación.', 'Prohibition sign: red circle with diagonal bar over a cigarette, text "PROHIBIDO FUMAR"', 'P3'),
    ('sign_wifi_visitas', 'Mostrador de Recepción (atril A5).', 'Small elegant table sign "Wi-Fi para visitas" with a wifi icon and the line "Red separada · pedí la clave en recepción", blue accent, no QR code, no password', 'P2'),
    ('sign_baños', 'Circulación (flecha hacia fuera del plano).', 'Minimal wayfinding sign with restroom pictograms and an arrow, text "Baños", navy and white', 'P3'),
    ('sign_rack_r1', 'Puerta de vidrio de R1.', 'Small engraved label plate "R1 · GABINETE PRINCIPAL" white text on black', 'P3'),
    ('sign_rack_r2', 'Puerta de vidrio de R2.', 'Small engraved label plate "R2 · ESCRITORIOS" white text on black', 'P3'),
    ('sign_ups', 'Junto a cada UPS.', 'Small yellow label "UPS · NO DESCONECTAR" black text', 'P3'),
]
for id, where, p, pri in SIGNS:
    slot(id, f'signs/{id}.png', 1024, 1024, f'Señal · {where}', f'Flat vector safety/wayfinding sign, front orthographic: {p}. Transparent background around the sign.',
         pri, alpha=True, neg=NEG_TEXTY, notes='Respetar mayúsculas y tildes del texto.', cat='Cartelería')

# ════════════════════════ OBJETOS DE ESCRITORIO (decals) ════════════════════════
PROPS = [
    ('decal_invoice_factura_b', 'Hoja sobre escritorios de Boxes (A4, vista superior).', 'Top-down flat scan of an A4 fictional Argentine invoice "FACTURA B" with a header box, item table, IVA line and total in ARS, slightly crumpled paper texture', 'P2'),
    ('decal_spreadsheet_printout', 'Hojas sobre escritorios del Área de escritorios.', 'Top-down flat scan of an A4 spreadsheet printout with numeric columns and a few yellow highlighter marks, Spanish headers', 'P2'),
    ('decal_balance_report', 'Escritorio de Gerencia.', 'Top-down flat scan of an A4 report cover "Balance 2026 · Borrador" with a simple bar chart, blue accents', 'P3'),
    ('decal_sticky_notes', 'Monitores y escritorios (varios).', 'Set of 6 square sticky notes (yellow, pink, blue, green) laid out in a grid, each with short Spanish handwritten notes: "llamar al cliente", "vence IVA 18/11", "backup ✓", "reunión 15hs", "pedir tóner", "IP 10.10.20.103", transparent background between notes', 'P2'),
    ('decal_desk_calendar', 'Calendario de escritorio (Recepción, Gerencia).', 'Front view of a desk calendar page "NOVIEMBRE 2026" in Spanish with weekdays L M M J V S D, correct dates (November 1, 2026 is a Sunday), a few dates circled in red', 'P2'),
    ('decal_wall_calendar', 'Calendario de pared en Circulación.', 'Wall calendar "Noviembre 2026" in Spanish, photo of Rosario river at top, grid below with correct dates (1 Nov 2026 = Sunday)', 'P3'),
    ('decal_binder_spines', 'Lomos de biblioratos en estanterías (Gerencia, Escritorios).', 'Front orthographic view of 10 office binder spines side by side, alternating navy, grey and white, white labels with handwritten Spanish titles: "IVA 2026", "Sueldos", "Ganancias", "Balances", "Clientes A-M", "Clientes N-Z", "Proveedores", "Bancos", "Monotributo", "Varios"', 'P1'),
    ('decal_keyboard_top', 'No usar (el teclado es 3D).', '—', None),
]
for id, where, p, pri in PROPS:
    if pri is None: continue
    slot(id, f'props/{id}.png', 1600 if 'binder' in id else 1240, 1100 if 'binder' in id else 1754 if ('invoice' in id or 'printout' in id or 'report' in id) else 1240,
         f'Objeto · {where}', p + '.', pri, alpha='sticky' in id, neg=NEG_TEXTY, notes='Contenido ficticio, sin datos reales.', cat='Objetos')
slot('decal_coffee_top', 'props/decal_coffee_top.png', 512, 512, 'Café visto desde arriba dentro de las tazas.',
     'Top-down macro of black coffee surface in a white mug with light crema, circular, transparent outside the mug rim.', 'P3', alpha=True, cat='Objetos')
slot('decal_paper_stack', 'props/decal_paper_stack.png', 1240, 1754, 'Pila de papeles (lado superior).',
     'Top-down photo of a neat stack of white A4 papers with a black binder clip, plain, no readable text.', 'P3', cat='Objetos')

# ════════════════════════ UI / PANTALLAS DE LA APP ════════════════════════
slot('ui_loader_keyart', 'ui/ui_loader_keyart.jpg', 2560, 1440, 'Fondo de la pantalla de carga/inicio (detrás del título y del minijuego).',
     'Bright architectural cutaway render of a small modern office floor seen from above at 35 degrees, roof removed, white walls, light oak floors, desks with monitors, glowing colored network cables (blue, green, orange fiber) running across the ceiling to a small server rack, soft white studio background, lots of negative space on the left third for a title, high-end architectural visualization.',
     'P1', 'jpg', neg=NEG_PHOTO + ', dark background, neon, cyberpunk', notes='Dejar el tercio izquierdo limpio para el título. Fondo claro (pedido del usuario: entorno blanco).', cat='UI')
slot('ui_studio_backdrop', 'ui/ui_studio_backdrop.jpg', 4096, 2048, 'Fondo del modo maqueta/plano (equirectangular 2:1, alrededor del edificio).',
     'Equirectangular 360 panorama of an infinite seamless white photo studio cyclorama, very soft even light, faint warm-grey gradient toward the floor, no objects, no seams.',
     'P1', 'jpg', neg='objects, seams, lamps, people, text, dark', notes='Debe cerrar en los bordes izq/der (360°). Se usa como skybox claro + reflejos.', cat='UI')
slot('ui_studio_floor', 'ui/ui_studio_floor.jpg', 2048, 2048, 'Piso del estudio alrededor de la maqueta (fade radial).',
     'Top-down seamless very light grey matte studio floor, subtle micro texture, soft radial vignette fading to white at the edges.', 'P2', 'jpg', cat='UI')
CONTROLS = [
    ('ui_onboard_keyboard', 'Ayuda/onboarding desktop: teclas WASD + Shift + E.', 'keyboard keys W A S D grouped, a wider Shift key and an E key highlighted in blue, with small motion arrows'),
    ('ui_onboard_mouse', 'Ayuda desktop: mover el mouse para mirar.', 'a computer mouse with curved arrows around it indicating looking around'),
    ('ui_onboard_touch', 'Ayuda celular: joystick izquierdo + arrastrar a la derecha.', 'a smartphone held horizontally, left thumb on a virtual joystick circle, right thumb swiping, with motion arrows'),
    ('ui_onboard_inspect', 'Ayuda: inspeccionar con E / tocar.', 'a hand cursor pointing at a computer tower with a small info card popping out'),
    ('ui_onboard_xray', 'Ayuda: modo Rayos X.', 'a ceiling cut-away showing colorful cables (blue, green, yellow, orange) running above, with an eye icon'),
    ('ui_onboard_plan', 'Ayuda: vista plano.', 'an isometric office floor plan model seen from above with a rotate arrow'),
    ('ui_onboard_lab', 'Ayuda: laboratorio.', 'stacked puzzle-like code blocks connected to a small network topology diagram'),
]
for id, where, p in CONTROLS:
    slot(id, f'ui/{id}.png', 800, 600, where, f'Clean minimal flat vector illustration, thin navy outlines with blue #2f6bff accents, white fills, soft shadow, transparent background: {p}. No text.',
         'P2', alpha=True, neg=NEG_VECTOR, cat='UI')

MISSIONS = [
    ('recorrido', 'Primer día en el estudio', 'Arrancás como técnico de soporte en Alvarez & Asoc. Lo primero: saber dónde está el corazón de la red.', 'a new IT technician with a lanyard entering a bright office, looking toward an open server cabinet in a small technical room'),
    ('cable-pc03', 'Seguí el cable de PC03', 'Juan Manuel rotuló todas las bocas. Verificá que el código de la boca de PC03 coincide en la pared y en el rack.', 'a blue network cable traced with a glowing line from a wall jack, up through the ceiling, to a patch panel'),
    ('ping-nas', '¿Llega PC03 al NAS?', 'Una contadora del Box 2 dice que no sabe si llega a las carpetas compartidas. Probalo.', 'an accountant at a desk looking at shared folders on screen while small light packets travel to a file server'),
    ('visitas', 'Visitas aisladas', 'Llega un cliente y pide el Wi-Fi. El estudio maneja datos contables: comprobá que desde la red de visitas no se ve nada interno.', 'a visitor on a sofa with a phone connected to wifi, a translucent shield separating them from office folders'),
    ('claro', 'Se cayó Claro', 'Claro tiene un corte en la zona. El estudio no puede quedarse sin internet en pleno vencimiento.', 'two internet lines entering a router, one red and cut, the other green carrying traffic, calm office behind'),
    ('ticket-pc09', '"PC09 no tiene red"', 'Ticket de Escritorio 3: "desde ayer no abro las carpetas ni internet". Alguien tocó la configuración de SW2.', 'a support ticket card pinned next to a frustrated employee at a desk with a disconnected network icon'),
    ('corte-luz', 'Corte de luz', 'Se corta la luz en todo el edificio. ¿Qué sigue funcionando gracias a las tres UPS?', 'a dimmed office during a power outage, only a server cabinet and a desk phone still lit, a battery icon glowing'),
    ('backup', 'Copia y restauración', 'Gerencia borró sin querer el balance 2026. Tranquilos: para eso está el plan de copias.', 'a document being restored from a backup drive with a circular arrow, a relieved manager in the background'),
]
for mid, title, story, scene in MISSIONS:
    slot(f'mission_{mid}', f'missions/mission_{mid}.png', 1200, 675, f'Ilustración de la misión "{title}" (tarjeta en Laboratorio › Misiones y tracker). Historia: {story}',
         f'Editorial flat illustration, modern and friendly, limited palette (navy #1b2a44, blue #2f6bff, sand #e8dcc8, white), soft grain, consistent series style: {scene}. No text.',
         'P1' if mid in ('recorrido', 'ticket-pc09') else 'P2', neg=NEG_VECTOR, notes='Las 8 deben verse como una serie (mismo estilo, mismo personaje técnico).', cat='Misiones')
    slot(f'badge_{mid}', f'missions/badge_{mid}.png', 512, 512, f'Insignia al completar "{title}".',
         f'Circular achievement badge, flat vector, navy ring with blue inner disc, a simple white glyph representing: {scene.split(",")[0]}, subtle shine, transparent background. No text.',
         'P2', alpha=True, neg=NEG_VECTOR, cat='Misiones')

NPCS = [
    ('npc_marta_recepcion', 'Marta, recepcionista (PC01, TEL101)', 'a friendly woman in her 40s, short dark hair, warm smile, navy cardigan'),
    ('npc_ricardo_gerente', 'Ricardo Alvarez, gerente (PC06, TEL106)', 'a man in his late 50s, grey hair and beard, light blue shirt, glasses, calm confident expression'),
    ('npc_lucia_box2', 'Lucía, contadora del Box 2 (PC03)', 'a woman in her 30s, long curly hair, white blouse, focused but kind'),
    ('npc_diego_escritorio3', 'Diego, administrativo del Escritorio 3 (PC09) — ticket', 'a young man in his 20s, slightly frustrated expression, grey sweater, headphones around neck'),
    ('npc_sofia_sueldos', 'Sofía, liquidación de sueldos (Box 1)', 'a woman in her 50s, straight grey bob haircut, patterned scarf, cheerful'),
    ('npc_tecnico_jugador', 'Vos: técnico de soporte (avatar del jugador)', 'a gender-neutral young IT technician, short hair, dark polo shirt with a small blue logo, lanyard badge, holding a network cable tester'),
    ('npc_cliente_visita', 'Cliente de visita (misión Visitas)', 'a middle-aged client in a suit jacket holding a smartphone, polite smile'),
]
for id, who, desc in NPCS:
    slot(id, f'npcs/{id}.png', 512, 512, f'Avatar en tickets de misiones/toasts: {who}.',
         f'Portrait avatar, head and shoulders, consistent illustrated style for a set (semi-flat digital painting, soft lighting, light blue-grey circular background), Argentine office worker: {desc}.',
         'P2', alpha=False, neg='text, watermark, distorted face, extra fingers, photo', notes='Set coherente: mismo estilo y encuadre en todos.', cat='Personajes')

slot('pwa_icon_master', 'icons/pwa_icon_master.png', 1024, 1024, 'Ícono de la PWA (se reduce a 512/192 y maskable).',
     'App icon: rounded square, deep navy background #10203a, centered three ascending rounded blue bars (#60a5fa) with a thin orange fiber line underneath, flat, minimal, keep all elements inside the central 70% safe zone. No text.',
     'P1', neg=NEG_VECTOR, cat='Íconos')
slot('og_image', 'icons/og_image.jpg', 1200, 630, 'Imagen al compartir el link en LinkedIn/WhatsApp.',
     'Bright architectural cutaway render of a modern small office floor seen from above at 40 degrees on a pure white studio background, glowing colored network cables across the ceiling, a server rack in a corner, empty space on the right third for a title.',
     'P1', 'jpg', notes='Encima ponemos por código el título "Red de oficina en 3D · TP Redes 2026".', cat='Íconos')
slot('ui_empty_lab', 'ui/ui_empty_lab.png', 800, 600, 'Estado vacío del editor de bloques.',
     'Flat vector illustration of empty puzzle blocks waiting to be stacked, dashed outline, navy and blue, transparent background, no text.', 'P3', alpha=True, neg=NEG_VECTOR, cat='UI')
slot('ui_offline', 'ui/ui_offline.png', 800, 600, 'Aviso "sin conexión" (la app sigue funcionando offline).',
     'Flat vector illustration of a laptop with a small unplugged cable and a check mark showing it still works offline, navy/blue, transparent background, no text.', 'P3', alpha=True, neg=NEG_VECTOR, cat='UI')
slot('ui_mission_complete', 'ui/ui_mission_complete.png', 1200, 800, 'Fondo del cartel "Misión completada".',
     'Celebratory flat vector burst of confetti and soft rays in blue, sand and orange, centered empty area, transparent background, no text.', 'P2', alpha=True, neg=NEG_VECTOR, cat='UI')
slot('ui_paper_texture', 'ui/ui_paper_texture.png', 1024, 1024, 'Textura sutil de papel para paneles de la UI clara (presentación).',
     'Seamless very subtle off-white paper texture, fine fibers, almost flat, #fbfaf7.', 'P3', tile=True, cat='UI')

# ════════════════════════ GIFs (frames) ════════════════════════
slot('gif_frames_rj45_crimp', 'gif/rj45_crimp/frame_01..08.png', 800, 600, 'GIF del minijuego T568B (cómo se crimpa un conector), 8 cuadros.',
     'Consistent sequence of 8 frames (same camera, same hands, same background) showing step by step: 1 stripping the Cat6 jacket, 2 untwisting pairs, 3 ordering wires in T568B order (white-orange, orange, white-green, blue, white-blue, green, white-brown, brown), 4 trimming, 5 inserting into RJ45 plug, 6 placing in crimper, 7 crimping, 8 finished cable. Clean macro product photo style on white.',
     'P3', notes='Generar los 8 con la misma semilla/referencia. Lo convertimos a GIF/WebP con tools/make_gif.py. El orden de colores debe ser exacto.', cat='GIF')
slot('gif_frames_office_daycycle', 'gif/office_daycycle/frame_01..06.png', 1200, 675, 'GIF/fondo animado del modo presentación (mañana → tarde).',
     'Six frames of the same office cutaway illustration with light changing from morning to sunset, identical composition.', 'P3', cat='GIF')

# ════════════════════════ SONIDOS (opcionales; la app ya los sintetiza) ════════════════════════
SOUNDS = [
    ('snd_ambient_office', 'Ambiente de oficina en loop (60 s): aire acondicionado suave, murmullo lejano, teclado esporádico, sin voces inteligibles.'),
    ('snd_rack_fan', 'Zumbido de ventiladores de switch y rack en loop (20 s), constante, grave.'),
    ('snd_footstep_tile', '6 pasos individuales con zapato sobre porcelanato (variaciones), secos, sin reverb.'),
    ('snd_footstep_wood', '6 pasos sobre piso flotante de madera.'),
    ('snd_door', 'Puerta de oficina: abrir y cerrar con picaporte.'),
    ('snd_phone_ring', 'Timbre de teléfono IP de escritorio, doble tono moderno, 4 s.'),
    ('snd_printer', 'Impresora láser imprimiendo una hoja, 6 s.'),
    ('snd_keyboard', 'Tipeo en teclado de oficina, loop de 10 s.'),
    ('snd_ui_click', 'Click de interfaz suave y corto.'),
    ('snd_mission_complete', 'Jingle corto positivo (1,5 s), marimba y sintetizador suave.'),
    ('snd_error', 'Aviso de error suave, dos notas descendentes.'),
]
for id, p in SOUNDS:
    S.append(dict(id=id, cat='Sonidos', path=f'sounds/{id}.ogg', w=0, h=0, format='ogg (48 kHz) o wav', tileable=id in ('snd_ambient_office', 'snd_rack_fan', 'snd_keyboard'),
                  transparent=False, use='Opcional: reemplaza el sonido sintetizado.', priority='P3', prompt=p, negative='voces, música de fondo, clipping', notes='Normalizar a -16 LUFS. Loops sin clic al cerrar.'))

# ═══════════════════════════════════════════════════════════
if __name__ == '__main__':
    ids = [s['id'] for s in S]
    assert len(ids) == len(set(ids)), 'ids duplicados'
    with open(os.path.join(ROOT, 'manifest.json'), 'w') as f:
        json.dump({'version': 1, 'project': 'Red Alvarez 3D · TP Redes 2026', 'slots': S}, f, ensure_ascii=False, indent=1)
    cats = []
    for s in S:
        if s['cat'] not in cats: cats.append(s['cat'])
    out = ['# Catálogo de assets para generar con IA', '',
           f'Total: **{len(S)} slots** · P1: {sum(s["priority"]=="P1" for s in S)} · P2: {sum(s["priority"]=="P2" for s in S)} · P3: {sum(s["priority"]=="P3" for s in S)}', '',
           'P1 = imprescindible · P2 = suma mucho · P3 = extra. Los prompts están en inglés (funcionan mejor). Guardá cada archivo con **la ruta exacta** de la columna "Archivo".', '']
    for c in cats:
        out += [f'## {c}', '', '| ID | Archivo | Tamaño | Tile | Alfa | Prio | Dónde se usa |', '|---|---|---|---|---|---|---|']
        for s in [x for x in S if x['cat'] == c]:
            size = f"{s['w']}×{s['h']}" if s['w'] else '—'
            out.append(f"| `{s['id']}` | `{s['path']}` | {size} | {'sí' if s['tileable'] else ''} | {'sí' if s['transparent'] else ''} | {s['priority']} | {s['use']} |")
        out.append('')
        for s in [x for x in S if x['cat'] == c]:
            out += [f"### `{s['id']}`", f"**Prompt:** {s['prompt']}", '', f"**Negativo:** {s['negative']}", '']
            if s['notes']: out += [f"**Notas:** {s['notes']}", '']
    with open(os.path.join(ROOT, 'CATALOGO.md'), 'w') as f:
        f.write('\n'.join(out))
    print(len(S), 'slots')
