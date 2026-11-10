// Scales the leading quantity of an ingredient line ("1 1/2 cups oats" x2 -> "3 cups oats").
const UNICODE: Record<string, number> = { "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };

function parseNum(s: string): number | null {
  s = s.trim();
  let total = 0;
  for (const ch of Object.keys(UNICODE)) if (s.includes(ch)) { total += UNICODE[ch]; s = s.replace(ch, "").trim(); }
  if (!s) return total || null;
  const parts = s.split(/\s+/);
  for (const p of parts) {
    if (/^\d+\/\d+$/.test(p)) { const [a, b] = p.split("/").map(Number); if (!b) return null; total += a / b; }
    else if (/^\d+(\.\d+)?$/.test(p)) total += Number(p);
    else return null;
  }
  return total;
}

const FRACS: [number, string][] = [[0, ""], [0.125, "1/8"], [0.25, "1/4"], [1 / 3, "1/3"], [0.5, "1/2"], [2 / 3, "2/3"], [0.75, "3/4"], [1, ""]];

export function formatQty(n: number): string {
  if (n <= 0) return "0";
  let whole = Math.floor(n);
  const frac = n - whole;
  let best = FRACS[0];
  for (const f of FRACS) if (Math.abs(f[0] - frac) < Math.abs(best[0] - frac)) best = f;
  if (best[0] === 1) { whole += 1; best = FRACS[0]; }
  if (Math.abs(best[0] - frac) > 0.07 && n < 10) return String(Math.round(n * 10) / 10);
  if (!whole) return best[1] || "0";
  return best[1] ? `${whole} ${best[1]}` : String(whole);
}

const QTY = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?\s*[¼½¾⅓⅔⅛]?|[¼½¾⅓⅔⅛])(\s*(?:-|–|to)\s*(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[¼½¾⅓⅔⅛]))?/;

export function scaleLine(line: string, factor: number): string {
  if (factor === 1) return line;
  const m = line.match(QTY);
  if (!m) return line;
  const a = parseNum(m[1]);
  if (a == null) return line;
  let out = formatQty(a * factor);
  if (m[3]) { const b = parseNum(m[3]); if (b == null) return line; out += `–${formatQty(b * factor)}`; }
  const rest = line.slice(m[0].length);
  return out + (rest.startsWith(" ") || !rest ? "" : " ") + rest;
}

export function baseServings(s: string | null | undefined): number | null {
  const m = String(s ?? "").match(/\d+/);
  const n = m ? Number(m[0]) : NaN;
  return n > 0 && n < 100 ? n : null;
}
