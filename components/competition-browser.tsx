"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Search, Trophy, Calendar, MapPin, BarChart3, Clock } from "lucide-react"
import { useSportradar } from "@/hooks/use-sportradar"
import { sportRadarAPI } from "@/lib/sportradar-api"
import type { Competition, Season, SportEvent } from "@/lib/sportradar-api"

interface CompetitionCardProps {
  competition: Competition
  onViewDetails: (competition: Competition) => void
}

function CompetitionCard({ competition, onViewDetails }: CompetitionCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => onViewDetails(competition)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-lg font-bold">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{competition.name}</CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {competition.category.name}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {competition.category.country_code && <Badge variant="outline">{competition.category.country_code}</Badge>}
            <Badge variant="secondary" className="text-xs">
              {competition.type}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <span>Gender: {competition.gender}</span>
          <span>Type: {competition.type}</span>
        </div>
        <Button variant="outline" size="sm" className="w-full bg-transparent">
          View Competition
        </Button>
      </CardContent>
    </Card>
  )
}

interface SeasonCardProps {
  season: Season
  onViewDetails: (season: Season) => void
}

function SeasonCard({ season, onViewDetails }: SeasonCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => onViewDetails(season)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center text-sm font-bold">
              {season.year}
            </div>
            <div>
              <CardTitle className="text-base">{season.name}</CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {season.year}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Start: {new Date(season.start_date).toLocaleDateString()}</div>
          <div>End: {new Date(season.end_date).toLocaleDateString()}</div>
        </div>
      </CardContent>
    </Card>
  )
}

interface CompetitionDetailsModalProps {
  competition: Competition | null
  onClose: () => void
}

