import { type NextRequest, NextResponse } from "next/server"

const SPORTRADAR_BASE_URL = "https://api.sportradar.com/soccer-extended/trial/v4"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey =
      searchParams.get("api_key") || process.env.SPORTRADAR_API_KEY || "pVjDZHDlwNvnHgzvAYFzZYu4ncRylXL80s5DL1KD"
    const seasonId = params.id

    const response = await fetch(`${SPORTRADAR_BASE_URL}/seasons/${seasonId}/competitors.json?api_key=${apiKey}`, {
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
      season_competitors: [
        { id: "sr:competitor:40", name: "Liverpool", country: "England", country_code: "ENG", abbreviation: "LIV" },
        {
          id: "sr:competitor:35",
          name: "Manchester City",
          country: "England",
          country_code: "ENG",
          abbreviation: "MCI",
        },
        { id: "sr:competitor:42", name: "Arsenal", country: "England", country_code: "ENG", abbreviation: "ARS" },
        { id: "sr:competitor:33", name: "Chelsea", country: "England", country_code: "ENG", abbreviation: "CHE" },
        { id: "sr:competitor:44", name: "Tottenham", country: "England", country_code: "ENG", abbreviation: "TOT" },
        { id: "sr:competitor:39", name: "Newcastle", country: "England", country_code: "ENG", abbreviation: "NEW" },
        { id: "sr:competitor:45", name: "Brighton", country: "England", country_code: "ENG", abbreviation: "BHA" },
        { id: "sr:competitor:41", name: "Aston Villa", country: "England", country_code: "ENG", abbreviation: "AVL" },
        { id: "sr:competitor:43", name: "West Ham", country: "England", country_code: "ENG", abbreviation: "WHU" },
        {
          id: "sr:competitor:46",
          name: "Crystal Palace",
          country: "England",
          country_code: "ENG",
          abbreviation: "CRY",
        },
      ],
    }

    return NextResponse.json(demoData)
  }
}
