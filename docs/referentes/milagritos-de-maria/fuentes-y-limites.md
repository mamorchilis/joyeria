# Fuentes y límites

Consulta registrada el 19-10-2026.

## Fuentes

- [Portada](https://milagritosdemaria.cl/): propuesta, plazos de encargo y forma de compra.
- [Catálogo](https://milagritosdemaria.cl/productos/): recorrido de la página 1 a la 11. La página 11 ya no tenía productos nuevos.
- [Sobre Milagritos de María](https://milagritosdemaria.cl/sobre-milagritos-de-maria/).
- [Política de devolución](https://milagritosdemaria.cl/politica-de-devolucion/), [Preguntas frecuentes](https://milagritosdemaria.cl/preguntas-frecuentes/) y [Cómo comprar](https://milagritosdemaria.cl/como-comprar1/).

## Acceso comprobado

La tienda usa Tiendanube. Su `robots.txt` excluye compra, checkout, búsqueda, cuentas, descuentos y envío, pero no el catálogo (`/productos/`). Las páginas se leyeron desde el navegador, solo en modo lectura.

## Cómo se armó el CSV

- Cada producto del listado trae sus variantes con precio, disponibilidad y stock. `precio_clp` es el precio más bajo; `precio_max_clp`, el más alto.
- `estado`: DISPONIBLE si al menos una variante está disponible; si no, AGOTADO.
- `stock_publicado` suma el stock de las variantes. Queda vacío cuando la tienda no informa el stock.
- `material`: "Plata" si el nombre dice plata; "Bronce" si dice bronce o dorado satinado; si no, se busca en la descripción.
- Se descartó un elemento del listado sin nombre ni enlace (parte del diseño de la página, no un producto).
- No se guardaron fotos, textos completos, datos personales ni los datos bancarios que publican las preguntas frecuentes.

## Límites

- Es una foto del 19-10-2026.
- No hay ventas ni costos. El stock publicado puede no reflejar el inventario real.
- La comparación con septiembre usa los nombres y precios vistos el 23-09-2026; como muchas medallas cambiaron de nombre, el emparejamiento es aproximado.
