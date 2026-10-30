# Estado del proyecto

Última revisión documental: 2026-10-29.

## Punto de retorno (2026-10-26)

Resumen para retomar el trabajo en una sesión nueva. Al final de cada sesión, actualizar esta sección.

**Dónde quedó cada cosa**
- **Organización de carpetas:** desde el 2026-10-26 la documentación está en `docs/`, separada por área y numerada (`00_tablero`, `01_marca-y-marketing`, `02_producto`, `03_mercado`, `04_operaciones`, `05_ventas`, `06_finanzas`; `07_legal` se crea cuando tenga contenido). El mapa está en `docs/README.md`.
- **Tablero del proyecto:** `docs/00_tablero/dashboard.html`. Es un solo archivo, con los datos adentro: se abre con doble clic o se manda por WhatsApp, y tiene modo claro y modo oscuro propio. Tiene tres secciones:
  - *Análisis de competencia:* resumen comparativo y una hoja por cada uno de los 4 competidores (Co Rivera, Igna Valverde, CBC Jewelry y Milagritos de María).
  - *Definiciones de marca:* hoja de ruta (lo acordado, en curso y por definir) y nombre de la marca.
  - *Colección inicial:* una hoja por diseño. Por ahora, la medalla de la Virgen de Covadonga.
- **Tareas y recordatorio:** las tareas se ven y se editan en la app de tareas (`tareas-app/`, con usuario y contraseña para Pili y Juan Antonio) y quedan en `docs/00_tablero/tareas.json`. La lista parte de un borrador de Claude (2026-10-27): esas tareas llevan la etiqueta "Propuesta de Claude" hasta que los socios las aceptan o editan. De lunes a viernes a las 9:00 llega un correo con lo atrasado, lo de hoy y lo de los próximos 7 días (GitHub Actions + Gmail, gratis). Detalle en `docs/00_tablero/recordatorio-correo.md`.
- **Competencia:** `docs/03_mercado/competencia/`, con una carpeta por marca (`ficha.json`, `catalogo_publico.csv`, `README.md` y `fuentes-y-limites.md`), las conclusiones comparativas en `resumen.json` y el formato estándar explicado en `docs/03_mercado/competencia/README.md`.
- **Definiciones de marca:** `docs/01_marca-y-marketing/definiciones.json` (hoja de ruta) y `docs/01_marca-y-marketing/nombres.json` (datos del análisis de nombres; el texto completo está en `docs/01_marca-y-marketing/nombres.md`).
- **Contexto de negocio y CLAF:** `docs/01_marca-y-marketing/marca.md` (concepto y nombre) y `docs/04_operaciones/fabricacion.md` (criterios de taller y lo que ofrece CLAF).
- **Gastos:** `docs/06_finanzas/gastos/gastos.csv`, una fila por pago, con quién pagó. El resumen por socio y los vencimientos están en `docs/06_finanzas/gastos/README.md`.
- **Dominio y DNS:** `pilitrespalacios.cl` está en NIC Chile y vence el 2028-10-26. Su DNS está en Cloudflare (plan gratuito, servidores `adi` y `yisroel.ns.cloudflare.com`). Cloudflare confirmó la zona como activa el 2026-10-26, y ese día se comprobó que los servidores ya responden y que ambas direcciones llevan a Instagram. Desde el 2026-10-30 el dominio apunta a la tienda de Shopify: en Cloudflare quedaron el registro A de `pilitrespalacios.cl` → `23.227.38.65` y el CNAME de `www` → `shops.myshopify.com`, los dos en "Solo DNS" (sin proxy, como pide Shopify), y se borraron los registros de relleno y la regla que redirigía a Instagram. En Shopify, `pilitrespalacios.cl` es el dominio principal, con certificado de seguridad activo; `www` y `http` llevan a `https://pilitrespalacios.cl`. Todavía no hay correo con el dominio.
- **Tienda online:** se decidió vender por la web con Shopify y diseñar un tema propio desde este repositorio (2026-10-26). La tienda es `qe0efu-mp.myshopify.com` y se llama "Pili Trespalacios" (desde el 2026-10-29; antes "My Store"). Está en prueba gratis, sin plan pagado y protegida con contraseña. Está a nombre de la cuenta personal de un socio, la misma de Cloudflare, y hay que traspasarla a la empresa cuando exista. El tema está en `tienda/` y parte de Horizon, el tema gratuito de Shopify (versión del 2026-10-13). Para verlo en vivo: `shopify theme dev --store qe0efu-mp` desde `tienda/`, en una terminal interactiva porque pide la contraseña de la tienda, y abrir `http://127.0.0.1:9292`. El proyecto trae configurado el Shopify Dev MCP en `.mcp.json` (versión fija 1.16.1, sin envío de estadísticas a Shopify): da a Claude la documentación de Liquid y Horizon y valida archivos del tema con Theme Check. Se probó el 2026-10-29; marca un falso aviso en `sections/header.liquid` (el id `header-menu` repetido viene así de Horizon y es intencional). La maqueta de la portada (2026-10-29) espera el visto bueno de Pili; detalle en `docs/05_ventas/tienda-diseno.md`. Ya se programó en el tema lo decidido (menú, Colección Astur, carrusel, cómo llega tu joya y pie de página); para que se vea completo faltan tareas en el administrador de Shopify, listadas en ese mismo documento. Pendiente: medio de pago (la app de Webpay estaba solo en piloto; Mercado Pago sí funciona; confirmar la comisión extra de Shopify por usar pasarela externa), despachos y elegir un plan antes de abrir. **Etapa 1 del paso a producción (2026-10-30):** el tema de la marca quedó publicado como tema activo (se llama "Pili Trespalacios") y la tienda ya se ve en `https://pilitrespalacios.cl`, pero sigue con contraseña: quien entra ve la página "Muy pronto". La etapa 2, abrir la tienda, espera productos reales, pago, despachos, políticas, plan pagado y la empresa; antes hay que borrar los productos de prueba.
- **Modelos virtuales:** tres modelos ficticias aprobadas el 2026-10-26 (Antonia, 30; Inés, 45; Teresa, 60) y dos modelos hombres aprobados el 2026-10-27 (Tomás, 30; Rafael, 45) para mostrar las joyas. Decisiones en `docs/01_marca-y-marketing/modelos/modelos.md`, photobooks en `modelos/mujeres/` y `modelos/hombres/` (tabla en `modelos/photobooks.md`) y las instrucciones para otra IA en `modelos/brief-para-ia.md`. Falta la imagen del casting conjunto de las mujeres.
- **Colección inicial:** `docs/02_producto/coleccion/`, un `.md` y un `.json` por diseño. La medalla de Covadonga tiene 5 opciones, precios de referencia y una recomendación (sin decisión).

