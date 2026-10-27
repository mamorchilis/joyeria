// App de tareas del proyecto: página + "portero" que guarda los cambios en el repo.
//
// La página (pagina.html) habla solo con este Worker. El Worker revisa usuario y
// contraseña y, si están bien, escribe docs/00_tablero/tareas.json en GitHub con un
// token que nadie más ve. Cada cambio queda como un commit con el nombre de quien lo hizo.
//
// Secretos (en Cloudflare, nunca en el repo; para probar en local van en .dev.vars):
//   USUARIOS        JSON con nombre y contraseña: {"Pili":"...","Juan Antonio":"..."}
//   SECRETO_SESION  texto largo al azar para firmar las sesiones
//   GITHUB_TOKEN    token con permiso de escritura solo sobre este repo
// Sin GITHUB_TOKEN funciona en modo prueba: guarda en memoria, no toca el repo.

import PAGINA from "./pagina.html";

const DIAS_SESION = 180;
const enMemoria = { datos: null, sha: "prueba" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/" && request.method === "GET") {
        return new Response(PAGINA, {
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
        });
      }
      if (url.pathname === "/api/config" && request.method === "GET") {
        return json({ usuarios: Object.keys(usuarios(env)), prueba: !env.GITHUB_TOKEN });
      }
      if (url.pathname === "/api/entrar" && request.method === "POST") {
        return entrar(request, env);
      }
      if (url.pathname === "/api/tareas" && request.method === "GET") {
        if (!(await quienEs(request, env))) return json({ error: "Hay que entrar de nuevo." }, 401);
        const { datos, sha } = await leer(env);
        return json({ datos, sha });
      }
      if (url.pathname === "/api/cambio" && request.method === "POST") {
        const usuario = await quienEs(request, env);
        if (!usuario) return json({ error: "Hay que entrar de nuevo." }, 401);
        return cambiar(await request.json(), usuario, env);
      }
      return json({ error: "No existe." }, 404);
    } catch (e) {
      return json({ error: e.publico || "Algo falló. Intenta de nuevo en un rato." , detalle: String(e.message || e) }, e.status || 500);
    }
  },
};

// ---------- Sesión ----------

function usuarios(env) {
  try {
    return JSON.parse(env.USUARIOS || "{}");
  } catch {
    return {};
  }
}

async function entrar(request, env) {
  const { usuario = "", clave = "" } = await request.json().catch(() => ({}));
  const lista = usuarios(env);
  const nombre = Object.keys(lista).find((n) => n.toLowerCase() === String(usuario).trim().toLowerCase());
  if (!nombre || !(await iguales(lista[nombre], String(clave)))) {
    await new Promise((r) => setTimeout(r, 800)); // frena a quien prueba claves al azar
    return json({ error: "Nombre o contraseña incorrectos." }, 401);
  }
  const datos = b64url(JSON.stringify({ u: nombre, exp: Date.now() + DIAS_SESION * 864e5 }));
  return json({ token: `${datos}.${await firmar(datos, env)}`, usuario: nombre });
}

async function quienEs(request, env) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
  const [datos, firma] = token.split(".");
  if (!datos || !firma || !(await iguales(firma, await firmar(datos, env)))) return null;
  const { u, exp } = JSON.parse(desdeB64url(datos));
  return exp > Date.now() && u in usuarios(env) ? u : null;
}

async function firmar(texto, env) {
  if (!env.SECRETO_SESION) throw Object.assign(new Error("Falta SECRETO_SESION"), { publico: "La app no está configurada." });
  const llave = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.SECRETO_SESION),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const firma = await crypto.subtle.sign("HMAC", llave, new TextEncoder().encode(texto));
  return [...new Uint8Array(firma)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function iguales(a, b) {
  // Compara sin revelar por el tiempo cuántas letras coinciden.
  const h = async (t) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(t))));
  const [x, y] = await Promise.all([h(a), h(b)]);
  let dif = 0;
  for (let i = 0; i < x.length; i++) dif |= x[i] ^ y[i];
  return dif === 0;
}

// ---------- Leer y guardar en GitHub ----------

