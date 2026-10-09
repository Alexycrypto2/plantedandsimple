import { describe, expect, it } from "vitest";
import { csvCell } from "../csv";
describe("spreadsheet-safe CSV", () => {
  it("neutralizes formulas including whitespace prefixes", () => {
    for (const value of ["=1+1", "+cmd", "-cmd", "@SUM(A1)", " \t=1+1", "\tplain"]) {
      expect(csvCell(value).startsWith('"\'')).toBe(true);
    }
  });
  it("preserves normal values and escapes quotes", () => {
    expect(csvCell('buyer@example.com')).toBe('"buyer@example.com"');
    expect(csvCell('a"b')).toBe('"a""b"');
  });
});