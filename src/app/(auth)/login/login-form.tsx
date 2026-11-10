"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, verifyLoginCode, type CodeState, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    sendMagicLink,
    initialState,
  );
  const linkError = useSearchParams().get("error") === "link";

  if (state.status === "sent") {
    return <CodeStep email={state.email} />;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="vos@ejemplo.com"
          required
          className="h-12 text-base"
        />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      {state.status === "idle" && linkError && (
        <p role="alert" className="text-sm text-destructive">
          El link no es válido o ya venció. Pedí uno nuevo.
        </p>
      )}

      <Button type="submit" size="xl" disabled={pending}>
        {pending ? "Enviando…" : "Enviar magic link"}
      </Button>
    </form>
  );
}

const initialCodeState: CodeState = { error: null };

/** Después de mandar el email: abrir el link o tipear el código (app instalada en iPhone). */
function CodeStep({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(verifyLoginCode, initialCodeState);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <MailCheck className="size-10 text-primary" aria-hidden />
        <p className="text-lg font-medium">Revisá tu email</p>
        <p className="text-muted-foreground">
          Te mandamos un link a <strong>{email}</strong>. Abrilo en este mismo navegador o
          ingresá el código del email.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={email} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="token">Código</Label>
          <Input
            id="token"
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={10}
            placeholder="123456"
            required
            className="h-12 text-center text-xl tracking-[0.3em] tabular-nums"
          />
        </div>
        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button type="submit" size="xl" disabled={pending}>
          {pending ? "Verificando…" : "Entrar con el código"}
        </Button>
      </form>

      <a href="/login" className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline">
        Usar otro email
      </a>
    </div>
  );
}
