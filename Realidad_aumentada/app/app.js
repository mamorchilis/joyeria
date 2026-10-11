// Probador virtual: dibuja la joya elegida sobre el video, siguiendo a la persona.
//
// Cada tipo de joya tiene su propio seguimiento y su propio dibujo. Aquí viven la interfaz,
// el ciclo de video y los chokers; los anillos están en anillo.js.
//
// Un choker rígido es un aro plano, así que la foto cenital sirve como textura de una
// cinta que se curva en 3D alrededor del cuello: el largo se acorta con la perspectiva
// pero el grosor del tubo y de las cabezas se mantiene. El aro es más ancho que el cuello y
// descansa en su base: se dibuja completo, y la parte que pasa por detrás queda tapada por
// el cuello y la cabeza de la persona.

import { FUNDIR, MEDIAPIPE, Filtro, compilar, limitar, rad, suave } from "./comun.js";
import { AnilloSello, PintorAnillo, crearDetectorManos, olvidarManos, seguirManos } from "./anillo.js";

// Modelo que clasifica cada píxel: fondo, pelo, piel del cuerpo, piel de la cara, ropa, accesorios.
const MODELO_SEGMENTOS = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite";
const PIEL_CUERPO = 2, PIEL_CARA = 3, ROPA = 4, ACCESORIO = 5;

// Ancho de cuello creíble, como fracción del ancho de la imagen; fuera de esto se midió otra
// cosa (un brazo, la persona pegada a la cámara).
const CUELLO_EN_IMAGEN = [0.06, 0.7];
// La base del cuello es donde sus costados dejan de correr parejos: el ancho de la piel se
// aparta esto del ancho del cuello, porque empieza la ropa o se abren los hombros.
const FIN_DEL_CUELLO = 0.08;
// Filas de cuello que hay que ver antes de buscar dónde termina.
const FILAS_MINIMAS = 10;
// Cuánto pueden bajar las cabezas del aro (en anchos de cuello) del borde de una polera.
const BAJO_EL_ESCOTE = 0;
// Un pelo, una mano o la mandíbula tapan cuello y lo hacen medir más angosto, nunca más
// ancho: el ancho sube rápido y baja lento (segundos).
const ANCHO_SUBE_S = 0.4, ANCHO_BAJA_S = 2.5;
// Una medida que salta más que esto (en anchos de cuello) respecto de la anterior se descarta,
// salvo que se repita varios cuadros seguidos: entonces la persona se movió de verdad.
const SALTO_POSICION = 0.08, SALTO_ANCHO = 0.1, CUADROS_PARA_CREER = 5;
// Zona muerta, en anchos de cuello: mientras la medida no se aleje más que esto de lo que
// se está mostrando, la joya no se mueve nada.
const QUIETO_POSICION = 0.012, QUIETO_ANCHO = 0.015;
// Sin medir el cuello durante este tiempo, se deja de mostrar la joya.
const SEGUNDOS_A_CIEGAS = 1.5;
// El modelo trabaja a 256 px. Se le entrega la imagen ya reducida a este ancho: así el grano
// de la cámara se promedia en vez de colarse, y leer la máscara cuesta menos.
const ANCHO_ANALISIS = 512;
// ?depurar dibuja sobre la imagen lo que midió el seguimiento.
const DEPURAR = new URLSearchParams(location.search).has("depurar");
// ?cpu hace que el modelo del cuello corra sin la tarjeta gráfica: más lento, pero sirve para
// descartar que la falla esté en la gráfica de un dispositivo.
const SIN_GPU = new URLSearchParams(location.search).has("cpu");

const SEGMENTOS = 288;
const ARCO_GRADOS = 180; // el aro completo: de la nuca a la nuca pasando por el frente
const SEGUNDOS_SIN_PERSONA = 0.6;
// Cuánto se difumina un borde en la imagen de una cámara común, en píxeles de la imagen.
const NITIDEZ_CAMARA_PX = 0.7;

const $ = (id) => document.getElementById(id);
const escena = $("escena"), video = $("video"), cuadro = $("cuadro"), foto = $("foto"), lienzo = $("lienzo");
const aviso = $("aviso"), bandeja = $("bandeja"), panel = $("ajustes");

// ---------------------------------------------------------------- Dibujo

const VERTICES = `#version 300 es
in vec2 aPos;
in vec2 aUv;
in vec2 aFx; // profundidad (positiva hacia la cámara), luz
in vec3 aTubo; // hacia dónde mira el borde de la cinta en pantalla, y posición a lo ancho
uniform vec2 uTam;
uniform vec2 uDespl;
out vec2 vUv;
out vec2 vFx;
out vec3 vTubo;
out vec2 vPantalla;
void main() {
  vTubo = aTubo;
  vPantalla = (aPos + uDespl) / uTam;
  vec2 p = vPantalla * 2.0 - 1.0;
  gl_Position = vec4(p.x, -p.y, 0.0, 1.0);
  vUv = aUv;
  vFx = aFx;
}`;

