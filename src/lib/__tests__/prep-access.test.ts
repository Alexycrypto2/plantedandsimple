import { describe, expect, it } from "vitest";
import { decidePrepAccess } from "../prep-access.functions";

describe("Meal Prep access", () => {
  it("blocks visitors who did not pay", () => {
    expect(decidePrepAccess({ isAdmin: false, memberStatus: null, hasPurchase: false })).toBe(false);
  });
  it("lets paid buyers in", () => {
    expect(decidePrepAccess({ isAdmin: false, memberStatus: null, hasPurchase: true })).toBe(true);
  });
  it("lets admin-gifted members in without paying", () => {
    expect(decidePrepAccess({ isAdmin: false, memberStatus: "active", hasPurchase: false })).toBe(true);
  });
  it("blocks a buyer whose access an admin removed", () => {
    expect(decidePrepAccess({ isAdmin: false, memberStatus: "revoked", hasPurchase: true })).toBe(false);
  });
  it("always lets admins in", () => {
    expect(decidePrepAccess({ isAdmin: true, memberStatus: null, hasPurchase: false })).toBe(true);
  });
});
