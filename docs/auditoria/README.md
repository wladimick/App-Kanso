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

## Credenciales y secretos

- Nunca copiar valores reales de tokens, API keys privadas, `service_role`, `sb_secret_...` u otros secretos a `docs/`.
- Registrar solamente el nombre lógico de la variable y si fue entregada/configurada/verificada.
- Las credenciales entregadas por el usuario pueden utilizarse para orientar la configuración, pero no deben incorporarse a GitHub salvo que sean explícitamente públicas por diseño.
- Variables `VITE_*` se consideran visibles al navegador y no deben contener secretos.

## Criterio

La auditoría debe describir lo que efectivamente se hizo. Una acción pendiente no se registra como completada. Si una herramienta o integración no permitió validar un cambio, se deja indicado explícitamente.

Los estados deben diferenciar claramente entre:

- ejecutado por ChatGPT;
- ejecutado manualmente por el usuario;
- validado directamente;
- informado pero no verificable desde la conexión disponible;
- pendiente.
