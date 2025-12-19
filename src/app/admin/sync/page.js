"use client";

import { useState } from "react";
import Header from "@/app/components/Header";

export default function SyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [error, setError] = useState(null);

  // Fetch current stats
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/funds/active/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Sync active funds
  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const response = await fetch("/api/funds/active", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        setSyncResult(data);
        // Refresh stats after sync
        await fetchStats();
      } else {
        setError(data.error || "Sync failed");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Active Funds Sync
          </h1>
          <p className="text-gray-600 mb-8">
            Sync active funds from the external API to MongoDB. This will check each fund's latest NAV and store only those with NAV updated within the last 5 days.
          </p>

          {/* Stats Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Current Stats</h2>
              <button
                onClick={fetchStats}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Refresh Stats
              </button>
            </div>

            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 mb-1">Total Funds</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {stats.totalFunds.toLocaleString()}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 mb-1">Active Funds</div>
                  <div className="text-2xl font-bold text-green-900">
                    {stats.activeFunds.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Inactive Funds</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.inactiveFunds.toLocaleString()}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-600 mb-1">Active %</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {stats.activePercentage}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                Click "Refresh Stats" to load current database statistics
              </div>
            )}

            {stats?.lastSyncedAt && (
              <div className="mt-4 text-sm text-gray-600">
                Last synced: {new Date(stats.lastSyncedAt).toLocaleString()}
              </div>
            )}
          </div>

          {/* Sync Button */}
          <div className="mb-8">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3"
            >
              {syncing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Syncing... This may take several minutes
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Start Sync
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              ⚠️ Warning: This process checks NAV for all funds and may take 10-30 minutes
            </p>
          </div>

          {/* Sync Result */}
          {syncResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-bold text-green-900">Sync Completed Successfully!</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700">Total Synced:</span>
                  <span className="font-bold text-green-900 ml-2">{syncResult.totalSynced}</span>
                </div>
                <div>
                  <span className="text-green-700">New Funds:</span>
                  <span className="font-bold text-green-900 ml-2">{syncResult.upsertedCount}</span>
                </div>
                <div>
                  <span className="text-green-700">Updated Funds:</span>
                  <span className="font-bold text-green-900 ml-2">{syncResult.modifiedCount}</span>
                </div>
                <div>
                  <span className="text-green-700">Completed At:</span>
                  <span className="font-bold text-green-900 ml-2">
                    {new Date(syncResult.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-bold text-red-900">Sync Failed</h3>
              </div>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 mb-2">ℹ️ How it works:</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Fetches all funds from the external API</li>
              <li>• Checks each fund's latest NAV date</li>
              <li>• Stores only funds with NAV updated within the last 5 days</li>
              <li>• Marks older funds as inactive</li>
              <li>• Creates database indexes for fast queries</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
