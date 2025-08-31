import { type NextRequest, NextResponse } from "next/server"

const SPORTRADAR_BASE_URL = "https://api.sportradar.com/soccer-extended/trial/v4"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey =
      searchParams.get("api_key") || process.env.SPORTRADAR_API_KEY || "pVjDZHDlwNvnHgzvAYFzZYu4ncRylXL80s5DL1KD"
    const competitionId = params.id

    const response = await fetch(
      `${SPORTRADAR_BASE_URL}/competitions/${competitionId}/seasons.json?api_key=${apiKey}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Sportradar API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("API Proxy Error:", error)

    const demoData = {
      seasons: [
        {
          id: "sr:season:118689",
          name: "2024/25",
          start_date: "2024-08-16",
          end_date: "2025-05-25",
          year: "2024",
          competition_id: params.id,
        },
        {
          id: "sr:season:114317",
          name: "2023/24",
          start_date: "2023-08-18",
          end_date: "2024-05-19",
          year: "2023",
          competition_id: params.id,
        },
        {
          id: "sr:season:106581",
          name: "2022/23",
          start_date: "2022-08-05",
          end_date: "2023-05-28",
          year: "2022",
          competition_id: params.id,
        },
      ],
    }

    return NextResponse.json(demoData)
  }
}