**Próximos pasos concretos**
1. **Confirmar el nombre** (Pili Trespalacios) con un abogado de marcas y solicitar el registro en INAPI (clases 14 y 35).
2. **Constituir la empresa.** Al hacerlo, traspasarle el dominio y la cuenta de Instagram.
3. **Tienda y correo:** diseñar el tema en `tienda/` (portada, producto, historia de la marca y contacto), cargar productos, elegir medio de pago y despacho, conectar `pilitrespalacios.cl` a Shopify desde Cloudflare (y borrar la redirección a Instagram) y definir el correo con el dominio.
4. **Identidad visual:** el 2026-10-29 Juan Antonio retomó el camino 2 de la propuesta de Claude: solo logotipo (sin isotipo, imagotipo ni la bajada "Santiago · Chile") y la paleta completa del camino 2, principalmente en blanco y negro. Esto reemplaza lo del 2026-10-26 (Pili la desarrollaba por su cuenta) y falta su visto bueno. Pendiente: tipografía de textos, qué se graba en las joyas, lema y archivos del logo en curvas. Detalle en `docs/01_marca-y-marketing/identidad-visual.md`.
5. **En paralelo:** cerrar los 6 diseños de partida (elegir la opción de la medalla de Covadonga y llevar sus preguntas a CLAF), definir el packaging y llevar a CLAF las preguntas pendientes (condiciones por escrito, costos por material, mínimos, plazos, esquema mixto de stock y pedidos, y si también fabrica para CBC).

