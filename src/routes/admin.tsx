```tsx
import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminStoreProvider } from "@/lib/admin-store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  component: RequireAdmin,
  head: () => ({
    meta: [
      {
        title: "Admin Dashboard | Studentfix",
      },
    ],
  }),
});

function RequireAdmin() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "ok">("checking");

  const isLoginPage = location.pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setStatus("ok");
      return;
    }

    let cancelled = false;

    async function check() {
      const { data, error } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error || !data.session) {
        await navigate({ to: "/admin/login" });
        return;
      }

      setStatus("ok");
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, [navigate, isLoginPage]);

  if (isLoginPage) {
    return <Outlet />;
  }

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Laddar…
      </div>
    );
  }

  return (
    <AdminStoreProvider>
      <AdminLayout />
    </AdminStoreProvider>
  );
}

function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/admin" className="font-semibold">
            Studentfix Admin
          </Link>

          <nav
            aria-label="Admin navigation"
            className="flex items-center gap-4 text-sm"
          >
            <Link
              to="/admin"
              className="text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>

            <Link
              to="/admin/orders"
              className="text-muted-foreground hover:text-foreground"
            >
              Orders
            </Link>

            <Link
              to="/admin/users"
              className="text-muted-foreground hover:text-foreground"
            >
              Users
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
```