const FRAGMENTOS = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vFx;
in vec3 vTubo;
in vec2 vPantalla;
uniform sampler2D uTex;
uniform sampler2D uOclusor; // 1 donde no se ve lo que pasa por detrás del cuello
uniform float uSombra; // 0 = joya, >0 = opacidad de la sombra
uniform float uDesenfoque;
out vec4 color;
${FUNDIR}
void main() {
  vec4 c = texture(uTex, vUv, uDesenfoque);
  // El tramo del aro que va por detrás solo se ve donde no lo tapa la persona.
  float detras = smoothstep(0.04, -0.04, vFx.x);
  float tapado = smoothstep(0.3, 0.7, texture(uOclusor, vPantalla).r);
  float visible = 1.0 - detras * tapado;
  if (uSombra > 0.0) {
    color = vec4(0.0, 0.0, 0.0, c.a * visible * uSombra);
  } else {
    // La foto es plana: al tubo se le da volumen aclarando lo que mira hacia arriba y
    // oscureciendo lo que mira hacia abajo y sus bordes. Las cabezas, más anchas, quedan igual.
    float ancho = clamp(vTubo.z, -1.0, 1.0);
    float enTubo = 1.0 - smoothstep(0.9, 1.4, abs(vTubo.z));
    float volumen = mix(1.0, 0.98 + 0.3 * (-vTubo.y * ancho) - 0.14 * ancho * ancho, enTubo);
    color = vec4(fundir(c.rgb * vFx.y * volumen), 1.0) * (c.a * visible);
  }
}`;

class Pintor {
  constructor(canvas) {
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, antialias: true });
    if (!gl) throw new Error("Este navegador no soporta WebGL2.");
    this.gl = gl;
    const prog = (this.prog = compilar(gl, VERTICES, FRAGMENTOS));
    gl.useProgram(prog);
    this.u = Object.fromEntries(
      ["uTam", "uDespl", "uTex", "uOclusor", "uSombra", "uDesenfoque", "uNiveles", "uLuz", "uTiempo"].map((n) => [n, gl.getUniformLocation(prog, n)]),
    );
    const n = (SEGMENTOS + 1) * 2;
    this.pos = new Float32Array(n * 2);
    this.uv = new Float32Array(n * 2);
    this.fx = new Float32Array(n * 2);
    this.tubo = new Float32Array(n * 3);
    this.bufers = {};
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    for (const [nombre, tamano] of [["aPos", 2], ["aUv", 2], ["aFx", 2], ["aTubo", 3]]) {
      const buf = gl.createBuffer();
      const loc = gl.getAttribLocation(prog, nombre);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, tamano, gl.FLOAT, false, 0, 0);
      this.bufers[nombre] = buf;
    }
    gl.bindVertexArray(null);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    gl.uniform1i(this.u.uTex, 0);
    gl.uniform1i(this.u.uOclusor, 1);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    this.oclusor = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.oclusor);
    for (const [clave, valor] of [
      [gl.TEXTURE_MIN_FILTER, gl.LINEAR],
      [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
      [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
      [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
    ]) gl.texParameteri(gl.TEXTURE_2D, clave, valor);
  }

  // oclusor = { datos (un byte por píxel), ancho, alto }, o null si no hay máscara.
  subirOclusor(oclusor) {
    const gl = this.gl;
    const { datos, ancho, alto } = oclusor ?? { datos: new Uint8Array(1), ancho: 1, alto: 1 };
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.oclusor);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, ancho, alto, 0, gl.RED, gl.UNSIGNED_BYTE, datos);
    gl.activeTexture(gl.TEXTURE0);
  }

  crearTextura(imagen) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imagen);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  subir(nombre, datos, uso) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufers[nombre]);
    gl.bufferData(gl.ARRAY_BUFFER, datos, uso);
  }

  limpiar() {
    const gl = this.gl;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  // c = { x, y, escala (px/mm), giro, lado, inclinacion }
  // escena: { luz, negro, blanco, tiempo } de la imagen de la cámara (ver FUNDIR).
  dibujar(joya, c, oclusor, escena) {
    const gl = this.gl;
    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
    this.subirOclusor(oclusor);
    gl.uniform2f(this.u.uNiveles, escena.negro, escena.blanco);
    gl.uniform1f(this.u.uLuz, escena.luz);
    gl.uniform1f(this.u.uTiempo, escena.tiempo);
    joya.calcularCinta(c, this.pos, this.fx, this.tubo);
    this.subir("aPos", this.pos, gl.DYNAMIC_DRAW);
    this.subir("aFx", this.fx, gl.DYNAMIC_DRAW);
    this.subir("aTubo", this.tubo, gl.DYNAMIC_DRAW);
    if (this.joyaCargada !== joya) {
      joya.calcularUv(this.uv);
      this.subir("aUv", this.uv, gl.STATIC_DRAW);
      joya.textura ??= this.crearTextura(joya.imagen);
      this.joyaCargada = joya;
    }
    gl.bindTexture(gl.TEXTURE_2D, joya.textura);
    gl.uniform2f(this.u.uTam, gl.canvas.width, gl.canvas.height);
    const n = (SEGMENTOS + 1) * 2;
    // Sombra de contacto sobre la piel: la misma cinta, desenfocada y corrida hacia abajo.
    gl.uniform2f(this.u.uDespl, 0, 2.2 * c.escala);
    gl.uniform1f(this.u.uSombra, 0.34);
    gl.uniform1f(this.u.uDesenfoque, 3.0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    gl.uniform2f(this.u.uDespl, 0, 0);
    gl.uniform1f(this.u.uSombra, 0);
    gl.uniform1f(this.u.uDesenfoque, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    gl.bindVertexArray(null);
  }
}

// ---------------------------------------------------------------- Joya

class ChokerRigido {
  constructor(ficha, perfil, imagen) {
    Object.assign(this, ficha);
    this.perfil = perfil;
    this.imagen = imagen;
    this.miniatura = imagen.src;
    // Se calibra con el diámetro interior, que es el que tiene que calzar en el cuello.
    this.mmPorPx = perfil.diametro_mm / (2 * (perfil.radio_px - perfil.semi_tubo_px));
    this.semiCintaPx = perfil.semi_max_px + 6;
    this.radios = this.radiosPorGrado();
  }

  // Radio central del aro por grado (0° = frente), suavizado y completado en la abertura.
  radiosPorGrado() {
    const medido = new Map(this.perfil.radios);
    const grados = [...medido.keys()];
    const crudo = [];
    for (let g = -180; g <= 180; g++) {
      if (medido.has(g)) {
        crudo.push(medido.get(g));
        continue;
      }
      const antes = Math.max(...grados.filter((x) => x < g));
      const despues = Math.min(...grados.filter((x) => x > g));
      const t = (g - antes) / (despues - antes);
      crudo.push(medido.get(antes) * (1 - t) + medido.get(despues) * t);
    }
    return crudo.map((_, i) => {
      let suma = 0, n = 0;
      for (let k = -8; k <= 8; k++) {
        if (crudo[i + k] !== undefined) {
          suma += crudo[i + k];
          n++;
        }
      }
      return suma / n;
    });
  }

  // Ancho interior del aro de costado a costado, en mm: lo que tiene que abrazar el cuello.
  get anchoInteriorMm() {
    return (this.radioPx(-90) + this.radioPx(90) - 2 * this.perfil.semi_tubo_px) * this.mmPorPx;
  }

  radioPx(grado) {
    const i = limitar(grado + 180, 0, 360);
    const a = Math.floor(i), b = Math.min(a + 1, 360);
    return this.radios[a] + (this.radios[b] - this.radios[a]) * (i - a);
  }

  calcularUv(uv) {
    const { centro, ancho, alto } = this.perfil;
    for (let i = 0; i <= SEGMENTOS; i++) {
      const grado = -ARCO_GRADOS + (2 * ARCO_GRADOS * i) / SEGMENTOS;
      const phi = rad(grado), r = this.radioPx(grado);
      for (const [k, lado] of [[0, 1], [1, -1]]) {
        const rr = r + lado * this.semiCintaPx;
        uv[(i * 2 + k) * 2] = (centro[0] + rr * Math.sin(phi)) / ancho;
        uv[(i * 2 + k) * 2 + 1] = (centro[1] + rr * Math.cos(phi)) / alto;
      }
    }
  }

  // Proyecta el aro inclinado sobre la pantalla y arma la cinta de triángulos.
  calcularCinta(c, pos, fx, tubo) {
    const sinT = Math.sin(c.inclinacion), cosT = Math.cos(c.inclinacion);
    const sinL = Math.sin(c.lado), cosL = Math.cos(c.lado);
    const sinG = Math.sin(c.giro), cosG = Math.cos(c.giro);
    const puntos = [];
    for (let i = 0; i <= SEGMENTOS; i++) {
      const grado = -ARCO_GRADOS + (2 * ARCO_GRADOS * i) / SEGMENTOS;
      const phi = rad(grado), r = this.radioPx(grado) * this.mmPorPx;
      // Aro en el plano horizontal, con el frente (z) hacia la cámara y caído hacia el pecho.
      const x0 = r * Math.sin(phi), z0 = r * Math.cos(phi);
      const x = x0 * cosL + z0 * cosT * sinL;
      const z = -x0 * sinL + z0 * cosT * cosL;
      const y = z0 * sinT; // hacia abajo en pantalla
      puntos.push({
        x: c.x + c.escala * (x * cosG - y * sinG),
        y: c.y + c.escala * (x * sinG + y * cosG),
        fondo: z / r,
      });
    }
    const semi = this.semiCintaPx * this.mmPorPx * c.escala;
    for (let i = 0; i <= SEGMENTOS; i++) {
      const p = puntos[i];
      const a = puntos[Math.max(i - 1, 0)], b = puntos[Math.min(i + 1, SEGMENTOS)];
      let nx = -(b.y - a.y), ny = b.x - a.x;
      const largo = Math.hypot(nx, ny) || 1;
      nx /= largo;
      ny /= largo;
      // La normal apunta hacia afuera del aro, igual que el borde exterior de la textura.
      if (nx * (p.x - c.x) + ny * (p.y - c.y) < 0) {
        nx = -nx;
        ny = -ny;
      }
      // Los costados y la parte de atrás reciben menos luz que el frente.
      const luz = 0.7 + 0.3 * suave(p.fondo, -0.4, 0.7);
      for (const [k, lado] of [[0, 1], [1, -1]]) {
        const j = (i * 2 + k) * 2;
        pos[j] = p.x + nx * semi * lado;
        pos[j + 1] = p.y + ny * semi * lado;
        fx[j] = p.fondo;
        fx[j + 1] = luz;
        // ±1 justo en el borde del tubo; la cinta sigue más allá para dar lugar a las cabezas.
        tubo.set([nx, ny, (lado * this.semiCintaPx) / this.perfil.semi_tubo_px], (i * 2 + k) * 3);
      }
    }
  }
}

async function cargarChoker(ficha) {
  const carpeta = `joyas/${ficha.id}`;
  const perfil = await (await fetch(`${carpeta}/perfil.json`)).json();
  const imagen = new Image();
  imagen.src = `${carpeta}/textura.png`;
  await imagen.decode();
  return new ChokerRigido(ficha, perfil, imagen);
}

const CARGADORES = {
  choker_rigido: cargarChoker,
  anillo_sello: (ficha) => new AnilloSello(ficha).cargar(),
};

async function cargarCatalogo() {
  const fichas = await (await fetch("catalogo.json")).json();
  return Promise.all(fichas.map((ficha) => CARGADORES[ficha.tipo](ficha)));
}

// ---------------------------------------------------------------- Seguimiento

// Con qué corre el modelo del cuello; lo muestra ?depurar.
let motorDelCuello = "";

// En algunos teléfonos el modelo corre en la tarjeta gráfica sin dar error, pero responde que
// toda la imagen es fondo. Por eso, antes de usarlo, se le muestra una foto con una persona:
// si no la ve, se vuelve a crear sin la gráfica, que es más lento pero funciona en todos.
async function crearDetector(modo) {
  const { FilesetResolver, ImageSegmenter } = await import(`${MEDIAPIPE}/vision_bundle.mjs`);
  const archivos = await FilesetResolver.forVisionTasks(`${MEDIAPIPE}/wasm`);
  const crear = (motor) => {
    motorDelCuello = motor === "GPU" ? "con gráfica" : "sin gráfica";
    return ImageSegmenter.createFromOptions(archivos, {
      baseOptions: { modelAssetPath: MODELO_SEGMENTOS, delegate: motor },
      runningMode: modo,
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    });
  };
  if (SIN_GPU) return crear("CPU");
  try {
    const detector = await crear("GPU");
    if (await veAUnaPersona(detector, modo)) return detector;
    detector.close();
  } catch (error) {
    console.warn("El modelo del cuello no pudo usar la gráfica:", error);
  }
  return crear("CPU");
}

async function veAUnaPersona(detector, modo) {
  const persona = new Image();
  persona.src = "persona_de_prueba.jpg";
  await persona.decode();
  // En modo video cada imagen lleva su instante; este queda antes que cualquier cuadro real.
  const mascara = (modo === "VIDEO" ? detector.segmentForVideo(persona, 1) : detector.segment(persona)).categoryMask;
  const categorias = mascara.getAsUint8Array();
  let noFondo = 0;
  for (const categoria of categorias) if (categoria !== 0) noFondo++;
  mascara.close();
  return noFondo > categorias.length * 0.05;
}

const reducida = document.createElement("canvas");

function reducir(fuente, ancho, alto) {
  const k = Math.min(ANCHO_ANALISIS / ancho, 1);
  const w = Math.round(ancho * k), h = Math.round(alto * k);
  if (reducida.width !== w || reducida.height !== h) Object.assign(reducida, { width: w, height: h });
  const ctx = reducida.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(fuente, 0, 0, w, h);
  return reducida;
}

// El cuello casi no se mueve aunque la cabeza sí: filtros lentos en reposo, que se sueltan
// cuando el movimiento es sostenido.
const filtros = {
  x: new Filtro(0.35, 0.025),
  y: new Filtro(0.35, 0.025),
  fondo: new Filtro(0.35, 0.025),
};

// Lo que se sabe del cuello de la persona que está frente a la cámara.
const cuelloVisto = { ancho: null, t: 0, ultimo: null, medida: null, rechazos: 0, mostrado: {} };

function olvidarPersona() {
  Object.values(filtros).forEach((f) => f.reiniciar());
  Object.assign(cuelloVisto, { ancho: null, ultimo: null, medida: null, rechazos: 0, mostrado: {} });
}

// ¿La medida nueva es continuación de la anterior, o un salto suelto de la máscara?
function esCreible(medida) {
  const previa = cuelloVisto.medida;
  const cerca =
    !previa ||
    (Math.hypot(medida.x - previa.x, medida.y - previa.y) < SALTO_POSICION * previa.ancho &&
      Math.abs(medida.ancho - previa.ancho) < SALTO_ANCHO * previa.ancho);
  if (!cerca && ++cuelloVisto.rechazos < CUADROS_PARA_CREER) return false;
  cuelloVisto.rechazos = 0;
  cuelloVisto.medida = medida;
  return true;
}

// Zona muerta: lo mostrado solo se mueve cuando el valor se aleja más que `radio`.
function asentar(clave, valor, radio) {
  const previo = cuelloVisto.mostrado[clave] ?? valor;
  return (cuelloVisto.mostrado[clave] = valor - limitar(valor - previo, -radio, radio));
}

// Por qué no se pudo medir el cuello en el último cuadro; lo muestra ?depurar.
let motivoSinCuello = "";

function sinCuello(motivo) {
  motivoSinCuello = motivo;
  return null;
}

// Mide el cuello sobre la máscara de categorías: la piel que queda bajo la cara, entre el
// mentón y la ropa. Devuelve, en píxeles de la máscara:
//   x, y    eje del cuello y altura de su base (donde se junta con los hombros o la ropa)
//   ancho   ancho del cuello
//   fondo   altura del borde inferior del escote, si lo cierra una polera
// o null si no hay un cuello a la vista.
function medirCuello(mascara) {
  const cat = mascara.getAsUint8Array();
  const w = mascara.width, h = mascara.height;
  const paso = Math.max(Math.round(h / 360), 1);
  // Un collar que la persona ya lleva puesto se clasifica como accesorio: cuenta como cuello.
  const esCuello = (x, y) => {
    const c = cat[y * w + x];
    return c === PIEL_CUERPO || c === ACCESORIO;
  };

  // El cuello se busca bajo la cara: entre sus columnas, la del medio de la piel del cuerpo.
  let caraIzq = w, caraDer = -1;
  const porColumna = new Map();
  let total = 0;
  for (let y = 0; y < h; y += 2 * paso) {
    for (let x = 0; x < w; x += 4) {
      const c = cat[y * w + x];
      if (c === PIEL_CARA) {
        caraIzq = Math.min(caraIzq, x);
        caraDer = Math.max(caraDer, x);
      } else if (c === PIEL_CUERPO) {
        porColumna.set(x, (porColumna.get(x) ?? 0) + 1);
        total++;
      }
    }
  }
  const hayCara = caraDer > caraIzq;
  const columnas = [...porColumna].filter(([x]) => !hayCara || (x >= caraIzq && x <= caraDer)).sort((a, b) => a[0] - b[0]);
  const enRango = columnas.reduce((suma, [, n]) => suma + n, 0);
  if (enRango < 20) return sinCuello("no hay piel bajo la cara");
  let acumulado = 0;
  const semilla = columnas.find(([, n]) => (acumulado += n) >= enRango / 2)[0];
  // En esa columna el cuello empieza bajo el mentón: la primera piel del cuerpo tras la cara.
  let arriba = 0;
  for (let y = 0; y < h; y += paso) if (cat[y * w + semilla] === PIEL_CARA) arriba = y + paso;
  while (arriba < h && cat[arriba * w + semilla] !== PIEL_CUERPO) arriba += paso;
  // El cuello no es más largo que el ancho de la cara: más abajo ya es pecho.
  const tope = hayCara ? Math.min(arriba + 1.1 * (caraDer - caraIzq), h) : h;

  const crudas = [];
  let eje = semilla, cerrado = false;
  for (let y = arriba; y < tope; y += paso) {
    if (!esCuello(eje, y)) {
      cerrado = true; // se acabó la piel: es el borde de la ropa
      break;
    }
    let izq = eje, der = eje;
    while (izq > 0 && esCuello(izq - 1, y)) izq--;
    while (der < w - 1 && esCuello(der + 1, y)) der++;
    crudas.push({ y, izq, der });
    eje = Math.round((izq + der) / 2);
  }
  if (crudas.length < 10) return sinCuello("el tramo de cuello visible es muy corto");

  // Cada borde se limpia con una mediana (quita dientes de la máscara) y luego un promedio.
  const ventana = (filas, i, lado) =>
    [-2, -1, 0, 1, 2].map((k) => filas[limitar(i + k, 0, filas.length - 1)][lado]);
  const suavizar = (filas, resumen) =>
    filas.map((f, i) => ({ y: f.y, izq: resumen(ventana(filas, i, "izq")), der: resumen(ventana(filas, i, "der")) }));
  const mediana = (v) => v.sort((a, b) => a - b)[2];
  const promedio = (v) => v.reduce((a, b) => a + b) / v.length;
  const filas = suavizar(suavizar(crudas, mediana), promedio);
  const anchos = filas.map((f) => f.der - f.izq);

  // Bajando desde el mentón, el cuello es el primer tramo de ancho parejo. Su base es la
  // primera fila en que el ancho se aparta del que traía (y sigue apartado): ahí empieza la
  // ropa o se abren los hombros.
  const medianaDe = (v) => [...v].sort((a, b) => a - b)[v.length >> 1];
  const ultima = anchos.length - 1;
  let base = ultima, ancho = medianaDe(anchos);
  for (let i = FILAS_MINIMAS; i < ultima; i++) {
    const previo = medianaDe(anchos.slice(0, i));
    if ([0, 1, 2].every((k) => Math.abs(anchos[Math.min(i + k, ultima)] - previo) > previo * FIN_DEL_CUELLO)) {
      base = i;
      ancho = previo;
      break;
    }
  }
  if (ancho < CUELLO_EN_IMAGEN[0] * w || ancho > CUELLO_EN_IMAGEN[1] * w) return sinCuello("el ancho medido no es el de un cuello");
  const rectas = filas.slice(0, base).filter((f) => Math.abs(f.der - f.izq - ancho) <= ancho * FIN_DEL_CUELLO);
  if (rectas.length < 3) return sinCuello("el cuello no tiene un tramo de ancho parejo");
  return {
    x: promedio(rectas.map((f) => (f.izq + f.der) / 2)),
    y: filas[base].y,
    ancho,
    // Si la piel se acaba hacia abajo es el borde de una polera: hasta ahí llega el escote.
    fondo: cerrado ? filas.at(-1).y + paso / 2 : null,
    filas,
  };
}

// Dónde no se ve lo que pasa por detrás del cuello. El tramo trasero del aro solo asoma
// sobre la ropa de los hombros: lo tapan la piel, la cara y el pelo, y sobre el fondo no
// puede estar.
function armarOclusor(mascara) {
  const cat = mascara.getAsUint8Array();
  const datos = new Uint8Array(cat.length);
  for (let i = 0; i < cat.length; i++) {
    if (cat[i] !== ROPA && cat[i] !== ACCESORIO) datos[i] = 255;
  }
  return { datos, ancho: mascara.width, alto: mascara.height };
}

// Texto para ?depurar: qué vio el modelo en la imagen y si se pudo medir el cuello.
function diagnosticar(mascara, medida) {
  const cat = mascara.getAsUint8Array();
  const cuenta = new Array(6).fill(0);
  for (let i = 0; i < cat.length; i += 7) cuenta[cat[i]]++;
  const total = cuenta.reduce((a, b) => a + b);
  const partes = ["fondo", "pelo", "piel cuerpo", "piel cara", "ropa", "accesorio"].map((n, i) => `${n} ${Math.round((100 * cuenta[i]) / total)}%`);
  return [
    `imagen ${lienzo.width}×${lienzo.height}, máscara ${mascara.width}×${mascara.height}, ${motorDelCuello}`,
    partes.join(" · "),
    medida ? `cuello medido: ancho ${Math.round(medida.ancho)}, base ${Math.round(medida.y)}` : `sin cuello: ${motivoSinCuello}`,
  ].join("\n");
}

// Sigue el cuello cuadro a cuadro. Devuelve, en píxeles de la imagen,
// { base, anchoCuello, fondo (o null si no hay polera que cierre el escote) }, o null.
function seguirCuello(mascara, ancho, alto, t) {
  const kx = ancho / mascara.width, ky = alto / mascara.height;
  const medida = medirCuello(mascara);
  if (DEPURAR) {
    estado.depuracion = medida && { ...medida, kx, ky };
    estado.diagnostico = diagnosticar(mascara, medida);
  }

  if (medida && esCreible(medida)) {
    const previo = cuelloVisto.ancho ?? medida.ancho;
    const segundos = medida.ancho > previo ? ANCHO_SUBE_S : ANCHO_BAJA_S;
    cuelloVisto.ancho = previo + (1 - Math.exp(-(t - cuelloVisto.t) / segundos)) * (medida.ancho - previo);
    cuelloVisto.t = t;
    cuelloVisto.ultimo = medida;
  }
  // Si en este cuadro no se pudo medir, el aro se queda donde estaba un momento.
  const ultimo = cuelloVisto.ultimo;
  if (!ultimo || t - cuelloVisto.t > SEGUNDOS_A_CIEGAS) return null;

  const anchoCuello = asentar("ancho", cuelloVisto.ancho, QUIETO_ANCHO * cuelloVisto.ancho);
  const quieto = QUIETO_POSICION * anchoCuello;
  return {
    base: {
      x: asentar("x", filtros.x.filtrar(ultimo.x, t), quieto) * kx,
      y: asentar("y", filtros.y.filtrar(ultimo.y, t), quieto) * ky,
    },
    anchoCuello: anchoCuello * kx,
    fondo: ultimo.fondo ? asentar("fondo", filtros.fondo.filtrar(ultimo.fondo, t), quieto) * ky : null,
  };
}

// La máscara vive en memoria de MediaPipe y hay que liberarla en cada cuadro.
function leerResultado(resultado, ancho, alto, t) {
  const mascara = resultado.categoryMask;
  const pose = seguirCuello(mascara, ancho, alto, t);
  estado.oclusor = armarOclusor(mascara);
  mascara.close();
  return pose;
}

// ---------------------------------------------------------------- Estado e interfaz

const estado = {
  joyas: [],
  joya: null,
  pose: null, // última lectura válida
  vistaEn: -Infinity,
  pintores: null,
  ajustes: {},
  // El panel parte abierto, salvo en pantallas angostas, donde taparía a la persona.
  panelAbierto: innerWidth >= 700,
  depuracion: null,
  diagnostico: null,
  oclusor: null,
  // Cómo es la imagen de la cámara, para que las joyas se fundan con ella (ver FUNDIR).
  escena: { luz: 1, negro: 0.03, blanco: 0.97, tiempo: 0 },
};

const AJUSTES_BASE = { tamano: 1, altura: 0, inclinacion: 0 };

function ajustesDe(joya) {
  estado.ajustes[joya.id] ??= { ...AJUSTES_BASE, dedo: joya.dedo };
  return estado.ajustes[joya.id];
}

// Cada tipo de joya muestra solo los controles que le sirven.
function mostrarAjustes() {
  if (!estado.joya) return;
  const aj = ajustesDe(estado.joya);
  for (const control of panel.querySelectorAll("[data-tipo]")) control.hidden = control.dataset.tipo !== estado.joya.tipo;
  $("aj-tamano").value = aj.tamano;
  $("aj-altura").value = aj.altura;
  $("aj-inclinacion").value = aj.inclinacion;
  if (aj.dedo) $("aj-dedo").value = aj.dedo;
}

function elegir(joya) {
  // La lectura de un tipo de joya no sirve para otro: se parte de cero.
  if (joya?.tipo !== estado.joya?.tipo) estado.pose = null;
  estado.joya = joya;
  for (const boton of bandeja.children) {
    boton.setAttribute("aria-pressed", String(boton.dataset.id === (joya?.id ?? "")));
  }
  $("btn-ajustes").hidden = !joya;
  mostrarPanel();
  mostrarAjustes();
}

// El panel de ajustes parte abierto; el botón lo oculta y lo vuelve a mostrar.
function mostrarPanel() {
  panel.hidden = !estado.joya || !estado.panelAbierto;
  $("btn-ajustes").textContent = estado.panelAbierto ? "Ocultar ajustes" : "Ajustar";
}

function armarBandeja() {
  const boton = (id, etiqueta, miniatura) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "joya";
    b.dataset.id = id;
    b.append(miniatura, etiqueta);
    b.addEventListener("click", () => elegir(estado.joyas.find((j) => j.id === id) ?? null));
    bandeja.append(b);
  };
  const vacio = document.createElement("span");
  vacio.className = "vacio";
  boton("", "Sin joya", vacio);
  for (const joya of estado.joyas) {
    const img = document.createElement("img");
    img.src = joya.miniatura;
    img.alt = "";
    boton(joya.id, joya.nombre, img);
  }
  bandeja.hidden = false;
}

function conectarAjustes() {
  $("btn-ajustes").addEventListener("click", () => {
    estado.panelAbierto = !estado.panelAbierto;
    mostrarPanel();
  });
  for (const [id, clave] of [["aj-tamano", "tamano"], ["aj-altura", "altura"], ["aj-inclinacion", "inclinacion"]]) {
    $(id).addEventListener("input", (e) => {
      ajustesDe(estado.joya)[clave] = Number(e.target.value);
    });
  }
  $("aj-dedo").addEventListener("change", (e) => {
    ajustesDe(estado.joya).dedo = e.target.value;
    olvidarManos();
  });
  $("aj-reiniciar").addEventListener("click", () => {
    delete estado.ajustes[estado.joya.id];
    mostrarAjustes();
  });
}

function decir(texto) {
  aviso.hidden = !texto;
  aviso.textContent = texto ?? "";
}

// La escena mantiene la proporción de la imagen y cubre toda la pantalla.
function encuadrar(ancho, alto) {
  const ajustar = () => {
    const k = Math.max(innerWidth / ancho, innerHeight / alto);
    escena.style.width = `${ancho * k}px`;
    escena.style.height = `${alto * k}px`;
    // Una cámara no entrega bordes perfectos: el dibujo se suaviza lo mismo que ella.
    lienzo.style.filter = `blur(${(NITIDEZ_CAMARA_PX * k).toFixed(2)}px)`;
  };
  for (const capa of [lienzo, cuadro]) Object.assign(capa, { width: ancho, height: alto });
  ajustar();
  addEventListener("resize", ajustar);
}

function pintar() {
  const { joya, pose, pintores } = estado;
  pintores.cinta.limpiar();
  if (DEPURAR) pintarDepuracion();
  if (!joya || !pose) return;
  const aj = ajustesDe(joya);
  estado.escena.tiempo = (estado.escena.tiempo + 1) % 1000;
  if (joya.tipo === "anillo_sello") return pintores.anillo.dibujar(joya, pose, aj.tamano, estado.escena);
  // El aro es más ancho que el cuello (holgura) y descansa en su base: el centro queda algo
  // más abajo (bajada, en anchos de cuello) y el frente cae hacia el pecho según la inclinación.
  const escala = ((pose.anchoCuello * joya.holgura) / joya.anchoInteriorMm) * aj.tamano;
  const inclinacion = rad(limitar(joya.inclinacion_grados + aj.inclinacion, 5, 75));
  const caidaCabezas = 0.92 * joya.radioPx(0) * joya.mmPorPx * escala * Math.sin(inclinacion);
  let y = pose.base.y + joya.bajada * pose.anchoCuello;
  // Con polera, las cabezas quedan en el borde del escote en vez de bajar por la tela.
  if (pose.fondo) y = Math.min(y, pose.fondo + BAJO_EL_ESCOTE * pose.anchoCuello - caidaCabezas);
  y -= aj.altura * escala;
  pintores.cinta.dibujar(joya, { x: pose.base.x, y, escala, giro: 0, lado: 0, inclinacion }, estado.oclusor, estado.escena);
}

// Dibuja los bordes del cuello y los puntos que encontró el seguimiento.
function pintarDepuracion() {
  let capa = $("depuracion");
  if (!capa) {
    capa = document.createElement("canvas");
    capa.id = "depuracion";
    escena.append(capa);
  }
  capa.width = lienzo.width;
  capa.height = lienzo.height;
  const ctx = capa.getContext("2d");
  // El texto va fuera de la escena, que en modo cámara está espejada.
  let texto = $("diagnostico");
  if (!texto) {
    texto = Object.assign(document.createElement("pre"), { id: "diagnostico" });
    texto.style.cssText = "position:fixed;left:12px;bottom:230px;z-index:3;margin:0;padding:8px 10px;font:12px/1.4 monospace;color:#fff;background:rgba(0,0,0,.7);border-radius:8px;white-space:pre-wrap;max-width:calc(100vw - 24px)";
    document.body.append(texto);
  }
  texto.textContent = estado.diagnostico ?? "";
  const cuello = estado.depuracion;
  if (!cuello) return;
  const { kx, ky } = cuello;
  ctx.fillStyle = "lime";
  for (const f of cuello.filas) {
    ctx.fillRect(f.izq * kx - 1, f.y * ky - 1, 3, 3);
    ctx.fillRect(f.der * kx - 1, f.y * ky - 1, 3, 3);
  }
  const punto = (x, y, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x * kx, y * ky, 5, 0, 2 * Math.PI);
    ctx.fill();
  };
  // Rojo: base del cuello. Celeste: fondo del escote.
  punto(cuello.x - cuello.ancho / 2, cuello.y, "red");
  punto(cuello.x + cuello.ancho / 2, cuello.y, "red");
  if (cuello.fondo) punto(cuello.x, cuello.fondo, "cyan");
}

// ---------------------------------------------------------------- Modos

// Cada tipo de joya se sigue con su propio modelo: el cuello con uno, la mano con otro.
// leer() devuelve dónde va la joya en este cuadro, o null si no se ve a la persona.
const SEGUIMIENTOS = {
  choker_rigido: {
    crear: crearDetector,
    leer(detector, fuente, ancho, alto, t, enVivo) {
      const imagen = reducir(fuente, ancho, alto);
      const resultado = enVivo ? detector.segmentForVideo(imagen, t * 1000) : detector.segment(imagen);
      return leerResultado(resultado, ancho, alto, t);
    },
    olvidar: olvidarPersona,
    aviso: "Ponte frente a la cámara, con el cuello a la vista",
  },
  anillo_sello: {
    crear: crearDetectorManos,
    leer(detector, fuente, ancho, alto, t, enVivo) {
      const resultado = enVivo ? detector.detectForVideo(fuente, t * 1000) : detector.detect(fuente);
      return seguirManos(resultado, ancho, alto, t, ajustesDe(estado.joya).dedo, estado.joya.posicion);
    },
    olvidar: olvidarManos,
    aviso: "Muestra tu mano a la cámara",
  },
};

// Los modelos se cargan la primera vez que se elige una joya de su tipo. Mientras carga, null.
const detectores = new Map();

function detectorDe(tipo) {
  if (!detectores.has(tipo)) {
    detectores.set(tipo, null);
    SEGUIMIENTOS[tipo].crear("VIDEO").then(
      (detector) => detectores.set(tipo, detector),
      (error) => {
        console.error(error);
        decir(`No se pudo cargar el seguimiento: ${error.message}`);
      },
    );
  }
  return detectores.get(tipo);
}

// Mira la imagen de la cámara en chico y actualiza lo que las joyas necesitan saber de
// ella: cuánta luz hay, dónde quedan su negro y su blanco, y qué hay para reflejar.
// `peso` es cuánto pesa esta lectura frente a las anteriores (1 = la reemplaza).
const muestra = Object.assign(document.createElement("canvas"), { width: 64, height: 36 });

function mirarEscena(fuente, peso) {
  const ctx = muestra.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(fuente, 0, 0, muestra.width, muestra.height);
  const datos = ctx.getImageData(0, 0, muestra.width, muestra.height).data;
  const brillos = [];
  for (let i = 0; i < datos.length; i += 4) brillos.push((0.2126 * datos[i] + 0.7152 * datos[i + 1] + 0.0722 * datos[i + 2]) / 255);
  brillos.sort((a, b) => a - b);
  const en = (fraccion) => brillos[Math.floor(fraccion * (brillos.length - 1))];
  const leida = {
    // La luz se mide en las zonas claras: un fondo oscuro no significa que la persona lo esté.
    luz: limitar(0.35 + en(0.9), 0.7, 1.3),
    negro: Math.min(en(0.02), 0.2),
    blanco: Math.max(en(0.99), 0.75),
  };
  for (const clave in leida) estado.escena[clave] += peso * (leida[clave] - estado.escena[clave]);
  estado.pintores.anillo.subirEscena(muestra);
}

async function conCamara() {
  decir("Preparando la cámara…");
  const flujo = await navigator.mediaDevices.getUserMedia({
    // Se pide la mayor resolución habitual; si la cámara no llega, entrega la más cercana.
    video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
    audio: false,
  });
  video.srcObject = flujo;
  await video.play();
  encuadrar(video.videoWidth, video.videoHeight);
  escena.classList.add("espejo");
  decir(null);

  // Cada cuadro del video se copia a un lienzo, y de ese mismo lienzo salen tanto lo que se
  // muestra como lo que se analiza: así la joya nunca va atrasada respecto de la imagen.
  const pincel = cuadro.getContext("2d");
  let ultimoCuadro = -1, cuadros = 0;
  const seguir = (ahora) => {
    pincel.drawImage(video, 0, 0, cuadro.width, cuadro.height);
    if (cuadros++ % 6 === 0) mirarEscena(cuadro, 0.25);
    const { joya } = estado;
    if (!joya) return decir(null);
    const seguimiento = SEGUIMIENTOS[joya.tipo], detector = detectorDe(joya.tipo);
    if (!detector) {
      estado.diagnostico = "cargando el modelo de seguimiento…";
      return decir("Preparando…");
    }
    const pose = seguimiento.leer(detector, cuadro, lienzo.width, lienzo.height, ahora / 1000, true);
    if (pose) {
      estado.pose = pose;
      estado.vistaEn = ahora;
    } else if (ahora - estado.vistaEn > SEGUNDOS_SIN_PERSONA * 1000) {
      estado.pose = null;
      seguimiento.olvidar();
    }
    decir(estado.pose ? null : seguimiento.aviso);
  };
  const ciclo = () => {
    if (video.currentTime !== ultimoCuadro) {
      ultimoCuadro = video.currentTime;
      seguir(performance.now());
    }
    pintar();
    requestAnimationFrame(ciclo);
  };
  ciclo();
}

// Modo de prueba: ?foto=<ruta> coloca la joya sobre una foto fija en vez de la cámara
// (con ?joya=<id> se elige cuál). Si no se encuentra el cuello, el choker se puede arrastrar
// y escalar con la rueda.
async function conFoto(ruta) {
  video.hidden = cuadro.hidden = true;
  foto.hidden = false;
  foto.src = ruta;
  await foto.decode();
  encuadrar(foto.naturalWidth, foto.naturalHeight);
  mirarEscena(foto, 1);
  const { joya } = estado;
  const seguimiento = SEGUIMIENTOS[joya.tipo];
  const detector = await seguimiento.crear("IMAGE");
  estado.pose = seguimiento.leer(detector, foto, lienzo.width, lienzo.height, 0, false);
  if (!estado.pose && joya.tipo === "choker_rigido") {
    estado.pose = { base: { x: lienzo.width / 2, y: lienzo.height * 0.4 }, anchoCuello: lienzo.width * 0.25, fondo: null };
    decir("No se encontró el cuello: arrastra la joya para ubicarla");
  } else if (!estado.pose) {
    decir(seguimiento.aviso);
  }

  const aLienzo = (e) => {
    const caja = lienzo.getBoundingClientRect();
    return {
      x: ((e.clientX - caja.left) / caja.width) * lienzo.width,
      y: ((e.clientY - caja.top) / caja.height) * lienzo.height,
    };
  };
  let arrastre = null;
  lienzo.addEventListener("pointerdown", (e) => (arrastre = aLienzo(e)));
  addEventListener("pointerup", () => (arrastre = null));
  lienzo.addEventListener("pointermove", (e) => {
    if (!arrastre || !estado.pose?.base) return;
    const p = aLienzo(e);
    estado.pose.base.x += p.x - arrastre.x;
    estado.pose.base.y += p.y - arrastre.y;
    arrastre = p;
  });
  lienzo.addEventListener("wheel", (e) => {
    if (estado.pose?.base) estado.pose.anchoCuello *= e.deltaY < 0 ? 1.03 : 0.97;
  });

  const ciclo = () => {
    pintar();
    requestAnimationFrame(ciclo);
  };
  ciclo();
}

async function iniciar() {
  const cinta = new Pintor(lienzo);
  estado.pintores = { cinta, anillo: new PintorAnillo(cinta.gl) };
  estado.joyas = await cargarCatalogo();
  armarBandeja();
  conectarAjustes();
  const parametros = new URLSearchParams(location.search);
  elegir(estado.joyas.find((j) => j.id === parametros.get("joya")) ?? estado.joyas[0]);

  const arrancar = async (modo) => {
    $("inicio").hidden = true;
    try {
      await modo();
    } catch (error) {
      console.error(error);
      decir(
        error.name === "NotAllowedError"
          ? "Necesitamos permiso para usar la cámara"
          : `No se pudo iniciar: ${error.message}`,
      );
    }
  };
  const rutaFoto = parametros.get("foto");
  if (rutaFoto) arrancar(() => conFoto(rutaFoto));
  else $("btn-iniciar").addEventListener("click", () => arrancar(conCamara));
}

iniciar();
