import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
export const DEFAULT_CHAT_MODEL = "openai/gpt-5.6-sol";
export const DEFAULT_IMAGE_MODEL = "google/gemini-3.1-flash-image";

export function requireApiKey(): string {
  const k = process.env.LOVABLE_API_KEY;
  if (!k) throw new Error("LOVABLE_API_KEY is not set");
  return k;
}

export function createGateway(opts?: { structuredOutputs?: boolean }) {
  const key = requireApiKey();
  return createOpenAICompatible({
    name: "lovable",
    baseURL: AI_GATEWAY_URL,
    supportsStructuredOutputs: opts?.structuredOutputs ?? true,
    headers: {
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

/** Raw gateway image call — Gemini image via chat completions with image modality. */
export async function generateImageBase64(prompt: string, model = DEFAULT_IMAGE_MODEL): Promise<{ base64: string; mime: string }> {
  const key = requireApiKey();
  const res = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "primedownloads",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Image gateway ${res.status}: ${text.slice(0, 400)}`);
  }
  const data: any = await res.json();
  const msg = data?.choices?.[0]?.message;
  const images: any[] = msg?.images ?? [];
  const first = images[0];
  const url: string | undefined = first?.image_url?.url ?? first?.url;
  if (!url || !url.startsWith("data:")) {
    throw new Error("Image gateway returned no image data");
  }
  const match = /^data:([^;]+);base64,(.+)$/.exec(url);
  if (!match) throw new Error("Unexpected image data URL");
  return { mime: match[1], base64: match[2] };
}