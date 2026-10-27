"""Manda por correo el recordatorio diario de tareas (docs/00_tablero/tareas.md).

El correo tiene tres bloques: lo atrasado, lo que vence hoy y lo de los próximos
7 días. Lo corre GitHub Actions de lunes a viernes (.github/workflows/recordatorio-tareas.yml).

Se envía desde una cuenta de Gmail con una "contraseña de aplicación". Los datos
van en variables de entorno, nunca en el repositorio (que es público):
  GMAIL_USUARIO     cuenta que envía, por ejemplo alguien@gmail.com
  GMAIL_CLAVE_APP   contraseña de aplicación de esa cuenta (16 letras)
  CORREOS_DESTINO   destinatarios separados por coma

Uso, desde la raíz del repositorio:
  python docs/00_tablero/recordatorio_tareas.py --prueba        # muestra el correo, no lo envía
  python docs/00_tablero/recordatorio_tareas.py --prueba --fecha 2026-11-10
  python docs/00_tablero/recordatorio_tareas.py                 # lo envía
  python docs/00_tablero/recordatorio_tareas.py --solo-a-las 9  # envía solo si en Chile son las 9
"""

import argparse
import html
import os
import re
import smtplib
import sys
from datetime import date, datetime, timedelta
from email.message import EmailMessage
from pathlib import Path

TAREAS = Path(__file__).resolve().parent / "tareas.md"
REPO = os.environ.get("GITHUB_REPOSITORY", "mamorchilis/joyeria")
ENLACE = f"https://github.com/{REPO}/blob/main/docs/00_tablero/tareas.md"
DIAS_SEMANA = 7

DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
         "septiembre", "octubre", "noviembre", "diciembre"]

# - [ ] 2026-11-06 · Responsable · Tarea   (también "sin fecha" y separador "|")
LINEA = re.compile(
    r"^\s*[-*]\s*\[(?P<hecha>[ xX])\]\s*"
    r"(?P<fecha>\d{4}-\d{2}-\d{2}|sin fecha)\s*[·|]\s*"
    r"(?P<quien>[^·|]+?)\s*[·|]\s*(?P<que>.+?)\s*$",
    re.IGNORECASE,
)


def ahora_en_chile():
    try:
        from zoneinfo import ZoneInfo
        return datetime.now(ZoneInfo("America/Santiago"))
    except Exception:  # Windows sin el paquete tzdata
        return datetime.now()


def leer_tareas(texto):
    tareas, raras = [], []
    en_codigo = False  # los ejemplos dentro de ``` no son tareas
    for n, linea in enumerate(texto.splitlines(), 1):
        if linea.strip().startswith("```"):
            en_codigo = not en_codigo
        if en_codigo or not re.match(r"^\s*[-*]\s*\[[ xX]\]", linea):
            continue
        m = LINEA.match(linea)
        if not m:
            raras.append((n, linea.strip()))
            continue
        if m["hecha"].lower() == "x":
            continue
        fecha = None if m["fecha"].lower() == "sin fecha" else date.fromisoformat(m["fecha"])
        tareas.append({"fecha": fecha, "quien": m["quien"], "que": m["que"]})
    return tareas, raras


def fecha_larga(d):
    return f"{DIAS[d.weekday()]} {d.day} de {MESES[d.month - 1]}"


def fecha_corta(d):
    return f"{DIAS[d.weekday()][:3]} {d.day} {MESES[d.month - 1][:3]}"


