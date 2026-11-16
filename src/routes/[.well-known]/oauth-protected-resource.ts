import { createFileRoute } from "@tanstack/react-router";
import { resourceMetadata, json, preflight, publicOrigin } from "@/lib/mcp-server/oauth";

export const Route = createFileRoute("/.well-known/oauth-protected-resource")({
  server: { handlers: { GET: async ({ request }) => json(resourceMetadata(publicOrigin(request))), OPTIONS: async () => preflight() } },
});
