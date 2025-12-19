// src/app/components/scheme/StepUpSIPCalculator.js
"use client";

import { useState } from "react";

export default function StepUpSIPCalculator({ schemeCode }) {
  const [formData, setFormData] = useState({
    initialInvestment: "10000",
    stepUpType: "amount",
    stepUpValue: "1000",
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
      const response = await fetch(`/api/scheme/${schemeCode}/step-up-sip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initialInvestment: parseFloat(formData.initialInvestment),
          stepUpType: formData.stepUpType,
          stepUpValue: parseFloat(formData.stepUpValue),
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
        <h3 className="text-lg font-bold text-gray-900 mb-6">Calculate Step-Up SIP Returns</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Initial Investment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial SIP Amount (₹)
              </label>
              <input
                type="number"
                name="initialInvestment"
                value={formData.initialInvestment}
                onChange={handleInputChange}
                min="100"
                step="100"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="10000"
              />
            </div>

            {/* Step-Up Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Step-Up Type
              </label>
              <select
                name="stepUpType"
                value={formData.stepUpType}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="amount">Fixed Amount</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>

            {/* Step-Up Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Step-Up Value {formData.stepUpType === "percentage" ? "(%)" : "(₹)"}
              </label>
              <input
                type="number"
                name="stepUpValue"
                value={formData.stepUpValue}
                onChange={handleInputChange}
                min="1"
                step={formData.stepUpType === "percentage" ? "1" : "100"}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder={formData.stepUpType === "percentage" ? "10" : "1000"}
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
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="monthly">Monthly</option>
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
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">When to start step-up SIP</p>
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
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">When to calculate final value</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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
              <div className="text-2xl font-bold text-gray-900">₹{result.totalInvested.toLocaleString()}</div>
              <div className="text-xs text-gray-600 mt-1">{result.totalSIPs} installments</div>
            </div>

            {/* Current Value */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-gray-500 mb-1">Current Value</div>
              <div className="text-2xl font-bold text-gray-900">₹{result.currentValue.toLocaleString()}</div>
              <div className="text-xs text-gray-600 mt-1">{result.totalUnits.toFixed(3)} units</div>
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

            {/* Last SIP Amount */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-gray-500 mb-1">Last SIP Amount</div>
              <div className="text-2xl font-bold text-indigo-600">₹{result.lastSIPAmount.toLocaleString()}</div>
              <div className="text-xs text-gray-600 mt-1">Final installment</div>
            </div>
          </div>

          {/* Step-Up Details */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Step-Up Details</h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Initial SIP Amount</span>
                  <span className="text-sm font-semibold text-gray-900">₹{formData.initialInvestment}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Step-Up Type</span>
                  <span className="text-sm font-semibold text-gray-900 capitalize">{result.stepUpType}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Step-Up Value</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {result.stepUpType === "percentage" ? `${result.stepUpValue}%` : `₹${result.stepUpValue}`}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Step-Ups Applied</span>
                  <span className="text-sm font-semibold text-gray-900">{result.stepUpAppliedTimes} times</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Start Date</span>
                  <span className="text-sm font-semibold text-gray-900">{result.startDate}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">End Date</span>
                  <span className="text-sm font-semibold text-gray-900">{result.endDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Growth Visualization */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Investment Growth</h4>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-2">SIP Amount Growth</div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Started with</div>
                    <div className="text-lg font-bold text-indigo-600">₹{formData.initialInvestment}</div>
                  </div>
                  <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Grew to</div>
                    <div className="text-lg font-bold text-indigo-600">₹{result.lastSIPAmount.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Growth Factor</div>
                <div className="text-3xl font-bold text-indigo-600">
                  {(result.lastSIPAmount / parseFloat(formData.initialInvestment)).toFixed(2)}x
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
