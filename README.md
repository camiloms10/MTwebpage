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

## Contact

Camilo Manzur - [@LinkedIn](https://www.linkedin.com/in/camilo-manzur-4b7137a8/)

Portfolio Link: [https://camiloms10.github.io/](https://camiloms10.github.io/)
