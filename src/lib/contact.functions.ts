import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  subject: z.string().max(200).optional().default(""),
  message: z.string().min(10).max(5000),
  // honeypot field — bots fill this, humans don't
  website: z.string().max(0, "Bot detected").optional().default(""),
});

// Very simple in-memory rate limit (per Cloudflare Worker instance — good enough for a small UF site)
const recentSubmissions = new Map<string, number>();

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    if (data.website) throw new Error("Bot detected.");

    // Rate limit: 3 submissions per email per hour
    const key = data.email.toLowerCase();
    const now = Date.now();
    const last = recentSubmissions.get(key) ?? 0;
    if (now - last < 20 * 60 * 1000) {
      throw new Error("Vänta lite innan du skickar igen.");
    }
    recentSubmissions.set(key, now);
    // Clean up old entries every 100 submissions
    if (recentSubmissions.size > 100) {
      for (const [k, t] of recentSubmissions) {
        if (now - t > 3600_000) recentSubmissions.delete(k);
      }
    }

    // Store in Supabase for the team to see in admin
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("contact_messages" as any).insert({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    }).throwOnError();

    return { ok: true };
  });
