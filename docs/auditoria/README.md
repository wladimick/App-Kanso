# Protocolo de auditoría · Kanso

Desde el 15 de agosto de 2026, todo bloque de trabajo realizado sobre Kanso debe quedar documentado en esta carpeta.

## Convención

Nombre recomendado:

`YYYY-MM-DD-HHMM-descripcion.md`

Zona horaria de referencia: `America/Santiago`.

## Contenido mínimo por registro

1. Fecha y hora.
2. Objetivo del bloque de trabajo.
3. Estado inicial conocido.
4. Acciones realizadas.
5. Archivos creados, modificados o eliminados.
6. Cambios externos realizados en GitHub, Supabase, Vercel u otros servicios.
7. Decisiones técnicas y de seguridad.
8. Validaciones ejecutadas y resultado.
9. Limitaciones o acciones que no pudieron ejecutarse.
10. Pendientes y siguiente paso recomendado.
11. Rama, PR y commits relevantes cuando corresponda.

## Criterio

La auditoría debe describir lo que efectivamente se hizo. Una acción pendiente no se registra como completada. Si una herramienta o integración no permitió validar un cambio, se deja indicado explícitamente.
