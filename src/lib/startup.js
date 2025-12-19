// src/lib/startup.js
// Auto-initialize cron jobs when server starts

import { initializeCronJobs } from './cronJobs';

// Auto-initialize cron jobs in production
if (process.env.NODE_ENV === 'production' || process.env.AUTO_INIT_CRON === 'true') {
  console.log('🚀 Auto-initializing cron jobs...');
  initializeCronJobs();
}

// For development, you can manually initialize by calling POST /api/cron/init
// or set AUTO_INIT_CRON=true in your .env.local file
