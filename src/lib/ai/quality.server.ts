import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { textModel, describeAiError } from "./gateway.server";

export const QUALITY_THRESHOLD = 78;

const QualitySchema = z.object({
  clarity: z.number(),
  seo: z.number(),
  originality: z.number(),
  readability: z.number(),
  verdict: z.string(),
  strengths: z.array(z.string()),
  problems: z.array(z.object({ area: z.string(), issue: z.string(), fix: z.string() })),
  rewrite_brief: z.string(),
});
export type QualityReport = z.infer<typeof QualitySchema> & { overall: number; passed: boolean };

const AI_TELLS = [
  "delve", "elevate", "unlock", "game-changer", "in the world of", "look no further",
  "when it comes to", "nestled", "embark", "tantalis", "tantaliz", "burst of flavour",
  "burst of flavor", "in today's world", "whether you're", "dive into", "testament to",
];

/** Cheap deterministic checks that never need a model. */
export function mechanicalIssues(opts: {
  html: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  primaryKeyword?: string | null;
}) {
  const text = opts.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean).length;
  const lower = text.toLowerCase();
  const issues: string[] = [];

  const tells = AI_TELLS.filter((t) => lower.includes(t));
  if (tells.length) issues.push(`AI cliches found: ${tells.join(", ")}`);
  if (words < 600) issues.push(`Article is only ${words} words — too thin to rank.`);
  if (opts.seoTitle.length > 60) issues.push("SEO title is over 60 characters.");
  if (opts.seoDescription.length > 155) issues.push("Meta description is over 155 characters.");
  const h2 = (opts.html.match(/<h2/g) ?? []).length;
  if (h2 < 4) issues.push("Fewer than 4 H2 sections — structure is too flat.");
  const imgs = (opts.html.match(/<img/g) ?? []).length;
  if (imgs > Math.max(2, Math.round(words / 450))) issues.push("Too many images for the amount of text.");
  if (opts.primaryKeyword && !lower.includes(opts.primaryKeyword.toLowerCase())) {
    issues.push(`Primary keyword "${opts.primaryKeyword}" never appears in the body.`);
  }
  const paras = opts.html.match(/<p[^>]*>(.*?)<\/p>/gs) ?? [];
  const longParas = paras.filter((p) => p.replace(/<[^>]+>/g, "").split(" ").length > 90).length;
  if (longParas > 1) issues.push(`${longParas} paragraphs are walls of text (90+ words).`);

  return { words, issues };
}

/** Full editorial score: clarity, SEO coverage, originality, readability. */
export async function scoreArticle(input: {
  title: string;
  html: string;
  seoTitle: string;
  seoDescription: string;
  primaryKeyword?: string | null;
}): Promise<QualityReport> {
  const mech = mechanicalIssues(input);
  const model = await textModel("quality");
  const body = input.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 14000);

  let out: z.infer<typeof QualitySchema>;
  try {
    const res = await generateText({
      model,
      output: Output.object({ schema: QualitySchema }),
      prompt: `You are a ruthless magazine editor reviewing a draft before publication. Score it honestly — most AI drafts deserve 60-75, not 90.

Title: ${input.title}
SEO title: ${input.seoTitle}
Meta: ${input.seoDescription}
${input.primaryKeyword ? `Primary keyword: ${input.primaryKeyword}` : ""}
Automatic checks already found: ${mech.issues.length ? mech.issues.join(" | ") : "none"}
Word count: ${mech.words}

Draft:
"""${body}"""

Score 0-100 for: clarity (is every sentence useful and easy to follow), seo (keyword coverage, headings, meta, intent match), originality (does it say anything a generic AI post would not), readability (rhythm, paragraph length, scannability).
problems: the concrete faults, each with the exact fix. rewrite_brief: instructions a writer could follow to fix the draft in one pass. Return JSON only.`,
    });
    out = res.output;
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) {
      const fallback = Math.max(40, 90 - mech.issues.length * 8);
      return {
        clarity: fallback, seo: fallback, originality: fallback, readability: fallback,
        verdict: "Automatic checks only — the reviewer model did not respond.",
        strengths: [], problems: mech.issues.map((i) => ({ area: "auto", issue: i, fix: "Address and regenerate." })),
        rewrite_brief: mech.issues.join(" "), overall: fallback, passed: fallback >= QUALITY_THRESHOLD,
      };
    }
    throw err;
  }

  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const penalty = Math.min(20, mech.issues.length * 4);
  const overall = clamp(
    (clamp(out.clarity) * 0.3 + clamp(out.seo) * 0.25 + clamp(out.originality) * 0.25 + clamp(out.readability) * 0.2) - penalty,
  );
  return {
    ...out,
    clarity: clamp(out.clarity),
    seo: clamp(out.seo),
    originality: clamp(out.originality),
    readability: clamp(out.readability),
    problems: [
      ...mech.issues.map((i) => ({ area: "checklist", issue: i, fix: "Fix before publishing." })),
      ...out.problems,
    ],
    overall,
    passed: overall >= QUALITY_THRESHOLD,
  };
}
