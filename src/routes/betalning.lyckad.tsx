import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, Clock } from "lucide-react";
import { PaymentScreen } from "@/components/site/PaymentScreen";
import { confirmPayment } from "@/lib/checkout.functions";
import { useCart } from "@/lib/cart";
import { formatSEK } from "@/lib/products";

export const Route = createFileRoute("/betalning/lyckad")({
  validateSearch: z.object({ order: z.string().optional(), session_id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Tack för ditt köp — Studentfix" },
      { name: "description", content: "Din betalning hos Studentfix är genomförd." },
      { property: "og:title", content: "Tack för ditt köp — Studentfix" },
      { property: "og:description", content: "Din betalning hos Studentfix är genomförd." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Success,
});

type Res = Awaited<ReturnType<typeof confirmPayment>>;

function Success() {
  const { order, session_id } = Route.useSearch();
  const confirm = useServerFn(confirmPayment);
  const { clear } = useCart();
  const [res, setRes] = useState<Res | null>(null);

  useEffect(() => {
    if (!order || !session_id) return;
    confirm({ data: { orderNo: order, sessionId: session_id } }).then((r) => {
      setRes(r);
      if (r.status === "betald") clear();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  if (!order || !session_id) {
    return (
      <PaymentScreen
        icon={<Clock className="h-16 w-16 text-gold" />}
        title="Ogiltig betalningslänk"
      >
        <p>Betalningen kunde inte verifieras. Gå tillbaka till kassan och försök igen.</p>
        <Link
          to="/kassa"
          className="mt-8 inline-block rounded-full border border-border px-7 py-3.5 font-semibold text-foreground"
        >
          Till kassan
        </Link>
      </PaymentScreen>
    );
  }

  if (!res) return <PaymentScreen icon={<Loader2 className="h-16 w-16 animate-spin text-gold" />} title="Bekräftar…"><p>Ett ögonblick.</p></PaymentScreen>;

  if (res.status !== "betald")
    return (
      <PaymentScreen icon={<Clock className="h-16 w-16 text-gold" />} title="Betalningen behandlas">
        <p>Vi har inte fått bekräftelse ännu. Du får ett mejl så snart den är klar.</p>
        <Link to="/" className="mt-8 inline-block rounded-full border border-border px-7 py-3.5 font-semibold text-foreground">Till startsidan</Link>
      </PaymentScreen>
    );

  return (
    <PaymentScreen icon={<CheckCircle2 className="h-16 w-16 text-gold" />} title="Tack för ditt köp!">
      <p>Betalningen gick igenom{res.order ? `, ${res.order.name.split(" ")[0]}` : ""}.</p>
      {res.order && (
        <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-border bg-card p-5 text-left text-sm">
          <div className="flex justify-between"><span>Ordernummer</span><span className="font-semibold text-foreground">{res.order.orderNo}</span></div>
          <div className="mt-2 flex justify-between"><span>Totalt</span><span className="font-semibold text-foreground">{formatSEK(res.order.total)}</span></div>
          <div className="mt-2 flex justify-between"><span>Bekräftelse till</span><span className="text-foreground">{res.order.email}</span></div>
        </div>
      )}
      <Link to="/shop" className="mt-8 inline-block rounded-full bg-brand-gradient px-7 py-3.5 font-semibold text-primary-foreground">Fortsätt shoppa</Link>
    </PaymentScreen>
  );
}
