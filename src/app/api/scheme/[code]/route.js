// src/app/api/scheme/[code]/route.js
import { NextResponse } from "next/server";
import { fetchScheme, parseNavs } from "../helpers";

export async function GET(request, { params }) {
  try {
    const { code } = await params;

    const scheme = await fetchScheme(code);

    if (!scheme || !scheme.meta) {
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }

    const navs = parseNavs(scheme);
    const total = navs.length;

    // Reverse to get latest NAV first (matching original API format)
    const allNavs = navs.reverse().map((n) => ({
      date: n.rawDate, // keep user-friendly format
      nav: n.nav,
    }));

    const meta = {
      scheme_code: scheme.meta.scheme_code,
      scheme_name: scheme.meta.scheme_name,
      fund_house: scheme.meta.fund_house,
      scheme_type: scheme.meta.scheme_type,
      scheme_category: scheme.meta.scheme_category,
      isin_growth: scheme.meta.isin_growth,
      isin_div_reinvestment: scheme.meta.isin_div_reinvestment,
    };

    return NextResponse.json({
      meta,
      total,
      data: allNavs,
    });
  } catch (err) {
    console.error("GET /api/scheme/[code] error:", err?.message || err);
    return NextResponse.json({ error: "Failed to fetch scheme" }, { status: 500 });
  }
}
