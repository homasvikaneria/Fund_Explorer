// src/lib/cronJobs.js
// Cron jobs for automated tasks

import cron from 'node-cron';
import { syncActiveFundsToMongoDB } from '@/services/activeFundsService';

let syncJobRunning = false;
let cronJobInstance = null;

/**
 * Initialize cron jobs
 * This should be called once when the server starts
 */
export function initializeCronJobs() {
  // Prevent multiple initializations
  if (cronJobInstance) {
    console.log('⚠️  Cron jobs already initialized');
    return;
  }

  // Schedule daily sync at 7:00 AM IST (1:30 AM UTC)
  // Cron format: second minute hour day month weekday
  // '0 7 * * *' = At 7:00 AM every day
  cronJobInstance = cron.schedule('0 7 * * *', async () => {
    if (syncJobRunning) {
      console.log('⏭️  Skipping sync - previous sync still running');
      return;
    }

    try {
      syncJobRunning = true;
      console.log('🔄 [CRON] Starting scheduled active funds sync at', new Date().toISOString());
      
      const result = await syncActiveFundsToMongoDB();
      
      if (result.success) {
        console.log('✅ [CRON] Sync completed successfully:', {
          totalSynced: result.totalSynced,
          upsertedCount: result.upsertedCount,
          modifiedCount: result.modifiedCount,
          timestamp: result.timestamp
        });
      } else {
        console.error('❌ [CRON] Sync failed:', result.error);
      }
    } catch (error) {
      console.error('❌ [CRON] Sync error:', error);
    } finally {
      syncJobRunning = false;
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // IST timezone
  });

  console.log('✅ Cron job initialized: Daily sync at 7:00 AM IST');
}

/**
 * Stop all cron jobs
 */
export function stopCronJobs() {
  if (cronJobInstance) {
    cronJobInstance.stop();
    cronJobInstance = null;
    console.log('🛑 Cron jobs stopped');
  }
}

/**
 * Get cron job status
 */
export function getCronJobStatus() {
  return {
    initialized: cronJobInstance !== null,
    running: syncJobRunning,
    schedule: '7:00 AM IST daily',
    timezone: 'Asia/Kolkata'
  };
}

/**
 * Manually trigger sync (for testing)
 */
export async function manualSync() {
  if (syncJobRunning) {
    return {
      success: false,
      error: 'Sync already in progress'
    };
  }

  try {
    syncJobRunning = true;
    console.log('🔄 [MANUAL] Starting manual sync at', new Date().toISOString());
    
    const result = await syncActiveFundsToMongoDB();
    
    if (result.success) {
      console.log('✅ [MANUAL] Sync completed successfully');
    }
    
    return result;
  } catch (error) {
    console.error('❌ [MANUAL] Sync error:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    syncJobRunning = false;
  }
}
