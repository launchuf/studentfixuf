import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/integritetspolicy")({
  head: () => ({
    meta: [
      { title: "Integritetspolicy — Studentfix" },
      { name: "description", content: "Hur Studentfix UF hanterar dina personuppgifter." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-6 pb-32 pt-40">
        <h1 className="font-display text-4xl font-extrabold md:text-5xl">Integritetspolicy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Senast uppdaterad: juni 2026</p>

        <Prose>
          <h2>1. Vem är personuppgiftsansvarig?</h2>
          <p>Studentfix UF, org.nr. [UF-nummer], Helsingborg. E-post: studentfix.uf@gmail.com</p>

          <h2>2. Vilka uppgifter samlar vi in?</h2>
          <p>Vid köp: namn, e-postadress, telefonnummer, leveransadress och skola. Vi sparar även ordernummer och betalningsstatus. Inga kortuppgifter lagras av oss — betalningar hanteras av Stripe.</p>

          <h2>3. Varför behandlar vi uppgifterna?</h2>
          <ul>
            <li>Fullgörande av köpeavtal (leverans, orderbekräftelse)</li>
            <li>Kundservice och reklamationshantering</li>
            <li>Lagkrav (bokföringslagen — 7 år)</li>
          </ul>

          <h2>4. Rättslig grund</h2>
          <p>Behandlingen grundas på avtal (köpeavtalet), berättigat intresse (kundservice) och rättslig förpliktelse (bokföring).</p>

          <h2>5. Hur länge sparar vi uppgifterna?</h2>
          <p>Orderuppgifter sparas i 7 år i enlighet med bokföringslagen. Kontaktformulärmeddelanden raderas senast 12 månader efter ärendets avslut.</p>

          <h2>6. Dina rättigheter</h2>
          <p>Du har rätt till tillgång, rättelse, radering ("rätten att bli bortglömd"), begränsning och dataportabilitet. Kontakta oss på studentfix.uf@gmail.com.</p>

          <h2>7. Cookies</h2>
          <p>Vi använder en sessionscookie för varukorgen. Inga spårningscookies eller reklam-cookies används. Du kan när som helst rensa cookies i din webbläsare.</p>

          <h2>8. Klagomål</h2>
          <p>Du har rätt att lämna klagomål till Integritetsskyddsmyndigheten (imy.se).</p>
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
