# Probador virtual de joyas

Prototipo de una app web que muestra, con la cámara, cómo se ve la persona con una joya
puesta. Este documento reúne cómo correrla, cómo está armada, lo aprendido y lo pendiente,
para poder continuar el trabajo desde otro dispositivo o con otro asistente.

Quien lleva este trabajo no programa: las explicaciones van en lenguaje llano y lo que se
entrega tiene que poder probarse con una cámara común.

## Dónde está cada cosa

- `Realidad_aumentada/app/`: el probador. HTML, CSS y JavaScript sin compilar ni dependencias
  locales; MediaPipe se carga desde internet al abrir la app.
- `Realidad_aumentada/herramientas/`: scripts de Python (Pillow y numpy) que preparan las
  fotos de cada joya.
- `Realidad_aumentada/Imagenes_joyas_para_empezar_desarrollo/<Producto>/`: fotos originales,
  una carpeta por producto.
- `Realidad_aumentada/pruebas/`: fotos de referencia para comparar el resultado.

## Cómo correr y probar

La cámara solo funciona en `localhost` o con https.

```bash
cd Realidad_aumentada
python -m http.server 8123
```

Abrir `http://localhost:8123/app/`. Parámetros útiles en la dirección:

- `?joya=<id>`: parte con esa joya elegida (los id están en `app/catalogo.json`).
- `?foto=<ruta>`: usa una foto fija en vez de la cámara. Es la forma de verificar un cambio
  sin tener a alguien delante. Ejemplos:
  `?foto=../pruebas/referencia_choker_puesto.webp` y
  `?joya=anillo_onix&foto=../Imagenes_joyas_para_empezar_desarrollo/Anillo_cuadrado_onix/anillo_onix_bronce_carrusel.webp`
- `?depurar`: dibuja lo que midió el seguimiento del cuello (verde: bordes del cuello;
  rojo: su base; celeste: fondo del escote) y muestra un recuadro con el tamaño de la imagen,
  qué reconoció el modelo (piel, ropa, pelo) y, si no midió el cuello, por qué.
- `?cpu`: el modelo del cuello corre sin la tarjeta gráfica. Es más lento; sirve para
  descartar que una falla esté en la gráfica de un dispositivo.

Versión publicada, para abrir desde cualquier dispositivo: https://barreirovaldajos.github.io/probador-joyas/

Sale de un repositorio aparte, `barreirovaldajos/probador-joyas`, que contiene solo lo que hay
en `Realidad_aumentada/app/`. Para actualizarla después de subir cambios a `main`:

```bash
git push https://github.com/barreirovaldajos/probador-joyas.git "$(git subtree split --prefix Realidad_aumentada/app main)":refs/heads/main
```

## Cómo está armada la app

Cada **tipo de joya** tiene su propio seguimiento y su propio dibujo. `catalogo.json` lista
las joyas; el campo `tipo` decide cuál se usa. Para sumar una joya de un tipo que ya existe
basta con preparar sus imágenes y agregar su ficha.

- `app.js`: interfaz, ciclo de video y todo lo del **choker rígido**.
- `anillo.js`: todo lo del **anillo de sello**.
- `comun.js`: filtros de suavizado y el trozo de sombreador `FUNDIR`, que iguala el dibujo a
  la imagen de la cámara (negro y blanco de la escena, luz, grano).

### Choker rígido (`tipo: "choker_rigido"`)

- **Seguimiento:** segmentador multiclase de MediaPipe (`selfie_multiclass`), que clasifica
  cada píxel como piel del cuerpo, piel de la cara, ropa, pelo o accesorio. El cuello es la
  piel entre el mentón y la ropa. Se mide su ancho y su base (donde el ancho deja de ser
  parejo), y el fondo del escote si lo cierra una polera.
- **Dibujo:** la foto cenital del aro, recortada, se usa como textura de una cinta que se
  curva en 3D alrededor del cuello. Se dibuja el aro completo; la parte de atrás solo se ve
  sobre la ropa (la tapan piel, cara y pelo).
- **Ficha:** `holgura` (ancho interior del aro en anchos de cuello), `bajada` (cuánto baja su
  centro bajo la base del cuello) e `inclinacion_grados`.
- **Preparación:** `herramientas/preparar_joya.py <foto> <id>` genera `textura.png` y
  `perfil.json`.

### Anillo de sello (`tipo: "anillo_sello"`)

- **Seguimiento:** detector de manos de MediaPipe (21 puntos por mano). El anillo va entre el
  nudillo y la primera articulación del dedo elegido. El dorso del dedo se calcula con la
  línea de los nudillos. El grosor del dedo se estima como fracción del ancho de la palma.
