// Anillos: seguimiento de la mano y dibujo de un anillo de sello en el dedo.
//
// Un anillo rodea el dedo, así que una foto plana no sirve: se arma un modelo 3D (banda
// ancha que se angosta hacia la palma, con una placa rectangular arriba) a partir de las
// medidas de la ficha. La cara de la placa es una foto real del anillo, enderezada; el metal
// se sombrea como oro pulido, reflejando un entorno de estudio.
//
// Los dedos se modelan como cilindros invisibles que tapan lo que queda detrás de ellos: el
// del anillo esconde la mitad trasera de la banda, y los vecinos lo tapan cuando se cruzan
// por delante.

import { FUNDIR, MEDIAPIPE, Filtro, compilar } from "./comun.js";

const MODELO_MANOS = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";

// Puntos del modelo de mano, de la base a la punta de cada dedo. El anillo va entre los dos
// primeros (nudillo y primera articulación) de los dedos que lo admiten.
const HUESOS = {
  pulgar: [1, 2, 3, 4],
  indice: [5, 6, 7, 8],
  medio: [9, 10, 11, 12],
  anular: [13, 14, 15, 16],
  menique: [17, 18, 19, 20],
};
const NUDILLO_INDICE = 5, NUDILLO_MENIQUE = 17;
// Grosor de cada dedo, como fracción del ancho de la palma (de nudillo del índice a nudillo
// del meñique). La palma se mide mejor que una falange sola, que se acorta cuando el dedo
// apunta a la cámara.
const GROSOR_DEDO = { pulgar: 0.26, indice: 0.23, medio: 0.235, anular: 0.22, menique: 0.19 };
// Hacia qué lado queda el dorso de la mano, según cuál mano informa el modelo.
const DORSO = { Left: 1, Right: -1 };
// Los dedos vecinos se modelan algo más delgados, para que no muerdan el anillo al rozarlo.
const HOLGURA_VECINOS = 0.9;

const resta = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const escalar = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const punto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unitario = (a) => {
  const n = Math.hypot(...a) || 1;
  return [a[0] / n, a[1] / n, a[2] / n];
};
const mezclar = (a, b, t) => a + (b - a) * t;

export async function crearDetectorManos(modo) {
  const { FilesetResolver, HandLandmarker } = await import(`${MEDIAPIPE}/vision_bundle.mjs`);
  const archivos = await FilesetResolver.forVisionTasks(`${MEDIAPIPE}/wasm`);
  return HandLandmarker.createFromOptions(archivos, {
    baseOptions: { modelAssetPath: MODELO_MANOS, delegate: "GPU" },
    runningMode: modo,
    numHands: 2,
  });
}

// Un juego de filtros por mano. La mano se mueve rápido: suavizan poco y sin retraso.
const filtrosPorMano = new Map();

function filtrosDe(lado) {
  if (!filtrosPorMano.has(lado)) {
    const posicion = () => new Filtro(4, 0.1, 1);
    const eje = () => [0, 1, 2].map(() => new Filtro(2.5, 2, 1));
    filtrosPorMano.set(lado, {
      x: posicion(),
      y: posicion(),
      z: new Filtro(1.5, 0.05, 3),
      a: eje(),
      n: eje(),
      pxPorMetro: new Filtro(0.8, 0, 3),
      palma: new Filtro(0.8, 0, 3),
    });
  }
  return filtrosPorMano.get(lado);
}

export function olvidarManos() {
  filtrosPorMano.clear();
}