**Cómo mantener el tablero**
- Si cambia una decisión, actualizar este documento y el del área correspondiente (`docs/01_marca-y-marketing/marca.md`, `docs/04_operaciones/fabricacion.md`, etc.), después los JSON de `docs/01_marca-y-marketing/`, `docs/02_producto/coleccion/` o `docs/03_mercado/competencia/`, y regenerar con `python docs/00_tablero/generar_dashboard.py` (desde la raíz del repositorio).
- Para sumar un competidor, seguir `docs/03_mercado/competencia/README.md`.
- Para verlo en el navegador: `python -m http.server 8124 --directory docs/00_tablero` y abrir `http://localhost:8124/dashboard.html`, o simplemente abrir el archivo.
- Antes de subir cambios, revisar que el tablero cargue sin errores en computador y en celular, en modo claro y oscuro.
- No guardar datos personales de terceros (por ejemplo, titulares de dominios o de marcas, o datos bancarios publicados por competidores).

## Objetivo
Desarrollar una marca propia de joyería artesanal en Chile y definir su propuesta de valor, fabricación y modelo comercial.

## Base conocida
- Categoría inicial: joyería artesanal en plata y bronce.
- También existe interés en explorar piezas en oro.
- Referencias estudiadas: Co Rivera (la principal), Igna Valverde, CBC Jewelry y Milagritos de María (ver `docs/03_mercado/competencia/`).
- Se busca un taller que fabrique a pedido para terceros y pueda actuar como aliado de producción.
- CLAF Goldsmith es el proveedor más probable para partir (ya hubo reuniones), pero todavía no hay confirmación formal ni contrato. Lo que ofrece, según las reuniones, está en `docs/04_operaciones/fabricacion.md`.

## Decisiones pendientes
1. Identidad de marca. El nombre ya está elegido (Pili Trespalacios, 26-10); falta confirmarlo con un abogado de marcas, registrarlo en INAPI y definir la identidad visual.
2. Público objetivo, posicionamiento y diferenciación (sobre todo de marca y, en parte, de diseño). En el casting de modelos (2026-10-26), Juan Antonio indicó el segmento ABC1 chileno.
3. Catálogo inicial y materiales. **En curso:** los socios están definiendo los 6 diseños de partida. Uno será la medalla de la Virgen de Covadonga en bronce y plata (opciones en `docs/02_producto/coleccion/medalla-covadonga.md`).
4. Búsqueda, evaluación y selección de fabricante. **En curso:** CLAF es el más probable; falta formalizar.
5. Costos, precios, márgenes y presupuesto.
6. Canales de venta y distribución.
7. Calendario y fecha tentativa de lanzamiento.
8. Reparto de responsabilidades entre las personas que llevan el proyecto.
9. Constitución de la empresa. Ya se puede hacer, porque el nombre está elegido.
10. Web y correo con el dominio: plataforma y forma de venta. El dominio y el Instagram ya existen.
11. Packaging: caja, bolsa, decoración, carta con mensaje y cuidados de la joya, y aroma.

## Lista de inicio de sesión
- [ ] Consultar los cambios recientes del repositorio.
- [ ] Leer `AGENTS.md`, `README.md` y `docs/README.md` (mapa de carpetas).
- [ ] Leer la sección **Punto de retorno** de este documento y abrir `docs/00_tablero/dashboard.html`.
- [ ] Confirmar si hay decisiones nuevas que incorporar a la documentación.
- [ ] Identificar el próximo asunto prioritario.

## Registro de decisiones
Añadir aquí las decisiones importantes con fecha, contexto y estado. No registrar una hipótesis como decisión confirmada sin validación explícita.

- **2026-10-10 — Prototipo de probador virtual (en desarrollo).** Se empezó una app web que
  muestra con la cámara cómo se ve la persona con una joya puesta, pensada primero para una
  tablet en un punto de venta y después para la tienda en línea. Hay dos joyas de prueba (un
  choker y un anillo). Es un prototipo: no está probado en una tablet y el realismo aún no es
  el definitivo. Detalle en `docs/05_ventas/probador-virtual.md`.

