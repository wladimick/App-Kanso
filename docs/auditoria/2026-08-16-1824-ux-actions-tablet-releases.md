# Auditoría · UX actions + Estrenos tablet

**Fecha:** 2026-08-16
**Proyecto:** Kanso
**Rama:** `fix/releases-layout-ipad`

## Objetivo

Corregir el desplazamiento vertical/ancho incorrecto de la vista Estrenos en iPad/tablet y reducir fricción en acciones frecuentes de Descubrir y edición.

## Acciones realizadas

- Se corrige el layout de `ReleasesRoute` para reservar el ancho del sidebar en tablet/escritorio y volver a ancho completo en teléfono.
- El editor de una ficha se cierra automáticamente después de que `onSave` termina correctamente.
- Descubrir mantiene `+ Agregar a Kanso` como flujo completo con editor posterior.
- Se agregan acciones rápidas `✓` para guardar como visto/completado y `♡` para guardar en Lista de deseos.
- Las acciones rápidas no disparan el editor posterior; actualizan Supabase y refrescan la biblioteca.
- La acción rápida `completed` actualiza el registro para conservar `completed_at` mediante la lógica existente de `updateLibraryItem`.
- Se agregan estilos responsive y objetivos táctiles para los nuevos botones.

## QA agregado

Archivo: `tests/ux-actions.test.mjs`

Cobertura:

1. cierre del editor después de guardar;
2. botones rápidos Visto y Lista de deseos;
3. persistencia sin abrir editor;
4. montaje global de `QuickAddBridge`;
5. reserva del sidebar en Estrenos tablet/escritorio;
6. objetivos táctiles de acciones rápidas.

## Archivos principales

- `src/components/MediaEditor.tsx`
- `src/components/DiscoverPanel.tsx`
- `src/components/QuickAddBridge.tsx`
- `src/discover.css`
- `src/mobile-ux-v3.css`
- `src/main.tsx`
- `tests/ux-actions.test.mjs`
