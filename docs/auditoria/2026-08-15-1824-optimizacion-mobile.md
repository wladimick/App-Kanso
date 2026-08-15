# Auditoría · Optimización móvil de Kanso

**Fecha:** 2026-08-15 18:24 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `feat/mobile-optimization`  
**Responsable de registro:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Optimizar la experiencia de Kanso en teléfonos, con prioridad en iPhone y pantallas entre aproximadamente 320 px y 760 px de ancho, sin alterar el modelo de datos, Supabase ni el comportamiento de biblioteca.

## 2. Alcance

La etapa es principalmente responsive/UI y no requiere migraciones SQL.

Se intervienen:

- navegación;
- espaciados;
- cabecera;
- autenticación;
- búsqueda local;
- dashboard;
- grids de biblioteca;
- cards de contenido;
- Descubrir/TMDB;
- editor de títulos;
- estados vacíos y mensajes;
- safe areas de iOS;
- tamaños táctiles.

## 3. Navegación móvil

La barra lateral de escritorio se transforma en móvil en una barra inferior fija:

- usa `position: fixed`;
- respeta `env(safe-area-inset-bottom)`;
- incorpora fondo translúcido y blur;
- permite scroll horizontal para las distintas secciones;
- oculta logo/nota de arquitectura dentro de la barra inferior para maximizar espacio útil;
- mantiene conteos y estado activo;
- evita que la navegación tape el contenido agregando padding inferior al área principal.

La estructura React no cambia; el comportamiento se resuelve mediante CSS responsive.

## 4. Biblioteca

En teléfono la biblioteca cambia a un grid compacto de dos columnas:

- poster en proporción 2:3;
- títulos limitados a dos líneas;
- metadata compacta;
- estado y favorito conservados;
- hover de escritorio deshabilitado para evitar efectos extraños en touch;
- separación optimizada para pantallas pequeñas.

Objetivo: acercar la experiencia a una app de tracking/media nativa y reducir scroll vertical innecesario.

## 5. Dashboard y continuar viendo

- estadísticas en grid 2x2;
- cards más compactas;
- `Continuar viendo` usa poster lateral y contenido flexible;
- acciones apiladas en móvil para evitar botones comprimidos;
- filtros pasan a carrusel horizontal cuando no caben.

## 6. Autenticación y formularios

Se optimiza `AuthPanel`:

- sesión activa ocupa ancho completo;
- correo usa ellipsis;
- botón Salir mantiene área táctil suficiente;
- Magic Link mantiene diseño responsive;
- inputs usan `font-size: 16px` en móvil para evitar zoom automático de Safari iOS.

El mismo criterio de 16 px se aplica al editor y búsquedas relevantes.

## 7. Descubrir / TMDB

- búsqueda pasa a una columna;
- botón Buscar obtiene altura táctil adecuada;
- resultados TMDB usan poster lateral compacto;
- sinopsis se limita a tres líneas;
- títulos largos se limitan a dos líneas;
- botón Agregar mantiene tamaño táctil.

## 8. Editor de títulos

En móvil el editor deja de sentirse como panel lateral de escritorio y se comporta como una pantalla completa:

- `100dvh`;
- poster/cabecera compactos;
- cabecera sticky;
- botón cerrar de 44 px;
- campos en una sola columna;
- inputs/select/textarea de 16 px;
- acciones Guardar/Cancelar/Eliminar sticky en la zona inferior;
- soporte de safe area inferior;
- sin blur de backdrop innecesario en móvil.

## 9. Accesibilidad y ergonomía

- botones principales >= 44 px cuando corresponde;
- `touch-action: manipulation`;
- eliminación del tap highlight nativo donde estorba visualmente;
- navegación y filtros con scroll horizontal sin scrollbar visible;
- uso de `100dvh` y safe areas para dispositivos modernos.

## 10. Breakpoints

### <= 760 px

Activa experiencia móvil principal.

### <= 390 px

Ajusta padding, poster/editor y navegación para teléfonos más angostos.

## 11. Archivos modificados

- `src/styles.css`
- `src/power-ui.css`
- `src/discover.css`
- `src/data-state.css`
- `src/components/AuthPanel.css`

## 12. Archivos creados

- `docs/auditoria/2026-08-15-1824-optimizacion-mobile.md`

## 13. Riesgo

**Bajo/medio**.

No cambia base de datos, servicios, autenticación ni lógica de persistencia. El principal riesgo es visual/responsive y debe validarse en Preview Vercel desde un teléfono real.

## 14. QA requerido antes de merge

1. `npm ci`;
2. TypeScript;
3. build Vite;
4. Preview Vercel Ready;
5. abrir Preview desde iPhone;
6. navegar Inicio → Biblioteca → Deseos → Viendo → Completados → Favoritos → Descubrir;
7. abrir una ficha de biblioteca;
8. comprobar teclado/formulario y cierre del editor;
9. guardar un cambio;
10. comprobar que barra inferior no tape botones ni contenido;
11. probar búsqueda TMDB;
12. probar orientación vertical como escenario principal.

## 15. Estado

**Optimización móvil implementada en rama de trabajo. Pendiente validación automática y Preview Vercel antes de merge a `main`.**
