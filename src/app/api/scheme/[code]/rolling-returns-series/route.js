import { NextResponse } from "next/server";
import dayjs from "dayjs";
import {
  fetchScheme,
  parseNavs,
  findNavAtOrBefore,
  cagr,
} from "../../helpers";

/**
 * POST /api/scheme/[code]/rolling-returns-series
 * 
 * Calculates rolling returns for EVERY date in a range (moving window)
 * 
 * Request body:
 * {
 *   "from": "YYYY-MM-DD",      // Start of analysis period
 *   "to": "YYYY-MM-DD",        // End of analysis period
 *   "window": "1year",         // Rolling window size (1year, 2year, 3year, etc.)
 *   "stepDays": 30             // Optional: Calculate every N days (default: 30)
 * }
 */
export async function POST(request, context) {
  try {
    const { code } = await context.params;

    if (!code) {
      return NextResponse.json(
        { error: "Missing scheme code in route parameter." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { from, to, window = "1year", stepDays = 30 } = body;

    if (!from || !to) {
      return NextResponse.json(
        { error: "Both 'from' and 'to' dates are required." },
        { status: 400 }
      );
    }

    const fromDate = dayjs(from, "YYYY-MM-DD").startOf("day");
    const toDate = dayjs(to, "YYYY-MM-DD").startOf("day");

    if (!fromDate.isValid() || !toDate.isValid()) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    if (toDate.isBefore(fromDate)) {
      return NextResponse.json(
        { error: "'to' date cannot be before 'from' date." },
        { status: 400 }
      );
    }

    // Parse window (e.g., "2year" -> 2 years)
    const windowMatch = /^(\d+)year$/.exec(window);
    if (!windowMatch) {
      return NextResponse.json(
        { error: "Invalid window format. Use format like '1year', '2year', '3year'." },
        { status: 400 }
      );
    }
    const windowYears = parseInt(windowMatch[1], 10);
    const windowMonths = windowYears * 12;

    // Fetch NAV data
    const scheme = await fetchScheme(code);
    const navs = parseNavs(scheme);

    if (!navs || !navs.length) {
      return NextResponse.json(
        { error: "No valid NAV data available for this scheme." },
        { status: 404 }
      );
    }

    const earliestDate = navs[0].date;
    const latestDate = navs[navs.length - 1].date;

    // Check if we have enough data for the rolling window
    const requiredStartDate = fromDate.subtract(windowMonths, "month");
    if (requiredStartDate.isBefore(earliestDate)) {
      return NextResponse.json(
        {
          error: `Insufficient historical data. Need data from ${requiredStartDate.format("YYYY-MM-DD")} but earliest available is ${earliestDate.format("YYYY-MM-DD")}.`,
          earliestNAVDate: earliestDate.format("YYYY-MM-DD"),
          latestNAVDate: latestDate.format("YYYY-MM-DD"),
          requiredStartDate: requiredStartDate.format("YYYY-MM-DD"),
        },
        { status: 400 }
      );
    }

    if (toDate.isAfter(latestDate)) {
      return NextResponse.json(
        {
          error: "End date is beyond available data.",
          earliestNAVDate: earliestDate.format("YYYY-MM-DD"),
          latestNAVDate: latestDate.format("YYYY-MM-DD"),
        },
        { status: 400 }
      );
    }

    // Calculate rolling returns for every stepDays
    const rollingReturns = [];
    let currentDate = fromDate.clone();

    while (currentDate.isSameOrBefore(toDate, "day")) {
      // Find end NAV (current date)
      const endNavObj = findNavAtOrBefore(navs, currentDate);
      
      if (endNavObj) {
        // Calculate start date (window years ago)
        const startDate = currentDate.subtract(windowMonths, "month");
        const startNavObj = findNavAtOrBefore(navs, startDate);

        if (startNavObj && startNavObj.nav > 0) {
          const percentReturn = ((endNavObj.nav - startNavObj.nav) / startNavObj.nav) * 100;
          const annualizedReturn = cagr(startNavObj.nav, endNavObj.nav, windowYears) * 100;

          rollingReturns.push({
            endDate: endNavObj.date.format("YYYY-MM-DD"),
            startDate: startNavObj.date.format("YYYY-MM-DD"),
            startNav: startNavObj.nav,
            endNav: endNavObj.nav,
            percentReturn: Number(percentReturn.toFixed(2)),
            annualizedReturn: Number(annualizedReturn.toFixed(2)),
          });
        }
      }

      // Move to next step
      currentDate = currentDate.add(stepDays, "day");
    }

    if (rollingReturns.length === 0) {
      return NextResponse.json(
        { error: "No valid rolling returns could be calculated for the given period." },
        { status: 404 }
      );
    }

    // Calculate statistics
    const returns = rollingReturns.map(r => r.annualizedReturn);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const maxReturn = Math.max(...returns);
    const minReturn = Math.min(...returns);
    const positiveReturns = returns.filter(r => r > 0).length;
    const negativeReturns = returns.filter(r => r < 0).length;

    return NextResponse.json({
      window: window,
      windowYears: windowYears,
      analysisFrom: fromDate.format("YYYY-MM-DD"),
      analysisTo: toDate.format("YYYY-MM-DD"),
      totalDataPoints: rollingReturns.length,
      statistics: {
        averageReturn: Number(avgReturn.toFixed(2)),
        maxReturn: Number(maxReturn.toFixed(2)),
        minReturn: Number(minReturn.toFixed(2)),
        positiveReturns: positiveReturns,
        negativeReturns: negativeReturns,
        positivePercentage: Number(((positiveReturns / returns.length) * 100).toFixed(2)),
      },
      rollingReturns: rollingReturns,
    });

  } catch (err) {
    console.error("💥 Rolling Returns Series Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}
