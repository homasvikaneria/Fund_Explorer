import { NextResponse } from "next/server";
import dayjs from "dayjs";
import {
  fetchScheme,
  parseNavs,
  findNavOnOrBefore,
  findNavOnOrAfter,
} from "../../helpers";

/**
 * POST /api/scheme/[code]/lumpsum
 *
 * Request body:
 * {
 *   "investment": number,
 *   "from": "YYYY-MM-DD",
 *   "to": "YYYY-MM-DD"
 * }
 */
export async function POST(request, context) {
  try {
    // ✅ Next.js 15+ requires awaiting context.params
    const { code } = await context.params;

    if (!code) {
      return NextResponse.json(
        { error: "Missing scheme code in route parameter." },
        { status: 400 }
      );
    }

    // ✅ Parse request body safely
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid JSON format in request body. Ensure 'Content-Type: application/json' is set.",
        },
        { status: 400 }
      );
    }

    const { investment, from, to } = body || {};

    // ✅ Validate investment
    const investmentAmount = Number(investment);
    if (!investment || isNaN(investmentAmount) || investmentAmount <= 0) {
      return NextResponse.json(
        { error: "Validation Failed: 'investment' must be a positive number." },
        { status: 400 }
      );
    }

    // ✅ Validate and parse dates
    if (!from || !to) {
      return NextResponse.json(
        { error: "Validation Failed: Both 'from' and 'to' dates are required." },
        { status: 400 }
      );
    }

    const rawFromDate = dayjs(from, "YYYY-MM-DD");
    const rawToDate = dayjs(to, "YYYY-MM-DD");

    if (!rawFromDate.isValid() || !rawToDate.isValid()) {
      return NextResponse.json(
        {
          error:
            "Validation Failed: Invalid date format. Please use YYYY-MM-DD for 'from' and 'to' dates.",
        },
        { status: 400 }
      );
    }

    const fromDate = rawFromDate.startOf("day");
    const toDate = rawToDate.startOf("day");

    if (toDate.isBefore(fromDate)) {
      return NextResponse.json(
        { error: "Validation Failed: 'to' date cannot be before 'from' date." },
        { status: 400 }
      );
    }

    // ✅ Fetch scheme NAV data
    const scheme = await fetchScheme(code);
    const navs = parseNavs(scheme);

    if (!Array.isArray(navs) || !navs.length) {
      return NextResponse.json(
        { error: "NAV Data Error: No valid NAV data available for this scheme." },
        { status: 404 }
      );
    }

    // ✅ Check if requested dates are within available NAV range
    const earliestNAVDate = navs[0].date;
    const latestNAVDate = navs[navs.length - 1].date;

    if (fromDate.isBefore(earliestNAVDate, 'day') || toDate.isAfter(latestNAVDate, 'day')) {
      return NextResponse.json(
        {
          error: `Date Range Error: Requested dates are outside the scheme's NAV history.`,
          earliestNAVDate: earliestNAVDate.format("YYYY-MM-DD"),
          latestNAVDate: latestNAVDate.format("YYYY-MM-DD"),
          requestedFrom: fromDate.format("YYYY-MM-DD"),
          requestedTo: toDate.format("YYYY-MM-DD")
        },
        { status: 400 }
      );
    }

    // ✅ Find NAVs within date range
    const startNAVObj = findNavOnOrAfter(navs, fromDate);
    const endNAVObj = findNavOnOrBefore(navs, toDate);

    if (!startNAVObj) {
      return NextResponse.json(
        {
          error: `Date Range Error: Could not find NAV data on or after start date: ${fromDate.format(
            "YYYY-MM-DD"
          )}.`,
          earliestNAVDate: navs[0].date.format("YYYY-MM-DD"),
        },
        { status: 404 }
      );
    }

    if (!endNAVObj || startNAVObj.date.isAfter(endNAVObj.date, "day")) {
      return NextResponse.json(
        {
          error:
            "Date Range Error: Could not find NAV data up to the end date or the period is invalid.",
          latestNAVDate: navs[navs.length - 1].date.format("YYYY-MM-DD"),
        },
        { status: 404 }
      );
    }

    if (startNAVObj.nav <= 0 || endNAVObj.nav <= 0) {
      return NextResponse.json(
        {
          error:
            "NAV Data Error: NAV is zero or negative for one of the selected dates.",
        },
        { status: 400 }
      );
    }

    // ✅ Lumpsum calculation
    const unitsPurchased = investmentAmount / startNAVObj.nav;
    const currentValue = unitsPurchased * endNAVObj.nav;
    const totalGainLoss = currentValue - investmentAmount;
    const simpleReturn = (totalGainLoss / investmentAmount) * 100;

    const days = endNAVObj.date.diff(startNAVObj.date, "days");
    const years = days / 365.25;
    const annualizedReturn =
      years > 0
        ? ((endNAVObj.nav / startNAVObj.nav) ** (1 / years) - 1) * 100
        : 0;

    // ✅ Return success JSON response
    return NextResponse.json({
      initialInvestment: Number(investmentAmount.toFixed(2)),
      unitsPurchased: Number(unitsPurchased.toFixed(6)),
      currentValue: Number(currentValue.toFixed(2)),
      totalGainLoss: Number(totalGainLoss.toFixed(2)),

      startDate: startNAVObj.date.format("DD-MM-YYYY"),
      endDate: endNAVObj.date.format("DD-MM-YYYY"),
      startNAV: startNAVObj.nav,
      endNAV: endNAVObj.nav,
      simpleReturn: Number(simpleReturn.toFixed(2)),
      annualizedReturn: Number(annualizedReturn.toFixed(2)),
    });
  } catch (err) {
    console.error("💥 Lumpsum POST Uncaught Error:", err);
    
    // Handle timeout errors specifically
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return NextResponse.json(
        {
          error: "Request Timeout: The external API took too long to respond. Please try again.",
          details: "The mutual fund data provider is experiencing delays."
        },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Internal Server Error: An unexpected error occurred. Please check logs.",
        details: err.message || String(err)
      },
      { status: 500 }
    );
  }
}
