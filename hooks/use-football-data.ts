"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { z } from "zod"

// === KONFIGURÁCIÓS FÁJLOK ===
const CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api/football-data",
  CACHE_TTL: 5 * 60 * 1000, // 5 perc
  MAX_RETRIES: 3,
  TIMEOUT: 10000,
} as const

// === VALIDÁCIÓS SÉMÁK ===
const CompetitorSchema = z.object({
  id: z.string(),
  name: z.string(),
  qualifier: z.enum(["home", "away"]),
})

const SportEventSchema = z.object({
  id: z.string(),
  start_time: z.string(),
  competitors: z.array(CompetitorSchema),
})

const SportEventStatusSchema = z.object({
  match_status: z.string(),
  home_score: z.number().optional(),
  away_score: z.number().optional(),
})

const MatchDataSchema = z.object({
  sport_event: SportEventSchema,
  sport_event_status: SportEventStatusSchema,
})

const CompetitionSchema = z.object({
  id: z.string(),
  name: z.string(),
})

// === TÍPUSOK ===
export interface Competition {
  id: string
  name: string
}

export interface MatchData {
  sport_event: {
    id: string
    start_time: string
    competitors: Array<{
      id: string
      name: string
      qualifier: "home" | "away"
    }>
  }
  sport_event_status: {
    match_status: string
    home_score?: number
    away_score?: number
  }
}

export interface FeaturedMatch {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  totalGoals: number
  date: string
  matchDate: Date
}

export interface Stats {
  avgGoals: number
  over25Percentage: number
  bttsPercentage: number
  totalMatches: number
  accuracy: number
  confidence: number
  featuredMatches: FeaturedMatch[]
}

export interface TeamStats {
  [teamId: string]: {
    name: string
    matches: number
    goalsFor: number
    goalsAgainst: number
    bttsPercentage: number
    over25Percentage: number
    avgGoalsFor: number
    avgGoalsAgainst: number
  }
}

export type LoadingState = "idle" | "loading" | "success" | "error"

// === CACHE KEZELÉS ===
interface CacheEntry<T> {
  data: T
  timestamp: number
  key: string
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, ttl: number = CONFIG.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key,
    })
    
    // Automatikus tisztítás
    setTimeout(() => this.cache.delete(key), ttl)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > CONFIG.CACHE_TTL
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  clear(): void {
    this.cache.clear()
  }
}

// === DEMO ADATOK GENERÁLÁS ===
class DemoDataGenerator {
  private static readonly DEMO_TEAMS = [
    "Arsenal", "Manchester City", "Liverpool", "Chelsea", "Manchester United",
    "Tottenham", "Newcastle", "Brighton", "Aston Villa", "West Ham",
    "Crystal Palace", "Fulham", "Wolves", "Everton", "Brentford",
    "Nottingham Forest", "Sheffield United", "Burnley", "Luton", "Bournemouth",
  ] as const

  private static readonly DEMO_COMPETITIONS = [
    { id: "sr:season:118689", name: "Premier League 2024/25" },
    { id: "sr:season:118691", name: "La Liga 2024/25" },
    { id: "sr:season:118693", name: "Bundesliga 2024/25" },
    { id: "sr:season:118695", name: "Serie A 2024/25" },
    { id: "sr:season:118697", name: "Ligue 1 2024/25" },
    { id: "sr:season:118699", name: "Champions League 2024/25" },
    { id: "sr:season:118701", name: "Europa League 2024/25" },
  ] as const

  static generateCompetitions(): Competition[] {
    return [...this.DEMO_COMPETITIONS]
  }

