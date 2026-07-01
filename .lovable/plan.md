## What's happening

The Stripe activation form is showing US-only fields (SSN, US state, US ZIP) because **"United States" is selected** in the Home address dropdown. You're in Nigeria (Oyo), and Stripe **does not currently support payouts to Nigerian bank accounts** for standard accounts. That's why nothing you type will work — it's not your fault, it's a country restriction.

You have 3 realistic paths. Pick one and I'll wire it up.

---

### Option A — Use Paddle instead of Stripe (recommended for Nigeria)
Paddle is Lovable's other built-in payment provider and **acts as the Merchant of Record**. It supports sellers in Nigeria and many other countries Stripe doesn't. Paddle handles tax, fraud, and pays you out to a Nigerian bank or Wise account.

**What I'd do:**
1. You disconnect Stripe from the Payments dashboard (3-dot menu → Disconnect).
2. I enable Paddle, recreate the $9.99 cookbook product, and rewire checkout + the gated `/thank-you` download flow to use Paddle instead of Stripe.
3. Everything else (PDF gating, email capture, download cap) stays exactly as it is.

Trade-off: your existing Stripe test product is thrown away — but you have no live sales yet, so nothing is lost.

---

### Option B — Keep Stripe, register a company in a supported country
Only viable if you actually have (or will open) a registered business + bank account in the US, UK, EU, Canada, or another Stripe-supported country. This is what services like **Payoneer / Mercury / Wise Business / Stripe Atlas** are for. Slow, costs money, and I can't do it for you — it's a real-world legal step.

---

### Option C — Stay in test mode for now
Keep the sandbox as-is. Real customers can't pay yet, but the whole site works with test card `4242 4242 4242 4242`. Good if you want to finish the product, drive traffic, and decide on payments later.

---

## My recommendation

**Go with Option A (Paddle).** It's the only path that lets you take real money from your location today without opening a foreign company. Reply "Paddle" and I'll switch it over in one go.
