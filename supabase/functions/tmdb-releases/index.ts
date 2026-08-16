import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";
import { corsHeaders } from "jsr:@supabase/supabase-js@2.111.0/cors";

type Filter = "all" | "movie" | "series";
type Payload = { filter?: Filter };

type TmdbItem = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
};

type TmdbTvDetails = TmdbItem & {
  next_episode_to_air?: {
    air_date?: string | null;
    episode_number?: number;
    season_number?: number;
    name?: string;
  } | null;
};

type Page = { results?: TmdbItem[] };

const BASE = "https://api.themoviedb.org/3";
const POSTER = "https://image.tmdb.org/t/p/w500";
const BACKDROP = "https://image.tmdb.org/t/p/w1280";

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      ...corsHeaders,
      "Cache-Control": "private, max-age=1800",
    },
  });
}

function dateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function tmdb<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
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

function mapMovie(item: TmdbItem) {
  const releaseDate = item.release_date || null;
  return {
    source: "tmdb" as const,
    externalId: String(item.id),
    mediaType: "movie" as const,
    title: item.title ?? "Sin título",
    originalTitle: item.original_title ?? item.title ?? "Sin título",
    overview: item.overview ?? "",
    posterUrl: item.poster_path ? `${POSTER}${item.poster_path}` : null,
    backdropUrl: item.backdrop_path ? `${BACKDROP}${item.backdrop_path}` : null,
    releaseDate,
    releaseYear: releaseDate ? Number(releaseDate.slice(0, 4)) : null,
    rating: item.vote_average ?? null,
    voteCount: item.vote_count ?? 0,
    popularity: item.popularity ?? 0,
  };
}

function mapSeries(item: TmdbTvDetails) {
  const nextEpisode = item.next_episode_to_air ?? null;
  const releaseDate = nextEpisode?.air_date || item.first_air_date || null;
  return {
    source: "tmdb" as const,
    externalId: String(item.id),
    mediaType: "series" as const,
    title: item.name ?? "Sin título",
    originalTitle: item.original_name ?? item.name ?? "Sin título",
    overview: item.overview ?? "",
    posterUrl: item.poster_path ? `${POSTER}${item.poster_path}` : null,
    backdropUrl: item.backdrop_path ? `${BACKDROP}${item.backdrop_path}` : null,
    releaseDate,
    releaseYear: releaseDate ? Number(releaseDate.slice(0, 4)) : null,
    rating: item.vote_average ?? null,
    voteCount: item.vote_count ?? 0,
    popularity: item.popularity ?? 0,
    nextEpisode: nextEpisode
      ? {
          seasonNumber: nextEpisode.season_number ?? null,
          episodeNumber: nextEpisode.episode_number ?? null,
          name: nextEpisode.name ?? null,
        }
      : null,
  };
}

const handler = withSupabase({ auth: "user" }, async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Método no permitido." }, 405);
  }

  const token = Deno.env.get("TMDB_READ_ACCESS_TOKEN");
  if (!token) {
    return json({ error: "TMDB no está configurado." }, 503);
  }

  try {
    const payload = (await request.json()) as Payload;
    const filter: Filter = payload.filter ?? "all";

    if (!["all", "movie", "series"].includes(filter)) {
      return json({ error: "Filtro inválido." }, 400);
    }

    const today = new Date();
    const until = new Date(today);
    until.setDate(until.getDate() + 90);

    const from = dateString(today);
    const to = dateString(until);

    const moviePromise = filter === "series"
      ? Promise.resolve([])
      : tmdb<Page>(
          `/discover/movie?language=es-CL&region=CL&sort_by=popularity.desc&release_date.gte=${from}&release_date.lte=${to}&with_release_type=2|3|4|6&include_adult=false&include_video=false&page=1`,
          token,
        ).then((page) => (page.results ?? []).map(mapMovie));

    const seriesPromise = filter === "movie"
      ? Promise.resolve([])
      : tmdb<Page>(
          `/discover/tv?language=es-CL&sort_by=popularity.desc&air_date.gte=${from}&air_date.lte=${to}&include_adult=false&page=1`,
          token,
        ).then(async (page) => {
          const candidates = (page.results ?? []).slice(0, 20);
          const details = await Promise.allSettled(
            candidates.map((item) =>
              tmdb<TmdbTvDetails>(`/tv/${item.id}?language=es-CL`, token),
            ),
          );

          return details
            .filter((result): result is PromiseFulfilledResult<TmdbTvDetails> => result.status === "fulfilled")
            .map((result) => mapSeries(result.value))
            .filter((item) => item.releaseDate && item.releaseDate >= from && item.releaseDate <= to);
        });

    const [movies, series] = await Promise.all([moviePromise, seriesPromise]);

    const results = [...movies, ...series]
      .filter((item) => item.releaseDate)
      .sort(
        (a, b) =>
          String(a.releaseDate).localeCompare(String(b.releaseDate)) ||
          b.popularity - a.popularity,
      )
      .slice(0, 40);

    return json({
      results,
      generatedAt: new Date().toISOString(),
      window: { from, to },
      counts: { movies: movies.length, series: series.length },
    });
  } catch (error) {
    console.error("tmdb-releases error", error);
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible consultar estrenos.",
      },
      502,
    );
  }
});

export default {
  fetch: async (request: Request) =>
    request.method === "OPTIONS"
      ? new Response("ok", { headers: corsHeaders })
      : handler(request),
};
