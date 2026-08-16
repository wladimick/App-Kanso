# Auditoría · Merge PR #5 · Auth email + contraseña

**Fecha:** 2026-08-15 21:13 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama base:** `main`  
**PR:** #5 · `Replace Magic Link with password auth and signup`  
**Responsable de registro:** ChatGPT · GPT-5.6 Sol

## 1. Objetivo

Registrar el cierre e integración a producción del cambio que reemplaza Magic Link como acceso principal por autenticación con email + contraseña y creación de cuentas.

## 2. Estado previo verificado

Antes del merge se verificó el último head del PR:

- head: `b44abc920d1e10d8263605b53e920d8c61822919`;
- PR abierto y mergeable;
- Kanso CI run #106 / `31916230198`: **success**;
- el PR se encontraba en Draft.

## 3. Acciones ejecutadas

1. PR #5 marcado como **Ready for review**.
2. Merge ejecutado mediante **squash** contra `main`.
3. GitHub confirmó merge exitoso.
4. Commit resultante en `main`: `35d3c647f73607e0a3fc119a518df0c3f965263b`.
5. Se verificó el deployment asociado en Vercel.
6. Estado final de Vercel para el commit de merge: **success**.

## 4. Funcionalidad integrada

- inicio de sesión con email + contraseña;
- creación de cuenta;
- nombre de usuario como metadata de presentación;
- validación de contraseña;
- mostrar/ocultar contraseña;
- recuperación de contraseña;
- detección de `PASSWORD_RECOVERY`;
- establecimiento de contraseña para usuarios provenientes del flujo Magic Link;
- sesión persistente mediante Supabase Auth;
- pantalla de acceso full-screen cuando no existe sesión;
- UI responsive para acceso y registro;
- continuidad del aislamiento de datos mediante `auth.uid()` / `user_id` y RLS.

## 5. Seguridad y datos

No se modificó el esquema SQL ni las políticas RLS. No se incorporó `service_role` ni ninguna secret key al frontend o repositorio.

El cambio mantiene los UUID existentes, por lo que los datos asociados al usuario actual continúan vinculados al mismo `user_id`.

## 6. Configuración externa

La configuración del proyecto Supabase Kanso fue realizada manualmente por el usuario fuera de las herramientas disponibles para ChatGPT. El usuario indicó que estaba lista antes de solicitar el merge.

No se modificó el Supabase conectado correspondiente a WebOps TIBOX.

## 7. Validaciones

- PR mergeable: **sí**;
- CI último head: **success**;
- squash merge: **success**;
- Vercel producción: **success**.

## 8. Estado final

**PR #5 integrado a `main` y deployment de producción aprobado por Vercel.**
