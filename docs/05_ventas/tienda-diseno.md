# Diseño de la tienda en línea

Decisiones y propuestas de diseño para la tienda en Shopify. El código del tema está en `tienda/`
y lo técnico (plataforma, dominio, pago) está en [`docs/estado-proyecto.md`](../estado-proyecto.md).

## Cómo se avanza (propuesta del 2026-10-29)

1. Fijar el estilo de la web a partir de la identidad visual.
2. Hacer la maqueta de la portada.
3. **Aprobarla con Pili**, que tiene la última palabra en lo visual.
4. Programarla en `tienda/` con el Shopify Dev MCP y revisarla en el navegador.
5. Revisión final de accesibilidad, uso en celular y velocidad (Lighthouse).

Vamos en el paso 3.

## Maqueta de la portada (2026-10-29)

**Estado: propuesta, sin aprobar.** Está en un lienzo de Claude:
<https://claude.ai/artifact/DcKGJqeLLYCxbU9q8AT7yn> (privado: para que Pili la vea hay que
compartirla desde el menú *Share* de la página). Trae la versión de escritorio y la de celular.
También se pueden comparar dos tipografías y dos colores para la franja de Nuestra historia.

### Versión 2 (2026-10-29, comentarios de Juan Antonio)

- **La portada lanza la Colección Astur** (4 diseños). Después viene un carrusel con las otras
  4 piezas.
- **Las fotos de arriba son solo cuellos**, para que las modelos no se lleven el protagonismo.
  Cuando estén las fotos con las medallas puestas, se reemplazan.
- **Fuera de la portada:** "Tres orígenes. Una sola mano."
- **No se nombra Santiago.** Chile aparece solo en Nuestra historia. El aviso de despacho dice
  "despacho a domicilio" en vez de "a todo Chile".

### Versión 3 (2026-10-29, comentarios de Juan Antonio)

- **Menú:** *Colecciones* (Colección Astur) y *Joyas* (Cadenas y collares, Colgantes). Se abren al
  pasar el mouse.
- **Productos reales** en la Colección Astur y en el carrusel (lista en `docs/estado-proyecto.md`
  y en `catalogo/productos.xlsx`).
- **La Santina** se ofrece con cadena o sin cadena.
- **Cómo llega tu joya:** pago en línea con pasarela, 15 a 20 días a pedido y despacho a domicilio
  con aviso por correo. Ya no se presenta como regalo.

### Referentes (del brief de marca)

- **CBC Jewelry:** el nivel de calidad buscado. Se tomó la calma: fondo claro, fotos editoriales
  grandes y mucho aire. Es competencia directa, así que no se copia.
- **Co Rivera:** referente de estilo. Se tomó lo práctico: decir claro que las piezas se hacen a
  pedido, cuánto demoran y cómo llegan.

### Lo que propone

- **Colores y logotipo:** los acordados en [`identidad-visual.md`](../01_marca-y-marketing/identidad-visual.md),
  sin cambios. Para textos chicos en gris se usa un tono más oscuro que *muro* (`#6B665E`), porque
  *muro* sobre *cal* no alcanza a leerse bien en letra chica.
- **Tipografía de los textos:** Newsreader (venía del camino 2), con Tenor Sans para títulos chicos,
  menú y botones. Es propuesta; la alternativa en la maqueta es Spectral.
- **Secciones, en orden:** aviso de despacho, encabezado, portada de la Colección Astur, sus
  4 diseños, medalla de Covadonga, carrusel "Más joyas", nuestra historia (Italia, Asturias y
  Chile), cómo llega tu joya (a pedido), quién diseña (Pili) y pie de página.

## Programado en el tema (2026-10-29)

Se pasó a `tienda/` lo ya decidido, antes del visto bueno de Pili a la maqueta completa. Si ella
pide cambios, se ajustan ahí mismo.

- **Estilo:** colores de la marca, Newsreader para textos y títulos, Tenor Sans para títulos
  chicos, menú y botones (`config/settings_data.json` y `snippets/marca.liquid`).
- **Encabezado:** aviso "Despacho a domicilio", logotipo al centro y menú a la izquierda, sin
  selector de país ni idioma (`sections/header-group.json`).
- **Portada** (`templates/index.json`), en este orden: Colección Astur con dos fotos, sus
  4 diseños, la Santina (con cadena o sin cadena), carrusel "Más joyas" y "Hecha a pedido, para
  ti" en tres pasos. El plazo dice "entre 15 y 20 días", sin "corridos".
- **Pie de página:** nombre, una línea sobre la marca, menús "Tienda" y "Ayuda" e Instagram
  (`sections/footer-group.json`).
- Quedan fuera por ahora: Nuestra historia y Quién diseña.
- Se validó con `shopify theme check` sin errores.
- **Visto en el navegador el 2026-10-30**, como tema sin publicar "Pili Trespalacios - prueba"
  (vista previa: <https://qe0efu-mp.myshopify.com?preview_theme_id=165622939905>; pide la
  contraseña de la tienda). Se subió con
  `shopify theme push --theme 165622939905 --path tienda --store qe0efu-mp`. El tema publicado
  sigue siendo el Horizon original hasta que se decida abrir.
