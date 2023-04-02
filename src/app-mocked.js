'use strict';
const {mockResponses} = require("./mock-responses.js")

const MIN_RANGE = 0;
const MAX_RANGE = 100;
const API_LIMIT = 1000;

async function scrape() {
  let products = [];
  let count = 0;
  let total = 0;
  const intervalMap = new Map();
  const minOffset = 1; // Added to min value to offset it from previous interval's max value during api calls
  let min = MIN_RANGE - minOffset; // Minus offset to compensate during first call
  let max = MAX_RANGE;
  let isFirstRun = true;

  let iterationCount = 0;

  do {
    const result = await getProductsMock(
        { minPrice: min + minOffset, maxPrice: max },
        iterationCount);
    if (isFirstRun) {
      total = result.total;
      isFirstRun = false;
    }

    if (isApiLimitReached(result.count)) {
      // Split current interval into two smaller ones
      const oldMax = max;
      max = getMiddleValue(min, max);
      intervalMap.set(min, max); // Save first smaller interval
      intervalMap.set(max, oldMax) // Save second smaller interval
    } else {
      // Add found products to array and update found count
      products = products.concat(result.products);
      count += result.count;

      // Move to the next interval
      min = max;
      max = intervalMap.get(max);
    }

    iterationCount++;
  } while (count < total)

  return products;
}

/**
 * Fetches product from api.
 * @param params {{minPrice: number, maxPrice: number}}
 * @param iterationCount {number}
 * @return {Promise<any>}
 */
async function getProductsMock(params, iterationCount) {
  console.log(`Get products ${JSON.stringify(params)}`)
  return mockResponses[iterationCount];
}

/**
 * Returns rounded middle value from provided interval.
 * @param max
 * @param min
 * @return {number}
 */
function getMiddleValue(min, max) {
  return Math.round((max - min) / 2) + min;
}

/**
 * Returns true when fetched item count is below api limit.
 * @param count
 * @return {boolean}
 */
function isApiLimitReached(count) {
  return count >= API_LIMIT;
}

// Executing await function on from top-level
(async () => {
  const products = await scrape();
  console.log(`Found total of ${products.length} products. ${JSON.stringify(products)}`)
})();
