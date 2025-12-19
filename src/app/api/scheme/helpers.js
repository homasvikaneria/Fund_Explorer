// // src/app/api/scheme/helpers.js
// import axios from "axios";
// import dayjs from "dayjs";
// import customParseFormat from "dayjs/plugin/customParseFormat";
// import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

// dayjs.extend(customParseFormat);
// dayjs.extend(isSameOrBefore);

// // --- UTILITY FUNCTIONS ---

// /**
//  * Calculates the Compound Annual Growth Rate (CAGR).
//  * @param {number} beginningValue - The starting value.
//  * @param {number} endingValue - The ending value.
//  * @param {number} years - The number of years in the period.
//  * @returns {number} The CAGR (as a decimal, e.g., 0.10 for 10%).
//  */
// export function cagr(beginningValue, endingValue, years) {
//   if (years <= 0 || beginningValue <= 0 || endingValue <= 0) return 0;
//   // Formula: ((Ending Value / Beginning Value) ^ (1 / Years)) - 1
//   return Math.pow(endingValue / beginningValue, 1 / years) - 1;
// }

// // --- FETCHING AND PARSING ---

// /**
//  * Fetch scheme (no cache)
//  * returns the raw response object from mfapi.in
//  */
// export async function fetchScheme(code) {
//   const url = `https://api.mfapi.in/mf/${code}`;
//   const res = await axios.get(url, { timeout: 10000 });
//   return res.data;
// }

// /**
//  * Convert scheme.data to array of { date: dayjs, nav: number, rawDate }
//  */
// export function parseNavs(scheme) {
//   if (!scheme || !scheme.data) return [];
//   return scheme.data
//     .map((d) => {
//       const date = dayjs(d.date, "DD-MM-YYYY").startOf("day");
//       let nav = d.nav === "-" || d.nav === "" ? null : parseFloat(String(d.nav).replace(/,/g, ""));
//       return {
//         rawDate: d.date,
//         date: date,
//         nav: nav,
//       };
//     })
//     .filter((d) => d.date.isValid() && typeof d.nav === "number" && !isNaN(d.nav))
//     .reverse(); // ascending (oldest first)
// }

// // --- DATE/NAV FINDING UTILITIES ---

// /**
//  * Parses a date string in DD-MM-YYYY, DD/MM/YYYY, or YYYY-MM-DD format and returns a dayjs object.
//  */
// export function parseDate(dateStr) {
//   if (!dateStr) return null;

//   const formats = ["DD-MM-YYYY", "DD/MM/YYYY", "YYYY-MM-DD"];
//   for (const format of formats) {
//     const d = dayjs(dateStr, format, true).startOf("day");
//     if (d.isValid()) return d;
//   }
//   return null;
// }

// /**
//  * Finds the NAV entry whose date is at or immediately before the target date.
//  */
// export function findNavAtOrBefore(navs, targetDayjs) {
//   let found = null;
//   for (const nav of navs) {
//     if (nav.date.isSameOrBefore(targetDayjs, "day")) {
//       found = nav;
//     } else {
//       break;
//     }
//   }
//   return found;
// }

// /**
//  * Calculates the target start date for a given interval, relative to the end date.
//  */
// export function calculateStartTarget(endDate, spec) {
//     if (spec.days > 0) {
//         return endDate.subtract(spec.days, 'day');
//     }
//     return endDate.subtract(spec.months, 'month');
// }


// src/app/api/scheme/helpers.js

import axios from "axios";

import dayjs from "dayjs";

import customParseFormat from "dayjs/plugin/customParseFormat";

import isSameOrBefore from "dayjs/plugin/isSameOrBefore";



dayjs.extend(customParseFormat);

dayjs.extend(isSameOrBefore);



// --- UTILITY FUNCTIONS ---



/**

 * Calculates the Compound Annual Growth Rate (CAGR).

 * @param {number} beginningValue - The starting value.

 * @param {number} endingValue - The ending value.

 * @param {number} years - The number of years in the period.

 * @returns {number} The CAGR (as a decimal, e.g., 0.10 for 10%).

 */

export function cagr(beginningValue, endingValue, years) {

  if (years <= 0 || beginningValue <= 0 || endingValue <= 0) return 0;

  // Formula: ((Ending Value / Beginning Value) ^ (1 / Years)) - 1

  return Math.pow(endingValue / beginningValue, 1 / years) - 1;

}



// --- FETCHING AND PARSING ---



/**

 * Fetch scheme (no cache)

 * returns the raw response object from mfapi.in

 */

export async function fetchScheme(code) {
  const url = `https://api.mfapi.in/mf/${code}`;
  try {
    const res = await axios.get(url, { 
      timeout: 60000, // 60 seconds
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    return res.data;
  } catch (error) {
    console.error(`Error fetching scheme ${code}:`, error.message);
    throw error;
  }
}



/**

 * Convert scheme.data to array of { date: dayjs, nav: number, rawDate }

 */

export function parseNavs(scheme) {

  if (!scheme || !scheme.data) return [];

  return scheme.data

    .map((d) => {

      const date = dayjs(d.date, "DD-MM-YYYY").startOf("day");

      let nav = d.nav === "-" || d.nav === "" ? null : parseFloat(String(d.nav).replace(/,/g, ""));

      return {

        rawDate: d.date,

        date: date,

        nav: nav,

      };

    })

    .filter((d) => d.date.isValid() && typeof d.nav === "number" && !isNaN(d.nav))

    .reverse(); // ascending (oldest first)

}



// --- DATE/NAV FINDING UTILITIES ---



/**

 * Parses a date string in DD-MM-YYYY, DD/MM/YYYY, or YYYY-MM-DD format and returns a dayjs object.

 */

export function parseDate(dateStr) {

  if (!dateStr) return null;



  const formats = ["DD-MM-YYYY", "DD/MM/YYYY", "YYYY-MM-DD"];

  for (const format of formats) {

    const d = dayjs(dateStr, format, true).startOf("day");

    if (d.isValid()) return d;

  }

  return null;

}



/**

 * Finds the NAV entry whose date is at or immediately before the target date.

 */

export function findNavAtOrBefore(navs, targetDayjs) {

  let found = null;

  for (const nav of navs) {

    if (nav.date.isSameOrBefore(targetDayjs, "day")) {

      found = nav;

    } else {

      break;

    }

  }

  return found;

}



/**

 * Calculates the target start date for a given interval, relative to the end date.

 */

export function calculateStartTarget(endDate, spec) {

  if (spec.days > 0) {

    return endDate.subtract(spec.days, 'day');

  }

  return endDate.subtract(spec.months, 'month');

}



// Alias for compatibility with other routes

export function findNavOnOrBefore(navs, targetDayjs) {

  return findNavAtOrBefore(navs, targetDayjs);

}



/**

 * Find NAV on or after given dayjs date (closest to start date).

 */

export function findNavOnOrAfter(navs, targetDayjs) {

  for (let i = 0; i < navs.length; i++) {

    const n = navs[i];

    if (!n.date || n.nav == null || !n.date.isValid()) continue;



    if (n.date.isSame(targetDayjs, "day") || n.date.isAfter(targetDayjs, "day")) {

      return n;

    }

  }

  return null;

}