"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../components/layout/Header";
import SIPCalculator from "../../components/scheme/SIPCalculator";
import LumpsumCalculator from "../../components/scheme/LumpsumCalculator";
import SWPCalculator from "../../components/scheme/SWPCalculator";
import StepUpSIPCalculator from "../../components/scheme/StepUpSIPCalculator";
import StepUpSWPCalculator from "../../components/scheme/StepUpSWPCalculator";
import ReturnsAnalysisCalculator from "../../components/scheme/ReturnsAnalysisCalculator";
import RollingReturnsCalculator from "../../components/scheme/RollingReturnsCalculator";

export default function SchemePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code;

  const [schemeData, setSchemeData] = useState(null);
  const [navHistory, setNavHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCalculator, setActiveCalculator] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("1month");

  useEffect(() => {
    const fetchSchemeData = async () => {
      try {
        const response = await fetch(`/api/scheme/${code}`);
        const data = await response.json();
        setSchemeData(data);
        
        // Get ALL NAV history for chart display
        if (data.data && Array.isArray(data.data)) {
          setNavHistory(data.data);
          // Trigger chart animation after data loads
          setTimeout(() => setChartLoaded(true), 100);
        }
      } catch (error) {
        console.error("Error fetching scheme data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchSchemeData();
    }
  }, [code]);

  const calculators = [
    { id: "sip", name: "SIP Calculator", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "bg-blue-500" },
    { id: "lumpsum", name: "Lumpsum", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z", color: "bg-purple-500" },
    { id: "swp", name: "SWP", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", color: "bg-green-500" },
    { id: "stepup", name: "Step-up SIP", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", color: "bg-indigo-500" },
    { id: "stepdown", name: "Step-up SWP", icon: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6", color: "bg-amber-500" },
    { id: "returns", name: "Returns Analysis", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", color: "bg-orange-500" },
    { id: "rolling", name: "Rolling Returns", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", color: "bg-pink-500" },
  ];

  // Calculate NAV statistics
  const getNavStats = () => {
    if (!schemeData || !schemeData.data || schemeData.data.length === 0) return null;
    
    // Use ALL available NAV data for min/max calculation
    const allNavValues = schemeData.data.map(item => parseFloat(item.nav));
    const maxNav = Math.max(...allNavValues);
    const minNav = Math.min(...allNavValues);
    
    // Use last 30 days for latest/change calculation
    if (!navHistory || navHistory.length === 0) return null;
    const recentNavValues = navHistory.map(item => parseFloat(item.nav));
    const latestNav = recentNavValues[0]; // Latest is now at index 0
    const oldestNav = recentNavValues[recentNavValues.length - 1];
    const change = ((latestNav - oldestNav) / oldestNav * 100).toFixed(2);
    
    // Get start and end dates from full data (latest first now)
    const startDate = schemeData.data[schemeData.data.length - 1]?.date || 'N/A';
    const endDate = schemeData.data[0]?.date || 'N/A';
    
    // Check if scheme is active (end date within 5 days of current date)
    let isActive = false;
    if (endDate !== 'N/A') {
      try {
        // Parse date in DD-MMM-YYYY format
        const [day, month, year] = endDate.split('-');
        const endDateObj = new Date(`${month} ${day}, ${year}`);
        const currentDate = new Date();
        const daysDiff = Math.floor((currentDate - endDateObj) / (1000 * 60 * 60 * 24));
        isActive = daysDiff <= 5;
      } catch (e) {
        console.error('Error parsing date:', e);
      }
    }
    
    return { latestNav, oldestNav, maxNav, minNav, change, startDate, endDate, isActive };
  };

  const navStats = getNavStats();

  // Filter NAV data based on selected period (only for active funds)
  const getFilteredNavHistory = () => {
    if (!navHistory || navHistory.length === 0) return [];
    if (!navStats || !navStats.isActive) return navHistory; // Show all for inactive funds
    
    const latestDate = new Date(navHistory[0].date.split('-').reverse().join('-')); // Latest is now at index 0
    let cutoffDate = new Date(latestDate);
    
    switch (selectedPeriod) {
      case "1month":
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      case "3months":
        cutoffDate.setMonth(cutoffDate.getMonth() - 3);
        break;
      case "6months":
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        break;
      case "1year":
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
      case "all":
        return navHistory;
      default:
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
    }
    
    return navHistory.filter(item => {
      const itemDate = new Date(item.date.split('-').reverse().join('-'));
      return itemDate >= cutoffDate;
    });
  };

  const filteredNavHistory = getFilteredNavHistory();

  // Calculate min/max NAV for filtered data
  const getFilteredNavStats = () => {
    if (!filteredNavHistory || filteredNavHistory.length === 0) return null;
    const filteredNavValues = filteredNavHistory.map(item => parseFloat(item.nav));
    const maxNav = Math.max(...filteredNavValues);
    const minNav = Math.min(...filteredNavValues);
    return { maxNav, minNav };
  };

  const filteredNavStats = getFilteredNavStats();

  // Calculate period performance
  const getPeriodPerformance = () => {
    if (!filteredNavHistory || filteredNavHistory.length < 2) return null;
    const startNav = parseFloat(filteredNavHistory[filteredNavHistory.length - 1].nav); // Oldest in filtered range
    const endNav = parseFloat(filteredNavHistory[0].nav); // Latest is at index 0
    const change = ((endNav - startNav) / startNav * 100).toFixed(2);
    return { startNav, endNav, change };
  };

  const periodPerformance = getPeriodPerformance();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-screen">
          <div className="flex flex-col items-center">
            {/* Building Wealth Loader */}
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
        </div>
      </div>
    );
  }

  if (!schemeData || !schemeData.meta) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Scheme not found</h2>
            <p className="text-gray-600">Unable to load scheme details</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - Calculator Menu */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          {/* Back Button in Sidebar */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => router.back()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors group mb-4"
            >
              <svg className="w-5 h-5 text-gray-700 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium text-gray-700">Back</span>
            </button>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Calculators</h2>
          </div>
          
          <nav className="p-2">
            <button
              onClick={() => setActiveCalculator(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${
                activeCalculator === null
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeCalculator === null ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <svg className={`w-5 h-5 ${activeCalculator === null ? 'text-white' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-sm font-medium">Overview</span>
            </button>

            {calculators.map((calc) => (
              <button
                key={calc.id}
                onClick={() => setActiveCalculator(calc.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${
                  activeCalculator === calc.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeCalculator === calc.id ? calc.color : 'bg-gray-200'}`}>
                  <svg className={`w-5 h-5 ${activeCalculator === calc.id ? 'text-white' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={calc.icon} />
                  </svg>
                </div>
                <span className="text-sm font-medium">{calc.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 overflow-y-auto">
          {activeCalculator === null ? (
            // Scheme Overview - No Scrolling
            <div className="h-full flex flex-col p-8 overflow-hidden">
              {/* Scheme Header */}
              <div className="bg-white rounded-2xl p-6 mb-4 border border-gray-200 flex-shrink-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {schemeData.meta.scheme_name}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Code: {schemeData.meta.scheme_code}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {schemeData.meta.fund_house}
                      </span>
                    </div>
                  </div>
                  
                  {navStats && (
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">₹{navStats.latestNav}</div>
                      <div className={`text-sm font-semibold ${parseFloat(navStats.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(navStats.change) >= 0 ? '+' : ''}{navStats.change}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
                    </div>
                  )}
                </div>

                {navStats && (
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Highest NAV</div>
                      <div className="text-lg font-bold text-gray-900">₹{navStats.maxNav.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Lowest NAV</div>
                      <div className="text-lg font-bold text-gray-900">₹{navStats.minNav.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Start Date</div>
                      <div className="text-sm font-bold text-gray-900">{navStats.startDate}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <div className="flex items-center gap-2">
                        {navStats.isActive ? (
                          <>
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-sm font-bold text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                            <span className="text-sm font-bold text-gray-600">Inactive</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* NAV Trend - Modern Line Chart */}
              {navHistory.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">NAV Performance</h2>
                      {navStats && navStats.isActive && periodPerformance && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">Period Return:</span>
                          <span className={`text-sm font-bold ${parseFloat(periodPerformance.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {parseFloat(periodPerformance.change) >= 0 ? '+' : ''}{periodPerformance.change}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Period Selector - Only for Active Funds */}
                    {navStats && navStats.isActive ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPeriod("1month")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            selectedPeriod === "1month"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          1M
                        </button>
                        <button
                          onClick={() => setSelectedPeriod("3months")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            selectedPeriod === "3months"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          3M
                        </button>
                        <button
                          onClick={() => setSelectedPeriod("6months")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            selectedPeriod === "6months"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          6M
                        </button>
                        <button
                          onClick={() => setSelectedPeriod("1year")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            selectedPeriod === "1year"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          1Y
                        </button>
                        <button
                          onClick={() => setSelectedPeriod("all")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            selectedPeriod === "all"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          All
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">All Time ({navHistory.length} days)</span>
                    )}
                  </div>
                  
                  {/* Area Chart with Line */}
                  <div className="relative flex-1">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="border-t border-gray-100"></div>
                      ))}
                    </div>
                    
                    {/* Custom Tooltip */}
                    {hoveredPoint !== null && filteredNavHistory[hoveredPoint] && filteredNavStats && (
                      <div
                        className="absolute pointer-events-none z-10"
                        style={{
                          left: `${(hoveredPoint / (filteredNavHistory.length - 1)) * 100}%`,
                          top: `${100 - ((parseFloat(filteredNavHistory[hoveredPoint].nav) - filteredNavStats.minNav) / (filteredNavStats.maxNav - filteredNavStats.minNav)) * 100}%`,
                          transform: 'translate(-50%, -120%)'
                        }}
                      >
                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
                          <div className="font-bold text-sm">₹{parseFloat(filteredNavHistory[hoveredPoint].nav).toFixed(2)}</div>
                          <div className="text-gray-300 mt-1">
                            {filteredNavHistory[hoveredPoint].date}
                          </div>
                        </div>
                        <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1"></div>
                      </div>
                    )}
                    
                    {/* Chart */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="navGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      
                      {/* Area Fill */}
                      <path
                        d={(() => {
                          if (filteredNavHistory.length === 0 || !filteredNavStats) return '';
                          const points = filteredNavHistory.map((item, i) => {
                            const x = (i / (filteredNavHistory.length - 1)) * 100;
                            const navValue = parseFloat(item.nav);
                            const y = 100 - ((navValue - filteredNavStats.minNav) / (filteredNavStats.maxNav - filteredNavStats.minNav)) * 100;
                            return `${x} ${y}`;
                          });
                          return `M 0 100 L ${points.join(' L ')} L 100 100 Z`;
                        })()}
                        fill="url(#navGradient)"
                        className={`transition-all duration-1000 ${chartLoaded ? 'opacity-100' : 'opacity-0'}`}
                      />
                      
                      {/* Line with Drawing Animation */}
                      <path
                        d={(() => {
                          if (filteredNavHistory.length === 0 || !filteredNavStats) return '';
                          const points = filteredNavHistory.map((item, i) => {
                            const x = (i / (filteredNavHistory.length - 1)) * 100;
                            const navValue = parseFloat(item.nav);
                            const y = 100 - ((navValue - filteredNavStats.minNav) / (filteredNavStats.maxNav - filteredNavStats.minNav)) * 100;
                            return `${x} ${y}`;
                          });
                          return `M ${points.join(' L ')}`;
                        })()}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="0.5"
                        vectorEffect="non-scaling-stroke"
                        className="transition-all duration-2000 ease-out"
                        style={{
                          strokeDasharray: '1000',
                          strokeDashoffset: chartLoaded ? '0' : '1000'
                        }}
                      />
                      
                      {/* Interactive Hover Area */}
                      {filteredNavHistory.map((item, i) => {
                        if (!filteredNavStats) return null;
                        const x = (i / (filteredNavHistory.length - 1)) * 100;
                        const navValue = parseFloat(item.nav);
                        const y = 100 - ((navValue - filteredNavStats.minNav) / (filteredNavStats.maxNav - filteredNavStats.minNav)) * 100;
                        
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="1.5"
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPoint(i)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        );
                      })}
                    </svg>
                  </div>
                  
                  {/* Date Range */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 flex-shrink-0">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Start:</span> {filteredNavHistory[filteredNavHistory.length - 1]?.date || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">End:</span> {navStats?.isActive ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                          <span className="text-green-600 font-semibold">Active ({filteredNavHistory[0]?.date || 'N/A'})</span>
                        </span>
                      ) : (filteredNavHistory[0]?.date || 'N/A')}
                    </div>
                    {navStats?.isActive && (
                      <div className="text-xs text-gray-500">
                        Showing {filteredNavHistory.length} days
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Calculator View (Slide-in effect with key for re-animation)
            <div key={activeCalculator} className="h-full bg-white animate-slideIn">
              <div className="p-8">
                <button
                  onClick={() => setActiveCalculator(null)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="font-medium">Back to Overview</span>
                </button>

                {/* Render Calculator Components */}
                {activeCalculator === 'sip' && <SIPCalculator schemeCode={code} />}
                {activeCalculator === 'lumpsum' && <LumpsumCalculator schemeCode={code} />}
                {activeCalculator === 'swp' && <SWPCalculator schemeCode={code} />}
                {activeCalculator === 'stepup' && <StepUpSIPCalculator schemeCode={code} />}
                {activeCalculator === 'stepdown' && <StepUpSWPCalculator schemeCode={code} />}
                {activeCalculator === 'returns' && <ReturnsAnalysisCalculator schemeCode={code} />}
                {activeCalculator === 'rolling' && <RollingReturnsCalculator schemeCode={code} />}
                
                {/* Placeholder for other calculators */}
                {activeCalculator !== 'sip' && activeCalculator !== 'lumpsum' && activeCalculator !== 'swp' && activeCalculator !== 'stepup' && activeCalculator !== 'stepdown' && activeCalculator !== 'returns' && activeCalculator !== 'rolling' && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-16 h-16 ${calculators.find(c => c.id === activeCalculator)?.color} rounded-xl flex items-center justify-center`}>
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={calculators.find(c => c.id === activeCalculator)?.icon} />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {calculators.find(c => c.id === activeCalculator)?.name}
                        </h2>
                        <p className="text-gray-600">Calculate your investment returns</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6">
                      <p className="text-gray-600 text-center py-12">
                        Calculator interface will be implemented here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
