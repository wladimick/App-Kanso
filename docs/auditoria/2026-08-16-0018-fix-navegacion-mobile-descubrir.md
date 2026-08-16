# Auditoría · Fix navegación móvil y acceso a Descubrir

**Fecha:** 2026-08-16 00:18 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `fix/mobile-nav-discover`  
**Responsable de registro:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Investigar por qué el usuario autenticado veía 0 títulos y no lograba encontrar/agregar Naruto desde el teléfono, y corregir el bloqueo de navegación móvil que ocultaba el acceso claro a `Descubrir`.

## 2. Evidencia recibida

El usuario aportó capturas reales desde iPhone donde:

- la sesión estaba activa;
- `Biblioteca sincronizada con Supabase` aparecía correctamente;
- las estadísticas estaban en 0;
- en la vista `Viendo ahora` se escribió `Naruto` en el buscador de lista;
- el resultado fue `0 títulos` / `No encontramos coincidencias`;
- la barra inferior mostraba visualmente solo `Inicio` ocupando prácticamente todo el ancho.

El usuario también mostró en Supabase que `public.library_items` estaba vacío.

## 3. Diagnóstico

### 3.1 El buscador usado no es TMDB

El campo de búsqueda de las páginas `Mi biblioteca`, `Lista de deseos`, `Viendo`, `Completados` y `Favoritos` filtra únicamente los títulos ya persistidos del usuario.

Por tanto, buscar `Naruto` dentro de `Viendo ahora` con `library_items` vacío debe devolver 0 resultados. Ese comportamiento no corresponde al catálogo externo.

La búsqueda de títulos nuevos vive en la página `Descubrir`, mediante `DiscoverPanel` y TMDB.

### 3.2 Bug de navegación móvil

Se confirmó un conflicto CSS:

- `src/power-ui.css` define `.nav-item { width: 100%; }`;
- `src/styles.css` transforma `.nav-list` en un contenedor `flex` horizontal para móvil;
- en móvil no se anulaba el `width: 100%` heredado;
- como resultado, cada destino podía ocupar el ancho completo del viewport y `Inicio` ocultaba visualmente los destinos siguientes fuera del área visible.

Esto hacía especialmente difícil descubrir el acceso a `Descubrir`, por lo que el usuario terminaba utilizando el buscador local de `Viendo` como si fuera búsqueda global.

## 4. Cambios ejecutados

### `src/mobile-nav-fix.css`

Se crea una capa de hotfix móvil cargada después del resto de estilos.

En `<= 760px`:

- se muestran como navegación primaria: `Inicio`, `Mi biblioteca`, `Lista de deseos`, `Viendo` y `Descubrir`;
- `Completados` y `Favoritos` siguen siendo accesibles mediante las tarjetas del dashboard;
- `Colecciones` permanece como módulo secundario/próximo;
- se elimina el ancho completo problemático de `.nav-item`;
- los cinco destinos principales comparten el espacio disponible con `flex: 1 1 0`;
- se ocultan los contadores en la barra móvil para evitar saturación;
- se permiten labels en más de una línea si es necesario;
- se refuerza compatibilidad para anchos <= 390px.

### `src/main.tsx`

Se importa `./mobile-nav-fix.css` después de `power-ui.css` para garantizar que las reglas del hotfix tengan precedencia.

## 5. Datos y backend

No se modificó:

- Supabase;
- RLS;
- esquema SQL;
- `library_items`;
- autenticación;
- TMDB Edge Function;
- lógica de inserción.

La tabla `library_items` está vacía según evidencia manual del usuario, por lo que no existe actualmente contenido que la vista de listas personales pueda mostrar.

## 6. Validación esperada

Luego del deployment de Preview, en iPhone la barra inferior debe mostrar directamente los cinco destinos principales, incluyendo `Descubrir`.

Flujo QA recomendado:

1. abrir Preview en iPhone;
2. confirmar que `Descubrir` aparece en la barra inferior;
3. entrar a `Descubrir`;
4. buscar `Naruto` en TMDB;
5. pulsar `+ Agregar a Kanso`;
6. confirmar que el botón cambia a `Ya está en Kanso`;
7. entrar a `Mi biblioteca` y comprobar que Naruto aparece;
8. refrescar la página y confirmar persistencia;
9. revisar `public.library_items` en Supabase y confirmar una fila con el `user_id` actual.

## 7. Estado

**Diagnóstico confirmado y fix implementado en rama. Pendiente CI, Vercel Preview y QA real desde iPhone antes de merge.**
