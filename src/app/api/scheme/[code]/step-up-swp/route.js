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
 * POST /api/scheme/[code]/step-up-swp
 *
 * Request body:
 * {
 * "initialCorpus": number, // NEW: Required starting investment to fund the SWP
 * "initialWithdrawal": number,
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
        { error: "Invalid JSON. Ensure 'Content-Type: application/json' header is set." },
        { status: 400 }
      );
    }

    const {
      initialCorpus,
      initialWithdrawal,
      from,
      to,
      stepUpType = "percentage",
      stepUpValue = 10,
      frequency = "monthly", // Currently only supports monthly logic
    } = body;

    const initialInvestment = Number(initialCorpus);
    const firstWithdrawal = Number(initialWithdrawal);
    
    // 3. Validation
    if (!initialInvestment || initialInvestment <= 0) {
      return NextResponse.json(
        { error: "'initialCorpus' (starting investment) must be a positive number." },
        { status: 400 }
      );
    }
    if (!firstWithdrawal || firstWithdrawal <= 0) {
      return NextResponse.json(
        { error: "'initialWithdrawal' must be a positive number." },
        { status: 400 }
      );
    }

    if (!from || !to) {
      return NextResponse.json(
        { error: "Both 'from' and 'to' dates are required." },
        { status: 400 }
      );
    }

    const fromDate = dayjs(from, "YYYY-MM-DD").startOf('day');
    const toDate = dayjs(to, "YYYY-MM-DD").startOf('day');

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

    // 4. Fetch NAVs
    const scheme = await fetchScheme(code);
    const navs = parseNavs(scheme);

    if (!navs || !navs.length) {
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
    
    // Find initial NAV for unit purchase
    const initialNAVObj = findNavOnOrAfter(navs, fromDate);
    if (!initialNAVObj || initialNAVObj.nav <= 0) {
        return NextResponse.json(
            { error: `Could not find valid NAV on or after start date ${fromDate.format("YYYY-MM-DD")} to fund the corpus.` },
            { status: 404 }
        );
    }
    
    // --- Step-Up SWP Initialization ---
    
    let remainingUnits = initialInvestment / initialNAVObj.nav;
    let swpAmount = firstWithdrawal;
    let totalWithdrawn = 0;
    let swpCount = 0;
    
    // We start the withdrawal on the month of the `from` date
    let currentDate = fromDate.clone();
    
    // 5. Withdrawal Loop
    while (currentDate.isSameOrBefore(toDate, "day") && remainingUnits > 0) {
      const navObj = findNavOnOrAfter(navs, currentDate);
      
      // If NAV is missing or zero on a withdrawal date, we must stop or skip. 
      // We choose to stop the calculation, as unit valuation is impossible.
      if (!navObj || navObj.nav <= 0) {
          // Note: The loop will continue if NAV is missing until it hits the end date, 
          // but we cannot process this particular withdrawal. A more complex system might skip.
          // For simplicity, we assume continuous NAVs in the range. If a NAV is missing, we stop here.
          break;
      }

      // Calculate units required for the target withdrawal amount
      const unitsRequired = swpAmount / navObj.nav;
      
      // Unit exhaustion check (the core fix)
      const unitsSold = Math.min(unitsRequired, remainingUnits);
      
      // Calculate actual withdrawal amount based on units sold
      const actualWithdrawal = unitsSold * navObj.nav;

      remainingUnits -= unitsSold;
      totalWithdrawn += actualWithdrawal;

      swpCount++;

      // Step-up logic: Check if 12 SWPs have been made since the last step-up
      if (swpCount > 0 && swpCount % 12 === 0) {
        if (stepUpType === "percentage") {
          swpAmount = Math.round(swpAmount * (1 + stepUpValue / 100));
        } else if (stepUpType === "amount") {
          swpAmount += stepUpValue;
        }
      }
      
      // Move to next month
      currentDate = currentDate.add(1, "month");
    }

    // 6. Final Valuation
    const endNAVObj = findNavOnOrBefore(navs, toDate);
    if (!endNAVObj || endNAVObj.nav <= 0) {
      return NextResponse.json(
        { 
            error: "No valid NAV data found near the end date for final valuation.", 
            availableFrom: earliestDate, 
            availableTo: latestDate 
        },
        { status: 404 }
      );
    }

    const remainingValue = remainingUnits * endNAVObj.nav;
    
    // Total Gain/Loss calculation for SWP:
    // (Total Withdrawn + Remaining Value) - Initial Investment
    const totalGainLoss = (totalWithdrawn + remainingValue) - initialInvestment;

    const simpleReturn = (totalGainLoss / initialInvestment) * 100;
    
    // Final Response
    return NextResponse.json({
      initialCorpus: Number(initialInvestment.toFixed(2)),
      startDate: fromDate.format("DD-MM-YYYY"),
      endDate: endNAVObj.date.format("DD-MM-YYYY"),
      totalWithdrawn: Number(totalWithdrawn.toFixed(2)),
      remainingUnits: Number(remainingUnits.toFixed(6)),
      remainingValue: Number(remainingValue.toFixed(2)),
      totalGainLoss: Number(totalGainLoss.toFixed(2)),
      simpleReturn: Number(simpleReturn.toFixed(2)),
      stepUpType,
      stepUpValue: Number(stepUpValue.toFixed(2)),
      stepUpAppliedTimes: Math.floor(swpCount / 12),
      totalSWPs: swpCount,
      lastSWPAmount: Number(swpAmount.toFixed(2)),
      availableNAVRange: { from: earliestDate, to: latestDate },
    });

  } catch (err) {
    console.error("💥 Step-Up SWP Internal Error:", err);
    return NextResponse.json(
      {
        error: "Internal Server Error: An unexpected issue occurred during calculation.",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
