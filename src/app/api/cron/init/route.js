// src/app/api/cron/init/route.js
import { NextResponse } from 'next/server';
import { initializeCronJobs, getCronJobStatus } from '@/lib/cronJobs';

/**
 * POST /api/cron/init
 * Initialize cron jobs for automated tasks
 * Call this once when deploying or starting the server
 */
export async function POST(request) {
  try {
    initializeCronJobs();
    const status = getCronJobStatus();
    
    return NextResponse.json({
      success: true,
      message: 'Cron jobs initialized successfully',
      status
    });
  } catch (error) {
    console.error('Error initializing cron jobs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize cron jobs',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/init
 * Get cron job status
 */
export async function GET(request) {
  try {
    const status = getCronJobStatus();
    
    return NextResponse.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting cron job status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get cron job status',
        details: error.message
      },
      { status: 500 }
    );
  }
}
