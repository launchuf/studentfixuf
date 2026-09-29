import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { PaymentScreen } from "@/components/site/PaymentScreen";
import { confirmPayment } from "@/lib/checkout.functions";

export const Route = createFileRoute("/betalning/behandlar")({
  validateSearch: z.object({
    order: z.string().optional(),
    session_id: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Betalning — Studentfix" },
      { name: "description", content: "Genomför din betalning hos Studentfix." },
      { property: "og:title", content: "Betalning — Studentfix" },
      { property: "og:description", content: "Genomför din betalning hos Studentfix." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Processing,
});

function Processing() {
  const { order, session_id } = Route.useSearch();
  const navigate = useNavigate();
  const confirm = useServerFn(confirmPayment);
  const [busy, setBusy] = useState(false);

  if (!order || !session_id) {
    navigate({ to: "/kassa" });
    return null;
  }

  return (
    <PaymentScreen
      icon={busy ? <Loader2 className="h-16 w-16 animate-spin text-gold" /> : <CreditCard className="h-16 w-16 text-gold" />}
      title={busy ? "Behandlar betalning…" : "Bekräfta betalning"}
    >
      <p>Order <span className="font-semibold text-foreground">{order}</span></p>
      <div className="mt-8">
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const result = await confirm({ data: { orderNo: order, sessionId: session_id } });
              navigate({
                to: "/betalning/lyckad",
                search: { order, session_id },
              });
              if (result.status !== "betald") {
                setBusy(false);
              }
            } catch {
              setBusy(false);
            }
          }}
          className="w-full rounded-full bg-brand-gradient py-4 font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Bekräftar…" : "Fortsätt"}
        </button>
      </div>
      <p className="mt-6 flex items-center justify-center gap-2 text-xs">
        <ShieldCheck className="h-4 w-4 text-success" /> Säker betalning
      </p>
    </PaymentScreen>
  );
}