  static generateMatches(seasonId: string, seed: number = Date.now()): MatchData[] {
    // Seeded random generátor az ismételhető eredményekhez
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed++) * 10000
      return x - Math.floor(x)
    }

    const matches: MatchData[] = []
    let currentSeed = seed

    for (let i = 0; i < 150; i++) {
      const homeIndex = Math.floor(seededRandom(currentSeed++) * this.DEMO_TEAMS.length)
      let awayIndex = Math.floor(seededRandom(currentSeed++) * this.DEMO_TEAMS.length)
      
      while (awayIndex === homeIndex) {
        awayIndex = Math.floor(seededRandom(currentSeed++) * this.DEMO_TEAMS.length)
      }

      const homeTeam = this.DEMO_TEAMS[homeIndex]
      const awayTeam = this.DEMO_TEAMS[awayIndex]

      // Valószerűbb gólstatisztikák
      const homeScore = this.generateRealisticScore(seededRandom(currentSeed++))
      const awayScore = this.generateRealisticScore(seededRandom(currentSeed++))

      const daysAgo = Math.floor(seededRandom(currentSeed++) * 180)
      const matchDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

      matches.push({
        sport_event: {
          id: `sr:match:demo_${seasonId}_${i}`,
          start_time: matchDate.toISOString(),
          competitors: [
            { id: `sr:team:${homeTeam.toLowerCase()}`, name: homeTeam, qualifier: "home" },
            { id: `sr:team:${awayTeam.toLowerCase()}`, name: awayTeam, qualifier: "away" },
          ],
        },
        sport_event_status: {
          match_status: "ended",
          home_score: homeScore,
          away_score: awayScore,
        },
      })
    }

    return matches
  }

  private static generateRealisticScore(random: number): number {
    // Valószerűbb gól eloszlás (Poisson-szerű)
    if (random < 0.3) return 0
    if (random < 0.6) return 1
    if (random < 0.8) return 2
    if (random < 0.92) return 3
    if (random < 0.98) return 4
    return Math.floor(random * 3) + 5
  }
}

// === STATISZTIKAI SZÁMÍTÁSOK ===
class StatsCalculator {
  static analyzeMatches(matches: MatchData[]): Stats | null {
    const completedMatches = matches.filter(
      (match) => match.sport_event_status?.match_status === "ended" &&
                 typeof match.sport_event_status.home_score === "number" &&
                 typeof match.sport_event_status.away_score === "number"
    )

    if (completedMatches.length === 0) {
      return null
    }

    let totalGoals = 0
    let over25Count = 0
    let bttsCount = 0
    const featuredMatches: FeaturedMatch[] = []

    // Egyetlen iterációban számítjuk ki az összes statisztikát
    completedMatches.forEach((match) => {
      const homeScore = match.sport_event_status.home_score!
      const awayScore = match.sport_event_status.away_score!
      const totalMatchGoals = homeScore + awayScore
      const matchDate = new Date(match.sport_event.start_time)

      totalGoals += totalMatchGoals

      const isOver25 = totalMatchGoals > 2.5
      const isBTTS = homeScore > 0 && awayScore > 0

      if (isOver25) over25Count++
      if (isBTTS) bttsCount++

      if (isOver25 && isBTTS) {
        featuredMatches.push({
          homeTeam: match.sport_event.competitors.find((c) => c.qualifier === "home")?.name || "Home",
          awayTeam: match.sport_event.competitors.find((c) => c.qualifier === "away")?.name || "Away",
          homeScore,
          awayScore,
          totalGoals: totalMatchGoals,
          date: matchDate.toLocaleDateString("hu-HU"),
          matchDate,
        })
      }
    })

    const matchCount = completedMatches.length
    const avgGoals = totalGoals / matchCount
    const over25Percentage = (over25Count / matchCount) * 100
    const bttsPercentage = (bttsCount / matchCount) * 100

    // Intelligensebb pontosság és bizalom számítás
    const accuracy = this.calculateAccuracy(avgGoals, over25Percentage, bttsPercentage)
    const confidence = this.calculateConfidence(matchCount, over25Count, bttsCount)

    return {
      avgGoals,
      over25Percentage,
      bttsPercentage,
      totalMatches: matchCount,
      accuracy,
      confidence,
      featuredMatches: featuredMatches
        .sort((a, b) => {
          if (b.totalGoals !== a.totalGoals) {
            return b.totalGoals - a.totalGoals
          }
          return b.matchDate.getTime() - a.matchDate.getTime()
        })
        .slice(0, 15),
    }
  }

