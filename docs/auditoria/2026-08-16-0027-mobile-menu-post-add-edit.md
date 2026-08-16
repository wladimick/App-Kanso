# Auditoría · Menú móvil y edición inmediata post-agregado

**Fecha:** 2026-08-16 00:27 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `feat/mobile-menu-post-add-edit`  
**Responsable:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Agregar un menú hamburguesa superior en móvil y mejorar el flujo posterior a `+ Agregar a Kanso` para que la ficha del título se abra inmediatamente y permita indicar si ya fue visto completo o en qué temporada/episodio va el usuario.

## 2. Incidencias operativas registradas

Antes de crear correctamente la rama de trabajo ocurrieron dos escrituras accidentales de marcadores temporales en `main`:

- `docs/auditoria/.keep-temp`, contenido `temp`;
- `docs/auditoria/.branch-marker`, contenido `branch`.

Ambos archivos fueron eliminados inmediatamente. No modificaron código, datos, Supabase ni comportamiento de producción.

El archivo de auditoría inicial también fue creado directamente en `main` antes de abrir la rama. Es documentación únicamente y la rama se creó posteriormente desde ese `main`, por lo que el historial permanece trazable.

## 3. Cambios implementados

### Menú hamburguesa móvil

Se creó `src/components/MobileMenu.tsx`.

- botón hamburguesa fijo en la parte superior derecha en <= 760 px;
- drawer lateral con todos los destinos de Kanso;
- Inicio;
- Mi biblioteca;
- Lista de deseos;
- Viendo;
- Completados;
- Favoritos;
- Colecciones;
- Descubrir;
- indica visualmente la sección activa;
- muestra el email de la sesión en el pie;
- actualiza `?view=` y dispara `popstate` para reutilizar el router ligero actual de `App.tsx` sin duplicar lógica de páginas;
- bloquea scroll del body mientras el menú está abierto.

La barra inferior móvil existente se conserva para accesos rápidos; el hamburguesa entrega la navegación completa.

### Edición inmediata después de agregar

`src/hooks/useLibrary.ts` ahora emite un evento local `kanso:item-added` una vez que Supabase confirma el insert y entrega la fila persistida.

Se creó `src/components/PostAddEditorBridge.tsx`, que:

- escucha exclusivamente títulos realmente confirmados por Supabase;
- comprueba que la fila pertenezca al mismo `session.user.id`;
- abre `MediaEditor` automáticamente;
- permite guardar y eliminar usando los mismos servicios seguros existentes;
- emite `kanso:library-refresh` después de editar/eliminar.

`useLibrary` escucha `kanso:library-refresh` y vuelve a consultar la biblioteca para mantener el dashboard y listas sincronizadas con lo editado en el modal post-agregado.

No se agrega ninguna credencial privilegiada ni se evita RLS.

### Seguimiento rápido en la ficha

`src/components/MediaEditor.tsx` incorpora la sección `¿Cómo vas con este título?`.

Para series/anime:

- **Lo veré después** → `planned`;
- **Estoy viendo** → `watching`, precarga temporada 1 / episodio 1 si estaban vacíos y deja visibles los campos para indicar dónde va el usuario;
- **Ya lo vi completo** → `completed`; si ya existen totales conocidos, alinea temporada/episodio actuales con esos totales.

Para películas:

- **Lo veré después**;
- **Ya lo vi completo**.

El selector avanzado de estado se mantiene para `paused` y `dropped`.

## 4. UI / responsive

Se creó `src/app-shell-enhancements.css` y se carga al final de la cascada.

Incluye:

- espacio superior móvil para evitar superposición con el hamburguesa;
- safe-area de iPhone;
- overlay y drawer optimizados para `100dvh`;
- targets táctiles de 44–52 px;
- tarjetas rápidas de seguimiento;
- layout de una columna en el editor móvil.

## 5. Archivos creados

- `src/components/MobileMenu.tsx`
- `src/components/PostAddEditorBridge.tsx`
- `src/app-shell-enhancements.css`

## 6. Archivos modificados

- `src/hooks/useLibrary.ts`
- `src/components/MediaEditor.tsx`
- `src/main.tsx`

## 7. Backend y seguridad

No se modificó:

- esquema SQL;
- tablas Supabase;
- RLS;
- Auth;
- TMDB Edge Function;
- variables de entorno.

Las ediciones post-agregado siguen usando `user_id` de la sesión y los servicios existentes que filtran por usuario.

## 8. QA esperado

1. abrir Preview desde iPhone;
2. confirmar hamburguesa superior;
3. abrir/cerrar menú y navegar por todas las secciones;
4. ir a Descubrir y buscar un título;
5. pulsar `+ Agregar a Kanso`;
6. comprobar que la ficha se abre automáticamente;
7. probar `Estoy viendo` y definir temporada/episodio;
8. guardar y comprobar que aparece en `Viendo`;
9. probar con otro título `Ya lo vi completo` y comprobar `Completados`;
10. recargar para validar persistencia.

## 9. Validaciones

Pendiente GitHub Actions, TypeScript, build Vite, Vercel Preview y QA real.

## 10. Estado

**Implementación en rama completada; pendiente CI/Preview/QA antes de merge.**
