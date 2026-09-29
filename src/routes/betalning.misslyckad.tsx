import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { XCircle } from "lucide-react";
import { PaymentScreen } from "@/components/site/PaymentScreen";

export const Route = createFileRoute("/betalning/misslyckad")({
  validateSearch: z.object({ order: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Betalningen misslyckades — Studentfix" },
      { name: "description", content: "Betalningen kunde inte genomföras." },
      { property: "og:title", content: "Betalningen misslyckades — Studentfix" },
      { property: "og:description", content: "Betalningen kunde inte genomföras." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Failed,
});

function Failed() {
  return (
    <PaymentScreen
      icon={<XCircle className="h-16 w-16 text-destructive" />}
      title="Betalningen misslyckades"
    >
      <p>Inga pengar har dragits. Försök igen eller kontakta oss om du behöver hjälp.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          to="/kassa"
          className="rounded-full bg-brand-gradient px-7 py-3.5 font-semibold text-primary-foreground"
        >
          Försök igen
        </Link>
        <Link
          to="/kontakt"
          className="rounded-full border border-border px-7 py-3.5 font-semibold text-foreground"
        >
          Kontakta oss
        </Link>
      </div>
    </PaymentScreen>
  );
}
