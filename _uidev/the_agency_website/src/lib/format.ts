export function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPricePerSqft(n: number): string {
  return `$${n.toLocaleString("en-US")}/sqft`;
}

export function streetOnly(fullAddress: string): string {
  const part = fullAddress.split(",")[0];
  return part?.trim() ?? fullAddress;
}

export function zipFromAddress(fullAddress: string): string | null {
  const m = fullAddress.match(/\b(\d{5})(?:-\d{4})?\b/);
  return m?.[1] ?? null;
}
