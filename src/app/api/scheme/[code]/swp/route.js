// src/app/api/scheme/[code]/swp/route.js
import { NextResponse } from "next/server";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

import { fetchScheme, parseNavs, findNavOnOrBefore } from "../../helpers";

/**
 * POST body:
 * {
 * initialInvestment: Number,
 * amount: Number, // withdrawal amount per interval
 * frequency: "monthly"|"weekly"|"daily",
 * from: "YYYY-MM-DD",
 * to: "YYYY-MM-DD" (optional if `years` is provided),
 * years: Number (optional, used to calculate `to` date)
 * }
 */
export async function POST(request, context) {
  try {
    // Next.js 15+ requires awaiting context.params
    const { code } = await context.params;
    
    if (!code) {
      return NextResponse.json(
        { error: "Missing scheme code in route parameter." },
        { status: 400 }
      );
    } 
    
    const body = await request.json();

    const initialInvestment = Number(body.initialInvestment);
    const withdrawal = Number(body.amount);
    const frequency = body.frequency || "monthly";

    let fromInput = dayjs(body.from, "YYYY-MM-DD").startOf("day");
    let toInput = body.to ? dayjs(body.to, "YYYY-MM-DD").startOf("day") : null;

    if (body.years && !toInput) {
      toInput = fromInput.add(Number(body.years), "year");
    }

    if (!initialInvestment || !withdrawal || !fromInput.isValid() || !toInput || !toInput.isValid() || toInput.isBefore(fromInput, "day")) {
      return NextResponse.json({ error: "Invalid input: Check investment amount, withdrawal amount, date format (YYYY-MM-DD), years, or date range." }, { status: 400 });
    }

    const freqMap = {
      monthly: { unit: "month", step: 1 },
      weekly: { unit: "day", step: 7 },
      daily: { unit: "day", step: 1 }
    };
    const freq = freqMap[frequency];
    if (!freq) return NextResponse.json({ error: "Unsupported frequency" }, { status: 400 });

    const scheme = await fetchScheme(code);
    const navs = parseNavs(scheme);
    if (!navs.length) return NextResponse.json({ needs_review: true, error: "No valid NAV data available for this scheme." }, { status: 422 });

    const earliestNAVDate = navs[0].date;
    const latestNAVDate = navs[navs.length - 1].date;

    // ✅ Check if requested dates are within available NAV range
    if (fromInput.isBefore(earliestNAVDate, 'day') || toInput.isAfter(latestNAVDate, 'day')) {
      return NextResponse.json(
        {
          error: `Date Range Error: Requested dates are outside the scheme's NAV history.`,
          earliestNAVDate: earliestNAVDate.format("YYYY-MM-DD"),
          latestNAVDate: latestNAVDate.format("YYYY-MM-DD"),
          requestedFrom: fromInput.format("YYYY-MM-DD"),
          requestedTo: toInput.format("YYYY-MM-DD")
        },
        { status: 400 }
      );
    }

    let fromDate = fromInput;
    let toDate = toInput;

    // Initial units purchased at NAV on or before `from` date
    const initialNavObj = findNavOnOrBefore(navs, fromDate);
    if (!initialNavObj || !initialNavObj.nav || initialNavObj.nav <= 0) {
      return NextResponse.json({ error: "Could not find a valid NAV for the initial investment date." }, { status: 422 });
    }

    let totalUnits = initialInvestment / initialNavObj.nav;
    let totalWithdrawn = 0;
    const events = [];

    let cursor = fromDate;

    // The withdrawal starts from the first date in the range. 
    // We adjust the loop to stop when the cursor is *after* the toDate.
    while (cursor.isSameOrBefore(toDate, "day") && totalUnits > 0) {
      const navObj = findNavOnOrBefore(navs, cursor);

      if (navObj && navObj.nav && navObj.nav > 0) {
        // Amount to withdraw, capped by remaining units' value
        const withdrawAmount = withdrawal; 
        
        const unitsToSell = withdrawAmount / navObj.nav;
        const finalUnitsSold = Math.min(unitsToSell, totalUnits);

        // Calculate the actual amount received from the sale
        const actualWithdrawalAmount = finalUnitsSold * navObj.nav;

        totalUnits = Math.max(0, totalUnits - finalUnitsSold);
        totalWithdrawn += actualWithdrawalAmount;

        events.push({
          date: cursor.format("YYYY-MM-DD"),
          navDateUsed: navObj.date.format("YYYY-MM-DD"),
          nav: navObj.nav,
          unitsSold: Number(finalUnitsSold.toFixed(6)),
          amountReceived: Number(actualWithdrawalAmount.toFixed(2)),
          remainingUnits: Number(totalUnits.toFixed(6))
        });
      } else {
        events.push({
          date: cursor.format("YYYY-MM-DD"),
          nav: null,
          skipped: true,
          reason: "No NAV found on or before this date."
        });
      }

      // Move cursor to the next withdrawal date
      cursor = cursor.add(freq.step, freq.unit);
    }

    // Find the latest NAV for the final valuation
    const latestNavObj = findNavOnOrBefore(navs, toDate);

    // Use latest NAV available up to the end date, or fall back to the last NAV in the whole dataset
    const finalNav = latestNavObj ? latestNavObj.nav : navs[navs.length - 1].nav;
    const finalNavDate = latestNavObj ? latestNavObj.date.format("YYYY-MM-DD") : navs[navs.length - 1].date.format("YYYY-MM-DD");

    const currentValue = totalUnits * (finalNav ?? 0);
    
    // Total Gain/Loss = Current Value + Total Withdrawn - Initial Investment
    const totalGainLoss = currentValue + totalWithdrawn - initialInvestment;

    return NextResponse.json({
      initialInvestment,
      totalWithdrawn: Number(totalWithdrawn.toFixed(2)),
      totalGainLoss: Number(totalGainLoss.toFixed(2)),
      currentValue: Number(currentValue.toFixed(2)),
      remainingUnits: Number(totalUnits.toFixed(6)),
      finalNavDate: finalNavDate,
      finalNav: finalNav,
      events,
      initialNavDate: initialNavObj.date.format("YYYY-MM-DD"),
      dateRange: { from: fromDate.format("YYYY-MM-DD"), to: toDate.format("YYYY-MM-DD") },
      warnings: []
    });

  } catch (err) {
    console.error("POST /swp error:", err?.message || err);
    return NextResponse.json({ error: "Failed to calculate SWP: " + (err.message || "Unknown error") }, { status: 500 });
  }
}