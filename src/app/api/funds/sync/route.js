// src/app/api/funds/sync/route.js
import { NextResponse } from "next/server";
// Uncomment when MongoDB is set up:
import { syncActiveFundsToMongoDB, getActiveFundsStats } from "@/services/activeFundsService";

/**
 * POST /api/funds/sync
 * 
 * Syncs active funds from external API to MongoDB
 * This should be called periodically (e.g., daily via cron job)
 * 
 * Usage:
 * - Manual: Call this endpoint when you want to sync
 * - Automated: Set up a cron job to call this daily
 */
export async function POST(request) {
  try {
    // Optional: API key check (only if SYNC_API_KEY is set in environment)
    if (process.env.SYNC_API_KEY) {
      const apiKey = request.headers.get('x-api-key');
      if (apiKey !== process.env.SYNC_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('🔄 Starting active funds sync...');

    const result = await syncActiveFundsToMongoDB();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    console.log('✅ Active funds sync completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Active funds synced successfully',
      ...result,
    });

  } catch (error) {
    console.error('❌ Active funds sync failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync active funds',
        details: error?.message 
      }, 
      { status: 500 }
    );
  }
}

/**
 * GET /api/funds/sync
 * 
 * Get sync status and statistics
 */
export async function GET(request) {
  try {
    const stats = await getActiveFundsStats();
    
    if (!stats.success) {
      throw new Error(stats.error);
    }

    return NextResponse.json({
      success: true,
      ...stats.stats,
    });

  } catch (error) {
    console.error('Error getting sync stats:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get sync stats',
        details: error?.message 
      }, 
      { status: 500 }
    );
  }
}
