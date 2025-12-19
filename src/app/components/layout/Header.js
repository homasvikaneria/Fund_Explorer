"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">Fund Explorer</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Home
            </Link>
            <Link href="/funds" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Browse Funds
            </Link>
            <Link href="/funds" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Calculators
            </Link>
            <Link 
              href="/funds"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
            <div className="flex flex-col gap-4">
              <Link href="/" className="text-gray-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link href="/funds" className="text-gray-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                Browse Funds
              </Link>
              <Link href="/funds" className="text-gray-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                Calculators
              </Link>
              <Link 
                href="/funds" 
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