  static generateTeamStats(matches: MatchData[]): TeamStats {
    // Normalizált adatstruktúra használata
    const teamMap = new Map<string, { id: string; name: string }>()
    const teamStatsMap = new Map<string, any>()

    // Először összegyűjtjük az összes csapatot
    matches.forEach((match) => {
      match.sport_event.competitors.forEach((comp) => {
        if (!teamMap.has(comp.id)) {
          teamMap.set(comp.id, { id: comp.id, name: comp.name })
        }
      })
    })

    // Majd kiszámítjuk a statisztikákat
    teamMap.forEach(({ id: teamId, name: teamName }) => {
      const teamMatches = matches.filter(
        (match) =>
          match.sport_event.competitors.some((comp) => comp.id === teamId) &&
          match.sport_event_status?.match_status === "ended" &&
          typeof match.sport_event_status.home_score === "number" &&
          typeof match.sport_event_status.away_score === "number"
      )

      const stats = teamMatches.reduce(
        (acc, match) => {
          const homeTeam = match.sport_event.competitors.find((c) => c.qualifier === "home")
          const homeScore = match.sport_event_status.home_score!
          const awayScore = match.sport_event_status.away_score!
          const isHome = homeTeam?.id === teamId
          const totalGoals = homeScore + awayScore

          if (isHome) {
            acc.goalsFor += homeScore
            acc.goalsAgainst += awayScore
          } else {
            acc.goalsFor += awayScore
            acc.goalsAgainst += homeScore
          }

          if (homeScore > 0 && awayScore > 0) acc.bttsCount++
          if (totalGoals > 2.5) acc.over25Count++

          return acc
        },
        { goalsFor: 0, goalsAgainst: 0, bttsCount: 0, over25Count: 0 }
      )

      const totalMatches = teamMatches.length

      teamStatsMap.set(teamId, {
        name: teamName,
        matches: totalMatches,
        goalsFor: stats.goalsFor,
        goalsAgainst: stats.goalsAgainst,
        bttsPercentage: totalMatches > 0 ? (stats.bttsCount / totalMatches) * 100 : 0,
        over25Percentage: totalMatches > 0 ? (stats.over25Count / totalMatches) * 100 : 0,
        avgGoalsFor: totalMatches > 0 ? stats.goalsFor / totalMatches : 0,
        avgGoalsAgainst: totalMatches > 0 ? stats.goalsAgainst / totalMatches : 0,
      })
    })

    return Object.fromEntries(teamStatsMap)
  }

  private static calculateAccuracy(avgGoals: number, over25: number, btts: number): number {
    // Pontosság számítás a statisztikai konzisztencia alapján
    const baseAccuracy = 75
    const goalConsistency = Math.min((avgGoals - 1) * 10, 15)
    const predictionConsistency = Math.min(Math.abs(50 - over25) / 2, 10)
    
    return Math.min(baseAccuracy + goalConsistency + predictionConsistency, 95)
  }

  private static calculateConfidence(totalMatches: number, over25: number, btts: number): number {
    // Bizalom szint a minták számán alapul
    const sampleSize = Math.min(totalMatches / 10, 20)
    const consistency = Math.min((Math.abs(over25 - btts) < 10 ? 10 : 0), 10)
    
    return Math.min(60 + sampleSize + consistency, 95)
  }
}

// === API KLIENS ===
class FootballApiClient {
  private cache = new SimpleCache()
  private abortController: AbortController | null = null

