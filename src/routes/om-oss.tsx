import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import hero from "@/assets/hero.jpg";

const TITLE = "Om oss — Studentfix";
const DESC = "Fyra gymnasieelever från Helsingborg som gör studenten rätt. Läs om teamet, vår historia och vanliga frågor.";

export const Route = createFileRoute("/om-oss")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: About,
});

const team = [
  { name: "Zilan", role: "VD", color: "from-violet to-electric", initials: "Z" },
  { name: "Musti", role: "Ekonomichef", color: "from-electric to-gold", initials: "M" },
  { name: "Yazan", role: "Försäljningschef", color: "from-gold to-violet", initials: "Y" },
  { name: "Elton", role: "Marknadschef", color: "from-violet to-gold", initials: "E" },
];

const faq: [string, string][] = [
  ["Hur lång är leveranstiden?", "Lagervaror skickas inom 1–2 arbetsdagar. Personliga studentband tar 5–7 arbetsdagar eftersom de broderas på beställning. Klassbeställningar levereras samlat till skolan på överenskommet datum."],
  ["Vilka betalsätt tar ni?", "Swish och kort. För klassbeställningar kan vi också fakturera klasskassan."],
  ["Kan jag returnera?", "Ja, 14 dagars öppet köp på oanvända varor i originalskick. Personligt broderade band kan tyvärr inte returneras."],
  ["Hur fungerar klassrabatten?", "Samla ihop beställningen för klassen och kontakta oss. 10+ personer ger 10 %, 20+ ger 15 % och 30+ ger 20 % plus ett gratis band per person."],
  ["Tål sprayen tvätt?", "Ja. Våra textilsprayer är gjorda för tyg och tål maskintvätt i 30° efter 24 timmars torkning."],
];

function About() {
  return (
    <SiteLayout>
      <section className="relative mx-auto max-w-6xl px-6 pt-40">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-electric">Om oss</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl font-extrabold leading-[0.95] md:text-7xl">
          Fyra studenter. <span className="text-gradient">En standard.</span>
        </h1>
        <div className="mt-14 grid items-center gap-12 md:grid-cols-2">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] gradient-border">
              <img src={hero} alt="Teamet bakom Studentfix" width={1600} height={1008} loading="lazy" className="aspect-[4/5] w-full object-cover" />
            </div>
          </Reveal>
          <Reveal delay={120} className="space-y-5 text-lg text-muted-foreground">
            <p>
              Studentfix startade 2027 i Helsingborg när vi själva insåg hur svårt det var att hitta studentgrejer som
              faktiskt kändes bra. Overallerna var tunna, sprayen flagnade och allt såg ut som det var gjort för mellanstadiet.
            </p>
            <p>
              Så vi gjorde det själva. Premium material, färger som håller, mallar du kan använda om och om igen — och ett
              varumärke som ser ut som något du faktiskt vill bära.
            </p>
            <p className="font-display text-2xl font-bold text-foreground">Studenten ska göras rätt.</p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-32">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Teamet</p>
          <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Vilka vi är</h2>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m, i) => (
            <Reveal key={m.name} delay={i * 90}>
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-violet/60 hover:shadow-card">
                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${m.color} font-display text-3xl font-extrabold text-primary-foreground transition-transform group-hover:rotate-6`}>
                  {m.initials}
                </div>
                <h3 className="mt-6 font-display text-2xl font-bold">{m.name}</h3>
                <p className="text-sm uppercase tracking-wider text-muted-foreground">{m.role}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pt-32">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-electric">FAQ</p>
          <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Vanliga frågor</h2>
        </Reveal>
        <Reveal delay={100}>
          <Accordion type="single" collapsible className="mt-10">
            {faq.map(([q, a]) => (
              <AccordionItem key={q} value={q} className="border-border">
                <AccordionTrigger className="py-5 text-left font-display text-lg font-semibold hover:text-gold hover:no-underline">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </section>
    </SiteLayout>
  );
}