// Dónde va el anillo en cada mano visible. Todo queda en el espacio de la cámara: x a la
// derecha e y hacia abajo en píxeles de la imagen, z alejándose (en las mismas unidades).
// Devuelve una lista con, por mano:
//   dedo       el dedo que lleva el anillo
//   origen     centro de ese dedo donde va el anillo
//   a, s, n    ejes del anillo: a lo largo del dedo, hacia el costado y hacia el dorso
//   palma      ancho de la palma; de ahí sale el grosor de cada dedo
//   puntos     las 21 articulaciones de la mano
export function seguirManos(resultado, ancho, alto, t, dedo, posicion) {
  const [nudillo, articulacion] = HUESOS[dedo];
  const vistas = new Set();
  const manos = resultado.landmarks.map((marcas, i) => {
    const lado = (resultado.handedness ?? resultado.handednesses)[i][0].categoryName;
    const mundo = resultado.worldLandmarks[i].map((p) => [p.x, p.y, p.z]);
    const px = marcas.map((p) => [p.x * ancho, p.y * alto]);
    vistas.add(lado);
    const f = filtrosDe(lado);

    // Escala: el modelo entrega la mano en metros, orientada como la ve la cámara; la
    // relación entre esas posiciones y las de la imagen da los píxeles por metro.
    const media = (lista, k) => lista.reduce((suma, p) => suma + p[k], 0) / lista.length;
    const cp = [media(px, 0), media(px, 1)], cm = [media(mundo, 0), media(mundo, 1)];
    let arriba = 0, abajo = 0;
    for (let k = 0; k < px.length; k++) {
      const dm = [mundo[k][0] - cm[0], mundo[k][1] - cm[1]];
      arriba += (px[k][0] - cp[0]) * dm[0] + (px[k][1] - cp[1]) * dm[1];
      abajo += dm[0] * dm[0] + dm[1] * dm[1];
    }
    const pxPorMetro = f.pxPorMetro.filtrar(arriba / abajo, t);
    // La posición en la imagen manda; la profundidad la pone el modelo 3D de la mano.
    const puntos = px.map((p, k) => [p[0], p[1], mundo[k][2] * pxPorMetro]);

    // El dorso del dedo es perpendicular al dedo y a la línea de los nudillos; esa línea se
    // mantiene firme aunque la mano se cierre.
    const falange = resta(mundo[articulacion], mundo[nudillo]);
    const nudillos = resta(mundo[NUDILLO_MENIQUE], mundo[NUDILLO_INDICE]);
    const dorso = escalar(cruz(falange, nudillos), DORSO[lado]);
    const filtrar = (eje, valores) => valores.map((v, k) => eje[k].filtrar(v, t));

    // Los ejes se suavizan por separado y después se vuelven a dejar perpendiculares.
    const a = unitario(filtrar(f.a, unitario(falange)));
    const nCrudo = filtrar(f.n, unitario(dorso));
    const n = unitario(resta(nCrudo, escalar(a, punto(nCrudo, a))));
    const en = (k) => mezclar(puntos[nudillo][k], puntos[articulacion][k], posicion);
    return {
      dedo,
      origen: [f.x.filtrar(en(0), t), f.y.filtrar(en(1), t), f.z.filtrar(en(2), t)],
      a,
      s: cruz(a, n),
      n,
      palma: f.palma.filtrar(Math.hypot(...nudillos) * pxPorMetro, t),
      puntos,
    };
  });
  for (const lado of filtrosPorMano.keys()) if (!vistas.has(lado)) filtrosPorMano.delete(lado);
  return manos.length ? manos : null;
}

// ---------------------------------------------------------------- Modelo

// Triángulos sueltos con su normal, coordenada de textura y material por vértice.
// Materiales: 0 = metal, 1 = cara de la placa (foto), 2 = sombra sobre el dedo.
class Malla {
  pos = [];
  nor = [];
  uv = [];
  mat = [];

  // Cuatro esquinas en orden. Sin normales, la cara es plana.
  cuadro(puntos, normales, material = 0, uvs = [[0, 0], [0, 0], [0, 0], [0, 0]]) {
    const plana = unitario(cruz(resta(puntos[1], puntos[0]), resta(puntos[3], puntos[0])));
    for (const k of [0, 1, 2, 0, 2, 3]) {
      this.pos.push(...puntos[k]);
      this.nor.push(...(normales?.[k] ?? plana));
      this.uv.push(...uvs[k]);
      this.mat.push(material);
    }
  }

  atributos() {
    return [
      ["aPos", new Float32Array(this.pos), 3],
      ["aNormal", new Float32Array(this.nor), 3],
      ["aUv", new Float32Array(this.uv), 2],
      ["aMat", new Float32Array(this.mat), 1],
    ];
  }
}

const BISEL = 0.5; // mm: los cantos no son filos, y es en ellos donde brilla el metal
const CURVA_BANDA = 1.7; // cuánto se curva el costado de la banda al angostarse

