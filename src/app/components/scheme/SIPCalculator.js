// src/app/components/scheme/SIPCalculator.js
"use client";

import { useState } from "react";

export default function SIPCalculator({ schemeCode }) {
  const [formData, setFormData] = useState({
    amount: "5000",
    frequency: "monthly",
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
      const response = await fetch(`/api/scheme/${schemeCode}/sip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        if (data.schemeHistoryStart && data.schemeHistoryEnd) {
          errorMsg += `\n\nAvailable NAV data range:\nFrom: ${data.schemeHistoryStart}\nTo: ${data.schemeHistoryEnd}`;
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
        <h3 className="text-lg font-bold text-gray-900 mb-6">Calculate SIP Returns</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* SIP Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SIP Amount (₹)
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                min="100"
                step="100"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="halfyearly">Half-Yearly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date (SIP Start)
              </label>
              <input
                type="date"
                name="from"
                value={formData.from}
                onChange={handleInputChange}
                required
                placeholder="dd-mm-yyyy"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">When to start SIP investments</p>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Valuation Date)
              </label>
              <input
                type="date"
                name="to"
                value={formData.to}
                onChange={handleInputChange}
                required
                placeholder="dd-mm-yyyy"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">When to calculate final value</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            {/* Total Invested */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-gray-500 mb-1">Total Invested</div>
              <div className="text-2xl font-bold text-gray-900">₹{result.summary.totalInvested.toLocaleString()}</div>
              <div className="text-xs text-gray-600 mt-1">{result.meta.installments} installments</div>
            </div>

            {/* Current Value */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-gray-500 mb-1">Current Value</div>
              <div className="text-2xl font-bold text-gray-900">₹{result.summary.currentValue.toLocaleString()}</div>
              <div className="text-xs text-gray-600 mt-1">{result.summary.totalUnits.toFixed(3)} units</div>
            </div>

            {/* Total Gain/Loss */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-gray-500 mb-1">Total Gain/Loss</div>
              <div className={`text-2xl font-bold ${result.summary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {result.summary.totalGainLoss >= 0 ? '+' : ''}₹{Math.abs(result.summary.totalGainLoss).toLocaleString()}
              </div>
              <div className={`text-xs font-semibold mt-1 ${result.summary.simpleReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {result.summary.simpleReturn >= 0 ? '+' : ''}{result.summary.simpleReturn}% returns
              </div>
            </div>

            {/* Annualized Return */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-gray-500 mb-1">Annualized Return (CAGR)</div>
              <div className={`text-2xl font-bold ${result.summary.annualizedReturn >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {result.summary.annualizedReturn >= 0 ? '+' : ''}{result.summary.annualizedReturn}%
              </div>
              <div className="text-xs text-gray-600 mt-1">Per annum</div>
            </div>
          </div>

          {/* Investment Breakdown - Pie Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Investment Breakdown</h4>
            <div className="flex items-center gap-8">
              {/* Pie Chart */}
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {/* Invested Amount (Blue) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="20"
                    strokeDasharray={`${(result.summary.totalInvested / result.summary.currentValue) * 251.2} 251.2`}
                  />
                  {/* Gains (Green) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={result.summary.totalGainLoss >= 0 ? "#10b981" : "#ef4444"}
                    strokeWidth="20"
                    strokeDasharray={`${Math.abs(result.summary.totalGainLoss) / result.summary.currentValue * 251.2} 251.2`}
                    strokeDashoffset={`-${(result.summary.totalInvested / result.summary.currentValue) * 251.2}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">₹{result.summary.currentValue.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Total Value</div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="font-medium text-gray-700">Invested Amount</span>
                  </div>
                  <span className="font-bold text-gray-900">₹{result.summary.totalInvested.toLocaleString()}</span>
                </div>
                <div className={`flex items-center justify-between p-3 ${result.summary.totalGainLoss >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 ${result.summary.totalGainLoss >= 0 ? 'bg-green-500' : 'bg-red-500'} rounded`}></div>
                    <span className="font-medium text-gray-700">{result.summary.totalGainLoss >= 0 ? 'Gains' : 'Loss'}</span>
                  </div>
                  <span className={`font-bold ${result.summary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {result.summary.totalGainLoss >= 0 ? '+' : ''}₹{Math.abs(result.summary.totalGainLoss).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Investment Timeline */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Investment Timeline</h4>
            <div className="space-y-4">
              {/* Timeline Bar */}
              <div className="relative">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <div className="absolute -top-1 left-0 w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></div>
                <div className="absolute -top-1 right-0 w-4 h-4 bg-green-600 rounded-full border-2 border-white"></div>
              </div>

              {/* Timeline Details */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-500 mb-1">First Installment</div>
                  <div className="font-semibold text-gray-900">{result.meta.firstInstallmentDate}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Total Installments</div>
                  <div className="font-semibold text-gray-900">{result.meta.installments} × ₹{result.summary.sipAmount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Last Valuation</div>
                  <div className="font-semibold text-gray-900">{result.meta.lastValuationDate}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Meta Information */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Scheme Code:</span>
                <span className="ml-2 font-semibold text-gray-900">{result.meta.schemeCode}</span>
              </div>
              <div>
                <span className="text-gray-600">Frequency:</span>
                <span className="ml-2 font-semibold text-gray-900 capitalize">{result.meta.frequency}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
