/**
 * formatDate.ts
 * Utilitas untuk memformat string tanggal ISO ke format lokal (Indonesia).
 */
export function formatDate(isoString: string): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (error) {
    console.error("Format date error:", error);
    return isoString;
  }
}
