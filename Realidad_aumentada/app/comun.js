// Utilidades que comparten los seguimientos de cada tipo de joya.

export const MEDIAPIPE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

export const rad = (g) => (g * Math.PI) / 180;
export const limitar = (x, a, b) => Math.min(b, Math.max(a, x));
export const suave = (x, a, b) => {
  const t = limitar((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Mediana corta seguida de un filtro "1€": suaviza el temblor cuando la persona está quieta
// sin retrasar los movimientos rápidos. `mediana` es cuántos cuadros recientes se comparan:
// más cuadros descartan mejor una medida suelta, a cambio de algo de retraso.
export class Filtro {
  constructor(corteMin = 1.0, beta = 0.01, mediana = 5) {
    this.corteMin = corteMin;
    this.beta = beta;
    this.mediana = mediana;
    this.recientes = [];
    this.x = null;
    this.dx = 0;
    this.t = 0;
  }
  static alfa(corte, dt) {
    const tau = 1 / (2 * Math.PI * corte);
    return 1 / (1 + tau / dt);
  }
  filtrar(crudo, t) {
    this.recientes.push(crudo);
    if (this.recientes.length > this.mediana) this.recientes.shift();
    const x = [...this.recientes].sort((a, b) => a - b)[this.recientes.length >> 1];
    if (this.x === null) {
      this.x = x;
      this.t = t;
      return x;
    }
    const dt = Math.max(t - this.t, 1e-3);
    const dx = (x - this.x) / dt;
    this.dx += Filtro.alfa(1.0, dt) * (dx - this.dx);
    this.x += Filtro.alfa(this.corteMin + this.beta * Math.abs(this.dx), dt) * (x - this.x);
    this.t = t;
    return this.x;
  }
  reiniciar() {
    this.recientes = [];
    this.x = null;
    this.dx = 0;
  }
}

// Lo que comparten los sombreadores de todas las joyas para que el dibujo se funda con la
// imagen de la cámara: la cámara no entrega negros ni blancos puros, y tiene grano.
//   uNiveles  el negro y el blanco de la imagen (0 a 1)
//   uLuz      cuánta luz hay en la escena
//   uTiempo   cambia en cada cuadro, para que el grano no quede quieto
export const FUNDIR = `
uniform vec2 uNiveles;
uniform float uLuz;
uniform float uTiempo;
vec3 fundir(vec3 c) {
  float grano = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTiempo) * 43758.5453) - 0.5;
  return uNiveles.x + clamp(c * uLuz, 0.0, 1.15) * (uNiveles.y - uNiveles.x) + grano * 0.035;
}`;

export function compilar(gl, vertices, fragmentos) {
  const prog = gl.createProgram();
  for (const [tipo, fuente] of [[gl.VERTEX_SHADER, vertices], [gl.FRAGMENT_SHADER, fragmentos]]) {
    const sh = gl.createShader(tipo);
    gl.shaderSource(sh, fuente);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    gl.attachShader(prog, sh);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  return prog;
}
