// src/app/api/scheme/[code]/returns/route.js
import { NextResponse } from "next/server";
import dayjs from "dayjs";
import {
  fetchScheme,
  parseNavs,
  findNavOnOrBefore,
  findNavOnOrAfter,
} from "../../helpers";

export async function GET(request, context) {
  try {
    const { code } = await context.params;
    const url = new URL(request.url);
    const fromStr = url.searchParams.get("from");
    const toStr = url.searchParams.get("to");

    if (!fromStr || !toStr) {
      return NextResponse.json(
        { error: "Both 'from' and 'to' query parameters are required" },
        { status: 400 }
      );
    }

    // Normalize input dates for consistent comparison
    const fromDate = dayjs(fromStr, "YYYY-MM-DD").startOf("day");
    const toDate = dayjs(toStr, "YYYY-MM-DD").startOf("day");

    if (!fromDate.isValid() || !toDate.isValid()) {
      return NextResponse.json(
        { error: "Invalid 'from' or 'to' date format, use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const scheme = await fetchScheme(code);
    const navs = parseNavs(scheme);

    if (!navs.length) {
      return NextResponse.json(
        { error: "No valid NAV data available for calculation" },
        { status: 404 }
      );
    }

    // Find NAVs closest to the requested dates
    const startNAVObj = findNavOnOrAfter(navs, fromDate);
    const endNAVObj = findNavOnOrBefore(navs, toDate);

    if (
      !startNAVObj ||
      !endNAVObj ||
      startNAVObj.date.isAfter(endNAVObj.date, "day")
    ) {
      return NextResponse.json(
        {
          error:
            "Could not find valid NAVs within the requested date range, or the range is invalid.",
        },
        { status: 404 }
      );
    }

    // Calculate simple and annualized returns
    const simpleReturn = ((endNAVObj.nav - startNAVObj.nav) / startNAVObj.nav) * 100;
    const days = endNAVObj.date.diff(startNAVObj.date, "days");
    const years = days / 365.25;
    const annualizedReturn =
      years > 0 ? ((endNAVObj.nav / startNAVObj.nav) ** (1 / years) - 1) * 100 : 0;

    return NextResponse.json({
      startDate: startNAVObj.date.format("DD-MM-YYYY"),
      endDate: endNAVObj.date.format("DD-MM-YYYY"),
      startNAV: startNAVObj.nav,
      endNAV: endNAVObj.nav,
      simpleReturn,
      annualizedReturn,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error occurred during processing." },
      { status: 500 }
    );
  }
}

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
    const { from, to, period } = body;

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

    const scheme = await fetchScheme(code);
    const navs = parseNavs(scheme);

    if (!navs.length) {
      return NextResponse.json(
        { error: "No valid NAV data available for this scheme." },
        { status: 404 }
      );
    }

    const earliestDate = navs[0].date;
    const latestDate = navs[navs.length - 1].date;

    if (fromDate.isBefore(earliestDate) || toDate.isAfter(latestDate)) {
      return NextResponse.json(
        {
          error: "Date Range Error: Requested dates are outside the scheme's NAV history.",
          earliestNAVDate: earliestDate.format("YYYY-MM-DD"),
          latestNAVDate: latestDate.format("YYYY-MM-DD"),
          requestedFrom: fromDate.format("YYYY-MM-DD"),
          requestedTo: toDate.format("YYYY-MM-DD")
        },
        { status: 400 }
      );
    }

    // Calculate returns based on period
    const returns = [];
    
    if (period === "overall") {
      // Single overall return
      const startNAVObj = findNavOnOrAfter(navs, fromDate);
      const endNAVObj = findNavOnOrBefore(navs, toDate);

      if (startNAVObj && endNAVObj) {
        const simpleReturn = ((endNAVObj.nav - startNAVObj.nav) / startNAVObj.nav) * 100;
        const days = endNAVObj.date.diff(startNAVObj.date, "days");
        const years = days / 365.25;
        const annualizedReturn = years > 0 ? ((endNAVObj.nav / startNAVObj.nav) ** (1 / years) - 1) * 100 : 0;

        returns.push({
          period: "Overall",
          startDate: startNAVObj.date.format("DD-MM-YYYY"),
          endDate: endNAVObj.date.format("DD-MM-YYYY"),
          startNAV: startNAVObj.nav,
          endNAV: endNAVObj.nav,
          simpleReturn: Number(simpleReturn.toFixed(2)),
          annualizedReturn: Number(annualizedReturn.toFixed(2)),
          days: days
        });
      }
    } else {
      // Period-based returns (monthly, quarterly, yearly)
      let currentStart = fromDate.clone();
      let periodUnit, periodStep;

      switch (period) {
        case "monthly":
          periodUnit = "month";
          periodStep = 1;
          break;
        case "quarterly":
          periodUnit = "month";
          periodStep = 3;
          break;
        case "yearly":
          periodUnit = "year";
          periodStep = 1;
          break;
        default:
          periodUnit = "month";
          periodStep = 1;
      }

      while (currentStart.isBefore(toDate)) {
        const currentEnd = currentStart.add(periodStep, periodUnit).subtract(1, "day");
        const actualEnd = currentEnd.isAfter(toDate) ? toDate : currentEnd;

        const startNAVObj = findNavOnOrAfter(navs, currentStart);
        const endNAVObj = findNavOnOrBefore(navs, actualEnd);

        if (startNAVObj && endNAVObj && !startNAVObj.date.isAfter(endNAVObj.date)) {
          const simpleReturn = ((endNAVObj.nav - startNAVObj.nav) / startNAVObj.nav) * 100;
          const days = endNAVObj.date.diff(startNAVObj.date, "days");
          const years = days / 365.25;
          const annualizedReturn = years > 0 ? ((endNAVObj.nav / startNAVObj.nav) ** (1 / years) - 1) * 100 : 0;

          returns.push({
            period: `${startNAVObj.date.format("MMM YYYY")} - ${endNAVObj.date.format("MMM YYYY")}`,
            startDate: startNAVObj.date.format("DD-MM-YYYY"),
            endDate: endNAVObj.date.format("DD-MM-YYYY"),
            startNAV: startNAVObj.nav,
            endNAV: endNAVObj.nav,
            simpleReturn: Number(simpleReturn.toFixed(2)),
            annualizedReturn: Number(annualizedReturn.toFixed(2)),
            days: days
          });
        }

        currentStart = currentStart.add(periodStep, periodUnit);
      }
    }

    return NextResponse.json({
      period: period || "overall",
      returns: returns,
      totalPeriods: returns.length
    });

  } catch (err) {
    console.error("💥 Returns Analysis Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error: An unexpected issue occurred.", details: err.message },
      { status: 500 }
    );
  }
}
