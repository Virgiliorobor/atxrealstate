export function resolveListingImage(src: string): string {
  if (!src) return src;
  if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return src;

  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedSrc = src.startsWith("/") ? src.slice(1) : src;
  return `${normalizedBase}${normalizedSrc}`;
}

export const LISTING_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="#f3f7f5"/>
      <rect x="24" y="24" width="1152" height="752" fill="none" stroke="#0a0a0a" stroke-width="2"/>
      <text x="50%" y="48%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="36" fill="#0a0a0a">
        Image pending upload
      </text>
      <text x="50%" y="55%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#3a4a44">
        ATX Boutique Real Estate
      </text>
    </svg>`
  );
