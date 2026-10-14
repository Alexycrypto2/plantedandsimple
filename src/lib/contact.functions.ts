import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(5000),
});

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const sendContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }) => {
    const { brevoSendEmail } = await import("./brevo.server");
    const ok = await brevoSendEmail({
      to: "support@plantedandsimple.com",
      subject: `Contact form: ${data.name.slice(0, 60)}`,
      html: `<p><strong>From:</strong> ${esc(data.name)} &lt;${esc(data.email)}&gt;</p><p style="white-space:pre-wrap">${esc(data.message)}</p>`,
      text: `From: ${data.name} <${data.email}>\n\n${data.message}`,
      tags: ["contact"],
    });
    if (!ok) throw new Error("We couldn't send your message. Please email support@plantedandsimple.com.");
    return { ok: true };
  });
