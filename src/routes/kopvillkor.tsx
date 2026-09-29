import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/kopvillkor")({
  head: () => ({
    meta: [
      { title: "Köpvillkor — Studentfix" },
      { name: "description", content: "Köpvillkor för Studentfix UF." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-6 pb-32 pt-40">
        <h1 className="font-display text-4xl font-extrabold md:text-5xl">Köpvillkor</h1>
        <p className="mt-2 text-sm text-muted-foreground">Senast uppdaterade: juni 2026</p>

        <Prose>
          <h2>1. Allmänt</h2>
          <p>Dessa köpvillkor gäller för köp från Studentfix UF ("vi", "oss") via studentfixuf.se. Genom att lägga en order godkänner du villkoren.</p>

          <h2>2. Priser och betalning</h2>
          <p>Alla priser är angivna i svenska kronor (SEK) inklusive moms. Vi accepterar kortbetalning via Stripe och Swish. Betalning sker vid köptillfället.</p>

          <h2>3. Leverans</h2>
          <p>Lagervaror skickas inom 1–2 arbetsdagar. Personliga flaggor tar 5–7 arbetsdagar. Klassbeställningar levereras samlat på överenskommet datum. Fri frakt vid ordervärde över 800 kr, annars 59 kr.</p>

          <h2>4. Ångerrätt och retur</h2>
          <p>Du har 14 dagars ångerrätt enligt distansavtalslagen. Varan ska returneras i oanvänt originalskick. Personligt broderade flaggor är undantagna ångerrätten (specialbeställd vara). Returfrakten bekostas av kunden om inte varan är felaktig.</p>

          <h2>5. Reklamation</h2>
          <p>Felaktig eller skadad vara reklameras till studentfix.uf@gmail.com med foto och ordernummer. Vi följer Konsumentköplagen och erbjuder i första hand omleverans eller reparation.</p>

          <h2>6. Klassrabatt</h2>
          <p>Klassrabatt gäller vid samlad beställning på 25+ enheter. Rabatten är 10 kr per styck på antalet som överstiger 25. Exempelberäkning: beställer ni 30 overaller ger de 5 extra (30-25) en rabatt på 5 × 10 = 50 kr. Rabatten beräknas på ordersumman exkl. frakt.</p>

          <h2>7. Tvist</h2>
          <p>Tvist avgörs i första hand genom dialog. I andra hand kan du vända dig till Allmänna reklamationsnämnden (arn.se) eller EU:s tvistlösningsplattform (ec.europa.eu/consumers/odr).</p>

          <h2>8. Kontakt</h2>
          <p>Studentfix UF · Helsingborg · studentfix.uf@gmail.com</p>
        </Prose>
      </section>
    </SiteLayout>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="prose prose-invert mt-10 max-w-none prose-headings:font-display prose-headings:text-foreground prose-h2:mt-8 prose-h2:text-2xl prose-h2:font-bold prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-gold">
      {children}
    </div>
  );
}
