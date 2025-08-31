"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, Clock, Users, Activity, Calendar } from "lucide-react"
import { useSportradar } from "@/hooks/use-sportradar"
import { sportRadarAPI, getTodayDate, getYesterdayDate, getTomorrowDate } from "@/lib/sportradar-api"
import type { SportEvent, MatchSummary } from "@/lib/sportradar-api"

interface LiveMatchCardProps {
  match: SportEvent
  summary?: MatchSummary
  onViewDetails: (match: SportEvent) => void
}

function LiveMatchCard({ match, summary, onViewDetails }: LiveMatchCardProps) {
  const homeTeam = match.competitors.find((c) => c.qualifier === "home")
  const awayTeam = match.competitors.find((c) => c.qualifier === "away")
  const matchTime = new Date(match.start_time)
  const isLive = match.status === "live"

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-accent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="destructive" className="animate-pulse">
                <Activity className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            )}
            <Badge variant="outline">{match.match_status || match.status}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {matchTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Teams and Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold">
                {homeTeam?.abbreviation || homeTeam?.name?.slice(0, 3).toUpperCase()}
              </div>
              <span className="font-semibold text-sm">{homeTeam?.name}</span>
            </div>
            <div className="text-2xl font-bold mx-4">{summary?.sport_event_status?.home_score ?? "-"}</div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center text-xs font-bold">
                {awayTeam?.abbreviation || awayTeam?.name?.slice(0, 3).toUpperCase()}
              </div>
              <span className="font-semibold text-sm">{awayTeam?.name}</span>
            </div>
            <div className="text-2xl font-bold mx-4">{summary?.sport_event_status?.away_score ?? "-"}</div>
          </div>
        </div>

        {/* Venue Info */}
        {match.venue && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {match.venue.name}, {match.venue.city_name}
          </div>
        )}

        {/* Action Button */}
        <Button variant="outline" size="sm" onClick={() => onViewDetails(match)} className="w-full bg-transparent">
          View Details
        </Button>
      </CardContent>
    </Card>
  )
}

interface MatchDetailsModalProps {
  match: SportEvent | null
  onClose: () => void
}

