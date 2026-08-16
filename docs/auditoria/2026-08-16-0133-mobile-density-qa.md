# Auditoría · Densidad móvil, cuenta y QA

**Fecha:** 2026-08-16 01:33 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `feat/mobile-density-qa`  
**Responsable:** ChatGPT · GPT-5.6 Sol

## Objetivo

Optimizar Kanso en teléfono luego del QA visual real del usuario:

- eliminar la tarjeta repetitiva `Tu cuenta` del contenido de cada pantalla móvil;
- concentrar cuenta y cierre de sesión dentro del menú hamburguesa;
- aumentar densidad visual de la biblioteca a tres columnas en teléfono;
- mejorar cabeceras, filtros, tarjetas y estados vacíos;
- aumentar cobertura automatizada antes del merge.

## Cambios ejecutados

### Cuenta móvil

- la instancia `.auth-session` del topbar queda oculta en `<= 760 px`;
- el menú hamburguesa mantiene el email de la sesión;
- se agrega `Cerrar sesión` dentro del drawer;
- el cierre usa `supabase.auth.signOut()` y no introduce credenciales nuevas.

### Biblioteca móvil

- `library-grid` pasa a 3 columnas en teléfonos normales;
- posters conservan relación 2:3;
- cards reducen padding, metadata y tipografía de forma controlada;
- año se oculta en la card móvil para priorizar título/tipo;
- `Editar →` se elimina visualmente de la card móvil porque la card completa ya es interactiva;
- favoritos y estados conservan overlays compactos;
- para pantallas extremas <=340 px existe fallback a 2 columnas por legibilidad.

### Pulido adicional

- encabezado móvil más compacto;
- búsqueda y filtros mantienen targets táctiles adecuados;
- estados vacíos consumen menos altura;
- la cuenta deja de interrumpir el flujo entre título, búsqueda y contenido.

## QA automatizado agregado

Se crea una suite cero-dependencias con `node:test`:

### `tests/mobile-ui.test.mjs`

Comprueba:

1. que la cuenta se oculte del topbar móvil;
2. que la biblioteca use 3 columnas;
3. que <=340 px tenga fallback a 2 columnas;
4. que el drawer contenga cierre de sesión real;
5. que el menú mantenga todos los destinos principales;
6. que `mobile-polish.css` sea la última capa CSS cargada.

### `tests/data-isolation.test.mjs`

Comprueba contratos críticos existentes de Supabase:

1. lectura de biblioteca filtrada por `user_id`;
2. updates filtrados por `id` + `user_id`;
3. deletes filtrados por `id` + `user_id`;
4. RLS habilitado en las cuatro tablas personales;
5. policy SELECT de `library_items` ligada a `auth.uid()`.

## CI

`package.json` incorpora `npm test` sin agregar dependencias externas.

GitHub Actions ahora ejecuta:

1. `npm ci`;
2. `npm test`;
3. `npm run typecheck`;
4. `npm run build`.

## Backend

No se modifica:

- esquema SQL;
- datos de usuario;
- RLS;
- TMDB;
- Edge Functions;
- variables de entorno.

## Estado

Implementación terminada en rama. Pendiente validar PR, suite automatizada, TypeScript, build, Vercel Preview y posteriormente hacer squash merge a `main` solo si todos los controles quedan verdes.
