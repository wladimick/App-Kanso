import { searchTmdb, type TmdbSearchResult } from './tmdb'

export type UniverseId = 'marvel' | 'saint-seiya' | 'dragon-ball' | 'naruto' | 'star-wars' | 'dc'

export type UniverseDefinition = {
  id: UniverseId
  label: string
  shortLabel: string
  description: string
  queries: string[]
  keywords: string[]
}

export const universeDefinitions: UniverseDefinition[] = [
  {
    id: 'marvel',
    label: 'Marvel',
    shortLabel: 'Marvel',
    description: 'MCU, Spider-Man, X-Men y otras historias del universo Marvel.',
    queries: ['Avengers', 'Iron Man', 'Captain America', 'Thor', 'Guardians of the Galaxy', 'Doctor Strange', 'Black Panther', 'Spider-Man', 'Loki', 'WandaVision'],
    keywords: ['avengers', 'iron man', 'capitan america', 'captain america', 'thor', 'guardians of the galaxy', 'guardianes de la galaxia', 'doctor strange', 'black panther', 'pantera negra', 'spider-man', 'spiderman', 'loki', 'wandavision', 'ant-man', 'captain marvel', 'capitana marvel', 'x-men', 'deadpool', 'daredevil', 'hawkeye', 'moon knight', 'she-hulk', 'echo', 'agatha', 'fantastic four', 'cuatro fantasticos'],
  },
  {
    id: 'saint-seiya',
    label: 'Caballeros del Zodiaco',
    shortLabel: 'Saint Seiya',
    description: 'Series, películas y spin-offs de Saint Seiya / Caballeros del Zodiaco.',
    queries: ['Saint Seiya', 'Caballeros del Zodiaco', 'Saintia Sho', 'The Lost Canvas'],
    keywords: ['saint seiya', 'caballeros del zodiaco', 'saintia sho', 'saintia shō', 'lost canvas', 'soul of gold', 'omega'],
  },
  {
    id: 'dragon-ball',
    label: 'Dragon Ball',
    shortLabel: 'Dragon Ball',
    description: 'Dragon Ball, Z, GT, Super, Daima y sus películas.',
    queries: ['Dragon Ball', 'Dragon Ball Z', 'Dragon Ball Super', 'Dragon Ball Daima'],
    keywords: ['dragon ball'],
  },
  {
    id: 'naruto',
    label: 'Naruto',
    shortLabel: 'Naruto',
    description: 'Naruto, Shippuden, Boruto y películas relacionadas.',
    queries: ['Naruto', 'Naruto Shippuden', 'Boruto'],
    keywords: ['naruto', 'boruto'],
  },
  {
    id: 'star-wars',
    label: 'Star Wars',
    shortLabel: 'Star Wars',
    description: 'Películas y series de la galaxia Star Wars.',
    queries: ['Star Wars', 'The Mandalorian', 'Ahsoka', 'Andor', 'Obi-Wan Kenobi'],
    keywords: ['star wars', 'mandalorian', 'ahsoka', 'andor', 'obi-wan', 'boba fett', 'acolyte'],
  },
  {
    id: 'dc',
    label: 'DC',
    shortLabel: 'DC',
    description: 'Batman, Superman, Justice League y otras historias de DC.',
    queries: ['Batman', 'Superman', 'Justice League', 'Wonder Woman', 'Peacemaker'],
    keywords: ['batman', 'superman', 'justice league', 'liga de la justicia', 'wonder woman', 'mujer maravilla', 'peacemaker', 'aquaman', 'shazam', 'flash', 'suicide squad', 'escuadron suicida', 'joker', 'harley quinn'],
  },
]

export function normalizeUniverseText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function belongsToUniverse(title: string, originalTitle: string | null | undefined, universe: UniverseDefinition) {
  const haystack = `${normalizeUniverseText(title)} ${normalizeUniverseText(originalTitle ?? '')}`
  return universe.keywords.some((keyword) => haystack.includes(normalizeUniverseText(keyword)))
}

export async function fetchUniverseCatalog(universe: UniverseDefinition) {
  const pages = await Promise.allSettled(universe.queries.map((query) => searchTmdb(query)))
  const all = pages.flatMap((result) => result.status === 'fulfilled' ? result.value : [])

  const filtered = all.filter((item) => belongsToUniverse(item.title, item.originalTitle, universe))
  const deduped = new Map<string, TmdbSearchResult>()

  for (const item of filtered) {
    const key = `${item.mediaType}:${item.externalId}`
    const current = deduped.get(key)
    if (!current || item.popularity > current.popularity) deduped.set(key, item)
  }

  return [...deduped.values()]
    .sort((a, b) => b.popularity - a.popularity || (b.releaseYear ?? 0) - (a.releaseYear ?? 0))
    .slice(0, 72)
}
