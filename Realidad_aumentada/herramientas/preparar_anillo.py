"""Prepara las imágenes de un anillo de sello para el probador de realidad aumentada.

El anillo se dibuja como modelo 3D a partir de las medidas de su ficha en catalogo.json.
De las fotos se saca la cara superior "enderezada" (vista de frente), que es la textura de
la placa, y un recorte cuadrado para la bandeja.

Uso:
  python herramientas/preparar_anillo.py cara <foto> <id> x1,y1 x2,y2 x3,y3 x4,y4 [largo_mm ancho_mm]
      Las cuatro esquinas de la cara en píxeles de la foto, recorriendo el borde y
      partiendo por un lado largo (el que va a lo largo del dedo).
      Salida: app/joyas/<id>/cara.png, con el lado largo en horizontal.

  python herramientas/preparar_anillo.py miniatura <foto> <id> <centro_x> <centro_y> <lado>
      Salida: app/joyas/<id>/miniatura.png
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
PX_POR_MM = 20
MINIATURA = 240


def perspectiva(origen, destino):
    """Coeficientes para Image.transform que llevan cada punto de destino a su punto de origen."""
    filas, valores = [], []
    for (x, y), (u, v) in zip(destino, origen):
        filas.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        filas.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        valores += [u, v]
    return np.linalg.solve(np.array(filas, dtype=np.float64), np.array(valores, dtype=np.float64))


def carpeta_de(id_joya):
    carpeta = RAIZ / "app" / "joyas" / id_joya
    carpeta.mkdir(parents=True, exist_ok=True)
    return carpeta


def cara(foto, id_joya, *resto):
    esquinas = [tuple(float(n) for n in p.split(",")) for p in resto[:4]]
    largo_mm, ancho_mm = (float(n) for n in resto[4:6]) if len(resto) > 4 else (30.0, 22.0)
    w, h = round(largo_mm * PX_POR_MM), round(ancho_mm * PX_POR_MM)
    destino = [(0, 0), (w, 0), (w, h), (0, h)]
    imagen = Image.open(foto).convert("RGB")
    salida = carpeta_de(id_joya) / "cara.png"
    imagen.transform((w, h), Image.Transform.PERSPECTIVE, perspectiva(esquinas, destino), Image.Resampling.BICUBIC).save(salida)
    print(f"{salida}: {w}x{h} px ({largo_mm}x{ancho_mm} mm)")


def miniatura(foto, id_joya, cx, cy, lado):
    cx, cy, lado = float(cx), float(cy), float(lado)
    caja = (round(cx - lado / 2), round(cy - lado / 2), round(cx + lado / 2), round(cy + lado / 2))
    salida = carpeta_de(id_joya) / "miniatura.png"
    Image.open(foto).convert("RGB").crop(caja).resize((MINIATURA, MINIATURA), Image.Resampling.LANCZOS).save(salida)
    print(salida)


if __name__ == "__main__":
    {"cara": cara, "miniatura": miniatura}[sys.argv[1]](*sys.argv[2:])
