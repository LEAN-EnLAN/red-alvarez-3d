# Pack de assets para generar con IA · Red Alvarez 3D

Este pack lista **todas** las imágenes que la app puede usar, con el prompt exacto, el tamaño y dónde aparece cada una. Las generás vos con IA, me las devolvés en un zip con **los mismos nombres y carpetas**, y se activan solas en la app (sin tocar código por cada imagen).

- `CATALOGO.md`: tabla legible por categoría + prompt y negativo de cada slot.
- `manifest.json`: lo mismo en formato máquina (lo usa `tools/register-gen.mjs`).
- `refs/`: capturas de la app actual y un plano marcado que muestran **dónde** va cada cosa.
- `tools/make_gif.py`: convierte cuadros (o una sola imagen) en GIF/WebP animado.

## La regla de Tomi (importante)

**No generar con IA ningún equipo de red**: switches, router, patch panels, NAS, access points, teléfonos IP, racks, puertos ni cables. Esos están modelados a medida con medidas de datasheet y con cada cable en su puerto real, y una imagen IA los "alucinaría". La IA es para todo lo demás: texturas, pantallas, cuadros, cartelería, marca, ilustraciones, personajes, vistas por las ventanas e íconos.

## Herramientas recomendadas

| Tipo | Herramienta sugerida |
|---|---|
| Texturas tileables | Midjourney (`--tile`), Flux, Stable Diffusion con "tiling" activado |
| Fotos (vistas, cuadros, key art) | Midjourney v7, Flux 1.1 Pro, GPT-image |
| Con texto (carteles, logo, pantallas, pizarra) | **Ideogram** o GPT-image; revisar ortografía y tildes letra por letra |
| Ilustraciones de misiones, insignias, onboarding | Midjourney / GPT-image con `--sref` o la misma imagen de referencia para que salgan como serie |
| Avatares | Mismo modelo y misma referencia de estilo para todo el set |

## Guía de estilo global

- **Ambiente**: oficina moderna y luminosa de un estudio contable en el centro de **Rosario, Argentina**. Luz natural de día, blancos cálidos, roble claro, acentos azules `#2f6bff`. El usuario pidió que el entorno se vea **claro/blanco**, nada de fondos oscuros.
- **Marca**: "Alvarez & Asoc." (sin tilde) + "Estudio contable". Isotipo: tres barras redondeadas ascendentes en azul.
- **Fotos y texturas**: fotorrealistas, sin texto ni logos reales, sin personas (salvo donde se piden).
- **Ilustraciones de UI**: vector plano limpio, paleta navy `#1b2a44`, azul `#2f6bff`, arena `#e8dcc8` y blanco, sin texto.
- **Idioma**: todo texto visible en español rioplatense; los prompts quedan en inglés porque los modelos rinden mejor.
- **Datos**: siempre ficticios (nombres, CUIT, montos). Nada de marcas reales en pantallas.

## Reglas de archivo

1. **Nombre y carpeta exactos** del campo "Archivo" (por ejemplo `textures/floor_porcelain_60x60.png`).
2. **Tamaño**: el indicado o mayor con la misma proporción (se reduce automáticamente).
3. **Formato**: PNG si dice "Alfa: sí" (fondo transparente real, no un damero dibujado); JPG calidad 90 para fotos; PNG para el resto.
4. **Tileables**: tienen que repetir sin costura. Probalo poniendo la imagen 2×2. Deben ser vista plana desde arriba, sin sombras ni degradés de luz.
5. **Pantallas** (`screens/`): imagen plana de la interfaz, no una foto de un monitor. Dejá vacía la franja superior de 64 px, porque ahí la app escribe el nombre del equipo y su IP.
6. **Texto**: revisá ortografía, tildes y mayúsculas. Si un cartel sale con errores, mandá igual la versión sin texto y el texto lo dibujamos por código.
7. **GIFs**: generá los cuadros con la misma semilla o la misma referencia para que sean consistentes, en `gif/<nombre>/frame_01.png`, `frame_02.png`, etc.

## Cómo devolverlo

```
assets-generados.zip
├── textures/…
├── views/…
├── screens/…
├── art/…
├── branding/…
├── signs/…
├── props/…
├── ui/…
├── missions/…
├── npcs/…
├── icons/…
├── gif/<nombre>/frame_XX.png
└── sounds/… (opcional)
```

No hace falta generar todo: con los **P1** ya cambia mucho la app. Lo que falte sigue usando la versión actual.

Una vez recibido, se integra así:

```bash
unzip assets-generados.zip -d public/assets/gen/
node tools/register-gen.mjs        # escribe public/assets/gen/manifest.json
npm run build
```

## GIFs y animaciones

```bash
python3 asset-pack/tools/make_gif.py gif/rj45_crimp/ public/assets/gen/gif/rj45_crimp.gif --fps 2 --crossfade 4 --width 640
python3 asset-pack/tools/make_gif.py art/art_monumento_bandera.jpg out.webp --kenburns 60 --fps 20   # paneo lento a partir de una sola foto
```

`--crossfade` agrega cuadros intermedios fundidos, `--kenburns` anima una sola imagen y `--colors` achica el GIF. Si la salida termina en `.webp`, la animación queda más liviana y con mejor color.

## Sonidos (opcional)

La app ya **sintetiza** todos sus sonidos: pasos, puertas, zumbido del rack, clics, tonos de paquetes y timbre de teléfono. Los slots `sounds/` son opcionales por si querés reemplazarlos con audio generado por IA (ElevenLabs SFX, Stable Audio, etc.).
