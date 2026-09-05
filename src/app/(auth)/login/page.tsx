import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <>
      <h2 className="text-2xl font-extrabold tracking-tight">Bon retour 👋</h2>
      <p className="text-fg-muted text-sm mt-1 mb-6">Connecte-toi pour retrouver tes finances.</p>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </>
  );
}
