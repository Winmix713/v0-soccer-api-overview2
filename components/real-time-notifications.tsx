"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, X, Activity, Target, Clock, AlertCircle } from "lucide-react"

interface Notification {
  id: string
  type: "goal" | "card" | "match_start" | "match_end" | "status_change"
  title: string
  message: string
  timestamp: Date
  matchId?: string
  priority: "low" | "medium" | "high"
}

interface RealTimeNotificationsProps {
  liveMatches: any[]
  onNotificationClick?: (notification: Notification) => void
}

export function RealTimeNotifications({ liveMatches, onNotificationClick }: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isEnabled, setIsEnabled] = useState(true)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())

  // Simulate real-time notifications based on live matches
  useEffect(() => {
    if (!isEnabled || liveMatches.length === 0) return

    const interval = setInterval(() => {
      // Simulate random match events for demonstration
      if (Math.random() < 0.3) {
        // 30% chance of notification every 10 seconds
        const randomMatch = liveMatches[Math.floor(Math.random() * liveMatches.length)]
        const eventTypes = ["goal", "card", "status_change"] as const
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]

        const newNotification: Notification = {
          id: `${Date.now()}-${Math.random()}`,
          type: eventType,
          title: getNotificationTitle(eventType, randomMatch),
          message: getNotificationMessage(eventType, randomMatch),
          timestamp: new Date(),
          matchId: randomMatch.id,
          priority: eventType === "goal" ? "high" : "medium",
        }

        setNotifications((prev) => [newNotification, ...prev.slice(0, 9)]) // Keep only 10 most recent
        setLastUpdateTime(new Date())
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [isEnabled, liveMatches])

  const getNotificationTitle = (type: string, match: any) => {
    const homeTeam = match.competitors?.find((c: any) => c.qualifier === "home")?.name || "Home"
    const awayTeam = match.competitors?.find((c: any) => c.qualifier === "away")?.name || "Away"

    switch (type) {
      case "goal":
        return "⚽ GOAL!"
      case "card":
        return "🟨 Card Shown"
      case "status_change":
        return "📊 Match Update"
      default:
        return "🔔 Match Event"
    }
  }

  const getNotificationMessage = (type: string, match: any) => {
    const homeTeam = match.competitors?.find((c: any) => c.qualifier === "home")?.name || "Home"
    const awayTeam = match.competitors?.find((c: any) => c.qualifier === "away")?.name || "Away"

    switch (type) {
      case "goal":
        return `Goal scored in ${homeTeam} vs ${awayTeam}`
      case "card":
        return `Card shown in ${homeTeam} vs ${awayTeam}`
      case "status_change":
        return `Status update for ${homeTeam} vs ${awayTeam}`
      default:
        return `Event in ${homeTeam} vs ${awayTeam}`
    }
  }

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "goal":
        return <Target className="w-4 h-4" />
      case "card":
        return <AlertCircle className="w-4 h-4" />
      case "status_change":
        return <Activity className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500 bg-red-50/50"
      case "medium":
        return "border-l-yellow-500 bg-yellow-50/50"
      default:
        return "border-l-blue-500 bg-blue-50/50"
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Live Notifications</h3>
          <Badge variant="outline" className="text-xs">
            {notifications.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEnabled(!isEnabled)}
            className={`${isEnabled ? "bg-green-50 border-green-200" : "bg-transparent"}`}
          >
            {isEnabled ? "🔔 On" : "🔕 Off"}
          </Button>
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllNotifications} className="bg-transparent">
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${isEnabled ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
          {isEnabled ? "Live monitoring active" : "Notifications disabled"}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Last update: {lastUpdateTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent notifications</p>
            {!isEnabled && <p className="text-xs">Enable notifications to see live updates</p>}
          </div>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border-l-4 ${getPriorityColor(notification.priority)} cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => onNotificationClick?.(notification)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{notification.title}</div>
                      <div className="text-sm text-muted-foreground">{notification.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {notification.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearNotification(notification.id)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
