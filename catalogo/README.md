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
4. Subir a Shopify:

   ```bash
   python catalogo/subir_a_shopify.py --simular
   python catalogo/subir_a_shopify.py
   ```

   El primero muestra qué haría sin cambiar nada; el segundo sube. Con `--solo CODIGO` se sube
   un producto. Detalle más abajo.

**Versiones de un mismo producto** (por ejemplo, la medalla con o sin cadena): una fila por
versión, repitiendo el código y llenando solo *opción* y *precio*.

## Colecciones y categorías vigentes

| Tipo | Valores | En el menú de la tienda |
|---|---|---|
| Colección | Colección Astur | *Colecciones* |
| Categoría | Cadenas y collares, Colgantes | *Joyas* |
| Categoría, aún sin piezas | Anillos, Aros, Esclavas, Pulseras | No, hasta tener la primera pieza |

Para sumar una colección o categoría nueva, se agrega en la hoja *Listas* y se crea su colección
automática en Shopify (tipo de producto igual al nombre de la categoría). Una categoría entra al
menú *Joyas* cuando tiene su primera pieza publicada.

## Cómo calza con Shopify

| Planilla | Shopify |
|---|---|
| codigo | Dirección del producto (*handle*) y SKU |
| nombre | Título |
| descripcion | Descripción |
| categoria | Tipo de producto. Cada categoría es una colección automática ("tipo es igual a…") y alimenta el menú *Joyas* |
| coleccion | Etiqueta (por ejemplo `coleccion-astur`). Cada colección es una colección automática por etiqueta y alimenta el menú *Colecciones* |
| material | Etiqueta (por ejemplo `Bronce`) |
| opcion, precio_clp | Variantes, bajo la opción "Versión" (por ejemplo *Con cadena* / *Sin cadena*), y precio |
| tamano | Metacampo `custom.tamano`. Falta mostrarlo en la ficha de producto del tema |
| peso_g | Peso de cada variante, en gramos, para el despacho |
| estado | *Borrador* queda oculto; *Publicado* queda activo y en la tienda en línea |
| fotos/<codigo>/ | Imágenes del producto, en orden, con texto alternativo "Nombre, foto N" |
| — | Marca: Pili Trespalacios. Inventario sin seguimiento, porque se hace a pedido |

## Subida a Shopify (`subir_a_shopify.py`)

La importación por CSV de Shopify **no sirve para fotos que están en el computador**: pide un
enlace público por cada imagen. Por eso el script lee la planilla y las fotos y crea o actualiza
cada producto con la API de Shopify.

- **Revisa antes de subir:** un producto con pendientes (los mismos de `revisar_catalogo.py`) no
  se sube.
- **Crea o actualiza:** si ya existe un producto con ese código, lo actualiza en vez de duplicarlo.
- **Fotos:** solo sube las nuevas o las que cambiaron. El producto queda con las fotos que hay en la
  carpeta; quitar una foto de la carpeta debería quitarla del producto (aún no probado).
- **No borra productos:** si un código desaparece de la planilla, el producto queda en Shopify y se
  archiva o borra a mano.
- **Probado el 2026-10-29** con un producto de prueba en borrador, con dos versiones y 3 fotos.
  Quedó con su tipo, etiquetas, precios, peso, tamaño y fotos, y entró solo a *Colección Astur* y
  *Colgantes*. Al subirlo otra vez se actualizó sin repetir fotos. Después se borró, junto con sus
  fotos: la tienda quedó con 0 productos.

### Acceso a la tienda (listo desde el 2026-10-29)

Desde 2026 Shopify ya no entrega una clave fija. El acceso es una app propia del Dev Dashboard:

- **App:** "Carga de catálogo", en la organización *Pili Trespalacios* del Dev Dashboard
  (<https://dev.shopify.com/dashboard/243186238/apps/441694846977>), instalada en la tienda.
- **Permisos:** productos, archivos (fotos), publicación en la tienda e inventario. Nada de
  pedidos ni clientes.
- **Credenciales:** el ID y el secreto de la app se guardan **solo en variables de entorno del
  usuario de Windows** (`SHOPIFY_CLIENT_ID` y `SHOPIFY_CLIENT_SECRET`), nunca en el repositorio.
  Se cargan desde *Settings* de la app con:
  `[Environment]::SetEnvironmentVariable("SHOPIFY_CLIENT_SECRET", (Read-Host "Pega el valor"), "User")`
  y luego hay que reiniciar la terminal o la app que corre el script.
- **Cómo se usa:** el script pide a Shopify una clave temporal con esas credenciales
  (`POST https://qe0efu-mp.myshopify.com/admin/oauth/access_token`, `grant_type=client_credentials`).
  Cada clave dura 24 horas, así que se pide una nueva en cada uso.
- **Si se filtra el secreto:** se rota desde *Settings* de la app y se vuelve a guardar.
- Se probó el 2026-10-29: la tienda respondió con su nombre y 0 productos.
