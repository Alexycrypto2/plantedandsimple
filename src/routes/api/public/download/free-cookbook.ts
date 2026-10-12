import { createFileRoute } from "@tanstack/react-router";
import freeCookbookAsset from "@/assets/free-cookbook.pdf.asset.json";

// Public free lead magnet: streams the uploaded PDF as an attachment so
// phones save the file instead of opening a viewer.
export const Route = createFileRoute("/api/public/download/free-cookbook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const assetUrl = `${u.protocol}//${u.host}${freeCookbookAsset.url}`;
        const res = await fetch(assetUrl);
        if (!res.ok || !res.body) {
          // Never a dead download: fall back to opening the file directly.
          return Response.redirect(assetUrl, 302);
        }
        return new Response(res.body, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition":
              'attachment; filename="20-Minute-Plant-Protein-Kitchen-Free-Cookbook.pdf"',
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
