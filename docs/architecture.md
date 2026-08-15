# Arquitectura inicial de Kanso

## Principio

Kanso separa el **catálogo externo** del **estado personal del usuario**.

### Catálogo

- TMDB: películas, series, temporadas, episodios, imágenes y metadatos generales.
- AniList: anime y, en una fase posterior, manga.

### Datos propios

Supabase almacenará únicamente información personal y referencias a proveedores externos:

- usuario
- proveedor (`tmdb` / `anilist`)
- id externo
- tipo (`movie` / `series` / `anime`)
- estado (`planned`, `watching`, `completed`, `paused`, `dropped`)
- temporada / episodio actual
- puntuación personal
- favorito
- fechas de inicio y finalización
- pertenencia a colecciones

## Fases

1. MVP local navegable con datos de demostración.
2. Búsqueda real mediante TMDB.
3. Persistencia con Supabase y autenticación.
4. Integración AniList para anime.
5. Colecciones inteligentes (Marvel, sagas, franquicias).
6. Próximos estrenos y recordatorios opcionales.

## Seguridad

Las claves privadas nunca deben guardarse en el repositorio. `.env.example` documenta únicamente nombres de variables.
