import { type NextRequest, NextResponse } from "next/server"

const SPORTRADAR_BASE_URL = "https://api.sportradar.com/soccer-extended/trial/v4"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey =
      searchParams.get("api_key") || process.env.SPORTRADAR_API_KEY || "pVjDZHDlwNvnHgzvAYFzZYu4ncRylXL80s5DL1KD"

    const response = await fetch(`${SPORTRADAR_BASE_URL}/competitions.json?api_key=${apiKey}`, {
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
      competitions: [
        {
          id: "sr:competition:17",
          name: "Premier League",
          category: { id: "sr:category:1", name: "England", country_code: "ENG" },
          type: "league",
          gender: "men",
        },
        {
          id: "sr:competition:8",
          name: "La Liga",
          category: { id: "sr:category:5", name: "Spain", country_code: "ESP" },
          type: "league",
          gender: "men",
        },
        {
          id: "sr:competition:35",
          name: "Bundesliga",
          category: { id: "sr:category:3", name: "Germany", country_code: "DEU" },
          type: "league",
          gender: "men",
        },
        {
          id: "sr:competition:23",
          name: "Serie A",
          category: { id: "sr:category:31", name: "Italy", country_code: "ITA" },
          type: "league",
          gender: "men",
        },
        {
          id: "sr:competition:34",
          name: "Ligue 1",
          category: { id: "sr:category:9", name: "France", country_code: "FRA" },
          type: "league",
          gender: "men",
        },
      ],
    }

    return NextResponse.json(demoData)
  }
}
