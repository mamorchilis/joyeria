"""Arma docs/referentes/datos.js a partir de las carpetas de cada competidor.

Cada carpeta (por ejemplo co-rivera/) debe tener:
  - ficha.json: textos y datos de la marca (ver README.md de esta carpeta).
  - catalogo_publico.csv: con al menos las columnas producto, precio_clp, estado y url.

Uso, desde la raíz del repositorio:
  python docs/referentes/generar_datos.py
"""

import csv
import json
import re
import unicodedata
from datetime import date
from pathlib import Path

BASE = Path(__file__).resolve().parent


def norm(texto):
    texto = unicodedata.normalize("NFD", str(texto or ""))
    return "".join(c for c in texto if unicodedata.category(c) != "Mn").lower().strip()


def precio(valor):
    digitos = re.sub(r"[^\d]", "", str(valor or ""))
    return int(digitos) if digitos else 0


# Categorías estándar. Si el CSV trae el tipo de producto de la tienda, se usa ese;
# si no, se deduce del comienzo del nombre.
TIPO_A_CATEGORIA = {
    "anillo": "Anillos",
    "aros": "Aros",
    "pulsera": "Pulseras y esclavas",
    "esclava": "Pulseras y esclavas",
    "collar": "Collares y cadenas",
    "cadena": "Collares y cadenas",
    "colgante": "Colgantes y medallas",
}


def categoria(nombre, tipo):
    t = norm(tipo)
    if t in TIPO_A_CATEGORIA:
        return TIPO_A_CATEGORIA[t]
    n = norm(nombre)
    if re.match(r"(anillo|argolla)", n):
        return "Anillos"
    if re.match(r"(aros|aritos|ear cuff)", n):
        return "Aros"
    if re.match(r"(pulsera|esclava)", n):
        return "Pulseras y esclavas"
    if re.match(r"(cadena|collar|choker|chocker|cordon|cortito)", n):
        return "Collares y cadenas"
    if re.match(r"(colgante|medalla|placa|punta|rayo|cruz|escudo|herradura|relicario|cuarzo|cacho|candado)", n):
        return "Colgantes y medallas"
    return "Otros"


def material(nombre, declarado):
    if declarado:
        return declarado
    n = norm(nombre)
    bronce, plata = "bronce" in n, "plata" in n
    if bronce and plata:
        return "Plata + bronce"
    if bronce:
        return "Bronce"
    if plata:
        return "Plata"
    return "No indicado"


PIEDRAS = r"onix|cuarzo|coral|perla|piedra|granate|circon|fume|agata|nacar|turquesa|amatista"


def piedra(nombre, declarado):
    if declarado:
        return norm(declarado) in ("si", "sí", "1", "true")
    return bool(re.search(PIEDRAS, norm(nombre)))


# Familias de motivo, en orden de prioridad. Se deducen del nombre.
MOTIVOS = [
    ("Religioso / devocional", r"virgen|san benito|santo|santa|espiritu santo|cruz|relicario|medalla|detente|guadalupe"),
    ("Animal", r"puma|leon|aguila|carnero|caballo|jabali|bufalo|chucao|pajaro|ave\b|serpiente|jaguar|abeja|colibri|mariposa|pez\b"),
    ("Celestial / simbólico", r"estrella|luna|orbita|orbit|rayo|\bsol\b|astro|herradura|flecha|candado|escudo|corazon|trebol|llamador"),
    ("Natural / orgánico", r"flor|rosa|hoja|\bala\b|alas\b|amapola|marina|lagrima|gota|concha|rama"),
    ("Geométrico", r"square|cuadrad|rectang|triangul|circul|esfera|bola|cubo|ovalo|geometr"),
    ("Forma / básico", r"liso|lisa|argolla|eslabon|media cana|rolo|nudo|tachas|espiga|malla|cinta|tennis|grumet|machacad|tubular|bombe|sello|placa|cadena|mostacilla"),
]


def motivo(nombre):
    n = norm(nombre)
    for familia, patron in MOTIVOS:
        if re.search(patron, n):
            return familia
    return "Sin motivo evidente"


def cargar_competidor(carpeta):
    ficha = json.loads((carpeta / "ficha.json").read_text(encoding="utf-8"))
    excluir = {norm(x) for x in ficha.get("excluir", [])}
    productos = []
    with open(carpeta / "catalogo_publico.csv", encoding="utf-8-sig", newline="") as f:
        for fila in csv.DictReader(f):
            nombre = (fila.get("producto") or "").strip()
            if not nombre:
                continue
            p = precio(fila.get("precio_clp"))
            productos.append({
                "producto": nombre,
                "precio": p,
                "precio_max": precio(fila.get("precio_max_clp")) or p,
                "estado": (fila.get("estado") or "").strip().upper() or "SIN ESTADO",
                "url": (fila.get("url") or "").strip(),
                "categoria": categoria(nombre, fila.get("tipo_tienda")),
                "material": material(nombre, (fila.get("material") or "").strip()),
                "piedra": piedra(nombre, (fila.get("piedra_o_perla") or "").strip()),
                "motivo": motivo(nombre),
                "publicado": (fila.get("publicado") or "").strip(),
                "incluido": p > 0 and norm(nombre) not in excluir,
            })
    ficha["slug"] = carpeta.name
    ficha["productos"] = productos
    return ficha


def main():
    competidores = [cargar_competidor(c) for c in sorted(BASE.iterdir()) if (c / "ficha.json").exists()]
    competidores.sort(key=lambda c: c.get("orden", 99))
    resumen = json.loads((BASE / "resumen.json").read_text(encoding="utf-8"))
    datos = {"generado": date.today().isoformat(), "resumen": resumen, "competidores": competidores}
    salida = BASE / "datos.js"
    salida.write_text(
        "// Archivo generado por generar_datos.py. No editar a mano.\n"
        "window.REFERENTES = " + json.dumps(datos, ensure_ascii=False, indent=1) + ";\n",
        encoding="utf-8",
    )
    for c in competidores:
        incluidos = sum(p["incluido"] for p in c["productos"])
        print(f"{c['nombre']}: {len(c['productos'])} filas, {incluidos} incluidas en el análisis")
    print(f"Listo: {salida}")


if __name__ == "__main__":
    main()
