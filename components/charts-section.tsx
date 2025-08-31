"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Calendar, Target } from "lucide-react"

interface MatchData {
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

interface ChartsSectionProps {
  matchData: MatchData[]
}

export function ChartsSection({ matchData }: ChartsSectionProps) {
  // Process featured matches (Over 2.5 + BTTS)
  const featuredMatches = matchData
    .filter((match) => {
      const homeScore = match.sport_event_status.home_score || 0
      const awayScore = match.sport_event_status.away_score || 0
      const totalGoals = homeScore + awayScore
      const isOver25 = totalGoals > 2.5
      const isBTTS = homeScore > 0 && awayScore > 0
      return isOver25 && isBTTS && match.sport_event_status.match_status === "ended"
    })
    .map((match) => {
      const homeScore = match.sport_event_status.home_score || 0
      const awayScore = match.sport_event_status.away_score || 0
      const totalGoals = homeScore + awayScore
      const matchDate = new Date(match.sport_event.start_time)

      return {
        homeTeam: match.sport_event.competitors.find((c) => c.qualifier === "home")?.name || "Home",
        awayTeam: match.sport_event.competitors.find((c) => c.qualifier === "away")?.name || "Away",
        homeScore,
        awayScore,
        totalGoals,
        date: matchDate.toLocaleDateString("hu-HU"),
        matchDate,
      }
    })
    .sort((a, b) => {
      if (b.totalGoals !== a.totalGoals) {
        return b.totalGoals - a.totalGoals
      }
      return b.matchDate.getTime() - a.matchDate.getTime()
    })
    .slice(0, 12)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-5 h-5 text-chart-1" />
            Kiemelt mérkőzések (Over 2.5 + BTTS)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {featuredMatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nem találhatók mérkőzések, amelyek megfelelnek mindkét kritériumnak.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {featuredMatches.map((match, index) => (
                  <Card
                    key={index}
                    className="bg-gradient-to-br from-chart-1/10 to-chart-2/10 border-chart-1/20 hover:shadow-md transition-all duration-300"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="font-semibold text-sm text-foreground">
                          {match.homeTeam} vs {match.awayTeam}
                        </div>
                        <div className="text-2xl font-bold text-chart-1 text-center">
                          {match.homeScore} - {match.awayScore}
                        </div>
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {match.date}
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          <Badge variant="secondary" className="text-xs">
                            ⚽ {match.totalGoals} gól
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            ✅ Over 2.5
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            🤝 BTTS
                          </Badge>
                          {match.totalGoals >= 4 && <Badge className="text-xs bg-chart-4 text-white">🔥 High</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Összesen {featuredMatches.length} mérkőzés felelt meg mindkét kritériumnak (
                {((featuredMatches.length / matchData.length) * 100).toFixed(1)}%)
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
