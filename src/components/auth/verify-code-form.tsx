"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { resendSignupCode, verifySignupCode } from "@/actions/auth";
import { useAction } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CODE_LENGTH = 6;
const RESEND_DELAY = 60;

/** Screen shown after sign-up: the user types the 6-digit code received by email. */
export function VerifyCodeForm({ email, onBack }: { email: string; onBack: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_DELAY);

  const verify = useAction(verifySignupCode, {
    refresh: false,
    onSuccess: (d) => {
      toast.success("Bienvenue sur MONY !");
      router.replace(d.redirectTo);
      router.refresh();
    },
    onError: () => {
      setCode("");
      inputRef.current?.focus();
    },
  });
  const resend = useAction(resendSignupCode, {
    refresh: false,
    onSuccess: () => {
      toast.success("Nouveau code envoyé.");
      setCooldown(RESEND_DELAY);
      setCode("");
      inputRef.current?.focus();
    },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (value: string) => {
    if (value.length !== CODE_LENGTH || verify.pending) return;
    verify.execute({ email, code: value });
  };

  const onChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) submit(digits);
  };

  return (
    <form
      className="flex flex-col gap-5 animate-pop"
      onSubmit={(e) => {
        e.preventDefault();
        submit(code);
      }}
    >
      <div className="text-center">
        <div className="text-4xl mb-3">📬</div>
        <h2 className="font-bold text-lg">Entre ton code</h2>
        <p className="text-fg-muted text-sm mt-2">
          Nous avons envoyé un code à 6 chiffres à <b className="text-fg">{email}</b>.
        </p>
      </div>

      <label className="block">
        <span className="sr-only">Code de vérification</span>
        <div className="relative" onClick={() => inputRef.current?.focus()}>
          <div className="grid grid-cols-6 gap-2" aria-hidden>
            {Array.from({ length: CODE_LENGTH }).map((_, i) => {
              const filled = i < code.length;
              const active = i === code.length && !verify.pending;
              return (
                <div
                  key={i}
                  className={cn(
                    "h-14 rounded-2xl bg-surface-2 border flex items-center justify-center text-2xl font-extrabold tabular transition-all",
                    active ? "border-border-strong ring-4 ring-accent/25 bg-surface" : "border-transparent",
                    verify.fields.code ? "border-negative/60" : "",
                  )}
                >
                  {filled ? code[i] : ""}
                </div>
              );
            })}
          </div>
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            disabled={verify.pending}
            aria-invalid={Boolean(verify.fields.code)}
            className="absolute inset-0 w-full h-full opacity-0 text-transparent caret-transparent"
          />
        </div>
        {verify.fields.code ? (
          <span className="block text-xs text-negative mt-2 px-1 text-center">{verify.fields.code}</span>
        ) : (
          <span className="block text-xs text-fg-subtle mt-2 px-1 text-center">Le code est valable 1 heure.</span>
        )}
      </label>

      <Button type="submit" size="lg" loading={verify.pending} disabled={code.length !== CODE_LENGTH} full>
        Activer mon compte
      </Button>

      <div className="flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => resend.execute({ email })}
          disabled={cooldown > 0 || resend.pending}
          className="font-semibold text-fg underline-offset-4 hover:underline disabled:text-fg-subtle disabled:no-underline"
        >
          {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : resend.pending ? "Envoi…" : "Renvoyer le code"}
        </button>
        <button type="button" onClick={onBack} className="text-fg-muted underline-offset-4 hover:underline">
          Changer d&apos;adresse e-mail
        </button>
      </div>
    </form>
  );
}
