import { LogoMark } from "@/components/brand/logo";

export const metadata = { title: "Hors ligne" };

export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-8 text-center gap-4">
      <LogoMark size={64} className="rounded-[18px] shadow-soft opacity-80" />
      <h1 className="text-xl font-bold">Tu es hors ligne</h1>
      <p className="text-fg-muted max-w-xs text-balance">
        MONY a besoin d&apos;une connexion pour charger tes dernières données. Réessaie dès que tu es de retour en ligne.
      </p>
    </main>
  );
}
