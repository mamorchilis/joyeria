# Tareas: app y recordatorio por correo

Decidido el 2026-10-27:

- Las tareas del proyecto se ven y se editan en una **app web con usuario y contraseña**, pensada
  para el celular. Ahí se cambian fechas y responsables, se marcan como listas y se agregan
  tareas nuevas. Cada cambio se guarda solo en el repositorio, con el nombre de quien lo hizo.
- De lunes a viernes, a las 9:00 de Chile, llega un correo con las tareas **atrasadas**, las
  que vencen **hoy** y las de los **próximos 7 días**.

Decidido después, el mismo día: la app se ve como tablero Kanban.

Las dos cosas son gratis: la app corre en Cloudflare Workers (plan gratuito) y el correo lo
manda GitHub Actions desde Gmail, con el computador apagado. Se descartó WhatsApp porque su API
cobra por mensaje.

## Piezas

- `docs/00_tablero/tareas.json`: la lista de tareas. Se edita con la app, no a mano.
- `tareas-app/`: la app (`pagina.html`) y el "portero" (`worker.js`), que revisa la contraseña
  y guarda en el repositorio. Su instalación está en `tareas-app/README.md`.
- `docs/00_tablero/recordatorio_tareas.py`: lee la lista y arma el correo.
- `.github/workflows/recordatorio-tareas.yml`: programa el correo de lunes a viernes.

## Cómo se ve cada tarea

La app es un tablero Kanban con tres columnas: **Por hacer**, **En progreso** y **Listas**. En
el computador se ven lado a lado y las tarjetas se pueden arrastrar; en el celular son tres
pestañas y cada tarjeta tiene un botón para pasarla a la siguiente (Empezar, Lista, Reabrir).
Al empezar una tarea sin responsable, la app pregunta quién la toma. Eliminar no borra: la tarea
queda en "Eliminadas", al pie del tablero, y se puede recuperar.

Cada tarea tiene texto, estado, fecha límite (o sin fecha), responsable (Pili, Juan Antonio,
Ambos o sin responsable) y área. Las que propuso Claude llevan la etiqueta **Propuesta de
Claude** hasta que alguien las acepta o las edita. En el correo, las tareas en progreso salen
con "[en progreso]" y las propuestas con "(propuesta)"; las listas y eliminadas no salen.

## Configuración del correo (hecha el 2026-10-27)

El repositorio es **público**, así que la clave y los correos van como secretos de GitHub, nunca
en un archivo.

1. Los correos salen de la cuenta de Gmail compartida del proyecto, la misma dueña del
   repositorio en GitHub. En esa cuenta se activó la verificación en dos pasos y se creó una
   contraseña de aplicación en <https://myaccount.google.com/apppasswords> (nombre:
   "Recordatorio tareas").
2. En GitHub, en *Settings → Secrets and variables → Actions*, están los secretos
   `GMAIL_USUARIO`, `GMAIL_CLAVE_APP` y `CORREOS_DESTINO` (destinatarios separados por coma).
3. Para probar: *Actions → Recordatorio de tareas → Run workflow*. Envía de inmediato.

Para ver cómo saldría el correo sin enviarlo:
`python docs/00_tablero/recordatorio_tareas.py --prueba` (o con `--fecha 2026-11-10`).

## A tener en cuenta

- Cada cambio en la app es un commit en `main`. Antes de trabajar en una copia local, hacer
  `git pull` para traer lo que se cambió desde la app.
- GitHub puede atrasar las tareas programadas unos minutos, a veces más.
- Chile cambia de hora. Por eso el correo se programa a las 12:00 y a las 13:00 UTC, y se envía
  solo en la que coincide con las 9 en Chile.
- GitHub pausa las tareas programadas si el repositorio pasa 60 días sin cambios. Si deja de
  llegar el correo, revisar la pestaña *Actions*.
- Si la contraseña de aplicación de Gmail o el token de GitHub se filtran o dejan de servir,
  borrarlos y crear otros (ver `tareas-app/README.md`).
