// Shared brand-color helpers used by the candidate recording page (/r) and the
// sponsored recruiter pitch page (/v) — one implementation so both surfaces
// tint identically.

// App-wide brand fallbacks — mirror the employer console defaults so a role (or
// a sponsored video whose role was deleted) with null colors still renders
// on-brand. brand_color = primary (buttons/accents), accent_color = headings/borders.
export const DEFAULT_BRAND_COLOR = "#0A66C2";
export const DEFAULT_ACCENT_COLOR = "#1A1A2E";

// Parse a #rgb / #rrggbb brand color into channels so we can lay a low-opacity
// wash over white for the page background.
export function hexToRgb(hex) {
  const h = (hex || "").replace("#", "");
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(n)) return { r: 26, g: 26, b: 46 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Pick a legible text color (near-black or white) for a given background by its
// perceived brightness — a light brand color (e.g. cyan #14d4e1) needs dark text.
export function readableTextOn(hex) {
  const { r, g, b } = hexToRgb(hex);
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  return brightness > 0.6 ? "#1A1A2E" : "#ffffff";
}