- **Dibujo:** modelo 3D armado con las medidas de la ficha (banda que se angosta hacia la
  palma, placa rectangular arriba). La cara de la placa es una foto real enderezada; el metal
  refleja un entorno de estudio mezclado con la imagen de la cámara. Los huesos de la mano son
  cilindros invisibles que tapan el anillo cuando pasan por delante.
- **Preparación:** `herramientas/preparar_anillo.py cara …` y `… miniatura …` (ver la ayuda al
  inicio del script).

## Lo aprendido, para no repetirlo

- **No calibrar a ciegas.** Varias rondas se perdieron ajustando contra capturas recortadas
  que llegaban por chat. Antes de entregar un cambio hay que verificarlo con `?foto=` sobre
  una imagen de referencia, y decir con claridad qué se probó y qué no.
- **La silueta del cuerpo no sirve para el cuello.** El primer intento usaba el detector de
  pose y su silueta: los hombros quedan fuera de cuadro en una webcam y lo que medía era la
  mandíbula. El segmentador multiclase sí ve el cuello.
- **Un choker envuelve el cuello.** Es más ancho que el cuello, descansa en su base y pasa por
  detrás. Dibujar solo el arco delantero, del ancho del cuello, se ve como una pegatina.
- **Mostrar el mismo cuadro que se analiza.** El video se copia a un lienzo y de ahí sale
  tanto lo que se ve como lo que se analiza; si no, la joya va atrasada al mover la mano.
- **La mano se suaviza poco; el cuello, mucho.** El cuello casi no se mueve: lleva mediana,
  filtro lento, descarte de saltos y zona muerta. La mano necesita respuesta inmediata.
- **Los ajustes del panel no se guardan entre recargas.** Guardarlos dejó valores viejos
  pegados que arruinaban versiones nuevas.
- **En algunos teléfonos el modelo del cuello falla en la tarjeta gráfica sin avisar.** En un
  Samsung S25 FE con Chrome respondía que toda la imagen era fondo. Por eso, al crearlo, se le
  muestra una foto con una persona (`app/persona_de_prueba.jpg`); si no la ve, se vuelve a
  crear sin la gráfica. El detector de manos no tuvo ese problema.
- **La profundidad de los hombros del detector de pose es ruido**: se intentó girar el aro
  con ella y lo hacía temblar.

## Decisiones y preferencias de quien lleva el proyecto

- El primer uso es una **tablet en un punto de venta**; después, la tienda en línea.
- Quiere el mayor realismo posible, comparando siempre contra fotos reales de la joya puesta.
- Le gusta poder ajustar: el panel de ajustes parte abierto y se puede ocultar.
- Organiza las fotos en una carpeta por producto.
- Los valores actuales del choker (`holgura` 1.11, `inclinacion_grados` 32) salen de un
  ajuste hecho a mano, frente a la cámara, por quien lleva el proyecto.

## Pendiente

- **Tamaño real de las joyas.** Hoy el choker y el anillo se escalan al cuello y al dedo de
  la persona. Lo correcto es usar milímetros reales: con una medida, o con un objeto de tamaño
  conocido (una tarjeta) en la foto de producto. Para el choker, dos indicios apuntan a unos
  140 mm de diámetro interior.
- **La foto de producto del choker no es de la pieza real**: tiene cabezas lisas y la real
  las tiene con textura de puntos. Falta una foto cenital de la pieza verdadera.
- **Modelos 3D fieles** (fotogrametría, generación con IA o modelador) para acercarse al
  realismo total. La app todavía no carga modelos 3D externos.
- **Funcionar sin internet**: MediaPipe y sus modelos se bajan de internet al abrir.
- **Cabeza girada** (choker): la mandíbula tapa el cuello y la medida se degrada.
- **Pelo suelto sobre el cuello** y **ropa de color parecido a la piel** confunden al
  segmentador.
- **Anillo:** no hay pulgar, la palma no tapa el anillo, y sus medidas (placa de 30 × 22 mm,
  17,5 mm de diámetro interior) están estimadas desde las fotos.
- Nada de esto se ha probado en una tablet real.

## Publicación

La versión en línea se publica con GitHub Pages desde `barreirovaldajos/probador-joyas`. Está
en ese repositorio y no en el compartido porque activar Pages requiere permiso de
administración, que en el repositorio compartido solo tiene la cuenta compartida. Si algún día
se prefiere publicarla desde el repositorio compartido, basta con activar Pages ahí y cambiar
el destino del comando de arriba.
