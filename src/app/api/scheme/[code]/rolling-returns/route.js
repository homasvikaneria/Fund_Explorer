import { 
    fetchScheme, 
    parseNavs, 
    findNavAtOrBefore, 
    parseDate, 
    cagr,
    calculateStartTarget
} from "../../helpers.js";

export async function POST(req, context) {
    let body;
    try {
        // Step 1: Read the request body
        try {
            body = await req.json();
        } catch (e) {
            return new Response(JSON.stringify({ error: "Invalid JSON body provided" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        // Step 2: Extract inputs
        const code = body.code;
        const onDateStr = body.on;
        const annualize = (String(body.annualize) || "false").toLowerCase() === "true";
        const intervalKey = body.interval?.toLowerCase(); // normalize (e.g., "2year")
        // const series = body.series; // optional, currently unused

        if (!code) {
            return new Response(JSON.stringify({ error: "code parameter required in JSON body" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const onDate = onDateStr ? parseDate(onDateStr) : null; 
        if (onDateStr && !onDate) {
            return new Response(JSON.stringify({ error: `Invalid date format for 'on' parameter: ${onDateStr}. Please use DD-MM-YYYY or YYYY-MM-DD.` }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        // Step 3: Fetch NAV history
        const json = await fetchScheme(code);
        if (!json || json.error) return new Response(JSON.stringify({ error: json.error || "no NAV data available" }), { status: 404, headers: { "Content-Type": "application/json" } });
        const history = parseNavs(json);
        if (history.length < 1) return new Response(JSON.stringify({ error: "insufficient NAV history" }), { status: 404, headers: { "Content-Type": "application/json" } });

        const firstNav = history[0];
        const lastNav = history[history.length - 1];
        const firstNavDate = firstNav.date;
        const lastNavDate = lastNav.date;

        // Step 4: Check if date is within range
        if (onDate && onDate.isAfter(lastNavDate, 'day')) {
            return new Response(JSON.stringify({ 
                error: `Scheme data range: ${firstNavDate.format("YYYY-MM-DD")} to ${lastNavDate.format("YYYY-MM-DD")}. Data is not available for ${onDate.format("YYYY-MM-DD")}.`,
                dataRangeStart: firstNavDate.format("YYYY-MM-DD"),
                dataRangeEnd: lastNavDate.format("YYYY-MM-DD"),
                requestedDate: onDate.format("YYYY-MM-DD")
            }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        // Step 5: Define base intervals (common ones)
        const intervals = {
            day: { label: "day", months: 0, days: 1, years: 0 },
            month: { label: "month", months: 1, days: 0, years: 0 },
            "1year": { label: "1year", months: 12, days: 0, years: 1 },
            "3year": { label: "3year", months: 36, days: 0, years: 3 },
            "5year": { label: "5year", months: 60, days: 0, years: 5 }
        };

        // Step 6: Add dynamic support for odd/custom year intervals like "2year", "4year", etc.
        const matchCustom = /^(\d+)year$/.exec(intervalKey || "");
        if (matchCustom) {
            const customYears = parseInt(matchCustom[1], 10);
            if (!intervals[intervalKey]) {
                intervals[intervalKey] = { label: intervalKey, months: customYears * 12, days: 0, years: customYears };
            }
        }

        // Step 7: Determine end NAV point
        let endPoint;
        let dateAdjusted = false;

        if (onDate) {
            endPoint = findNavAtOrBefore(history, onDate);
            if (!endPoint) {
                return new Response(JSON.stringify({ error: "no NAV on or before provided 'on' date within scheme history" }), { status: 404, headers: { "Content-Type": "application/json" } });
            }
            if (!onDate.isSame(endPoint.date, 'day')) {
                dateAdjusted = true;
            }
        } else {
            endPoint = lastNav;
        }

        // Step 8: Determine which intervals to calculate
        const allIntervalKeys = Object.keys(intervals);
        const keysToCalculate = intervalKey && allIntervalKeys.includes(intervalKey)
            ? [intervalKey]
            : allIntervalKeys;

        // Step 9: Compute rolling returns
        const results = {};
        for (const key of keysToCalculate) {
            const spec = intervals[key];
            const startTarget = calculateStartTarget(endPoint.date, spec);
            const startPoint = findNavAtOrBefore(history, startTarget);

            if (!startPoint || startPoint.date.isSame(endPoint.date, 'day') || startPoint.date.isAfter(endPoint.date, 'day')) {
                results[key] = { 
                    error: "insufficient data for interval", 
                    startTarget: startTarget.format("YYYY-MM-DD") 
                };
                continue;
            }

            const startNav = startPoint.nav;
            const endNav = endPoint.nav;
            if (startNav === 0) {
                results[key] = { error: "NAV at start date is zero, cannot calculate percentage return" };
                continue;
            }

            const absoluteChange = Number((endNav - startNav).toFixed(6));
            const percentChange = Number(((endNav - startNav) / startNav * 100).toFixed(6));
            const annualizedPercent = (annualize && spec.years > 0)
                ? Number((cagr(startNav, endNav, spec.years) * 100).toFixed(6))
                : null;

            results[key] = {
                startDate: startPoint.rawDate,
                endDate: endPoint.rawDate,
                startNav,
                endNav,
                absoluteChange,
                percentChange,
                annualizedPercent
            };
        }

        // Step 10: Build final response
        const payload = {
            code,
            ...(dateAdjusted && { 
                requestedDate: onDate.format("YYYY-MM-DD"), 
                dateAdjustedTo: endPoint.date.format("YYYY-MM-DD"),
                notice: "NAV not available for requested date. Calculation adjusted to the nearest prior NAV date."
            }),
            endDateUsed: endPoint.rawDate,
            results
        };

        return new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (err) {
        console.error("rollingreturn error:", err);
        return new Response(JSON.stringify({ error: "internal error", details: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
