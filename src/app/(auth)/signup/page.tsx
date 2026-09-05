import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Créer un compte" };

export default function SignupPage() {
  return (
    <>
      <h2 className="text-2xl font-extrabold tracking-tight">Crée ton compte</h2>
      <p className="text-fg-muted text-sm mt-1 mb-6">Gratuit. Tes données restent à toi.</p>
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </>
  );
}
