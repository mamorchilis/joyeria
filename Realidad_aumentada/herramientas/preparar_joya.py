"""Prepara la foto de un choker rígido para el probador de realidad aumentada.

Entrada: foto cenital de la joya (vista desde arriba, abertura hacia abajo) sobre fondo claro.
Salida:  app/joyas/<id>/textura.png  (joya recortada, fondo transparente)
         app/joyas/<id>/perfil.json  (forma del aro medida en la foto)

Uso: python herramientas/preparar_joya.py <foto> <id> [diametro_mm]
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
MARGEN = 24  # px alrededor de la joya en la textura


def suave(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def recortar_fondo(rgb):
    """Alfa a partir de la saturación del píxel."""
    a = rgb.astype(np.float32)
    # El fondo y sus sombras son casi neutros; el metal es saturado.
    saturacion = (a.max(axis=2) - a.min(axis=2)) / np.maximum(a.max(axis=2), 1)
    alfa = suave(saturacion, 0.20, 0.34)
    alfa_img = Image.fromarray((alfa * 255).astype(np.uint8))
    # Cierra los brillos casi blancos del metal y quita motas sueltas.
    alfa_img = alfa_img.filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.MinFilter(11))
    alfa_img = alfa_img.filter(ImageFilter.MedianFilter(5))
    return np.asarray(alfa_img).astype(np.float32) / 255


def rellenar_huecos(alfa):
    """Vuelve opaco todo lo que queda encerrado por el metal (brillos que el recorte se comió)."""
    mascara = Image.fromarray(((alfa > 0.9) * 255).astype(np.uint8)).convert("L")
    borde = Image.new("L", (mascara.width + 2, mascara.height + 2), 0)
    borde.paste(mascara, (1, 1))
    ImageDraw.floodfill(borde, (0, 0), 128)
    encerrado = np.asarray(borde)[1:-1, 1:-1] == 0
    return np.where(encerrado, 1.0, alfa)


def rellenar_tubo(alfa, cx, cy, perfil, semi_tubo, abertura):
    """Fuera de las cabezas el aro es un tubo de grosor constante: lo completa donde el brillo lo mordió."""
    grados = np.array([p[0] for p in perfil], dtype=np.float64)
    radios = np.array([p[1] for p in perfil])
    # Mediana en una ventana de ±12° para ignorar los tramos mordidos.
    liso = np.array([np.median(radios[np.abs(grados - g) <= 12]) for g in grados])
    yy, xx = np.mgrid[0:alfa.shape[0], 0:alfa.shape[1]]
    phi = np.degrees(np.arctan2(xx - cx, yy - cy))
    r = np.hypot(xx - cx, yy - cy)
    r_centro = np.interp(phi, grados, liso)
    tubo = 1 - suave(np.abs(r - r_centro), semi_tubo - 1.5, semi_tubo + 0.5)
    es_tubo = (phi < abertura[0] - 24) | (phi > abertura[1] + 24)
    return np.where(es_tubo, np.maximum(alfa, tubo), alfa)


def limpiar_borde(rgb, alfa):
    """Reemplaza el color de los píxeles de borde (mezclados con el fondo) por el del metal vecino."""
    solido = (alfa > 0.95).astype(np.float32)
    peso = np.asarray(Image.fromarray((solido * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4))).astype(np.float32) / 255
    salida = np.empty_like(rgb, dtype=np.float32)
    for c in range(3):
        canal = Image.fromarray((rgb[..., c] * solido).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4))
        extendido = np.asarray(canal).astype(np.float32) / np.maximum(peso, 1e-3)
        salida[..., c] = np.where(solido > 0, rgb[..., c], extendido)
    salida[peso < 0.01] = rgb[solido > 0].mean(axis=0)
    return np.clip(salida, 0, 255).astype(np.uint8)


def ajustar_circulo(xs, ys):
    A = np.column_stack([2 * xs, 2 * ys, np.ones_like(xs)])
    b = xs**2 + ys**2
    cx, cy, c = np.linalg.lstsq(A, b, rcond=None)[0]
    return cx, cy, math.sqrt(c + cx**2 + cy**2)


def medir_perfil(alfa):
    """Radio central y semi-ancho del aro por cada grado. 0° = frente (abajo en la foto)."""
    mascara = alfa > 0.5
    ys, xs = np.nonzero(mascara)
    cx, cy, r0 = ajustar_circulo(xs.astype(np.float64), ys.astype(np.float64))
    radios = np.arange(r0 * 0.5, r0 * 1.4, 0.5)
    perfil = []
    for grado in range(-180, 181):
        phi = math.radians(grado)
        px = np.round(cx + radios * math.sin(phi)).astype(int)
        py = np.round(cy + radios * math.cos(phi)).astype(int)
        dentro = (px >= 0) & (px < alfa.shape[1]) & (py >= 0) & (py < alfa.shape[0])
        toca = np.zeros(len(radios), dtype=bool)
        toca[dentro] = mascara[py[dentro], px[dentro]]
        if toca.sum() < 4:
            continue
        r = radios[toca]
        perfil.append((grado, (r.min() + r.max()) / 2, (r.max() - r.min()) / 2))
    return cx, cy, r0, perfil


def main():
    foto, id_joya = Path(sys.argv[1]), sys.argv[2]
    diametro_mm = float(sys.argv[3]) if len(sys.argv) > 3 else 125.0

    rgb = np.asarray(Image.open(foto).convert("RGB"))
    alfa = rellenar_huecos(recortar_fondo(rgb))

    ys, xs = np.nonzero(alfa > 0.05)
    x0, x1 = max(xs.min() - MARGEN, 0), min(xs.max() + MARGEN, rgb.shape[1])
    y0, y1 = max(ys.min() - MARGEN, 0), min(ys.max() + MARGEN, rgb.shape[0])
    rgb, alfa = rgb[y0:y1, x0:x1], alfa[y0:y1, x0:x1]

    cx, cy, r0, perfil = medir_perfil(alfa)
    grados = [p[0] for p in perfil]
    semi_tubo = float(np.median([p[2] for p in perfil]))
    # La abertura es el tramo sin metal alrededor de 0°.
    abertura = [max(g for g in grados if g < 0), min(g for g in grados if g > 0)]
    alfa = rellenar_tubo(alfa, cx, cy, perfil, semi_tubo, abertura)
    rgb = limpiar_borde(rgb, alfa)
    cx, cy, r0, perfil = medir_perfil(alfa)
    semi_max = max(p[2] for p in perfil)

    destino = RAIZ / "app" / "joyas" / id_joya
    destino.mkdir(parents=True, exist_ok=True)
    rgba = np.dstack([rgb, (alfa * 255).astype(np.uint8)])
    Image.fromarray(rgba, "RGBA").save(destino / "textura.png")

    datos = {
        "ancho": int(rgb.shape[1]),
        "alto": int(rgb.shape[0]),
        "centro": [round(cx, 1), round(cy, 1)],
        "radio_px": round(r0, 1),
        "diametro_mm": diametro_mm,
        "semi_tubo_px": round(semi_tubo, 1),
        "semi_max_px": round(semi_max, 1),
        "abertura_grados": abertura,
        # [grado, radio central px] — el aro real no es un círculo perfecto.
        "radios": [[g, round(r, 1)] for g, r, _ in perfil],
    }
    (destino / "perfil.json").write_text(json.dumps(datos), encoding="utf-8")
    print(f"{destino}: {rgb.shape[1]}x{rgb.shape[0]} px, radio {r0:.0f} px, "
          f"tubo ±{semi_tubo:.1f} px, cabezas ±{semi_max:.1f} px, abertura {datos['abertura_grados']}")


if __name__ == "__main__":
    main()
