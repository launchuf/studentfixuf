import { useState, useEffect } from "react";
import { X } from "lucide-react";

const KEY = "sf_cookie_ok";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {}
  }, []);

  function accept() {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie-information"
      className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur sm:left-auto sm:right-6 sm:max-w-sm"
    >
      <p className="text-xs text-muted-foreground leading-relaxed">
        Vi använder endast nödvändiga cookies (varukorg/session). Ingen spårning.{" "}
        <a href="/integritetspolicy" className="underline hover:text-gold">Läs mer</a>
      </p>
      <button
        onClick={accept}
        aria-label="Stäng cookie-information"
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background hover:bg-gold"
      >
        OK <X className="h-3 w-3" />
      </button>
    </div>
  );
}
