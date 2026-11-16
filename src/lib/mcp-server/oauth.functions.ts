import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  client_id: z.string().min(10).max(8000),
  redirect_uri: z.string().url().max(500),
  code_challenge: z.string().min(43).max(128),
  code_challenge_method: z.literal("S256"),
  state: z.string().max(1000).optional(),
  approve: z.boolean(),
});

/** Signed-in boss approves (or denies) a Claude connection; returns where to send the browser. */
export const approveMcpClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { verify, sign } = await import("./oauth");
    const client = await verify("client", data.client_id);
    if (!client || !Array.isArray(client.r) || !client.r.includes(data.redirect_uri)) throw new Error("This connection request is not valid. Start again from Claude.");
    const url = new URL(data.redirect_uri);
    if (data.state) url.searchParams.set("state", data.state);
    if (!data.approve) { url.searchParams.set("error", "access_denied"); return { redirect: url.toString() }; }
    const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r: any) => r.role === "boss")) throw new Error("Only the site owner can connect Claude.");
    url.searchParams.set("code", await sign("code", { sub: context.userId, c: data.client_id, r: data.redirect_uri, ch: data.code_challenge }, 300));
    return { redirect: url.toString() };
  });

export const describeMcpClient = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ client_id: z.string().max(8000) }).parse(d))
  .handler(async ({ data }) => {
    const { verify } = await import("./oauth");
    const c = await verify("client", data.client_id);
    return c ? { name: String(c.n ?? "MCP client") } : null;
  });
