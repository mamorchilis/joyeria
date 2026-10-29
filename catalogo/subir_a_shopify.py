"""Sube a Shopify los productos de la planilla, con sus fotos.

Uso (desde la carpeta del proyecto):
    python catalogo/subir_a_shopify.py --simular      # muestra qué haría, sin cambiar nada
    python catalogo/subir_a_shopify.py                # sube todos los productos listos
    python catalogo/subir_a_shopify.py --solo CODIGO  # sube uno solo

Antes de subir pasa la misma revisión que revisar_catalogo.py: un producto con
pendientes no se sube. Si el producto ya existe (mismo código), se actualiza.
Las credenciales se leen de SHOPIFY_CLIENT_ID y SHOPIFY_CLIENT_SECRET (ver
catalogo/README.md); nunca se muestran ni se guardan.
"""
import argparse
import hashlib
import html
import json
import mimetypes
import os
import re
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

from openpyxl import load_workbook

from revisar_catalogo import FOTOS, PLANILLA, fotos_de, leer_listas, leer_productos, revisar_producto

TIENDA = "qe0efu-mp"
VERSION_API = "2026-10"
MARCA = "Pili Trespalacios"
NOMBRE_OPCION = "Versión"
SIN_COLECCION = "Sin colección"
ESTADOS = {"Borrador": "DRAFT", "Publicado": "ACTIVE"}


def a_codigo(texto):
    """"Colección Astur" -> "coleccion-astur"."""
    sin_tildes = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", sin_tildes.lower()).strip("-")


class Shopify:
    def __init__(self):
        cid = os.environ.get("SHOPIFY_CLIENT_ID")
        secreto = os.environ.get("SHOPIFY_CLIENT_SECRET")
        if not (cid and secreto):
            raise SystemExit("Faltan SHOPIFY_CLIENT_ID o SHOPIFY_CLIENT_SECRET (ver catalogo/README.md).")
        datos = urllib.parse.urlencode(
            {"grant_type": "client_credentials", "client_id": cid, "client_secret": secreto}
        ).encode()
        try:
            respuesta = self._pedir(f"https://{TIENDA}.myshopify.com/admin/oauth/access_token", datos,
                                    {"Content-Type": "application/x-www-form-urlencoded"})
        except urllib.error.HTTPError as e:
            raise SystemExit(f"Shopify no entregó la clave temporal (error {e.code}). Revisa el ID y el secreto.")
        self.clave = respuesta["access_token"]

    @staticmethod
    def _pedir(url, datos, encabezados):
        with urllib.request.urlopen(urllib.request.Request(url, data=datos, headers=encabezados), timeout=120) as r:
            return json.load(r)

    def consulta(self, texto, variables=None):
        respuesta = self._pedir(
            f"https://{TIENDA}.myshopify.com/admin/api/{VERSION_API}/graphql.json",
            json.dumps({"query": texto, "variables": variables or {}}).encode(),
            {"Content-Type": "application/json", "X-Shopify-Access-Token": self.clave},
        )
        if respuesta.get("errors"):
            raise RuntimeError(json.dumps(respuesta["errors"], ensure_ascii=False))
        return respuesta["data"]

    def producto_existente(self, codigo):
        datos = self.consulta(
            """query($handle: String!) {
                 productByIdentifier(identifier: {handle: $handle}) {
                   id
                   media(first: 50) { nodes { id ... on MediaImage { image { url } } } }
                 }
               }""",
            {"handle": codigo},
        )
        return datos["productByIdentifier"]

    def subir_foto(self, ruta, nombre):
        tipo = mimetypes.guess_type(ruta.name)[0] or "image/jpeg"
        contenido = ruta.read_bytes()
        datos = self.consulta(
            """mutation($input: [StagedUploadInput!]!) {
                 stagedUploadsCreate(input: $input) {
                   stagedTargets { url resourceUrl parameters { name value } }
                   userErrors { field message }
                 }
               }""",
            {"input": [{"resource": "IMAGE", "filename": nombre, "mimeType": tipo,
                        "httpMethod": "POST", "fileSize": str(len(contenido))}]},
        )["stagedUploadsCreate"]
        revisar_errores(datos, f"preparar la foto {ruta.name}")
        destino = datos["stagedTargets"][0]
        limite = uuid.uuid4().hex
        cuerpo = b""
        for p in destino["parameters"]:
            cuerpo += (f'--{limite}\r\nContent-Disposition: form-data; name="{p["name"]}"\r\n\r\n'
                       f'{p["value"]}\r\n').encode()
        cuerpo += (f'--{limite}\r\nContent-Disposition: form-data; name="file"; filename="{nombre}"\r\n'
                   f"Content-Type: {tipo}\r\n\r\n").encode() + contenido + f"\r\n--{limite}--\r\n".encode()
        pedido = urllib.request.Request(destino["url"], data=cuerpo,
                                        headers={"Content-Type": f"multipart/form-data; boundary={limite}"})
        with urllib.request.urlopen(pedido, timeout=300):
            pass
        return destino["resourceUrl"]

    def canal_tienda_en_linea(self):
        for p in self.consulta("{ publications(first: 20) { nodes { id name } } }")["publications"]["nodes"]:
            if p["name"] == "Online Store":
                return p["id"]
        raise RuntimeError("No encontré el canal Online Store.")

    def publicar(self, producto_id):
        datos = self.consulta(
            """mutation($id: ID!, $canal: ID!) {
                 publishablePublish(id: $id, input: [{publicationId: $canal}]) { userErrors { field message } }
               }""",
            {"id": producto_id, "canal": self.canal_tienda_en_linea()},
        )["publishablePublish"]
        revisar_errores(datos, "publicar en la tienda en línea")


