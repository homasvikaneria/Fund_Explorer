// src/app/components/scheme/LumpsumCalculator.js
"use client";

import { useState } from "react";

export default function LumpsumCalculator({ schemeCode }) {
  const [formData, setFormData] = useState({
    investment: "10000",
    from: "",
    to: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/scheme/${schemeCode}/lumpsum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investment: parseFloat(formData.investment),
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
        <h3 className="text-lg font-bold text-gray-900 mb-6">Calculate Lumpsum Returns</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Investment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Amount (₹)
              </label>
              <input
                type="number"
                name="investment"
                value={formData.investment}
                onChange={handleInputChange}
                min="100"
                step="100"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="10000"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date (Investment Date)
              </label>
              <input
                type="date"
                name="from"
                value={formData.from}
                onChange={handleInputChange}
                required
                placeholder="dd-mm-yyyy"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">When you invest the lumpsum amount</p>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Redemption Date)
              </label>
              <input
                type="date"
                name="to"
                value={formData.to}
                onChange={handleInputChange}
                required
                placeholder="dd-mm-yyyy"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">When you redeem/check the value</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
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
              <div className="text-xs text-gray-600 mt-1">{result.startDate}</div>
            </div>

            {/* Current Value */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-gray-500 mb-1">Current Value</div>
              <div className="text-2xl font-bold text-gray-900">₹{result.currentValue.toLocaleString()}</div>
              <div className="text-xs text-gray-600 mt-1">{result.endDate}</div>
            </div>

            {/* Total Gain/Loss */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-gray-500 mb-1">Total Gain/Loss</div>
              <div className={`text-2xl font-bold ${result.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {result.totalGainLoss >= 0 ? '+' : ''}₹{Math.abs(result.totalGainLoss).toLocaleString()}
              </div>
              <div className={`text-xs font-semibold mt-1 ${result.simpleReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {result.simpleReturn >= 0 ? '+' : ''}{result.simpleReturn}% returns
              </div>
            </div>

            {/* Annualized Return */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-gray-500 mb-1">Annualized Return (CAGR)</div>
              <div className={`text-2xl font-bold ${result.annualizedReturn >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {result.annualizedReturn >= 0 ? '+' : ''}{result.annualizedReturn}%
              </div>
              <div className="text-xs text-gray-600 mt-1">Per annum</div>
            </div>
          </div>

          {/* Investment Details */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Investment Details</h4>
            <div className="grid grid-cols-2 gap-6">
              {/* NAV Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Purchase NAV</span>
                  <span className="text-sm font-semibold text-gray-900">₹{result.startNAV}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Current NAV</span>
                  <span className="text-sm font-semibold text-gray-900">₹{result.endNAV}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Units Purchased</span>
                  <span className="text-sm font-semibold text-gray-900">{result.unitsPurchased.toFixed(3)}</span>
                </div>
              </div>

              {/* Visual Breakdown */}
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {/* Invested Amount (Purple) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#9333ea"
                      strokeWidth="20"
                      strokeDasharray={`${(result.initialInvestment / result.currentValue) * 251.2} 251.2`}
                    />
                    {/* Gains (Green/Red) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={result.totalGainLoss >= 0 ? "#10b981" : "#ef4444"}
                      strokeWidth="20"
                      strokeDasharray={`${Math.abs(result.totalGainLoss) / result.currentValue * 251.2} 251.2`}
                      strokeDashoffset={`-${(result.initialInvestment / result.currentValue) * 251.2}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900">{result.simpleReturn}%</div>
                      <div className="text-xs text-gray-500">Return</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
