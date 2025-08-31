"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { 
  SportradarAPI, 
  type Competition, 
  type Season, 
  type SportEvent, 
  type MatchSummary,
  type ApiResponse,
  type Competitor,
  type Standing
} from "@/lib/sportradar-api";

// Hook állapot típusok
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface UseApiState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
  status: LoadingState;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Hook konfiguráció
interface UseSportradarConfig {
  enableCache?: boolean;
  cacheTTL?: number; // milliseconds
  retryAttempts?: number;
  retryDelay?: number;
  autoRefreshInterval?: number;
}

// Visszatérési típus
export interface UseSportradarReturn {
  // Connection state
  isConnected: boolean;
  apiKey: string;
  
  // Global loading state (any operation in progress)
  globalLoading: boolean;
  
  // Individual data states
  competitions: UseApiState<Competition[]>;
  seasons: UseApiState<Season[]>;
  liveMatches: UseApiState<SportEvent[]>;
  dailyMatches: UseApiState<SportEvent[]>;
  matchSummaries: UseApiState<MatchSummary[]>;
  standings: UseApiState<Standing[]>;
  
  // Selected items
  selectedCompetition: Competition | null;
  selectedSeason: Season | null;
  
  // Actions
  setApiKey: (apiKey: string) => void;
  loadCompetitions: () => Promise<void>;
  loadCompetitionSeasons: (competitionId: string) => Promise<void>;
  loadLiveMatches: (autoRefresh?: boolean) => Promise<void>;
  loadDailyMatches: (date: string) => Promise<void>;
  loadMatchSummaries: (date: string) => Promise<void>;
  loadSeasonStandings: (seasonId: string) => Promise<void>;
  setSelectedCompetition: (competition: Competition | null) => void;
  setSelectedSeason: (season: Season | null) => void;
  
  // Utility actions
  clearCache: (key?: string) => void;
  clearError: (key?: string) => void;
  retryLastFailed: () => Promise<void>;
  
  // Cache statistics
  cacheStats: {
    size: number;
    hitRate: number;
    missRate: number;
  };
}

// Alapértelmezett állapot factory
function createInitialState<T>(initialData: T): UseApiState<T> {
  return {
    data: initialData,
    loading: false,
    error: null,
    lastFetch: null,
    status: 'idle',
  };
}

// Default konfiguráció
const DEFAULT_CONFIG: Required<UseSportradarConfig> = {
  enableCache: true,
  cacheTTL: 5 * 60 * 1000, // 5 perc
  retryAttempts: 3,
  retryDelay: 1000,
  autoRefreshInterval: 30000, // 30 másodperc élő adatoknál
};

