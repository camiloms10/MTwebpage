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
