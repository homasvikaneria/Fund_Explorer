// src/app/api/funds/active/route.js
import axios from "axios";
import { NextResponse } from "next/server";
// Uncomment when MongoDB is set up:
import { getActiveFundsFromDB, fetchActiveFundsFromAPI } from "@/services/activeFundsService";

/**
 * GET /api/funds/active
 * 
 * Fetches active mutual funds from MongoDB
 * Active funds are those with NAV updated within the last 5 days
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 500)
 * - search: Search query for fund name or AMC
 * - category: Filter by category (equity, debt, hybrid, index)
 * - sortBy: Field to sort by (default: schemeName)
 * - sortOrder: 1 for ascending, -1 for descending (default: 1)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.max(Math.min(parseInt(searchParams.get("limit") || "50", 10), 500), 1);
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.toLowerCase() || "";
    const sortBy = searchParams.get("sortBy") || "schemeName";
    const sortOrder = parseInt(searchParams.get("sortOrder") || "1", 10);

    // Fetch active funds from MongoDB
    const result = await getActiveFundsFromDB({
      page,
      limit,
      search,
      category,
      sortBy,
      sortOrder,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch from database");
    }

    // Response
    return NextResponse.json({
      success: true,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
      totalPages: result.totalPages,
      data: result.data,
      metadata: {
        source: "database",
        totalActiveFunds: result.total,
      }
    });

  } catch (error) {
    console.error("GET /api/funds/active error:", error?.message || error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch active funds",
        details: error?.message 
      }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/funds/active
 * 
 * Sync active funds to MongoDB
 * This fetches all funds from the API, checks their NAV status,
 * and updates the database with only truly active funds (NAV within 5 days)
 */
export async function POST(request) {
  try {
    console.log("🔄 Starting active funds sync to MongoDB...");

    // Import the sync service
    const { syncActiveFundsToMongoDB } = await import("@/services/activeFundsService");
    
    // Sync active funds to database
    const result = await syncActiveFundsToMongoDB();

    if (!result.success) {
      throw new Error(result.error || "Failed to sync active funds");
    }

    return NextResponse.json({
      success: true,
      message: "Active funds synced successfully",
      totalSynced: result.totalSynced,
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount,
      timestamp: result.timestamp,
    });

  } catch (error) {
    console.error("POST /api/funds/active error:", error?.message || error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to sync active funds",
        details: error?.message 
      }, 
      { status: 500 }
    );
  }
}
