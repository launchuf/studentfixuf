import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Mail, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const TITLE = "Kontakt — Studentfix";
const DESC = "Hör av dig om klassrabatt, samarbeten eller frågor. Instagram och TikTok @studentfix.uf.";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Contact,
});

const socials = [
  { label: "Instagram", handle: "@studentfix.uf", href: "https://instagram.com/studentfix.uf", Icon: Instagram },
  { label: "TikTok", handle: "@studentfix.uf", href: "https://tiktok.com/@studentfix.uf", Icon: TikTokIcon },
  { label: "E-post", handle: "studentfix.uf@gmail.com", href: "mailto:studentfix.uf@gmail.com", Icon: Mail },
];

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
    </svg>
  );
}

function Contact() {
  return (
    <SiteLayout>
      <section className="relative mx-auto max-w-6xl px-6 pt-40">
        <div className="pointer-events-none absolute right-0 top-20 -z-10 h-[400px] w-[600px] rounded-full bg-electric/20 blur-[160px]" />
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-electric">Kontakt</p>
        <h1 className="mt-3 font-display text-5xl font-extrabold md:text-7xl">Säg hej.</h1>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            {socials.map((s, i) => (
              <Reveal key={s.label} delay={i * 80}>
                <a
                  href={s.href}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="group flex items-center justify-between rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-gold"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-blue text-primary-foreground">
                      <s.Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                      <p className="font-semibold">{s.handle}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-all group-hover:text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </Reveal>
            ))}
            <Reveal delay={260} className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted-foreground">
              Snabbast svar får du via Instagram DM. För klassbeställningar — skicka gärna skola, klass och ungefärligt antal
              så återkommer vi med ett upplägg inom 24 h.
            </Reveal>
          </div>

          <Reveal delay={120}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Tack! Vi hör av oss inom 24 timmar.");
                (e.currentTarget as HTMLFormElement).reset();
              }}
              className="space-y-5 rounded-[2rem] border border-border bg-card p-8"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <F id="name" label="Namn" placeholder="Ditt namn" required />
                <F id="email" label="E-post" type="email" placeholder="du@exempel.se" required />
              </div>
              <F id="subject" label="Ämne" placeholder="Klassrabatt, samarbete, fråga…" />
              <div className="space-y-1.5">
                <Label htmlFor="msg" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Meddelande
                </Label>
                <Textarea id="msg" required rows={6} placeholder="Skriv här…" className="rounded-xl border-border bg-surface" />
              </div>
              <button type="submit" className="w-full rounded-full bg-brand-gradient py-4 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] glow-violet">
                Skicka
              </button>
            </form>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}

function F({ id, label, ...rest }: React.ComponentProps<typeof Input> & { id: string; label: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Input id={id} name={id} {...rest} className="h-11 rounded-xl border-border bg-surface" />
    </div>
  );
}
