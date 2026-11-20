#!/usr/bin/env python3
"""Arma un GIF (y/o WebP animado) optimizado a partir de una carpeta de cuadros o de una sola imagen.

Uso:
  python3 make_gif.py <carpeta_o_imagen> <salida.gif|.webp> [--fps 8] [--width 800] [--loop 0]
                      [--crossfade 4] [--kenburns 48] [--colors 128]

  --crossfade N  agrega N cuadros intermedios fundidos entre cada par (transición suave).
  --kenburns N   con UNA sola imagen: genera N cuadros con zoom/paneo lento (efecto Ken Burns).
  --colors N     paleta del GIF (64-256). Menos colores = archivo más chico.
Requiere solo Pillow (pip install pillow). Los cuadros se ordenan por nombre (frame_01.png, frame_02.png…).
"""
import argparse, glob, os, sys
from PIL import Image


def load_frames(src, width):
    files = sorted(glob.glob(os.path.join(src, '*.png')) + glob.glob(os.path.join(src, '*.jpg')) + glob.glob(os.path.join(src, '*.webp'))) if os.path.isdir(src) else [src]
    if not files:
        sys.exit('No hay imágenes en ' + src)
    frames = []
    for f in files:
        im = Image.open(f).convert('RGBA')
        if width and im.width != width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        frames.append(im)
    size = frames[0].size
    return [f if f.size == size else f.resize(size, Image.LANCZOS) for f in frames]


def kenburns(im, n):
    w, h = im.size
    out = []
    for i in range(n):
        t = i / max(1, n - 1)
        z = 1.0 + 0.12 * t
        cw, ch = w / z, h / z
        x = (w - cw) * (0.2 + 0.6 * t)
        y = (h - ch) * 0.5
        out.append(im.crop((round(x), round(y), round(x + cw), round(y + ch))).resize((w, h), Image.LANCZOS))
    return out


def crossfade(frames, n):
    if n <= 0 or len(frames) < 2:
        return frames
    out = []
    for a, b in zip(frames, frames[1:] + frames[:1]):
        out.append(a)
        for k in range(1, n + 1):
            out.append(Image.blend(a, b, k / (n + 1)))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('out')
    ap.add_argument('--fps', type=float, default=8); ap.add_argument('--width', type=int, default=800)
    ap.add_argument('--loop', type=int, default=0); ap.add_argument('--crossfade', type=int, default=0)
    ap.add_argument('--kenburns', type=int, default=0); ap.add_argument('--colors', type=int, default=128)
    a = ap.parse_args()
    frames = load_frames(a.src, a.width)
    if a.kenburns and len(frames) == 1:
        frames = kenburns(frames[0], a.kenburns)
    frames = crossfade(frames, a.crossfade)
    dur = round(1000 / a.fps)
    if a.out.lower().endswith('.webp'):
        frames[0].save(a.out, save_all=True, append_images=frames[1:], duration=dur, loop=a.loop, quality=82, method=6)
    else:
        pal = [f.convert('RGB').quantize(colors=a.colors, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG) for f in frames]
        pal[0].save(a.out, save_all=True, append_images=pal[1:], duration=dur, loop=a.loop, optimize=True, disposal=2)
    print(f'{a.out}: {len(frames)} cuadros, {os.path.getsize(a.out) / 1024:.0f} KB')


if __name__ == '__main__':
    main()
