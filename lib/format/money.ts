/**
 * Formats prices the way Cambodian shops write them: "$15.00" for USD and
 * "60,000៛" for riel (no decimals). Latin digits in both UI languages, as on
 * receipts and price tags.
 */
export function formatMoney(amount: number, currency: string): string {
  if (currency === "KHR") {
    return `${Math.round(amount).toLocaleString("en-US")}៛`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}
