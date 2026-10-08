import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { RECIPES } from "@/prep-kit/data/recipes";

const Input = z.object({
  goal: z.string().max(60).optional(),
  servings: z.number().int().min(1).max(12).optional(),
  dislikes: z.array(z.string().max(40)).max(30).default([]),
  allergies: z.array(z.string().max(40)).max(30).default([]),
  pantry: z.array(z.string().max(60)).max(200).default([]),
  note: z.string().max(300).optional(),
  proteinTarget: z.number().int().min(0).max(400).optional(),
});

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/** AI picks recipes for the week — restricted to real cookbook recipe ids. */
export const generateAiPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const { resolveGeminiKey, GEMINI_OPENAI_URL, DEFAULT_GEMINI_TEXT_MODEL } = await import("@/lib/ai/gateway.server");
    const resolved = await resolveGeminiKey();
    if (!resolved) return { error: "AI is not available right now." };
    const key = resolved.key;

    const byCat = (c: string) => RECIPES.filter((r) => r.category === c || (c !== "snack" && c !== "breakfast" && r.category === "meal-prep"));
    const ids = (c: string) => byCat(c).map((r) => r.id);
    const catalog = RECIPES.map((r) =>
      `${r.id} | ${r.title} | ${r.category} | ${r.nutrition.protein}g protein | ${r.totalMinutes} min | proteins: ${r.proteins.join(",")} | ingredients: ${r.ingredients.slice(0, 12).join("; ")}`,
    ).join("\n");

    const daySchema = {
      type: "object",
      properties: {
        breakfast: { type: "string", enum: ids("breakfast") },
        lunch: { type: "string", enum: ids("lunch") },
        dinner: { type: "string", enum: ids("dinner") },
        snack: { type: "string", enum: ids("snack") },
      },
      required: ["breakfast", "lunch", "dinner", "snack"],
      additionalProperties: false,
    };

    const res = await fetch(`${GEMINI_OPENAI_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_GEMINI_TEXT_MODEL,
        messages: [
          { role: "system", content: "You plan a week of meals using ONLY recipes from the PlantedAndSimple high-protein plant-based cookbook catalog provided. Never invent recipes. Avoid any recipe containing the user's allergies or dislikes. Favour recipes that use the user's pantry items, reuse shared ingredients across the week to reduce waste, and repeat batch/meal-prep recipes on consecutive days. Keep a short friendly reason (max 2 sentences), with no health claims." },
          { role: "user", content: `CATALOG:\n${catalog}\n\nUSER:\nGoal: ${data.goal ?? "high-protein"}\nServings: ${data.servings ?? 2}\nDaily protein target: ${data.proteinTarget ?? "not set"}\nDislikes: ${data.dislikes.join(", ") || "none"}\nAllergies: ${data.allergies.join(", ") || "none"}\nPantry: ${data.pantry.join(", ") || "unknown"}\nNote: ${data.note ?? ""}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "set_week",
            description: "Return the week plan",
            parameters: {
              type: "object",
              properties: {
                ...Object.fromEntries(DAYS.map((d) => [d, daySchema])),
                reason: { type: "string" },
              },
              required: [...DAYS, "reason"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "set_week" } },
      }),
    });

    if (res.status === 429) return { error: "Lots of people are planning right now — try again in a minute." };
    if (res.status === 402) return { error: "AI credits have run out for this app." };
    if (!res.ok) {
      console.error("AI plan failed", res.status, await res.text());
      return { error: "Couldn't build a plan just now." };
    }
    const json = await res.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return { error: "Couldn't build a plan just now." };
    const parsed = JSON.parse(args);
    const valid = new Set(RECIPES.map((r) => r.id));
    const slots: Record<string, Record<string, string | null>> = {};
    for (const d of DAYS) {
      const day = parsed[d] ?? {};
      slots[d] = {};
      for (const s of ["breakfast", "lunch", "dinner", "snack"]) slots[d][s] = valid.has(day[s]) ? day[s] : null;
    }
    return { slots, reason: String(parsed.reason ?? "").slice(0, 400) };
  });
