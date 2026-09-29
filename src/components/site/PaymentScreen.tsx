import type { ReactNode } from "react";
import { SiteLayout } from "./SiteLayout";

export function PaymentScreen({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <SiteLayout>
      <section className="relative mx-auto flex min-h-[85vh] max-w-xl flex-col items-center justify-center px-6 pt-24 text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-violet/20 blur-[140px]" />
        <div className="animate-rise">{icon}</div>
        <h1 className="mt-6 font-display text-4xl font-extrabold md:text-5xl">{title}</h1>
        <div className="mt-4 w-full text-muted-foreground">{children}</div>
      </section>
    </SiteLayout>
  );
}
