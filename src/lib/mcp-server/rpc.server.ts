/** Minimal stateless MCP (Streamable HTTP, JSON responses) over JSON-RPC 2.0. */
import { zodToJsonSchema } from "./schema";
import { TOOLS as POST_TOOLS } from "./tools.server";
import { RECIPE_TOOLS } from "./recipe-tools.server";

const TOOLS = [...POST_TOOLS, ...RECIPE_TOOLS] as const;

const PROTOCOL = "2025-06-18";

export async function handleRpc(msg: any): Promise<any | null> {
  const id = msg?.id ?? null;
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id, result });
  const fail = (code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return fail(-32600, "Invalid request");
  if (msg.id === undefined) return null; // notification
  switch (msg.method) {
    case "initialize":
      return ok({ protocolVersion: msg.params?.protocolVersion ?? PROTOCOL, capabilities: { tools: {} }, serverInfo: { name: "planted-protein-pages", title: "Planted Protein Pages", version: "1.0.0" },
        instructions: "Content tools for PlantedAndSimple. To fix SEO checklists: call get_seo_score (posts) or get_recipe_seo_score (recipes), then edit with update_post / update_recipe and re-check. Every update saves a rollback version first; generated posts always go to AI Studio for human review." });
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: zodToJsonSchema(t.inputSchema), annotations: { readOnlyHint: t.readOnly, destructiveHint: false } })) });
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === msg.params?.name);
      if (!tool) return fail(-32602, `Unknown tool: ${msg.params?.name}`);
      const parsed = (tool.inputSchema as any).safeParse(msg.params?.arguments ?? {});
      if (!parsed.success) return ok({ isError: true, content: [{ type: "text", text: parsed.error.issues.map((i: any) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ") }] });
      try {
        const out = await (tool.run as any)(parsed.data);
        return ok({ content: [{ type: "text", text: JSON.stringify(out, null, 2) }], structuredContent: out });
      } catch (e) {
        return ok({ isError: true, content: [{ type: "text", text: e instanceof Error ? e.message : "Tool failed" }] });
      }
    }
    default:
      return fail(-32601, `Method not found: ${msg.method}`);
  }
}
