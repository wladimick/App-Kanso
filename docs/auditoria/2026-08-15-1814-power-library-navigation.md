# Auditoría · Navegación y biblioteca editable

**Fecha:** 2026-08-15 18:14 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `feat/power-library-navigation`  
**Responsable de registro:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Transformar Kanso desde un dashboard único a una aplicación de seguimiento con navegación real, biblioteca separada por estados y edición persistente de cada título.

Solicitud funcional del usuario:

- poder entrar a los títulos guardados y editarlos;
- que `Mi biblioteca` muestre únicamente contenido guardado;
- separar `Lista de deseos` del resto;
- evolucionar Kanso hacia una aplicación de seguimiento más potente.

## 2. Decisión de arquitectura

No se requiere una migración SQL nueva para esta etapa.

El esquema ya contiene en `library_items`:

- `status`;
- `current_season`;
- `current_episode`;
- `total_seasons`;
- `total_episodes`;
- `score`;
- `favorite`;
- `notes`;
- `started_at`;
- `completed_at`.

La aplicación seguirá funcionando primero para el usuario propietario, pero se conserva `user_id` + RLS para una futura experiencia multiusuario.

## 3. Navegación implementada

Se agregaron vistas independientes, manteniendo una SPA Vite y usando `?view=` para no interferir con el hash utilizado por Supabase Auth:

- Inicio;
- Mi biblioteca;
- Lista de deseos;
- Viendo;
- Completados;
- Favoritos;
- Colecciones;
- Descubrir.

`Mi biblioteca` ya no contiene el buscador TMDB. `Descubrir` es la única vista dedicada al catálogo externo.

## 4. Ficha editable

Se creó `src/components/MediaEditor.tsx` como panel lateral editable.

Permite modificar:

- estado;
- tipo (`Película`, `Serie`, `Anime`);
- temporada actual;
- episodio actual;
- total de temporadas;
- total de episodios;
- puntuación personal;
- favorito;
- notas personales;
- eliminación del título.

Esto permite también corregir manualmente casos como anime que TMDB clasifica originalmente como TV/Serie.

## 5. Persistencia

### `src/services/library.ts`

Se agregaron:

- `updateLibraryItem`;
- `deleteLibraryItem`;
- tipo `LibraryItemUpdateInput`.

Todas las operaciones filtran por `id` + `user_id` y permanecen sujetas a las políticas RLS existentes.

### `src/hooks/useLibrary.ts`

Se agregaron acciones reactivas:

- `editItem`;
- `removeItem`.

Después de guardar/eliminar, el estado local se actualiza sin requerir recarga completa.

## 6. Modelo UI

`LibraryItem` ahora expone también:

- temporada actual;
- total de temporadas;
- favorito;
- notas.

Los grids de biblioteca son interactivos y abren la ficha de edición al pulsar una tarjeta.

## 7. Protección contra duplicados TMDB

El reconocimiento visual de un título ya guardado cambió de:

`source + media_type + external_id`

a:

`source + external_id`

Motivo: un título puede ser reclasificado manualmente de `Serie` a `Anime`. Después de esa corrección no debe volver a aparecer como agregable desde TMDB.

## 8. Archivos creados

- `src/components/MediaEditor.tsx`
- `src/power-ui.css`
- `docs/auditoria/2026-08-15-1814-power-library-navigation.md`

## 9. Archivos modificados

- `src/App.tsx`
- `src/types.ts`
- `src/services/library.ts`
- `src/hooks/useLibrary.ts`
- `src/components/DiscoverPanel.tsx`
- `src/main.tsx`

## 10. UX relevante

- badges con conteos en navegación;
- dashboard con accesos directos por estado;
- buscador local solo en listas personales;
- filtros Película / Serie / Anime;
- poster real en cards y editor;
- indicador de favorito;
- temporada/episodio visible en cards cuando existe;
- ficha lateral responsive;
- confirmación antes de eliminar.

## 11. Validaciones pendientes

Antes de mergear a `main`:

1. GitHub Actions: `npm ci`;
2. TypeScript;
3. build Vite;
4. Preview Vercel;
5. QA autenticado:
   - abrir Naruto desde `Mi biblioteca`;
   - cambiar `Serie` → `Anime`;
   - cambiar `Pendiente` → `Viendo`;
   - asignar episodio y temporada;
   - guardar;
   - comprobar movimiento automático a `Viendo`;
   - marcar favorito y comprobar vista `Favoritos`;
   - comprobar eliminación.

## 12. Siguientes módulos recomendados

- detalle automático TMDB para temporadas/episodios;
- selector real de temporada + episodios;
- historial completo desde `watch_events`;
- colecciones CRUD reales;
- integración AniList;
- próximas emisiones/calendario;
- rewatch;
- importadores externos;
- estadísticas personales.

## 13. Estado

**Implementación completada en rama de trabajo. Pendiente CI y Preview QA antes de merge.**