// Anillo de sello: banda con el interior redondo y el exterior en U (redondo hacia la palma,
// recto hacia el dorso), más larga arriba que abajo, y una placa rectangular con una piedra.
// Coordenadas en milímetros: x a lo largo del dedo, y hacia el costado, z hacia el dorso;
// el origen es el centro del dedo.
export class AnilloSello {
  constructor(ficha) {
    Object.assign(this, ficha);
    this.radioInterior = ficha.diametro_interior_mm / 2;
    this.radioExterior = ficha.cuerpo_ancho_mm / 2;
    this.miniatura = `joyas/${ficha.id}/miniatura.png`;
    this.cara = new Image();
    this.cara.src = `joyas/${ficha.id}/cara.png`;
  }

  async cargar() {
    await this.cara.decode();
    return this;
  }

  // Medio largo de la banda a la altura z: angosta abajo, del largo de la placa arriba.
  semiLargo(z) {
    const t = Math.min(Math.max((z + this.radioExterior) / (this.cuerpo_alto_mm + this.radioExterior), 0), 1);
    return mezclar(this.largo_abajo_mm, this.placa_mm[0], t ** CURVA_BANDA) / 2;
  }

  // Contorno exterior de la sección de la banda: [y, z, normal y, normal z], cerrado.
  contorno() {
    const ro = this.radioExterior, techo = this.cuerpo_alto_mm, rc = 1;
    const puntos = [];
    for (let i = 0; i <= 40; i++) {
      const t = Math.PI * (1 + i / 40);
      puntos.push([ro * Math.cos(t), ro * Math.sin(t), Math.cos(t), Math.sin(t)]);
    }
    const esquina = (cy, desde) => {
      for (let i = 1; i <= 6; i++) {
        const t = desde + ((Math.PI / 2) * i) / 6;
        puntos.push([cy + rc * Math.cos(t), techo - rc + rc * Math.sin(t), Math.cos(t), Math.sin(t)]);
      }
    };
    for (let i = 1; i <= 8; i++) puntos.push([ro, ((techo - rc) * i) / 8, 1, 0]);
    esquina(ro - rc, 0);
    puntos.push([-(ro - rc), techo, 0, 1]);
    esquina(-(ro - rc), Math.PI / 2);
    for (let i = 7; i >= 0; i--) puntos.push([-ro, ((techo - rc) * i) / 8, -1, 0]);
    return puntos;
  }

  malla() {
    const m = new Malla();
    const ri = this.radioInterior;
    const contorno = this.contorno();
    for (let i = 0; i < contorno.length - 1; i++) {
      const [p, q] = [contorno[i], contorno[i + 1]];
      const [hp, hq] = [this.semiLargo(p[1]), this.semiLargo(q[1])];
      const np = [0, p[2], p[3]], nq = [0, q[2], q[3]];
      // Superficie exterior de la banda.
      m.cuadro(
        [[-(hp - BISEL), p[0], p[1]], [hp - BISEL, p[0], p[1]], [hq - BISEL, q[0], q[1]], [-(hq - BISEL), q[0], q[1]]],
        [np, np, nq, nq],
      );
      for (const lado of [-1, 1]) {
        // Canto biselado y tapa: lo que se ve de la banda mirando a lo largo del dedo.
        const borde = (c, h) => [lado * h, c[0] - BISEL * c[2], c[1] - BISEL * c[3]];
        const dentro = (c, h) => {
          const k = ri / Math.hypot(c[0], c[1]);
          return [lado * h, c[0] * k, c[1] * k];
        };
        const inclinada = (c) => unitario([lado, c[2], c[3]]);
        m.cuadro(
          [[lado * (hp - BISEL), p[0], p[1]], borde(p, hp), borde(q, hq), [lado * (hq - BISEL), q[0], q[1]]],
          [inclinada(p), inclinada(p), inclinada(q), inclinada(q)],
        );
        m.cuadro([borde(p, hp), dentro(p, hp), dentro(q, hq), borde(q, hq)]);
      }
    }

    // Placa: la cara de arriba con la foto, sus cantos biselados, los costados y el alero.
    const [largo, ancho, alto] = this.placa_mm;
    const x = largo / 2, y = ancho / 2, z0 = this.cuerpo_alto_mm, z1 = z0 + alto, c = BISEL;
    const esquinas = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    const uv = ([sx, sy]) => [(sx * (x - c)) / largo + 0.5, (sy * (y - c)) / ancho + 0.5];
    m.cuadro(esquinas.map(([sx, sy]) => [sx * (x - c), sy * (y - c), z1]), null, 1, esquinas.map(uv));
    for (let i = 0; i < 4; i++) {
      const [e1, e2] = [esquinas[i], esquinas[(i + 1) % 4]];
      const arriba = (e) => [e[0] * (x - c), e[1] * (y - c), z1];
      const canto = (e) => [e[0] * x, e[1] * y, z1 - c];
      const base = (e) => [e[0] * x, e[1] * y, z0];
      m.cuadro([arriba(e1), arriba(e2), canto(e2), canto(e1)]);
      m.cuadro([canto(e1), canto(e2), base(e2), base(e1)]);
    }
    m.cuadro(esquinas.map(([sx, sy]) => [sx * x, sy * y, z0]));
    return m;
  }

