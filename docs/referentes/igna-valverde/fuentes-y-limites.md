# Fuentes y límites

Consulta registrada el 18-10-2026.

## Fuentes

- [Portada](https://mariaignaciavalverde.cl/): propuesta, barra de envío gratis y productos destacados.
- [Listado público de productos](https://mariaignaciavalverde.cl/products.json): es el listado estándar de las tiendas Shopify. Se leyeron las 141 fichas (nombre, precio de cada variante, disponibilidad, tipo de producto, descripción y fecha de publicación).
- [Página "Igna"](https://mariaignaciavalverde.cl/pages/igna): fundadora, socio y equipo.
- [Puntos de venta](https://mariaignaciavalverde.cl/pages/puntos-de-venta): Alto Diseño (Alto Las Condes) y Mundano (MUT).
- [Política de envío](https://mariaignaciavalverde.cl/policies/shipping-policy): plazos y courier.
- [Política de reembolso](https://mariaignaciavalverde.cl/policies/refund-policy) y [Términos y condiciones](https://mariaignaciavalverde.cl/pages/terminos-y-condiciones): cambios en 30 días, garantía de 3 meses y razón social.

## Acceso comprobado

El `robots.txt` del sitio dice que el contenido público de productos, colecciones y páginas se puede consultar. Solo excluye carro, checkout, cuentas, pedidos y algunas URL de filtros y ordenamiento. El listado de productos respondió con normalidad (HTTP 200). La consulta se hizo desde el navegador, solo en modo lectura: no se agregaron productos al carro, no se iniciaron sesiones ni se hicieron pagos.

La tienda permite ordenar por "Más vendidos", lo que podría indicar qué se vende más. **No se usó**, porque `robots.txt` excluye las URL de ordenamiento (`/collections/*sort_by*`).

## Cómo se armó el CSV

- `precio_clp` es el precio más bajo entre las variantes; `precio_max_clp`, el más alto. Solo 2 fichas tienen precios distintos según la variante.
- `estado`: DISPONIBLE si al menos una variante está disponible, AGOTADO si ninguna lo está y PREVENTA si el nombre lo dice.
- `material` sale de la descripción de la ficha: "Plata + oro (enchape)" si menciona enchape, oro, gold, bicolor o dorado; "Plata" si menciona plata; si no, "No indicado".
- `piedra_o_perla` vale "si" cuando el nombre o la descripción mencionan perla, cuarzo, ónix, granate, circón, piedra, fumé, ágata, nácar u otras piedras.
- `publicado` es la fecha de publicación que informa la tienda. Puede corresponder a una republicación y no siempre a la fecha real de lanzamiento.
- No se guardaron fotos, reseñas, textos completos de las descripciones ni datos personales.

## Límites

- Es una foto del 18-10-2026: los precios, el stock y el surtido cambian.
- No hay ventas, costos, inventario ni lo que se vende en las tiendas físicas.
- El material y los motivos se clasificaron con reglas automáticas; 25 fichas quedaron con el material "No indicado".
- La comparación con septiembre usa los precios de la portada anotados el 23-09-2026 (12 piezas), no un catálogo completo de esa fecha.