export function useSportradar(config: UseSportradarConfig = {}): UseSportradarReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // API instance és kulcs kezelése
  const [apiKey, setApiKeyState] = useState<string>(() => {
    return process.env.NEXT_PUBLIC_SPORTRADAR_API_KEY || "";
  });
  
  const [apiInstance, setApiInstance] = useState<SportradarAPI>(() => 
    new SportradarAPI(apiKey)
  );
  
  const [isConnected, setIsConnected] = useState(false);
  
  // Cache és statistikák
  const cacheRef = useRef(new Map<string, CacheEntry<any>>());
  const cacheStatsRef = useRef({ hits: 0, misses: 0 });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryQueueRef = useRef<(() => Promise<void>)[]>([]);
  
  // Data states - Moduláris állapot kezelés
  const [competitions, setCompetitions] = useState(() => createInitialState<Competition[]>([]));
  const [seasons, setSeasons] = useState(() => createInitialState<Season[]>([]));
  const [liveMatches, setLiveMatches] = useState(() => createInitialState<SportEvent[]>([]));
  const [dailyMatches, setDailyMatches] = useState(() => createInitialState<SportEvent[]>([]));
  const [matchSummaries, setMatchSummaries] = useState(() => createInitialState<MatchSummary[]>([]));
  const [standings, setStandings] = useState(() => createInitialState<Standing[]>([]));
  
  // Selected items
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  
  // Global loading state - bármelyik operáció fut
  const globalLoading = useMemo(() => {
    return competitions.loading || seasons.loading || liveMatches.loading || 
           dailyMatches.loading || matchSummaries.loading || standings.loading;
  }, [competitions.loading, seasons.loading, liveMatches.loading, dailyMatches.loading, matchSummaries.loading, standings.loading]);

  // Cache utility functions
  const getCacheKey = useCallback((operation: string, params?: any) => {
    return params ? `${operation}_${JSON.stringify(params)}` : operation;
  }, []);
  
  const getFromCache = useCallback(<T>(key: string): T | null => {
    if (!finalConfig.enableCache) return null;
    
    const cached = cacheRef.current.get(key);
    if (!cached) {
      cacheStatsRef.current.misses++;
      return null;
    }
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      cacheRef.current.delete(key);
      cacheStatsRef.current.misses++;
      return null;
    }
    
    cacheStatsRef.current.hits++;
    return cached.data;
  }, [finalConfig.enableCache]);
  
  const setToCache = useCallback(<T>(key: string, data: T, ttl = finalConfig.cacheTTL) => {
    if (!finalConfig.enableCache) return;
    
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }, [finalConfig.enableCache, finalConfig.cacheTTL]);

  // Generic API call handler with retry and cache
  const handleApiCall = useCallback(async <T>(
    operation: string,
    apiCall: () => Promise<ApiResponse<T>>,
    setState: React.Dispatch<React.SetStateAction<UseApiState<T>>>,
    params?: any,
    customTTL?: number
  ): Promise<void> => {
    const cacheKey = getCacheKey(operation, params);
    
    // Cache ellenőrzés
    const cached = getFromCache<T>(cacheKey);
    if (cached) {
      setState(prev => ({
        ...prev,
        data: cached,
        status: 'success',
        error: null,
      }));
      return;
    }

    // Loading állapot beállítása
    setState(prev => ({
      ...prev,
      loading: true,
      status: 'loading',
      error: null,
    }));

    let lastError: Error | null = null;
    
    // Retry mechanizmus
    for (let attempt = 1; attempt <= finalConfig.retryAttempts; attempt++) {
      try {
        const response = await apiCall();
        
        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            data: response.data,
            loading: false,
            status: 'success',
            error: null,
            lastFetch: new Date(),
          }));
          
          setToCache(cacheKey, response.data, customTTL);
          setIsConnected(true);
          return;
        } else {
          throw new Error(response.error || 'API call failed');
        }
      } catch (error: any) {
        lastError = error;
        
        if (attempt < finalConfig.retryAttempts) {
          await new Promise(resolve => 
            setTimeout(resolve, finalConfig.retryDelay * Math.pow(2, attempt - 1))
          );
        }
      }
    }

    // Végső hiba állapot
    setState(prev => ({
      ...prev,
      loading: false,
      status: 'error',
      error: lastError?.message || 'Unknown error occurred',
    }));
    
    setIsConnected(false);
  }, [getCacheKey, getFromCache, setToCache, finalConfig.retryAttempts, finalConfig.retryDelay]);

  // API kulcs módosítása
  const setApiKey = useCallback((newApiKey: string) => {
    setApiKeyState(newApiKey);
    setApiInstance(new SportradarAPI(newApiKey));
    setIsConnected(false);
    cacheRef.current.clear(); // Cache törlése új kulcs esetén
  }, []);

  // API metódusok
  const loadCompetitions = useCallback(async () => {
    await handleApiCall(
      'competitions',
      () => apiInstance.getCompetitions(),
      setCompetitions
    );
  }, [apiInstance, handleApiCall]);

  const loadCompetitionSeasons = useCallback(async (competitionId: string) => {
    await handleApiCall(
      'competitionSeasons',
      () => apiInstance.getCompetitionSeasons(competitionId),
      setSeasons,
      { competitionId }
    );
  }, [apiInstance, handleApiCall]);

  const loadLiveMatches = useCallback(async (autoRefresh = false) => {
    await handleApiCall(
      'liveMatches',
      () => apiInstance.getLiveSchedules(),
      setLiveMatches,
      null,
      autoRefresh ? 10000 : undefined // 10 sec TTL for live data
    );
  }, [apiInstance, handleApiCall]);

  const loadDailyMatches = useCallback(async (date: string) => {
    await handleApiCall(
      'dailyMatches',
      () => apiInstance.getDailySchedules(date),
      setDailyMatches,
      { date }
    );
  }, [apiInstance, handleApiCall]);

  const loadMatchSummaries = useCallback(async (date: string) => {
    await handleApiCall(
      'matchSummaries',
      () => apiInstance.getDailySummaries(date),
      setMatchSummaries,
      { date }
    );
  }, [apiInstance, handleApiCall]);

  const loadSeasonStandings = useCallback(async (seasonId: string) => {
    await handleApiCall(
      'standings',
      () => apiInstance.getSeasonStandings(seasonId),
      setStandings,
      { seasonId }
    );
  }, [apiInstance, handleApiCall]);

  // Utility actions
  const clearCache = useCallback((key?: string) => {
    if (key) {
      cacheRef.current.delete(key);
    } else {
      cacheRef.current.clear();
    }
  }, []);

  const clearError = useCallback((key?: string) => {
    const clearErrorForState = (setState: React.Dispatch<React.SetStateAction<UseApiState<any>>>) => {
      setState(prev => ({ ...prev, error: null, status: prev.status === 'error' ? 'idle' : prev.status }));
    };

    if (!key) {
      clearErrorForState(setCompetitions);
      clearErrorForState(setSeasons);
      clearErrorForState(setLiveMatches);
      clearErrorForState(setDailyMatches);
      clearErrorForState(setMatchSummaries);
      clearErrorForState(setStandings);
    } else {
      // Specific error clearing based on key
      switch (key) {
        case 'competitions': clearErrorForState(setCompetitions); break;
        case 'seasons': clearErrorForState(setSeasons); break;
        case 'liveMatches': clearErrorForState(setLiveMatches); break;
        case 'dailyMatches': clearErrorForState(setDailyMatches); break;
        case 'matchSummaries': clearErrorForState(setMatchSummaries); break;
        case 'standings': clearErrorForState(setStandings); break;
      }
    }
  }, []);

  const retryLastFailed = useCallback(async () => {
    const failedOperations = retryQueueRef.current.splice(0);
    await Promise.allSettled(failedOperations.map(op => op()));
  }, []);

  // Auto-refresh effect élő adatokhoz
  useEffect(() => {
    if (liveMatches.data.length > 0 && finalConfig.autoRefreshInterval) {
      intervalRef.current = setInterval(() => {
        loadLiveMatches(true);
      }, finalConfig.autoRefreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [liveMatches.data.length, finalConfig.autoRefreshInterval, loadLiveMatches]);

  // Cache statistikák számítása
  const cacheStats = useMemo(() => {
    const { hits, misses } = cacheStatsRef.current;
    const total = hits + misses;
    return {
      size: cacheRef.current.size,
      hitRate: total > 0 ? Math.round((hits / total) * 100) : 0,
      missRate: total > 0 ? Math.round((misses / total) * 100) : 0,
    };
  }, [competitions.lastFetch, seasons.lastFetch, liveMatches.lastFetch]); // Dependencies to trigger recalculation

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // Connection state
    isConnected,
    apiKey,
    globalLoading,
    
    // Data states
    competitions,
    seasons,
    liveMatches,
    dailyMatches,
    matchSummaries,
    standings,
    
    // Selected items
    selectedCompetition,
    selectedSeason,
    
    // Actions
    setApiKey,
    loadCompetitions,
    loadCompetitionSeasons,
    loadLiveMatches,
    loadDailyMatches,
    loadMatchSummaries,
    loadSeasonStandings,
    setSelectedCompetition,
    setSelectedSeason,
    
    // Utility actions
    clearCache,
    clearError,
    retryLastFailed,
    
    // Statistics
    cacheStats,
  };
}
