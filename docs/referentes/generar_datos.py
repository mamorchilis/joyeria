"""Mete los datos de cada competidor dentro de docs/referentes/dashboard.html.

Los datos quedan en el mismo archivo del tablero, para que funcione aunque se
envíe solo (por ejemplo, por WhatsApp o correo).

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
    "placa": "Colgantes y medallas",
    "tobillera": "Pulseras y esclavas",
    "cinturon": "Cinturones y cuero",
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
    if re.match(r"(pulsera|esclava|brazalete|tobillera)", n):
        return "Pulseras y esclavas"
    if re.match(r"(cadena|collar|choker|chocker|cordon|cortito|gargantilla)", n):
        return "Collares y cadenas"
    if re.match(r"(colgante|medalla|medallon|placa|punta|rayo|cruz|escudo|herradura|relicario|cuarzo|cacho|candado|tag|denario|tridente|colmillo|dado)", n):
        return "Colgantes y medallas"
    if re.match(r"cinturon", n):
        return "Cinturones y cuero"
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


PIEDRAS = r"onix|cuarzo|coral|perla|piedra|granate|circon|fume|agata|nacar|turquesa|amatista|topacio|ojo de tigre|obsidiana|cornalina"


def piedra(nombre, declarado):
    if declarado:
        return norm(declarado) in ("si", "sí", "1", "true")
    return bool(re.search(PIEDRAS, norm(nombre)))


# Familias de motivo, en orden de prioridad. Se deducen del nombre.
MOTIVOS = [
    ("Religioso / devocional", r"virgen|san benito|santo|santa|espiritu santo|cruz|relicario|medalla|detente|guadalupe|maria|fatima|lourdes|lujan|carmen|teresita|schoenstatt|sagrad|inmaculada|querubin|san francisco|mater\b|denario"),
    ("Animal", r"puma|leon|aguila|carnero|caballo|jabali|bufalo|chucao|pajaro|ave\b|serpiente|culebra|jaguar|pantera|toro\b|lobo|abeja|colibri|mariposa|pez\b"),
    ("Amor / frases", r"amor|amour|love|je t|beso|corazon|eternity|mama|papa|\bdad\b|frase"),
    ("Celestial / simbólico", r"estrella|luna|orbita|orbit|rayo|\bsol\b|astro|herradura|flecha|candado|escudo|trebol|llamador|ojo\b|ancla|llave"),
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
            cat, mot = categoria(nombre, fila.get("tipo_tienda")), motivo(nombre)
            # Medallas con nombre poético ("Fátima, la de los tres pastorcitos") no dicen qué pieza son.
            if cat == "Otros" and mot == "Religioso / devocional":
                cat = "Colgantes y medallas"
            productos.append({
                "producto": nombre,
                "precio": p,
                "precio_max": precio(fila.get("precio_max_clp")) or p,
                "precio_antes": precio(fila.get("precio_antes_clp")),
                "estado": (fila.get("estado") or "").strip().upper() or "SIN ESTADO",
                "url": (fila.get("url") or "").strip(),
                "categoria": cat,
                "material": material(nombre, (fila.get("material") or "").strip()),
                "piedra": piedra(nombre, (fila.get("piedra_o_perla") or "").strip()),
                "motivo": mot,
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
    salida = BASE / "dashboard.html"
    html = salida.read_text(encoding="utf-8")
    # "<\/" evita que un texto con "</script>" cierre el bloque antes de tiempo.
    json_datos = json.dumps(datos, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    bloque = (
        "<!-- DATOS:INICIO (lo escribe generar_datos.py; no editar a mano) -->\n"
        f"  <script>window.REFERENTES = {json_datos};</script>\n"
        "  <!-- DATOS:FIN -->"
    )
    nuevo, cambios = re.subn(r"<!-- DATOS:INICIO.*?<!-- DATOS:FIN -->", lambda _: bloque, html, flags=re.S)
    if cambios != 1:
        raise SystemExit("No se encontraron las marcas DATOS:INICIO / DATOS:FIN en dashboard.html")
    salida.write_text(nuevo, encoding="utf-8")
    for c in competidores:
        incluidos = sum(p["incluido"] for p in c["productos"])
        print(f"{c['nombre']}: {len(c['productos'])} filas, {incluidos} incluidas en el análisis")
    print(f"Listo: {salida}")


if __name__ == "__main__":
    main()
