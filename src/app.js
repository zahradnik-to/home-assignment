'use strict';
const API_URL = 'https://api.ecommerce.com/products'
const MIN_RANGE = 0;
const MAX_RANGE = 100000;
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

  do {
    const result = await getProducts({ minPrice: min + minOffset, maxPrice: max });
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
  } while (count < total)
  return products;
}

/**
 * Fetches product from api.
 * @param params {{minPrice: number, maxPrice: number}}
 * @return {Promise<any>}
 */
async function getProducts(params) {
  const urlParams = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}?${urlParams}`);
  if (!response.ok) {
    throw new Error("An unexpected error occurred while fetching products.");
  }
  return await response.json();
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
  console.log(`Found total of ${products.length} products.`)
})();