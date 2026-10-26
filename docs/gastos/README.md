# Gastos del proyecto

Registro de lo que cada socio ha pagado para el proyecto, mientras no exista la empresa. Sirve
para saber cuánto se ha invertido y cuánto hay que devolver o reconocer a cada uno cuando se
constituya.

Los gastos están en [`gastos.csv`](gastos.csv), una fila por pago. Se abre con Excel o Google
Sheets.

## Columnas

| Columna | Qué va |
|---|---|
| `fecha` | Día del pago, en formato `AAAA-MM-DD`. |
| `concepto` | Qué se compró. |
| `categoria` | Web y dominios, Marca y legal, Diseño y muestras, Packaging, Fotografía, Otros. |
| `proveedor` | A quién se le pagó. |
| `monto_clp` | Monto total en pesos, sin puntos ni signo. |
| `pagado_por` | El socio que pagó. |
| `periodo` | Si es un servicio con vencimiento, desde cuándo hasta cuándo cubre. |
| `notas` | Detalle útil, como la renovación o la forma de pago. |

## Reglas

- No guardar aquí números de tarjeta, datos bancarios ni contraseñas. Las boletas y
  comprobantes quedan en el correo de quien pagó.
- Si un gasto se reparte entre socios, poner una fila por cada parte.

## Resumen

| Socio | Total pagado |
|---|---|
| Juan Antonio | $19.980 |
| **Total** | **$19.980** |

Actualizado: 2026-10-26.

## Vencimientos a renovar

| Servicio | Vence | Dónde se renueva |
|---|---|---|
| Dominio `pilitrespalacios.cl` | 2028-10-26 | nic.cl |