def revisar_errores(resultado, accion):
    if resultado.get("userErrors"):
        detalle = "; ".join(e["message"] for e in resultado["userErrors"])
        raise RuntimeError(f"Shopify no pudo {accion}: {detalle}")


def nombre_foto(codigo, n, ruta):
    """El nombre lleva una huella del contenido: si la foto cambia, se vuelve a subir."""
    huella = hashlib.sha256(ruta.read_bytes()).hexdigest()[:8]
    return f"{codigo}-{n:02d}-{huella}{ruta.suffix.lower()}"


def armar_producto(codigo, filas):
    principal = filas[0][1]
    tags = [principal["material"]]
    if principal["coleccion"] != SIN_COLECCION:
        tags.append(a_codigo(principal["coleccion"]))
    parrafos = [p.strip() for p in str(principal["descripcion"]).split("\n") if p.strip()]
    peso = principal.get("peso_g")

    def variante(datos, opcion):
        inventario = {"sku": codigo if opcion is None else f"{codigo}-{a_codigo(opcion)}", "tracked": False}
        if peso not in (None, ""):
            inventario["measurement"] = {"weight": {"value": float(peso), "unit": "GRAMS"}}
        return {
            "optionValues": [{"optionName": NOMBRE_OPCION if opcion else "Title",
                              "name": opcion or "Default Title"}],
            "price": str(int(datos["precio_clp"])),
            "inventoryItem": inventario,
        }

    opciones = [str(d["opcion"]) for _, d in filas if d.get("opcion") not in (None, "")]
    if opciones:
        producto_opciones = [{"name": NOMBRE_OPCION, "values": [{"name": o} for o in opciones]}]
        variantes = [variante(d, str(d["opcion"])) for _, d in filas]
    else:
        producto_opciones = [{"name": "Title", "values": [{"name": "Default Title"}]}]
        variantes = [variante(principal, None)]

    return {
        "handle": codigo,
        "title": principal["nombre"],
        "descriptionHtml": "".join(f"<p>{html.escape(p)}</p>" for p in parrafos),
        "productType": principal["categoria"],
        "vendor": MARCA,
        "tags": tags,
        "status": ESTADOS[principal["estado"]],
        "productOptions": producto_opciones,
        "variants": variantes,
        "metafields": [{"namespace": "custom", "key": "tamano", "type": "single_line_text_field",
                        "value": str(principal["tamano"])}],
    }


