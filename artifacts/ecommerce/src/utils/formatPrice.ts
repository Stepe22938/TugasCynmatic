/**
 * formatPrice.ts
 * Utility function to format numbers into IDR currency strings.
 */

/**
 * Formats number to Indonesian Rupiah format, e.g. 299000 → "Rp 299.000"
 * @param {number} price - The numerical price
 * @returns {string} Formatted IDR price string
 */
export function formatPrice(price: number): string {
  if (price === undefined || price === null) return "Rp 0";
  const absPrice = Math.abs(price);
  if (absPrice >= 1e15) {
    return (price < 0 ? "-" : "") + "Rp " + price.toExponential(2).replace("e+", " x 10^");
  }
  return "Rp " + price.toLocaleString("id-ID");
}
