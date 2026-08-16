# Auditoría · Editor móvil compacto

**Fecha:** 2026-08-16 10:48 CLT  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `feat/compact-mobile-editor`  
**Responsable:** ChatGPT · GPT-5.6 Sol

## Objetivo

Reducir el scroll y la densidad excesiva del formulario de edición en teléfono, manteniendo legibilidad, accesibilidad táctil y el flujo completo de seguimiento.

## Cambios

- hero móvil reducido de forma importante;
- poster de ficha más pequeño;
- título compacto en una línea;
- seguimiento rápido convertido en control compacto de 3 columnas para series/anime y 2 para películas;
- descripciones secundarias de los estados rápidos ocultas en móvil;
- Estado + Tipo en dos columnas;
- Temporada/Episodio y totales en dos columnas;
- inputs mantienen `16px` para evitar zoom automático de iOS;
- textarea de notas más corto;
- footer fijo de acciones en una sola fila;
- Cancelar, Guardar y Eliminar conservan targets táctiles de al menos 44px;
- fallback adicional para pantallas <=360px.

## Alcance técnico

Se agrega `src/compact-editor.css`, cargado después del resto de estilos para actuar como capa final de refinamiento sin alterar lógica de Supabase ni contratos del editor.

## QA

Se agrega `tests/compact-editor.test.mjs` con regresiones para:

1. orden de carga CSS;
2. hero compacto;
3. quick status en tres columnas;
4. Estado/Tipo lado a lado;
5. progreso en dos columnas;
6. fuente 16px en inputs;
7. acciones en una fila;
8. targets táctiles >=44px.

## Datos

Sin cambios SQL, RLS, autenticación ni mutaciones de datos.

## Estado

Implementación completada. Pendiente CI, TypeScript, build y Vercel Preview antes de merge.