function gh(env, ruta, init = {}) {
  return fetch(`https://api.github.com/repos/${env.REPO}/contents/${env.ARCHIVO}${ruta}`, {
    ...init,
    headers: {
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      accept: "application/vnd.github+json",
      "user-agent": "tareas-joyeria",
      "x-github-api-version": "2022-11-28",
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
  });
}

async function leer(env) {
  if (!env.GITHUB_TOKEN) {
    if (!enMemoria.datos) {
      const r = await fetch(env.SEMILLA_URL || `https://raw.githubusercontent.com/${env.REPO}/${env.RAMA}/${env.ARCHIVO}`);
      enMemoria.datos = await r.json();
    }
    return { datos: structuredClone(enMemoria.datos), sha: enMemoria.sha };
  }
  const r = await gh(env, `?ref=${env.RAMA}`);
  if (!r.ok) throw Object.assign(new Error(`GitHub ${r.status}: ${await r.text()}`), { publico: "No se pudo leer la lista de tareas." });
  const archivo = await r.json();
  const bytes = Uint8Array.from(atob(archivo.content.replace(/\n/g, "")), (c) => c.charCodeAt(0));
  return { datos: JSON.parse(new TextDecoder().decode(bytes)), sha: archivo.sha };
}

async function guardar(env, datos, sha, mensaje, usuario) {
  if (!env.GITHUB_TOKEN) {
    enMemoria.datos = structuredClone(datos);
    enMemoria.sha = `prueba-${Date.now()}`;
    return { ok: true, sha: enMemoria.sha };
  }
  const texto = JSON.stringify(datos, null, 2) + "\n";
  const bytes = new TextEncoder().encode(texto);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const r = await gh(env, "", {
    method: "PUT",
    body: JSON.stringify({
      message: mensaje,
      content: btoa(bin),
      sha,
      branch: env.RAMA,
      author: { name: `${usuario} (app de tareas)`, email: "tareas-app@users.noreply.github.com" },
    }),
  });
  if (r.status === 409 || r.status === 422) return { ok: false }; // alguien guardó justo antes
  if (!r.ok) throw Object.assign(new Error(`GitHub ${r.status}: ${await r.text()}`), { publico: "No se pudo guardar el cambio." });
  return { ok: true, sha: (await r.json()).content.sha };
}

// ---------- Cambios ----------

async function cambiar(cambio, usuario, env) {
  // Se aplica sobre la versión más nueva del archivo; si otra persona guardó al mismo
  // tiempo, se vuelve a leer y se aplica de nuevo, así no se pisa el trabajo ajeno.
  for (let intento = 0; intento < 4; intento++) {
    const { datos, sha } = await leer(env);
    const mensaje = aplicar(datos, cambio, usuario);
    datos.actualizado = hoyChile();
    const r = await guardar(env, datos, sha, `Tareas (${usuario}): ${mensaje}`, usuario);
    if (r.ok) return json({ datos, sha: r.sha, mensaje });
  }
  return json({ error: "Había muchos cambios al mismo tiempo. Intenta de nuevo." }, 409);
}

function aplicar(datos, { accion, id, campos = {} }, usuario) {
  const error = (texto) => { throw Object.assign(new Error(texto), { publico: texto, status: 400 }); };
  const tarea = datos.tareas.find((t) => t.id === id);
  if (accion !== "crear" && !tarea) error("Esa tarea ya no existe. Recarga la página.");

  const limpio = {};
  if ("titulo" in campos) {
    const t = String(campos.titulo || "").trim().replace(/\s+/g, " ");
    if (!t) error("La tarea necesita un texto.");
    if (t.length > 300) error("El texto es muy largo (máximo 300 letras).");
    limpio.titulo = t;
  }
  if ("fecha" in campos) {
    if (campos.fecha && !/^\d{4}-\d{2}-\d{2}$/.test(campos.fecha)) error("La fecha no es válida.");
    limpio.fecha = campos.fecha || null;
  }
  if ("responsable" in campos) {
    if (campos.responsable && !datos.responsables.includes(campos.responsable)) error("Ese responsable no está en la lista.");
    limpio.responsable = campos.responsable || null;
  }
  if ("area" in campos) {
    if (campos.area && !datos.areas.includes(campos.area)) error("Esa área no está en la lista.");
    limpio.area = campos.area || null;
  }

  const nombre = (t) => `«${t.titulo.length > 60 ? t.titulo.slice(0, 57) + "…" : t.titulo}»`;
  switch (accion) {
    case "crear": {
      if (!limpio.titulo) error("La tarea necesita un texto.");
      const estado = ESTADOS.includes(campos.estado) && campos.estado !== "eliminada" ? campos.estado : "por_hacer";
      const n = Math.max(0, ...datos.tareas.map((t) => parseInt(t.id.slice(1)) || 0)) + 1;
      const nueva = { id: `t${n}`, titulo: limpio.titulo, fecha: limpio.fecha ?? null,
        responsable: limpio.responsable ?? null, area: limpio.area ?? null, estado, origen: "socios",
        creada: hoyChile(), por: usuario };
      fijarEstado(nueva, estado, usuario);
      datos.tareas.push(nueva);
      return `agregó ${nombre(nueva)}`;
    }
    case "editar":
      Object.assign(tarea, limpio, { aprobada: true });
      if (campos.estado && campos.estado !== estadoDe(tarea)) {
        if (!ESTADOS.includes(campos.estado) || campos.estado === "eliminada") error("Estado no válido.");
        fijarEstado(tarea, campos.estado, usuario);
      }
      return `editó ${nombre(tarea)}`;
    case "aprobar":
      tarea.aprobada = true;
      return `aceptó la propuesta ${nombre(tarea)}`;
    case "estado": {
      if (!ESTADOS.includes(campos.estado) || campos.estado === "eliminada") error("Estado no válido.");
      const antes = estadoDe(tarea);
      fijarEstado(tarea, campos.estado, usuario);
      tarea.aprobada = true;
      // Al empezar una tarea sin responsable, la app pregunta quién la toma.
      if ("responsable" in limpio) tarea.responsable = limpio.responsable;
      const verbo = { por_hacer: antes === "lista" ? "volvió a abrir" : "devolvió a por hacer",
        en_progreso: "empezó", lista: "marcó como lista" }[campos.estado];
      return `${verbo} ${nombre(tarea)}${limpio.responsable ? ` (responsable: ${limpio.responsable})` : ""}`;
    }
    case "eliminar":
      // No se borra: queda en "Eliminadas" y se puede recuperar.
      tarea.estado_previo = estadoDe(tarea);
      fijarEstado(tarea, "eliminada", usuario);
      return `eliminó ${nombre(tarea)}`;
    case "recuperar":
      if (estadoDe(tarea) !== "eliminada") error("Esa tarea no está eliminada.");
      fijarEstado(tarea, tarea.estado_previo && tarea.estado_previo !== "eliminada" ? tarea.estado_previo : "por_hacer", usuario);
      delete tarea.estado_previo;
      return `recuperó ${nombre(tarea)}`;
    default:
      error("Acción desconocida.");
  }
}

const ESTADOS = ["por_hacer", "en_progreso", "lista", "eliminada"];

// Las tareas antiguas tenían "hecha: true/false" en vez de "estado".
function estadoDe(t) {
  return t.estado || (t.hecha ? "lista" : "por_hacer");
}

// Cada estado guarda cuándo y quién lo puso; al cambiar de estado se borran las marcas que
// ya no corresponden (salvo "iniciada", que se conserva al terminar la tarea).
const MARCAS = { en_progreso: "iniciada", lista: "completada", eliminada: "eliminada" };

function fijarEstado(t, estado, usuario) {
  delete t.hecha;
  for (const [e, campo] of Object.entries(MARCAS)) {
    if (e === estado || (e === "en_progreso" && estado === "lista")) continue;
    delete t[campo];
    delete t[`${campo}_por`];
  }
  t.estado = estado;
  const campo = MARCAS[estado];
  if (campo && !t[campo]) Object.assign(t, { [campo]: hoyChile(), [`${campo}_por`]: usuario });
}

// ---------- Utilidades ----------

function hoyChile() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date());
}

function json(cuerpo, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function b64url(texto) {
  let bin = "";
  for (const b of new TextEncoder().encode(texto)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function desdeB64url(texto) {
  const bin = atob(texto.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}
