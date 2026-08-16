# Auditoría · Login con contraseña y registro de usuarios

**Fecha:** 2026-08-15 19:57 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `feat/auth-password-signup`  
**PR:** #5 · `Replace Magic Link with password auth and signup`  
**Responsable de registro:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Reemplazar el acceso principal mediante Magic Link por una experiencia de autenticación más propia de una aplicación multiusuario: email + contraseña, creación de cuenta, persistencia de sesión y recuperación de contraseña.

El objetivo adicional es conservar la arquitectura existente basada en `auth.uid()` y `user_id`, de modo que cada usuario vea exclusivamente su propia biblioteca.

## 2. Contexto que motivó el cambio

Durante QA real se observaron dos fricciones del flujo Magic Link:

- enlaces con `otp_expired` / `Email link is invalid or has expired`;
- `email rate limit exceeded` después de solicitar varios correos.

La documentación oficial de Supabase fue revisada antes de implementar el cambio. Supabase soporta `signInWithPassword`, `signUp`, recuperación de contraseña y creación/confirmación administrativa de usuarios.

## 3. Cambios ejecutados por ChatGPT

### `src/hooks/useAuth.ts`

- Se conserva recuperación inicial mediante `getSession()`.
- Se conserva `onAuthStateChange()`.
- Se expone además el último `AuthChangeEvent`.
- Esto permite detectar específicamente el evento `PASSWORD_RECOVERY`.

### `src/components/AuthPanel.tsx`

Se reemplaza el formulario Magic Link por:

- pestaña **Iniciar sesión**;
- pestaña **Crear cuenta**;
- nombre para metadata de presentación;
- email;
- contraseña;
- repetición de contraseña;
- mostrar/ocultar contraseña;
- validación cliente de mínimo 8 caracteres;
- `signInWithPassword()` para acceso normal;
- `signUp()` para registro;
- `resetPasswordForEmail()` para recuperación;
- `updateUser({ password })` durante recuperación;
- cierre de sesión posterior a establecer una contraseña nueva para exigir un login normal limpio;
- errores de Auth traducidos a mensajes más comprensibles;
- sesión activa mostrando nombre/email y botón Salir.

### Gate de autenticación

Cuando no existe sesión, `AuthPanel` pasa a una pantalla completa sobre la aplicación. El dashboard/demo queda visualmente bloqueado hasta que exista una sesión autenticada.

No fue necesario reestructurar `App.tsx`; el gate se implementa de forma encapsulada en `AuthPanel` para minimizar el riesgo del cambio.

### `src/components/AuthPanel.css`

- pantalla de acceso full-screen;
- diseño coherente con Kanso;
- pestañas Login / Crear cuenta;
- campos y estados de feedback;
- controles táctiles;
- inputs a 16 px en móvil para evitar zoom de Safari iOS;
- soporte de safe areas;
- tarjeta responsive para teléfono.

## 4. Persistencia y datos

No se cambia:

- esquema SQL;
- `library_items`;
- `watch_events`;
- RLS;
- UUID de usuarios existentes;
- asociación de biblioteca mediante `user_id`.

La intención es que el usuario existente mantenga exactamente su UUID para conservar Naruto y cualquier otro contenido ya guardado.

## 5. Registro de nuevos usuarios

El frontend utiliza el flujo oficial `signUp({ email, password })` de Supabase.

El comportamiento posterior depende de la configuración del proyecto Kanso:

- si confirmación de email está desactivada, Supabase puede devolver una sesión y el usuario entra inmediatamente;
- si confirmación de email está activada, la cuenta queda creada pero el usuario debe confirmar el correo una vez.

La UI soporta ambos escenarios y comunica cuál ocurrió.

## 6. Configuración externa pendiente en Supabase

El proyecto Kanso vive en una cuenta Supabase distinta de la conexión disponible para ChatGPT. Por seguridad no se realizaron cambios en el Supabase conectado de WebOps TIBOX.

Si se desea registro sin comprobación de correo, queda pendiente una acción manual en el proyecto Kanso:

- revisar `Authentication > Providers > Email`;
- mantener habilitado el registro por email;
- desactivar la exigencia de confirmación de email si se acepta conscientemente ese modelo de acceso.

Esta decisión reduce fricción pero también elimina la prueba de propiedad del correo durante signup.

## 7. Migración del usuario existente

No se crea un usuario nuevo para el propietario actual, porque eso generaría un UUID distinto y su biblioteca aparecería vacía.

Se incorpora el flujo **“Olvidé mi contraseña / venía de Magic Link”**:

1. solicitar recuperación para el correo existente;
2. abrir el enlace de recuperación;
3. Kanso detecta `PASSWORD_RECOVERY`;
4. establecer una nueva contraseña;
5. conservar el mismo usuario / UUID;
6. iniciar sesión normalmente con email + contraseña en adelante.

Este flujo requiere un único correo de recuperación para la transición y para futuros olvidos de contraseña.

## 8. Seguridad

- No se agregó `service_role` al frontend.
- No se agregó ninguna secret key al repositorio.
- El navegador continúa usando únicamente la publishable key.
- La creación normal de cuenta usa APIs públicas de Supabase Auth.
- No se implementó un endpoint propio con privilegios administrativos para auto-confirmar usuarios, evitando exponer una superficie de escalamiento innecesaria.
- RLS sigue siendo la barrera de aislamiento entre bibliotecas.

## 9. Archivos modificados

- `src/hooks/useAuth.ts`
- `src/components/AuthPanel.tsx`
- `src/components/AuthPanel.css`

## 10. Archivo creado

- `docs/auditoria/2026-08-15-1957-auth-password-registro.md`

## 11. Validaciones automáticas

PR #5 / head inicial de QA:

- Vercel Preview: **Ready**;
- Preview: `https://app-kanso-git-feat-auth-password-signup-wladimick1.vercel.app`;
- Kanso CI run #105 / `31916201525`: **success**;
- instalación de dependencias: **success**;
- TypeScript: **success**;
- build Vite: **success**.

## 12. QA real pendiente

- login con usuario email+password real;
- creación de usuario nuevo;
- confirmar comportamiento según setting de email confirmation;
- recuperación del usuario existente;
- comprobar persistencia de sesión al recargar;
- cerrar sesión y volver a entrar;
- verificar que un usuario nuevo vea biblioteca vacía y no datos de otro usuario.

## 13. Estado

**Código, TypeScript, build y Preview Vercel aprobados. Pendiente configuración/QA real del proyecto Supabase Kanso antes de merge a `main`.**
