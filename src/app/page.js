"use client";

import Link from "next/link";
import Header from "./components/layout/Header";

export default function Home() {
  return (
    <div className="h-screen overflow-hidden bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative h-full flex items-center overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(209 213 219 / 0.3) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-sm font-semibold text-blue-900">Live Market Data</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Invest in Mutual Funds with
                <span className="block mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Confidence
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                Access 10,000+ mutual funds, real-time NAV data, and powerful investment calculators. 
                Make informed decisions with comprehensive analytics.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/funds"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Explore Funds
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                
                <Link
                  href="/funds"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-lg font-semibold border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 transition-all"
                >
                  View Calculators
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold text-gray-900">10,000+</div>
                  <div className="text-sm text-gray-600 mt-1">Mutual Funds</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">Real-time</div>
                  <div className="text-sm text-gray-600 mt-1">NAV Updates</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">6+</div>
                  <div className="text-sm text-gray-600 mt-1">Calculators</div>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Portfolio Overview</h3>
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">+12.5%</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">EQ</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">Equity Funds</div>
                          <div className="text-xs text-gray-500">₹2,45,000</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">+18.5%</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">DB</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">Debt Funds</div>
                          <div className="text-xs text-gray-500">₹1,50,000</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">+7.2%</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">HY</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">Hybrid Funds</div>
                          <div className="text-xs text-gray-500">₹95,000</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">+10.8%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Total Returns</div>
                      <div className="text-sm font-bold text-gray-900">₹61,250</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">SIP Active</div>
                      <div className="text-sm font-bold text-gray-900">₹10,000/mo</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
