# Configuracion del formulario de contacto

Este sitio usa una Cloudflare Pages Function en `functions/api/estimado.js`.

Los formularios de `index.html` envian `POST` a `/api/estimado`.

Variables de ambiente necesarias en Cloudflare Pages:

```text
CF_ACCOUNT_ID=<Cloudflare Account ID>
CF_EMAIL_API_TOKEN=<token con permiso para Email Sending>
LEAD_NOTIFICATION_TO=bathtubrefinishingsystems@gmail.com
LEAD_NOTIFICATION_FROM=noreply@brspr.com
```

El remitente `noreply@brspr.com` debe estar permitido/configurado para Cloudflare Email Sending en la cuenta de Cloudflare.