  async fetchWithValidation<T>(
    endpoint: string,
    schema: z.ZodSchema<T>,
    useCache: boolean = true
  ): Promise<T> {
    const cacheKey = `api_${endpoint}`
    
    // Cache ellenőrzés
    if (useCache) {
      const cachedData = this.cache.get<T>(cacheKey)
      if (cachedData) {
        console.log("✅ Cache hit:", endpoint)
        return cachedData
      }
    }

    // Előző kérés megszakítása
    if (this.abortController) {
      this.abortController.abort()
    }
    
    this.abortController = new AbortController()

    const timeoutId = setTimeout(() => {
      this.abortController?.abort()
    }, CONFIG.TIMEOUT)

    try {
      console.log("🔄 API hívás:", endpoint)
      
      const response = await fetch(`${CONFIG.BASE_URL}/${endpoint}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: this.abortController.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const rawData = await response.json()
      
      // Validáció
      const validatedData = schema.parse(rawData)
      
      // Cache-be mentés
      if (useCache) {
        this.cache.set(cacheKey, validatedData)
      }

      console.log("✅ API siker:", endpoint)
      return validatedData

    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof z.ZodError) {
        console.error("❌ Validációs hiba:", error.errors)
        throw new Error("A szerver válasz formátuma érvénytelen")
      }
      
      if ((error as Error).name === 'AbortError') {
        throw new Error("A kérés túl sokáig tartott")
      }
      
      console.error("❌ API hiba:", error)
      throw error
    } finally {
      this.abortController = null
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}

// === FŐHOOK ===
export function useFootballData() {
  // Állapotok
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedCompetition, setSelectedCompetition] = useState("")
  const [loadingState, setLoadingState] = useState<LoadingState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [matchData, setMatchData] = useState<MatchData[]>([])
  
  // Refs
  const apiClient = useRef(new FootballApiClient())
  const errorTimeoutRef = useRef<NodeJS.Timeout>()

  // Memoizált számítások
  const stats = useMemo(() => {
    if (matchData.length === 0) return null
    return StatsCalculator.analyzeMatches(matchData)
  }, [matchData])

  const teamStats = useMemo(() => {
    if (matchData.length === 0) return {}
    return StatsCalculator.generateTeamStats(matchData)
  }, [matchData])

  // Hibakezelés
  const showError = useCallback((message: string) => {
    setError(message)
    
    // Automatikus hibatörlés
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
    }
    
    errorTimeoutRef.current = setTimeout(() => {
      setError(null)
    }, 5000)
  }, [])

  // Bajnokságok betöltése
  const loadCompetitions = useCallback(async () => {
    setLoadingState("loading")
    setError(null)

    try {
      const response = await apiClient.current.fetchWithValidation(
        "competitions",
        z.object({
          competitions: z.array(z.object({
            id: z.string(),
            name: z.string(),
            current_season: z.object({
              id: z.string(),
              name: z.string().optional(),
              year: z.string().optional(),
            }).optional(),
          }))
        })
      )

      const validCompetitions = response.competitions
        .filter((comp) => comp.current_season?.id)
        .map((comp) => ({
          id: comp.current_season!.id,
          name: `${comp.name} (${comp.current_season!.name || comp.current_season!.year || "2024/25"})`,
        }))

      if (validCompetitions.length === 0) {
        throw new Error("Nem találhatók aktív szezonnal rendelkező bajnokságok")
      }

      setCompetitions(validCompetitions)
      setLoadingState("success")

    } catch (error) {
      console.warn("API hiba, demo adatok használata:", error)
      
      // Fallback demo adatokra
      const demoCompetitions = DemoDataGenerator.generateCompetitions()
      setCompetitions(demoCompetitions)
      setLoadingState("success")
      
      showError("Demo adatok használata - API nem elérhető")
    }
  }, [showError])

  // Statisztikák betöltése
  const loadStats = useCallback(async () => {
    if (!selectedCompetition) {
      showError("Kérlek válassz bajnokságot!")
      return
    }

    setLoadingState("loading")
    setError(null)

    try {
      const response = await apiClient.current.fetchWithValidation(
        `seasons/${selectedCompetition}/summaries`,
        z.object({
          summaries: z.array(MatchDataSchema)
        })
      )

      if (!response.summaries || response.summaries.length === 0) {
        throw new Error("Nem találhatók mérkőzések ehhez a szezonhoz")
      }

      setMatchData(response.summaries)
      setLoadingState("success")

    } catch (error) {
      console.warn("API hiba, demo adatok használata:", error)
      
      // Fallback demo adatokra
      const demoMatches = DemoDataGenerator.generateMatches(
        selectedCompetition, 
        selectedCompetition.length // seed a konzisztens eredményekhez
      )
      setMatchData(demoMatches)
      setLoadingState("success")
      
      showError("Demo adatok használata - API nem elérhető")
    }
  }, [selectedCompetition, showError])

  // Cache törlés
  const clearCache = useCallback(() => {
    apiClient.current.clearCache()
    showError("Cache sikeresen törölve")
  }, [showError])

  // Cleanup
  const cleanup = useCallback(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
    }
  }, [])

  // Visszatérési objektum
  return {
    // Állapotok
    competitions,
    selectedCompetition,
    setSelectedCompetition,
    loading: loadingState === "loading",
    loadingState,
    error,
    stats,
    matchData,
    teamStats,
    
    // Funkciók
    loadCompetitions,
    loadStats,
    clearCache,
    cleanup,
    
    // Utility
    hasData: matchData.length > 0,
    isReady: loadingState !== "idle",
  }
}
