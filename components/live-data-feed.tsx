"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, Zap, TrendingUp, Clock, Wifi, WifiOff } from "lucide-react"

interface LiveDataPoint {
  timestamp: Date
  type: "score" | "possession" | "shots" | "corners" | "cards"
  value: number
  matchId: string
  team?: string
}

interface LiveDataFeedProps {
  liveMatches: any[]
}

export function LiveDataFeed({ liveMatches }: LiveDataFeedProps) {
  const [isConnected, setIsConnected] = useState(true)
  const [dataPoints, setDataPoints] = useState<LiveDataPoint[]>([])
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Simulate live data feed
  useEffect(() => {
    if (!autoRefresh || liveMatches.length === 0) return

    const interval = setInterval(() => {
      // Simulate connection status
      setIsConnected(Math.random() > 0.1) // 90% uptime

      if (Math.random() < 0.4) {
        // 40% chance of new data
        const randomMatch = liveMatches[Math.floor(Math.random() * liveMatches.length)]
        const dataTypes = ["possession", "shots", "corners"] as const
        const dataType = dataTypes[Math.floor(Math.random() * dataTypes.length)]

        const newDataPoint: LiveDataPoint = {
          timestamp: new Date(),
          type: dataType,
          value: Math.floor(Math.random() * 100),
          matchId: randomMatch.id,
          team: randomMatch.competitors?.[Math.floor(Math.random() * 2)]?.name,
        }

        setDataPoints((prev) => [newDataPoint, ...prev.slice(0, 49)]) // Keep 50 most recent
        setLastUpdate(new Date())
      }
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, liveMatches])

  const filteredDataPoints = selectedMatch ? dataPoints.filter((dp) => dp.matchId === selectedMatch) : dataPoints

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case "possession":
        return "⚽"
      case "shots":
        return "🎯"
      case "corners":
        return "📐"
      case "cards":
        return "🟨"
      default:
        return "📊"
    }
  }

  const getDataTypeColor = (type: string) => {
    switch (type) {
      case "possession":
        return "bg-blue-100 text-blue-800"
      case "shots":
        return "bg-red-100 text-red-800"
      case "corners":
        return "bg-yellow-100 text-yellow-800"
      case "cards":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Live Data Feed</h3>
          <div className="flex items-center gap-1">
            {isConnected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
            <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`${autoRefresh ? "bg-green-50 border-green-200" : "bg-transparent"}`}
          >
            {autoRefresh ? <Activity className="w-4 h-4 mr-1" /> : <Clock className="w-4 h-4 mr-1" />}
            {autoRefresh ? "Live" : "Paused"}
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full ${autoRefresh && isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
          />
          {autoRefresh && isConnected ? "Streaming live data" : "Data stream paused"}
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {dataPoints.length} data points
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Last: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Match Filter */}
      {liveMatches.length > 0 && (
        <div>
          <label className="block text-sm font-semibold mb-2">Filter by Match</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedMatch === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMatch(null)}
              className={selectedMatch === null ? "" : "bg-transparent"}
            >
              All Matches
            </Button>
            {liveMatches.slice(0, 5).map((match) => (
              <Button
                key={match.id}
                variant={selectedMatch === match.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMatch(match.id)}
                className={selectedMatch === match.id ? "" : "bg-transparent text-xs"}
              >
                {match.competitors?.map((c: any) => c.name.slice(0, 3)).join(" v ") || "Match"}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Data Stream */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Real-time Data Stream
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredDataPoints.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No live data available</p>
                {!autoRefresh && <p className="text-xs">Enable live updates to see data stream</p>}
              </div>
            ) : (
              filteredDataPoints.map((dataPoint, index) => (
                <div
                  key={`${dataPoint.timestamp.getTime()}-${index}`}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={`text-xs ${getDataTypeColor(dataPoint.type)}`}>
                      {getDataTypeIcon(dataPoint.type)} {dataPoint.type}
                    </Badge>
                    <span className="font-semibold">{dataPoint.value}%</span>
                    {dataPoint.team && <span className="text-muted-foreground">({dataPoint.team})</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{dataPoint.timestamp.toLocaleTimeString()}</div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{dataPoints.filter((dp) => dp.type === "possession").length}</div>
            <div className="text-sm text-muted-foreground">Possession Updates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{dataPoints.filter((dp) => dp.type === "shots").length}</div>
            <div className="text-sm text-muted-foreground">Shot Updates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{dataPoints.filter((dp) => dp.type === "corners").length}</div>
            <div className="text-sm text-muted-foreground">Corner Updates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{liveMatches.length}</div>
            <div className="text-sm text-muted-foreground">Live Matches</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