function CompetitionDetailsModal({ competition, onClose }: CompetitionDetailsModalProps) {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null)
  const [standings, setStandings] = useState<any>(null)
  const [schedule, setSchedule] = useState<SportEvent[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (competition) {
      loadCompetitionData()
    }
  }, [competition])

  useEffect(() => {
    if (selectedSeason) {
      loadSeasonData()
    }
  }, [selectedSeason])

  const loadCompetitionData = async () => {
    if (!competition) return

    setLoading(true)
    try {
      const response = await sportRadarAPI.getCompetitionSeasons(competition.id)
      const seasonsList = response.seasons || []
      setSeasons(seasonsList)
      if (seasonsList.length > 0) {
        setSelectedSeason(seasonsList[0]) // Select most recent season
      }
    } catch (error) {
      console.error("Error loading competition data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadSeasonData = async () => {
    if (!selectedSeason) return

    setLoading(true)
    try {
      const [standingsData, scheduleData] = await Promise.allSettled([
        sportRadarAPI.getSeasonStandings(selectedSeason.id),
        sportRadarAPI.getSeasonSchedule(selectedSeason.id),
      ])

      if (standingsData.status === "fulfilled") {
        setStandings(standingsData.value)
      }
      if (scheduleData.status === "fulfilled") {
        setSchedule(scheduleData.value.sport_events || [])
      }
    } catch (error) {
      console.error("Error loading season data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!competition) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-3">
              <Trophy className="w-6 h-6" />
              {competition.name}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Competition Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-muted-foreground text-sm">Category</div>
              <div className="font-semibold">{competition.category.name}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-sm">Type</div>
              <div className="font-semibold">{competition.type}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-sm">Gender</div>
              <div className="font-semibold">{competition.gender}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-sm">Country</div>
              <div className="font-semibold">{competition.category.country_code || "International"}</div>
            </div>
          </div>

          {/* Season Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2">Season</label>
            <Select
              value={selectedSeason?.id || "defaultSeason"} // Updated default value
              onValueChange={(value) => {
                if (value === "defaultSeason") return // Updated default value
                const season = seasons.find((s) => s.id === value)
                setSelectedSeason(season || null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select season..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="defaultSeason" disabled>
                  Select season...
                </SelectItem>{" "}
                {/* Updated default value */}
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name} ({season.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading season data...
            </div>
          )}

          {selectedSeason && !loading && (
            <Tabs defaultValue="standings" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="standings">Standings</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="info">Season Info</TabsTrigger>
              </TabsList>

              <TabsContent value="standings" className="space-y-4">
                {standings?.standings ? (
                  <div className="space-y-4">
                    {standings.standings.map((group: any, groupIndex: number) => (
                      <div key={groupIndex}>
                        {group.name && <h4 className="font-semibold mb-2">{group.name}</h4>}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Pos</th>
                                <th className="text-left p-2">Team</th>
                                <th className="text-center p-2">P</th>
                                <th className="text-center p-2">W</th>
                                <th className="text-center p-2">D</th>
                                <th className="text-center p-2">L</th>
                                <th className="text-center p-2">GF</th>
                                <th className="text-center p-2">GA</th>
                                <th className="text-center p-2">GD</th>
                                <th className="text-center p-2">Pts</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.competitor_standings?.map((standing: any, index: number) => (
                                <tr key={standing.competitor.id} className="border-b hover:bg-muted/50">
                                  <td className="p-2 font-semibold">{standing.rank}</td>
                                  <td className="p-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold">
                                        {standing.competitor.abbreviation || standing.competitor.name.slice(0, 3)}
                                      </div>
                                      {standing.competitor.name}
                                    </div>
                                  </td>
                                  <td className="text-center p-2">{standing.played}</td>
                                  <td className="text-center p-2">{standing.win}</td>
                                  <td className="text-center p-2">{standing.draw}</td>
                                  <td className="text-center p-2">{standing.loss}</td>
                                  <td className="text-center p-2">{standing.goals_for}</td>
                                  <td className="text-center p-2">{standing.goals_against}</td>
                                  <td className="text-center p-2">{standing.goal_diff}</td>
                                  <td className="text-center p-2 font-semibold">{standing.points}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No standings data available</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                {schedule.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {schedule.slice(0, 50).map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-muted-foreground">
                            {new Date(match.start_time).toLocaleDateString()}
                          </div>
                          <div className="text-sm font-semibold">
                            {match.competitors.map((c) => c.name).join(" vs ")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {match.status}
                          </Badge>
                          {match.venue && <div className="text-xs text-muted-foreground">{match.venue.city_name}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No schedule data available</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Season Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-semibold">{selectedSeason.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Year:</span>
                        <span className="font-semibold">{selectedSeason.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start Date:</span>
                        <span className="font-semibold">
                          {new Date(selectedSeason.start_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End Date:</span>
                        <span className="font-semibold">{new Date(selectedSeason.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Competition Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID:</span>
                        <span className="font-semibold font-mono text-xs">{competition.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category ID:</span>
                        <span className="font-semibold font-mono text-xs">{competition.category.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Matches:</span>
                        <span className="font-semibold">{schedule.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function CompetitionBrowser() {
  const { loading, error, competitions, loadCompetitions } = useSportradar()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)

  // Load competitions on mount
  useEffect(() => {
    if (competitions.length === 0) {
      loadCompetitions()
    }
  }, [competitions.length, loadCompetitions])

  // Get unique categories and types for filtering
  const categories = Array.from(new Set(competitions.map((c) => c.category.name))).sort()
  const types = Array.from(new Set(competitions.map((c) => c.type))).sort()

  // Filter competitions
  const filteredCompetitions = competitions.filter((competition) => {
    const matchesSearch =
      competition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      competition.category.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = !selectedCategory || competition.category.name === selectedCategory
    const matchesType = !selectedType || competition.type === selectedType

    return matchesSearch && matchesCategory && matchesType
  })

  // Group competitions by category
  const groupedCompetitions = filteredCompetitions.reduce(
    (acc, competition) => {
      const category = competition.category.name
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(competition)
      return acc
    },
    {} as Record<string, Competition[]>,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Competition & Season Browser</h2>
          <p className="text-muted-foreground">Explore competitions, seasons, standings, and schedules</p>
        </div>

        <Button
          variant="outline"
          onClick={loadCompetitions}
          disabled={loading}
          className="flex items-center gap-2 bg-transparent"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
          Refresh Competitions
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search competitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Category</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Type</label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("")
              setSelectedCategory("")
              setSelectedType("")
            }}
            className="w-full bg-transparent"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="border-destructive/50 text-destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && competitions.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading competitions...
        </div>
      )}

      {/* Results Summary */}
      {!loading && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Showing {filteredCompetitions.length} of {competitions.length} competitions
          </span>
          <span>•</span>
          <span>{Object.keys(groupedCompetitions).length} categories</span>
        </div>
      )}

      {/* Competitions Grid */}
      {Object.keys(groupedCompetitions).length === 0 && !loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No competitions found</p>
          {(searchTerm || selectedCategory || selectedType) && <p className="text-sm">Try adjusting your filters</p>}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedCompetitions).map(([category, comps]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {category} ({comps.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comps.map((competition) => (
                  <CompetitionCard
                    key={competition.id}
                    competition={competition}
                    onViewDetails={setSelectedCompetition}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Competition Details Modal */}
      <CompetitionDetailsModal competition={selectedCompetition} onClose={() => setSelectedCompetition(null)} />
    </div>
  )
}
