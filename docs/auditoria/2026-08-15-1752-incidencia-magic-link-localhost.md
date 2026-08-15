# Auditoría · Incidencia Magic Link redirige a localhost

**Fecha:** 2026-08-15 17:52 CLT  
**Zona horaria:** America/Santiago  
**Repositorio:** `wladimick/App-Kanso`  
**Rama:** `docs/auth-redirect-localhost`  
**Responsable de registro:** ChatGPT · GPT-5.6 Sol

## 1. Incidencia informada

El usuario informó que el enlace Magic Link enviado por Supabase Auth redirige a `localhost` en lugar del deployment de Kanso en Vercel.

## 2. Diagnóstico

Se revisó la implementación actual de Kanso y `src/components/AuthPanel.tsx` envía:

```ts
emailRedirectTo: window.location.origin
```

Por lo tanto, cuando el Magic Link se solicita desde Vercel, el frontend solicita a Supabase regresar al mismo origen de Vercel.

La documentación vigente de Supabase indica que:

- el valor pasado como `redirectTo` / `emailRedirectTo` debe coincidir con una URL incluida en **Authentication → URL Configuration → Redirect URLs**;
- `Site URL` funciona como destino por defecto cuando no hay un redirect válido;
- para deployments de Vercel se pueden utilizar patrones wildcard para previews;
- si una plantilla de correo personalizada construye el enlace con `{{ .SiteURL }}`, puede ignorar el destino solicitado y debe revisarse el uso de `{{ .RedirectTo }}` o `{{ .ConfirmationURL }}`.

## 3. Causa más probable

Configuración de Supabase Auth todavía apuntando a localhost en `Site URL`, y/o dominio de Vercel no incluido correctamente en `Redirect URLs`.

No se identificó un cambio de código necesario en Kanso para resolver el caso principal.

## 4. Acción recomendada en Supabase

En **Authentication → URL Configuration**:

1. reemplazar el `Site URL` local por el dominio estable de producción de Kanso en Vercel;
2. agregar el dominio de producción exacto como Redirect URL;
3. agregar un wildcard para previews del equipo/cuenta Vercel `wladimick1`;
4. conservar `http://localhost:5173/**` solamente como Redirect URL adicional para desarrollo local, no como Site URL de producción.

Patrón sugerido para previews:

```text
https://*-wladimick1.vercel.app/**
```

## 5. Validación posterior

Después de guardar la configuración se debe solicitar **un Magic Link nuevo**. Un enlace generado antes del cambio conserva su redirect anterior y no sirve para validar la corrección.

Si el enlace nuevo continúa redirigiendo a localhost, revisar **Authentication → Email Templates → Magic Link** y comprobar que la plantilla no fuerce `{{ .SiteURL }}`.

## 6. Estado

**Incidencia diagnosticada. Pendiente cambio manual en Supabase Auth por parte del usuario y nueva prueba con un Magic Link recién generado.**
