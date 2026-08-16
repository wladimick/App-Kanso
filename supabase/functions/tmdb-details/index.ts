// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";
import { corsHeaders } from "jsr:@supabase/supabase-js@2.111.0/cors";

type DetailsPayload = {
  externalId?: string;
  mediaType?: "movie" | "series";
  action?: "details" | "season";
  seasonNumber?: number;
};

type TmdbGenre = { id: number; name: string };
type TmdbSeason = {
  air_date?: string | null;
  episode_count?: number;
  id: number;
  name?: string;
  poster_path?: string | null;
  season_number: number;
};
type TmdbMovie = {
  id: number;
  title: string;
  original_title?: string;
  overview?: string;
  tagline?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  runtime?: number | null;
  genres?: TmdbGenre[];
};
type TmdbTv = {
  id: number;
  name: string;
  original_name?: string;
  overview?: string;
  tagline?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  episode_run_time?: number[];
  genres?: TmdbGenre[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: TmdbSeason[];
};
type TmdbRelated = {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
};
type TmdbPage<T> = { results: T[] };
type TmdbEpisode = {
  episode_number: number;
  name?: string;
  overview?: string;
  air_date?: string | null;
  runtime?: number | null;
  still_path?: string | null;
  vote_average?: number;
};
type TmdbSeasonDetails = { episodes?: TmdbEpisode[] };

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";
const STILL_BASE = "https://image.tmdb.org/t/p/w500";

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      ...corsHeaders,
      "Cache-Control": "private, max-age=300",
    },
  });
}

function imageUrl(path?: string | null, base = POSTER_BASE) {
  return path ? `${base}${path}` : null;
}

function validId(value?: string) {
  return Boolean(value && /^\d+$/.test(value));
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

function relatedItem(item: TmdbRelated, mediaType: "movie" | "series") {
  const releaseDate = mediaType === "movie" ? item.release_date : item.first_air_date;
  return {
    externalId: String(item.id),
    mediaType,
    title: item.title ?? item.name ?? "Sin título",
    posterUrl: imageUrl(item.poster_path),
    releaseYear: releaseDate ? Number(releaseDate.slice(0, 4)) : null,
    rating: item.vote_average ?? null,
    voteCount: item.vote_count ?? 0,
  };
}

const authenticatedHandler = withSupabase(
  { auth: "user" },
  async (request) => {
    if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);

    const token = Deno.env.get("TMDB_READ_ACCESS_TOKEN");
    if (!token) return json({ error: "TMDB no está configurado en el servidor." }, 503);

    try {
      const payload = (await request.json()) as DetailsPayload;
      const externalId = payload.externalId?.trim();
      const mediaType = payload.mediaType;
      const action = payload.action ?? "details";

      if (!validId(externalId) || !mediaType) {
        return json({ error: "Identificador o tipo de contenido inválido." }, 400);
      }

      if (action === "season") {
        if (mediaType !== "series" || !Number.isInteger(payload.seasonNumber) || (payload.seasonNumber ?? -1) < 0) {
          return json({ error: "Temporada inválida." }, 400);
        }

        const season = await tmdbFetch<TmdbSeasonDetails>(
          `/tv/${externalId}/season/${payload.seasonNumber}?language=es-CL`,
          token,
        );

        return json({
          episodes: (season.episodes ?? []).map((episode) => ({
            episodeNumber: episode.episode_number,
            name: episode.name ?? `Episodio ${episode.episode_number}`,
            overview: episode.overview ?? "",
            airDate: episode.air_date ?? null,
            runtime: episode.runtime ?? null,
            stillUrl: imageUrl(episode.still_path, STILL_BASE),
            rating: episode.vote_average ?? null,
          })),
        });
      }

      if (mediaType === "movie") {
        const [item, similar] = await Promise.all([
          tmdbFetch<TmdbMovie>(`/movie/${externalId}?language=es-CL`, token),
          tmdbFetch<TmdbPage<TmdbRelated>>(`/movie/${externalId}/similar?language=es-CL&page=1`, token),
        ]);

        const releaseDate = item.release_date || null;
        return json({
          details: {
            externalId: String(item.id),
            mediaType: "movie",
            title: item.title,
            originalTitle: item.original_title ?? item.title,
            overview: item.overview ?? "",
            tagline: item.tagline || null,
            posterUrl: imageUrl(item.poster_path),
            backdropUrl: imageUrl(item.backdrop_path, BACKDROP_BASE),
            releaseDate,
            releaseYear: releaseDate ? Number(releaseDate.slice(0, 4)) : null,
            rating: item.vote_average ?? null,
            voteCount: item.vote_count ?? 0,
            runtime: item.runtime ?? null,
            genres: (item.genres ?? []).map((genre) => genre.name),
            totalSeasons: null,
            totalEpisodes: null,
            seasons: [],
            related: (similar.results ?? []).slice(0, 12).map((entry) => relatedItem(entry, "movie")),
          },
        });
      }

      const [item, similar] = await Promise.all([
        tmdbFetch<TmdbTv>(`/tv/${externalId}?language=es-CL`, token),
        tmdbFetch<TmdbPage<TmdbRelated>>(`/tv/${externalId}/similar?language=es-CL&page=1`, token),
      ]);

      const releaseDate = item.first_air_date || null;
      return json({
        details: {
          externalId: String(item.id),
          mediaType: "series",
          title: item.name,
          originalTitle: item.original_name ?? item.name,
          overview: item.overview ?? "",
          tagline: item.tagline || null,
          posterUrl: imageUrl(item.poster_path),
          backdropUrl: imageUrl(item.backdrop_path, BACKDROP_BASE),
          releaseDate,
          releaseYear: releaseDate ? Number(releaseDate.slice(0, 4)) : null,
          rating: item.vote_average ?? null,
          voteCount: item.vote_count ?? 0,
          runtime: item.episode_run_time?.[0] ?? null,
          genres: (item.genres ?? []).map((genre) => genre.name),
          totalSeasons: item.number_of_seasons ?? null,
          totalEpisodes: item.number_of_episodes ?? null,
          seasons: (item.seasons ?? [])
            .filter((season) => season.season_number > 0)
            .map((season) => ({
              seasonNumber: season.season_number,
              name: season.name ?? `Temporada ${season.season_number}`,
              episodeCount: season.episode_count ?? 0,
              airDate: season.air_date ?? null,
              posterUrl: imageUrl(season.poster_path),
            })),
          related: (similar.results ?? []).slice(0, 12).map((entry) => relatedItem(entry, "series")),
        },
      });
    } catch (error) {
      console.error("TMDB details function error", error);
      return json({ error: error instanceof Error ? error.message : "No fue posible consultar TMDB." }, 502);
    }
  },
);

export default {
  fetch: async (request: Request) => {
    if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    return authenticatedHandler(request);
  },
};
