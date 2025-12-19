// src/app/api/mf/route.js
import axios from "axios";
import { NextResponse } from "next/server";
import { getCache, setCache } from "../cache";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("search")?.trim().toLowerCase() || "";
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.max(Math.min(parseInt(searchParams.get("limit") || "50", 10), 500), 1); // cap limit
    const activeOnly = searchParams.get("activeOnly") === "true";

    // Use cache to avoid repeated external API calls
    const cacheKey = "all_schemes";
    let all = getCache(cacheKey);

    if (!all) {
      const res = await axios.get("https://api.mfapi.in/mf", { 
        timeout: 30000, // 30 seconds
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      all = res.data || [];
      // Cache for 12 hours
      setCache(cacheKey, all, 1000 * 60 * 60 * 12);
    }

    // allow searching by scheme name or fund house
    let filtered = all;
    if (q) {
      filtered = all.filter((s) => {
        const name = (s.schemeName || "").toLowerCase();
        const fh = (s.fundHouse || "").toLowerCase();
        return name.includes(q) || fh.includes(q);
      });
    }

    // Filter for active funds only if requested
    if (activeOnly) {
      filtered = filtered.filter((s) => s.isinGrowth !== null && s.isinGrowth !== "");
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = filtered.slice(start, end);

    return NextResponse.json({
      total,
      page,
      limit,
      hasMore: end < total,
      data,
      activeOnly,
    });
  } catch (err) {
    console.error("GET /api/mf error:", err?.message || err);
    
    // Provide more specific error messages
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return NextResponse.json({ 
        error: "Request timeout - external API is slow or unavailable",
        details: err.message 
      }, { status: 504 });
    }
    
    if (err.response) {
      return NextResponse.json({ 
        error: "External API error",
        details: err.response.statusText 
      }, { status: err.response.status });
    }
    
    return NextResponse.json({ 
      error: "Failed to fetch mutual funds list",
      details: err.message 
    }, { status: 500 });
  }
}
