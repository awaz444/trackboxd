import { NextResponse } from "next/server";
import { searchAll } from "@/lib/search-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const trackLimit = Number(searchParams.get("trackLimit") || 2);
    const albumLimit = Number(searchParams.get("albumLimit") || 1);
    const playlistLimit = Number(searchParams.get("playlistLimit") || 1);
    const userLimit = Number(searchParams.get("userLimit") || 2);
    const market = searchParams.get("market") || undefined;

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const results = await searchAll(query, {
      trackLimit,
      albumLimit,
      playlistLimit,
      userLimit,
      market,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search-all API error:", error);
    return NextResponse.json(
      {
        error: "Failed to search",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
