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
- **Supuesto a confirmar:** que la medalla de Covadonga y la Cruz de la Victoria son dos de los
  4 diseños de la Colección Astur. Faltan los nombres de los otros dos y de las 4 piezas del
  carrusel.

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

### Lo que falta para que la portada sea real

- Fotos: cuellos con las medallas puestas, productos sobre fondo piedra y retrato de Pili.
- Precios, plazo de fabricación a pedido, fecha límite de pedidos para Navidad, medio de pago y
  políticas de la tienda (ver [`politicas-tienda.md`](politicas-tienda.md)).
- Nombres de los diseños de la Colección Astur y de las otras 4 piezas.
