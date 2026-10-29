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
- Se validó con `shopify theme check` sin errores. **No se ha visto en el navegador**: falta
  correr `shopify theme dev --store qe0efu-mp` desde `tienda/`.

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
   - Al cargar un producto, el tipo y la etiqueta deben escribirse exactamente así.
3. **Menú principal (hecho el 2026-10-29)** (`main-menu`): *Colecciones* (lleva a todas las
   colecciones) con Colección Astur dentro; *Joyas* (lleva a todos los productos) con Cadenas y
   collares y Colgantes dentro. Se abren al pasar el mouse.
4. **Menú del pie** (`footer`): por ahora solo *Contacto*, con la página de contacto que trae
   Shopify. Despachos, Cambios y garantía y Términos y condiciones se agregan cuando estén escritas
   las políticas (ver [`politicas-tienda.md`](politicas-tienda.md)), para no enlazar páginas vacías.
5. **Fotos de la portada:** subir los cuellos en el editor del tema (portada y Santina). Hasta
   entonces se ven recuadros vacíos.
6. **Productos:** cargarlos con la planilla de `catalogo/`. El botón "Ver la medalla" apunta a
   `medalla-covadonga-bronce`.

### Lo que falta para que la portada sea real

- Fotos: cuellos con las medallas puestas, productos sobre fondo piedra y retrato de Pili.
- Precios, plazo de fabricación a pedido, fecha límite de pedidos para Navidad, medio de pago y
  políticas de la tienda (ver [`politicas-tienda.md`](politicas-tienda.md)).
- Descripciones, tamaños y precios de las 8 piezas (cruces y medallas, con y sin cadena).
