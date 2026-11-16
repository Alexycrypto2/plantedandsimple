import { createFileRoute } from "@tanstack/react-router";
import { serverMetadata, json, preflight, publicOrigin } from "@/lib/mcp-server/oauth";

export const Route = createFileRoute("/.well-known/openid-configuration")({
  server: { handlers: { GET: async ({ request }) => json(serverMetadata(publicOrigin(request))), OPTIONS: async () => preflight() } },
});