function MatchDetailsModal({ match, onClose }: MatchDetailsModalProps) {
  const [summary, setSummary] = useState<MatchSummary | null>(null)
  const [timeline, setTimeline] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (match) {
      loadMatchDetails()
    }
  }, [match])

  const loadMatchDetails = async () => {
    if (!match) return

    setLoading(true)
    try {
      const [summaryData, timelineData] = await Promise.allSettled([
        sportRadarAPI.getSportEventSummary(match.id),
        sportRadarAPI.getSportEventTimeline(match.id),
      ])

      if (summaryData.status === "fulfilled") {
        setSummary(summaryData.value)
      }
      if (timelineData.status === "fulfilled") {
        setTimeline(timelineData.value)
      }
    } catch (error) {
      console.error("Error loading match details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!match) return null

  const homeTeam = match.competitors.find((c) => c.qualifier === "home")
  const awayTeam = match.competitors.find((c) => c.qualifier === "away")

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Match Details</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading match details...
            </div>
          )}

          {/* Match Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-lg font-bold mb-2">
                  {homeTeam?.abbreviation || homeTeam?.name?.slice(0, 3).toUpperCase()}
                </div>
                <div className="font-semibold">{homeTeam?.name}</div>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {summary?.sport_event_status?.home_score ?? "-"} : {summary?.sport_event_status?.away_score ?? "-"}
                </div>
                <Badge variant={match.status === "live" ? "destructive" : "outline"}>
                  {match.status === "live" ? "LIVE" : match.match_status}
                </Badge>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center text-lg font-bold mb-2">
                  {awayTeam?.abbreviation || awayTeam?.name?.slice(0, 3).toUpperCase()}
                </div>
                <div className="font-semibold">{awayTeam?.name}</div>
              </div>
            </div>
          </div>

          {/* Match Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-muted-foreground">Kick-off</div>
              <div className="font-semibold">{new Date(match.start_time).toLocaleString()}</div>
            </div>
            {match.venue && (
              <div className="text-center">
                <div className="text-muted-foreground">Venue</div>
                <div className="font-semibold">
                  {match.venue.name}, {match.venue.city_name}
                </div>
              </div>
            )}
            <div className="text-center">
              <div className="text-muted-foreground">Status</div>
              <div className="font-semibold">{summary?.sport_event_status?.match_status || match.status}</div>
            </div>
          </div>

          {/* Statistics */}
          {summary?.statistics && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Match Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                {summary.statistics.totals.competitors.map((competitor, index) => (
                  <div key={competitor.id} className="space-y-2">
                    <h4 className="font-semibold text-center">{competitor.name}</h4>
                    <div className="space-y-1 text-sm">
                      {Object.entries(competitor.statistics).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace(/_/g, " ")}:</span>
                          <span className="font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Events */}
          {timeline?.timeline && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Match Timeline</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {timeline.timeline.map((event: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                    <Badge variant="outline" className="min-w-fit">
                      {event.match_time}'
                    </Badge>
                    <span className="text-sm">{event.type}</span>
                    {event.competitor && (
                      <span className="text-xs text-muted-foreground">({event.competitor.name})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function LiveMatchesDashboard() {
  const {
    loading,
    error,
    liveMatches,
    dailyMatches,
    matchSummaries,
    loadLiveMatches,
    loadDailyMatches,
    loadMatchSummaries,
  } = useSportradar()

  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [selectedMatch, setSelectedMatch] = useState<SportEvent | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto-refresh live matches every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadLiveMatches()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, loadLiveMatches])

  // Load daily matches when date changes
  useEffect(() => {
    loadDailyMatches(selectedDate)
    loadMatchSummaries(selectedDate)
  }, [selectedDate, loadDailyMatches, loadMatchSummaries])

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
  }

  const handleViewDetails = (match: SportEvent) => {
    setSelectedMatch(match)
  }

  const handleCloseDetails = () => {
    setSelectedMatch(null)
  }

  // Ensure arrays are defined with fallbacks
  const safeLiveMatches = Array.isArray(liveMatches) ? liveMatches : []
  const safeDailyMatches = Array.isArray(dailyMatches) ? dailyMatches : []
  const safeMatchSummaries = Array.isArray(matchSummaries) ? matchSummaries : []

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Matches Dashboard</h2>
          <p className="text-muted-foreground">Real-time soccer match data and statistics</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadLiveMatches} disabled={loading} className="bg-transparent">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "" : "bg-transparent"}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto-refresh
          </Button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex gap-2 items-center">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1">
          <Button
            variant={selectedDate === getYesterdayDate() ? "default" : "outline"}
            size="sm"
            onClick={() => handleDateChange(getYesterdayDate())}
            className={selectedDate === getYesterdayDate() ? "" : "bg-transparent"}
          >
            Yesterday
          </Button>
          <Button
            variant={selectedDate === getTodayDate() ? "default" : "outline"}
            size="sm"
            onClick={() => handleDateChange(getTodayDate())}
            className={selectedDate === getTodayDate() ? "" : "bg-transparent"}
          >
            Today
          </Button>
          <Button
            variant={selectedDate === getTomorrowDate() ? "default" : "outline"}
            size="sm"
            onClick={() => handleDateChange(getTomorrowDate())}
            className={selectedDate === getTomorrowDate() ? "" : "bg-transparent"}
          >
            Tomorrow
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="border-destructive/50 text-destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs for Live vs Daily Matches */}
      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Live Matches ({safeLiveMatches.length})
          </TabsTrigger>
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Daily Schedule ({safeDailyMatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          {loading && safeLiveMatches.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading live matches...
            </div>
          ) : safeLiveMatches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No live matches at the moment</p>
              <p className="text-sm">Check back later or view the daily schedule</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeLiveMatches.map((match) => {
                const summary = safeMatchSummaries.find((s) => s.sport_event.id === match.id)
                return (
                  <LiveMatchCard key={match.id} match={match} summary={summary} onViewDetails={handleViewDetails} />
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          {loading && safeDailyMatches.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading daily matches...
            </div>
          ) : safeDailyMatches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No matches scheduled for {selectedDate}</p>
              <p className="text-sm">Try selecting a different date</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeDailyMatches.map((match) => {
                const summary = safeMatchSummaries.find((s) => s.sport_event.id === match.id)
                return (
                  <LiveMatchCard key={match.id} match={match} summary={summary} onViewDetails={handleViewDetails} />
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Match Details Modal */}
      <MatchDetailsModal match={selectedMatch} onClose={handleCloseDetails} />
    </div>
  )
}
