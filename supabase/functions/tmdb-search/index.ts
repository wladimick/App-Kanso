// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";
import { corsHeaders } from "jsr:@supabase/supabase-js@2.111.0/cors";

type SearchPayload = {
  query?: string;
  page?: number;
};

type TmdbMovie = {
  id: number;
  title: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  popularity?: number;
};

type TmdbTv = {
  id: number;
  name: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string;
  vote_average?: number;
  popularity?: number;
};

type TmdbPage<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      ...corsHeaders,
      "Cache-Control": "private, max-age=60",
    },
  });
}

function imageUrl(path?: string | null) {
  return path ? `${TMDB_IMAGE_BASE_URL}${path}` : null;
}

async function tmdbFetch<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${TMDB_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    console.error("TMDB request failed", { path, status: response.status });
    throw new Error(`TMDB respondió con estado ${response.status}`);
  }

  return (await response.json()) as T;
}

const authenticatedHandler = withSupabase(
  { auth: "user" },
  async (request) => {
    if (request.method !== "POST") {
      return json({ error: "Método no permitido." }, 405);
    }

    const token = Deno.env.get("TMDB_READ_ACCESS_TOKEN");
    if (!token) {
      console.error("TMDB_READ_ACCESS_TOKEN is not configured");
      return json({ error: "El catálogo TMDB no está configurado en el servidor." }, 503);
    }

    try {
      const payload = (await request.json()) as SearchPayload;
      const query = payload.query?.trim() ?? "";
      const page = Number.isInteger(payload.page) && (payload.page ?? 0) > 0
        ? Math.min(payload.page!, 500)
        : 1;

      if (query.length < 2) {
        return json({ error: "Escribe al menos 2 caracteres para buscar." }, 400);
      }

      if (query.length > 100) {
        return json({ error: "La búsqueda es demasiado larga." }, 400);
      }

      const params = new URLSearchParams({
        query,
        include_adult: "false",
        language: "es-CL",
        page: String(page),
      });

      const [movies, tv] = await Promise.all([
        tmdbFetch<TmdbPage<TmdbMovie>>(`/search/movie?${params.toString()}`, token),
        tmdbFetch<TmdbPage<TmdbTv>>(`/search/tv?${params.toString()}`, token),
      ]);

      const movieResults = movies.results.map((item) => ({
        source: "tmdb" as const,
        externalId: String(item.id),
        mediaType: "movie" as const,
        title: item.title,
        originalTitle: item.original_title ?? item.title,
        overview: item.overview ?? "",
        posterUrl: imageUrl(item.poster_path),
        backdropUrl: imageUrl(item.backdrop_path),
        releaseDate: item.release_date || null,
        releaseYear: item.release_date ? Number(item.release_date.slice(0, 4)) : null,
        rating: item.vote_average ?? null,
        popularity: item.popularity ?? 0,
      }));

      const tvResults = tv.results.map((item) => ({
        source: "tmdb" as const,
        externalId: String(item.id),
        mediaType: "series" as const,
        title: item.name,
        originalTitle: item.original_name ?? item.name,
        overview: item.overview ?? "",
        posterUrl: imageUrl(item.poster_path),
        backdropUrl: imageUrl(item.backdrop_path),
        releaseDate: item.first_air_date || null,
        releaseYear: item.first_air_date ? Number(item.first_air_date.slice(0, 4)) : null,
        rating: item.vote_average ?? null,
        popularity: item.popularity ?? 0,
      }));

      const results = [...movieResults, ...tvResults]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 20);

      return json({
        query,
        page,
        results,
        providers: {
          movies: movies.total_results,
          tv: tv.total_results,
        },
      });
    } catch (error) {
      console.error("TMDB search function error", error);
      return json(
        {
          error: error instanceof Error ? error.message : "No fue posible consultar TMDB.",
        },
        502,
      );
    }
  },
);

export default {
  fetch: async (request: Request) => {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    return authenticatedHandler(request);
  },
};