- **2026-10-18 — Formato estándar para estudiar competidores (vigente).** Cada competidor
  tiene una carpeta en `docs/03_mercado/competencia/` con los mismos archivos, y un tablero común
  (hoy en `docs/00_tablero/dashboard.html`) con una hoja de resumen comparativo y una hoja por
  empresa. Están Co Rivera e Igna Valverde (desde el 18-10) y CBC Jewelry y Milagritos de
  María (desde el 19-10). El tablero es un solo archivo, con los datos adentro, que se puede
  mandar por WhatsApp o correo. Las conclusiones de ese tablero son
  hipótesis: no hay datos de ventas ni costos de los competidores. Detalle en
  `docs/03_mercado/competencia/README.md`.

- **2026-10-19 — Lo que contó CLAF sobre sus clientes (información de la reunión, no un
  acuerdo).** CLAF dijo que fabrica para varias marcas y que no repite diseños: los ajusta,
  pero nunca hace uno igual. Según recuerdan los socios, entre esas marcas están Milagritos
  de María, Igna Valverde y Co Rivera; no recuerdan si nombró a CBC Jewelry. Los socios lo ven
  como algo positivo: CLAF puede mostrar diseños base que la marca ajuste. CLAF sigue en
  evaluación.

- **2026-10-19 — Más condiciones de CLAF (información de las reuniones, no un acuerdo
  firmado).** CLAF permite que cada marca presente el taller como propio (eso explica que
  Co Rivera, Igna y Milagritos digan tener "taller propio") y permite grabar la fabricación
  para redes sociales. El modelo 3D de cada marca no se repite con nadie más. Los socios ya
  vieron varios diseños base en persona, y cuánto ajustarlos lo decide la marca. Pendiente:
  dejar estas condiciones por escrito, costos por material, mínimos y plazos (ver la hoja
  "Hoja de ruta" del tablero). La diferenciación irá sobre todo por la marca y, en parte, por el
  diseño; cuánto diseño propio aún no se decide.

- **2026-10-19 — Criterio de fabricación precisado (decidido por los socios).** No se busca
  un taller que no venda nada propio, sino uno cuyos diseños propios no compitan directamente
  con la marca. CLAF vende por su cuenta solo diseños que no tiene con ninguna marca cliente,
  casi siempre de alta joyería (anillos de compromiso, argollas), así que cumple el criterio.
  CLAF sigue en evaluación como proveedor: faltan costos, plazos y condiciones por escrito.

- **2026-10-19 — Acuerdos tras las reuniones con CLAF (confirmado por los socios).** CLAF
  será, muy probablemente, el primer proveedor; no hay contrato todavía. Lo acordado:
  1. Los socios están definiendo **6 diseños** para comenzar.
  2. Está pendiente definir el **nombre de la marca**.
  3. Con el nombre definido, se **constituirá la empresa**.
  4. Después: **crear la marca, la web y las redes sociales**.
  5. También pendiente: definir el **packaging** (caja, bolsa, decoración, carta con mensaje
     y cuidados de la joya, y aroma).
  El orden importa: nombre, luego empresa, luego marca, web y redes.

- **2026-10-19 — Candidatos de nombre analizados (sin decisión).** Candidatos: del Pilar
  Joyas, Pili Trespalacios, San Salvatore (pueblo del nonno de Pili), Parpaglione y
  Trespalacios (apellidos de Pili). Los socios prefieren los dos primeros. Se revisaron
  dominios, uso visible en la web, encaje con el segmento y registro en INAPI. En INAPI,
  Parpaglione y Pili Trespalacios están despejados en joyería; del Pilar choca con "Maria
  Pilar" y "EL PILAR", y San Salvatore con "Salvatore Ferragamo" (clase 14). Faltan
  Instagram y una prueba con clientes. Análisis y pendientes en `docs/01_marca-y-marketing/nombres.md`.

- **2026-10-19 — El tablero pasa a ser del proyecto completo (vigente).** Se movió a
  `docs/00_tablero/dashboard.html` y tiene dos secciones: *Análisis de competencia* (resumen y una hoja
  por competidor) y *Definiciones de marca* (hoja de ruta con lo acordado, en curso y por
  definir, y el análisis del nombre). Los datos de la segunda sección están en
  `docs/01_marca-y-marketing/definiciones.json` y `docs/01_marca-y-marketing/nombres.json`; si cambia una decisión, hay que
  actualizar este documento, `marca-joyas.md` (hoy repartido en `docs/01_marca-y-marketing/marca.md` y `docs/04_operaciones/fabricacion.md`) y esos archivos, y regenerar con
  `python docs/00_tablero/generar_dashboard.py`.

