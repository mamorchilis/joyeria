# Fuentes y límites

Consulta registrada el 19-10-2026.

## Fuentes

- [Portada](https://cbcjewelry.cl/): colecciones y temporada vigente.
- [Listado público de productos](https://cbcjewelry.cl/products.json): es el listado estándar de las tiendas Shopify. Se leyeron las 544 fichas (precio y precio anterior por variante, disponibilidad, etiquetas, tipo, descripción y fecha de publicación).
- [Sobre la marca](https://cbcjewelry.cl/pages/abou-us): origen y forma de fabricación.
- [Términos y condiciones](https://cbcjewelry.cl/pages/terminos-y-condiciones): razón social, domicilio y plazos de despacho.
- [Política de cambios](https://cbcjewelry.cl/pages/politicas-de-cambio).
- Colecciones [Archive Sale](https://cbcjewelry.cl/collections/archive-sale), [A pedido](https://cbcjewelry.cl/collections/a-pedido) y [Men's](https://cbcjewelry.cl/collections/men-s).

## Acceso comprobado

`robots.txt` permite consultar productos, colecciones y páginas públicas. Solo excluye carro, checkout, cuentas y algunas URL de filtros y ordenamiento. El listado de productos respondió con normalidad (HTTP 200). Todo se hizo en modo lectura desde el navegador. No se usó el orden "Más vendidos", porque `robots.txt` excluye esas URL. La página de política de envíos de la tienda da error 404.

## Cómo se armó el CSV

- `precio_clp` es el precio más bajo entre las variantes; `precio_max_clp`, el más alto; `precio_antes_clp`, el precio tachado cuando la pieza está en oferta.
- `estado`: A PEDIDO si la ficha tiene la etiqueta "A PEDIDO"; si no, DISPONIBLE o AGOTADO según la disponibilidad de sus variantes.
- `material` sale primero del nombre (plata/silver, bronce, bicolor, cuero) y, si el nombre no lo dice, de la descripción.
- `piedra_o_perla` vale "si" cuando se menciona ónix, cuarzo, ágata, topacio, ojo de tigre, obsidiana, coral u otras piedras.
- `publicado` es la fecha de publicación que informa la tienda (puede reflejar republicaciones).
- No se guardaron fotos, reseñas, textos completos ni datos personales.

## Límites

- Es una foto del 19-10-2026.
- No hay ventas, costos ni inventario. Que una pieza esté agotada no indica que se venda bien.
- La mediana incluye los precios rebajados de la liquidación.
- Clasificación automática de categoría, material y motivo: 6 fichas quedaron con el material "No indicado".