  // El dedo del anillo: tapa la mitad trasera de la banda y recibe su sombra.
  mallaDedo() {
    const m = new Malla(), r = this.radioInterior * 0.98, largo = 45, lados = 40;
    for (let i = 0; i < lados; i++) {
      const [t1, t2] = [(2 * Math.PI * i) / lados, (2 * Math.PI * (i + 1)) / lados];
      const [n1, n2] = [[0, Math.cos(t1), Math.sin(t1)], [0, Math.cos(t2), Math.sin(t2)]];
      const en = (xx, n) => [xx, r * n[1], r * n[2]];
      m.cuadro([en(-largo, n1), en(largo, n1), en(largo, n2), en(-largo, n2)], [n1, n1, n2, n2], 2);
    }
    return m;
  }
}

// Cilindro de largo y radio 1 a lo largo de x: sirve para cualquier hueso de la mano.
function mallaHueso() {
  const m = new Malla(), lados = 24;
  for (let i = 0; i < lados; i++) {
    const [t1, t2] = [(2 * Math.PI * i) / lados, (2 * Math.PI * (i + 1)) / lados];
    const en = (xx, t) => [xx, Math.cos(t), Math.sin(t)];
    m.cuadro([en(0, t1), en(1, t1), en(1, t2), en(0, t2)]);
  }
  return m;
}

// ---------------------------------------------------------------- Dibujo

const VERTICES = `#version 300 es
in vec3 aPos;    // en los ejes de la pieza (milímetros, para el anillo)
in vec3 aNormal;
in vec2 aUv;
in float aMat;
uniform vec3 uA, uS, uN; // ejes de la pieza vistos desde la cámara
uniform vec3 uOrigen;    // píxeles
uniform float uEscala;   // píxeles por unidad de la pieza
uniform vec2 uTam;
out vec3 vCamara; // posición respecto del origen de la pieza
out vec3 vNormal;
out vec3 vLocal;
out vec2 vUv;
out float vMat;
void main() {
  vCamara = uEscala * (aPos.x * uA + aPos.y * uS + aPos.z * uN);
  vec2 p = (uOrigen.xy + vCamara.xy) / uTam * 2.0 - 1.0;
  // La profundidad solo ordena el anillo y los dedos entre sí.
  gl_Position = vec4(p.x, -p.y, clamp((uOrigen.z + vCamara.z) / 4000.0, -1.0, 1.0), 1.0);
  vNormal = aNormal.x * uA + aNormal.y * uS + aNormal.z * uN;
  vLocal = aPos;
  vUv = aUv;
  vMat = aMat;
}`;

