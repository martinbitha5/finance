"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { signIn, signUp } from "@/actions/auth";
import { useAction } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", display_name: "" });

  const login = useAction(signIn, {
    refresh: false,
    onSuccess: () => {
      router.replace(params.get("next") || "/");
      router.refresh();
    },
  });
  const register = useAction(signUp, {
    refresh: false,
    onSuccess: (d) => {
      if (d.needsConfirmation) setSent(true);
      else {
        toast.success("Bienvenue sur MONY !");
        router.replace("/onboarding");
        router.refresh();
      }
    },
  });
  const pending = login.pending || register.pending;
  const fields = mode === "login" ? login.fields : register.fields;

  if (sent) {
    return (
      <div className="card p-6 text-center animate-pop">
        <div className="text-4xl mb-3">📬</div>
        <h2 className="font-bold text-lg">Vérifie ta boîte mail</h2>
        <p className="text-fg-muted text-sm mt-2">
          Nous t&apos;avons envoyé un lien de confirmation à <b>{form.email}</b>. Clique dessus pour activer ton compte.
        </p>
        <Button href="/login" variant="secondary" className="mt-5" full>
          Retour à la connexion
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (mode === "login") login.execute({ email: form.email, password: form.password });
        else register.execute(form);
      }}
    >
      {mode === "signup" ? (
        <Field label="Prénom" error={fields.display_name}>
          <Input
            autoComplete="given-name"
            placeholder="Ex : Martin"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          />
        </Field>
      ) : null}
      <Field label="Email" error={fields.email}>
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="toi@exemple.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </Field>
      <Field label="Mot de passe" error={fields.password} hint={mode === "signup" ? "6 caractères minimum" : undefined}>
        <Input
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={6}
        />
      </Field>
      <Button type="submit" size="lg" loading={pending} full className="mt-2">
        {mode === "login" ? "Se connecter" : "Créer mon compte"}
      </Button>
      <p className="text-center text-sm text-fg-muted">
        {mode === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <Link href="/signup" className="font-semibold text-fg underline-offset-4 hover:underline">
              Créer un compte
            </Link>
          </>
        ) : (
          <>
            Déjà un compte ?{" "}
            <Link href="/login" className="font-semibold text-fg underline-offset-4 hover:underline">
              Se connecter
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
