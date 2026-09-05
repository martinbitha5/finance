import Link from "next/link";

/** Shared shell for the legal pages: title, last-updated date, prose-styled sections. */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 lg:py-20">
      <p className="text-sm font-bold uppercase tracking-wider text-accent">Légal</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-fg-subtle">Dernière mise à jour : {updated}</p>
      <div className="mt-5 rounded-2xl border border-border bg-surface-2/60 p-5 text-[15px] leading-relaxed text-fg-muted">
        {intro}
      </div>
      <div className="mt-10 space-y-10">{children}</div>
      <div className="mt-14 border-t border-border pt-6 text-sm text-fg-muted">
        Voir aussi :{" "}
        <Link href="/conditions" className="font-semibold text-fg underline-offset-4 hover:underline">
          Conditions d&apos;utilisation
        </Link>{" "}
        ·{" "}
        <Link href="/confidentialite" className="font-semibold text-fg underline-offset-4 hover:underline">
          Politique de confidentialité
        </Link>
      </div>
    </article>
  );
}

export function LegalSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-extrabold tracking-tight">
        <span className="text-fg-subtle">{number}.</span> {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-fg-muted [&_strong]:font-semibold [&_strong]:text-fg [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