const FRAGMENTOS = `#version 300 es
precision highp float;
in vec3 vCamara;
in vec3 vNormal;
in vec3 vLocal;
in vec2 vUv;
in float vMat;
uniform sampler2D uCara;
uniform sampler2D uEscena; // la imagen de la cámara, chica y borrosa
uniform vec3 uMetal;   // color con que el metal tiñe lo que refleja
uniform vec4 uForma;   // largo de la banda abajo y arriba, radio exterior y altura del cuerpo
uniform float uCurva;
uniform float uEscala;
out vec4 color;
${FUNDIR}

// Lo que rodea al anillo y se refleja en él. Mitad estudio (techo claro, una ventana a un
// costado, piso oscuro) para que el metal siempre tenga contraste, y mitad la escena real que
// ve la cámara, para que los colores del lugar aparezcan en el oro. r mira hacia donde sale
// el reflejo (x a la derecha, y hacia abajo, z alejándose de la cámara).
vec3 entorno(vec3 r) {
  float alto = -r.y;
  vec3 c = mix(vec3(0.09, 0.06, 0.045), vec3(0.6, 0.55, 0.5), smoothstep(-0.65, 0.2, alto));
  c = mix(c, vec3(1.2, 1.18, 1.15), smoothstep(0.2, 0.95, alto));
  c += vec3(1.5, 1.52, 1.6) * smoothstep(0.62, 0.92, dot(r, normalize(vec3(-0.7, -0.35, -0.62))));
  c += vec3(0.5, 0.5, 0.52) * smoothstep(0.75, 0.97, dot(r, normalize(vec3(0.8, -0.1, -0.6))));
  c = mix(c, vec3(0.78, 0.52, 0.4), 0.3 * smoothstep(0.35, 1.0, -r.z));
  vec3 escena = textureLod(uEscena, vec2(0.5) + 0.46 * r.xy, 1.5).rgb;
  return mix(c, escena * escena * 2.4, 0.45);
}

void main() {
  vec3 n = normalize(vNormal);
  // La cámara está cerca: la dirección de la mirada cambia a lo largo de la pieza, y con
  // ella el reflejo, que es lo que da degradés en las caras planas.
  vec3 v = normalize(vec3(vCamara.xy / (uEscala * 180.0), 1.0));
  if (dot(n, v) > 0.0) n = -n;

  if (vMat > 1.5) {
    // Sombra del anillo sobre el dedo: más oscura junto a la banda, se pierde hacia los lados.
    float t = clamp((vLocal.z + uForma.z) / (uForma.w + uForma.z), 0.0, 1.0);
    float semi = mix(uForma.x, uForma.y, pow(t, uCurva)) * 0.5;
    float cerca = 1.0 - smoothstep(semi, semi + 6.0, abs(vLocal.x));
    color = vec4(0.0, 0.0, 0.0, 0.4 * cerca * smoothstep(0.05, 0.6, -n.z));
    return;
  }

  vec3 r = reflect(v, n);
  float rasante = pow(1.0 - max(dot(-v, n), 0.0), 5.0);
  vec3 c;
  if (vMat > 0.5) {
    // La foto ya trae su luz; encima va el reflejo de la piedra pulida, que se mueve.
    c = texture(uCara, vUv).rgb * 1.05 + entorno(r) * (0.03 + 0.5 * rasante);
  } else {
    c = (uMetal + (1.0 - uMetal) * rasante) * entorno(r);
  }
  color = vec4(fundir(c), 1.0);
}`;

export class PintorAnillo {
  constructor(gl) {
    this.gl = gl;
    this.prog = compilar(gl, VERTICES, FRAGMENTOS);
    this.u = Object.fromEntries(
      ["uA", "uS", "uN", "uOrigen", "uEscala", "uTam", "uCara", "uEscena", "uMetal", "uForma", "uCurva", "uNiveles", "uLuz", "uTiempo"].map((n) => [n, gl.getUniformLocation(this.prog, n)]),
    );
    this.hueso = this.subir(mallaHueso());
    this.piezas = new Map();
    this.escena = gl.createTexture();
    this.subirEscena(new ImageData(new Uint8ClampedArray([128, 128, 128, 255]), 1, 1));
  }