- **2026-10-19 — Modo oscuro propio en el tablero (vigente).** En celulares con modo oscuro,
  el navegador oscurecía la página a su manera y los colores de las barras dejaban de
  coincidir con la leyenda. El tablero ahora trae su propia paleta oscura y aclara los colores
  de cada marca sobre fondo oscuro; el modo claro no cambió.

- **2026-10-19 — Medalla de la Virgen de Covadonga (material decidido; diseño en análisis).**
  Una de las 6 piezas de partida será una medalla de la Santina, en **bronce y plata**
  (decidido por los socios). La idea es darse a conocer en el círculo del Estadio Español y
  generar caja. Se investigaron los modelos que se venden en España y Chile y se proponen 5
  opciones: Clásica de Asturias, Santina de Silueta, Doble Faz con la Cruz de la Victoria,
  La Santa Cueva y Bicolor. La recomendación (no decidida) es la Clásica redibujada, con la
  Cruz de la Victoria en el reverso y con cadena o cinta de terciopelo azul. El precio
  sugerido es una hipótesis tomada de la competencia (clásica: $55–65 mil en bronce y $85–99
  mil en plata) y espera los costos de CLAF. Detalle en `docs/02_producto/coleccion/medalla-covadonga.md`
  y en la hoja *Colección inicial* del tablero.

- **2026-10-26 — Nombre de la marca: Pili Trespalacios (decidido por los socios).** Se
  consideró primero del Pilar Joyas y se cambió el mismo día; no se registró el motivo. Ese
  mismo día se tomó `@pilitrespalacios` en Instagram y se registró `pilitrespalacios.cl` en
  NIC Chile, por 2 años ($19.980, pagado por Juan Antonio; vence el 2028-10-26). El DNS
  quedó en Cloudflare, en su plan gratuito, para conectar después la web y el correo sin
  depender de una plataforma. El dominio y la cuenta de Instagram se adelantaron a la
  empresa porque son baratos y evitan que otro los tome. Se recomienda traspasarlos a la
  empresa cuando se constituya (recomendación, no decidida). Pendiente: abogado de marcas, registro en INAPI y evaluar también
  `pilartrespalacios.cl` y `pilitrespalacios.com`. Los gastos se registran desde ahora
  en `docs/06_finanzas/gastos/`.

- **2026-10-26 — Modelos virtuales aprobadas (decidido por Juan Antonio).** Tres mujeres
  ficticias para mostrar las joyas: Antonia (30), Inés (45) y Teresa (60), generadas con
  ChatGPT, con photobooks sin joyas (verano, invierno, traje de baño y detalles de manos, orejas
  y cuello). Son referencias generadas, no medidas reales: revisar continuidad y fidelidad de
  la joya en cada foto. Detalle en `docs/01_marca-y-marketing/modelos/`.

- **2026-10-26 — Documentación ordenada por área (vigente).** `docs/` se separó en carpetas
  numeradas por área. `marca-joyas.md` se repartió en `docs/01_marca-y-marketing/marca.md`
  (concepto y nombre) y `docs/04_operaciones/fabricacion.md` (taller y CLAF); sus acuerdos y
  pendientes ya estaban en este documento. El tablero pasó a `docs/00_tablero/`. Las rutas
  citadas en las entradas anteriores se actualizaron a la estructura nueva.
- **2026-10-27 — Recordatorio diario de tareas por correo (vigente).** Se eligió un correo de
  lunes a viernes a las 9:00, enviado por GitHub Actions desde Gmail, porque es gratis y no
  depende de tener un computador encendido. WhatsApp se descartó por el costo de su API. La
  lista vive en `docs/00_tablero/tareas.json`; sus fechas y responsables son un borrador que los
  socios van a ajustar. Detalle y configuración en `docs/00_tablero/recordatorio-correo.md`.
- **2026-10-27 — App de tareas con usuario y contraseña (vigente).** Para que Pili no tenga que
  usar GitHub, las tareas se editan en una app web publicada gratis en Cloudflare Workers. Un
  "portero" revisa la contraseña y guarda los cambios en el repositorio con un token que nadie
  más ve. La lista pasó de `tareas.md` a `tareas.json`. Detalle en `tareas-app/README.md`.
