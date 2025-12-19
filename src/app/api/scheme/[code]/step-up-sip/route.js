// src/app/api/scheme/[code]/step-up-sip/route.js
import { NextResponse } from "next/server";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

import {
  fetchScheme,
  parseNavs,
  findNavOnOrBefore,
  findNavOnOrAfter,
} from "../../helpers";

/**
 * POST /api/scheme/[code]/step-up-sip
 *
 * Request body:
 * {
 * "initialInvestment": number,
 * "from": "YYYY-MM-DD",
 * "to": "YYYY-MM-DD",
 * "stepUpType": "percentage" | "amount",
 * "stepUpValue": number,
 * "frequency": "monthly"
 * }
 */
export async function POST(request, context) {
  try {
    const routeParams = await context.params;
    const code = routeParams.code;

    if (!code) {
      return NextResponse.json(
        { error: "Missing scheme code in route parameter." },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid JSON. Ensure 'Content-Type: application/json' header is set.",
        },
        { status: 400 }
      );
    }

    const {
      initialInvestment,
      from,
      to,
      stepUpType = "percentage",
      stepUpValue = 10,
      frequency = "monthly",
    } = body || {};

    const firstSipAmount = Number(initialInvestment);
    if (!firstSipAmount || isNaN(firstSipAmount) || firstSipAmount <= 0) {
      return NextResponse.json(
        { error: "'initialInvestment' must be a positive number." },
        { status: 400 }
      );
    }

    if (!from || !to) {
      return NextResponse.json(
        { error: "Both 'from' and 'to' dates are required." },
        { status: 400 }
      );
    }

    const fromDate = dayjs(from, "YYYY-MM-DD");
    const toDate = dayjs(to, "YYYY-MM-DD");

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

    if (!Array.isArray(navs) || !navs.length) {
      return NextResponse.json(
        { error: "No valid NAV data available for this scheme." },
        { status: 404 }
      );
    }

    const earliestDate = navs[0].date.format("YYYY-MM-DD");
    const latestDate = navs[navs.length - 1].date.format("YYYY-MM-DD");

    if (fromDate.isBefore(navs[0].date) || toDate.isAfter(navs[navs.length - 1].date)) {
      return NextResponse.json(
        {
          error: "Date Range Error: Requested dates are outside the scheme's NAV history.",
          earliestNAVDate: earliestDate,
          latestNAVDate: latestDate,
          requestedFrom: fromDate.format("YYYY-MM-DD"),
          requestedTo: toDate.format("YYYY-MM-DD")
        },
        { status: 400 }
      );
    }

    // ========================
    // Step-Up SIP Calculation
    // ========================
    let sipAmount = firstSipAmount;
    let totalInvested = 0;
    let totalUnits = 0;
    let sipCount = 0;
    let stepUpAppliedTimes = 0;

    let currentDate = fromDate.clone().startOf("day");

    while (currentDate.isSameOrBefore(toDate, "day")) {
      const navObj = findNavOnOrAfter(navs, currentDate);

      if (!navObj || navObj.nav <= 0) {
        return NextResponse.json(
          {
            error: `No valid NAV found on or after date ${currentDate.format("YYYY-MM-DD")} for investment.`,
            availableFrom: earliestDate,
            availableTo: latestDate,
          },
          { status: 404 }
        );
      }

      totalInvested += sipAmount;
      totalUnits += sipAmount / navObj.nav;
      sipCount++;

      // Step-Up: Apply monthly starting from 2nd SIP
      if (sipCount > 1) {
        stepUpAppliedTimes++;
        if (stepUpType === "percentage") {
          sipAmount = sipAmount * (1 + stepUpValue / 100);
        } else if (stepUpType === "amount") {
          sipAmount += stepUpValue;
        }
      }

      // Move to next month
      currentDate = currentDate.add(1, "month");
    }

    // Final Valuation
    const endNAVObj = findNavOnOrBefore(navs, toDate);
    if (!endNAVObj || endNAVObj.nav <= 0) {
      return NextResponse.json(
        {
          error: "No valid NAV data found near the end date for final valuation.",
          availableFrom: earliestDate,
          availableTo: latestDate,
        },
        { status: 404 }
      );
    }

    const currentValue = totalUnits * endNAVObj.nav;
    const totalGainLoss = currentValue - totalInvested;
    const simpleReturn = (totalGainLoss / totalInvested) * 100;

    // Response
    return NextResponse.json({
      startDate: fromDate.format("DD-MM-YYYY"),
      endDate: endNAVObj.date.format("DD-MM-YYYY"),
      totalInvested: Number(totalInvested.toFixed(2)),
      totalUnits: Number(totalUnits.toFixed(6)),
      currentValue: Number(currentValue.toFixed(2)),
      totalGainLoss: Number(totalGainLoss.toFixed(2)),
      simpleReturn: Number(simpleReturn.toFixed(2)),
      stepUpType,
      stepUpValue: Number(stepUpValue.toFixed(2)),
      stepUpAppliedTimes,
      totalSIPs: sipCount,
      lastSIPAmount: Number(sipAmount.toFixed(2)),
      availableNAVRange: {
        from: Math.min(...navs.map(n => n.nav)),
        to: Math.max(...navs.map(n => n.nav)),
      },
    });
  } catch (err) {
    console.error("💥 Step-Up SIP Internal Error:", err);
    return NextResponse.json(
      {
        error:
          "Internal Server Error: An unexpected issue occurred during calculation.",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
