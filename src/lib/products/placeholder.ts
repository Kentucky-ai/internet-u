/** Deterministic inline-SVG product art. Live sources hand us unverifiable image URLs, so every card uses this instead. */
export function placeholderImage(label: string): string {
  let h = 0;
  for (const ch of label) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  const safe = label.replace(/[<>&"]/g, "").slice(0, 34);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" rx="16" fill="hsl(${hue} 60% 92%)"/><path d="M40 140 C60 110 100 110 130 100 C160 90 170 60 200 60 C230 60 250 90 280 120 L280 140 Z" fill="hsl(${hue} 55% 45%)"/><rect x="40" y="140" width="240" height="14" rx="7" fill="hsl(${hue} 30% 25%)"/><text x="160" y="185" text-anchor="middle" font-family="system-ui" font-size="13" fill="hsl(${hue} 30% 25%)">${safe}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
