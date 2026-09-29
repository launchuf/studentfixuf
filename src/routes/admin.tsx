import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, ExternalLink, Bell, Search } from "lucide-react";
import { AdminStoreProvider } from "@/lib/admin-store";
import { AdminGate, useSignOut } from "@/components/admin/AdminGate";
import { LogOut } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Studentfix" },
      { name: "description", content: "Internt adminverktyg för Studentfix UF." },
      { property: "og:title", content: "Admin — Studentfix" },
      { property: "og:description", content: "Internt adminverktyg för Studentfix UF." },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: () => (
    <AdminGate>
      <AdminLayout />
    </AdminGate>
  ),
});

const nav = [
  { to: "/admin", label: "Översikt", icon: LayoutDashboard, exact: true },
  { to: "/admin/produkter", label: "Produkter", icon: Package },
  { to: "/admin/bestallningar", label: "Beställningar", icon: ShoppingCart },
] as const;

function AdminLayout() {
  const signOut = useSignOut();
  return (
    <AdminStoreProvider>
      <div className="flex min-h-screen bg-background text-sm">
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
          <div className="flex items-center gap-3 px-5 py-5">
            <img src={logo} alt="" width={1024} height={1024} className="h-9 w-9 object-contain" />
            <div>
              <p className="font-display text-base font-bold leading-none">
                Student<span className="text-gold">fix</span>
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
            </div>
          </div>

          <nav className="mt-2 flex-1 space-y-1 px-3">
            <p className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Butik</p>
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: "exact" in n && n.exact }}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground border-l-2 border-gold -ml-px" }}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
            <p className="px-3 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Övrigt</p>
            {[
              { label: "Kunder", icon: Users },
              { label: "Inställningar", icon: Settings },
            ].map((n) => (
              <span key={n.label} className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 font-medium text-sidebar-foreground/40">
                <n.icon className="h-4 w-4" />
                {n.label}
                <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wider">Snart</span>
              </span>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground">
              <ExternalLink className="h-4 w-4" /> Visa butiken
            </Link>
            <button onClick={signOut} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground">
              <LogOut className="h-4 w-4" /> Logga ut
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
              <span className="text-xs">Sök produkter, ordrar…</span>
              <kbd className="ml-6 rounded border border-border px-1.5 text-[10px]">⌘K</kbd>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success md:flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> Butiken är live
              </span>
              <button className="relative rounded-lg border border-border bg-card p-2 hover:bg-secondary" aria-label="Notiser">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
              </button>
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminStoreProvider>
  );
}