- **Ajustes después de verlo:** los textos fijos que venían en inglés (página de contraseña, 404,
  carrito, "También te puede gustar") quedaron en español; mientras falten fotos, se ve un
  recuadro color *piedra* en vez de los dibujos de Shopify; el logotipo usa Tenor Sans de verdad
  (antes le ganaba el estilo de Horizon) y en celular es más chico, para que el carro no quede
  fuera de la pantalla.

### Portada rehecha igual a la maqueta (2026-10-30)

Juan Antonio vio la portada armada con las piezas de Horizon y pidió que quedara **igual a la
maqueta**. Las piezas de Horizon no permitían copiarla bien (ancho de página, botones
redondeados, tarjetas, precios de la Santina, pie de página), así que la portada y el pie se
hicieron con secciones propias que repiten las medidas de la maqueta:

| Sección | Archivo | Qué hace |
|---|---|---|
| Portada | `sections/pt-portada.liquid` | Textos a la izquierda; dos fotos cuadradas, la segunda 72 px más abajo |
| Colección | `sections/pt-coleccion.liquid` | Título y bajada, y 4 productos de la colección en 4 columnas |
| Destacado | `sections/pt-destacado.liquid` | La Santina: foto, textos, una fila por versión con su precio y botón |
| Carrusel | `sections/pt-carrusel.liquid` | "Más joyas", con flechas; no se muestra mientras la colección esté vacía |
| Pasos | `sections/pt-pasos.liquid` | "Hecha a pedido, para ti" en tres columnas con línea arriba |
| Pie | `sections/pt-pie.liquid` | Fondo negro, marca, Tienda, Ayuda y Síguenos |

- La tarjeta de producto (`snippets/pt-tarjeta.liquid`) muestra foto 4:5 sobre piedra, nombre,
  material (la etiqueta del producto que no es de colección) y precio; si hay versiones con
  distinto precio, dice "Desde".
- Estilos comunes en `snippets/marca.liquid`: ancho de 1280 px, botones cuadrados, encabezado
  de 88 px con línea piedra abajo y sin ícono de cuenta; en celular, sin lupa y con el nombre
  centrado a 15 px, como la maqueta.
- **Fotos provisorias:** los cuellos de Inés, Teresa y Antonia, recortados de sus fichas de
  modelo (`docs/01_marca-y-marketing/modelos/mujeres/`), igual que en la maqueta. Están en
  *Contenido > Archivos* de Shopify (`cuello-…-provisoria.jpg`). Son de baja resolución y hay que
  cambiarlas por las fotos reales con las medallas puestas.
- **Diferencias que quedan, a propósito:**
  - el aviso de arriba no dice la fecha de Navidad, porque está por definir;
  - no están Nuestra historia ni Quién diseña, que quedaron fuera por ahora;
  - los precios de la Santina aparecen cuando se cargue `medalla-covadonga-bronce`;
  - "Más joyas" aparece con el primer producto fuera de la Colección Astur.

### Prueba completa con un producto (2026-10-30)

Se subió con `catalogo/subir_a_shopify.py` un producto de prueba publicado, "Medalla de prueba
(no comprar)" (`medalla-prueba-borrar`), con dos versiones y 3 fotos de relleno. Resultado:

- Aparece en la portada (Cuatro diseños de lanzamiento), en la Colección Astur y en su ficha.
- Al elegir *Sin cadena* el precio cambia de $45.000 a $30.000, y se agrega al carrito con el
  total correcto. No se probó el pago.
- El menú *Colecciones* se abre al pasar el mouse.
- Ese producto ya se borró, junto con sus fotos.

### Tienda llena con 8 productos de prueba (2026-10-30)

Para ver cómo queda la portada llena, se subieron con el script 8 productos publicados, con
fotos ficticias dibujadas (una joya simple sobre fondo piedra y la leyenda "FOTO DE PRUEBA"):

| Código | Producto | Colección o categoría | Precio |
|---|---|---|---|
| `cruz-victoria-bronce-prueba` | Cruz de la Victoria, bronce | Colección Astur | $38.000 |
| `cruz-victoria-plata-prueba` | Cruz de la Victoria, plata | Colección Astur | $42.000 |
| `medalla-covadonga-bronce` | Medalla Virgen de Covadonga, bronce | Colección Astur | $45.000 / $30.000 |
| `medalla-covadonga-plata-prueba` | Medalla Virgen de Covadonga, plata | Colección Astur | $52.000 / $37.000 |
| `cadena-clasica-bronce-prueba` | Cadena clásica, bronce | Cadenas y collares | $22.000 |
| `cadena-clasica-plata-prueba` | Cadena clásica, plata | Cadenas y collares | $28.000 |
| `colgante-onix-prueba` | Colgante con piedra ónix, bronce | Colgantes | $39.000 |
| `esclava-lisa-plata-prueba` | Esclava lisa, plata | Esclavas | $46.000 |

