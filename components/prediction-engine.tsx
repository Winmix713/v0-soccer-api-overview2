"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Target, AlertTriangle, CheckCircle } from "lucide-react"

interface TeamStats {
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

interface PredictionEngineProps {
  teamStats: TeamStats
}

export function PredictionEngine({ teamStats }: PredictionEngineProps) {
  const [team1Id, setTeam1Id] = useState("")
  const [team2Id, setTeam2Id] = useState("")
  const [prediction, setPrediction] = useState<any>(null)

  const teams = Object.entries(teamStats).map(([id, stats]) => ({
    id,
    name: stats.name,
  }))

  const makePrediction = () => {
    if (!team1Id || !team2Id) {
      alert("Kérlek válassz mindkét csapatot!")
      return
    }

    if (team1Id === team2Id) {
      alert("Kérlek válassz két különböző csapatot!")
      return
    }

    const team1Stats = teamStats[team1Id]
    const team2Stats = teamStats[team2Id]

    if (!team1Stats || !team2Stats) {
      alert("Nem találhatók statisztikák a kiválasztott csapatokhoz.")
      return
    }

    // Calculate prediction based on team statistics
    const avgGoalsPredicted =
      (team1Stats.avgGoalsFor + team2Stats.avgGoalsFor + team1Stats.avgGoalsAgainst + team2Stats.avgGoalsAgainst) / 2

    const over25Probability = (team1Stats.over25Percentage + team2Stats.over25Percentage) / 2
    const bttsProbability = (team1Stats.bttsPercentage + team2Stats.bttsPercentage) / 2

    // Combine probabilities for final prediction
    const combinedProbability = (over25Probability + bttsProbability) / 2

    let predictionClass, predictionText, recommendationText, icon

    if (combinedProbability >= 70) {
      predictionClass = "bg-gradient-to-r from-green-500 to-emerald-600"
      predictionText = "ERŐS AJÁNLÁS"
      recommendationText = "Mindkét piac (Over 2.5 + BTTS) erősen ajánlott"
      icon = CheckCircle
    } else if (combinedProbability >= 50) {
      predictionClass = "bg-gradient-to-r from-yellow-500 to-orange-500"
      predictionText = "KÖZEPES ESÉLY"
      recommendationText = "Megfontolásra érdemes, de óvatosan"
      icon = AlertTriangle
    } else {
      predictionClass = "bg-gradient-to-r from-gray-500 to-gray-600"
      predictionText = "ALACSONY ESÉLY"
      recommendationText = "Nem ajánlott fogadás"
      icon = AlertTriangle
    }

    setPrediction({
      team1Stats,
      team2Stats,
      avgGoalsPredicted,
      over25Probability,
      bttsProbability,
      combinedProbability,
      predictionClass,
      predictionText,
      recommendationText,
      icon,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Target className="w-5 h-5 text-chart-1" />
          AI Predikciós Motor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Hazai csapat:</label>
            <Select value={team1Id} onValueChange={setTeam1Id}>
              <SelectTrigger>
                <SelectValue placeholder="Válassz csapatot..." />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-center text-2xl font-bold text-muted-foreground">VS</div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Vendég csapat:</label>
            <Select value={team2Id} onValueChange={setTeam2Id}>
              <SelectTrigger>
                <SelectValue placeholder="Válassz csapatot..." />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={makePrediction}
            disabled={!team1Id || !team2Id}
            className="bg-chart-1 hover:bg-chart-1/90 text-white px-8 py-2"
          >
            <Target className="w-4 h-4 mr-2" />🔮 Predikció
          </Button>
        </div>

        {prediction && (
          <div className="space-y-6 animate-slide-up">
            <Card className={`${prediction.predictionClass} text-white`}>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <prediction.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{prediction.predictionText}</h3>
                <div className="text-lg mb-4">
                  {prediction.team1Stats.name} vs {prediction.team2Stats.name}
                </div>
                <div className="text-4xl font-bold mb-4">{prediction.combinedProbability.toFixed(1)}%</div>
                <p className="text-lg opacity-90">{prediction.recommendationText}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">{prediction.team1Stats.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-chart-1">
                        {prediction.team1Stats.avgGoalsFor.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Gól/meccs</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-chart-3">
                        {prediction.team1Stats.over25Percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Over 2.5</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-chart-4">
                        {prediction.team1Stats.bttsPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">BTTS</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-center">{prediction.team2Stats.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-chart-1">
                        {prediction.team2Stats.avgGoalsFor.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Gól/meccs</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-chart-3">
                        {prediction.team2Stats.over25Percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Over 2.5</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-chart-4">
                        {prediction.team2Stats.bttsPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">BTTS</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-xl font-bold text-chart-1">{prediction.avgGoalsPredicted.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Várható gólszám</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-xl font-bold text-chart-3">{prediction.over25Probability.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Over 2.5 valószínűség</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-xl font-bold text-chart-4">{prediction.bttsProbability.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">BTTS valószínűség</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-xl font-bold text-chart-2">
                    {(100 - prediction.combinedProbability).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Rizikó Index</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