def subir(shopify, codigo, filas, fotos):
    entrada = armar_producto(codigo, filas)
    existente = shopify.producto_existente(codigo)
    ya_subidas = {}
    for m in (existente or {}).get("media", {}).get("nodes", []):
        url = (m.get("image") or {}).get("url") or ""
        ya_subidas[url.rsplit("/", 1)[-1].split("?")[0]] = m["id"]

    archivos, nuevas = [], 0
    for n, ruta in enumerate(fotos_de(codigo, fotos), start=1):
        nombre = nombre_foto(codigo, n, ruta)
        base = Path(nombre).stem
        anterior = next((i for archivo, i in ya_subidas.items() if archivo.startswith(base)), None)
        alt = f"{entrada['title']}, foto {n}"
        if anterior:
            archivos.append({"id": anterior, "alt": alt})
        else:
            archivos.append({"originalSource": shopify.subir_foto(ruta, nombre), "contentType": "IMAGE", "alt": alt})
            nuevas += 1
    entrada["files"] = archivos

    datos = shopify.consulta(
        """mutation($input: ProductSetInput!, $identifier: ProductSetIdentifiers) {
             productSet(input: $input, identifier: $identifier, synchronous: true) {
               product { id handle status }
               userErrors { field message }
             }
           }""",
        {"input": entrada, "identifier": {"handle": codigo}},
    )["productSet"]
    revisar_errores(datos, f"guardar {codigo}")
    producto = datos["product"]
    if producto["status"] == "ACTIVE":
        shopify.publicar(producto["id"])
    accion = "actualizado" if existente else "creado"
    estado = "publicado" if producto["status"] == "ACTIVE" else "en borrador"
    return f"{accion}, {estado}, {len(archivos)} fotos ({nuevas} subidas ahora)"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    argumentos = argparse.ArgumentParser(description="Sube la planilla de productos a Shopify.")
    argumentos.add_argument("--solo", help="código del único producto que se sube")
    argumentos.add_argument("--simular", action="store_true", help="muestra qué haría, sin conectarse a Shopify")
    argumentos.add_argument("--planilla", type=Path, default=PLANILLA, help=argparse.SUPPRESS)
    argumentos.add_argument("--fotos", type=Path, default=FOTOS, help=argparse.SUPPRESS)
    opciones = argumentos.parse_args()

    wb = load_workbook(opciones.planilla, data_only=True)
    listas = leer_listas(wb)
    productos = leer_productos(wb)
    if opciones.solo:
        if opciones.solo not in productos:
            print(f"No hay ningún producto con el código {opciones.solo} en la planilla.")
            return 2
        productos = {opciones.solo: productos[opciones.solo]}

    listos = {}
    for codigo, filas in productos.items():
        problemas = revisar_producto(codigo, filas, listas, opciones.fotos)
        if problemas:
            print(f"✗ {codigo}: no se sube, tiene pendientes (corre revisar_catalogo.py para verlos)")
        else:
            listos[codigo] = filas

    if opciones.simular:
        for codigo, filas in listos.items():
            entrada = armar_producto(codigo, filas)
            print(f"→ {codigo}: {entrada['title']} · {entrada['productType']} · {', '.join(entrada['tags'])} · "
                  f"{len(entrada['variants'])} versión(es) · {len(fotos_de(codigo, opciones.fotos))} fotos")
        print(f"\nSimulación: se subirían {len(listos)} de {len(productos)} productos. No se cambió nada.")
        return 0

    if not listos:
        print("\nNo hay productos listos para subir.")
        return 1
    shopify = Shopify()
    fallidos = 0
    for codigo, filas in listos.items():
        try:
            print(f"✓ {codigo}: {subir(shopify, codigo, filas, opciones.fotos)}")
        except Exception as e:  # un producto con error no detiene a los demás
            fallidos += 1
            print(f"✗ {codigo}: {e}")
    print(f"\n{len(listos) - fallidos} de {len(productos)} productos subidos.")
    return 1 if fallidos or len(listos) < len(productos) else 0


if __name__ == "__main__":
    sys.exit(main())
