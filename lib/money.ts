// Prices as published, in the organisation's currency (never converted or averaged).
export function formatPrice(amount: number, currency = "AUD"): string {
  const symbol = currency === "AUD" ? "A$" : currency === "NZD" ? "NZ$" : `${currency} `;
  return `${symbol}${amount.toLocaleString("en-AU", { maximumFractionDigits: 0 })}`;
}
