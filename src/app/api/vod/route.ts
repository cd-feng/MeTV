import { NextRequest, NextResponse } from "next/server";
import { fetchVodData } from "@/lib/api";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  try {
    const data = await fetchVodData(params);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Proxy Error:", error);
    return NextResponse.json(
      { code: 500, msg: "Failed to fetch remote data", error: error.message },
      { status: 500 }
    );
  }
}
