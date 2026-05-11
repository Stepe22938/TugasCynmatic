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
  return "Rp " + price.toLocaleString("id-ID");
}
