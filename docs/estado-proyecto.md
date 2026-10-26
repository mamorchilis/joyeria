# Estado del proyecto

Última revisión documental: 2026-10-26.

## Punto de retorno (2026-10-26)

Resumen para retomar el trabajo en una sesión nueva. Al final de cada sesión, actualizar esta sección.

**Dónde quedó cada cosa**
- **Tablero del proyecto:** `docs/dashboard.html`. Es un solo archivo, con los datos adentro: se abre con doble clic o se manda por WhatsApp, y tiene modo claro y modo oscuro propio. Tiene tres secciones:
  - *Análisis de competencia:* resumen comparativo y una hoja por cada uno de los 4 competidores (Co Rivera, Igna Valverde, CBC Jewelry y Milagritos de María).
  - *Definiciones de marca:* hoja de ruta (lo acordado, en curso y por definir) y nombre de la marca.
  - *Colección inicial:* una hoja por diseño. Por ahora, la medalla de la Virgen de Covadonga.
- **Competencia:** `docs/referentes/`, con una carpeta por marca (`ficha.json`, `catalogo_publico.csv`, `README.md` y `fuentes-y-limites.md`), las conclusiones comparativas en `resumen.json` y el formato estándar explicado en `docs/referentes/README.md`.
- **Definiciones de marca:** `docs/marca/definiciones.json` (hoja de ruta) y `docs/marca/nombres.json` (datos del análisis de nombres; el texto completo está en `docs/marca/nombres.md`).
- **Contexto de negocio y CLAF:** `marca-joyas.md`.
- **Gastos:** `docs/gastos/gastos.csv`, una fila por pago, con quién pagó. El resumen por socio y los vencimientos están en `docs/gastos/README.md`.
- **Dominio y DNS:** `pilitrespalacios.cl` está en NIC Chile y vence el 2028-10-26. Su DNS está en Cloudflare (plan gratuito, servidores `adi` y `yisroel.ns.cloudflare.com`). Todavía no hay web ni correo con el dominio.
- **Colección inicial:** `docs/coleccion/`, un `.md` y un `.json` por diseño. La medalla de Covadonga tiene 5 opciones, precios de referencia y una recomendación (sin decisión).

**Próximos pasos concretos**
1. **Confirmar el nombre** (Pili Trespalacios) con un abogado de marcas y solicitar el registro en INAPI (clases 14 y 35).
2. **Constituir la empresa.** Al hacerlo, traspasarle el dominio y la cuenta de Instagram.
3. **Web y correo:** elegir la plataforma (tienda o página de presentación) y el correo con el dominio, y conectarlos desde Cloudflare. Mientras no haya web, se puede redirigir el dominio a Instagram desde Cloudflare.
4. **Identidad visual:** logo, colores y tipografía.
5. **En paralelo:** cerrar los 6 diseños de partida (elegir la opción de la medalla de Covadonga y llevar sus preguntas a CLAF), definir el packaging y llevar a CLAF las preguntas pendientes (condiciones por escrito, costos por material, mínimos, plazos, esquema mixto de stock y pedidos, y si también fabrica para CBC).

**Cómo mantener el tablero**
- Si cambia una decisión, actualizar este documento y `marca-joyas.md`, después los JSON de `docs/marca/`, `docs/coleccion/` o `docs/referentes/`, y regenerar con `python docs/generar_dashboard.py` (desde la raíz del repositorio).
- Para sumar un competidor, seguir `docs/referentes/README.md`.
- Para verlo en el navegador: `python -m http.server 8124 --directory docs` y abrir `http://localhost:8124/dashboard.html`, o simplemente abrir el archivo.
- Antes de subir cambios, revisar que el tablero cargue sin errores en computador y en celular, en modo claro y oscuro.
- No guardar datos personales de terceros (por ejemplo, titulares de dominios o de marcas, o datos bancarios publicados por competidores).

## Objetivo
Desarrollar una marca propia de joyería artesanal en Chile y definir su propuesta de valor, fabricación y modelo comercial.

## Base conocida
- Categoría inicial: joyería artesanal en plata y bronce.
- También existe interés en explorar piezas en oro.
- Referencias estudiadas: Co Rivera (la principal), Igna Valverde, CBC Jewelry y Milagritos de María (ver `docs/referentes/`).
- Se busca un taller que fabrique a pedido para terceros y pueda actuar como aliado de producción.
- CLAF Goldsmith es el proveedor más probable para partir (ya hubo reuniones), pero todavía no hay confirmación formal ni contrato. Lo que ofrece, según las reuniones, está en `marca-joyas.md`.

## Decisiones pendientes
1. Identidad de marca. El nombre ya está elegido (Pili Trespalacios, 26-10); falta confirmarlo con un abogado de marcas, registrarlo en INAPI y definir la identidad visual.
2. Público objetivo y posicionamiento.
3. Catálogo inicial y materiales. **En curso:** los socios están definiendo los 6 diseños de partida. Uno será la medalla de la Virgen de Covadonga en bronce y plata (opciones en `docs/coleccion/medalla-covadonga.md`).
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
- [ ] Leer `AGENTS.md`, `README.md` y `marca-joyas.md`.
- [ ] Leer la sección **Punto de retorno** de este documento y abrir `docs/dashboard.html`.
- [ ] Confirmar si hay decisiones nuevas que incorporar a la documentación.
- [ ] Identificar el próximo asunto prioritario.

## Registro de decisiones
Añadir aquí las decisiones importantes con fecha, contexto y estado. No registrar una hipótesis como decisión confirmada sin validación explícita.

- **2026-10-10 — Prototipo de probador virtual (en desarrollo).** Se empezó una app web que
  muestra con la cámara cómo se ve la persona con una joya puesta, pensada primero para una
  tablet en un punto de venta y después para la tienda en línea. Hay dos joyas de prueba (un
  choker y un anillo). Es un prototipo: no está probado en una tablet y el realismo aún no es
  el definitivo. Detalle en `docs/probador-virtual.md`.

- **2026-10-18 — Formato estándar para estudiar competidores (vigente).** Cada competidor
  tiene una carpeta en `docs/referentes/` con los mismos archivos, y un tablero común
  (hoy en `docs/dashboard.html`) con una hoja de resumen comparativo y una hoja por
  empresa. Están Co Rivera e Igna Valverde (desde el 18-10) y CBC Jewelry y Milagritos de
  María (desde el 19-10). El tablero es un solo archivo, con los datos adentro, que se puede
  mandar por WhatsApp o correo. Las conclusiones de ese tablero son
  hipótesis: no hay datos de ventas ni costos de los competidores. Detalle en
  `docs/referentes/README.md`.

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
  Instagram y una prueba con clientes. Análisis y pendientes en `docs/marca/nombres.md`.

- **2026-10-19 — El tablero pasa a ser del proyecto completo (vigente).** Se movió a
  `docs/dashboard.html` y tiene dos secciones: *Análisis de competencia* (resumen y una hoja
  por competidor) y *Definiciones de marca* (hoja de ruta con lo acordado, en curso y por
  definir, y el análisis del nombre). Los datos de la segunda sección están en
  `docs/marca/definiciones.json` y `docs/marca/nombres.json`; si cambia una decisión, hay que
  actualizar este documento, `marca-joyas.md` y esos archivos, y regenerar con
  `python docs/generar_dashboard.py`.

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
  mil en plata) y espera los costos de CLAF. Detalle en `docs/coleccion/medalla-covadonga.md`
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
  en `docs/gastos/`.
