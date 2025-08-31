import { type NextRequest, NextResponse } from "next/server"

const SPORTRADAR_BASE_URL = "https://api.sportradar.com/soccer-extended/trial/v4"

export async function GET(request: NextRequest, { params }: { params: { date: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey =
      searchParams.get("api_key") || process.env.SPORTRADAR_API_KEY || "pVjDZHDlwNvnHgzvAYFzZYu4ncRylXL80s5DL1KD"
    const date = params.date

    const response = await fetch(`${SPORTRADAR_BASE_URL}/schedules/${date}/schedule.json?api_key=${apiKey}`, {
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

    const matchDate = new Date(params.date)
    const demoData = {
      sport_events: [
        {
          id: `sr:match:demo_${params.date}_1`,
          start_time: new Date(matchDate.getTime() + 15 * 60 * 60000).toISOString(), // 3 PM
          start_time_confirmed: true,
          competitors: [
            { id: "sr:competitor:44", name: "Tottenham", country: "England", country_code: "ENG", qualifier: "home" },
            { id: "sr:competitor:39", name: "Newcastle", country: "England", country_code: "ENG", qualifier: "away" },
          ],
          venue: {
            id: "sr:venue:1274",
            name: "Tottenham Hotspur Stadium",
            city_name: "London",
            country_name: "England",
          },
          status: "not_started",
          match_status: "not_started",
        },
        {
          id: `sr:match:demo_${params.date}_2`,
          start_time: new Date(matchDate.getTime() + 17.5 * 60 * 60000).toISOString(), // 5:30 PM
          start_time_confirmed: true,
          competitors: [
            { id: "sr:competitor:45", name: "Brighton", country: "England", country_code: "ENG", qualifier: "home" },
            { id: "sr:competitor:41", name: "Aston Villa", country: "England", country_code: "ENG", qualifier: "away" },
          ],
          venue: { id: "sr:venue:1275", name: "Amex Stadium", city_name: "Brighton", country_name: "England" },
          status: "not_started",
          match_status: "not_started",
        },
      ],
    }

    return NextResponse.json(demoData)
  }
}
