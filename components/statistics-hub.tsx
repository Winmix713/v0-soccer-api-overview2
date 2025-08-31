"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, BarChart3, Trophy, Target, Users, TrendingUp, Award, Zap } from "lucide-react"
import { useSportradar } from "@/hooks/use-sportradar"
import { sportRadarAPI } from "@/lib/sportradar-api"
import type { Season } from "@/lib/sportradar-api"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
}

function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {trend && (
                <div
                  className={`text-xs ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-muted-foreground"}`}
                >
                  {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"}
                </div>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

interface LeaderboardProps {
  title: string
  data: Array<{
    rank: number
    name: string
    value: number
    subtitle?: string
  }>
  icon: React.ReactNode
}

function Leaderboard({ title, data, icon }: LeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 10).map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0
                      ? "bg-yellow-100 text-yellow-800"
                      : index === 1
                        ? "bg-gray-100 text-gray-800"
                        : index === 2
                          ? "bg-orange-100 text-orange-800"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.rank}
                </div>
                <div>
                  <div className="font-semibold text-sm">{item.name}</div>
                  {item.subtitle && <div className="text-xs text-muted-foreground">{item.subtitle}</div>}
                </div>
              </div>
              <Badge variant="outline" className="font-bold">
                {item.value}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface TeamStatsCardProps {
  team: any
  stats: any
}

function TeamStatsCard({ team, stats }: TeamStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold">
            {team.abbreviation || team.name.slice(0, 3).toUpperCase()}
          </div>
          {team.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Matches:</span>
              <span className="font-semibold">{stats.matches_played || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wins:</span>
              <span className="font-semibold text-green-600">{stats.wins || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Draws:</span>
              <span className="font-semibold text-yellow-600">{stats.draws || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Losses:</span>
              <span className="font-semibold text-red-600">{stats.losses || 0}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Goals For:</span>
              <span className="font-semibold">{stats.goals_for || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Goals Against:</span>
              <span className="font-semibold">{stats.goals_against || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Goal Diff:</span>
              <span
                className={`font-semibold ${(stats.goal_difference || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {stats.goal_difference >= 0 ? "+" : ""}
                {stats.goal_difference || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Points:</span>
              <span className="font-semibold text-primary">{stats.points || 0}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatisticsHub() {
  const {
    loading,
    error,
    competitions,
    seasons,
    selectedCompetition,
    loadCompetitions,
    loadCompetitionSeasons,
    setSelectedCompetition,
  } = useSportradar()

  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null)
  const [leaders, setLeaders] = useState<any>(null)
  const [standings, setStandings] = useState<any>(null)
  const [teamStats, setTeamStats] = useState<any[]>([])
  const [funFacts, setFunFacts] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(false)

  // Load competitions on mount
  useEffect(() => {
    if (competitions.length === 0) {
      loadCompetitions()
    }
  }, [competitions.length, loadCompetitions])

  // Load seasons when competition changes
  useEffect(() => {
    if (selectedCompetition) {
      loadCompetitionSeasons(selectedCompetition.id)
    }
  }, [selectedCompetition, loadCompetitionSeasons])

  // Load statistics when season changes
  useEffect(() => {
    if (selectedSeason) {
      loadSeasonStatistics()
    }
  }, [selectedSeason])

  const loadSeasonStatistics = async () => {
    if (!selectedSeason) return

    setLoadingStats(true)
    try {
      const [leadersData, standingsData] = await Promise.allSettled([
        sportRadarAPI.getSeasonLeaders(selectedSeason.id),
        sportRadarAPI.getSeasonStandings(selectedSeason.id),
      ])

      if (leadersData.status === "fulfilled") {
        setLeaders(leadersData.value)
      }
      if (standingsData.status === "fulfilled") {
        setStandings(standingsData.value)
        // Extract team stats from standings
        if (standingsData.value.standings?.[0]?.competitor_standings) {
          setTeamStats(standingsData.value.standings[0].competitor_standings)
        }
      }

      // Generate some mock fun facts for demonstration
      setFunFacts([
        { fact: "Highest scoring match had 7 goals", category: "Goals" },
        { fact: "Average goals per match: 2.4", category: "Goals" },
        { fact: "Most common result: 1-0", category: "Results" },
        { fact: "Home teams win 45% of matches", category: "Home Advantage" },
        { fact: "Most cards in a single match: 8", category: "Discipline" },
      ])
    } catch (error) {
      console.error("Error loading season statistics:", error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleCompetitionChange = (competitionId: string) => {
    const competition = competitions.find((c) => c.id === competitionId)
    setSelectedCompetition(competition || null)
    setSelectedSeason(null)
    setLeaders(null)
    setStandings(null)
    setTeamStats([])
  }

  const handleSeasonChange = (seasonId: string) => {
    const season = seasons.find((s) => s.id === seasonId)
    setSelectedSeason(season || null)
  }

  // Process leaders data for leaderboards
  const goalScorers =
    leaders?.leaders?.goal_scorers?.map((player: any, index: number) => ({
      rank: index + 1,
      name: player.player.name,
      value: player.goals,
      subtitle: player.competitor?.name,
    })) || []

  const assistProviders =
    leaders?.leaders?.assist_providers?.map((player: any, index: number) => ({
      rank: index + 1,
      name: player.player.name,
      value: player.assists,
      subtitle: player.competitor?.name,
    })) || []

  const cardReceivers =
    leaders?.leaders?.yellow_cards?.map((player: any, index: number) => ({
      rank: index + 1,
      name: player.player.name,
      value: player.yellow_cards,
      subtitle: player.competitor?.name,
    })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Statistics & Analytics Hub</h2>
          <p className="text-muted-foreground">Comprehensive statistical analysis and insights</p>
        </div>

        <Button
          variant="outline"
          onClick={loadCompetitions}
          disabled={loading}
          className="flex items-center gap-2 bg-transparent"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
          Refresh Data
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Competition</label>
          <Select value={selectedCompetition?.id || ""} onValueChange={handleCompetitionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select competition..." />
            </SelectTrigger>
            <SelectContent>
              {competitions.map((comp) => (
                <SelectItem key={comp.id} value={comp.id}>
                  {comp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Season</label>
          <Select value={selectedSeason?.id || ""} onValueChange={handleSeasonChange} disabled={!selectedCompetition}>
            <SelectTrigger>
              <SelectValue placeholder="Select season..." />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name} ({season.year})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="border-destructive/50 text-destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!selectedSeason ? (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a competition and season to view statistics</p>
        </div>
      ) : loadingStats ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading statistics...
        </div>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leaders">Leaders</TabsTrigger>
            <TabsTrigger value="teams">Team Stats</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Teams" value={teamStats.length} icon={<Users className="w-5 h-5" />} />
              <StatCard
                title="Matches Played"
                value={teamStats.reduce((sum, team) => sum + (team.played || 0), 0) / 2}
                icon={<Trophy className="w-5 h-5" />}
              />
              <StatCard
                title="Total Goals"
                value={teamStats.reduce((sum, team) => sum + (team.goals_for || 0), 0)}
                icon={<Target className="w-5 h-5" />}
              />
              <StatCard
                title="Avg Goals/Match"
                value={(
                  teamStats.reduce((sum, team) => sum + (team.goals_for || 0), 0) /
                  Math.max(teamStats.reduce((sum, team) => sum + (team.played || 0), 0) / 2, 1)
                ).toFixed(1)}
                icon={<TrendingUp className="w-5 h-5" />}
              />
            </div>

            {/* Top Teams */}
            {teamStats.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Top Performing Teams</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamStats.slice(0, 6).map((team, index) => (
                    <TeamStatsCard
                      key={team.competitor.id}
                      team={team.competitor}
                      stats={{
                        matches_played: team.played,
                        wins: team.win,
                        draws: team.draw,
                        losses: team.loss,
                        goals_for: team.goals_for,
                        goals_against: team.goals_against,
                        goal_difference: team.goal_diff,
                        points: team.points,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaders" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goalScorers.length > 0 && (
                <Leaderboard title="Top Goal Scorers" data={goalScorers} icon={<Target className="w-5 h-5" />} />
              )}

              {assistProviders.length > 0 && (
                <Leaderboard title="Top Assist Providers" data={assistProviders} icon={<Zap className="w-5 h-5" />} />
              )}

              {cardReceivers.length > 0 && (
                <Leaderboard title="Most Yellow Cards" data={cardReceivers} icon={<Award className="w-5 h-5" />} />
              )}
            </div>

            {goalScorers.length === 0 && assistProviders.length === 0 && cardReceivers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No leader statistics available for this season</p>
                <p className="text-sm">Data may not be available for all competitions</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            {teamStats.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-4">All Team Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamStats.map((team) => (
                    <TeamStatsCard
                      key={team.competitor.id}
                      team={team.competitor}
                      stats={{
                        matches_played: team.played,
                        wins: team.win,
                        draws: team.draw,
                        losses: team.loss,
                        goals_for: team.goals_for,
                        goals_against: team.goals_against,
                        goal_difference: team.goal_diff,
                        points: team.points,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No team statistics available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fun Facts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Fun Facts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {funFacts.map((fact, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded">
                        <div className="font-semibold text-sm">{fact.fact}</div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {fact.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Season Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Season Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedSeason && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Season:</span>
                          <span className="font-semibold">{selectedSeason.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Year:</span>
                          <span className="font-semibold">{selectedSeason.year}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-semibold">
                            {new Date(selectedSeason.start_date).toLocaleDateString()} -{" "}
                            {new Date(selectedSeason.end_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Teams:</span>
                          <span className="font-semibold">{teamStats.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Matches:</span>
                          <span className="font-semibold">
                            {teamStats.reduce((sum, team) => sum + (team.played || 0), 0) / 2}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Goals:</span>
                          <span className="font-semibold">
                            {teamStats.reduce((sum, team) => sum + (team.goals_for || 0), 0)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
