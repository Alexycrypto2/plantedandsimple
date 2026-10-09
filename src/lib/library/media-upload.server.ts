const MAX_BYTES = 20 * 1024 * 1024;

/** Inspect bytes rather than trusting the caller's filename or MIME label. */
export function decodeMediaUpload(base64: string, contentType: string) {
  if (typeof base64 !== "string" || base64.length > Math.ceil(MAX_BYTES / 3) * 4 + 100) {
    throw new Error("File must be 20 MB or smaller");
  }
  const raw = base64.replace(/^data:[^;]+;base64,/, "");
  const padding = raw.endsWith("==") ? 2 : raw.endsWith("=") ? 1 : 0;
  const body = raw.slice(0, raw.length - padding);
  if (!body || raw.length % 4 !== 0 || /[^A-Za-z0-9+/]/.test(body)) {
    throw new Error("Invalid file encoding");
  }
  const bytes = Buffer.from(raw, "base64");
  if (!bytes.length || bytes.length > MAX_BYTES) throw new Error("File must be 20 MB or smaller");
  const prefix = bytes.subarray(0, 12);
  let detected: { type: string; ext: string } | undefined;
  if (prefix.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) detected = { type: "image/png", ext: "png" };
  else if (prefix[0] === 255 && prefix[1] === 216 && prefix[2] === 255) detected = { type: "image/jpeg", ext: "jpg" };
  else if (prefix.toString("ascii", 0, 4) === "RIFF" && prefix.toString("ascii", 8, 12) === "WEBP") detected = { type: "image/webp", ext: "webp" };
  else if (["GIF87a", "GIF89a"].includes(prefix.toString("ascii", 0, 6))) detected = { type: "image/gif", ext: "gif" };
  else if (prefix.toString("ascii", 0, 5) === "%PDF-") detected = { type: "application/pdf", ext: "pdf" };
  if (!detected || detected.type !== contentType) throw new Error("Upload a valid JPG, PNG, WebP, GIF or PDF file");
  return { bytes, ...detected };
}