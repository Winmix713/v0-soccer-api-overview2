// lib/sportradar-api.ts
// ⚠️ Biztonsági figyelmeztetés: API kulcs ne legyen forráskódban production környezetben!
// Használj környezeti változót: process.env.SPORTRADAR_API_KEY

export const SPORTRADAR_API_KEY = process.env.SPORTRADAR_API_KEY || "pVjDZHDlwNvnHgzvAYFzZYu4ncRylXL80s5DL1KD";
export const SPORTRADAR_BASE_URL = "/api/sportradar"; // Helyi proxy routes használata

// Cache beállítások különböző adattípusokhoz
export const CACHE_SETTINGS = {
  live: 10,           // 10 másodperc - élő adatok
  daily: 300,         // 5 perc - napi menetrend
  standings: 300,     // 5 perc - tabella
  season: 3600,       // 1 óra - szezon info
  competitor: 1800,   // 30 perc - csapat adatok
  static: 86400,      // 24 óra - statikus adatok
} as const;

// API endpoint categories - Egyszerűsített útvonalak proxy route-okhoz
export const API_ENDPOINTS = {
  // Competition & Season Data
  competitions: "/competitions",
  competitionInfo: (id: string) => `/competitions/${id}/info`,
  competitionSeasons: (id: string) => `/competitions/${id}/seasons`,
  seasonInfo: (id: string) => `/seasons/${id}/info`,
  seasonStandings: (id: string) => `/seasons/${id}/standings`,
  seasonSchedule: (id: string) => `/seasons/${id}/schedule`,
  seasonCompetitors: (id: string) => `/seasons/${id}/competitors`,

  // Live Data
  liveSchedules: "/schedules/live",
  liveSummaries: "/schedules/live/summaries",
  liveTimelines: "/schedules/live/timelines",

  // Daily Data
  dailySchedules: (date: string) => `/schedules/daily/${date}`,
  dailySummaries: (date: string) => `/schedules/daily/${date}/summaries`,

  // Team/Competitor Data
  competitorProfile: (id: string) => `/competitors/${id}/profile`,
  competitorSchedules: (id: string) => `/competitors/${id}/schedules`,
  competitorSummaries: (id: string) => `/competitors/${id}/summaries`,
  competitorVsCompetitor: (id1: string, id2: string) => `/competitors/${id1}/versus/${id2}/matches`,

  // Player Data
  playerProfile: (id: string) => `/players/${id}/profile`,
  playerSchedules: (id: string) => `/players/${id}/schedules`,
  playerSummaries: (id: string) => `/players/${id}/summaries`,

  // Match Data
  sportEventSummary: (id: string) => `/sport_events/${id}/summary`,
  sportEventTimeline: (id: string) => `/sport_events/${id}/timeline`,
  sportEventLineups: (id: string) => `/sport_events/${id}/lineups`,
  sportEventFunFacts: (id: string) => `/sport_events/${id}/fun_facts`,

  // Statistics
  seasonLeaders: (id: string) => `/seasons/${id}/leaders`,
  seasonalCompetitorStatistics: (seasonId: string, competitorId: string) =>
    `/seasons/${seasonId}/competitors/${competitorId}/statistics`,

  // Probabilities (ha elérhető)
  sportEventProbabilities: (id: string) => `/sport_events/${id}/probabilities`,
  seasonProbabilities: (id: string) => `/seasons/${id}/probabilities`,
  liveProbabilities: "/probabilities/live",

  // Push Feeds (valós idejű adatok)
  pushEvents: "/push/events",
  pushStatistics: "/push/statistics",
} as const;

// Típus definíciók - Javított TypeScript interface-ek
export interface Competition {
  id: string;
  name: string;
  category: {
    id: string;
    name: string;
    country_code?: string;
  };
  type: string;
  gender: 'male' | 'female' | 'mixed';
}

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  year: string;
  competition_id: string;
  disabled?: boolean;
}

export interface Competitor {
  id: string;
  name: string;
  country?: string;
  country_code?: string;
  abbreviation?: string;
  qualifier?: string;
  virtual?: boolean;
}