- Todos dicen "(prueba)" en el nombre. Los precios son inventados.
- `medalla-covadonga-bronce` usa el código real, para que la Santina de la portada muestre sus
  precios. Al subir la medalla real con la planilla, ese producto se actualiza en vez de duplicarse.
- Las colecciones Colección Astur y Más joyas quedaron ordenadas por fecha de creación (la más
  antigua primero), para respetar el orden de la maqueta. Al cargar los productos reales, hay que
  subirlos en el orden en que deben aparecer.
- **Antes de abrir la tienda hay que borrar los 7 que terminan en `-prueba`**, junto con sus
  fotos, y reemplazar la medalla de bronce por la real.
- Revisado en el navegador: las 4 piezas de la Colección Astur, los precios de la Santina, el
  carrusel con sus flechas y el celular sin desborde.

### Submenú en una fila horizontal (2026-10-30)

A pedido de Juan Antonio, las subcategorías del menú (por ejemplo, Cadenas y collares y Colgantes
dentro de Joyas) se muestran en el computador una al lado de la otra, en una franja delgada bajo el
encabezado, en vez de una debajo de otra como venían en Horizon y en la maqueta. Así, cuando haya
más subcategorías, el menú no tapa la página. Si no caben en una fila, pasan a una segunda.

- Está en `tienda/snippets/marca.liquid`. En el celular no cambia nada: el menú lateral sigue igual.
- Revisado en el navegador a 1024 px: las dos subcategorías actuales quedan en la misma línea y,
  simulando 8, también caben en una sola fila. No se pudo sacar captura de pantalla del menú
  abierto; se midió la posición de cada enlace.
- Juan Antonio la encontró alta: se le quitó aire arriba y abajo (12 px en vez de 20 px) y la
  franja pasó de 71 px a 55 px de alto.

### Tareas en el administrador de Shopify

El tema lee estas cosas desde la tienda, así que hay que crearlas allí:

1. **Nombre de la tienda (hecho el 2026-10-29):** "Pili Trespalacios", en *Configuración >
   General > Datos de contacto de la tienda* (el logotipo es ese nombre en texto).
2. **Colecciones (hechas el 2026-10-29)**, todas automáticas:
   - `coleccion-astur`: productos con la etiqueta `coleccion-astur`.
   - `mas-joyas`: productos activos, excluyendo la Colección Astur. Un producto en borrador no
     aparece hasta publicarlo.
   - `cadenas-y-collares`: tipo de producto igual a "Cadenas y collares".
   - `colgantes`: tipo de producto igual a "Colgantes".
   - `anillos`, `aros`, `esclavas` y `pulseras`: igual, por tipo de producto. Todavía no tienen
     piezas y no están en el menú.
   - Al cargar un producto, el tipo y la etiqueta deben escribirse exactamente así.
3. **Menú principal (hecho el 2026-10-29)** (`main-menu`): *Colecciones* (lleva a todas las
   colecciones) con Colección Astur dentro; *Joyas* (lleva a todos los productos) con Cadenas y
   collares y Colgantes dentro. Se abren al pasar el mouse.
4. **Menú del pie** (`footer`): por ahora solo *Contacto*, con la página de contacto que trae
   Shopify. Despachos, Cambios y garantía y Términos y condiciones se agregan cuando estén escritas
   las políticas (ver [`politicas-tienda.md`](politicas-tienda.md)), para no enlazar páginas vacías.
5. **Fotos de la portada:** subir los cuellos en el editor del tema (portada y Santina). Hasta
   entonces se ven recuadros color piedra.
6. **Productos:** cargarlos con la planilla de `catalogo/`. El botón "Ver la medalla" apunta a
   `medalla-covadonga-bronce`.
7. **Idioma (hecho el 2026-10-30):** el español es el idioma principal de la tienda, en
   *Configuración > Idiomas*. Para agregarlo, Shopify instaló su aplicación gratuita *Translate &
   Adapt*. El inglés quedó fuera. Con esto, botones, carrito, pago y correos salen en español.
8. **Formato del precio (hecho el 2026-10-30):** `${{amount_no_decimals_with_comma_separator}}`
   (y lo mismo con "CLP" al final donde muestra la moneda), en *Configuración > General >
   Moneda > Cambiar formato*. Así se ve $45.000 y no $45,000.

### Lo que falta para que la portada sea real

- Fotos: cuellos con las medallas puestas, productos sobre fondo piedra y retrato de Pili.
- Precios, plazo de fabricación a pedido, fecha límite de pedidos para Navidad, medio de pago y
  políticas de la tienda (ver [`politicas-tienda.md`](politicas-tienda.md)).
- Descripciones, tamaños y precios de las 8 piezas (cruces y medallas, con y sin cadena).
