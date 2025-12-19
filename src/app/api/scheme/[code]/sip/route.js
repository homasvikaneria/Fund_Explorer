import { NextResponse } from "next/server";
import dayjs from "dayjs";
import {
    fetchScheme,
    parseNavs,
    findNavOnOrBefore,
    findNavOnOrAfter, // findNavOnOrAfter is used for the start date (from) check
    cagr, // Imported for annualized return calculation
} from "../../helpers"; // Assumes helpers.js is one level up

// Helper function to calculate the next installment date accurately
const getNextInstallmentDate = (currentDate, frequency) => {
    const freq = frequency.toLowerCase();
    
    if (freq === 'monthly') return currentDate.add(1, 'month');
    if (freq === 'quarterly') return currentDate.add(3, 'month');
    if (freq === 'halfyearly') return currentDate.add(6, 'month');
    if (freq === 'yearly') return currentDate.add(1, 'year');
    
    // Default to monthly if invalid, although validation prevents this
    return currentDate.add(1, 'month'); 
}


/**
 * POST /api/scheme/[code]/sip
 *
 * Request body:
 * {
 * "amount": number,             // SIP amount per installment
 * "frequency": string,          // "monthly", "quarterly", "halfyearly", or "yearly"
 * "from": "YYYY-MM-DD",         // Start date
 * "to": "YYYY-MM-DD"            // End date
 * }
 */
export async function POST(request, context) {
    try {
        // 1️⃣ Get the route params (await for Next.js 15)
        const params = await context.params;
        const code = params?.code;
        if (!code) {
            return NextResponse.json(
                { error: "Missing scheme code in route parameter." },
                { status: 400 }
            );
        }

        // 2️⃣ Parse the body safely
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON format in request body. Ensure 'Content-Type: application/json'." },
                { status: 400 }
            );
        }

        const { amount, frequency, from, to } = body || {};

        // 3️⃣ Validate inputs
        const sipAmount = Number(amount);
        const freq = (frequency || "").toLowerCase();
        const validFrequencies = ["monthly", "quarterly", "halfyearly", "yearly"];

        if (isNaN(sipAmount) || sipAmount <= 0) {
            return NextResponse.json(
                { error: "Validation Failed: 'amount' must be a positive number." },
                { status: 400 }
            );
        }
        if (!freq || !validFrequencies.includes(freq)) {
            return NextResponse.json(
                { error: `Validation Failed: 'frequency' must be one of: ${validFrequencies.join(', ')}.` },
                { status: 400 }
            );
        }
        if (!from || !to) {
            return NextResponse.json(
                { error: "Validation Failed: Both 'from' and 'to' dates are required (YYYY-MM-DD)." },
                { status: 400 }
            );
        }

        const fromDate = dayjs(from, "YYYY-MM-DD").startOf("day");
        const toDate = dayjs(to, "YYYY-MM-DD").startOf("day");

        if (!fromDate.isValid() || !toDate.isValid()) {
             // We can rely on parseDate from helpers, but the provided code used dayjs(string, format)
            return NextResponse.json(
                { error: "Validation Failed: Invalid date format. Please use YYYY-MM-DD." },
                { status: 400 }
            );
        }
        if (toDate.isBefore(fromDate)) {
            return NextResponse.json(
                { error: "Validation Failed: 'to' date cannot be before 'from' date." },
                { status: 400 }
            );
        }

        // 4️⃣ Fetch and Validate Scheme Data
        const scheme = await fetchScheme(code);
        const navs = parseNavs(scheme);

        if (!Array.isArray(navs) || navs.length < 2) {
            return NextResponse.json(
                { error: "NAV Data Error: Insufficient valid NAV data available for this scheme." },
                { status: 404 }
            );
        }

        const earliestNAVDate = navs[0].date;
        const latestNAVDate = navs[navs.length - 1].date;

        // Check if requested dates are outside the scheme's history range
        if (fromDate.isBefore(earliestNAVDate, 'day') || toDate.isAfter(latestNAVDate, 'day')) {
            return NextResponse.json(
                { 
                    error: `Date Range Error: Requested period is outside the scheme's history.`,
                    schemeHistoryStart: earliestNAVDate.format("YYYY-MM-DD"),
                    schemeHistoryEnd: latestNAVDate.format("YYYY-MM-DD"),
                    requestedFrom: fromDate.format("YYYY-MM-DD"),
                    requestedTo: toDate.format("YYYY-MM-DD")
                },
                { status: 400 }
            );
        }

        // 5️⃣ SIP CALCULATION CORE LOGIC
        let totalInvested = 0;
        let totalUnits = 0;
        let installmentCount = 0;
        let firstInvestmentDate = null;
        
        let currentDate = fromDate;

        // Loop through all potential installment dates
        while (currentDate.isSameOrBefore(toDate, 'day')) {
            // Find the NAV on or immediately before the installment date
            const transactionNAVObj = findNavOnOrBefore(navs, currentDate);

            if (transactionNAVObj && transactionNAVObj.nav > 0) {
                const units = sipAmount / transactionNAVObj.nav;
                totalInvested += sipAmount;
                totalUnits += units;
                installmentCount++;

                if (!firstInvestmentDate) {
                    firstInvestmentDate = transactionNAVObj.date;
                }
            }
            
            // Advance to the next installment date
            currentDate = getNextInstallmentDate(currentDate, freq);
        }

        // 6️⃣ Final Valuation and Returns Calculation
        
        // Find the final NAV on or before the 'to' date
        const finalNAVObj = findNavOnOrBefore(navs, toDate); 
        
        if (!finalNAVObj || totalUnits === 0 || totalInvested === 0) {
            return NextResponse.json(
                { error: "Calculation Error: No successful installments found within the period." },
                { status: 404 }
            );
        }

        const finalNAV = finalNAVObj.nav;
        const currentValue = totalUnits * finalNAV;
        const totalGainLoss = currentValue - totalInvested;
        const simpleReturn = (totalGainLoss / totalInvested) * 100;
        
        // Calculate the investment period for CAGR (from first installment to end valuation)
        const daysHeld = finalNAVObj.date.diff(firstInvestmentDate, 'days');
        const investmentPeriodInYears = daysHeld / 365.25;

        // Use the cagr helper function for the annualized return
        const annualizedReturn = 
            investmentPeriodInYears > 0 
            ? cagr(totalInvested, currentValue, investmentPeriodInYears) * 100
            : 0; // Note: This CAGR is an approximation, but uses the helper function.

        // 7️⃣ Return Success Response
        return NextResponse.json({
            meta: {
                schemeCode: code,
                frequency: freq,
                installments: installmentCount,
                firstInstallmentDate: firstInvestmentDate.format("DD-MM-YYYY"),
                lastValuationDate: finalNAVObj.date.format("DD-MM-YYYY")
            },
            summary: {
                sipAmount: Number(sipAmount.toFixed(2)),
                totalInvested: Number(totalInvested.toFixed(2)),
                totalUnits: Number(totalUnits.toFixed(6)),
                currentValue: Number(currentValue.toFixed(2)),
                totalGainLoss: Number(totalGainLoss.toFixed(2)),
                simpleReturn: Number(simpleReturn.toFixed(2)),
                annualizedReturn: Number(annualizedReturn.toFixed(2)), 
            }
        });

    } catch (err) {
        console.error("SIP POST Uncaught Error:", err);
        
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
                error: "Internal Server Error: An unexpected error occurred.",
                details: err.message || String(err)
            },
            { status: 500 }
        );
    }
}