export interface SportEvent {
  id: string;
  start_time: string;
  start_time_confirmed: boolean;
  competitors: Competitor[];
  venue?: {
    id: string;
    name: string;
    city_name: string;
    country_name: string;
    country_code?: string;
  };
  status: 'not_started' | 'live' | 'ended' | 'postponed' | 'cancelled';
  match_status: string;
}

export interface MatchSummary {
  sport_event: SportEvent;
  sport_event_status: {
    status: string;
    match_status: string;
    home_score?: number;
    away_score?: number;
    winner_id?: string;
    period_scores?: Array<{
      home_score: number;
      away_score: number;
      type: string;
      number?: number;
    }>;
  };
  statistics?: {
    totals: {
      competitors: Array<{
        id: string;
        name: string;
        statistics: Record<string, number>;
      }>;
    };
  };
}

export interface PlayerProfile {
  id: string;
  name: string;
  full_name: string;
  type: string;
  date_of_birth?: string;
  nationality?: string;
  country_code?: string;
  height?: number;
  weight?: number;
  jersey_number?: number;
  position?: string;
}

export interface Standing {
  competitor: Competitor;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  rank: number;
}

// API válasz típusok
export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
  timestamp?: string;
}

export interface SportradarError extends Error {
  status?: number;
  timestamp: string;
}

// Javított API kliens osztály
export class SportradarAPI {
  private apiKey: string;
  private baseUrl: string;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 perc

  constructor(apiKey: string = SPORTRADAR_API_KEY, baseUrl: string = SPORTRADAR_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;

    if (!this.apiKey && process.env.NODE_ENV === 'production') {
      console.warn('⚠️ SPORTRADAR_API_KEY hiányzik!');
    }
  }

