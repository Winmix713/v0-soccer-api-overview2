import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Target, Trophy, Users, Zap } from "lucide-react"

interface Stats {
  avgGoals: number
  over25Percentage: number
  bttsPercentage: number
  totalMatches: number
  accuracy: number
  confidence: number
}

interface StatsGridProps {
  stats: Stats
}

export function StatsGrid({ stats }: StatsGridProps) {
  const statCards = [
    {
      title: "Átlag gól / meccs",
      value: stats.avgGoals.toFixed(2),
      icon: Target,
      color: "text-chart-1",
      trend: stats.avgGoals > 2.5 ? "up" : "down",
    },
    {
      title: "Over 2.5 arány",
      value: `${stats.over25Percentage.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-chart-3",
      trend: stats.over25Percentage > 50 ? "up" : "down",
    },
    {
      title: "BTTS arány",
      value: `${stats.bttsPercentage.toFixed(1)}%`,
      icon: Users,
      color: "text-chart-4",
      trend: stats.bttsPercentage > 45 ? "up" : "down",
    },
    {
      title: "Összes meccs",
      value: stats.totalMatches.toString(),
      icon: Trophy,
      color: "text-chart-2",
      trend: null,
    },
    {
      title: "Predikciós pontosság",
      value: `${stats.accuracy.toFixed(1)}%`,
      icon: Zap,
      color: "text-chart-5",
      trend: stats.accuracy > 80 ? "up" : "down",
    },
    {
      title: "Megbízhatóság",
      value: `${stats.confidence.toFixed(1)}%`,
      icon: Target,
      color: "text-secondary",
      trend: stats.confidence > 75 ? "up" : "down",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {stat.trend && (
                  <Badge variant={stat.trend === "up" ? "default" : "secondary"} className="text-xs">
                    {stat.trend === "up" ? (
                      <>
                        <TrendingUp className="w-3 h-3 mr-1" /> +{(Math.random() * 5).toFixed(1)}%
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-3 h-3 mr-1" /> -{(Math.random() * 5).toFixed(1)}%
                      </>
                    )}
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.title}</div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