- **2026-10-27 — Avances informados por Juan Antonio al revisar las tareas.** Los 6 diseños de
  partida están cerrados y la opción de la medalla de Covadonga está elegida (falta registrar
  cuál en `docs/02_producto/coleccion/`). Ya se pidió a CLAF la cotización de todos los diseños.
  Los despachos, por ahora, los hacen los socios. El pago será sí o sí dentro de Shopify; falta
  elegir el medio y confirmar su comisión. La prueba gratis de Shopify vencería en unos dos días
  (dato aproximado; Shopify avisará).
- **2026-10-27 — Tareas como tablero Kanban (vigente).** Cada tarea tiene estado: por hacer,
  en progreso, lista o eliminada (recuperable). En `tareas.json` el campo `hecha` se reemplazó
  por `estado`.
- **2026-10-27 — Modelos hombres aprobados (decidido por Juan Antonio).** Se suman Tomás (30) y
  Rafael (45), con la misma dirección que las modelos mujeres. Las imágenes de las mujeres pasaron
  de `modelos/imagenes/` a `modelos/mujeres/` y las de los hombres están en `modelos/hombres/`.
- **2026-10-29 — Colección Astur de lanzamiento (dicho por Juan Antonio).** La tienda parte con
  la **Colección Astur, de 4 diseños**, y **4 productos más** que se muestran después (en la
  portada, en un carrusel). **Diferencia con lo documentado:** el 2026-10-27 se habló de "6 diseños
  de partida"; ahora serían 8 (4 + 4). Falta confirmar si son los mismos diseños reordenados y qué
  piezas van en Astur (en la maqueta se supuso que la medalla de Covadonga y la Cruz de la Victoria).
  También pidió no nombrar Santiago en la web y dejar Chile solo en Nuestra historia. Detalle en
  `docs/05_ventas/tienda-diseno.md`.
- **2026-10-29 — Productos de partida, menú y carga de productos (dicho por Juan Antonio).**
  **Colección Astur:** Cruz de la Victoria en bronce con circones, Cruz de la Victoria en plata
  lisa, Medalla Virgen de Covadonga en bronce y Medalla Virgen de Covadonga en plata. **Otros 4:**
  Cadena clásica en bronce, Cadena clásica en plata, Tiara en bronce y Colgante de bronce con
  piedra ónix. La Tiara va en *Cadenas y collares*. Las cruces y las medallas se venden con o sin
  cadena (no con cinta de terciopelo, que era una recomendación). **Menú:** *Colecciones* (por ahora Colección Astur) y *Joyas*, con las categorías
  *Cadenas y collares* y *Colgantes*. **Regla:** todo producto lleva nombre, colección, categoría,
  descripción, tamaño y al menos 3 fotos. Se carga desde `catalogo/` (planilla + fotos + revisor);
  falta el script que sube a Shopify. **Pago:** en línea, con pasarela. **Plazo a pedido:** 15 a 20
  días corridos. En la web se dice "entre 15 y 20 días", sin aclarar que son corridos (pedido de
  Juan Antonio).
- **2026-10-29 — Categorías nuevas (dicho por Juan Antonio).** Se suman *Anillos*, *Aros*,
  *Esclavas* y *Pulseras*. *Cadenas y collares* sigue siendo una sola categoría (se le preguntó al
  verlas separadas en un referente y eligió mantenerlas juntas). Las nuevas ya existen como
  colecciones en Shopify y en la planilla, pero entran al menú *Joyas* recién cuando tengan su
  primera pieza, para no mostrar páginas vacías.
- **2026-10-29 — Políticas de la tienda (análisis, sin decisión).** Las de Co Rivera e Igna
  Valverde no se pueden copiar tal cual: son textos protegidos, describen otro negocio y algunas
  reglas parecen bajo la ley vigente (garantía de 3 meses en vez de 6, sin devolución de dinero,
  retracto). Se toman la estructura y las buenas ideas para escribir textos propios. Detalle y
  decisiones pendientes en `docs/05_ventas/politicas-tienda.md`.
