// src/app/components/scheme/ReturnsAnalysisCalculator.js
"use client";

import { useState } from "react";

export default function ReturnsAnalysisCalculator({ schemeCode }) {
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    period: "overall",
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
      const response = await fetch(`/api/scheme/${schemeCode}/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: formData.from,
          to: formData.to,
          period: formData.period,
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

  // Calculate average return
  const getAverageReturn = () => {
    if (!result || !result.returns || result.returns.length === 0) return null;
    const sum = result.returns.reduce((acc, r) => acc + r.simpleReturn, 0);
    return (sum / result.returns.length).toFixed(2);
  };

  // Get best and worst returns
  const getBestWorst = () => {
    if (!result || !result.returns || result.returns.length === 0) return null;
    const sorted = [...result.returns].sort((a, b) => b.simpleReturn - a.simpleReturn);
    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1]
    };
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Analyze Returns</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date (Analysis From)
              </label>
              <input
                type="date"
                name="from"
                value={formData.from}
                onChange={handleInputChange}
                required
                placeholder="dd-mm-yyyy"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Beginning of analysis period</p>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Analysis To)
              </label>
              <input
                type="date"
                name="to"
                value={formData.to}
                onChange={handleInputChange}
                required
                placeholder="dd-mm-yyyy"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">End of analysis period</p>
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Period
              </label>
              <select
                name="period"
                value={formData.period}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              >
                <option value="overall">Overall</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analyze Returns
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
      {result && result.returns && result.returns.length > 0 && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {result.period !== "overall" && (
            <div className="grid grid-cols-3 gap-4">
              {/* Total Periods */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="text-xs font-medium text-gray-500 mb-1">Total Periods</div>
                <div className="text-2xl font-bold text-gray-900">{result.totalPeriods}</div>
                <div className="text-xs text-gray-600 mt-1 capitalize">{result.period} analysis</div>
              </div>

              {/* Average Return */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="text-xs font-medium text-gray-500 mb-1">Average Return</div>
                <div className={`text-2xl font-bold ${parseFloat(getAverageReturn()) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(getAverageReturn()) >= 0 ? '+' : ''}{getAverageReturn()}%
                </div>
                <div className="text-xs text-gray-600 mt-1">Per period</div>
              </div>

              {/* Best Return */}
              {getBestWorst() && (
                <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="text-xs font-medium text-gray-500 mb-1">Best Return</div>
                  <div className="text-2xl font-bold text-green-600">
                    +{getBestWorst().best.simpleReturn}%
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{getBestWorst().best.period}</div>
                </div>
              )}
            </div>
          )}

          {/* Visual Chart */}
          {result.returns.length > 1 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Returns Visualization</h4>
              <div className="space-y-3">
                {result.returns.map((item, index) => {
                  const maxReturn = Math.max(...result.returns.map(r => Math.abs(r.simpleReturn)));
                  const barWidth = (Math.abs(item.simpleReturn) / maxReturn) * 100;
                  const isPositive = item.simpleReturn >= 0;

                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-32 text-xs text-gray-600 truncate">{item.period}</div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                          <div
                            className={`h-full ${isPositive ? 'bg-green-500' : 'bg-red-500'} transition-all duration-500 flex items-center justify-end px-2`}
                            style={{ width: `${barWidth}%` }}
                          >
                            <span className="text-xs font-semibold text-white">
                              {isPositive ? '+' : ''}{item.simpleReturn}%
                            </span>
                          </div>
                        </div>
                        <div className="w-20 text-xs text-gray-500">
                          CAGR: {item.annualizedReturn}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed Table */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Detailed Returns</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Period</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Start Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">End Date</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Start NAV</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">End NAV</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Return (%)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">CAGR (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.returns.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-900">{item.period}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.startDate}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.endDate}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">₹{item.startNAV}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">₹{item.endNAV}</td>
                      <td className={`py-3 px-4 text-sm font-semibold text-right ${item.simpleReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.simpleReturn >= 0 ? '+' : ''}{item.simpleReturn}%
                      </td>
                      <td className={`py-3 px-4 text-sm font-semibold text-right ${item.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.annualizedReturn >= 0 ? '+' : ''}{item.annualizedReturn}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistics */}
          {result.period !== "overall" && getBestWorst() && (
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Performance Statistics</h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Best Performing Period</div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      +{getBestWorst().best.simpleReturn}%
                    </div>
                    <div className="text-xs text-gray-600">{getBestWorst().best.period}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getBestWorst().best.startDate} to {getBestWorst().best.endDate}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">Worst Performing Period</div>
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      {getBestWorst().worst.simpleReturn}%
                    </div>
                    <div className="text-xs text-gray-600">{getBestWorst().worst.period}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getBestWorst().worst.startDate} to {getBestWorst().worst.endDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
