# Auditoría · Fichas ricas, rating TMDB y relacionados

**Fecha:** 2026-08-16 02:00 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `feat/rich-media-details`  
**Responsable:** ChatGPT · GPT-5.6 Sol

## Objetivo

Evolucionar Kanso desde una biblioteca editable hacia una experiencia de entretenimiento más rica, inspirada conceptualmente en patrones de apps como JustWatch pero manteniendo identidad propia.

## Cambios implementados

### Ratings en cards

- cada título TMDB intenta resolver su `vote_average` mediante el catálogo protegido existente;
- se muestra como `TMDB XX%` y se conserva también la escala `/10` en vistas amplias;
- no se presenta el porcentaje como rating de JustWatch ni IMDb;
- metadata cacheada en memoria por `source + externalId` para evitar solicitudes repetidas dentro de la misma sesión.

### Ficha rica

Se crea `src/components/MediaDetail.tsx`.

Al tocar un título de biblioteca se abre primero su ficha visual y no el editor directamente.

La ficha incluye:

- backdrop;
- poster;
- título, año y tipo;
- tagline cuando existe;
- rating TMDB;
- cantidad de votos cuando está disponible;
- nota personal Kanso;
- géneros;
- descripción;
- estado/progreso personal;
- acceso a edición;
- acción +1 episodio cuando aplica;
- temporadas;
- episodios de la temporada seleccionada;
- relacionados.

El editor anterior continúa disponible desde la ficha y mantiene todas sus capacidades.

### TMDB detalle protegido

Se agrega `supabase/functions/tmdb-details/index.ts`.

- requiere usuario autenticado;
- usa `TMDB_READ_ACCESS_TOKEN` exclusivamente en servidor;
- consulta detalles de película y TV;
- consulta similares;
- consulta detalle de temporada y episodios;
- idioma `es-CL`;
- no expone el token al navegador.

### Degradación segura

Kanso intenta usar `tmdb-details`. Si la Edge Function todavía no está desplegada en el proyecto Supabase de Kanso, la ficha utiliza como fallback el `tmdb-search` ya existente para recuperar backdrop, descripción y rating básico. En ese estado, temporadas/episodios/relacionados quedan ocultos en lugar de romper la ficha.

Esto permite probar y desplegar el frontend de manera segura incluso antes de activar el nuevo endpoint.

## Fuentes técnicas verificadas

Se verificó la API oficial de TMDB para:

- Movie Details;
- TV Series Details;
- TV Season Details;
- Movie Similar;
- TV Series Similar.

## QA automatizado

Se agrega `tests/rich-media.test.mjs` con ocho regresiones adicionales:

1. conservación de `source` + `external_id`;
2. rating TMDB claramente etiquetado;
3. navegación ficha → editor;
4. secciones descripción/progreso/temporadas/relacionados;
5. autenticación obligatoria de la Edge Function;
6. endpoints TMDB esperados;
7. fallback a metadata existente;
8. orden CSS/z-index editor vs ficha.

Las pruebas se suman a la suite existente de UI móvil y aislamiento de datos.

## Backend / datos

No se modifica el esquema SQL ni RLS. No se requiere migración para esta etapa.

## Pendiente operacional

La Edge Function `tmdb-details` debe desplegarse en el mismo proyecto Supabase que usa Kanso para habilitar temporadas, episodios y relacionados en producción. El proyecto Kanso no está conectado a la integración Supabase disponible en esta sesión, por lo que ese despliegue no puede ejecutarse automáticamente desde aquí.

## Estado

Implementación en rama completada. Pendiente CI, TypeScript, build, Vercel Preview y QA funcional antes de merge.
