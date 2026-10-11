// Trabajador del cuello: corre el modelo que clasifica cada píxel (piel, ropa, pelo…) en un
// hilo aparte, para que la imagen de la cámara no se detenga mientras se analiza.
//
// Recibe:  { tipo: "crear", mediapipe, modelo, primerMotor, persona }  → responde { tipo: "listo", motor, ancho }
//          { tipo: "cuadro", imagen }                                  → responde { tipo: "categorias", datos, width, height }
// Si algo falla responde { tipo: "error", mensaje }.

// Formas de correr el modelo, de la más rápida a la más segura. En algunos teléfonos la
// tarjeta gráfica no da error pero responde que toda la imagen es fondo, así que cada forma
// se pone a prueba con una foto de una persona y se usa la primera que la ve.
//   porConfianza  pide al modelo cuánto cree en cada categoría, en vez de la categoría ya
//                 elegida
//   ancho         ancho al que conviene reducir la imagen antes de analizarla. El modelo
//                 trabaja a 256 px: más ancho solo afina los bordes, y sin gráfica cuesta caro
const MOTORES = [
  { nombre: "con gráfica", delegado: "GPU", porConfianza: false, ancho: 512 },
  { nombre: "con gráfica, por confianza", delegado: "GPU", porConfianza: true, ancho: 256 },
  { nombre: "sin gráfica", delegado: "CPU", porConfianza: false, ancho: 256 },
];

let detector = null, motor = null;

// El paquete de MediaPipe viene como módulo o para Node, y un trabajador como este necesita
// un guion suelto: se baja la versión de Node y se carga con `exports` ya definido.
async function cargarMediaPipe(base) {
  self.exports = {};
  const texto = await (await fetch(`${base}/vision_bundle.cjs`)).text();
  importScripts(URL.createObjectURL(new Blob([texto], { type: "text/javascript" })));
  return self.exports;
}

// La categoría de cada píxel, como { datos, width, height }, venga como venga del modelo.
function categoriasDe(resultado) {
  const elegida = resultado.categoryMask;
  if (elegida) {
    const categorias = { datos: elegida.getAsUint8Array().slice(), width: elegida.width, height: elegida.height };
    elegida.close();
    return categorias;
  }
  // Una máscara de confianza por categoría: gana la mayor en cada píxel.
  const mascaras = resultado.confidenceMasks;
  const confianzas = mascaras.map((m) => m.getAsFloat32Array());
  const datos = new Uint8Array(confianzas[0].length);
  for (let i = 0; i < datos.length; i++) {
    let mejor = 0;
    for (let c = 1; c < confianzas.length; c++) if (confianzas[c][i] > confianzas[mejor][i]) mejor = c;
    datos[i] = mejor;
  }
  const categorias = { datos, width: mascaras[0].width, height: mascaras[0].height };
  mascaras.forEach((m) => m.close());
  return categorias;
}

function veAUnaPersona(candidato, persona) {
  const { datos } = categoriasDe(candidato.segment(persona));
  let noFondo = 0;
  for (const categoria of datos) if (categoria !== 0) noFondo++;
  return noFondo > datos.length * 0.05;
}

async function crear({ mediapipe, modelo, primerMotor, persona }) {
  const { FilesetResolver, ImageSegmenter } = await cargarMediaPipe(mediapipe);
  const archivos = await FilesetResolver.forVisionTasks(`${mediapipe}/wasm`);
  const armar = () =>
    ImageSegmenter.createFromOptions(archivos, {
      baseOptions: { modelAssetPath: modelo, delegate: motor.delegado },
      runningMode: "IMAGE",
      outputCategoryMask: !motor.porConfianza,
      outputConfidenceMasks: motor.porConfianza,
    });
  const candidatos = MOTORES.slice(primerMotor);
  for (motor of candidatos.slice(0, -1)) {
    try {
      const candidato = await armar();
      if (veAUnaPersona(candidato, persona)) return candidato;
      candidato.close();
    } catch (error) {
      console.warn(`El modelo del cuello no funcionó ${motor.nombre}:`, error);
    }
  }
  motor = candidatos.at(-1);
  return armar();
}

onmessage = async ({ data }) => {
  try {
    if (data.tipo === "crear") {
      detector = await crear(data);
      postMessage({ tipo: "listo", motor: motor.nombre, ancho: motor.ancho });
    } else if (data.tipo === "cuadro") {
      const categorias = categoriasDe(detector.segment(data.imagen));
      data.imagen.close();
      postMessage({ tipo: "categorias", ...categorias }, [categorias.datos.buffer]);
    }
  } catch (error) {
    postMessage({ tipo: "error", mensaje: String(error?.message ?? error) });
  }
};
