import { describe, expect, it } from "vitest";
import { decodeMediaUpload } from "../library/media-upload.server";
describe("media upload validation", () => {
  it("accepts matching image and PDF signatures", () => {
    expect(decodeMediaUpload(Buffer.from("%PDF-1.7\n").toString("base64"), "application/pdf").ext).toBe("pdf");
    expect(decodeMediaUpload(Buffer.from([137,80,78,71,13,10,26,10]).toString("base64"), "image/png").ext).toBe("png");
  });
  it("rejects forged labels, arbitrary files and oversized requests", () => {
    expect(() => decodeMediaUpload(Buffer.from("<script>alert(1)</script>").toString("base64"), "image/png")).toThrow();
    expect(() => decodeMediaUpload(Buffer.from("%PDF-1.7").toString("base64"), "image/jpeg")).toThrow();
    expect(() => decodeMediaUpload("!invalid!", "image/png")).toThrow();
    expect(() => decodeMediaUpload("A".repeat(28_000_000), "image/png")).toThrow();
  });
});