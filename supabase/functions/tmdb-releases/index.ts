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
type Page = { results?: TmdbItem[] };

const BASE = "https://api.themoviedb.org/3";
const POSTER = "https://image.tmdb.org/t/p/w500";
const BACKDROP = "https://image.tmdb.org/t/p/w1280";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { ...corsHeaders, "Cache-Control": "private, max-age=1800" } });
}

function dateString(date: Date) { return date.toISOString().slice(0, 10); }

async function tmdb(path: string, token: string) {
  const response = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
  if (!response.ok) throw new Error(`TMDB respondió con estado ${response.status}`);
  return await response.json() as Page;
}

function mapItem(item: TmdbItem, mediaType: "movie" | "series") {
  const releaseDate = mediaType === "movie" ? item.release_date : item.first_air_date;
  return {
    source: "tmdb",
    externalId: String(item.id),
    mediaType,
    title: item.title ?? item.name ?? "Sin título",
    originalTitle: item.original_title ?? item.original_name ?? item.title ?? item.name ?? "Sin título",
    overview: item.overview ?? "",
    posterUrl: item.poster_path ? `${POSTER}${item.poster_path}` : null,
    backdropUrl: item.backdrop_path ? `${BACKDROP}${item.backdrop_path}` : null,
    releaseDate: releaseDate || null,
    releaseYear: releaseDate ? Number(releaseDate.slice(0, 4)) : null,
    rating: item.vote_average ?? null,
    voteCount: item.vote_count ?? 0,
    popularity: item.popularity ?? 0,
  };
}

const handler = withSupabase({ auth: "user" }, async (request) => {
  if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);
  const token = Deno.env.get("TMDB_READ_ACCESS_TOKEN");
  if (!token) return json({ error: "TMDB no está configurado." }, 503);

  try {
    const payload = await request.json() as Payload;
    const filter: Filter = payload.filter ?? "all";
    if (!["all", "movie", "series"].includes(filter)) return json({ error: "Filtro inválido." }, 400);

    const today = new Date();
    const until = new Date(today); until.setDate(until.getDate() + 90);
    const from = dateString(today); const to = dateString(until);
    const jobs: Promise<{ type: "movie" | "series"; page: Page }>[] = [];

    if (filter !== "series") jobs.push(tmdb(`/discover/movie?language=es-CL&region=CL&sort_by=primary_release_date.asc&primary_release_date.gte=${from}&primary_release_date.lte=${to}&include_adult=false&page=1`, token).then(page => ({ type: "movie", page })));
    if (filter !== "movie") jobs.push(tmdb(`/discover/tv?language=es-CL&sort_by=first_air_date.asc&first_air_date.gte=${from}&first_air_date.lte=${to}&include_adult=false&page=1`, token).then(page => ({ type: "series", page })));

    const pages = await Promise.all(jobs);
    const results = pages.flatMap(({ type, page }) => (page.results ?? []).map(item => mapItem(item, type)))
      .filter(item => item.releaseDate)
      .sort((a, b) => String(a.releaseDate).localeCompare(String(b.releaseDate)) || b.popularity - a.popularity)
      .slice(0, 40);

    return json({ results, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("tmdb-releases error", error);
    return json({ error: error instanceof Error ? error.message : "No fue posible consultar estrenos." }, 502);
  }
});

export default { fetch: async (request: Request) => request.method === "OPTIONS" ? new Response("ok", { headers: corsHeaders }) : handler(request) };
