## Madrid Total Newsletter Base

La base del newsletter vive ahora en:

- `newsletter.html`: listado y featured posts
- `newsletter-post.html`: vista individual por `slug`
- `data/posts.json`: contenido que renderiza el frontend
- `scripts/sync-beehiiv-posts.mjs`: script para sincronizar desde Beehiiv

## Sincronizar con Beehiiv

Cuando tengas tu API key y tu publication ID:

```bash
BEEHIIV_API_KEY=tu_key \
BEEHIIV_PUBLICATION_ID=tu_publication_id \
node scripts/sync-beehiiv-posts.mjs
```

Eso actualiza `data/posts.json` y luego solo necesitas hacer commit y push para verlo en GitHub Pages.

Tambien tienes un workflow en `.github/workflows/sync-beehiiv.yml` para sincronizar automaticamente desde GitHub Actions. Ahora tiene dos modos:

- webhook en tiempo real cuando Beehiiv envia `post.sent` o `post.updated`
- polling de respaldo cada 15 minutos

Para que funcione el sync base, agrega estos secrets en GitHub:

- `BEEHIIV_API_KEY`
- `BEEHIIV_PUBLICATION_ID`

Cada vez que el workflow detecte cambios en `data/posts.json`, hace commit al repo. Si tu proyecto esta conectado a Vercel, Vercel redeploya solo despues de ese push.

### Webhook en tiempo real

Si tu publicacion de Beehiiv tiene acceso a webhooks, puedes disparar la sincronizacion en cuanto se publique un articulo.

Archivos involucrados:

- `api/beehiiv-webhook.js`: recibe el webhook y dispara el workflow de GitHub
- `scripts/register-beehiiv-webhook.mjs`: registra el webhook en Beehiiv via API

Variables necesarias en tu backend serverless:

- `WEBHOOK_SHARED_SECRET`
- `GITHUB_ACTIONS_TRIGGER_TOKEN`
- `GITHUB_REPO_OWNER`
- `GITHUB_REPO_NAME`
- `GITHUB_BEEHIIV_WORKFLOW_FILE` opcional, default `sync-beehiiv.yml`
- `GITHUB_BEEHIIV_WORKFLOW_REF` opcional, default `main`

El endpoint esperado es algo como:

```text
https://tu-backend.com/api/beehiiv-webhook?token=tu_secret
```

Para registrar el webhook desde terminal:

```bash
BEEHIIV_API_KEY=tu_key \
BEEHIIV_PUBLICATION_ID=tu_publication_id \
BEEHIIV_WEBHOOK_BASE_URL=https://tu-backend.com \
WEBHOOK_SHARED_SECRET=tu_secret \
node scripts/register-beehiiv-webhook.mjs
```

Si no tienes webhooks en tu plan de Beehiiv, el polling cada 15 minutos sigue dejando la sincronizacion casi inmediata sin tocar nada mas.

## Sincronizar seguidores de redes

La landing ahora lee sus contadores desde `data/social-followers.json`.

- `assets/js/social-followers.js`: pinta los contadores en `index.html`
- `scripts/sync-social-followers.mjs`: consulta APIs y actualiza `data/social-followers.json`
- `.github/workflows/sync-social-followers.yml`: corre cada 12 horas y hace commit si hay cambios

Puedes probarlo localmente asi:

```bash
YOUTUBE_API_KEY=tu_key \
YOUTUBE_HANDLE=@madridtotal_ \
node scripts/sync-social-followers.mjs
```

Secrets soportados por el workflow:

- `YOUTUBE_API_KEY`
- `YOUTUBE_CHANNEL_ID`
- `YOUTUBE_HANDLE`
- `META_ACCESS_TOKEN`
- `FACEBOOK_PAGE_ID`
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`
- `X_BEARER_TOKEN`
- `X_USER_ID`
- `X_SCREEN_NAME`
- `TIKTOK_ACCESS_TOKEN`

Tambien puedes dejar valores manuales como respaldo con estos secrets:

- `MANUAL_X_FOLLOWERS`
- `MANUAL_FACEBOOK_FOLLOWERS`
- `MANUAL_INSTAGRAM_FOLLOWERS`
- `MANUAL_TIKTOK_FOLLOWERS`
- `MANUAL_YOUTUBE_FOLLOWERS`

Notas practicas:

- `YouTube` queda listo para automatizar en cuanto tengas API key y `channelId` o `handle`.
- `Instagram` y `Facebook` requieren acceso de Meta Business / Graph API.
- `X` requiere acceso a la API y un bearer token.
- `TikTok` requiere un token autorizado con scope de estadisticas del usuario.
- Si una plataforma no tiene credenciales, el script la salta y conserva el valor existente en el JSON.

## Suscripcion propia a Beehiiv

La web ahora usa un formulario propio en lugar del embed de Beehiiv.

- `assets/js/subscribe.js`: maneja el envio del formulario
- `api/subscribe.js`: funcion serverless para crear suscripciones en Beehiiv

Para que funcione de verdad, necesitas desplegar el backend en un entorno con funciones serverless, por ejemplo Vercel, y definir estas variables:

```bash
BEEHIIV_API_KEY=tu_key
BEEHIIV_PUBLICATION_ID=tu_publication_id
```

Si mantienes el frontend en GitHub Pages, el formulario tambien puede funcionar apuntando a un backend externo configurando:

```html
<script>
  window.MT_SUBSCRIBE_ENDPOINT = "https://tu-backend.com/api/subscribe";
</script>
```

## Contact

Camilo Manzur - [@LinkedIn](https://www.linkedin.com/in/camilo-manzur-4b7137a8/)

Portfolio Link: [https://camiloms10.github.io/](https://camiloms10.github.io/)
