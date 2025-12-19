"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "../components/layout/Header";

export default function FundsPage() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [limit] = useState(20);
  const [error, setError] = useState(null);

  const fetchFunds = useCallback(async (searchTerm, pageNum, category, activeFilter) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: limit,
      });
      
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (activeFilter) {
        params.append("activeOnly", "true");
      }

      const response = await fetch(`/api/mf?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch funds');
      }
      
      let filteredData = data.data || [];
      
      // Apply category filter
      if (category !== "all") {
        filteredData = filteredData.filter(fund => {
          const name = fund.schemeName.toLowerCase();
          if (category === "equity") {
            return name.includes("equity") || name.includes("growth") || name.includes("bluechip") || name.includes("large cap") || name.includes("mid cap") || name.includes("small cap");
          }
          if (category === "debt") {
            return name.includes("debt") || name.includes("bond") || name.includes("income") || name.includes("gilt") || name.includes("liquid");
          }
          if (category === "hybrid") {
            return name.includes("hybrid") || name.includes("balanced") || name.includes("aggressive") || name.includes("conservative") || name.includes("dynamic");
          }
          if (category === "index") {
            return name.includes("index") || name.includes("nifty") || name.includes("sensex");
          }
          return true;
        });
      }

      setFunds(filteredData);
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error("Error fetching funds:", error);
      setError(error.message || 'Failed to load funds. Please try again.');
      setFunds([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchFunds(searchQuery, page, selectedCategory, showActiveOnly);
  }, [searchQuery, page, selectedCategory, showActiveOnly, fetchFunds]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const categories = [
    { id: "all", name: "All Funds", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
    { id: "equity", name: "Equity", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    { id: "debt", name: "Debt", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: "hybrid", name: "Hybrid", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { id: "index", name: "Index", icon: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Explore Mutual Funds
          </h1>
          <p className="text-lg text-gray-600">
            Browse through {(total || 0).toLocaleString()}+ mutual funds
          </p>
        </div>

        {/* Search Bar and Active Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by fund name or AMC..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full px-6 py-4 pl-14 text-base text-gray-900 placeholder:text-gray-400 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none transition-colors bg-white shadow-sm font-medium"
              suppressHydrationWarning
            />
            <svg
              className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Active Funds Toggle */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900">Show Active Funds Only</div>
                <div className="text-xs text-gray-500">
                  {showActiveOnly ? `Showing ${funds.length} active funds` : 'Showing all funds'}
                </div>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <button
              onClick={() => setShowActiveOnly(!showActiveOnly)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                showActiveOnly ? 'bg-green-500' : 'bg-gray-300'
              }`}
              suppressHydrationWarning
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  showActiveOnly ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-3 pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === category.id
                    ? "bg-blue-600 text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200"
                }`}
                suppressHydrationWarning
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                </svg>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State - Building Wealth Animation */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="relative w-32 h-32">
              {/* Building Base */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-24 border-4 border-blue-600 rounded-t-lg bg-blue-50">
                {/* Windows */}
                <div className="grid grid-cols-2 gap-2 p-2 mt-2">
                  <div className="w-6 h-6 bg-blue-600 rounded animate-pulse" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-6 h-6 bg-blue-600 rounded animate-pulse" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-6 h-6 bg-blue-600 rounded animate-pulse" style={{ animationDelay: '400ms' }}></div>
                  <div className="w-6 h-6 bg-blue-600 rounded animate-pulse" style={{ animationDelay: '600ms' }}></div>
                </div>
              </div>
              
              {/* Roof */}
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[50px] border-r-[50px] border-b-[30px] border-l-transparent border-r-transparent border-b-blue-600 animate-bounce"></div>
              
              {/* Growth Arrow - Dotted Line */}
              <svg className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-24" viewBox="0 0 100 100">
                <path
                  d="M 50 90 Q 30 60, 50 30 Q 70 0, 90 10"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  fill="none"
                  className="animate-pulse"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="100"
                    to="0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </path>
                <circle cx="90" cy="10" r="4" fill="#3b82f6" className="animate-ping" />
                <circle cx="90" cy="10" r="4" fill="#3b82f6" />
              </svg>
            </div>
            <p className="mt-8 text-base font-semibold text-gray-700">Building your portfolio...</p>
          </div>
        )}

        {/* Funds Grid - Modern Bento Style */}
        {!loading && funds.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              {funds.map((fund, index) => {
                const isActive = fund.isinGrowth !== null && fund.isinGrowth !== "";
                const isEquity = fund.schemeName.toLowerCase().includes('equity');
                const isDebt = fund.schemeName.toLowerCase().includes('debt');
                const isHybrid = fund.schemeName.toLowerCase().includes('hybrid');
                const isIndex = fund.schemeName.toLowerCase().includes('index');
                
                let bgGradient = 'from-slate-50 to-slate-100';
                let accentColor = 'text-slate-600';
                let badgeColor = 'bg-slate-200 text-slate-700';
                
                if (isEquity) {
                  bgGradient = 'from-emerald-50 to-teal-50';
                  accentColor = 'text-emerald-600';
                  badgeColor = 'bg-emerald-100 text-emerald-700';
                } else if (isDebt) {
                  bgGradient = 'from-violet-50 to-purple-50';
                  accentColor = 'text-violet-600';
                  badgeColor = 'bg-violet-100 text-violet-700';
                } else if (isHybrid) {
                  bgGradient = 'from-amber-50 to-orange-50';
                  accentColor = 'text-amber-600';
                  badgeColor = 'bg-amber-100 text-amber-700';
                } else if (isIndex) {
                  bgGradient = 'from-cyan-50 to-blue-50';
                  accentColor = 'text-cyan-600';
                  badgeColor = 'bg-cyan-100 text-cyan-700';
                }
                
                return (
                  <Link
                    key={`${fund.schemeCode}-${index}`}
                    href={`/scheme/${fund.schemeCode}`}
                    className={`group relative bg-gradient-to-br ${bgGradient} rounded-2xl p-6 border-2 border-transparent hover:border-white hover:shadow-2xl transition-all duration-300 overflow-hidden`}
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-black rounded-full -translate-y-16 translate-x-16"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black rounded-full translate-y-12 -translate-x-12"></div>
                    </div>
                    
                    <div className="relative">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${badgeColor} text-xs font-semibold`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {isEquity && 'Equity Fund'}
                            {isDebt && 'Debt Fund'}
                            {isHybrid && 'Hybrid Fund'}
                            {isIndex && 'Index Fund'}
                            {!isEquity && !isDebt && !isHybrid && !isIndex && 'Mutual Fund'}
                          </div>
                          {/* Active Status Badge */}
                          {isActive ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                              Active
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                              Closed
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-mono text-gray-500">
                          #{(page - 1) * limit + index + 1}
                        </div>
                      </div>

                      {/* Fund Name */}
                      <h3 className="text-base font-bold text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-gray-700 transition-colors">
                        {fund.schemeName}
                      </h3>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          <span className="font-mono">{fund.schemeCode}</span>
                        </div>
                        
                        <div className={`flex items-center gap-1.5 ${accentColor} font-medium text-sm group-hover:gap-2.5 transition-all`}>
                          <span>View</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between bg-white rounded-2xl p-6 border-2 border-gray-100">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <div className="text-gray-700 font-semibold">
                Page {page}
              </div>

              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Failed to Load Funds
            </h3>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <button
              onClick={() => fetchFunds(searchQuery, page, selectedCategory, showActiveOnly)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && funds.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {showActiveOnly ? 'No active funds found' : 'No funds found'}
            </h3>
            <p className="text-gray-600">
              {showActiveOnly 
                ? 'Try turning off the active filter or adjusting your search' 
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
