// src/app/components/scheme/SWPCalculator.js
"use client";

import { useState } from "react";

export default function SWPCalculator({ schemeCode }) {
  const [formData, setFormData] = useState({
    initialInvestment: "200000",
    amount: "5000",
    frequency: "monthly",
    from: "",
    to: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/scheme/${schemeCode}/swp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initialInvestment: parseFloat(formData.initialInvestment),
          amount: parseFloat(formData.amount),
          frequency: formData.frequency,
          from: formData.from,
          to: formData.to,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Enhanced error message with date range info
        let errorMsg = data.error || "Calculation failed";
        if (data.earliestNAVDate && data.latestNAVDate) {
          errorMsg += `\n\nAvailable NAV data range:\nFrom: ${data.earliestNAVDate}\nTo: ${data.latestNAVDate}`;
        }
        setError(errorMsg);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Calculate SWP Returns</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Initial Investment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Investment (₹)
              </label>
              <input
                type="number"
                name="initialInvestment"
                value={formData.initialInvestment}
                onChange={handleInputChange}
                min="1000"
                step="1000"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="200000"
              />
            </div>

            {/* Withdrawal Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount (₹)
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                min="100"
                step="100"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="5000"
              />
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date (SWP Start)
              </label>
              <input
                type="date"
                name="from"
                value={formData.from}
                onChange={handleInputChange}
                required
                placeholder="dd-mm-yyyy"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">When to start withdrawals</p>
            </div>

            {/* End Date */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Last Withdrawal)
              </label>
              <input
                type="date"
                name="to"
                value={formData.to}
                onChange={handleInputChange}
                required
                placeholder="dd-mm-yyyy"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">When to stop withdrawals</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Calculating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Calculate Returns
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-1">Error</h4>
              <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Initial Investment */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-gray-500 mb-1">Initial Investment</div>
              <div className="text-2xl font-bold text-gray-900">₹{result.initialInvestment.toLocaleString()}</div>
              <div className="text-xs text-gray-600 mt-1">{result.initialNavDate}</div>
            </div>

            {/* Total Withdrawn */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-gray-500 mb-1">Total Withdrawn</div>
              <div className="text-2xl font-bold text-gray-900">₹{result.totalWithdrawn.toLocaleString()}</div>
              <div className="text-xs text-gray-600 mt-1">
                {result.events.length} withdrawals completed
                {result.remainingUnits > 0 && (
                  <span className="text-green-600 font-semibold"> • Active</span>
                )}
                {result.remainingUnits <= 0 && (
                  <span className="text-red-600 font-semibold"> • Depleted</span>
                )}
              </div>
            </div>

            {/* Current Value */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-gray-500 mb-1">Current Value</div>
              <div className="text-2xl font-bold text-gray-900">₹{result.currentValue.toLocaleString()}</div>
              <div className="text-xs text-gray-600 mt-1">
                {result.remainingUnits > 0 ? (
                  <span>{result.remainingUnits.toFixed(3)} units remaining</span>
                ) : (
                  <span className="text-red-600 font-semibold">Investment exhausted</span>
                )}
              </div>
            </div>

            {/* Total Gain/Loss */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-gray-500 mb-1">Total Gain/Loss</div>
              <div className={`text-2xl font-bold ${result.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {result.totalGainLoss >= 0 ? '+' : ''}₹{Math.abs(result.totalGainLoss).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 mt-1">Net return</div>
            </div>
          </div>

          {/* Withdrawal Capacity Info */}
          {result.remainingUnits <= 0 && (
            <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-900 mb-1">Investment Depleted</h4>
                  <p className="text-sm text-orange-700">
                    Your investment was exhausted after <span className="font-bold">{result.events.length} withdrawals</span>. 
                    The last withdrawal may have been partial due to insufficient balance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sustainability Info */}
          {result.remainingUnits > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">SWP Status</h4>
                  <p className="text-sm text-blue-700">
                    Successfully completed <span className="font-bold">{result.events.length} withdrawals</span> with 
                    <span className="font-bold"> ₹{result.currentValue.toLocaleString()}</span> still remaining. 
                    Your investment can sustain more withdrawals beyond the selected period.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Withdrawal Events */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">Withdrawal History</h4>
              <button
                onClick={() => setShowAllEvents(!showAllEvents)}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                {showAllEvents ? 'Show Less' : `View All (${result.events.length})`}
              </button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(showAllEvents ? result.events : result.events.slice(0, 5)).map((event, index) => (
                <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">{event.date}</div>
                    <div className="text-xs text-gray-600">NAV: ₹{event.nav} | Units: {event.unitsSold}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">₹{event.amountReceived.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{event.remainingUnits.toFixed(2)} left</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
