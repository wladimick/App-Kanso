// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";
import { corsHeaders } from "jsr:@supabase/supabase-js@2.111.0/cors";

type Payload = { page?: number };
type Company = { id: number; name: string };
type CompanyPage = { results?: Company[] };
type Movie = {
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
type Tv = {
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
type Page<T> = { page: number; results: T[]; total_pages: number };

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { ...corsHeaders, "Cache-Control": "private, max-age=600" },
  });
}

function imageUrl(path?: string | null) {
  return path ? `${IMAGE_BASE}${path}` : null;
}

async function tmdbFetch<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${TMDB_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`TMDB respondió con estado ${response.status}`);
  return (await response.json()) as T;
}

const authenticatedHandler = withSupabase(
  { auth: "user" },
  async (request) => {
    if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);

    const token = Deno.env.get("TMDB_READ_ACCESS_TOKEN");
    if (!token) return json({ error: "TMDB no está configurado." }, 503);

    try {
      const payload = (await request.json()) as Payload;
      const page = Number.isInteger(payload.page) && (payload.page ?? 0) > 0
        ? Math.min(payload.page!, 100)
        : 1;

      const companySearch = await tmdbFetch<CompanyPage>(
        "/search/company?query=Marvel&page=1",
        token,
      );

      const companies = (companySearch.results ?? [])
        .filter((company) => company.name.toLowerCase().includes("marvel"))
        .slice(0, 20);

      // Marvel Studios (TMDB company 420) is always included as the stable MCU anchor.
      if (!companies.some((company) => company.id === 420)) {
        companies.unshift({ id: 420, name: "Marvel Studios" });
      }

      const companyFilter = [...new Set(companies.map((company) => company.id))].join("|");
      const common = new URLSearchParams({
        include_adult: "false",
        language: "es-CL",
        page: String(page),
        sort_by: "popularity.desc",
        with_companies: companyFilter,
      });

      const [movies, tv] = await Promise.all([
        tmdbFetch<Page<Movie>>(`/discover/movie?${common.toString()}&include_video=false`, token),
        tmdbFetch<Page<Tv>>(`/discover/tv?${common.toString()}&include_null_first_air_dates=false`, token),
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

      const deduped = new Map<string, typeof movieResults[number] | typeof tvResults[number]>();
      for (const item of [...movieResults, ...tvResults]) {
        deduped.set(`${item.mediaType}:${item.externalId}`, item);
      }

      const results = [...deduped.values()].sort((a, b) => {
        const dateA = a.releaseDate ? Date.parse(a.releaseDate) : 0;
        const dateB = b.releaseDate ? Date.parse(b.releaseDate) : 0;
        if (dateA !== dateB) return dateB - dateA;
        return b.popularity - a.popularity;
      });

      return json({
        page,
        results,
        hasMore: page < Math.max(movies.total_pages, tv.total_pages),
        companies,
      });
    } catch (error) {
      console.error("TMDB Marvel function error", error);
      return json({ error: error instanceof Error ? error.message : "No fue posible consultar Marvel en TMDB." }, 502);
    }
  },
);

export default {
  fetch: async (request: Request) => {
    if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    return authenticatedHandler(request);
  },
};
