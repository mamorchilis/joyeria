# Investigación de referencia: Co Rivera

**Fecha de consulta:** 2026-10-11  
**Uso previsto:** análisis interno del proyecto de joyería. Este material no autoriza a copiar fotografías, diseños, textos de producto ni identidad visual.

## Estado de la recopilación

Se recorrieron las páginas públicas de la colección general desde el navegador. El recorrido devolvió **199 productos únicos** con nombre, precio publicado, estado mostrado y enlace a la ficha. La página 10 informa que no se encontró ningún producto. El número corresponde a lo accesible en la tienda al momento de la consulta y puede cambiar.

En esta captura, 196 productos aparecen “A PEDIDO” y 3 “AGOTADO”. Hay una fila llamada “Co Rivera” con precio $0, que parece ser un elemento especial del catálogo y no se debe tratar como precio representativo de una joya.

Las consultas directas a `robots.txt` y a endpoints JSON devolvieron `403 Forbidden`; no se intentó eludir esa respuesta. La recopilación se hizo recorriendo las páginas de la tienda que sí se muestran en el navegador. Una copia indexada más antigua muestra 204 artículos, cifra que no coincide con los 199 productos únicos observados actualmente.

## Hallazgos verificables en la portada

- La marca se presenta como joyería artesanal en bronce y plata, hecha a mano en Chile.
- Las categorías visibles incluyen anillos, aros, colgantes, collares/cadenas, chokers, pulseras y brazaletes.
- La portada destaca artículos “a pedido” y muestra precios en pesos chilenos.
- Aparecen motivos religiosos y simbólicos (por ejemplo, vírgenes, San Benito, estrellas y cruces), junto con motivos animales.
- La propia página declara que diseña joyas y accesorios.

Estos son observaciones del sitio, no conclusiones sobre sus ventas, costos, fabricante ni procesos internos.

## Archivos

- `ficha.json`: textos y datos de la hoja "Co Rivera" del [tablero general](../dashboard.html), con el formato estándar de `docs/referentes/README.md`. Incluye la revisión de políticas y portada del 18-10-2026 (a pedido en 15 a 20 días hábiles, despacho por Flapp, tienda en Casa Costanera y cambios solo para regalos).
- `dashboard.html`: tablero estratégico local con la captura integrada, análisis de precios y mix, filtros y carga opcional de ventas.
- `catalogo_publico.csv`: 199 productos visibles en la colección general, sin imágenes ni reseñas.
- `fuentes-y-limites.md`: enlaces consultados, condiciones relevantes y limitaciones.

El tablero clasifica categorías y motivos a partir de los títulos; son etiquetas exploratorias que conviene revisar. El precio más alto no equivale a un producto ganador. Para activar el ranking de ventas, carga un CSV con columnas `producto` y `unidades`; el cruce se hace localmente por nombre y requiere que coincida con el catálogo.

