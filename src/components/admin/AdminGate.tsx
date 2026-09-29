import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";

type State = "loading" | "signedOut" | "notAdmin" | "admin";

export function useSignOut() {
  const qc = useQueryClient();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
  };
}

export function AdminGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>("loading");

  async function evaluate() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return setState("signedOut");
    const { data: isAdmin } = await supabase.rpc("has_role", { _role: "admin" });
    setState(isAdmin ? "admin" : "notAdmin");
  }

  useEffect(() => {
    evaluate();
    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT") evaluate();
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "admin") return <>{children}</>;
  if (state === "loading")
    return (
      <Shell>
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      </Shell>
    );
  if (state === "notAdmin")
    return (
      <Shell>
        <h1 className="font-display text-2xl font-bold">Ingen behörighet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kontot är inloggat men saknar adminrollen. Kontakta den som sköter Supabase-projektet.
        </p>
        <button onClick={() => supabase.auth.signOut()} className="mt-5 w-full text-sm text-muted-foreground hover:text-foreground">
          Logga ut
        </button>
      </Shell>
    );
  return <LoginForm />;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr("Fel e-post eller lösenord.");
    setBusy(false);
  }

  return (
    <Shell>
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
        <Lock className="h-4 w-4 text-gold" />
      </div>
      <h1 className="font-display text-2xl font-bold">Logga in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Endast för Studentfix-teamet.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 text-left">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-post</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Lösenord</Label>
          <Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-brand-gradient py-2.5 font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? "Vänta…" : "Logga in"}
        </button>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        <img src={logo} alt="Studentfix" width={1024} height={1024} className="mx-auto mb-6 h-12 w-12 object-contain" />
        {children}
      </div>
    </div>
  );
}
