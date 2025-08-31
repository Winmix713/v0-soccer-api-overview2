import { type NextRequest, NextResponse } from "next/server"

const SPORTRADAR_BASE_URL = "https://api.sportradar.com/soccer-extended/trial/v4"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey =
      searchParams.get("api_key") || process.env.SPORTRADAR_API_KEY || "pVjDZHDlwNvnHgzvAYFzZYu4ncRylXL80s5DL1KD"
    const seasonId = params.id

    const response = await fetch(`${SPORTRADAR_BASE_URL}/seasons/${seasonId}/standings.json?api_key=${apiKey}`, {
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Sportradar API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("API Proxy Error:", error)

    const demoData = {
      standings: [
        {
          type: "total",
          groups: [
            {
              id: "sr:league:1",
              name: "Premier League",
              group_standings: [
                {
                  position: 1,
                  competitor: { id: "sr:competitor:40", name: "Liverpool" },
                  played: 15,
                  wins: 11,
                  draws: 3,
                  losses: 1,
                  goals_for: 35,
                  goals_against: 15,
                  goal_diff: 20,
                  points: 36,
                },
                {
                  position: 2,
                  competitor: { id: "sr:competitor:35", name: "Manchester City" },
                  played: 15,
                  wins: 10,
                  draws: 2,
                  losses: 3,
                  goals_for: 32,
                  goals_against: 18,
                  goal_diff: 14,
                  points: 32,
                },
                {
                  position: 3,
                  competitor: { id: "sr:competitor:42", name: "Arsenal" },
                  played: 15,
                  wins: 9,
                  draws: 4,
                  losses: 2,
                  goals_for: 28,
                  goals_against: 16,
                  goal_diff: 12,
                  points: 31,
                },
                {
                  position: 4,
                  competitor: { id: "sr:competitor:33", name: "Chelsea" },
                  played: 15,
                  wins: 8,
                  draws: 5,
                  losses: 2,
                  goals_for: 26,
                  goals_against: 17,
                  goal_diff: 9,
                  points: 29,
                },
                {
                  position: 5,
                  competitor: { id: "sr:competitor:44", name: "Tottenham" },
                  played: 15,
                  wins: 7,
                  draws: 3,
                  losses: 5,
                  goals_for: 24,
                  goals_against: 20,
                  goal_diff: 4,
                  points: 24,
                },
              ],
            },
          ],
        },
      ],
    }

    return NextResponse.json(demoData)
  }
}
