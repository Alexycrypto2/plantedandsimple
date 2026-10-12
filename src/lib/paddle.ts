import { resolvePaddlePrice } from "@/lib/payments.functions";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

declare global {
  interface Window {
    Paddle: any;
  }
}

export function getPaddleEnvironment(): "sandbox" | "live" {
  return clientToken?.startsWith("test_") ? "sandbox" : "live";
}

let paddleInitialized = false;

export async function initializePaddle(): Promise<void> {
  if (paddleInitialized) return;
  if (!clientToken) {
    throw new Error(
      "Payments are not configured. Complete go-live to enable checkout.",
    );
  }

  await new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (window.Paddle) {
      const paddleJsEnvironment =
        getPaddleEnvironment() === "sandbox" ? "sandbox" : "production";
      window.Paddle.Environment.set(paddleJsEnvironment);
      window.Paddle.Initialize({ token: clientToken });
      paddleInitialized = true;
      return resolve();
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => {
      const paddleJsEnvironment =
        getPaddleEnvironment() === "sandbox" ? "sandbox" : "production";
      window.Paddle.Environment.set(paddleJsEnvironment);
      window.Paddle.Initialize({ token: clientToken });
      paddleInitialized = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Paddle.js"));
    document.head.appendChild(script);
  });
}

export async function getPaddlePriceId(priceId: string): Promise<string> {
  const environment = getPaddleEnvironment();
  return resolvePaddlePrice({ data: { priceId, environment } });
}

/** Paddle event hook: on completion, go to the thank-you page with the transaction id. */
export function redirectOnPaddleComplete(event: any): void {
  if (event?.name !== "checkout.completed") return;
  const txn: string | undefined = event?.data?.transaction_id ?? event?.data?.id;
  if (!txn || typeof window === "undefined") return;
  window.location.href = `${window.location.origin}/thank-you?_ptxn=${encodeURIComponent(txn)}`;
}