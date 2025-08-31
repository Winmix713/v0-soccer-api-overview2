"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Scale, TrendingUp } from "lucide-react"

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

interface TeamComparisonProps {
  teamStats: TeamStats
}

export function TeamComparison({ teamStats }: TeamComparisonProps) {
  const [team1Id, setTeam1Id] = useState("")
  const [team2Id, setTeam2Id] = useState("")
  const [comparison, setComparison] = useState<any>(null)

  const teams = Object.entries(teamStats).map(([id, stats]) => ({
    id,
    name: stats.name,
  }))

  const compareTeams = () => {
    if (!team1Id || !team2Id) {
      alert("Kérlek válassz mindkét csapatot az összehasonlításhoz!")
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

    setComparison({ team1Stats, team2Stats })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Scale className="w-5 h-5 text-chart-1" />
          Részletes Csapat Összehasonlítás
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Első csapat:</label>
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

          <div className="space-y-2">
            <label className="text-sm font-semibold">Második csapat:</label>
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
            onClick={compareTeams}
            disabled={!team1Id || !team2Id}
            className="bg-chart-1 hover:bg-chart-1/90 text-white px-8 py-2"
          >
            <Scale className="w-4 h-4 mr-2" />📊 Összehasonlítás
          </Button>
        </div>

        {comparison && (
          <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-chart-1/10 to-chart-2/10">
                <CardHeader>
                  <CardTitle className="text-center">{comparison.team1Stats.name}</CardTitle>
                  <div className="text-center text-2xl font-bold text-chart-1">
                    {comparison.team1Stats.matches} mérkőzés
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-chart-1">{comparison.team1Stats.goalsFor}</div>
                      <div className="text-sm text-muted-foreground">Rúgott gól</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-chart-2">{comparison.team1Stats.goalsAgainst}</div>
                      <div className="text-sm text-muted-foreground">Kapott gól</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-chart-3">
                        {comparison.team1Stats.avgGoalsFor.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Gól/meccs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-chart-4">
                        {comparison.team1Stats.over25Percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Over 2.5</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-chart-5">
                        {comparison.team1Stats.bttsPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">BTTS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-foreground">
                        {(comparison.team1Stats.goalsFor - comparison.team1Stats.goalsAgainst > 0 ? "+" : "") +
                          (comparison.team1Stats.goalsFor - comparison.team1Stats.goalsAgainst)}
                      </div>
                      <div className="text-sm text-muted-foreground">Gól különbség</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-chart-3/10 to-chart-4/10">
                <CardHeader>
                  <CardTitle className="text-center">{comparison.team2Stats.name}</CardTitle>
                  <div className="text-center text-2xl font-bold text-chart-1">
                    {comparison.team2Stats.matches} mérkőzés
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-chart-1">{comparison.team2Stats.goalsFor}</div>
                      <div className="text-sm text-muted-foreground">Rúgott gól</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-chart-2">{comparison.team2Stats.goalsAgainst}</div>
                      <div className="text-sm text-muted-foreground">Kapott gól</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-chart-3">
                        {comparison.team2Stats.avgGoalsFor.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Gól/meccs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-chart-4">
                        {comparison.team2Stats.over25Percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Over 2.5</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-chart-5">
                        {comparison.team2Stats.bttsPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">BTTS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-foreground">
                        {(comparison.team2Stats.goalsFor - comparison.team2Stats.goalsAgainst > 0 ? "+" : "") +
                          (comparison.team2Stats.goalsFor - comparison.team2Stats.goalsAgainst)}
                      </div>
                      <div className="text-sm text-muted-foreground">Gól különbség</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-lg font-bold text-chart-1">
                    {comparison.team1Stats.avgGoalsFor > comparison.team2Stats.avgGoalsFor
                      ? comparison.team1Stats.name.split(" ")[0]
                      : comparison.team2Stats.avgGoalsFor > comparison.team1Stats.avgGoalsFor
                        ? comparison.team2Stats.name.split(" ")[0]
                        : "Egyenlő"}
                  </div>
                  <div className="text-sm text-muted-foreground">Támadó erő</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Math.abs(comparison.team1Stats.avgGoalsFor - comparison.team2Stats.avgGoalsFor).toFixed(2)}{" "}
                    gól/meccs különbség
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-lg font-bold text-chart-2">
                    {comparison.team1Stats.avgGoalsAgainst < comparison.team2Stats.avgGoalsAgainst
                      ? comparison.team1Stats.name.split(" ")[0]
                      : comparison.team2Stats.avgGoalsAgainst < comparison.team1Stats.avgGoalsAgainst
                        ? comparison.team2Stats.name.split(" ")[0]
                        : "Egyenlő"}
                  </div>
                  <div className="text-sm text-muted-foreground">Védekezés</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Math.abs(comparison.team1Stats.avgGoalsAgainst - comparison.team2Stats.avgGoalsAgainst).toFixed(2)}{" "}
                    gól/meccs különbség
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-lg font-bold text-chart-3">
                    {comparison.team1Stats.over25Percentage > comparison.team2Stats.over25Percentage
                      ? comparison.team1Stats.name.split(" ")[0]
                      : comparison.team2Stats.over25Percentage > comparison.team1Stats.over25Percentage
                        ? comparison.team2Stats.name.split(" ")[0]
                        : "Egyenlő"}
                  </div>
                  <div className="text-sm text-muted-foreground">Over 2.5 hajlam</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Math.abs(comparison.team1Stats.over25Percentage - comparison.team2Stats.over25Percentage).toFixed(
                      1,
                    )}
                    % különbség
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-lg font-bold text-chart-4">
                    {comparison.team1Stats.bttsPercentage > comparison.team2Stats.bttsPercentage
                      ? comparison.team1Stats.name.split(" ")[0]
                      : comparison.team2Stats.bttsPercentage > comparison.team1Stats.bttsPercentage
                        ? comparison.team2Stats.name.split(" ")[0]
                        : "Egyenlő"}
                  </div>
                  <div className="text-sm text-muted-foreground">BTTS hajlam</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Math.abs(comparison.team1Stats.bttsPercentage - comparison.team2Stats.bttsPercentage).toFixed(1)}%
                    különbség
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-center flex items-center justify-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Head-to-Head Összehasonlítás
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-lg font-semibold">Predikció következő találkozóra:</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-chart-3">
                        {(
                          (comparison.team1Stats.over25Percentage + comparison.team2Stats.over25Percentage) /
                          2
                        ).toFixed(1)}
                        %
                      </div>
                      <div className="text-muted-foreground">Over 2.5 valószínűség</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-chart-4">
                        {((comparison.team1Stats.bttsPercentage + comparison.team2Stats.bttsPercentage) / 2).toFixed(1)}
                        %
                      </div>
                      <div className="text-muted-foreground">BTTS valószínűség</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-chart-1">
                        {(
                          (comparison.team1Stats.avgGoalsFor +
                            comparison.team2Stats.avgGoalsFor +
                            comparison.team1Stats.avgGoalsAgainst +
                            comparison.team2Stats.avgGoalsAgainst) /
                          2
                        ).toFixed(1)}
                      </div>
                      <div className="text-muted-foreground">Várható gólszám</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
