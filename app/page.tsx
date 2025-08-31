"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Trophy, Activity, Users, BarChart3, Bell, Zap } from "lucide-react"
import { useSportradar } from "@/hooks/use-sportradar"
import { LiveMatchesDashboard } from "@/components/live-matches-dashboard"
import { CompetitionBrowser } from "@/components/competition-browser"
import { TeamPlayerExplorer } from "@/components/team-player-explorer"
import { StatisticsHub } from "@/components/statistics-hub"
import { RealTimeNotifications } from "@/components/real-time-notifications"
import { LiveDataFeed } from "@/components/live-data-feed"
import { ApiKeyManager } from "@/components/api-key-manager"

export default function SportradarSoccerAPI() {
  const {
    loading,
    error,
    competitions,
    liveMatches,
    apiKey,
    isConnected,
    setApiKey,
    loadCompetitions,
    loadLiveMatches,
    clearError,
  } = useSportradar()

  const [activeTab, setActiveTab] = useState("live")
  const [showNotifications, setShowNotifications] = useState(false)
  const [showDataFeed, setShowDataFeed] = useState(false)

  useEffect(() => {
    loadCompetitions()
    loadLiveMatches()
  }, [loadCompetitions, loadLiveMatches])

  const handleNotificationClick = (notification: any) => {
    if (notification.matchId) {
      setActiveTab("live")
    }
  }

  const getConnectionStatusText = () => {
    if (!apiKey.trim()) return "Nincs API kulcs"
    if (isConnected) return "Kapcsolódva"
    return "Kapcsolódási hiba"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse-glow"></div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 relative z-10">⚽ Sportradar Soccer API Explorer</h1>
            <p className="text-lg md:text-xl opacity-90 relative z-10">
              Comprehensive Soccer Data Integration Platform
            </p>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm opacity-80">
              <span>🔴 Live Matches: {liveMatches.length}</span>
              <span>🏆 Competitions: {competitions.length}</span>
              <span>🔑 API: {getConnectionStatusText()}</span>
              <span>🔔 Real-time: Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 h-14">
              <TabsTrigger value="live" className="flex items-center gap-2 text-sm font-semibold">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Live Matches</span>
                <span className="sm:hidden">Live</span>
              </TabsTrigger>
              <TabsTrigger value="competitions" className="flex items-center gap-2 text-sm font-semibold">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Competitions</span>
                <span className="sm:hidden">Leagues</span>
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex items-center gap-2 text-sm font-semibold">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Teams & Players</span>
                <span className="sm:hidden">Teams</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Statistics</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2 text-sm font-semibold">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
                <span className="sm:hidden">Alerts</span>
              </TabsTrigger>
              <TabsTrigger value="datafeed" className="flex items-center gap-2 text-sm font-semibold">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Live Data</span>
                <span className="sm:hidden">Data</span>
              </TabsTrigger>
            </TabsList>

            {/* Quick Actions */}
            <div className="py-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadLiveMatches}
                disabled={loading}
                className="flex items-center gap-2 bg-transparent"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                Refresh Live
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadCompetitions}
                disabled={loading}
                className="flex items-center gap-2 bg-transparent"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                Reload Competitions
              </Button>
              <ApiKeyManager currentApiKey={apiKey} onApiKeyChange={setApiKey} isConnected={isConnected} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("notifications")}
                className="flex items-center gap-2 bg-transparent"
              >
                <Bell className="w-4 h-4" />
                Notifications
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("datafeed")}
                className="flex items-center gap-2 bg-transparent"
              >
                <Zap className="w-4 h-4" />
                Live Data
              </Button>
              {error && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearError}
                  className="text-destructive border-destructive hover:bg-destructive/10 bg-transparent"
                >
                  Clear Error
                </Button>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="mb-6 border-destructive/50 text-destructive">
                <AlertDescription className="flex items-center gap-2">
                  <span>❌</span>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Tab Contents */}
            <TabsContent value="live" className="space-y-6">
              <LiveMatchesDashboard />
            </TabsContent>

            <TabsContent value="competitions" className="space-y-6">
              <CompetitionBrowser />
            </TabsContent>

            <TabsContent value="teams" className="space-y-6">
              <TeamPlayerExplorer />
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <StatisticsHub />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <RealTimeNotifications liveMatches={liveMatches} onNotificationClick={handleNotificationClick} />
            </TabsContent>

            <TabsContent value="datafeed" className="space-y-6">
              <LiveDataFeed liveMatches={liveMatches} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
