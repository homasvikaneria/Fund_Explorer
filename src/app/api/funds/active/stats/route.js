// src/app/api/funds/active/stats/route.js
import { NextResponse } from "next/server";
import { getActiveFundsStats } from "@/services/activeFundsService";

/**
 * GET /api/funds/active/stats
 * 
 * Get statistics about active/inactive funds in the database
 */
export async function GET(request) {
  try {
    const result = await getActiveFundsStats();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch stats");
    }

    return NextResponse.json({
      success: true,
      stats: result.stats,
    });

  } catch (error) {
    console.error("GET /api/funds/active/stats error:", error?.message || error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch active funds stats",
        details: error?.message 
      }, 
      { status: 500 }
    );
  }
}