  // La imagen de la cámara reducida, para que el metal la refleje. Con sus versiones más
  // chicas hechas de antemano, el reflejo sale borroso como en un metal que no es un espejo.
  subirEscena(imagen) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.escena);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imagen);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  subir(malla) {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    for (const [nombre, datos, tamano] of malla.atributos()) {
      const loc = gl.getAttribLocation(this.prog, nombre);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, datos, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, tamano, gl.FLOAT, false, 0, 0);
    }
    gl.bindVertexArray(null);
    return { vao, vertices: malla.mat.length };
  }

  // Sube la geometría y la foto de una joya la primera vez que se dibuja.
  piezasDe(joya) {
    if (!this.piezas.has(joya)) {
      const gl = this.gl;
      const cara = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, cara);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, joya.cara);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.piezas.set(joya, { anillo: this.subir(joya.malla()), dedo: this.subir(joya.mallaDedo()), cara });
    }
    return this.piezas.get(joya);
  }

  colocar(origen, a, s, n, escala) {
    const gl = this.gl;
    gl.uniform3fv(this.u.uOrigen, origen);
    gl.uniform3fv(this.u.uA, a);
    gl.uniform3fv(this.u.uS, s);
    gl.uniform3fv(this.u.uN, n);
    gl.uniform1f(this.u.uEscala, escala);
  }

  trazar({ vao, vertices }) {
    this.gl.bindVertexArray(vao);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, vertices);
  }

  // Los demás huesos de la mano, solo como profundidad: tapan el anillo si pasan por delante.
  taparConLaMano(mano) {
    const [nudillo, articulacion] = HUESOS[mano.dedo];
    for (const [dedo, cadena] of Object.entries(HUESOS)) {
      const radio = (HOLGURA_VECINOS * GROSOR_DEDO[dedo] * mano.palma) / 2;
      for (let k = 0; k < cadena.length - 1; k++) {
        if (cadena[k] === nudillo && cadena[k + 1] === articulacion) continue;
        const desde = mano.puntos[cadena[k]], hueso = resta(mano.puntos[cadena[k + 1]], desde);
        // Dos direcciones cualesquiera perpendiculares al hueso.
        const lado = unitario(cruz(hueso, Math.abs(hueso[2]) < 0.9 * Math.hypot(...hueso) ? [0, 0, 1] : [1, 0, 0]));
        const otro = unitario(cruz(hueso, lado));
        // Un poco más largo por cada punta, para que no queden rendijas en las articulaciones.
        this.colocar(resta(desde, escalar(hueso, 0.1)), escalar(hueso, 1.2), escalar(lado, radio), escalar(otro, radio), 1);
        this.trazar(this.hueso);
      }
    }
  }

  // manos: lo que devuelve seguirManos. tamano: corrección manual sobre el calce al dedo.
  // escena: { luz, negro, blanco, tiempo } de la imagen de la cámara (ver FUNDIR).
  dibujar(joya, manos, tamano, escena) {
    const gl = this.gl;
    const { anillo, dedo, cara } = this.piezasDe(joya);
    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.escena);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cara);
    gl.uniform1i(this.u.uCara, 0);
    gl.uniform1i(this.u.uEscena, 1);
    gl.uniform2f(this.u.uNiveles, escena.negro, escena.blanco);
    gl.uniform1f(this.u.uTiempo, escena.tiempo);
    gl.uniform2f(this.u.uTam, gl.canvas.width, gl.canvas.height);
    gl.uniform3fv(this.u.uMetal, joya.metal.map((v) => v / 255));
    gl.uniform4f(this.u.uForma, joya.largo_abajo_mm, joya.placa_mm[0], joya.radioExterior, joya.cuerpo_alto_mm);
    gl.uniform1f(this.u.uCurva, CURVA_BANDA);
    gl.uniform1f(this.u.uLuz, escena.luz);
    gl.enable(gl.DEPTH_TEST);
    for (const mano of manos) {
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.colorMask(false, false, false, false);
      this.taparConLaMano(mano);
      gl.colorMask(true, true, true, true);
      // El anillo se agranda o achica entero para calzar en el dedo de esta persona.
      const escala = ((GROSOR_DEDO[mano.dedo] * mano.palma) / 2 / joya.radioInterior) * tamano;
      this.colocar(mano.origen, mano.a, mano.s, mano.n, escala);
      this.trazar(dedo);
      this.trazar(anillo);
    }
    gl.bindVertexArray(null);
    gl.disable(gl.DEPTH_TEST);
  }
}
