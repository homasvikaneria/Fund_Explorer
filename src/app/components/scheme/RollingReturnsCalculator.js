// src/app/components/scheme/RollingReturnsCalculator.js
"use client";

import { useState } from "react";

export default function RollingReturnsCalculator({ schemeCode }) {
  const [mode, setMode] = useState("single"); // "single" or "series"
  const [formData, setFormData] = useState({
    on: "",
    from: "",
    to: "",
    interval: "1year",
    annualize: true,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const intervals = [
    { value: "1year", label: "1 Year" },
    { value: "2year", label: "2 Years" },
    { value: "3year", label: "3 Years" },
    { value: "4year", label: "4 Years" },
    { value: "5year", label: "5 Years" },
    { value: "month", label: "1 Month" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let response, data;

      if (mode === "single") {
        // Single date rolling return
        response = await fetch(`/api/scheme/${schemeCode}/rolling-returns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: schemeCode,
            on: formData.on,
            interval: formData.interval,
            annualize: formData.annualize ? "true" : "false",
            series: "true",
          }),
        });
      } else {
        // Rolling returns series (moving window)
        response = await fetch(`/api/scheme/${schemeCode}/rolling-returns-series`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: formData.from,
            to: formData.to,
            window: formData.interval,
          }),
        });
      }

      data = await response.json();

      if (!response.ok) {
        let errorMsg = data.error || "Calculation failed";
        if (data.dataRangeStart && data.dataRangeEnd) {
          errorMsg += `\n\nAvailable data range:\nFrom: ${data.dataRangeStart}\nTo: ${data.dataRangeEnd}`;
        }
        if (data.earliestNAVDate && data.latestNAVDate) {
          errorMsg += `\n\nAvailable data range:\nFrom: ${data.earliestNAVDate}\nTo: ${data.latestNAVDate}`;
        }
        setError(errorMsg);
      } else {
        setResult({ ...data, mode });
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === "checkbox" ? checked : value 
    });
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Calculate Rolling Returns</h3>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === "single"
                ? "bg-pink-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Single Date
          </button>
          <button
            type="button"
            onClick={() => setMode("series")}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === "series"
                ? "bg-pink-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Rolling Window (Series)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "single" ? (
            // Single Date Mode
            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Calculate On)
                </label>
                <input
                  type="date"
                  name="on"
                  value={formData.on}
                  onChange={handleInputChange}
                  required
                  placeholder="dd-mm-yyyy"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Calculate returns ending on this date</p>
              </div>

              {/* Interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rolling Period
                </label>
                <select
                  name="interval"
                  value={formData.interval}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                >
                  {intervals.map((int) => (
                    <option key={int.value} value={int.value}>
                      {int.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Look back period for returns</p>
              </div>
            </div>
          ) : (
            // Series Mode
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* From Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date (From)
                  </label>
                  <input
                    type="date"
                    name="from"
                    value={formData.from}
                    onChange={handleInputChange}
                    required
                    placeholder="dd-mm-yyyy"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">Beginning of rolling period</p>
                </div>

                {/* To Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (To)
                  </label>
                  <input
                    type="date"
                    name="to"
                    value={formData.to}
                    onChange={handleInputChange}
                    required
                    placeholder="dd-mm-yyyy"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">End of rolling period</p>
                </div>
              </div>

              {/* Window */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rolling Window
                </label>
                <select
                  name="interval"
                  value={formData.interval}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                >
                  {intervals.filter(i => i.value !== "month").map((int) => (
                    <option key={int.value} value={int.value}>
                      {int.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  For each date in the range, calculate returns looking back this period
                </p>
              </div>
            </div>
          )}

          {/* Annualize Checkbox - Only for single mode */}
          {mode === "single" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="annualize"
                id="annualize"
                checked={formData.annualize}
                onChange={handleInputChange}
                className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
              />
              <label htmlFor="annualize" className="text-sm text-gray-700">
                Calculate annualized returns (CAGR)
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Calculate Rolling Returns
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

      {/* Results - Series Mode */}
      {result && result.mode === "series" && result.statistics && (
        <div className="space-y-6">
          {/* Statistics Summary */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-100">
            <h4 className="text-lg font-bold text-gray-900 mb-4">
              {result.windowYears}-Year Rolling Returns Analysis
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Period: {result.analysisFrom} to {result.analysisTo} • {result.totalDataPoints} data points
            </p>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Average Return</div>
                <div className={`text-2xl font-bold ${result.statistics.averageReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.statistics.averageReturn >= 0 ? '+' : ''}{result.statistics.averageReturn}%
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Best Return</div>
                <div className="text-2xl font-bold text-green-600">
                  +{result.statistics.maxReturn}%
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Worst Return</div>
                <div className="text-2xl font-bold text-red-600">
                  {result.statistics.minReturn}%
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Positive Periods</div>
                <div className="text-2xl font-bold text-gray-900">
                  {result.statistics.positivePercentage}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {result.statistics.positiveReturns} of {result.totalDataPoints}
                </div>
              </div>
            </div>
          </div>

          {/* Rolling Returns Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Returns Distribution</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {result.rollingReturns.map((item, index) => {
                const maxReturn = Math.max(...result.rollingReturns.map(r => Math.abs(r.annualizedReturn)));
                const barWidth = (Math.abs(item.annualizedReturn) / maxReturn) * 100;
                const isPositive = item.annualizedReturn >= 0;

                return (
                  <div key={index} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded">
                    <div className="w-24 text-xs text-gray-600">{item.endDate}</div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden relative">
                        <div
                          className={`h-full ${isPositive ? 'bg-green-500' : 'bg-red-500'} transition-all duration-300`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <div className={`w-16 text-xs font-semibold text-right ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{item.annualizedReturn}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Detailed Rolling Returns</h4>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">End Date</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Start Date</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Start NAV</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">End NAV</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Return %</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">CAGR %</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rollingReturns.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-900">{item.endDate}</td>
                      <td className="py-2 px-3 text-gray-600">{item.startDate}</td>
                      <td className="py-2 px-3 text-right text-gray-900">₹{item.startNav}</td>
                      <td className="py-2 px-3 text-right text-gray-900">₹{item.endNav}</td>
                      <td className={`py-2 px-3 text-right font-semibold ${item.percentReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.percentReturn >= 0 ? '+' : ''}{item.percentReturn}%
                      </td>
                      <td className={`py-2 px-3 text-right font-semibold ${item.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.annualizedReturn >= 0 ? '+' : ''}{item.annualizedReturn}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Results - Single Mode */}
      {result && result.mode === "single" && result.results && (
        <div className="space-y-6">
          {/* Date Adjustment Notice */}
          {result.notice && (
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">Date Adjusted</h4>
                  <p className="text-sm text-blue-700">{result.notice}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Requested: {result.requestedDate} → Adjusted to: {result.dateAdjustedTo}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Card */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">Rolling Returns Summary</h4>
              <div className="text-sm text-gray-600">
                End Date: <span className="font-semibold text-gray-900">{result.endDateUsed}</span>
              </div>
            </div>

            {/* Display Results for Each Interval */}
            <div className="space-y-4">
              {Object.entries(result.results).map(([key, data]) => {
                if (data.error) {
                  return (
                    <div key={key} className="bg-white rounded-lg p-4 border border-red-200">
                      <div className="flex items-center gap-2 text-red-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold capitalize">{key}:</span>
                        <span className="text-sm">{data.error}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={key} className="bg-white rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-base font-bold text-gray-900 capitalize">{key} Rolling Return</h5>
                      <div className={`text-2xl font-bold ${data.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.percentChange >= 0 ? '+' : ''}{data.percentChange}%
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 mb-1">Period</div>
                        <div className="font-semibold text-gray-900">
                          {data.startDate} to {data.endDate}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">NAV Change</div>
                        <div className="font-semibold text-gray-900">
                          ₹{data.startNav} → ₹{data.endNav}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Absolute Change</div>
                        <div className={`font-semibold ${data.absoluteChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {data.absoluteChange >= 0 ? '+' : ''}₹{data.absoluteChange}
                        </div>
                      </div>
                      {data.annualizedPercent !== null && (
                        <div>
                          <div className="text-gray-500 mb-1">CAGR (Annualized)</div>
                          <div className={`font-semibold ${data.annualizedPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {data.annualizedPercent >= 0 ? '+' : ''}{data.annualizedPercent}%
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Visual Bar */}
                    <div className="mt-4">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${data.percentChange >= 0 ? 'bg-green-500' : 'bg-red-500'} transition-all duration-500`}
                          style={{ width: `${Math.min(Math.abs(data.percentChange), 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Investment Growth Illustration */}
          {Object.values(result.results).some(r => !r.error) && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Investment Growth Illustration</h4>
              <p className="text-sm text-gray-600 mb-4">
                If you invested ₹10,000 at the start of each period:
              </p>
              <div className="space-y-3">
                {Object.entries(result.results).map(([key, data]) => {
                  if (data.error) return null;
                  const investment = 10000;
                  const finalValue = investment * (1 + data.percentChange / 100);
                  const gain = finalValue - investment;

                  return (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-900 capitalize">{key}</div>
                        <div className="text-xs text-gray-500">{data.startDate} to {data.endDate}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">₹{finalValue.toFixed(2)}</div>
                        <div className={`text-xs font-semibold ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {gain >= 0 ? '+' : ''}₹{gain.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
