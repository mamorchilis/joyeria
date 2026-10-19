# Investigación de competencia

Estudio de las marcas que compiten con el proyecto o le sirven de referencia. Todas siguen el mismo formato, para poder compararlas en un solo tablero.

**Tablero:** abrir [`dashboard.html`](dashboard.html) con doble clic. Tiene una hoja de **resumen comparativo** y una hoja por cada competidor.

| Competidor | Carpeta | Catálogo | Revisión del sitio |
|---|---|---|---|
| Co Rivera | [`co-rivera/`](co-rivera/README.md) | 11-10-2026 | 18-10-2026 |
| Igna Valverde | [`igna-valverde/`](igna-valverde/README.md) | 18-10-2026 | 18-10-2026 |
| CBC Jewelry | [`cbc-jewelry/`](cbc-jewelry/README.md) | 19-10-2026 | 19-10-2026 |
| Milagritos de María | [`milagritos-de-maria/`](milagritos-de-maria/README.md) | 19-10-2026 | 19-10-2026 |

## Formato estándar de cada competidor

Cada competidor tiene su propia carpeta (nombre en minúsculas y con guiones, por ejemplo `nueva-marca/`) con estos archivos:

| Archivo | Qué contiene |
|---|---|
| `ficha.json` | Textos de la hoja: titular, ficha de marca, cómo opera, implicancias y observaciones. También la fecha de captura, el color de la marca en los gráficos y los productos que se dejan fuera del análisis. |
| `catalogo_publico.csv` | Un producto por fila. Columnas obligatorias: `producto`, `precio_clp`, `estado`, `url`. Opcionales: `precio_max_clp`, `precio_antes_clp` (precio tachado si está en oferta), `tipo_tienda`, `material`, `piedra_o_perla` (si/no), `publicado` (AAAA-MM-DD) y `stock_publicado`. |
| `README.md` | Resumen de lo encontrado. |
| `fuentes-y-limites.md` | Qué páginas se consultaron, cómo se obtuvo el catálogo y qué no incluye. |

Los temas de la sección "Cómo opera" (`modelo` en `ficha.json`) son siempre los mismos, para que la tabla comparativa cuadre: `produccion`, `plazo_entrega`, `despacho`, `envio_gratis`, `cambios`, `garantia`, `venta_fisica`, `captacion` y `plataforma`. Si un tema no se revisó, se deja fuera y el tablero muestra "Sin revisar".

## Cómo agregar un competidor o actualizar uno

1. Crear o actualizar la carpeta con los cuatro archivos. Se puede copiar `igna-valverde/ficha.json` como plantilla.
2. Desde la raíz del repositorio, ejecutar `python docs/referentes/generar_datos.py`. Esto actualiza los datos que van dentro de `dashboard.html`.
3. Abrir `dashboard.html` y revisar la nueva hoja.
4. Si cambian las conclusiones generales o los próximos pasos (preguntas para el taller, validaciones y decisiones), editar `resumen.json` y volver a ejecutar el script.

Los datos quedan dentro del mismo `dashboard.html`, así que el archivo se puede mandar solo (por WhatsApp o correo) y abre igual. El bloque entre `DATOS:INICIO` y `DATOS:FIN` lo escribe el script: no hay que editarlo a mano.

## Reglas comunes

- **Clasificación.** La categoría, el material y el motivo se asignan con las mismas reglas para todas las marcas (ver `generar_datos.py`). Si el CSV trae el tipo de producto de la tienda o el material declarado en la ficha, se usan esos datos. Si no, se deducen del nombre. Son etiquetas para orientarse y conviene revisarlas.
- **Exclusiones.** Las fichas con precio $0 y las que no son joyas ni accesorios (pagos, devoluciones, kits de limpieza, gift cards, aromas) quedan fuera de las estadísticas, pero siguen visibles en gris en el explorador.
- **Escalones de precio** (iguales en todas las hojas): menos de $50 mil, $50–79 mil, $80–109 mil, $110–149 mil, $150–219 mil, $220–399 mil y $400 mil o más.
- **Precio de cada ficha.** Se usa el precio publicado más bajo de sus variantes.
- **Lo que no hay.** No hay ventas, costos ni márgenes de ningún competidor. Que un precio sea alto o una ficha esté agotada no indica que se venda bien.
- **Forma de recopilar.** Solo páginas públicas y en modo lectura, respetando robots.txt y sin eludir bloqueos. No se guardan fotos, reseñas, datos personales ni textos completos de las fichas. Los diseños, fotos y textos de cada marca son de su propiedad: este material es para análisis interno, no para copiar.

## Otros archivos

- `co-rivera/dashboard.html`: primer tablero, solo de Co Rivera (11-10-2026). Lo reemplaza el tablero general, pero se conserva porque permite cargar un CSV de ventas.
