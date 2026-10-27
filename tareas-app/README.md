# App de tareas

Página para ver y editar las tareas del proyecto desde el celular, con usuario y contraseña.
Guarda los cambios en `docs/00_tablero/tareas.json`. Para qué sirve y cómo se relaciona con el
correo diario: `docs/00_tablero/recordatorio-correo.md`.

```
celular → pagina.html → worker.js (Cloudflare) → GitHub (tareas.json)
          usuario + contraseña     guarda el token
```

- `pagina.html`: la app que ve cada persona.
- `worker.js`: el "portero". Revisa la contraseña y escribe en el repositorio con un token que
  solo él conoce. Si dos personas guardan al mismo tiempo, vuelve a leer y aplica el cambio
  encima, así no se pisan.
- `wrangler.toml`: configuración de Cloudflare (nombre de la app, repositorio y archivo).

Está publicada en Cloudflare Workers, en la cuenta que maneja Juan Antonio, con el nombre
`tareas-joyeria`.

## Secretos

Van en Cloudflare, nunca en el repositorio:

| Secreto | Qué es |
|---|---|
| `USUARIOS` | Nombres y contraseñas, en formato `{"Pili":"...","Juan Antonio":"..."}` |
| `SECRETO_SESION` | Texto largo al azar con el que se firman las sesiones. Si se cambia, todos tienen que volver a entrar. |
| `GITHUB_TOKEN` | Token *fine-grained* de la cuenta dueña del repositorio, con acceso solo a este repositorio y permiso *Contents: Read and write*. |

Para cambiar uno, desde la raíz del repositorio (pide el valor sin mostrarlo):

```
npx wrangler secret put USUARIOS --config tareas-app/wrangler.toml
```

Para agregar a una persona, se cambia `USUARIOS` con todos los nombres (los que estaban y el
nuevo). Para que pueda elegirse como responsable, hay que sumarla también a `responsables` en
`tareas.json`.

## Probar en local

Sin `GITHUB_TOKEN`, la app funciona en **modo prueba**: muestra un aviso morado y guarda en
memoria, sin tocar el repositorio.

1. Crear `tareas-app/.dev.vars` (está en `.gitignore`) con usuarios y contraseñas de prueba,
   un `SECRETO_SESION` cualquiera y `SEMILLA_URL=http://127.0.0.1:8126/tareas.json`.
2. Levantar `tareas-semilla` y `tareas-app` de `.claude/launch.json`, y abrir
   `http://localhost:8787`.

## Publicar cambios

```
npx wrangler deploy --config tareas-app/wrangler.toml
```

La primera vez hay que conectar Cloudflare con `npx wrangler login`.