  /**
   * Belső kérés kezelő gyorsítótárral és hibakezeléssel
   */
  private async makeRequest<T>(endpoint: string, useCache: boolean = true): Promise<ApiResponse<T>> {
    const cacheKey = `${endpoint}_${this.apiKey}`;
    
    // Cache ellenőrzés
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return { data: cached.data, success: true };
      }
    }

    const url = `${this.baseUrl}${endpoint}?api_key=${encodeURIComponent(this.apiKey)}`;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: SportradarError = Object.assign(
          new Error(`API hiba: ${response.status} ${errorData.message || response.statusText}`),
          { status: response.status, timestamp: new Date().toISOString() }
        );
        throw error;
      }

      const data = await response.json();
      
      // Cache frissítése
      if (useCache) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return { data, success: true, timestamp: new Date().toISOString() };
    } catch (error: any) {
      console.error("Sportradar API hiba:", {
        endpoint,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return { 
        data: null as any, 
        error: error.message, 
        success: false, 
        timestamp: new Date().toISOString() 
      };
    }
  }

  /**
   * Cache törlése (opcionális)
   */
  public clearCache(): void {
    this.cache.clear();
  }

  // Competition methods - Javított típusokkal
  async getCompetitions(): Promise<ApiResponse<{ competitions: Competition[] }>> {
    return this.makeRequest(API_ENDPOINTS.competitions);
  }

  async getCompetitionInfo(competitionId: string): Promise<ApiResponse<{ competition: Competition }>> {
    return this.makeRequest(API_ENDPOINTS.competitionInfo(competitionId));
  }

  async getCompetitionSeasons(competitionId: string): Promise<ApiResponse<{ seasons: Season[] }>> {
    return this.makeRequest(API_ENDPOINTS.competitionSeasons(competitionId));
  }

  // Live data methods - Gyorsabb cache a gyakori frissítés miatt
  async getLiveSchedules(): Promise<ApiResponse<{ sport_events: SportEvent[] }>> {
    return this.makeRequest(API_ENDPOINTS.liveSchedules, false); // No cache for live data
  }

  async getLiveSummaries(): Promise<ApiResponse<{ summaries: MatchSummary[] }>> {
    return this.makeRequest(API_ENDPOINTS.liveSummaries, false);
  }

  // Daily data methods
  async getDailySchedules(date: string): Promise<ApiResponse<{ sport_events: SportEvent[] }>> {
    this.validateDate(date);
    return this.makeRequest(API_ENDPOINTS.dailySchedules(date));
  }

  async getDailySummaries(date: string): Promise<ApiResponse<{ summaries: MatchSummary[] }>> {
    this.validateDate(date);
    return this.makeRequest(API_ENDPOINTS.dailySummaries(date));
  }

  // Season methods
  async getSeasonInfo(seasonId: string): Promise<ApiResponse<{ season: Season }>> {
    return this.makeRequest(API_ENDPOINTS.seasonInfo(seasonId));
  }

  async getSeasonStandings(seasonId: string): Promise<ApiResponse<{ standings: Standing[] }>> {
    return this.makeRequest(API_ENDPOINTS.seasonStandings(seasonId));
  }

  async getSeasonSchedule(seasonId: string): Promise<ApiResponse<{ sport_events: SportEvent[] }>> {
    return this.makeRequest(API_ENDPOINTS.seasonSchedule(seasonId));
  }

  async getSeasonCompetitors(seasonId: string): Promise<ApiResponse<{ season_competitors: Competitor[] }>> {
    return this.makeRequest(API_ENDPOINTS.seasonCompetitors(seasonId));
  }

  // Competitor methods
  async getCompetitorProfile(competitorId: string): Promise<ApiResponse<{ competitor: Competitor }>> {
    return this.makeRequest(API_ENDPOINTS.competitorProfile(competitorId));
  }

  async getCompetitorSchedules(competitorId: string): Promise<ApiResponse<{ schedules: SportEvent[] }>> {
    return this.makeRequest(API_ENDPOINTS.competitorSchedules(competitorId));
  }

  // Player methods
  async getPlayerProfile(playerId: string): Promise<ApiResponse<{ player: PlayerProfile }>> {
    return this.makeRequest(API_ENDPOINTS.playerProfile(playerId));
  }

  // Match methods
  async getSportEventSummary(eventId: string): Promise<ApiResponse<MatchSummary>> {
    return this.makeRequest(API_ENDPOINTS.sportEventSummary(eventId));
  }

  async getSportEventTimeline(eventId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(API_ENDPOINTS.sportEventTimeline(eventId));
  }

  async getSportEventFunFacts(eventId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(API_ENDPOINTS.sportEventFunFacts(eventId));
  }

  // Statistics methods
  async getSeasonLeaders(seasonId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(API_ENDPOINTS.seasonLeaders(seasonId));
  }

  async getSeasonalCompetitorStatistics(seasonId: string, competitorId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(API_ENDPOINTS.seasonalCompetitorStatistics(seasonId, competitorId));
  }

  // Real-time data methods
  async getLiveProbabilities(): Promise<ApiResponse<any>> {
    return this.makeRequest(API_ENDPOINTS.liveProbabilities, false);
  }

  async getPushEvents(): Promise<ApiResponse<any>> {
    return this.makeRequest(API_ENDPOINTS.pushEvents, false);
  }

  async getPushStatistics(): Promise<ApiResponse<any>> {
    return this.makeRequest(API_ENDPOINTS.pushStatistics, false);
  }

  // Batch live data updates - Javított hibakezeléssel
  async getBatchLiveData(matchIds: string[]): Promise<Array<PromiseSettledResult<[any, any]>>> {
    const promises = matchIds.map(async (id) => {
      const summaryPromise = this.getSportEventSummary(id);
      const timelinePromise = this.getSportEventTimeline(id);
      return Promise.allSettled([summaryPromise, timelinePromise]);
    });

    return Promise.all(promises);
  }

  // Privát segédfüggvények
  private validateDate(date: string): void {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error(`Érvénytelen dátumformátum: ${date}. Használj YYYY-MM-DD formátumot.`);
    }
  }
}

// Segédfüggvények - Kibővítve
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getTodayDate(): string {
  return formatDate(new Date());
}

export function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDate(yesterday);
}

export function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDate(tomorrow);
}

export function getDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Szűrő és rendező segédfüggvények
export function filterLiveMatches(events: SportEvent[]): SportEvent[] {
  return events.filter(event => event.status === 'live');
}

export function sortEventsByTime(events: SportEvent[]): SportEvent[] {
  return [...events].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
}

export function groupEventsByDate(events: SportEvent[]): Record<string, SportEvent[]> {
  return events.reduce((groups, event) => {
    const date = event.start_time.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(event);
    return groups;
  }, {} as Record<string, SportEvent[]>);
}

// Singleton instance létrehozása
export const sportRadarAPI = new SportradarAPI();
