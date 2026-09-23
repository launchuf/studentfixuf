import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Kräver inloggning OCH adminrollen i user_roles. Använd på alla admin-CRUD-serverfunktioner. */
export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("role", "admin");
    if ((count ?? 0) === 0) throw new Error("Unauthorized: Admin role required");
    return next({ context });
  });
