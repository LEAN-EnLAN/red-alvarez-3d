# Imágenes para generar con Codex · landing de Red Alvarez 3D

Son **4 imágenes**. La landing ya tiene su lugar preparado: si el archivo existe en `public/landing/`
aparece; si no, la figura no se muestra. No hace falta tocar código.

Todo lo que muestra la red real (plano, cables, racks con sus equipos, IPs) sale de la escena 3D y
del TP, **nunca** de una imagen generada. Por eso estas imágenes son láminas genéricas de dibujo
técnico: explican cómo es una cosa, no cómo está instalada en esta oficina.

## Estilo común (pegar al principio de cada prompt)

```
Technical pen-and-ink drawing on a plain flat background, like a plate from an engineering
handbook or an architecture monograph. Fine black ink linework (#141413) with consistent line
weight, light cross-hatching for shadows, isometric/axonometric projection, generous empty
margins. Exactly one accent color: a vivid orange (#ff6a13) used sparingly on a single element.
No gradients, no 3D render look, no glow, no drop shadows, no photo realism.
Background: perfectly flat #f2f1ec (warm off-white paper), no texture, no vignette, no border.
```

## Prohibido en todas (pegar al final de cada prompt)

```
Do not include: any text, letters, numbers, labels, logos, brand names, watermarks, signatures,
dimension numbers, callout numbers, port counts, screens, people, hands, colored backgrounds,
blueprint blue, neon, purple, gradients, 3D render shading, glossy plastic, isometric "SaaS"
illustration style, cute or cartoon style.
```

---

### 1 · `fig-jack.webp` — Lámina A, sección "01 El encargo"

- **Medida**: 1200 × 900 (4:3). **Entrega**: WebP calidad 82, ≤ 90 KB.
- **Prompt**:
  ```
  [estilo común]
  Exploded cutaway of a Cat6 network cable entering a keystone RJ45 female jack. The outer jacket
  is peeled back, revealing four twisted pairs and the plastic cross separator. The pairs fan out
  toward the jack's insulation-displacement contacts. The jack is shown slightly separated from the
  cable, floating, with thin dashed guide lines showing how they fit together. Only the outer cable
  jacket is orange (#ff6a13); everything else is black ink linework with hatching. The twisted pairs
  are drawn in ink only, not colored.
  [prohibido]
  ```

### 2 · `fig-fiber.webp` — Lámina B, sección "3.1 Dos gabinetes"

- **Medida**: 1200 × 900 (4:3). **Entrega**: WebP calidad 82, ≤ 90 KB.
- **Prompt**:
  ```
  [estilo común]
  A loosely coiled single-mode fiber optic patch cord with a duplex LC connector at each end. Next to
  each connector, a small SFP transceiver module drawn slightly apart, as an exploded view, with thin
  dashed guide lines showing where the LC connector plugs in. Only the thin fiber cord is orange
  (#ff6a13); connectors and modules are black ink linework with light hatching. Calm composition,
  lots of empty space.
  [prohibido]
  ```

### 3 · `fig-rack.webp` — Lámina C, sección "04 Presupuesto"

- **Medida**: 1200 × 900 (4:3). **Entrega**: WebP calidad 82, ≤ 100 KB.
- **Prompt**:
  ```
  [estilo común]
  Exploded axonometric view of an EMPTY wall-mounted 19-inch network cabinet: the main frame, the two
  front mounting rails with evenly spaced holes, the two removable side panels, the top panel with a
  fan cutout, and the glass front door with its handle, each part pulled apart along thin dashed
  guide lines. No equipment inside, no patch panels, no switches, no cables. Only the front door
  frame is orange (#ff6a13); all other parts are black ink linework with light hatching.
  [prohibido]
  ```

### 4 · `paper.webp` — textura de fondo de toda la página

- **Medida**: 512 × 512, **tileable** (que se repita sin costuras). **Entrega**: WebP calidad 70, ≤ 25 KB.
- **Prompt**:
  ```
  Seamless tileable texture of fine uncoated drawing paper, very subtle fiber grain, warm off-white
  #f2f1ec average color, extremely low contrast (barely visible), even lighting, no folds, no stains,
  no vignette, no text. Must tile perfectly on all four edges.
  ```
- **Nota**: si se ve más oscura o más amarilla que `#f2f1ec`, mejor no usarla. Esta no se activa sola:
  avisame cuando esté y la conecto (es una línea de CSS).

---

## Cómo entregarlas

1. Guardarlas con esos nombres exactos en `public/landing/`.
2. Revisar que no tengan texto ni números (la IA a veces los agrega igual) y que el fondo sea liso.
3. Pasármelas y las reviso en la página antes de publicar.

## Lo que no es para Codex

- **Foto del equipo** (Tomás, Juan Manuel y Leandro): una foto real, horizontal, luz natural. Va en el colofón.
- **Foto de la presentación en clase** (opcional): proyector con la demo en pantalla.
- Capturas de la demo, el video de la red desarmada y la imagen para compartir (`og.jpg`): los genero yo
  desde la escena 3D real.
