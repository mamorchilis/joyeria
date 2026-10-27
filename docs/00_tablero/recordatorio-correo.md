# Recordatorio de tareas por correo

Decidido el 2026-10-27: de lunes a viernes, a las 9:00 de Chile, llega un correo con las tareas
**atrasadas**, las que vencen **hoy** y las de los **próximos 7 días**. Es gratis: lo corre GitHub
Actions con el computador apagado y se envía desde Gmail. Se descartó WhatsApp porque su API
cobra por mensaje.

## Piezas

- `tareas.md`: la lista de tareas. Es lo único que hay que mantener al día.
- `recordatorio_tareas.py`: lee la lista y arma el correo.
- `.github/workflows/recordatorio-tareas.yml`: lo programa de lunes a viernes.

## Configuración (una sola vez)

El repositorio es **público**, así que la clave y los correos van como secretos de GitHub, nunca
en un archivo.

1. En la cuenta de Gmail que enviará los correos, activar la verificación en dos pasos y crear
   una contraseña de aplicación en <https://myaccount.google.com/apppasswords> (nombre:
   "Recordatorio tareas"). Google muestra 16 letras una sola vez.
2. En GitHub, en el repositorio, ir a *Settings → Secrets and variables → Actions → New
   repository secret* y crear tres secretos:
   - `GMAIL_USUARIO`: el correo que envía.
   - `GMAIL_CLAVE_APP`: las 16 letras del paso 1.
   - `CORREOS_DESTINO`: los destinatarios, separados por coma.
3. Probar en *Actions → Recordatorio de tareas → Run workflow*. Con este botón se envía de
   inmediato, a cualquier hora.

## Uso diario

- Para marcar una tarea como hecha, cambiar `[ ]` por `[x]` en `tareas.md` y subirlo al
  repositorio. Se puede editar desde el celular en github.com, con el lápiz.
- Para ver cómo saldría el correo sin enviarlo:
  `python docs/00_tablero/recordatorio_tareas.py --prueba` (o con `--fecha 2026-11-10`).

## A tener en cuenta

- GitHub puede atrasar las tareas programadas unos minutos, a veces más.
- Chile cambia de hora. Por eso la tarea corre a las 12:00 y a las 13:00 UTC, y envía solo en
  la que coincide con las 9 en Chile.
- GitHub pausa las tareas programadas si el repositorio pasa 60 días sin cambios. Si deja de
  llegar el correo, revisar la pestaña *Actions*.
- Si la contraseña de aplicación se filtra o deja de servir, borrarla en la cuenta de Google y
  crear otra.
