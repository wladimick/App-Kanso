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
9. Errores/incidencias, causa y corrección.
10. Limitaciones o acciones que no pudieron ejecutarse.
11. Pendientes y siguiente paso recomendado.
12. Rama, PR, commits y runs relevantes cuando corresponda.
13. Estado final del bloque.

## Acciones realizadas fuera de ChatGPT

Cuando el usuario ejecute manualmente una acción en un servicio externo —por ejemplo Supabase, Vercel, DNS, GitHub o una consola de proveedor— el registro debe distinguir explícitamente entre:

- **acción informada por el usuario**;
- **acción ejecutada directamente por ChatGPT/herramienta**;
- **acción verificada técnicamente por ChatGPT**;
- **acción no verificable desde las conexiones disponibles**.

Una acción manual no se marca como "verificada" solo porque el usuario confirmó haberla realizado. Se registra su confirmación y, si corresponde, se deja una validación técnica posterior como pendiente.

## Historial

Los registros anteriores no deben reescribirse para simular que un estado posterior ya existía. Cuando cambie una condición relevante, crear un nuevo registro que haga referencia al anterior. Esto conserva la secuencia real del proyecto.

## CI y errores

Los fallos de CI forman parte de la auditoría y no deben ocultarse. Registrar cuando sea aplicable:

- run o job;
- paso que falló;
- mensaje de error relevante;
- corrección aplicada;
- validación posterior.

## Seguridad

No copiar a `docs/`:

- service role keys;
- secret keys;
- contraseñas;
- tokens privados;
- cookies/sesiones;
- información sensible innecesaria.

Las publishable keys pueden ser públicas por diseño, pero la documentación debe favorecer nombres de variables y evitar duplicar credenciales sin necesidad.

## Criterio

La auditoría debe describir lo que efectivamente se hizo. Una acción pendiente no se registra como completada. Si una herramienta o integración no permitió validar un cambio, se deja indicado explícitamente.
