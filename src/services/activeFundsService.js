// src/services/activeFundsService.js
// Service for managing active funds in MongoDB

import { getCollection } from '../lib/mongodb';
import axios from 'axios';

const COLLECTION_NAME = 'activeFunds';

/**
 * Check if a fund's latest NAV is within the last 5 days
 * Returns { isActive: boolean, latestNavDate: Date|null }
 */
async function checkFundNAVStatus(schemeCode) {
  try {
    const response = await axios.get(`https://api.mfapi.in/mf/${schemeCode}`, {
      timeout: 10000,
    });
    
    const fundData = response.data;
    if (!fundData || !fundData.data || fundData.data.length === 0) {
      return { isActive: false, latestNavDate: null };
    }

    // Get the latest NAV date (first item in the array)
    const latestNavDate = new Date(fundData.data[0].date);
    const currentDate = new Date();
    
    // Calculate difference in days
    const diffTime = Math.abs(currentDate - latestNavDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Return true if NAV is within last 5 days
    return { 
      isActive: diffDays <= 5, 
      latestNavDate: latestNavDate 
    };
  } catch (error) {
    // If we can't fetch NAV data, consider it inactive
    return { isActive: false, latestNavDate: null };
  }
}

/**
 * Fetch all active funds from external API
 * A fund is considered active if its latest NAV is within 5 days
 */
export async function fetchActiveFundsFromAPI() {
  try {
    const response = await axios.get("https://api.mfapi.in/mf", { 
      timeout: 60000, // Increased to 60 seconds
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    const allFunds = response.data || [];

    console.log(`📊 Checking ${allFunds.length} funds for active NAV data...`);

    // Check NAV dates for all funds (with concurrency limit to avoid overwhelming the API)
    const activeFunds = [];
    const batchSize = 100; // Process 100 funds at a time
    
    for (let i = 0; i < allFunds.length; i += batchSize) {
      const batch = allFunds.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(async (fund) => {
          const navStatus = await checkFundNAVStatus(fund.schemeCode);
          return { 
            fund: {
              ...fund,
              latestNavDate: navStatus.latestNavDate
            }, 
            isActive: navStatus.isActive 
          };
        })
      );

      // Collect active funds from this batch
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.isActive) {
          activeFunds.push(result.value.fund);
        }
      });

      console.log(`✅ Processed ${Math.min(i + batchSize, allFunds.length)}/${allFunds.length} funds (${activeFunds.length} active so far)`);
    }

    console.log(`🎯 Found ${activeFunds.length} active funds out of ${allFunds.length}`);

    return {
      success: true,
      activeFunds,
      totalActive: activeFunds.length,
      totalAll: allFunds.length,
    };
  } catch (error) {
    console.error('Error fetching active funds from API:', error);
    return {
      success: false,
      error: error.message,
      activeFunds: [],
    };
  }
}

/**
 * Sync active funds to MongoDB
 * This will upsert all active funds and mark inactive ones
 */
export async function syncActiveFundsToMongoDB() {
  try {
    const collection = await getCollection(COLLECTION_NAME);
    
    // Fetch active funds from API
    const { success, activeFunds, error } = await fetchActiveFundsFromAPI();
    
    if (!success) {
      throw new Error(error || 'Failed to fetch active funds');
    }

    // Get all scheme codes from active funds
    const activeSchemeCodes = activeFunds.map(f => f.schemeCode);

    // Mark all existing funds as inactive first
    await collection.updateMany(
      {},
      { 
        $set: { 
          isActive: false,
          lastChecked: new Date()
        }
      }
    );

    // Upsert active funds
    const bulkOps = activeFunds.map(fund => ({
      updateOne: {
        filter: { schemeCode: fund.schemeCode },
        update: {
          $set: {
            schemeCode: fund.schemeCode,
            schemeName: fund.schemeName,
            isinGrowth: fund.isinGrowth,
            isinDivReinvestment: fund.isinDivReinvestment,
            latestNavDate: fund.latestNavDate,
            isActive: true,
            lastUpdated: new Date(),
            lastChecked: new Date(),
          }
        },
        upsert: true
      }
    }));

    const result = await collection.bulkWrite(bulkOps);

    // Create indexes for better performance
    await collection.createIndex({ schemeCode: 1 }, { unique: true });
    await collection.createIndex({ isActive: 1 });
    await collection.createIndex({ schemeName: 'text' });
    await collection.createIndex({ lastUpdated: -1 });
    await collection.createIndex({ latestNavDate: -1 });

    return {
      success: true,
      totalSynced: activeFunds.length,
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount,
      timestamp: new Date(),
    };

  } catch (error) {
    console.error('Error syncing active funds to MongoDB:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get active funds from MongoDB with pagination and filters
 */
export async function getActiveFundsFromDB(options = {}) {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      category = '',
      sortBy = 'schemeName',
      sortOrder = 1,
    } = options;

    const collection = await getCollection(COLLECTION_NAME);

    // Build query
    const query = { isActive: true };

    // Add search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Add category filter
    if (category) {
      const categoryPatterns = {
        equity: /equity|growth|bluechip|large cap|mid cap|small cap/i,
        debt: /debt|bond|income|gilt|liquid/i,
        hybrid: /hybrid|balanced|aggressive|conservative|dynamic/i,
        index: /index|nifty|sensex/i,
      };

      if (categoryPatterns[category]) {
        query.schemeName = { $regex: categoryPatterns[category] };
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [funds, total] = await Promise.all([
      collection
        .find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ]);

    return {
      success: true,
      data: funds,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    };

  } catch (error) {
    console.error('Error getting active funds from DB:', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
}

/**
 * Get statistics about active/inactive funds
 */
export async function getActiveFundsStats() {
  try {
    const collection = await getCollection(COLLECTION_NAME);

    const [activeCount, inactiveCount, lastSync] = await Promise.all([
      collection.countDocuments({ isActive: true }),
      collection.countDocuments({ isActive: false }),
      collection.findOne({}, { sort: { lastUpdated: -1 }, projection: { lastUpdated: 1 } }),
    ]);

    const total = activeCount + inactiveCount;

    return {
      success: true,
      stats: {
        totalFunds: total,
        activeFunds: activeCount,
        inactiveFunds: inactiveCount,
        activePercentage: total > 0 ? ((activeCount / total) * 100).toFixed(2) : 0,
        lastSyncedAt: lastSync?.lastUpdated || null,
      }
    };

  } catch (error) {
    console.error('Error getting active funds stats:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get a single fund by scheme code
 */
export async function getFundBySchemeCode(schemeCode) {
  try {
    const collection = await getCollection(COLLECTION_NAME);
    const fund = await collection.findOne({ schemeCode: parseInt(schemeCode) });

    return {
      success: true,
      fund,
    };

  } catch (error) {
    console.error('Error getting fund by scheme code:', error);
    return {
      success: false,
      error: error.message,
      fund: null,
    };
  }
}
