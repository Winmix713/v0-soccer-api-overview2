import { type NextRequest, NextResponse } from "next/server"

const SPORTRADAR_BASE_URL = "https://api.sportradar.com/soccer-extended/trial/v4"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey =
      searchParams.get("api_key") || process.env.SPORTRADAR_API_KEY || "pVjDZHDlwNvnHgzvAYFzZYu4ncRylXL80s5DL1KD"

    const response = await fetch(`${SPORTRADAR_BASE_URL}/schedules/live/schedule.json?api_key=${apiKey}`, {
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

    const now = new Date()
    const demoData = {
      sport_events: [
        {
          id: "sr:match:demo_live_1",
          start_time: new Date(now.getTime() - 45 * 60000).toISOString(), // Started 45 mins ago
          start_time_confirmed: true,
          competitors: [
            { id: "sr:competitor:40", name: "Liverpool", country: "England", country_code: "ENG", qualifier: "home" },
            {
              id: "sr:competitor:35",
              name: "Manchester City",
              country: "England",
              country_code: "ENG",
              qualifier: "away",
            },
          ],
          venue: { id: "sr:venue:1272", name: "Anfield", city_name: "Liverpool", country_name: "England" },
          status: "live",
          match_status: "1st_half",
        },
        {
          id: "sr:match:demo_live_2",
          start_time: new Date(now.getTime() - 20 * 60000).toISOString(), // Started 20 mins ago
          start_time_confirmed: true,
          competitors: [
            { id: "sr:competitor:42", name: "Arsenal", country: "England", country_code: "ENG", qualifier: "home" },
            { id: "sr:competitor:33", name: "Chelsea", country: "England", country_code: "ENG", qualifier: "away" },
          ],
          venue: { id: "sr:venue:1273", name: "Emirates Stadium", city_name: "London", country_name: "England" },
          status: "live",
          match_status: "1st_half",
        },
      ],
    }

    return NextResponse.json(demoData)
  }
}
