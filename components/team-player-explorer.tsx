"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Search, Users, User, Trophy, MapPin } from "lucide-react"
import { useSportradar } from "@/hooks/use-sportradar"
import { sportRadarAPI } from "@/lib/sportradar-api"
import type { Competitor, PlayerProfile, Season } from "@/lib/sportradar-api"

interface TeamCardProps {
  team: Competitor
  onViewDetails: (team: Competitor) => void
}

function TeamCard({ team, onViewDetails }: TeamCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => onViewDetails(team)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-lg font-bold">
              {team.abbreviation || team.name.slice(0, 3).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-lg">{team.name}</CardTitle>
              {team.country && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {team.country}
                </p>
              )}
            </div>
          </div>
          {team.country_code && <Badge variant="outline">{team.country_code}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" className="w-full bg-transparent">
          View Team Details
        </Button>
      </CardContent>
    </Card>
  )
}

interface PlayerCardProps {
  player: PlayerProfile
  onViewDetails: (player: PlayerProfile) => void
}

function PlayerCard({ player, onViewDetails }: PlayerCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => onViewDetails(player)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center text-sm font-bold">
              {player.jersey_number || player.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-base">{player.name}</CardTitle>
              {player.position && <p className="text-sm text-muted-foreground">{player.position}</p>}
            </div>
          </div>
          {player.nationality && (
            <Badge variant="outline" className="text-xs">
              {player.country_code}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {player.date_of_birth && (
            <div>Age: {new Date().getFullYear() - new Date(player.date_of_birth).getFullYear()}</div>
          )}
          {player.height && <div>Height: {player.height}cm</div>}
        </div>
      </CardContent>
    </Card>
  )
}

interface TeamDetailsModalProps {
  team: Competitor | null
  onClose: () => void
}

function TeamDetailsModal({ team, onClose }: TeamDetailsModalProps) {
  const [profile, setProfile] = useState<any>(null)
  const [schedule, setSchedule] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (team) {
      loadTeamDetails()
    }
  }, [team])

  const loadTeamDetails = async () => {
    if (!team) return

    setLoading(true)
    try {
      const [profileData, scheduleData] = await Promise.allSettled([
        sportRadarAPI.getCompetitorProfile(team.id),
        sportRadarAPI.getCompetitorSchedules(team.id),
      ])

      if (profileData.status === "fulfilled") {
        setProfile(profileData.value)
      }
      if (scheduleData.status === "fulfilled") {
        setSchedule(scheduleData.value)
      }
    } catch (error) {
      console.error("Error loading team details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!team) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-lg font-bold">
                {team.abbreviation || team.name.slice(0, 3).toUpperCase()}
              </div>
              {team.name}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading team details...
            </div>
          )}

          {/* Team Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-muted-foreground text-sm">Country</div>
              <div className="font-semibold">{team.country || "N/A"}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-sm">Abbreviation</div>
              <div className="font-semibold">{team.abbreviation || "N/A"}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-sm">Qualifier</div>
              <div className="font-semibold">{team.qualifier || "N/A"}</div>
            </div>
          </div>

          {/* Team Profile Details */}
          {profile && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Team Profile</h3>

              {profile.competitor?.venue && (
                <div>
                  <h4 className="font-semibold mb-2">Home Venue</h4>
                  <div className="bg-muted/50 p-3 rounded">
                    <div className="font-semibold">{profile.competitor.venue.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {profile.competitor.venue.city_name}, {profile.competitor.venue.country_name}
                    </div>
                    {profile.competitor.venue.capacity && (
                      <div className="text-sm text-muted-foreground">
                        Capacity: {profile.competitor.venue.capacity.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {profile.competitor?.manager && (
                <div>
                  <h4 className="font-semibold mb-2">Manager</h4>
                  <div className="bg-muted/50 p-3 rounded">
                    <div className="font-semibold">{profile.competitor.manager.name}</div>
                    {profile.competitor.manager.nationality && (
                      <div className="text-sm text-muted-foreground">
                        Nationality: {profile.competitor.manager.nationality}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {profile.competitor?.players && (
                <div>
                  <h4 className="font-semibold mb-2">Squad ({profile.competitor.players.length} players)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {profile.competitor.players.slice(0, 20).map((player: any) => (
                      <div key={player.id} className="bg-muted/50 p-2 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {player.jersey_number || "?"}
                          </Badge>
                          <span className="font-semibold">{player.name}</span>
                        </div>
                        {player.type && <div className="text-xs text-muted-foreground">{player.type}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Matches */}
          {schedule?.results && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Matches</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {schedule.results.slice(0, 10).map((match: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="text-sm">{new Date(match.sport_event.start_time).toLocaleDateString()}</div>
                      <div className="text-sm font-semibold">
                        {match.sport_event.competitors.map((c: any) => c.name).join(" vs ")}
                      </div>
                    </div>
                    {match.sport_event_status && (
                      <Badge variant="outline">
                        {match.sport_event_status.home_score} - {match.sport_event_status.away_score}
                      </Badge>
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

interface PlayerDetailsModalProps {
  player: PlayerProfile | null
  onClose: () => void
}

function PlayerDetailsModal({ player, onClose }: PlayerDetailsModalProps) {
  const [profile, setProfile] = useState<any>(null)
  const [schedule, setSchedule] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (player) {
      loadPlayerDetails()
    }
  }, [player])

  const loadPlayerDetails = async () => {
    if (!player) return

    setLoading(true)
    try {
      const [profileData, scheduleData] = await Promise.allSettled([
        sportRadarAPI.getPlayerProfile(player.id),
        sportRadarAPI.getPlayerSchedules(player.id),
      ])

      if (profileData.status === "fulfilled") {
        setProfile(profileData.value)
      }
      if (scheduleData.status === "fulfilled") {
        setSchedule(scheduleData.value)
      }
    } catch (error) {
      console.error("Error loading player details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!player) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-lg font-bold">
                {player.jersey_number || player.name.slice(0, 2).toUpperCase()}
              </div>
              {player.name}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading player details...
            </div>
          )}

          {/* Player Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-muted-foreground text-sm">Position</div>
              <div className="font-semibold">{player.position || "N/A"}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-sm">Jersey Number</div>
              <div className="font-semibold">{player.jersey_number || "N/A"}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-sm">Age</div>
              <div className="font-semibold">
                {player.date_of_birth ? new Date().getFullYear() - new Date(player.date_of_birth).getFullYear() : "N/A"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-sm">Nationality</div>
              <div className="font-semibold">{player.nationality || "N/A"}</div>
            </div>
            {player.height && (
              <div className="text-center">
                <div className="text-muted-foreground text-sm">Height</div>
                <div className="font-semibold">{player.height}cm</div>
              </div>
            )}
            {player.weight && (
              <div className="text-center">
                <div className="text-muted-foreground text-sm">Weight</div>
                <div className="font-semibold">{player.weight}kg</div>
              </div>
            )}
          </div>

          {/* Player Profile Details */}
          {profile?.player && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Player Profile</h3>

              <div className="bg-muted/50 p-4 rounded">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Full Name:</span>
                    <div className="font-semibold">{profile.player.full_name || player.name}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <div className="font-semibold">{profile.player.type || "N/A"}</div>
                  </div>
                  {profile.player.date_of_birth && (
                    <div>
                      <span className="text-muted-foreground">Date of Birth:</span>
                      <div className="font-semibold">{new Date(profile.player.date_of_birth).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent Matches */}
          {schedule?.results && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Matches</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {schedule.results.slice(0, 10).map((match: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div className="flex items-center gap-3">
                      <div className="text-sm">{new Date(match.sport_event.start_time).toLocaleDateString()}</div>
                      <div className="text-sm font-semibold">
                        {match.sport_event.competitors.map((c: any) => c.name).join(" vs ")}
                      </div>
                    </div>
                    {match.sport_event_status && (
                      <Badge variant="outline">
                        {match.sport_event_status.home_score} - {match.sport_event_status.away_score}
                      </Badge>
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

export function TeamPlayerExplorer() {
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

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null)
  const [teams, setTeams] = useState<Competitor[]>([])
  const [players, setPlayers] = useState<PlayerProfile[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Competitor | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [loadingPlayers, setLoadingPlayers] = useState(false)

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

  // Load teams when season changes
  useEffect(() => {
    if (selectedSeason) {
      loadSeasonTeams()
    }
  }, [selectedSeason])

  const loadSeasonTeams = async () => {
    if (!selectedSeason) return

    setLoadingTeams(true)
    try {
      const response = await sportRadarAPI.getSeasonCompetitors(selectedSeason.id)
      setTeams(response.season_competitors || [])
    } catch (error) {
      console.error("Error loading teams:", error)
    } finally {
      setLoadingTeams(false)
    }
  }

  const loadSeasonPlayers = async () => {
    if (!selectedSeason) return

    setLoadingPlayers(true)
    try {
      // This would require a different endpoint - for now we'll show a placeholder
      setPlayers([])
    } catch (error) {
      console.error("Error loading players:", error)
    } finally {
      setLoadingPlayers(false)
    }
  }

  const handleCompetitionChange = (competitionId: string) => {
    const competition = competitions.find((c) => c.id === competitionId)
    setSelectedCompetition(competition || null)
    setSelectedSeason(null)
    setTeams([])
    setPlayers([])
  }

  const handleSeasonChange = (seasonId: string) => {
    const season = seasons.find((s) => s.id === seasonId)
    setSelectedSeason(season || null)
  }

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.country && team.country.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const filteredPlayers = players.filter(
    (player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.position && player.position.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Team & Player Explorer</h2>
        <p className="text-muted-foreground">Explore teams, players, and detailed profiles</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search teams or players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="border-destructive/50 text-destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="teams" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Teams ({filteredTeams.length})
          </TabsTrigger>
          <TabsTrigger value="players" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Players ({filteredPlayers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          {!selectedSeason ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a competition and season to view teams</p>
            </div>
          ) : loadingTeams ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading teams...
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No teams found</p>
              {searchTerm && <p className="text-sm">Try adjusting your search term</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeams.map((team) => (
                <TeamCard key={team.id} team={team} onViewDetails={setSelectedTeam} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <div className="text-center py-12 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Player data requires team-specific queries</p>
            <p className="text-sm">Select a team from the Teams tab to view its players</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <TeamDetailsModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />
      <PlayerDetailsModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </div>
  )
}
