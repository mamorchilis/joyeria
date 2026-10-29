# Mapa de la documentación

Cada área tiene su carpeta, numerada para que aparezcan en orden en el explorador. Una carpeta
nueva se crea cuando tiene su primer documento; los números reservados evitan reordenar después.

| Carpeta | Qué va ahí | Hoy contiene |
| --- | --- | --- |
| [`estado-proyecto.md`](estado-proyecto.md) | Punto de retorno, decisiones pendientes y registro de decisiones con fecha. Es el documento para retomar. | — |
| [`00_tablero/`](00_tablero/) | El tablero del proyecto (`dashboard.html`), la lista de tareas y el recordatorio por correo. | Tablero, lista de tareas (`tareas.json`), [app y recordatorio por correo](00_tablero/recordatorio-correo.md) |
| [`01_marca-y-marketing/`](01_marca-y-marketing/) | Concepto, nombre, identidad visual, modelos y fotos, redes sociales y contenido. | [`marca.md`](01_marca-y-marketing/marca.md), brief, nombres, hoja de ruta (`definiciones.json`), [`modelos/`](01_marca-y-marketing/modelos/) |
| [`02_producto/`](02_producto/) | Colección, diseños, materiales y fichas de cada pieza. | [`coleccion/`](02_producto/coleccion/) (medalla de Covadonga, Cruz de la Victoria) |
| [`03_mercado/`](03_mercado/) | Competencia, referentes y estudios de clientes. | [`competencia/`](03_mercado/competencia/README.md) (una carpeta por marca) e investigación inicial |
| [`04_operaciones/`](04_operaciones/) | Taller y proveedores, packaging, despacho, inventario. | [`fabricacion.md`](04_operaciones/fabricacion.md) (criterios y CLAF) |
| [`05_ventas/`](05_ventas/) | Canales, tienda en línea (decisiones, no el código), precios de venta, punto de venta. | [`probador-virtual.md`](05_ventas/probador-virtual.md), [`tienda-diseno.md`](05_ventas/tienda-diseno.md), [`politicas-tienda.md`](05_ventas/politicas-tienda.md) |
| [`06_finanzas/`](06_finanzas/) | Gastos, costos, márgenes, presupuesto y capital. | [`gastos/`](06_finanzas/gastos/README.md) |
| `07_legal/` (por crear) | Empresa, registro de marca en INAPI, contratos con proveedores. | — |

Fuera de `docs/` están los proyectos con código: `tienda/` (tema de Shopify), `catalogo/`
(planilla y fotos para cargar productos),
`Realidad_aumentada/` (probador virtual) y `tareas-app/` (app de tareas). La tienda debe seguir en su propia carpeta para que
funcione `shopify theme dev`.

## Reglas

- Un tema va en el área de quien lo tiene que decidir o mantener. Si toca dos áreas, va en la
  principal y la otra lo enlaza.
- Las decisiones con fecha se registran en `estado-proyecto.md`; el documento del área guarda
  el detalle.
- Al mover un archivo, actualizar los enlaces que apuntan a él (buscar la ruta antigua en el
  repositorio) y, si es un JSON del tablero, regenerarlo y comprobar que abre.