def armar_correo(tareas, raras, hoy):
    con_fecha = sorted((t for t in tareas if t["fecha"]), key=lambda t: t["fecha"])
    atrasadas = [t for t in con_fecha if t["fecha"] < hoy]
    de_hoy = [t for t in con_fecha if t["fecha"] == hoy]
    proximas = [t for t in con_fecha if hoy < t["fecha"] <= hoy + timedelta(days=DIAS_SEMANA)]
    sin_fecha = [t for t in tareas if not t["fecha"]]

    partes = []
    if atrasadas:
        partes.append(f"{len(atrasadas)} atrasada{'s' if len(atrasadas) > 1 else ''}")
    partes.append(f"{len(de_hoy)} para hoy")
    asunto = f"Tareas · {fecha_corta(hoy)} · " + ", ".join(partes)

    bloques = [
        ("Atrasado", atrasadas, "#b42318", lambda t: f"venció {fecha_corta(t['fecha'])}, hace {(hoy - t['fecha']).days} "
                                            + ("día" if (hoy - t["fecha"]).days == 1 else "días")),
        ("Hoy", de_hoy, "#1d4ed8", lambda t: ""),
        (f"Próximos {DIAS_SEMANA} días", proximas, "#374151", lambda t: fecha_corta(t["fecha"])),
    ]

    texto = [f"Tareas para el {fecha_larga(hoy)}", ""]
    cuerpo = [f'<p style="font-size:15px">Tareas para el <b>{fecha_larga(hoy)}</b></p>']
    for titulo, lista, color, detalle in bloques:
        texto.append(f"{titulo.upper()} ({len(lista)})")
        cuerpo.append(f'<h3 style="color:{color};margin:18px 0 6px">{titulo} ({len(lista)})</h3>')
        if not lista:
            texto.append("  Nada.")
            cuerpo.append('<p style="color:#6b7280;margin:0">Nada.</p>')
        else:
            cuerpo.append('<ul style="margin:0;padding-left:20px">')
            for t in lista:
                extra = detalle(t)
                texto.append(f"  - {t['que']} ({t['quien']}{', ' + extra if extra else ''})")
                cuerpo.append(
                    f"<li style='margin:4px 0'>{html.escape(t['que'])} "
                    f"<span style='color:#6b7280'>· {html.escape(t['quien'])}"
                    f"{' · ' + html.escape(extra) if extra else ''}</span></li>"
                )
            cuerpo.append("</ul>")
        texto.append("")

    pie = []
    if sin_fecha:
        pie.append(f"Hay {len(sin_fecha)} tarea{'s' if len(sin_fecha) > 1 else ''} sin fecha.")
    if raras:
        pie.append(f"{len(raras)} línea(s) de tareas.md no tienen el formato esperado "
                   f"(líneas {', '.join(str(n) for n, _ in raras)}).")
    pie.append(f"Para marcar una tarea como hecha o cambiar fechas, editar tareas.md: {ENLACE}")
    texto += pie
    cuerpo.append('<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0 10px">')
    cuerpo += [f'<p style="color:#6b7280;font-size:13px;margin:4px 0">{html.escape(p)}</p>'
               for p in pie[:-1]]
    cuerpo.append(f'<p style="color:#6b7280;font-size:13px;margin:4px 0">Para marcar una tarea como '
                  f'hecha o cambiar fechas, editar <a href="{ENLACE}">tareas.md</a>.</p>')

    html_final = ('<div style="font-family:Arial,sans-serif;color:#111827;max-width:600px">'
                  + "\n".join(cuerpo) + "</div>")
    return asunto, "\n".join(texto), html_final


def enviar(asunto, texto, html_cuerpo):
    usuario = os.environ.get("GMAIL_USUARIO", "").strip()
    clave = os.environ.get("GMAIL_CLAVE_APP", "").replace(" ", "")
    destinos = [c.strip() for c in os.environ.get("CORREOS_DESTINO", "").split(",") if c.strip()]
    faltan = [n for n, v in [("GMAIL_USUARIO", usuario), ("GMAIL_CLAVE_APP", clave),
                             ("CORREOS_DESTINO", destinos)] if not v]
    if faltan:
        sys.exit(f"Faltan variables de entorno: {', '.join(faltan)}")

    msg = EmailMessage()
    msg["Subject"] = asunto
    msg["From"] = f"Tareas del proyecto Joyería <{usuario}>"
    msg["To"] = ", ".join(destinos)
    msg.set_content(texto)
    msg.add_alternative(html_cuerpo, subtype="html")
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(usuario, clave)
        smtp.send_message(msg)
    print(f"Enviado a {len(destinos)} destinatario(s): {asunto}")


def main():
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--prueba", action="store_true", help="muestra el correo sin enviarlo")
    p.add_argument("--fecha", help="simula otro día (AAAA-MM-DD)")
    p.add_argument("--solo-a-las", type=int, metavar="HORA",
                   help="envía solo si en Chile es esa hora (para el horario de verano)")
    args = p.parse_args()

    ahora = ahora_en_chile()
    if args.solo_a_las is not None and ahora.hour != args.solo_a_las:
        print(f"En Chile son las {ahora:%H:%M}; se envía solo a las {args.solo_a_las}. Nada que hacer.")
        return

    hoy = date.fromisoformat(args.fecha) if args.fecha else ahora.date()
    tareas, raras = leer_tareas(TAREAS.read_text(encoding="utf-8"))
    asunto, texto, html_cuerpo = armar_correo(tareas, raras, hoy)

    if args.prueba:
        print(f"Asunto: {asunto}\n\n{texto}")
    else:
        enviar(asunto, texto, html_cuerpo)


if __name__ == "__main__":
    main()
