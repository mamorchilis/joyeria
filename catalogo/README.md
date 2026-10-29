# Catálogo de productos

Desde aquí se cargan los productos de la tienda: una planilla Excel y una carpeta de fotos.
Estándar acordado el 2026-10-29 (Juan Antonio).

## Qué lleva cada producto (obligatorio)

- **Nombre**, **colección** y **categoría** (se eligen de una lista).
- **Material**, **precio**, **tamaño** y **descripción**.
- **Al menos 3 fotos.**

Si un producto no pertenece a ninguna colección, se marca "Sin colección". Nunca queda vacío.

## Cómo se carga

1. Llenar `productos.xlsx`, hoja *Productos*: una fila por producto. La hoja *Instrucciones*
   explica cada columna y las celdas amarillas son las que faltan.
2. Poner las fotos en `fotos/<codigo>/`, nombradas `01.jpg`, `02.jpg`, `03.jpg`… La `01` es la
   principal. Tamaño recomendado: lado largo de 2000 px y menos de 2 MB por foto.
3. Revisar:

   ```bash
   python catalogo/revisar_catalogo.py
   ```

   Muestra, producto por producto, lo que falta. Cuando todo sale con ✓, se puede subir.
4. Subir a Shopify (pendiente: ver más abajo).

**Versiones de un mismo producto** (por ejemplo, la medalla con o sin cadena): una fila por
versión, repitiendo el código y llenando solo *opción* y *precio*.

## Colecciones y categorías vigentes

| Tipo | Valores | En el menú de la tienda |
|---|---|---|
| Colección | Colección Astur | *Colecciones* |
| Categoría | Cadenas y collares, Colgantes | *Joyas* |

Para sumar una colección o categoría nueva, se agrega en la hoja *Listas*.

## Cómo calza con Shopify

| Planilla | Shopify |
|---|---|
| codigo | Dirección del producto (*handle*) y SKU |
| nombre | Título |
| descripcion | Descripción |
| categoria | Tipo de producto. Cada categoría es una colección automática ("tipo es igual a…") y alimenta el menú *Joyas* |
| coleccion | Etiqueta (por ejemplo `coleccion-astur`). Cada colección es una colección automática por etiqueta y alimenta el menú *Colecciones* |
| material | Etiqueta y filtro |
| opcion, precio_clp | Variantes y precio |
| tamano, peso_g | Campo propio (metacampo) que se muestra en la ficha; el peso sirve para el despacho |
| estado | Borrador o activo |
| fotos/<codigo>/ | Imágenes del producto, en orden |

## Subida a Shopify (pendiente)

La importación por CSV de Shopify **no sirve para fotos que están en el computador**: pide un
enlace público por cada imagen. Por eso la propuesta es un script (`subir_a_shopify.py`, por
hacer) que lea la planilla y las fotos y cree o actualice cada producto con la API de Shopify.

Para eso hace falta un **token de acceso** de la tienda, con permiso para productos y archivos.
Lo crea un socio en Shopify y se guarda **solo en una variable de entorno del computador**
(`SHOPIFY_ADMIN_TOKEN`), nunca en el repositorio.
